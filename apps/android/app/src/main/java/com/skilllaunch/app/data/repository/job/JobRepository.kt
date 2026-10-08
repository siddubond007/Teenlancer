package com.skilllaunch.app.data.repository.job

import com.google.gson.Gson
import com.skilllaunch.app.data.api.JobApi
import com.skilllaunch.app.data.model.auth.ApiErrorResponse
import com.skilllaunch.app.data.model.job.CreateJobRequest
import com.skilllaunch.app.data.model.job.CreateJobResponse
import com.skilllaunch.app.data.model.job.JobListResponse
import com.skilllaunch.app.data.model.job.SubmitBidRequest
import com.skilllaunch.app.data.model.job.SubmitBidResponse
import retrofit2.HttpException

class JobRepository(
    private val api: JobApi
) {
    private val gson = Gson()

    suspend fun getJobs(query: String? = null): Result<JobListResponse> =
        runCatching {
            api.getJobs(query = query?.trim()?.ifBlank { null })
        }.recoverCatching {
            throw mapError(it, "Unable to load available projects.")
        }

    suspend fun createJob(request: CreateJobRequest): Result<CreateJobResponse> =
        runCatching {
            api.createJob(request)
        }.recoverCatching {
            throw mapError(it, "Unable to create the project.")
        }

    suspend fun submitBid(
        jobId: String,
        request: SubmitBidRequest
    ): Result<SubmitBidResponse> =
        runCatching {
            api.submitBid(jobId, request)
        }.recoverCatching {
            throw mapError(it, "Unable to submit your proposal.")
        }

    private fun mapError(
        error: Throwable,
        fallback: String
    ): IllegalStateException {
        if (error is HttpException) {
            val body = error.response()?.errorBody()?.string()
            val message = body?.let {
                runCatching {
                    gson.fromJson(it, ApiErrorResponse::class.java)
                }.getOrNull()
            }?.error?.takeIf { value -> value.isNotBlank() }

            if (message != null) return IllegalStateException(message)
        }

        return IllegalStateException(error.message ?: fallback)
    }
}
