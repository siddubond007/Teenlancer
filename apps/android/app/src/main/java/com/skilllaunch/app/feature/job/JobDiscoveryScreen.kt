package com.skilllaunch.app.feature.job

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Bookmark
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.RocketLaunch
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
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
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
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
import com.skilllaunch.app.data.repository.profile.ProfileRepository
import com.skilllaunch.app.R
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

private val ChakraPetchFontFamily = FontFamily(
    Font(R.font.chakra_petch_regular, FontWeight.Normal),
    Font(R.font.chakra_petch_semibold, FontWeight.SemiBold),
    Font(R.font.chakra_petch_bold, FontWeight.Bold)
)
private val RationaleFontFamily = FontFamily(
    Font(R.font.rationale_regular, FontWeight.Normal)
)
private val ViaodaLibreFontFamily = FontFamily(
    Font(R.font.viaoda_libre_regular, FontWeight.Normal)
)

private fun normalizedTokens(value: String): Set<String> =
    value.lowercase(Locale.ROOT)
        .split(Regex("[^a-z0-9+#]+"))
        .filter { it.length >= 2 }
        .toSet()

private fun sanitizeBudgetInput(value: String): String {
    val filtered = value.filter { it.isDigit() || it == '.' }
    val decimalIndex = filtered.indexOf('.')
    return if (decimalIndex < 0) filtered
    else filtered.take(decimalIndex + 1) + filtered.drop(decimalIndex + 1).replace(".", "")
}

