import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dependency check",
  description: "Check a package.json or requirements.txt for risky dependencies before installing them.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
