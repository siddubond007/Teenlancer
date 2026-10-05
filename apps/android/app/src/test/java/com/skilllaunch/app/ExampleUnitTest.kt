package com.skilllaunch.app

import com.google.gson.Gson
import com.skilllaunch.app.data.model.profile.OnboardingData
import com.skilllaunch.app.data.model.profile.OnboardingUpdateRequest
import com.skilllaunch.app.data.model.profile.ProfileUpdateRequest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ProfileContractTest {

    private val gson = Gson()

    @Test
    fun profile_update_request_does_not_contain_onboarding_state() {
        val json = gson.toJson(
            ProfileUpdateRequest(
                tagline = "Designer",
                bio = "Profile bio",
                category = "Design"
            )
        )

        assertFalse(json.contains("onboardingCompleted"))
        assertFalse(json.contains("onboardingStatus"))
        assertFalse(json.contains("onboardingData"))
    }

    @Test
    fun onboarding_update_request_contains_server_controlled_state() {
        val json = gson.toJson(
            OnboardingUpdateRequest(
                onboardingCompleted = true,
                onboardingStatus = "COMPLETED",
                onboardingData = OnboardingData(
                    role = "STUDENT_FREELANCER",
                    primaryDomain = "Design",
                    selectedSkills = listOf("Figma")
                )
            )
        )

        val parsed = gson.fromJson(json, Map::class.java)

        assertEquals(true, parsed["onboardingCompleted"])
        assertEquals("COMPLETED", parsed["onboardingStatus"])
        assertTrue(parsed["onboardingData"] is Map<*, *>)
    }
}
