package com.skilllaunch.app.data.local.home

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Private per-account snapshot of the Home API response.
 *
 * Keeping the complete DTO together preserves the action queue, active workspace,
 * and financial summary without changing the existing Home API contract.
 */
@Entity(tableName = "home_state_cache")
data class HomeCacheEntity(
    @PrimaryKey
    @ColumnInfo(name = "user_id")
    val userId: String,
    @ColumnInfo(name = "snapshot_json")
    val snapshotJson: String,
    @ColumnInfo(name = "cached_at_epoch_millis")
    val cachedAtEpochMillis: Long
)
