package com.skilllaunch.app.feature.job

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Code
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Palette
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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

data class JobDiscoveryUiState(
    val isLoading: Boolean = true,
    val jobs: List<Job> = emptyList(),
    val errorMessage: String? = null
)

private class JobDiscoveryViewModel(
    private val repository: JobRepository
) : ViewModel() {
    private val _state = MutableStateFlow(JobDiscoveryUiState())
    val state = _state.asStateFlow()

    fun load(query: String? = null) {
        viewModelScope.launch {
            _state.value = _state.value.copy(
                isLoading = true,
                errorMessage = null
            )

            repository.getAllJobs(query)
                .onSuccess { response ->
                    _state.value = JobDiscoveryUiState(
                        isLoading = false,
                        jobs = response.jobs
                    )
                }
                .onFailure { error ->
                    _state.value = JobDiscoveryUiState(
                        isLoading = false,
                        jobs = _state.value.jobs,
                        errorMessage = error.message ?: "Unable to load projects."
                    )
                }
        }
    }

    fun clearError() {
        _state.value = _state.value.copy(errorMessage = null)
    }

    fun submitBid(
        jobId: String,
        request: SubmitBidRequest,
        onComplete: () -> Unit
    ) {
        viewModelScope.launch {
            repository.submitBid(jobId, request)
                .onSuccess {
                    _state.value = _state.value.copy(
                        jobs = _state.value.jobs.map { job ->
                            if (job.id == jobId) {
                                job.copy(viewerBid = job.viewerBid ?: com.skilllaunch.app.data.model.job.JobViewerBid())
                            } else {
                                job
                            }
                        }
                    )
                    onComplete()
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
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
                    JobDiscoveryViewModel(repository) as T
            }
    }
}


@Composable
fun JobDiscoveryScreen(
    repository: JobRepository
) {
    val viewModel: JobDiscoveryViewModel = viewModel(
        factory = remember(repository) {
            JobDiscoveryViewModel.factory(repository)
        }
    )
    val state by viewModel.state.collectAsStateWithLifecycleCompat()

    var search by rememberSaveable { mutableStateOf("") }
    var submittedIds by rememberSaveable { mutableStateOf(setOf<String>()) }
    var dialogJob by remember { mutableStateOf<Job?>(null) }
    var selectedCategory by rememberSaveable { mutableStateOf("All") }
    var sortMode by rememberSaveable { mutableStateOf("Newest") }

    LaunchedEffect(Unit) {
        viewModel.load()
    }

    // Match onboarding's palette and respect the app's in-app theme toggle.
    val darkTheme = MaterialTheme.colorScheme.background.luminance() < 0.5f
    val pageBackground = if (darkTheme) Color(0xFF0B1020) else Color(0xFFF7F5FB)
    val cardBackground = if (darkTheme) Color(0xED151E31) else Color(0xEFFFFFFF)
    val searchBackground = if (darkTheme) Color(0xB51C2740) else Color(0xDFFFFFFF)
    val textPrimary = MaterialTheme.colorScheme.onBackground
    val textMuted = MaterialTheme.colorScheme.onSurfaceVariant
    val lavender = if (darkTheme) Color(0xFFB7A8FF) else Color(0xFF6757D9)

    val categoryOptions = remember(state.jobs) {
        state.jobs.mapNotNull { it.category?.trim()?.takeIf(String::isNotBlank) }
            .distinctBy { it.lowercase(Locale.ROOT) }
            .sortedBy { it.lowercase(Locale.ROOT) }
    }
    val visibleJobs = remember(state.jobs, selectedCategory, sortMode) {
        val matching = state.jobs.filter { job ->
            selectedCategory == "All" ||
                job.category?.equals(selectedCategory, ignoreCase = true) == true
        }
        when (sortMode) {
            "Highest budget" -> matching.sortedByDescending { jobBudgetValue(it) }
            "Lowest budget" -> matching.sortedBy { jobBudgetValue(it) }
            else -> matching.sortedByDescending { it.createdAt.orEmpty() }
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = pageBackground
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = if (darkTheme) {
                            listOf(Color(0xFF090F1F), Color(0xFF11172A), Color(0xFF0B1020))
                        } else {
                            listOf(Color(0xFFFFFEFF), Color(0xFFF8F6FC), Color(0xFFF0EDFA))
                        }
                    )
                )
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 22.dp, bottom = 26.dp),
                verticalArrangement = Arrangement.spacedBy(19.dp)
            ) {
            item(key = "explore-hero") {
                ExploreJobsHero(
                    darkTheme = darkTheme,
                    textPrimary = textPrimary,
                    textMuted = textMuted,
                    domainCount = categoryOptions.size
                )
            }

            item(key = "explore-search") {
                JobSearchField(
                    value = search,
                    darkTheme = darkTheme,
                    searchBackground = searchBackground,
                    textPrimary = textPrimary,
                    textMuted = textMuted,
                    onValueChange = { search = it },
                    onSearch = {
                        selectedCategory = "All"
                        viewModel.clearError()
                        viewModel.load(search)
                    }
                )
            }

            if (categoryOptions.isNotEmpty()) {
                item(key = "explore-categories") {
                    Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
                        Text(
                            "BROWSE BY SPECIALTY",
                            color = if (darkTheme) lavender else Color(0xFF6F56B8),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 1.0.sp
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            JobCategoryChip(
                                label = "All",
                                selected = selectedCategory == "All",
                                darkTheme = darkTheme,
                                lavender = lavender,
                                textPrimary = textPrimary,
                                textMuted = textMuted,
                                onClick = { selectedCategory = "All" }
                            )
                            categoryOptions.forEach { category ->
                                JobCategoryChip(
                                    label = category,
                                    selected = selectedCategory.equals(category, ignoreCase = true),
                                    darkTheme = darkTheme,
                                    lavender = lavender,
                                    textPrimary = textPrimary,
                                    textMuted = textMuted,
                                    onClick = { selectedCategory = category }
                                )
                            }
                        }
                    }
                }
            }

            item(key = "explore-feed-heading") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(3.dp)
                    ) {
                        Text(
                            "OPPORTUNITIES, OPEN NOW",
                            color = if (darkTheme) lavender else Color(0xFF6F56B8),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 1.0.sp
                        )
                        Text(
                            "Open opportunities",
                            color = textPrimary,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text(
                            visibleJobs.size.toString() + " opportunities available",
                            color = textMuted,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }

                    if (state.jobs.isNotEmpty()) {
                        JobSortChip(
                            sortMode = sortMode,
                            darkTheme = darkTheme,
                            textPrimary = textPrimary,
                            lavender = lavender,
                            onClick = {
                                sortMode = when (sortMode) {
                                    "Newest" -> "Highest budget"
                                    "Highest budget" -> "Lowest budget"
                                    else -> "Newest"
                                }
                            }
                        )
                    }
                }
            }

            if (state.isLoading && state.jobs.isEmpty()) {
                item(key = "explore-loading") {
                    JobFeedLoadingState(
                        darkTheme = darkTheme,
                        cardBackground = cardBackground,
                        textPrimary = textPrimary,
                        textMuted = textMuted,
                        lavender = lavender
                    )
                }
            } else if (state.errorMessage != null && state.jobs.isEmpty()) {
                item(key = "explore-error") {
                    JobFeedErrorState(
                        message = state.errorMessage.orEmpty(),
                        darkTheme = darkTheme,
                        cardBackground = cardBackground,
                        textPrimary = textPrimary,
                        textMuted = textMuted,
                        lavender = lavender,
                        onRetry = {
                            viewModel.clearError()
                            viewModel.load(search)
                        }
                    )
                }
            } else if (state.jobs.isEmpty()) {
                item(key = "explore-empty") {
                    JobFeedEmptyState(
                        filteredCategory = null,
                        darkTheme = darkTheme,
                        cardBackground = cardBackground,
                        textPrimary = textPrimary,
                        textMuted = textMuted,
                        lavender = lavender,
                        onAction = {
                            viewModel.clearError()
                            viewModel.load(search)
                        }
                    )
                }
            } else if (visibleJobs.isEmpty()) {
                item(key = "explore-filter-empty") {
                    JobFeedEmptyState(
                        filteredCategory = selectedCategory,
                        darkTheme = darkTheme,
                        cardBackground = cardBackground,
                        textPrimary = textPrimary,
                        textMuted = textMuted,
                        lavender = lavender,
                        onAction = { selectedCategory = "All" }
                    )
                }
            } else {
                if (state.isLoading) {
                    item(key = "explore-refreshing") {
                        LinearProgressIndicator(
                            modifier = Modifier.fillMaxWidth().height(3.dp),
                            color = if (darkTheme) lavender else Color(0xFF6F56B8),
                            trackColor = if (darkTheme) Color(0xFF3A393E) else Color(0xFFE0DFE2)
                        )
                    }
                }

                items(
                    items = visibleJobs,
                    key = { it.id ?: it.title.orEmpty() }
                ) { job ->
                    JobCard(
                        job = job,
                        submitted = job.id?.let(submittedIds::contains) == true || job.viewerBid != null,
                        darkTheme = darkTheme,
                        textPrimary = textPrimary,
                        textMuted = textMuted,
                        lavender = lavender,
                        onSubmit = { dialogJob = job }
                    )
                }

                if (state.errorMessage != null) {
                    item(key = "explore-inline-error") {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = if (darkTheme) Color(0xFF3A252A) else Color(0xFFFFE6E6),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                state.errorMessage.orEmpty(),
                                modifier = Modifier.padding(14.dp),
                                color = if (darkTheme) Color(0xFFFFC8C8) else Color(0xFF8C3030),
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }
            }
        }
    }
    }

    dialogJob?.let { job ->
        ProposalDialog(
            job = job,
            onDismiss = { dialogJob = null },
            onSubmit = { request ->
                val id = job.id
                if (id == null) return@ProposalDialog
                viewModel.submitBid(id, request) {
                    submittedIds = submittedIds + id
                    dialogJob = null
                }
            }
        )
    }
}

