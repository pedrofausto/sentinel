import React, { useState, memo } from 'react';
import { LogIn, Loader2, AlertCircle, User, Lock, Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LOGO_URL = "https://shieldsec.com.br/wp-content/uploads/2024/04/shield.png";

const LoginScreen = memo(function LoginScreen() {
  const { login, register, error, clearError, isLoading } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (isRegisterMode) {
      if (password !== confirmPassword) {
        setValidationError('As senhas não coincidem');
        return;
      }
      if (password.length < 8) {
        setValidationError('A senha deve ter pelo menos 8 caracteres');
        return;
      }
      if (!email.includes('@')) {
        setValidationError('Email inválido');
        return;
      }

      try {
        await register(username, email, password);
      } catch {
        // Error is handled by context
      }
    } else {
      try {
        await login(username, password);
      } catch {
        // Error is handled by context
      }
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setValidationError(null);
    clearError();
    setPassword('');
    setConfirmPassword('');
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI1MmUiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMCAwaDQwdjQwSDBWMHptMjAgMjBhMSAxIDAgMSAwIDAtMiAxIDEgMCAwIDAgMCAyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={LOGO_URL} alt="Shield Logo" className="w-12 h-12 object-contain" />
              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-cyan-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Sentinel CTI
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-sm">
              {isRegisterMode ? 'Criar nova conta' : 'Gestão do Ciclo de Inteligência'}
            </p>
          </div>

          {/* Error Alert */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{displayError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Usuário
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  placeholder="Digite seu usuário"
                  required
                  disabled={isLoading}
                  minLength={3}
                />
              </div>
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                    placeholder="seu@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  placeholder="Digite sua senha"
                  required
                  disabled={isLoading}
                  minLength={isRegisterMode ? 8 : 1}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                    placeholder="Confirme sua senha"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  {isRegisterMode ? 'Criar Conta' : 'Entrar'}
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-slate-400 hover:text-cyan-400 text-sm transition-colors"
              disabled={isLoading}
            >
              {isRegisterMode 
                ? 'Já tem uma conta? Fazer login' 
                : 'Não tem conta? Registrar-se'}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700/50 text-center text-slate-500 text-xs">
            Sentinel CTI &copy; 2025 - Cyber Threat Intelligence Platform
          </div>
        </div>
      </div>
    </div>
  );
});

export default LoginScreen;
