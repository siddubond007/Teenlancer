package com.skilllaunch.app.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun AuthBackground(
    darkTheme: Boolean,
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = if (darkTheme) {
                        listOf(
                            Color(0xFF17183D),
                            Color(0xFF0B1027),
                            Color(0xFF050B1B)
                        )
                    } else {
                        listOf(
                            Color(0xFFF0EDFF),
                            Color(0xFFF5F4FF),
                            Color(0xFFF8F9FF)
                        )
                    }
                )
            ),
        content = content
    )
}

@Composable
fun AuthTopBar(
    darkTheme: Boolean,
    onToggleTheme: () -> Unit,
    backText: String? = null,
    onBack: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (backText != null && onBack != null) {
            TextButton(
                onClick = onBack,
                contentPadding = PaddingValues(0.dp)
            ) {
                Text(
                    text = backText,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
            }
        } else {
            Spacer(modifier = Modifier.width(1.dp))
        }

        Spacer(modifier = Modifier.weight(1f))

        ThemeToggle(
            darkTheme = darkTheme,
            onToggleTheme = onToggleTheme
        )
    }
}

@Composable
fun ThemeToggle(
    darkTheme: Boolean,
    onToggleTheme: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(40.dp)
            .clip(CircleShape)
            .background(
                if (darkTheme) {
                    Color.White.copy(alpha = 0.065f)
                } else {
                    Color(0xFFE2E2FF)
                }
            )
            .border(
                width = 1.dp,
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.10f),
                shape = CircleShape
            )
            .clickable(onClick = onToggleTheme),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = if (darkTheme) "☀" else "☾",
            color = if (darkTheme) Color(0xFFE4DFFF) else MaterialTheme.colorScheme.primary,
            fontSize = 17.sp
        )
    }
}

@Composable
fun SkillLaunchBrand(
    darkTheme: Boolean,
    compact: Boolean = false
) {
    Row(
        verticalAlignment = Alignment.CenterVertically
    ) {
        SurfaceMark(darkTheme = darkTheme, size = if (compact) 40.dp else 42.dp)

        Spacer(modifier = Modifier.width(11.dp))

        Text(
            text = "SkillLaunch",
            color = MaterialTheme.colorScheme.onSurface,
            style = if (compact) {
                MaterialTheme.typography.titleMedium
            } else {
                MaterialTheme.typography.titleLarge
            },
            fontWeight = FontWeight.ExtraBold
        )
    }
}

@Composable
private fun SurfaceMark(
    darkTheme: Boolean,
    size: androidx.compose.ui.unit.Dp
) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(RoundedCornerShape(13.dp))
            .background(
                if (darkTheme) {
                    Color(0xFF27225A)
                } else {
                    Color(0xFFE1DFFF)
                }
            )
            .border(
                1.dp,
                MaterialTheme.colorScheme.primary.copy(alpha = 0.18f),
                RoundedCornerShape(13.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        androidx.compose.foundation.Canvas(modifier = Modifier.size(size * 0.62f)) {
            drawSkillLaunchMark(
                color = if (darkTheme) Color(0xFFB8B2FF) else Color(0xFF7E75FF)
            )
        }
    }
}

private fun DrawScope.drawSkillLaunchMark(color: Color) {
    val w = size.width
    val h = size.height

    drawLine(
        color = color,
        start = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.90f),
        end = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.22f),
        strokeWidth = w * 0.11f,
        cap = StrokeCap.Round
    )

    val arrow = Path().apply {
        moveTo(w * 0.50f, h * 0.04f)
        lineTo(w * 0.23f, h * 0.34f)
        lineTo(w * 0.40f, h * 0.33f)
        lineTo(w * 0.40f, h * 0.50f)
        lineTo(w * 0.60f, h * 0.50f)
        lineTo(w * 0.60f, h * 0.33f)
        lineTo(w * 0.77f, h * 0.34f)
        close()
    }
    drawPath(arrow, color = color)

    drawLine(
        color = color.copy(alpha = 0.7f),
        start = androidx.compose.ui.geometry.Offset(w * 0.18f, h * 0.64f),
        end = androidx.compose.ui.geometry.Offset(w * 0.34f, h * 0.58f),
        strokeWidth = w * 0.08f,
        cap = StrokeCap.Round
    )
    drawLine(
        color = color.copy(alpha = 0.7f),
        start = androidx.compose.ui.geometry.Offset(w * 0.82f, h * 0.64f),
        end = androidx.compose.ui.geometry.Offset(w * 0.66f, h * 0.58f),
        strokeWidth = w * 0.08f,
        cap = StrokeCap.Round
    )
}

