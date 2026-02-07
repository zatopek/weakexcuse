import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roast Board",
  description: "Track your friends' flaking, ghosting, and general unreliability",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
