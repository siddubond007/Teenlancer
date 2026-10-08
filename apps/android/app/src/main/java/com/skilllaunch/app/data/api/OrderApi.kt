package com.skilllaunch.app.data.api

import com.skilllaunch.app.data.model.order.OrderSummary
import com.skilllaunch.app.data.model.order.OrderMessage
import com.skilllaunch.app.data.model.order.SubmitDeliverableRequest
import com.skilllaunch.app.data.model.order.OrderActionResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface OrderApi {

    @GET("orders")
    suspend fun getMyOrders(): List<OrderSummary>

    @GET("orders/{orderId}")
    suspend fun getOrder(
        @Path("orderId") orderId: String
    ): OrderSummary

    @POST("orders/{orderId}/deliver")
    suspend fun submitDeliverable(
        @Path("orderId") orderId: String,
        @Body request: SubmitDeliverableRequest
    ): OrderActionResponse

    @POST("orders/{orderId}/approve")
    suspend fun approveOrder(
        @Path("orderId") orderId: String
    ): OrderActionResponse

    @GET("orders/{orderId}/messages")
    suspend fun getMessages(
        @Path("orderId") orderId: String
    ): List<OrderMessage>

    @POST("orders/{orderId}/messages")
    suspend fun sendMessage(
        @Path("orderId") orderId: String,
        @Body request: Map<String, String>
    ): OrderMessage

    @POST("orders/{orderId}/request-revision")
    suspend fun requestRevision(
        @Path("orderId") orderId: String,
        @Body request: Map<String, String>
    ): OrderActionResponse
}
