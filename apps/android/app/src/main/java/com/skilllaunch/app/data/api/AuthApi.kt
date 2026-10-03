package com.skilllaunch.app.data.api

import com.skilllaunch.app.data.model.auth.LoginRequest
import com.skilllaunch.app.data.model.auth.LoginResponse
import com.skilllaunch.app.data.model.auth.MeResponse
import com.skilllaunch.app.data.model.auth.RegisterRequest
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {

    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): LoginResponse

    @POST("auth/register")
    suspend fun register(
        @Body request: RegisterRequest
    ): LoginResponse

    @GET("auth/me")
    suspend fun getMe(): MeResponse
}
