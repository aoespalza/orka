import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError('Por favor ingresa tu usuario');
      return;
    }
    if (!password.trim()) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    setIsLoading(true);

    try {
      await login({ username, password });
      if (rememberMe) {
        localStorage.setItem('PROCURA_REMEMBER', username);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#00C897] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0A2540] opacity-5 rounded-full blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 md:p-10">
          
          {/* Logo & Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="/orka_logo.png" 
                alt="Orka" 
                className="h-40 w-auto"
              />
            </div>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-[#111111] mb-2">Bienvenido a OrKa</h2>
            <p className="text-gray-500 text-sm">Orquestando su proceso de compras</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Usuario
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="Ingresa tu usuario"
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#00C897] focus:ring-2 focus:ring-[#00C897]/20 outline-none transition-all duration-200 placeholder:text-gray-400"
              />
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#00C897] focus:ring-2 focus:ring-[#00C897]/20 outline-none transition-all duration-200 placeholder:text-gray-400"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#00C897] border-gray-300 rounded focus:ring-[#00C897] cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-600">Recordarme</span>
              </label>
              <a 
                href="#" 
                className="text-sm text-[#0A2540] hover:text-[#00C897] transition-colors duration-200"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#00C897] hover:bg-[#00B087] text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-[#00C897]/25"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Credenciales de demo: <span className="font-mono text-[#0A2540]">admin / admin123</span>
            </p>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-center mt-6 text-sm text-gray-400">
          © 2026 Orka. All rights reserved.
        </p>
      </div>

      {/* Inline styles for animation */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
