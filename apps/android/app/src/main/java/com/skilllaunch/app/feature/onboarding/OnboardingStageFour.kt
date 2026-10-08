package com.skilllaunch.app.feature.onboarding

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.asComposePath
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private data class ProfileSetupColors(
    val background: Color,
    val surface: Color,
    val accent: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val borderSubtle: Color,
    val accentText: Color,
    val error: Color
)

private fun profileSetupColors(darkTheme: Boolean): ProfileSetupColors =
    if (darkTheme) {
        ProfileSetupColors(
            background = Color(0xFF1A1A1D),
            surface = Color(0xFF262629),
            accent = Color(0xFFD4C6FF),
            textPrimary = Color.White,
            textSecondary = Color(0xFFA0A0A5),
            borderSubtle = Color(0xFF3F3F46),
            accentText = Color(0xFF17171A),
            error = Color(0xFFFF8A8A)
        )
    } else {
        ProfileSetupColors(
            background = Color(0xFFF7F7FB),
            surface = Color.White,
            accent = Color(0xFF4338CA),
            textPrimary = Color(0xFF0F172A),
            textSecondary = Color(0xFF64748B),
            borderSubtle = Color(0xFFE2E8F0),
            accentText = Color.White,
            error = Color(0xFFB91C1C)
        )
    }

