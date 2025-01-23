import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";
import { KeyboardShortcutsProvider } from "@/contexts/keyboard-shortcuts";
import { Toaster } from "@/components/ui/sonner";
import { SelectedEmailProvider } from "@/contexts/selected-email";

import RightPanel from "@/components/right-panel";

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
            <KeyboardShortcutsProvider>
              <SelectedEmailProvider>
                <div className="flex h-screen overflow-hidden">
                  <div className="flex-1 overflow-y-auto">{children}</div>
                  <RightPanel />
                </div>
              </SelectedEmailProvider>
            </KeyboardShortcutsProvider>
            <Toaster />
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
