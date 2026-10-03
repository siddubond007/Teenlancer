package com.skilllaunch.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.skilllaunch.app.core.common.collectAsStateWithLifecycleCompat
import com.skilllaunch.app.core.navigation.AuthenticatedAppShell
import com.skilllaunch.app.core.network.ApiClient
import com.skilllaunch.app.core.session.SessionStore
import com.skilllaunch.app.data.repository.auth.AuthRepository
import com.skilllaunch.app.data.repository.gig.GigRepository
import com.skilllaunch.app.data.repository.profile.ProfileRepository
import com.skilllaunch.app.feature.auth.AuthViewModel
import com.skilllaunch.app.feature.auth.LoginScreen
import com.skilllaunch.app.feature.auth.SignupScreen
import com.skilllaunch.app.ui.theme.SkillLaunchTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val systemDarkTheme = isSystemInDarkTheme()
            val darkThemeState = rememberSaveable {
                mutableStateOf(systemDarkTheme)
            }

            SkillLaunchTheme(darkTheme = darkThemeState.value) {
                SkillLaunchRoot(
                    themeState = darkThemeState,
                    onToggleTheme = {
                        darkThemeState.value = !darkThemeState.value
                    }
                )
            }
        }
    }
}

@Composable
private fun SkillLaunchRoot(
    themeState: State<Boolean>,
    onToggleTheme: () -> Unit
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val showSignup = remember { mutableStateOf(false) }

    val sessionStore = remember {
        SessionStore(context.applicationContext)
    }

    val authApi = remember(sessionStore) {
        ApiClient.authApi(sessionStore)
    }

    val userApi = remember(sessionStore) {
        ApiClient.userApi(sessionStore)
    }

    val gigApi = remember(sessionStore) {
        ApiClient.gigApi(sessionStore)
    }

    val authRepository = remember(authApi, sessionStore) {
        AuthRepository(
            authApi = authApi,
            sessionStore = sessionStore
        )
    }

    val profileRepository = remember(userApi) {
        ProfileRepository(
            userApi = userApi
        )
    }

    val gigRepository = remember(gigApi) {
        GigRepository(
            gigApi = gigApi
        )
    }

    val authViewModel: AuthViewModel = viewModel(
        factory = AuthViewModel.factory(
            repository = authRepository,
            sessionStore = sessionStore
        )
    )

    val state by authViewModel.uiState.collectAsStateWithLifecycleCompat()

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        when {
            state.isCheckingSession -> SessionCheckingScreen()

            state.isAuthenticated && state.user != null -> {
                AuthenticatedAppShell(
                    user = state.user!!,
                    profileRepository = profileRepository,
                    gigRepository = gigRepository,
                    onLogout = authViewModel::logout,
                    themeState = themeState,
                    onToggleTheme = onToggleTheme
                )
            }

            showSignup.value -> {
                SignupScreen(
                    state = state,
                    darkTheme = themeState.value,
                    onToggleTheme = onToggleTheme,
                    onSignup = authViewModel::signup,
                    onBackToLogin = { showSignup.value = false }
                )
            }

            else -> {
                LoginScreen(
                    state = state,
                    darkTheme = themeState.value,
                    onToggleTheme = onToggleTheme,
                    onLogin = authViewModel::login,
                    onCreateAccount = { showSignup.value = true }
                )
            }
        }
    }
}

@Composable
private fun SessionCheckingScreen() {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator()

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Checking your SkillLaunch session…",
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
