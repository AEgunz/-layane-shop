import type { Metadata } from "next";
import "./globals.css";

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
        <meta name="theme-color" content="#205b44" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="layane Admin" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
