package com.skilllaunch.app.feature.onboarding

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

private const val MIN_USER_SCALE = 1f
private const val MAX_USER_SCALE = 5f
private const val OUTPUT_SIZE = 600

private val CropBackground = Color.Black
private val CropOverlay = Color.Black.copy(alpha = 0.54f)
private val CropWhite = Color.White
private val CropHint = Color(0xFFD0D0D0)
private val CropButton = Color(0xFFD4C6FF)
private val CropButtonText = Color.Black

@Composable
internal fun ProfilePhotoCropper(
    sourceUri: Uri,
    backgroundColor: Color,
    primaryColor: Color,
    secondaryColor: Color,
    errorColor: Color,
    onDismiss: () -> Unit,
    onCropped: (Uri) -> Unit
) {
    MoveAndScaleScreen(
        sourceUri = sourceUri,
        onDismiss = onDismiss,
        onCropped = onCropped,
        errorColor = errorColor
    )
}

@Composable
internal fun MoveAndScaleScreen(
    sourceUri: Uri,
    onDismiss: () -> Unit,
    onCropped: (Uri) -> Unit,
    errorColor: Color = Color(0xFFFF8A8A)
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var containerSize by remember(sourceUri) {
        mutableStateOf(IntSize.Zero)
    }

    var bitmap by remember(sourceUri) {
        mutableStateOf<Bitmap?>(null)
    }

    var scale by remember(sourceUri) {
        mutableFloatStateOf(1f)
    }

    var offset by remember(sourceUri) {
        mutableStateOf(Offset.Zero)
    }

    var rotation by remember(sourceUri) {
        mutableFloatStateOf(0f)
    }

    var error by remember(sourceUri) {
        mutableStateOf("")
    }

    var processing by remember(sourceUri) {
        mutableStateOf(false)
    }

    LaunchedEffect(sourceUri) {
        bitmap = withContext(Dispatchers.IO) {
            runCatching {
                context.contentResolver
                    .openInputStream(sourceUri)
                    ?.use { input ->
                        BitmapFactory.decodeStream(input)
                    }
            }.getOrNull()
        }

        if (bitmap == null) {
            error = "We couldn't read that image. Please choose another photo."
        }
    }

    val currentBitmap = bitmap
    val bitmapImage: ImageBitmap? = remember(currentBitmap) {
        currentBitmap?.asImageBitmap()
    }

    // Keep gesture input alive for the entire gesture while still reading
    // the latest Compose state on every transform event.
    val currentScale by rememberUpdatedState(scale)
    val currentOffset by rememberUpdatedState(offset)

    val density = androidx.compose.ui.platform.LocalDensity.current
    val maxCropDiameterPx = with(density) {
        340.dp.toPx()
    }

    val cropDiameterPx = if (containerSize != IntSize.Zero) {
        min(
            containerSize.width.toFloat() * 0.66f,
            maxCropDiameterPx
        )
    } else {
        0f
    }

    val cropRadiusPx = cropDiameterPx / 2f

    val baseScale = if (currentBitmap != null && containerSize != IntSize.Zero) {
        calculateBaseScale(
            bitmapWidth = currentBitmap.width,
            bitmapHeight = currentBitmap.height,
            cropDiameter = cropDiameterPx
        )
    } else {
        1f
    }

    fun panLimits(
        targetScale: Float,
        targetRotation: Float
    ): Offset {
        if (currentBitmap == null || cropRadiusPx <= 0f) {
            return Offset.Zero
        }

        val displayedWidth =
            currentBitmap.width.toFloat() * baseScale * targetScale

        val displayedHeight =
            currentBitmap.height.toFloat() * baseScale * targetScale

        val radians = Math.toRadians(targetRotation.toDouble())
        val c = abs(cos(radians)).toFloat()
        val s = abs(sin(radians)).toFloat()

        val rotatedHalfWidth =
            (displayedWidth * c + displayedHeight * s) / 2f

        val rotatedHalfHeight =
            (displayedWidth * s + displayedHeight * c) / 2f

        return Offset(
            x = max(0f, rotatedHalfWidth - cropRadiusPx),
            y = max(0f, rotatedHalfHeight - cropRadiusPx)
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CropBackground)
            .onSizeChanged { containerSize = it }
    ) {
        if (currentBitmap != null && bitmapImage != null) {
            /*
             * Soft full-screen backdrop: the whole source remains visible
             * as context, while the foreground image is sized specifically
             * for the circular DP crop. This is much easier for tall/wide
             * photos than silently zooming them to the entire screen.
             */
            Canvas(
                modifier = Modifier.fillMaxSize()
            ) {
                val backdropScale = max(
                    size.width / currentBitmap.width.toFloat(),
                    size.height / currentBitmap.height.toFloat()
                )

                val backdropWidth =
                    currentBitmap.width.toFloat() * backdropScale
                val backdropHeight =
                    currentBitmap.height.toFloat() * backdropScale

                val backdropLeft =
                    (size.width - backdropWidth) / 2f
                val backdropTop =
                    (size.height - backdropHeight) / 2f

                drawRect(
                    color = Color.Black.copy(alpha = 0.35f)
                )

                withTransform({
                    translate(
                        left = backdropLeft,
                        top = backdropTop
                    )
                    scale(
                        scaleX = backdropScale,
                        scaleY = backdropScale,
                        pivot = Offset.Zero
                    )
                }) {
                    drawImage(
                        bitmapImage,
                        alpha = 0.28f
                    )
                }
            }

            /*
             * Foreground crop image. Its initial scale is calculated from
             * the circle itself, so a 9:16 portrait is NOT opened as an
             * extreme face close-up.
             */
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        transformOrigin =
                            androidx.compose.ui.graphics.TransformOrigin.Center
                        scaleX = scale
                        scaleY = scale
                        translationX = offset.x
                        translationY = offset.y
                        rotationZ = rotation
                    }
            ) {
                val drawWidth =
                    currentBitmap.width.toFloat() * baseScale
                val drawHeight =
                    currentBitmap.height.toFloat() * baseScale

                val left =
                    (size.width - drawWidth) / 2f
                val top =
                    (size.height - drawHeight) / 2f

                withTransform({
                    translate(
                        left = left,
                        top = top
                    )
                    scale(
                        scaleX = baseScale,
                        scaleY = baseScale,
                        pivot = Offset.Zero
                    )
                }) {
                    drawImage(bitmapImage)
                }
            }
        }

        // Dedicated interaction layer. Keeping gestures off the transformed image
        // makes one-finger panning and two-finger pinch reliable on all devices.
        if (currentBitmap != null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(
                        currentBitmap,
                        containerSize,
                        cropDiameterPx,
                        baseScale
                    ) {
                        detectTransformGestures(
                            panZoomLock = false
                        ) { centroid, pan, zoomChange, _ ->
                            if (containerSize == IntSize.Zero) {
                                return@detectTransformGestures
                            }

                            val oldScale = scale
                            val newScale = (oldScale * zoomChange)
                                .coerceIn(
                                    MIN_USER_SCALE,
                                    MAX_USER_SCALE
                                )

                            val actualScaleRatio =
                                if (oldScale == 0f) {
                                    1f
                                } else {
                                    newScale / oldScale
                                }

                            val center = Offset(
                                containerSize.width / 2f,
                                containerSize.height / 2f
                            )

                            // Keep the content under the pinch centroid stable
                            // while also applying the user's one-finger pan.
                            val focalPoint = centroid - center - currentOffset
                            val proposedOffset =
                                currentOffset +
                                    pan +
                                    focalPoint * (1f - actualScaleRatio)

                            val limits = panLimits(
                                targetScale = newScale,
                                targetRotation = rotation
                            )

                            scale = newScale
                            offset = Offset(
                                x = proposedOffset.x.coerceIn(
                                    -limits.x,
                                    limits.x
                                ),
                                y = proposedOffset.y.coerceIn(
                                    -limits.y,
                                    limits.y
                                )
                            )
                        }
                    }
            )
        }

        if (cropDiameterPx > 0f) {
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        compositingStrategy = CompositingStrategy.Offscreen
                    }
            ) {
                val center = Offset(
                    x = size.width / 2f,
                    y = size.height / 2f
                )

                drawRect(CropOverlay)

                drawCircle(
                    color = Color.Transparent,
                    radius = cropRadiusPx,
                    center = center,
                    blendMode = BlendMode.Clear
                )

                drawCircle(
                    color = CropWhite,
                    radius = cropRadiusPx,
                    center = center,
                    style = Stroke(width = 1.4.dp.toPx())
                )
            }
        }

        // Subtle editor scrims keep the top and bottom controls readable
        // without muddying the crop area.
        Canvas(
            modifier = Modifier.fillMaxSize()
        ) {
            drawRect(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color.Black.copy(alpha = 0.72f),
                        Color.Transparent
                    ),
                    startY = 0f,
                    endY = 220.dp.toPx()
                )
            )

            drawRect(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color.Transparent,
                        Color.Black.copy(alpha = 0.78f)
                    ),
                    startY = size.height - 250.dp.toPx(),
                    endY = size.height
                )
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(
                    start = 14.dp,
                    end = 14.dp,
                    top = 8.dp
                ),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onDismiss,
                enabled = !processing,
                modifier = Modifier
                    .size(48.dp)
                    .semantics {
                        contentDescription = "Back"
                    }
            ) {
                BackArrowGlyph(
                    tint = CropWhite,
                    modifier = Modifier.size(26.dp)
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            Text(
                text = "MOVE AND SCALE",
                color = CropWhite,
                fontFamily = FontFamily.SansSerif,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.15.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.semantics {
                    contentDescription = "Move and scale profile photo"
                }
            )

            Spacer(modifier = Modifier.weight(1f))

            IconButton(
                onClick = {
                    val newRotation = normalizeDegrees(rotation + 90f)

                    if (currentBitmap != null && cropDiameterPx > 0f) {
                        val rotatedCropScale = max(
                            cropDiameterPx /
                                currentBitmap.height.toFloat(),
                            cropDiameterPx /
                                currentBitmap.width.toFloat()
                        )

                        val requiredUserScale = max(
                            1f,
                            rotatedCropScale / baseScale
                        )

                        scale = max(
                            scale,
                            requiredUserScale
                        )
                    }

                    rotation = newRotation

                    val limits = panLimits(
                        targetScale = scale,
                        targetRotation = rotation
                    )

                    offset = Offset(
                        x = offset.x.coerceIn(-limits.x, limits.x),
                        y = offset.y.coerceIn(-limits.y, limits.y)
                    )
                },
                enabled = !processing && currentBitmap != null,
                modifier = Modifier
                    .size(48.dp)
                    .semantics {
                        contentDescription = "Rotate photo 90 degrees"
                    }
            ) {
                RotateGlyph(
                    tint = CropWhite,
                    modifier = Modifier.size(25.dp)
                )
            }
        }

        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(
                    start = 40.dp,
                    end = 40.dp,
                    bottom = 26.dp
                ),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (error.isNotBlank()) {
                Text(
                    text = error,
                    color = errorColor,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 10.dp)
                )
            } else {
                Text(
                    text = "Pinch to zoom and drag to adjust",
                    color = CropHint,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(modifier = Modifier.height(18.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(
                    onClick = onDismiss,
                    enabled = !processing,
                    modifier = Modifier.semantics {
                        contentDescription = "Cancel photo crop"
                    },
                    contentPadding = PaddingValues(
                        horizontal = 0.dp,
                        vertical = 10.dp
                    )
                ) {
                    Text(
                        text = "CANCEL",
                        color = CropWhite,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.4.sp
                    )
                }

                Spacer(modifier = Modifier.weight(1f))

                Button(
                    onClick = {
                        val bitmapToCrop = currentBitmap ?: return@Button

                        processing = true
                        error = ""

                        coroutineScope.launch {
                            val result = runCatching {
                                withContext(Dispatchers.Default) {
                                    cropBitmapToCache(
                                        context = context,
                                        bitmap = bitmapToCrop,
                                        cropDiameterPx = cropDiameterPx,
                                        baseScale = baseScale,
                                        scale = scale,
                                        rotation = rotation,
                                        offset = offset
                                    )
                                }
                            }

                            processing = false

                            result.fold(
                                onSuccess = onCropped,
                                onFailure = {
                                    error =
                                        "We couldn't crop this photo. Please try again."
                                }
                            )
                        }
                    },
                    enabled = currentBitmap != null &&
                        !processing &&
                        cropDiameterPx > 0f,
                    modifier = Modifier
                        .width(140.dp)
                        .height(48.dp)
                        .semantics {
                            contentDescription = "Choose cropped profile photo"
                        },
                    shape = androidx.compose.foundation.shape
                        .RoundedCornerShape(26.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = CropButton,
                        contentColor = CropButtonText,
                        disabledContainerColor =
                            CropButton.copy(alpha = 0.45f),
                        disabledContentColor =
                            CropButtonText.copy(alpha = 0.55f)
                    ),
                    contentPadding = PaddingValues(
                        horizontal = 30.dp
                    )
                ) {
                    if (processing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            color = CropButtonText,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            text = "CHOOSE",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.4.sp
                        )
                    }
                }
            }
        }
    }
}

