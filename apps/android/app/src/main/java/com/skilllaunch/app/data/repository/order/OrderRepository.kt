package com.skilllaunch.app.data.repository.order

import com.google.gson.Gson
import com.skilllaunch.app.data.api.OrderApi
import com.skilllaunch.app.data.model.auth.ApiErrorResponse
import com.skilllaunch.app.data.model.order.OrderActionResponse
import com.skilllaunch.app.data.model.order.OrderSummary
import com.skilllaunch.app.data.model.order.OrderMessage
import com.skilllaunch.app.data.model.order.SubmitDeliverableRequest
import kotlinx.coroutines.CancellationException
import retrofit2.HttpException

class OrderRepository(
    private val api: OrderApi
) {
    private val gson = Gson()

    suspend fun getMyOrders(): Result<List<OrderSummary>> =
        safeCall("Unable to load your orders.") { api.getMyOrders() }

    suspend fun getOrder(orderId: String): Result<OrderSummary> =
        safeCall("Unable to load this workspace.") { api.getOrder(orderId) }

    suspend fun getCheckoutConfig(orderId: String): Result<com.skilllaunch.app.data.model.order.OrderCheckoutConfig> =
        safeCall("Unable to prepare escrow checkout.") { api.getCheckoutConfig(orderId) }

    suspend fun verifyPayment(
        orderId: String,
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String
    ): Result<OrderActionResponse> =
        safeCall("Payment succeeded but escrow verification could not be completed.") {
            api.verifyPayment(
                orderId,
                mapOf(
                    "razorpay_order_id" to razorpayOrderId,
                    "razorpay_payment_id" to razorpayPaymentId,
                    "razorpay_signature" to razorpaySignature
                )
            )
        }

    suspend fun submitDeliverable(
        orderId: String,
        request: SubmitDeliverableRequest
    ): Result<OrderActionResponse> =
        safeCall("Unable to submit the delivery.") { api.submitDeliverable(orderId, request) }

    suspend fun getMessages(orderId: String): Result<List<OrderMessage>> =
        safeCall("Unable to load conversation.") { api.getMessages(orderId) }

    suspend fun sendMessage(
        orderId: String,
        content: String,
        fileUrl: String? = null
    ): Result<OrderMessage> =
        safeCall("Unable to send message.") {
            api.sendMessage(
                orderId = orderId,
                request = buildMap {
                    if (content.trim().isNotBlank()) put("content", content.trim())
                    if (!fileUrl.isNullOrBlank()) put("fileUrl", fileUrl.trim())
                }
            )
        }

    suspend fun approveOrder(orderId: String): Result<OrderActionResponse> =
        safeCall("Unable to approve this delivery.") { api.approveOrder(orderId) }

    suspend fun requestRevision(
        orderId: String,
        reason: String
    ): Result<OrderActionResponse> =
        safeCall("Unable to request a revision.") {
            api.requestRevision(orderId, mapOf("reason" to reason))
        }

    private suspend fun <T> safeCall(
        fallback: String,
        block: suspend () -> T
    ): Result<T> = try {
        Result.success(block())
    } catch (cancelled: CancellationException) {
        throw cancelled
    } catch (error: Exception) {
        Result.failure(mapError(error, fallback))
    }

    private fun mapError(
        error: Throwable,
        fallback: String
    ): IllegalStateException {
        if (error is HttpException) {
            val body = error.response()?.errorBody()?.string()
            val message = body?.let {
                runCatching {
                    gson.fromJson(it, ApiErrorResponse::class.java)
                }.getOrNull()
            }?.error?.takeIf { value -> value.isNotBlank() }

            if (message != null) return IllegalStateException(message)
        }

        return IllegalStateException(error.message ?: fallback)
    }
}
