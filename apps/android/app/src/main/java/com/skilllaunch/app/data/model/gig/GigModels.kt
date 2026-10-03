package com.skilllaunch.app.data.model.gig

data class Gig(
    val id: String? = null,
    val sellerId: String? = null,
    val title: String? = null,
    val category: String? = null,
    val categoryId: String? = null,
    val subcategoryId: String? = null,
    val description: String? = null,
    val coverImage: String? = null,
    val isTiered: Boolean = false,
    val status: String? = null,
    val packages: List<GigPackage> = emptyList(),
    val extras: List<GigExtra> = emptyList(),
    val seller: GigSeller? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class GigPackage(
    val id: String? = null,
    val tierName: String? = null,
    val price: Double? = null,
    val deliveryDays: Int? = null,
    val revisions: Int? = null,
    val description: String? = null
)

data class GigExtra(
    val id: String? = null,
    val title: String? = null,
    val price: Double? = null
)

data class GigSeller(
    val id: String? = null,
    val fullName: String? = null,
    val age: Int? = null,
    val profile: GigSellerProfile? = null
)

data class GigSellerProfile(
    val avatarUrl: String? = null,
    val tagline: String? = null,
    val bio: String? = null,
    val college: String? = null,
    val category: String? = null,
    val hourlyRate: Double? = null,
    val skills: List<String> = emptyList(),
    val badges: List<String> = emptyList(),
    val responseTimeExpectation: String? = null
)
