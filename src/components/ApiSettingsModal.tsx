import { useState } from 'react';
import { X, Key } from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientId: string, clientSecret: string) => void;
}

export function ApiSettingsModal({ isOpen, onClose, onSave }: ApiSettingsModalProps) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(clientId, clientSecret);
    setClientId('');
    setClientSecret('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-gray-900">네이버 API 설정</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-900 text-sm mb-3">
            <strong>네이버 개발자 센터 설정 확인 방법:</strong>
          </p>
          <ol className="text-yellow-800 text-sm space-y-1.5 ml-4 list-decimal">
            <li>
              <a 
                href="https://developers.naver.com/apps" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                네이버 개발자 센터
              </a>
              에 접속하여 로그인
            </li>
            <li>애플리케이션 선택 (또는 새로 생성)</li>
            <li>
              <strong>검색 {'>'} 쇼핑</strong> API가 <strong className="text-green-700">사용 API</strong>에 추가되어 있는지 확인
              <br />
              <span className="text-xs text-yellow-700">(없으면 비활성 API에서 추가)</span>
            </li>
            <li>Client ID와 Client Secret 복사 (공백 없이)</li>
            <li>아래 입력란에 붙여넣기</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clientId" className="block text-gray-700 mb-2">
              Client ID
            </label>
            <input
              id="clientId"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="예: ejxyun9hqa"
              required
            />
          </div>

          <div>
            <label htmlFor="clientSecret" className="block text-gray-700 mb-2">
              Client Secret
            </label>
            <input
              id="clientSecret"
              type="text"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="예: O9ukczitq..."
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}