package com.skilllaunch.app.data.repository.notification

import com.google.gson.Gson
import com.skilllaunch.app.data.api.NotificationApi
import com.skilllaunch.app.data.model.auth.ApiErrorResponse
import com.skilllaunch.app.data.model.notification.Notification
import com.skilllaunch.app.data.model.notification.NotificationResponse
import retrofit2.HttpException

class NotificationRepository(
    private val api: NotificationApi
) {
    private val gson = Gson()

    suspend fun getMyNotifications(): Result<NotificationResponse> =
        runCatching { api.getMyNotifications() }
            .recoverCatching {
                throw mapError(it, "Unable to load notifications right now.")
            }

    suspend fun markAsRead(notificationId: String): Result<Notification> =
        runCatching { api.markAsRead(notificationId) }
            .recoverCatching {
                throw mapError(it, "Unable to update this notification.")
            }

    suspend fun markAllAsRead(): Result<Unit> =
        runCatching {
            api.markAllAsRead()
            Unit
        }.recoverCatching {
            throw mapError(it, "Unable to update your notifications.")
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
