import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";



export const metadata: Metadata = {
  title: "Skindex — Precision Skin Science",
  description:
    "AI-driven skin analysis platform. Precision metrics for your unique skin profile, optimized for every tone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full font-manrope`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <div className="grow flex flex-col w-full">{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
