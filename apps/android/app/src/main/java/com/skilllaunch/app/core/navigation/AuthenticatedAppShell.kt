package com.skilllaunch.app.core.navigation

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.BusinessCenter
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Surface
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.snapshots.SnapshotStateList
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.navigation3.runtime.NavEntry
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.ui.NavDisplay
import com.skilllaunch.app.data.model.auth.AuthUser
import com.skilllaunch.app.data.repository.gig.GigRepository
import com.skilllaunch.app.data.repository.home.HomeRepository
import com.skilllaunch.app.data.repository.home.ClientDashboardRepository
import com.skilllaunch.app.data.repository.profile.ProfileRepository
import com.skilllaunch.app.feature.gig.GigDiscoveryScreen
import com.skilllaunch.app.feature.gig.GigDetailsScreen
import com.skilllaunch.app.feature.chat.ChatScreen
import com.skilllaunch.app.feature.home.HomeScreen
import com.skilllaunch.app.data.repository.notification.NotificationRepository
import com.skilllaunch.app.feature.notification.NotificationScreen
import com.skilllaunch.app.data.repository.job.JobRepository
import com.skilllaunch.app.data.repository.order.OrderRepository
import com.skilllaunch.app.feature.job.JobDiscoveryScreen
import com.skilllaunch.app.feature.job.JobDetailsScreen
import com.skilllaunch.app.feature.job.ClientProjectDetailsScreen
import com.skilllaunch.app.feature.job.PostJobScreen
import com.skilllaunch.app.feature.order.OrdersScreen
import java.util.UUID

sealed interface AppDestination : NavKey {
    data object Home : AppDestination
    data object Explore : AppDestination
    data class GigDetails(val gigId: String) : AppDestination
    data class JobDetails(val jobId: String) : AppDestination
    data class ClientProjectDetails(val jobId: String) : AppDestination
    data object PostJob : AppDestination
    data object Orders : AppDestination
    data class OrderWorkspace(val orderId: String) : AppDestination
    data object Chat : AppDestination
    data object Profile : AppDestination
    data object Notifications : AppDestination
}

private val shellDestinations = listOf(
    AppDestination.Home,
    AppDestination.Explore,
    AppDestination.Orders,
    AppDestination.Chat,
    AppDestination.Profile
)

private fun AppDestination.toSavedToken(): String = when (this) {
    AppDestination.Home -> "home"
    AppDestination.Explore -> "explore"
    is AppDestination.GigDetails -> "gig:$gigId"
    is AppDestination.JobDetails -> "job:$jobId"
    is AppDestination.ClientProjectDetails -> "client-project:$jobId"
    AppDestination.PostJob -> "post-job"
    AppDestination.Orders -> "orders"
    is AppDestination.OrderWorkspace -> "order-workspace:$orderId"
    AppDestination.Chat -> "chat"
    AppDestination.Profile -> "profile"
    AppDestination.Notifications -> "notifications"
}

private fun destinationFromSavedToken(token: String): AppDestination = when {
    token == "home" -> AppDestination.Home
    token == "explore" -> AppDestination.Explore
    token.startsWith("gig:") -> AppDestination.GigDetails(token.substringAfter("gig:"))
    token.startsWith("job:") -> AppDestination.JobDetails(token.substringAfter("job:"))
    token.startsWith("client-project:") ->
        AppDestination.ClientProjectDetails(token.substringAfter("client-project:"))
    token == "post-job" -> AppDestination.PostJob
    token == "orders" -> AppDestination.Orders
    token.startsWith("order-workspace:") ->
        AppDestination.OrderWorkspace(token.substringAfter("order-workspace:"))
    token == "chat" -> AppDestination.Chat
    token == "profile" -> AppDestination.Profile
    token == "notifications" -> AppDestination.Notifications
    else -> AppDestination.Home
}

