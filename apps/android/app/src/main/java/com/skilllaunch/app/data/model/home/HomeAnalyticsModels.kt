package com.skilllaunch.app.data.model.home

data class HomeAnalyticsTotals(
    val impressions: Int = 0,
    val views: Int = 0,
    val clicks: Int = 0,
    val orders: Int = 0,
    val conversionRate: Double = 0.0
)

data class HomeGigAnalytics(
    val gigId: String = "",
    val title: String = "",
    val category: String? = null,
    val impressions: Int = 0,
    val views: Int = 0,
    val clicks: Int = 0,
    val orders: Int = 0,
    val conversionRate: Double = 0.0
)

data class HomeAnalyticsResponse(
    val periodDays: Int = 7,
    val periodStart: String? = null,
    val periodEnd: String? = null,
    val publishedGigCount: Int = 0,
    val totals: HomeAnalyticsTotals = HomeAnalyticsTotals(),
    val gigs: List<HomeGigAnalytics> = emptyList()
)
