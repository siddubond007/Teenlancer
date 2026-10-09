package com.skilllaunch.app.data.local.home

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [HomeCacheEntity::class],
    version = 1,
    exportSchema = false
)
abstract class HomeCacheDatabase : RoomDatabase() {
    abstract fun homeCacheDao(): HomeCacheDao

    companion object {
        @Volatile
        private var instance: HomeCacheDatabase? = null

        fun getInstance(context: Context): HomeCacheDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    HomeCacheDatabase::class.java,
                    "skilllaunch-home-cache.db"
                ).build().also { instance = it }
            }
    }
}
