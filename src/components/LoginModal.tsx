import React from 'react';
import { X, ShoppingBag, ShieldCheck, Loader2 } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { IMAGES } from '../constants/images';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, isAuthActionLoading, authError, clearAuthError } =
    useAuth();

  if (!isOpen) return null;

  const handleClose = () => {
    sounds.playTap();
    clearAuthError();
    onClose();
  };

  const handleGoogleLoginClick = async () => {
    sounds.playTap();
    await signInWithGoogle();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#25364A]/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-popup-title"
    >
      <div
        className="bg-[#F8F5EF] rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-[#25364A] transition-colors shadow-xs cursor-pointer"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand & Lucy Welcome Header */}
        <div className="flex flex-col items-center text-center pt-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF806B] to-[#FFA28B] flex items-center justify-center shadow-sm shadow-[#FF806B]/25 text-white">
              <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-heading font-black text-xl tracking-tight text-[#25364A]">
              Shop<span className="text-[#FF806B]">Mate</span>
            </span>
          </div>

          <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-white shadow-md shadow-slate-300/50 bg-[#A9D5F5]/30 mb-3">
            <img
              src={IMAGES.assistantAvatar}
              alt="Lucy the friendly store assistant"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <h2
            id="login-popup-title"
            className="font-heading font-extrabold text-2xl text-[#25364A] tracking-tight"
          >
            Welcome Back!
          </h2>
          <p className="font-korean text-xs text-[#25364A]/75 mt-1 leading-relaxed max-w-[260px]">
            Google 계정으로 간편하게 로그인하고
            <br />
            루시와 함께 쇼핑 영어 연습을 이어가세요.
          </p>
        </div>

        {/* Login Card Area */}
        <div className="mt-5 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
          <button
            type="button"
            onClick={handleGoogleLoginClick}
            disabled={isAuthActionLoading}
            className="w-full h-12 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isAuthActionLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#FF806B]" />
            ) : (
              /* Google Official G Mark */
              <svg
                className="w-5 h-5 shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
            )}
            <span className="font-korean font-bold text-sm text-[#25364A]">
              {isAuthActionLoading ? 'Google 로그인 연결 중...' : 'Google로 계속하기'}
            </span>
          </button>

          {authError && (
            <p className="font-korean text-[11px] text-[#FF6B52] font-semibold text-center mt-3 leading-snug">
              {authError}
            </p>
          )}
        </div>

        {/* Privacy Notice matching StartScreen */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <p className="font-korean text-[10px] text-slate-500 leading-tight">
            로그인 없이도 모든 쇼핑 대화 연습을 이용하실 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};