@Composable
fun AuthField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardOptions: KeyboardOptions,
    leadingIcon: AuthFieldIcon,
    modifier: Modifier = Modifier,
    password: Boolean = false,
    passwordVisible: Boolean = false,
    onTogglePassword: (() -> Unit)? = null
) {
    val interactionSource = remember { MutableInteractionSource() }
    val focusedState = interactionSource.collectIsFocusedAsState()
    val focused = focusedState.value

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(7.dp)
    ) {
        Text(
            text = label,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold
        )

        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = keyboardOptions,
            cursorBrush = SolidColor(MaterialTheme.colorScheme.onSurface),
            visualTransformation = if (password && !passwordVisible) {
                PasswordVisualTransformation()
            } else {
                VisualTransformation.None
            },
            textStyle = TextStyle(
                color = MaterialTheme.colorScheme.onSurface,
                fontSize = 16.sp,
                lineHeight = 21.sp,
                fontWeight = FontWeight.Medium
            ),
            decorationBox = { innerTextField ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(58.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            MaterialTheme.colorScheme.surface.copy(
                                alpha = if (androidx.compose.foundation.isSystemInDarkTheme()) 0.38f else 0.52f
                            )
                        )
                        .border(
                            1.dp,
                            if (focused) {
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.72f)
                            } else {
                                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.10f)
                            },
                            RoundedCornerShape(16.dp)
                        )
                        .padding(horizontal = 17.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    AuthFieldIconView(
                        icon = leadingIcon,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.86f)
                    )

                    Spacer(modifier = Modifier.width(12.dp))

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight(),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        if (value.isEmpty()) {
                            Text(
                                text = placeholder,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.52f),
                                style = MaterialTheme.typography.bodyMedium,
                                maxLines = 1
                            )
                        }
                        innerTextField()
                    }

                    if (password && onTogglePassword != null) {
                        TextButton(
                            onClick = onTogglePassword,
                            contentPadding = PaddingValues(0.dp),
                            modifier = Modifier.size(36.dp)
                        ) {
                            AuthFieldIconView(
                                icon = AuthFieldIcon.Eye,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        )
    }
}

enum class AuthFieldIcon {
    Email,
    Lock,
    Eye,
    Check,
    User,
    Search,
    Graduation,
    Calendar
}

@Composable
private fun AuthFieldIconView(
    icon: AuthFieldIcon,
    color: Color
) {
    androidx.compose.foundation.Canvas(modifier = Modifier.size(18.dp)) {
        when (icon) {
            AuthFieldIcon.Email -> drawEmailIcon(color)
            AuthFieldIcon.Lock -> drawLockIcon(color)
            AuthFieldIcon.Eye -> drawEyeIcon(color)
            AuthFieldIcon.Check -> drawCheckIcon(color)
            AuthFieldIcon.User -> drawUserIcon(color)
            AuthFieldIcon.Search -> drawSearchIcon(color)
            AuthFieldIcon.Graduation -> drawGraduationIcon(color)
            AuthFieldIcon.Calendar -> drawCalendarIcon(color)
        }
    }
}

private fun DrawScope.drawEmailIcon(color: Color) {
    val stroke = Stroke(width = size.minDimension * 0.10f, join = StrokeJoin.Round)
    val left = size.width * 0.12f
    val top = size.height * 0.22f
    val right = size.width * 0.88f
    val bottom = size.height * 0.78f

    drawRoundRect(
        color = color,
        topLeft = androidx.compose.ui.geometry.Offset(left, top),
        size = androidx.compose.ui.geometry.Size(right - left, bottom - top),
        cornerRadius = androidx.compose.ui.geometry.CornerRadius(size.minDimension * 0.08f),
        style = stroke
    )

    val path = Path().apply {
        moveTo(left, top + size.height * 0.08f)
        lineTo(size.width * 0.5f, size.height * 0.55f)
        lineTo(right, top + size.height * 0.08f)
    }
    drawPath(path, color = color, style = stroke)
}

private fun DrawScope.drawLockIcon(color: Color) {
    val stroke = Stroke(width = size.minDimension * 0.10f, join = StrokeJoin.Round)
    drawRoundRect(
        color = color,
        topLeft = androidx.compose.ui.geometry.Offset(size.width * 0.22f, size.height * 0.43f),
        size = androidx.compose.ui.geometry.Size(size.width * 0.56f, size.height * 0.40f),
        cornerRadius = androidx.compose.ui.geometry.CornerRadius(size.minDimension * 0.07f),
        style = stroke
    )
    drawArc(
        color = color,
        startAngle = 180f,
        sweepAngle = 180f,
        useCenter = false,
        topLeft = androidx.compose.ui.geometry.Offset(size.width * 0.31f, size.height * 0.12f),
        size = androidx.compose.ui.geometry.Size(size.width * 0.38f, size.height * 0.46f),
        style = stroke
    )
}

