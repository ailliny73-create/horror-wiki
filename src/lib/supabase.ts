import { createClient } from '@supabase/supabase-js';

// Vercel 환경 변수가 없을 때를 대비해 진짜 Supabase URL을 기본값으로 직접 세팅
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jcydshkjksjhybedklei.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});