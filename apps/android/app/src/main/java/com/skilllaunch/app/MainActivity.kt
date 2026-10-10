package com.skilllaunch.app

import android.app.Activity
import android.os.Bundle
import com.razorpay.Checkout
import com.razorpay.PaymentData
import com.razorpay.PaymentResultWithDataListener
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
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.skilllaunch.app.core.common.collectAsStateWithLifecycleCompat
import com.skilllaunch.app.core.navigation.AuthenticatedAppShell
import com.skilllaunch.app.core.network.ApiClient
import com.skilllaunch.app.core.payment.PaymentCoordinator
import com.skilllaunch.app.core.session.SessionStore
import com.skilllaunch.app.data.repository.auth.AuthRepository
import com.skilllaunch.app.data.repository.gig.GigRepository
import com.skilllaunch.app.data.local.home.HomeCacheDatabase
import com.skilllaunch.app.data.repository.home.HomeRepository
import com.skilllaunch.app.data.repository.home.ClientDashboardRepository
import com.skilllaunch.app.data.repository.profile.ProfileRepository
import com.skilllaunch.app.data.repository.notification.NotificationRepository
import com.skilllaunch.app.data.repository.job.JobRepository
import com.skilllaunch.app.data.repository.order.OrderRepository
import com.skilllaunch.app.feature.auth.AuthViewModel
import com.skilllaunch.app.feature.auth.LoginScreen
import retrofit2.HttpException
import java.io.IOException
import com.skilllaunch.app.feature.auth.SignupScreen
import com.skilllaunch.app.feature.onboarding.OnboardingScreen
import com.skilllaunch.app.ui.theme.SkillLaunchTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity(), PaymentResultWithDataListener {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        runCatching { Checkout.preload(applicationContext) }

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

    override fun onPaymentSuccess(razorpayPaymentId: String?, paymentData: PaymentData?) {
        val localOrderId = PaymentCoordinator.takePendingOrderId() ?: return
        val checkoutOrderId = paymentData?.orderId
        val signature = paymentData?.signature

        if (
            razorpayPaymentId.isNullOrBlank() ||
            checkoutOrderId.isNullOrBlank() ||
            signature.isNullOrBlank()
        ) {
            PaymentCoordinator.publishVerificationResult(
                orderId = localOrderId,
                success = false,
                message = "Razorpay returned incomplete payment details. Your order remains awaiting payment."
            )
            return
        }

        lifecycleScope.launch {
            val repository = OrderRepository(
                ApiClient.orderApi(SessionStore(applicationContext))
            )
            repository.verifyPayment(
                orderId = localOrderId,
                razorpayOrderId = checkoutOrderId,
                razorpayPaymentId = razorpayPaymentId,
                razorpaySignature = signature
            ).onSuccess { response ->
                PaymentCoordinator.publishVerificationResult(
                    orderId = localOrderId,
                    success = true,
                    message = response.message ?: "Escrow funded successfully."
                )
            }.onFailure { error ->
                PaymentCoordinator.publishVerificationResult(
                    orderId = localOrderId,
                    success = false,
                    message = error.message
                        ?: "Payment returned successfully, but verification is incomplete. Refresh Orders before trying again."
                )
            }
        }
    }

    override fun onPaymentError(
        errorCode: Int,
        response: String?,
        paymentData: PaymentData?
    ) {
        val localOrderId = PaymentCoordinator.takePendingOrderId() ?: return
        PaymentCoordinator.publishVerificationResult(
            orderId = localOrderId,
            success = false,
            message = "Payment was not completed. Your order is still awaiting payment."
        )
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

    val clientDashboardApi = remember(sessionStore) {
        ApiClient.clientDashboardApi(sessionStore)
    }

    val uploadApi = remember(sessionStore) {
        ApiClient.uploadApi(sessionStore)
    }

    val notificationApi = remember(sessionStore) {
        ApiClient.notificationApi(sessionStore)
    }

    val jobApi = remember(sessionStore) {
        ApiClient.jobApi(sessionStore)
    }

    val orderApi = remember(sessionStore) {
        ApiClient.orderApi(sessionStore)
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

    val homeCacheDao = remember(context) {
        HomeCacheDatabase.getInstance(context.applicationContext).homeCacheDao()
    }

    val homeRepository = remember(homeApi, homeCacheDao) {
        HomeRepository(
            homeApi = homeApi,
            cacheDao = homeCacheDao
        )
    }

    val clientDashboardRepository = remember(clientDashboardApi) {
        ClientDashboardRepository(clientDashboardApi)
    }

    val notificationRepository = remember(notificationApi) {
        NotificationRepository(
            api = notificationApi
        )
    }

    val jobRepository = remember(jobApi) {
        JobRepository(
            api = jobApi
        )
    }

    val orderRepository = remember(orderApi) {
        OrderRepository(
            api = orderApi
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

    LaunchedEffect(
        state.isAuthenticated,
        state.user?.id,
        state.isNewlyRegistered,
        profileResolutionRetryKey
    ) {
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

        onboardingStep = if (state.isNewlyRegistered || !canUseOnboarding) {
            1
        } else {
            sessionStore.getOnboardingStep(
                userId = userId,
                maxStep = if (role == "STUDENT_FREELANCER") 4 else 3
            )
        }
        onboardingStepOwnerId = userId

        // Registration creates the user's profile with PENDING onboarding state
        // on the server. Do not perform a second network request just to rediscover
        // a state the registration contract already guarantees; it can transiently
        // fail immediately after signup and block the onboarding UI.
        if (state.isNewlyRegistered && canUseOnboarding) {
            showOnboarding = true
            profileResolutionFailed = false
            onboardingResolvedForUser = true
            return@LaunchedEffect
        }

        // Use the authenticated user's own profile endpoint here. The public
        // users/{userId} endpoint intentionally sanitizes onboardingStatus and
        // onboardingCompleted, which made new accounts appear already onboarded.
        profileRepository.getMyProfile()
            .onSuccess { profile ->
                // Never resolve onboarding from a profile response belonging to a
                // different authenticated account.
                if (profile.id != userId ||
                    profile.role?.equals(role, ignoreCase = true) != true
                ) {
                    showOnboarding = false
                    profileResolutionFailed = true
                    onboardingResolvedForUser = false
                    return@onSuccess
                }

                val status = profile.profile?.onboardingStatus?.trim()?.uppercase()

                showOnboarding = if (!canUseOnboarding) {
                    false
                } else {
                    when (status) {
                        "SKIPPED" -> false
                        "COMPLETED" -> profile.profile?.onboardingCompleted == false
                        "NOT_STARTED", "PENDING", "IN_PROGRESS" -> true
                        // Unknown/missing state is not proof that onboarding is done.
                        else -> profile.profile?.onboardingCompleted != true
                    }
                }

                profileResolutionFailed = false
                onboardingResolvedForUser = true
            }
            .onFailure { error ->
                val errorChain = generateSequence(error) { it.cause }.toList()
                val networkUnavailable =
                    errorChain.none { it is HttpException } &&
                        errorChain.any { it is IOException }

                // Only allow offline Home when a network failure blocks verification and
                // an exact user/role-matching Home snapshot already exists locally.
                val cachedHome = if (state.isOfflineSession && networkUnavailable) {
                    homeRepository.getCachedHomeState(userId)
                } else {
                    null
                }
                val matchingHomeSnapshot = cachedHome != null &&
                    cachedHome.id == userId &&
                    cachedHome.role?.equals(state.user?.role, ignoreCase = true) == true &&
                    cachedHome.role?.uppercase() in setOf("STUDENT_FREELANCER", "CLIENT")

                if (matchingHomeSnapshot) {
                    showOnboarding = false
                    profileResolutionFailed = false
                    onboardingResolvedForUser = true
                } else {
                    // Do not treat an unknown profile state as "no onboarding required".
                    showOnboarding = false
                    profileResolutionFailed = true
                    onboardingResolvedForUser = false
                }
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
                androidx.compose.runtime.key(state.user!!.id) {
                    AuthenticatedAppShell(
                        user = state.user!!,
                    profileRepository = profileRepository,
                    gigRepository = gigRepository,
                    homeRepository = homeRepository,
                    clientDashboardRepository = clientDashboardRepository,
                    notificationRepository = notificationRepository,
                    jobRepository = jobRepository,
                    orderRepository = orderRepository,
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
