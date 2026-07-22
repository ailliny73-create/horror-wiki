'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Upload, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function NewReportPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userNickname, setUserNickname] = useState<string>('특무 요원');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  const [category, setCategory] = useState<'위험 보고서' | '자유 게시판' | '건의사항' | '공지사항'>('위험 보고서');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [dangerLevel, setDangerLevel] = useState('LEVEL 1 (경미)');
  const [tagsInput, setTagsInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const nickname = user.user_metadata?.nickname || user.email?.split('@')[0] || '특무 요원';
      setUserNickname(nickname);

      const isUserAdmin = Boolean(
        user.user_metadata?.role === 'ADMIN' || 
        nickname === 'ADMIN' || 
        user.email?.startsWith('admin')
      );
      setIsAdmin(isUserAdmin);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !currentUserId) return;

    setLoading(true);

    try {
      if (category === '건의사항') {
        const { error: sugError } = await supabase.from('suggestions').insert([
          {
            user_id: currentUserId,
            author_nickname: userNickname,
            title: title.trim(),
            content: content.trim(),
          },
        ]);
        if (sugError) throw sugError;
        alert('🔒 비공개 건의사항이 최고 사령부로 안전하게 전송되었습니다. (관리자만 열람 가능)');
        router.push('/dashboard');
        return;
      }

      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('report-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('report-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim().replace(/^#/, ''))
        .filter((tag) => tag.length > 0);

      const isNoticeDoc = category === '공지사항';

      const { error: insertError } = await supabase.from('reports').insert([
        {
          user_id: currentUserId,
          author_nickname: userNickname,
          category: isNoticeDoc ? '공지사항' : category,
          title: title.trim(),
          content: content.trim(),
          location: isNoticeDoc || category === '자유 게시판' ? '자유 게시판' : location.trim(),
          danger_level: isNoticeDoc ? '일반' : (category === '위험 보고서' ? dangerLevel : '일반'),
          required_level: 5,
          is_notice: isNoticeDoc,
          tags: tags,
          image_url: imageUrl,
        },
      ]);

      if (insertError) throw insertError;

      // 💡 [경험치 지급] 글 작성 성공 시 +15 EXP 지급
      const { error: expError } = await supabase.rpc('add_user_exp', {
        target_user_id: currentUserId,
        exp_to_add: 15,
      });

      if (expError) {
        console.error('글 작성 경험치 지급 오류:', expError.message);
      }

      alert(isNoticeDoc ? '📢 사령부 공식 공지가 등록되었습니다.' : '🔒 기밀 문서가 등록되었습니다. (경험치 +15 EXP 획득!)');
      router.push('/dashboard');
    } catch (err: any) {
      alert('문서 등록 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono p-4 sm:p-8 flex justify-center">
      <div className="max-w-2xl w-full space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-red-500" />
            <span>임무 대시보드로 복귀</span>
          </button>
          <div className="flex items-center space-x-2 text-red-600 font-extrabold text-sm">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span>CLASSIFIED DOCUMENT REGISTRATION</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-400">문서 분류 (Category)</label>
            <div className={`grid gap-2 ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <button
                type="button"
                onClick={() => setCategory('위험 보고서')}
                className={`py-2 px-2 rounded text-xs font-bold border transition-all cursor-pointer ${
                  category === '위험 보고서' ? 'bg-red-950 border-red-700 text-red-300' : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                }`}
              >
                🚨 위험 보고서
              </button>
              <button
                type="button"
                onClick={() => setCategory('자유 게시판')}
                className={`py-2 px-2 rounded text-xs font-bold border transition-all cursor-pointer ${
                  category === '자유 게시판' ? 'bg-blue-950 border-blue-700 text-blue-300' : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                }`}
              >
                📻 자유 게시판
              </button>
              <button
                type="button"
                onClick={() => setCategory('건의사항')}
                className={`py-2 px-2 rounded text-xs font-bold border transition-all cursor-pointer ${
                  category === '건의사항' ? 'bg-purple-950 border-purple-700 text-purple-300' : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                }`}
              >
                🔒 건의사항 (비공개)
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setCategory('공지사항')}
                  className={`py-2 px-2 rounded text-xs font-bold border transition-all cursor-pointer ${
                    category === '공지사항' ? 'bg-yellow-950 border-yellow-700 text-yellow-300' : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                  }`}
                >
                  📢 공지사항
                </button>
              )}
            </div>
          </div>

          {category === '건의사항' && (
            <div className="bg-purple-950/30 border border-purple-900/50 p-3 rounded text-xs text-purple-300">
              🔒 **비공개 건의사항 제보함**: 이 곳에 작성하신 내용은 오직 최고 관리자(ADMIN)만 열람할 수 있습니다.
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-400">제목 (Title)</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900"
            />
          </div>

          {/* 💡 [위험 보고서 전용 위치 및 위험도 입력 칸 복구] */}
          {category === '위험 보고서' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-400">사건 발생 지역 (Location)</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="예: 서울 마포구 지하철역"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-400">위험 등급 (Danger Level)</label>
                <select
                  value={dangerLevel}
                  onChange={(e) => setDangerLevel(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200"
                >
                  <option value="LEVEL 1 (경미)">LEVEL 1 (경미)</option>
                  <option value="LEVEL 2 (주의)">LEVEL 2 (주의)</option>
                  <option value="LEVEL 3 (위험)">LEVEL 3 (위험)</option>
                  <option value="LEVEL 4 (극심)">LEVEL 4 (극심)</option>
                  <option value="LEVEL 5 (재앙)">LEVEL 5 (재앙)</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-400">내용 (Content)</label>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요. ((민감한 단어))는 자동으로 검열됩니다."
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-xs text-neutral-200 focus:outline-none focus:border-red-900 resize-none"
            />
          </div>

          {category !== '건의사항' && (
            <>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-400">보안 태그 (Tags)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="쉼표(,)로 구분"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-400">현장 사진 첨부</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="text-xs text-neutral-400" />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-900 hover:bg-red-800 text-white text-xs py-3.5 rounded font-bold cursor-pointer"
          >
            {loading ? '전송 중...' : '문서 최종 등록 (+15 EXP)'}
          </button>
        </form>
      </div>
    </div>
  );
}