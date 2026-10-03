package com.skilllaunch.app.feature.onboarding

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
internal fun OnboardingHeader(
    darkTheme: Boolean,
    onSkip: () -> Unit,
    onBack: (() -> Unit)? = null,
    enabled: Boolean = true,
    horizontalPadding: Dp = 24.dp,
    accentOverride: Color? = null
) {
    val textPrimary = if (darkTheme) Color.White else Color(0xFF0F172A)
    val accent = accentOverride ?: if (darkTheme) Color(0xFFD4C6FF) else Color(0xFF4338CA)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(58.dp)
            .padding(horizontal = horizontalPadding),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (onBack != null) {
            androidx.compose.material3.IconButton(
                onClick = onBack,
                enabled = enabled,
                modifier = Modifier.size(32.dp)
            ) {
                BackArrowGlyph(
                    tint = textPrimary,
                    modifier = Modifier.size(19.dp)
                )
            }

            Spacer(modifier = Modifier.width(9.dp))
        }

        Row(
            horizontalArrangement = Arrangement.spacedBy(7.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            RocketGlyph(
                tint = accent,
                modifier = Modifier.size(18.dp)
            )

            Text(
                text = "Finish your onboarding",
                color = textPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.1.sp
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        TextButton(
            onClick = onSkip,
            enabled = enabled,
            contentPadding = PaddingValues(horizontal = 0.dp, vertical = 0.dp)
        ) {
            Text(
                text = "Skip for now",
                color = accent,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun RocketGlyph(
    tint: Color,
    modifier: Modifier = Modifier
) {
    Canvas(modifier) {
        val w = size.width
        val h = size.height
        val stroke = Stroke(
            width = size.minDimension * 0.10f,
            cap = StrokeCap.Round
        )

        val body = Path().apply {
            moveTo(w * 0.58f, h * 0.10f)
            cubicTo(
                w * 0.38f, h * 0.18f,
                w * 0.28f, h * 0.40f,
                w * 0.33f, h * 0.63f
            )
            lineTo(w * 0.50f, h * 0.86f)
            lineTo(w * 0.67f, h * 0.63f)
            cubicTo(
                w * 0.72f, h * 0.40f,
                w * 0.62f, h * 0.18f,
                w * 0.58f, h * 0.10f
            )
            close()
        }

        drawPath(body, color = tint, style = stroke)

        drawCircle(
            color = tint,
            radius = w * 0.08f,
            center = Offset(w * 0.50f, h * 0.40f)
        )

        drawLine(
            color = tint,
            start = Offset(w * 0.36f, h * 0.70f),
            end = Offset(w * 0.26f, h * 0.88f),
            strokeWidth = stroke.width,
            cap = StrokeCap.Round
        )
        drawLine(
            color = tint,
            start = Offset(w * 0.64f, h * 0.70f),
            end = Offset(w * 0.74f, h * 0.88f),
            strokeWidth = stroke.width,
            cap = StrokeCap.Round
        )
    }
}

@Composable
private fun BackArrowGlyph(
    tint: Color,
    modifier: Modifier = Modifier
) {
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
