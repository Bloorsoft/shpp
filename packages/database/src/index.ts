// Types
export * from "./types/database.types";

// Email Services
export { GmailService } from "./services/gmail";

// Helper type utilities
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// Supabase client with types
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types/database.types";

export const createTypedClient = (url: string, key: string) =>
  createClient<Database>(url, key);
