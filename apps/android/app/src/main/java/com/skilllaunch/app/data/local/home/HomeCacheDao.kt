package com.skilllaunch.app.data.local.home

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface HomeCacheDao {
    @Query("SELECT * FROM home_state_cache WHERE user_id = :userId LIMIT 1")
    suspend fun getByUserId(userId: String): HomeCacheEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(snapshot: HomeCacheEntity)

    @Query("DELETE FROM home_state_cache WHERE user_id = :userId")
    suspend fun deleteByUserId(userId: String)
}
