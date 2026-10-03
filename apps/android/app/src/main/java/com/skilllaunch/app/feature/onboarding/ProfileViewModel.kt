package com.skilllaunch.app.feature.onboarding

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.skilllaunch.app.data.repository.profile.ProfileRepository
import com.skilllaunch.app.data.model.profile.ProfileUpdateRequest
import kotlinx.coroutines.launch

class ProfileViewModel(
    private val repository: ProfileRepository
) : ViewModel() {

    var selectedResumeUri by mutableStateOf<Uri?>(null)
        private set

    var isResumeUploading by mutableStateOf(false)
        private set

    var uploadedResumeFileName by mutableStateOf("")
        private set

    var resumeUploadError by mutableStateOf<String?>(null)
        private set

    var isAvatarUploading by mutableStateOf(false)
        private set

    var uploadedAvatarUrl by mutableStateOf("")
        private set

    var avatarUploadError by mutableStateOf<String?>(null)
        private set

    fun uploadProfileImage(
        uri: Uri,
        context: Context
    ) {
        if (isAvatarUploading) return

        viewModelScope.launch {
            isAvatarUploading = true
            avatarUploadError = null

            repository.uploadProfileImage(context, uri)
                .onSuccess { url ->
                    uploadedAvatarUrl = url

                    repository.updateProfile(ProfileUpdateRequest(avatarUrl = url))
                        .onSuccess {
                            isAvatarUploading = false
                        }
                        .onFailure { exception ->
                            isAvatarUploading = false
                            avatarUploadError = exception.message
                                ?: "Photo uploaded, but the profile could not be updated."
                        }
                }
                .onFailure { exception ->
                    isAvatarUploading = false
                    avatarUploadError = exception.message
                        ?: "Unable to upload your profile photo."
                }
        }
    }

    fun clearAvatarUploadError() {
        avatarUploadError = null
    }

    fun uploadResumeToBackend(
        uri: Uri,
        context: Context
    ) {
        if (isResumeUploading) return

        viewModelScope.launch {
            selectedResumeUri = uri
            isResumeUploading = true
            resumeUploadError = null

            /*
             * ProfileRepository.uploadResume(...) is the Retrofit path today.
             * It creates MultipartBody.Part and calls UploadApi.uploadResume().
             * A Firebase Storage implementation can replace this call later.
             */
            repository.uploadResume(context, uri)
                .onSuccess { response ->
                    uploadedResumeFileName = response.fileName.orEmpty()
                    isResumeUploading = false
                }
                .onFailure { exception ->
                    isResumeUploading = false
                    resumeUploadError = exception.message
                        ?: "Unable to upload your resume."
                }
        }
    }

    fun clearResumeUploadError() {
        resumeUploadError = null
    }

    companion object {
        fun factory(
            repository: ProfileRepository
        ): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(
                modelClass: Class<T>
            ): T {
                if (modelClass.isAssignableFrom(ProfileViewModel::class.java)) {
                    return ProfileViewModel(repository) as T
                }
                throw IllegalArgumentException(
                    "Unknown ViewModel class: ${modelClass.name}"
                )
            }
        }
    }
}
