import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoryaBilling | Restaurant POS",
  description: "Professional billing, bill history and sales reports for Morya Misal.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
