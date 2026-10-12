package com.skilllaunch.app.data.repository.job

import com.google.gson.Gson
import com.skilllaunch.app.data.api.JobApi
import com.skilllaunch.app.data.model.auth.ApiErrorResponse
import com.skilllaunch.app.data.model.job.CreateJobRequest
import com.skilllaunch.app.data.model.job.CreateJobResponse
import com.skilllaunch.app.data.model.job.Job
import com.skilllaunch.app.data.model.job.JobListResponse
import com.skilllaunch.app.data.model.job.SubmitBidRequest
import com.skilllaunch.app.data.model.job.SubmitBidResponse
import kotlinx.coroutines.CancellationException
import retrofit2.HttpException

class JobRepository(
    private val api: JobApi
) {
    private val gson = Gson()

    suspend fun getJobs(query: String? = null): Result<JobListResponse> =
        safeCall("Unable to load available projects.") {
            api.getJobs(query = query?.trim()?.ifBlank { null })
        }

    /**
     * Loads every page returned by the public jobs API.
     * The backend caps each page at 100 items, so larger feeds are fetched in batches.
     */
    suspend fun getAllJobs(query: String? = null): Result<JobListResponse> =
        safeCall("Unable to load available projects.") {
            val normalizedQuery = query?.trim()?.ifBlank { null }
            val firstPage = api.getJobs(
                query = normalizedQuery,
                page = 1,
                limit = 100
            )
            val combinedJobs = firstPage.jobs.toMutableList()
            var page = 2
            val lastPage = firstPage.pagination.totalPages.coerceAtMost(10)

            while (page <= lastPage) {
                val nextPage = api.getJobs(
                    query = normalizedQuery,
                    page = page,
                    limit = 100
                )
                if (nextPage.jobs.isEmpty()) break
                combinedJobs.addAll(nextPage.jobs)
                page += 1
            }

            val uniqueJobs = combinedJobs.fold(mutableListOf<Job>()) { collected, job ->
                // Only deduplicate records with IDs; separate records with missing IDs stay visible.
                if (job.id.isNullOrBlank() || collected.none { it.id == job.id }) {
                    collected.add(job)
                }
                collected
            }
            firstPage.copy(
                jobs = uniqueJobs,
                pagination = firstPage.pagination.copy(
                    page = 1,
                    limit = uniqueJobs.size,
                    totalPages = if (uniqueJobs.isEmpty()) 0 else 1
                )
            )
        }

    suspend fun getPublicJob(jobId: String): Result<Job> =
        safeCall("Unable to load this project.") {
            api.getPublicJob(jobId)
        }

    suspend fun getClientProject(jobId: String): Result<Job> =
        safeCall("Unable to load this project and its proposals.") {
            api.getClientProject(jobId)
        }

    suspend fun shortlistBid(jobId: String, bidId: String): Result<String> =
        safeCall("Unable to shortlist this proposal.") {
            api.shortlistBid(jobId, bidId).message ?: "Proposal shortlisted."
        }

    suspend fun rejectBid(jobId: String, bidId: String): Result<String> =
        safeCall("Unable to reject this proposal.") {
            api.rejectBid(jobId, bidId).message ?: "Proposal rejected."
        }

    suspend fun createJob(request: CreateJobRequest): Result<CreateJobResponse> =
        safeCall("Unable to create the project.") {
            api.createJob(request)
        }

    suspend fun submitBid(
        jobId: String,
        request: SubmitBidRequest
    ): Result<SubmitBidResponse> =
        safeCall("Unable to submit your proposal.") {
            api.submitBid(jobId, request)
        }

    private suspend fun <T> safeCall(
        fallback: String,
        block: suspend () -> T
    ): Result<T> = try {
        Result.success(block())
    } catch (cancelled: CancellationException) {
        throw cancelled
    } catch (error: Exception) {
        Result.failure(mapError(error, fallback))
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
