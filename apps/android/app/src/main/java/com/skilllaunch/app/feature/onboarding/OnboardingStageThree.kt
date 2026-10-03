package com.skilllaunch.app.feature.onboarding

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.skilllaunch.app.feature.auth.SkillLaunchBrand
import java.text.DateFormatSymbols
import java.util.Calendar

private val stageThreeAcademicStatuses = listOf(
    "High School",
    "Undergraduate",
    "Postgraduate",
    "Bootcamp / Cert",
    "Self-Taught",
    "Professional"
)

private val stageThreeAvailabilityOptions = listOf(
    "Part-time (< 20 hrs)",
    "Half-time (20-30 hrs)",
    "30-40 hrs",
    "Full-time (40+ hrs)"
)

private data class StageThreeColors(
    val background: Color,
    val surface: Color,
    val accent: Color,
    val textPrimary: Color,
    val textMuted: Color,
    val border: Color,
    val accentText: Color,
    val error: Color
)

private fun stageThreeColors(darkTheme: Boolean) = if (darkTheme) {
    StageThreeColors(
        background = Color(0xFF1A1A1D),
        surface = Color(0xFF262629),
        accent = Color(0xFFD4C6FF),
        textPrimary = Color.White,
        textMuted = Color(0xFFAAA9AE),
        border = Color(0xFF454449),
        accentText = Color(0xFF17171A),
        error = Color(0xFFFF8A8A)
    )
} else {
    StageThreeColors(
        background = Color(0xFFF8F7FA),
        surface = Color.White,
        accent = Color(0xFFD4C6FF),
        textPrimary = Color(0xFF17171A),
        textMuted = Color(0xFF77767D),
        border = Color(0xFFD2D0D6),
        accentText = Color(0xFF17171A),
        error = Color(0xFFB91C1C)
    )
}

