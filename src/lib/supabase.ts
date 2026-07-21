import { createClient } from '@supabase/supabase-js';

// 빌드 타임 SSR 에러를 방지하기 위해 대장님의 실제 Supabase URL 또는 올바른 폼의 Fallback URL 적용
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jcydshkjksjhybedklei.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});