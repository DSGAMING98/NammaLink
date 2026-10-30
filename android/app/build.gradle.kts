import java.io.File
import java.net.URI
import org.gradle.api.DefaultTask
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.TaskAction

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
}

abstract class VerifyReleaseSigningTask : DefaultTask() {
    @get:Input
    abstract val signingConfigured: Property<Boolean>

    @get:Input
    @get:Optional
    abstract val keyStorePath: Property<String>

    @TaskAction
    fun verify() {
        if (!signingConfigured.get()) {
            throw GradleException(
                "Release signing is not configured. Set NAMMALINK_KEYSTORE_PATH, " +
                    "NAMMALINK_KEYSTORE_PASSWORD, NAMMALINK_KEY_ALIAS, and NAMMALINK_KEY_PASSWORD.",
            )
        }

        if (!File(keyStorePath.get()).isFile) {
            throw GradleException("NAMMALINK_KEYSTORE_PATH does not point to a readable file.")
        }
    }
}

abstract class VerifyProductionEndpointTask : DefaultTask() {
    @get:Input
    abstract val endpoint: Property<String>

    @TaskAction
    fun verify() {
        val value = endpoint.get().trim()
        val uri = runCatching { URI(value) }.getOrNull()
        val host = uri?.host?.lowercase()
        val privateIpv4 = host?.let {
            it.startsWith("10.") || it.startsWith("192.168.") || it.startsWith("169.254.") ||
                Regex("^172\\.(1[6-9]|2[0-9]|3[01])\\.").containsMatchIn(it)
        } == true
        val nonPublicHost = host.isNullOrBlank() || host.endsWith(".invalid") || host.endsWith(".local") ||
            host == "localhost" || host == "127.0.0.1" || host == "0.0.0.0" || host == "::1" ||
            host == "10.0.2.2" || privateIpv4
        if (uri?.scheme != "https" || nonPublicHost) {
            throw GradleException(
                "Presentation and release builds require a public HTTPS NAMMALINK_API_BASE_URL; loopback and emulator hosts are rejected.",
            )
        }
    }
}

val releaseSigningVariables = mapOf(
    "NAMMALINK_KEYSTORE_PATH" to providers.environmentVariable("NAMMALINK_KEYSTORE_PATH").orNull,
    "NAMMALINK_KEYSTORE_PASSWORD" to providers.environmentVariable("NAMMALINK_KEYSTORE_PASSWORD").orNull,
    "NAMMALINK_KEY_ALIAS" to providers.environmentVariable("NAMMALINK_KEY_ALIAS").orNull,
    "NAMMALINK_KEY_PASSWORD" to providers.environmentVariable("NAMMALINK_KEY_PASSWORD").orNull,
)
val configuredReleaseSigningVariables = releaseSigningVariables.filterValues { !it.isNullOrBlank() }
val releaseSigningConfigured = configuredReleaseSigningVariables.size == releaseSigningVariables.size
val productionApiBaseUrl = providers.gradleProperty("NAMMALINK_API_BASE_URL")
    .orElse(providers.environmentVariable("NAMMALINK_API_BASE_URL"))
    .orElse("https://api.invalid")
val escapedProductionApiBaseUrl = productionApiBaseUrl.get().replace("\\", "\\\\").replace("\"", "\\\"").trimEnd('/')

if (configuredReleaseSigningVariables.isNotEmpty() && !releaseSigningConfigured) {
    val missing = releaseSigningVariables.filterValues { it.isNullOrBlank() }.keys.joinToString()
    throw GradleException("Incomplete NammaLink release signing configuration. Missing: $missing")
}

android {
    namespace = "in.nammalink.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "in.nammalink.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
        buildConfigField("String", "API_BASE_URL", "\"http://127.0.0.1:3000\"")
        buildConfigField("boolean", "IS_PRESENTATION_BUILD", "false")
        manifestPlaceholders["usesCleartextTraffic"] = "false"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    signingConfigs {
        if (releaseSigningConfigured) {
            create("release") {
                storeFile = file(releaseSigningVariables.getValue("NAMMALINK_KEYSTORE_PATH")!!)
                storePassword = releaseSigningVariables.getValue("NAMMALINK_KEYSTORE_PASSWORD")
                keyAlias = releaseSigningVariables.getValue("NAMMALINK_KEY_ALIAS")
                keyPassword = releaseSigningVariables.getValue("NAMMALINK_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        debug {
            manifestPlaceholders["usesCleartextTraffic"] = "true"
        }
        create("presentation") {
            initWith(getByName("release"))
            applicationIdSuffix = ".presentation"
            versionNameSuffix = "-presentation"
            signingConfig = signingConfigs.getByName("debug")
            buildConfigField("String", "API_BASE_URL", "\"$escapedProductionApiBaseUrl\"")
            buildConfigField("boolean", "IS_PRESENTATION_BUILD", "true")
            manifestPlaceholders["usesCleartextTraffic"] = "false"
            matchingFallbacks += listOf("release")
        }
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (releaseSigningConfigured) {
                signingConfig = signingConfigs.getByName("release")
            }
            buildConfigField("String", "API_BASE_URL", "\"$escapedProductionApiBaseUrl\"")
            buildConfigField("boolean", "IS_PRESENTATION_BUILD", "true")
            manifestPlaceholders["usesCleartextTraffic"] = "false"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

val verifyReleaseSigning by tasks.registering(VerifyReleaseSigningTask::class) {
    group = "verification"
    description = "Fails release packaging unless all external signing variables and the keystore are present."
    signingConfigured.set(releaseSigningConfigured)
    releaseSigningVariables["NAMMALINK_KEYSTORE_PATH"]?.let {
        keyStorePath.set(it)
    }
}

val verifyProductionEndpoint by tasks.registering(VerifyProductionEndpointTask::class) {
    group = "verification"
    description = "Rejects loopback, emulator-only, and cleartext API URLs for distributable builds."
    endpoint.set(productionApiBaseUrl)
}

tasks.matching { it.name == "assembleRelease" || it.name == "bundleRelease" }.configureEach {
    dependsOn(verifyReleaseSigning, verifyProductionEndpoint)
}

tasks.matching { it.name == "assemblePresentation" }.configureEach {
    dependsOn(verifyProductionEndpoint)
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2025.05.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.activity:activity-compose:1.10.1")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
