package com.estilos.app

import android.app.Activity
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * Shell activity: a full-screen WebView that loads the web app from assets.
 * Reconstructed from the Estilos v1.5 APK (behaviour kept identical).
 */
class MainActivity : Activity() {

    private lateinit var web: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            loadsImagesAutomatically = true
        }
        web.webViewClient = WebViewClient()
        setContentView(web)
        web.loadUrl("file:///android_asset/index.html")
    }

    /** Back goes through the web app's own history hook; leaves the app only at the root. */
    @Deprecated("Activity.onBackPressed is fine for this single-screen shell.")
    override fun onBackPressed() {
        web.evaluateJavascript("(function(){return !!(window.estilosBack&&window.estilosBack())})()") { handled ->
            if (handled != "true") super.onBackPressed()
        }
    }
}
