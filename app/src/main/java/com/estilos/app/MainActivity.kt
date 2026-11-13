package com.estilos.app

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.view.WindowInsets
import android.widget.FrameLayout
import android.widget.Toast
import okhttp3.Call
import okhttp3.Callback
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.io.InputStream
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import android.window.OnBackInvokedDispatcher

/**
 * Shell activity: a full-screen WebView that loads the web app from assets.
 * Reconstructed from the Estilos v1.5 APK; 12.53 adds file saving (SAF), a file chooser and
 * a stricter WebView (no file-system access; assets stay reachable).
 */
class MainActivity : Activity() {

    private lateinit var web: WebView
    private var pendingBytes: ByteArray? = null
    private var fileCallback: ValueCallback<Array<Uri>>? = null

    private val httpClient by lazy { OkHttpClient.Builder().followRedirects(true).followSslRedirects(true).build() }
    private val httpCalls = ConcurrentHashMap<Int, Call>()

    private fun readCapped(stream: InputStream, max: Int = 5_000_000): ByteArray {
        val out = ByteArrayOutputStream()
        val buf = ByteArray(16384)
        var total = 0
        while (true) {
            val n = stream.read(buf)
            if (n < 0) break
            total += n
            if (total > max) break
            out.write(buf, 0, n)
        }
        return out.toByteArray()
    }

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

        /** Portapapeles por la app: navigator.clipboard no siempre funciona en el WebView. Solo lo llama la web local, al tocar un botón. */
        @JavascriptInterface
        fun copyText(text: String): Boolean = try {
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            cm.setPrimaryClip(ClipData.newPlainText("Estilos", text.take(200_000)))
            true
        } catch (e: Exception) {
            false
        }

        @JavascriptInterface
        fun readText(): String = try {
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = cm.primaryClip
            if (clip != null && clip.itemCount > 0) (clip.getItemAt(0).coerceToText(this@MainActivity)?.toString() ?: "").take(200_000) else ""
        } catch (e: Exception) {
            ""
        }

        /**
         * Peticiones https por la app (sin CORS). La web las pide con httpRequest y recibe la respuesta en
         * window.__nativeHttpDone(id, estado, cuerpoEnBase64, error). Solo https; respuesta limitada a 5 MB.
         */
        @JavascriptInterface
        fun httpRequest(id: Int, method: String, url: String, headersJson: String, body: String, timeoutMs: Int) {
            fun reply(status: Int, bytes: ByteArray, err: String) {
                val b64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                runOnUiThread { web.evaluateJavascript("window.__nativeHttpDone($id,$status,'$b64',${JSONObject.quote(err)})", null) }
            }
            val parsed = url.toHttpUrlOrNull()
            if (parsed == null || !parsed.isHttps) { reply(0, ByteArray(0), "Solo se permiten direcciones https."); return }
            try {
                val rb = Request.Builder().url(parsed)
                val h = JSONObject(headersJson)
                h.keys().forEach { k -> rb.header(k, h.getString(k)) }
                val m = method.uppercase()
                val needsBody = m == "POST" || m == "PUT" || m == "PATCH"
                val type = (if (h.has("Content-Type")) h.getString("Content-Type") else "application/json").toMediaTypeOrNull()
                rb.method(m, if (needsBody) body.toRequestBody(type) else null)
                val client = httpClient.newBuilder().callTimeout(timeoutMs.coerceIn(1000, 120000).toLong(), TimeUnit.MILLISECONDS).build()
                val call = client.newCall(rb.build())
                httpCalls[id] = call
                call.enqueue(object : Callback {
                    override fun onFailure(call: Call, e: IOException) { httpCalls.remove(id); reply(0, ByteArray(0), e.message ?: "Sin conexión") }
                    override fun onResponse(call: Call, response: Response) {
                        httpCalls.remove(id)
                        response.use { r -> reply(r.code, r.body?.byteStream()?.let { readCapped(it) } ?: ByteArray(0), "") }
                    }
                })
            } catch (e: Exception) {
                reply(0, ByteArray(0), e.message ?: "Petición no válida")
            }
        }

        @JavascriptInterface
        fun httpCancel(id: Int) { httpCalls.remove(id)?.cancel() }
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
        // Con targetSdk 35+ la app se dibuja bajo las barras del sistema: se reserva su espacio (y el del teclado).
        val root = FrameLayout(this)
        root.addView(web, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        root.setOnApplyWindowInsetsListener { view, insets ->
            if (Build.VERSION.SDK_INT >= 30) {
                val bars = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.ime())
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            } else {
                @Suppress("DEPRECATION")
                view.setPadding(insets.systemWindowInsetLeft, insets.systemWindowInsetTop, insets.systemWindowInsetRight, insets.systemWindowInsetBottom)
            }
            insets
        }
        setContentView(root)
        // Atrás predictivo (API 33+): onBackPressed deja de llamarse, así que se registra el callback del sistema.
        if (Build.VERSION.SDK_INT >= 33) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) { goBack() }
        }
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
    private fun goBack() {
        web.evaluateJavascript("(function(){return !!(window.estilosBack&&window.estilosBack())})()") { handled ->
            if (handled != "true") finish()
        }
    }

    // Android 12 a 32: el sistema sigue llamando a onBackPressed.
    @Deprecated("Solo para API < 33; en 33+ se usa OnBackInvokedCallback.")
    override fun onBackPressed() {
        goBack()
    }

    private companion object {
        const val REQ_SAVE = 4101
        const val REQ_PICK = 4102
    }
}
