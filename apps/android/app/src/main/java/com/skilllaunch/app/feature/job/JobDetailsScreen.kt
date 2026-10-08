package com.skilllaunch.app.feature.job

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.skilllaunch.app.core.common.collectAsStateWithLifecycleCompat
import com.skilllaunch.app.data.model.job.Job
import com.skilllaunch.app.data.model.job.SubmitBidRequest
import com.skilllaunch.app.data.repository.job.JobRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

data class JobDetailsUiState(
    val isLoading: Boolean = true,
    val job: Job? = null,
    val isSubmitting: Boolean = false,
    val submitted: Boolean = false,
    val errorMessage: String? = null
)

private class JobDetailsViewModel(
    private val repository: JobRepository
) : ViewModel() {
    private val _state = MutableStateFlow(JobDetailsUiState())
    val state = _state.asStateFlow()

    fun load(jobId: String) {
        viewModelScope.launch {
            _state.value = JobDetailsUiState(isLoading = true)
            repository.getPublicJob(jobId)
                .onSuccess { job ->
                    _state.value = JobDetailsUiState(
                        isLoading = false,
                        job = job,
                        submitted = job.viewerBid != null
                    )
                }
                .onFailure { error ->
                    _state.value = JobDetailsUiState(
                        isLoading = false,
                        errorMessage = error.message ?: "Unable to load this project."
                    )
                }
        }
    }

    fun submit(
        jobId: String,
        request: SubmitBidRequest
    ) {
        viewModelScope.launch {
            _state.value = _state.value.copy(
                isSubmitting = true,
                errorMessage = null
            )
            repository.submitBid(jobId, request)
                .onSuccess {
                    _state.value = _state.value.copy(
                        isSubmitting = false,
                        submitted = true
                    )
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
                        isSubmitting = false,
                        errorMessage = error.message ?: "Unable to submit your proposal."
                    )
                }
        }
    }

    companion object {
        fun factory(repository: JobRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    JobDetailsViewModel(repository) as T
            }
    }
}

@Composable
fun JobDetailsScreen(
    jobId: String,
    repository: JobRepository
) {
    val viewModel: JobDetailsViewModel = viewModel(
        key = "job-details-$jobId",
        factory = remember(repository) {
            JobDetailsViewModel.factory(repository)
        }
    )
    val state by viewModel.state.collectAsStateWithLifecycleCompat()
    var showProposal by rememberSaveable(jobId) { mutableStateOf(false) }

    LaunchedEffect(jobId) {
        viewModel.load(jobId)
    }

    when {
        state.isLoading -> {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }

        state.errorMessage != null && state.job == null -> {
            Box(
                Modifier.fillMaxSize().padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "Project unavailable",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        state.errorMessage.orEmpty(),
                        Modifier.padding(top = 8.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        state.job != null -> {
            val job = state.job!!
            Column(
                Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                Text(
                    job.title.orEmpty(),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.ExtraBold
                )

                Row(
                    Modifier.padding(top = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AssistChip(
                        onClick = {},
                        label = { Text(formatJobBudget(job)) }
                    )
                    job.category?.takeIf { it.isNotBlank() }?.let {
                        AssistChip(onClick = {}, label = { Text(it) })
                    }
                }

                job.description?.takeIf { it.isNotBlank() }?.let { description ->
                    Surface(
                        Modifier
                            .fillMaxWidth()
                            .padding(top = 14.dp),
                        shape = RoundedCornerShape(18.dp),
                        color = MaterialTheme.colorScheme.surface
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Text(
                                "Project brief",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                description.replace(Regex("<[^>]*>"), " ")
                                    .replace(Regex("[[:space:]]+"), " ")
                                    .trim(),
                                Modifier.padding(top = 7.dp),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                if (job.skills.isNotEmpty()) {
                    Text(
                        "Skills",
                        Modifier.padding(top = 18.dp),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Row(
                        Modifier.padding(top = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        job.skills.take(6).forEach {
                            AssistChip(onClick = {}, label = { Text(it) })
                        }
                    }
                }

                Text(
                    if (state.submitted) "Proposal already submitted" else "Ready to submit a proposal?",
                    Modifier.padding(top = 20.dp),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                if (state.errorMessage != null) {
                    Text(
                        state.errorMessage.orEmpty(),
                        Modifier.padding(top = 7.dp),
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                }

                Button(
                    onClick = { showProposal = true },
                    enabled = !state.submitted && !state.isSubmitting,
                    Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp)
                ) {
                    Text(if (state.submitted) "Proposal submitted" else "Submit Proposal")
                }
            }

            if (showProposal && !state.submitted) {
                ProposalDialog(
                    job = job,
                    onDismiss = { showProposal = false },
                    onSubmit = { request ->
                        showProposal = false
                        viewModel.submit(job.id.orEmpty(), request)
                    }
                )
            }
        }
    }
}

@Composable
private fun ProposalDialog(
    job: Job,
    onDismiss: () -> Unit,
    onSubmit: (SubmitBidRequest) -> Unit
) {
    var amount by rememberSaveable(job.id) {
        mutableStateOf(
            (job.fixedBudget ?: job.budget.takeIf { it > 0 } ?: job.maximumBudget ?: 0.0)
                .let { value -> if (value == 0.0) "" else value.toInt().toString() }
        )
    }
    var days by rememberSaveable(job.id) { mutableStateOf("3") }
    var letter by rememberSaveable(job.id) { mutableStateOf("") }
    var error by rememberSaveable(job.id) { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Submit Proposal") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it.filter { ch -> ch.isDigit() || ch == '.' } },
                    label = { Text("Your price (₹)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true
                )
                OutlinedTextField(
                    value = days,
                    onValueChange = { days = it.filter(Char::isDigit) },
                    label = { Text("Delivery days") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true
                )
                OutlinedTextField(
                    value = letter,
                    onValueChange = { letter = it.take(1200) },
                    label = { Text("Cover letter") },
                    minLines = 4,
                    maxLines = 6
                )
                if (error.isNotBlank()) {
                    Text(error, color = MaterialTheme.colorScheme.error)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val parsedAmount = amount.toDoubleOrNull()
                    val parsedDays = days.toIntOrNull()
                    error = when {
                        parsedAmount == null || parsedAmount <= 0 -> "Enter a valid proposal amount."
                        parsedDays == null || parsedDays <= 0 -> "Enter a valid delivery time."
                        letter.trim().length < 10 -> "Add at least 10 characters about your approach."
                        else -> {
                            onSubmit(
                                SubmitBidRequest(
                                    proposedAmount = parsedAmount,
                                    deliveryDays = parsedDays,
                                    coverLetter = letter.trim()
                                )
                            )
                            ""
                        }
                    }
                }
            ) {
                Text("Send proposal")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

private fun formatJobBudget(job: Job): String {
    val fixed = job.fixedBudget
    val minimum = job.minimumBudget
    val maximum = job.maximumBudget

    return when {
        fixed != null && fixed > 0 -> "₹" + money(fixed)
        minimum != null && maximum != null && minimum > 0 && maximum > 0 ->
            "₹" + money(minimum) + "–₹" + money(maximum)
        job.budget > 0 -> "₹" + money(job.budget)
        else -> "Budget on request"
    }
}

private fun money(value: Double): String =
    NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")).format(value)
