package com.skilllaunch.app.feature.onboarding

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.collectIsFocusedAsState

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material.icons.outlined.RocketLaunch
import androidx.compose.material.icons.outlined.School
import androidx.compose.material.icons.outlined.Storefront
import androidx.compose.material.icons.outlined.VolunteerActivism
import androidx.compose.material3.Icon
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.foundation.text.selection.LocalTextSelectionColors
import androidx.compose.foundation.text.selection.TextSelectionColors
import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.res.painterResource

import com.skilllaunch.app.data.model.auth.AuthUser
import com.skilllaunch.app.data.model.profile.OnboardingData
import com.skilllaunch.app.data.model.profile.OnboardingUpdateRequest
import com.skilllaunch.app.data.repository.profile.ProfileRepository
import com.skilllaunch.app.feature.auth.AuthBackground
import com.skilllaunch.app.feature.auth.AuthField
import com.skilllaunch.app.feature.auth.AuthFieldIcon
import com.skilllaunch.app.feature.auth.AuthPrimaryButton
import com.skilllaunch.app.feature.auth.SkillLaunchBrand
import com.skilllaunch.app.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OnboardingScreen(
    user: AuthUser,
    repository: ProfileRepository,
    darkTheme: Boolean,
    step: Int,
    onStepChange: (Int) -> Unit,
    onToggleTheme: () -> Unit,
    onFinished: () -> Unit
) {
    val scope = rememberCoroutineScope()

    val profileViewModel: ProfileViewModel = viewModel(
        factory = ProfileViewModel.factory(repository)
    )

    var primaryDomain by rememberSaveable { mutableStateOf("") }
    var selectedSkills by rememberSaveable { mutableStateOf(emptyList<String>()) }
    var skillSearch by rememberSaveable { mutableStateOf("") }
    var githubUrl by rememberSaveable { mutableStateOf("") }
    var youtubeUrl by rememberSaveable { mutableStateOf("") }
    var portfolioUrl by rememberSaveable { mutableStateOf("") }
    var academicStatus by rememberSaveable { mutableStateOf("") }
    var graduationMonth by rememberSaveable { mutableIntStateOf(5) }
    var graduationYear by rememberSaveable { mutableStateOf("") }
    var availability by rememberSaveable { mutableStateOf("") }
    var tagline by rememberSaveable { mutableStateOf("") }
    var bio by rememberSaveable { mutableStateOf("") }
    var resumeFileName by rememberSaveable { mutableStateOf("") }
    var avatarUrl by rememberSaveable { mutableStateOf("") }

    var clientType by rememberSaveable { mutableStateOf("") }
    var hiringCategories by rememberSaveable { mutableStateOf(emptyList<String>()) }
    var hiringIntent by rememberSaveable { mutableStateOf("") }
    var projectScope by rememberSaveable { mutableStateOf("") }
    var budgetPhilosophy by rememberSaveable { mutableStateOf("") }
    var companyOrProjectName by rememberSaveable { mutableStateOf("") }

    var saving by remember { mutableStateOf(false) }
    var loadingInitialProfile by remember { mutableStateOf(true) }
    var showSkipConfirmation by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }

    val isStudent = user.role == "STUDENT_FREELANCER"
    val isClient = user.role == "CLIENT"

    LaunchedEffect(user.id) {
        repository.getMyProfile()
            .onSuccess { profileUser ->
                val profile = profileUser.profile
                val data = profile?.onboardingData

                if (isStudent) {
                    val savedDomain = normalizeLegacyStudentDomain(
                        data?.primaryDomain.orEmpty()
                    )
                    primaryDomain = savedDomain

                    val validSkillTitles = STUDENT_ONBOARDING_SKILLS_BY_DOMAIN[savedDomain]
                        .orEmpty()
                        .map { it.title }
                        .toSet()
                    selectedSkills = data?.selectedSkills.orEmpty().filter { skill ->
                        savedDomain == "Other" || validSkillTitles.contains(skill)
                    }
                    githubUrl = data?.githubUrl.orEmpty()
                    youtubeUrl = data?.youtubeUrl.orEmpty()
                    portfolioUrl = data?.portfolioUrl.orEmpty()
                    val savedAcademicStatus = data?.academicStatus.orEmpty()
                    val stageThreeStatuses = setOf(
                        "High School",
                        "Undergraduate",
                        "Postgraduate",
                        "Bootcamp / Cert",
                        "Self-Taught",
                        "Professional"
                    )
                    academicStatus = savedAcademicStatus.takeIf { it in stageThreeStatuses }.orEmpty()
                    graduationMonth = data?.graduationMonth?.takeIf { it in 1..12 } ?: 5
                    graduationYear = data?.graduationYear?.toString().orEmpty()
                    availability = data?.availability.orEmpty()
                    tagline = profile?.tagline.orEmpty()
                    bio = profile?.bio.orEmpty()
                } else if (isClient) {
                    clientType = data?.clientType
                        ?.takeIf { it in clientTypes }
                        .orEmpty()
                    hiringCategories = data?.hiringCategories.orEmpty()
                    hiringIntent = data?.hiringIntent.orEmpty()
                    projectScope = data?.projectScope.orEmpty()
                    budgetPhilosophy = data?.budgetPhilosophy.orEmpty()
                    companyOrProjectName = data?.companyOrProjectName.orEmpty()
                    tagline = profile?.bio.orEmpty()
                }

                resumeFileName = profile?.resumeFileName.orEmpty()
                avatarUrl = profile?.avatarUrl.orEmpty()
                loadingInitialProfile = false
            }
            .onFailure {
                loadingInitialProfile = false
            }
    }

    fun finishWithSkip() {
        skipOnboarding(
            scope = scope,
            repository = repository,
            user = user,
            primaryDomain = primaryDomain,
            selectedSkills = selectedSkills,
            githubUrl = githubUrl,
            youtubeUrl = youtubeUrl,
            portfolioUrl = portfolioUrl,
            academicStatus = academicStatus,
            graduationMonth = graduationMonth,
            graduationYear = graduationYear,
            availability = availability,
            tagline = tagline,
            bio = bio,
            clientType = clientType,
            hiringCategories = hiringCategories,
            hiringIntent = hiringIntent,
            projectScope = projectScope,
            budgetPhilosophy = budgetPhilosophy,
            companyOrProjectName = companyOrProjectName,
            setSaving = { saving = it },
            setError = { error = it },
            onFinished = onFinished
        )
    }

    BackHandler {
        when {
            showSkipConfirmation -> showSkipConfirmation = false
            loadingInitialProfile -> error = "Please wait while your profile setup is loading."
            step > 1 -> {
                onStepChange(step - 1)
                error = ""
            }
            else -> showSkipConfirmation = true
        }
    }

    if (isStudent && step == 1) {
        StudentDomainSelection(
            selectedDomain = primaryDomain,
            darkTheme = darkTheme,
            error = error,
            saving = saving,
            skipConfirmation = showSkipConfirmation,
            onBack = { showSkipConfirmation = true },
            onSelectDomain = {
                primaryDomain = it
                selectedSkills = emptyList()
                skillSearch = ""
                error = ""
            },
            onContinue = {
                if (primaryDomain.isBlank()) {
                    error = "Choose your primary domain to continue."
                } else {
                    error = ""
                    onStepChange(2)
                }
            },
            onConfirmSkip = {
                showSkipConfirmation = false
                finishWithSkip()
            },
            onDismissSkip = { showSkipConfirmation = false }
        )
        return
    }

    if (isStudent && step == 2) {
        StudentSkillsSelection(
            primaryDomain = primaryDomain,
            selectedSkills = selectedSkills,
            skillSearch = skillSearch,
            githubUrl = githubUrl,
            youtubeUrl = youtubeUrl,
            portfolioUrl = portfolioUrl,
            darkTheme = darkTheme,
            saving = saving,
            skipConfirmation = showSkipConfirmation,
            error = error,
            onBack = {
                onStepChange(1)
                error = ""
            },
            onSkip = {
                showSkipConfirmation = true
            },
            onSkillSearchChange = {
                skillSearch = it
                error = ""
            },
            onToggleSkill = { skill ->
                selectedSkills = toggleMulti(selectedSkills, skill, 6)
                error = ""
            },
            onGithubChange = {
                githubUrl = it.take(250)
                error = ""
            },
            onYoutubeChange = {
                youtubeUrl = it.take(250)
                error = ""
            },
            onPortfolioChange = {
                portfolioUrl = it.take(250)
                error = ""
            },
            onContinue = {
                val linkValidationError = when {
                    validateStudentLink(githubUrl, StudentLinkKind.GITHUB) != null ->
                        validateStudentLink(githubUrl, StudentLinkKind.GITHUB)
                    validateStudentLink(youtubeUrl, StudentLinkKind.YOUTUBE) != null ->
                        validateStudentLink(youtubeUrl, StudentLinkKind.YOUTUBE)
                    validateStudentLink(portfolioUrl, StudentLinkKind.PORTFOLIO) != null ->
                        validateStudentLink(portfolioUrl, StudentLinkKind.PORTFOLIO)
                    else -> null
                }

                when {
                    selectedSkills.isEmpty() -> {
                        error = "Choose at least one primary skill to continue."
                    }
                    linkValidationError != null -> {
                        error = "Fix the highlighted link before continuing."
                    }
                    else -> {
                        error = ""
                        onStepChange(3)
                    }
                }
            },
            onConfirmSkip = {
                showSkipConfirmation = false
                finishWithSkip()
            },
            onDismissSkip = {
                showSkipConfirmation = false
            }
        )
        return
    }

    if (isStudent && step == 3) {
        OnboardingStageThree(
            academicStatus = academicStatus,
            graduationMonth = graduationMonth,
            graduationYear = graduationYear,
            availability = availability,
            darkTheme = darkTheme,
            error = error,
            saving = saving,
            skipConfirmation = showSkipConfirmation,
            onBack = {
                onStepChange(2)
                error = ""
            },
            onSkip = {
                showSkipConfirmation = true
            },
            onAcademicStatusChange = {
                academicStatus = it
                if (it == "Self-Taught" || it == "Professional") {
                    graduationMonth = 5
                    graduationYear = ""
                }
                error = ""
            },
            onGraduationMonthChange = {
                graduationMonth = it
                error = ""
            },
            onGraduationYearChange = {
                graduationYear = it
                error = ""
            },
            onAvailabilityChange = {
                availability = it
                error = ""
            },
            onConfirmSkip = {
                showSkipConfirmation = false
                finishWithSkip()
            },
            onDismissSkip = {
                showSkipConfirmation = false
            },
            onContinue = {
                val validationMessage = when {
                    academicStatus.isBlank() ->
                        "Choose your academic status to continue."
                    academicStatus in setOf(
                        "High School",
                        "Undergraduate",
                        "Postgraduate",
                        "Bootcamp / Cert"
                    ) && graduationYear.isBlank() ->
                        "Select your expected graduation month and year."
                    availability.isBlank() ->
                        "Choose your work availability to continue."
                    else -> ""
                }

                if (validationMessage.isNotBlank()) {
                    error = validationMessage
                } else {
                    error = ""
                    onStepChange(4)
                }
            }
        )
        return
    }

    if (isStudent && step == 4) {
        OnboardingStageFour(
            darkTheme = darkTheme,
            tagline = tagline,
            bio = bio,
            initialResumeFileName = resumeFileName,
            initialAvatarUrl = avatarUrl,
            saving = saving,
            skipConfirmation = showSkipConfirmation,
            profileViewModel = profileViewModel,
            error = error,
            onTaglineChange = {
                tagline = it
                error = ""
            },
            onBioChange = {
                bio = it
                error = ""
            },
            onAvatarUploaded = {
                avatarUrl = it
            },
            onBack = {
                onStepChange(3)
                error = ""
            },
            onSkip = {
                showSkipConfirmation = true
            },
            onConfirmSkip = {
                showSkipConfirmation = false
                finishWithSkip()
            },
            onDismissSkip = {
                showSkipConfirmation = false
            },
            onContinue = {
                when {
                    profileViewModel.isResumeUploading -> {
                        error = "Please wait for the resume upload to finish."
                    }
                    profileViewModel.isAvatarUploading -> {
                        error = "Please wait for the profile photo upload to finish."
                    }
                    else -> validateAndSave(
                        scope = scope,
                        repository = repository,
                        user = user,
                        primaryDomain = primaryDomain,
                        selectedSkills = selectedSkills,
                        githubUrl = githubUrl,
                        youtubeUrl = youtubeUrl,
                        portfolioUrl = portfolioUrl,
                        academicStatus = academicStatus,
                        graduationMonth = graduationMonth,
                        graduationYear = graduationYear,
                        availability = availability,
                        tagline = tagline,
                        bio = bio,
                        avatarUrl = avatarUrl,
                        clientType = clientType,
                        hiringCategories = hiringCategories,
                        hiringIntent = hiringIntent,
                        projectScope = projectScope,
                        budgetPhilosophy = budgetPhilosophy,
                        companyOrProjectName = companyOrProjectName,
                        setSaving = { saving = it },
                        setError = { error = it },
                        onFinished = onFinished,
                        isStudent = true
                    )
                }
            }
        )
        return
    }

    AuthBackground(darkTheme = darkTheme) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding()
                .imePadding()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp)
        ) {
            OnboardingHeader(
                darkTheme = darkTheme,
                onSkip = { showSkipConfirmation = true },
                enabled = !saving && !loadingInitialProfile,
                horizontalPadding = 0.dp,
                accentOverride = if (isClient) Color(0xFFD6B632) else null
            )

            Spacer(modifier = Modifier.height(11.dp))
            OnboardingProgress(
                current = step,
                total = if (isStudent) 4 else 3,
                activeColor = if (isClient) {
                    Color(0xFFD6B632)
                } else {
                    MaterialTheme.colorScheme.primary
                },
                inactiveColor = if (darkTheme) {
                    Color(0xFF2B3040)
                } else {
                    Color(0xFFD8D5E6)
                }
            )

            val stepLabel = if (isStudent) {
                studentStepLabels[step - 1]
            } else {
                clientStepLabels[step - 1]
            }

            Text(
                text = AnnotatedString.Builder().apply {
                    withStyle(
                        SpanStyle(
                            color = MaterialTheme.colorScheme.onSurface,
                            fontWeight = FontWeight.Bold
                        )
                    ) {
                        append("Step $step")
                    }
                    withStyle(
                        SpanStyle(
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    ) {
                        append(" of " + (if (isStudent) 4 else 3) + "  •  ")
                        append(stepLabel)
                    }
                }.toAnnotatedString(),
                modifier = Modifier.padding(top = 8.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 12.5.sp,
                lineHeight = 16.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = 0.1.sp
            )

            AnimatedVisibility(
                visible = step > 1,
                enter = fadeIn() + slideInVertically(initialOffsetY = { -it / 2 }),
                exit = fadeOut() + slideOutVertically(targetOffsetY = { -it / 2 })
            ) {
                TextButton(
                    onClick = {
                        onStepChange(step - 1)
                        error = ""
                    },
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(
                        horizontal = 0.dp,
                        vertical = 2.dp
                    )
                ) {
                    Text(
                        text = "← Back to previous step",
                        color = if (isClient) Color(0xFFD6B632) else MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.TopCenter
            ) {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clipToBounds(),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(
                        bottom = 76.dp
                    ),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    when {
                        isClient && step == 1 -> item {
                            Column(
                                verticalArrangement = Arrangement.spacedBy(11.dp)
                            ) {
                                Text(
                                    text = "Who's hiring today?",
                                    style = TextStyle(
                                        fontFamily = androidx.compose.ui.text.font.FontFamily.Serif,
                                        fontSize = 37.sp,
                                        lineHeight = 40.sp,
                                        fontWeight = FontWeight.Bold
                                    ),
                                    color = MaterialTheme.colorScheme.onSurface
                                )

                                Text(
                                    text = "Tell us what kind of client you are so we can shape your hiring experience.",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    style = MaterialTheme.typography.bodyLarge.copy(
                                        fontSize = 15.5.sp
                                    ),
                                    lineHeight = 22.sp
                                )

                                if (error.isNotBlank()) {
                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.78f)
                                    ) {
                                        Text(
                                            text = error,
                                            modifier = Modifier.padding(
                                                horizontal = 13.dp,
                                                vertical = 10.dp
                                            ),
                                            color = MaterialTheme.colorScheme.onErrorContainer,
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }

                                ClientTypeSelectionGrid(
                                    options = clientTypes,
                                    selected = clientType,
                                    darkTheme = darkTheme,
                                    onSelect = {
                                        clientType = it
                                        error = ""
                                    }
                                )
                            }
                        }

                        isClient && step == 2 -> item {
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(0.dp)
                            ) {
                                Text(
                                    text = "What do you need built?",
                                    style = TextStyle(
                                        fontFamily = androidx.compose.ui.text.font.FontFamily.Serif,
                                        fontSize = 29.sp,
                                        lineHeight = 34.sp,
                                        fontWeight = FontWeight.Bold
                                    ),
                                    color = MaterialTheme.colorScheme.onSurface
                                )

                                Spacer(modifier = Modifier.height(6.dp))

                                Text(
                                    text = "Select the skills you need, and we'll instantly surface the brightest emerging talent.",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontSize = 14.5.sp,
                                    lineHeight = 21.sp
                                )

                                if (error.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.78f)
                                    ) {
                                        Text(
                                            text = error,
                                            modifier = Modifier.padding(
                                                horizontal = 12.dp,
                                                vertical = 9.dp
                                            ),
                                            color = MaterialTheme.colorScheme.onErrorContainer,
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                SelectionChipGroup(
                                    options = clientCategories,
                                    selected = hiringCategories,
                                    darkTheme = darkTheme,
                                    onToggle = {
                                        hiringCategories = toggleMulti(hiringCategories, it, 6)
                                        error = ""
                                    }
                                )

                                Spacer(modifier = Modifier.height(20.dp))
                                ClientOnboardingDivider()
                                Spacer(modifier = Modifier.height(18.dp))

                                ClientOnboardingSectionLabel(
                                    text = "WHAT BEST DESCRIBES YOUR GOAL?",
                                    darkTheme = darkTheme
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                SelectionChipGroup(
                                    options = hiringIntentOptions,
                                    selected = listOf(hiringIntent),
                                    darkTheme = darkTheme,
                                    onToggle = {
                                        hiringIntent = it
                                        error = ""
                                    },
                                    singleSelect = true
                                )

                                Spacer(modifier = Modifier.height(22.dp))
                                ClientOnboardingDivider()
                                Spacer(modifier = Modifier.height(18.dp))

                                ClientOnboardingSectionLabel(
                                    text = "PROJECT SCOPE",
                                    darkTheme = darkTheme
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                SelectionChipGroup(
                                    options = projectScopeOptions,
                                    selected = listOf(projectScope),
                                    darkTheme = darkTheme,
                                    onToggle = {
                                        projectScope = it
                                        error = ""
                                    },
                                    singleSelect = true
                                )

                                Spacer(modifier = Modifier.height(22.dp))
                                ClientOnboardingDivider()
                                Spacer(modifier = Modifier.height(18.dp))

                                ClientOnboardingSectionLabel(
                                    text = "BUDGET PHILOSOPHY",
                                    darkTheme = darkTheme
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                SelectionChipGroup(
                                    options = budgetPhilosophyOptions,
                                    selected = listOf(budgetPhilosophy),
                                    darkTheme = darkTheme,
                                    onToggle = {
                                        budgetPhilosophy = it
                                        error = ""
                                    },
                                    singleSelect = true
                                )
                            }
                        }

                        isClient && step == 3 -> item {
                            val clientAccent = Color(0xFFD6B632)
                            val selectionColors = TextSelectionColors(
                                handleColor = clientAccent,
                                backgroundColor = clientAccent.copy(alpha = 0.32f)
                            )

                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(11.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(clientAccent.copy(alpha = 0.14f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Outlined.Apartment,
                                            contentDescription = null,
                                            tint = clientAccent,
                                            modifier = Modifier.size(21.dp)
                                        )
                                    }

                                    Column(
                                        modifier = Modifier.weight(1f),
                                        verticalArrangement = Arrangement.spacedBy(3.dp)
                                    ) {
                                        Text(
                                            text = "Tell students who they're building for.",
                                            style = TextStyle(
                                                fontFamily = androidx.compose.ui.text.font.FontFamily.Serif,
                                                fontSize = 32.sp,
                                                lineHeight = 36.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                letterSpacing = (-0.45).sp
                                            )
                                        )
                                        Text(
                                            text = "Give students a clear name and a short description of what you're building.",
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            style = MaterialTheme.typography.bodyMedium.copy(
                                                lineHeight = 20.sp
                                            )
                                        )
                                    }
                                }

                                ClientBrandIdentityField(
                                    label = "Company / Project name",
                                    value = companyOrProjectName,
                                    onValueChange = { value ->
                                        companyOrProjectName = value.take(60)
                                        error = ""
                                    },
                                    placeholder = "SkillLaunch Labs",
                                    valueColor = if (darkTheme) {
                                        Color(0xFFF4F4F5)
                                    } else {
                                        Color(0xFF111827)
                                    }
                                )

                                CompositionLocalProvider(
                                    LocalTextSelectionColors provides selectionColors
                                ) {
                                    OnboardingTextArea(
                                        label = "Short tagline",
                                        value = tagline,
                                        onValueChange = { value ->
                                            tagline = value.take(100)
                                            error = ""
                                        },
                                        placeholder = "We're building tools that help students get real-world experience.",
                                        accentColor = clientAccent,
                                        labelColor = MaterialTheme.colorScheme.onSurface
                                    )
                                }

                                Text(
                                    text = "${tagline.length}/100",
                                    modifier = Modifier.fillMaxWidth(),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.End,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    style = MaterialTheme.typography.bodySmall
                                )

                                if (error.isNotBlank()) {
                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.78f)
                                    ) {
                                        Text(
                                            text = error,
                                            modifier = Modifier.padding(
                                                horizontal = 12.dp,
                                                vertical = 9.dp
                                            ),
                                            color = MaterialTheme.colorScheme.onErrorContainer,
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }
                    }

                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            val isLastStep = step == if (isStudent) 4 else 3

            if (showSkipConfirmation) {
                AlertDialog(
                    onDismissRequest = { showSkipConfirmation = false },
                    title = {
                        Text("Skip profile setup?")
                    },
                    text = {
                        Text(
                            "Your progress will be saved. You can return to Profile later and finish the setup."
                        )
                    },
                    confirmButton = {
                        TextButton(
                            onClick = {
                                showSkipConfirmation = false
                                finishWithSkip()
                            },
                            enabled = !saving && !loadingInitialProfile
                        ) {
                            Text("Skip for now")
                        }
                    },
                    dismissButton = {
                        TextButton(
                            onClick = { showSkipConfirmation = false }
                        ) {
                            Text("Keep setting up")
                        }
                    }
                )
            }

            val continueText = when {
                isLastStep && isStudent -> "Find My First Project"
                isLastStep -> "Explore Talent"
                else -> "Continue"
            }

            fun onContinueClick() {
                if (isLastStep) {
                    validateAndSave(
                        scope = scope,
                        repository = repository,
                        user = user,
                        primaryDomain = primaryDomain,
                        selectedSkills = selectedSkills,
                        githubUrl = githubUrl,
                        youtubeUrl = youtubeUrl,
                        portfolioUrl = portfolioUrl,
                        academicStatus = academicStatus,
                        graduationMonth = graduationMonth,
                        graduationYear = graduationYear,
                        availability = availability,
                        tagline = tagline,
                        bio = bio,
                        avatarUrl = avatarUrl,
                        clientType = clientType,
                        hiringCategories = hiringCategories,
                        hiringIntent = hiringIntent,
                        projectScope = projectScope,
                        budgetPhilosophy = budgetPhilosophy,
                        companyOrProjectName = companyOrProjectName,
                        setSaving = { saving = it },
                        setError = { error = it },
                        onFinished = onFinished,
                        isStudent = isStudent
                    )
                } else {
                    val validationMessage = when {
                        !isStudent && !isClient ->
                            "This account type does not use onboarding."
                        isStudent && step == 1 && primaryDomain.isBlank() ->
                            "Choose your main focus to continue."
                        isStudent && step == 2 && selectedSkills.isEmpty() ->
                            "Choose at least one primary skill to continue."
                        isStudent && step == 3 && academicStatus.isBlank() ->
                            "Choose your current academic status first."
                        isStudent && step == 3 && availability.isBlank() ->
                            "Choose when you can work so we can match you appropriately."
                        isClient && step == 1 && clientType.isBlank() ->
                            "Choose the client type to continue."
                        isClient && step == 2 && hiringCategories.isEmpty() ->
                            "Choose at least one talent category."
                        isClient && step == 2 && hiringIntent.isBlank() ->
                            "Choose your hiring goal."
                        isClient && step == 2 && projectScope.isBlank() ->
                            "Choose the project scope."
                        isClient && step == 2 && budgetPhilosophy.isBlank() ->
                            "Choose your budget/work model."
                        isClient && step == 3 && companyOrProjectName.isBlank() ->
                            "Add a company or project name."
                        else -> ""
                    }

                    if (validationMessage.isNotBlank()) {
                        error = validationMessage
                        return
                    }

                    error = ""
                    onStepChange(step + 1)
                }
            }

            if (isClient) {
                ClientPrimaryButton(
                    text = continueText,
                    enabled = !saving && !loadingInitialProfile,
                    loading = saving,
                    onClick = { onContinueClick() }
                )
            } else {
                AuthPrimaryButton(
                    text = continueText,
                    enabled = !saving && !loadingInitialProfile,
                    loading = saving,
                    onClick = { onContinueClick() }
                )
            }
        }
    }
}

@Composable
private fun ClientPrimaryButton(
    text: String,
    enabled: Boolean = true,
    loading: Boolean = false,
    onClick: () -> Unit
) {
    val accent = Color(0xFFD6B632)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .clip(RoundedCornerShape(28.dp))
            .background(accent.copy(alpha = if (enabled) 1f else 0.52f))
            .clickable(enabled = enabled && !loading, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        if (loading) {
            androidx.compose.material3.CircularProgressIndicator(
                modifier = Modifier.size(21.dp),
                strokeWidth = 2.dp,
                color = Color(0xFF171717)
            )
        } else {
            Text(
                text = text,
                color = Color(0xFF171717),
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.ExtraBold
            )
        }
    }
}

@Composable
private fun OnboardingProgress(
    current: Int,
    total: Int,
    activeColor: Color,
    inactiveColor: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(5.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(total) { index ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxSize()
                    .clip(RoundedCornerShape(100.dp))
                    .background(
                        if (index < current) {
                            Brush.horizontalGradient(
                                listOf(
                                    activeColor,
                                    activeColor.copy(alpha = 0.72f)
                                )
                            )
                        } else {
                            Brush.linearGradient(
                                listOf(inactiveColor, inactiveColor)
                            )
                        }
                    )
            )
        }
    }
}

@Composable
private fun SectionHeader(
    emoji: String,
    title: String,
    subtitle: String
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(text = emoji, fontSize = 25.sp)
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.ExtraBold
        )
        Text(
            text = subtitle,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

@Composable
private fun ClientTypeSelectionGrid(
    options: List<String>,
    selected: String,
    darkTheme: Boolean,
    onSelect: (String) -> Unit
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(11.dp)
    ) {
        options.chunked(2).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(11.dp)
            ) {
                row.forEach { option ->
                    ClientTypeCard(
                        type = option,
                        selected = selected == option,
                        darkTheme = darkTheme,
                        modifier = Modifier.weight(1f),
                        onClick = { onSelect(option) }
                    )
                }

                if (row.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun ClientTypeCard(
    type: String,
    selected: Boolean,
    darkTheme: Boolean,
    modifier: Modifier,
    onClick: () -> Unit
) {
    val accent = Color(0xFFD6B632)
    val checkColor = if (darkTheme) Color(0xFF63D985) else Color(0xFFD6B632)
    val shape = RoundedCornerShape(18.dp)

    // Keep selection feedback immediate so rapid card taps do not queue
    // animated color transitions across the six onboarding cards.
    val borderColor = if (selected) {
        accent
    } else {
        MaterialTheme.colorScheme.onSurface.copy(
            alpha = if (darkTheme) 0.12f else 0.08f
        )
    }

    val backgroundColor = if (darkTheme) {
        Color(0xFF181E27)
    } else {
        Color.White
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(218.dp)
            .then(
                if (selected && darkTheme) {
                    Modifier.shadow(
                        elevation = 12.dp,
                        shape = shape,
                        ambientColor = accent.copy(alpha = 0.35f),
                        spotColor = accent.copy(alpha = 0.45f)
                    )
                } else {
                    Modifier
                }
            )
            .clip(shape)
            .background(backgroundColor)
            .border(
                width = if (selected) 1.6.dp else 1.dp,
                color = borderColor,
                shape = shape
            )
            .clickable(onClick = onClick)
            .padding(
                horizontal = if (darkTheme) 14.dp else 14.dp,
                vertical = if (darkTheme) 13.dp else 14.dp
            )
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.TopStart
            ) {
                Icon(
                    imageVector = clientTypeIcon(type),
                    contentDescription = null,
                    tint = Color(0xFFD6B632),
                    modifier = Modifier.size(22.dp)
                )

                if (selected) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .size(if (darkTheme) 24.dp else 23.dp)
                            .clip(androidx.compose.foundation.shape.CircleShape)
                            .background(checkColor),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "✓",
                            color = Color(0xFF102116),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(horizontal = 4.dp, vertical = 2.dp),
                contentAlignment = Alignment.Center
            ) {
                ClientTypeArtwork(
                    type = type,
                    darkTheme = darkTheme,
                    modifier = Modifier.fillMaxSize()
                )
            }

            Column(
                modifier = Modifier.padding(bottom = 2.dp),
                verticalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                Text(
                    text = clientTypeDisplayNames[type] ?: type,
                    color = MaterialTheme.colorScheme.onSurface,
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontSize = if (darkTheme) 14.sp else 14.sp,
                        lineHeight = 18.sp
                    ),
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1
                )
                Text(
                    text = clientTypeShortDescriptions[type].orEmpty(),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontSize = if (darkTheme) 10.sp else 11.sp
                    ),
                    lineHeight = 14.sp,
                    maxLines = 2
                )
            }
        }
    }
}

@Composable
private fun ClientTypeArtwork(
    type: String,
    darkTheme: Boolean,
    modifier: Modifier = Modifier
) {
    val resource = if (!darkTheme) {
        when (type) {
            "Solo Founder / Individual" -> R.drawable.client_founder_light
            "Early-stage Startup" -> R.drawable.client_startup_light
            "Small Business" -> R.drawable.client_small_business_light
            "Company" -> R.drawable.client_company_light
            "Academic / Research" -> R.drawable.client_academic_light
            "Non-profit / Organization" -> R.drawable.client_nonprofit_light
            else -> R.drawable.client_company_light
        }
    } else {
        when (type) {
            "Solo Founder / Individual" -> R.drawable.client_founder_dark
            "Early-stage Startup" -> R.drawable.client_startup_dark
            "Small Business" -> R.drawable.client_small_business_dark
            "Company" -> R.drawable.client_company_dark
            "Academic / Research" -> R.drawable.client_academic_dark
            "Non-profit / Organization" -> R.drawable.client_nonprofit_dark
            else -> R.drawable.client_company_dark
        }
    }

    Image(
        painter = painterResource(id = resource),
        contentDescription = "Client Type Artwork",
        modifier = modifier.fillMaxSize(),
        contentScale = androidx.compose.ui.layout.ContentScale.Fit
    )
}

private fun clientTypeIcon(type: String) = when (type) {
    "Solo Founder / Individual" -> Icons.Outlined.PersonAdd
    "Early-stage Startup" -> Icons.Outlined.RocketLaunch
    "Small Business" -> Icons.Outlined.Storefront
    "Company" -> Icons.Outlined.Apartment
    "Academic / Research" -> Icons.Outlined.School
    "Non-profit / Organization" -> Icons.Outlined.VolunteerActivism
    else -> Icons.Outlined.Apartment
}

private val clientTypeDisplayNames = mapOf(
    "Solo Founder / Individual" to "Solo Founder",
    "Early-stage Startup" to "Early Startup",
    "Small Business" to "Small Business",
    "Company" to "Company",
    "Academic / Research" to "Academic",
    "Non-profit / Organization" to "Non-profit"
)

private val clientTypeShortDescriptions = mapOf(
    "Solo Founder / Individual" to "Personal or founder-led",
    "Early-stage Startup" to "Fast-moving products",
    "Small Business" to "Growing local business",
    "Company" to "Established organization",
    "Academic / Research" to "Research or education",
    "Non-profit / Organization" to "Mission-driven projects"
)

@Composable
private fun SelectionGrid(
    options: List<String>,
    selected: String,
    descriptionMap: Map<String, String> = emptyMap(),
    iconMap: Map<String, String> = emptyMap(),
    onSelect: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
        options.chunked(2).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(9.dp)
            ) {
                row.forEach { option ->
                    ChoiceCard(
                        text = option,
                        description = descriptionMap[option].orEmpty(),
                        icon = iconMap[option] ?: "✦",
                        selected = selected == option,
                        modifier = Modifier.weight(1f),
                        onClick = { onSelect(option) }
                    )
                }
                if (row.size == 1) Spacer(modifier = Modifier.weight(1f))
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SelectionChipGroup(
    options: List<String>,
    selected: List<String>,
    darkTheme: Boolean,
    onToggle: (String) -> Unit,
    singleSelect: Boolean = false
) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        options.forEach { option ->
            ClientOnboardingChip(
                text = option,
                selected = selected.contains(option),
                darkTheme = darkTheme,
                onClick = {
                    if (singleSelect && selected.contains(option)) {
                        onToggle("")
                    } else {
                        onToggle(option)
                    }
                }
            )
        }
    }
}

@Composable
private fun ClientOnboardingChip(
    text: String,
    selected: Boolean,
    darkTheme: Boolean,
    onClick: () -> Unit
) {
    val accent = Color(0xFFD6B632)
    val background = if (darkTheme) {
        Color(0xFF182441)
    } else {
        Color(0xFFF0F2F7)
    }
    val textColor = if (darkTheme) {
        Color.White
    } else {
        Color(0xFF111827)
    }
    val borderColor = if (selected) {
        accent
    } else {
        Color.Transparent
    }

    Box(
        modifier = Modifier
            .height(32.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(background)
            .border(
                width = if (selected) 1.25.dp else 1.dp,
                color = borderColor,
                shape = RoundedCornerShape(10.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = textColor,
            fontSize = 12.5.sp,
            lineHeight = 16.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun ClientOnboardingDivider() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(Color(0xFF26314A))
    )
}

@Composable
private fun ClientOnboardingSectionLabel(
    text: String,
    darkTheme: Boolean
) {
    Text(
        text = text,
        color = if (darkTheme) {
            Color(0xFF8EA8D3)
        } else {
            Color(0xFF526A90)
        },
        fontSize = 10.5.sp,
        lineHeight = 14.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 1.15.sp
    )
}

@Composable
private fun ChoiceCard(
    text: String,
    description: String,
    icon: String,
    selected: Boolean,
    modifier: Modifier,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(18.dp)
    Box(
        modifier = modifier
            .height(76.dp)
            .clip(shape)
            .then(
                if (selected) {
                    Modifier.background(
                        brush = Brush.horizontalGradient(
                            listOf(Color(0xFF5845E9), Color(0xFF8B3BEB))
                        )
                    )
                } else {
                    Modifier.background(
                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.48f)
                    )
                }
            )
            .border(
                BorderStroke(
                    1.dp,
                    if (selected) Color.Transparent
                    else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.09f)
                ),
                shape
            )
            .clickable(onClick = onClick)
            .padding(14.dp),
        contentAlignment = Alignment.CenterStart
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = if (selected) "✓" else icon,
                color = if (selected) Color.White else MaterialTheme.colorScheme.primary,
                fontSize = 19.sp,
                fontWeight = FontWeight.Bold
            )
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    text = text,
                    color = if (selected) Color.White else MaterialTheme.colorScheme.onSurface,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1
                )
                Text(
                    text = description,
                    color = if (selected) {
                        Color.White.copy(alpha = 0.82f)
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    },
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.sp),
                    maxLines = 1
                )
            }
        }
    }
}

