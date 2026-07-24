/** @type {import('next').NextConfig} */
const nextConfig = {
  // Needed so Vercel's serverless bundler includes the headless-Chromium
  // binary and our embedded Arabic font used by the PDF export route —
  // without this, next/@vercel/nft's static tracing can miss files that
  // puppeteer-core/@sparticuz/chromium only reference at runtime.
  outputFileTracingIncludes: {
    "/api/notes/pdf": [
      "./node_modules/@sparticuz/chromium/**",
      "./src/fonts/**",
    ],
  },
};

export default nextConfig;
