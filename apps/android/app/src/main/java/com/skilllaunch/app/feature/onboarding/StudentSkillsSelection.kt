package com.skilllaunch.app.feature.onboarding

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.skilllaunch.app.feature.auth.SkillLaunchBrand

@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun StudentSkillsSelection(
    primaryDomain: String,
    selectedSkills: List<String>,
    skillSearch: String,
    githubUrl: String,
    youtubeUrl: String,
    portfolioUrl: String,
    darkTheme: Boolean,
    saving: Boolean,
    skipConfirmation: Boolean,
    error: String,
    onBack: () -> Unit,
    onSkip: () -> Unit,
    onSkillSearchChange: (String) -> Unit,
    onToggleSkill: (String) -> Unit,
    onGithubChange: (String) -> Unit,
    onYoutubeChange: (String) -> Unit,
    onPortfolioChange: (String) -> Unit,
    onContinue: () -> Unit,
    onConfirmSkip: () -> Unit,
    onDismissSkip: () -> Unit
) {
    var linkValidationAttempted by rememberSaveable { mutableStateOf(false) }

    // Stage 2 deliberately reuses the exact Stage 1 layout rhythm:
    // fixed header, fixed progress bar, 28dp content margins, serif heading,
    // pill search, compact selection chips, and the same CTA geometry.
    val pageBackground = if (darkTheme) Color(0xFF1A1A1D) else Color(0xFFF8F7FA)
    val searchBackground = if (darkTheme) Color(0xFF262629) else Color(0xFFE8E7EA)
    val chipBackground = if (darkTheme) Color(0xFF303034) else Color(0xFFE0DFE2)
    val textPrimary = if (darkTheme) Color.White else Color(0xFF17171A)
    val textMuted = if (darkTheme) Color(0xFFAAA9AE) else Color(0xFF77767D)
    val lavender = Color(0xFFD4C6FF)

    val allSkills = STUDENT_ONBOARDING_SKILLS_BY_DOMAIN[primaryDomain].orEmpty()
    val normalizedSearch = skillSearch.trim()
    val filteredSkills = if (normalizedSearch.isBlank()) {
        allSkills
    } else {
        allSkills.filter { skill ->
            skill.title.contains(normalizedSearch, ignoreCase = true)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(pageBackground)
            .systemBarsPadding()
    ) {
        // Shared onboarding chrome stays fixed above the scrollable body.
        OnboardingHeader(
            darkTheme = darkTheme,
            onSkip = onSkip,
            onBack = onBack,
            enabled = !saving
        )

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 28.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            repeat(4) { index ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(5.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(
                            if (index == 1) {
                                lavender
                            } else if (index == 0) {
                                lavender.copy(alpha = 0.55f)
                            } else if (darkTheme) {
                                Color(0xFF3A393E)
                            } else {
                                Color(0xFFD8D7DA)
                            }
                        )
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    horizontal = 28.dp,
                    vertical = 12.dp
                ),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    Text(
                        text = "Show, don't tell.",
                        color = textPrimary,
                        style = TextStyle(
                            fontFamily = FontFamily.Serif,
                            fontSize = 40.sp,
                            lineHeight = 43.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = (-0.9).sp
                        )
                    )
                }

                item {
                    Text(
                        text = "Choose the skills you can confidently deliver. Pick up to 6.",
                        color = textMuted,
                        fontSize = 16.sp,
                        lineHeight = 21.sp
                    )
                }

                item {
                    StageTwoSearchField(
                        value = skillSearch,
                        placeholder = "Search " + primaryDomain + " skills...",
                        darkTheme = darkTheme,
                        background = searchBackground,
                        textPrimary = textPrimary,
                        textMuted = textMuted,
                        onValueChange = onSkillSearchChange,
                        onClear = { onSkillSearchChange("") }
                    )
                }

                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(
                                if (darkTheme) Color(0xFF262629)
                                else Color(0xFFEDEBF0)
                            )
                            .border(
                                width = 1.dp,
                                color = lavender.copy(alpha = 0.35f),
                                shape = RoundedCornerShape(16.dp)
                            )
                            .padding(horizontal = 14.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(3.dp)
                    ) {
                        Text(
                            text = "Your skills · ${selectedSkills.size} / 6",
                            color = textPrimary,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (selectedSkills.size == 6) {
                                "6 selected — remove one to choose another."
                            } else {
                                "Select up to 6 skills that best represent your work."
                            },
                            color = textMuted,
                            fontSize = 12.sp,
                            lineHeight = 16.sp
                        )
                    }
                }

                if (selectedSkills.isNotEmpty()) {
                    item {
                        Text(
                            text = "Selected skills",
                            color = textPrimary,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    item {
                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            selectedSkills.forEach { skill ->
                                StageTwoSkillChip(
                                    text = skill,
                                    selected = true,
                                    darkTheme = darkTheme,
                                    lavender = lavender,
                                    background = chipBackground,
                                    textPrimary = textPrimary,
                                    onClick = { onToggleSkill(skill) }
                                )
                            }
                        }
                    }
                }

                item {
                    Text(
                        text = "Choose more skills",
                        color = textPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                val availableSkills = filteredSkills.filterNot { selectedSkills.contains(it.title) }

                if (availableSkills.isNotEmpty()) {
                    item {
                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            availableSkills.forEach { skill ->
                                StageTwoSkillChip(
                                    text = skill.title,
                                    selected = false,
                                    darkTheme = darkTheme,
                                    lavender = lavender,
                                    background = chipBackground,
                                    textPrimary = textPrimary,
                                    onClick = {
                                        onToggleSkill(skill.title)
                                    }
                                )
                            }
                        }
                    }
                } else {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(
                                    if (darkTheme) Color(0xFF262629)
                                    else Color(0xFFEDEBF0)
                                )
                                .padding(horizontal = 16.dp, vertical = 18.dp)
                        ) {
                            Text(
                                text = if (normalizedSearch.isBlank()) {
                                    "You've selected all available skills for this domain."
                                } else {
                                    "No matching skills. Try another search."
                                },
                                color = textMuted,
                                fontSize = 13.sp,
                                lineHeight = 18.sp,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Show your work (optional)",
                        modifier = Modifier.padding(top = 2.dp),
                        color = textPrimary,
                        style = TextStyle(
                            fontFamily = FontFamily.Serif,
                            fontSize = 27.sp,
                            lineHeight = 31.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Text(
                        text = "Add links that help clients see proof of what you can do.",
                        modifier = Modifier.padding(top = 2.dp),
                        color = textMuted,
                        fontSize = 14.sp,
                        lineHeight = 19.sp
                    )
                }

                item {
                    StageTwoLinkField(
                        value = githubUrl,
                        placeholder = "https://github.com/yourname",
                        darkTheme = darkTheme,
                        background = searchBackground,
                        textPrimary = textPrimary,
                        textMuted = textMuted,
                        onValueChange = {
                            linkValidationAttempted = false
                            onGithubChange(it)
                        },
                        kind = StudentLinkKind.GITHUB,
                        validationEnabled = linkValidationAttempted
                    )
                }

                item {
                    StageTwoLinkField(
                        value = youtubeUrl,
                        placeholder = "https://youtube.com/@yourname",
                        darkTheme = darkTheme,
                        background = searchBackground,
                        textPrimary = textPrimary,
                        textMuted = textMuted,
                        onValueChange = {
                            linkValidationAttempted = false
                            onYoutubeChange(it)
                        },
                        kind = StudentLinkKind.YOUTUBE,
                        validationEnabled = linkValidationAttempted
                    )
                }

                item {
                    StageTwoLinkField(
                        value = portfolioUrl,
                        placeholder = "https://your-portfolio.com",
                        darkTheme = darkTheme,
                        background = searchBackground,
                        textPrimary = textPrimary,
                        textMuted = textMuted,
                        onValueChange = {
                            linkValidationAttempted = false
                            onPortfolioChange(it)
                        },
                        kind = StudentLinkKind.PORTFOLIO,
                        validationEnabled = linkValidationAttempted
                    )
                }

                if (error.isNotBlank()) {
                    item {
                        Text(
                            text = error,
                            color = Color(0xFFD95C5C),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(pageBackground)
                .navigationBarsPadding()
                .imePadding()
                .padding(horizontal = 24.dp)
                .padding(top = 6.dp, bottom = 12.dp)
        ) {
            Button(
                onClick = {
                    linkValidationAttempted = true
                    onContinue()
                },
                enabled = !saving,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
            shape = RoundedCornerShape(28.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = lavender,
                contentColor = Color(0xFF17171A),
                disabledContainerColor = lavender.copy(alpha = 0.55f),
                disabledContentColor = Color(0xFF17171A).copy(alpha = 0.65f)
            ),
            contentPadding = PaddingValues(horizontal = 24.dp, vertical = 0.dp)
        ) {
                Text(
                    text = "Continue  →",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        if (skipConfirmation) {
            AlertDialog(
                onDismissRequest = onDismissSkip,
                title = { Text("Skip profile setup?") },
                text = {
                    Text(
                        "Your progress will be saved. You can return to Profile later and finish the setup."
                    )
                },
                confirmButton = {
                    TextButton(
                        onClick = onConfirmSkip,
                        enabled = !saving
                    ) {
                        Text("Skip for now")
                    }
                },
                dismissButton = {
                    TextButton(onClick = onDismissSkip) {
                        Text("Keep setting up")
                    }
                }
            )
        }
    }
}

@Composable
private fun StageTwoSearchField(
    value: String,
    placeholder: String,
    darkTheme: Boolean,
    background: Color,
    textPrimary: Color,
    textMuted: Color,
    onValueChange: (String) -> Unit,
    onClear: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .clip(RoundedCornerShape(30.dp))
            .background(background)
            .padding(horizontal = 17.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        SearchGlyph(tint = textMuted, modifier = Modifier.size(21.dp))
        Spacer(modifier = Modifier.size(11.dp))
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.weight(1f),
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Search
            ),
            textStyle = TextStyle(color = textPrimary, fontSize = 16.sp),
            decorationBox = { innerTextField ->
                if (value.isBlank()) {
                    Text(
                        text = placeholder,
                        color = textMuted,
                        fontSize = 15.sp,
                        maxLines = 1
                    )
                }
                innerTextField()
            }
        )
        if (value.isNotBlank()) {
            IconButton(onClick = onClear, modifier = Modifier.size(32.dp)) {
                CloseGlyph(tint = textMuted, modifier = Modifier.size(17.dp))
            }
        }
    }
}

@Composable
private fun StageTwoSkillChip(
    text: String,
    selected: Boolean,
    darkTheme: Boolean,
    lavender: Color,
    background: Color,
    textPrimary: Color,
    onClick: () -> Unit
) {
    val chipShape = RoundedCornerShape(24.dp)
    Box(
        modifier = Modifier
            .clip(chipShape)
            .background(if (selected) lavender else background)
            .border(
                width = if (selected) 1.dp else 1.dp,
                color = if (selected) lavender else if (darkTheme) Color(0xFF454449) else Color(0xFFD2D0D6),
                shape = chipShape
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 10.dp)
    ) {
        Text(
            text = text,
            color = if (selected) Color(0xFF17171A) else textPrimary,
            fontSize = 14.sp,
            lineHeight = 17.sp,
            fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal
        )
    }
}

internal enum class StudentLinkKind {
    GITHUB,
    YOUTUBE,
    PORTFOLIO
}

internal fun validateStudentLink(value: String, kind: StudentLinkKind): String? {
    val trimmed = value.trim()
    if (trimmed.isBlank()) return null

    val uri = try {
        java.net.URI(trimmed)
    } catch (_: Exception) {
        return "Enter a valid URL."
    }

    val scheme = uri.scheme?.lowercase()
    val host = uri.host?.lowercase()?.removePrefix("www.")

    if (scheme !in setOf("http", "https") || host.isNullOrBlank()) {
        return "Use a complete URL starting with https://."
    }

    return when (kind) {
        StudentLinkKind.GITHUB ->
            if (host == "github.com") null else "Use a github.com profile or repository URL."
        StudentLinkKind.YOUTUBE ->
            if (host == "youtube.com" || host == "m.youtube.com" || host == "youtu.be") {
                null
            } else {
                "Use a youtube.com or youtu.be URL."
            }
        StudentLinkKind.PORTFOLIO -> null
    }
}

@Composable
private fun StageTwoLinkField(
    value: String,
    placeholder: String,
    darkTheme: Boolean,
    background: Color,
    textPrimary: Color,
    textMuted: Color,
    onValueChange: (String) -> Unit,
    kind: StudentLinkKind,
    validationEnabled: Boolean
) {
    val linkError = if (validationEnabled && value.trim().isNotBlank()) {
        validateStudentLink(value, kind)
    } else {
        null
    }

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(5.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .clip(RoundedCornerShape(30.dp))
                .background(background)
                .border(
                    width = if (linkError != null) 1.dp else 0.dp,
                    color = if (linkError != null) Color(0xFFD95C5C) else Color.Transparent,
                    shape = RoundedCornerShape(30.dp)
                )
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            LinkGlyph(
                kind = kind,
                tint = if (linkError != null) Color(0xFFD95C5C) else textMuted,
                modifier = Modifier.size(21.dp)
            )
            Spacer(modifier = Modifier.size(10.dp))
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.weight(1f),
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Uri,
                    imeAction = ImeAction.Next
                ),
                textStyle = TextStyle(
                    color = textPrimary,
                    fontSize = 15.sp
                ),
                decorationBox = { innerTextField ->
                    if (value.isBlank()) {
                        Text(
                            text = placeholder,
                            color = textMuted,
                            fontSize = 15.sp,
                            maxLines = 1
                        )
                    }
                    innerTextField()
                }
            )
            if (value.isNotBlank()) {
                IconButton(
                    onClick = { onValueChange("") },
                    modifier = Modifier.size(32.dp)
                ) {
                    CloseGlyph(
                        tint = if (linkError != null) Color(0xFFD95C5C) else textMuted,
                        modifier = Modifier.size(17.dp)
                    )
                }
            }
        }

        if (linkError != null) {
            Text(
                text = linkError,
                modifier = Modifier.padding(horizontal = 12.dp),
                color = Color(0xFFD95C5C),
                fontSize = 12.sp,
                lineHeight = 16.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun SearchGlyph(tint: Color, modifier: Modifier) {
    Canvas(modifier) {
        val stroke = 1.8.dp.toPx()
        drawCircle(
            color = tint,
            radius = size.minDimension * 0.31f,
            center = Offset(size.width * 0.42f, size.height * 0.42f),
            style = Stroke(width = stroke)
        )
        drawLine(
            color = tint,
            start = Offset(size.width * 0.66f, size.height * 0.66f),
            end = Offset(size.width * 0.90f, size.height * 0.90f),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )
    }
}

@Composable
private fun CloseGlyph(tint: Color, modifier: Modifier) {
    Canvas(modifier) {
        val stroke = 1.8.dp.toPx()
        drawLine(
            color = tint,
            start = Offset(size.width * 0.25f, size.height * 0.25f),
            end = Offset(size.width * 0.75f, size.height * 0.75f),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )
        drawLine(
            color = tint,
            start = Offset(size.width * 0.75f, size.height * 0.25f),
            end = Offset(size.width * 0.25f, size.height * 0.75f),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )
    }
}

@Composable
private fun BackArrowGlyph(tint: Color, modifier: Modifier) {
    Canvas(modifier) {
        val stroke = 1.9.dp.toPx()
        drawLine(
            color = tint,
            start = Offset(size.width * 0.78f, size.height * 0.50f),
            end = Offset(size.width * 0.24f, size.height * 0.50f),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )
        drawLine(
            color = tint,
            start = Offset(size.width * 0.24f, size.height * 0.50f),
            end = Offset(size.width * 0.48f, size.height * 0.23f),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )
        drawLine(
            color = tint,
            start = Offset(size.width * 0.24f, size.height * 0.50f),
            end = Offset(size.width * 0.48f, size.height * 0.77f),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )
    }
}

@Composable
private fun LinkGlyph(kind: StudentLinkKind, tint: Color, modifier: Modifier) {
    Canvas(modifier) {
        val stroke = 1.7.dp.toPx()
        when (kind) {
            StudentLinkKind.GITHUB -> {
                drawCircle(
                    color = tint,
                    radius = size.minDimension * 0.29f,
                    center = Offset(size.width * 0.50f, size.height * 0.48f),
                    style = Stroke(width = stroke)
                )
                drawLine(
                    color = tint,
                    start = Offset(size.width * 0.24f, size.height * 0.72f),
                    end = Offset(size.width * 0.36f, size.height * 0.57f),
                    strokeWidth = stroke,
                    cap = StrokeCap.Round
                )
                drawLine(
                    color = tint,
                    start = Offset(size.width * 0.76f, size.height * 0.72f),
                    end = Offset(size.width * 0.64f, size.height * 0.57f),
                    strokeWidth = stroke,
                    cap = StrokeCap.Round
                )
            }
            StudentLinkKind.YOUTUBE -> {
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(size.width * 0.10f, size.height * 0.22f),
                    size = androidx.compose.ui.geometry.Size(
                        size.width * 0.80f,
                        size.height * 0.56f
                    ),
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(
                        size.width * 0.12f,
                        size.height * 0.12f
                    ),
                    style = Stroke(width = stroke)
                )
                val p = Path().apply {
                    moveTo(size.width * 0.43f, size.height * 0.34f)
                    lineTo(size.width * 0.43f, size.height * 0.66f)
                    lineTo(size.width * 0.70f, size.height * 0.50f)
                    close()
                }
                drawPath(p, color = tint, style = Stroke(width = stroke))
            }
            StudentLinkKind.PORTFOLIO -> {
                drawCircle(
                    color = tint,
                    radius = size.minDimension * 0.39f,
                    center = Offset(size.width * 0.50f, size.height * 0.50f),
                    style = Stroke(width = stroke)
                )
                drawOval(
                    color = tint,
                    topLeft = Offset(size.width * 0.33f, size.height * 0.11f),
                    size = androidx.compose.ui.geometry.Size(
                        size.width * 0.34f,
                        size.height * 0.78f
                    ),
                    style = Stroke(width = stroke)
                )
                drawLine(
                    color = tint,
                    start = Offset(size.width * 0.13f, size.height * 0.50f),
                    end = Offset(size.width * 0.87f, size.height * 0.50f),
                    strokeWidth = stroke
                )
            }
        }
    }
}