private fun cropBitmapToCache(
    context: Context,
    bitmap: Bitmap,
    cropDiameterPx: Float,
    baseScale: Float,
    scale: Float,
    rotation: Float,
    offset: Offset
): Uri {
    require(cropDiameterPx > 0f)

    val output = Bitmap.createBitmap(
        OUTPUT_SIZE,
        OUTPUT_SIZE,
        Bitmap.Config.ARGB_8888
    )

    val androidCanvas = android.graphics.Canvas(output)
    val cropToOutputScale =
        OUTPUT_SIZE.toFloat() / cropDiameterPx
    val finalScale =
        baseScale * scale * cropToOutputScale
    val outputCenter = OUTPUT_SIZE / 2f

    val paint = android.graphics.Paint(
        android.graphics.Paint.ANTI_ALIAS_FLAG or
            android.graphics.Paint.FILTER_BITMAP_FLAG
    )

    androidCanvas.drawColor(android.graphics.Color.BLACK)
    androidCanvas.save()

    androidCanvas.translate(
        outputCenter + offset.x * cropToOutputScale,
        outputCenter + offset.y * cropToOutputScale
    )

    androidCanvas.rotate(rotation)

    androidCanvas.scale(
        finalScale,
        finalScale
    )

    androidCanvas.translate(
        -bitmap.width / 2f,
        -bitmap.height / 2f
    )

    androidCanvas.drawBitmap(
        bitmap,
        0f,
        0f,
        paint
    )

    androidCanvas.restore()

    val outputFile = File(
        context.cacheDir,
        "profile-" + System.currentTimeMillis() + ".jpg"
    )

    FileOutputStream(outputFile).use { stream ->
        output.compress(
            Bitmap.CompressFormat.JPEG,
            92,
            stream
        )
    }

    output.recycle()

    return Uri.fromFile(outputFile)
}

