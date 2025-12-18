import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Search, Sparkles } from 'lucide-react';

interface LLMRecommendation {
  supplements: any[];
  generalAdvice: string;
  precautions: string[];
}

export function SymptomInput({ onRecommendation }: { onRecommendation: (supplements: LLMRecommendation) => void }) {
  const [symptom, setSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const exampleSymptoms = [
    '허리가 아파요',
    '피로가 심해요',
    '감기 기운이 있어요',
    '관절이 불편해요',
    '눈이 피로해요',
    '탈모가 심해요',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptom.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ff4137c/recommend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ symptom }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '추천을 가져오는 중 오류가 발생했습니다.');
        console.error('LLM Recommendation error:', data.error, data.details);
      } else {
        onRecommendation(data);
      }
    } catch (err) {
      setError('추천을 가져오는 중 오류가 발생했습니다.');
      console.error('Recommendation exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setSymptom(example);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-gray-900">증상 입력</h2>
          <p className="text-gray-600">AI가 증상을 분석하여 맞춤 영양제를 추천해드립니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="symptom" className="block text-gray-700 mb-2">
            어떤 증상이 있으신가요?
          </label>
          <div className="relative">
            <input
              id="symptom"
              type="text"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              className="w-full px-4 py-4 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="예: 허리가 아파요, 피로가 심해요, 콧물이 나요..."
              required
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
            <p className="mb-1">{error}</p>
            {error.includes('OpenAI') && (
              <p className="text-sm text-red-500">OpenAI API 키가 설정되어 있는지 확인해주세요.</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>AI 분석 중...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>AI 영양제 추천받기</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6">
        <p className="text-gray-700 mb-3 text-sm">예시 증상:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {exampleSymptoms.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleExampleClick(example)}
              className="px-4 py-2 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-lg transition-colors text-sm"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}