@Composable
internal fun OnboardingStageFour(
    tagline: String,
    bio: String,
    initialResumeFileName: String,
    initialAvatarUrl: String,
    darkTheme: Boolean,
    saving: Boolean,
    skipConfirmation: Boolean,
    profileViewModel: ProfileViewModel,
    error: String,
    onTaglineChange: (String) -> Unit,
    onBioChange: (String) -> Unit,
    onAvatarUploaded: (String) -> Unit,
    onBack: () -> Unit,
    onSkip: () -> Unit,
    onConfirmSkip: () -> Unit,
    onDismissSkip: () -> Unit,
    onContinue: () -> Unit
) {
    val colors = profileSetupColors(darkTheme)
    val context = androidx.compose.ui.platform.LocalContext.current
    val scrollState = rememberScrollState()

    var selectedResumeName by rememberSaveable {
        mutableStateOf(initialResumeFileName)
    }
    var pickerError by rememberSaveable {
        mutableStateOf("")
    }
    var selectedAvatarUrl by rememberSaveable {
        mutableStateOf(initialAvatarUrl)
    }
    var selectedPhotoUri by remember {
        mutableStateOf<Uri?>(null)
    }
    LaunchedEffect(initialResumeFileName) {
        if (selectedResumeName.isBlank() && initialResumeFileName.isNotBlank()) {
            selectedResumeName = initialResumeFileName
        }
    }

    LaunchedEffect(initialAvatarUrl) {
        if (selectedAvatarUrl.isBlank() && initialAvatarUrl.isNotBlank()) {
            selectedAvatarUrl = initialAvatarUrl
        }
    }

    LaunchedEffect(profileViewModel.uploadedAvatarUrl) {
        profileViewModel.uploadedAvatarUrl
            .takeIf { it.isNotBlank() }
            ?.let {
                selectedAvatarUrl = it
                onAvatarUploaded(it)
            }
    }

    LaunchedEffect(profileViewModel.uploadedResumeFileName) {
        profileViewModel.uploadedResumeFileName
            .takeIf { it.isNotBlank() }
            ?.let { selectedResumeName = it }
    }

    val avatarPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            selectedPhotoUri = uri
        }
    }

    val pickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) {
            val fileName = queryDisplayName(context, uri)
            val mimeType = context.contentResolver.getType(uri)

            if (mimeType != "application/pdf" && !fileName.endsWith(".pdf", ignoreCase = true)) {
                pickerError = "Please select a PDF resume."
                return@rememberLauncherForActivityResult
            }

            pickerError = ""
            profileViewModel.clearResumeUploadError()
            profileViewModel.uploadResumeToBackend(uri, context)
        }
    }

    val uploadError = profileViewModel.resumeUploadError
    val avatarUploadError = profileViewModel.avatarUploadError
    val canLaunch = !saving &&
        !profileViewModel.isResumeUploading &&
        !profileViewModel.isAvatarUploading

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
            .systemBarsPadding()
            .padding(horizontal = 24.dp)
            .imePadding()
    ) {
        OnboardingHeader(
            darkTheme = darkTheme,
            onSkip = onSkip,
            enabled = !saving &&
                !profileViewModel.isResumeUploading &&
                !profileViewModel.isAvatarUploading,
            horizontalPadding = 0.dp
        )

        Spacer(modifier = Modifier.height(16.dp))

        ProgressSegments(
            activeSegments = 4,
            totalSegments = 4,
            accent = colors.accent,
            inactive = colors.borderSubtle
        )

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Step 4 of 4 • Profile",
                color = colors.textSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.weight(1f))

            TextButton(
                onClick = onBack,
                enabled = !saving,
                contentPadding = PaddingValues(
                    horizontal = 0.dp,
                    vertical = 0.dp
                )
            ) {
                Text(
                    text = "← Back to previous step",
                    color = colors.accent,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .verticalScroll(scrollState),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Make your profile yours.",
                color = colors.textPrimary,
                style = TextStyle(
                    fontFamily = FontFamily.Serif,
                    fontSize = 32.sp,
                    lineHeight = 36.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = (-0.4).sp
                )
            )

            Text(
                text = "Add a headline, a short bio, and optionally upload your resume to stand out.",
                color = colors.textSecondary,
                fontSize = 15.sp,
                lineHeight = 21.sp
            )

            Spacer(modifier = Modifier.height(4.dp))

            ProfileAvatarPlaceholder(
                colors = colors,
                imageUrl = selectedAvatarUrl,
                uploading = profileViewModel.isAvatarUploading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(152.dp)
                    .padding(vertical = 2.dp),
                onPick = {
                    if (!profileViewModel.isAvatarUploading) {
                        profileViewModel.clearAvatarUploadError()
                        selectedPhotoUri = null
                        avatarPickerLauncher.launch("image/*")
                    }
                }
            )

            ProfileFieldLabel(
                text = "PROFESSIONAL HEADLINE *",
                color = colors.textSecondary
            )

            OutlinedTextField(
                value = tagline,
                onValueChange = {
                    onTaglineChange(it.take(100))
                },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                textStyle = TextStyle(
                    color = colors.textPrimary,
                    fontSize = 15.sp,
                    lineHeight = 20.sp
                ),
                placeholder = {
                    Text(
                        text = "e.g., Python & Data Science Developer",
                        color = colors.textSecondary.copy(alpha = 0.55f),
                        fontSize = 15.sp
                    )
                },
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = colors.textPrimary,
                    unfocusedTextColor = colors.textPrimary,
                    focusedBorderColor = colors.accent,
                    unfocusedBorderColor = colors.borderSubtle,
                    focusedContainerColor = colors.surface,
                    unfocusedContainerColor = colors.surface,
                    cursorColor = colors.accent
                ),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
            )

            ProfileFieldLabel(
                text = "SHORT BIO",
                color = colors.textSecondary
            )

            OutlinedTextField(
                value = bio,
                onValueChange = {
                    onBioChange(it.take(500))
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(132.dp),
                minLines = 4,
                textStyle = TextStyle(
                    color = colors.textPrimary,
                    fontSize = 15.sp,
                    lineHeight = 21.sp
                ),
                placeholder = {
                    Text(
                        text = "Tell clients a bit about your experience, what you love building, and how you work...",
                        color = colors.textSecondary.copy(alpha = 0.55f),
                        fontSize = 15.sp,
                        lineHeight = 21.sp
                    )
                },
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = colors.textPrimary,
                    unfocusedTextColor = colors.textPrimary,
                    focusedBorderColor = colors.accent,
                    unfocusedBorderColor = colors.borderSubtle,
                    focusedContainerColor = colors.surface,
                    unfocusedContainerColor = colors.surface,
                    cursorColor = colors.accent
                ),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done)
            )

            ProfileFieldLabel(
                text = "RESUME / CV (OPTIONAL)",
                color = colors.textSecondary
            )

            ResumeDropzone(
                fileName = selectedResumeName,
                uploading = profileViewModel.isResumeUploading,
                accent = colors.accent,
                surface = colors.surface,
                textPrimary = colors.textPrimary,
                textSecondary = colors.textSecondary,
                border = colors.borderSubtle,
                onClick = {
                    pickerLauncher.launch(arrayOf("application/pdf"))
                }
            )

            pickerError.takeIf { it.isNotBlank() }?.let { message ->
                Text(
                    text = message,
                    color = colors.error,
                    fontSize = 12.sp,
                    lineHeight = 17.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            uploadError?.takeIf { it.isNotBlank() }?.let { message ->
                Text(
                    text = message,
                    color = colors.error,
                    fontSize = 12.sp,
                    lineHeight = 17.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            avatarUploadError?.takeIf { it.isNotBlank() }?.let { message ->
                Text(
                    text = message,
                    color = colors.error,
                    fontSize = 12.sp,
                    lineHeight = 17.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            error.takeIf { it.isNotBlank() }?.let { message ->
                Text(
                    text = message,
                    color = colors.error,
                    fontSize = 12.sp,
                    lineHeight = 17.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
        }

        Button(
            onClick = onContinue,
            enabled = canLaunch,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(bottom = 0.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = colors.accent,
                contentColor = colors.accentText,
                disabledContainerColor = colors.accent.copy(alpha = 0.35f),
                disabledContentColor = colors.accentText.copy(alpha = 0.65f)
            )
        ) {
            Text(
                text = "Find My First Project  →",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(8.dp))
    }

    selectedPhotoUri?.let { uri ->
        ProfilePhotoCropper(
            sourceUri = uri,
            backgroundColor = colors.background,
            primaryColor = colors.accent,
            secondaryColor = colors.textSecondary,
            errorColor = colors.error,
            onDismiss = { selectedPhotoUri = null },
            onCropped = { croppedUri ->
                selectedPhotoUri = null
                profileViewModel.uploadProfileImage(croppedUri, context)
            }
        )
    }

    if (skipConfirmation) {
        AlertDialog(
            onDismissRequest = onDismissSkip,
            title = {
                Text("Skip profile setup?")
            },
            text = {
                Text(
                    "Your progress will be saved. You can return to Profile later and finish the setup."
                )
            },
            confirmButton = {
                TextButton(
                    onClick = onConfirmSkip,
                    enabled = !saving && !profileViewModel.isResumeUploading
                ) {
                    Text("Skip for now")
                }
            },
            dismissButton = {
                TextButton(onClick = onDismissSkip) {
                    Text("Keep setting up")
                }
            }
        )
    }
}

@Composable
private fun ProgressSegments(
    activeSegments: Int,
    totalSegments: Int,
    accent: Color,
    inactive: Color
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        repeat(totalSegments) { index ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(4.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(
                        if (index < activeSegments) accent else inactive
                    )
            )
        }
    }
}

@Composable
private fun ProfileFieldLabel(
    text: String,
    color: Color
) {
    Text(
        text = text,
        color = color,
        fontSize = 11.sp,
        lineHeight = 13.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.6.sp
    )
}

@Composable
private fun ProfileAvatarPlaceholder(
    colors: ProfileSetupColors,
    imageUrl: String,
    uploading: Boolean,
    modifier: Modifier,
    onPick: () -> Unit
) {
    Box(
        modifier = modifier,
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .size(100.dp)
                .clip(CircleShape)
                .background(colors.surface)
                .border(
                    width = 2.dp,
                    color = colors.accent.copy(alpha = 0.72f),
                    shape = CircleShape
                )
                .clickable(enabled = !uploading, onClick = onPick),
            contentAlignment = Alignment.Center
        ) {
            ProfilePhotoImage(
                imageUrl = imageUrl,
                modifier = Modifier.fillMaxSize()
            )
        }

        Box(
            modifier = Modifier
                .align(Alignment.Center)
                .size(38.dp)
                .offset(x = 38.dp, y = 38.dp)
                .clip(CircleShape)
                .background(colors.accent)
                .border(2.dp, colors.background, CircleShape)
                .clickable(enabled = !uploading, onClick = onPick),
            contentAlignment = Alignment.Center
        ) {
            CameraGlyph(
                tint = colors.accentText,
                modifier = Modifier.size(18.dp)
            )
        }

        if (uploading) {
            Text(
                text = "Uploading photo…",
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 2.dp),
                color = colors.textSecondary,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun ProfilePhotoImage(
    imageUrl: String,
    modifier: Modifier
) {
    if (imageUrl.isBlank()) {
        Box(
            modifier = modifier
                .clip(CircleShape)
                .background(Color(0xFF262629)),
            contentAlignment = Alignment.Center
        ) {
            PersonGlyph(
                tint = Color(0xFF8B8B93),
                modifier = Modifier.size(50.dp)
            )
        }
        return
    }

    coil3.compose.SubcomposeAsyncImage(
        model = imageUrl,
        contentDescription = "Profile photo",
        modifier = modifier.clip(CircleShape),
        contentScale = androidx.compose.ui.layout.ContentScale.Crop,
        loading = {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF262629)),
                contentAlignment = Alignment.Center
            ) {
                PersonGlyph(
                    tint = Color(0xFF8B8B93),
                    modifier = Modifier.size(50.dp)
                )
            }
        },
        error = {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF262629)),
                contentAlignment = Alignment.Center
            ) {
                PersonGlyph(
                    tint = Color(0xFF8B8B93),
                    modifier = Modifier.size(50.dp)
                )
            }
        },
        success = {
            coil3.compose.SubcomposeAsyncImageContent()
        }
    )
}

@Composable
private fun ResumeDropzone(
    fileName: String,
    uploading: Boolean,
    accent: Color,
    surface: Color,
    textPrimary: Color,
    textSecondary: Color,
    border: Color,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(16.dp)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(174.dp)
            .clip(shape)
            .background(accent.copy(alpha = 0.10f))
            .clickable(
            enabled = !uploading,
            onClick = onClick
        )
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawRoundRect(
                color = accent,
                cornerRadius = CornerRadius(16.dp.toPx(), 16.dp.toPx()),
                style = Stroke(
                    width = 1.5.dp.toPx(),
                    pathEffect = PathEffect.dashPathEffect(
                        floatArrayOf(12.dp.toPx(), 8.dp.toPx())
                    )
                )
            )
        }

        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            CloudUploadGlyph(
                tint = accent,
                modifier = Modifier.size(40.dp)
            )

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = when {
                    uploading -> "Uploading…"
                    fileName.isNotBlank() -> fileName
                    else -> "Tap to upload PDF"
                },
                color = if (fileName.isNotBlank() && !uploading) textPrimary else accent,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Max file size 5MB",
                color = textSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

private fun queryDisplayName(
    context: Context,
    uri: Uri
): String {
    context.contentResolver.query(
        uri,
        arrayOf(OpenableColumns.DISPLAY_NAME),
        null,
        null,
        null
    )?.use { cursor ->
        if (cursor.moveToFirst()) {
            return cursor.getString(
                cursor.getColumnIndexOrThrow(OpenableColumns.DISPLAY_NAME)
            )
        }
    }

    return "resume.pdf"
}

@Composable
private fun PersonGlyph(
    tint: Color,
    modifier: Modifier
) {
    Canvas(modifier) {
        drawCircle(
            color = tint,
            radius = size.minDimension * 0.18f,
            center = Offset(size.width * 0.50f, size.height * 0.30f)
        )
        drawRoundRect(
            color = tint,
            topLeft = Offset(size.width * 0.22f, size.height * 0.50f),
            size = androidx.compose.ui.geometry.Size(
                size.width * 0.56f,
                size.height * 0.32f
            ),
            cornerRadius = CornerRadius(
                size.width * 0.20f,
                size.width * 0.20f
            ),
            style = Stroke(width = size.minDimension * 0.07f)
        )
    }
}

@Composable
private fun CameraGlyph(
    tint: Color,
    modifier: Modifier
) {
    Canvas(modifier) {
        val stroke = 1.8.dp.toPx()
        drawRoundRect(
            color = tint,
            topLeft = Offset(size.width * 0.15f, size.height * 0.25f),
            size = androidx.compose.ui.geometry.Size(
                size.width * 0.70f,
                size.height * 0.55f
            ),
            cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx()),
            style = Stroke(width = stroke)
        )
        drawCircle(
            color = tint,
            radius = size.minDimension * 0.15f,
            center = Offset(size.width * 0.50f, size.height * 0.52f),
            style = Stroke(width = stroke)
        )
        drawRoundRect(
            color = tint,
            topLeft = Offset(size.width * 0.28f, size.height * 0.15f),
            size = androidx.compose.ui.geometry.Size(
                size.width * 0.18f,
                size.height * 0.15f
            ),
            cornerRadius = CornerRadius(1.dp.toPx(), 1.dp.toPx())
        )
    }
}

