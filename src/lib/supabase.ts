import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any;

if (!supabaseUrl || supabaseUrl === '' || !supabaseAnonKey || supabaseAnonKey === '') {
  console.warn('Missing Supabase environment variables - using mock data');
  
  // Create a comprehensive mock client for development
  const createMockQuery = () => ({
    select: (columns?: string) => createMockQuery(),
    eq: (column: string, value: any) => createMockQuery(),
    order: (column: string, options?: any) => createMockQuery(),
    limit: (count: number) => createMockQuery(),
    range: (from: number, to: number) => createMockQuery(),
    then: (callback: any) => {
      // Return mock data immediately
      return Promise.resolve({
        data: [],
        error: null
      }).then(callback);
    },
    // Make it thenable
    catch: (callback: any) => Promise.resolve({ data: [], error: null }),
    finally: (callback: any) => {
      callback();
      return Promise.resolve({ data: [], error: null });
    }
  });

  supabase = {
    from: (table: string) => {
      console.log(`Mock query to table: ${table}`);
      return createMockQuery();
    }
  } as any;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };