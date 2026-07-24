import { Cairo } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "إيليت للأبحاث التجريبية والتطوير في علم النفس | ELITE",
  description:
    "إيليت (ELITE) منظمة تدريبية كويتية متخصصة في الدورات النفسية والتربوية والتطوير الذاتي، معتمدة للتطوير المهني المستمر CPD.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        {children}
        <Script src="/assets/js/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
