package com.skilllaunch.app.data.api

import com.skilllaunch.app.data.model.gig.Gig
import com.skilllaunch.app.data.model.gig.GigAnalyticsEventRequest
import com.skilllaunch.app.data.model.gig.GigAnalyticsEventResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface GigApi {

    @GET("gigs")
    suspend fun getGigs(): List<Gig>

    @GET("gigs/{gigId}")
    suspend fun getGigById(
        @retrofit2.http.Path("gigId") gigId: String
    ): Gig

    @POST("gigs/{gigId}/analytics")
    suspend fun recordAnalyticsEvent(
        @Path("gigId") gigId: String,
        @Body event: GigAnalyticsEventRequest
    ): GigAnalyticsEventResponse
}
