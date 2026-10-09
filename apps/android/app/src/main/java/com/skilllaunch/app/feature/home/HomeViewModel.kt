package com.skilllaunch.app.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.skilllaunch.app.data.model.home.HomeDiscoveryResponse
import com.skilllaunch.app.data.model.home.HomeAnalyticsResponse
import com.skilllaunch.app.data.model.home.HomeGigRecommendation
import com.skilllaunch.app.data.model.home.HomeProfileNudge
import com.skilllaunch.app.data.model.home.HomeRecommendedJob
import com.skilllaunch.app.data.model.home.HomeState
import com.skilllaunch.app.data.model.home.ClientDashboardState
import com.skilllaunch.app.data.repository.home.HomeRepository
import retrofit2.HttpException
import com.skilllaunch.app.data.repository.home.ClientDashboardRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading: Boolean = false,
    val home: HomeState? = null,
    val clientDashboard: ClientDashboardState? = null,
    val isClientDashboardLoading: Boolean = false,
    val clientDashboardErrorMessage: String? = null,
    val errorMessage: String? = null,
    val isShowingCachedHome: Boolean = false,
    val marketplaceAnalytics: HomeAnalyticsResponse? = null,
    val isMarketplaceAnalyticsLoading: Boolean = false,
    val marketplaceAnalyticsErrorMessage: String? = null
)

