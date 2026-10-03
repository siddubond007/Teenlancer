package com.skilllaunch.app.feature.auth

import androidx.compose.foundation.background
import androidx.compose.ui.draw.clip
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val SignupTwoDarkBackground = Color(0xFF1A1A1D)
private val SignupTwoDarkSurface = Color(0xFF262629)
private val SignupTwoLavender = Color(0xFFD4C6FF)
private val SignupTwoSecondary = Color(0xFFA0A0A5)
private val SignupTwoBorder = Color(0xFF3F3F46)

@Composable
fun SignupStageTwo(
    state: AuthUiState,
    darkTheme: Boolean,
    onToggleTheme: () -> Unit,
    username: String,
    usernameSuggestions: List<String>,
    onUsernameChange: (String) -> Unit,
    onRefreshSuggestions: () -> Unit,
    onCreateAccount: () -> Unit,
    onBackToStageOne: () -> Unit
) {
    var localError by rememberSaveable { mutableStateOf("") }

    val visibleError = localError.ifBlank { state.errorMessage.orEmpty() }
    val usernameError = visibleError.takeIf {
        it.contains("username", ignoreCase = true) ||
            it.contains("handle", ignoreCase = true)
    }
    val generalError = visibleError
        .takeIf { it.isNotBlank() }
        ?.takeUnless { usernameError != null }

    val background = if (darkTheme) {
        SignupTwoDarkBackground
    } else {
        MaterialTheme.colorScheme.background
    }
    val primaryText = if (darkTheme) {
        Color.White
    } else {
        MaterialTheme.colorScheme.onBackground
    }
    val secondaryText = if (darkTheme) {
        SignupTwoSecondary
    } else {
        MaterialTheme.colorScheme.onSurfaceVariant
    }
    val surface = if (darkTheme) {
        SignupTwoDarkSurface
    } else {
        MaterialTheme.colorScheme.surface
    }
    val subtleBorder = if (darkTheme) {
        SignupTwoBorder
    } else {
        MaterialTheme.colorScheme.outline.copy(alpha = 0.38f)
    }
    val accent = if (darkTheme) {
        SignupTwoLavender
    } else {
        MaterialTheme.colorScheme.primary
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(background)
            .safeDrawingPadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
                .widthIn(max = 620.dp)
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "SkillLaunch",
                    fontSize = 20.sp,
                    color = primaryText,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.SansSerif
                )

                ThemeToggle(
                    darkTheme = darkTheme,
                    onToggleTheme = onToggleTheme
                )
            }

            SignupHeroArtwork(
                darkTheme = darkTheme,
                modifier = Modifier.padding(top = 24.dp)
            )

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                        .padding(vertical = 40.dp)
                ) {
                    Text(
                        text = "Choose your username",
                        style = TextStyle(
                            fontFamily = FontFamily.Serif,
                            fontWeight = FontWeight.Normal,
                            fontSize = 32.sp,
                            color = primaryText,
                            lineHeight = 40.sp
                        )
                    )

                    Text(
                        text = "Create the profile name people will know you by.",
                        modifier = Modifier.padding(top = 8.dp),
                        style = TextStyle(
                            fontFamily = FontFamily.SansSerif,
                            fontSize = 15.sp,
                            color = secondaryText,
                            lineHeight = 22.sp
                        )
                    )

                    Spacer(modifier = Modifier.height(40.dp))

                    Text(
                        text = "USERNAME",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = secondaryText,
                        letterSpacing = 1.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    BasicTextField(
                        value = username,
                        onValueChange = {
                            onUsernameChange(
                                it.lowercase().filter { char ->
                                    char.isLetterOrDigit() || char == '_'
                                }
                            )
                            localError = ""
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .background(surface, RoundedCornerShape(12.dp))
                            .border(1.dp, subtleBorder, RoundedCornerShape(12.dp)),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Ascii
                        ),
                        cursorBrush = SolidColor(accent),
                        textStyle = TextStyle(
                            color = primaryText,
                            fontSize = 16.sp,
                            fontFamily = FontFamily.SansSerif,
                            fontWeight = FontWeight.Medium
                        ),
                        decorationBox = { innerTextField ->
                            Row(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(horizontal = 16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "@",
                                    color = primaryText,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Medium
                                )

                                Spacer(modifier = Modifier.width(4.dp))

                                Box(
                                    modifier = Modifier.weight(1f),
                                    contentAlignment = Alignment.CenterStart
                                ) {
                                    if (username.isEmpty()) {
                                        Text(
                                            text = "your_username",
                                            color = secondaryText.copy(alpha = 0.58f),
                                            fontSize = 16.sp
                                        )
                                    }
                                    innerTextField()
                                }

                                if (username.length >= 3 && username.matches(Regex("[a-z0-9_]+"))) {
                                    Text(
                                        text = "✓",
                                        color = accent,
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    )

                    Text(
                        text = "3+ characters • lowercase, numbers, underscore",
                        modifier = Modifier.padding(top = 8.dp),
                        fontSize = 12.sp,
                        color = secondaryText
                    )

                    usernameError?.let {
                        Text(
                            text = "⚠ $it",
                            modifier = Modifier.padding(top = 6.dp),
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Spacer(modifier = Modifier.height(32.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "SUGGESTED FOR YOU",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = secondaryText,
                            letterSpacing = 1.sp
                        )

                        Spacer(modifier = Modifier.weight(1f))

                        TextButton(
                            onClick = {
                                localError = ""
                                onRefreshSuggestions()
                            },
                            contentPadding = PaddingValues(horizontal = 4.dp, vertical = 0.dp)
                        ) {
                            Text(
                                text = "Refresh",
                                fontSize = 11.sp,
                                color = accent,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (usernameSuggestions.isEmpty()) {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            color = surface,
                            border = androidx.compose.foundation.BorderStroke(1.dp, subtleBorder)
                        ) {
                            Text(
                                text = "Add your name in Step 1 to generate personalized suggestions.",
                                modifier = Modifier.padding(16.dp),
                                fontSize = 13.sp,
                                color = secondaryText
                            )
                        }
                    } else {
                        LazyRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            contentPadding = PaddingValues(end = 8.dp)
                        ) {
                            items(
                                items = usernameSuggestions.distinct(),
                                key = { it }
                            ) { suggestion ->
                                val selected = username == suggestion

                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(24.dp))
                                        .background(
                                            if (selected) {
                                                SignupTwoLavender.copy(alpha = if (darkTheme) 0.10f else 0.20f)
                                            } else {
                                                surface
                                            }
                                        )
                                        .border(
                                            1.dp,
                                            if (selected) SignupTwoLavender else subtleBorder,
                                            RoundedCornerShape(24.dp)
                                        )
                                        .clickable {
                                            onUsernameChange(suggestion)
                                            localError = ""
                                        }
                                        .padding(horizontal = 16.dp, vertical = 10.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = "@$suggestion",
                                            color = primaryText,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Medium
                                        )

                                        if (selected) {
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(
                                                text = "✓",
                                                color = accent,
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    generalError?.let {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 14.dp),
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.90f)
                        ) {
                            Text(
                                text = it,
                                modifier = Modifier.padding(horizontal = 13.dp, vertical = 10.dp),
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            Button(
                onClick = {
                    localError = when {
                        username.trim().length < 3 ->
                            "Please choose a username of at least 3 characters."
                        !username.matches(Regex("[a-z0-9_]+")) ->
                            "Username can contain only lowercase letters, numbers and underscore."
                        else -> ""
                    }

                    if (localError.isBlank()) {
                        onCreateAccount()
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                enabled = !state.isLoading,
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = SignupTwoLavender,
                    contentColor = SignupTwoDarkBackground,
                    disabledContainerColor = SignupTwoLavender.copy(alpha = 0.45f),
                    disabledContentColor = SignupTwoDarkBackground.copy(alpha = 0.55f)
                )
            ) {
                Text(
                    text = "Create Account",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "By continuing, you agree to our Terms and Privacy Policy.",
                modifier = Modifier.fillMaxWidth(),
                fontSize = 12.sp,
                color = secondaryText,
                fontFamily = FontFamily.SansSerif,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
