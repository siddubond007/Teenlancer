package com.skilllaunch.app.data.model.home

data class HomeActiveWorkspace(
    val id: String? = null,
    val title: String? = null,
    val counterpartName: String? = null,
    val counterpartAvatarUrl: String? = null,
    val status: String? = null,
    val escrowStatus: String? = null,
    val deadline: String? = null,
    val progressPercent: Int = 0
)

data class HomeRecommendedJob(
    val id: String? = null,
    val title: String? = null,
    val budgetLabel: String? = null,
    val skills: List<String> = emptyList(),
    val createdAt: String? = null
)

data class HomeGigRecommendation(
    val id: String? = null,
    val title: String? = null,
    val sellerName: String? = null,
    val sellerAvatarUrl: String? = null,
    val rating: Double = 0.0,
    val startingPrice: Int = 0,
    val coverImage: String? = null
)

data class HomeActionQueueItem(
    val id: String? = null,
    val orderId: String? = null,
    val type: String? = null,
    val title: String? = null,
    val subtitle: String? = null,
    val actionLabel: String? = null,
    val dueAt: String? = null
)

data class HomeState(
    val id: String? = null,
    val firstName: String? = null,
    val role: String? = null,
    val avatarUrl: String? = null,
    val financialSummary: Int = 0,
    val financialLabel: String? = null,
    val companyOrProjectName: String? = null,
    val verificationApproved: Boolean = false,
    val profileComplete: Boolean = false,
    val proofOfWorkComplete: Boolean = false,
    val hasGig: Boolean = false,
    val hasProposal: Boolean = false,
    val activeWorkspace: HomeActiveWorkspace? = null,
    val recommendedJobs: List<HomeRecommendedJob> = emptyList(),
    val discoveryCategory: String? = null,
    val topVerifiedGigs: List<HomeGigRecommendation> = emptyList(),
    val unreadNotifications: Int = 0,
    val actionQueue: List<HomeActionQueueItem> = emptyList(),
    val isSuspended: Boolean = false,
    val isBanned: Boolean = false
)
