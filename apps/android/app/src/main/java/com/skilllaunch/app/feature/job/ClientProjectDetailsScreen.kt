package com.skilllaunch.app.feature.job

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.skilllaunch.app.core.common.collectAsStateWithLifecycleCompat
import com.skilllaunch.app.data.model.job.Job
import com.skilllaunch.app.data.model.job.JobBidCount
import com.skilllaunch.app.data.repository.job.JobRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

private data class ClientProjectDetailsUiState(
    val isLoading: Boolean = true,
    val job: Job? = null,
    val busyBidId: String? = null,
    val errorMessage: String? = null,
    val actionMessage: String? = null
)

private class ClientProjectDetailsViewModel(
    private val repository: JobRepository
) : ViewModel() {
    private val _state = MutableStateFlow(ClientProjectDetailsUiState())
    val state = _state.asStateFlow()

    fun load(jobId: String) {
        refresh(jobId, clearMessages = true)
    }

    private fun refresh(jobId: String, clearMessages: Boolean) {
        viewModelScope.launch {
            val current = _state.value
            _state.value = current.copy(
                isLoading = current.job == null,
                errorMessage = if (clearMessages) null else current.errorMessage,
                actionMessage = if (clearMessages) null else current.actionMessage
            )
            repository.getClientProject(jobId)
                .onSuccess { job ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        job = job,
                        errorMessage = null
                    )
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Unable to load this project's proposals."
                    )
                }
        }
    }

    fun shortlist(jobId: String, bidId: String) = updateBid(jobId, bidId, shortlist = true)

    fun reject(jobId: String, bidId: String) = updateBid(jobId, bidId, shortlist = false)

    private fun updateBid(jobId: String, bidId: String, shortlist: Boolean) {
        viewModelScope.launch {
            _state.value = _state.value.copy(
                busyBidId = bidId,
                errorMessage = null,
                actionMessage = null
            )
            val result = if (shortlist) {
                repository.shortlistBid(jobId, bidId)
            } else {
                repository.rejectBid(jobId, bidId)
            }
            result.onSuccess { message ->
                _state.value = _state.value.copy(
                    busyBidId = null,
                    actionMessage = message
                )
                refresh(jobId, clearMessages = false)
            }.onFailure { error ->
                _state.value = _state.value.copy(
                    busyBidId = null,
                    errorMessage = error.message
                        ?: if (shortlist) "Unable to shortlist this proposal." else "Unable to reject this proposal."
                )
            }
        }
    }

    companion object {
        fun factory(repository: JobRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    ClientProjectDetailsViewModel(repository) as T
            }
    }
}

