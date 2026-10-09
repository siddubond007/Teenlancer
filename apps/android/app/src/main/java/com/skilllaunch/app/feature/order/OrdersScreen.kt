package com.skilllaunch.app.feature.order

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.skilllaunch.app.core.common.collectAsStateWithLifecycleCompat
import com.skilllaunch.app.data.model.auth.AuthUser
import com.skilllaunch.app.data.model.order.OrderSummary
import com.skilllaunch.app.data.model.order.SubmitDeliverableRequest
import com.skilllaunch.app.data.repository.order.OrderRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.time.Duration
import java.time.Instant
import java.util.Locale

data class OrdersUiState(
    val isLoading: Boolean = true,
    val orders: List<OrderSummary> = emptyList(),
    val selectedOrder: OrderSummary? = null,
    val errorMessage: String? = null,
    val actionMessage: String? = null
)

private class OrdersViewModel(
    private val repository: OrderRepository
) : ViewModel() {
    private val _state = MutableStateFlow(OrdersUiState())
    val state = _state.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, errorMessage = null)
            repository.getMyOrders()
                .onSuccess { orders ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        orders = orders,
                        selectedOrder = _state.value.selectedOrder?.let { selected ->
                            orders.firstOrNull { it.id == selected.id }
                        }
                    )
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Unable to load orders."
                    )
                }
        }
    }

    fun selectOrder(orderId: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(
                isLoading = true,
                errorMessage = null,
                actionMessage = null
            )
            repository.getOrder(orderId)
                .onSuccess { order ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        selectedOrder = order
                    )
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Unable to load this workspace."
                    )
                }
        }
    }

    fun clearSelection() {
        _state.value = _state.value.copy(selectedOrder = null, actionMessage = null)
    }

    fun approve(orderId: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(actionMessage = null)
            repository.approveOrder(orderId)
                .onSuccess { response ->
                    _state.value = _state.value.copy(actionMessage = response.message)
                    selectOrder(orderId)
                    load()
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
                        errorMessage = error.message ?: "Unable to approve the delivery."
                    )
                }
        }
    }

    fun requestRevision(orderId: String, reason: String) {
        viewModelScope.launch {
            repository.requestRevision(orderId, reason)
                .onSuccess { response ->
                    _state.value = _state.value.copy(actionMessage = response.message)
                    selectOrder(orderId)
                    load()
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
                        errorMessage = error.message ?: "Unable to request a revision."
                    )
                }
        }
    }

    fun submitDeliverable(orderId: String, request: SubmitDeliverableRequest) {
        viewModelScope.launch {
            repository.submitDeliverable(orderId, request)
                .onSuccess { response ->
                    _state.value = _state.value.copy(actionMessage = response.message)
                    selectOrder(orderId)
                    load()
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
                        errorMessage = error.message ?: "Unable to submit delivery."
                    )
                }
        }
    }

    companion object {
        fun factory(repository: OrderRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    OrdersViewModel(repository) as T
            }
    }
}

