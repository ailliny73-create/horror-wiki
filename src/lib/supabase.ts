import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jcydshkjksjhybedklei.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return client;
};

// 기존 supabase 호출과의 호환성을 위한 지연 생성 프록시
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const supabaseClient = getSupabase();
    const value = (supabaseClient as any)[prop];
    if (typeof value === 'function') {
      return value.bind(supabaseClient);
    }
    return value;
  },
});