import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  // 1. Cron 호출 보안 검증
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // 웹 브라우저에서 직접 테스트 시 ?secret=ADMIN_025180_roro0922 주소로 접근 허용
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is missing' }, { status: 500 });
  }

  try {
    // 2. Gemini AI에 생성 지침(프롬프트) 전달
    const prompt = `
너는 대한민국 특무 사령부의 기밀 보고서를 작성하는 AI 분석관이다.
한국의 도시괴담, 시공간 이상, 정체불명의 괴이 현상을 바탕으로 오싹하고 흥미진진한 보고서를 1개 생성해라.
반드시 아래 예시와 같은 순수한 JSON 형식으로만 응답해라 (마크다운 코드블록이나 추가 텍스트 절대 금지):

{
  "title": "[경고] 또는 [제보]로 시작하는 20자 이내의 흥미로운 보고서 제목",
  "location": "사건 발생 장소 (예: 서울 마포구 지하철 6호선 폐역 구간)",
  "danger_level": "LEVEL 1 (경미)",
  "content": "사건 현장 상황, 감지된 이상 현상, 요원 수칙을 포함한 250자 내외의 오싹한 상세 내용",
  "tags": ["도시괴담", "이상현상", "장소명"]
}

위 danger_level 값은 "LEVEL 1 (경미)", "LEVEL 2 (주의)", "LEVEL 3 (위험)", "LEVEL 4 (극심)", "LEVEL 5 (재앙)" 중 하나를 무작위로 선택해라.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json({ error: 'AI 응답 생성 실패', detail: data }, { status: 500 });
    }

    // JSON 정리 및 파싱
    const cleanJsonStr = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const reportData = JSON.parse(cleanJsonStr);

    // 3. Supabase DB에 자동 저장
    const { error: insertError } = await supabase.from('reports').insert([
      {
        title: reportData.title,
        category: '위험 보고서',
        content: reportData.content,
        location: reportData.location || '미상 구역',
        danger_level: reportData.danger_level || 'LEVEL 1 (경미)',
        tags: reportData.tags || ['AI제보', '괴이현상'],
        user_id: '00000000-0000-0000-0000-000000000000', // AI 전용 시스템 요원 ID
        author_nickname: '🤖 AI 특무 분석관',
      },
    ]);

    if (insertError) {
      console.error('Supabase Insert Error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'AI 기밀 보고서가 성공적으로 생성 및 등록되었습니다.',
      generated_report: reportData,
    });
  } catch (err: any) {
    console.error('Cron Execution Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}