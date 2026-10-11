package com.skilllaunch.app.feature.job

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.skilllaunch.app.R
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
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
import androidx.compose.material3.AssistChip
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

            repository.getJobs(query)
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
    val pageBackground = if (darkTheme) Color(0xFF1A1A1D) else Color(0xFFF8F7FA)
    val cardBackground = if (darkTheme) Color(0xFF262629) else Color.White
    val searchBackground = if (darkTheme) Color(0xFF262629) else Color(0xFFE8E7EA)
    val textPrimary = if (darkTheme) Color.White else Color(0xFF17171A)
    val textMuted = if (darkTheme) Color(0xFFAAA9AE) else Color(0xFF77767D)
    val lavender = Color(0xFFD4C6FF)

    val categoryOptions = remember(state.jobs) {
        state.jobs.mapNotNull { it.category?.trim()?.takeIf(String::isNotBlank) }
            .distinctBy { it.lowercase(Locale.ROOT) }
            .take(6)
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
        LazyColumn(
            modifier = Modifier.fillMaxSize().background(pageBackground),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(15.dp)
        ) {
            item(key = "explore-hero") {
                ExploreJobsHero(
                    darkTheme = darkTheme,
                    textPrimary = textPrimary,
                    textMuted = textMuted,
                    lavender = lavender
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
                            "EXPLORE BY CATEGORY",
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
                            "YOUR NEXT STEP",
                            color = if (darkTheme) lavender else Color(0xFF6F56B8),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 1.0.sp
                        )
                        Text(
                            "Projects to explore",
                            color = textPrimary,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text(
                            visibleJobs.size.toString() + " projects shown",
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
    lavender: Color
) {
    val heroStart = if (darkTheme) Color(0xFF292632) else Color(0xFFEDE7FF)
    val heroEnd = if (darkTheme) Color(0xFF24332F) else Color(0xFFDDF5ED)

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(28.dp),
        color = heroStart,
        border = BorderStroke(1.dp, lavender.copy(alpha = if (darkTheme) 0.30f else 0.72f))
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.linearGradient(listOf(heroStart, heroEnd)))
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(18.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(999.dp),
                        color = lavender.copy(alpha = if (darkTheme) 0.16f else 0.92f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.AutoAwesome,
                                contentDescription = null,
                                modifier = Modifier.size(13.dp),
                                tint = if (darkTheme) lavender else Color(0xFF5C48B9)
                            )
                            Text(
                                "SKILL-FIRST DISCOVERY",
                                color = if (darkTheme) lavender else Color(0xFF5C48B9),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 0.3.sp,
                                maxLines = 1
                            )
                        }
                    }

                    Text(
                        "Find your next\nbig opportunity",
                        color = textPrimary,
                        style = TextStyle(
                            fontFamily = FontFamily.Serif,
                            fontSize = 27.sp,
                            lineHeight = 30.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = (-0.7).sp
                        )
                    )
                    Text(
                        "Explore real client projects and pitch with confidence.",
                        color = textMuted,
                        style = MaterialTheme.typography.bodySmall,
                        lineHeight = 18.sp
                    )
                    Text(
                        "EXPLORE  •  LEARN  •  EARN",
                        color = if (darkTheme) Color(0xFFB9E7D5) else Color(0xFF26765E),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.4.sp
                    )
                }

                Box(
                    modifier = Modifier.size(102.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Surface(
                        modifier = Modifier.size(88.dp),
                        shape = CircleShape,
                        color = Color.White.copy(alpha = if (darkTheme) 0.06f else 0.45f)
                    ) {}
                    AsyncImage(
                        model = R.raw.student_domain_ai,
                        contentDescription = "Abstract illustration for student job discovery",
                        modifier = Modifier.size(108.dp),
                        contentScale = ContentScale.Fit
                    )
                }
            }
        }
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
    val borderColor = if (darkTheme) Color(0xFF403B4C) else Color(0xFFD9D2ED)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(58.dp)
            .clip(RoundedCornerShape(30.dp))
            .background(searchBackground)
            .border(1.dp, borderColor, RoundedCornerShape(30.dp))
            .padding(start = 17.dp, end = 7.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Outlined.Search,
            contentDescription = null,
            modifier = Modifier.size(21.dp),
            tint = textMuted
        )
        Spacer(Modifier.width(10.dp))
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
            textStyle = TextStyle(color = textPrimary, fontSize = 14.sp),
            decorationBox = { innerTextField ->
                Box {
                    if (value.isBlank()) {
                        Text(
                            "Search projects, skills or keywords",
                            color = textMuted,
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
            modifier = Modifier.size(42.dp),
            shape = CircleShape,
            color = Color(0xFFD4C6FF)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Outlined.Search,
                    contentDescription = "Search projects",
                    modifier = Modifier.size(19.dp),
                    tint = Color(0xFF17171A)
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
    val unselectedColor = if (darkTheme) Color(0xFF262629) else Color(0xFFE8E7EA)
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(999.dp),
        color = if (selected) lavender else unselectedColor,
        border = BorderStroke(
            1.dp,
            if (selected) lavender else if (darkTheme) Color(0xFF3A393E) else Color(0xFFDEDAE7)
        )
    ) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp),
            color = if (selected) Color(0xFF17171A) else if (darkTheme) textPrimary else textMuted,
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
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(14.dp),
        color = if (darkTheme) Color(0xFF262629) else Color(0xFFE8E7EA),
        border = BorderStroke(1.dp, lavender.copy(alpha = if (darkTheme) 0.32f else 0.72f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 11.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Outlined.Tune,
                contentDescription = "Change sort order",
                modifier = Modifier.size(15.dp),
                tint = if (darkTheme) lavender else Color(0xFF5C48B9)
            )
            Text(
                sortMode,
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
            AsyncImage(
                model = R.raw.student_domain_ai,
                contentDescription = null,
                modifier = Modifier.size(110.dp),
                contentScale = ContentScale.Fit
            )
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
    val borderColor = if (darkTheme) tint.copy(alpha = 0.38f) else tint.copy(alpha = 0.90f)
    val cardBackground = if (darkTheme) Color(0xFF262629) else Color.White

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(25.dp),
        color = cardBackground,
        border = BorderStroke(1.dp, borderColor)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(70.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(tint.copy(alpha = if (darkTheme) 0.18f else 0.56f)),
                    contentAlignment = Alignment.Center
                ) {
                    AsyncImage(
                        model = jobIllustrationResource(job),
                        contentDescription = (job.category ?: "Project") + " illustration",
                        modifier = Modifier.size(66.dp),
                        contentScale = ContentScale.Fit
                    )
                }

                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    job.category?.takeIf(String::isNotBlank)?.let { category ->
                        Text(
                            category.uppercase(Locale.ROOT),
                            color = if (darkTheme) lavender else Color(0xFF6F56B8),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 0.7.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Text(
                        job.title ?: "Untitled project",
                        color = textPrimary,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        lineHeight = 21.sp
                    )
                    Text(
                        job.client?.fullName?.takeIf(String::isNotBlank) ?: "Client project",
                        color = textMuted,
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            job.description?.takeIf(String::isNotBlank)?.let { description ->
                Text(
                    description.replace(Regex("<[^>]*>"), " ").replace(Regex("\\s+"), " ").trim().take(150),
                    color = textMuted,
                    style = MaterialTheme.typography.bodySmall,
                    lineHeight = 18.sp,
                    maxLines = 3,
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
                            shape = RoundedCornerShape(10.dp),
                            color = tint.copy(alpha = if (darkTheme) 0.18f else 0.42f)
                        ) {
                            Text(
                                skill,
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 6.dp),
                                color = if (darkTheme) Color.White else Color(0xFF292336),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1
                            )
                        }
                    }
                }
            }

            if (!job.projectType.isNullOrBlank() || job.bids.isNotEmpty()) {
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(7.dp)
                ) {
                    job.projectType?.takeIf(String::isNotBlank)?.let { projectType ->
                        JobMetadataPill(
                            label = displayJobToken(projectType),
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
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Bottom
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "PROJECT BUDGET",
                        color = textMuted,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 0.7.sp
                    )
                    Text(
                        formatJobBudget(job),
                        modifier = Modifier.padding(top = 3.dp),
                        color = if (darkTheme) Color(0xFFB9E7D5) else Color(0xFF26765E),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                job.timeline?.takeIf(String::isNotBlank)?.let { timeline ->
                    Column(
                        horizontalAlignment = Alignment.End,
                        modifier = Modifier.padding(start = 8.dp)
                    ) {
                        Text(
                            "TIMELINE",
                            color = textMuted,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 0.7.sp
                        )
                        Text(
                            displayJobToken(timeline),
                            modifier = Modifier.padding(top = 3.dp),
                            color = textPrimary,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1
                        )
                    }
                }
            }

            Button(
                onClick = onSubmit,
                enabled = !submitted,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(17.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = lavender,
                    contentColor = Color(0xFF17171A),
                    disabledContainerColor = lavender.copy(alpha = 0.38f),
                    disabledContentColor = Color(0xFF17171A).copy(alpha = 0.62f)
                )
            ) {
                Text(if (submitted) "Proposal submitted" else "Pitch for this project  →", fontWeight = FontWeight.Bold)
            }
        }
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
        color = accent.copy(alpha = if (darkTheme) 0.14f else 0.45f),
        border = BorderStroke(1.dp, accent.copy(alpha = 0.40f))
    ) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            color = if (darkTheme) Color.White else textMuted,
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

private fun jobIllustrationResource(job: Job): Int {
    val searchText = listOfNotNull(job.category, job.subcategory, job.title)
        .joinToString(" ")
        .lowercase(Locale.ROOT)

    return when {
        "ai" in searchText || "data" in searchText || "machine learning" in searchText ->
            R.raw.student_domain_ai
        "design" in searchText || "creative" in searchText || "graphic" in searchText || "ui/" in searchText ->
            R.raw.student_domain_design
        "writing" in searchText || "content" in searchText || "research" in searchText || "translation" in searchText ->
            R.raw.student_domain_content
        "video" in searchText || "audio" in searchText || "animation" in searchText ->
            R.raw.student_domain_video
        "develop" in searchText || "software" in searchText || "program" in searchText || "coding" in searchText || "technology" in searchText ->
            R.raw.student_domain_web
        else -> R.raw.student_domain_business
    }
}

private fun jobCategoryAccent(category: String): Color {
    val normalized = category.lowercase(Locale.ROOT)
    return when {
        "design" in normalized || "creative" in normalized -> Color(0xFFE7DCFF)
        "writing" in normalized || "content" in normalized || "research" in normalized -> Color(0xFFFFE3D0)
        "ai" in normalized || "data" in normalized -> Color(0xFFDCEAFF)
        "video" in normalized || "marketing" in normalized -> Color(0xFFFFEAC1)
        else -> Color(0xFFD7F2E8)
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
