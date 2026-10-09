package com.skilllaunch.app.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.skilllaunch.app.core.session.SessionStore
import com.skilllaunch.app.data.model.auth.AuthUser
import com.skilllaunch.app.data.repository.auth.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.io.IOException
import java.util.Locale

data class AuthUiState(
    val isCheckingSession: Boolean = true,
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val user: AuthUser? = null,
    val errorMessage: String? = null,
    val sessionRestoreError: String? = null,
    val isOfflineSession: Boolean = false
)

class AuthViewModel(
    private val repository: AuthRepository,
    private val sessionStore: SessionStore
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        restoreSession()
    }

    fun login(email: String, password: String) {
        val cleanEmail = email.trim()

        if (cleanEmail.isBlank() || password.isBlank()) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Please enter your email and password."
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = true,
                errorMessage = null,
                sessionRestoreError = null
            )

            repository.login(cleanEmail, password)
                .onSuccess { user ->
                    _uiState.value = AuthUiState(
                        isCheckingSession = false,
                        isAuthenticated = true,
                        user = user,
                        sessionRestoreError = null
                    )
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(
                        isCheckingSession = false,
                        isLoading = false,
                        sessionRestoreError = null,
                        errorMessage = exception.message
                            ?: "Unable to sign in. Please check your credentials."
                    )
                }
        }
    }

    fun signup(
        firstName: String,
        middleName: String?,
        lastName: String,
        username: String?,
        email: String,
        password: String,
        role: String,
        age: Int,
        dob: String?
    ) {
        if (firstName.isBlank() || lastName.isBlank() || email.isBlank() || password.isBlank() || dob.isNullOrBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please complete all required fields.", sessionRestoreError = null); return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, sessionRestoreError = null)
            repository.register(
                firstName = firstName,
                middleName = middleName,
                lastName = lastName,
                username = username,
                email = email,
                password = password,
                role = role,
                age = age,
                dob = dob
            )
                .onSuccess { user ->
                    _uiState.value = AuthUiState(isCheckingSession = false, isAuthenticated = true, user = user, sessionRestoreError = null)
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(isCheckingSession = false, isLoading = false, sessionRestoreError = null, errorMessage = exception.message ?: "Unable to create your account. Please try again.")
                }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null, sessionRestoreError = null)
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
            _uiState.value = AuthUiState(
                isCheckingSession = false,
                isAuthenticated = false
            )
        }
    }

    fun retrySessionRestore() {
        restoreSession()
    }

    private fun isNetworkUnavailable(error: Throwable): Boolean {
        val causes = generateSequence(error) { it.cause }.toList()
        if (causes.any { it is HttpException }) return false
        return causes.any { it is IOException }
    }

    private fun restoreSession() {
        viewModelScope.launch {
            val token = sessionStore.getAccessToken()

            if (token.isNullOrBlank()) {
                _uiState.value = AuthUiState(
                    isCheckingSession = false
                )
                return@launch
            }

            repository.getCurrentUser()
                .onSuccess { user ->
                    sessionStore.saveCachedUser(user)
                    _uiState.value = AuthUiState(
                        isCheckingSession = false,
                        isAuthenticated = true,
                        user = user
                    )
                }
                .onFailure { exception ->
                    val httpException = generateSequence(exception) { it.cause }
                        .filterIsInstance<HttpException>()
                        .firstOrNull()
                    if (httpException != null && httpException.code() in 401..403) {
                        // Explicit authorization failures must never be treated as an offline session.
                        repository.logout()
                        _uiState.value = AuthUiState(
                            isCheckingSession = false
                        )
                    } else if (isNetworkUnavailable(exception)) {
                        val cachedUser = runCatching {
                            sessionStore.getCachedUser()
                        }.getOrNull()
                        val usableUser = cachedUser?.takeIf { cached ->
                            !cached.id.isNullOrBlank() &&
                                cached.role?.uppercase(Locale.US) in setOf(
                                    "STUDENT_FREELANCER",
                                    "CLIENT"
                                )
                        }

                        if (usableUser != null) {
                            _uiState.value = AuthUiState(
                                isCheckingSession = false,
                                isAuthenticated = true,
                                user = usableUser,
                                sessionRestoreError = null,
                                isOfflineSession = true
                            )
                        } else {
                            _uiState.value = AuthUiState(
                                isCheckingSession = false,
                                sessionRestoreError = "We couldn't verify your saved session. Check your connection and retry."
                            )
                        }
                    } else {
                        _uiState.value = AuthUiState(
                            isCheckingSession = false,
                            sessionRestoreError = "We couldn't verify your saved session. Check your connection and retry."
                        )
                    }
                }
        }
    }

    companion object {
        fun factory(
            repository: AuthRepository,
            sessionStore: SessionStore
        ): ViewModelProvider.Factory {
            return object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(
                    modelClass: Class<T>
                ): T {
                    return AuthViewModel(
                        repository = repository,
                        sessionStore = sessionStore
                    ) as T
                }
            }
        }
    }
}