@Composable
private fun ExploreJobsHero(
    darkTheme: Boolean,
    textPrimary: Color,
    textMuted: Color,
    domainCount: Int
) {
    val accent = if (darkTheme) Color(0xFFB7A8FF) else Color(0xFF6757D9)
    val hairline = if (darkTheme) Color.White.copy(alpha = 0.13f) else Color(0xFF7165B8).copy(alpha = 0.14f)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 1.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .width(22.dp)
                        .height(2.dp)
                        .clip(CircleShape)
                        .background(accent)
                )
                Text(
                    "SKILLLAUNCH  /  DISCOVER",
                    color = accent,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.25.sp
                )
            }

            Surface(
                shape = RoundedCornerShape(999.dp),
                color = if (darkTheme) Color.White.copy(alpha = 0.055f) else Color.White.copy(alpha = 0.72f),
                border = BorderStroke(1.dp, hairline)
            ) {
                Text(
                    if (domainCount > 0) "$domainCount fields" else "Discover",
                    modifier = Modifier.padding(horizontal = 11.dp, vertical = 7.dp),
                    color = textMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1
                )
            }
        }

        Text(
            "Find work that\nmoves you.",
            color = textPrimary,
            style = TextStyle(
                fontFamily = FontFamily.Default,
                fontSize = 31.sp,
                lineHeight = 35.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = (-0.9).sp
            ),
            maxLines = 2
        )

        Text(
            "Meaningful projects. Real clients. Room to grow.",
            color = textMuted,
            style = MaterialTheme.typography.bodyMedium,
            lineHeight = 21.sp
        )
    }
}

