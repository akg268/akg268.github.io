import type { Metadata } from "next";
import "./globals.css";

const title = "Arunkumar Ganesan | GitHub Home";
const description =
  "Thule AI Dev Skills, public projects, backend systems notes, production testing, and contribution searches from Arunkumar Ganesan's GitHub workspace.";
const url = "https://akg268.github.io";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(url),
  alternates: {
    canonical: url,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title,
    description,
    url,
    siteName: "Arunkumar Ganesan",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
