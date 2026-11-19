import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Download,
  FileCode2,
  FolderOpen,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  UserCog,
  X,
} from 'lucide-react';
import officeBackdropUrl from '../assets/images/detective_office_backdrop_1794998231603.jpg';
import { gameAudio } from '../game/audio';
import { BADGES, LOCATIONS } from '../game/data';
import {
  getAgentRank,
  getCompletedLocationsCount,
  getEarnedBadgeIds,
  getOverallProgressPercent,
  getUnlockedPhaseLevel,
  isPhase1Complete,
  isPhase2Complete,
  isPhase3Complete,
  isPhase4Complete,
} from '../game/rules';
import type { AppScreen, AuthUser, GameState, LocationId } from '../game/types';
import { AgentIdCard } from './AgentIdCard';
import { CinematicRevealIntro, type IntroScenePhase } from './CinematicRevealIntro';
import { CollectibleBadgeShield, TeacherBooksStackArt } from './DetectiveArt';
import { MissionStatusSection } from './MissionStatusSection';
import { PetaOperasiSection } from './PetaOperasiSection';

interface HqDashboardProps {
  state: GameState;
  authUser: AuthUser;
  onNavigatePhase: (screen: AppScreen, locationId?: LocationId) => void;
  onOpenEvidenceDrawer: () => void;
  onOpenDecisionDrawer: () => void;
  onExportJson: () => void;
  onResetGame: () => void;
  onLogout: () => void;
  onToggleSound?: () => void;
}

const CELEBRATION_SNAPSHOT_PREFIX = 'ejen_hq_celebration_snapshot_v1:';
const INTRO_SEEN_KEY = 'ejen_3d_intro_seen_v1';
const HOLD_RESET_DURATION_MS = 3000;

const SPARKLE_PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const dist = 75 + ((i * 29) % 115);
  return {
    id: i,
    tx: `${Math.round(Math.cos(angle) * dist)}px`,
    ty: `${Math.round(Math.sin(angle) * dist - 35)}px`,
    delay: `${(i % 5) * 0.06}s`,
    dur: `${1.15 + (i % 4) * 0.18}s`,
    size: i % 3 === 0 ? 10 : 7,
  };
});

