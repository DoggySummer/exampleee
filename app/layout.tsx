import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppProviders } from "./_providers/AppProviders";
import "./globals.css";

const wantedSans = localFont({
  src: "../node_modules/wanted-sans/fonts/webfonts/variable/complete/woff2/WantedSansVariable.woff2",
  variable: "--font-wanted",
  weight: "400 950",
  display: "swap",
});

export const metadata: Metadata = {
  title: "동네배달",
  description: "3조 배달앱 플랫폼",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={wantedSans.variable}>
      <body className="font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
