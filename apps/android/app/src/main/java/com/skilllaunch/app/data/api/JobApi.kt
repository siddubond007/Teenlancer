package com.skilllaunch.app.data.api

import com.skilllaunch.app.data.model.job.Job
import com.skilllaunch.app.data.model.job.JobListResponse
import com.skilllaunch.app.data.model.job.SubmitBidRequest
import com.skilllaunch.app.data.model.job.SubmitBidResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface JobApi {

    @GET("jobs")
    suspend fun getJobs(
        @Query("q") query: String? = null,
        @Query("minBudget") minBudget: Int? = null,
        @Query("maxBudget") maxBudget: Int? = null,
        @Query("skills") skills: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 30
    ): JobListResponse

    @GET("jobs/public/{jobId}")
    suspend fun getPublicJob(
        @Path("jobId") jobId: String
    ): Job

    @POST("jobs/{jobId}/bids")
    suspend fun submitBid(
        @Path("jobId") jobId: String,
        @Body request: SubmitBidRequest
    ): SubmitBidResponse
}
