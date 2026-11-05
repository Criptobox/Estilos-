plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.estilos.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.estilos.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 32
        versionName = "12.2"
    }

    // Release signing comes from env vars (CI secrets). Without them the
    // release build is unsigned; debug builds always work.
    val keystorePath = System.getenv("ESTILOS_KEYSTORE")
    if (keystorePath != null) {
        signingConfigs {
            create("release") {
                storeFile = file(keystorePath)
                storePassword = System.getenv("ESTILOS_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ESTILOS_KEY_ALIAS")
                keyPassword = System.getenv("ESTILOS_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (keystorePath != null) signingConfig = signingConfigs.getByName("release")
        }
    }

    // The web app lives in /web and is packaged as the APK's assets.
    sourceSets["main"].assets.srcDirs("../web")

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}
