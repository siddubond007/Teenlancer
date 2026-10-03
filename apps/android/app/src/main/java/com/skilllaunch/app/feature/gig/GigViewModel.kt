package com.skilllaunch.app.feature.gig

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.skilllaunch.app.data.model.gig.Gig
import com.skilllaunch.app.data.repository.gig.GigRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class GigUiState(
    val isLoading: Boolean = false,
    val gigs: List<Gig> = emptyList(),
    val errorMessage: String? = null
)

class GigViewModel(
    private val repository: GigRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(GigUiState())
    val uiState: StateFlow<GigUiState> = _uiState.asStateFlow()

    private var hasLoaded = false

    fun loadGigs(forceRefresh: Boolean = false) {
        if (hasLoaded && !forceRefresh) {
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = true,
                errorMessage = null
            )

            repository.getGigs()
                .onSuccess { gigs ->
                    hasLoaded = true
                    _uiState.value = GigUiState(
                        isLoading = false,
                        gigs = gigs,
                        errorMessage = null
                    )
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message
                            ?: "Unable to load gigs right now"
                    )
                }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(
            errorMessage = null
        )
    }
}
