import { useState, useEffect } from 'react';
import { supabase } from './utils/supabase/client';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { HomePage } from './components/HomePage';

type View = 'login' | 'signup' | 'home';

export default function App() {
  const [view, setView] = useState<View>('login');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 기존 세션 확인
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (!error && data.session) {
        setAccessToken(data.session.access_token);
        setView('home');
      }
    } catch (err) {
      console.error('Session check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (token: string) => {
    setAccessToken(token);
    setView('home');
  };

  const handleSignupSuccess = () => {
    setView('login');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setView('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (view === 'home' && accessToken) {
    return <HomePage accessToken={accessToken} onLogout={handleLogout} />;
  }

  if (view === 'signup') {
    return (
      <div>
        <SignupPage onSignupSuccess={handleSignupSuccess} />
        <div className="fixed bottom-8 left-0 right-0 text-center">
          <button
            onClick={() => setView('login')}
            className="text-gray-600 hover:text-gray-900"
          >
            이미 계정이 있으신가요? <span className="text-blue-600 hover:underline">로그인</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <LoginPage onLoginSuccess={handleLoginSuccess} />
      <div className="fixed bottom-8 left-0 right-0 text-center">
        <button
          onClick={() => setView('signup')}
          className="text-gray-600 hover:text-gray-900"
        >
          계정이 없으신가요? <span className="text-blue-600 hover:underline">회원가입</span>
        </button>
      </div>
    </div>
  );
}