class HomeViewModel(
    private val repository: HomeRepository,
    private val clientDashboardRepository: ClientDashboardRepository,
    private val userId: String
) : ViewModel() {
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private val _matchedJobs = MutableStateFlow<List<HomeRecommendedJob>>(emptyList())
    val matchedJobs: StateFlow<List<HomeRecommendedJob>> = _matchedJobs.asStateFlow()

    private val _matchedGigs = MutableStateFlow<List<HomeGigRecommendation>>(emptyList())
    val matchedGigs: StateFlow<List<HomeGigRecommendation>> = _matchedGigs.asStateFlow()

    private val _discoveryCategory = MutableStateFlow<String?>(null)
    val discoveryCategory: StateFlow<String?> = _discoveryCategory.asStateFlow()

    private val _discoveryCategories = MutableStateFlow<List<String>>(emptyList())
    val discoveryCategories: StateFlow<List<String>> = _discoveryCategories.asStateFlow()

    private val _discoveryLoading = MutableStateFlow(false)
    val discoveryLoading: StateFlow<Boolean> = _discoveryLoading.asStateFlow()

    private val _discoveryError = MutableStateFlow<String?>(null)
    val discoveryError: StateFlow<String?> = _discoveryError.asStateFlow()

    private val _profileNudges = MutableStateFlow<List<HomeProfileNudge>>(emptyList())
    val profileNudges: StateFlow<List<HomeProfileNudge>> = _profileNudges.asStateFlow()

    private val _profileNudgesError = MutableStateFlow<String?>(null)
    val profileNudgesError: StateFlow<String?> = _profileNudgesError.asStateFlow()

    fun load(forceRefresh: Boolean = false) {
        if (!forceRefresh && _uiState.value.home != null) return

        if (forceRefresh) {
            _matchedJobs.value = emptyList()
            _matchedGigs.value = emptyList()
            _discoveryCategory.value = null
            _discoveryCategories.value = emptyList()
            _discoveryError.value = null
            _discoveryLoading.value = false
            _profileNudges.value = emptyList()
            _profileNudgesError.value = null
        }

        viewModelScope.launch {
            val currentHome = _uiState.value.home
            _uiState.value = _uiState.value.copy(
                isLoading = true,
                errorMessage = null,
                isShowingCachedHome = currentHome != null && _uiState.value.isShowingCachedHome
            )

            // Render Room data immediately, then revalidate against the API.
            if (currentHome == null) {
                repository.getCachedHomeState(userId)?.let { cachedHome ->
                    _uiState.value = _uiState.value.copy(
                        home = cachedHome,
                        isShowingCachedHome = true
                    )
                }
            }

            repository.getHomeState(userId)
                .onSuccess { loadResult ->
                    val loadedHome = loadResult.state
                    val isClient = loadedHome.role?.equals("CLIENT", ignoreCase = true) == true
                    val isStudent = loadedHome.role?.equals("STUDENT_FREELANCER", ignoreCase = true) == true

                    // Personalized discovery is authoritative for the Home recommendations.
                    // Clear legacy suggestions while the role-targeted endpoint is loading.
                    val home = loadedHome.copy(
                        recommendedJobs = emptyList(),
                        topVerifiedGigs = emptyList(),
                        discoveryCategory = null
                    )
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        home = home,
                        isShowingCachedHome = loadResult.fromCache,
                        isClientDashboardLoading = isClient,
                        clientDashboardErrorMessage = null,
                        errorMessage = null
                    )

                    _discoveryLoading.value = true
                    viewModelScope.launch { loadDiscovery() }

                    if (isStudent) {
                        viewModelScope.launch { loadProfileNudges() }
                        viewModelScope.launch { loadMarketplaceAnalytics() }
                    }

                    if (isClient) {
                        clientDashboardRepository.getDashboard()
                            .onSuccess { dashboard ->
                                _uiState.value = _uiState.value.copy(
                                    clientDashboard = dashboard,
                                    isClientDashboardLoading = false,
                                    clientDashboardErrorMessage = null
                                )
                            }
                            .onFailure { error ->
                                _uiState.value = _uiState.value.copy(
                                    isClientDashboardLoading = false,
                                    clientDashboardErrorMessage = error.message
                                        ?: "Unable to load your project dashboard right now."
                                )
                            }
                    }
                }
                .onFailure { error ->
                    val rejectedResponse = generateSequence(error) { it.cause }
                        .filterIsInstance<HttpException>()
                        .firstOrNull()
                    if (rejectedResponse?.code() == 401 || rejectedResponse?.code() == 403) {
                        // Do not leave cached account data on screen after the API rejects access.
                        repository.clearCachedHomeState(userId)
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            home = null,
                            isShowingCachedHome = false,
                            isClientDashboardLoading = false,
                            errorMessage = error.message ?: "Your session is no longer authorized."
                        )
                    } else {
                        val hasSnapshot = _uiState.value.home != null
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            isClientDashboardLoading = false,
                            isShowingCachedHome = hasSnapshot,
                            errorMessage = if (hasSnapshot) null else {
                                error.message ?: "Unable to load your Home right now."
                            }
                        )
                    }
                }
        }
    }

    private suspend fun loadDiscovery() {
        repository.getHomeDiscovery()
            .onSuccess { discovery: HomeDiscoveryResponse ->
                _matchedJobs.value = discovery.recommendedJobs
                _matchedGigs.value = discovery.topVerifiedGigs
                _discoveryCategory.value = discovery.discoveryCategory
                _discoveryCategories.value = discovery.discoveryCategories
                _discoveryError.value = null

                val currentState = _uiState.value
                _uiState.value = currentState.copy(
                    home = currentState.home?.copy(
                        recommendedJobs = discovery.recommendedJobs,
                        topVerifiedGigs = discovery.topVerifiedGigs,
                        discoveryCategory = discovery.discoveryCategory
                    )
                )
            }
            .onFailure { error ->
                _matchedJobs.value = emptyList()
                _matchedGigs.value = emptyList()
                _discoveryCategory.value = null
                _discoveryCategories.value = emptyList()
                _discoveryError.value = error.message
                    ?: "Personalized discovery is temporarily unavailable."
            }
        _discoveryLoading.value = false
    }

    private suspend fun loadMarketplaceAnalytics() {
        _uiState.value = _uiState.value.copy(
            isMarketplaceAnalyticsLoading = true,
            marketplaceAnalyticsErrorMessage = null
        )
        repository.getHomeAnalytics()
            .onSuccess { analytics ->
                _uiState.value = _uiState.value.copy(
                    marketplaceAnalytics = analytics,
                    isMarketplaceAnalyticsLoading = false,
                    marketplaceAnalyticsErrorMessage = null
                )
            }
            .onFailure { error ->
                _uiState.value = _uiState.value.copy(
                    isMarketplaceAnalyticsLoading = false,
                    marketplaceAnalyticsErrorMessage = error.message
                        ?: "Marketplace analytics are temporarily unavailable."
                )
            }
    }

    private suspend fun loadProfileNudges() {
        repository.getProfileNudges()
            .onSuccess { nudges ->
                _profileNudges.value = nudges
                _profileNudgesError.value = null
            }
            .onFailure { error ->
                _profileNudges.value = emptyList()
                _profileNudgesError.value = error.message
                    ?: "Your profile suggestions could not be loaded right now."
            }
    }

    companion object {
        fun factory(
            repository: HomeRepository,
            clientDashboardRepository: ClientDashboardRepository,
            userId: String
        ): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return HomeViewModel(repository, clientDashboardRepository, userId) as T
                }
            }
    }
}
