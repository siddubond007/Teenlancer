package com.skilllaunch.app.feature.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.skilllaunch.app.data.model.profile.ProfileData
import com.skilllaunch.app.data.model.profile.ProfileUpdateRequest
import com.skilllaunch.app.data.model.profile.ProfileUser
import com.skilllaunch.app.data.repository.profile.ProfileRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProfileFormState(
    val tagline: String = "",
    val bio: String = "",
    val college: String = "",
    val category: String = "",
    val hourlyRate: String = "",
    val skills: String = "",
    val responseTimeExpectation: String = ""
)

data class ProfileUiState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val profileUser: ProfileUser? = null,
    val form: ProfileFormState = ProfileFormState(),
    val errorMessage: String? = null,
    val successMessage: String? = null
)

class ProfileViewModel(
    private val repository: ProfileRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    private var loadedUserId: String? = null
    private var profileLoadGeneration = 0
    private var profileSaveGeneration = 0

    fun loadProfile(userId: String, forceRefresh: Boolean = false) {
        if (userId.isBlank()) {
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                errorMessage = "Your profile could not be found"
            )
            return
        }

        if (!forceRefresh && loadedUserId == userId && _uiState.value.profileUser != null) {
            return
        }

        loadedUserId = userId
        val requestGeneration = ++profileLoadGeneration

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = true,
                errorMessage = null,
                successMessage = null
            )

            repository.getMyProfile()
                .onSuccess { user ->
                    if (requestGeneration != profileLoadGeneration) return@onSuccess
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        profileUser = user,
                        form = user.profile.toFormState(),
                        errorMessage = null
                    )
                }
                .onFailure { error ->
                    if (requestGeneration != profileLoadGeneration) return@onFailure
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Unable to load your profile right now"
                    )
                }
        }
    }

    fun updateTagline(value: String) {
        updateForm { copy(tagline = value) }
    }

    fun updateBio(value: String) {
        updateForm { copy(bio = value) }
    }

    fun updateCollege(value: String) {
        updateForm { copy(college = value) }
    }

    fun updateCategory(value: String) {
        updateForm { copy(category = value) }
    }

    fun updateHourlyRate(value: String) {
        updateForm { copy(hourlyRate = value) }
    }

    fun updateSkills(value: String) {
        updateForm { copy(skills = value) }
    }

    fun updateResponseTimeExpectation(value: String) {
        updateForm { copy(responseTimeExpectation = value) }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(
            errorMessage = null,
            successMessage = null
        )
    }

    fun saveProfile() {
        if (_uiState.value.isSaving) return
        val currentState = _uiState.value
        val requestGeneration = ++profileSaveGeneration
        // A profile load started before Save must not overwrite the response or the live form.
        profileLoadGeneration += 1
        val hourlyRate = currentState.form.hourlyRate
            .trim()
            .takeIf { it.isNotEmpty() }
            ?.toDoubleOrNull()

        if (currentState.form.hourlyRate.isNotBlank() && hourlyRate == null) {
            _uiState.value = currentState.copy(
                errorMessage = "Hourly rate must be a valid number",
                successMessage = null
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = currentState.copy(
                isSaving = true,
                errorMessage = null,
                successMessage = null
            )

            val request = ProfileUpdateRequest(
                tagline = currentState.form.tagline.trim().ifBlank { null },
                bio = currentState.form.bio.trim().ifBlank { null },
                college = currentState.form.college.trim().ifBlank { null },
                category = currentState.form.category.trim().ifBlank { null },
                hourlyRate = hourlyRate,
                skills = currentState.form.skills.split(',').map { it.trim() }.filter { it.isNotEmpty() }.ifEmpty { null },
                responseTimeExpectation = currentState.form.responseTimeExpectation
                    .trim()
                    .ifBlank { null }
            )

            repository.updateProfile(request)
                .onSuccess { response ->
                    if (requestGeneration != profileSaveGeneration) return@onSuccess
                    val updatedProfile = response.profile
                    val formChangedDuringSave = _uiState.value.form != currentState.form
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        profileUser = _uiState.value.profileUser?.copy(
                            profile = updatedProfile
                        ),
                        form = if (!formChangedDuringSave) {
                            updatedProfile?.toFormState() ?: _uiState.value.form
                        } else {
                            _uiState.value.form
                        },
                        errorMessage = null,
                        successMessage = response.message ?: "Profile updated successfully"
                    )
                }
                .onFailure { error ->
                    if (requestGeneration != profileSaveGeneration) return@onFailure
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        errorMessage = error.message ?: "Unable to save your profile right now",
                        successMessage = null
                    )
                }
        }
    }

    private fun updateForm(update: ProfileFormState.() -> ProfileFormState) {
        _uiState.value = _uiState.value.copy(
            form = _uiState.value.form.update(),
            errorMessage = null,
            successMessage = null
        )
    }

    private fun ProfileData?.toFormState(): ProfileFormState {
        return ProfileFormState(
            tagline = this?.tagline.orEmpty(),
            bio = this?.bio.orEmpty(),
            college = this?.college.orEmpty(),
            category = this?.category.orEmpty(),
            hourlyRate = this?.hourlyRate?.toString().orEmpty(),
            skills = this?.skills?.joinToString(", ").orEmpty(),
            responseTimeExpectation = this?.responseTimeExpectation.orEmpty()
        )
    }
}


