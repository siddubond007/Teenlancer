package com.skilllaunch.app.core.payment

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.atomic.AtomicLong

data class PaymentVerificationEvent(
    val eventId: Long,
    val orderId: String,
    val success: Boolean,
    val message: String
)

/**
 * Bridges Razorpay's Activity callbacks back to the currently open Compose order workspace.
 * Only the local SkillLaunch order ID is retained; payment signatures stay in memory and are
 * passed straight to the authenticated backend verification endpoint.
 */
object PaymentCoordinator {
    private val eventIds = AtomicLong(0L)
    private val mutableVerificationEvent = MutableStateFlow<PaymentVerificationEvent?>(null)

    val verificationEvent = mutableVerificationEvent.asStateFlow()

    @Volatile
    private var pendingLocalOrderId: String? = null

    @Synchronized
    fun setPendingOrderId(orderId: String) {
        require(orderId.isNotBlank()) { "Order ID is required before checkout." }
        check(pendingLocalOrderId == null) { "A payment checkout is already in progress." }
        pendingLocalOrderId = orderId
    }

    @Synchronized
    fun takePendingOrderId(): String? {
        val orderId = pendingLocalOrderId
        pendingLocalOrderId = null
        return orderId
    }

    @Synchronized
    fun clearPendingOrderId(orderId: String) {
        if (pendingLocalOrderId == orderId) {
            pendingLocalOrderId = null
        }
    }

    fun publishVerificationResult(
        orderId: String,
        success: Boolean,
        message: String
    ) {
        if (orderId.isBlank()) return
        mutableVerificationEvent.value = PaymentVerificationEvent(
            eventId = eventIds.incrementAndGet(),
            orderId = orderId,
            success = success,
            message = message
        )
    }

    fun clearVerificationEvent(eventId: Long) {
        if (mutableVerificationEvent.value?.eventId == eventId) {
            mutableVerificationEvent.value = null
        }
    }
}
