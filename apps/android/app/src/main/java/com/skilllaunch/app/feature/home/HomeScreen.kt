package com.skilllaunch.app.feature.home

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.skilllaunch.app.core.navigation.AppDestination
import com.skilllaunch.app.data.model.auth.AuthUser
import java.util.Locale

@Composable
fun HomeScreen(
    user: AuthUser,
    onOpenDestination: (AppDestination) -> Unit,
    darkTheme: Boolean,
    onToggleTheme: () -> Unit
) {
    val role = user.role?.uppercase(Locale.US)
    val firstName = user.firstName ?: user.username ?: "there"
    val isClient = role == "CLIENT"

    val verticalScrollState = rememberScrollState()

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(360.dp)
                    .background(
                        Brush.verticalGradient(
                            listOf(
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.18f),
                                MaterialTheme.colorScheme.secondary.copy(alpha = 0.10f),
                                Color.Transparent
                            )
                        )
                    )
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(verticalScrollState)
                    .padding(
                        start = 16.dp,
                        end = 16.dp,
                        top = 14.dp,
                        bottom = 32.dp
                    ),
                verticalArrangement = Arrangement.spacedBy(15.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        modifier = Modifier.size(38.dp),
                        shape = RoundedCornerShape(13.dp),
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.95f)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = "⚡",
                                color = MaterialTheme.colorScheme.onPrimary,
                                style = MaterialTheme.typography.titleMedium
                            )
                        }
                    }

                    Column(
                        modifier = Modifier.padding(start = 9.dp)
                    ) {
                        Text(
                            text = "SkillLaunch",
                            color = MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (isClient) "Client workspace" else "Freelancer workspace",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.labelSmall
                        )
                    }

                    Spacer(modifier = Modifier.weight(1f))

                    ThemeToggle(
                        darkTheme = darkTheme,
                        onToggleTheme = onToggleTheme
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    Surface(
                        modifier = Modifier.size(42.dp),
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.86f),
                        border = BorderStroke(
                            1.dp,
                            MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)
                        )
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = firstName.firstOrNull()?.uppercase(Locale.US) ?: "S",
                                color = MaterialTheme.colorScheme.primary,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Column {
                    Text(
                        text = "WELCOME BACK",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = MaterialTheme.typography.labelSmall.letterSpacing
                    )

                    Text(
                        text = greetingText(firstName),
                        modifier = Modifier.padding(top = 3.dp),
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        text = if (isClient) {
                            "Find the right student talent for your next project."
                        } else {
                            "Turn your skills into your next opportunity."
                        },
                        modifier = Modifier.padding(top = 4.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }

                SearchBar(
                    hint = if (isClient) {
                        "Search jobs, skills, students..."
                    } else {
                        "Search jobs, skills, clients..."
                    },
                    onClick = { onOpenDestination(AppDestination.Explore) }
                )

                Text(
                    text = "Get started",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(11.dp)
                ) {
                    HomeActionCard(
                        modifier = Modifier.weight(1f),
                        icon = "⌕",
                        title = "Explore",
                        description = if (isClient) {
                            "Browse the marketplace."
                        } else {
                            "Discover available gigs."
                        },
                        accent = MaterialTheme.colorScheme.primary,
                        onClick = { onOpenDestination(AppDestination.Explore) }
                    )

                    HomeActionCard(
                        modifier = Modifier.weight(1f),
                        icon = "○",
                        title = "Profile",
                        description = "Review your account.",
                        accent = MaterialTheme.colorScheme.secondary,
                        onClick = { onOpenDestination(AppDestination.Profile) }
                    )
                }

                WorkspaceStateCard(
                    isClient = isClient,
                    firstName = firstName
                )

                Surface(
                    onClick = { onOpenDestination(AppDestination.Explore) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.10f),
                    border = BorderStroke(
                        1.dp,
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.22f)
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 15.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (isClient) "Explore student services" else "Browse live student gigs",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "Continue into the live SkillLaunch marketplace.",
                                modifier = Modifier.padding(top = 3.dp),
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }

                        Text(
                            text = "→",
                            color = MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.titleLarge
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SearchBar(
    hint: String,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp)),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.80f),
        border = BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.10f)
        )
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 15.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "⌕",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.titleLarge
            )

            Text(
                text = hint,
                modifier = Modifier.padding(start = 10.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium
            )

            Spacer(modifier = Modifier.weight(1f))

            Surface(
                modifier = Modifier.size(30.dp),
                shape = RoundedCornerShape(9.dp),
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.88f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = "⌘",
                        color = MaterialTheme.colorScheme.onPrimary,
                        style = MaterialTheme.typography.labelMedium
                    )
                }
            }
        }
    }
}

@Composable
private fun HomeActionCard(
    modifier: Modifier,
    icon: String,
    title: String,
    description: String,
    accent: Color,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.82f)
        ),
        border = BorderStroke(1.dp, accent.copy(alpha = 0.18f))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Surface(
                modifier = Modifier.size(32.dp),
                shape = RoundedCornerShape(10.dp),
                color = accent.copy(alpha = 0.12f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = icon,
                        color = accent,
                        style = MaterialTheme.typography.labelLarge
                    )
                }
            }

            Text(
                text = title,
                modifier = Modifier.padding(top = 10.dp),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = description,
                modifier = Modifier.padding(top = 3.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.labelSmall
            )
        }
    }
}

@Composable
private fun WorkspaceStateCard(
    isClient: Boolean,
    firstName: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(21.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.80f)
        ),
        border = BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.primary.copy(alpha = 0.18f)
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "YOUR WORKSPACE",
                color = MaterialTheme.colorScheme.primary,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = "You're all set, " + firstName.replaceFirstChar { it.uppercase() } + ".",
                modifier = Modifier.padding(top = 4.dp),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = if (isClient) {
                    "Use Explore to browse the marketplace and Profile to manage your account."
                } else {
                    "Use Explore to discover gigs and Profile to manage your account."
                },
                modifier = Modifier.padding(top = 5.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodySmall
            )

            Text(
                text = "Live dashboard metrics will appear when those data-backed features are connected.",
                modifier = Modifier.padding(top = 8.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.labelSmall
            )
        }
    }
}

@Composable
private fun ThemeToggle(
    darkTheme: Boolean,
    onToggleTheme: () -> Unit
) {
    val rotation by animateFloatAsState(
        targetValue = if (darkTheme) 180f else 0f,
        animationSpec = tween(350),
        label = "theme_rotation"
    )

    Surface(
        onClick = onToggleTheme,
        modifier = Modifier.size(40.dp),
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.86f),
        border = BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.10f)
        )
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.graphicsLayer {
                rotationZ = rotation
            }
        ) {
            Text(
                text = if (darkTheme) "☾" else "☀",
                color = MaterialTheme.colorScheme.primary,
                style = MaterialTheme.typography.titleMedium
            )
        }
    }
}

private data class SkillModule(
    val title: String,
    val value: String,
    val valueLabel: String,
    val accent: Color
)

private fun greetingText(firstName: String): AnnotatedString {
    return buildAnnotatedString {
        append("Hey, ")
        withStyle(
            SpanStyle(
                color = Color(0xFF60A5FA)
            )
        ) {
            append(firstName.replaceFirstChar { it.uppercase() })
        }
        append(" 👋")
    }
}
