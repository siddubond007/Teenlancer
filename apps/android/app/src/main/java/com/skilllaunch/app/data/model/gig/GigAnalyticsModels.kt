package com.skilllaunch.app.data.model.gig

/**
 * A single analytics event emitted by a marketplace surface.
 * eventId makes retries safe when the same visible impression is sent twice.
 */
data class GigAnalyticsEventRequest(
    val type: String,
    val eventId: String,
    val metadata: Map<String, String>? = null
)

data class GigAnalyticsEventResponse(
    val recorded: Boolean = false,
    val duplicate: Boolean = false,
    val ignored: String? = null
)
