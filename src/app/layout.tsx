import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Test Your Palate | Paperchase",
  description:
    "Can you guess the hero flavor? Test your palate at the Paperchase event and win exciting prizes!",
  keywords: ["cocktail", "event", "game", "paperchase", "test your palate"],
  openGraph: {
    title: "Test Your Palate | Paperchase",
    description:
      "Can you guess the hero flavor? Test your palate at the Paperchase event!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${inter.variable} antialiased`}>
        {/* Ambient background gradients */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div
            className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(255,109,47,0.3) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full opacity-15"
            style={{
              background:
                "radial-gradient(circle, rgba(138,43,226,0.4) 0%, transparent 70%)",
            }}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
