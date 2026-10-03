package com.skilllaunch.app.core.session

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.first
import java.io.IOException

private val Context.skillLaunchDataStore by preferencesDataStore(
    name = "skilllaunch_session"
)

class SessionStore(
    private val context: Context
) {
    private companion object {
        val ACCESS_TOKEN: Preferences.Key<String> =
            stringPreferencesKey("access_token")
    }

    val accessToken: Flow<String?> =
        context.skillLaunchDataStore.data
            .catch { exception ->
                if (exception is IOException) {
                    emit(androidx.datastore.preferences.core.emptyPreferences())
                } else {
                    throw exception
                }
            }
            .map { preferences ->
                preferences[ACCESS_TOKEN]
            }

    suspend fun getAccessToken(): String? = accessToken.first()

    suspend fun saveAccessToken(token: String) {
        context.skillLaunchDataStore.edit { preferences ->
            preferences[ACCESS_TOKEN] = token
        }
    }

    suspend fun clearSession() {
        context.skillLaunchDataStore.edit { preferences ->
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

}