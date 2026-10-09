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
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.AccessTime
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.outlined.BusinessCenter
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Image
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Storefront
import androidx.compose.material3.AssistChip
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
import com.skilllaunch.app.data.model.home.HomeState
import com.skilllaunch.app.data.repository.home.HomeRepository
import java.text.NumberFormat
import java.time.Duration
import java.time.Instant
import java.time.LocalTime
import java.util.Locale

private val StudentAccent = Color(0xFF047857)
private val ClientAccent = Color(0xFF4338CA)

@Composable
fun HomeScreen(
    user: AuthUser,
    homeRepository: HomeRepository,
    onOpenDestination: (AppDestination) -> Unit,
    onLogout: () -> Unit,
    darkTheme: Boolean,
    onToggleTheme: () -> Unit
) {
    val viewModel: HomeViewModel = viewModel(
        key = "home-${user.id ?: "unknown"}",
        factory = remember(homeRepository) { HomeViewModel.factory(homeRepository) }
    )
    val uiState by viewModel.uiState.collectAsStateWithLifecycleCompat()

    LaunchedEffect(user.id) {
        viewModel.load(forceRefresh = true)
    }

    val home = uiState.home
    val role = home?.role?.trim()?.uppercase(Locale.US)

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
                modifier = Modifier.padding(innerPadding),
                onOpenWorkspace = {
                    home.activeWorkspace?.id?.let { id ->
                        onOpenDestination(AppDestination.OrderWorkspace(id))
                    }
                },
                onOpenActionOrder = { orderId ->
                    onOpenDestination(AppDestination.OrderWorkspace(orderId))
                },
                onOpenJob = { jobId ->
                    onOpenDestination(AppDestination.JobDetails(jobId))
                },
                onOpenExplore = { onOpenDestination(AppDestination.Explore) }
            )
            role == "CLIENT" -> ClientHome(
                state = home,
                modifier = Modifier.padding(innerPadding),
                onOpenWorkspace = {
                    home.activeWorkspace?.id?.let { id ->
                        onOpenDestination(AppDestination.OrderWorkspace(id))
                    }
                },
                onOpenActionOrder = { orderId ->
                    onOpenDestination(AppDestination.OrderWorkspace(orderId))
                },
                onOpenGig = { gigId ->
                    onOpenDestination(AppDestination.GigDetails(gigId))
                },
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
            accent = accent
        )
        PremiumMetricCard(
            modifier = Modifier.weight(1f),
            label = if (isStudent) "TO DO" else "REVIEWS",
            value = state.actionQueue.size.toString(),
            detail = if (isStudent) "Needs attention" else "Awaiting review",
            accent = if (state.actionQueue.isNotEmpty()) {
                if (isStudent) Color(0xFFF59E0B) else Color(0xFFFB8B79)
            } else accent
        )
        PremiumMetricCard(
            modifier = Modifier.weight(1f),
            label = if (isStudent) "JOBS" else "TALENT",
            value = if (isStudent) state.recommendedJobs.size.toString()
                else state.topVerifiedGigs.size.toString(),
            detail = if (isStudent) "Recommended" else "Verified gigs",
            accent = accent
        )
    }
}

