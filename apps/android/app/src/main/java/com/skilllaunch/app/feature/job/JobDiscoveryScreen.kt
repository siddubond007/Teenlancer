package com.skilllaunch.app.feature.job

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.Analytics
import androidx.compose.material.icons.outlined.Architecture
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material.icons.outlined.CloudQueue
import androidx.compose.material.icons.outlined.Computer
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Event
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.School
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material.icons.outlined.SportsEsports
import androidx.compose.material.icons.outlined.SupportAgent
import androidx.compose.material.icons.outlined.Translate
import androidx.compose.material.icons.outlined.Videocam
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.Bookmark
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.Campaign
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.RocketLaunch
import androidx.compose.material.icons.outlined.Smartphone
import androidx.compose.material.icons.outlined.Schedule
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
import androidx.compose.material3.FilterChip
import androidx.compose.material3.RadioButton
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.graphics.vector.ImageVector
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
    repository: JobRepository,
    onOpenJob: (String) -> Unit,
    onOpenNotifications: () -> Unit
) {
    val viewModel: JobDiscoveryViewModel = viewModel(
        factory = remember(repository) {
            JobDiscoveryViewModel.factory(repository)
        }
    )
    val state by viewModel.state.collectAsStateWithLifecycleCompat()
    val context = LocalContext.current
    val savedPreferences = remember(context) {
        context.getSharedPreferences("student_explore_saved_jobs", android.content.Context.MODE_PRIVATE)
    }

    var search by rememberSaveable { mutableStateOf("") }
    var selectedCategory by rememberSaveable { mutableStateOf("All") }
    var sortMode by rememberSaveable { mutableStateOf("Newest") }
    var selectedFeedTab by rememberSaveable { mutableStateOf("Explore") }
    var showFilterDialog by rememberSaveable { mutableStateOf(false) }
    var savedJobIds by remember {
        mutableStateOf(
            savedPreferences.getStringSet("saved_job_ids", mutableSetOf())
                ?.toSet()
                .orEmpty()
        )
    }

    LaunchedEffect(Unit) {
        viewModel.load()
    }

    val darkTheme = MaterialTheme.colorScheme.background.luminance() < 0.5f
    val textPrimary = MaterialTheme.colorScheme.onBackground
    val textMuted = MaterialTheme.colorScheme.onSurfaceVariant
    val lavender = if (darkTheme) Color(0xFFB7A8FF) else Color(0xFF6757D9)
    val pageBackground = if (darkTheme) Color(0xFF0B1020) else Color(0xFFF9F7FC)
    val cardBackground = if (darkTheme) Color(0xEB151E31) else Color(0xF7FFFFFF)
    val searchBackground = if (darkTheme) Color(0xB51C2740) else Color(0xEFFFFFFF)

    val categoryOptions = remember(state.jobs) {
        val available = state.jobs.mapNotNull {
            it.category?.trim()?.takeIf(String::isNotBlank)
        }.distinctBy { it.lowercase(Locale.ROOT) }
        val preferred = listOf(
            "Web Development",
            "Mobile App Development",
            "Design & Creative",
            "AI, Machine Learning & Data Science",
            "Digital Marketing & SEO"
        )
        preferred.filter { candidate ->
            available.any { it.equals(candidate, ignoreCase = true) }
        } + available
            .filterNot { candidate -> preferred.any { it.equals(candidate, ignoreCase = true) } }
            .sortedBy { it.lowercase(Locale.ROOT) }
    }

    val tabJobs = remember(state.jobs, selectedFeedTab, savedJobIds) {
        when (selectedFeedTab) {
            "Clients" -> state.jobs.filter { !it.client?.fullName.isNullOrBlank() }
            "Saved" -> state.jobs.filter { it.id != null && savedJobIds.contains(it.id) }
            "Applied" -> state.jobs.filter { it.viewerBid != null }
            else -> state.jobs
        }
    }
    val visibleJobs = remember(tabJobs, selectedCategory, sortMode) {
        val matching = tabJobs.filter { job ->
            selectedCategory == "All" ||
                job.category?.equals(selectedCategory, ignoreCase = true) == true
        }
        when (sortMode) {
            "Highest budget" -> matching.sortedByDescending { jobBudgetValue(it) }
            "Lowest budget" -> matching.sortedBy { jobBudgetValue(it) }
            else -> matching.sortedByDescending { it.createdAt.orEmpty() }
        }
    }

    fun toggleSaved(job: Job) {
        val id = job.id ?: return
        val next = if (savedJobIds.contains(id)) savedJobIds - id else savedJobIds + id
        savedJobIds = next
        savedPreferences.edit().putStringSet("saved_job_ids", next.toMutableSet()).apply()
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
                contentPadding = PaddingValues(
                    start = 16.dp,
                    end = 16.dp,
                    top = 18.dp,
                    bottom = 24.dp
                ),
                verticalArrangement = Arrangement.spacedBy(17.dp)
            ) {
                item(key = "explore-brand") {
                    ExploreBrandHeader(
                        darkTheme = darkTheme,
                        textPrimary = textPrimary,
                        onOpenNotifications = onOpenNotifications
                    )
                }

                item(key = "explore-tabs") {
                    ExploreTopTabs(
                        selected = selectedFeedTab,
                        darkTheme = darkTheme,
                        lavender = lavender,
                        onSelect = { selectedFeedTab = it }
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
                            selectedFeedTab = "Explore"
                            selectedCategory = "All"
                            viewModel.clearError()
                            viewModel.load(search)
                        },
                        onOpenFilters = { showFilterDialog = true }
                    )
                }

                if (categoryOptions.isNotEmpty()) {
                    item(key = "explore-categories") {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(9.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            ExploreCategoryTile(
                                label = "All",
                                selected = selectedCategory == "All",
                                icon = Icons.Outlined.GridView,
                                darkTheme = darkTheme,
                                index = 0,
                                onClick = { selectedCategory = "All" }
                            )
                            categoryOptions.forEachIndexed { index, category ->
                                ExploreCategoryTile(
                                    label = displayCategoryLabel(category),
                                    selected = selectedCategory.equals(category, ignoreCase = true),
                                    icon = jobCategoryIcon(category),
                                    darkTheme = darkTheme,
                                    index = index + 1,
                                    onClick = { selectedCategory = category }
                                )
                            }
                        }
                    }
                }

                item(key = "explore-feed-heading") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                visibleJobs.size.toString() + " opportunities",
                                color = textPrimary,
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = (-0.45).sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                when (selectedFeedTab) {
                                    "Clients" -> "Projects from clients on SkillLaunch."
                                    "Saved" -> "Your bookmarked opportunities."
                                    "Applied" -> "Projects where you've sent a proposal."
                                    else -> "Real client projects. Build your skills."
                                },
                                color = textMuted,
                                style = MaterialTheme.typography.bodySmall,
                                lineHeight = 18.sp
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
                    val emptyLabel = selectedCategory.takeIf { it != "All" } ?: selectedFeedTab
                    item(key = "explore-filter-empty") {
                        JobFeedEmptyState(
                            filteredCategory = emptyLabel.takeIf { it != "Explore" },
                            darkTheme = darkTheme,
                            cardBackground = cardBackground,
                            textPrimary = textPrimary,
                            textMuted = textMuted,
                            lavender = lavender,
                            onAction = {
                                selectedCategory = "All"
                                if (selectedFeedTab != "Explore") selectedFeedTab = "Explore"
                            }
                        )
                    }
                } else {
                    if (state.isLoading) {
                        item(key = "explore-refreshing") {
                            LinearProgressIndicator(
                                modifier = Modifier.fillMaxWidth().height(3.dp),
                                color = lavender,
                                trackColor = if (darkTheme) Color(0xFF293247) else Color(0xFFE4DFF3)
                            )
                        }
                    }

                    items(
                        items = visibleJobs,
                        key = { it.id ?: it.title.orEmpty() }
                    ) { job ->
                        JobCard(
                            job = job,
                            isSaved = job.id != null && savedJobIds.contains(job.id),
                            darkTheme = darkTheme,
                            textPrimary = textPrimary,
                            textMuted = textMuted,
                            lavender = lavender,
                            onToggleSaved = { toggleSaved(job) },
                            onOpenDetails = { job.id?.let(onOpenJob) }
                        )
                    }

                    if (state.errorMessage != null) {
                        item(key = "explore-inline-error") {
                            Surface(
                                shape = RoundedCornerShape(18.dp),
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

    if (showFilterDialog) {
        JobFilterDialog(
            sortMode = sortMode,
            onSortModeChange = { sortMode = it },
            onClearCategory = { selectedCategory = "All" },
            onDismiss = { showFilterDialog = false },
            darkTheme = darkTheme,
            lavender = lavender,
            textPrimary = textPrimary,
            textMuted = textMuted
        )
    }
}

@Composable
private fun ExploreBrandHeader(
    darkTheme: Boolean,
    textPrimary: Color,
    onOpenNotifications: () -> Unit
) {
    val accent = if (darkTheme) Color(0xFFB7A8FF) else Color(0xFF6757D9)
    val logoShape = RoundedCornerShape(16.dp)
    val notificationShape = CircleShape

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(9.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(39.dp)
                    .clip(logoShape)
                    .background(
                        Brush.linearGradient(
                            if (darkTheme) {
                                listOf(Color(0xFF5543B4), Color(0xFF8D7BF2))
                            } else {
                                listOf(Color(0xFF9C8BFF), Color(0xFF6F5BDE))
                            }
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Outlined.RocketLaunch,
                    contentDescription = "SkillLaunch",
                    modifier = Modifier.size(23.dp),
                    tint = Color.White
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "Skill",
                    color = textPrimary,
                    fontSize = 23.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = (-0.65).sp
                )
                Text(
                    "Launch",
                    color = accent,
                    fontSize = 23.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = (-0.65).sp
                )
            }
        }

        Surface(
            onClick = onOpenNotifications,
            modifier = Modifier.size(48.dp).shadow(6.dp, notificationShape, clip = false),
            shape = notificationShape,
            color = if (darkTheme) Color.White.copy(alpha = 0.07f) else Color.White.copy(alpha = 0.84f),
            border = BorderStroke(
                1.dp,
                if (darkTheme) Color.White.copy(alpha = 0.13f) else Color(0xFF8D82C0).copy(alpha = 0.12f)
            )
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Outlined.NotificationsNone,
                    contentDescription = "Notifications",
                    modifier = Modifier.size(23.dp),
                    tint = if (darkTheme) Color(0xFFE8E4FF) else Color(0xFF292642)
                )
                Box(
                    modifier = Modifier
                        .padding(top = 9.dp, start = 10.dp)
                        .size(7.dp)
                        .align(Alignment.TopEnd)
                        .clip(CircleShape)
                        .background(Color(0xFFED647B))
                )
            }
        }
    }
}