private fun calculateBaseScale(
    bitmapWidth: Int,
    bitmapHeight: Int,
    cropDiameter: Float
): Float {
    /*
     * This is the key DP-crop rule:
     *
     * The initial image scale is only required to COVER THE CIRCLE,
     * not the entire phone screen.
     *
     * A tall 9:16 photo therefore opens with much more of the original
     * image visible and the user can decide the exact framing.
     */
    if (bitmapWidth <= 0 || bitmapHeight <= 0 || cropDiameter <= 0f) {
        return 1f
    }

    return max(
        cropDiameter / bitmapWidth.toFloat(),
        cropDiameter / bitmapHeight.toFloat()
    )
}

private fun rotateOffset(
    value: Offset,
    degrees: Float
): Offset {
    val radians = degrees * (PI / 180.0)
    val cosValue = cos(radians).toFloat()
    val sinValue = sin(radians).toFloat()

    return Offset(
        x = value.x * cosValue - value.y * sinValue,
        y = value.x * sinValue + value.y * cosValue
    )
}

private fun normalizeDegrees(value: Float): Float {
    var result = value % 360f

    if (result > 180f) {
        result -= 360f
    }

    if (result <= -180f) {
        result += 360f
    }

    return result
}

@Composable
private fun BackArrowGlyph(
    tint: Color,
    modifier: Modifier
) {
    Canvas(modifier = modifier) {
        val stroke = 2.1.dp.toPx()

        drawLine(
            color = tint,
            start = Offset(size.width * 0.72f, size.height * 0.50f),
            end = Offset(size.width * 0.28f, size.height * 0.50f),
            strokeWidth = stroke,
            cap = androidx.compose.ui.graphics.StrokeCap.Round
        )

        drawLine(
            color = tint,
            start = Offset(size.width * 0.28f, size.height * 0.50f),
            end = Offset(size.width * 0.50f, size.height * 0.27f),
            strokeWidth = stroke,
            cap = androidx.compose.ui.graphics.StrokeCap.Round
        )

        drawLine(
            color = tint,
            start = Offset(size.width * 0.28f, size.height * 0.50f),
            end = Offset(size.width * 0.50f, size.height * 0.73f),
            strokeWidth = stroke,
            cap = androidx.compose.ui.graphics.StrokeCap.Round
        )
    }
}



