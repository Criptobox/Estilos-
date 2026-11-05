/* Utilidades compartidas: escape, color, contraste. Sin dependencias. */
const APP_VERSION = "10.9.0"; /* CI lo reemplaza por 10.9.<n.º de build> en cada despliegue */

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* Solo se aceptan colores #RGB / #RRGGBB / #RRGGBBAA. Cualquier otra cosa se descarta:
   así un JSON importado no puede inyectar CSS ni JS en atributos. */
const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
function safeColor(c, fallback) {
  c = String(c == null ? "" : c).trim();
  if (/^[0-9a-f]{3,8}$/i.test(c)) c = "#" + c;
  return HEX_RE.test(c) ? c.toUpperCase() : (fallback || "#888888");
}
function safeId(id) { return String(id == null ? "" : id).replace(/[^\w-]/g, "").slice(0, 60); }

function rgb(hex) {
  let h = safeColor(hex).slice(1);
  if (h.length <= 4) h = h.split("").map(x => x + x).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum(hex) {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const [r, g, b] = rgb(hex);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function inkOn(hex) { return contrast(hex, "#111318") >= contrast(hex, "#FFFFFF") ? "#111318" : "#FFFFFF"; }
function sat(hex) {
  const [r, g, b] = rgb(hex), mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return mx === 0 ? 0 : (mx - mn) / mx;
}
function bestAccent(colors) {
  const cs = (colors || []).filter(x => x.toUpperCase() !== "#FFFFFF");
  if (!cs.length) return "#3B82F6";
  return cs.slice().sort((x, y) => sat(y) - sat(x))[0];
}
function mix(a, b, p) { // mezcla a→b en proporción p (0..1)
  const A = rgb(a), B = rgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * p).toString(16).padStart(2, "0")).join("");
}
function wcag(ratio) { return ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA grande" : "Falla"; }
