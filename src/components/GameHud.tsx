import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Briefcase,
  ChevronDown,
  FolderOpen,
  LogOut,
  Music,
  Star,
  Trophy,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { AppScreen, AuthUser, GameState } from '../game/types';
import { getAgentRank, getEarnedBadgeIds } from '../game/rules';
import { AcademyEmblem } from './DetectiveArt';

interface GameHudProps {
  state: GameState;
  authUser: AuthUser | null;
  currentScreen: AppScreen;
  musicPlaying: boolean;
  onNavigate: (screen: AppScreen) => void;
  onOpenEvidenceDrawer: () => void;
  onOpenDecisionDrawer: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onLogout: () => void;
}

export function GameHud({
  state,
  authUser,
  currentScreen,
  musicPlaying,
  onNavigate,
  onOpenEvidenceDrawer,
  onOpenDecisionDrawer,
  onToggleSound,
  onToggleMusic,
  onLogout,
}: GameHudProps) {
  const rank = getAgentRank(state.xp, state.finalReportSaved);
  const badgeCount = getEarnedBadgeIds(state).length;
  const displayName =
    state.profile?.name || authUser?.profile?.name || authUser?.username || 'Ejen Bahasa';
  const isHq = currentScreen === 'hq';

  const [displayedXp, setDisplayedXp] = useState(state.xp);
  const [failMenuOpen, setFailMenuOpen] = useState(false);
  const failMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isHq) {
      setDisplayedXp(state.xp);
      return;
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || state.xp === 0) {
      setDisplayedXp(state.xp);
      return;
    }

    let rafId = 0;
    const duration = 680;
    const startVal = 0;
    const targetVal = state.xp;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedXp(Math.round(startVal + (targetVal - startVal) * eased));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [isHq, state.xp]);

  useEffect(() => {
    if (!failMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (failMenuRef.current && !failMenuRef.current.contains(e.target as Node)) {
        setFailMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFailMenuOpen(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [failMenuOpen]);

  const [avatarFailed, setAvatarFailed] = useState(false);

  const xpNextTarget = state.xp < 250 ? 250 : state.xp < 600 ? 600 : 1200;
  const xpProgressPct = state.finalReportSaved
    ? 100
    : Math.min(100, Math.round(((isHq ? displayedXp : state.xp) / xpNextTarget) * 100));
  const shownXp = isHq ? displayedXp : state.xp;
  const agentInitials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'EB';

  return (
    <header className="no-print sticky top-0 z-30 bg-gradient-to-b from-[#174C39] via-[#134332] to-[#103D30] text-[#FFFFFF] border-b-2 border-[#E7C878]/90 shadow-[0_6px_22px_rgba(10,34,24,0.42)] pt-[env(safe-area-inset-top)]">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* FAR LEFT + LEFT-CENTRE: Detective Academy Crest + Existing Agent Avatar & Rank */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('hq')}
            aria-label="Pusat Operasi Detective Academy"
            className="group relative flex items-center shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878]"
          >
            <AcademyEmblem className="w-11 h-11 sm:w-12 sm:h-12 drop-shadow-[0_3px_8px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-105" />
          </button>

          {/* Agent Avatar + Name + Rank */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#E7C878] bg-[#F5E8CF] shadow-md shrink-0 flex items-center justify-center text-[#174C39] font-display font-bold text-xs">
              {!avatarFailed ? (
                <img
                  src="/assets/aistudio/Professor_Detective_in_the_Investigation_Office_54081002.png"
                  alt={`Avatar ${displayName}`}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <span>{agentInitials}</span>
              )}
              <span
                aria-hidden="true"
                className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#174C39] border border-[#E7C878] flex items-center justify-center"
              >
                <UserCheck className="w-2 h-2 text-[#E7C878]" />
              </span>
            </div>

            <div className="min-w-0">
              <p className="font-display font-bold text-xs sm:text-sm truncate text-[#FFFFFF] leading-tight max-w-[130px] sm:max-w-[185px]">
                {displayName}
              </p>
              <p className="text-[11px] text-[#E7C878] font-semibold flex items-center gap-1 truncate">
                <Star className="w-3 h-3 fill-[#E7C878] text-[#E7C878] shrink-0" />
                <span className="truncate">Rank: {rank}</span>
              </p>
            </div>
          </div>
        </div>

        {/* CENTRE: XP Progress Bar + Badge Counter */}
        <div className="hidden md:flex items-center gap-2.5 lg:gap-3 px-2.5 lg:px-3.5 py-1 rounded-xl bg-[#0D3327]/75 border border-[#E7C878]/45 shadow-inner shrink-0">
          <div className="flex flex-col gap-1 min-w-[104px] lg:min-w-[148px]">
            <div className="flex items-center justify-between gap-2 font-mono-tabular text-[11px] lg:text-xs leading-none">
              <span className="font-extrabold text-[#E7C878]">XP</span>
              <span className="font-bold text-[#FFFFFF]">
                <span data-testid="hud-xp-value">{shownXp}</span>
                <span className="text-[#DCE9D9]/80 font-medium"> / {xpNextTarget}</span>
              </span>
            </div>
            <div
              aria-hidden="true"
              className="w-24 lg:w-36 xl:w-40 h-2.5 rounded-full bg-[#072219] border border-[#E7C878]/60 overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#C99A34] via-[#E7C878] to-[#FFF2B2] transition-all duration-500"
                style={{ width: `${xpProgressPct}%` }}
              />
            </div>
          </div>

          <div
            title={`Lencana Diperoleh: ${badgeCount}/5`}
            className="hidden xl:flex items-center gap-1.5 pl-2.5 border-l border-[#E7C878]/30 shrink-0"
          >
            <Award className="w-4 h-4 text-[#E7C878]" />
            <span
              data-testid="hud-badge-value"
              className="font-mono-tabular text-xs font-bold text-[#F5E8CF] whitespace-nowrap"
            >
              {badgeCount}/5
            </span>
          </div>
        </div>

        {/* CENTRE: Forest Green & Gold Navigation Deck */}
        <nav
          aria-label="Navigasi Utama Ejen"
          className="hidden sm:flex items-center gap-0.5 lg:gap-1 p-1 rounded-xl bg-[#0D3327]/95 border border-[#E7C878]/65 shadow-inner shrink-0"
        >
          <button
            type="button"
            onClick={() => onNavigate('hq')}
            aria-current={isHq ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 min-h-[38px] rounded-lg text-[11px] lg:text-xs font-bold whitespace-nowrap shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878] ${
              isHq
                ? 'bg-[#174C39] text-[#E7C878] border border-[#E7C878]/70 shadow-sm'
                : 'text-[#F5E8CF] hover:bg-[#174C39]/75 hover:text-[#FFFFFF] border border-transparent'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#E7C878]" />
            <span>Pusat Operasi</span>
          </button>

          <span aria-hidden="true" className="h-5 w-px bg-[#E7C878]/25" />

          <button
            type="button"
            onClick={onOpenEvidenceDrawer}
            className="inline-flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 min-h-[38px] rounded-lg text-[11px] lg:text-xs font-bold text-[#F5E8CF] hover:bg-[#174C39]/75 hover:text-[#FFFFFF] border border-transparent whitespace-nowrap shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878]"
          >
            <Briefcase className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#E7C878]" />
            <span>Fail Bukti</span>
          </button>

          <span aria-hidden="true" className="h-5 w-px bg-[#E7C878]/25" />

          <button
            type="button"
            onClick={onOpenDecisionDrawer}
            className="inline-flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 min-h-[38px] rounded-lg text-[11px] lg:text-xs font-bold text-[#F5E8CF] hover:bg-[#174C39]/75 hover:text-[#FFFFFF] border border-transparent whitespace-nowrap shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878]"
          >
            <Trophy className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#E7C878]" />
            <span>Kad Keputusan</span>
          </button>
        </nav>

        {/* RIGHT: Sound, Music & Log Keluar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Compact XP + Menu (< sm) */}
          <div className="flex sm:hidden items-center gap-1 text-[11px] font-mono-tabular font-bold text-[#E7C878] mr-0.5">
            <span data-testid="hud-xp-value-mobile">{shownXp} XP</span>
          </div>

          <div className="relative sm:hidden" ref={failMenuRef}>
            <button
              type="button"
              onClick={() => setFailMenuOpen((prev) => !prev)}
              aria-expanded={failMenuOpen}
              aria-haspopup="menu"
              aria-label="Menu Fail dan Pusat Operasi"
              className="inline-flex items-center gap-1 px-2.5 min-h-[38px] rounded-xl bg-[#0D3327] hover:bg-[#174C39] border border-[#E7C878]/65 text-xs font-semibold text-[#F5E8CF] whitespace-nowrap shrink-0 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#E7C878]" />
              <span>Menu</span>
              <ChevronDown
                className={`w-3 h-3 text-[#E7C878] transition-transform ${
                  failMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {failMenuOpen && (
              <div
                role="menu"
                aria-label="Menu Fail Ejen"
                className="absolute right-0 mt-2 w-52 rounded-xl bg-[#FFFFFF] border-2 border-[#E7C878] shadow-xl p-1.5 z-50 text-[#26382F]"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setFailMenuOpen(false);
                    onNavigate('hq');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 min-h-[44px] rounded-lg text-left text-sm font-bold text-[#174C39] hover:bg-[#F5E8CF]"
                >
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  <span>Pusat Operasi</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setFailMenuOpen(false);
                    onOpenEvidenceDrawer();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 min-h-[44px] rounded-lg text-left text-sm font-semibold text-[#26382F] hover:bg-[#F5E8CF]"
                >
                  <Briefcase className="w-4 h-4 text-[#174C39] shrink-0" />
                  <span>Fail Bukti</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setFailMenuOpen(false);
                    onOpenDecisionDrawer();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 min-h-[44px] rounded-lg text-left text-sm font-semibold text-[#26382F] hover:bg-[#F5E8CF]"
                >
                  <Trophy className="w-4 h-4 text-[#174C39] shrink-0" />
                  <span>Kad Keputusan</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={state.soundEnabled ? 'Bisukan bunyi' : 'Aktifkan bunyi'}
            title={state.soundEnabled ? 'Bisukan bunyi kesan' : 'Aktifkan bunyi kesan'}
            className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878] ${
              state.soundEnabled
                ? 'bg-[#0D3327] hover:bg-[#174C39] border-[#E7C878]/75 text-[#E7C878]'
                : 'bg-[#09241B] hover:bg-[#103D30] border-[#E7C878]/35 text-[#F5E8CF]/55'
            }`}
          >
            {state.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleMusic}
            aria-label={musicPlaying ? 'Hentikan muzik latar' : 'Mainkan muzik latar'}
            title={musicPlaying ? 'Muzik latar aktif' : 'Mainkan muzik latar'}
            aria-pressed={musicPlaying}
            className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878] ${
              musicPlaying
                ? 'bg-[#E7C878] text-[#103D30] border-[#FFFFFF] shadow-[0_0_12px_rgba(231,200,120,0.45)]'
                : 'bg-[#0D3327] hover:bg-[#174C39] border-[#E7C878]/75 text-[#E7C878]'
            }`}
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            aria-label="Log keluar daripada akaun ejen"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 min-h-[38px] rounded-xl bg-[#0D3327] hover:bg-[#1C5B44] border border-[#E7C878]/75 text-xs font-bold text-[#F5E8CF] hover:text-[#FFFFFF] whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878]"
          >
            <LogOut className="w-3.5 h-3.5 text-[#E7C878]" />
            <span className="hidden lg:inline">Log Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
