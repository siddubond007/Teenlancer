package com.skilllaunch.app.feature.onboarding

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.TextButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.layout.ContentScale
import com.skilllaunch.app.feature.auth.SkillLaunchBrand
import coil3.compose.AsyncImage
import com.skilllaunch.app.R

internal data class DomainOption(
    val id: String,
    val category: String,
    val title: String,
    val imageRes: Int
)

private val FEATURED_DOMAIN_IDS = listOf(
    "web-development",
    "mobile-app-development",
    "ai-ml-data-science",
    "design-creative",
    "software-it-services",
    "digital-marketing-seo"
)

internal val STUDENT_GIG_DOMAIN_CATALOG: List<DomainOption> = listOf(
    DomainOption("web-development", "DEVELOPMENT", "Web Development", R.raw.student_domain_web),
    DomainOption("software-it-services", "DEVELOPMENT", "Software & IT Services", R.raw.student_domain_web),
    DomainOption("mobile-app-development", "DEVELOPMENT", "Mobile App Development", R.raw.student_domain_mobile),
    DomainOption("ai-ml-data-science", "TECHNOLOGY", "AI, Machine Learning & Data Science", R.raw.student_domain_ai),
    DomainOption("design-creative", "DESIGN", "Design & Creative", R.raw.student_domain_design),
    DomainOption("photography-image-editing", "DESIGN", "Photography & Image Editing", R.raw.student_domain_design),
    DomainOption("video-audio-animation", "CREATIVE", "Video, Audio & Animation", R.raw.student_domain_video),
    DomainOption("social-media-community", "MARKETING", "Social Media & Community", R.raw.student_domain_marketing),
    DomainOption("digital-marketing-seo", "MARKETING", "Digital Marketing & SEO", R.raw.student_domain_marketing),
    DomainOption("e-commerce-retail", "RETAIL", "E-commerce & Retail", R.raw.student_domain_business),
    DomainOption("writing-content-creation", "CONTENT", "Writing & Content Creation", R.raw.student_domain_content),
    DomainOption("translation-transcription", "CONTENT", "Translation & Transcription", R.raw.student_domain_content),
    DomainOption("gaming-esports", "GAMING", "Gaming & Esports", R.raw.student_domain_gaming),
    DomainOption("admin-support-operations", "SERVICES", "Admin, Support & Operations", R.raw.student_domain_business),
    DomainOption("business-finance-hr", "BUSINESS", "Business, Finance & HR", R.raw.student_domain_business),
    DomainOption("legal-compliance", "SECURITY", "Legal & Compliance", R.raw.student_domain_security),
    DomainOption("engineering-architecture-3d", "DESIGN", "Engineering, Architecture & 3D", R.raw.student_domain_design),
    DomainOption("education-tutoring-coaching", "CONTENT", "Education, Tutoring & Coaching", R.raw.student_domain_content),
    DomainOption("events-travel-local-services", "SERVICES", "Events, Travel & Local Services", R.raw.student_domain_video),
    DomainOption("telecommunications-networking", "INFRASTRUCTURE", "Telecommunications & Networking", R.raw.student_domain_mobile),
    DomainOption("health-wellness", "SERVICES", "Health & Wellness", R.raw.student_domain_business),
    DomainOption("manufacturing-product-development", "BUSINESS", "Manufacturing & Product Development", R.raw.student_domain_business),
    DomainOption("product-management-operations", "BUSINESS", "Product Management & Operations", R.raw.student_domain_business),
    DomainOption("market-research-consumer-insights", "RESEARCH", "Market Research & Consumer Insights", R.raw.student_domain_ai),
    DomainOption("public-relations-communications", "MARKETING", "Public Relations & Communications", R.raw.student_domain_marketing),
    DomainOption("career-professional-services", "CONTENT", "Career & Professional Services", R.raw.student_domain_content),
    DomainOption("government-nonprofit-services", "SERVICES", "Government & Nonprofit Services", R.raw.student_domain_business),
    DomainOption("real-estate-property-services", "BUSINESS", "Real Estate & Property Services", R.raw.student_domain_business),
    DomainOption("travel-hospitality", "SERVICES", "Travel & Hospitality", R.raw.student_domain_business),
    DomainOption("food-culinary-services", "SERVICES", "Food & Culinary Services", R.raw.student_domain_business),
    DomainOption("beauty-personal-care", "DESIGN", "Beauty & Personal Care", R.raw.student_domain_design),
    DomainOption("fashion-jewelry-accessories", "DESIGN", "Fashion, Jewelry & Accessories", R.raw.student_domain_design),
    DomainOption("scientific-technical-research", "RESEARCH", "Scientific & Technical Research", R.raw.student_domain_ai),
    DomainOption("freight-delivery-transportation", "INFRASTRUCTURE", "Freight, Delivery & Transportation", R.raw.student_domain_business),
    DomainOption("agriculture-environmental-services", "SERVICES", "Agriculture & Environmental Services", R.raw.student_domain_business),
    DomainOption("3d-printing-digital-fabrication", "INFRASTRUCTURE", "3D Printing & Digital Fabrication", R.raw.student_domain_cloud),
    DomainOption("consulting-professional-advisory", "BUSINESS", "Consulting & Professional Advisory", R.raw.student_domain_business),
    DomainOption("personal-development-hobbies", "OTHER", "Personal Development & Hobbies", R.raw.student_domain_other)
)

