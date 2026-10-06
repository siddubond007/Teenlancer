package com.skilllaunch.app.data.repository.home

import com.google.gson.Gson
import com.skilllaunch.app.data.api.HomeApi
import com.skilllaunch.app.data.model.auth.ApiErrorResponse
import com.skilllaunch.app.data.model.home.HomeState
import retrofit2.HttpException
import java.io.IOException

class HomeRepository(
    private val homeApi: HomeApi
) {
    private val gson = Gson()

    suspend fun getHomeState(): Result<HomeState> {
        return try {
            Result.success(homeApi.getHomeState())
        } catch (exception: HttpException) {
            val body = exception.response()?.errorBody()?.string()
            val parsed = body?.let {
                runCatching { gson.fromJson(it, ApiErrorResponse::class.java) }.getOrNull()
            }

            val message = parsed?.error?.takeIf { it.isNotBlank() }
                ?: parsed?.message?.takeIf { it.isNotBlank() }
                ?: when (exception.code()) {
                    401 -> "Your session has expired. Please sign in again."
                    403 -> "Your account is not allowed to open the marketplace Home."
                    404 -> "Your Home state could not be found."
                    else -> "Unable to load your Home right now."
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
                    exception.message ?: "Unable to load your Home right now."
                )
            )
        }
    }
}
