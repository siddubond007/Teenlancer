package com.skilllaunch.app.feature.job

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.skilllaunch.app.core.common.collectAsStateWithLifecycleCompat
import com.skilllaunch.app.data.model.job.CreateJobRequest
import com.skilllaunch.app.data.repository.job.JobRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PostJobUiState(
    val isSaving: Boolean = false,
    val successMessage: String? = null,
    val errorMessage: String? = null
)

private class PostJobViewModel(
    private val repository: JobRepository
) : ViewModel() {
    private val _state = MutableStateFlow(PostJobUiState())
    val state = _state.asStateFlow()

    fun create(
        title: String,
        category: String,
        description: String,
        budget: Double,
        skills: List<String>
    ) {
        viewModelScope.launch {
            _state.value = PostJobUiState(isSaving = true)
            repository.createJob(
                CreateJobRequest(
                    title = title.trim(),
                    category = category.trim(),
                    description = description.trim(),
                    skills = skills,
                    budget = budget
                )
            ).onSuccess {
                _state.value = PostJobUiState(
                    successMessage = it.message ?: "Project published successfully."
                )
            }.onFailure {
                _state.value = PostJobUiState(
                    errorMessage = it.message ?: "Unable to create the project."
                )
            }
        }
    }

    fun clearMessages() {
        _state.value = _state.value.copy(
            successMessage = null,
            errorMessage = null
        )
    }

    companion object {
        fun factory(repository: JobRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    PostJobViewModel(repository) as T
            }
    }
}

@Composable
fun PostJobScreen(
    repository: JobRepository,
    onCreated: () -> Unit
) {
    val viewModel: PostJobViewModel = viewModel(
        factory = remember(repository) { PostJobViewModel.factory(repository) }
    )
    val state by viewModel.state.collectAsStateWithLifecycleCompat()

    var title by rememberSaveable { mutableStateOf("") }
    var category by rememberSaveable { mutableStateOf("") }
    var description by rememberSaveable { mutableStateOf("") }
    var budget by rememberSaveable { mutableStateOf("") }
    var skills by rememberSaveable { mutableStateOf("") }
    var validation by rememberSaveable { mutableStateOf("") }

    LaunchedEffect(state.successMessage) {
        if (!state.successMessage.isNullOrBlank()) {
            onCreated()
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                "Post a custom Job",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.ExtraBold
            )
            Text(
                "Describe the real project you need a student freelancer to complete.",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            OutlinedTextField(
                value = title,
                onValueChange = { title = it.take(160); validation = "" },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Project title") },
                singleLine = true
            )

            OutlinedTextField(
                value = category,
                onValueChange = { category = it.take(120); validation = "" },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Category") },
                singleLine = true,
                placeholder = { Text("Web Development") }
            )

            OutlinedTextField(
                value = description,
                onValueChange = { description = it.take(3000); validation = "" },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Project description") },
                minLines = 5,
                maxLines = 8
            )

            OutlinedTextField(
                value = skills,
                onValueChange = { skills = it.take(500); validation = "" },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Skills (comma separated)") },
                singleLine = true
            )

            OutlinedTextField(
                value = budget,
                onValueChange = { budget = it.filter { ch -> ch.isDigit() || ch == '.' }; validation = "" },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Budget (₹)") },
                singleLine = true
            )

            validation.takeIf { it.isNotBlank() }?.let {
                Text(it, color = MaterialTheme.colorScheme.error)
            }

            state.errorMessage?.takeIf { it.isNotBlank() }?.let {
                Text(it, color = MaterialTheme.colorScheme.error)
            }

            Button(
                onClick = {
                    val parsedBudget = budget.toDoubleOrNull()
                    validation = when {
                        title.trim().length < 5 -> "Add a clear project title."
                        category.trim().isBlank() -> "Choose a category."
                        description.trim().length < 20 -> "Add more detail so students can understand the project."
                        parsedBudget == null || parsedBudget <= 0 -> "Enter a valid budget."
                        else -> {
                            viewModel.clearMessages()
                            viewModel.create(
                                title = title,
                                category = category,
                                description = description,
                                budget = parsedBudget,
                                skills = skills.split(",")
                                    .map { it.trim() }
                                    .filter { it.isNotBlank() }
                                    .distinct()
                                    .take(10)
                            )
                            ""
                        }
                    }
                },
                enabled = !state.isSaving,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (state.isSaving) {
                    CircularProgressIndicator(
                        modifier = Modifier
                            .padding(vertical = 1.dp)
                            .padding(end = 8.dp),
                        strokeWidth = 2.dp
                    )
                }
                Text("Publish Job")
            }
        }
    }
}