@Composable
fun ClientProjectDetailsScreen(
    jobId: String,
    repository: JobRepository
) {
    val viewModel: ClientProjectDetailsViewModel = viewModel(
        key = "client-project-details-" + jobId,
        factory = remember(repository) {
            ClientProjectDetailsViewModel.factory(repository)
        }
    )
    val state by viewModel.state.collectAsStateWithLifecycleCompat()
    var rejectingBidId by rememberSaveable(jobId) { mutableStateOf<String?>(null) }

    LaunchedEffect(jobId) {
        viewModel.load(jobId)
    }

    when {
        state.isLoading && state.job == null -> {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }

        state.job == null -> {
            Box(
                Modifier.fillMaxSize().padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "Project unavailable",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        state.errorMessage ?: "Unable to load this project's proposals.",
                        Modifier.padding(top = 8.dp),
                        color = MaterialTheme.colorScheme.error
                    )
                    Button(
                        onClick = { viewModel.load(jobId) },
                        modifier = Modifier.padding(top = 12.dp)
                    ) {
                        Text("Try again")
                    }
                }
            }
        }

        else -> {
            val job = state.job!!
            val canManageProposals =
                job.status?.uppercase(Locale.US) == "OPEN" && job.isOpen == true

            Column(
                Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(22.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
                ) {
                    Column(
                        Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            job.title ?: "Project",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            AssistChip(
                                onClick = {},
                                label = { Text(formatJobBudget(job)) }
                            )
                            AssistChip(
                                onClick = {},
                                label = { Text((job.status ?: "UNKNOWN").replace('_', ' ')) }
                            )
                        }
                        job.description?.takeIf(String::isNotBlank)?.let { description ->
                            Text(
                                description.replace(Regex("<[^>]*>"), " ")
                                    .replace(Regex("[[:space:]]+"), " ")
                                    .trim(),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Text(
                            job.bids.size.toString() + if (job.bids.size == 1) " proposal received" else " proposals received",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                if (state.actionMessage != null) {
                    Text(
                        state.actionMessage.orEmpty(),
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                if (state.errorMessage != null) {
                    Text(
                        state.errorMessage.orEmpty(),
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }

                if (job.bids.isEmpty()) {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        color = MaterialTheme.colorScheme.surface
                    ) {
                        Text(
                            "No proposals have been received for this project yet.",
                            Modifier.padding(18.dp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                } else {
                    job.bids.forEach { bid ->
                        ClientProposalCard(
                            bid = bid,
                            canManage = canManageProposals,
                            isBusy = state.busyBidId == bid.id,
                            anyActionBusy = state.busyBidId != null,
                            onShortlist = {
                                bid.id?.takeIf(String::isNotBlank)?.let {
                                    viewModel.shortlist(jobId, it)
                                }
                            },
                            onReject = {
                                rejectingBidId = bid.id
                            }
                        )
                    }
                }

                if (!canManageProposals) {
                    Text(
                        "Proposal actions are unavailable because this project is no longer open for review.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Spacer(Modifier.height(8.dp))
            }

            val rejectingBid = job.bids.firstOrNull { it.id == rejectingBidId }
            if (rejectingBid != null) {
                AlertDialog(
                    onDismissRequest = { rejectingBidId = null },
                    title = { Text("Reject this proposal?") },
                    text = {
                        Text(
                            "This will mark the proposal from " +
                                (rejectingBid.student?.fullName ?: rejectingBid.student?.username ?: "this student") +
                                " as rejected."
                        )
                    },
                    confirmButton = {
                        Button(
                            enabled = state.busyBidId == null,
                            onClick = {
                                val id = rejectingBid.id
                                rejectingBidId = null
                                if (!id.isNullOrBlank()) viewModel.reject(jobId, id)
                            }
                        ) {
                            Text("Reject proposal")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { rejectingBidId = null }) {
                            Text("Cancel")
                        }
                    }
                )
            }
        }
    }
}

@Composable
private fun ClientProposalCard(
    bid: JobBidCount,
    canManage: Boolean,
    isBusy: Boolean,
    anyActionBusy: Boolean,
    onShortlist: () -> Unit,
    onReject: () -> Unit
) {
    val student = bid.student
    val status = bid.status?.uppercase(Locale.US) ?: "PENDING"
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
    ) {
        Column(
            Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                student?.fullName?.takeIf(String::isNotBlank)
                    ?: student?.username?.takeIf(String::isNotBlank)
                    ?: "Student freelancer",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold
            )
            student?.profile?.tagline?.takeIf(String::isNotBlank)?.let {
                Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AssistChip(
                    onClick = {},
                    label = { Text("₹" + formatAmount(bid.proposedAmount ?: 0.0)) }
                )
                AssistChip(
                    onClick = {},
                    label = {
                        Text(
                            (bid.deliveryDays ?: 0).toString() +
                                if ((bid.deliveryDays ?: 0) == 1) " day" else " days"
                        )
                    }
                )
                AssistChip(
                    onClick = {},
                    label = { Text(status.replace('_', ' ')) }
                )
            }
            if ((student?.averageRating ?: 0.0) > 0.0) {
                Text(
                    "Rating " + String.format(Locale.US, "%.1f", student?.averageRating) +
                        " · " + student?.totalReviews + " reviews",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall
                )
            }
            student?.profile?.category?.takeIf(String::isNotBlank)?.let {
                Text("Category: " + it, style = MaterialTheme.typography.bodySmall)
            }
            if (student?.profile?.skills?.isNotEmpty() == true) {
                Text(
                    "Skills: " + student.profile.skills.take(6).joinToString(", "),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text(
                "Proposal message",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )
            Text(
                bid.coverLetter?.takeIf(String::isNotBlank) ?: "No proposal message provided.",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            when (status) {
                "PENDING" -> if (canManage) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Button(
                            onClick = onShortlist,
                            enabled = !anyActionBusy && !isBusy,
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(if (isBusy) "Saving..." else "Shortlist")
                        }
                        OutlinedButton(
                            onClick = onReject,
                            enabled = !anyActionBusy,
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Reject")
                        }
                    }
                }
                "SHORTLISTED" -> Text(
                    "This proposal is shortlisted.",
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
                "REJECTED" -> Text(
                    "This proposal was rejected.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                "HIRED" -> Text(
                    "This proposal was hired.",
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

private fun formatJobBudget(job: Job): String {
    val fixed = job.fixedBudget
    val minimum = job.minimumBudget
    val maximum = job.maximumBudget
    return when {
        fixed != null && fixed > 0 -> "₹" + formatAmount(fixed)
        minimum != null && maximum != null && minimum > 0 && maximum > 0 ->
            "₹" + formatAmount(minimum) + "–₹" + formatAmount(maximum)
        job.budget > 0 -> "₹" + formatAmount(job.budget)
        else -> "Budget on request"
    }
}

private fun formatAmount(value: Double): String =
    NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")).format(value)
