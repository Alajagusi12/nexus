import { createClient } from "@supabase/supabase-js";

// Fallback values used if env vars are missing at runtime.
// Vercel sometimes fails to inject these correctly.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ygbqalcvhlmhgkmzefrk.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYnFhbGN2aGxtaGdrbXplZnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MTQwNTcsImV4cCI6MjEwNzM5MDA1N30.F203AimZ-DNU0R6kH2yEjNRplu0ieZUYFnTTGS-Ytcg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: false,
  },
})