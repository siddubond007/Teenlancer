package com.skilllaunch.app.data.repository.gig

import com.skilllaunch.app.data.api.GigApi
import com.skilllaunch.app.data.model.gig.Gig

class GigRepository(
    private val gigApi: GigApi
) {

    suspend fun getGigs(): Result<List<Gig>> {
        return runCatching {
            gigApi.getGigs()
        }.recoverCatching { error ->
            throw Exception(
                error.message ?: "Unable to load gigs right now"
            )
        }
    }

    suspend fun getGigById(gigId: String): Result<Gig> {
        return runCatching {
            gigApi.getGigById(gigId)
        }.recoverCatching { error ->
            throw Exception(
                error.message ?: "Unable to load this Gig right now"
            )
        }
    }
}