private tailrec fun Context.findActivityOrNull(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.findActivityOrNull()
    else -> null
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthenticatedAppShell(
    user: AuthUser,
    profileRepository: ProfileRepository,
    gigRepository: GigRepository,
    homeRepository: HomeRepository,
    clientDashboardRepository: ClientDashboardRepository,
    notificationRepository: NotificationRepository,
    jobRepository: JobRepository,
    orderRepository: OrderRepository,
    onLogout: () -> Unit,
    onOpenOnboarding: () -> Unit,
    profileRefreshVersion: Int = 0,
    themeState: State<Boolean>,
    onToggleTheme: () -> Unit
) {
    // Persist the actual route stack across theme/system configuration changes.
    // Destinations are stored as primitive tokens so SavedStateRegistry can restore them.
    val backStack = rememberSaveable(
        saver = listSaver<SnapshotStateList<AppDestination>, String>(
            save = { stack -> stack.map { it.toSavedToken() } },
            restore = { tokens ->
                mutableStateListOf<AppDestination>().apply {
                    addAll(tokens.map(::destinationFromSavedToken))
                    if (isEmpty()) add(AppDestination.Home)
                }
            }
        )
    ) {
        mutableStateListOf<AppDestination>(AppDestination.Home)
    }
    val screenRefreshVersion = remember { mutableIntStateOf(0) }
    val context = LocalContext.current
    val current = backStack.lastOrNull() ?: AppDestination.Home
    // Detail pages keep their parent tab selected in the floating dock.
    val selectedRootDestination =
        backStack.lastOrNull { it in shellDestinations } ?: AppDestination.Home

    fun openDestination(destination: AppDestination) {
        if (destination in shellDestinations) {
            // Bottom dock selections are root navigation, while detail/workspace
            // destinations are pushed and retain the originating screen underneath.
            if (backStack.size != 1 || current != destination) {
                backStack.clear()
                backStack.add(destination)
                screenRefreshVersion.intValue += 1
            }
            return
        }

        if (destination == current) return

        // Every current Gig Details entry point is a gig-card tap (Explore or
        // Home recommendations). Record one CLICK centrally to cover both paths.
        if (destination is AppDestination.GigDetails) {
            gigRepository.recordAnalyticsEventInBackground(
                gigId = destination.gigId,
                type = "CLICK",
                eventId = UUID.randomUUID().toString()
            )
        }

        // Preserve the current destination so Back returns to the correct page.
        backStack.add(destination)
    }

    fun navigateBack() {
        if (backStack.size > 1) {
            backStack.removeLastOrNull()
            // Refresh whatever screen was underneath the route we just popped.
            screenRefreshVersion.intValue += 1
        } else {
            // Back at a root tab follows Android convention and closes the activity.
            context.findActivityOrNull()?.finish()
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            if (current != AppDestination.Home && current != AppDestination.Profile && current != AppDestination.Explore) {
                CenterAlignedTopAppBar(
                    navigationIcon = {
                        IconButton(onClick = ::navigateBack) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Outlined.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
                    },
                    title = {
                        Text(
                            text = destinationTitle(current),
                            style = MaterialTheme.typography.titleLarge
                        )
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background.copy(alpha = 0.92f)
                    )
                )
            }
        },
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize()) {
            NavDisplay(
            backStack = backStack,
            onBack = ::navigateBack,
            transitionSpec = {
                fadeIn(animationSpec = tween(220)) togetherWith
                    fadeOut(animationSpec = tween(180))
            },
            popTransitionSpec = {
                fadeIn(animationSpec = tween(220)) togetherWith
                    fadeOut(animationSpec = tween(180))
            },
            predictivePopTransitionSpec = {
                fadeIn(animationSpec = tween(220)) togetherWith
                    fadeOut(animationSpec = tween(180))
            },
            entryProvider = { key ->
                when (key) {
                    AppDestination.Home -> NavEntry(key) {
                        HomeScreen(
                            user = user,
                            homeRepository = homeRepository,
                            clientDashboardRepository = clientDashboardRepository,
                            onOpenDestination = ::openDestination,
                            onLogout = onLogout,
                            refreshVersion = screenRefreshVersion.intValue,
                            darkTheme = themeState.value,
                            onToggleTheme = onToggleTheme
                        )
                    }

                    AppDestination.Explore -> NavEntry(key) {
                        if (user.role?.uppercase() == "STUDENT_FREELANCER") {
                            JobDiscoveryScreen(
                                repository = jobRepository,
                                profileRepository = profileRepository,
                                userId = user.id,
                                refreshVersion = screenRefreshVersion.intValue,
                                onOpenJob = { jobId ->
                                    openDestination(AppDestination.JobDetails(jobId))
                                },
                                onOpenNotifications = {
                                    openDestination(AppDestination.Notifications)
                                }
                            )
                        } else {
                            GigDiscoveryScreen(
                                repository = gigRepository,
                                refreshVersion = screenRefreshVersion.intValue,
                                onOpenGig = { gigId ->
                                    openDestination(AppDestination.GigDetails(gigId))
                                }
                            )
                        }
                    }

                    is AppDestination.GigDetails -> NavEntry(key) {
                        GigDetailsScreen(
                            gigId = key.gigId,
                            repository = gigRepository
                        )
                    }

                    is AppDestination.JobDetails -> NavEntry(key) {
                        JobDetailsScreen(
                            jobId = key.jobId,
                            repository = jobRepository
                        )
                    }

                    is AppDestination.ClientProjectDetails -> NavEntry(key) {
                        ClientProjectDetailsScreen(
                            jobId = key.jobId,
                            repository = jobRepository
                        )
                    }

                    AppDestination.PostJob -> NavEntry(key) {
                        PostJobScreen(
                            repository = jobRepository,
                            onCreated = {
                                openDestination(AppDestination.Home)
                            }
                        )
                    }

                    AppDestination.Orders -> NavEntry(key) {
                        OrdersScreen(
                            user = user,
                            repository = orderRepository,
                            refreshVersion = screenRefreshVersion.intValue
                        )
                    }

                    is AppDestination.OrderWorkspace -> NavEntry(key) {
                        OrdersScreen(
                            user = user,
                            repository = orderRepository,
                            initialOrderId = key.orderId,
                            refreshVersion = screenRefreshVersion.intValue,
                            onBackFromWorkspace = ::navigateBack
                        )
                    }

                    AppDestination.Chat -> NavEntry(key) {
                        ChatScreen(
                            user = user,
                            repository = orderRepository,
                            refreshVersion = screenRefreshVersion.intValue
                        )
                    }

                    AppDestination.Profile -> NavEntry(key) {
                        com.skilllaunch.app.feature.profile.ProfileScreen(
                            user = user,
                            repository = profileRepository,
                            onLogout = onLogout,
                            onOpenOnboarding = onOpenOnboarding,
                            refreshVersion = screenRefreshVersion.intValue + profileRefreshVersion
                        )
                    }

                    AppDestination.Notifications -> NavEntry(key) {
                        NotificationScreen(
                            repository = notificationRepository,
                            refreshVersion = screenRefreshVersion.intValue
                        )
                    }
                }
            },
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(innerPadding)
        )
            FloatingNavigationDock(
                current = selectedRootDestination,
                onSelectDestination = ::openDestination,
                modifier = Modifier.align(Alignment.BottomCenter)
            )
        }
    }
}

