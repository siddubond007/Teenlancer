package com.skilllaunch.app.data.repository.auth

import com.skilllaunch.app.core.session.SessionStore
import com.skilllaunch.app.data.api.AuthApi
import com.skilllaunch.app.data.model.auth.AuthUser
import com.skilllaunch.app.data.model.auth.LoginRequest
import com.skilllaunch.app.data.model.auth.RegisterRequest
import com.skilllaunch.app.data.model.auth.ApiErrorResponse
import com.google.gson.Gson
import retrofit2.HttpException
import java.io.IOException

class AuthRepository(
    private val authApi: AuthApi,
    private val sessionStore: SessionStore
) {

    private val gson = Gson()

    suspend fun login(
        email: String,
        password: String
    ): Result<AuthUser> {
        return authenticate {
            authApi.login(
                LoginRequest(
                    email = email.trim(),
                    password = password
                )
            )
        }
    }

    suspend fun register(
        firstName: String,
        middleName: String?,
        lastName: String,
        username: String?,
        email: String,
        password: String,
        role: String,
        age: Int,
        dob: String?
    ): Result<AuthUser> {
        return authenticate {
            authApi.register(
                RegisterRequest(
                    email = email.trim(),
                    password = password,
                    firstName = firstName.trim(),
                    middleName = middleName?.trim()?.ifBlank { null },
                    lastName = lastName.trim(),
                    username = username?.trim()?.ifBlank { null },
                    role = role,
                    age = age,
                    dob = dob
                )
            )
        }
    }

    private suspend fun authenticate(
        request: suspend () -> com.skilllaunch.app.data.model.auth.LoginResponse
    ): Result<AuthUser> {
        return try {
            val response = request()

            val token = response.token
                ?: return Result.failure(
                    IllegalStateException("Authentication token was not returned.")
                )

            val user = response.user
                ?: return Result.failure(
                    IllegalStateException("Authenticated user was not returned.")
                )

            sessionStore.saveAccessToken(token)
            Result.success(user)
        } catch (exception: HttpException) {
            val apiMessage = exception.response()?.errorBody()?.string()?.let { body ->
                runCatching {
                    gson.fromJson(body, ApiErrorResponse::class.java).let { parsed ->
                        parsed.error?.takeIf { it.isNotBlank() }
                            ?: parsed.message?.takeIf { it.isNotBlank() }
                    }
                }.getOrNull()
            }

            val message = apiMessage ?: when (exception.code()) {
                400 -> "Some account details are invalid. Please review the highlighted information."
                401 -> "Invalid email/username or password. Please try again."
                403 -> "This account type cannot be registered with the selected details."
                409 -> "This account already exists. Please use different details or sign in."
                429 -> "Too many requests. Please wait and try again."
                else -> "Unable to complete the request right now. Please try again."
            }
            Result.failure(IllegalStateException(message))
        } catch (exception: IOException) {
            Result.failure(
                IllegalStateException(
                    "Network connection failed. Please check your connection and try again."
                )
            )
        } catch (exception: Exception) {
            Result.failure(
                IllegalStateException("Unable to complete the request right now. Please try again.")
            )
        }
    }

    suspend fun getCurrentUser(): Result<AuthUser> {
        return try {
            val user = authApi.getMe().user
                ?: return Result.failure(
                    IllegalStateException("Current user was not returned.")
                )

            Result.success(user)
        } catch (exception: Exception) {
            Result.failure(exception)
        }
    }

    suspend fun logout() {
        sessionStore.clearSession()
    }
}