@Composable
private fun JobSearchField(
    value: String,
    darkTheme: Boolean,
    searchBackground: Color,
    textPrimary: Color,
    textMuted: Color,
    onValueChange: (String) -> Unit,
    onSearch: () -> Unit
) {
    val shape = RoundedCornerShape(24.dp)
    val borderColor = if (darkTheme) {
        Color.White.copy(alpha = 0.13f)
    } else {
        Color(0xFF8D82C0).copy(alpha = 0.16f)
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(60.dp)
            .shadow(11.dp, shape, clip = false)
            .clip(shape)
            .background(searchBackground)
            .border(1.dp, borderColor, shape)
            .padding(start = 17.dp, end = 7.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Outlined.Search,
            contentDescription = null,
            modifier = Modifier.size(21.dp),
            tint = textMuted
        )
        Spacer(Modifier.width(11.dp))
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.weight(1f),
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Search
            ),
            keyboardActions = androidx.compose.foundation.text.KeyboardActions(
                onSearch = { onSearch() }
            ),
            textStyle = TextStyle(
                color = textPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            ),
            decorationBox = { innerTextField ->
                Box {
                    if (value.isBlank()) {
                        Text(
                            "Search projects, skills or keywords",
                            color = textMuted.copy(alpha = 0.88f),
                            fontSize = 13.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    innerTextField()
                }
            }
        )
        Spacer(Modifier.width(8.dp))
        Surface(
            onClick = onSearch,
            modifier = Modifier.size(44.dp),
            shape = CircleShape,
            color = if (darkTheme) Color(0xFFB7A8FF) else Color(0xFFE9E4FF),
            border = BorderStroke(
                1.dp,
                if (darkTheme) Color.White.copy(alpha = 0.24f) else Color(0xFFB6A8F3).copy(alpha = 0.55f)
            )
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Outlined.Search,
                    contentDescription = "Search projects",
                    modifier = Modifier.size(19.dp),
                    tint = if (darkTheme) Color(0xFF211A45) else Color(0xFF4B3AA6)
                )
            }
        }
    }
}

