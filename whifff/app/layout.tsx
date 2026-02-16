import type { Metadata } from "next";
import { Caprasimo, Pacifico, Nunito, Playfair_Display } from "next/font/google";
import "./globals.css";

const caprasimo = Caprasimo({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-caprasimo-var",
  display: "swap",
});

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pacifico-var",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito-var",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: "whifff - your next favorite scent",
  description: "A perfume recommendation quiz. Spotify Wrapped meets Sephora.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${caprasimo.variable} ${pacifico.variable} ${nunito.variable} ${playfair.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
