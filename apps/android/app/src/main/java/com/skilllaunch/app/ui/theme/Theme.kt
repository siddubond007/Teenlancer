package com.skilllaunch.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.graphics.Color
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val SkillLaunchDarkColorScheme = darkColorScheme(
    primary = SkillLaunchVioletLight,
    onPrimary = Color(0xFF211A45),
    primaryContainer = Color(0xFF352A65),
    onPrimaryContainer = Color(0xFFF1ECFF),
    secondary = SkillLaunchCyanLight,
    onSecondary = Color(0xFF08241E),
    secondaryContainer = Color(0xFF173D38),
    onSecondaryContainer = Color(0xFFC9F7EA),
    tertiary = SkillLaunchIndigoLight,
    onTertiary = Color(0xFF1A1740),
    background = SkillLaunchDarkBackground,
    onBackground = SkillLaunchDarkText,
    surface = SkillLaunchDarkSurface,
    onSurface = SkillLaunchDarkText,
    surfaceVariant = SkillLaunchDarkSurfaceVariant,
    onSurfaceVariant = SkillLaunchDarkTextSecondary,
    error = SkillLaunchError,
    onError = SkillLaunchDarkText
)

private val SkillLaunchLightColorScheme = lightColorScheme(
    primary = SkillLaunchIndigo,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE9E4FF),
    onPrimaryContainer = Color(0xFF35266F),
    secondary = SkillLaunchViolet,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFF0EBFF),
    onSecondaryContainer = Color(0xFF382D70),
    tertiary = SkillLaunchCyan,
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFDDF5ED),
    onTertiaryContainer = Color(0xFF0A4D3E),
    background = SkillLaunchLightBackground,
    onBackground = SkillLaunchLightText,
    surface = SkillLaunchLightSurface,
    onSurface = SkillLaunchLightText,
    surfaceVariant = SkillLaunchLightSurfaceVariant,
    onSurfaceVariant = SkillLaunchLightTextSecondary,
    error = SkillLaunchError,
    onError = Color.White
)

@Composable
fun SkillLaunchTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) {
        SkillLaunchDarkColorScheme
    } else {
        SkillLaunchLightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
