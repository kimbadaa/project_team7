import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function SignupPage({ onSignupSuccess }: { onSignupSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      console.log('[Signup Page] Attempting signup for:', email);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ff4137c/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, name }),
        }
      );

      const data = await response.json();
      console.log('[Signup Page] Response:', { ok: response.ok, status: response.status, data });

      if (!response.ok) {
        const errorMsg = data.error || '회원가입 중 오류가 발생했습니다.';
        setError(errorMsg);
        console.error('[Signup Page] Error:', errorMsg, data.details);
      } else {
        console.log('[Signup Page] Signup successful');
        setSuccess(true);
        setTimeout(() => {
          onSignupSuccess();
        }, 2000);
      }
    } catch (err: any) {
      const errorMsg = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
      setError(errorMsg);
      console.error('[Signup Page] Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">💊</span>
          </div>
          <h1 className="text-gray-900 mb-2">회원가입</h1>
          <p className="text-gray-600">새로운 계정을 만들어보세요</p>
        </div>

        {success ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center">
            <p className="mb-2">✅ 회원가입 성공!</p>
            <p className="text-sm">로그인 페이지로 이동합니다...</p>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 mb-2">이름</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="홍길동"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2">이메일</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 mb-2">비밀번호</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="비밀번호를 입력하세요 (최소 6자)"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all disabled:opacity-50"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}