export function HqDashboard({
  state,
  authUser,
  onNavigatePhase,
  onExportJson,
  onResetGame,
  onToggleSound,
}: HqDashboardProps) {
  const [idModalOpen, setIdModalOpen] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [portraitFailed, setPortraitFailed] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  const [reducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem(INTRO_SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [introPhase, setIntroPhase] = useState<IntroScenePhase | null>(() =>
    showIntro ? 'darkness' : null
  );

  const [selectedLocId, setSelectedLocId] = useState<LocationId>(() => {
    const nextOpen = LOCATIONS.find((l) => !state.investigations[l.id].completed);
    return nextOpen ? nextOpen.id : LOCATIONS[0].id;
  });

  const [showSparkles, setShowSparkles] = useState(false);
  const [newlyEarnedIds, setNewlyEarnedIds] = useState<string[]>([]);
  const [phaseBannerMsg, setPhaseBannerMsg] = useState<string | null>(null);

  const [holdProgress, setHoldProgress] = useState(0);
  const [isHoldingReset, setIsHoldingReset] = useState(false);
  const holdRafRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);

  const completedCount = getCompletedLocationsCount(state);
  const unlockedLevel = getUnlockedPhaseLevel(state);
  const progressPercent = getOverallProgressPercent(state);
  const earnedBadges = getEarnedBadgeIds(state);
  const rank = getAgentRank(state.xp, state.finalReportSaved);

  const [animatedGaugePct, setAnimatedGaugePct] = useState(0);

  const activeProfile = state.profile || authUser.profile;
  const displayName = activeProfile?.name || authUser.username;

  const nurinInstruction = useMemo(() => {
    if (unlockedLevel === 1) {
      return `Teruskan siasatan anda, Ejen! Pilih mana-mana daripada 4 lokasi di Peta Operasi (${completedCount}/4 selesai).`;
    }
    if (unlockedLevel === 2) {
      return 'Keempat-empat lokasi telah selesai disiasat! Buka Makmal Analisis Kes untuk memilih bukti terbaik.';
    }
    if (unlockedLevel === 3) {
      return 'Ayat pendapat anda sangat baik! Uji kekuatan alasan dalam Buktikan Teori Ejen.';
    }
    if (unlockedLevel === 4) {
      return 'Semua bukti dan hujah lengkap. Masuk ke Studio Arkitek untuk merancang Pelan Sekolah Impian!';
    }
    return 'Pelan Sekolah Impian telah dibina. Lengkapkan Laporan Sekolah Impian sebagai produk akhir!';
  }, [unlockedLevel, completedCount]);

  const [typedInstruction, setTypedInstruction] = useState(nurinInstruction);

  // Smooth circular gauge sweep animation on load/update
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setAnimatedGaugePct(progressPercent);
      return;
    }
    const timer = window.setTimeout(() => {
      setAnimatedGaugePct(progressPercent);
    }, 90);
    return () => window.clearTimeout(timer);
  }, [progressPercent]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setTypedInstruction(nurinInstruction);
      return;
    }

    setTypedInstruction('');
    let idx = 0;
    const timer = window.setInterval(() => {
      idx += 1;
      setTypedInstruction(nurinInstruction.slice(0, idx));
      if (idx >= nurinInstruction.length) {
        window.clearInterval(timer);
      }
    }, 15);

    return () => window.clearInterval(timer);
  }, [nurinInstruction]);

  const handleCompleteIntro = () => {
    try {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // Ignore storage errors
    }
    setShowIntro(false);
    setIntroPhase(null);
  };

  const handleReplayIntro = () => {
    if (state.soundEnabled) gameAudio.playTransition();
    setIntroPhase('darkness');
    setShowIntro(true);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const completedPhasesCount = [
      isPhase1Complete(state),
      isPhase2Complete(state),
      isPhase3Complete(state),
      isPhase4Complete(state),
      state.finalReportSaved,
    ].filter(Boolean).length;

    const snapshotKey = `${CELEBRATION_SNAPSHOT_PREFIX}${authUser.username}`;
    try {
      const rawPrev = window.sessionStorage.getItem(snapshotKey);
      if (rawPrev) {
        const prev = JSON.parse(rawPrev) as {
          badges: string[];
          phases: number;
        };
        const freshBadges = earnedBadges.filter((id) => !prev.badges.includes(id));
        const gainedPhase = completedPhasesCount > prev.phases;

        if (freshBadges.length > 0 || gainedPhase) {
          setNewlyEarnedIds(freshBadges);
          setPhaseBannerMsg(
            freshBadges.length > 0
              ? 'Tahniah, Ejen! Lencana baharu telah dibuka di dalam koleksi anda.'
              : 'Misi selesai! Peringkat penyiasatan seterusnya kini dibuka.'
          );

          const prefersReduced =
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (!prefersReduced) {
            setShowSparkles(true);
          }

          window.sessionStorage.setItem(
            snapshotKey,
            JSON.stringify({ badges: earnedBadges, phases: completedPhasesCount })
          );

          const hideTimer = window.setTimeout(() => {
            setShowSparkles(false);
            setPhaseBannerMsg(null);
          }, 3600);
          return () => window.clearTimeout(hideTimer);
        }
      }
      window.sessionStorage.setItem(
        snapshotKey,
        JSON.stringify({ badges: earnedBadges, phases: completedPhasesCount })
      );
    } catch {
      // Ignore sessionStorage errors
    }
  }, [authUser.username, earnedBadges, state]);

  useEffect(() => {
    if (!idModalOpen && !teacherOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIdModalOpen(false);
        setTeacherOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [idModalOpen, teacherOpen]);

  useEffect(() => {
    return () => {
      if (holdRafRef.current !== null) {
        window.cancelAnimationFrame(holdRafRef.current);
      }
    };
  }, []);

  const handleToggleVoiceBrief = () => {
    if (!speechSupported) return;
    const synth = window.speechSynthesis;
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(nurinInstruction);
    const voices = synth.getVoices();
    const malayVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith('ms')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('id'));
    if (malayVoice) utterance.voice = malayVoice;
    utterance.lang = malayVoice?.lang || 'ms-MY';
    utterance.rate = 0.96;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synth.speak(utterance);
  };

  const handleContinueAdventure = () => {
    if (unlockedLevel === 1) {
      const nextLoc = LOCATIONS.find((l) => !state.investigations[l.id].completed) || LOCATIONS[0];
      onNavigatePhase('phase1', nextLoc.id);
    } else if (unlockedLevel === 2) {
      onNavigatePhase('phase2');
    } else if (unlockedLevel === 3) {
      onNavigatePhase('phase3');
    } else if (unlockedLevel === 4) {
      onNavigatePhase('phase4');
    } else {
      onNavigatePhase('phase5');
    }
  };

  const cancelHoldReset = () => {
    if (holdRafRef.current !== null) {
      window.cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
    setIsHoldingReset(false);
    setHoldProgress(0);
  };

  const startHoldReset = () => {
    if (isHoldingReset) return;
    setIsHoldingReset(true);
    holdStartRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - holdStartRef.current;
      const pct = Math.min(100, (elapsed / HOLD_RESET_DURATION_MS) * 100);
      setHoldProgress(pct);
      if (elapsed >= HOLD_RESET_DURATION_MS) {
        holdRafRef.current = null;
        setIsHoldingReset(false);
        setHoldProgress(0);
        setTeacherOpen(false);
        onResetGame();
        return;
      }
      holdRafRef.current = window.requestAnimationFrame(tick);
    };

    holdRafRef.current = window.requestAnimationFrame(tick);
  };

  const phases = [
    {
      level: 1,
      screen: 'phase1' as AppScreen,
      shortTag: 'FASA 1',
      title: 'Operasi Jejak Bukti',
      desc: 'Siasat 4 lokasi di Sekolah Seri Bestari dan kumpulkan bukti persekitaran.',
      status: isPhase1Complete(state)
        ? 'Selesai (4/4 Lokasi)'
        : `${completedCount}/4 Lokasi Selesai`,
      unlocked: true,
      done: isPhase1Complete(state),
    },
    {
      level: 2,
      screen: 'phase2' as AppScreen,
      shortTag: 'FASA 2',
      title: 'Makmal Analisis Kes',
      desc: 'Pilih 2–3 bukti utama di papan penyiasatan dan bina ayat pendapat anda.',
      status: isPhase2Complete(state)
        ? 'Selesai'
        : isPhase1Complete(state)
          ? 'Terbuka'
          : 'Terkunci · Selesaikan Fasa 1',
      unlocked: isPhase1Complete(state),
      done: isPhase2Complete(state),
    },
    {
      level: 3,
      screen: 'phase3' as AppScreen,
      shortTag: 'FASA 3',
      title: 'Buktikan Teori Ejen',
      desc: 'Kuasai cabaran alasan relevan dan tuliskan hujah sokongan bagi pendapat anda.',
      status: isPhase3Complete(state)
        ? 'Selesai'
        : isPhase2Complete(state)
          ? 'Terbuka'
          : 'Terkunci · Selesaikan Fasa 2',
      unlocked: isPhase2Complete(state),
      done: isPhase3Complete(state),
    },
    {
      level: 4,
      screen: 'phase4' as AppScreen,
      shortTag: 'CABARAN AKHIR',
      title: 'Studio Arkitek',
      desc: 'Reka Pelan Sekolah Impian dengan School Builder dan pautkan justifikasi bukti.',
      status: isPhase4Complete(state)
        ? 'Selesai'
        : isPhase3Complete(state)
          ? 'Terbuka'
          : 'Terkunci · Selesaikan Fasa 3',
      unlocked: isPhase3Complete(state),
      done: isPhase4Complete(state),
    },
    {
      level: 5,
      screen: 'phase5' as AppScreen,
      shortTag: 'PRODUK AKHIR',
      title: 'Laporan Sekolah Impian',
      desc: 'Tulis laporan pendapat 3–5 ayat, pratonton dan cetak hasil rasmi.',
      status: state.finalReportSaved
        ? 'Selesai · Laporan Disimpan'
        : isPhase4Complete(state)
          ? 'Terbuka'
          : 'Terkunci · Selesaikan Studio Arkitek',
      unlocked: isPhase4Complete(state),
      done: state.finalReportSaved,
    },
  ];

  const activeNextPhase = phases.find((p) => p.level === unlockedLevel) || phases[0];

  // Circular mission completion gauge SVG geometry (Row 2 Hero)
  const gaugeRadius = 36;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeDashOffset = gaugeCircumference * (1 - animatedGaugePct / 100);

  // Circular countdown geometry for 3s hold-to-reset button (Ruang Guru modal)
  const ringRadius = 15;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - holdProgress / 100);
  const remainingHoldSeconds = Math.max(
    1,
    Math.ceil(((100 - holdProgress) / 100) * (HOLD_RESET_DURATION_MS / 1000))
  );

  const activeBadgeDetail = BADGES.find((b) => b.id === selectedBadgeId) || null;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-x-clip bg-[#1D3226]">
      {/* CHILD 1: Warm Detective Academy Office Backdrop & Investigation Desk Atmosphere */}
      <div aria-hidden="true" className="no-print fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={officeBackdropUrl}
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(245, 232, 207, 0.28) 0%, rgba(232, 212, 176, 0.22) 48%, rgba(56, 35, 18, 0.52) 80%, rgba(36, 21, 10, 0.78) 100%)',
          }}
        />
      </div>

      {/* CHILD 2 (Focus Mode Target): Main Headquarters Layout Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-6 pt-3 sm:pt-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] space-y-4 text-[#26382F]">
        {/* Genuine Mission Completion Notification Banner */}
        {phaseBannerMsg && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl bg-[#FFFFFF] border-2 border-[#E7C878] px-4 py-2.5 shadow-lg flex items-center gap-3 text-sm font-semibold text-[#174C39]"
          >
            <Sparkles className="w-4 h-4 text-[#C79329] shrink-0" />
            <span>{phaseBannerMsg}</span>
          </div>
        )}

        {/* =================================================================
            ROW 2: WIDE WELCOME HERO BANNER
           ================================================================= */}
        <section
          aria-label="Ibu Pejabat Siasatan Ejen"
          className="hq-stage-1 hq-command-banner relative rounded-2xl border-2 border-[#E7C878] px-4 sm:px-6 py-3 sm:py-3.5 text-[#FFFFFF] overflow-hidden"
        >
          {/* Decorative Gold Corner Accents */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#F5E8CF]/80 rounded-tl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#F5E8CF]/80 rounded-tr"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#F5E8CF]/80 rounded-bl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#F5E8CF]/80 rounded-br"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* LEFT SIDE (2 cols): Existing Detective Character Portrait */}
            <div className="lg:col-span-2 flex justify-center lg:justify-start">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-[#E7C878] bg-[#F5E8CF] shadow-[0_10px_24px_rgba(0,0,0,0.4)] shrink-0">
                {!portraitFailed ? (
                  <img
                    src="/assets/aistudio/Professor_Detective_in_the_Investigation_Office_54081002.png"
                    alt={`Potret ${displayName}`}
                    referrerPolicy="no-referrer"
                    onError={() => setPortraitFailed(true)}
                    className="w-full h-full object-cover object-top scale-[1.03]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#174C39] text-[#E7C878] font-display">
                    <span className="text-3xl font-bold">EB</span>
                  </div>
                )}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-[#103D30]/60 to-transparent"
                />
              </div>
            </div>

            {/* CENTRE (6 cols): Welcome Headline, Active Member, Rank Pill, Circular Progress % & Quick Actions */}
            <div className="lg:col-span-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-2 text-center sm:text-left min-w-0">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FFF7DC] leading-tight hq-title-glow">
                    SELAMAT KEMBALI, EJEN!
                  </h1>
                  <p className="text-xs sm:text-sm text-[#DCE9D9] font-medium mt-0.5 truncate">
                    Anggota Aktif: <strong className="text-[#FFFFFF]">{displayName}</strong>
                    {activeProfile?.className ? ` · Kelas ${activeProfile.className}` : ''}
                  </p>
                </div>

                {/* Rank Plaque + Utility Controls */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#0D3327] to-[#174C39] border border-[#E7C878] shadow-inner">
                    <Star className="w-4 h-4 fill-[#E7C878] text-[#E7C878] shrink-0" />
                    <span className="text-xs font-bold text-[#F5E8CF] whitespace-nowrap">
                      Rank: <strong className="text-[#FFFFFF]">{rank}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleContinueAdventure}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-b from-[#FFF1B8] via-[#E7C878] to-[#C89426] hover:brightness-105 text-[#103D30] border border-[#FFFFFF]/80 text-xs font-extrabold shadow-sm transition-transform hover:-translate-y-0.5 whitespace-nowrap"
                  >
                    <span>Sambung Misi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] font-semibold text-[#E7C878]">
                  <button
                    type="button"
                    onClick={() => onNavigatePhase('profile')}
                    className="inline-flex items-center gap-1 hover:text-[#FFFFFF] underline underline-offset-4 transition-colors"
                  >
                    <UserCog className="w-3 h-3" />
                    <span>{activeProfile?.agentId ? 'Kemaskini Identiti' : 'Daftar Identiti'}</span>
                  </button>
                  {activeProfile?.agentId && (
                    <>
                      <span aria-hidden="true" className="text-[#E7C878]/40">
                        ·
                      </span>
                      <button
                        type="button"
                        onClick={() => setIdModalOpen(true)}
                        className="inline-flex items-center gap-1 hover:text-[#FFFFFF] underline underline-offset-4 transition-colors"
                      >
                        <BadgeCheck className="w-3 h-3" />
                        <span>Kad Identiti Digital</span>
                      </button>
                    </>
                  )}
                  <span aria-hidden="true" className="text-[#E7C878]/40">
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={handleReplayIntro}
                    className="inline-flex items-center gap-1 hover:text-[#FFFFFF] underline underline-offset-4 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    <span>Main Intro</span>
                  </button>
                </div>
              </div>

              {/* Circular Mission Completion Progress Indicator */}
              <div className="flex flex-col items-center justify-center shrink-0 px-2">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88" aria-hidden="true">
                    <defs>
                      <linearGradient id="hqHeroRing" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4ADE80" />
                        <stop offset="60%" stopColor="#E7C878" />
                        <stop offset="100%" stopColor="#FFF2B2" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="44"
                      cy="44"
                      r={gaugeRadius}
                      fill="#0B2E24"
                      stroke="rgba(231, 200, 120, 0.25)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="44"
                      cy="44"
                      r={gaugeRadius}
                      fill="none"
                      stroke="url(#hqHeroRing)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={gaugeCircumference}
                      strokeDashoffset={gaugeDashOffset}
                      style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-mono-tabular text-xl font-extrabold text-[#FFFFFF] leading-none">
                      {progressPercent}%
                    </span>
                    <span className="text-[10px] font-bold text-[#DCE9D9] mt-0.5">
                      Misi Selesai
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE (4 cols): Large Cream-Coloured Confidential Briefing Document */}
            <div className="lg:col-span-4">
              <div className="hq-cream-scroll relative rounded-xl border-2 border-[#C7A972] px-4 py-3 text-[#26382F]">
                {/* Red Pushpin */}
                <span
                  aria-hidden="true"
                  className="absolute -top-2 left-4 w-4 h-4 rounded-full bg-gradient-to-br from-[#F87171] via-[#DC2626] to-[#7F1D1D] border border-[#FFFFFF] shadow"
                />
                <p className="text-xs sm:text-[13px] font-semibold leading-relaxed text-[#26382F] min-h-[3.3rem]">
                  {typedInstruction}
                  {typedInstruction.length < nurinInstruction.length && (
                    <span
                      aria-hidden="true"
                      className="inline-block w-1.5 h-3.5 ml-1 bg-[#174C39] align-middle animate-pulse"
                    />
                  )}
                </p>
                <p className="mt-1 text-right font-display text-xs font-bold text-[#174C39]">
                  – Profesor Nurin
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            ROW 3: LARGE 3D SCHOOL CAMPUS MAP (LEFT/CENTRE) + PROFESSOR NURIN (RIGHT)
           ================================================================= */}
        <PetaOperasiSection
          state={state}
          completedCount={completedCount}
          selectedLocId={selectedLocId}
          introPhase={showIntro ? introPhase : null}
          nurinGuidanceText={nurinInstruction}
          isSpeaking={isSpeaking}
          speechSupported={speechSupported}
          onToggleVoiceBrief={handleToggleVoiceBrief}
          onSelectLocId={setSelectedLocId}
          onNavigatePhase={onNavigatePhase}
          nextMission={{
            level: activeNextPhase.level,
            screen: activeNextPhase.screen,
            shortTag: activeNextPhase.shortTag,
            title: activeNextPhase.title,
            desc: activeNextPhase.desc,
            status: activeNextPhase.status,
          }}
        />

        {/* =================================================================
            ROW 4: TIMELINE MISI (LEFT) | GALERI LENCANA EJEN (CENTRE) | RUANG GURU (RIGHT)
           ================================================================= */}
        <div className="hq-stage-3 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* BOTTOM LEFT (6 cols): TIMELINE MISI */}
          <div className="lg:col-span-6">
            <MissionStatusSection
              phases={phases}
              unlockedLevel={unlockedLevel}
              xp={state.xp}
              soundEnabled={state.soundEnabled}
              onNavigatePhase={onNavigatePhase}
            />
          </div>

          {/* BOTTOM CENTRE (4 cols): GALERI LENCANA EJEN */}
          <section
            aria-label="Galeri Lencana Ejen"
            className="lg:col-span-4 flex flex-col pt-3"
          >
            <div className="hq-gallery-vault flex-1 rounded-2xl border-2 border-[#E7C878] p-3.5 sm:p-4 flex flex-col justify-between gap-3 text-[#FFFFFF]">
              {/* Top Header */}
              <div className="flex items-center justify-between gap-2 border-b border-[#E7C878]/35 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Trophy className="w-4 h-4 text-[#E7C878] shrink-0" />
                  <h2 className="font-display text-sm sm:text-base font-extrabold tracking-wide text-[#FFF3C4] uppercase truncate">
                    GALERI LENCANA EJEN
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#09241B] border border-[#E7C878]/60 font-mono-tabular text-xs font-bold text-[#F5E8CF] shrink-0">
                  <Award className="w-3.5 h-3.5 text-[#E7C878]" />
                  {earnedBadges.length} / {BADGES.length}
                </span>
              </div>

              {/* Horizontal Collectible Badge Shields */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 items-stretch">
                {BADGES.map((badge) => {
                  const earned = earnedBadges.includes(badge.id);
                  const isNew = newlyEarnedIds.includes(badge.id);
                  const isSelected = selectedBadgeId === badge.id;

                  return (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() =>
                        setSelectedBadgeId((curr) => (curr === badge.id ? null : badge.id))
                      }
                      title={`${badge.name}: ${badge.description}`}
                      aria-label={`${badge.name} (${earned ? 'Diperoleh' : 'Terkunci'})`}
                      className={`group relative rounded-xl p-1.5 sm:p-2 border flex flex-col items-center text-center justify-between gap-1.5 transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878] ${
                        earned
                          ? 'bg-[#174C39]/90 border-[#E7C878]/85 shadow-[0_0_14px_rgba(231,200,120,0.22)]'
                          : 'bg-[#09241B]/80 border-[#E7C878]/25 opacity-80 hover:opacity-100'
                      } ${isSelected ? 'ring-2 ring-[#FFF2B2]' : ''} ${isNew ? 'hq-badge-pop' : ''}`}
                    >
                      <CollectibleBadgeShield
                        badgeId={badge.id}
                        earned={earned}
                        className="w-10 h-11 xl:w-12 xl:h-14 transition-transform group-hover:scale-105"
                      />
                      <span
                        className={`text-[10px] leading-tight font-bold line-clamp-2 ${
                          earned ? 'text-[#FFF3C4]' : 'text-[#A8C5A0]'
                        }`}
                      >
                        {earned ? badge.name : '???'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Contextual Badge Requirement Caption */}
              <div className="rounded-lg bg-[#09241B]/80 border border-[#E7C878]/30 px-2.5 py-1.5 text-[11px] text-[#DCE9D9] min-h-[34px] flex items-center justify-between gap-2">
                {activeBadgeDetail ? (
                  <>
                    <span className="truncate">
                      <strong className="text-[#E7C878]">{activeBadgeDetail.name}:</strong>{' '}
                      {activeBadgeDetail.description}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedBadgeId(null)}
                      aria-label="Tutup info lencana"
                      className="text-[#E7C878] hover:text-[#FFFFFF] shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="text-[#DCE9D9]/90">
                    Klik mana-mana perisai lencana untuk melihat syarat pembukaannya.
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* BOTTOM RIGHT (2 cols): RUANG GURU */}
          <section
            aria-label="Ruang Guru"
            className="lg:col-span-2 flex flex-col pt-3"
          >
            <div className="hq-cream-scroll flex-1 rounded-2xl border-2 border-[#E7C878] overflow-hidden flex flex-col justify-between text-[#26382F]">
              {/* Top Forest Green Header */}
              <div className="bg-gradient-to-r from-[#103D30] to-[#174C39] border-b-2 border-[#E7C878] px-3 py-2 flex items-center justify-center gap-2 text-[#FFFFFF]">
                <BookOpen className="w-4 h-4 text-[#E7C878] shrink-0" />
                <h2 className="font-display text-sm font-extrabold tracking-wide uppercase whitespace-nowrap">
                  RUANG GURU
                </h2>
              </div>

              {/* Illustrated Book Stack & Description */}
              <div className="px-3 py-2.5 flex flex-col items-center text-center gap-1.5 flex-1 justify-center">
                <TeacherBooksStackArt className="w-24 h-16 sm:w-28 sm:h-18" />
                <p className="text-[11px] sm:text-xs font-semibold text-[#26382F] leading-snug">
                  Akses sumber pembelajaran dan rekod murid di sini.
                </p>
              </div>

              {/* Gold Buka Fail Action Button */}
              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    if (state.soundEnabled) gameAudio.playClick();
                    setTeacherOpen(true);
                  }}
                  className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-b from-[#FFF0B5] via-[#E7C878] to-[#C89426] hover:brightness-105 text-[#103D30] border-2 border-[#9B701A] font-display font-extrabold text-xs shadow-md transition-transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <span>Buka Fail</span>
                  <Play className="w-3 h-3 fill-[#103D30] text-[#103D30]" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* CHILD 3+: Subtle Gold Sparkles (triggered on genuine phase/badge completion) */}
      {showSparkles && (
        <div
          aria-hidden="true"
          className="no-print pointer-events-none fixed inset-x-0 top-28 z-50 flex justify-center"
        >
          <div className="relative w-1 h-1">
            {SPARKLE_PARTICLES.map((p) => (
              <span
                key={p.id}
                className="hq-sparkle-piece absolute block rounded-full bg-[#E7B94F] shadow-[0_0_8px_rgba(231,185,79,0.85)]"
                style={
                  {
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    '--tx': p.tx,
                    '--ty': p.ty,
                    '--delay': p.delay,
                    '--dur': p.dur,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* CINEMATIC OPENING REVEAL OVERLAY */}
      {showIntro && (
        <CinematicRevealIntro
          soundEnabled={state.soundEnabled}
          reducedMotion={reducedMotion}
          onSceneChange={setIntroPhase}
          onComplete={handleCompleteIntro}
          onToggleSound={() => onToggleSound?.()}
        />
      )}

      {/* RUANG GURU MODAL (Preserves JSON Export, HTML Self-Contained Download & 3s Hold-to-Reset) */}
      {teacherOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ruang Guru dan Pengurusan Rekod Murid"
          onClick={() => setTeacherOpen(false)}
          className="fixed inset-0 z-50 bg-[#0A1E17]/70 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl hq-cream-scroll rounded-2xl border-2 border-[#E7C878] p-5 sm:p-6 text-[#26382F] shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#C7A972] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#174C39] border border-[#E7C878] text-[#E7C878] flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#174C39]">
                    FAIL REKOD & ARKIB KES
                  </p>
                  <h2 className="font-display text-xl font-bold text-[#26382F]">RUANG GURU</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTeacherOpen(false)}
                aria-label="Tutup Ruang Guru"
                className="w-9 h-9 rounded-lg bg-[#174C39] hover:bg-[#103D30] text-[#FFFFFF] border border-[#E7C878] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-[#26382F] leading-relaxed">
              Kemajuan murid disimpan secara automatik dalam storan setempat pelayar. Gunakan
              kawalan di bawah untuk mengeksport rekod, memuat turun fail kendiri, atau menetapkan
              semula operasi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onExportJson}
                className="w-full inline-flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-xl bg-[#FFFFFF] hover:bg-[#DCE9D9] border border-[#C7A972] text-[#26382F] text-sm font-semibold transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 text-[#174C39]" />
                <span>Eksport Rekod Murid (JSON)</span>
              </button>

              <a
                href="/EJEN_BAHASA.html"
                download="EJEN_BAHASA.html"
                className="w-full inline-flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-xl bg-[#FFFFFF] hover:bg-[#DCE9D9] text-[#26382F] border border-[#C7A972] text-sm font-semibold transition-colors shadow-sm"
              >
                <FileCode2 className="w-4 h-4 text-[#174C39]" />
                <span>Muat Turun Fail Kendiri (EJEN_BAHASA.html)</span>
              </a>
            </div>

            <div className="pt-2 border-t border-[#C7A972]/60 space-y-2">
              <button
                type="button"
                onPointerDown={startHoldReset}
                onPointerUp={cancelHoldReset}
                onPointerLeave={cancelHoldReset}
                onPointerCancel={cancelHoldReset}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
                    e.preventDefault();
                    startHoldReset();
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    cancelHoldReset();
                  }
                }}
                aria-label="Tekan dan tahan selama 3 saat untuk menetapkan semula operasi"
                className="w-full inline-flex items-center justify-center gap-3 px-4 min-h-[52px] rounded-xl bg-[#C2593F] hover:bg-[#a94830] text-[#FFFFFF] border border-[#C2593F] text-sm font-bold select-none transition-colors shadow-sm"
              >
                <span className="relative inline-flex items-center justify-center w-9 h-9 shrink-0">
                  <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                    <circle
                      cx="18"
                      cy="18"
                      r={ringRadius}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r={ringRadius}
                      fill="none"
                      stroke="#E7C878"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringDashOffset}
                    />
                  </svg>
                  {isHoldingReset ? (
                    <span className="absolute font-mono-tabular text-xs font-extrabold text-[#FFFFFF]">
                      {remainingHoldSeconds}
                    </span>
                  ) : (
                    <RotateCcw className="absolute w-3.5 h-3.5 text-[#E7C878]" />
                  )}
                </span>

                <span>
                  {isHoldingReset
                    ? `Menetapkan semula (${remainingHoldSeconds}s)...`
                    : 'Tetapkan Semula Operasi (Tahan 3s)'}
                </span>
              </button>
              <p className="text-xs text-[#4B6357] leading-snug">
                Tekan dan tahan butang selama 3 saat untuk memadam semua bukti dan memulakan operasi
                semula. Lepaskan lebih awal untuk membatalkan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL AGENT IDENTITY CARD MODAL */}
      {idModalOpen && activeProfile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Kad Identiti Rasmi Ejen"
          onClick={() => setIdModalOpen(false)}
          className="fixed inset-0 z-50 bg-[#0A1E17]/70 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl space-y-3">
            <div className="no-print flex justify-end">
              <button
                type="button"
                onClick={() => setIdModalOpen(false)}
                aria-label="Tutup Kad Identiti"
                className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-[#FFFFFF] border-2 border-[#E7C878] text-sm font-semibold text-[#26382F] shadow-lg hover:bg-[#F5F0E5]"
              >
                <X className="w-4 h-4 text-[#174C39]" />
                <span>Tutup</span>
              </button>
            </div>
            <AgentIdCard profile={activeProfile} rankLabel={rank} />
          </div>
        </div>
      )}
    </div>
  );
}
