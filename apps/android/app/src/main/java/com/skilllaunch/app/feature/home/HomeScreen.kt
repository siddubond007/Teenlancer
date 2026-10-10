package com.skilllaunch.app.feature.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.border
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.AccessTime
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.outlined.BusinessCenter
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.AssistChip
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.offset
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil3.compose.SubcomposeAsyncImage
import coil3.compose.SubcomposeAsyncImageContent
import com.skilllaunch.app.core.common.collectAsStateWithLifecycleCompat
import com.skilllaunch.app.core.navigation.AppDestination
import com.skilllaunch.app.data.model.auth.AuthUser
import com.skilllaunch.app.data.model.home.HomeActionQueueItem
import com.skilllaunch.app.data.model.home.HomeAnalyticsResponse
import com.skilllaunch.app.data.model.home.HomeGigRecommendation
import com.skilllaunch.app.data.model.home.HomeProfileNudge
import com.skilllaunch.app.data.model.home.HomeRecommendedJob
import com.skilllaunch.app.data.model.home.HomeState
import com.skilllaunch.app.data.model.home.ClientDashboardState
import com.skilllaunch.app.data.repository.home.HomeRepository
import com.skilllaunch.app.data.repository.home.ClientDashboardRepository
import java.text.NumberFormat
import java.time.Duration
import java.time.Instant
import java.time.LocalTime
import java.util.Locale
import kotlin.math.roundToInt

private val StudentAccent = Color(0xFF047857)
private val ClientAccent = Color(0xFF4338CA)

@Composable
private fun HomeOfflineBanner(isStudent: Boolean) {
    val accent = if (isStudent) StudentAccent else ClientAccent

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = accent.copy(alpha = 0.09f),
        border = BorderStroke(1.dp, accent.copy(alpha = 0.20f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Outlined.AccessTime,
                contentDescription = "Offline",
                tint = accent,
                modifier = Modifier.size(20.dp)
            )
            Column(Modifier.weight(1f).padding(start = 9.dp)) {
                Text(
                    "OFFLINE MODE",
                    color = accent,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    "Showing saved Home data. It will refresh when you're online.",
                    modifier = Modifier.padding(top = 2.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
fun HomeScreen(
    user: AuthUser,
    homeRepository: HomeRepository,
    clientDashboardRepository: ClientDashboardRepository,
    onOpenDestination: (AppDestination) -> Unit,
    onLogout: () -> Unit,
    darkTheme: Boolean,
    onToggleTheme: () -> Unit
) {
    val viewModel: HomeViewModel = viewModel(
        key = "home-${user.id ?: "unknown"}",
        factory = remember(homeRepository, clientDashboardRepository, user.id) {
            HomeViewModel.factory(
                repository = homeRepository,
                clientDashboardRepository = clientDashboardRepository,
                userId = user.id.orEmpty()
            )
        }
    )
    val uiState by viewModel.uiState.collectAsStateWithLifecycleCompat()
    val matchedJobs by viewModel.matchedJobs.collectAsStateWithLifecycleCompat()
    val matchedGigs by viewModel.matchedGigs.collectAsStateWithLifecycleCompat()
    val discoveryCategory by viewModel.discoveryCategory.collectAsStateWithLifecycleCompat()
    val discoveryCategories by viewModel.discoveryCategories.collectAsStateWithLifecycleCompat()
    val discoveryLoading by viewModel.discoveryLoading.collectAsStateWithLifecycleCompat()
    val discoveryError by viewModel.discoveryError.collectAsStateWithLifecycleCompat()
    val profileNudges by viewModel.profileNudges.collectAsStateWithLifecycleCompat()
    val profileNudgesError by viewModel.profileNudgesError.collectAsStateWithLifecycleCompat()

    LaunchedEffect(user.id) {
        viewModel.load(forceRefresh = true)
    }

    val home = uiState.home
    val role = home?.role?.trim()?.uppercase(Locale.US)
    val handleActionQueueItem: (HomeActionQueueItem) -> Unit = { item ->
        val actionType = item.type?.trim()?.uppercase(Locale.US).orEmpty()
        if (actionType.contains("VERIFICATION") || actionType.contains("IDENTITY")) {
            onOpenDestination(AppDestination.Profile)
        } else {
            val orderId = item.orderId?.takeIf(String::isNotBlank)
            if (orderId != null) {
                onOpenDestination(AppDestination.OrderWorkspace(orderId))
            } else {
                onOpenDestination(AppDestination.Orders)
            }
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            home?.let {
                HomeTopBar(
                    state = it,
                    darkTheme = darkTheme,
                    onOpenProfile = { onOpenDestination(AppDestination.Profile) },
                    onOpenNotifications = { onOpenDestination(AppDestination.Notifications) },
                    onToggleTheme = onToggleTheme
                )
            }
        }
    ) { innerPadding ->
        when {
            uiState.isLoading && home == null -> HomeLoading(Modifier.padding(innerPadding))
            uiState.errorMessage != null && home == null -> HomeFailure(
                Modifier.padding(innerPadding),
                uiState.errorMessage ?: "Unable to load Home.",
                { viewModel.load(forceRefresh = true) },
                onLogout
            )
            home?.isSuspended == true || home?.isBanned == true -> HomeBlocked(
                Modifier.padding(innerPadding),
                onLogout
            )
            role == "STUDENT_FREELANCER" -> StudentHome(
                state = home,
                showOfflineBanner = uiState.isShowingCachedHome,
                marketplaceAnalytics = uiState.marketplaceAnalytics,
                matchedJobs = matchedJobs,
                discoveryLoading = discoveryLoading,
                discoveryError = discoveryError,
                profileNudges = profileNudges,
                profileNudgesError = profileNudgesError,
                onOpenProfile = { onOpenDestination(AppDestination.Profile) },
                modifier = Modifier.padding(innerPadding),
                onOpenWorkspace = {
                    home.activeWorkspace?.id?.let { id ->
                        onOpenDestination(AppDestination.OrderWorkspace(id))
                    }
                },
                onActionQueueItem = handleActionQueueItem,
                onOpenJob = { jobId ->
                    onOpenDestination(AppDestination.JobDetails(jobId))
                },
                onOpenExplore = { onOpenDestination(AppDestination.Explore) }
            )
            role == "CLIENT" -> ClientHome(
                state = home,
                showOfflineBanner = uiState.isShowingCachedHome,
                matchedGigs = matchedGigs,
                discoveryCategory = discoveryCategory,
                discoveryCategories = discoveryCategories,
                discoveryLoading = discoveryLoading,
                discoveryError = discoveryError,
                dashboard = uiState.clientDashboard,
                dashboardLoading = uiState.isClientDashboardLoading,
                dashboardErrorMessage = uiState.clientDashboardErrorMessage,
                onRetryDashboard = { viewModel.load(forceRefresh = true) },
                modifier = Modifier.padding(innerPadding),
                onOpenWorkspace = {
                    home.activeWorkspace?.id?.let { id ->
                        onOpenDestination(AppDestination.OrderWorkspace(id))
                    }
                },
                onOpenDashboardOrder = { id ->
                    onOpenDestination(AppDestination.OrderWorkspace(id))
                },
                onOpenDashboardJob = { id ->
                    onOpenDestination(AppDestination.ClientProjectDetails(id))
                },
                onActionQueueItem = handleActionQueueItem,
                onOpenGig = { gigId ->
                    onOpenDestination(AppDestination.GigDetails(gigId))
                },
                onOpenExplore = { onOpenDestination(AppDestination.Explore) },
                onPostJob = {
                    onOpenDestination(AppDestination.PostJob)
                }
            )
            else -> HomeFailure(
                Modifier.padding(innerPadding),
                "Your marketplace role could not be verified.",
                { viewModel.load(forceRefresh = true) },
                onLogout
            )
        }
    }
}

@Composable
private fun HomeTopBar(
    state: HomeState,
    darkTheme: Boolean,
    onOpenProfile: () -> Unit,
    onOpenNotifications: () -> Unit,
    onToggleTheme: () -> Unit
) {
    val client = state.role?.trim()?.uppercase(Locale.US) == "CLIENT"
    val greeting = if (client) "Welcome back" else greetingPrefix()
    val displayName = state.firstName
        ?.takeIf(String::isNotBlank)
        ?.let { "Hello, $it" }
        ?: "Hello there"
    val accent = if (client) ClientAccent else StudentAccent

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(78.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                onClick = onOpenProfile,
                modifier = Modifier.size(42.dp).clip(CircleShape),
                shape = CircleShape,
                color = accent
            ) {
                if (state.avatarUrl.isNullOrBlank()) {
                    InitialsAvatar(displayName, accent)
                } else {
                    SubcomposeAsyncImage(
                        model = state.avatarUrl,
                        contentDescription = "Open profile",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop,
                        loading = { InitialsAvatar(displayName, accent) },
                        error = { InitialsAvatar(displayName, accent) },
                        success = { SubcomposeAsyncImageContent() }
                    )
                }
            }

            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 12.dp)
            ) {
                Text(
                    greeting,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    displayName,
                    maxLines = 1,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold
                )
            }

            FinancialPill(state, accent)

            Spacer(Modifier.width(6.dp))

            Box(
                modifier = Modifier.size(36.dp),
                contentAlignment = Alignment.Center
            ) {
                Surface(
                    modifier = Modifier.size(36.dp),
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.06f)
                ) {
                    IconButton(
                        onClick = onOpenNotifications,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Icon(
                            Icons.Outlined.NotificationsNone,
                            contentDescription = "Notifications",
                            modifier = Modifier.size(19.dp)
                        )
                    }
                }
                if (state.unreadNotifications > 0) {
                    Surface(
                        modifier = Modifier
                            .size(6.dp)
                            .align(Alignment.TopEnd)
                            .offset(x = (-6).dp, y = 7.dp),
                        shape = CircleShape,
                        color = Color(0xFFEF4444)
                    ) {}
                }
            }
        }
    }
}
@Composable
private fun InitialsAvatar(name: String, accent: Color) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(
            name.split(" ").filter(String::isNotBlank).take(2)
                .mapNotNull { it.firstOrNull() }.joinToString("").ifBlank { "T" },
            color = Color.White,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.ExtraBold
        )
    }
}

