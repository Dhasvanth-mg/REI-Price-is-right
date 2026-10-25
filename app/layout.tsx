import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  icons: {
    icon: "/brand/rho-epsilon-iota.png",
    apple: "/brand/rho-epsilon-iota.png",
  },
  title: "Rho Price Is Right · Rho Epsilon Iota",
  description:
    "Ten properties. One sharp eye. The live real estate guessing game by Rho Epsilon Iota at Penn State.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
