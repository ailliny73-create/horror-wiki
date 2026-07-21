// 🌐 무료 Google Translate API 기반 실시간 한국어 번역 유틸리티
export async function translateToKorean(text: string): Promise<string> {
  if (!text || text.trim() === '') return '';
  
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ko&dt=t&q=${encodeURIComponent(text)}`
    );
    const data = await res.json();
    
    // 번역된 문장 덩어리들을 결합
    if (data && data[0]) {
      return data[0].map((item: any) => item[0]).join('');
    }
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // 에러 시 원문 그대로 반환
  }
}