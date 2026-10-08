package com.skilllaunch.app.feature.notification

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AssistChip
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.skilllaunch.app.core.common.collectAsStateWithLifecycleCompat
import com.skilllaunch.app.data.model.notification.Notification
import com.skilllaunch.app.data.repository.notification.NotificationRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

data class NotificationUiState(
    val isLoading: Boolean = true,
    val notifications: List<Notification> = emptyList(),
    val unread: Int = 0,
    val errorMessage: String? = null
)

private class NotificationViewModel(
    private val repository: NotificationRepository
) : ViewModel() {
    private val _state = MutableStateFlow(NotificationUiState())
    val state = _state.asStateFlow()

    fun load(forceRefresh: Boolean = false) {
        if (!forceRefresh && !_state.value.isLoading && _state.value.notifications.isNotEmpty()) return

        viewModelScope.launch {
            _state.value = _state.value.copy(
                isLoading = true,
                errorMessage = null
            )

            repository.getMyNotifications()
                .onSuccess { response ->
                    _state.value = NotificationUiState(
                        isLoading = false,
                        notifications = response.notifications,
                        unread = response.stats.unread
                    )
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Unable to load notifications."
                    )
                }
        }
    }

    fun markAsRead(notification: Notification) {
        val id = notification.id ?: return
        if (notification.isRead) return

        _state.value = _state.value.copy(
            notifications = _state.value.notifications.map { current ->
                if (current.id == id) current.copy(isRead = true) else current
            },
            unread = (_state.value.unread - 1).coerceAtLeast(0)
        )

        viewModelScope.launch {
            repository.markAsRead(id)
                .onFailure {
                    load(forceRefresh = true)
                }
        }
    }

    fun markAllAsRead() {
        if (_state.value.unread == 0) return

        _state.value = _state.value.copy(
            notifications = _state.value.notifications.map { it.copy(isRead = true) },
            unread = 0
        )

        viewModelScope.launch {
            repository.markAllAsRead()
                .onFailure {
                    load(forceRefresh = true)
                }
        }
    }

    fun clearError() {
        _state.value = _state.value.copy(errorMessage = null)
    }

    companion object {
        fun factory(repository: NotificationRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    NotificationViewModel(repository) as T
            }
    }
}

@Composable
fun NotificationScreen(
    repository: NotificationRepository
) {
    val viewModel: NotificationViewModel = viewModel(
        factory = remember(repository) {
            NotificationViewModel.factory(repository)
        }
    )
    val state by viewModel.state.collectAsStateWithLifecycleCompat()

    LaunchedEffect(Unit) {
        viewModel.load(forceRefresh = true)
    }

    when {
        state.isLoading && state.notifications.isEmpty() -> {
            Box(
                Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        }

        state.errorMessage != null && state.notifications.isEmpty() -> {
            Box(
                Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "Notifications unavailable",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        state.errorMessage.orEmpty(),
                        Modifier.padding(top = 8.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    AssistChip(
                        onClick = {
                            viewModel.clearError()
                            viewModel.load(forceRefresh = true)
                        },
                        label = { Text("Retry") },
                        modifier = Modifier.padding(top = 16.dp)
                    )
                }
            }
        }

        state.notifications.isEmpty() -> {
            Box(
                Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "You're all caught up",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        "New marketplace updates will appear here.",
                        Modifier.padding(top = 8.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        else -> {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp, 12.dp, 16.dp, 28.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (state.unread > 0) {
                    item {
                        Box(
                            Modifier.fillMaxWidth(),
                            contentAlignment = Alignment.CenterEnd
                        ) {
                            AssistChip(
                                onClick = viewModel::markAllAsRead,
                                label = { Text("Mark all read") }
                            )
                        }
                    }
                }

                items(
                    items = state.notifications,
                    key = { notification ->
                        notification.id ?: (notification.createdAt.orEmpty() + notification.title.orEmpty())
                    }
                ) { notification ->
                    NotificationCard(
                        notification = notification,
                        onRead = { viewModel.markAsRead(notification) }
                    )
                }
            }
        }
    }
}

@Composable
private fun NotificationCard(
    notification: Notification,
    onRead: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .clickable(enabled = !notification.isRead, onClick = onRead),
        shape = RoundedCornerShape(18.dp),
        color = if (notification.isRead) {
            MaterialTheme.colorScheme.surface
        } else {
            MaterialTheme.colorScheme.primary.copy(alpha = 0.07f)
        }
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(
                notification.title.orEmpty(),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold
            )
            Text(
                notification.message.orEmpty(),
                Modifier.padding(top = 5.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            notification.createdAt?.let { createdAt ->
                formatNotificationTime(createdAt)?.let { formatted ->
                    Text(
                        formatted,
                        Modifier.padding(top = 8.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
        }
    }
}

private fun formatNotificationTime(value: String): String? =
    runCatching {
        val instant = Instant.parse(value)
        DateTimeFormatter.ofPattern("dd MMM, hh:mm a")
            .withZone(ZoneId.systemDefault())
            .format(instant)
    }.getOrNull()
