package com.skilllaunch.app.feature.auth

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

enum class SignupRoleChoice {
    Student,
    Client
}

@androidx.compose.runtime.Composable
fun SignupHeroArtwork(
    darkTheme: Boolean,
    modifier: Modifier = Modifier
) {
    val background = if (darkTheme) {
        Brush.linearGradient(
            colors = listOf(
                Color(0xFF07111F),
                Color(0xFF101C31),
                Color(0xFF1B2940)
            )
        )
    } else {
        Brush.linearGradient(
            colors = listOf(
                Color(0xFFFAF7F0),
                Color(0xFFEFF1F7),
                Color(0xFFE0E6F0)
            )
        )
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(196.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(background)
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height

            // Soft glow behind the composition.
            drawCircle(
                color = Color(0xFF8EAEFF).copy(alpha = 0.16f),
                radius = w * 0.28f,
                center = Offset(w * 0.50f, h * 0.48f)
            )
            drawCircle(
                color = Color(0xFFFFC979).copy(alpha = 0.14f),
                radius = w * 0.18f,
                center = Offset(w * 0.63f, h * 0.45f)
            )

            // Abstract floating nodes.
            val nodes = listOf(
                Offset(w * 0.18f, h * 0.47f),
                Offset(w * 0.29f, h * 0.26f),
                Offset(w * 0.38f, h * 0.70f),
                Offset(w * 0.70f, h * 0.26f),
                Offset(w * 0.81f, h * 0.52f)
            )
            nodes.forEachIndexed { index, point ->
                drawCircle(
                    color = if (index % 2 == 0) Color(0xFF7FA9FF) else Color(0xFFFFC878),
                    radius = 3.dp.toPx(),
                    center = point
                )
            }

            // Network lines.
            val lineColor = if (darkTheme) {
                Color.White.copy(alpha = 0.25f)
            } else {
                Color(0xFF33405C).copy(alpha = 0.24f)
            }
            listOf(
                nodes[0] to nodes[1],
                nodes[1] to nodes[2],
                nodes[1] to nodes[3],
                nodes[2] to nodes[4],
                nodes[3] to nodes[4]
            ).forEach { (a, b) ->
                drawLine(
                    color = lineColor,
                    start = a,
                    end = b,
                    strokeWidth = 1.2.dp.toPx()
                )
            }

            // Rising arrow/ribbon inspired by the supplied reference image.
            val ribbon = Path().apply {
                moveTo(w * 0.27f, h * 0.71f)
                cubicTo(
                    w * 0.36f, h * 0.68f,
                    w * 0.47f, h * 0.59f,
                    w * 0.52f, h * 0.49f
                )
                cubicTo(
                    w * 0.57f, h * 0.39f,
                    w * 0.57f, h * 0.28f,
                    w * 0.59f, h * 0.19f
                )
                lineTo(w * 0.52f, h * 0.28f)
                cubicTo(
                    w * 0.50f, h * 0.39f,
                    w * 0.49f, h * 0.46f,
                    w * 0.43f, h * 0.54f
                )
                cubicTo(
                    w * 0.38f, h * 0.61f,
                    w * 0.31f, h * 0.65f,
                    w * 0.25f, h * 0.66f
                )
                close()
            }
            drawPath(
                path = ribbon,
                brush = Brush.linearGradient(
                    colors = listOf(Color(0xFF1B356B), Color(0xFF7F9DDA), Color(0xFFFFC96D))
                )
            )

            val arrowHead = Path().apply {
                moveTo(w * 0.59f, h * 0.10f)
                lineTo(w * 0.49f, h * 0.23f)
                lineTo(w * 0.55f, h * 0.22f)
                lineTo(w * 0.55f, h * 0.35f)
                lineTo(w * 0.65f, h * 0.35f)
                lineTo(w * 0.65f, h * 0.22f)
                lineTo(w * 0.71f, h * 0.23f)
                close()
            }
            drawPath(
                path = arrowHead,
                brush = Brush.linearGradient(
                    colors = listOf(Color(0xFF172E61), Color(0xFF4B73BE))
                )
            )

            // Floating cubes.
            val cubeCenters = listOf(
                Offset(w * 0.38f, h * 0.39f),
                Offset(w * 0.68f, h * 0.56f),
                Offset(w * 0.73f, h * 0.37f)
            )
            cubeCenters.forEachIndexed { index, center ->
                val cube = 18.dp.toPx() + index * 4.dp.toPx()
                val half = cube / 2f
                val top = Path().apply {
                    moveTo(center.x, center.y - half)
                    lineTo(center.x + half, center.y - half * 0.48f)
                    lineTo(center.x, center.y)
                    lineTo(center.x - half, center.y - half * 0.48f)
                    close()
                }
                val left = Path().apply {
                    moveTo(center.x - half, center.y - half * 0.48f)
                    lineTo(center.x, center.y)
                    lineTo(center.x, center.y + half)
                    lineTo(center.x - half, center.y + half * 0.52f)
                    close()
                }
                val right = Path().apply {
                    moveTo(center.x + half, center.y - half * 0.48f)
                    lineTo(center.x, center.y)
                    lineTo(center.x, center.y + half)
                    lineTo(center.x + half, center.y + half * 0.52f)
                    close()
                }
                drawPath(top, color = Color(0xFFBFCFFF).copy(alpha = 0.92f))
                drawPath(left, color = Color(0xFF466CB3).copy(alpha = 0.95f))
                drawPath(right, color = Color(0xFF153A79).copy(alpha = 0.98f))
            }
        }
    }
}