private data class ActiveExploreFilter(
    val key: String,
    val label: String,
    val artworkIndex: Int? = null,
    val onRemove: () -> Unit
)

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
@OptIn(ExperimentalMaterial3Api::class)
fun JobDiscoveryScreen(
    repository: JobRepository,
    profileRepository: ProfileRepository,
    userId: String?,
    refreshVersion: Int = 0,
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
    var appliedSearch by rememberSaveable { mutableStateOf("") }
    var selectedCategory by rememberSaveable { mutableStateOf("All") }
    var sortMode by rememberSaveable { mutableStateOf("Newest") }
    var selectedFeedTab by rememberSaveable { mutableStateOf("Explore") }
    var showFilterDialog by rememberSaveable { mutableStateOf(false) }
    var showDomainPicker by rememberSaveable { mutableStateOf(false) }
    var domainSearch by rememberSaveable { mutableStateOf("") }
    var minBudgetFilter by rememberSaveable { mutableStateOf("") }
    var maxBudgetFilter by rememberSaveable { mutableStateOf("") }
    var selectedProjectTypes by rememberSaveable { mutableStateOf<List<String>>(emptyList()) }
    var selectedSkills by rememberSaveable { mutableStateOf<List<String>>(emptyList()) }
    var locationFilter by rememberSaveable { mutableStateOf("") }
    var languageFilter by rememberSaveable { mutableStateOf("") }

    // Filter edits remain a draft until the user explicitly applies them.
    var draftSortMode by rememberSaveable { mutableStateOf("Newest") }
    var draftSelectedCategory by rememberSaveable { mutableStateOf("All") }
    var draftMinBudget by rememberSaveable { mutableStateOf("") }
    var draftMaxBudget by rememberSaveable { mutableStateOf("") }
    var draftProjectTypes by rememberSaveable { mutableStateOf<List<String>>(emptyList()) }
    var draftSkills by rememberSaveable { mutableStateOf<List<String>>(emptyList()) }
    var draftSkillSearch by rememberSaveable { mutableStateOf("") }
    var draftLocation by rememberSaveable { mutableStateOf("") }
    var draftLanguage by rememberSaveable { mutableStateOf("") }
    var returnToFiltersAfterDomainPicker by rememberSaveable { mutableStateOf(false) }

    var profileCategory by rememberSaveable { mutableStateOf("") }
    var profileSkills by remember { mutableStateOf<List<String>>(emptyList()) }
    var savedJobIds by remember {
        mutableStateOf(
            savedPreferences.getStringSet("saved_job_ids", mutableSetOf())
                ?.toSet()
                .orEmpty()
        )
    }

    LaunchedEffect(refreshVersion) {
        // Reload when returning from a detail page or selecting Explore again.
        viewModel.load(appliedSearch.takeIf { it.isNotBlank() })
    }

    LaunchedEffect(profileRepository, userId) {
        profileRepository.getMyProfile().onSuccess { profileUser ->
            val profile = profileUser.profile
            profileCategory = sequenceOf(
                profile?.category,
                profile?.onboardingData?.primaryDomain
            ).filterNotNull().firstOrNull { it.isNotBlank() }.orEmpty()
            profileSkills = (
                profile?.skills.orEmpty() +
                    profile?.onboardingData?.selectedSkills.orEmpty()
                )
                .map(String::trim)
                .filter(String::isNotBlank)
                .distinctBy { it.lowercase(Locale.ROOT) }
        }
    }

    val darkTheme = MaterialTheme.colorScheme.background.luminance() < 0.5f
    val textPrimary = MaterialTheme.colorScheme.onBackground
    val textMuted = MaterialTheme.colorScheme.onSurfaceVariant
    val lavender = if (darkTheme) Color(0xFFB7A8FF) else Color(0xFF6757D9)
    val pageBackground = if (darkTheme) Color(0xFF000000) else Color(0xFFF9F7FC)
    val cardBackground = if (darkTheme) Color(0xF5121213) else Color(0xF7FFFFFF)
    val searchBackground = if (darkTheme) Color(0xF50A0A0B) else Color(0xEFFFFFFF)

    val allCategories = remember(state.jobs) {
        state.jobs.mapNotNull {
            it.category?.trim()?.takeIf(String::isNotBlank)
        }.distinctBy { it.lowercase(Locale.ROOT) }
            .sortedBy { it.lowercase(Locale.ROOT) }
    }
    val featuredCategories = remember(allCategories, state.jobs, profileCategory, profileSkills) {
        val curatedFallback = listOf(
            "Web Development",
            "Mobile App Development",
            "Design & Creative",
            "AI, Machine Learning & Data Science",
            "Digital Marketing & SEO"
        ).filter { preferred ->
            allCategories.any { it.equals(preferred, ignoreCase = true) }
        }
        val profileDomain = profileCategory.trim()
        val profileDomainTokens = normalizedTokens(profileDomain)
        val normalizedSkills = profileSkills.map { it.lowercase(Locale.ROOT).trim() }
            .filter(String::isNotBlank)
        val scores = allCategories.associateWith { category ->
            val categoryJobs = state.jobs.filter {
                it.category?.equals(category, ignoreCase = true) == true
            }
            val exactDomainScore = if (
                profileDomain.isNotBlank() && category.equals(profileDomain, ignoreCase = true)
            ) 10_000 else 0
            val domainTokenScore = normalizedTokens(category)
                .intersect(profileDomainTokens)
                .size * 250
            val skillMatchScore = categoryJobs.sumOf { job ->
                val jobSkillText = (
                    job.skills + listOfNotNull(job.subcategory, job.title)
                ).joinToString(" ").lowercase(Locale.ROOT)
                val jobTokens = normalizedTokens(jobSkillText)
                normalizedSkills.sumOf { skill ->
                    when {
                        jobSkillText.contains(skill) -> 20
                        normalizedTokens(skill).intersect(jobTokens).isNotEmpty() -> 4
                        else -> 0
                    }
                }
            }
            exactDomainScore + domainTokenScore + skillMatchScore
        }
        val ranked = allCategories.sortedWith(
            compareByDescending<String> { scores[it] ?: 0 }
                .thenBy { category ->
                    val position = curatedFallback.indexOfFirst {
                        it.equals(category, ignoreCase = true)
                    }
                    if (position < 0) Int.MAX_VALUE else position
                }
                .thenBy { it.lowercase(Locale.ROOT) }
        )
        val hasProfilePreferences = profileDomain.isNotBlank() || normalizedSkills.isNotEmpty()
        val personalized = if (hasProfilePreferences) {
            ranked.filter { (scores[it] ?: 0) > 0 }
        } else {
            emptyList()
        }
        (personalized + curatedFallback + ranked)
            .distinctBy { displayCategoryLabel(it).lowercase(Locale.ROOT) }
            .take(3)
    }

    val skillScopeCategory = if (showFilterDialog || returnToFiltersAfterDomainPicker) {
        draftSelectedCategory
    } else {
        selectedCategory
    }
    val allJobSkills = remember(state.jobs, skillScopeCategory) {
        state.jobs
            .filter { job ->
                skillScopeCategory == "All" ||
                    displayCategoryLabel(job.category.orEmpty()).equals(
                        displayCategoryLabel(skillScopeCategory),
                        ignoreCase = true
                    )
            }
            .flatMap { it.skills }
            .map(String::trim)
            .filter(String::isNotBlank)
            .distinctBy { it.lowercase(Locale.ROOT) }
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
    val visibleJobs = remember(tabJobs, selectedCategory, sortMode, appliedSearch, minBudgetFilter, maxBudgetFilter, selectedProjectTypes, selectedSkills, locationFilter, languageFilter) {
        val minBudget = minBudgetFilter.toDoubleOrNull()
        val maxBudget = maxBudgetFilter.toDoubleOrNull()
        val query = appliedSearch.trim()
        val locationQuery = locationFilter.trim()
        val languageQuery = languageFilter.trim()
        val matching = tabJobs.filter { job ->
            val matchesCategory = selectedCategory == "All" ||
                displayCategoryLabel(job.category.orEmpty()).equals(
                    displayCategoryLabel(selectedCategory),
                    ignoreCase = true
                )
            val searchableText = listOfNotNull(job.title, job.description, job.category, job.subcategory, job.client?.fullName, job.locationPreferences, job.languagePreferences).plus(job.skills).joinToString(" ")
            val matchesSearch = query.isBlank() || searchableText.contains(query, ignoreCase = true)
            val amount = jobBudgetValue(job)
            val hasKnownBudget = amount > 0.0
            val matchesMinimum = minBudget == null || (hasKnownBudget && amount >= minBudget)
            val matchesMaximum = maxBudget == null || (hasKnownBudget && amount <= maxBudget)
            val actualType = if (job.projectType.orEmpty().contains("hour", ignoreCase = true) || job.budgetType.orEmpty().contains("hour", ignoreCase = true)) "Hourly" else "Fixed price"
            val matchesType = selectedProjectTypes.isEmpty() || actualType in selectedProjectTypes
            val matchesSkills = selectedSkills.isEmpty() || job.skills.any { jobSkill -> selectedSkills.any { selectedSkill -> jobSkill.equals(selectedSkill, ignoreCase = true) } }
            val matchesLocation = locationQuery.isBlank() || job.locationPreferences.orEmpty().contains(locationQuery, ignoreCase = true)
            val matchesLanguage = languageQuery.isBlank() || job.languagePreferences.orEmpty().contains(languageQuery, ignoreCase = true)
            matchesCategory && matchesSearch && matchesMinimum && matchesMaximum && matchesType && matchesSkills && matchesLocation && matchesLanguage
        }
        when (sortMode) {
            "Highest budget" -> matching.sortedWith(
                compareByDescending<Job> {
                    jobBudgetValue(it).takeIf { amount -> amount > 0.0 } ?: Double.NEGATIVE_INFINITY
                }
            )
            "Lowest budget" -> matching.sortedWith(
                compareBy<Job> {
                    jobBudgetValue(it).takeIf { amount -> amount > 0.0 } ?: Double.POSITIVE_INFINITY
                }
            )
            else -> matching.sortedByDescending { it.createdAt.orEmpty() }
        }
    }

    val activeFilters = buildList {
        if (appliedSearch.isNotBlank()) add(ActiveExploreFilter("search", "Search: $appliedSearch") { search = ""; appliedSearch = ""; viewModel.load() })
        if (selectedCategory != "All") {
            add(
                ActiveExploreFilter(
                    key = "category",
                    label = displayCategoryLabel(selectedCategory),
                    artworkIndex = jobCategoryArtwork(selectedCategory),
                    onRemove = { selectedCategory = "All" }
                )
            )
        }
        if (minBudgetFilter.isNotBlank()) add(ActiveExploreFilter("minimum-budget", "Min ₹$minBudgetFilter") { minBudgetFilter = "" })
        if (maxBudgetFilter.isNotBlank()) add(ActiveExploreFilter("maximum-budget", "Max ₹$maxBudgetFilter") { maxBudgetFilter = "" })
        selectedProjectTypes.forEach { type -> add(ActiveExploreFilter("type:$type", type) { selectedProjectTypes = selectedProjectTypes - type }) }
        selectedSkills.forEach { skill -> add(ActiveExploreFilter("skill:$skill", skill) { selectedSkills = selectedSkills - skill }) }
        if (locationFilter.isNotBlank()) add(ActiveExploreFilter("location", "Location: $locationFilter") { locationFilter = "" })
        if (languageFilter.isNotBlank()) add(ActiveExploreFilter("language", "Language: $languageFilter") { languageFilter = "" })
    }

    fun toggleSaved(job: Job) {
        val id = job.id ?: return
        val next = if (savedJobIds.contains(id)) savedJobIds - id else savedJobIds + id
        savedJobIds = next
        savedPreferences.edit().putStringSet("saved_job_ids", next.toMutableSet()).apply()
    }

    fun resetAllFilters() {
        search = ""; appliedSearch = ""; selectedCategory = "All"
        minBudgetFilter = ""; maxBudgetFilter = ""; selectedProjectTypes = emptyList()
        selectedSkills = emptyList(); locationFilter = ""; languageFilter = ""; sortMode = "Newest"
        viewModel.load()
    }

    fun beginFilterEditing() {
        draftSortMode = sortMode
        draftSelectedCategory = selectedCategory
        draftMinBudget = minBudgetFilter
        draftMaxBudget = maxBudgetFilter
        draftProjectTypes = selectedProjectTypes
        draftSkills = selectedSkills
        draftSkillSearch = ""
        draftLocation = locationFilter
        draftLanguage = languageFilter
        showFilterDialog = true
    }

    fun applyDraftFilters() {
        sortMode = draftSortMode
        selectedCategory = draftSelectedCategory
        minBudgetFilter = draftMinBudget
        maxBudgetFilter = draftMaxBudget
        selectedProjectTypes = draftProjectTypes
        selectedSkills = draftSkills
        locationFilter = draftLocation
        languageFilter = draftLanguage
        showFilterDialog = false
    }

    fun resetDraftFilters() {
        draftSortMode = "Newest"
        draftSelectedCategory = "All"
        draftMinBudget = ""
        draftMaxBudget = ""
        draftProjectTypes = emptyList()
        draftSkills = emptyList()
        draftSkillSearch = ""
        draftLocation = ""
        draftLanguage = ""
    }

    fun skillsForDomain(category: String): List<String> =
        state.jobs
            .filter { job ->
                category == "All" ||
                    displayCategoryLabel(job.category.orEmpty()).equals(
                        displayCategoryLabel(category),
                        ignoreCase = true
                    )
            }
            .flatMap { it.skills }
            .map(String::trim)
            .filter(String::isNotBlank)
            .distinctBy { it.lowercase(Locale.ROOT) }

    fun chooseCategory(category: String) {
        selectedCategory = category
        val available = skillsForDomain(category)
        selectedSkills = selectedSkills.filter { skill ->
            available.any { it.equals(skill, ignoreCase = true) }
        }
    }

    fun chooseDraftCategory(category: String) {
        draftSelectedCategory = category
        val available = skillsForDomain(category)
        draftSkills = draftSkills.filter { skill ->
            available.any { it.equals(skill, ignoreCase = true) }
        }
        draftSkillSearch = ""
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
                            listOf(Color(0xFF000000), Color(0xFF050505), Color(0xFF101011), Color(0xFF030303), Color(0xFF000000))
                        } else {
                            listOf(Color(0xFFFFFEFF), Color(0xFFF8F6FC), Color(0xFFF0EDFA))
                        }
                    )
                )
        ) {
            PullToRefreshBox(
                isRefreshing = state.isLoading,
                onRefresh = { viewModel.clearError(); viewModel.load(appliedSearch.takeIf { it.isNotBlank() }) },
                // Keep the feed viewport above the floating dock so cards never render underneath it.
                modifier = Modifier.fillMaxSize().padding(bottom = 132.dp)
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
                            appliedSearch = search.trim()
                            viewModel.clearError()
                            viewModel.load(appliedSearch.takeIf { it.isNotBlank() })
                        },
                        onOpenFilters = { beginFilterEditing() }
                    )
                }

                if (activeFilters.isNotEmpty()) {
                    item(key = "explore-active-filters") {
                        Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Text("ACTIVE FILTERS", color = textMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.8.sp)
                                Spacer(Modifier.weight(1f))
                                TextButton(onClick = { resetAllFilters() }) { Text("Clear all", color = lavender, fontSize = 12.sp) }
                            }
                            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(7.dp), verticalAlignment = Alignment.CenterVertically) {
                                activeFilters.forEach { filter ->
                                    FilterChip(
                                        selected = true,
                                        onClick = filter.onRemove,
                                        label = {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                filter.artworkIndex?.let { art ->
                                                    DomainArtwork(
                                                        index = art,
                                                        contentDescription = null,
                                                        modifier = Modifier.size(22.dp)
                                                    )
                                                }
                                                Text(filter.label, maxLines = 1, overflow = TextOverflow.Ellipsis, fontSize = 12.sp)
                                            }
                                        },
                                        colors = androidx.compose.material3.FilterChipDefaults.filterChipColors(
                                            containerColor = if (darkTheme) Color(0xFF101011) else Color(0xFFF2EFFA),
                                            labelColor = textPrimary,
                                            selectedContainerColor = if (darkTheme) Color(0xFF171718) else Color(0xFFECE7FC),
                                            selectedLabelColor = textPrimary
                                        ),
                                        border = BorderStroke(
                                            1.dp,
                                            if (darkTheme) Color.White.copy(alpha = 0.10f) else Color(0xFF8D82C0).copy(alpha = 0.22f)
                                        ),
                                        trailingIcon = { Icon(Icons.Outlined.Close, contentDescription = "Remove ${filter.label}", modifier = Modifier.size(14.dp)) }
                                    )
                                }
                            }
                        }
                    }
                }

                if (allCategories.isNotEmpty()) {
                    item(key = "explore-categories") {
                        Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
                            Text(
                                "RECOMMENDED DOMAINS",
                                color = textMuted,
                                fontFamily = RationaleFontFamily,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.0.sp
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                ExploreCategoryTile(
                                    label = "All",
                                    selected = selectedCategory == "All",
                                    artworkIndex = -1,
                                    darkTheme = darkTheme,
                                    onClick = { chooseCategory("All") }
                                )
                                if (
                                    selectedCategory != "All" &&
                                    featuredCategories.none {
                                        displayCategoryLabel(it).equals(
                                            displayCategoryLabel(selectedCategory),
                                            ignoreCase = true
                                        )
                                    }
                                ) {
                                    ExploreCategoryTile(
                                        label = displayCategoryLabel(selectedCategory),
                                        selected = true,
                                        artworkIndex = jobCategoryArtwork(selectedCategory),
                                        darkTheme = darkTheme,
                                        onClick = { chooseCategory("All") }
                                    )
                                }
                                featuredCategories.filterNot {
                                    selectedCategory != "All" && displayCategoryLabel(it).equals(
                                        displayCategoryLabel(selectedCategory),
                                        ignoreCase = true
                                    )
                                }.forEach { category ->
                                    ExploreCategoryTile(
                                        label = displayCategoryLabel(category),
                                        selected = displayCategoryLabel(selectedCategory).equals(
                                            displayCategoryLabel(category),
                                            ignoreCase = true
                                        ),
                                        artworkIndex = jobCategoryArtwork(category),
                                        darkTheme = darkTheme,
                                        onClick = {
                                            chooseCategory(
                                                if (
                                                    selectedCategory != "All" &&
                                                    displayCategoryLabel(selectedCategory).equals(
                                                        displayCategoryLabel(category),
                                                        ignoreCase = true
                                                    )
                                                ) "All" else category
                                            )
                                        }
                                    )
                                }
                                ExploreCategoryTile(
                                    label = "All domains",
                                    selected = showDomainPicker,
                                    artworkIndex = -2,
                                    darkTheme = darkTheme,
                                    onClick = {
                                        domainSearch = ""
                                        returnToFiltersAfterDomainPicker = false
                                        showDomainPicker = true
                                    }
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
                                style = TextStyle(
                                    fontFamily = ChakraPetchFontFamily,
                                    fontSize = 24.sp,
                                    lineHeight = 29.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    letterSpacing = (-0.65).sp
                                ),
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
                                viewModel.load(appliedSearch.takeIf { it.isNotBlank() })
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
                                viewModel.load(appliedSearch.takeIf { it.isNotBlank() })
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
                                trackColor = if (darkTheme) Color(0xFF2A2C2F) else Color(0xFFE4DFF3)
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
    }

    if (showFilterDialog) {
        JobFilterDialog(
            sortMode = draftSortMode,
            onSortModeChange = { draftSortMode = it },
            selectedCategory = draftSelectedCategory,
            onOpenDomains = {
                returnToFiltersAfterDomainPicker = true
                showFilterDialog = false
                domainSearch = ""
                showDomainPicker = true
            },
            minBudget = draftMinBudget,
            onMinBudgetChange = { draftMinBudget = sanitizeBudgetInput(it) },
            maxBudget = draftMaxBudget,
            onMaxBudgetChange = { draftMaxBudget = sanitizeBudgetInput(it) },
            selectedProjectTypes = draftProjectTypes,
            onToggleProjectType = { type -> draftProjectTypes = if (type in draftProjectTypes) draftProjectTypes - type else draftProjectTypes + type },
            allSkills = allJobSkills,
            selectedSkills = draftSkills,
            skillSearch = draftSkillSearch,
            onSkillSearchChange = { draftSkillSearch = it },
            onToggleSkill = { skill -> draftSkills = if (skill in draftSkills) draftSkills - skill else draftSkills + skill },
            locationFilter = draftLocation,
            onLocationFilterChange = { draftLocation = it },
            languageFilter = draftLanguage,
            onLanguageFilterChange = { draftLanguage = it },
            onReset = { resetDraftFilters() },
            onApply = { applyDraftFilters() },
            onDismiss = { showFilterDialog = false },
            darkTheme = darkTheme,
            lavender = lavender,
            textPrimary = textPrimary,
            textMuted = textMuted
        )
    }

    if (showDomainPicker) {
        DomainPickerDialog(
            categories = allCategories,
            selectedCategory = if (returnToFiltersAfterDomainPicker) draftSelectedCategory else selectedCategory,
            query = domainSearch,
            onQueryChange = { domainSearch = it },
            onSelect = { category ->
                val returnToFilters = returnToFiltersAfterDomainPicker
                if (returnToFilters) {
                    chooseDraftCategory(category)
                } else {
                    chooseCategory(category)
                }
                showDomainPicker = false
                domainSearch = ""
                returnToFiltersAfterDomainPicker = false
                if (returnToFilters) showFilterDialog = true
            },
            onDismiss = {
                val returnToFilters = returnToFiltersAfterDomainPicker
                showDomainPicker = false
                domainSearch = ""
                returnToFiltersAfterDomainPicker = false
                if (returnToFilters) showFilterDialog = true
            },
            darkTheme = darkTheme,
            textPrimary = textPrimary,
            textMuted = textMuted,
            lavender = lavender
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
                    fontFamily = ChakraPetchFontFamily,
                    fontSize = 23.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.75).sp
                )
                Text(
                    "Launch",
                    color = accent,
                    fontFamily = ChakraPetchFontFamily,
                    fontSize = 23.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.75).sp
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
                        fontFamily = ChakraPetchFontFamily,
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
    artworkIndex: Int,
    darkTheme: Boolean,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(17.dp)
    val tileBackground = when {
        darkTheme && selected -> Color(0xFF181818)
        darkTheme -> Color(0xFF101011)
        selected -> Color(0xFFECE7FC)
        else -> Color(0xFFF7F5FB)
    }
    val tileBorder = when {
        darkTheme && selected -> Color(0xFF9989B8).copy(alpha = 0.40f)
        darkTheme -> Color.White.copy(alpha = 0.08f)
        selected -> Color(0xFF8E7BC4).copy(alpha = 0.45f)
        else -> Color(0xFFDFDBE7)
    }

    Column(
        modifier = Modifier
            .width(66.dp)
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(58.dp)
                .clip(shape)
                .background(tileBackground)
                .border(1.dp, tileBorder, shape),
            contentAlignment = Alignment.Center
        ) {
            if (artworkIndex >= 0) {
                DomainArtwork(
                    index = artworkIndex,
                    contentDescription = label,
                    modifier = Modifier.size(46.dp)
                )
            } else {
                Icon(
                    imageVector = if (artworkIndex == -2) Icons.Outlined.Tune else Icons.Outlined.GridView,
                    contentDescription = label,
                    modifier = Modifier.size(28.dp),
                    tint = if (selected) {
                        if (darkTheme) Color(0xFFF4F1FA) else Color(0xFF6F5F9C)
                    } else {
                        if (darkTheme) Color(0xFFD2D2D6) else Color(0xFF595667)
                    }
                )
            }
        }
        Text(
            label,
            color = if (selected) {
                if (darkTheme) Color(0xFFE5DDF8) else Color(0xFF4B3AA6)
            } else {
                if (darkTheme) Color(0xFFD3D3D6) else Color(0xFF38364B)
            },
            fontSize = 11.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
            letterSpacing = 0.sp,
            lineHeight = 13.sp,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.fillMaxWidth().height(30.dp)
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
private fun DomainPickerDialog(
    categories: List<String>,
    selectedCategory: String,
    query: String,
    onQueryChange: (String) -> Unit,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit,
    darkTheme: Boolean,
    textPrimary: Color,
    textMuted: Color,
    lavender: Color
) {
    val filteredCategories = remember(categories, query) {
        categories.filter { category ->
            category.contains(query, ignoreCase = true) ||
                displayCategoryLabel(category).contains(query, ignoreCase = true)
        }.distinctBy { displayCategoryLabel(it).lowercase(Locale.ROOT) }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    "Explore all domains",
                    color = textPrimary,
                    fontFamily = ChakraPetchFontFamily,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "Choose a specialty to refine your opportunities.",
                    color = textMuted,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = query,
                    onValueChange = onQueryChange,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("Search domains") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Outlined.Search,
                            contentDescription = null
                        )
                    }
                )
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 350.dp),
                    verticalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    item(key = "all-domains-option") {
                        DomainPickerRow(
                            label = "All opportunities",
                            selected = selectedCategory == "All",
                            artworkIndex = -1,
                            darkTheme = darkTheme,
                            textPrimary = textPrimary,
                            onClick = { onSelect("All") }
                        )
                    }
                    items(filteredCategories, key = { it.lowercase(Locale.ROOT) }) { category ->
                        DomainPickerRow(
                            label = displayCategoryLabel(category),
                            selected = displayCategoryLabel(selectedCategory).equals(
                                displayCategoryLabel(category),
                                ignoreCase = true
                            ),
                            artworkIndex = jobCategoryArtwork(category),
                            darkTheme = darkTheme,
                            textPrimary = textPrimary,
                            onClick = { onSelect(category) }
                        )
                    }
                    if (filteredCategories.isEmpty()) {
                        item(key = "no-domain-results") {
                            Text(
                                "No domains match that search.",
                                color = textMuted,
                                modifier = Modifier.padding(vertical = 12.dp)
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close", color = lavender, fontWeight = FontWeight.Bold)
            }
        },
        containerColor = if (darkTheme) Color(0xFF111112) else Color(0xFFFFFEFF)
    )
}

@Composable
private fun DomainPickerRow(
    label: String,
    selected: Boolean,
    artworkIndex: Int,
    darkTheme: Boolean,
    textPrimary: Color,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(
                if (selected) {
                    if (darkTheme) Color(0xFF18181A) else Color(0xFFF0ECFF)
                } else Color.Transparent
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        if (artworkIndex >= 0) {
            DomainArtwork(
                index = artworkIndex,
                contentDescription = label,
                modifier = Modifier.size(42.dp)
            )
        } else {
            Icon(
                imageVector = Icons.Outlined.GridView,
                contentDescription = label,
                modifier = Modifier.size(27.dp),
                tint = if (darkTheme) Color(0xFFD2D2D6) else Color(0xFF595667)
            )
        }
        Text(
            label,
            modifier = Modifier.weight(1f),
            color = textPrimary,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )
        RadioButton(
            selected = selected,
            onClick = onClick
        )
    }
}

@Composable
private fun JobFilterDialog(
    sortMode: String,
    onSortModeChange: (String) -> Unit,
    selectedCategory: String,
    onOpenDomains: () -> Unit,
    minBudget: String,
    onMinBudgetChange: (String) -> Unit,
    maxBudget: String,
    onMaxBudgetChange: (String) -> Unit,
    selectedProjectTypes: List<String>,
    onToggleProjectType: (String) -> Unit,
    allSkills: List<String>,
    selectedSkills: List<String>,
    skillSearch: String,
    onSkillSearchChange: (String) -> Unit,
    onToggleSkill: (String) -> Unit,
    locationFilter: String,
    onLocationFilterChange: (String) -> Unit,
    languageFilter: String,
    onLanguageFilterChange: (String) -> Unit,
    onReset: () -> Unit,
    onApply: () -> Unit,
    onDismiss: () -> Unit,
    darkTheme: Boolean,
    lavender: Color,
    textPrimary: Color,
    textMuted: Color
) {
    val visibleSkills = remember(allSkills, selectedSkills, skillSearch) {
        val matching = if (skillSearch.isBlank()) allSkills.take(12)
        else allSkills.filter { it.contains(skillSearch.trim(), ignoreCase = true) }
        (selectedSkills + matching).distinctBy { it.lowercase(Locale.ROOT) }
    }
    val invalidBudgetValue =
        (minBudget.isNotBlank() && minBudget.toDoubleOrNull() == null) ||
            (maxBudget.isNotBlank() && maxBudget.toDoubleOrNull() == null)
    val invalidBudgetRange = invalidBudgetValue || (
        minBudget.toDoubleOrNull()?.let { minimum ->
            maxBudget.toDoubleOrNull()?.let { maximum -> maximum < minimum }
        } == true
    )
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text("Filters & preferences", color = textPrimary, fontFamily = ChakraPetchFontFamily, fontWeight = FontWeight.Bold, fontSize = 21.sp)
                Text("Refine projects by domain, budget, skills and more.", color = textMuted, style = MaterialTheme.typography.bodySmall)
            }
        },
        text = {
            Column(Modifier.fillMaxWidth().heightIn(max = 440.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("DOMAIN", color = textMuted, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                Surface(onClick = onOpenDomains, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(13.dp), color = if (darkTheme) Color(0xFF111112) else Color(0xFFF5F2FC), border = BorderStroke(1.dp, if (darkTheme) Color.White.copy(alpha = 0.12f) else lavender.copy(alpha = 0.28f))) {
                    Row(Modifier.padding(horizontal = 12.dp, vertical = 11.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(if (selectedCategory == "All") "All domains" else displayCategoryLabel(selectedCategory), modifier = Modifier.weight(1f), color = textPrimary, style = MaterialTheme.typography.bodyMedium, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        Text("Change", color = lavender, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
                Text("BUDGET RANGE (₹)", color = textMuted, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = minBudget,
                            onValueChange = onMinBudgetChange,
                            modifier = Modifier.weight(1f),
                            label = { Text("Min ₹") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                        )
                        OutlinedTextField(
                            value = maxBudget,
                            onValueChange = onMaxBudgetChange,
                            modifier = Modifier.weight(1f),
                            label = { Text("Max ₹") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                        )
                    }
                    if (invalidBudgetRange) {
                        Text(
                            if (invalidBudgetValue) "Enter a valid budget amount."
                            else "Maximum budget must be greater than or equal to minimum.",
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
                Text("PROJECT TYPE", color = textMuted, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    listOf("Fixed price", "Hourly").forEach { type -> FilterChip(selected = type in selectedProjectTypes, onClick = { onToggleProjectType(type) }, label = { Text(type) }) }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("REQUIRED SKILLS", color = textMuted, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                    if (selectedSkills.isNotEmpty()) {
                        Spacer(Modifier.weight(1f))
                        Text(
                            "${selectedSkills.size} selected",
                            color = lavender,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
                OutlinedTextField(value = skillSearch, onValueChange = onSkillSearchChange, modifier = Modifier.fillMaxWidth(), singleLine = true, label = { Text("Search skills") }, leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) })
                Text(
                    "Projects matching any selected skill will be shown.",
                    color = textMuted,
                    style = MaterialTheme.typography.labelSmall
                )
                if (skillSearch.isBlank() && allSkills.size > 12) {
                    Text("Showing 12 of ${allSkills.size} skills. Search to find more.", color = textMuted, style = MaterialTheme.typography.labelSmall)
                }
                if (visibleSkills.isEmpty()) {
                    Text(
                        "No matching skills found in this domain's loaded projects.",
                        color = textMuted,
                        style = MaterialTheme.typography.bodySmall
                    )
                } else {
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        visibleSkills.forEach { skill ->
                            val selected = skill in selectedSkills
                            FilterChip(
                                selected = selected,
                                onClick = { onToggleSkill(skill) },
                                label = {
                                    Text(
                                        skill,
                                        fontSize = 12.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                },
                                colors = androidx.compose.material3.FilterChipDefaults.filterChipColors(
                                    containerColor = if (darkTheme) Color(0xFF111112) else Color(0xFFF4F1FA),
                                    labelColor = textPrimary,
                                    selectedContainerColor = if (darkTheme) Color(0xFF201C26) else Color(0xFFECE7FC),
                                    selectedLabelColor = textPrimary
                                ),
                                border = BorderStroke(
                                    1.dp,
                                    if (selected) lavender.copy(alpha = 0.5f)
                                    else if (darkTheme) Color.White.copy(alpha = 0.10f)
                                    else Color(0xFFDFDBE7)
                                )
                            )
                        }
                    }
                }
                Text("LOCATION", color = textMuted, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                OutlinedTextField(value = locationFilter, onValueChange = onLocationFilterChange, modifier = Modifier.fillMaxWidth(), singleLine = true, label = { Text("Project location") })
                Text("LANGUAGE", color = textMuted, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                OutlinedTextField(value = languageFilter, onValueChange = onLanguageFilterChange, modifier = Modifier.fillMaxWidth(), singleLine = true, label = { Text("Language preference") })
                Text("SORT BY", color = textMuted, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                listOf("Newest", "Highest budget", "Lowest budget").forEach { option ->
                    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable { onSortModeChange(option) }.padding(horizontal = 4.dp, vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = sortMode == option, onClick = { onSortModeChange(option) })
                        Text(option, color = textPrimary, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        },
        confirmButton = { Button(onClick = onApply, enabled = !invalidBudgetRange, colors = ButtonDefaults.buttonColors(containerColor = lavender, contentColor = Color.White)) { Text("Apply filters") } },
        dismissButton = { TextButton(onClick = onReset) { Text("Reset all", color = lavender, fontWeight = FontWeight.Bold) } },
        containerColor = if (darkTheme) Color(0xFF111112) else Color(0xFFFFFEFF),
        titleContentColor = textPrimary,
        textContentColor = textPrimary
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
                color = if (darkTheme) Color(0xFF222426) else Color(0xFFF0ECFF)
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
                    fontFamily = ViaodaLibreFontFamily,
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
    val categoryName = job.category ?: job.subcategory.orEmpty()
    val tint = jobCategoryAccent(categoryName)
    val isHourly = job.projectType.orEmpty().contains("hour", ignoreCase = true) ||
        job.budgetType.orEmpty().contains("hour", ignoreCase = true)
    val budgetCaption = if (isHourly) "HOURLY RATE" else "FIXED BUDGET"
    val shape = RoundedCornerShape(25.dp)
    val cardSurface = if (darkTheme) Color(0xF5121213) else Color(0xF7FFFFFF)
    val outline = if (darkTheme) Color.White.copy(alpha = 0.10f) else Color(0xFF9C90C7).copy(alpha = 0.14f)
    val insetSurface = if (darkTheme) Color(0xFF1D1D1F) else Color(0xFFF2EFFA)

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
                        .background(if (darkTheme) Color(0xFF1A1A1C) else Color(0xFFF0EDF8))
                        .border(1.dp, if (darkTheme) Color.White.copy(alpha = 0.08f) else Color(0xFFE0DBEE), iconShape),
                    contentAlignment = Alignment.Center
                ) {
                    DomainArtwork(
                        index = jobCategoryArtwork(job.category ?: job.subcategory.orEmpty()),
                        contentDescription = job.category ?: "Project category",
                        modifier = Modifier.size(44.dp)
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
                            color = if (darkTheme) Color(0xFFC5B9E4) else Color(0xFF6757D9),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 0.3.sp,
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
                        style = TextStyle(
                            fontFamily = ChakraPetchFontFamily,
                            fontSize = 16.sp,
                            lineHeight = 21.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = (-0.15).sp
                        ),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )

                    job.client?.fullName?.takeIf(String::isNotBlank)?.let { client ->
                        Text(
                            "Posted by $client",
                            color = textMuted,
                            style = TextStyle(
                                fontFamily = FontFamily.SansSerif,
                                fontSize = 12.sp,
                                lineHeight = 17.sp,
                                fontWeight = FontWeight.Medium
                            ),
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
                    style = TextStyle(
                        fontFamily = FontFamily.SansSerif,
                        fontSize = 12.sp,
                        lineHeight = 18.sp,
                        fontWeight = FontWeight.Normal
                    ),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            if (job.skills.isNotEmpty()) {
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    maxItemsInEachRow = 3,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    job.skills.take(3).forEach { skill ->
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = insetSurface,
                            border = BorderStroke(
                                1.dp,
                                if (darkTheme) Color.White.copy(alpha = 0.08f)
                                else Color(0xFF8D82C0).copy(alpha = 0.075f)
                            )
                        ) {
                            Text(
                                skill,
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 6.dp),
                                color = if (darkTheme) Color(0xFFD6D6DA) else Color(0xFF35334A),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
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
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 6.dp),
                                color = textMuted,
                                fontSize = 10.sp,
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
                        color = if (darkTheme) Color(0xFFF2F0F5) else Color(0xFF08785C),
                        style = TextStyle(
                            fontFamily = ChakraPetchFontFamily,
                            fontSize = 14.sp,
                            lineHeight = 16.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = (-0.35).sp
                        ),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        budgetCaption,
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
                            fontFamily = FontFamily.SansSerif,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = (-0.1).sp,
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

private fun jobCategoryArtwork(category: String): Int {
    val normalized = category.lowercase(Locale.ROOT)
    return when {
        "admin" in normalized || "customer support" in normalized || "virtual assistant" in normalized -> 7
        "ai" in normalized || "machine learning" in normalized || "artificial intelligence" in normalized -> 10
        "cyber" in normalized || "security" in normalized || "legal" in normalized -> 11
        "business" in normalized || "finance" in normalized || "human resources" in normalized || " hr" in normalized -> 6
        "design" in normalized || "creative" in normalized || "ui/ux" in normalized -> 2
        "marketing" in normalized || "seo" in normalized || "advertis" in normalized -> 4
        "e-commerce" in normalized || "ecommerce" in normalized || "retail" in normalized -> 17
        "education" in normalized || "tutoring" in normalized || "coaching" in normalized -> 5
        "engineering" in normalized || "architecture" in normalized || "3d" in normalized -> 9
        "events" in normalized || "drones" in normalized || "local services" in normalized -> 16
        "gaming" in normalized || "esports" in normalized -> 12
        "data science" in normalized || "analytics" in normalized || "statistics" in normalized -> 3
        "mobile" in normalized || "android" in normalized || "ios" in normalized || "app development" in normalized -> 1
        "photography" in normalized || "image editing" in normalized || "photo" in normalized -> 15
        "social media" in normalized || "community" in normalized -> 18
        "software" in normalized || "desktop" in normalized || "cloud" in normalized || "web development" in normalized || "web" in normalized -> 0
        "translation" in normalized || "transcription" in normalized || "language" in normalized -> 14
        "video" in normalized || "audio" in normalized || "animation" in normalized -> 8
        "writing" in normalized || "content" in normalized || "copywriting" in normalized -> 13
        else -> 19
    }
}

@Composable
private fun DomainArtwork(
    index: Int,
    modifier: Modifier,
    contentDescription: String? = null
) {
    val context = LocalContext.current
    val atlas = remember(context) {
        runCatching {
            val encodedAtlas = listOf(
                R.raw.domain_art_sprite_01,
                R.raw.domain_art_sprite_02,
                R.raw.domain_art_sprite_03,
                R.raw.domain_art_sprite_04,
                R.raw.domain_art_sprite_05
            ).joinToString(separator = "") { resourceId ->
                context.resources.openRawResource(resourceId)
                    .bufferedReader()
                    .use { it.readText().trim() }
            }
            val bytes = Base64.decode(encodedAtlas, Base64.DEFAULT)
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
        }.getOrNull()
    }
    val safeIndex = index.coerceIn(0, 19)
    val cellSize = 48
    val painter = remember(atlas, safeIndex) {
        atlas?.let {
            BitmapPainter(
                image = it,
                srcOffset = IntOffset((safeIndex % 5) * cellSize, (safeIndex / 5) * cellSize),
                srcSize = IntSize(cellSize, cellSize)
            )
        }
    }

    if (painter != null) {
        Image(
            painter = painter,
            contentDescription = contentDescription,
            modifier = modifier
        )
    } else {
        Box(
            modifier = modifier
                .clip(RoundedCornerShape(9.dp))
                .background(Color(0xFF171718))
        )
    }
}

private fun displayCategoryLabel(category: String): String = when (category.lowercase(Locale.ROOT)) {
    "mobile app development" -> "Mobile Apps"
    "mobile development" -> "Mobile Apps"
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
