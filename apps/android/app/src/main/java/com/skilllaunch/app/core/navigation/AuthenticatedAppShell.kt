package com.skilllaunch.app.core.navigation

import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
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
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.navigation3.runtime.NavEntry
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.ui.NavDisplay
import com.skilllaunch.app.data.model.auth.AuthUser
import com.skilllaunch.app.data.repository.gig.GigRepository
import com.skilllaunch.app.data.repository.home.HomeRepository
import com.skilllaunch.app.data.repository.profile.ProfileRepository
import com.skilllaunch.app.feature.gig.GigDiscoveryScreen
import com.skilllaunch.app.feature.home.HomeScreen
import com.skilllaunch.app.data.repository.notification.NotificationRepository
import com.skilllaunch.app.feature.notification.NotificationScreen
import com.skilllaunch.app.data.repository.job.JobRepository
import com.skilllaunch.app.data.repository.order.OrderRepository
import com.skilllaunch.app.feature.job.JobDiscoveryScreen
import com.skilllaunch.app.feature.job.PostJobScreen
import com.skilllaunch.app.feature.order.OrdersScreen

sealed interface AppDestination : NavKey {
    data object Home : AppDestination
    data object Explore : AppDestination
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthenticatedAppShell(
    user: AuthUser,
    profileRepository: ProfileRepository,
    gigRepository: GigRepository,
    homeRepository: HomeRepository,
    notificationRepository: NotificationRepository,
    jobRepository: JobRepository,
    onLogout: () -> Unit,
    onOpenOnboarding: () -> Unit,
    profileRefreshVersion: Int = 0,
    themeState: State<Boolean>,
    onToggleTheme: () -> Unit
) {
    val backStack = remember {
        mutableStateListOf<AppDestination>(AppDestination.Home)
    }
    val current = backStack.lastOrNull() ?: AppDestination.Home

    fun openDestination(destination: AppDestination) {
        if (destination == AppDestination.Home) {
            backStack.clear()
            backStack.add(AppDestination.Home)
        } else if (destination != current) {
            backStack.clear()
            backStack.add(AppDestination.Home)
            backStack.add(destination)
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            if (current != AppDestination.Home && current != AppDestination.Profile) {
                CenterAlignedTopAppBar(
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
        bottomBar = {
            val studentRole = user.role?.uppercase() == "STUDENT_FREELANCER"
            val activeColor = if (studentRole) {
                androidx.compose.ui.graphics.Color(0xFF047857)
            } else {
                androidx.compose.ui.graphics.Color(0xFF4338CA)
            }

            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp),
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 0.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 8.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    shellDestinations.forEach { destination ->
                        val selected = current == destination

                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxSize()
                                .clickable { openDestination(destination) },
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(width = 44.dp, height = 26.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(
                                        if (selected) activeColor.copy(alpha = 0.10f)
                                        else MaterialTheme.colorScheme.surface
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = destinationIcon(destination),
                                    contentDescription = destinationTitle(destination),
                                    modifier = Modifier.size(20.dp),
                                    tint = if (selected) {
                                        activeColor
                                    } else {
                                        MaterialTheme.colorScheme.onSurfaceVariant
                                    }
                                )
                            }

                            Text(
                                text = destinationTitle(destination),
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = if (selected) {
                                    androidx.compose.ui.text.font.FontWeight.Bold
                                } else {
                                    androidx.compose.ui.text.font.FontWeight.Medium
                                },
                                color = if (selected) {
                                    activeColor
                                } else {
                                    MaterialTheme.colorScheme.onSurfaceVariant
                                },
                                modifier = Modifier.padding(top = 1.dp)
                            )
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        NavDisplay(
            backStack = backStack,
            onBack = { backStack.removeLastOrNull() },
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
                            onOpenDestination = ::openDestination,
                            onLogout = onLogout,
                            darkTheme = themeState.value,
                            onToggleTheme = onToggleTheme
                        )
                    }

                    AppDestination.Explore -> NavEntry(key) {
                        if (user.role?.uppercase() == "STUDENT_FREELANCER") {
                            JobDiscoveryScreen(
                                repository = jobRepository
                            )
                        } else {
                            GigDiscoveryScreen(
                                repository = gigRepository
                            )
                        }
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
                            repository = orderRepository
                        )
                    }

                    is AppDestination.OrderWorkspace -> NavEntry(key) {
                        OrdersScreen(
                            user = user,
                            repository = orderRepository,
                            initialOrderId = key.orderId
                        )
                    }

                    AppDestination.Chat -> NavEntry(key) {
                        ShellEmptyState(
                            title = "Chat",
                            message = "Conversations and realtime messaging will appear here as the native Chat feature is connected."
                        )
                    }

                    AppDestination.Profile -> NavEntry(key) {
                        com.skilllaunch.app.feature.profile.ProfileScreen(
                            user = user,
                            repository = profileRepository,
                            onLogout = onLogout,
                            onOpenOnboarding = onOpenOnboarding,
                            refreshVersion = profileRefreshVersion
                        )
                    }

                    AppDestination.Notifications -> NavEntry(key) {
                        NotificationScreen(
                            repository = notificationRepository
                        )
                    }
                }
            },
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(innerPadding)
        )
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
    AppDestination.PostJob -> Icons.Outlined.BusinessCenter
    AppDestination.Orders -> Icons.Outlined.ReceiptLong
    is AppDestination.OrderWorkspace -> Icons.Outlined.ReceiptLong
    AppDestination.Chat -> Icons.Outlined.ChatBubbleOutline
    AppDestination.Profile -> Icons.Outlined.PersonOutline
    AppDestination.Notifications -> Icons.Outlined.NotificationsNone
}
