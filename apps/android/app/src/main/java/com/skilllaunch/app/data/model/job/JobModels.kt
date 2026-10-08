package com.skilllaunch.app.data.model.job

data class Job(
    val id: String? = null,
    val title: String? = null,
    val category: String? = null,
    val subcategory: String? = null,
    val projectType: String? = null,
    val description: String? = null,
    val skills: List<String> = emptyList(),
    val budget: Double = 0.0,
    val fixedBudget: Double? = null,
    val minimumBudget: Double? = null,
    val maximumBudget: Double? = null,
    val budgetType: String? = null,
    val timeline: String? = null,
    val locationPreferences: String? = null,
    val languagePreferences: String? = null,
    val createdAt: String? = null,
    val client: JobClient? = null,
    val bids: List<JobBidCount> = emptyList(),
    val viewerBid: JobViewerBid? = null
)

data class JobClient(
    val id: String? = null,
    val fullName: String? = null
)

data class JobBidCount(
    val id: String? = null
)

data class JobViewerBid(
    val id: String? = null,
    val proposedAmount: Double? = null,
    val deliveryDays: Int? = null,
    val status: String? = null,
    val createdAt: String? = null
)

data class JobPagination(
    val total: Int = 0,
    val page: Int = 1,
    val limit: Int = 30,
    val totalPages: Int = 0
)

data class JobListResponse(
    val jobs: List<Job> = emptyList(),
    val pagination: JobPagination = JobPagination()
)

data class SubmitBidRequest(
    val proposedAmount: Double,
    val deliveryDays: Int,
    val coverLetter: String
)

data class SubmitBidResponse(
    val message: String? = null,
    val bid: SubmittedBid? = null,
    val remainingBids: Int? = null
)

data class SubmittedBid(
    val id: String? = null,
    val jobId: String? = null,
    val proposedAmount: Double? = null,
    val deliveryDays: Int? = null,
    val status: String? = null
)


data class CreateJobRequest(
    val title: String,
    val category: String,
    val projectType: String = "FIXED",
    val description: String,
    val skills: List<String> = emptyList(),
    val budget: Double,
    val timeline: String = "1_MONTH",
    val visibility: String = "PUBLIC",
    val status: String = "OPEN"
)

data class CreateJobResponse(
    val message: String? = null,
    val job: Job? = null
)
