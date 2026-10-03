package com.skilllaunch.app.feature.auth

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Surface
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.size

private val SignupDarkBackground = Color(0xFF1A1A1D)
private val SignupDarkSurface = Color(0xFF262629)
private val SignupLavender = Color(0xFFD4C6FF)
private val SignupTextSecondary = Color(0xFFA0A0A5)
private val SignupBorder = Color(0xFF3F3F46)

@Composable
fun SignupStageOne(
    state: AuthUiState,
    darkTheme: Boolean,
    onToggleTheme: () -> Unit,
    role: String,
    firstName: String,
    lastName: String,
    email: String,
    dob: String,
    password: String,
    onRoleChange: (String) -> Unit,
    onFirstNameChange: (String) -> Unit,
    onLastNameChange: (String) -> Unit,
    onEmailChange: (String) -> Unit,
    onDobChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onClearError: () -> Unit,
    onContinue: (String) -> Unit,
    onBackToLogin: () -> Unit
) {
    var showPassword by rememberSaveable { mutableStateOf(false) }
    var showDobPicker by remember { mutableStateOf(false) }
    var confirmPassword by rememberSaveable { mutableStateOf("") }
    var localError by rememberSaveable { mutableStateOf("") }

    val visibleError = localError.ifBlank { state.errorMessage.orEmpty() }
    val emailError = visibleError.takeIf {
        it.contains("email", ignoreCase = true) ||
            it.contains("account is already", ignoreCase = true)
    }
    val dobError = visibleError.takeIf {
        it.contains("date of birth", ignoreCase = true) ||
            it.contains("dob", ignoreCase = true) ||
            it.contains("age", ignoreCase = true) ||
            it.contains("18", ignoreCase = true) ||
            it.contains("legal capacity", ignoreCase = true)
    }
    val passwordError = visibleError.takeIf {
        it.contains("password", ignoreCase = true)
    }
    val generalError = visibleError
        .takeIf { it.isNotBlank() }
        ?.takeUnless {
            emailError != null || dobError != null || passwordError != null
        }

    if (showDobPicker) {
        val today = java.time.LocalDate.now()
        val pickerState = rememberDatePickerState(
            initialSelectedDateMillis = dobToPickerMillis(dob),
            yearRange = 1900..today.year
        )

        DatePickerDialog(
            onDismissRequest = { showDobPicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        val millis = pickerState.selectedDateMillis
                        val selectedDate = millis?.let {
                            java.time.Instant.ofEpochMilli(it)
                                .atZone(java.time.ZoneOffset.UTC)
                                .toLocalDate()
                        }

                        if (selectedDate != null && !selectedDate.isAfter(today)) {
                            onDobChange(selectedDate.format(dobStorageFormatter))
                            localError = ""
                            onClearError()
                            showDobPicker = false
                        } else {
                            localError = "Please select a valid date of birth."
                        }
                    }
                ) {
                    Text("Done")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDobPicker = false }) {
                    Text("Cancel")
                }
            }
        ) {
            DatePicker(state = pickerState)
        }
    }

    val background = if (darkTheme) SignupDarkBackground else MaterialTheme.colorScheme.background
    val primaryText = if (darkTheme) Color.White else MaterialTheme.colorScheme.onBackground
    val secondaryText = if (darkTheme) SignupTextSecondary else MaterialTheme.colorScheme.onSurfaceVariant
    val fieldSurface = if (darkTheme) SignupDarkSurface else MaterialTheme.colorScheme.surface
    val subtleBorder = if (darkTheme) SignupBorder else MaterialTheme.colorScheme.outline.copy(alpha = 0.38f)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(background)
            .safeDrawingPadding()
            .imePadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
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

            Spacer(modifier = Modifier.height(24.dp))

            SignupHeroArtwork(
                darkTheme = darkTheme
            )

            Spacer(modifier = Modifier.height(30.dp))

            Text(
                text = "Create your account",
                style = TextStyle(
                    fontFamily = FontFamily.Serif,
                    fontWeight = FontWeight.Normal,
                    fontSize = 32.sp,
                    color = primaryText,
                    lineHeight = 40.sp
                )
            )

            Text(
                text = "Join a growing community of skilled students, creators, and clients.",
                modifier = Modifier.padding(top = 8.dp),
                style = TextStyle(
                    fontFamily = FontFamily.SansSerif,
                    fontSize = 15.sp,
                    color = secondaryText,
                    lineHeight = 22.sp
                )
            )

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = "SELECT YOUR JOURNEY",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = secondaryText,
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            SignupRoleCard(
                title = "Student Freelancer",
                subtitle = "Monetize your skills with real-world projects.",
                selected = role == "STUDENT_FREELANCER",
                darkTheme = darkTheme,
                onClick = {
                    onRoleChange("STUDENT_FREELANCER")
                    localError = ""
                    onClearError()
                }
            )

            Spacer(modifier = Modifier.height(12.dp))

            SignupRoleCard(
                title = "Industry Client",
                subtitle = "Hire top-tier student talent for your projects.",
                selected = role == "CLIENT",
                darkTheme = darkTheme,
                onClick = {
                    onRoleChange("CLIENT")
                    localError = ""
                    onClearError()
                }
            )

            Spacer(modifier = Modifier.height(24.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                SignupTextField(
                    label = "FIRST NAME",
                    value = firstName,
                    onValueChange = {
                        onFirstNameChange(
                            it.filter { char -> char.isLetter() || char.isWhitespace() }
                        )
                        localError = ""
                        onClearError()
                    },
                    placeholder = "Alex",
                    darkTheme = darkTheme,
                    surfaceColor = fieldSurface,
                    borderColor = subtleBorder,
                    modifier = Modifier.weight(1f)
                )

                SignupTextField(
                    label = "LAST NAME",
                    value = lastName,
                    onValueChange = {
                        onLastNameChange(
                            it.filter { char -> char.isLetter() || char.isWhitespace() }
                        )
                        localError = ""
                        onClearError()
                    },
                    placeholder = "Rivera",
                    darkTheme = darkTheme,
                    surfaceColor = fieldSurface,
                    borderColor = subtleBorder,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            SignupTextField(
                label = "EMAIL",
                value = email,
                onValueChange = {
                    onEmailChange(it)
                    localError = ""
                    onClearError()
                },
                placeholder = if (role == "CLIENT") "alex@company.com" else "alex@college.edu",
                helperText = "Use your college or personal email.",
                keyboardType = KeyboardType.Email,
                darkTheme = darkTheme,
                surfaceColor = fieldSurface,
                borderColor = subtleBorder
            )

            emailError?.let { SignupInlineError(it) }

            Spacer(modifier = Modifier.height(16.dp))

            SignupDobField(
                dob = dob,
                calculatedAge = calculateAgeFromDob(dob),
                darkTheme = darkTheme,
                surfaceColor = fieldSurface,
                borderColor = subtleBorder,
                onClick = {
                    localError = ""
                    onClearError()
                    showDobPicker = true
                }
            )

            Text(
                text = when {
                    calculateAgeFromDob(dob) != null && role == "CLIENT" ->
                        "Age \${calculateAgeFromDob(dob)} • Clients must be 18 or older."
                    calculateAgeFromDob(dob) != null ->
                        "Age \${calculateAgeFromDob(dob)} • Used for account safety."
                    role == "CLIENT" ->
                        "Select your date of birth. Clients must be 18 or older."
                    else ->
                        "Your age will be calculated automatically from your date of birth."
                },
                modifier = Modifier.padding(top = 6.dp),
                fontSize = 12.sp,
                color = secondaryText
            )

            dobError?.let { SignupInlineError(it) }

            Spacer(modifier = Modifier.height(16.dp))

            SignupTextField(
                label = "PASSWORD",
                value = password,
                onValueChange = {
                    onPasswordChange(it)
                    localError = ""
                    onClearError()
                },
                placeholder = "Create a strong password",
                isPassword = true,
                passwordVisible = showPassword,
                onTogglePassword = { showPassword = !showPassword },
                keyboardType = KeyboardType.Password,
                darkTheme = darkTheme,
                surfaceColor = fieldSurface,
                borderColor = subtleBorder
            )

            SignupPasswordStrengthRow(
                password = password,
                darkTheme = darkTheme
            )

            passwordError?.let { SignupInlineError(it) }

            Spacer(modifier = Modifier.height(16.dp))

            SignupTextField(
                label = "CONFIRM PASSWORD",
                value = confirmPassword,
                onValueChange = {
                    confirmPassword = it
                    localError = ""
                    onClearError()
                },
                placeholder = "Re-enter your password",
                isPassword = true,
                passwordVisible = showPassword,
                keyboardType = KeyboardType.Password,
                darkTheme = darkTheme,
                surfaceColor = fieldSurface,
                borderColor = subtleBorder
            )

            if (confirmPassword.isNotEmpty()) {
                Text(
                    text = if (password == confirmPassword) "✓ Passwords match" else "○ Passwords do not match yet",
                    modifier = Modifier.padding(top = 6.dp),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (password == confirmPassword) {
                        if (darkTheme) SignupLavender else MaterialTheme.colorScheme.primary
                    } else {
                        secondaryText
                    }
                )
            }

            generalError?.let {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp),
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

            Spacer(modifier = Modifier.height(40.dp))

            Button(
                onClick = {
                    when {
                        firstName.trim().length < 3 ->
                            localError = "First Name must contain at least 3 letters."
                        lastName.trim().length < 3 ->
                            localError = "Last Name must contain at least 3 letters."
                        email.trim().isBlank() ->
                            localError = "Please enter your email address."
                        dob.isBlank() ->
                            localError = "Please select your date of birth."
                        calculateAgeFromDob(dob) == null ->
                            localError = "Please select a valid date of birth."
                        role == "CLIENT" && (calculateAgeFromDob(dob) ?: 0) < 18 ->
                            localError = "Clients must be 18 or older. You can continue as a Student Freelancer."
                        password.length < 8 ->
                            localError = "Password must contain at least 8 characters."
                        !hasStrongPassword(password) ->
                            localError = "Use 8+ characters with uppercase, lowercase, a number, and a special character."
                        password != confirmPassword ->
                            localError = "Passwords do not match."
                        else -> {
                            localError = ""
                            onContinue(role)
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                enabled = !state.isLoading,
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = SignupLavender,
                    contentColor = SignupDarkBackground,
                    disabledContainerColor = SignupLavender.copy(alpha = 0.45f),
                    disabledContentColor = SignupDarkBackground.copy(alpha = 0.55f)
                )
            ) {
                Text(
                    text = if (role == "CLIENT") "Continue as Client" else "Continue as Student",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Already have an account?",
                    fontSize = 12.sp,
                    color = secondaryText
                )
                Spacer(modifier = Modifier.width(5.dp))
                Text(
                    text = "Sign in",
                    fontSize = 12.sp,
                    color = if (darkTheme) SignupLavender else MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable(onClick = onBackToLogin)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
private fun SignupRoleCard(
    title: String,
    subtitle: String,
    selected: Boolean,
    darkTheme: Boolean,
    onClick: () -> Unit
) {
    val border by animateColorAsState(
        targetValue = if (selected) {
            SignupLavender
        } else if (darkTheme) {
            SignupBorder
        } else {
            MaterialTheme.colorScheme.outline.copy(alpha = 0.38f)
        },
        label = "signupRoleBorder"
    )
    val surface = if (darkTheme) SignupDarkSurface else MaterialTheme.colorScheme.surface
    val selectedBackground = SignupLavender.copy(alpha = if (darkTheme) 0.10f else 0.18f)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(if (selected) selectedBackground else surface)
            .border(1.dp, border, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            SignupRoleArtwork(
                role = if (title == "Student Freelancer") {
                    SignupRoleChoice.Student
                } else {
                    SignupRoleChoice.Client
                },
                darkTheme = darkTheme
            )

            Spacer(modifier = Modifier.width(14.dp))

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = title,
                    color = if (darkTheme) Color.White else MaterialTheme.colorScheme.onSurface,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = subtitle,
                    color = if (darkTheme) SignupTextSecondary else MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 13.sp
                )
            }

            if (selected) {
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(androidx.compose.foundation.shape.CircleShape)
                        .background(
                            if (darkTheme) {
                                SignupLavender.copy(alpha = 0.95f)
                            } else {
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "✓",
                        color = if (darkTheme) SignupDarkBackground else MaterialTheme.colorScheme.primary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun SignupTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    darkTheme: Boolean,
    surfaceColor: Color,
    borderColor: Color,
    modifier: Modifier = Modifier,
    helperText: String? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    isPassword: Boolean = false,
    passwordVisible: Boolean = false,
    onTogglePassword: (() -> Unit)? = null
) {
    val textColor = if (darkTheme) Color.White else MaterialTheme.colorScheme.onSurface
    val secondary = if (darkTheme) SignupTextSecondary else MaterialTheme.colorScheme.onSurfaceVariant

    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = secondary,
            letterSpacing = 1.sp,
            fontFamily = FontFamily.SansSerif
        )

        Spacer(modifier = Modifier.height(8.dp))

        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .clip(RoundedCornerShape(12.dp)),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            cursorBrush = SolidColor(if (darkTheme) SignupLavender else MaterialTheme.colorScheme.primary),
            visualTransformation = if (isPassword && !passwordVisible) {
                PasswordVisualTransformation()
            } else {
                VisualTransformation.None
            },
            textStyle = TextStyle(
                color = textColor,
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium
            ),
            decorationBox = { innerTextField ->
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(surfaceColor)
                        .border(1.dp, borderColor, RoundedCornerShape(12.dp))
                        .padding(horizontal = 15.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier.weight(1f),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        if (value.isEmpty()) {
                            Text(
                                text = placeholder,
                                color = secondary.copy(alpha = 0.58f),
                                fontSize = 14.sp
                            )
                        }
                        innerTextField()
                    }

                    if (isPassword && onTogglePassword != null) {
                        TextButton(
                            onClick = onTogglePassword,
                            contentPadding = PaddingValues(0.dp),
                            modifier = Modifier.size(36.dp)
                        ) {
                            Text(
                                text = if (passwordVisible) "Hide" else "Show",
                                fontSize = 11.sp,
                                color = if (darkTheme) SignupLavender else MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        )

        helperText?.let {
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = it,
                fontSize = 12.sp,
                color = secondary
            )
        }
    }
}

@Composable
private fun SignupDobField(
    dob: String,
    calculatedAge: Int?,
    darkTheme: Boolean,
    surfaceColor: Color,
    borderColor: Color,
    onClick: () -> Unit
) {
    val textColor = if (darkTheme) Color.White else MaterialTheme.colorScheme.onSurface
    val secondary = if (darkTheme) SignupTextSecondary else MaterialTheme.colorScheme.onSurfaceVariant

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "DATE OF BIRTH",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = secondary,
            letterSpacing = 1.sp,
            fontFamily = FontFamily.SansSerif
        )

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(surfaceColor)
                .border(1.dp, borderColor, RoundedCornerShape(12.dp))
                .clickable(onClick = onClick)
                .padding(horizontal = 15.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (dob.isBlank()) "Select your date of birth" else formatDobForDisplay(dob),
                color = if (dob.isBlank()) secondary.copy(alpha = 0.58f) else textColor,
                fontSize = 14.sp,
                modifier = Modifier.weight(1f)
            )
            if (calculatedAge != null) {
                Text(
                    text = "Age $calculatedAge",
                    color = if (darkTheme) SignupLavender else MaterialTheme.colorScheme.primary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
private fun SignupPasswordStrengthRow(
    password: String,
    darkTheme: Boolean
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        SignupStrengthPill("8+ Chars", password.length >= 8, darkTheme, Modifier.weight(1f))
        SignupStrengthPill(
            "Aa",
            password.any(Char::isUpperCase) && password.any(Char::isLowerCase),
            darkTheme,
            Modifier.weight(1f)
        )
        SignupStrengthPill("123", password.any(Char::isDigit), darkTheme, Modifier.weight(1f))
        SignupStrengthPill("!@#", password.any { !it.isLetterOrDigit() }, darkTheme, Modifier.weight(1f))
    }
}

@Composable
private fun SignupStrengthPill(
    label: String,
    valid: Boolean,
    darkTheme: Boolean,
    modifier: Modifier
) {
    val border = if (valid) {
        SignupLavender
    } else if (darkTheme) {
        SignupBorder
    } else {
        MaterialTheme.colorScheme.outline.copy(alpha = 0.45f)
    }
    val text = if (valid) {
        if (darkTheme) SignupLavender else MaterialTheme.colorScheme.primary
    } else if (darkTheme) {
        SignupTextSecondary
    } else {
        MaterialTheme.colorScheme.onSurfaceVariant
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .border(1.dp, border, RoundedCornerShape(20.dp))
            .padding(vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = 10.sp,
            color = text,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun SignupInlineError(message: String) {
    Text(
        text = "⚠ $message",
        modifier = Modifier.padding(top = 6.dp),
        color = MaterialTheme.colorScheme.error,
        style = MaterialTheme.typography.bodySmall,
        fontWeight = FontWeight.SemiBold
    )
}

private fun hasStrongPassword(password: String): Boolean {
    return password.length >= 8 &&
        password.any(Char::isUpperCase) &&
        password.any(Char::isLowerCase) &&
        password.any(Char::isDigit) &&
        password.any { !it.isLetterOrDigit() } &&
        password.none(Char::isWhitespace)
}
