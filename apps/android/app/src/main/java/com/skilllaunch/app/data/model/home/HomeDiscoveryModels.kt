package com.skilllaunch.app.data.model.home

data class HomeDiscoveryResponse(
    val role: String? = null,
    val discoveryCategory: String? = null,
    val recommendedJobs: List<HomeRecommendedJob> = emptyList(),
    val topVerifiedGigs: List<HomeGigRecommendation> = emptyList()
)

data class HomeProfileNudge(
    val id: String? = null,
    val type: String? = null,
    val title: String? = null,
    val subtitle: String? = null,
    val actionLabel: String? = null
)
