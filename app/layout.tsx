import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Lazer - World ID Verification",
  description: "Securely verify your unique human identity with World ID to protect your Lazer account",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} style={{
      "--primary": "#44d62c",
      "--primary-hover": "#7dfc65",
      "--background": "#0a0a0a",
      "--card-bg": "#0c0c0c",
      "--header-bg": "#000000",
      "--secondary": "#1a1a1a",
      "--border": "#333333",
      "--input-bg": "#1a1a1a",
      "--success": "#44d62c"
    } as React.CSSProperties}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
