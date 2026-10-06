package com.skilllaunch.app

import android.app.Activity
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
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.skilllaunch.app.core.common.collectAsStateWithLifecycleCompat
import com.skilllaunch.app.core.navigation.AuthenticatedAppShell
import com.skilllaunch.app.core.network.ApiClient
import com.skilllaunch.app.core.session.SessionStore
import com.skilllaunch.app.data.repository.auth.AuthRepository
import com.skilllaunch.app.data.repository.gig.GigRepository
import com.skilllaunch.app.data.repository.home.HomeRepository
import com.skilllaunch.app.data.repository.profile.ProfileRepository
import com.skilllaunch.app.feature.auth.AuthViewModel
import com.skilllaunch.app.feature.auth.LoginScreen
import com.skilllaunch.app.feature.auth.SignupScreen
import com.skilllaunch.app.feature.onboarding.OnboardingScreen
import com.skilllaunch.app.ui.theme.SkillLaunchTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val systemDarkTheme = isSystemInDarkTheme()
            var localThemeOverride by rememberSaveable { mutableStateOf<Boolean?>(null) }
            var lastObservedSystemTheme by rememberSaveable { mutableStateOf(systemDarkTheme) }

            LaunchedEffect(systemDarkTheme) {
                if (systemDarkTheme != lastObservedSystemTheme) {
                    localThemeOverride = null
                    lastObservedSystemTheme = systemDarkTheme
                }
            }

            val effectiveDarkTheme = localThemeOverride ?: systemDarkTheme
            val darkThemeState: State<Boolean> = androidx.compose.runtime.derivedStateOf {
                effectiveDarkTheme
            }

            SkillLaunchTheme(darkTheme = effectiveDarkTheme) {
                val view = LocalView.current
                SideEffect {
                    val window = (view.context as Activity).window
                    val controller = WindowCompat.getInsetsController(window, view)
                    controller.isAppearanceLightStatusBars = !effectiveDarkTheme
                    controller.isAppearanceLightNavigationBars = !effectiveDarkTheme
                }

                SkillLaunchRoot(
                    themeState = darkThemeState,
                    systemDarkTheme = systemDarkTheme,
                    onToggleTheme = {
                        localThemeOverride = !effectiveDarkTheme
                    }
                )
            }
        }
    }
}

