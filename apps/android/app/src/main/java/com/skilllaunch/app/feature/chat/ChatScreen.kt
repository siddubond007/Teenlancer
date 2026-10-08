package com.skilllaunch.app.feature.chat

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.skilllaunch.app.core.common.collectAsStateWithLifecycleCompat
import com.skilllaunch.app.data.model.auth.AuthUser
import com.skilllaunch.app.data.model.order.OrderMessage
import com.skilllaunch.app.data.model.order.OrderSummary
import com.skilllaunch.app.data.repository.order.OrderRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ChatUiState(
    val isLoading: Boolean = true,
    val orders: List<OrderSummary> = emptyList(),
    val selectedOrderId: String? = null,
    val messages: List<OrderMessage> = emptyList(),
    val isLoadingMessages: Boolean = false,
    val isSending: Boolean = false,
    val errorMessage: String? = null
)

private class ChatViewModel(
    private val repository: OrderRepository
) : ViewModel() {
    private val _state = MutableStateFlow(ChatUiState())
    val state = _state.asStateFlow()

    fun loadOrders() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, errorMessage = null)
            repository.getMyOrders()
                .onSuccess { orders ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        orders = orders,
                        errorMessage = null
                    )
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Unable to load conversations."
                    )
                }
        }
    }

    fun selectOrder(orderId: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(
                selectedOrderId = orderId,
                isLoadingMessages = true,
                messages = emptyList(),
                errorMessage = null
            )
            repository.getMessages(orderId)
                .onSuccess { messages ->
                    _state.value = _state.value.copy(
                        isLoadingMessages = false,
                        messages = messages
                    )
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
                        isLoadingMessages = false,
                        errorMessage = error.message ?: "Unable to load this conversation."
                    )
                }
        }
    }

    fun clearSelection() {
        _state.value = _state.value.copy(
            selectedOrderId = null,
            messages = emptyList(),
            errorMessage = null
        )
    }

    fun sendMessage(content: String) {
        val orderId = _state.value.selectedOrderId ?: return
        if (content.trim().isBlank() || _state.value.isSending) return

        viewModelScope.launch {
            _state.value = _state.value.copy(
                isSending = true,
                errorMessage = null
            )
            repository.sendMessage(orderId, content)
                .onSuccess { message ->
                    _state.value = _state.value.copy(
                        isSending = false,
                        messages = _state.value.messages + message
                    )
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
                        isSending = false,
                        errorMessage = error.message ?: "Unable to send message."
                    )
                }
        }
    }

    companion object {
        fun factory(repository: OrderRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    ChatViewModel(repository) as T
            }
    }
}

@Composable
fun ChatScreen(
    user: AuthUser,
    repository: OrderRepository
) {
    val viewModel: ChatViewModel = viewModel(
        factory = remember(repository) {
            ChatViewModel.factory(repository)
        }
    )
    val state by viewModel.state.collectAsStateWithLifecycleCompat()

    LaunchedEffect(Unit) {
        viewModel.loadOrders()
    }

    val selectedId = state.selectedOrderId

    if (selectedId != null) {
        ChatConversation(
            user = user,
            order = state.orders.firstOrNull { it.id == selectedId },
            messages = state.messages,
            isLoading = state.isLoadingMessages,
            isSending = state.isSending,
            errorMessage = state.errorMessage,
            onBack = viewModel::clearSelection,
            onSend = viewModel::sendMessage
        )
        return
    }

    when {
        state.isLoading && state.orders.isEmpty() -> {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }

        state.orders.isEmpty() -> {
            Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "No conversations yet",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        "Order conversations will appear here once you have marketplace work.",
                        Modifier.padding(top = 8.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Button(
                        onClick = viewModel::loadOrders,
                        Modifier.padding(top = 16.dp)
                    ) {
                        Text("Refresh")
                    }
                }
            }
        }

        state.errorMessage != null -> {
            Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "Chat unavailable",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        state.errorMessage.orEmpty(),
                        Modifier.padding(top = 8.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Button(
                        onClick = viewModel::loadOrders,
                        Modifier.padding(top = 16.dp)
                    ) {
                        Text("Retry")
                    }
                }
            }
        }

        else -> {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp, 12.dp, 16.dp, 28.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    Text(
                        "Conversations",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        "Your real order conversations.",
                        Modifier.padding(top = 4.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                items(
                    state.orders,
                    key = { it.id ?: it.createdAt.orEmpty() }
                ) { order ->
                    val counterpart = if (
                        user.role?.equals("STUDENT_FREELANCER", ignoreCase = true) == true
                    ) {
                        order.client?.fullName ?: "Client"
                    } else {
                        order.seller?.fullName ?: "Student freelancer"
                    }

                    Surface(
                        onClick = { order.id?.let(viewModel::selectOrder) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        color = MaterialTheme.colorScheme.surface
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Text(
                                order.job?.title ?: order.gig?.title ?: "Order conversation",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.ExtraBold
                            )
                            Text(
                                counterpart,
                                Modifier.padding(top = 4.dp),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                order.status.orEmpty(),
                                Modifier.padding(top = 5.dp),
                                color = MaterialTheme.colorScheme.primary,
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ChatConversation(
    user: AuthUser,
    order: OrderSummary?,
    messages: List<OrderMessage>,
    isLoading: Boolean,
    isSending: Boolean,
    errorMessage: String?,
    onBack: () -> Unit,
    onSend: (String) -> Unit
) {
    var draft by rememberSaveable { mutableStateOf("") }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onBack) {
                Text("← Back")
            }
            Column(Modifier.weight(1f)) {
                Text(
                    order?.job?.title ?: order?.gig?.title ?: "Conversation",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.ExtraBold
                )
            }
        }

        if (isLoading) {
            Box(
                Modifier.fillMaxWidth().height(2.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            contentPadding = PaddingValues(16.dp, 8.dp, 16.dp, 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (messages.isEmpty() && !isLoading) {
                item {
                    Box(
                        Modifier.fillMaxWidth().padding(top = 40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "No messages yet",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            items(
                messages,
                key = { it.id ?: (it.createdAt.orEmpty() + it.content.orEmpty()) }
            ) { message ->
                val mine = message.senderId == user.id

                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = if (mine) {
                        androidx.compose.foundation.layout.Arrangement.End
                    } else {
                        androidx.compose.foundation.layout.Arrangement.Start
                    }
                ) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = if (mine) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.surface
                        }
                    ) {
                        Text(
                            message.content?.takeIf { it.isNotBlank() } ?: "Attachment",
                            Modifier.padding(horizontal = 13.dp, vertical = 10.dp),
                            color = if (mine) {
                                MaterialTheme.colorScheme.onPrimary
                            } else {
                                MaterialTheme.colorScheme.onSurface
                            }
                        )
                    }
                }
            }
        }

        errorMessage?.takeIf { it.isNotBlank() }?.let {
            Text(
                it,
                Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.labelSmall
            )
        }

        Row(
            Modifier.fillMaxWidth().padding(10.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            OutlinedTextField(
                value = draft,
                onValueChange = { draft = it.take(4000) },
                modifier = Modifier.weight(1f),
                placeholder = { Text("Message") },
                maxLines = 5,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(
                    onSend = {
                        if (draft.trim().isNotBlank() && !isSending) {
                            onSend(draft.trim())
                            draft = ""
                        }
                    }
                )
            )
            Button(
                onClick = {
                    onSend(draft.trim())
                    draft = ""
                },
                enabled = draft.trim().isNotBlank() && !isSending,
                modifier = Modifier.padding(start = 8.dp)
            ) {
                Text("Send")
            }
        }
    }
}