@Composable
private fun FinancialPill(state: HomeState, accent: Color) {
    val client = state.role?.trim()?.uppercase(Locale.US) == "CLIENT"
    Surface(
        shape = RoundedCornerShape(50),
        color = accent.copy(alpha = 0.09f),
        border = BorderStroke(1.dp, accent.copy(alpha = 0.18f))
    ) {
        Text(
            if (client) {
                "Escrow: ₹" + formatMoney(state.financialSummary)
            } else {
                "₹" + formatMoney(state.financialSummary)
            },
            Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
            color = accent,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.ExtraBold
        )
    }
}

@Composable
private fun PremiumProgressRing(
    progress: Float,
    accent: Color,
    caption: String
) {
    val safeProgress = progress.coerceIn(0f, 1f)
    Box(
        modifier = Modifier.size(88.dp),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(
            progress = { 1f },
            modifier = Modifier.fillMaxSize(),
            color = accent.copy(alpha = 0.16f),
            strokeWidth = 7.dp
        )
        CircularProgressIndicator(
            progress = { safeProgress },
            modifier = Modifier.fillMaxSize(),
            color = accent,
            strokeWidth = 7.dp
        )
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                (safeProgress * 100).toInt().toString() + "%",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.ExtraBold
            )
            Text(
                caption,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.labelSmall
            )
        }
    }
}

