import { createClient } from '@supabase/supabase-js';

// 대장님의 실제 Supabase URL 주소를 직접 지정 (환경변수가 비어있어도 절대 에러 안 남)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jcydshkjksjhybedklei.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});