import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap", 
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Nexus — All-in-one workspace",
    template: "%s | Nexus",
  },
  description: "Chat, collaborate, and get work done together in a premium, real-time workspace.",
  applicationName: "Nexus",
  authors: [{ name: "Teslim" }],
  keywords: ["workspace", "collaboration", "chat", "tasks", "docs", "AI"],
  icons: {
    // Upgraded Favicon: Emerald background with a stylized 'N'
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%2310b981'/><text x='50%' y='50%' font-size='58' font-family='system-ui, -apple-system, sans-serif' font-weight='800' fill='white' text-anchor='middle' dominant-baseline='central'>N</text></svg>",
  },
  openGraph: {
    type: "website",
    title: "Nexus — All-in-one workspace",
    description: "Chat, collaborate, and get work done together.",
    siteName: "Nexus",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus — All-in-one workspace",
    description: "Chat, collaborate, and get work done together.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false, 
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body 
        className={`${inter.className} bg-background text-foreground antialiased selection:bg-emerald-500/30`} 
        suppressHydrationWarning
      >
        <ThemeProvider>
          <Providers>
            {children}
            <Toaster
              position="top-right"
              richColors
              theme="system"
              closeButton
              toastOptions={{
                className: "font-sans border-border bg-card text-foreground shadow-xl rounded-xl",
              }}
            />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}