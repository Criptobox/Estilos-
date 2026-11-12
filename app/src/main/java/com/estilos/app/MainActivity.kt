package com.estilos.app

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast

/**
 * Shell activity: a full-screen WebView that loads the web app from assets.
 * Reconstructed from the Estilos v1.5 APK; 12.53 adds file saving (SAF), a file chooser and
 * a stricter WebView (no file-system access; assets stay reachable).
 */
class MainActivity : Activity() {

    private lateinit var web: WebView
    private var pendingBytes: ByteArray? = null
    private var fileCallback: ValueCallback<Array<Uri>>? = null

    /** Puente para las exportaciones: el navegador del WebView no descarga blobs, así que la web entrega aquí el archivo. */
    inner class Bridge {
        @JavascriptInterface
        fun saveFile(name: String, mime: String, base64: String) {
            val bytes = try {
                Base64.decode(base64, Base64.DEFAULT)
            } catch (e: IllegalArgumentException) {
                return
            }
            runOnUiThread {
                pendingBytes = bytes
                val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = if (mime.isBlank()) "application/octet-stream" else mime
                    putExtra(Intent.EXTRA_TITLE, name)
                }
                try {
                    startActivityForResult(intent, REQ_SAVE)
                } catch (e: ActivityNotFoundException) {
                    pendingBytes = null
                    Toast.makeText(this@MainActivity, "No hay una app para guardar archivos.", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            // Los assets (file:///android_asset) siguen disponibles; el resto del sistema de archivos, no.
            allowFileAccess = false
            allowContentAccess = false
            @Suppress("DEPRECATION")
            allowFileAccessFromFileURLs = false
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = false
            loadsImagesAutomatically = true
        }
        web.addJavascriptInterface(Bridge(), "EstilosAndroid")
        // Los enlaces http(s) se abren en el navegador; la app solo navega por sus assets.
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url
                if (url.scheme == "http" || url.scheme == "https") {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url.toString())))
                    return true
                }
                return false
            }
        }
        // Sin esto, los <input type="file"> (fotos, importar proyectos) no abren nada dentro de la app.
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                view: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                return try {
                    startActivityForResult(params.createIntent(), REQ_PICK)
                    true
                } catch (e: ActivityNotFoundException) {
                    fileCallback = null
                    callback.onReceiveValue(null)
                    false
                }
            }
        }
        setContentView(web)
        web.loadUrl("file:///android_asset/index.html")
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        when (requestCode) {
            REQ_SAVE -> {
                val bytes = pendingBytes
                pendingBytes = null
                val uri = data?.data
                if (resultCode == RESULT_OK && uri != null && bytes != null) {
                    val saved = try {
                        contentResolver.openOutputStream(uri)?.use { it.write(bytes) } != null
                    } catch (e: Exception) {
                        false
                    }
                    Toast.makeText(this, if (saved) "Archivo guardado." else "No se pudo guardar el archivo.", Toast.LENGTH_LONG).show()
                }
            }
            REQ_PICK -> {
                val callback = fileCallback
                fileCallback = null
                callback?.onReceiveValue(
                    if (resultCode == RESULT_OK) WebChromeClient.FileChooserParams.parseResult(resultCode, data) else null
                )
            }
            else -> @Suppress("DEPRECATION") super.onActivityResult(requestCode, resultCode, data)
        }
    }

    /** Back goes through the web app's own history hook; leaves the app only at the root. */
    @Deprecated("Activity.onBackPressed is fine for this single-screen shell.")
    override fun onBackPressed() {
        web.evaluateJavascript("(function(){return !!(window.estilosBack&&window.estilosBack())})()") { handled ->
            if (handled != "true") super.onBackPressed()
        }
    }

    private companion object {
        const val REQ_SAVE = 4101
        const val REQ_PICK = 4102
    }
}
