import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// 1. Added display: "swap" to prevent invisible text while loading
const inter = Inter({ 
  subsets: ["latin"],
  display: "swap", 
});

export const metadata: Metadata = {
  title: "Nexus — All-in-one workspace",
  description: "Chat, collaborate, and get work done together.",
  // 2. Inline SVG Favicon (A simple purple "N" block to match your UI)
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%236366f1'/><text x='50%' y='50%' font-size='60' font-family='sans-serif' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='central'>N</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false, 
  // 3. Matches the mobile browser address bar to your dark/light theme
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }, // Matches your dark UI background
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* 4. Added suppressHydrationWarning to body as well */}
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <Providers>
            {children}
            <Toaster
              position="top-right"
              richColors
              theme="system"
            />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}