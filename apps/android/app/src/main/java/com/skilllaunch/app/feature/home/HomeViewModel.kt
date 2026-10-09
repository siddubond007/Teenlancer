package com.skilllaunch.app.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.skilllaunch.app.data.model.home.HomeState
import com.skilllaunch.app.data.model.home.ClientDashboardState
import com.skilllaunch.app.data.repository.home.HomeRepository
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
    val errorMessage: String? = null
)

class HomeViewModel(
    private val repository: HomeRepository,
    private val clientDashboardRepository: ClientDashboardRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    fun load(forceRefresh: Boolean = false) {
        if (!forceRefresh && _uiState.value.home != null) return

        viewModelScope.launch {
            _uiState.value = if (forceRefresh) {
                HomeUiState(isLoading = true)
            } else {
                _uiState.value.copy(isLoading = true, errorMessage = null)
            }

            repository.getHomeState()
                .onSuccess { home ->
                    val isClient = home.role?.equals("CLIENT", ignoreCase = true) == true
                    _uiState.value = HomeUiState(
                        home = home,
                        isClientDashboardLoading = isClient
                    )

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
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isClientDashboardLoading = false,
                        errorMessage = error.message ?: "Unable to load your Home right now."
                    )
                }
        }
    }

    companion object {
        fun factory(
            repository: HomeRepository,
            clientDashboardRepository: ClientDashboardRepository
        ): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return HomeViewModel(repository, clientDashboardRepository) as T
                }
            }
    }
}
