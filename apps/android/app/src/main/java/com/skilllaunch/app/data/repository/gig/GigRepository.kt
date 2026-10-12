package com.skilllaunch.app.data.repository.gig

import com.skilllaunch.app.data.api.GigApi
import com.skilllaunch.app.data.model.gig.Gig
import com.skilllaunch.app.data.model.gig.GigAnalyticsEventRequest
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class GigRepository(
    private val gigApi: GigApi
) {
    // This repository is kept by the authenticated app shell. Using its own scope
    // allows click telemetry to survive Explore's navigation entry being removed.
    private val analyticsScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    suspend fun getGigs(): Result<List<Gig>> =
        safeCall("Unable to load gigs right now") { gigApi.getGigs() }

    suspend fun getGigById(gigId: String): Result<Gig> =
        safeCall("Unable to load this Gig right now") { gigApi.getGigById(gigId) }

    /**
     * Best-effort analytics collection; callers must never block the UI on a failed event.
     */
    suspend fun recordAnalyticsEvent(
        gigId: String,
        type: String,
        eventId: String
    ): Result<Boolean> = safeCall("Unable to record gig analytics.") {
        gigApi.recordAnalyticsEvent(
            gigId = gigId,
            event = GigAnalyticsEventRequest(
                type = type,
                eventId = eventId
            )
        ).recorded
    }

    /**
     * Best-effort event collection that is not cancelled when navigation removes
     * the Explore screen immediately after a card tap.
     */
    fun recordAnalyticsEventInBackground(
        gigId: String,
        type: String,
        eventId: String
    ) {
        analyticsScope.launch {
            recordAnalyticsEvent(gigId, type, eventId)
        }
    }

    private suspend fun <T> safeCall(
        fallback: String,
        block: suspend () -> T
    ): Result<T> = try {
        Result.success(block())
    } catch (cancelled: CancellationException) {
        throw cancelled
    } catch (error: Exception) {
        Result.failure(IllegalStateException(error.message ?: fallback, error))
    }
}
