package com.skilllaunch.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val SkillLaunchDarkColorScheme = darkColorScheme(
    primary = SkillLaunchIndigoLight,
    onPrimary = SkillLaunchDarkText,
    primaryContainer = SkillLaunchViolet,
    onPrimaryContainer = SkillLaunchDarkText,
    secondary = SkillLaunchCyanLight,
    onSecondary = SkillLaunchDarkBackground,
    secondaryContainer = SkillLaunchDarkSurfaceVariant,
    onSecondaryContainer = SkillLaunchDarkText,
    tertiary = SkillLaunchVioletLight,
    onTertiary = SkillLaunchDarkText,
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
    onPrimary = SkillLaunchLightSurface,
    primaryContainer = SkillLaunchIndigoLight,
    onPrimaryContainer = SkillLaunchLightSurface,
    secondary = SkillLaunchViolet,
    onSecondary = SkillLaunchLightSurface,
    secondaryContainer = SkillLaunchLightSurfaceVariant,
    onSecondaryContainer = SkillLaunchLightText,
    tertiary = SkillLaunchCyan,
    onTertiary = SkillLaunchLightSurface,
    background = SkillLaunchLightBackground,
    onBackground = SkillLaunchLightText,
    surface = SkillLaunchLightSurface,
    onSurface = SkillLaunchLightText,
    surfaceVariant = SkillLaunchLightSurfaceVariant,
    onSurfaceVariant = SkillLaunchLightTextSecondary,
    error = SkillLaunchError,
    onError = SkillLaunchLightSurface
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
