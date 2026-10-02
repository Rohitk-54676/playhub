import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { BackgroundMusic } from "@/components/shared/BackgroundMusic";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "PlayHub — Play together",
    template: "%s · PlayHub",
  },
  description:
    "A social gaming hub for college students. Play Bingo with friends or against the computer, chat, and hang out.",
  applicationName: "PlayHub",
  openGraph: {
    title: "PlayHub — Play together",
    description:
      "Play Bingo with friends or against the computer. Chat, hang out, and have fun.",
    type: "website",
    siteName: "PlayHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlayHub — Play together",
    description: "Play Bingo with friends or against the computer.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <BackgroundMusic />
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}