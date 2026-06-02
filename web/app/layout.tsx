import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Motivate Me",
  description: "Personalized motivation, made for you.",
  icons: {
    icon: "/motivate-me_icon_amber.png",
    apple: "/motivate-me_icon_amber.png",
  },
  openGraph: {
    title: "Motivate Me",
    description: "Personalized motivation, made for you.",
    images: [
      {
        url: "/motivate-me_wordmark_amber.png",
        width: 1264,
        height: 242,
        alt: "Motivate Me",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