@Composable
private fun ClientBrandIdentityField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    valueColor: Color
) {
    val interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    val focused = interactionSource.collectIsFocusedAsState().value
    val shape = RoundedCornerShape(18.dp)

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = label,
            color = MaterialTheme.colorScheme.onSurface,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.Bold
        )

        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier
                .fillMaxWidth()
                .height(70.dp),
            singleLine = true,
            interactionSource = interactionSource,
            cursorBrush = androidx.compose.ui.graphics.SolidColor(
                Color(0xFFD6B632)
            ),
            textStyle = TextStyle(
                color = valueColor,
                fontSize = 17.sp,
                lineHeight = 22.sp,
                fontWeight = FontWeight.SemiBold
            ),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
            decorationBox = { inner ->
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(shape)
                        .background(
                            MaterialTheme.colorScheme.surface.copy(alpha = 0.64f)
                        )
                        .border(
                            width = if (focused) 1.5.dp else 1.dp,
                            color = if (focused) {
                                Color(0xFFD6B632)
                            } else {
                                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.18f)
                            },
                            shape = shape
                        )
                        .padding(horizontal = 18.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Apartment,
                        contentDescription = null,
                        tint = Color(0xFFD6B632),
                        modifier = Modifier.size(22.dp)
                    )

                    Spacer(modifier = Modifier.size(13.dp))

                    Box(
                        modifier = Modifier.weight(1f),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        if (value.isBlank()) {
                            Text(
                                text = placeholder,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.55f),
                                fontSize = 16.sp,
                                lineHeight = 22.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        inner()
                    }
                }
            }
        )
    }
}

