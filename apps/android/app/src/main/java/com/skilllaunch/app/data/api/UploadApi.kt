package com.skilllaunch.app.data.api

import com.skilllaunch.app.data.model.upload.ResumeUploadResponse
import com.skilllaunch.app.data.model.upload.UploadResponse
import okhttp3.MultipartBody
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface UploadApi {

    @Multipart
    @POST("upload/resume")
    suspend fun uploadResume(
        @Part file: MultipartBody.Part
    ): ResumeUploadResponse

    @Multipart
    @POST("upload")
    suspend fun uploadFile(
        @Part file: MultipartBody.Part
    ): UploadResponse
}