@Composable
private fun PremiumHomeOverview(
    state: HomeState,
    isStudent: Boolean,
    accent: Color
) {
    val workspace = state.activeWorkspace
    val foundationCount = listOf(
        state.profileComplete,
        state.proofOfWorkComplete,
        state.hasGig,
        state.hasProposal
    ).count { it }
    val progress = if (isStudent) foundationCount / 4f else null
    val title = if (isStudent) {
        "Build your freelance momentum"
    } else {
        "Find your next great collaborator"
    }
    val supportingText = if (isStudent) {
        foundationCount.toString() + " of 4 foundations completed"
    } else {
        state.topVerifiedGigs.size.toString() + " verified services available to explore"
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(28.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 8.dp,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.20f))
    ) {
        Box {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .size(156.dp)
                    .offset(x = 62.dp, y = (-66).dp)
                    .background(
                        Brush.radialGradient(
                            listOf(
                                accent.copy(alpha = 0.22f),
                                accent.copy(alpha = 0.07f),
                                Color.Transparent
                            )
                        ),
                        CircleShape
                    )
            )
            Column(Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(
                            if (isStudent) "YOUR MOMENTUM" else "YOUR COMMAND CENTER",
                            color = accent,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text(
                            if (isStudent) "Make every project count" else "Bring your next idea to life",
                            modifier = Modifier.padding(top = 4.dp),
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Surface(
                        modifier = Modifier.size(38.dp),
                        shape = RoundedCornerShape(14.dp),
                        color = accent.copy(alpha = 0.12f),
                        border = BorderStroke(1.dp, accent.copy(alpha = 0.20f))
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                Icons.Outlined.AutoAwesome,
                                contentDescription = null,
                                modifier = Modifier.size(20.dp),
                                tint = accent
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 18.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .padding(end = 12.dp)
                    ) {
                        Text(
                            if (isStudent) "PROFILE READINESS" else "TALENT RADAR",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text(
                            title,
                            modifier = Modifier.padding(top = 6.dp),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.ExtraBold,
                            maxLines = 2
                        )
                        Text(
                            supportingText,
                            modifier = Modifier.padding(top = 6.dp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }

                    if (progress != null) {
                        PremiumProgressRing(
                            progress = progress,
                            accent = accent,
                            caption = "SETUP"
                        )
                    } else {
                        Surface(
                            modifier = Modifier.size(88.dp),
                            shape = CircleShape,
                            color = accent.copy(alpha = 0.09f),
                            border = BorderStroke(1.dp, accent.copy(alpha = 0.24f))
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                Text(
                                    state.topVerifiedGigs.size.toString(),
                                    color = accent,
                                    style = MaterialTheme.typography.headlineMedium,
                                    fontWeight = FontWeight.ExtraBold
                                )
                                Text(
                                    "SERVICES",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    style = MaterialTheme.typography.labelSmall
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(9.dp)
    ) {
        PremiumMetricCard(
            modifier = Modifier.weight(1f),
            label = if (isStudent) "WALLET" else "ESCROW",
            value = "₹" + formatMoney(state.financialSummary),
            detail = if (isStudent) "Available balance" else "Held for projects",
            accent = accent,
            icon = if (isStudent) Icons.Outlined.AccountBalanceWallet else null
        )
        PremiumMetricCard(
            modifier = Modifier.weight(1f),
            label = if (isStudent) "TO DO" else "REVIEWS",
            value = state.actionQueue.size.toString(),
            detail = if (isStudent) "Needs attention" else "Awaiting review",
            accent = if (state.actionQueue.isNotEmpty()) {
                if (isStudent) Color(0xFFF59E0B) else Color(0xFFFB8B79)
            } else accent,
            icon = if (isStudent) Icons.Outlined.AccessTime else null
        )
        PremiumMetricCard(
            modifier = Modifier.weight(1f),
            label = if (isStudent) "JOBS" else "TALENT",
            value = if (isStudent) state.recommendedJobs.size.toString()
                else state.topVerifiedGigs.size.toString(),
            detail = if (isStudent) "Recommended" else "Verified gigs",
            accent = accent,
            icon = if (isStudent) Icons.Outlined.BusinessCenter else null
        )
    }
}

@Composable
private fun PremiumMetricCard(
    modifier: Modifier,
    label: String,
    value: String,
    detail: String,
    accent: Color,
    icon: ImageVector? = null
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.70f),
        border = BorderStroke(1.dp, accent.copy(alpha = 0.15f))
    ) {
        Column(Modifier.padding(horizontal = 10.dp, vertical = 12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    label,
                    color = accent,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1
                )
                if (icon != null) {
                    Box(
                        modifier = Modifier
                            .size(22.dp)
                            .clip(RoundedCornerShape(7.dp))
                            .background(accent.copy(alpha = 0.10f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            modifier = Modifier.size(13.dp),
                            tint = accent
                        )
                    }
                }
            }
            Text(
                value,
                modifier = Modifier.padding(top = 5.dp),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold,
                maxLines = 1
            )
            Text(
                detail,
                modifier = Modifier.padding(top = 3.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.labelSmall,
                maxLines = 1
            )
        }
    }
}

@Composable
private fun StudentHome(
    state: HomeState,
    showOfflineBanner: Boolean,
    marketplaceAnalytics: HomeAnalyticsResponse?,
    matchedJobs: List<HomeRecommendedJob>,
    discoveryLoading: Boolean,
    discoveryError: String?,
    profileNudges: List<HomeProfileNudge>,
    profileNudgesError: String?,
    onOpenProfile: () -> Unit,
    modifier: Modifier,
    onOpenWorkspace: () -> Unit,
    onActionQueueItem: (HomeActionQueueItem) -> Unit,
    onOpenJob: (String) -> Unit,
    onOpenExplore: () -> Unit
) {
    LazyColumn(
        modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        MaterialTheme.colorScheme.background,
                        MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                        MaterialTheme.colorScheme.background
                    )
                )
            ),
        contentPadding = PaddingValues(18.dp, 15.dp, 18.dp, 28.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        if (showOfflineBanner) {
            item { HomeOfflineBanner(isStudent = true) }
        }

        if (state.actionQueue.isNotEmpty()) {
            item {
                ActionQueueSection(
                    items = state.actionQueue,
                    isStudent = true,
                    onAction = { item ->
                        onActionQueueItem(item)
                    }
                )
            }
        }

        item {
            PremiumHomeOverview(
                state = state,
                isStudent = true,
                accent = StudentAccent
            )
        }

        item {
            DiscoverySearchBar(
                accent = StudentAccent,
                hint = "Search jobs, skills, or categories",
                onClick = onOpenExplore
            )
        }

        item {
            DiscoverySectionHeader(
                accent = StudentAccent,
                eyebrow = "MATCHED TO YOUR SKILLS",
                title = "Recommended jobs",
                onViewAll = onOpenExplore
            )
        }
        if (discoveryLoading) {
            item {
                Stage2UnavailableCard(
                    title = "Personalizing your opportunities",
                    message = "We are matching open projects to the skills and categories saved on your profile."
                )
            }
        } else if (!discoveryError.isNullOrBlank()) {
            item {
                Stage2UnavailableCard(
                    title = "Opportunity discovery unavailable",
                    message = discoveryError
                )
            }
        } else if (matchedJobs.isEmpty()) {
            item {
                StudentJobsEmptyState(accent = StudentAccent)
            }
        } else {
            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(horizontal = 1.dp)
                ) {
                    items(
                        items = matchedJobs,
                        key = { it.id ?: it.title.orEmpty() }
                    ) { job ->
                        RecommendedJobCard(
                            job = job,
                            accent = StudentAccent,
                            onOpenJob = {
                                job.id?.let(onOpenJob)
                            },
                            onOpenExplore = onOpenExplore
                        )
                    }
                }
            }
        }

        item {
            Stage2SectionTitle(
                accent = StudentAccent,
                eyebrow = "YOUR WORKSPACE",
                title = "Active Orders"
            )
        }
        item {
            StudentActiveOrderCard(
                workspace = state.activeWorkspace,
                accent = StudentAccent,
                onOpenWorkspace = onOpenWorkspace
            )
        }

        marketplaceAnalytics
            ?.takeIf { it.publishedGigCount > 0 }
            ?.let { analytics ->
                item {
                    MarketplaceIntelligenceSection(
                        analytics = analytics,
                        accent = StudentAccent
                    )
                }
            }

        if (profileNudges.isNotEmpty() || !profileNudgesError.isNullOrBlank()) {
            item {
                Stage2SectionTitle(
                    accent = StudentAccent,
                    eyebrow = "PROFILE & GROWTH",
                    title = "Build a stronger reputation"
                )
            }
            if (!profileNudgesError.isNullOrBlank()) {
                item {
                    Stage2UnavailableCard(
                        title = "Growth suggestions unavailable",
                        message = profileNudgesError
                    )
                }
            } else {
                items(
                    items = profileNudges,
                    key = { it.id ?: it.title.orEmpty() }
                ) { nudge ->
                    ProfileNudgeCard(
                        nudge = nudge,
                        accent = StudentAccent,
                        onClick = onOpenProfile
                    )
                }
            }
        }
    }
}


@Composable
private fun GigPerformanceMiniChart(
    impressions: Int,
    views: Int,
    clicks: Int,
    orders: Int,
    periodDays: Int,
    accent: Color
) {
    val metrics = listOf(
        "IMP" to impressions.coerceAtLeast(0),
        "VIEWS" to views.coerceAtLeast(0),
        "CLICKS" to clicks.coerceAtLeast(0),
        "ORDERS" to orders.coerceAtLeast(0)
    )
    val scaleMaximum = metrics.maxOfOrNull { it.second }?.coerceAtLeast(1) ?: 1

    Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Text(
            "METRIC MIX · LAST ${periodDays.coerceAtLeast(1)} DAYS",
            color = accent,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.ExtraBold
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            metrics.forEach { (label, value) ->
                val fraction = value.toFloat() / scaleMaximum.toFloat()
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    Text(
                        formatAnalyticsCount(value),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1
                    )
                    Box(
                        modifier = Modifier.fillMaxWidth().height(38.dp),
                        contentAlignment = Alignment.BottomCenter
                    ) {
                        Surface(
                            modifier = Modifier
                                .width(18.dp)
                                .height((4f + 32f * fraction).dp),
                            shape = RoundedCornerShape(topStart = 5.dp, topEnd = 5.dp),
                            color = accent.copy(
                                alpha = if (value == 0) 0.16f else 0.28f + 0.62f * fraction
                            )
                        ) {}
                    }
                    Text(
                        label,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1
                    )
                }
            }
        }
        Text(
            "Bar height is relative to this gig's largest metric.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.labelSmall
        )
    }
}


@Composable
private fun MarketplaceIntelligenceSection(
    analytics: HomeAnalyticsResponse,
    accent: Color
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Stage2SectionTitle(
            accent = accent,
            eyebrow = "YOUR PUBLISHED GIGS",
            title = "Marketplace Intelligence"
        )

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 4.dp,
            border = BorderStroke(1.dp, accent.copy(alpha = 0.18f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "CONVERSION RATE",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text(
                            String.format(Locale.US, "%.2f%%", analytics.totals.conversionRate),
                            modifier = Modifier.padding(top = 3.dp),
                            color = accent,
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                    WorkspaceStatusPill(
                        text = "${analytics.publishedGigCount} published",
                        accent = accent
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                    PremiumMetricCard(
                        modifier = Modifier.weight(1f),
                        label = "IMPRESSIONS",
                        value = formatAnalyticsCount(analytics.totals.impressions),
                        detail = "Gig cards shown",
                        accent = accent
                    )
                    PremiumMetricCard(
                        modifier = Modifier.weight(1f),
                        label = "VIEWS",
                        value = formatAnalyticsCount(analytics.totals.views),
                        detail = "Gig details opened",
                        accent = accent
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                    PremiumMetricCard(
                        modifier = Modifier.weight(1f),
                        label = "CLICKS",
                        value = formatAnalyticsCount(analytics.totals.clicks),
                        detail = "Gig card taps",
                        accent = accent
                    )
                    PremiumMetricCard(
                        modifier = Modifier.weight(1f),
                        label = "ORDERS",
                        value = formatAnalyticsCount(analytics.totals.orders),
                        detail = "Completed",
                        accent = accent
                    )
                }

                if (analytics.gigs.isNotEmpty()) {
                    Text(
                        "PUBLISHED GIG BREAKDOWN",
                        color = accent,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.ExtraBold
                    )
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        contentPadding = PaddingValues(horizontal = 1.dp)
                    ) {
                        items(
                            items = analytics.gigs,
                            key = { it.gigId }
                        ) { gig ->
                            Surface(
                                modifier = Modifier.width(250.dp),
                                shape = RoundedCornerShape(16.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
                                border = BorderStroke(1.dp, accent.copy(alpha = 0.14f))
                            ) {
                                Column(
                                    modifier = Modifier.padding(13.dp),
                                    verticalArrangement = Arrangement.spacedBy(5.dp)
                                ) {
                                    Text(
                                        gig.title.ifBlank { "Untitled gig" },
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.ExtraBold,
                                        maxLines = 2
                                    )
                                    if (!gig.category.isNullOrBlank()) {
                                        Text(
                                            gig.category,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            style = MaterialTheme.typography.labelSmall
                                        )
                                    }
                                    GigPerformanceMiniChart(
                                        impressions = gig.impressions,
                                        views = gig.views,
                                        clicks = gig.clicks,
                                        orders = gig.orders,
                                        periodDays = analytics.periodDays,
                                        accent = accent
                                    )
                                    Text(
                                        "${formatAnalyticsCount(gig.impressions)} impressions · ${formatAnalyticsCount(gig.views)} views",
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                    Text(
                                        "${formatAnalyticsCount(gig.clicks)} card taps · ${formatAnalyticsCount(gig.orders)} orders",
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                    Text(
                                        String.format(Locale.US, "%.2f%% conversion", gig.conversionRate),
                                        color = accent,
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }

                Text(
                    "Based on the last ${analytics.periodDays.coerceAtLeast(1)} days of recorded activity.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}

private fun formatAnalyticsCount(value: Int): String =
    NumberFormat.getIntegerInstance(Locale.US).format(value.coerceAtLeast(0))


@Composable
private fun ProfileNudgeCard(
    nudge: HomeProfileNudge,
    accent: Color,
    onClick: () -> Unit
) {
    val nudgeIcon = when (nudge.type?.uppercase(Locale.US)) {
        "PORTFOLIO" -> Icons.Outlined.Description
        "VERIFICATION" -> Icons.Outlined.Shield
        else -> Icons.Outlined.AutoAwesome
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 4.dp,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.16f))
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Surface(
                    modifier = Modifier.size(44.dp),
                    shape = RoundedCornerShape(14.dp),
                    color = accent.copy(alpha = 0.09f)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = nudgeIcon,
                            contentDescription = null,
                            modifier = Modifier.size(22.dp),
                            tint = accent
                        )
                    }
                }
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(start = 12.dp)
                ) {
                    Text(
                        nudge.title ?: "Build a stronger profile",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        nudge.subtitle ?: "Small profile improvements can help clients understand your strengths.",
                        modifier = Modifier.padding(top = 5.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            OutlinedButton(
                onClick = onClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 14.dp),
                border = BorderStroke(1.dp, accent.copy(alpha = 0.65f)),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = accent)
            ) {
                Text(
                    nudge.actionLabel ?: "Update Profile",
                    fontWeight = FontWeight.Bold
                )
                Icon(
                    Icons.AutoMirrored.Outlined.ArrowForward,
                    contentDescription = null,
                    modifier = Modifier.padding(start = 7.dp).size(16.dp)
                )
            }
        }
    }
}


@Composable
private fun ActionQueueSection(
    items: List<HomeActionQueueItem>,
    isStudent: Boolean,
    onAction: (HomeActionQueueItem) -> Unit
) {
    val accent = if (isStudent) Color(0xFFFBBF24) else Color(0xFFFDA48D)
    val labelAccent = if (isStudent) Color(0xFF92400E) else Color(0xFFB9384A)
    val border = if (isStudent) {
        Color(0xFFF59E0B).copy(alpha = 0.38f)
    } else {
        Color(0xFFFB9278).copy(alpha = 0.36f)
    }
    val background = if (isStudent) {
        Brush.linearGradient(
            listOf(
                Color(0xFFFFF1C6),
                Color(0xFFFFD977)
            )
        )
    } else {
        Brush.linearGradient(
            listOf(
                Color(0xFFFFE9E3),
                Color(0xFFFFC2B5)
            )
        )
    }

    Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .width(13.dp)
                    .height(1.dp)
                    .background(labelAccent)
            )
            Text(
                if (isStudent) "NEEDS ATTENTION" else "ACTION REQUIRED",
                modifier = Modifier.padding(start = 6.dp),
                color = labelAccent,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.ExtraBold
            )
            Spacer(Modifier.weight(1f))
            Surface(
                modifier = Modifier.size(17.dp),
                shape = CircleShape,
                color = labelAccent.copy(alpha = 0.08f),
                border = BorderStroke(1.dp, labelAccent.copy(alpha = 0.35f))
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        items.size.toString(),
                        color = labelAccent,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }
        }

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(horizontal = 2.dp)
        ) {
            items(
                items = items,
                key = { it.id ?: it.orderId ?: it.title.orEmpty() }
            ) { item ->
                ActionQueueCard(
                    item = item,
                    isStudent = isStudent,
                    accent = accent,
                    border = border,
                    background = background,
                    onAction = { onAction(item) },
                    modifier = Modifier.width(300.dp)
                )
            }
        }
    }
}

@Composable
private fun ActionQueueCard(
    item: HomeActionQueueItem,
    isStudent: Boolean,
    accent: Color,
    border: Color,
    background: Brush,
    onAction: () -> Unit,
    modifier: Modifier = Modifier
) {
    val buttonBackground = if (isStudent) {
        Brush.linearGradient(
            listOf(Color(0xFFFBBF24), Color(0xFFF59E0B))
        )
    } else {
        Brush.linearGradient(
            listOf(Color(0xFFFDA48D), Color(0xFFFB7185))
        )
    }
    val buttonText = if (isStudent) Color(0xFF291603) else Color(0xFF2E1116)

    val actionType = item.type?.trim()?.uppercase(Locale.US).orEmpty()
    val actionIcon = when {
        actionType.contains("VERIFICATION") || actionType.contains("IDENTITY") ->
            Icons.Outlined.Shield
        actionType.contains("REVISION") -> Icons.Outlined.Description
        actionType.contains("PAYMENT") || actionType.contains("FUND") ||
            actionType.contains("ESCROW") -> Icons.Outlined.Lock
        actionType.contains("REVIEW") || actionType.contains("DELIVERED") ->
            Icons.Outlined.Check
        actionType.contains("DEADLINE") || actionType.contains("SUBMIT") ->
            Icons.Outlined.AccessTime
        else -> if (isStudent) Icons.Outlined.AccessTime else Icons.Outlined.Description
    }
    val fallbackActionLabel = when {
        actionType.contains("VERIFICATION") || actionType.contains("IDENTITY") ->
            "Check Verification"
        actionType.contains("REVISION") -> "Resubmit Work"
        actionType.contains("PAYMENT") || actionType.contains("FUND") ||
            actionType.contains("ESCROW") -> "Fund Escrow"
        actionType.contains("REVIEW") || actionType.contains("DELIVERED") ->
            "Review Work"
        else -> if (isStudent) "Submit Work" else "Review Work"
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(background)
            .border(1.dp, border, RoundedCornerShape(24.dp))
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top
        ) {
            Surface(
                modifier = Modifier.size(42.dp),
                shape = RoundedCornerShape(13.dp),
                color = if (isStudent) Color(0xFFFFE08A) else Color(0xFFFFB8A7),
                border = BorderStroke(1.dp, accent.copy(alpha = 0.38f))
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = actionIcon,
                        contentDescription = null,
                        modifier = Modifier.size(21.dp),
                        tint = if (isStudent) Color(0xFF78350F) else Color(0xFF9F303D)
                    )
                }
            }

            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 11.dp)
            ) {
                Text(
                    item.title ?: if (isStudent) "Deliverable due soon" else "Review delivery",
                    color = if (isStudent) Color(0xFF3B2606) else Color(0xFF40191E),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 2
                )
                Text(
                    item.subtitle ?: "Order workspace",
                    modifier = Modifier.padding(top = 4.dp),
                    color = if (isStudent) Color(0xFF6B4E16) else Color(0xFF82444A),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 2
                )
                Surface(
                    onClick = onAction,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp)
                        .height(38.dp),
                    shape = RoundedCornerShape(10.dp),
                    color = Color.Transparent
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(buttonBackground, RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                item.actionLabel ?: fallbackActionLabel,
                                color = buttonText,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.ExtraBold
                            )
                            Icon(
                                Icons.AutoMirrored.Outlined.ArrowForward,
                                contentDescription = null,
                                modifier = Modifier
                                    .padding(start = 3.dp)
                                    .size(15.dp),
                                tint = buttonText
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Stage2SectionTitle(
    accent: Color,
    eyebrow: String,
    title: String
) {
    Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .width(13.dp)
                    .height(1.dp)
                    .background(accent)
            )
            Text(
                eyebrow,
                modifier = Modifier.padding(start = 6.dp),
                color = accent,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.ExtraBold
            )
        }
        Text(
            title,
            modifier = Modifier.padding(top = 5.dp),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.ExtraBold
        )
    }
}

@Composable
private fun StudentActiveOrderCard(
    workspace: com.skilllaunch.app.data.model.home.HomeActiveWorkspace?,
    accent: Color,
    onOpenWorkspace: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(26.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 7.dp,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.20f))
    ) {
        if (workspace == null) {
            Stage2UnavailableCard(
                title = "No active orders yet",
                message = "Funded and in-progress orders will appear here once work starts."
            )
        } else {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        modifier = Modifier.size(35.dp),
                        shape = RoundedCornerShape(11.dp),
                        color = Color(0xFF083F36)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                initials(workspace.counterpartName),
                                color = Color(0xFF8FF6D2),
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                    }
                    Column(
                        modifier = Modifier.weight(1f).padding(start = 10.dp)
                    ) {
                        Text(
                            "CLIENT",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            workspace.counterpartName ?: "Client",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                    WorkspaceStatusPill(
                        text = workspace.status
                            ?.takeIf(String::isNotBlank)
                            ?.toDisplayStatus()
                            ?: workspace.escrowStatus?.takeIf(String::isNotBlank)
                            ?: "Active",
                        accent = accent
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 19.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        workspace.title ?: "Active project",
                        modifier = Modifier.weight(1f),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        workspace.progressPercent.toString() + "%",
                        color = accent,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
                LinearProgressIndicator(
                    progress = { workspace.progressPercent.coerceIn(0, 100) / 100f },
                    modifier = Modifier.fillMaxWidth().padding(top = 9.dp).height(7.dp).clip(RoundedCornerShape(50)),
                    color = accent,
                    trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.10f)
                )
                WorkspaceDeadline(workspace.deadline)
                Surface(
                    onClick = onOpenWorkspace,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    color = accent
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 11.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "View Workspace",
                            color = Color.White,
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Icon(
                            Icons.AutoMirrored.Outlined.ArrowForward,
                            contentDescription = null,
                            modifier = Modifier.padding(start = 3.dp).size(16.dp),
                            tint = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ClientActiveProjectCard(
    workspace: com.skilllaunch.app.data.model.home.HomeActiveWorkspace?,
    accent: Color,
    onOpenWorkspace: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(26.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 7.dp,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.20f))
    ) {
        if (workspace == null) {
            Stage2UnavailableCard(
                title = "No active projects yet",
                message = "Projects you hire students for will appear here once work starts."
            )
        } else {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    AvatarForWorkspace(
                        name = workspace.counterpartName ?: "Student",
                        avatarUrl = workspace.counterpartAvatarUrl,
                        accent = accent
                    )
                    Column(
                        modifier = Modifier.weight(1f).padding(start = 10.dp)
                    ) {
                        Text(
                            "WORKING WITH",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            workspace.counterpartName ?: "Student freelancer",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                    WorkspaceStatusPill(
                        text = workspace.status.toDisplayStatus(),
                        accent = accent
                    )
                }
                Text(
                    workspace.title ?: "Active project",
                    modifier = Modifier.padding(top = 19.dp),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold
                )
                WorkspaceDeadline(workspace.deadline, prefix = "Delivery expected")
                Surface(
                    onClick = onOpenWorkspace,
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    shape = RoundedCornerShape(12.dp),
                    color = accent
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 11.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Open Workspace",
                            color = Color.White,
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Icon(
                            Icons.AutoMirrored.Outlined.ArrowForward,
                            contentDescription = null,
                            modifier = Modifier.padding(start = 3.dp).size(16.dp),
                            tint = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RecommendedJobCard(
    job: com.skilllaunch.app.data.model.home.HomeRecommendedJob,
    accent: Color,
    onOpenJob: () -> Unit,
    onOpenExplore: () -> Unit
) {
    Surface(
        modifier = Modifier.width(292.dp),
        shape = RoundedCornerShape(22.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 4.dp,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.22f))
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    modifier = Modifier.size(42.dp),
                    shape = RoundedCornerShape(13.dp),
                    color = accent.copy(alpha = 0.12f),
                    border = BorderStroke(1.dp, accent.copy(alpha = 0.16f))
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Outlined.BusinessCenter,
                            contentDescription = null,
                            modifier = Modifier.size(21.dp),
                            tint = accent
                        )
                    }
                }
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(start = 10.dp)
                ) {
                    Text(
                        job.title ?: "Custom project",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 2
                    )
                    Text(
                        "Est. " + (job.budgetLabel ?: "Budget on request"),
                        modifier = Modifier.padding(top = 4.dp),
                        color = accent,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 1
                    )
                }
            }

            if (job.skills.isNotEmpty()) {
                Row(
                    modifier = Modifier.padding(top = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    job.skills.take(3).forEach { skill ->
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = accent.copy(alpha = 0.09f)
                        ) {
                            Text(
                                skill,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1
                            )
                        }
                    }
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Outlined.AccessTime,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    relativePostedTime(job.createdAt),
                    modifier = Modifier.padding(start = 5.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.labelSmall
                )
                Spacer(Modifier.weight(1f))
                Text(
                    "Public project",
                    color = accent,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold
                )
            }

            Surface(
                onClick = if (job.id.isNullOrBlank()) onOpenExplore else onOpenJob,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp)
                    .height(39.dp),
                shape = RoundedCornerShape(12.dp),
                color = accent
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        "View opportunity",
                        color = Color.White,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Icon(
                        Icons.AutoMirrored.Outlined.ArrowForward,
                        contentDescription = null,
                        modifier = Modifier.padding(start = 7.dp).size(16.dp),
                        tint = Color.White
                    )
                }
            }
        }
    }
}

private fun relativePostedTime(createdAt: String?): String =
    runCatching {
        if (createdAt.isNullOrBlank()) return "Recently"
        val posted = Instant.parse(createdAt)
        val minutes = Duration.between(posted, Instant.now()).toMinutes().coerceAtLeast(0)
        when {
            minutes < 1 -> "Just now"
            minutes < 60 -> minutes.toString() + "m ago"
            minutes < 1440 -> (minutes / 60).toString() + "h ago"
            else -> (minutes / 1440).toString() + "d ago"
        }
    }.getOrDefault("Recently")

@Composable
private fun GigRecommendationCard(
    gig: com.skilllaunch.app.data.model.home.HomeGigRecommendation,
    accent: Color,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = Modifier.width(176.dp),
        shape = RoundedCornerShape(22.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 5.dp,
        border = BorderStroke(
            1.dp,
            accent.copy(alpha = 0.18f)
        )
    ) {
        Column {
            if (!gig.coverImage.isNullOrBlank()) {
                SubcomposeAsyncImage(
                    model = gig.coverImage,
                    contentDescription = gig.title.orEmpty(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(104.dp),
                    contentScale = ContentScale.Crop,
                    success = { SubcomposeAsyncImageContent() }
                )
            } else {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(104.dp),
                    color = accent.copy(alpha = 0.10f)
                ) {}
            }

            Column(Modifier.padding(12.dp)) {
                Text(
                    gig.title ?: "Service",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 2
                )
                Text(
                    gig.sellerName ?: "Verified student",
                    modifier = Modifier.padding(top = 4.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.labelSmall,
                    maxLines = 1
                )
                Row(
                    modifier = Modifier.padding(top = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "★ " + String.format(Locale.US, "%.1f", gig.rating),
                        color = accent,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.weight(1f))
                    Text(
                        "From ₹" + formatMoney(gig.startingPrice),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }
        }
    }
}

@Composable
private fun DiscoverySearchBar(
    accent: Color,
    hint: String,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.24f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 13.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Outlined.Search,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(21.dp)
            )
            Text(
                hint,
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 10.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 1
            )
            Surface(
                shape = RoundedCornerShape(11.dp),
                color = accent,
                modifier = Modifier.size(38.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Outlined.Tune,
                        contentDescription = "Open discovery filters",
                        tint = Color.White,
                        modifier = Modifier.size(19.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun DiscoverySectionHeader(
    accent: Color,
    eyebrow: String,
    title: String,
    onViewAll: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Bottom
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .width(13.dp)
                        .height(1.dp)
                        .background(accent)
                )
                Text(
                    eyebrow,
                    modifier = Modifier.padding(start = 6.dp),
                    color = accent,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.ExtraBold
                )
            }
            Text(
                title,
                modifier = Modifier.padding(top = 5.dp),
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.ExtraBold
            )
        }
        Surface(
            onClick = onViewAll,
            shape = RoundedCornerShape(12.dp),
            color = accent.copy(alpha = 0.10f),
            border = BorderStroke(1.dp, accent.copy(alpha = 0.18f))
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "View all",
                    color = accent,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.ExtraBold
                )
                Icon(
                    Icons.AutoMirrored.Outlined.ArrowForward,
                    contentDescription = null,
                    modifier = Modifier.padding(start = 5.dp).size(15.dp),
                    tint = accent
                )
            }
        }
    }
}

@Composable
private fun StudentJobsEmptyState(accent: Color) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.18f))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            Surface(
                modifier = Modifier.size(42.dp),
                shape = RoundedCornerShape(14.dp),
                color = accent.copy(alpha = 0.10f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Outlined.BusinessCenter,
                        contentDescription = null,
                        modifier = Modifier.size(21.dp),
                        tint = accent
                    )
                }
            }

            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 12.dp)
            ) {
                Text(
                    "No matching jobs yet",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    "New projects that match your saved skills or category will appear here.",
                    modifier = Modifier.padding(top = 6.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
@Composable
private fun Stage2UnavailableCard(
    title: String,
    message: String
) {
    Column(modifier = Modifier.padding(18.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
        Text(
            message,
            modifier = Modifier.padding(top = 6.dp),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodySmall
        )
    }
}

@Composable
private fun WorkspaceStatusPill(
    text: String,
    accent: Color
) {
    Surface(
        shape = RoundedCornerShape(50),
        color = accent.copy(alpha = 0.10f),
        border = BorderStroke(1.dp, accent.copy(alpha = 0.18f))
    ) {
        Text(
            text,
            modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
            color = accent,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.ExtraBold
        )
    }
}

@Composable
private fun WorkspaceDeadline(
    deadline: String?,
    prefix: String = "Deadline:"
) {
    Row(
        modifier = Modifier.padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            Icons.Outlined.Lock,
            contentDescription = null,
            modifier = Modifier.size(14.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            prefix + " " + relativeDeadline(
                deadline = deadline,
                tomorrowForDelivery = prefix == "Delivery expected"
            ),
            modifier = Modifier.padding(start = 6.dp),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodySmall
        )
    }
}

@Composable
private fun AvatarForWorkspace(
    name: String,
    avatarUrl: String?,
    accent: Color
) {
    Surface(
        modifier = Modifier.size(41.dp),
        shape = CircleShape,
        color = accent
    ) {
        if (avatarUrl.isNullOrBlank()) {
            Box(contentAlignment = Alignment.Center) {
                Text(initials(name), color = Color.White, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            }
        } else {
            SubcomposeAsyncImage(
                model = avatarUrl,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
                loading = {
                    Box(contentAlignment = Alignment.Center) {
                        Text(initials(name), color = Color.White, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
                    }
                },
                error = {
                    Box(contentAlignment = Alignment.Center) {
                        Text(initials(name), color = Color.White, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
                    }
                },
                success = { SubcomposeAsyncImageContent() }
            )
        }
    }
}

private fun initials(name: String?): String =
    name.orEmpty()
        .split(" ")
        .filter(String::isNotBlank)
        .take(2)
        .mapNotNull { it.firstOrNull() }
        .joinToString("")
        .ifBlank { "T" }

private fun relativeDeadline(
    deadline: String?,
    tomorrowForDelivery: Boolean = false
): String {
    val target = deadline
        ?.let { runCatching { Instant.parse(it) }.getOrNull() }
        ?: return "pending"

    val duration = Duration.between(Instant.now(), target)
    val hours = duration.toHours()

    return when {
        hours < 0 -> "overdue"
        hours < 24 -> "in " + hours.coerceAtLeast(1) + " hours"
        tomorrowForDelivery && hours < 48 -> "tomorrow"
        else -> {
            val days = ((hours + 23) / 24).coerceAtLeast(1)
            "in " + days + " days"
        }
    }
}

private fun String?.toDisplayStatus(): String =
    when (this?.uppercase(Locale.US)) {
        "FUNDED_IN_ESCROW" -> "Funded"
        "REQUIREMENTS_SUBMITTED" -> "Requirements"
        "IN_PROGRESS" -> "In Progress"
        "DELIVERED" -> "Delivered"
        "REVISION_REQUESTED" -> "Revision"
        "IN_REVIEW" -> "In Review"
        "DISPUTED" -> "Disputed"
        else -> "Active"
    }

@Composable
private fun ClientHome(
    state: HomeState,
    showOfflineBanner: Boolean,
    matchedGigs: List<HomeGigRecommendation>,
    discoveryCategory: String?,
    discoveryCategories: List<String>,
    discoveryLoading: Boolean,
    discoveryError: String?,
    dashboard: ClientDashboardState?,
    dashboardLoading: Boolean,
    dashboardErrorMessage: String?,
    onRetryDashboard: () -> Unit,
    modifier: Modifier,
    onOpenWorkspace: () -> Unit,
    onOpenDashboardOrder: (String) -> Unit,
    onOpenDashboardJob: (String) -> Unit,
    onActionQueueItem: (HomeActionQueueItem) -> Unit,
    onOpenGig: (String) -> Unit,
    onOpenExplore: () -> Unit,
    onPostJob: () -> Unit
) {
    LazyColumn(
        modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        MaterialTheme.colorScheme.background,
                        MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                        MaterialTheme.colorScheme.background
                    )
                )
            ),
        contentPadding = PaddingValues(18.dp, 15.dp, 18.dp, 28.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        if (showOfflineBanner) {
            item { HomeOfflineBanner(isStudent = false) }
        }

        if (state.actionQueue.isNotEmpty()) {
            item {
                ActionQueueSection(
                    items = state.actionQueue,
                    isStudent = false,
                    onAction = { item -> onActionQueueItem(item) }
                )
            }
        }

        item {
            PremiumHomeOverview(
                state = state,
                isStudent = false,
                accent = ClientAccent
            )
        }

        item {
            DiscoverySearchBar(
                accent = ClientAccent,
                hint = "Search verified talent, services, and skills",
                onClick = onOpenExplore
            )
        }

        item {
            DiscoverySectionHeader(
                accent = ClientAccent,
                eyebrow = "VERIFIED TALENT",
                title = when {
                    discoveryCategories.size > 1 -> "Top verified talent for your categories"
                    !discoveryCategory.isNullOrBlank() -> "Top talent in $discoveryCategory"
                    else -> "Top verified freelancers"
                },
                onViewAll = onOpenExplore
            )
        }
        item {
            if (discoveryLoading) {
                Stage2UnavailableCard(
                    title = "Finding verified talent",
                    message = "We are matching published services to the hiring categories you selected."
                )
            } else if (!discoveryError.isNullOrBlank()) {
                Stage2UnavailableCard(
                    title = "Talent discovery unavailable",
                    message = discoveryError
                )
            } else if (matchedGigs.isEmpty()) {
                Stage2UnavailableCard(
                    title = "No matching verified Gigs yet",
                    message = when {
                        discoveryCategories.size > 1 ->
                            "Verified student services matching ${discoveryCategories.joinToString(", ")} will appear here."
                        !discoveryCategory.isNullOrBlank() ->
                            "Verified student services in $discoveryCategory will appear when they match your hiring preferences."
                        else ->
                            "Select hiring categories during onboarding to see matching verified student services here."
                    }
                )
            } else {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(horizontal = 1.dp)
                ) {
                    items(
                        items = matchedGigs,
                        key = { it.id ?: it.title.orEmpty() }
                    ) { gig ->
                        GigRecommendationCard(
                            gig = gig,
                            accent = ClientAccent,
                            onClick = { gig.id?.let(onOpenGig) }
                        )
                    }
                }
            }
        }
        item {
            Stage2SectionTitle(
                accent = ClientAccent,
                eyebrow = "START A PROJECT",
                title = "What do you need done?"
            )
        }
        item { ClientBriefCard(ClientAccent, onPostJob = onPostJob) }

        item {
            ClientDashboardSections(
                dashboard = dashboard,
                dashboardLoading = dashboardLoading,
                dashboardErrorMessage = dashboardErrorMessage,
                onRetry = onRetryDashboard,
                onOpenOrder = onOpenDashboardOrder,
                onOpenJob = onOpenDashboardJob
            )
        }

        item {
            Stage2SectionTitle(
                accent = ClientAccent,
                eyebrow = "PROJECT VELOCITY",
                title = "Active Order"
            )
        }
        item {
            ClientActiveProjectCard(
                workspace = state.activeWorkspace,
                accent = ClientAccent,
                onOpenWorkspace = onOpenWorkspace
            )
        }
    }
}

private data class ClientDashboardHomeAction(
    val id: String,
    val title: String,
    val subtitle: String,
    val detail: String? = null,
    val orderId: String? = null,
    val jobId: String? = null,
    val actionLabel: String
)

@Composable
private fun ClientDashboardSections(
    dashboard: ClientDashboardState?,
    dashboardLoading: Boolean,
    dashboardErrorMessage: String?,
    onRetry: () -> Unit,
    onOpenOrder: (String) -> Unit,
    onOpenJob: (String) -> Unit
) {
    val accent = ClientAccent
    if (dashboard == null) {
        if (dashboardLoading) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(22.dp),
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, accent.copy(alpha = 0.18f))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(22.dp),
                        color = accent,
                        strokeWidth = 2.dp
                    )
                    Text(
                        "Loading your live project dashboard…",
                        modifier = Modifier.padding(start = 12.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        } else if (!dashboardErrorMessage.isNullOrBlank()) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(22.dp),
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, accent.copy(alpha = 0.18f))
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        "Project dashboard unavailable",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        dashboardErrorMessage,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall
                    )
                    AssistChip(
                        onClick = onRetry,
                        label = { Text("Retry") }
                    )
                }
            }
        }
        return
    }

    val summary = dashboard.summary
    val metrics = listOf(
        "Active Projects" to summary.activeProjects.toString(),
        "Pending Proposals" to summary.pendingProposals.toString(),
        "Completed" to summary.completedProjects.toString(),
        "Total Spend" to "₹" + formatMoney(summary.totalSpend.roundToInt())
    )

    val actions = buildList {
        dashboard.attention.deliveryApprovalItems.forEach { item ->
            val orderId = item.orderId?.takeIf(String::isNotBlank) ?: return@forEach
            add(
                ClientDashboardHomeAction(
                    id = "delivery-$orderId",
                    title = "Delivery awaiting review",
                    subtitle = (item.projectTitle ?: "Project") + " · " + (item.studentName ?: "Student"),
                    detail = "₹" + formatMoney(item.amount.roundToInt()),
                    orderId = orderId,
                    actionLabel = "Review delivery"
                )
            )
        }
        dashboard.attention.paymentItems.forEach { item ->
            val orderId = item.orderId?.takeIf(String::isNotBlank) ?: return@forEach
            add(
                ClientDashboardHomeAction(
                    id = "payment-$orderId",
                    title = "Payment awaiting action",
                    subtitle = (item.projectTitle ?: "Project") + " · " + (item.studentName ?: "Student"),
                    detail = "₹" + formatMoney(item.amount.roundToInt()),
                    orderId = orderId,
                    actionLabel = "Open order"
                )
            )
        }
        dashboard.attention.proposalJobs.forEach { item ->
            val jobId = item.id?.takeIf(String::isNotBlank) ?: return@forEach
            add(
                ClientDashboardHomeAction(
                    id = "proposal-$jobId",
                    title = "Proposals need attention",
                    subtitle = item.title ?: "Posted project",
                    detail = item.pendingProposalCount.toString() + " pending",
                    jobId = jobId,
                    actionLabel = "Open project"
                )
            )
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Stage2SectionTitle(
            accent = accent,
            eyebrow = "YOUR WORK AT A GLANCE",
            title = "Project snapshot"
        )
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(horizontal = 1.dp)
        ) {
            items(metrics, key = { it.first }) { metric ->
                Surface(
                    modifier = Modifier.width(154.dp),
                    shape = RoundedCornerShape(20.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, accent.copy(alpha = 0.18f)),
                    shadowElevation = 2.dp
                ) {
                    Column(
                        modifier = Modifier.padding(15.dp),
                        verticalArrangement = Arrangement.spacedBy(7.dp)
                    ) {
                        Text(
                            metric.first,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            metric.second,
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.ExtraBold,
                            color = accent,
                            maxLines = 1
                        )
                    }
                }
            }
        }

        Stage2SectionTitle(
            accent = accent,
            eyebrow = "NEXT STEPS",
            title = "Needs your attention"
        )
        if (actions.isEmpty()) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, accent.copy(alpha = 0.14f))
            ) {
                Stage2UnavailableCard(
                    title = "You're all caught up",
                    message = "New proposals, payment actions and deliveries awaiting review will appear here."
                )
            }
        } else {
            actions.take(5).forEach { action ->
                Surface(
                    onClick = {
                        action.orderId?.let(onOpenOrder)
                            ?: action.jobId?.let(onOpenJob)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, accent.copy(alpha = 0.16f)),
                    shadowElevation = 2.dp
                ) {
                    Row(
                        modifier = Modifier.padding(15.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            modifier = Modifier.size(42.dp),
                            shape = RoundedCornerShape(14.dp),
                            color = accent.copy(alpha = 0.10f)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    if (action.orderId != null) Icons.Outlined.Lock else Icons.Outlined.BusinessCenter,
                                    contentDescription = null,
                                    tint = accent,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        Column(
                            modifier = Modifier.weight(1f).padding(start = 11.dp, end = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(3.dp)
                        ) {
                            Text(
                                action.title,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.ExtraBold
                            )
                            Text(
                                action.subtitle,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.bodySmall,
                                maxLines = 2
                            )
                            action.detail?.let {
                                Text(
                                    it,
                                    color = accent,
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                action.actionLabel,
                                color = accent,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.ExtraBold,
                                maxLines = 1
                            )
                            Icon(
                                Icons.AutoMirrored.Outlined.ArrowForward,
                                contentDescription = null,
                                tint = accent,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }

        if (dashboard.activeProjects.isNotEmpty()) {
            Stage2SectionTitle(
                accent = accent,
                eyebrow = "POSTED BY YOU",
                title = "Your projects"
            )
            dashboard.activeProjects.take(4).forEach { project ->
                val jobId = project.id?.takeIf(String::isNotBlank)
                Surface(
                    onClick = { jobId?.let(onOpenJob) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, accent.copy(alpha = 0.14f))
                ) {
                    Column(
                        modifier = Modifier.padding(15.dp),
                        verticalArrangement = Arrangement.spacedBy(7.dp)
                    ) {
                        Text(
                            project.title ?: "Untitled project",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                (project.category ?: "Project") + " · " +
                                    (project.status ?: "Active").replace('_', ' ').lowercase(Locale.US)
                                        .replaceFirstChar { it.uppercase(Locale.US) },
                                modifier = Modifier.weight(1f),
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.bodySmall
                            )
                            Text(
                                "₹" + formatMoney(project.budget.roundToInt()),
                                color = accent,
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                        if (project.proposalCount > 0) {
                            Text(
                                project.proposalCount.toString() + " proposals received",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                    }
                }
            }
        }

        if (dashboard.deadlines.isNotEmpty()) {
            Stage2SectionTitle(
                accent = accent,
                eyebrow = "KEEP ON TRACK",
                title = "Upcoming deadlines"
            )
            dashboard.deadlines.take(3).forEach { item ->
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, accent.copy(alpha = 0.12f))
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Text(
                            item.projectTitle ?: "Project deadline",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text(
                            listOfNotNull(item.studentName, item.status?.replace('_', ' ')).joinToString(" · "),
                            modifier = Modifier.padding(top = 4.dp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodySmall
                        )
                        WorkspaceDeadline(item.deadline, prefix = "Deadline")
                    }
                }
            }
        }

        if (dashboard.recentActivity.isNotEmpty()) {
            Stage2SectionTitle(
                accent = accent,
                eyebrow = "LATEST UPDATES",
                title = "Recent activity"
            )
            dashboard.recentActivity.take(3).forEach { activity ->
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, accent.copy(alpha = 0.12f))
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Text(
                            activity.projectTitle ?: "Project update",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text(
                            activity.message ?: "An update was recorded.",
                            modifier = Modifier.padding(top = 4.dp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ClientBriefCard(
    accent: Color,
    onPostJob: () -> Unit
) {
    Surface(
        Modifier.fillMaxWidth(),
        RoundedCornerShape(28.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.12f))
    ) {
        Column(Modifier.padding(18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    Modifier.size(48.dp),
                    RoundedCornerShape(16.dp),
                    color = accent.copy(alpha = 0.10f)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Outlined.BusinessCenter, null, Modifier.size(24.dp), tint = accent)
                    }
                }
                Column(Modifier.padding(start = 12.dp)) {
                    Text(
                        "Start with a quick brief",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        "Usually takes under 3 minutes",
                        Modifier.padding(top = 2.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.labelMedium
                    )
                }
            }

            Surface(
                onClick = onPostJob,
                modifier = Modifier.fillMaxWidth().padding(top = 18.dp),
                shape = RoundedCornerShape(20.dp),
                color = accent.copy(alpha = 0.07f)
            ) {
                Column(
                    Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(11.dp)
                ) {
                    Text(
                        "Get custom proposals from verified students.",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold
                    )
                    SafetyPoint("Choose the right skills and budget", accent)
                    SafetyPoint("Review profiles before you hire", accent)
                    SafetyPoint("Keep every payment protected", accent)
                }
            }

            Surface(
                onClick = onPostJob,
                modifier = Modifier.fillMaxWidth().padding(top = 18.dp),
                shape = RoundedCornerShape(18.dp),
                color = accent.copy(alpha = 0.10f),
                border = BorderStroke(1.dp, accent.copy(alpha = 0.14f))
            ) {
                Row(
                    Modifier.padding(horizontal = 14.dp, vertical = 11.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Add, null, Modifier.size(20.dp), tint = accent)
                    Text(
                        "Post a custom Job when you are ready",
                        Modifier.padding(start = 10.dp).weight(1f),
                        color = accent,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Icon(Icons.AutoMirrored.Outlined.ArrowForward, null, Modifier.size(18.dp), tint = accent)
                }
            }
        }
    }
}

@Composable
private fun SafetyPoint(text: String, accent: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Surface(Modifier.size(22.dp), CircleShape, color = accent) {
            Box(contentAlignment = Alignment.Center) {
                Icon(Icons.Outlined.Check, null, Modifier.size(13.dp), tint = Color.White)
            }
        }
        Text(
            text,
            Modifier.padding(start = 9.dp),
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.SemiBold
        )
    }
}





@Composable
private fun HomeLoading(modifier: Modifier) {
    Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

@Composable
private fun HomeBlocked(
    modifier: Modifier,
    onLogout: () -> Unit
) {
    Box(
        modifier = modifier.fillMaxSize().padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier,
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(
                1.dp,
                MaterialTheme.colorScheme.error.copy(alpha = 0.22f)
            )
        ) {
            Column(
                Modifier.padding(22.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    Icons.Outlined.Shield,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(34.dp)
                )
                Text(
                    "Account access restricted",
                    Modifier.padding(top = 10.dp),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    "Your account cannot access the marketplace Home while it is suspended or banned.",
                    Modifier.padding(top = 8.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyMedium
                )
                AssistChip(
                    onClick = onLogout,
                    label = { Text("Sign out") },
                    Modifier.padding(top = 16.dp)
                )
            }
        }
    }
}

@Composable
private fun HomeFailure(
    modifier: Modifier,
    message: String,
    onRetry: () -> Unit,
    onLogout: () -> Unit
) {
    Box(modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Surface(
            modifier = Modifier,
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
        ) {
            Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    "Home unavailable",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    message,
                    Modifier.padding(top = 8.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyMedium
                )
                Row(
                    Modifier.padding(top = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    AssistChip(onClick = onRetry, label = { Text("Retry") })
                    AssistChip(onClick = onLogout, label = { Text("Sign out") })
                }
            }
        }
    }
}
private fun greetingPrefix(): String = when (LocalTime.now().hour) {
    in 5..11 -> "Good morning"
    in 12..16 -> "Good afternoon"
    in 17..20 -> "Good evening"
    else -> "Good night"
}

private fun formatMoney(value: Int): String =
    NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")).format(value)