@Composable
private fun OnboardingTextArea(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    accentColor: Color = MaterialTheme.colorScheme.primary,
    labelColor: Color = MaterialTheme.colorScheme.onSurfaceVariant
) {
    val interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    val focused = interactionSource.collectIsFocusedAsState().value

    Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
        Text(
            text = label,
            color = labelColor,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold
        )
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier
                .fillMaxWidth()
                .height(105.dp),
            minLines = 4,
            maxLines = 4,
            interactionSource = interactionSource,
            cursorBrush = androidx.compose.ui.graphics.SolidColor(
                accentColor
            ),
            textStyle = TextStyle(
                color = MaterialTheme.colorScheme.onSurface,
                fontSize = 16.sp,
                lineHeight = 22.sp,
                fontWeight = FontWeight.Medium
            ),
            decorationBox = { inner ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(RoundedCornerShape(16.dp))
                        .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.48f))
                        .border(
                            1.dp,
                            if (focused) {
                                accentColor.copy(alpha = 0.82f)
                            } else {
                                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.10f)
                            },
                            RoundedCornerShape(16.dp)
                        )
                        .padding(16.dp),
                    contentAlignment = Alignment.TopStart
                ) {
                    if (value.isBlank()) {
                        Text(
                            text = placeholder,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.52f),
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                    inner()
                }
            }
        )
    }
}

