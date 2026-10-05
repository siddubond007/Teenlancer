plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.skilllaunch.app"
    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "com.skilllaunch.app"
        minSdk = 26
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        debug {
            val apiBaseUrl = providers.environmentVariable("SKILLLAUNCH_API_BASE_URL")
                .orElse("http://10.0.2.2:5000/api/")
                .get()
                .trimEnd('/') + "/"

            buildConfigField(
                "String",
                "API_BASE_URL",
                "\"${apiBaseUrl.replace("\\", "\\\\").replace("\"", "\\\"")}\""
            )
        }

        release {
            val apiBaseUrl = providers.environmentVariable("SKILLLAUNCH_API_BASE_URL")
                .orElse("https://configure-skilllaunch-api.invalid/api/")
                .get()
                .trimEnd('/') + "/"

            buildConfigField(
                "String",
                "API_BASE_URL",
                "\"${apiBaseUrl.replace("\\", "\\\\").replace("\"", "\\\"")}\""
            )

            optimization {
                enable = false
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

tasks.named("preReleaseBuild") {
    doFirst {
        val apiBaseUrl = System.getenv("SKILLLAUNCH_API_BASE_URL")
        require(!apiBaseUrl.isNullOrBlank() && apiBaseUrl.startsWith("https://")) {
            "SKILLLAUNCH_API_BASE_URL must be set to an HTTPS URL for release builds."
        }
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.material3)
    implementation("androidx.compose.material:material-icons-extended")
    implementation(libs.androidx.navigation3.runtime)
    implementation(libs.androidx.navigation3.ui)
    implementation(libs.retrofit)
    implementation(libs.retrofitConverterGson)
    implementation(libs.okhttp)
    implementation(libs.okhttpLogging)
    implementation(libs.datastorePreferences)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.coil.compose)
    implementation(libs.coil.network.okhttp)
    implementation(libs.coil.svg)
    implementation(libs.androidx.media3.exoplayer)
    implementation(libs.androidx.media3.ui)
    implementation(libs.androidx.media3.ui.compose.material3)
    testImplementation(libs.junit)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
    debugImplementation(libs.androidx.compose.ui.tooling)
}