@Composable
private fun CloudUploadGlyph(
    tint: Color,
    modifier: Modifier
) {
    Canvas(modifier) {
        val stroke = 2.2.dp.toPx()
        val w = size.width
        val h = size.height

        /*
         * A single continuous cloud outline. Build it with the Android
         * Path API and convert it to a Compose Path at draw time. This
         * avoids the previous broken overlapping-arc construction.
         */
        val cloudPath = android.graphics.Path().apply {
            moveTo(w * 0.22f, h * 0.70f)

            cubicTo(
                w * 0.12f, h * 0.70f,
                w * 0.08f, h * 0.60f,
                w * 0.11f, h * 0.51f
            )

            cubicTo(
                w * 0.14f, h * 0.42f,
                w * 0.23f, h * 0.37f,
                w * 0.32f, h * 0.39f
            )

            cubicTo(
                w * 0.34f, h * 0.27f,
                w * 0.45f, h * 0.20f,
                w * 0.55f, h * 0.22f
            )

            cubicTo(
                w * 0.67f, h * 0.24f,
                w * 0.73f, h * 0.34f,
                w * 0.73f, h * 0.43f
            )

            cubicTo(
                w * 0.82f, h * 0.42f,
                w * 0.89f, h * 0.49f,
                w * 0.89f, h * 0.58f
            )

            cubicTo(
                w * 0.89f, h * 0.66f,
                w * 0.83f, h * 0.70f,
                w * 0.75f, h * 0.70f
            )

            lineTo(w * 0.22f, h * 0.70f)
        }

        drawPath(
            path = cloudPath.asComposePath(),
            color = tint,
            style = Stroke(
                width = stroke,
                cap = StrokeCap.Round,
                join = androidx.compose.ui.graphics.StrokeJoin.Round
            )
        )

        /*
         * Clean centered upload arrow, separated from the cloud outline
         * so it reads immediately as "upload".
         */
        drawLine(
            color = tint,
            start = Offset(
                x = w * 0.50f,
                y = h * 0.86f
            ),
            end = Offset(
                x = w * 0.50f,
                y = h * 0.43f
            ),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )

        drawLine(
            color = tint,
            start = Offset(
                x = w * 0.50f,
                y = h * 0.43f
            ),
            end = Offset(
                x = w * 0.37f,
                y = h * 0.56f
            ),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )

        drawLine(
            color = tint,
            start = Offset(
                x = w * 0.50f,
                y = h * 0.43f
            ),
            end = Offset(
                x = w * 0.63f,
                y = h * 0.56f
            ),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )
    }
}