private fun DrawScope.drawEyeIcon(color: Color) {
    val stroke = Stroke(width = size.minDimension * 0.10f, join = StrokeJoin.Round)
    val p = Path().apply {
        moveTo(size.width * 0.08f, size.height * 0.5f)
        cubicTo(
            size.width * 0.25f, size.height * 0.18f,
            size.width * 0.75f, size.height * 0.18f,
            size.width * 0.92f, size.height * 0.5f
        )
        cubicTo(
            size.width * 0.75f, size.height * 0.82f,
            size.width * 0.25f, size.height * 0.82f,
            size.width * 0.08f, size.height * 0.5f
        )
    }
    drawPath(p, color = color, style = stroke)
    drawCircle(
        color = color,
        radius = size.minDimension * 0.14f,
        center = androidx.compose.ui.geometry.Offset(size.width / 2f, size.height / 2f)
    )
}

private fun DrawScope.drawCheckIcon(color: Color) {
    val stroke = Stroke(width = size.minDimension * 0.11f, cap = StrokeCap.Round, join = StrokeJoin.Round)
    val p = Path().apply {
        moveTo(size.width * 0.18f, size.height * 0.52f)
        lineTo(size.width * 0.42f, size.height * 0.76f)
        lineTo(size.width * 0.84f, size.height * 0.26f)
    }
    drawPath(p, color = color, style = stroke)
}

private fun DrawScope.drawUserIcon(color: Color) {
    val stroke = Stroke(width = size.minDimension * 0.10f, cap = StrokeCap.Round, join = StrokeJoin.Round)
    drawCircle(
        color = color,
        radius = size.minDimension * 0.18f,
        center = androidx.compose.ui.geometry.Offset(size.width / 2f, size.height * 0.28f),
        style = stroke
    )
    drawArc(
        color = color,
        startAngle = 205f,
        sweepAngle = 130f,
        useCenter = false,
        topLeft = androidx.compose.ui.geometry.Offset(size.width * 0.12f, size.height * 0.42f),
        size = androidx.compose.ui.geometry.Size(size.width * 0.76f, size.height * 0.50f),
        style = stroke
    )
}

@Composable
fun AuthPrimaryButton(
    text: String,
    enabled: Boolean = true,
    loading: Boolean = false,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(58.dp)
            .clip(RoundedCornerShape(17.dp))
            .background(
                Brush.horizontalGradient(
                    listOf(
                        Color(0xFF5845E9),
                        Color(0xFF8B3BEB)
                    )
                )
            )
            .clickable(enabled = enabled && !loading, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(21.dp),
                strokeWidth = 2.dp,
                color = Color.White
            )
        } else {
            Text(
                text = text,
                color = Color.White,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun AuthRoleToggle(
    studentSelected: Boolean,
    onStudentSelected: () -> Unit,
    onClientSelected: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .clip(RoundedCornerShape(17.dp))
            .background(
                MaterialTheme.colorScheme.surface.copy(alpha = 0.42f)
            )
            .border(
                1.dp,
                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.09f),
                RoundedCornerShape(17.dp)
            )
            .padding(4.dp)
    ) {
        RoleToggleOption(
            text = "🎓  Student",
            selected = studentSelected,
            modifier = Modifier.weight(1f),
            onClick = onStudentSelected
        )

        RoleToggleOption(
            text = "💼  Client",
            selected = !studentSelected,
            modifier = Modifier.weight(1f),
            onClick = onClientSelected
        )
    }
}

@Composable
private fun RoleToggleOption(
    text: String,
    selected: Boolean,
    modifier: Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(44.dp)
            .clip(RoundedCornerShape(13.dp))
            .background(
                if (selected) {
                    Brush.horizontalGradient(
                        listOf(
                            Color(0xFF5A46E9),
                            Color(0xFF8337E7)
                        )
                    )
                } else {
                    Brush.linearGradient(
                        listOf(Color.Transparent, Color.Transparent)
                    )
                }
            )
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (selected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold
        )
    }
}


