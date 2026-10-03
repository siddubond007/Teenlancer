package com.skilllaunch.app.data.repository.profile

import com.skilllaunch.app.data.api.UserApi
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
                apiErrorMessage(error, "Unable to load your profile right now")
            )
        }
    }

    suspend fun getMyProfile(): Result<ProfileUser> {
        return runCatching {
            userApi.getMyProfile()
        }.recoverCatching { error ->
            throw Exception(
                apiErrorMessage(error, "Unable to load your profile right now")
            )
        }
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
