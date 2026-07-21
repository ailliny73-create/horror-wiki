import { createClient } from '@supabase/supabase-js';

// URL이 비어있거나 무효한 값이 들어가는 것을 완벽 차단하는 안전함수
function getValidUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl;
  }
  // 기본 하드코딩 Fallback URL
  return 'https://jcydshkjksjhybedklei.supabase.co';
}

function getValidKey(): string {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (envKey && envKey.length > 20) {
    return envKey;
  }
  // 기본 더미 Key (형식 유지용)
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjeWRzaGtqa3NqaHliZWRrbGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzAAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.dummyKeyForBuildProcessOnly';
}

export const supabase = createClient(getValidUrl(), getValidKey(), {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});