private fun toggleMulti(
    selected: List<String>,
    value: String,
    max: Int
): List<String> {
    return if (selected.contains(value)) {
        selected - value
    } else if (selected.size < max && value.isNotBlank()) {
        selected + value
    } else {
        selected
    }
}

private fun validateAndSave(
    scope: CoroutineScope,
    repository: ProfileRepository,
    user: AuthUser,
    primaryDomain: String,
    selectedSkills: List<String>,
    githubUrl: String,
    youtubeUrl: String,
    portfolioUrl: String,
    academicStatus: String,
    graduationMonth: Int,
    graduationYear: String,
    availability: String,
    tagline: String,
    bio: String,
    avatarUrl: String,
    clientType: String,
    hiringCategories: List<String>,
    hiringIntent: String,
    projectScope: String,
    budgetPhilosophy: String,
    companyOrProjectName: String,
    setSaving: (Boolean) -> Unit,
    setError: (String) -> Unit,
    onFinished: () -> Unit,
    isStudent: Boolean
) {
    val isClient = user.role == "CLIENT"

    if (isStudent) {
        if (primaryDomain.isBlank()) {
            setError("Choose your main focus to continue.")
            return
        }
        if (selectedSkills.isEmpty()) {
            setError("Choose at least one skill.")
            return
        }
        if (tagline.trim().isBlank()) {
            setError("Add a professional headline to complete your profile.")
            return
        }
        if (academicStatus.isBlank() || availability.isBlank()) {
            setError("Choose your academic status and availability.")
            return
        }
    } else if (isClient) {
        if (clientType !in clientTypes) {
            setError("Choose the client type to continue.")
            return
        }
        if (
            hiringCategories.isEmpty() ||
            hiringIntent.isBlank() ||
            projectScope.isBlank() ||
            budgetPhilosophy.isBlank()
        ) {
            setError("Complete your hiring preferences first.")
            return
        }
        if (companyOrProjectName.isBlank()) {
            setError("Add a company or project name.")
            return
        }
    } else {
        setError("This account type does not use onboarding.")
        return
    }

    val data = OnboardingData(
        role = user.role,
        primaryDomain = primaryDomain.ifBlank { null },
        selectedSkills = selectedSkills,
        githubUrl = githubUrl.trim().ifBlank { null },
        youtubeUrl = youtubeUrl.trim().ifBlank { null },
        portfolioUrl = portfolioUrl.trim().ifBlank { null },
        academicStatus = academicStatus.ifBlank { null },
        graduationMonth = graduationMonth.takeIf {
            academicStatus in setOf(
                "High School Student",
                "Undergraduate Student",
                "Postgraduate Student"
            )
        },
        graduationYear = graduationYear.toIntOrNull(),
        availability = availability.ifBlank { null },
        clientType = clientType.ifBlank { null },
        hiringCategories = hiringCategories,
        hiringIntent = hiringIntent.ifBlank { null },
        projectScope = projectScope.ifBlank { null },
        budgetPhilosophy = budgetPhilosophy.ifBlank { null },
        companyOrProjectName = companyOrProjectName.trim().ifBlank { null }
    )

    val request = OnboardingUpdateRequest(
        tagline = if (isStudent) tagline.trim().ifBlank { null } else companyOrProjectName.trim().ifBlank { null },
        bio = if (isStudent) bio.trim().ifBlank { null } else tagline.trim().ifBlank { null },
        category = if (isStudent) {
            primaryDomain.ifBlank { null }
        } else {
            hiringCategories.firstOrNull()
        },
        skills = if (isStudent) selectedSkills else null,
        avatarUrl = avatarUrl.trim().ifBlank { null },
        responseTimeExpectation = if (isStudent) availability else projectScope,
        githubUrl = githubUrl.trim().ifBlank { null },
        youtubeUrl = youtubeUrl.trim().ifBlank { null },
        drivePortfolio = portfolioUrl.trim().ifBlank { null },
        onboardingCompleted = true,
        onboardingStatus = "COMPLETED",
        onboardingData = data
    )

    setSaving(true)
    setError("")

    scope.launch {
        repository.updateOnboarding(request)
            .onSuccess {
                setSaving(false)
                onFinished()
            }
            .onFailure { exception ->
                setSaving(false)
                setError(
                    exception.message
                        ?: "Unable to save your setup right now. You can skip and finish it later."
                )
            }
    }
}

