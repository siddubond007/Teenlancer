package com.skilllaunch.app.data.api

import com.skilllaunch.app.data.model.gig.Gig
import retrofit2.http.GET

interface GigApi {

    @GET("gigs")
    suspend fun getGigs(): List<Gig>

    @GET("gigs/{gigId}")
    suspend fun getGigById(
        @retrofit2.http.Path("gigId") gigId: String
    ): Gig
}
