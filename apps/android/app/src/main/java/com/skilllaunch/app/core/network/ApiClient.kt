package com.skilllaunch.app.core.network

import com.skilllaunch.app.BuildConfig
import com.skilllaunch.app.core.session.SessionStore
import com.skilllaunch.app.data.api.AuthApi
import com.skilllaunch.app.data.api.GigApi
import com.skilllaunch.app.data.api.HomeApi
import com.skilllaunch.app.data.api.NotificationApi
import com.skilllaunch.app.data.api.UserApi
import com.skilllaunch.app.data.api.UploadApi
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {

    private val BASE_URL: String = BuildConfig.API_BASE_URL

    fun authApi(sessionStore: SessionStore): AuthApi {
        return createRetrofit(sessionStore)
            .create(AuthApi::class.java)
    }

    fun userApi(sessionStore: SessionStore): UserApi {
        return createRetrofit(sessionStore)
            .create(UserApi::class.java)
    }

    fun gigApi(sessionStore: SessionStore): GigApi {
        return createRetrofit(sessionStore)
            .create(GigApi::class.java)
    }

    fun homeApi(sessionStore: SessionStore): HomeApi {
        return createRetrofit(sessionStore)
            .create(HomeApi::class.java)
    }

    fun uploadApi(sessionStore: SessionStore): UploadApi {
        return createRetrofit(sessionStore)
            .create(UploadApi::class.java)
    }

    fun notificationApi(sessionStore: SessionStore): NotificationApi {
        return createRetrofit(sessionStore)
            .create(NotificationApi::class.java)
    }

    private fun createRetrofit(sessionStore: SessionStore): Retrofit {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(sessionStore))
            .addInterceptor(loggingInterceptor)
            .build()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
}