private fun skipOnboarding(
    scope: CoroutineScope,
    repository: ProfileRepository,
    user: AuthUser,
    primaryDomain: String,
    selectedSkills: List<String>,
    githubUrl: String,
    youtubeUrl: String,
    portfolioUrl: String,
    academicStatus: String,
    graduationMonth: Int,
    graduationYear: String,
    availability: String,
    tagline: String,
    bio: String,
    clientType: String,
    hiringCategories: List<String>,
    hiringIntent: String,
    projectScope: String,
    budgetPhilosophy: String,
    companyOrProjectName: String,
    setSaving: (Boolean) -> Unit,
    setError: (String) -> Unit,
    onFinished: () -> Unit
) {
    val data = OnboardingData(
        role = user.role ?: "STUDENT_FREELANCER",
        primaryDomain = if (primaryDomain == "Other") {
            primaryDomain.ifBlank { null }
        } else {
            primaryDomain.ifBlank { null }
        },
        selectedSkills = selectedSkills,
        githubUrl = githubUrl.trim().ifBlank { null },
        youtubeUrl = youtubeUrl.trim().ifBlank { null },
        portfolioUrl = portfolioUrl.trim().ifBlank { null },
        academicStatus = academicStatus.ifBlank { null },
        graduationMonth = graduationMonth.takeIf { academicStatus in setOf(
            "High School",
            "Undergraduate",
            "Postgraduate",
            "Bootcamp / Cert"
        ) },
        graduationYear = graduationYear.toIntOrNull(),
        availability = availability.ifBlank { null },
        clientType = clientType.ifBlank { null },
        hiringCategories = hiringCategories,
        hiringIntent = hiringIntent.ifBlank { null },
        projectScope = projectScope.ifBlank { null },
        budgetPhilosophy = budgetPhilosophy.ifBlank { null },
        companyOrProjectName = companyOrProjectName.trim().ifBlank { null }
    )

    val request = OnboardingUpdateRequest(
        tagline = if (user.role == "STUDENT_FREELANCER") {
            tagline.trim().ifBlank { null }
        } else {
            companyOrProjectName.trim().ifBlank { null }
        },
        bio = if (user.role == "STUDENT_FREELANCER") {
            bio.trim().ifBlank { null }
        } else {
            tagline.trim().ifBlank { null }
        },
        category = if (user.role == "STUDENT_FREELANCER") {
            primaryDomain.trim().ifBlank { null }
        } else {
            hiringCategories.firstOrNull()
        },
        skills = selectedSkills.takeIf { it.isNotEmpty() },
        responseTimeExpectation = if (user.role == "STUDENT_FREELANCER") {
            availability.trim().ifBlank { null }
        } else {
            projectScope.trim().ifBlank { null }
        },
        githubUrl = githubUrl.trim().ifBlank { null },
        youtubeUrl = youtubeUrl.trim().ifBlank { null },
        drivePortfolio = portfolioUrl.trim().ifBlank { null },
        onboardingCompleted = false,
        onboardingStatus = "SKIPPED",
        onboardingData = data
    )

    setSaving(true)
    setError("")

    scope.launch {
        repository.updateOnboarding(request)
            .onSuccess {
                setSaving(false)
                onFinished()
            }
            .onFailure { exception ->
                setSaving(false)
                setError(
                    exception.message
                        ?: "We couldn't save your progress right now. Try again."
                )
            }
    }
}