private fun DrawScope.drawSearchIcon(color: Color) {
    val stroke = Stroke(width = size.minDimension * 0.11f, cap = StrokeCap.Round, join = StrokeJoin.Round)
    drawCircle(
        color = color,
        radius = size.minDimension * 0.30f,
        center = androidx.compose.ui.geometry.Offset(
            size.width * 0.42f,
            size.height * 0.42f
        ),
        style = stroke
    )
    drawLine(
        color = color,
        start = androidx.compose.ui.geometry.Offset(
            size.width * 0.64f,
            size.height * 0.64f
        ),
        end = androidx.compose.ui.geometry.Offset(
            size.width * 0.86f,
            size.height * 0.86f
        ),
        strokeWidth = size.minDimension * 0.11f,
        cap = StrokeCap.Round
    )
}


private fun DrawScope.drawGraduationIcon(color: Color) {
    val stroke = Stroke(
        width = size.minDimension * 0.09f,
        cap = StrokeCap.Round,
        join = StrokeJoin.Round
    )
    val w = size.width
    val h = size.height

    val cap = Path().apply {
        moveTo(w * 0.10f, h * 0.38f)
        lineTo(w * 0.50f, h * 0.16f)
        lineTo(w * 0.90f, h * 0.38f)
        lineTo(w * 0.50f, h * 0.60f)
        close()
    }
    drawPath(cap, color = color, style = stroke)

    drawLine(
        color = color,
        start = androidx.compose.ui.geometry.Offset(w * 0.50f, h * 0.60f),
        end = androidx.compose.ui.geometry.Offset(w * 0.50f, h * 0.82f),
        strokeWidth = stroke.width,
        cap = StrokeCap.Round
    )

    drawArc(
        color = color,
        startAngle = 10f,
        sweepAngle = 160f,
        useCenter = false,
        topLeft = androidx.compose.ui.geometry.Offset(w * 0.24f, h * 0.48f),
        size = androidx.compose.ui.geometry.Size(w * 0.52f, h * 0.36f),
        style = stroke
    )

    drawLine(
        color = color,
        start = androidx.compose.ui.geometry.Offset(w * 0.86f, h * 0.38f),
        end = androidx.compose.ui.geometry.Offset(w * 0.86f, h * 0.68f),
        strokeWidth = stroke.width,
        cap = StrokeCap.Round
    )

    drawCircle(
        color = color,
        radius = stroke.width * 0.8f,
        center = androidx.compose.ui.geometry.Offset(w * 0.86f, h * 0.72f)
    )
}


private fun DrawScope.drawCalendarIcon(color: Color) {
    val stroke = Stroke(
        width = size.minDimension * 0.09f,
        cap = StrokeCap.Round,
        join = StrokeJoin.Round
    )
    val left = size.width * 0.14f
    val top = size.height * 0.23f
    val right = size.width * 0.86f
    val bottom = size.height * 0.82f

    drawRoundRect(
        color = color,
        topLeft = androidx.compose.ui.geometry.Offset(left, top),
        size = androidx.compose.ui.geometry.Size(right - left, bottom - top),
        cornerRadius = androidx.compose.ui.geometry.CornerRadius(size.minDimension * 0.08f),
        style = stroke
    )

    drawLine(
        color = color,
        start = androidx.compose.ui.geometry.Offset(left, size.height * 0.40f),
        end = androidx.compose.ui.geometry.Offset(right, size.height * 0.40f),
        strokeWidth = stroke.width
    )

    drawLine(
        color = color,
        start = androidx.compose.ui.geometry.Offset(size.width * 0.32f, size.height * 0.11f),
        end = androidx.compose.ui.geometry.Offset(size.width * 0.32f, size.height * 0.31f),
        strokeWidth = stroke.width,
        cap = StrokeCap.Round
    )

    drawLine(
        color = color,
        start = androidx.compose.ui.geometry.Offset(size.width * 0.68f, size.height * 0.11f),
        end = androidx.compose.ui.geometry.Offset(size.width * 0.68f, size.height * 0.31f),
        strokeWidth = stroke.width,
        cap = StrokeCap.Round
    )

    drawCircle(
        color = color,
        radius = stroke.width * 0.75f,
        center = androidx.compose.ui.geometry.Offset(size.width * 0.33f, size.height * 0.58f)
    )
    drawCircle(
        color = color,
        radius = stroke.width * 0.75f,
        center = androidx.compose.ui.geometry.Offset(size.width * 0.52f, size.height * 0.58f)
    )
    drawCircle(
        color = color,
        radius = stroke.width * 0.75f,
        center = androidx.compose.ui.geometry.Offset(size.width * 0.71f, size.height * 0.58f)
    )
}
