package com.skilllaunch.app.data.api

import com.skilllaunch.app.data.model.profile.ProfileUpdateRequest
import com.skilllaunch.app.data.model.profile.ProfileUpdateResponse
import com.skilllaunch.app.data.model.profile.ProfileUser
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PUT
import retrofit2.http.Path

interface UserApi {

    @GET("users/profile/me")
    suspend fun getMyProfile(): ProfileUser

    @GET("users/{userId}")
    suspend fun getUserProfile(
        @Path("userId") userId: String
    ): ProfileUser

    @PUT("users/profile")
    suspend fun updateProfile(
        @Body request: ProfileUpdateRequest
    ): ProfileUpdateResponse
}
