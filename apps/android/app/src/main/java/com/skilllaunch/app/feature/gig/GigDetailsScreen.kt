package com.skilllaunch.app.feature.gig

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import coil3.compose.AsyncImage
import com.skilllaunch.app.core.common.collectAsStateWithLifecycleCompat
import com.skilllaunch.app.data.model.gig.Gig
import com.skilllaunch.app.data.repository.gig.GigRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale
import java.util.UUID

data class GigDetailsUiState(
    val isLoading: Boolean = true,
    val gig: Gig? = null,
    val errorMessage: String? = null
)

private class GigDetailsViewModel(
    private val repository: GigRepository
) : ViewModel() {
    private val _state = MutableStateFlow(GigDetailsUiState())
    val state = _state.asStateFlow()

    fun load(gigId: String) {
        viewModelScope.launch {
            _state.value = GigDetailsUiState(isLoading = true)

            repository.getGigById(gigId)
                .onSuccess { gig ->
                    _state.value = GigDetailsUiState(
                        isLoading = false,
                        gig = gig
                    )
                }
                .onFailure { error ->
                    _state.value = GigDetailsUiState(
                        isLoading = false,
                        errorMessage = error.message ?: "Unable to load this Gig."
                    )
                }
        }
    }

    companion object {
        fun factory(repository: GigRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    GigDetailsViewModel(repository) as T
            }
    }
}

@Composable
fun GigDetailsScreen(
    gigId: String,
    repository: GigRepository
) {
    val viewModel: GigDetailsViewModel = viewModel(
        key = "gig-details-$gigId",
        factory = remember(repository) {
            GigDetailsViewModel.factory(repository)
        }
    )
    val state by viewModel.state.collectAsStateWithLifecycleCompat()

    LaunchedEffect(gigId) {
        viewModel.load(gigId)
    }

    LaunchedEffect(state.gig?.id) {
        val loadedGigId = state.gig?.id ?: return@LaunchedEffect
        viewModel.recordAnalyticsEvent(
            gigId = loadedGigId,
            type = "VIEW",
            eventId = UUID.randomUUID().toString()
        )
    }

    when {
        state.isLoading -> {
            androidx.compose.foundation.layout.Box(
                Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        }

        state.errorMessage != null -> {
            Column(
                Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    "Gig unavailable",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    state.errorMessage.orEmpty(),
                    Modifier.padding(top = 8.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        state.gig != null -> {
            GigDetailsContent(state.gig)
        }
    }
}

@Composable
private fun GigDetailsContent(gig: Gig?) {
    if (gig == null) return

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp, 12.dp, 16.dp, 28.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        if (!gig.coverImage.isNullOrBlank()) {
            item {
                AsyncImage(
                    model = gig.coverImage,
                    contentDescription = gig.title.orEmpty(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(220.dp),
                    contentScale = ContentScale.Crop
                )
            }
        }

        item {
            Text(
                gig.title.orEmpty(),
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.ExtraBold
            )
            gig.category?.takeIf { it.isNotBlank() }?.let { category ->
                AssistChip(
                    onClick = {},
                    label = { Text(category) },
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
        }

        gig.description?.takeIf { it.isNotBlank() }?.let { description ->
            item {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    color = MaterialTheme.colorScheme.surface
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text(
                            "About this Gig",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            description
                                .replace(Regex("<[^>]*>"), " ")
                                .replace(Regex("[[:space:]]+"), " ")
                                .trim(),
                            Modifier.padding(top = 8.dp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        item {
            Text(
                "Packages",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        items(
            items = gig.packages,
            key = { it.id ?: it.tierName.orEmpty() }
        ) { packageItem ->
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                color = MaterialTheme.colorScheme.surface
            ) {
                Column(Modifier.padding(16.dp)) {
                    Text(
                        packageItem.tierName ?: "Package",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        "₹" + NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN"))
                            .format(packageItem.price ?: 0.0),
                        Modifier.padding(top = 5.dp),
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold
                    )
                    packageItem.deliveryDays?.let { days ->
                        Text(
                            "$days day delivery",
                            Modifier.padding(top = 3.dp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    packageItem.description?.takeIf { it.isNotBlank() }?.let { detail ->
                        Text(
                            detail,
                            Modifier.padding(top = 5.dp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }

        item {
            gig.seller?.let { seller ->
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    color = MaterialTheme.colorScheme.surface
                ) {
                    Row(
                        Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            seller.fullName ?: "Student freelancer",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier.weight(1f)
                        )
                        seller.profile?.category?.let {
                            Text(
                                it,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                    }
                }
            }
        }
    }
}