@androidx.compose.runtime.Composable
fun SignupRoleArtwork(
    role: SignupRoleChoice,
    darkTheme: Boolean,
    modifier: Modifier = Modifier
) {
    val background = when (role) {
        SignupRoleChoice.Student ->
            if (darkTheme) Color(0xFF101014) else Color(0xFFF1F3F7)
        SignupRoleChoice.Client ->
            Color(0xFF18275B)
    }

    Box(
        modifier = modifier
            .size(58.dp)
            .clip(CircleShape)
            .background(background),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(46.dp)) {
            val w = size.width
            val h = size.height

            when (role) {
                SignupRoleChoice.Student -> {
                    val cap = Path().apply {
                        moveTo(w * 0.12f, h * 0.39f)
                        lineTo(w * 0.50f, h * 0.18f)
                        lineTo(w * 0.88f, h * 0.39f)
                        lineTo(w * 0.50f, h * 0.59f)
                        close()
                    }
                    drawPath(cap, color = Color(0xFF273247))
                    drawLine(
                        color = Color(0xFF9FAAC0),
                        start = Offset(w * 0.50f, h * 0.59f),
                        end = Offset(w * 0.50f, h * 0.79f),
                        strokeWidth = 2.3.dp.toPx()
                    )
                    drawRoundRect(
                        color = Color(0xFFE9E3D8),
                        topLeft = Offset(w * 0.24f, h * 0.53f),
                        size = Size(w * 0.52f, h * 0.24f),
                        cornerRadius = androidx.compose.ui.geometry.CornerRadius(5.dp.toPx())
                    )
                    drawLine(
                        color = Color(0xFFD7CBBE),
                        start = Offset(w * 0.28f, h * 0.69f),
                        end = Offset(w * 0.70f, h * 0.69f),
                        strokeWidth = 1.5.dp.toPx()
                    )
                    drawCircle(
                        color = Color(0xFFD8AF50),
                        radius = 2.3.dp.toPx(),
                        center = Offset(w * 0.71f, h * 0.29f)
                    )
                }

                SignupRoleChoice.Client -> {
                    val top = Path().apply {
                        moveTo(w * 0.50f, h * 0.16f)
                        lineTo(w * 0.82f, h * 0.35f)
                        lineTo(w * 0.50f, h * 0.54f)
                        lineTo(w * 0.18f, h * 0.35f)
                        close()
                    }
                    val left = Path().apply {
                        moveTo(w * 0.18f, h * 0.35f)
                        lineTo(w * 0.50f, h * 0.54f)
                        lineTo(w * 0.50f, h * 0.86f)
                        lineTo(w * 0.18f, h * 0.67f)
                        close()
                    }
                    val right = Path().apply {
                        moveTo(w * 0.82f, h * 0.35f)
                        lineTo(w * 0.50f, h * 0.54f)
                        lineTo(w * 0.50f, h * 0.86f)
                        lineTo(w * 0.82f, h * 0.67f)
                        close()
                    }
                    drawPath(top, color = Color(0xFF6EC7FF))
                    drawPath(left, color = Color(0xFF1699F8))
                    drawPath(right, color = Color(0xFF2B63F1))
                    drawCircle(
                        color = Color.White.copy(alpha = 0.55f),
                        radius = 2.dp.toPx(),
                        center = Offset(w * 0.43f, h * 0.35f)
                    )
                }
            }
        }
    }
}
