package com.skilllaunch.app.data.repository.profile

import com.skilllaunch.app.data.api.UserApi
import com.skilllaunch.app.data.model.profile.OnboardingUpdateRequest
import com.skilllaunch.app.data.model.profile.ProfileUpdateRequest
import com.skilllaunch.app.data.model.profile.ProfileUpdateResponse
import com.skilllaunch.app.data.model.profile.ProfileUser
import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import retrofit2.HttpException
import com.google.gson.Gson
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import java.io.IOException

class ProfileRepository(
    private val userApi: UserApi,
    private val uploadApi: com.skilllaunch.app.data.api.UploadApi
) {

    private val gson = Gson()

    suspend fun getProfile(userId: String): Result<ProfileUser> {
        return runCatching {
            userApi.getUserProfile(userId)
        }.recoverCatching { error ->
            throw Exception(
                apiErrorMessage(error, "Unable to load your profile right now"),
                error
            )
        }
    }

    suspend fun getMyProfile(): Result<ProfileUser> {
        val maxAttempts = 3
        val fallbackMessage = "Unable to load your profile right now"

        for (attempt in 0 until maxAttempts) {
            try {
                return Result.success(userApi.getMyProfile())
            } catch (error: Exception) {
                // Preserve structured cancellation instead of turning a navigation
                // or lifecycle cancellation into an ordinary profile failure.
                if (error is CancellationException) throw error

                val retryable = isTransientProfileReadFailure(error)
                if (retryable && attempt < maxAttempts - 1) {
                    delay(250L * (attempt + 1))
                    continue
                }

                // Keep the cause chain intact: MainActivity uses it to distinguish
                // connectivity failures from authorization and server errors.
                return Result.failure(
                    Exception(apiErrorMessage(error, fallbackMessage), error)
                )
            }
        }

        return Result.failure(IllegalStateException(fallbackMessage))
    }

    private fun isTransientProfileReadFailure(error: Throwable): Boolean {
        val causes = generateSequence(error) { it.cause }.toList()
        if (causes.any { it is IOException }) return true

        val httpError = causes.filterIsInstance<HttpException>().firstOrNull()
        return httpError != null && (httpError.code() == 429 || httpError.code() in 500..599)
    }



    suspend fun uploadResume(context: Context, uri: Uri): Result<com.skilllaunch.app.data.model.upload.ResumeUploadResponse> {
        return runCatching {
            val resolver = context.contentResolver
            val fileName = resolver.query(
                uri,
                arrayOf(OpenableColumns.DISPLAY_NAME),
                null,
                null,
                null
            )?.use { cursor ->
                if (cursor.moveToFirst()) {
                    cursor.getString(cursor.getColumnIndexOrThrow(OpenableColumns.DISPLAY_NAME))
                } else {
                    null
                }
            } ?: "resume.pdf"

            val extension = fileName.substringAfterLast('.', "").lowercase()
            require(extension == "pdf") {
                "Only PDF resume files are supported."
            }

            val mimeType = resolver.getType(uri)
            require(mimeType.isNullOrBlank() || mimeType == "application/pdf") {
                "Only PDF resume files are supported."
            }

            val bytes = resolver.openInputStream(uri)?.use { it.readBytes() }
                ?: throw IllegalStateException("Unable to read the selected resume.")

            require(bytes.size <= 5 * 1024 * 1024) {
                "Resume must be 5 MB or smaller."
            }

            val uploadMimeType = mimeType ?: "application/pdf"

            val body = bytes.toRequestBody(uploadMimeType.toMediaTypeOrNull())
            val part = MultipartBody.Part.createFormData(
                "file",
                fileName,
                body
            )

            uploadApi.uploadResume(part)
        }
    }

    suspend fun uploadProfileImage(
        context: Context,
        uri: Uri
    ): Result<String> {
        return runCatching {
            val resolver = context.contentResolver
            val fileName = "profile-${System.currentTimeMillis()}.jpg"
            val bytes = resolver.openInputStream(uri)?.use { it.readBytes() }
                ?: throw IllegalStateException("Unable to read the cropped profile photo.")

            require(bytes.isNotEmpty()) {
                "The cropped profile photo is empty."
            }
            require(bytes.size <= 10 * 1024 * 1024) {
                "Profile photo must be 10 MB or smaller."
            }

            val body = bytes.toRequestBody("image/jpeg".toMediaTypeOrNull())
            val part = MultipartBody.Part.createFormData("file", fileName, body)

            uploadApi.uploadFile(part).url
                ?.takeIf { it.isNotBlank() }
                ?: throw IllegalStateException("The server did not return a profile photo URL.")
        }
    }

    suspend fun updateProfile(
        request: ProfileUpdateRequest
    ): Result<ProfileUpdateResponse> {
        return runCatching {
            userApi.updateProfile(request)
        }.recoverCatching { error ->
            throw Exception(
                apiErrorMessage(error, "Unable to save your profile right now")
            )
        }
    }

    suspend fun updateOnboarding(
        request: OnboardingUpdateRequest
    ): Result<ProfileUpdateResponse> {
        return runCatching {
            userApi.updateOnboarding(request)
        }.recoverCatching { error ->
            throw Exception(
                apiErrorMessage(error, "Unable to save your onboarding right now")
            )
        }
    }

    private fun apiErrorMessage(error: Throwable, fallback: String): String {
        if (error !is HttpException) {
            return error.message ?: fallback
        }

        val body = error.response()?.errorBody()?.string()
        if (!body.isNullOrBlank()) {
            val parsed = runCatching {
                gson.fromJson(
                    body,
                    com.skilllaunch.app.data.model.auth.ApiErrorResponse::class.java
                )
            }.getOrNull()

            parsed?.error?.takeIf { it.isNotBlank() }?.let { return it }
            parsed?.message?.takeIf { it.isNotBlank() }?.let { return it }
        }

        return when (error.code()) {
            400 -> "Some profile details are invalid. Please check and try again."
            401 -> "Your session has expired. Please sign in again."
            403 -> "You are not allowed to update this profile."
            404 -> "The requested profile resource was not found."
            413 -> "The selected file is too large."
            429 -> "Too many requests. Please wait and try again."
            else -> fallback
        }
    }
}
