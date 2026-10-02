import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "layane-shop Store Studio",
  description: "Create product landing pages and manage your store in one place.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

