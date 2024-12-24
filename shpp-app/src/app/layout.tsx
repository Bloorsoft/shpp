import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";
import { KeyboardShortcutsProvider } from "@/contexts/keyboard-shortcuts";
export const metadata: Metadata = {
  title: "Superhuman++",
  description: "Superhuman++",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <SessionProvider>
          <TRPCReactProvider>
            <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