@Composable
private fun PremiumMetricCard(
    modifier: Modifier,
    label: String,
    value: String,
    detail: String,
    accent: Color
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.70f),
        border = BorderStroke(1.dp, accent.copy(alpha = 0.15f))
    ) {
        Column(Modifier.padding(horizontal = 10.dp, vertical = 12.dp)) {
            Text(
                label,
                color = accent,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.ExtraBold,
                maxLines = 1
            )
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
    modifier: Modifier,
    onOpenWorkspace: () -> Unit,
    onOpenActionOrder: (String) -> Unit,
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
        if (state.actionQueue.isNotEmpty()) {
            item {
                ActionQueueSection(
                    items = state.actionQueue,
                    isStudent = true,
                    onAction = { item ->
                        item.orderId?.let(onOpenActionOrder)
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
        item {
            Stage2SectionTitle(
                accent = StudentAccent,
                eyebrow = "OPPORTUNITY RADAR",
                title = "Recommended Jobs for you"
            )
        }
        if (state.recommendedJobs.isEmpty()) {
            item {
                Stage2UnavailableCard(
                    title = "No recommended jobs yet",
                    message = "New custom projects that match your marketplace activity will appear here."
                )
            }
        } else {
            items(
                items = state.recommendedJobs,
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

private data class JourneyStepData(
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val title: String,
    val subtitle: String,
    val complete: Boolean
)

@Composable
private fun StudentJourneyCard(
    state: HomeState,
    accent: Color,
    onOpenProfile: () -> Unit
) {
    val steps = listOf(
        JourneyStepData(
            Icons.Outlined.PersonOutline,
            "Complete profile",
            if (state.profileComplete) "Your skills, bio, and availability are ready."
            else "Complete your skills, bio, and availability.",
            state.profileComplete
        ),
        JourneyStepData(
            Icons.Outlined.Image,
            "Upload proof of work",
            if (state.proofOfWorkComplete) "A portfolio link or sample is already attached."
            else "Show clients what you can do with a real project.",
            state.proofOfWorkComplete
        ),
        JourneyStepData(
            Icons.Outlined.Storefront,
            "Create your first Gig",
            if (state.hasGig) "You have already created a Gig."
            else "Package a skill into a fixed-price service.",
            state.hasGig
        ),
        JourneyStepData(
            Icons.AutoMirrored.Outlined.Send,
            "Submit your first Proposal",
            if (state.hasProposal) "Your first proposal is already submitted."
            else "Find a great fit and introduce your approach.",
            state.hasProposal
        )
    )

    val completed = steps.count { it.complete }
    val progress = completed / steps.size.toFloat()

    Surface(
        Modifier.fillMaxWidth(),
        RoundedCornerShape(28.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    completed.toString() + " of " + steps.size.toString() + " complete",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.ExtraBold
                )
                Spacer(Modifier.weight(1f))
                LinearProgressIndicator(
                    progress = { progress },
                    Modifier.width(80.dp).height(8.dp).clip(RoundedCornerShape(50)),
                    color = accent,
                    trackColor = accent.copy(alpha = 0.10f)
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    (progress * 100).toInt().toString() + "%",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold
                )
            }

            Column(Modifier.padding(top = 13.dp)) {
                steps.forEachIndexed { index, step ->
                    JourneyStep(
                        step = step,
                        accent = accent,
                        last = index == steps.lastIndex,
                        onOpenProfile = onOpenProfile
                    )
                }
            }
        }
    }
}

@Composable
private fun JourneyStep(
    step: JourneyStepData,
    accent: Color,
    last: Boolean,
    onOpenProfile: () -> Unit
) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Surface(
                Modifier.size(40.dp),
                CircleShape,
                color = if (step.complete) accent else MaterialTheme.colorScheme.surface,
                border = BorderStroke(
                    2.dp,
                    if (step.complete) accent else MaterialTheme.colorScheme.outline.copy(alpha = 0.24f)
                )
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        if (step.complete) Icons.Outlined.Check else step.icon,
                        null,
                        Modifier.size(19.dp),
                        tint = if (step.complete) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            if (!last) {
                Box(
                    Modifier
                        .width(2.dp)
                        .height(24.dp)
                        .background(
                            if (step.complete) accent.copy(alpha = 0.28f)
                            else MaterialTheme.colorScheme.outline.copy(alpha = 0.16f)
                        )
                )
            }
        }

        Spacer(Modifier.width(14.dp))

        Column(
            Modifier.weight(1f).padding(bottom = if (last) 0.dp else 8.dp)
        ) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
                Column(Modifier.weight(1f)) {
                    Text(
                        step.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (step.complete) MaterialTheme.colorScheme.onSurfaceVariant
                        else MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        step.subtitle,
                        Modifier.padding(top = 4.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall
                    )
                    if (!step.complete && step.title == "Upload proof of work") {
                        Surface(
                            onClick = onOpenProfile,
                            modifier = Modifier.padding(top = 10.dp),
                            shape = RoundedCornerShape(12.dp),
                            color = accent
                        ) {
                            Row(
                                Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Outlined.Add,
                                    contentDescription = null,
                                    modifier = Modifier.size(15.dp),
                                    tint = Color.White
                                )
                                Text(
                                    "Add portfolio item",
                                    Modifier.padding(start = 7.dp),
                                    color = Color.White,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
                if (!step.complete) {
                    Surface(
                        shape = RoundedCornerShape(50),
                        color = Color(0xFFFFFBEB),
                        contentColor = Color(0xFFB45309)
                    ) {
                        Text(
                            "Pending",
                            Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
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
                Color(0xFF6B430C),
                Color(0xFF33220E)
            )
        )
    } else {
        Brush.linearGradient(
            listOf(
                Color(0xFF713640),
                Color(0xFF352027)
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

        items.forEach { item ->
            ActionQueueCard(
                item = item,
                isStudent = isStudent,
                accent = accent,
                border = border,
                background = background,
                onAction = { onAction(item) }
            )
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
    onAction: () -> Unit
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

    Box(
        modifier = Modifier
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
                color = accent.copy(alpha = 0.13f),
                border = BorderStroke(1.dp, accent.copy(alpha = 0.30f))
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = if (isStudent) {
                            Icons.Outlined.AccessTime
                        } else {
                            Icons.Outlined.Description
                        },
                        contentDescription = null,
                        modifier = Modifier.size(21.dp),
                        tint = accent
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
                    color = if (isStudent) Color(0xFFFFF7ED) else Color.White,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 2
                )
                Text(
                    item.subtitle ?: "Order workspace",
                    modifier = Modifier.padding(top = 4.dp),
                    color = if (isStudent) Color(0xFFD8C4AD) else Color(0xFFE5B9AE),
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
                                item.actionLabel ?: if (isStudent) "Submit Work" else "Review Work",
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
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 4.dp,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.18f))
    ) {
        Column(Modifier.padding(15.dp)) {
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
                fontWeight = FontWeight.ExtraBold
            )
            Row(
                modifier = Modifier.padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                job.skills.take(3).forEach { skill ->
                    Surface(
                        shape = RoundedCornerShape(7.dp),
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.055f)
                    ) {
                        Text(
                            skill,
                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 4.dp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 9.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    relativePostedTime(job.createdAt),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.labelSmall
                )
                Spacer(Modifier.weight(1f))
                Surface(
                    onClick = if (job.id.isNullOrBlank()) onOpenExplore else onOpenJob,
                    shape = RoundedCornerShape(10.dp),
                    color = Color.Transparent,
                    border = BorderStroke(1.dp, accent.copy(alpha = 0.85f))
                ) {
                    Text(
                        "Submit Proposal",
                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 7.dp),
                        color = accent,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.ExtraBold
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
private fun EscrowEducationCard(accent: Color) {
    Surface(
        Modifier.fillMaxWidth(),
        RoundedCornerShape(22.dp),
        color = Color(0xFF101827),
        contentColor = Color.White
    ) {
        Column(Modifier.padding(16.dp)) {
            Surface(
                Modifier.size(42.dp),
                RoundedCornerShape(13.dp),
                color = accent
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Outlined.Lock,
                        null,
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
            Text(
                "How Escrow Works",
                Modifier.padding(top = 12.dp),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.ExtraBold
            )
            Text(
                "Client funds are secured before you start. Payment is released when approved, so your work stays protected.",
                Modifier.padding(top = 7.dp),
                color = Color.White.copy(alpha = 0.78f),
                style = MaterialTheme.typography.bodyMedium
            )
            Row(
                Modifier.padding(top = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Outlined.Lock,
                    null,
                    Modifier.size(16.dp),
                    tint = accent
                )
                Text(
                    "Learn how you're protected",
                    Modifier.padding(start = 7.dp),
                    color = accent,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    " →",
                    color = accent,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
@Composable
private fun ClientHome(
    state: HomeState,
    modifier: Modifier,
    onOpenWorkspace: () -> Unit,
    onOpenActionOrder: (String) -> Unit,
    onOpenGig: (String) -> Unit,
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
        if (state.actionQueue.isNotEmpty()) {
            item {
                ActionQueueSection(
                    items = state.actionQueue,
                    isStudent = false,
                    onAction = { item ->
                        item.orderId?.let(onOpenActionOrder)
                    }
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
            Stage2SectionTitle(
                accent = ClientAccent,
                eyebrow = "PROJECT VELOCITY",
                title = "Active Projects"
            )
        }
        item {
            ClientActiveProjectCard(
                workspace = state.activeWorkspace,
                accent = ClientAccent,
                onOpenWorkspace = onOpenWorkspace
            )
        }
        item {
            Stage2SectionTitle(
                accent = ClientAccent,
                eyebrow = "VERIFIED TALENT",
                title = "Top Verified Freelancers in '" + (state.discoveryCategory ?: "Design") + "'"
            )
        }
        item {
            if (state.topVerifiedGigs.isEmpty()) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.16f))
                ) {
                    Stage2UnavailableCard(
                        title = "No verified Gigs yet",
                        message = "Verified student services in " + (state.discoveryCategory ?: "Design") + " will appear here."
                    )
                }
            } else {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(horizontal = 1.dp)
                ) {
                    items(
                        items = state.topVerifiedGigs,
                        key = { it.id ?: it.title.orEmpty() }
                    ) { gig ->
                        GigRecommendationCard(
                            gig = gig,
                            accent = ClientAccent,
                            onClick = {
                                gig.id?.let(onOpenGig)
                            }
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
    }
}

@Composable
private fun TrustSafetyCard(accent: Color) {
    Surface(
        Modifier.fillMaxWidth(),
        RoundedCornerShape(22.dp),
        color = accent,
        contentColor = Color.White
    ) {
        Box(Modifier.fillMaxWidth()) {
            Box(
                modifier = Modifier
                    .size(116.dp)
                    .align(Alignment.TopEnd)
                    .offset(x = 38.dp, y = (-26).dp)
                    .background(Color.White.copy(alpha = 0.08f), CircleShape)
            )
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .align(Alignment.CenterEnd)
                    .offset(x = (-6).dp, y = 10.dp)
                    .background(Color.White.copy(alpha = 0.10f), CircleShape)
            )

            Column(Modifier.padding(16.dp)) {
                Surface(
                    Modifier.size(42.dp),
                    RoundedCornerShape(14.dp),
                    color = Color.White.copy(alpha = 0.14f),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.18f))
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Outlined.Shield,
                            null,
                            Modifier.size(24.dp),
                            tint = Color.White
                        )
                    }
                }
                Text(
                    "Hire with total confidence",
                    Modifier.padding(top = 14.dp),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    "100% upfront escrow protection. You only pay for the work you approve.",
                    Modifier.padding(top = 7.dp),
                    color = Color.White.copy(alpha = 0.88f),
                    style = MaterialTheme.typography.bodyMedium
                )
                Row(
                    Modifier.padding(top = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Outlined.Lock,
                        null,
                        Modifier.size(16.dp),
                        tint = Color.White.copy(alpha = 0.92f)
                    )
                    Text(
                        "Protected by Teenlancer Escrow",
                        Modifier.padding(start = 7.dp),
                        color = Color.White.copy(alpha = 0.88f),
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
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
private fun ClientSupportCard(accent: Color) {
    Surface(
        Modifier.fillMaxWidth(),
        RoundedCornerShape(22.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.10f))
    ) {
        Row(
            Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                Modifier.size(40.dp),
                RoundedCornerShape(12.dp),
                color = Color(0xFFFFFBEB)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Outlined.AutoAwesome,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp),
                        tint = Color(0xFFB45309)
                    )
                }
            }
            Column(
                Modifier.padding(start = 12.dp).weight(1f)
            ) {
                Text(
                    "Built for first-time hiring",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    "Clear milestones and support at every step.",
                    Modifier.padding(top = 3.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall
                )
            }
            Icon(
                Icons.AutoMirrored.Outlined.ArrowForward,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(19.dp)
            )
        }
    }
}

@Composable
private fun HomeIntro(
    accent: Color,
    eyebrow: String,
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, Modifier.size(17.dp), tint = accent)
            Text(
                eyebrow.uppercase(Locale.US),
                Modifier.padding(start = 7.dp),
                color = accent,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.ExtraBold
            )
        }
        Text(
            title,
            Modifier.padding(top = 8.dp),
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.ExtraBold
        )
        Text(
            description,
            Modifier.padding(top = 6.dp),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyMedium
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
