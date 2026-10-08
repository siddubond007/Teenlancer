package com.skilllaunch.app.data.repository.order

import com.google.gson.Gson
import com.skilllaunch.app.data.api.OrderApi
import com.skilllaunch.app.data.model.auth.ApiErrorResponse
import com.skilllaunch.app.data.model.order.OrderActionResponse
import com.skilllaunch.app.data.model.order.OrderSummary
import com.skilllaunch.app.data.model.order.OrderMessage
import com.skilllaunch.app.data.model.order.SubmitDeliverableRequest
import retrofit2.HttpException

class OrderRepository(
    private val api: OrderApi
) {
    private val gson = Gson()

    suspend fun getMyOrders(): Result<List<OrderSummary>> =
        runCatching { api.getMyOrders() }
            .recoverCatching {
                throw mapError(it, "Unable to load your orders.")
            }

    suspend fun getOrder(orderId: String): Result<OrderSummary> =
        runCatching { api.getOrder(orderId) }
            .recoverCatching {
                throw mapError(it, "Unable to load this workspace.")
            }

    suspend fun submitDeliverable(
        orderId: String,
        request: SubmitDeliverableRequest
    ): Result<OrderActionResponse> =
        runCatching { api.submitDeliverable(orderId, request) }
            .recoverCatching {
                throw mapError(it, "Unable to submit the delivery.")
            }

    suspend fun getMessages(orderId: String): Result<List<OrderMessage>> =
        runCatching { api.getMessages(orderId) }
            .recoverCatching {
                throw mapError(it, "Unable to load conversation.")
            }

    suspend fun sendMessage(
        orderId: String,
        content: String,
        fileUrl: String? = null
    ): Result<OrderMessage> =
        runCatching {
            api.sendMessage(
                orderId = orderId,
                request = buildMap {
                    if (content.trim().isNotBlank()) put("content", content.trim())
                    if (!fileUrl.isNullOrBlank()) put("fileUrl", fileUrl.trim())
                }
            )
        }.recoverCatching {
            throw mapError(it, "Unable to send message.")
        }

    suspend fun approveOrder(orderId: String): Result<OrderActionResponse> =
        runCatching { api.approveOrder(orderId) }
            .recoverCatching {
                throw mapError(it, "Unable to approve this delivery.")
            }

    suspend fun requestRevision(
        orderId: String,
        reason: String
    ): Result<OrderActionResponse> =
        runCatching {
            api.requestRevision(orderId, mapOf("reason" to reason))
        }.recoverCatching {
            throw mapError(it, "Unable to request a revision.")
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