private fun normalizeLegacyStudentDomain(value: String): String {
    if (value.isBlank()) return ""
    if (studentGigDomainNames.contains(value)) return value

    return when (value) {
        "Mobile Development" -> "Mobile App Development"
        "Software & APIs" -> "Software & IT Services"
        "Data & AI" -> "AI, Machine Learning & Data Science"
        "Cybersecurity", "Cloud & DevOps" -> "Software & IT Services"
        "UI/UX Design", "Graphic & Brand Design" -> "Design & Creative"
        "Video & Motion" -> "Video, Audio & Animation"
        "Writing & Content" -> "Writing & Content Creation"
        "Marketing & SEO" -> "Digital Marketing & SEO"
        "Business & Research" -> "Business, Finance & HR"
        "Education & Tutoring" -> "Education, Tutoring & Coaching"
        "Photography & Creative" -> "Photography & Image Editing"
        "Game Development" -> "Gaming & Esports"
        "Web Development" -> "Web Development"
        else -> ""
    }
}

private val studentStepLabels = listOf("Focus", "Skills", "Journey", "Profile")
private val clientStepLabels = listOf("Client type", "Hiring needs", "Identity")

private val academicStatuses = listOf(
    "High School Student",
    "Undergraduate Student",
    "Postgraduate Student",
    "Recently Graduated",
    "Graduate / Early Career",
    "Self-taught / Career Switcher"
)

