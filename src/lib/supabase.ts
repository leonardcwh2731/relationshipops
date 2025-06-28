import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === '' || !supabaseAnonKey || supabaseAnonKey === '') {
  console.warn('Missing Supabase environment variables');
  // Create a mock client for development
  export const supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: [], error: null })
          })
        }),
        range: () => Promise.resolve({ data: [], error: null })
      })
    })
  } as any;
} else {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
}