@Composable
private fun ExploreTopTabs(
    selected: String,
    darkTheme: Boolean,
    lavender: Color,
    onSelect: (String) -> Unit
) {
    val shape = RoundedCornerShape(999.dp)
    Surface(
        modifier = Modifier.fillMaxWidth().shadow(8.dp, shape, clip = false),
        shape = shape,
        color = if (darkTheme) Color.White.copy(alpha = 0.045f) else Color.White.copy(alpha = 0.68f),
        border = BorderStroke(
            1.dp,
            if (darkTheme) Color.White.copy(alpha = 0.10f) else Color(0xFF9386C4).copy(alpha = 0.08f)
        )
    ) {
        Row(
            modifier = Modifier.padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(2.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            listOf("Explore", "Clients", "Saved", "Applied").forEach { tab ->
                val active = tab == selected
                Surface(
                    onClick = { onSelect(tab) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(999.dp),
                    color = if (active) {
                        if (darkTheme) Color(0xFF392F67) else Color(0xFFF0ECFF)
                    } else Color.Transparent
                ) {
                    Text(
                        tab,
                        modifier = Modifier.padding(horizontal = 2.dp, vertical = 11.dp),
                        color = if (active) {
                            if (darkTheme) Color(0xFFDCD2FF) else Color(0xFF4A35C0)
                        } else {
                            if (darkTheme) Color(0xFFCBC9D9) else Color(0xFF706D81)
                        },
                        fontSize = 12.sp,
                        fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        maxLines = 1
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
    onSearch: () -> Unit,
    onOpenFilters: () -> Unit
) {
    val shape = RoundedCornerShape(30.dp)
    val borderColor = if (darkTheme) Color.White.copy(alpha = 0.12f) else Color(0xFF8D82C0).copy(alpha = 0.13f)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(60.dp)
            .shadow(12.dp, shape, clip = false)
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
            textStyle = TextStyle(color = textPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium),
            decorationBox = { innerTextField ->
                Box {
                    if (value.isBlank()) {
                        Text(
                            "Search projects, skills or keywords...",
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
        Spacer(Modifier.width(5.dp))
        Surface(
            onClick = onOpenFilters,
            modifier = Modifier.size(44.dp),
            shape = CircleShape,
            color = if (darkTheme) Color.White.copy(alpha = 0.09f) else Color(0xFFF0EDFF),
            border = BorderStroke(
                1.dp,
                if (darkTheme) Color.White.copy(alpha = 0.10f) else Color(0xFFB7A8F3).copy(alpha = 0.30f)
            )
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Outlined.Tune,
                    contentDescription = "Open filters",
                    modifier = Modifier.size(20.dp),
                    tint = if (darkTheme) Color(0xFFDCD2FF) else Color(0xFF4B3AA6)
                )
            }
        }
    }
}

@Composable
private fun ExploreCategoryTile(
    label: String,
    selected: Boolean,
    icon: ImageVector,
    darkTheme: Boolean,
    index: Int,
    onClick: () -> Unit
) {
    val accent = when (index % 5) {
        0 -> Color(0xFF7562E9)
        1 -> Color(0xFF2F6FB8)
        2 -> Color(0xFF168B77)
        3 -> Color(0xFFAA6A35)
        else -> Color(0xFFC14C8F)
    }
    val shape = RoundedCornerShape(18.dp)
    val selectedBackground = if (darkTheme) Color(0xFF493B86) else Color(0xFF8977F4)
    val idleBackground = when (index % 5) {
        0 -> if (darkTheme) Color(0xFF242A46) else Color(0xFFE7E9FF)
        1 -> if (darkTheme) Color(0xFF1C3045) else Color(0xFFE7F0FF)
        2 -> if (darkTheme) Color(0xFF18372F) else Color(0xFFE3F7F0)
        3 -> if (darkTheme) Color(0xFF3B2E28) else Color(0xFFFFEEE2)
        else -> if (darkTheme) Color(0xFF3B2538) else Color(0xFFFFE9F3)
    }

    Column(
        modifier = Modifier
            .width(64.dp)
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(54.dp)
                .shadow(if (selected) 9.dp else 3.dp, shape, clip = false)
                .clip(shape)
                .background(if (selected) selectedBackground else idleBackground)
                .border(
                    1.dp,
                    if (selected) accent.copy(alpha = 0.30f)
                    else Color.White.copy(alpha = if (darkTheme) 0.05f else 0.65f),
                    shape
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                modifier = Modifier.size(25.dp),
                tint = if (selected) Color.White else accent
            )
        }
        Text(
            label,
            color = if (selected) {
                if (darkTheme) Color(0xFFDCD2FF) else Color(0xFF4B3AA6)
            } else {
                if (darkTheme) Color(0xFFD5D4E1) else Color(0xFF38364B)
            },
            fontFamily = FontFamily.SansSerif,
            fontSize = 10.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
            letterSpacing = if (selected) 0.sp else (-0.1).sp,
            lineHeight = 12.sp,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.fillMaxWidth().height(25.dp)
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
    val shape = RoundedCornerShape(20.dp)
    Surface(
        onClick = onClick,
        modifier = Modifier.shadow(7.dp, shape, clip = false),
        shape = shape,
        color = if (darkTheme) Color.White.copy(alpha = 0.06f) else Color.White.copy(alpha = 0.82f),
        border = BorderStroke(
            1.dp,
            if (darkTheme) Color.White.copy(alpha = 0.12f) else Color(0xFF8D82C0).copy(alpha = 0.13f)
        )
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
                tint = lavender
            )
            Text(
                when (sortMode) {
                    "Highest budget" -> "Budget ↑"
                    "Lowest budget" -> "Budget ↓"
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
private fun JobFilterDialog(
    sortMode: String,
    onSortModeChange: (String) -> Unit,
    onClearCategory: () -> Unit,
    onDismiss: () -> Unit,
    darkTheme: Boolean,
    lavender: Color,
    textPrimary: Color,
    textMuted: Color
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Sort & refine", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
                Text("Sort opportunities by", color = textMuted, style = MaterialTheme.typography.labelMedium)
                listOf("Newest", "Highest budget", "Lowest budget").forEach { option ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .clickable { onSortModeChange(option) }
                            .padding(horizontal = 4.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = sortMode == option,
                            onClick = { onSortModeChange(option) }
                        )
                        Text(
                            option,
                            color = textPrimary,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
                Text(
                    "Choose a category from the tiles on Explore.",
                    color = textMuted,
                    style = MaterialTheme.typography.bodySmall
                )
                FilterChip(
                    selected = false,
                    onClick = onClearCategory,
                    label = { Text("Clear category filter") }
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = lavender, contentColor = Color.White)
            ) { Text("Done") }
        }
    )
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
    isSaved: Boolean,
    darkTheme: Boolean,
    textPrimary: Color,
    textMuted: Color,
    lavender: Color,
    onToggleSaved: () -> Unit,
    onOpenDetails: () -> Unit
) {
    val tint = jobCategoryAccent(job.category ?: job.subcategory.orEmpty())
    val shape = RoundedCornerShape(25.dp)
    val cardSurface = if (darkTheme) Color(0xEA151F32) else Color(0xF7FFFFFF)
    val outline = if (darkTheme) Color.White.copy(alpha = 0.13f) else Color(0xFF9C90C7).copy(alpha = 0.14f)
    val insetSurface = if (darkTheme) Color.White.copy(alpha = 0.055f) else Color(0xFFF2EFFA)

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(13.dp, shape, clip = false),
        shape = shape,
        color = cardSurface,
        border = BorderStroke(1.dp, outline),
        tonalElevation = 0.dp
    ) {
        Column(
            modifier = Modifier.padding(15.dp),
            verticalArrangement = Arrangement.spacedBy(11.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                val iconShape = RoundedCornerShape(18.dp)
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(iconShape)
                        .background(
                            if (darkTheme) tint.copy(alpha = 0.17f)
                            else tint.copy(alpha = 0.105f)
                        )
                        .border(1.dp, tint.copy(alpha = 0.17f), iconShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = jobCategoryIcon(job.category ?: job.subcategory.orEmpty()),
                        contentDescription = job.category ?: "Project category",
                        modifier = Modifier.size(27.dp),
                        tint = tint
                    )
                }

                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Text(
                            job.category?.takeIf(String::isNotBlank)?.let(::displayCategoryLabel)?.uppercase(Locale.ROOT)
                                ?: "OPEN PROJECT",
                            modifier = Modifier.weight(1f),
                            color = if (darkTheme) tint.copy(alpha = 0.98f) else tint,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 0.75.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            formatTimeAgo(job.createdAt),
                            color = textMuted,
                            fontSize = 10.sp,
                            maxLines = 1
                        )
                        Surface(
                            onClick = onToggleSaved,
                            modifier = Modifier.size(28.dp),
                            shape = CircleShape,
                            color = Color.Transparent
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = if (isSaved) Icons.Outlined.Bookmark else Icons.Outlined.BookmarkBorder,
                                    contentDescription = if (isSaved) "Remove saved project" else "Save project",
                                    modifier = Modifier.size(19.dp),
                                    tint = if (isSaved) {
                                        if (darkTheme) Color(0xFFB7A8FF) else Color(0xFF6757D9)
                                    } else {
                                        textMuted
                                    }
                                )
                            }
                        }
                    }

                    Text(
                        job.title ?: "Untitled project",
                        color = textPrimary,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        lineHeight = 22.sp
                    )

                    job.client?.fullName?.takeIf(String::isNotBlank)?.let { client ->
                        Text(
                            "Posted by $client",
                            color = textMuted,
                            style = MaterialTheme.typography.bodySmall,
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
                    lineHeight = 18.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            if (job.skills.isNotEmpty()) {
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(7.dp)
                ) {
                    job.skills.take(3).forEach { skill ->
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = insetSurface,
                            border = BorderStroke(
                                1.dp,
                                if (darkTheme) Color.White.copy(alpha = 0.075f)
                                else Color(0xFF8D82C0).copy(alpha = 0.075f)
                            )
                        ) {
                            Text(
                                skill,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                color = if (darkTheme) Color(0xFFDDD6FF) else Color(0xFF35334A),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1
                            )
                        }
                    }
                    if (job.skills.size > 3) {
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = insetSurface
                        ) {
                            Text(
                                "+" + (job.skills.size - 3),
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                color = textMuted,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1
                            )
                        }
                    }
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(
                        if (darkTheme) Color.White.copy(alpha = 0.09f)
                        else Color(0xFF8D82C0).copy(alpha = 0.13f)
                    )
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Column(
                    modifier = Modifier.weight(1.1f),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text(
                        formatJobBudget(job),
                        color = if (darkTheme) Color(0xFF91E2C9) else Color(0xFF08785C),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        "FIXED BUDGET",
                        color = textMuted,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Medium,
                        letterSpacing = 0.35.sp,
                        maxLines = 1
                    )
                }

                Column(
                    modifier = Modifier.weight(0.78f),
                    verticalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Schedule,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = textMuted
                        )
                        Text(
                            formatTimeline(job.timeline),
                            color = textPrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Text(
                        "TIMELINE",
                        color = textMuted,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Medium,
                        letterSpacing = 0.35.sp,
                        maxLines = 1
                    )
                }

                Button(
                    onClick = onOpenDetails,
                    shape = RoundedCornerShape(999.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (darkTheme) Color(0xFFB7A8FF) else Color(0xFFE4DCFF),
                        contentColor = if (darkTheme) Color(0xFF211A45) else Color(0xFF3F2BA8)
                    )
                ) {
                    Text(
                        "View Details  ›",
                        fontWeight = FontWeight.Bold,
                        fontSize = 10.sp,
                        maxLines = 1
                    )
                }
            }
        }
    }
}

private fun jobCategoryIcon(category: String): ImageVector {
    val normalized = category.lowercase(Locale.ROOT)
    return when {
        "admin" in normalized || "customer support" in normalized || "virtual assistant" in normalized ->
            Icons.Outlined.SupportAgent
        "ai" in normalized || "machine learning" in normalized || "data science" in normalized ->
            Icons.Outlined.Analytics
        "business" in normalized || "finance" in normalized || "human resources" in normalized || "hr" in normalized ->
            Icons.Outlined.AccountBalance
        "design" in normalized || "creative" in normalized || "ui/ux" in normalized ->
            Icons.Outlined.Palette
        "marketing" in normalized || "seo" in normalized || "advertis" in normalized ->
            Icons.Outlined.Campaign
        "e-commerce" in normalized || "ecommerce" in normalized || "retail" in normalized ->
            Icons.Outlined.ShoppingCart
        "education" in normalized || "tutoring" in normalized || "coaching" in normalized ->
            Icons.Outlined.School
        "engineering" in normalized || "architecture" in normalized || "3d" in normalized ->
            Icons.Outlined.Architecture
        "events" in normalized || "drones" in normalized || "local services" in normalized ->
            Icons.Outlined.Event
        "gaming" in normalized || "esports" in normalized ->
            Icons.Outlined.SportsEsports
        "mobile" in normalized || "android" in normalized || "ios" in normalized || "app development" in normalized ->
            Icons.Outlined.Smartphone
        "photography" in normalized || "image editing" in normalized || "photo" in normalized ->
            Icons.Outlined.CameraAlt
        "social media" in normalized || "community" in normalized ->
            Icons.Outlined.Groups
        "software" in normalized || "desktop" in normalized || "cloud" in normalized ->
            Icons.Outlined.CloudQueue
        "translation" in normalized || "transcription" in normalized || "language" in normalized ->
            Icons.Outlined.Translate
        "video" in normalized || "audio" in normalized || "animation" in normalized ->
            Icons.Outlined.Videocam
        "web development" in normalized || "web" in normalized ->
            Icons.Outlined.Language
        "writing" in normalized || "content" in normalized || "copywriting" in normalized ->
            Icons.Outlined.Edit
        else -> Icons.Outlined.Computer
    }
}

private fun displayCategoryLabel(category: String): String = when (category.lowercase(Locale.ROOT)) {
    "mobile app development" -> "Mobile Apps"
    "design & creative" -> "UI/UX Design"
    "ai, machine learning & data science" -> "Data Science"
    "digital marketing & seo" -> "Digital Marketing"
    "photography & image editing" -> "Photography"
    "video, audio & animation" -> "Video & Audio"
    "social media & community" -> "Social Media"
    "e-commerce & retail" -> "E-commerce"
    "writing & content creation" -> "Writing & Content"
    "translation & transcription" -> "Translation"
    "gaming & esports" -> "Gaming"
    "admin, va & customer support" -> "Admin & Support"
    "business, finance & hr" -> "Business & Finance"
    "engineering, architecture & 3d" -> "Engineering"
    "education, tutoring & coaching" -> "Education & Coaching"
    "events, drones & local services" -> "Events & Travel"
    "software, desktop & cloud" -> "Software & Cloud"
    "legal services" -> "Legal Services"
    else -> category
}

private fun formatTimeAgo(value: String?): String {
    if (value.isNullOrBlank()) return "Recently"
    val instant = runCatching { java.time.Instant.parse(value) }.getOrNull()
        ?: runCatching { java.time.OffsetDateTime.parse(value).toInstant() }.getOrNull()
        ?: return "Recently"
    val days = runCatching {
        java.time.Duration.between(instant, java.time.Instant.now()).toDays().coerceAtLeast(0)
    }.getOrDefault(0L)
    return when {
        days == 0L -> "Today"
        days == 1L -> "1 day ago"
        days < 30L -> "$days days ago"
        days < 60L -> "1 month ago"
        else -> (days / 30L).toString() + " months ago"
    }
}

private fun formatTimeline(value: String?): String {
    if (value.isNullOrBlank()) return "Flexible"
    return value.trim()
        .replace('_', ' ')
        .split(Regex("\\s+"))
        .filter(String::isNotBlank)
        .joinToString(" ") { part ->
            part.split('-').joinToString("-") { token ->
                token.replaceFirstChar { char -> char.titlecase(Locale.ROOT) }
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
