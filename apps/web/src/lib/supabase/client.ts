import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@shpp/database";

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);