@Composable
private fun RotateGlyph(
    tint: Color,
    modifier: Modifier
) {
    Canvas(modifier = modifier) {
        val stroke = 2.dp.toPx()
        val radius = size.minDimension * 0.31f
        val center = Offset(
            x = size.width / 2f,
            y = size.height / 2f
        )

        val startAngle = -48f
        val sweepAngle = 286f
        val endAngle = startAngle + sweepAngle
        val endRadians = Math.toRadians(endAngle.toDouble())

        drawArc(
            color = tint,
            startAngle = startAngle,
            sweepAngle = sweepAngle,
            useCenter = false,
            topLeft = Offset(
                x = center.x - radius,
                y = center.y - radius
            ),
            size = androidx.compose.ui.geometry.Size(
                width = radius * 2f,
                height = radius * 2f
            ),
            style = Stroke(width = stroke)
        )

        val tip = Offset(
            x = center.x + radius * cos(endRadians).toFloat(),
            y = center.y + radius * sin(endRadians).toFloat()
        )

        /*
         * Arrowhead follows the tangent of the circular arrow, so it
         * stays visually attached to the arc instead of looking offset.
         */
        val tangentRadians =
            endRadians + (PI / 2.0)

        val tangent = Offset(
            x = cos(tangentRadians).toFloat(),
            y = sin(tangentRadians).toFloat()
        )

        val normal = Offset(
            x = -tangent.y,
            y = tangent.x
        )

        val arrowLength = radius * 0.42f
        val arrowHalfWidth = radius * 0.24f

        val base = tip - tangent * arrowLength

        drawLine(
            color = tint,
            start = tip,
            end = base + normal * arrowHalfWidth,
            strokeWidth = stroke,
            cap = androidx.compose.ui.graphics.StrokeCap.Round
        )

        drawLine(
            color = tint,
            start = tip,
            end = base - normal * arrowHalfWidth,
            strokeWidth = stroke,
            cap = androidx.compose.ui.graphics.StrokeCap.Round
        )
    }
}