@Composable
private fun JobCategoryChip(
    label: String,
    selected: Boolean,
    darkTheme: Boolean,
    lavender: Color,
    textPrimary: Color,
    textMuted: Color,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(999.dp)
    val borderColor = when {
        selected -> lavender.copy(alpha = if (darkTheme) 0.95f else 0.78f)
        darkTheme -> Color.White.copy(alpha = 0.12f)
        else -> Color(0xFF8B80B5).copy(alpha = 0.16f)
    }
    val chipColor = when {
        selected && darkTheme -> lavender.copy(alpha = 0.20f)
        selected -> Color(0xFFE9E4FF)
        darkTheme -> Color.White.copy(alpha = 0.055f)
        else -> Color.White.copy(alpha = 0.78f)
    }

    Surface(
        onClick = onClick,
        modifier = if (selected) Modifier.shadow(6.dp, shape, clip = false) else Modifier,
        shape = shape,
        color = chipColor,
        border = BorderStroke(if (selected) 1.2.dp else 1.dp, borderColor)
    ) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 15.dp, vertical = 10.dp),
            color = if (selected) {
                if (darkTheme) Color(0xFFF8F5FF) else Color(0xFF423487)
            } else {
                if (darkTheme) textPrimary else textMuted
            },
            fontSize = 12.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
            maxLines = 1
        )
    }
}

@Composable
private fun JobSortChip(
    sortMode: String,
    darkTheme: Boolean,
    textPrimary: Color,
    lavender: Color,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(17.dp)
    Surface(
        onClick = onClick,
        modifier = Modifier.shadow(6.dp, shape, clip = false),
        shape = shape,
        color = if (darkTheme) Color.White.copy(alpha = 0.055f) else Color.White.copy(alpha = 0.78f),
        border = BorderStroke(
            1.dp,
            if (darkTheme) Color.White.copy(alpha = 0.13f) else Color(0xFF8B80B5).copy(alpha = 0.16f)
        )
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 11.dp),
            horizontalArrangement = Arrangement.spacedBy(7.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Outlined.Tune,
                contentDescription = "Change sort order",
                modifier = Modifier.size(15.dp),
                tint = lavender
            )
            Text(
                when (sortMode) {
                    "Highest budget" -> "Budget: high"
                    "Lowest budget" -> "Budget: low"
                    else -> "Newest"
                },
                color = textPrimary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1
            )
        }
    }
}

