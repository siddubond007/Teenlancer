package com.skilllaunch.app.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.skilllaunch.app.data.model.home.HomeState
import com.skilllaunch.app.data.repository.home.HomeRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading: Boolean = false,
    val home: HomeState? = null,
    val errorMessage: String? = null
)

class HomeViewModel(
    private val repository: HomeRepository
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
                    _uiState.value = HomeUiState(home = home)
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Unable to load your Home right now."
                    )
                }
        }
    }

    companion object {
        fun factory(repository: HomeRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return HomeViewModel(repository) as T
                }
            }
    }
}
