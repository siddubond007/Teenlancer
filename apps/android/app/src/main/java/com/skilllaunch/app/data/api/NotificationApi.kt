package com.skilllaunch.app.data.api

import com.skilllaunch.app.data.model.notification.Notification
import com.skilllaunch.app.data.model.notification.NotificationResponse
import retrofit2.http.GET
import retrofit2.http.PUT
import retrofit2.http.Path

interface NotificationApi {

    @GET("notifications")
    suspend fun getMyNotifications(): NotificationResponse

    @PUT("notifications/{notificationId}/read")
    suspend fun markAsRead(
        @Path("notificationId") notificationId: String
    ): Notification

    @PUT("notifications/read-all")
    suspend fun markAllAsRead(): Map<String, Any?>
}
