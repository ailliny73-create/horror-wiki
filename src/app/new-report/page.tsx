'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Send, MapPin, AlertCircle, Image as ImageIcon, Tag, Lock, Megaphone, Crown } from 'lucide-react';

export default function NewReportPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'위험 보고서' | '자유 게시판'>('위험 보고서');
  const [dangerLevel, setDangerLevel] = useState('LEVEL 1 (경미)');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [requiredLevel, setRequiredLevel] = useState<number>(5); // 기본값: 5급 (누구나 열람)
  
  // 👑 최고운영자(ADMIN) 전용 공지사항 상태
  const [isNotice, setIsNotice] = useState(false);
  const [isTopAdmin, setIsTopAdmin] = useState(false); // 최고운영자 여부

  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [userNickname, setUserNickname] = useState('특무 요원');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('접근 권한이 없습니다. 먼저 로그인해 주세요.');
      router.push('/login');
      return;
    }
    setCurrentUserId(user.id);
    setUserNickname(user.user_metadata?.nickname || user.email?.split('@')[0] || '특무 요원');

    // 💡 최고운영자 권한 확인 (role이 ADMIN이거나 이메일/닉네임이 ADMIN인 경우)
    const userRole = user.user_metadata?.role;
    const userNick = user.user_metadata?.nickname;
    if (userRole === 'ADMIN' || userNick === 'ADMIN' || user.email?.startsWith('admin')) {
      setIsTopAdmin(true);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해 주세요.');
      return;
    }

    // 최고운영자가 아닌 유저가 공지 작성을 시도할 경우 차단
    if (isNotice && !isTopAdmin) {
      alert('공지사항은 최고운영자(ADMIN) 계급만 작성할 수 있습니다.');
      return;
    }

    setLoading(true);
    let finalImageUrl = '';

    try {
      if (imageFile) {
        setUploading(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('report_images')
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error('Image Upload Error:', uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('report_images')
            .getPublicUrl(filePath);
          finalImageUrl = publicUrlData.publicUrl;
        }
        setUploading(false);
      }

      const tagsArray = tagsInput
        ? tagsInput.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
        : ['특무제보'];

      // 💡 DB 저장: 공지 작성 시 작성자 닉네임을 'ADMIN'으로 고정 저장
      const { error } = await supabase.from('reports').insert([
        {
          title: title.trim(),
          category: isNotice ? '공지사항' : category,
          danger_level: isNotice ? '일반' : (category === '위험 보고서' ? dangerLevel : '일반'),
          location: isNotice ? '사령부 본부' : (category === '위험 보고서' ? location.trim() || '미상 구역' : '자유 게시판'),
          content: content.trim(),
          tags: isNotice ? ['공지사항', '사령부지침'] : tagsArray,
          image_url: finalImageUrl || null,
          required_level: isNotice ? 5 : requiredLevel,
          is_notice: isNotice,
          user_id: currentUserId,
          author_nickname: isNotice ? 'ADMIN' : userNickname,
        },
      ]);

      if (error) {
        alert('문서 작성 실패: ' + error.message);
      } else {
        if (currentUserId) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('exp')
            .eq('user_id', currentUserId)
            .single();

          if (profile) {
            await supabase
              .from('user_profiles')
              .update({ exp: profile.exp + 15 })
              .eq('user_id', currentUserId);
          }
        }

        alert(isNotice ? '👑 [최고운영자] 긴급 공지사항이 하이라이트 등록되었습니다!' : '기밀 문서 작성이 완료되었습니다 (+15 EXP)!');
        router.push('/dashboard');
      }
    } catch (err: any) {
      alert('오류 발생: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-xs text-neutral-400 hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>돌아가기</span>
          </button>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
            <h1 className="text-sm font-bold text-red-600 tracking-wider">NEW CLASSIFIED DOCUMENT</h1>
          </div>
        </div>

        {/* 작성 폼 */}
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg space-y-5">
          
          {/* 👑 최고운영자(ADMIN) 전용 공지사항 등록 옵션 (일반 요원에게는 아예 안 보임) */}
          {isTopAdmin && (
            <div className="bg-yellow-950/40 border border-yellow-800/80 p-3.5 rounded flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Crown className="w-5 h-5 text-yellow-400 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-yellow-300 block">👑 최고운영자 전용: 긴급 공지사항 등록</span>
                  <span className="text-[10px] text-yellow-500/80">선택 시 작성자 이름이 [ADMIN]으로 발령되며 상단에 고정됩니다.</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNotice}
                  onChange={(e) => setIsNotice(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-600"></div>
              </label>
            </div>
          )}

          {/* 일반 문서일 때만 카테고리 선택 */}
          {!isNotice && (
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2">문서 분류 (Category)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCategory('위험 보고서')}
                  className={`py-2.5 px-3 rounded text-xs font-bold border transition-all cursor-pointer ${
                    category === '위험 보고서'
                      ? 'bg-red-950 border-red-800 text-red-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  🚨 위험 보고서
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('자유 게시판')}
                  className={`py-2.5 px-3 rounded text-xs font-bold border transition-all cursor-pointer ${
                    category === '자유 게시판'
                      ? 'bg-red-950 border-red-800 text-red-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  📻 자유 게시판
                </button>
              </div>
            </div>
          )}

          {/* 🔒 열람 최소 보안 인가 등급 선택 옵션 (공지사항 아닐 때만) */}
          {!isNotice && (
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded space-y-2">
              <label className="block text-xs font-bold text-neutral-300 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-red-500" />
                <span>열람 인가 최소 등급 (Min Security Clearance)</span>
              </label>
              <p className="text-[11px] text-neutral-500">
                지정한 등급보다 낮은 요원이 열람할 경우 내용이 <strong className="text-red-400">■■■■ (검은 상자)</strong>로 마스킹 처리됩니다.
              </p>
              <select
                value={requiredLevel}
                onChange={(e) => setRequiredLevel(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900 cursor-pointer font-bold"
              >
                <option value={5}>보안 5급 이상 (수습 요원 포함 전체 공개)</option>
                <option value={4}>보안 4급 이상 (정지요원 이상 공개)</option>
                <option value={3}>보안 3급 이상 (선임요원 이상 공개)</option>
                <option value={2}>보안 2급 이상 (특무분석관 이상 공개)</option>
                <option value={1}>보안 1급 전용 (사령관 최고 기밀)</option>
              </select>
            </div>
          )}

          {/* 제목 */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1">
              {isNotice ? '공지 제목 (Notice Title)' : '문서 제목 (Title)'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isNotice ? '[공지] 특무 사령부 지침 안내' : '예: [제보] 서울 6호선 폐역 구간의 음파 이상 진동'}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-red-900"
            />
          </div>

          {/* 위험 보고서일 때 추가 입력 필드 */}
          {!isNotice && category === '위험 보고서' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span>위험도 발령 (Hazard Level)</span>
                </label>
                <select
                  value={dangerLevel}
                  onChange={(e) => setDangerLevel(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900 cursor-pointer"
                >
                  <option value="LEVEL 1 (경미)">LEVEL 1 (경미)</option>
                  <option value="LEVEL 2 (주의)">LEVEL 2 (주의)</option>
                  <option value="LEVEL 3 (위험)">LEVEL 3 (위험)</option>
                  <option value="LEVEL 4 (극심)">LEVEL 4 (극심)</option>
                  <option value="LEVEL 5 (재앙)">LEVEL 5 (재앙)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  <span>발생 장소 (Location)</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="예: 서울 마포구 상암동 지하 구역"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900"
                />
              </div>
            </div>
          )}

          {/* 상세 내용 */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1">
              {isNotice ? '공지 상세 내용 (Content)' : '상세 사건 내용 (Content)'}
            </label>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 상세하게 기록하세요..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-xs text-neutral-200 focus:outline-none focus:border-red-900 resize-none leading-relaxed"
            />
          </div>

          {/* 태그 입력 (일반 문서만) */}
          {!isNotice && (
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-neutral-500" />
                <span>검색 태그 (Tags)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="태그를 쉼표(,)로 구분하여 입력 (예: 도시괴담, 지하철, 음파이상)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900"
              />
            </div>
          )}

          {/* 이미지 첨부 */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1 flex items-center space-x-1">
              <ImageIcon className="w-3.5 h-3.5 text-neutral-500" />
              <span>사진 첨부 (Attachment)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700 cursor-pointer"
            />
            {imageUrl && (
              <div className="mt-2 relative rounded overflow-hidden border border-neutral-800 max-h-48 bg-neutral-950">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
              </div>
            )}
          </div>

          {/* 작성 제출 버튼 */}
          <button
            type="submit"
            disabled={loading || uploading}
            className={`w-full font-bold text-xs py-3.5 rounded border flex items-center justify-center space-x-2 cursor-pointer shadow-lg transition-all disabled:opacity-50 ${
              isNotice 
                ? 'bg-yellow-700 hover:bg-yellow-600 text-yellow-100 border-yellow-600 shadow-yellow-950/50' 
                : 'bg-red-900 hover:bg-red-800 text-white border-red-700 shadow-red-950/50'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>
              {loading 
                ? '등록 중...' 
                : (isNotice ? '👑 [ADMIN] 공지사항 발령하기' : '기밀 문서 작성 완료 (+15 EXP)')}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}