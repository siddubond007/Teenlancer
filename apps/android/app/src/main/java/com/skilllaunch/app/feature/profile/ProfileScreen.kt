package com.skilllaunch.app.feature.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fitInside
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.WindowInsetsRulers.Companion.Ime
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import com.skilllaunch.app.data.model.auth.AuthUser
import com.skilllaunch.app.data.repository.profile.ProfileRepository

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun ProfileScreen(
    user: AuthUser,
    repository: ProfileRepository,
    onLogout: () -> Unit,
    onOpenOnboarding: () -> Unit,
    refreshVersion: Int = 0
) {
    val factory = remember(repository) {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : androidx.lifecycle.ViewModel> create(
                modelClass: Class<T>
            ): T {
                return ProfileViewModel(repository) as T
            }
        }
    }

    val profileViewModel: ProfileViewModel = viewModel(factory = factory)
    val uiState by profileViewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    var moreMenuExpanded by remember { mutableStateOf(false) }

    LaunchedEffect(user.id, refreshVersion) {
        user.id?.let { profileViewModel.loadProfile(it, forceRefresh = refreshVersion > 0) }
    }

    LaunchedEffect(uiState.successMessage) {
        val message = uiState.successMessage
        if (!message.isNullOrBlank()) {
            snackbarHostState.showSnackbar(
                message = message,
                actionLabel = "Dismiss",
                duration = SnackbarDuration.Short
            )
            profileViewModel.clearMessages()
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            snackbarHost = {
                SnackbarHost(hostState = snackbarHostState)
            },
            topBar = {
                TopAppBar(
                    title = { Text("Profile") },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background,
                        scrolledContainerColor = MaterialTheme.colorScheme.background
                    ),
                    actions = {
                        TextButton(
                            onClick = profileViewModel::saveProfile,
                            enabled = !uiState.isLoading && !uiState.isSaving
                        ) {
                            Text("Save")
                        }

                        Box {
                            TextButton(onClick = { moreMenuExpanded = true }) {
                                Text("More")
                            }

                            DropdownMenu(
                                expanded = moreMenuExpanded,
                                onDismissRequest = { moreMenuExpanded = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Logout") },
                                    onClick = {
                                        moreMenuExpanded = false
                                        onLogout()
                                    }
                                )
                            }
                        }
                    }
                )
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .consumeWindowInsets(innerPadding)
            ) {
                if (uiState.isLoading) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator()
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Loading profile…")
                    }
                } else {
                    ProfileContent(
                        user = user,
                        uiState = uiState,
                        onTaglineChange = profileViewModel::updateTagline,
                        onBioChange = profileViewModel::updateBio,
                        onCollegeChange = profileViewModel::updateCollege,
                        onCategoryChange = profileViewModel::updateCategory,
                        onHourlyRateChange = profileViewModel::updateHourlyRate,
                        onSkillsChange = profileViewModel::updateSkills,
                        onResponseTimeChange = profileViewModel::updateResponseTimeExpectation,
                        onClearMessages = profileViewModel::clearMessages,
                        onOpenOnboarding = onOpenOnboarding,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }
}

