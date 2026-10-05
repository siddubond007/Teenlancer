package com.skilllaunch.app.core.session

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.io.IOException
import java.security.GeneralSecurityException
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

private val Context.skillLaunchDataStore by preferencesDataStore(
    name = "skilllaunch_session"
)

private val Context.skillLaunchSecureDataStore by preferencesDataStore(
    name = "skilllaunch_secure_session"
)

class SessionStore(
    private val context: Context
) {
    private companion object {
        const val KEYSTORE_PROVIDER = "AndroidKeyStore"
        const val KEY_ALIAS = "skilllaunch_access_token"
        const val TRANSFORM = "AES/GCM/NoPadding"
        const val ENCRYPTED_PREFIX = "v1:"
        const val GCM_TAG_LENGTH_BITS = 128

        val ACCESS_TOKEN: Preferences.Key<String> =
            stringPreferencesKey("access_token")
    }

    val accessToken: Flow<String?> =
        context.skillLaunchSecureDataStore.data
            .catch { exception ->
                if (exception is IOException) {
                    emit(emptyPreferences())
                } else {
                    throw exception
                }
            }
            .map { preferences ->
                preferences[ACCESS_TOKEN]?.let { storedValue ->
                    decryptStoredToken(storedValue)
                }
            }

    suspend fun getAccessToken(): String? {
        val secureToken = accessToken.first()
        if (secureToken != null) {
            return secureToken
        }

        // Migrate tokens created by the older plaintext DataStore implementation.
        val legacyToken = context.skillLaunchDataStore.data
            .catch { exception ->
                if (exception is IOException) {
                    emit(emptyPreferences())
                } else {
                    throw exception
                }
            }
            .map { preferences -> preferences[ACCESS_TOKEN] }
            .first()

        if (legacyToken.isNullOrBlank()) {
            return null
        }

        saveAccessToken(legacyToken)
        context.skillLaunchDataStore.edit { preferences ->
            preferences.remove(ACCESS_TOKEN)
        }
        return legacyToken
    }

    suspend fun saveAccessToken(token: String) {
        require(token.isNotBlank()) { "Access token cannot be blank" }

        context.skillLaunchSecureDataStore.edit { preferences ->
            preferences[ACCESS_TOKEN] = encryptToken(token)
        }
    }

    suspend fun clearSession() {
        context.skillLaunchSecureDataStore.edit { preferences ->
            preferences.remove(ACCESS_TOKEN)
        }
    }

    suspend fun getOnboardingStep(
        userId: String,
        maxStep: Int
    ): Int {
        if (userId.isBlank()) return 1

        val key = stringPreferencesKey("onboarding_step_${userId.trim()}")
        return context.skillLaunchDataStore.data
            .map { preferences -> preferences[key] }
            .first()
            ?.toIntOrNull()
            ?.coerceIn(1, maxStep)
            ?: 1
    }

    suspend fun saveOnboardingStep(
        userId: String,
        step: Int
    ) {
        if (userId.isBlank()) return

        val key = stringPreferencesKey("onboarding_step_${userId.trim()}")
        context.skillLaunchDataStore.edit { preferences ->
            preferences[key] = step.coerceAtLeast(1).toString()
        }
    }

    suspend fun clearOnboardingStep(userId: String) {
        if (userId.isBlank()) return

        val key = stringPreferencesKey("onboarding_step_${userId.trim()}")
        context.skillLaunchDataStore.edit { preferences ->
            preferences.remove(key)
        }
    }

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply {
            load(null)
        }

        (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }

        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            KEYSTORE_PROVIDER
        )

        keyGenerator.init(
            KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .build()
        )

        return keyGenerator.generateKey()
    }

    private fun encryptToken(token: String): String {
        return try {
            val cipher = Cipher.getInstance(TRANSFORM)
            cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())

            val iv = cipher.iv
            val ciphertext = cipher.doFinal(token.toByteArray(Charsets.UTF_8))
            val payload = ByteArray(1 + iv.size + ciphertext.size)

            payload[0] = 1
            System.arraycopy(iv, 0, payload, 1, iv.size)
            System.arraycopy(ciphertext, 0, payload, 1 + iv.size, ciphertext.size)

            ENCRYPTED_PREFIX + Base64.encodeToString(payload, Base64.NO_WRAP)
        } catch (error: GeneralSecurityException) {
            throw IllegalStateException("Unable to secure the access token", error)
        }
    }

    private fun decryptStoredToken(storedValue: String): String? {
        if (!storedValue.startsWith(ENCRYPTED_PREFIX)) {
            return null
        }

        return try {
            val payload = Base64.decode(
                storedValue.removePrefix(ENCRYPTED_PREFIX),
                Base64.NO_WRAP
            )

            if (payload.size <= 1) {
                return null
            }

            val ivLength = 12
            if (payload.size <= 1 + ivLength) {
                return null
            }

            val iv = payload.copyOfRange(1, 1 + ivLength)
            val ciphertext = payload.copyOfRange(1 + ivLength, payload.size)

            val cipher = Cipher.getInstance(TRANSFORM)
            cipher.init(
                Cipher.DECRYPT_MODE,
                getOrCreateKey(),
                GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv)
            )

            String(cipher.doFinal(ciphertext), Charsets.UTF_8)
        } catch (_: GeneralSecurityException) {
            null
        } catch (_: IllegalArgumentException) {
            null
        }
    }
}