@Composable
private fun JobFeedLoadingState(
    darkTheme: Boolean,
    cardBackground: Color,
    textPrimary: Color,
    textMuted: Color,
    lavender: Color
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = cardBackground,
        border = BorderStroke(1.dp, lavender.copy(alpha = 0.40f))
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                color = if (darkTheme) lavender else Color(0xFF6F56B8),
                strokeWidth = 2.5.dp
            )
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    "Finding fresh opportunities",
                    color = textPrimary,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "Loading open projects from the marketplace.",
                    color = textMuted,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun JobFeedErrorState(
    message: String,
    darkTheme: Boolean,
    cardBackground: Color,
    textPrimary: Color,
    textMuted: Color,
    lavender: Color,
    onRetry: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = cardBackground,
        border = BorderStroke(1.dp, lavender.copy(alpha = 0.42f))
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                "We couldn't load projects",
                color = textPrimary,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold
            )
            Text(message, color = textMuted, style = MaterialTheme.typography.bodySmall)
            Button(
                onClick = onRetry,
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = lavender,
                    contentColor = Color(0xFF17171A)
                )
            ) {
                Text("Try again", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun JobFeedEmptyState(
    filteredCategory: String?,
    darkTheme: Boolean,
    cardBackground: Color,
    textPrimary: Color,
    textMuted: Color,
    lavender: Color,
    onAction: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(26.dp),
        color = cardBackground,
        border = BorderStroke(1.dp, lavender.copy(alpha = 0.46f))
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(9.dp)
        ) {
            Surface(
                modifier = Modifier.size(60.dp),
                shape = RoundedCornerShape(20.dp),
                color = if (darkTheme) Color(0xFF302A42) else Color(0xFFF0ECFF)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Outlined.AutoAwesome,
                        contentDescription = null,
                        modifier = Modifier.size(28.dp),
                        tint = if (darkTheme) Color(0xFFC8B7FF) else Color(0xFF6F56B8)
                    )
                }
            }
            Text(
                if (filteredCategory == null) "Your next project is still out there" else "No projects in " + filteredCategory,
                color = textPrimary,
                style = TextStyle(
                    fontFamily = FontFamily.Serif,
                    fontSize = 23.sp,
                    lineHeight = 27.sp,
                    fontWeight = FontWeight.Bold
                ),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            Text(
                if (filteredCategory == null) {
                    "There are no open projects to show right now. Refresh the feed or check back soon."
                } else {
                    "Try another category to discover more opportunities."
                },
                color = textMuted,
                style = MaterialTheme.typography.bodySmall,
                lineHeight = 18.sp,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            Button(
                onClick = onAction,
                shape = RoundedCornerShape(18.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = lavender,
                    contentColor = Color(0xFF17171A)
                )
            ) {
                Text(if (filteredCategory == null) "Refresh projects" else "Show all projects", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun JobCard(
    job: Job,
    submitted: Boolean,
    darkTheme: Boolean,
    textPrimary: Color,
    textMuted: Color,
    lavender: Color,
    onSubmit: () -> Unit
) {
    val tint = jobCategoryAccent(job.category ?: job.subcategory.orEmpty())
    val shape = RoundedCornerShape(27.dp)
    val cardBackground = if (darkTheme) {
        Color(0xE8162034)
    } else {
        Color(0xEFFFFFFF)
    }
    val outline = if (darkTheme) {
        Color.White.copy(alpha = 0.13f)
    } else {
        Color(0xFF9387C5).copy(alpha = 0.15f)
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(12.dp, shape, clip = false),
        shape = shape,
        color = cardBackground,
        border = BorderStroke(1.dp, outline),
        tonalElevation = 0.dp
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(13.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                val iconShape = RoundedCornerShape(18.dp)
                Box(
                    modifier = Modifier
                        .size(50.dp)
                        .shadow(5.dp, iconShape, clip = false)
                        .clip(iconShape)
                        .background(
                            if (darkTheme) tint.copy(alpha = 0.16f)
                            else tint.copy(alpha = 0.10f)
                        )
                        .border(1.dp, tint.copy(alpha = 0.20f), iconShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = jobCategoryIcon(job.category ?: job.subcategory.orEmpty()),
                        contentDescription = job.category ?: "Project category",
                        modifier = Modifier.size(23.dp),
                        tint = tint
                    )
                }

                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            job.category?.takeIf(String::isNotBlank)?.uppercase(Locale.ROOT) ?: "OPEN PROJECT",
                            modifier = Modifier.weight(1f),
                            color = if (darkTheme) tint.copy(alpha = 0.95f) else tint,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 0.85.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (job.viewerBid != null || submitted) {
                            Surface(
                                shape = RoundedCornerShape(999.dp),
                                color = if (darkTheme) {
                                    Color(0xFF69D1BC).copy(alpha = 0.13f)
                                } else {
                                    Color(0xFFDDF5ED)
                                },
                                border = BorderStroke(1.dp, Color(0xFF258E7A).copy(alpha = 0.20f))
                            ) {
                                Text(
                                    "Pitched",
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                                    color = if (darkTheme) Color(0xFF9DE9D5) else Color(0xFF176D5C),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Text(
                        job.title ?: "Untitled project",
                        color = textPrimary,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis,
                        lineHeight = 22.sp
                    )

                    job.client?.fullName?.takeIf(String::isNotBlank)?.let { client ->
                        Text(
                            "Posted by $client",
                            color = textMuted,
                            style = MaterialTheme.typography.labelSmall,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }

            job.description?.takeIf(String::isNotBlank)?.let { description ->
                Text(
                    description.replace(Regex("<[^>]*>"), " ").replace(Regex("\\s+"), " ").trim(),
                    color = textMuted,
                    style = MaterialTheme.typography.bodySmall,
                    lineHeight = 19.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            if (job.skills.isNotEmpty()) {
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(7.dp)
                ) {
                    job.skills.take(4).forEach { skill ->
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = if (darkTheme) {
                                Color.White.copy(alpha = 0.065f)
                            } else {
                                Color(0xFFF0EDFA)
                            },
                            border = BorderStroke(
                                1.dp,
                                if (darkTheme) Color.White.copy(alpha = 0.08f)
                                else Color(0xFF8B80B5).copy(alpha = 0.09f)
                            )
                        ) {
                            Text(
                                skill,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                color = if (darkTheme) Color(0xFFDCD5FF) else Color(0xFF514774),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1
                            )
                        }
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(7.dp)
            ) {
                if (!job.timeline.isNullOrBlank()) {
                    JobMetadataPill(
                        label = displayJobToken(job.timeline),
                        darkTheme = darkTheme,
                        accent = tint,
                        textMuted = textMuted
                    )
                }
                if (job.bids.isNotEmpty()) {
                    JobMetadataPill(
                        label = job.bids.size.toString() + " proposals",
                        darkTheme = darkTheme,
                        accent = tint,
                        textMuted = textMuted
                    )
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(
                        if (darkTheme) Color.White.copy(alpha = 0.09f)
                        else Color(0xFF8B80B5).copy(alpha = 0.12f)
                    )
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    Text(
                        "PROJECT BUDGET",
                        color = textMuted,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 0.75.sp
                    )
                    Text(
                        formatJobBudget(job),
                        color = if (darkTheme) Color(0xFF91E2C9) else Color(0xFF14765D),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Button(
                    onClick = onSubmit,
                    enabled = !submitted,
                    shape = RoundedCornerShape(17.dp),
                    contentPadding = PaddingValues(horizontal = 13.dp, vertical = 0.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = lavender,
                        contentColor = if (darkTheme) Color(0xFF211A45) else Color.White,
                        disabledContainerColor = lavender.copy(alpha = 0.30f),
                        disabledContentColor = if (darkTheme) {
                            Color(0xFF211A45).copy(alpha = 0.76f)
                        } else {
                            Color(0xFF46378A).copy(alpha = 0.72f)
                        }
                    )
                ) {
                    Text(
                        if (submitted) "Pitched ✓" else "Pitch project  →",
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        maxLines = 1
                    )
                }
            }
        }
    }
}

private fun jobCategoryIcon(category: String): androidx.compose.ui.graphics.vector.ImageVector {
    val normalized = category.lowercase(Locale.ROOT)
    return when {
        "design" in normalized || "creative" in normalized || "ui" in normalized ->
            Icons.Outlined.Palette
        "writing" in normalized || "content" in normalized || "research" in normalized ||
            "education" in normalized || "translation" in normalized ->
            Icons.Outlined.Description
        "develop" in normalized || "software" in normalized || "program" in normalized ||
            "coding" in normalized || "technology" in normalized || "web" in normalized ->
            Icons.Outlined.Code
        else -> Icons.Outlined.AutoAwesome
    }
}

@Composable
private fun JobMetadataPill(
    label: String,
    darkTheme: Boolean,
    accent: Color,
    textMuted: Color
) {
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = accent.copy(alpha = if (darkTheme) 0.15f else 0.075f),
        border = BorderStroke(1.dp, accent.copy(alpha = if (darkTheme) 0.24f else 0.18f))
    ) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            color = if (darkTheme) Color(0xFFDAD5F7) else textMuted,
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1
        )
    }
}

private fun jobBudgetValue(job: Job): Double =
    job.fixedBudget?.takeIf { it > 0 } ?:
    job.budget.takeIf { it > 0 } ?:
    job.maximumBudget?.takeIf { it > 0 } ?:
    job.minimumBudget?.takeIf { it > 0 } ?: 0.0

private fun jobCategoryAccent(category: String): Color {
    val normalized = category.lowercase(Locale.ROOT)
    return when {
        "design" in normalized || "creative" in normalized || "ui" in normalized -> Color(0xFF8870DE)
        "writing" in normalized || "content" in normalized || "research" in normalized -> Color(0xFFC77A55)
        "ai" in normalized || "data" in normalized -> Color(0xFF4E8DCB)
        "video" in normalized || "marketing" in normalized -> Color(0xFFB18A39)
        "education" in normalized || "tutoring" in normalized -> Color(0xFF6C75CD)
        else -> Color(0xFF258E7A)
    }
}

private fun displayJobToken(value: String): String =
    value.trim()
        .replace('_', ' ')
        .replace('-', ' ')
        .lowercase(Locale.ROOT)
        .split(Regex("\\s+"))
        .filter(String::isNotBlank)
        .joinToString(" ") { token ->
            token.replaceFirstChar { char -> char.titlecase(Locale.ROOT) }
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
    var deliveryDays by rememberSaveable(job.id) { mutableStateOf("3") }
    var coverLetter by rememberSaveable(job.id) { mutableStateOf("") }
    var validation by rememberSaveable(job.id) { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Submit Proposal") },
        text = {
            Column(
                Modifier
                    .widthIn(max = 420.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    job.title.orEmpty(),
                    fontWeight = FontWeight.Bold
                )
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it.filter { ch -> ch.isDigit() || ch == '.' } },
                    label = { Text("Your price (₹)") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
                OutlinedTextField(
                    value = deliveryDays,
                    onValueChange = { deliveryDays = it.filter(Char::isDigit) },
                    label = { Text("Delivery days") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
                OutlinedTextField(
                    value = coverLetter,
                    onValueChange = { coverLetter = it.take(1200) },
                    label = { Text("Cover letter") },
                    minLines = 4,
                    maxLines = 6
                )
                validation.takeIf { it.isNotBlank() }?.let {
                    Text(it, color = MaterialTheme.colorScheme.error)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val parsedAmount = amount.toDoubleOrNull()
                    val parsedDays = deliveryDays.toIntOrNull()
                    validation = when {
                        parsedAmount == null || parsedAmount <= 0 -> "Enter a valid proposal amount."
                        parsedDays == null || parsedDays <= 0 -> "Enter a valid delivery time."
                        coverLetter.trim().length < 10 -> "Add at least 10 characters about your approach."
                        else -> {
                            onSubmit(
                                SubmitBidRequest(
                                    proposedAmount = parsedAmount,
                                    deliveryDays = parsedDays,
                                    coverLetter = coverLetter.trim()
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
