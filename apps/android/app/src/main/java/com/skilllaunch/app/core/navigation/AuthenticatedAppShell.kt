package com.skilllaunch.app.core.navigation

import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
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
import com.skilllaunch.app.data.repository.profile.ProfileRepository
import com.skilllaunch.app.feature.gig.GigDiscoveryScreen
import com.skilllaunch.app.feature.home.HomeScreen

sealed interface AppDestination : NavKey {
    data object Home : AppDestination
    data object Explore : AppDestination
    data object Orders : AppDestination
    data object Chat : AppDestination
    data object Profile : AppDestination
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
            NavigationBar(
                modifier = Modifier
                    .padding(horizontal = 12.dp, vertical = 8.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .border(
                        BorderStroke(
                            1.dp,
                            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.10f)
                        ),
                        RoundedCornerShape(24.dp)
                    ),
                containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f),
                contentColor = MaterialTheme.colorScheme.onSurface,
                tonalElevation = 0.dp
            ) {
                shellDestinations.forEach { destination ->
                    NavigationBarItem(
                        selected = current == destination,
                        onClick = { openDestination(destination) },
                        icon = {
                            Text(
                                text = destinationGlyph(destination),
                                style = MaterialTheme.typography.titleMedium
                            )
                        },
                        label = {
                            Text(destinationTitle(destination))
                        }
                    )
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
                            onOpenDestination = ::openDestination,
                            darkTheme = themeState.value,
                            onToggleTheme = onToggleTheme
                        )
                    }

                    AppDestination.Explore -> NavEntry(key) {
                        GigDiscoveryScreen(
                            repository = gigRepository
                        )
                    }

                    AppDestination.Orders -> NavEntry(key) {
                        ShellEmptyState(
                            title = "Orders",
                            message = "Your active and completed work will appear here as the native Orders feature is connected."
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
    AppDestination.Orders -> "Orders"
    AppDestination.Chat -> "Chat"
    AppDestination.Profile -> "Profile"
}

private fun destinationGlyph(destination: AppDestination): String = when (destination) {
    AppDestination.Home -> "⌂"
    AppDestination.Explore -> "⌕"
    AppDestination.Orders -> "□"
    AppDestination.Chat -> "◌"
    AppDestination.Profile -> "○"
}
