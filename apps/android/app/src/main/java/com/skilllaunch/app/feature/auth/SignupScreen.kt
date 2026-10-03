package com.skilllaunch.app.feature.auth

import android.util.Patterns
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue

@Composable
fun SignupScreen(
    state: AuthUiState,
    darkTheme: Boolean,
    onToggleTheme: () -> Unit,
    onSignup: (String, String?, String, String, String, String, String, Int, String?) -> Unit,
    onClearError: () -> Unit,
    onBackToLogin: () -> Unit
) {
    var step by rememberSaveable { mutableIntStateOf(1) }
    var firstName by rememberSaveable { mutableStateOf("") }
    var lastName by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var dob by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var username by rememberSaveable { mutableStateOf("") }
    var role by rememberSaveable { mutableStateOf("STUDENT_FREELANCER") }
    var localError by rememberSaveable { mutableStateOf("") }
    var usernameSuggestions by rememberSaveable { mutableStateOf(emptyList<String>()) }

    LaunchedEffect(state.errorMessage) {
        val serverError = state.errorMessage.orEmpty()
        if (
            (serverError.contains("email", ignoreCase = true) &&
                (serverError.contains("registered", ignoreCase = true) ||
                 serverError.contains("already", ignoreCase = true))) ||
            serverError.contains("under 18", ignoreCase = true) ||
            serverError.contains("legal capacity", ignoreCase = true)
        ) {
            step = 1
        }
    }

    BackHandler {
        localError = ""
        onClearError()
        if (step == 2) {
            step = 1
        } else {
            onBackToLogin()
        }
    }

    fun generateUsernameSuggestions(): List<String> {
        val first = firstName.lowercase().filter { it.isLetterOrDigit() }
        val last = lastName.lowercase().filter { it.isLetterOrDigit() }
        val base = first.ifBlank { "user" }.take(10)
        val family = last.take(10)

        val aesthetics = listOf(
            "nova", "luna", "astral", "velvet", "neon",
            "pixel", "cosmic", "dream", "prism", "echo",
            "orbit", "ember", "aurora", "zenith", "midnight",
            "starlit", "phoenix", "glow", "vivid", "solstice"
        ).shuffled()

        val vibes = listOf(
            "verse", "wave", "spark", "bloom", "drift",
            "pulse", "realm", "frame", "byte", "cloud",
            "star", "studio", "lab", "quest", "core"
        ).shuffled()

        val themes = listOf(
            "gojo", "kakashi", "itachi", "levi", "luffy",
            "zoro", "tanjiro", "goku", "batman", "stark",
            "neo", "phantom", "shadow", "cyber", "vader",
            "thor", "wolverine", "ragnar"
        ).shuffled()

        val classic = listOf(
            if (family.isNotBlank()) base + "_" + family else base + "_" + vibes[0],
            base + "_" + vibes[1],
            base + "_studio",
            base + "_creative"
        ).distinct().shuffled().take(2)

        val fancy = listOf(
            base + "_" + aesthetics[0],
            aesthetics[1] + "_" + base,
            themes[0] + "_" + base.take(6),
            aesthetics[2] + "_" + base,
            base + "_" + aesthetics[3]
        ).distinct().shuffled().take(2)

        return (classic + fancy).distinct().take(4)
    }

    Surface(
        modifier = androidx.compose.ui.Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        when (step) {
            1 -> {
                SignupStageOne(
                    state = state,
                    darkTheme = darkTheme,
                    onToggleTheme = onToggleTheme,
                    role = role,
                    firstName = firstName,
                    lastName = lastName,
                    email = email,
                    dob = dob,
                    password = password,
                    onRoleChange = {
                        role = it
                        localError = ""
                        onClearError()
                    },
                    onFirstNameChange = {
                        firstName = it
                        localError = ""
                        onClearError()
                    },
                    onLastNameChange = {
                        lastName = it
                        localError = ""
                        onClearError()
                    },
                    onEmailChange = {
                        email = it
                        localError = ""
                        onClearError()
                    },
                    onDobChange = {
                        dob = it
                        localError = ""
                        onClearError()
                    },
                    onClearError = onClearError,
                    onPasswordChange = {
                        password = it
                        localError = ""
                        onClearError()
                    },
                    onContinue = { selectedRole ->
                        localError = ""
                        role = selectedRole
                        val suggestions = generateUsernameSuggestions()
                        usernameSuggestions = suggestions
                        if (username.isBlank() && suggestions.isNotEmpty()) {
                            username = suggestions.first()
                        }
                        step = 2
                    },
                    onBackToLogin = onBackToLogin
                )
            }

            2 -> {
                SignupStageTwo(
                    state = state,
                    darkTheme = darkTheme,
                    onToggleTheme = onToggleTheme,
                    username = username,
                    usernameSuggestions = usernameSuggestions,
                    onUsernameChange = {
                        username = it
                        localError = ""
                        onClearError()
                    },
                    onRefreshSuggestions = {
                        usernameSuggestions = generateUsernameSuggestions()
                    },
                    onCreateAccount = {
                        val calculatedAge = calculateAgeFromDob(dob)

                        localError = when {
                            firstName.trim().length < 3 ->
                                "First Name must contain at least 3 letters."
                            lastName.trim().length < 3 ->
                                "Last Name must contain at least 3 letters."
                            !Patterns.EMAIL_ADDRESS
                                .matcher(email.trim())
                                .matches() ->
                                "Enter a valid email address."
                            dob.isBlank() ->
                                "Please select your date of birth."
                            calculatedAge == null ->
                                "Please enter a valid date of birth."
                            calculatedAge < 1 || calculatedAge > 120 ->
                                "Please enter a valid date of birth."
                            role == "CLIENT" && calculatedAge < 18 ->
                                "Clients must be 18 or older. You can continue as a Student Freelancer."
                            password.length < 8 ->
                                "Password must contain at least 8 characters."
                            username.trim().length < 3 ->
                                "Please choose a username of at least 3 characters."
                            !username.matches(Regex("[a-z0-9_]+")) ->
                                "Username can contain only lowercase letters, numbers and underscore."
                            else -> ""
                        }

                        if (localError.isBlank()) {
                            calculatedAge?.let { validAge ->
                                onSignup(
                                    firstName.trim(),
                                    null,
                                    lastName.trim(),
                                    username.trim(),
                                    email.trim(),
                                    password,
                                    role,
                                    validAge,
                                    dob
                                )
                            }
                        }
                    },
                    onBackToStageOne = {
                        localError = ""
                        onClearError()
                        step = 1
                    }
                )
            }
        }
    }
}