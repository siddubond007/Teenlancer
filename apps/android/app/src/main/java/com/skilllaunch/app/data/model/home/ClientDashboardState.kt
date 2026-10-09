package com.skilllaunch.app.data.model.home

data class ClientDashboardSummary(
    val activeProjects: Int = 0,
    val pendingProposals: Int = 0,
    val totalSpend: Double = 0.0,
    val escrowAmount: Double = 0.0,
    val completedProjects: Int = 0,
    val unreadNotifications: Int = 0
)

data class ClientDashboardProjectCounts(
    val all: Int = 0,
    val drafts: Int = 0,
    val published: Int = 0,
    val inProgress: Int = 0,
    val completed: Int = 0,
    val cancelled: Int = 0
)

data class ClientDashboardProposalJob(
    val id: String? = null,
    val title: String? = null,
    val status: String? = null,
    val pendingProposalCount: Int = 0
)

data class ClientDashboardDeliveryApprovalItem(
    val orderId: String? = null,
    val projectId: String? = null,
    val projectTitle: String? = null,
    val studentName: String? = null,
    val amount: Double = 0.0,
    val deliverableVersion: Int? = null,
    val submittedAt: String? = null
)

data class ClientDashboardPaymentItem(
    val orderId: String? = null,
    val projectId: String? = null,
    val projectTitle: String? = null,
    val studentName: String? = null,
    val amount: Double = 0.0,
    val createdAt: String? = null
)

data class ClientDashboardAttention(
    val proposalJobs: List<ClientDashboardProposalJob> = emptyList(),
    val deliveryApprovalItems: List<ClientDashboardDeliveryApprovalItem> = emptyList(),
    val paymentItems: List<ClientDashboardPaymentItem> = emptyList()
)

data class ClientDashboardDeadline(
    val orderId: String? = null,
    val projectId: String? = null,
    val projectTitle: String? = null,
    val studentName: String? = null,
    val status: String? = null,
    val deadline: String? = null
)

data class ClientDashboardActivity(
    val id: String? = null,
    val type: String? = null,
    val message: String? = null,
    val createdAt: String? = null,
    val orderId: String? = null,
    val projectId: String? = null,
    val projectTitle: String? = null
)

data class ClientDashboardConversation(
    val orderId: String? = null,
    val projectId: String? = null,
    val projectTitle: String? = null,
    val senderName: String? = null,
    val message: String? = null,
    val createdAt: String? = null
)

data class ClientDashboardPendingReview(
    val orderId: String? = null,
    val projectId: String? = null,
    val projectTitle: String? = null,
    val studentName: String? = null,
    val totalAmount: Double = 0.0
)

data class ClientDashboardStudentProfile(
    val avatarUrl: String? = null,
    val tagline: String? = null,
    val category: String? = null,
    val hourlyRate: Double? = null
)

data class ClientDashboardRecommendedStudent(
    val id: String? = null,
    val username: String? = null,
    val fullName: String? = null,
    val averageRating: Double = 0.0,
    val totalReviews: Int = 0,
    val profile: ClientDashboardStudentProfile? = null
)

data class ClientDashboardAccountVerification(
    val status: String? = null,
    val govtIdStatus: String? = null,
    val hasGovtId: Boolean = false
)

data class ClientDashboardAccount(
    val id: String? = null,
    val fullName: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val verification: ClientDashboardAccountVerification? = null
)

data class ClientDashboardProject(
    val id: String? = null,
    val title: String? = null,
    val category: String? = null,
    val status: String? = null,
    val budget: Double = 0.0,
    val deadlineDate: String? = null,
    val timeline: String? = null,
    val proposalCount: Int = 0,
    val updatedAt: String? = null
)

data class ClientDashboardState(
    val summary: ClientDashboardSummary = ClientDashboardSummary(),
    val projectCounts: ClientDashboardProjectCounts = ClientDashboardProjectCounts(),
    val attention: ClientDashboardAttention = ClientDashboardAttention(),
    val deadlines: List<ClientDashboardDeadline> = emptyList(),
    val recentActivity: List<ClientDashboardActivity> = emptyList(),
    val recentConversations: List<ClientDashboardConversation> = emptyList(),
    val pendingReviews: List<ClientDashboardPendingReview> = emptyList(),
    val recommendedStudents: List<ClientDashboardRecommendedStudent> = emptyList(),
    val account: ClientDashboardAccount? = null,
    val activeProjects: List<ClientDashboardProject> = emptyList()
)
