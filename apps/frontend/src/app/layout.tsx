import { Inter } from "next/font/google";
import localFont from "next/font/local";

import type { Metadata } from "next";

import { Footer } from "@/components/blocks/footer";
import { Navbar } from "@/components/blocks/navbar";
import { StyleGlideProvider } from "@/components/styleglide-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { PrivyProvider } from "@/providers/privy-provider";
import "@/styles/globals.css";

const dmSans = localFont({
  src: [
    {
      path: "../../fonts/dm-sans/DMSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../fonts/dm-sans/DMSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../fonts/dm-sans/DMSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../fonts/dm-sans/DMSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "ShadowSwap - Confidential AMM with MEV Protection",
    template: "%s | ShadowSwap",
  },
  description:
    "Trade privately with encrypted swaps on Inco Network. ShadowSwap protects your trades from MEV bots and front-runners using FHE technology.",
  keywords: [
    "ShadowSwap",
    "confidential AMM",
    "MEV protection",
    "encrypted swaps",
    "Inco Network",
    "FHE",
    "DeFi privacy",
    "confidential trading",
    "LP privacy",
  ],
  authors: [{ name: "ShadowSwap" }],
  creator: "ShadowSwap",
  publisher: "ShadowSwap",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "48x48" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon.ico" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: [{ url: "/favicon/favicon.ico" }],
  },
  openGraph: {
    title: "ShadowSwap - Confidential AMM with MEV Protection",
    description:
      "Trade privately with encrypted swaps on Inco Network. ShadowSwap protects your trades from MEV bots and front-runners.",
    siteName: "ShadowSwap",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ShadowSwap - Confidential AMM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShadowSwap - Confidential AMM with MEV Protection",
    description:
      "Trade privately with encrypted swaps on Inco Network. MEV protection powered by FHE.",
    images: ["/og-image.jpg"],
    creator: "@0xkun4l",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        />
      </head>
      <body className={`${dmSans.variable} ${inter.variable} antialiased`}>
        <PrivyProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <StyleGlideProvider />
            <Navbar />
            <main className="">{children}</main>
            <Footer />
          </ThemeProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
