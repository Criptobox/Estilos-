/* Código del tema para otras plataformas.
   HTML/CSS es el componente completo (designCode). Para Tailwind, Compose, SwiftUI y
   Flutter se generan los TOKENS del estilo (colores por rol, paleta y radio), listos
   para aplicar a tus propios componentes: traducir cada uno de los 107 diseños a
   cada framework a mano no sería fiel, así que no se finge. */
const STACKS = [
  { id: "html", label: "HTML/CSS" },
  { id: "tailwind", label: "Tailwind" },
  { id: "compose", label: "Compose" },
  { id: "swiftui", label: "SwiftUI" },
  { id: "flutter", label: "Flutter" }
];

function stackTokens(e) {
  const t = tokens(e);
  return {
    t, name: String(e.name || "Estilo"),
    roles: [["primary", t.pr], ["onPrimary", t.onpr], ["accent", t.a], ["background", t.bg], ["surface", t.sf], ["text", t.tx], ["muted", t.mu]],
    palette: t.c.map((c, i) => ["palette" + (i + 1), c]),
    radius: t.round ? null : t.rad, dark: t.dark
  };
}
/* #RGB, #RRGGBB o #RRGGBBAA → "AARRGGBB" en mayúsculas */
function argbHex(c) {
  let h = safeColor(c).slice(1);
  if (h.length <= 4) h = h.split("").map(x => x + x).join("");
  const a = h.length === 8 ? h.slice(6) : "FF";
  return (a + h.slice(0, 6)).toUpperCase();
}
const kebab = s => s.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
const cssColor = c => { const h = argbHex(c); return h.slice(0, 2) === "FF" ? "#" + h.slice(2) : "#" + h.slice(2) + h.slice(0, 2); };

function stackCode(e, stack) {
  if (!stack || stack === "html") return designCode(e);
  const k = stackTokens(e), all = k.roles.concat(k.palette);
  const head = "Tema «" + k.name.replace(/[\r\n*/]/g, " ") + "» · generado por Estilos";
  const rad = k.radius == null ? 999 : k.radius;

  if (stack === "tailwind") {
    return "/* " + head + " */\n\n"
      + "/* Tailwind v4 · en tu CSS principal */\n@theme {\n"
      + all.map(([n, c]) => "  --color-estilos-" + kebab(n) + ": " + cssColor(c) + ";").join("\n")
      + "\n  --radius-estilos: " + (k.radius == null ? "9999px" : rad + "px") + ";\n}\n\n"
      + "/* Tailwind v3 · tailwind.config.js → theme.extend */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        estilos: {\n"
      + all.map(([n, c]) => "          '" + kebab(n) + "': '" + cssColor(c) + "',").join("\n")
      + "\n        }\n      },\n      borderRadius: { estilos: '" + (k.radius == null ? "9999px" : rad + "px") + "' }\n    }\n  }\n};\n\n"
      + "/* Uso: class=\"bg-estilos-primary text-estilos-on-primary rounded-estilos\" */";
  }
  if (stack === "compose") {
    const shape = k.radius == null ? "RoundedCornerShape(percent = 50)" : "RoundedCornerShape(" + rad + ".dp)";
    const r = n => "EstilosTokens." + n[0].toUpperCase() + n.slice(1);
    return "// " + head + "\nimport androidx.compose.foundation.shape.RoundedCornerShape\nimport androidx.compose.material3.*\nimport androidx.compose.runtime.Composable\nimport androidx.compose.ui.graphics.Color\nimport androidx.compose.ui.unit.dp\n\n"
      + "object EstilosTokens {\n" + all.map(([n, c]) => "    val " + n[0].toUpperCase() + n.slice(1) + " = Color(0x" + argbHex(c) + ")").join("\n")
      + "\n    val Radius = " + (k.radius == null ? "999.dp" : rad + ".dp") + "\n}\n\n"
      + "private val EstilosColors = " + (k.dark ? "darkColorScheme" : "lightColorScheme") + "(\n"
      + "    primary = " + r("primary") + ",\n    onPrimary = " + r("onPrimary") + ",\n    secondary = " + r("accent") + ",\n"
      + "    background = " + r("background") + ",\n    onBackground = " + r("text") + ",\n    surface = " + r("surface") + ",\n"
      + "    onSurface = " + r("text") + ",\n    onSurfaceVariant = " + r("muted") + "\n)\n\n"
      + "private val EstilosShapes = Shapes(medium = " + shape + ", large = " + shape + ")\n\n"
      + "@Composable\nfun EstilosTheme(content: @Composable () -> Unit) =\n    MaterialTheme(colorScheme = EstilosColors, shapes = EstilosShapes, content = content)";
  }
  if (stack === "swiftui") {
    const sw = c => { const h = argbHex(c); return "Color(hex: 0x" + h.slice(2) + (h.slice(0, 2) === "FF" ? "" : ", alpha: " + (parseInt(h.slice(0, 2), 16) / 255).toFixed(2)) + ")"; };
    return "// " + head + "\nimport SwiftUI\n\n"
      + "extension Color {\n    init(hex: UInt32, alpha: Double = 1) {\n        self.init(.sRGB,\n                  red: Double((hex >> 16) & 0xFF) / 255,\n                  green: Double((hex >> 8) & 0xFF) / 255,\n                  blue: Double(hex & 0xFF) / 255,\n                  opacity: alpha)\n    }\n}\n\n"
      + "enum EstilosTheme {\n" + all.map(([n, c]) => "    static let " + n + " = " + sw(c)).join("\n")
      + "\n    static let radius: CGFloat = " + rad + "\n    static let colorScheme: ColorScheme = ." + (k.dark ? "dark" : "light") + "\n}\n\n"
      + "// Uso: .background(EstilosTheme.primary)\n//      .clipShape(RoundedRectangle(cornerRadius: EstilosTheme.radius, style: .continuous))";
  }
  if (stack === "flutter") {
    const f = c => "Color(0x" + argbHex(c) + ")";
    return "// " + head + "\nimport 'package:flutter/material.dart';\n\n"
      + "class EstilosTokens {\n" + all.map(([n, c]) => "  static const " + n + " = " + f(c) + ";").join("\n")
      + "\n  static const radius = " + rad + ".0;\n}\n\n"
      + "final ThemeData estilosTheme = ThemeData(\n  useMaterial3: true,\n  scaffoldBackgroundColor: EstilosTokens.background,\n"
      + "  colorScheme: ColorScheme.fromSeed(\n    seedColor: EstilosTokens.primary,\n    brightness: Brightness." + (k.dark ? "dark" : "light") + ",\n  ).copyWith(\n"
      + "    primary: EstilosTokens.primary,\n    onPrimary: EstilosTokens.onPrimary,\n    secondary: EstilosTokens.accent,\n    surface: EstilosTokens.surface,\n    onSurface: EstilosTokens.text,\n  ),\n);\n\n"
      + "// Uso: MaterialApp(theme: estilosTheme, …)\n//      BorderRadius.circular(EstilosTokens.radius)";
  }
  return designCode(e);
}
