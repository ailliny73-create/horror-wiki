'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Save, Loader2, Image as ImageIcon } from 'lucide-react';

export default function NewReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userNickname, setUserNickname] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('위험 보고서');
  const [location, setLocation] = useState('');
  const [dangerLevel, setDangerLevel] = useState('LEVEL 1 (경미)');
  const [tagsInput, setTagsInput] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      const nickname = user.user_metadata?.nickname || user.email?.split('@')[0] || '특무 요원';
      setUserNickname(nickname);
      setIsAdmin(Boolean(user.user_metadata?.role === 'ADMIN' || nickname === 'ADMIN' || user.email?.startsWith('admin')));
    };
    fetchUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);

    try {
      let imageUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('report-images').upload(filePath, file);
        if (!uploadError) {
          const { data } = supabase.storage.from('report-images').getPublicUrl(filePath);
          imageUrl = data.publicUrl;
        }
      }

      const tags = tagsInput.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter((tag) => tag.length > 0);

      // 💡 [건의사항] 선택 시 suggestions 테이블로 분기
      if (category === '건의사항 (비공개)') {
        const { error } = await supabase.from('suggestions').insert([
          {
            user_id: currentUser.id,
            author_nickname: userNickname,
            title: title.trim(),
            content: content.trim(),
          }
        ]);
        if (error) throw error;
      } else {
        // 💡 [나머지 카테고리] reports 테이블로 전송
        const { error } = await supabase.from('reports').insert([
          {
            user_id: currentUser.id,
            author_nickname: userNickname,
            title: title.trim(),
            content: content.trim(),
            category: category === '공지사항' ? '공지사항' : category,
            location: category === '위험 보고서' ? location.trim() : null,
            danger_level: category === '위험 보고서' ? dangerLevel : null,
            tags: tags,
            image_url: imageUrl,
            is_notice: category === '공지사항', // 공지사항 탭 선택 시 자동으로 true 처리
          }
        ]);
        if (error) throw error;
      }

      // 💡 문서 작성 시 15 EXP 추가 로직
      await supabase.rpc('add_user_exp', { target_user_id: currentUser.id, exp_to_add: 15 });

      alert('문서가 성공적으로 등록되었습니다. (+15 EXP)');
      router.push('/dashboard');
    } catch (err: any) {
      alert('오류 발생: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 💡 버튼 탭 목록 설정
  const categoryOptions = [
    { id: '위험 보고서', label: '🚨 위험 보고서' },
    { id: '자유 게시판', label: '📻 자유 게시판' },
    { id: '시리즈물 제작', label: '🎬 시리즈물 제작' },
    { id: '건의사항 (비공개)', label: '🔒 건의사항 (비공개)' },
  ];
  if (isAdmin) {
    categoryOptions.push({ id: '공지사항', label: '📢 공지사항' });
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <button onClick={() => router.back()} className="text-neutral-500 hover:text-white flex items-center space-x-2 transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold">복귀</span>
          </button>
          <div className="flex items-center space-x-2 text-red-500">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span className="font-extrabold tracking-widest text-sm">새 문서 작성</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111] border border-neutral-800 p-5 sm:p-8 rounded-lg space-y-6 shadow-xl">
          
          {/* 💡 [복원] 세련된 카테고리 버튼 UI */}
          <div className="space-y-2">
            <label className="block text-xs text-neutral-400 font-bold">문서 분류 (Category)</label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-red-950/80 border-red-800 text-white shadow-md shadow-red-900/20'
                      : 'bg-[#1a1a1a] border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 font-bold">제목 (Title)</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded px-3 py-3 text-xs text-neutral-200 focus:border-red-800 outline-none transition-colors"
            />
          </div>

          {category === '위험 보고서' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-bold">사건 발생 지역 (Location)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="예: 서울 마포구 지하철역"
                  className="w-full bg-[#0a0a0a] border border-neutral-800 rounded px-3 py-3 text-xs text-neutral-200 focus:border-red-800 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-bold">위험 등급 (Danger Level)</label>
                <select
                  value={dangerLevel}
                  onChange={(e) => setDangerLevel(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-neutral-800 rounded px-3 py-3 text-xs text-neutral-200 focus:border-red-800 outline-none transition-colors cursor-pointer"
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

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 font-bold">내용 (Content)</label>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요. ((민감한 단어))는 자동으로 검열됩니다."
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded p-4 text-xs text-neutral-200 resize-none focus:border-red-800 outline-none transition-colors leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 font-bold">보안 태그 (Tags)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="쉼표(,)로 구분"
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded px-3 py-3 text-xs text-neutral-200 focus:border-red-800 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-2 font-bold">현장 사진 첨부</label>
            <div className="flex items-center space-x-3 text-xs text-neutral-500">
              <label className="hover:text-neutral-300 cursor-pointer transition-colors flex items-center space-x-2">
                <span>파일 선택</span>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
              <span>{file ? file.name : '선택된 파일 없음'}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8b1c1c] hover:bg-[#7a1717] text-white py-3.5 rounded text-sm font-bold flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 transition-colors shadow-lg shadow-red-900/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              <span>{loading ? '서버 전송 중...' : '문서 최종 등록 (+15 EXP)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}