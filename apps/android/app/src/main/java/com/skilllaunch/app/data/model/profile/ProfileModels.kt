package com.skilllaunch.app.data.model.profile

data class ProfileUser(
    val id: String? = null,
    val username: String? = null,
    val email: String? = null,
    val firstName: String? = null,
    val middleName: String? = null,
    val lastName: String? = null,
    val fullName: String? = null,
    val role: String? = null,
    val isMinor: Boolean? = null,
    val age: Int? = null,
    val dob: String? = null,
    val profile: ProfileData? = null
)

data class ProfileData(
    val tagline: String? = null,
    val bio: String? = null,
    val college: String? = null,
    val category: String? = null,
    val hourlyRate: Double? = null,
    val avatarUrl: String? = null,
    val coverUrl: String? = null,
    val skills: List<String>? = null,
    val responseTimeExpectation: String? = null,
    val githubUrl: String? = null,
    val youtubeUrl: String? = null,
    val drivePortfolio: String? = null,
    val resumeUrl: String? = null,
    val resumeFileName: String? = null,
    val onboardingCompleted: Boolean? = null,
    val onboardingStatus: String? = null,
    val onboardingData: OnboardingData? = null
)

data class ProfileUpdateRequest(
    val tagline: String? = null,
    val bio: String? = null,
    val college: String? = null,
    val category: String? = null,
    val hourlyRate: Double? = null,
    val skills: List<String>? = null,
    val avatarUrl: String? = null,
    val responseTimeExpectation: String? = null,
    val githubUrl: String? = null,
    val youtubeUrl: String? = null,
    val drivePortfolio: String? = null,
    val resumeUrl: String? = null,
    val resumeFileName: String? = null
)

data class OnboardingUpdateRequest(
    val tagline: String? = null,
    val bio: String? = null,
    val category: String? = null,
    val skills: List<String>? = null,
    val avatarUrl: String? = null,
    val responseTimeExpectation: String? = null,
    val githubUrl: String? = null,
    val youtubeUrl: String? = null,
    val drivePortfolio: String? = null,
    val onboardingCompleted: Boolean? = null,
    val onboardingStatus: String? = null,
    val onboardingData: OnboardingData? = null
)

data class ProfileUpdateResponse(
    val message: String? = null,
    val profile: ProfileData? = null
)



data class OnboardingData(
    val version: Int = 1,
    val role: String? = null,
    val primaryDomain: String? = null,
    val selectedSkills: List<String> = emptyList(),
    val githubUrl: String? = null,
    val youtubeUrl: String? = null,
    val portfolioUrl: String? = null,
    val academicStatus: String? = null,
    val graduationMonth: Int? = null,
    val graduationYear: Int? = null,
    val availability: String? = null,
    val clientType: String? = null,
    val hiringCategories: List<String> = emptyList(),
    val hiringIntent: String? = null,
    val projectScope: String? = null,
    val companyOrProjectName: String? = null,
    val budgetPhilosophy: String? = null
)
