'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  PlusCircle, 
  LogOut, 
  FileText, 
  AlertTriangle, 
  Search, 
  Trash2, 
  Edit3,
  MessageSquare, 
  Send,
  User,
  Camera
} from 'lucide-react';
import Link from 'next/link';

interface Anomaly {
  id: string;
  code: string;
  title: string;
  danger_level: string;
  content: string;
  image_url?: string;
  created_at: string;
}

interface Comment {
  id: string;
  anomaly_id: string;
  author_email: string;
  content: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndFetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          if (isMounted) router.push('/login');
          return;
        }

        if (isMounted) {
          setCurrentUser(session.user);
          setCheckingAuth(false);
          fetchAnomalies();
        }
      } catch (err) {
        console.error('인증 오류:', err);
        if (isMounted) router.push('/login');
      }
    };

    checkAuthAndFetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && isMounted) {
        router.push('/login');
      } else if (session && isMounted) {
        setCurrentUser(session.user);
        setCheckingAuth(false);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (selectedAnomaly) {
      fetchComments(selectedAnomaly.id);
    }
  }, [selectedAnomaly]);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('anomalies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setAnomalies(data);
        if (data.length > 0 && !selectedAnomaly) {
          setSelectedAnomaly(data[0]);
        }
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (anomalyId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('anomaly_id', anomalyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setComments(data);
    } catch (err) {
      console.error('댓글 로드 실패:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleDeleteAnomaly = async (id: string) => {
    if (!confirm('정말로 이 기밀 문서를 파기(삭제)하시겠습니까?')) return;

    try {
      const { error } = await supabase.from('anomalies').delete().eq('id', id);
      if (error) throw error;

      const updatedList = anomalies.filter((item) => item.id !== id);
      setAnomalies(updatedList);
      setSelectedAnomaly(updatedList.length > 0 ? updatedList[0] : null);
      alert('보고서가 성공적으로 파기되었습니다.');
    } catch (err: any) {
      alert(`[삭제 실패] ${err.message}`);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedAnomaly) return;

    setCommentLoading(true);
    try {
      const author = currentUser?.email || 'anonymous@disaster.go.kr';
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            anomaly_id: selectedAnomaly.id,
            author_email: author,
            content: newComment.trim(),
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        setComments([...comments, data[0]]);
        setNewComment('');
      }
    } catch (err: any) {
      alert(`[의견 등록 실패] ${err.message}`);
    } finally {
      setCommentLoading(false);
    }
  };

  const filteredAnomalies = anomalies.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-400 font-mono flex items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-red-600 animate-pulse mx-auto" />
          <p className="text-xs tracking-wider">요원 보안 등급 검증 및 보관소 동기화 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono flex flex-col">
      <header className="bg-neutral-900 border-b border-red-900/40 p-4 flex justify-between items-center px-6">
        <Link href="/" className="flex items-center space-x-3 cursor-pointer group">
          <ShieldAlert className="w-8 h-8 text-red-600 animate-pulse group-hover:scale-105 transition-transform" />
          <div>
            <h1 className="text-xl font-bold tracking-wider text-red-500 group-hover:text-red-400 transition">
              괴이대응국 // DISASTER RESPONSE BUREAU
            </h1>
            <p className="text-xs text-neutral-400">국가 안보 특무 기밀 보관소</p>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-xs text-neutral-300 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800">
            <User className="w-3.5 h-3.5 text-red-500" />
            <span>{currentUser?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 bg-red-950 hover:bg-red-900 text-red-300 text-xs px-3 py-1.5 rounded border border-red-800 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>로그아웃</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-80 bg-neutral-900/60 border-r border-neutral-800 p-4 flex flex-col space-y-4">
          <button
            type="button"
            onClick={() => router.push('/new-report')}
            className="w-full bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 font-semibold py-2 px-4 rounded text-sm flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>새 보고서 작성</span>
          </button>

          <div className="relative">
            <input
              type="text"
              placeholder="코드 또는 제목 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 pl-8 text-xs text-neutral-200 focus:outline-none focus:border-red-600 transition"
            />
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-xs text-neutral-500 text-center py-4">DB 동기화 중...</p>
            ) : filteredAnomalies.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-4">보관된 괴이 문서가 없습니다.</p>
            ) : (
              filteredAnomalies.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedAnomaly(item)}
                  className={`w-full text-left p-3 rounded border transition flex flex-col space-y-1 ${
                    selectedAnomaly?.id === item.id
                      ? 'bg-red-950/40 border-red-800 text-red-200'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-red-400">{item.code}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-950 border border-neutral-800 text-neutral-300">
                      {item.danger_level} 등급
                    </span>
                  </div>
                  <div className="text-xs font-semibold truncate text-neutral-200">{item.title}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 bg-neutral-950 p-6 overflow-y-auto space-y-6">
          {selectedAnomaly ? (
            <>
              <div className="max-w-3xl mx-auto space-y-6 bg-neutral-900/40 p-6 border border-neutral-800 rounded-lg">
                <div className="border-b border-neutral-800 pb-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2 text-xs text-red-500">
                      <FileText className="w-4 h-4" />
                      <span>기밀 등급 : 보안 구역 전용 문서</span>
                    </div>

                    {/* 수정 및 삭제 버튼 */}
                    <div className="flex space-x-3">
                      <Link
                        href={`/edit-report/${selectedAnomaly.id}`}
                        className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-neutral-200 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>문서 수정</span>
                      </Link>
                      <button
                        onClick={() => handleDeleteAnomaly(selectedAnomaly.id)}
                        className="flex items-center space-x-1 text-xs text-neutral-500 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>문서 파기</span>
                      </button>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-neutral-100">{selectedAnomaly.title}</h2>
                  <div className="flex space-x-4 text-xs text-neutral-400 pt-1">
                    <span>식별코드: <strong className="text-red-400">{selectedAnomaly.code}</strong></span>
                    <span>위험등급: <strong className="text-neutral-200">{selectedAnomaly.danger_level} 등급</strong></span>
                    <span>등록일시: {new Date(selectedAnomaly.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded text-xs text-red-400 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>주의: 본 문서의 내용을 인가되지 않은 민간인에게 유출 시 관련 법률에 의해 처벌받습니다.</span>
                </div>

                {/* 첨부된 채증 사진 출력 */}
                {selectedAnomaly.image_url && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 text-xs text-neutral-400">
                      <Camera className="w-3.5 h-3.5 text-red-500" />
                      <span>현장 채증 자료 (기밀)</span>
                    </div>
                    <div className="rounded overflow-hidden border border-neutral-800 max-h-80 bg-black">
                      <img
                        src={selectedAnomaly.image_url}
                        alt="채증 사진"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans border-l-2 border-red-900 pl-4 py-1">
                  {selectedAnomaly.content}
                </div>
              </div>

              <div className="max-w-3xl mx-auto bg-neutral-900/20 p-6 border border-neutral-800/80 rounded-lg space-y-4">
                <div className="flex items-center space-x-2 text-sm font-semibold text-neutral-300 border-b border-neutral-800 pb-3">
                  <MessageSquare className="w-4 h-4 text-red-500" />
                  <span>현장 요원 대응 수칙 및 추가 의견 ({comments.length})</span>
                </div>

                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-xs text-neutral-500 text-center py-3">작성된 요원 의견이 없습니다.</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-neutral-900 rounded border border-neutral-800/60 space-y-1">
                        <div className="flex justify-between items-center text-[11px] text-neutral-400">
                          <span className="font-semibold text-red-400">{comment.author_email}</span>
                          <span>{new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-neutral-200 font-sans">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="대응 의견 또는 추가 증언을 작성하십시오..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-600 transition"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading}
                    className="bg-red-900 hover:bg-red-800 text-red-100 text-xs px-4 py-2 rounded transition flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>전송</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-neutral-500">
              좌측에서 열람할 괴이 보고서를 선택하십시오.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}