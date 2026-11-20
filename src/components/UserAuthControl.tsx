import React, { useState, useRef, useEffect } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { sounds } from '../services/soundEffects';

export const UserAuthControl: React.FC = () => {
  const {
    user,
    profile,
    isAuthenticated,
    isLoading,
    isAuthActionLoading,
    openLoginModal,
    signOut,
  } = useAuth();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const avatarUrl =
    profile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    (user?.user_metadata?.picture as string | undefined) ||
    null;

  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'User';

  const email = profile?.email || user?.email || '';
  const initialLetter = displayName.trim().charAt(0).toUpperCase() || 'U';

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div
        className="w-16 h-8 rounded-xl bg-white/60 border border-slate-200/60 animate-pulse"
        aria-hidden="true"
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <a
        href="#login"
        onClick={(e) => {
          e.preventDefault();
          sounds.playTap();
          openLoginModal();
        }}
        className="inline-flex items-center gap-1.5 text-xs font-korean font-bold text-[#25364A] hover:text-[#FF806B] transition-colors px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs"
      >
        <LogIn className="w-3.5 h-3.5 text-[#FF806B]" />
        <span>로그인</span>
      </a>
    );
  }

  const handleSignOut = async () => {
    sounds.playTap();
    setIsPopoverOpen(false);
    await signOut();
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block z-30"
      onMouseEnter={() => setIsPopoverOpen(true)}
      onMouseLeave={() => setIsPopoverOpen(false)}
    >
      {/* Profile Avatar Trigger */}
      <button
        type="button"
        onClick={() => {
          sounds.playTap();
          setIsPopoverOpen((prev) => !prev);
        }}
        className="flex items-center gap-2 p-1 rounded-full bg-white/90 border-2 border-white shadow-sm hover:shadow-md hover:border-[#FF806B]/40 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF806B]/40"
        aria-label={`${displayName} 프로필 메뉴`}
        aria-expanded={isPopoverOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#FF806B] to-[#FFA28B] flex items-center justify-center text-white font-heading font-bold text-xs shrink-0">
          {avatarUrl && !imageError ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <span>{initialLetter}</span>
          )}
        </div>
      </button>

      {/* Hover / Click Popover below Profile Avatar */}
      {isPopoverOpen && (
        <div className="absolute right-0 top-full pt-2 w-52 z-40">
          <div
            className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/80 p-3 text-left"
            role="menu"
          >
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-[#FF806B] to-[#FFA28B] flex items-center justify-center text-white font-heading font-bold text-xs shrink-0">
                {avatarUrl && !imageError ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span>{initialLetter}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-bold text-xs text-[#25364A] truncate">
                  {displayName}
                </p>
                {email && (
                  <p className="text-[11px] text-slate-500 truncate">{email}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isAuthActionLoading}
              role="menuitem"
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-heading font-bold text-[#25364A] hover:text-[#FF6B52] hover:bg-[#FF806B]/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5 text-[#FF806B]" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
