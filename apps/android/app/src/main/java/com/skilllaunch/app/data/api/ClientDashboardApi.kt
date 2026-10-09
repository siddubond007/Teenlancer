package com.skilllaunch.app.data.api

import com.skilllaunch.app.data.model.home.ClientDashboardState
import retrofit2.http.GET

interface ClientDashboardApi {
    @GET("client/dashboard")
    suspend fun getClientDashboard(): ClientDashboardState
}
