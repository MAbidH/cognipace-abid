/** @type {import('next').NextConfig} */
const csp = [
  "default-src 'self'",
  // 'wasm-unsafe-eval' lets the browser compile WebAssembly: Pyodide (her Python) is WebAssembly, and without this
  // Chrome and Safari refuse to load it. It allows wasm only, not JavaScript eval.
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://cdn.jsdelivr.net https://pypi.org https://files.pythonhosted.org",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");
const headers = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Private, single-student site: never index or cache in search engines.
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
];
module.exports = {
  reactStrictMode: true,
  // The commit this build came from, so an open page can tell it is out of date (components/VersionWatch.js, 30 Oct 2026).
  env: { NEXT_PUBLIC_BUILD_COMMIT: String(process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 12) },
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() { return [{ source: "/(.*)", headers }]; },
};
