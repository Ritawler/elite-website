/** @type {import('next').NextConfig} */
const nextConfig = {
  // Needed so Vercel's serverless bundler includes the headless-Chromium
  // binary and our embedded Arabic font used by the PDF export route —
  // without this, next/@vercel/nft's static tracing can miss files that
  // puppeteer-core/@sparticuz/chromium only reference at runtime.
  outputFileTracingIncludes: {
    // chromium-min downloads its binary at runtime from CDN — no need to bundle it.
    // We only need to include the fonts and certificate assets that are read from disk.
    "/api/notes/pdf": [
      "./src/fonts/**",
    ],
    "/api/lessons/[lessonId]/complete": [
      "./src/fonts/**",
      "./public/certificate-assets/**",
    ],
  },
};

export default nextConfig;