@Composable
private fun ProfileContent(
    user: AuthUser,
    uiState: ProfileUiState,
    onTaglineChange: (String) -> Unit,
    onBioChange: (String) -> Unit,
    onCollegeChange: (String) -> Unit,
    onCategoryChange: (String) -> Unit,
    onHourlyRateChange: (String) -> Unit,
    onSkillsChange: (String) -> Unit,
    onResponseTimeChange: (String) -> Unit,
    onClearMessages: () -> Unit,
    onOpenOnboarding: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .fitInside(Ime.current)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "○",
                        style = MaterialTheme.typography.displaySmall,
                        modifier = Modifier.size(64.dp)
                    )

                    Spacer(modifier = Modifier.width(14.dp))

                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        val displayName = user.fullName
                            ?: listOfNotNull(
                                user.firstName,
                                user.middleName,
                                user.lastName
                            ).joinToString(" ").ifBlank { "SkillLaunch User" }

                        Text(
                            text = displayName,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )

                        user.username?.takeIf { it.isNotBlank() }?.let {
                            Text("@$it", style = MaterialTheme.typography.bodyMedium)
                        }

                        user.email?.takeIf { it.isNotBlank() }?.let {
                            Text(it, style = MaterialTheme.typography.bodyMedium)
                        }

                        user.role?.takeIf { it.isNotBlank() }?.let {
                            Text(it.replace("_", " "), style = MaterialTheme.typography.labelMedium)
                        }
                    }
                }
            }

            val profile = uiState.profileUser?.profile

            if (profile?.onboardingStatus == "SKIPPED" ||
                profile?.onboardingStatus == "PENDING" ||
                profile?.onboardingStatus == "IN_PROGRESS" ||
                (profile?.onboardingCompleted == false)
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 2.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Complete your SkillLaunch setup",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.ExtraBold
                            )
                            Text(
                                text = "Your profile can be discovered more accurately when you finish your focus, skills, availability and intro.",
                                modifier = Modifier.padding(top = 4.dp),
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                        TextButton(onClick = onOpenOnboarding) {
                            Text("Finish")
                        }
                    }
                }
            }

            Text(
                text = "Profile information",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(horizontal = 2.dp)
            )
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "🚀 SkillLaunch highlights",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    profile?.category?.takeIf { it.isNotBlank() }?.let {
                        Text(
                            text = "Primary focus: $it",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }

                    profile?.onboardingData?.academicStatus?.takeIf { it.isNotBlank() }?.let {
                        Text(
                            text = "Journey: $it",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }

                    profile?.onboardingData?.graduationYear?.let {
                        Text(
                            text = "Graduation: $it",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }

                    profile?.onboardingData?.availability?.takeIf { it.isNotBlank() }?.let {
                        Text(
                            text = "Availability: $it",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }

                    val selectedSkills = profile?.skills.orEmpty().filter { it.isNotBlank() }
                    if (selectedSkills.isNotEmpty()) {
                        Text(
                            text = "Selected skills",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            selectedSkills.forEach { skill ->
                                Surface(
                                    shape = androidx.compose.foundation.shape.RoundedCornerShape(50),
                                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
                                ) {
                                    Text(
                                        text = skill,
                                        modifier = Modifier.padding(
                                            horizontal = 11.dp,
                                            vertical = 7.dp
                                        ),
                                        color = MaterialTheme.colorScheme.primary,
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    val proofLinks = listOfNotNull(
                        profile?.githubUrl?.takeIf { it.isNotBlank() }?.let { "GitHub • $it" },
                        profile?.youtubeUrl?.takeIf { it.isNotBlank() }?.let { "YouTube / Vimeo • $it" },
                        profile?.drivePortfolio?.takeIf { it.isNotBlank() }?.let { "Portfolio • $it" }
                    )
                    if (proofLinks.isNotEmpty()) {
                        Text(
                            text = "Proof of work",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                        proofLinks.forEach { link ->
                            Text(
                                text = link,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }

                    profile?.resumeUrl?.takeIf { it.isNotBlank() }?.let { resumeUrl ->
                        val uriHandler = LocalUriHandler.current
                        Spacer(modifier = Modifier.height(2.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "📄 Resume",
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = profile.resumeFileName?.ifBlank { "Resume attached" } ?: "Resume attached",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                            TextButton(
                                onClick = { uriHandler.openUri(resumeUrl) }
                            ) {
                                Text("Open")
                            }
                        }
                    }
                }
            }

            OutlinedProfileField(
                value = uiState.form.tagline,
                onValueChange = onTaglineChange,
                label = "⭐ Tagline",
                singleLine = true
            )

            OutlinedProfileField(
                value = uiState.form.bio,
                onValueChange = onBioChange,
                label = "📝 Bio",
                minLines = 4
            )

            OutlinedProfileField(
                value = uiState.form.college,
                onValueChange = onCollegeChange,
                label = "🎓 College",
                singleLine = true
            )

            OutlinedProfileField(
                value = uiState.form.category,
                onValueChange = onCategoryChange,
                label = "📂 Category",
                singleLine = true
            )

            OutlinedProfileField(
                value = uiState.form.hourlyRate,
                onValueChange = onHourlyRateChange,
                label = "💰 Hourly rate",
                singleLine = true
            )

            OutlinedProfileField(
                value = uiState.form.skills,
                onValueChange = onSkillsChange,
                label = "🛠 Skills",
                supportingText = "Example: Kotlin, React, UI Design"
            )

            OutlinedProfileField(
                value = uiState.form.responseTimeExpectation,
                onValueChange = onResponseTimeChange,
                label = "⏱ Response time expectation",
                singleLine = true
            )

            uiState.errorMessage?.let { message ->
                Text(
                    text = message,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(horizontal = 2.dp)
                )

                TextButton(onClick = onClearMessages) {
                    Text("Dismiss")
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
        }
    }
}

@Composable
private fun OutlinedProfileField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    singleLine: Boolean = false,
    minLines: Int = 1,
    supportingText: String? = null
) {
    androidx.compose.material3.OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 2.dp),
        label = { Text(label) },
        singleLine = singleLine,
        minLines = minLines,
        supportingText = supportingText?.let { text ->
            {
                Text(
                    text = text,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(
                        top = 2.dp,
                        bottom = 12.dp
                    )
                )
            }
        }
    )
}
