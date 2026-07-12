import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "Arunkumar Ganesan | GitHub Home";
const description =
  "Public projects, backend systems notes, production testing, and contribution searches from Arunkumar Ganesan's GitHub workspace.";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "github.com";
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const origin = `${protocol}://${host}`;

  return {
    title,
    description,
    metadataBase: new URL(origin),
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title,
      description,
      url: origin,
      siteName: "Arunkumar Ganesan",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

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
