package com.skilllaunch.app.data.model.notification

data class Notification(
    val id: String? = null,
    val userId: String? = null,
    val orderId: String? = null,
    val title: String? = null,
    val message: String? = null,
    val type: String? = null,
    val isRead: Boolean = false,
    val createdAt: String? = null
)

data class NotificationStats(
    val total: Int = 0,
    val unread: Int = 0,
    val read: Int = 0
)

data class NotificationResponse(
    val notifications: List<Notification> = emptyList(),
    val stats: NotificationStats = NotificationStats()
)
