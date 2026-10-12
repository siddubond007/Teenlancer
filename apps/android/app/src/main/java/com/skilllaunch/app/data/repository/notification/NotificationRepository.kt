package com.skilllaunch.app.data.repository.notification

import com.google.gson.Gson
import com.skilllaunch.app.data.api.NotificationApi
import com.skilllaunch.app.data.model.auth.ApiErrorResponse
import com.skilllaunch.app.data.model.notification.Notification
import com.skilllaunch.app.data.model.notification.NotificationResponse
import kotlinx.coroutines.CancellationException
import retrofit2.HttpException

class NotificationRepository(
    private val api: NotificationApi
) {
    private val gson = Gson()

    suspend fun getMyNotifications(): Result<NotificationResponse> =
        safeCall("Unable to load notifications right now.") { api.getMyNotifications() }

    suspend fun markAsRead(notificationId: String): Result<Notification> =
        safeCall("Unable to update this notification.") { api.markAsRead(notificationId) }

    suspend fun markAllAsRead(): Result<Unit> =
        safeCall("Unable to update your notifications.") {
            api.markAllAsRead()
            Unit
        }

    private suspend fun <T> safeCall(
        fallback: String,
        block: suspend () -> T
    ): Result<T> = try {
        Result.success(block())
    } catch (cancelled: CancellationException) {
        throw cancelled
    } catch (error: Exception) {
        Result.failure(mapError(error, fallback))
    }

    private fun mapError(error: Throwable, fallback: String): IllegalStateException {
        if (error is HttpException) {
            val body = error.response()?.errorBody()?.string()
            val message = body?.let {
                runCatching {
                    gson.fromJson(it, ApiErrorResponse::class.java)
                }.getOrNull()
            }?.error?.takeIf { value -> value.isNotBlank() }

            if (message != null) return IllegalStateException(message)
        }

        return IllegalStateException(error.message ?: fallback)
    }
}
