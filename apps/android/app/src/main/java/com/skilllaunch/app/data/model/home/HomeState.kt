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
    val isSuspended: Boolean = false,
    val isBanned: Boolean = false
)
