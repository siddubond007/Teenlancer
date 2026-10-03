package com.skilllaunch.app.feature.auth

import java.time.LocalDate
import java.time.Period
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

val dobStorageFormatter: DateTimeFormatter =
    DateTimeFormatter.ISO_LOCAL_DATE

fun calculateAgeFromDob(dobString: String): Int? {
    if (dobString.isBlank()) return null

    return try {
        val dob = LocalDate.parse(dobString, dobStorageFormatter)
        val today = LocalDate.now()

        if (dob.isAfter(today)) {
            null
        } else {
            Period.between(dob, today).years
        }
    } catch (_: DateTimeParseException) {
        null
    }
}

fun dobToPickerMillis(dobString: String): Long? {
    if (dobString.isBlank()) return null

    return try {
        val dob = LocalDate.parse(dobString, dobStorageFormatter)

        dob.atStartOfDay(ZoneOffset.UTC)
            .toInstant()
            .toEpochMilli()
    } catch (_: DateTimeParseException) {
        null
    }
}

fun formatDobForDisplay(dobString: String): String {
    if (dobString.isBlank()) return ""

    return try {
        val dob = LocalDate.parse(dobString, dobStorageFormatter)
        dob.format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
    } catch (_: DateTimeParseException) {
        dobString
    }
}
