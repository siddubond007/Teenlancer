package com.skilllaunch.app.data.repository.home

import com.google.gson.Gson
import com.skilllaunch.app.data.api.HomeApi
import com.skilllaunch.app.data.local.home.HomeCacheDao
import com.skilllaunch.app.data.local.home.HomeCacheEntity
import com.skilllaunch.app.data.model.auth.ApiErrorResponse
import com.skilllaunch.app.data.model.home.HomeDiscoveryResponse
import com.skilllaunch.app.data.model.home.HomeAnalyticsResponse
import com.skilllaunch.app.data.model.home.HomeProfileNudge
import com.skilllaunch.app.data.model.home.HomeState
import retrofit2.HttpException
import java.io.IOException

data class HomeStateLoadResult(
    val state: HomeState,
    val fromCache: Boolean
)

class HomeRepository(
    private val homeApi: HomeApi,
    private val cacheDao: HomeCacheDao
) {
    private val gson = Gson()

    /**
     * Read the last snapshot first so Home can render while the network is revalidated.
     * The caller must provide the authenticated account ID to prevent cross-account reads.
     */
    suspend fun getCachedHomeState(userId: String): HomeState? =
        readCachedHome(userId)?.state

    suspend fun getHomeState(userId: String): Result<HomeStateLoadResult> {
        return try {
            val state = homeApi.getHomeState()
            if (userId.isNotBlank()) {
                // A Room write failure must never turn a successful network response into a failure.
                runCatching {
                    cacheDao.upsert(
                        HomeCacheEntity(
                            userId = userId,
                            snapshotJson = gson.toJson(state),
                            cachedAtEpochMillis = System.currentTimeMillis()
                        )
                    )
                }
            }
            Result.success(
                HomeStateLoadResult(
                    state = state,
                    fromCache = false
                )
            )
        } catch (exception: HttpException) {
            val message = httpErrorMessage(
                exception = exception,
                fallbackMessage = "Unable to load your Home right now."
            )

            if (exception.code() >= 500) {
                readCachedHome(userId)?.let { return Result.success(it) }
            }

            Result.failure(IllegalStateException(message, exception))
        } catch (exception: IOException) {
            readCachedHome(userId)?.let { return Result.success(it) }

            Result.failure(
                IllegalStateException(
                    "Network connection failed. Please check your connection and try again.",
                    exception
                )
            )
        } catch (exception: Exception) {
            Result.failure(
                IllegalStateException(
                    exception.message ?: "Unable to load your Home right now.",
                    exception
                )
            )
        }
    }

    /**
     * Do not keep account data locally once the API explicitly rejects the session/role.
     */
    suspend fun clearCachedHomeState(userId: String) {
        if (userId.isBlank()) return
        runCatching { cacheDao.deleteByUserId(userId) }
    }

    suspend fun getHomeDiscovery(): Result<HomeDiscoveryResponse> =
        executeRequest("Personalized discovery is temporarily unavailable.") {
            homeApi.getHomeDiscovery()
        }

    suspend fun getHomeAnalytics(): Result<HomeAnalyticsResponse> =
        executeRequest("Marketplace analytics are temporarily unavailable.") {
            homeApi.getHomeAnalytics()
        }

    suspend fun getProfileNudges(): Result<List<HomeProfileNudge>> =
        executeRequest("Your profile suggestions could not be loaded right now.") {
            homeApi.getProfileNudges()
        }

    private suspend fun readCachedHome(userId: String): HomeStateLoadResult? {
        if (userId.isBlank()) return null

        return try {
            val row = cacheDao.getByUserId(userId) ?: return null
            val state = gson.fromJson(row.snapshotJson, HomeState::class.java) ?: return null

            // A malformed or wrongly keyed snapshot must not be displayed for another account.
            if (!state.id.isNullOrBlank() && state.id != userId) return null

            HomeStateLoadResult(
                state = state,
                fromCache = true
            )
        } catch (_: Exception) {
            null
        }
    }

    private fun httpErrorMessage(
        exception: HttpException,
        fallbackMessage: String
    ): String {
        val body = exception.response()?.errorBody()?.string()
        val parsed = body?.let {
            runCatching { gson.fromJson(it, ApiErrorResponse::class.java) }.getOrNull()
        }

        return parsed?.error?.takeIf { it.isNotBlank() }
            ?: parsed?.message?.takeIf { it.isNotBlank() }
            ?: when (exception.code()) {
                401 -> "Your session has expired. Please sign in again."
                403 -> "Your account is not allowed to open the marketplace Home."
                404 -> "Your Home state could not be found."
                else -> fallbackMessage
            }
    }

    private suspend fun <T> executeRequest(
        fallbackMessage: String,
        request: suspend () -> T
    ): Result<T> {
        return try {
            Result.success(request())
        } catch (exception: HttpException) {
            val body = exception.response()?.errorBody()?.string()
            val parsed = body?.let {
                runCatching { gson.fromJson(it, ApiErrorResponse::class.java) }.getOrNull()
            }

            val message = parsed?.error?.takeIf { it.isNotBlank() }
                ?: parsed?.message?.takeIf { it.isNotBlank() }
                ?: when (exception.code()) {
                    401 -> "Your session has expired. Please sign in again."
                    403 -> "This account is not allowed to access this Home feature."
                    404 -> "The requested Home resource was not found."
                    else -> fallbackMessage
                }

            Result.failure(IllegalStateException(message, exception))
        } catch (exception: IOException) {
            Result.failure(
                IllegalStateException(
                    "Network connection failed. Please check your connection and try again.",
                    exception
                )
            )
        } catch (exception: Exception) {
            Result.failure(IllegalStateException(exception.message ?: fallbackMessage, exception))
        }
    }
}
