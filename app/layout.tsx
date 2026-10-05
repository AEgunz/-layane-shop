import type { Metadata } from "next";
import "./globals.css";
import StoreFonts from './store-fonts';

export const metadata: Metadata = {
  title: "layane-shop Store Studio",
  description: "Create product landing pages and manage your store in one place.",
  manifest: "/manifest.json",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/favicon.ico" },
      { url: "/favicon.svg" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#205b44" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="layane Admin" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="antialiased"><StoreFonts />{children}</body>
    </html>
  );
}
