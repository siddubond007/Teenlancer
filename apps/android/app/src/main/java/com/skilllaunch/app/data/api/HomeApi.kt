package com.skilllaunch.app.data.api

import com.skilllaunch.app.data.model.home.HomeState
import retrofit2.http.GET

interface HomeApi {
    @GET("home/state")
    suspend fun getHomeState(): HomeState
}
