package com.skilllaunch.app.data.repository.home

import com.google.gson.Gson
import com.skilllaunch.app.data.api.ClientDashboardApi
import com.skilllaunch.app.data.model.auth.ApiErrorResponse
import com.skilllaunch.app.data.model.home.ClientDashboardState
import retrofit2.HttpException
import java.io.IOException

class ClientDashboardRepository(
    private val api: ClientDashboardApi
) {
    private val gson = Gson()

    suspend fun getDashboard(): Result<ClientDashboardState> {
        return try {
            Result.success(api.getClientDashboard())
        } catch (exception: HttpException) {
            val body = exception.response()?.errorBody()?.string()
            val parsed = body?.let {
                runCatching { gson.fromJson(it, ApiErrorResponse::class.java) }.getOrNull()
            }
            val message = parsed?.error?.takeIf { it.isNotBlank() }
                ?: parsed?.message?.takeIf { it.isNotBlank() }
                ?: when (exception.code()) {
                    401 -> "Your session has expired. Please sign in again."
                    403 -> "The client dashboard is only available to client accounts."
                    else -> "Unable to load your project dashboard right now."
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
                IllegalStateException(
                    exception.message ?: "Unable to load your project dashboard right now."
                )
            )
        }
    }
}