@Composable
internal fun OnboardingStageThree(
    academicStatus: String,
    graduationMonth: Int,
    graduationYear: String,
    availability: String,
    darkTheme: Boolean,
    error: String,
    saving: Boolean,
    skipConfirmation: Boolean,
    onBack: () -> Unit,
    onSkip: () -> Unit,
    onAcademicStatusChange: (String) -> Unit,
    onGraduationMonthChange: (Int) -> Unit,
    onGraduationYearChange: (String) -> Unit,
    onAvailabilityChange: (String) -> Unit,
    onContinue: () -> Unit,
    onConfirmSkip: () -> Unit,
    onDismissSkip: () -> Unit
) {
    val colors = stageThreeColors(darkTheme)
    var showGraduationPicker by remember { mutableStateOf(false) }
    var draftGraduationMonth by remember(graduationMonth) {
        mutableIntStateOf(graduationMonth.coerceIn(1, 12))
    }
    val today = Calendar.getInstance()
    val currentYear = today.get(Calendar.YEAR)
    val currentMonth = today.get(Calendar.MONTH) + 1
    val defaultGraduationYear = if (currentMonth == 12) currentYear + 1 else currentYear
    val defaultGraduationMonth = if (currentMonth == 12) 1 else currentMonth + 1

    var draftGraduationYear by remember(graduationYear) {
        mutableIntStateOf(graduationYear.toIntOrNull() ?: defaultGraduationYear)
    }

    val displayedGraduation = graduationYear.toIntOrNull()?.let { year ->
        val monthIndex = graduationMonth.coerceIn(1, 12) - 1
        val monthName = DateFormatSymbols().shortMonths[monthIndex]
            .takeIf { it.isNotBlank() }
            ?: "May"
        "$monthName $year"
    } ?: "Select month & year"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
            .systemBarsPadding()
    ) {
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
                            when (index) {
                                0, 1 -> colors.accent.copy(alpha = 0.55f)
                                2 -> colors.accent
                                else -> if (darkTheme) Color(0xFF3A393E) else Color(0xFFD8D7DA)
                            }
                        )
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        /*
         * Same scroll container and content geometry as Stage 2.
         * Only the journey form content changes.
         */
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
                        text = "What stage are you at?",
                        color = colors.textPrimary,
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
                        text = "Tell us where you are in your journey and how much time you can give to projects.",
                        color = colors.textMuted,
                        fontSize = 16.sp,
                        lineHeight = 21.sp
                    )
                }

                item {
                    StageThreeSectionLabel(
                        text = "CURRENT STATUS",
                        color = colors.textMuted
                    )
                }

                item {
                    Spacer(modifier = Modifier.height(1.dp))
                    AcademicStatusGrid(
                        selected = academicStatus,
                        accent = colors.accent,
                        accentText = colors.accentText,
                        surface = colors.surface,
                        textPrimary = colors.textPrimary,
                        border = colors.border,
                        enabled = !saving,
                        onSelect = onAcademicStatusChange
                    )
                }

                item {
                    androidx.compose.animation.AnimatedVisibility(
                        visible = academicStatus in setOf(
                            "High School",
                            "Undergraduate",
                            "Postgraduate",
                            "Bootcamp / Cert"
                        ),
                        enter = fadeIn(),
                        exit = fadeOut()
                    ) {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            StageThreeSectionLabel(
                                text = "EXPECTED GRADUATION",
                                color = colors.textMuted
                            )

                            GraduationInputShell(
                                displayText = displayedGraduation,
                                surface = colors.surface,
                                textPrimary = colors.textPrimary,
                                textSecondary = colors.textMuted,
                                border = colors.border,
                                enabled = !saving,
                                onClick = {
                                    draftGraduationMonth = graduationMonth.coerceIn(1, 12)
                                    draftGraduationYear = graduationYear.toIntOrNull()
                                        ?: defaultGraduationYear
                                    draftGraduationMonth = if (graduationYear.toIntOrNull() == currentYear) {
                                        graduationMonth.coerceAtLeast(defaultGraduationMonth)
                                    } else {
                                        graduationMonth.coerceIn(1, 12).takeIf { it >= 1 } ?: defaultGraduationMonth
                                    }
                                    showGraduationPicker = true
                                }
                            )
                        }
                    }
                }

                item {
                    StageThreeSectionLabel(
                        text = "WORK AVAILABILITY",
                        color = colors.textMuted
                    )
                }

                item {
                    WorkAvailabilityCards(
                        selected = availability,
                        accent = colors.accent,
                        surface = colors.surface,
                        textPrimary = colors.textPrimary,
                        border = colors.border,
                        enabled = !saving,
                        onSelect = onAvailabilityChange
                    )
                }

                if (error.isNotBlank()) {
                    item {
                        Text(
                            text = error,
                            color = colors.error,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }

        /*
         * Same safe bottom action treatment as Stage 2.
         * The form scrolls independently so this CTA never covers the content.
         */
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.background)
                .navigationBarsPadding()
                .imePadding()
                .padding(horizontal = 24.dp)
                .padding(top = 6.dp, bottom = 12.dp)
        ) {
            Button(
                onClick = onContinue,
                enabled = !saving,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
            shape = RoundedCornerShape(28.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = colors.accent,
                contentColor = colors.accentText,
                disabledContainerColor = colors.accent.copy(alpha = 0.55f),
                disabledContentColor = colors.accentText.copy(alpha = 0.65f)
            ),
            contentPadding = PaddingValues(
                horizontal = 24.dp,
                vertical = 0.dp
            )
        ) {
                Text(
                    text = "Continue  →",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        if (showGraduationPicker) {
            MonthYearPickerDialog(
                selectedMonth = draftGraduationMonth,
                selectedYear = draftGraduationYear,
                darkTheme = darkTheme,
                onMonthChange = { draftGraduationMonth = it },
                onYearChange = { draftGraduationYear = it },
                onCancel = {
                    showGraduationPicker = false
                },
                onConfirm = {
                    val validFutureDate = draftGraduationYear > currentYear ||
                        (draftGraduationYear == currentYear && draftGraduationMonth > currentMonth)
                    if (validFutureDate) {
                        onGraduationMonthChange(draftGraduationMonth)
                        onGraduationYearChange(draftGraduationYear.toString())
                        showGraduationPicker = false
                    }
                }
            )
        }

        if (skipConfirmation) {
            AlertDialog(
                onDismissRequest = onDismissSkip,
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
private fun MonthYearPickerDialog(
    selectedMonth: Int,
    selectedYear: Int,
    darkTheme: Boolean,
    onMonthChange: (Int) -> Unit,
    onYearChange: (Int) -> Unit,
    onCancel: () -> Unit,
    onConfirm: () -> Unit
) {
    val colors = stageThreeColors(darkTheme)
    val currentYear = Calendar.getInstance().get(Calendar.YEAR)
    val currentMonth = Calendar.getInstance().get(Calendar.MONTH) + 1
    val minYear = if (currentMonth == 12) currentYear + 1 else currentYear
    val maxYear = currentYear + 10
    val months = DateFormatSymbols().shortMonths.take(12)

    AlertDialog(
        onDismissRequest = onCancel,
        title = {
            Text(
                text = "Expected graduation",
                fontWeight = FontWeight.ExtraBold
            )
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Year",
                        modifier = Modifier.weight(1f),
                        color = colors.textMuted,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )

                    TextButton(
                        onClick = {
                            if (selectedYear > minYear) {
                                onYearChange(selectedYear - 1)
                            }
                        }
                    ) {
                        Text("−")
                    }

                    Text(
                        text = selectedYear.toString(),
                        color = colors.textPrimary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.ExtraBold
                    )

                    TextButton(
                        onClick = {
                            if (selectedYear < maxYear) {
                                onYearChange(selectedYear + 1)
                            }
                        }
                    ) {
                        Text("+")
                    }
                }

                Text(
                    text = "Month",
                    color = colors.textMuted,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )

                months.chunked(3).forEach { row ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        row.forEachIndexed { index, month ->
                            val monthNumber = months.indexOf(month) + 1
                            val isPastMonth = selectedYear == currentYear && monthNumber <= currentMonth
                            val isSelected = monthNumber == selectedMonth && !isPastMonth
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(
                                        if (isSelected) {
                                            colors.accent
                                        } else {
                                            colors.surface
                                        }
                                    )
                                    .border(
                                        width = 1.dp,
                                        color = if (isSelected) {
                                            colors.accent
                                        } else {
                                            colors.border
                                        },
                                        shape = RoundedCornerShape(14.dp)
                                    )
                                    .clickable(
                                        enabled = !isPastMonth
                                    ) {
                                        onMonthChange(monthNumber)
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = month,
                                    color = when {
                                        isSelected -> colors.accentText
                                        isPastMonth -> colors.textMuted.copy(alpha = 0.40f)
                                        else -> colors.textPrimary
                                    },
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) {
                                        FontWeight.Bold
                                    } else {
                                        FontWeight.Medium
                                    },
                                    textAlign = TextAlign.Center
                                )
                            }

                            if (index == row.lastIndex && row.size < 3) {
                                Spacer(modifier = Modifier.weight((3 - row.size).toFloat()))
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onCancel) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun StageThreeSectionLabel(
    text: String,
    color: Color
) {
    Text(
        text = text,
        color = color,
        fontSize = 10.sp,
        lineHeight = 12.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.8.sp
    )
}

@Composable
private fun AcademicStatusGrid(
    selected: String,
    accent: Color,
    accentText: Color,
    surface: Color,
    textPrimary: Color,
    border: Color,
    enabled: Boolean,
    onSelect: (String) -> Unit
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        stageThreeAcademicStatuses.chunked(2).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { option ->
                    AcademicStatusChip(
                        text = option,
                        selected = selected == option,
                        accent = accent,
                        accentText = accentText,
                        surface = surface,
                        textPrimary = textPrimary,
                        border = border,
                        enabled = enabled,
                        onClick = { onSelect(option) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun AcademicStatusChip(
    text: String,
    selected: Boolean,
    accent: Color,
    accentText: Color,
    surface: Color,
    textPrimary: Color,
    border: Color,
    enabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier
) {
    val shape = RoundedCornerShape(24.dp)

    Box(
        modifier = modifier
            .height(48.dp)
            .clip(shape)
            .background(if (selected) accent else surface)
            .border(
                width = 1.dp,
                color = if (selected) accent else border,
                shape = shape
            )
            .clickable(
                enabled = enabled,
                onClick = onClick
            )
            .padding(horizontal = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (selected) accentText else textPrimary,
            fontSize = 13.sp,
            lineHeight = 16.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
            textAlign = TextAlign.Center,
            maxLines = 2
        )
    }
}

@Composable
private fun GraduationInputShell(
    displayText: String,
    surface: Color,
    textPrimary: Color,
    textSecondary: Color,
    border: Color,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .clip(RoundedCornerShape(30.dp))
            .background(surface)
            .border(
                width = 1.dp,
                color = border,
                shape = RoundedCornerShape(30.dp)
            )
            .clickable(
                enabled = enabled,
                onClick = onClick
            )
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        CalendarGlyph(
            tint = textSecondary,
            modifier = Modifier.size(21.dp)
        )

        Spacer(modifier = Modifier.size(12.dp))

        Text(
            text = displayText,
            color = textPrimary,
            fontSize = 15.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun WorkAvailabilityCards(
    selected: String,
    accent: Color,
    surface: Color,
    textPrimary: Color,
    border: Color,
    enabled: Boolean,
    onSelect: (String) -> Unit
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        stageThreeAvailabilityOptions.forEach { option ->
            AvailabilityCard(
                text = option,
                selected = selected == option,
                accent = accent,
                surface = surface,
                textPrimary = textPrimary,
                border = border,
                enabled = enabled,
                onClick = { onSelect(option) }
            )
        }
    }
}

@Composable
private fun AvailabilityCard(
    text: String,
    selected: Boolean,
    accent: Color,
    surface: Color,
    textPrimary: Color,
    border: Color,
    enabled: Boolean,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(18.dp)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(58.dp)
            .clip(shape)
            .background(
                if (selected) {
                    accent.copy(alpha = 0.10f)
                } else {
                    surface
                }
            )
            .border(
                width = 1.dp,
                color = if (selected) accent else border,
                shape = shape
            )
            .clickable(
                enabled = enabled,
                onClick = onClick
            )
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = text,
            modifier = Modifier.weight(1f),
            color = textPrimary,
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold
        )

        if (selected) {
            RadioGlyph(
                tint = accent,
                modifier = Modifier.size(22.dp)
            )
        }
    }
}

@Composable
private fun CalendarGlyph(
    tint: Color,
    modifier: Modifier
) {
    Canvas(modifier) {
        val stroke = 1.8.dp.toPx()

        drawRoundRect(
            color = tint,
            topLeft = Offset(size.width * 0.16f, size.height * 0.24f),
            size = androidx.compose.ui.geometry.Size(
                size.width * 0.68f,
                size.height * 0.60f
            ),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(
                size.width * 0.08f,
                size.width * 0.08f
            ),
            style = Stroke(width = stroke)
        )

        drawLine(
            color = tint,
            start = Offset(size.width * 0.28f, size.height * 0.13f),
            end = Offset(size.width * 0.28f, size.height * 0.34f),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )

        drawLine(
            color = tint,
            start = Offset(size.width * 0.72f, size.height * 0.13f),
            end = Offset(size.width * 0.72f, size.height * 0.34f),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )

        drawLine(
            color = tint,
            start = Offset(size.width * 0.18f, size.height * 0.38f),
            end = Offset(size.width * 0.82f, size.height * 0.38f),
            strokeWidth = stroke
        )
    }
}

@Composable
private fun RadioGlyph(
    tint: Color,
    modifier: Modifier
) {
    Canvas(modifier) {
        drawCircle(
            color = tint,
            radius = size.minDimension * 0.34f,
            center = Offset(size.width * 0.50f, size.height * 0.50f),
            style = Stroke(width = 1.8.dp.toPx())
        )

        drawCircle(
            color = tint,
            radius = size.minDimension * 0.16f,
            center = Offset(size.width * 0.50f, size.height * 0.50f)
        )
    }
}