@Composable
private fun SkillLaunchRoot(
    themeState: State<Boolean>,
    systemDarkTheme: Boolean,
    onToggleTheme: () -> Unit
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val showSignup = remember { mutableStateOf(false) }
    var splashMinimumElapsed by rememberSaveable { mutableStateOf(false) }
    var onboardingResolvedForUser by rememberSaveable { mutableStateOf(false) }
    var showOnboarding by rememberSaveable { mutableStateOf(false) }
    var onboardingStep by rememberSaveable { mutableIntStateOf(1) }
    var onboardingStepOwnerId by rememberSaveable { mutableStateOf<String?>(null) }
    var profileRefreshVersion by rememberSaveable { mutableIntStateOf(0) }
    var profileResolutionRetryKey by rememberSaveable { mutableIntStateOf(0) }
    var profileResolutionFailed by rememberSaveable { mutableStateOf(false) }

    val onboardingScope = androidx.compose.runtime.rememberCoroutineScope()

    val darkTheme = themeState.value

    LaunchedEffect(Unit) {
        delay(1600)
        splashMinimumElapsed = true
    }

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

    val homeApi = remember(sessionStore) {
        ApiClient.homeApi(sessionStore)
    }

    val uploadApi = remember(sessionStore) {
        ApiClient.uploadApi(sessionStore)
    }

    val authRepository = remember(authApi, sessionStore) {
        AuthRepository(
            authApi = authApi,
            sessionStore = sessionStore
        )
    }

    val profileRepository = remember(userApi, uploadApi) {
        ProfileRepository(
            userApi = userApi,
            uploadApi = uploadApi
        )
    }

    val gigRepository = remember(gigApi) {
        GigRepository(
            gigApi = gigApi
        )
    }

    val homeRepository = remember(homeApi) {
        HomeRepository(
            homeApi = homeApi
        )
    }

    val authViewModel: AuthViewModel = viewModel(
        factory = AuthViewModel.factory(
            repository = authRepository,
            sessionStore = sessionStore
        )
    )

    val state by authViewModel.uiState.collectAsStateWithLifecycleCompat()

    fun updateOnboardingStep(nextStep: Int) {
        onboardingStep = nextStep
        state.user?.id?.takeIf { it.isNotBlank() }?.let { userId ->
            onboardingScope.launch {
                sessionStore.saveOnboardingStep(userId, nextStep)
            }
        }
    }

    LaunchedEffect(state.isAuthenticated, state.user?.id, profileResolutionRetryKey) {
        val userId = state.user?.id

        if (!state.isAuthenticated || userId.isNullOrBlank()) {
            showOnboarding = false
            onboardingResolvedForUser = false
            profileResolutionFailed = false
            return@LaunchedEffect
        }

        onboardingResolvedForUser = false
        profileResolutionFailed = false

        val role = state.user?.role
        val canUseOnboarding =
            role == "STUDENT_FREELANCER" || role == "CLIENT"

        onboardingStep = if (canUseOnboarding) {
            sessionStore.getOnboardingStep(
                userId = userId,
                maxStep = if (role == "STUDENT_FREELANCER") 4 else 3
            )
        } else {
            1
        }
        onboardingStepOwnerId = userId

        profileRepository.getProfile(userId)
            .onSuccess { profile ->
                val status = profile.profile?.onboardingStatus

                showOnboarding = if (!canUseOnboarding) {
                    false
                } else {
                    when (status) {
                        "SKIPPED" -> false
                        "COMPLETED" -> profile.profile?.onboardingCompleted == false
                        "NOT_STARTED", "PENDING", "IN_PROGRESS" -> true
                        else -> profile.profile?.onboardingCompleted == false
                    }
                }

                profileResolutionFailed = false
                onboardingResolvedForUser = true
            }
            .onFailure {
                // Do not treat an unknown profile state as "no onboarding required".
                showOnboarding = false
                profileResolutionFailed = true
                onboardingResolvedForUser = false
            }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        when {
            !splashMinimumElapsed || state.isCheckingSession -> SkillLaunchSplashScreen(
                darkTheme = darkTheme
            )

            state.isAuthenticated && state.user != null && profileResolutionFailed -> {
                ProfileResolutionErrorScreen(
                    onRetry = {
                        profileResolutionFailed = false
                        profileResolutionRetryKey += 1
                    }
                )
            }

            state.isAuthenticated && state.user != null && !onboardingResolvedForUser -> {
                SkillLaunchSplashScreen(
                    darkTheme = darkTheme
                )
            }

            state.isAuthenticated && state.user != null && showOnboarding -> {
                OnboardingScreen(
                    user = state.user!!,
                    repository = profileRepository,
                    darkTheme = darkTheme,
                    step = onboardingStep,
                    onStepChange = ::updateOnboardingStep,
                    onToggleTheme = onToggleTheme,
                    onFinished = {
                        showOnboarding = false
                        state.user?.id?.takeIf { it.isNotBlank() }?.let { userId ->
                            onboardingScope.launch {
                                sessionStore.clearOnboardingStep(userId)
                            }
                        }
                        onboardingStep = 1
                        profileRefreshVersion += 1
                    }
                )
            }

            state.isAuthenticated && state.user != null -> {
                AuthenticatedAppShell(
                    user = state.user!!,
                    profileRepository = profileRepository,
                    gigRepository = gigRepository,
                    homeRepository = homeRepository,
                    onLogout = authViewModel::logout,
                    onOpenOnboarding = {
                        val role = state.user?.role
                        if (role == "STUDENT_FREELANCER" || role == "CLIENT") {
                            showOnboarding = true
                        }
                    },
                    profileRefreshVersion = profileRefreshVersion,
                    themeState = themeState,
                    onToggleTheme = onToggleTheme
                )
            }

            showSignup.value -> {
                SignupScreen(
                    state = state,
                    darkTheme = darkTheme,
                    onToggleTheme = onToggleTheme,
                    onSignup = authViewModel::signup,
                    onClearError = authViewModel::clearError,
                    onBackToLogin = { showSignup.value = false }
                )
            }

            else -> {
                LoginScreen(
                    state = state,
                    darkTheme = darkTheme,
                    onToggleTheme = onToggleTheme,
                    onLogin = authViewModel::login,
                    onCreateAccount = { showSignup.value = true },
                    onRetrySessionRestore = authViewModel::retrySessionRestore
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


@Composable
private fun ProfileResolutionErrorScreen(
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "We couldn’t verify your profile.",
            style = MaterialTheme.typography.headlineSmall
        )

        Text(
            text = "Your onboarding status could not be checked. Please retry before continuing to SkillLaunch.",
            modifier = Modifier.padding(top = 10.dp),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyLarge
        )

        Button(
            onClick = onRetry,
            modifier = Modifier.padding(top = 20.dp)
        ) {
            Text("Retry")
        }
    }
}