internal val STUDENT_GIG_FEATURED_DOMAINS: List<DomainOption> =
    FEATURED_DOMAIN_IDS.mapNotNull { id ->
        STUDENT_GIG_DOMAIN_CATALOG.firstOrNull { it.id == id }
    }

internal val studentGigDomainNames = STUDENT_GIG_DOMAIN_CATALOG.map { it.title }.toSet()

@Composable
internal fun StudentDomainSelection(
    selectedDomain: String,
    darkTheme: Boolean,
    error: String,
    saving: Boolean,
    skipConfirmation: Boolean,
    onBack: () -> Unit,
    onSelectDomain: (String) -> Unit,
    onContinue: () -> Unit,
    onConfirmSkip: () -> Unit,
    onDismissSkip: () -> Unit
) {
    var query by rememberSaveable { mutableStateOf("") }
    var showAllDomains by rememberSaveable { mutableStateOf(false) }
    val normalizedQuery = query.trim().lowercase()

    val filteredDomains = remember(normalizedQuery, showAllDomains) {
        when {
            normalizedQuery.isNotBlank() -> STUDENT_GIG_DOMAIN_CATALOG.filter { domain ->
                domain.title.contains(normalizedQuery, ignoreCase = true) ||
                    domain.category.contains(normalizedQuery, ignoreCase = true) ||
                    domain.id.replace('-', ' ').contains(normalizedQuery, ignoreCase = true)
            }
            showAllDomains -> STUDENT_GIG_DOMAIN_CATALOG
            else -> STUDENT_GIG_FEATURED_DOMAINS
        }
    }

    val pageBackground = if (darkTheme) Color(0xFF1A1A1D) else Color(0xFFF8F7FA)
    val searchBackground = if (darkTheme) Color(0xFF262629) else Color(0xFFE8E7EA)
    val cardBackground = if (darkTheme) Color(0xFF303034) else Color(0xFFE0DFE2)
    val textPrimary = if (darkTheme) Color.White else Color(0xFF17171A)
    val textMuted = if (darkTheme) Color(0xFFAAA9AE) else Color(0xFF77767D)
    val lavender = Color(0xFFD4C6FF)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(pageBackground)
            .systemBarsPadding()
    ) {
        OnboardingHeader(
            darkTheme = darkTheme,
            onSkip = onBack,
            enabled = !saving
        )

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 28.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            repeat(4) { index ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(5.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(
                            if (index == 0) {
                                lavender
                            } else if (darkTheme) {
                                Color(0xFF3A393E)
                            } else {
                                Color(0xFFD8D7DA)
                            }
                        )
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Column(
            modifier = Modifier.padding(horizontal = 28.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "What's your\nsuperpower?",
                color = textPrimary,
                style = TextStyle(
                    fontFamily = FontFamily.Serif,
                    fontSize = 40.sp,
                    lineHeight = 43.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = (-0.9).sp
                )
            )
            Text(
                text = "Choose your primary domain.",
                color = textMuted,
                fontSize = 16.sp,
                lineHeight = 21.sp
            )
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            contentPadding = PaddingValues(
                horizontal = 28.dp,
                vertical = 8.dp
            ),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item(key = "domain-search") {
                DomainSearchField(
                    value = query,
                    darkTheme = darkTheme,
                    onValueChange = {
                        query = it
                        if (it.isNotBlank()) {
                            showAllDomains = true
                        }
                    },
                    onClear = { query = "" }
                )
            }

            item(key = "domain-discovery") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Text(
                            text = if (showAllDomains || normalizedQuery.isNotBlank()) {
                                "All 38 domains"
                            } else {
                                "Featured domains"
                            },
                            color = textPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (showAllDomains || normalizedQuery.isNotBlank()) {
                                "Search or browse the full marketplace catalog"
                            } else {
                                "6 popular starting points"
                            },
                            color = textMuted,
                            fontSize = 11.sp,
                            maxLines = 1,
                            overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                        )
                    }

                    Spacer(modifier = Modifier.weight(1f))

                    Box(
                        modifier = Modifier
                            .width(124.dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(lavender.copy(alpha = if (darkTheme) 0.12f else 0.18f))
                            .border(
                                width = 1.dp,
                                color = lavender.copy(alpha = 0.65f),
                                shape = RoundedCornerShape(999.dp)
                            )
                            .clickable {
                                showAllDomains = !showAllDomains
                                if (!showAllDomains) {
                                    query = ""
                                }
                            }
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = if (showAllDomains) {
                                "Show featured"
                            } else {
                                "Explore all 38"
                            },
                            color = if (darkTheme) Color.White else Color(0xFF5C48B9),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            softWrap = false,
                            overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                        )
                    }
                }
            }
            filteredDomains.chunked(2).forEach { row ->
                item(key = row.joinToString("|")) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        row.forEach { domain ->
                            StudentDomainCard(
                                domain = domain,
                                selected = selectedDomain == domain.title,
                                darkTheme = darkTheme,
                                cardBackground = cardBackground,
                                textPrimary = textPrimary,
                                textMuted = textMuted,
                                onClick = { onSelectDomain(domain.title) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                        if (row.size == 1) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }

            if (filteredDomains.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 28.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No domains found. Try a broader search.",
                            color = textMuted,
                            fontSize = 14.sp
                        )
                    }
                }
            }

            item {
                Text(
                    text = if (normalizedQuery.isBlank() && !showAllDomains) {
                        "Showing featured domains. Explore all " + STUDENT_GIG_DOMAIN_CATALOG.size + " marketplace domains when you need a broader choice."
                    } else {
                        "Showing SkillLaunch marketplace domains that match your selection or search."
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 18.dp, vertical = 8.dp),
                    color = textMuted,
                    fontSize = 13.sp,
                    lineHeight = 18.sp,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                )
            }
            item {
                Spacer(modifier = Modifier.height(12.dp))
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(pageBackground)
                .padding(horizontal = 24.dp)
                .padding(top = 6.dp, bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (selectedDomain.isNotBlank()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(
                            if (darkTheme) Color(0xFF262629)
                            else Color(0xFFEDEBF0)
                        )
                        .border(
                            width = 1.dp,
                            color = lavender.copy(alpha = 0.50f),
                            shape = RoundedCornerShape(14.dp)
                        )
                        .padding(horizontal = 12.dp, vertical = 9.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(24.dp)
                            .clip(CircleShape)
                            .background(lavender),
                        contentAlignment = Alignment.Center
                    ) {
                        CheckGlyph(
                            tint = Color(0xFF17171A),
                            modifier = Modifier.size(14.dp)
                        )
                    }

                    Spacer(modifier = Modifier.size(9.dp))

                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(1.dp)
                    ) {
                        Text(
                            text = "Selected domain",
                            color = textMuted,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = selectedDomain,
                            color = textPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1
                        )
                    }
                }
            } else {
                Text(
                    text = "Choose one primary domain to continue.",
                    modifier = Modifier.fillMaxWidth(),
                    color = textMuted,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            if (error.isNotBlank()) {
                Text(
                    text = error,
                    modifier = Modifier.fillMaxWidth(),
                    color = Color(0xFFD95C5C),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Button(
                onClick = onContinue,
                enabled = !saving,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(28.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = lavender,
                    contentColor = Color(0xFF17171A),
                    disabledContainerColor = lavender.copy(alpha = 0.55f),
                    disabledContentColor = Color(0xFF17171A).copy(alpha = 0.65f)
                ),
                contentPadding = PaddingValues(horizontal = 24.dp)
            ) {
                Text(
                    text = "Continue  →",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        if (skipConfirmation) {
            AlertDialog(
                onDismissRequest = onDismissSkip,
                title = { Text("Skip profile setup?") },
                text = {
                    Text("Your progress will be saved. You can return to Profile later and finish the setup.")
                },
                confirmButton = {
                    TextButton(
                        onClick = onConfirmSkip,
                        enabled = !saving
                    ) { Text("Skip for now") }
                },
                dismissButton = {
                    TextButton(onClick = onDismissSkip) { Text("Keep setting up") }
                }
            )
        }
    }
}

@Composable
private fun SearchGlyph(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val stroke = 1.9.dp.toPx()
        val radius = size.minDimension * 0.31f
        val center = Offset(size.width * 0.43f, size.height * 0.43f)
        drawCircle(color = tint, radius = radius, center = center, style = Stroke(width = stroke))
        drawLine(
            color = tint,
            start = Offset(size.width * 0.68f, size.height * 0.68f),
            end = Offset(size.width * 0.90f, size.height * 0.90f),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )
    }
}

@Composable
private fun CloseGlyph(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val stroke = 1.8.dp.toPx()
        drawLine(color = tint, start = Offset(size.width * 0.26f, size.height * 0.26f), end = Offset(size.width * 0.74f, size.height * 0.74f), strokeWidth = stroke, cap = StrokeCap.Round)
        drawLine(color = tint, start = Offset(size.width * 0.74f, size.height * 0.26f), end = Offset(size.width * 0.26f, size.height * 0.74f), strokeWidth = stroke, cap = StrokeCap.Round)
    }
}

@Composable
private fun CheckGlyph(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val stroke = 1.9.dp.toPx()
        val path = Path().apply {
            moveTo(size.width * 0.16f, size.height * 0.52f)
            lineTo(size.width * 0.40f, size.height * 0.76f)
            lineTo(size.width * 0.84f, size.height * 0.25f)
        }
        drawPath(path = path, color = tint, style = Stroke(width = stroke, cap = StrokeCap.Round))
    }
}

@Composable
private fun DomainSearchField(
    value: String,
    darkTheme: Boolean,
    onValueChange: (String) -> Unit,
    onClear: () -> Unit
) {
    val searchBackground = if (darkTheme) Color(0xFF262629) else Color(0xFFE8E7EA)
    val textPrimary = if (darkTheme) Color.White else Color(0xFF1B1B1F)
    val textMuted = if (darkTheme) Color(0xFF8F8E94) else Color(0xFF8D8C92)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .clip(RoundedCornerShape(30.dp))
            .background(searchBackground)
            .padding(horizontal = 17.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        SearchGlyph(tint = textMuted, modifier = Modifier.size(21.dp))
        Spacer(modifier = Modifier.size(11.dp))
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.weight(1f),
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            textStyle = TextStyle(color = textPrimary, fontSize = 16.sp),
            decorationBox = { inner ->
                if (value.isBlank()) {
                    Text(
                        text = "Search all 38 domains...",
                        color = textMuted,
                        fontSize = 16.sp,
                        maxLines = 1
                    )
                }
                inner()
            }
        )
        if (value.isNotBlank()) {
            IconButton(onClick = onClear, modifier = Modifier.size(32.dp)) {
                CloseGlyph(tint = textMuted, modifier = Modifier.size(17.dp))
            }
        }
    }
}

@Composable
private fun StudentDomainCard(
    domain: DomainOption,
    selected: Boolean,
    darkTheme: Boolean,
    cardBackground: Color,
    textPrimary: Color,
    textMuted: Color,
    onClick: () -> Unit,
    modifier: Modifier
) {
    val selectedBackground = if (darkTheme) Color(0xFF34343A) else Color(0xFFF8F6FC)
    val borderColor = if (selected) Color(0xFFD4C6FF) else Color.Transparent

    Column(
        modifier = modifier
.height(196.dp)
            .clip(RoundedCornerShape(22.dp))
            .background(if (selected) selectedBackground else cardBackground)
            .border(
                width = if (selected) 2.dp else 0.dp,
                color = borderColor,
                shape = RoundedCornerShape(22.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 11.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(7.dp)
    ) {
        Box(
            modifier = Modifier
                .size(114.dp)
                .clip(RoundedCornerShape(17.dp))
                .background(Color.Transparent)
        ) {
            AsyncImage(
                model = domain.imageRes,
                contentDescription = domain.title + " abstract illustration",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
            if (selected) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(6.dp)
                        .size(23.dp)
                        .shadow(5.dp, CircleShape)
                        .clip(CircleShape)
                        .background(if (darkTheme) Color(0xFF1A1A1D) else Color.White)
                        .border(1.dp, Color(0xFFD4C6FF), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    CheckGlyph(
                        tint = if (darkTheme) Color.White else Color(0xFF6F56D9),
                        modifier = Modifier.size(15.dp)
                    )
                }
            }
        }

        Text(
            text = domain.category,
            modifier = Modifier.fillMaxWidth(),
            color = textMuted,
            fontSize = 9.sp,
            lineHeight = 10.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 0.3.sp,
            maxLines = 1,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )

        Text(
            text = domain.title,
            modifier = Modifier.fillMaxWidth(),
            color = textPrimary,
            fontSize = 14.5.sp,
            lineHeight = 17.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 2,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
    }
}



