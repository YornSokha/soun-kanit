import type { Metadata, Viewport } from "next";
import { Kantumruy_Pro, Noto_Sans_Khmer } from "next/font/google";
import { LearnerProvider } from "@/components/providers/LearnerProvider";
import "./globals.css";

const kantumruyPro = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  display: "swap",
  variable: "--font-kantumruy-pro",
});

const notoSansKhmer = Noto_Sans_Khmer({
  subsets: ["khmer", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans-khmer",
});

export const metadata: Metadata = {
  title: "គន្លឹះគណិត — Konleuh Kanit",
  description:
    "កម្មវិធីរៀនគណិតវិទ្យាអន្តរកម្មជាភាសាខ្មែរសម្រាប់កុមារអាយុ ៦ ដល់ ១២ ឆ្នាំ",
  applicationName: "គន្លឹះគណិត",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "គន្លឹះគណិត",
  },
};

export const viewport: Viewport = {
  themeColor: "#fcfaf5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="km"
      className={`${kantumruyPro.variable} ${notoSansKhmer.variable} h-full`}
    >
      <body className="min-h-full bg-canvas text-ink antialiased flex flex-col">
        <LearnerProvider>{children}</LearnerProvider>
      </body>
    </html>
  );
}
