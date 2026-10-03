package com.skilllaunch.app.data.model.upload

data class ResumeUploadResponse(
    val message: String? = null,
    val url: String? = null,
    val fileName: String? = null,
    val bytes: Long? = null
)

data class UploadResponse(
    val url: String? = null,
    val publicId: String? = null,
    val resourceType: String? = null,
    val format: String? = null,
    val bytes: Long? = null
)