@Composable
fun OrdersScreen(
    user: AuthUser,
    repository: OrderRepository,
    initialOrderId: String? = null
) {
    val viewModel: OrdersViewModel = viewModel(
        factory = remember(repository) { OrdersViewModel.factory(repository) }
    )
    val state by viewModel.state.collectAsStateWithLifecycleCompat()
    var revisionOrderId by remember { mutableStateOf<String?>(null) }
    var deliveryOrderId by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(initialOrderId) {
        if (initialOrderId != null) {
            viewModel.selectOrder(initialOrderId)
        } else {
            viewModel.load()
        }
    }

    val selected = state.selectedOrder

    if (selected != null) {
        OrderWorkspace(
            user = user,
            order = selected,
            actionMessage = state.actionMessage,
            onBack = { viewModel.clearSelection() },
            onApprove = { viewModel.approve(selected.id.orEmpty()) },
            onRequestRevision = { revisionOrderId = selected.id },
            onSubmitDelivery = { deliveryOrderId = selected.id }
        )

        revisionOrderId?.let { orderId ->
            RevisionDialog(
                onDismiss = { revisionOrderId = null },
                onSubmit = { reason ->
                    revisionOrderId = null
                    viewModel.requestRevision(orderId, reason)
                }
            )
        }

        deliveryOrderId?.let { orderId ->
            DeliveryDialog(
                onDismiss = { deliveryOrderId = null },
                onSubmit = { request ->
                    deliveryOrderId = null
                    viewModel.submitDeliverable(orderId, request)
                }
            )
        }

        return
    }

    when {
        state.isLoading && state.orders.isEmpty() -> {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }

        state.errorMessage != null && state.orders.isEmpty() -> {
            Box(
                Modifier.fillMaxSize().padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "Orders unavailable",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        state.errorMessage.orEmpty(),
                        Modifier.padding(top = 8.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    AssistChip(
                        onClick = viewModel::load,
                        label = { Text("Retry") },
                        modifier = Modifier.padding(top = 16.dp)
                    )
                }
            }
        }

        state.orders.isEmpty() -> {
            Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "No orders yet",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        "Your real marketplace orders will appear here.",
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
                items(
                    items = state.orders,
                    key = { it.id ?: it.createdAt.orEmpty() }
                ) { order ->
                    OrderListCard(
                        user = user,
                        order = order,
                        onClick = {
                            order.id?.let(viewModel::selectOrder)
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun OrderListCard(
    user: AuthUser,
    order: OrderSummary,
    onClick: () -> Unit
) {
    val isStudent = user.role?.uppercase(Locale.US) == "STUDENT_FREELANCER"
    val counterpart = if (isStudent) order.client?.fullName else order.seller?.fullName
    Surface(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.14f))
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(
                orderTitle(order),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold
            )
            Text(
                counterpart ?: if (isStudent) "Client" else "Student freelancer",
                Modifier.padding(top = 4.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodySmall
            )
            Row(
                Modifier.padding(top = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    statusLabel(order.status),
                    color = MaterialTheme.colorScheme.primary,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.weight(1f))
                Text(
                    "₹" + money(order.totalAmount),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.ExtraBold
                )
            }
        }
    }
}

@Composable
private fun OrderWorkspace(
    user: AuthUser,
    order: OrderSummary,
    actionMessage: String?,
    onBack: () -> Unit,
    onApprove: () -> Unit,
    onRequestRevision: () -> Unit,
    onSubmitDelivery: () -> Unit
) {
    val isStudent = user.role?.uppercase(Locale.US) == "STUDENT_FREELANCER"
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        TextButton(onClick = onBack) {
            Text("← Back to Orders")
        }

        Text(
            orderTitle(order),
            Modifier.padding(top = 6.dp),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.ExtraBold
        )

        Text(
            if (isStudent) {
                "Client: " + (order.client?.fullName ?: "Client")
            } else {
                "Freelancer: " + (order.seller?.fullName ?: "Student freelancer")
            },
            Modifier.padding(top = 5.dp),
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Surface(
            Modifier
                .fillMaxWidth()
                .padding(top = 16.dp),
            shape = RoundedCornerShape(18.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.12f))
        ) {
            Column(Modifier.padding(16.dp)) {
                Text(
                    statusLabel(order.status),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    "Order value: ₹" + money(order.totalAmount),
                    Modifier.padding(top = 6.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                val isClientReview = !isStudent && order.status == "DELIVERED"
                val deadlineLabel = when {
                    isClientReview && order.autoApproveAt != null ->
                        "Auto-approves " + relativeDeadline(order.autoApproveAt)
                    order.deadline != null ->
                        "Deadline: " + relativeDeadline(order.deadline)
                    else -> null
                }
                deadlineLabel?.let { label ->
                    Text(
                        label,
                        Modifier.padding(top = 4.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        order.requirements?.takeIf { it.isNotBlank() }?.let { requirements ->
            Text(
                "Requirements",
                Modifier.padding(top = 18.dp),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                requirements,
                Modifier.padding(top = 6.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        if (order.deliverables.isNotEmpty()) {
            Text(
                "Latest delivery",
                Modifier.padding(top = 18.dp),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            val delivery = order.deliverables.maxByOrNull { it.version ?: 0 }
            if (delivery != null) {
                Text(
                    "Version " + (delivery.version ?: 0) +
                        " · " + (delivery.reviewStatus ?: "PENDING"),
                    Modifier.padding(top = 6.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                delivery.message?.let {
                    Text(
                        it,
                        Modifier.padding(top = 4.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        actionMessage?.takeIf { it.isNotBlank() }?.let {
            Text(
                it,
                Modifier.padding(top = 14.dp),
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.SemiBold
            )
        }

        if (isStudent && order.status in listOf(
                "FUNDED_IN_ESCROW",
                "REQUIREMENTS_SUBMITTED",
                "IN_PROGRESS",
                "REVISION_REQUESTED"
            )
        ) {
            Button(
                onClick = onSubmitDelivery,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 18.dp)
            ) {
                Text("Submit Delivery")
            }
        }

        if (!isStudent && order.status == "DELIVERED") {
            Button(
                onClick = onApprove,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 18.dp)
            ) {
                Text("Approve Delivery")
            }
            TextButton(
                onClick = onRequestRevision,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Request Revision")
            }
        }
    }
}

@Composable
private fun DeliveryDialog(
    onDismiss: () -> Unit,
    onSubmit: (SubmitDeliverableRequest) -> Unit
) {
    var driveLink by rememberSaveable { mutableStateOf("") }
    var fileUrl by rememberSaveable { mutableStateOf("") }
    var message by rememberSaveable { mutableStateOf("") }
    var error by rememberSaveable { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Submit Delivery") },
        text = {
            Column(
                Modifier
                    .widthIn(max = 420.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(9.dp)
            ) {
                OutlinedTextField(
                    value = driveLink,
                    onValueChange = { driveLink = it.take(500) },
                    label = { Text("Drive link (optional)") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri)
                )
                OutlinedTextField(
                    value = fileUrl,
                    onValueChange = { fileUrl = it.take(500) },
                    label = { Text("File URL (optional)") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri)
                )
                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it.take(1200) },
                    label = { Text("Delivery message") },
                    minLines = 4,
                    maxLines = 6
                )
                if (driveLink.isBlank() && fileUrl.isBlank()) {
                    Text(
                        "Add at least one delivery link.",
                        color = MaterialTheme.colorScheme.error
                    )
                }
                error.takeIf { it.isNotBlank() }?.let {
                    Text(it, color = MaterialTheme.colorScheme.error)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (driveLink.isBlank() && fileUrl.isBlank()) {
                        error = "Add at least one delivery link."
                        return@Button
                    }
                    onSubmit(
                        SubmitDeliverableRequest(
                            fileUrls = fileUrl.trim().takeIf { it.isNotBlank() }?.let(::listOf).orEmpty(),
                            driveLinks = driveLink.trim().takeIf { it.isNotBlank() }?.let(::listOf).orEmpty(),
                            message = message.trim()
                        )
                    )
                }
            ) {
                Text("Submit")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun RevisionDialog(
    onDismiss: () -> Unit,
    onSubmit: (String) -> Unit
) {
    var reason by rememberSaveable { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Request Revision") },
        text = {
            OutlinedTextField(
                value = reason,
                onValueChange = { reason = it.take(1000) },
                label = { Text("What needs to change?") },
                minLines = 4,
                maxLines = 6
            )
        },
        confirmButton = {
            Button(
                onClick = {
                    if (reason.trim().length >= 5) {
                        onSubmit(reason.trim())
                    }
                },
                enabled = reason.trim().length >= 5
            ) {
                Text("Request")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

private fun orderTitle(order: OrderSummary): String =
    order.job?.title?.takeIf { it.isNotBlank() }
        ?: order.gig?.title?.takeIf { it.isNotBlank() }
        ?: "Order workspace"

private fun statusLabel(status: String?): String = when (status?.uppercase(Locale.US)) {
    "PENDING_PAYMENT" -> "Payment pending"
    "FUNDED_IN_ESCROW" -> "Funded"
    "REQUIREMENTS_SUBMITTED" -> "Requirements submitted"
    "IN_PROGRESS" -> "In progress"
    "DELIVERED" -> "Delivered"
    "REVISION_REQUESTED" -> "Revision requested"
    "IN_REVIEW" -> "In review"
    "COMPLETED" -> "Completed"
    "DISPUTED" -> "Disputed"
    "CANCELLED_REFUNDED" -> "Cancelled"
    else -> "Active"
}

private fun relativeDeadline(deadline: String): String =
    runCatching {
        val duration = Duration.between(Instant.now(), Instant.parse(deadline))
        val remainingMillis = duration.toMillis()
        val hourMillis = Duration.ofHours(1).toMillis()
        val dayMillis = Duration.ofDays(1).toMillis()

        when {
            duration.isNegative -> "overdue"
            remainingMillis < dayMillis -> {
                val hours = ((remainingMillis + hourMillis - 1) / hourMillis).coerceAtLeast(1L)
                "in " + hours + " hours"
            }
            else -> {
                val days = ((remainingMillis + dayMillis - 1) / dayMillis).coerceAtLeast(1L)
                "in " + days + if (days == 1L) " day" else " days"
            }
        }
    }.getOrDefault("pending")

private fun money(value: Double): String =
    NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")).format(value)
