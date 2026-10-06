package com.skilllaunch.app.data.model.home

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
    val isSuspended: Boolean = false,
    val isBanned: Boolean = false
)
