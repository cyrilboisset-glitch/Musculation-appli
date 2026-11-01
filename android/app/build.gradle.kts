plugins {
    id("com.android.application")
}

android {
    namespace = "fr.cyril.muscumaison"
    compileSdk = 34

    defaultConfig {
        applicationId = "fr.cyril.muscumaison"
        minSdk = 24
        targetSdk = 34
        // Le workflow passe le numéro de build GitHub pour que chaque APK remplace le précédent.
        versionCode = (project.findProperty("versionCode") as String?)?.toInt() ?: 1
        versionName = "1." + versionCode
    }

    // Signature : si la clé est fournie par les secrets GitHub (ANDROID_KEYSTORE_*), l'APK garde la même signature
    // d'une version à l'autre et se met à jour sans perdre les données. Sinon, signature de test (debug).
    val ks = file("release.jks")
    signingConfigs {
        if (ks.exists()) create("release") {
            storeFile = ks
            storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias = System.getenv("ANDROID_KEY_ALIAS")
            keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (ks.exists()) signingConfigs.getByName("release") else signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
