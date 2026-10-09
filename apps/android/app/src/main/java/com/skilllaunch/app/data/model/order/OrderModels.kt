package com.skilllaunch.app.data.model.order

data class OrderPerson(
    val id: String? = null,
    val fullName: String? = null,
    val age: Int? = null
)

data class OrderDeliverable(
    val id: String? = null,
    val version: Int? = null,
    val reviewStatus: String? = null,
    val submittedAt: String? = null,
    val message: String? = null,
    val fileUrls: List<String> = emptyList(),
    val driveLinks: List<String> = emptyList()
)

data class OrderSummary(
    val id: String? = null,
    val clientId: String? = null,
    val sellerId: String? = null,
    val gigId: String? = null,
    val jobId: String? = null,
    val totalAmount: Double = 0.0,
    val platformFee: Double = 0.0,
    val sellerEarnings: Double = 0.0,
    val status: String? = null,
    val deadline: String? = null,
    val requirements: String? = null,
    val autoApproveAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val client: OrderPerson? = null,
    val seller: OrderPerson? = null,
    val job: OrderJob? = null,
    val gig: OrderGig? = null,
    val deliverables: List<OrderDeliverable> = emptyList()
)

data class OrderJob(
    val id: String? = null,
    val title: String? = null
)

data class OrderGig(
    val id: String? = null,
    val title: String? = null
)

data class SubmitDeliverableRequest(
    val fileUrls: List<String> = emptyList(),
    val driveLinks: List<String> = emptyList(),
    val message: String = ""
)

data class OrderActionResponse(
    val message: String? = null,
    val order: OrderSummary? = null
)


data class OrderMessage(
    val id: String? = null,
    val orderId: String? = null,
    val senderId: String? = null,
    val recipientId: String? = null,
    val content: String? = null,
    val fileUrl: String? = null,
    val createdAt: String? = null,
    val sender: OrderPerson? = null
)


data class OrderCheckoutConfig(
    val orderId: String = "",
    val razorpayOrderId: String = "",
    val keyId: String = "",
    val amountPaise: Long = 0L,
    val currency: String = "INR",
    val name: String = "SkillLaunch",
    val description: String = "Fund escrow for your accepted custom offer",
    val isTestMode: Boolean = false,
    val prefillName: String? = null,
    val prefillEmail: String? = null,
    val prefillContact: String? = null
)
