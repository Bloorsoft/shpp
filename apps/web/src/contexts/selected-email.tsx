"use client";

import { createContext, useContext, useState } from "react";
import type { GmailMessage } from "@/trpc/shared/gmail";

interface SelectedEmailContextType {
  selectedEmail: GmailMessage | null;
  setSelectedEmail: (email: GmailMessage | null) => void;
}

const SelectedEmailContext = createContext<
  SelectedEmailContextType | undefined
>(undefined);

export function SelectedEmailProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);

  return (
    <SelectedEmailContext.Provider value={{ selectedEmail, setSelectedEmail }}>
      {children}
    </SelectedEmailContext.Provider>
  );
}

export function useSelectedEmail() {
  const context = useContext(SelectedEmailContext);
  if (context === undefined) {
    throw new Error(
      "useSelectedEmail must be used within a SelectedEmailProvider",
    );
  }
  return context;
}