@Composable
private fun FloatingNavigationDock(
    current: AppDestination,
    onSelectDestination: (AppDestination) -> Unit,
    modifier: Modifier = Modifier
) {
    val darkTheme = MaterialTheme.colorScheme.background.luminance() < 0.5f
    val activeColor = MaterialTheme.colorScheme.primary
    val selectedIconBackground = if (darkTheme) Color(0xFFB7A8FF) else Color(0xFF8170ED)
    val dockOutline = if (darkTheme) {
        Color.White.copy(alpha = 0.20f)
    } else {
        Color(0xFF887BB7).copy(alpha = 0.22f)
    }
    val dockShape = RoundedCornerShape(32.dp)
    val dockBrush = Brush.linearGradient(
        if (darkTheme) {
            listOf(Color(0xFF080809), Color(0xFF141415), Color(0xFF09090A))
        } else {
            listOf(Color(0xF7FFFFFF), Color(0xEDEBE8FF), Color(0xE8FFF0E9))
        }
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 24.dp),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(78.dp)
                .shadow(if (darkTheme) 8.dp else 16.dp, dockShape, clip = false)
                .clip(dockShape)
                .background(dockBrush)
                .border(1.dp, dockOutline, dockShape)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 7.dp, vertical = 5.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                shellDestinations.forEach { destination ->
                    val selected = current == destination
                    val itemShape = RoundedCornerShape(22.dp)

                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxSize()
                            .clip(itemShape)
                            .clickable { onSelectDestination(destination) }
                            .padding(vertical = 1.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(width = 49.dp, height = 35.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(
                                    if (selected) selectedIconBackground
                                    else Color.Transparent
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = destinationIcon(destination),
                                contentDescription = destinationTitle(destination),
                                modifier = Modifier.size(21.dp),
                                tint = if (selected) {
                                    if (darkTheme) Color(0xFF241C4A) else Color.White
                                } else {
                                    MaterialTheme.colorScheme.onSurfaceVariant
                                }
                            )
                        }

                        Text(
                            text = destinationTitle(destination),
                            style = MaterialTheme.typography.labelSmall,
                            fontFamily = androidx.compose.ui.text.font.FontFamily.SansSerif,
                            fontWeight = if (selected) {
                                androidx.compose.ui.text.font.FontWeight.Bold
                            } else {
                                androidx.compose.ui.text.font.FontWeight.Medium
                            },
                            color = if (selected) {
                                if (darkTheme) Color(0xFFDCD2FF) else activeColor
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant
                            },
                            modifier = Modifier.padding(top = 2.dp),
                            maxLines = 1
                        )

                        if (selected) {
                            Box(
                                modifier = Modifier
                                    .padding(top = 2.dp)
                                    .size(4.dp)
                                    .clip(CircleShape)
                                    .background(if (darkTheme) Color(0xFFB7A8FF) else activeColor)
                            )
                        } else {
                            Spacer(Modifier.height(6.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ShellEmptyState(
    title: String,
    message: String
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.headlineMedium
            )
            Text(
                text = message,
                modifier = Modifier.padding(top = 10.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}

private fun destinationTitle(destination: AppDestination): String = when (destination) {
    AppDestination.Home -> "Home"
    AppDestination.Explore -> "Explore"
    is AppDestination.GigDetails -> "Gig"
    is AppDestination.JobDetails -> "Project"
    is AppDestination.ClientProjectDetails -> "Project proposals"
    AppDestination.PostJob -> "Post Job"
    AppDestination.Orders -> "Orders"
    is AppDestination.OrderWorkspace -> "Workspace"
    AppDestination.Chat -> "Chat"
    AppDestination.Profile -> "Profile"
    AppDestination.Notifications -> "Notifications"
}

private fun destinationIcon(destination: AppDestination): androidx.compose.ui.graphics.vector.ImageVector = when (destination) {
    AppDestination.Home -> Icons.Outlined.Home
    AppDestination.Explore -> Icons.Outlined.Explore
    is AppDestination.GigDetails -> Icons.Outlined.BusinessCenter
    is AppDestination.JobDetails -> Icons.Outlined.BusinessCenter
    is AppDestination.ClientProjectDetails -> Icons.Outlined.BusinessCenter
    AppDestination.PostJob -> Icons.Outlined.BusinessCenter
    AppDestination.Orders -> Icons.Outlined.ReceiptLong
    is AppDestination.OrderWorkspace -> Icons.Outlined.ReceiptLong
    AppDestination.Chat -> Icons.Outlined.ChatBubbleOutline
    AppDestination.Profile -> Icons.Outlined.PersonOutline
    AppDestination.Notifications -> Icons.Outlined.NotificationsNone
}