private fun graduationYearLabel(status: String): String = when (status) {
    "High School Student",
    "Undergraduate Student",
    "Postgraduate Student" -> "Expected graduation year"
    else -> "Graduation year"
}

private fun graduationYearPlaceholder(status: String): String = when (status) {
    "High School Student" -> "2027"
    "Undergraduate Student" -> "2028"
    "Postgraduate Student" -> "2027"
    else -> "2025"
}

private val availabilityOptions = listOf(
    "Small tasks",
    "Part-time projects",
    "Full projects",
    "Evenings / Weekends",
    "Flexible / Open"
)

private val clientTypes = listOf(
    "Solo Founder / Individual",
    "Early-stage Startup",
    "Small Business",
    "Company",
    "Academic / Research",
    "Non-profit / Organization"
)

private val clientTypeIcons = mapOf(
    "Solo Founder / Individual" to "👤",
    "Early-stage Startup" to "🚀",
    "Small Business" to "🏪",
    "Company" to "🏢",
    "Academic / Research" to "🎓",
    "Non-profit / Organization" to "🤝"
)

private val clientTypeDescriptions = mapOf(
    "Solo Founder / Individual" to "Personal or founder-led work",
    "Early-stage Startup" to "Fast-moving new products",
    "Small Business" to "Growing local or online business",
    "Company" to "Established team or organization",
    "Academic / Research" to "Research or education projects",
    "Non-profit / Organization" to "Mission-driven projects"
)

