package com.skilllaunch.app.data.api

import com.skilllaunch.app.data.model.home.HomeState
import com.skilllaunch.app.data.model.home.HomeDiscoveryResponse
import com.skilllaunch.app.data.model.home.HomeProfileNudge
import retrofit2.http.GET

interface HomeApi {
    @GET("home/state")
    suspend fun getHomeState(): HomeState

    @GET("v1/home/discovery")
    suspend fun getHomeDiscovery(): HomeDiscoveryResponse

    @GET("v1/home/profile-nudges")
    suspend fun getProfileNudges(): List<HomeProfileNudge>
}
