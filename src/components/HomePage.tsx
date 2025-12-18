import { useState } from 'react';
import { SymptomInput } from './SymptomInput';
import { SupplementRecommendation } from './SupplementRecommendation';
import { InteractionChecker } from './InteractionChecker';
import { ReminderManager } from './ReminderManager';
import { Pill, Shield, Bell, Info } from 'lucide-react';

type Tab = 'recommend' | 'interaction' | 'reminder';

interface LLMRecommendation {
  supplements: any[];
  generalAdvice: string;
  precautions: string[];
}

export function HomePage({ accessToken, onLogout }: { accessToken: string; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('recommend');
  const [recommendedSupplements, setRecommendedSupplements] = useState<LLMRecommendation | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💊</span>
            </div>
            <div>
              <h1 className="text-gray-900">영양제 AI 추천 플랫폼</h1>
              <p className="text-sm text-gray-600">AI 기반 맞춤 영양제 추천 및 관리</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('recommend')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'recommend'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Pill className="w-5 h-5" />
              <span>AI 영양제 추천</span>
            </button>
            <button
              onClick={() => setActiveTab('interaction')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'interaction'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span>AI 상호작용 체크</span>
            </button>
            <button
              onClick={() => setActiveTab('reminder')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'reminder'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>복용 알림</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'recommend' && (
          <div className="space-y-6">
            <SymptomInput onRecommendation={setRecommendedSupplements} />
            {recommendedSupplements && (
              <SupplementRecommendation 
                supplements={recommendedSupplements}
                accessToken={accessToken}
              />
            )}
          </div>
        )}

        {activeTab === 'interaction' && (
          <InteractionChecker />
        )}

        {activeTab === 'reminder' && (
          <ReminderManager accessToken={accessToken} />
        )}
      </div>

      {/* Info Footer */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex gap-3">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-blue-900 mb-2">주의사항</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• 이 플랫폼은 AI 기반 정보 제공 목적으로만 사용됩니다.</li>
                <li>• 영양제 복용 전 반드시 의사나 약사와 상담하세요.</li>
                <li>• 질병 치료나 진단을 목적으로 사용하지 마세요.</li>
                <li>• 개인의 건강 상태에 따라 적합한 영양제가 다를 수 있습니다.</li>
                <li>• AI 추천은 참고용이며 전문가의 조언을 대체하지 않습니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}