private val clientCategories = listOf(
    "Web Development",
    "Mobile Development",
    "UI/UX Design",
    "Graphic Design",
    "AI / ML",
    "Data",
    "Writing",
    "Marketing",
    "Video",
    "Other"
)

private val hiringIntentOptions = listOf(
    "One-time project",
    "Ongoing support",
    "Build a product",
    "Quick task"
)

private val projectScopeOptions = listOf(
    "Under 1 week",
    "1–4 weeks",
    "1–3 months",
    "3+ months"
)

private val budgetPhilosophyOptions = listOf(
    "Fixed-price micro-projects",
    "Hourly ongoing work"
)


@Composable
private fun ResumeUploadCard(
    fileName: String,
    uploaded: Boolean,
    uploading: Boolean,
    onUpload: () -> Unit
) {
    val shape = RoundedCornerShape(18.dp)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.42f))
            .border(
                BorderStroke(
                    1.dp,
                    if (uploaded) {
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.40f)
                    } else {
                        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.10f)
                    }
                ),
                shape
            )
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (uploaded) "✓" else "📄",
                fontSize = 22.sp,
                color = if (uploaded) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.size(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (uploaded) "Resume attached" else "Add your resume (optional)",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    text = if (uploaded && fileName.isNotBlank()) fileName
                    else "PDF, DOC or DOCX • maximum 10 MB",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 2
                )
            }
            TextButton(
                onClick = onUpload,
                enabled = !uploading
            ) {
                Text(if (uploading) "Uploading…" else if (uploaded) "Replace" else "Upload")
            }
        }

        Text(
            text = "Your skills and portfolio are still the main profile signals. The resume is an optional supporting document.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodySmall
        )
    }
}