import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Music,
  Shield,
  ShieldCheck,
  Star,
  User,
  UserPlus,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import perpustakaanPhotoUrl from '../assets/images/perpustakaan_ilmu_realistik_1794832156528.jpg';
import latarAkademiImg from '../assets/images/secret_academy_school_1794825908324.jpg';
import { gameAudio } from '../game/audio';
import {
  loginAgent,
  registerAgentAccount,
  resetAgentPassword,
} from '../game/authClient';
import { validateLoginInput } from '../game/rules';
import type { AuthUser } from '../game/types';
import { AcademyEmblem } from './DetectiveArt';

interface LoginScreenProps {
  onBack: () => void;
  onAuthenticated: (user: AuthUser) => void;
  soundEnabled?: boolean;
  musicPlaying?: boolean;
  onToggleSound?: () => void;
  onToggleMusic?: () => void;
}

const REMEMBERED_USERNAME_KEY = 'ejen_remembered_username_v1';

const DIALOGUE_WELCOME =
  'Selamat datang, Ejen! Sahkan kod identiti anda untuk membuka fail kes Operasi Bahasa Hilang.';
const DIALOGUE_CHECKING =
  'Sebentar ya… saya sedang menyemak pengesahan akses anda di terminal.';
const DIALOGUE_SUCCESS = 'Akses dibenarkan! Misi di Sekolah Seri Bestari diaktifkan.';
const DIALOGUE_ERROR =
  'Hmm, akses ditolak. Sila semak ID Ejen dan Kod Keselamatan anda.';

type AuthPhase = 'idle' | 'scanning' | 'granted';

function DetectiveHatLogoAccent() {
  return (
    <svg
      viewBox="0 0 96 66"
      className="w-16 h-11 sm:w-20 sm:h-14 -rotate-[16deg] drop-shadow-[0_6px_12px_rgba(0,0,0,0.75)]"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fedoraBody" x1="12" y1="8" x2="78" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8C5D32" />
          <stop offset="55%" stopColor="#5D3A1B" />
          <stop offset="100%" stopColor="#321D0D" />
        </linearGradient>
        <linearGradient id="fedoraBand" x1="20" y1="30" x2="76" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF0B5" />
          <stop offset="50%" stopColor="#D9B45B" />
          <stop offset="100%" stopColor="#8E6420" />
        </linearGradient>
      </defs>
      <path
        d="M23 36L29 14C31 8 38 7 47 10C57 6 66 8 68 15L74 36H23Z"
        fill="url(#fedoraBody)"
        stroke="#D9B45B"
        strokeWidth="1.5"
      />
      <path d="M24 31H73L74 36.5H23L24 31Z" fill="url(#fedoraBand)" />
      <ellipse
        cx="48"
        cy="38.5"
        rx="41"
        ry="10.5"
        fill="#412611"
        stroke="#E7C878"
        strokeWidth="1.6"
      />
      <ellipse cx="48" cy="37" rx="34" ry="6.2" fill="none" stroke="#8C5D32" strokeWidth="1" />
    </svg>
  );
}

function GoldMagnifierLogoAccent() {
  return (
    <svg
      viewBox="0 0 88 88"
      className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-[0_6px_14px_rgba(0,0,0,0.75)]"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="magGoldRim" x1="10" y1="8" x2="78" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF3B8" />
          <stop offset="45%" stopColor="#DFB44D" />
          <stop offset="100%" stopColor="#8A5E18" />
        </linearGradient>
        <radialGradient id="magLens" cx="0.38" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="#E4FFFF" stopOpacity="0.65" />
          <stop offset="55%" stopColor="#7AD6D0" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#123E34" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <line
        x1="54"
        y1="54"
        x2="78"
        y2="78"
        stroke="#3A2210"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <line
        x1="54"
        y1="54"
        x2="78"
        y2="78"
        stroke="url(#magGoldRim)"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <circle cx="36" cy="36" r="24" fill="url(#magLens)" stroke="url(#magGoldRim)" strokeWidth="6" />
      <circle cx="36" cy="36" r="19" stroke="#FFF4C8" strokeOpacity="0.55" strokeWidth="1.2" />
      <path d="M23 27C26 21 32 18 39 18.5" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

function VintageBooksDeskArt() {
  return (
    <svg
      viewBox="0 0 320 135"
      className="w-60 sm:w-64 h-auto drop-shadow-[0_14px_26px_rgba(0,0,0,0.85)]"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bookLeather" x1="0" y1="0" x2="220" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5C3A22" />
          <stop offset="55%" stopColor="#3B2313" />
          <stop offset="100%" stopColor="#211209" />
        </linearGradient>
        <linearGradient id="brassRim" x1="120" y1="10" x2="270" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF2B8" />
          <stop offset="50%" stopColor="#D6A949" />
          <stop offset="100%" stopColor="#7C541A" />
        </linearGradient>
      </defs>

      {/* Bottom Thick Book */}
      <path d="M8 78L206 58L244 92L40 124L8 78Z" fill="#2A190E" stroke="#7A5622" strokeWidth="1.5" />
      <path d="M40 112L242 82L242 96L40 128Z" fill="#D5C49E" stroke="#5A4223" strokeWidth="1" />
      <path d="M8 78L40 112V128L8 92V78Z" fill="#3B2313" stroke="#9F7732" strokeWidth="1.2" />

      {/* Top Book: BAHASA MELAYU */}
      <path d="M18 46L212 30L248 64L52 90L18 46Z" fill="url(#bookLeather)" stroke="#C9A24B" strokeWidth="1.6" />
      <path d="M52 78L246 54L246 74L52 100Z" fill="#E6D8B8" stroke="#6E532E" strokeWidth="1" />
      <path d="M52 78L18 46V64L52 100V78Z" fill="#2C1A0E" stroke="#C9A24B" strokeWidth="1.2" />
      {/* Gold Spine Text on Spine Face */}
      <g transform="rotate(-7.2 145 72)">
        <text
          x="74"
          y="78"
          fill="#E7C878"
          fontSize="11.5"
          fontWeight="800"
          fontFamily="serif"
          letterSpacing="1.2"
        >
          BAHASA MELAYU
        </text>
        <text
          x="78"
          y="91"
          fill="#D4B56C"
          fontSize="7.5"
          fontWeight="700"
          fontFamily="serif"
          letterSpacing="1.8"
        >
          ILMU • BUDI • JAYA
        </text>
      </g>

      {/* Brass Magnifying Glass Resting on Top */}
      <line x1="212" y1="68" x2="294" y2="112" stroke="#2D1B0E" strokeWidth="12" strokeLinecap="round" />
      <line x1="212" y1="68" x2="294" y2="112" stroke="url(#brassRim)" strokeWidth="6.5" strokeLinecap="round" />
      <ellipse cx="170" cy="48" rx="44" ry="26" fill="#DCEEE8" fillOpacity="0.22" stroke="url(#brassRim)" strokeWidth="7" />
      <path d="M142 40C152 30 172 28 190 32" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function QuillFeatherArt() {
  return (
    <svg
      viewBox="0 0 92 92"
      className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="quillPlume" x1="24" y1="80" x2="82" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9B7532" />
          <stop offset="45%" stopColor="#E6C674" />
          <stop offset="100%" stopColor="#FFF2C4" />
        </linearGradient>
      </defs>
      <path
        d="M22 78C26 55 44 26 80 10C76 34 62 56 32 72L22 78Z"
        fill="url(#quillPlume)"
        stroke="#6B4D18"
        strokeWidth="1.4"
      />
      <path d="M14 84L80 10" stroke="#FFF4CC" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 84L26 73L22 79L14 84Z" fill="#FFD45C" />
    </svg>
  );
}

export function LoginScreen({
  onBack,
  onAuthenticated,
  soundEnabled,
  musicPlaying,
  onToggleSound,
  onToggleMusic,
}: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [accountRole, setAccountRole] = useState<'student' | 'teacher'>('student');
  const [teacherCode, setTeacherCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('6 Bestari');
  const [username, setUsername] = useState(() => {
    try {
      return window.localStorage.getItem(REMEMBERED_USERNAME_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authPhase, setAuthPhase] = useState<AuthPhase>('idle');
  const [bgZooming, setBgZooming] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [bgFailed, setBgFailed] = useState(false);
  const [portraitFailed, setPortraitFailed] = useState(false);
  const [localSoundOn, setLocalSoundOn] = useState(true);
  const [localMusicOn, setLocalMusicOn] = useState(false);

  // Typewriter dialogue state for Profesor Nurin
  const [nurinTargetText, setNurinTargetText] = useState(DIALOGUE_WELCOME);
  const [nurinTypedText, setNurinTypedText] = useState('');
  const [entered, setEntered] = useState(false);

  // Password reset modal state
  const [resetUser, setResetUser] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStatus, setResetStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Refs for parallax, particles canvas, and focus transfer
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const pauseParallaxRef = useRef(false);

  const isBusy = authPhase !== 'idle';
  const effectiveSoundOn = soundEnabled ?? localSoundOn;
  const effectiveMusicOn = musicPlaying ?? localMusicOn;

  const handleSoundButton = () => {
    if (onToggleSound) {
      onToggleSound();
      return;
    }
    const next = !localSoundOn;
    setLocalSoundOn(next);
    gameAudio.setEnabled(next);
    if (!next) setLocalMusicOn(false);
  };

  const handleMusicButton = () => {
    if (onToggleMusic) {
      onToggleMusic();
      return;
    }
    if (!localSoundOn) {
      setLocalSoundOn(true);
      gameAudio.setEnabled(true);
    }
    const playing = gameAudio.toggleAmbient();
    setLocalMusicOn(playing);
  };

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 40);
    return () => {
      window.clearTimeout(t);
      timersRef.current.forEach((id) => window.clearTimeout(id));
      document.body.classList.remove('leaving');
    };
  }, []);

  // Typewriter effect for Profesor Nurin dialogue
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setNurinTypedText(nurinTargetText);
      return;
    }

    setNurinTypedText('');
    let idx = 0;
    const interval = window.setInterval(() => {
      idx += 1;
      setNurinTypedText(nurinTargetText.slice(0, idx));
      if (idx >= nurinTargetText.length) {
        window.clearInterval(interval);
      }
    }, 20);

    return () => window.clearInterval(interval);
  }, [nurinTargetText]);

  // Subtle background parallax
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let rafId = 0;

    const tick = () => {
      if (!pauseParallaxRef.current) {
        curX += (targetX - curX) * 0.08;
        curY += (targetY - curY) * 0.08;
        if (parallaxRef.current) {
          parallaxRef.current.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0)`;
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onPointerMove = (e: PointerEvent) => {
      const nx = e.clientX / Math.max(window.innerWidth, 1) - 0.5;
      const ny = e.clientY / Math.max(window.innerHeight, 1) - 0.5;
      targetX = -nx * 14;
      targetY = -ny * 9;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  // Floating atmospheric golden dust & fireflies
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const particleCount = width < 640 ? 22 : 36;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.1 + (i % 3) * 0.75,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -0.14 - Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
      isFirefly: i % 3 === 0,
    }));

    let rafId = 0;
    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      const t = now * 0.0015;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + Math.sin(t + p.phase) * 0.12;
        p.y += p.vy;

        if (p.y < -12) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -12) p.x = width + 10;
        if (p.x > width + 12) p.x = -10;

        const alpha = p.isFirefly
          ? 0.3 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.2 + p.phase))
          : 0.2 + 0.25 * (0.5 + 0.5 * Math.sin(t + p.phase));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.isFirefly
          ? `rgba(255, 224, 130, ${alpha.toFixed(3)})`
          : `rgba(201, 162, 75, ${alpha.toFixed(3)})`;
        ctx.shadowColor = 'rgba(201, 162, 75, 0.8)';
        ctx.shadowBlur = p.isFirefly ? 10 : 4;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const triggerFailureFeedback = (msg: string) => {
    gameAudio.playError();
    setError(msg);
    setShakeKey((k) => k + 1);
    setNurinTargetText(DIALOGUE_ERROR);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      triggerFailureFeedback('Sila isi ID Ejen anda.');
      return;
    }
    if (!password) {
      triggerFailureFeedback('Sila masukkan Kod Keselamatan anda.');
      return;
    }

    const check = validateLoginInput(trimmedUser, password);
    if (!check.valid) {
      triggerFailureFeedback(check.error || 'Sila lengkapkan maklumat log masuk anda.');
      return;
    }

    gameAudio.playClick();
    setError('');
    setAuthPhase('scanning');
    setNurinTargetText(DIALOGUE_CHECKING);

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      const minScan = prefersReduced
        ? Promise.resolve()
        : new Promise<void>((r) => window.setTimeout(r, 480));

      if (mode === 'register' && accountRole === 'teacher' && !teacherCode.trim()) {
        setAuthPhase('idle');
        triggerFailureFeedback('Sila masukkan Kod Pengesahan Guru rasmi (contoh: GURU2026).');
        return;
      }

      const [res] = await Promise.all([
        mode === 'login'
          ? loginAgent({ username: trimmedUser, password, rememberMe })
          : registerAgentAccount({
              username: trimmedUser,
              password,
              rememberMe,
              accountRole,
              teacherCode: accountRole === 'teacher' ? teacherCode.trim() : undefined,
              fullName: fullName.trim() || undefined,
              className: accountRole === 'student' ? className.trim() : undefined,
            }),
        minScan,
      ]);

      if (!res.ok || !res.user) {
        setAuthPhase('idle');
        const friendlyErr =
          mode === 'login' && res.error?.toLowerCase().includes('tidak tepat')
            ? 'ID Ejen atau Kod Keselamatan tidak betul. Cuba lagi.'
            : res.error || 'ID Ejen atau Kod Keselamatan tidak betul. Cuba lagi.';
        triggerFailureFeedback(friendlyErr);
        return;
      }

      try {
        if (rememberMe) {
          window.localStorage.setItem(REMEMBERED_USERNAME_KEY, trimmedUser);
        } else {
          window.localStorage.removeItem(REMEMBERED_USERNAME_KEY);
        }
      } catch {
        // Ignore storage errors
      }

      setAuthPhase('granted');
      setNurinTargetText(DIALOGUE_SUCCESS);

      if (prefersReduced) {
        const reducedTimer = window.setTimeout(() => {
          onAuthenticated(res.user!);
        }, 400);
        timersRef.current.push(reducedTimer);
        return;
      }

      const leavingTimer = window.setTimeout(() => {
        document.body.classList.add('leaving');
      }, 900);

      const zoomTimer = window.setTimeout(() => {
        pauseParallaxRef.current = true;
        if (parallaxRef.current) {
          parallaxRef.current.style.transition = 'transform 0.5s ease';
          parallaxRef.current.style.transform = 'translate3d(0px, 0px, 0)';
        }
        setBgZooming(true);
      }, 1400);

      const flashTimer = window.setTimeout(() => {
        setFlashOn(true);
      }, 4200);

      const navTimer = window.setTimeout(() => {
        document.body.classList.remove('leaving');
        onAuthenticated(res.user!);
      }, 5000);

      timersRef.current.push(leavingTimer, zoomTimer, flashTimer, navTimer);
    } catch {
      setAuthPhase('idle');
      triggerFailureFeedback('Gagal menghubungi pelayan pengesahan. Sila cuba sebentar lagi.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);
    setResetLoading(true);
    try {
      const res = await resetAgentPassword({
        username: resetUser.trim(),
        recoveryCode: recoveryCode.trim(),
        newPassword,
      });
      if (res.ok) {
        gameAudio.playSuccess();
        setResetStatus({
          type: 'ok',
          text: res.message || 'Kata laluan berjaya ditetapkan semula.',
        });
        setUsername(resetUser.trim());
        setPassword('');
      } else {
        gameAudio.playError();
        setResetStatus({
          type: 'err',
          text: res.error || 'Gagal menetapkan semula kata laluan.',
        });
      }
    } catch {
      setResetStatus({
        type: 'err',
        text: 'Ralat sambungan pelayan semasa tetapan semula.',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleFillDemo = () => {
    if (isBusy) return;
    gameAudio.playClick();
    setMode('login');
    setUsername('ejen.bestari');
    setPassword('Bestari#2026');
    setError('');
    setNurinTargetText(DIALOGUE_WELCOME);
    window.setTimeout(() => {
      submitBtnRef.current?.focus();
    }, 30);
  };

  const handleFillTeacherDemo = () => {
    if (isBusy) return;
    gameAudio.playClick();
    setMode('login');
    setUsername('profesor.nurin');
    setPassword('Akademi#2026');
    setError('');
    setNurinTargetText(
      'Selamat datang kembali, Profesor! Sahkan identiti anda untuk membuka Pusat Kawalan Analitik Guru.'
    );
    window.setTimeout(() => {
      submitBtnRef.current?.focus();
    }, 30);
  };

  const systemStatusText =
    authPhase === 'scanning'
      ? 'MENGESAHKAN IDENTITI...'
      : authPhase === 'granted'
        ? 'AKSES DIBENARKAN'
        : 'MENUNGGU PENGESAHAN';

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden bg-[#061D17] text-[#F5ECD4] flex flex-col justify-between"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      {/* 1. FULL-SCREEN MYSTERIOUS MOONLIT DETECTIVE ACADEMY BACKGROUND */}
      <div
        id="login-bg"
        aria-hidden="true"
        className={`fixed inset-0 z-0 overflow-hidden pointer-events-none ${
          bgZooming ? 'zoom' : ''
        }`}
        style={{
          background:
            'radial-gradient(circle at 60% 18%, #163C34 0%, #09241D 46%, #04130F 100%)',
        }}
      >
        <div
          ref={parallaxRef}
          className={`absolute -inset-6 transition-opacity duration-1000 ${
            entered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Base Mystery Academy Clocktower Scene */}
          {!bgFailed && (
            <img
              src={latarAkademiImg}
              alt=""
              onError={() => setBgFailed(true)}
              className="login-bg-zoom w-full h-full object-cover object-[64%_42%] opacity-90"
            />
          )}

          {/* Luminous Full Moon & Mysterious Helicopter Silhouette in Night Sky */}
          <svg
            viewBox="0 0 1440 800"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 w-full h-full"
            fill="none"
          >
            <defs>
              <radialGradient id="fullMoonGlow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#FFFDF2" stopOpacity="0.96" />
                <stop offset="45%" stopColor="#F8ECC4" stopOpacity="0.72" />
                <stop offset="72%" stopColor="#8CC7B8" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#09241D" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="heliBeam" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFF0B5" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#FFF0B5" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Full Moon behind the academy spire */}
            <circle cx="850" cy="145" r="145" fill="url(#fullMoonGlow)" />
            <circle cx="850" cy="145" r="56" fill="#FCF6DC" fillOpacity="0.92" />
            <circle cx="835" cy="135" r="12" fill="#E6D7AA" fillOpacity="0.32" />
            <circle cx="868" cy="160" r="16" fill="#E6D7AA" fillOpacity="0.24" />

            {/* Mysterious Helicopter Silhouette + Searchlight Cone */}
            <g transform="translate(760, 74)">
              <polygon points="48,38 118,98 84,114" fill="url(#heliBeam)" />
              <line x1="6" y1="12" x2="84" y2="8" stroke="#081713" strokeWidth="3" strokeLinecap="round" />
              <ellipse cx="46" cy="28" rx="20" ry="10" fill="#0B1F19" stroke="#C9A24B" strokeOpacity="0.35" strokeWidth="1" />
              <path d="M26 26L0 18L3 24L26 30Z" fill="#0B1F19" />
              <line x1="34" y1="38" x2="58" y2="38" stroke="#0B1F19" strokeWidth="2.4" />
              <circle cx="58" cy="34" r="3" fill="#FFE68A" />
            </g>
          </svg>

          {/* Subtle Left Peeking Classified Evidence Folder Backdrop */}
          <div className="hidden lg:block absolute -left-8 top-[24%] w-52 h-64 -rotate-[12deg] rounded-lg bg-[#D7C49E]/25 border border-[#C9A24B]/30 backdrop-blur-[1px] p-4 opacity-55">
            <div className="border-2 border-[#9B2C22]/70 px-2 py-0.5 inline-block -rotate-6 text-[11px] font-mono-tabular font-black tracking-widest text-[#E0685A]/80">
              CLASSIFIED
            </div>
          </div>

          {/* Emerald Cinematic Grading & Vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 68% 64% at 62% 36%, rgba(8, 32, 25, 0.08) 0%, rgba(7, 29, 23, 0.45) 55%, rgba(4, 17, 13, 0.88) 100%)',
            }}
          />

          {/* Warm Window Glow & Atmospheric Courtyard Fog */}
          <div
            className="login-window-flicker absolute right-[24%] top-[24%] w-[28%] h-[34%] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(244, 206, 114, 0.24) 0%, rgba(201, 162, 75, 0.08) 48%, transparent 74%)',
            }}
          />
          <div
            className="mist-drift absolute inset-x-[-10%] bottom-[6%] h-44 opacity-45"
            style={{
              background:
                'radial-gradient(ellipse at 52% 68%, rgba(212, 235, 224, 0.2) 0%, rgba(124, 184, 158, 0.08) 46%, transparent 72%)',
            }}
          />
        </div>

        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* 2. FOREGROUND GAME INTERFACE (Targeted Selector Element) */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto flex-1 flex flex-col justify-between gap-3 sm:gap-4">
        {/* TOP SECTION: UPPER-LEFT EJEN BAHASA BRANDING + UPPER-RIGHT AKADEMI EJEN BAHASA & AUDIO */}
        <header
          className={`login-ui-fade flex flex-col lg:flex-row lg:items-start justify-between gap-3 transition-all duration-700 ease-out ${
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          {/* Upper-Left Branding */}
          <div className="space-y-1.5">
            <button
              type="button"
              disabled={isBusy}
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#082920]/85 hover:bg-[#114234] border border-[#C9A24B]/50 text-[11px] font-bold text-[#F5ECD4] shadow transition-colors disabled:opacity-60"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#E7C878]" />
              <span>Kembali ke Laman Utama</span>
            </button>

            <div className="relative inline-flex items-center gap-1 sm:gap-2 pt-1 pl-2 sm:pl-4">
              {/* Tilted Detective Fedora Hat perched on left */}
              <div className="-mt-8 -mr-7 sm:-mr-8 relative z-20 pointer-events-none">
                <DetectiveHatLogoAccent />
              </div>

              <div className="relative z-10 text-center sm:text-left">
                <h1
                  className="font-display text-3xl sm:text-5xl lg:text-[3.35rem] font-black tracking-wide leading-none text-transparent bg-clip-text bg-gradient-to-b from-[#FFF3C4] via-[#E7C05B] to-[#A67822]"
                  style={{
                    filter: 'drop-shadow(0 4px 12px rgba(4, 17, 13, 0.95))',
                  }}
                >
                  EJEN BAHASA
                </h1>
                <div className="mt-1 flex items-center justify-center sm:justify-start gap-2.5">
                  <span className="h-[2px] w-8 sm:w-14 bg-gradient-to-r from-transparent to-[#E7C878]" />
                  <p
                    className="font-display text-sm sm:text-xl font-bold tracking-wide text-[#F5ECD4]"
                    style={{ textShadow: '0 2px 10px rgba(4, 17, 13, 0.95)' }}
                  >
                    Operasi Sekolah Impian
                  </p>
                  <span className="h-[2px] w-8 sm:w-14 bg-gradient-to-l from-transparent to-[#E7C878]" />
                </div>
              </div>

              {/* Gleaming Gold Magnifying Glass on right */}
              <div className="-ml-2 -mt-2 relative z-20 pointer-events-none">
                <GoldMagnifierLogoAccent />
              </div>
            </div>
          </div>

          {/* Upper-Right Compact Academy Identity Panel + Audio Controls */}
          <div className="flex items-center justify-end gap-2.5 self-end lg:self-start">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-b from-[#0E372C]/92 to-[#07201A]/95 border-2 border-[#C9A24B]/80 shadow-[0_10px_28px_rgba(0,0,0,0.6)]">
              <AcademyEmblem className="w-9 h-9 shrink-0" />
              <div className="leading-tight">
                <p className="font-display text-xs sm:text-sm font-extrabold tracking-wider text-[#F5ECD4]">
                  AKADEMI EJEN BAHASA
                </p>
                <p className="text-[11px] font-semibold text-[#D9B45B]">
                  Sekolah Seri Bestari
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSoundButton}
              aria-label={effectiveSoundOn ? 'Senyapkan kesan bunyi' : 'Aktifkan kesan bunyi'}
              title={effectiveSoundOn ? 'Kesan Bunyi: Aktif' : 'Kesan Bunyi: Senyap'}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${
                effectiveSoundOn
                  ? 'bg-[#0C3127]/95 border-[#D9B45B] text-[#FFD45C] hover:bg-[#144739]'
                  : 'bg-[#071D17]/90 border-[#6E8078] text-[#9EB0A8]'
              }`}
            >
              {effectiveSoundOn ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleMusicButton}
              aria-label={effectiveMusicOn ? 'Hentikan muzik latar' : 'Mainkan muzik latar'}
              title={effectiveMusicOn ? 'Muzik Latar: Aktif' : 'Muzik Latar: Mati'}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${
                effectiveMusicOn
                  ? 'bg-[#D9B45B] border-[#FFF2C4] text-[#07201A]'
                  : 'bg-[#0C3127]/95 border-[#D9B45B] text-[#FFD45C] hover:bg-[#144739]'
              }`}
            >
              <Music className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MIDDLE COMPOSITION: LEFT (PROFESOR NURIN) + CENTRE-LEFT (MISSION BRIEFING DOSSIER) + RIGHT (SECRET AGENT ACCESS TERMINAL) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-end">
          {/* LEFT SECTION: PROFESSOR NURIN (ORIGINAL PHOTOGRAPH PRESERVED) + DESK BOOKS */}
          <div
            className={`login-ui-fade lg:col-span-3 flex flex-col items-center lg:items-start gap-2.5 transition-all duration-700 delay-100 ease-out ${
              entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {/* Large Illuminated Gold Portrait Frame */}
            <div className="relative flex flex-col items-center">
              <div className="relative p-1.5 rounded-full bg-gradient-to-b from-[#FFF1B8] via-[#D9B45B] to-[#7D581B] shadow-[0_0_38px_rgba(231,200,120,0.42),0_18px_40px_rgba(0,0,0,0.75)]">
                <div className="p-1 rounded-full bg-[#07221B]">
                  <div className="relative w-40 h-40 sm:w-44 sm:h-44 xl:w-52 xl:h-52 rounded-full overflow-hidden border-2 border-[#E7C878]/85 bg-[#0C2F26]">
                    {!portraitFailed ? (
                      <img
                        src="/assets/aistudio/Professor_Detective_in_the_Investigation_Office_54081002.png"
                        alt="Profesor Nurin — Chief Investigator Akademi Ejen Bahasa"
                        referrerPolicy="no-referrer"
                        onError={() => setPortraitFailed(true)}
                        className="w-full h-full object-cover object-center scale-[1.03]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display text-3xl font-bold text-[#D9B45B]">
                        PN
                      </div>
                    )}
                  </div>
                </div>

                {/* Small Gold Detective Shield Accent on Rim (does not obscure photograph) */}
                <div
                  aria-hidden="true"
                  className="absolute bottom-3 right-2 w-8 h-8 rounded-full bg-[#07221B] border-2 border-[#FFD45C] flex items-center justify-center shadow-lg"
                >
                  <Shield className="w-4 h-4 text-[#FFD45C]" />
                </div>
              </div>

              {/* Black & Gold Nameplate */}
              <div className="-mt-4 relative z-10 px-5 py-1.5 rounded-xl bg-gradient-to-b from-[#172822] to-[#08120F] border-2 border-[#D9B45B] shadow-[0_10px_24px_rgba(0,0,0,0.85)] text-center min-w-[205px]">
                <p className="font-display text-sm sm:text-base font-black tracking-wider text-[#F7DA82]">
                  PROFESOR NURIN
                </p>
                <p className="font-mono-tabular text-[10px] font-bold tracking-[0.2em] text-[#F5ECD4]/90">
                  CHIEF INVESTIGATOR
                </p>
              </div>
            </div>

            {/* Compact Live Typewriter Status Dialogue */}
            <div
              aria-live="polite"
              className="w-full max-w-[280px] rounded-xl bg-[#07231C]/90 border border-[#C9A24B]/65 px-3 py-2 shadow-lg"
            >
              <p className="text-[11px] sm:text-xs leading-snug text-[#F5ECD4] font-medium">
                “{nurinTypedText}”
              </p>
            </div>

            {/* Foreground Decorative Vintage Books & Brass Magnifier (Desktop) */}
            <div className="hidden lg:block -mb-2 -ml-2 pointer-events-none select-none">
              <VintageBooksDeskArt />
            </div>
          </div>

          {/* CENTRE-LEFT SECTION: MISSION BRIEFING VINTAGE DOSSIER */}
          <div
            className={`login-ui-fade lg:col-span-4 transition-all duration-700 delay-200 ease-out ${
              entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {/* Layered Folder Wrapper */}
            <div className="relative mx-auto max-w-md lg:max-w-none pt-3 pr-2.5 pb-2">
              {/* Background Layered Document Sheets */}
              <div
                aria-hidden="true"
                className="absolute top-5 right-0 bottom-0 left-4 rounded-xl bg-[#A48A62] border border-[#5B4527] rotate-[1.8deg] shadow-xl"
              />
              <div
                aria-hidden="true"
                className="absolute top-4 right-1 bottom-1 left-2 rounded-xl bg-[#C2AA80] border border-[#6E5532] rotate-[0.9deg] shadow-lg"
              />

              {/* Top Folder Tab Ribbon: MISSION BRIEFING */}
              <div className="relative z-20 ml-3 -mb-3 inline-block px-5 py-1 rounded-t-lg bg-gradient-to-b from-[#172D25] to-[#0B1C16] border-2 border-[#D9B45B] shadow-md">
                <span className="font-mono-tabular text-xs font-extrabold tracking-[0.16em] text-[#F7DA82]">
                  MISSION BRIEFING
                </span>
              </div>

              {/* Main Aged Parchment Dossier Sheet */}
              <div
                className="relative z-10 rounded-xl border-2 border-[#C9A24B] shadow-[0_22px_50px_rgba(0,0,0,0.78)] overflow-hidden text-[#1E1912]"
                style={{
                  background:
                    'radial-gradient(circle at 22% 18%, #F3E4C3 0%, #DEC79A 55%, #C6A975 100%)',
                }}
              >
                {/* Aged Paper Edge Vignette */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 shadow-[inset_0_0_32px_rgba(74,48,18,0.38)]"
                />

                <div className="relative p-4 sm:p-5 space-y-3">
                  {/* Header + Red TOP SECRET Stamp */}
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div>
                      <p className="font-mono-tabular text-xs font-black tracking-widest text-[#3D2E1A]">
                        OPERASI:
                      </p>
                      <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-[#1A140D] leading-tight">
                        BAHASA HILANG
                      </h2>
                    </div>

                    <div
                      aria-label="Dokumen Top Secret"
                      className="shrink-0 rotate-[11deg] px-2.5 py-1 rounded border-2 border-[#9E241B] bg-[#F3E4C3]/40 shadow-xs"
                    >
                      <span className="font-mono-tabular text-xs sm:text-sm font-black tracking-widest text-[#9E241B]">
                        TOP SECRET
                      </span>
                    </div>
                  </div>

                  {/* Mysterious Library / Academy Photo with Torn Film Edges */}
                  <div className="relative rounded-md overflow-hidden border-[3px] border-[#3B2A16] shadow-[0_6px_16px_rgba(0,0,0,0.45)] aspect-[16/9] bg-[#1D150D]">
                    <img
                      src={perpustakaanPhotoUrl}
                      alt="Arkib Perpustakaan Misteri Sekolah Seri Bestari"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center sepia-[0.38] contrast-[1.08] brightness-[0.88]"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#1A1108]/60 via-transparent to-[#2D1C0B]/35"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 shadow-[inset_0_0_24px_rgba(20,12,5,0.75)]"
                    />
                  </div>

                  {/* Mission Description */}
                  <p className="text-xs sm:text-[13px] font-bold leading-relaxed text-[#221B12]">
                    “Satu kes misteri telah dilaporkan di Sekolah Seri Bestari. Semua ejen
                    dikehendaki mengaktifkan sistem dan memulakan penyiasatan.”
                  </p>
                </div>

                {/* Yellow & Black Hazard Divider Stripe */}
                <div
                  aria-hidden="true"
                  className="h-2.5 w-full border-y border-[#3B2A16]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(-45deg, #D9A738, #D9A738 10px, #1D1A14 10px, #1D1A14 20px)',
                  }}
                />

                {/* Dossier Bottom Bar: TAHAP KESUKARAN + Stars + MISTERI Badge */}
                <div className="relative px-4 py-2.5 bg-[#121D19] text-[#F5ECD4] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular text-[10px] sm:text-[11px] font-extrabold tracking-wider text-[#F5ECD4]">
                      TAHAP KESUKARAN:
                    </span>
                    <div className="flex items-center gap-0.5" aria-label="Tahap kesukaran 3 daripada 4 bintang">
                      <Star className="w-3.5 h-3.5 fill-[#FFD45C] text-[#FFD45C]" />
                      <Star className="w-3.5 h-3.5 fill-[#FFD45C] text-[#FFD45C]" />
                      <Star className="w-3.5 h-3.5 fill-[#FFD45C] text-[#FFD45C]" />
                      <Star className="w-3.5 h-3.5 text-[#8A7B56]" />
                    </div>
                  </div>

                  <span className="px-3 py-0.5 rounded bg-[#0A1310] border border-[#D9B45B] font-mono-tabular text-xs font-black tracking-widest text-[#F7DA82]">
                    MISTERI
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: SECRET AGENT ACCESS TERMINAL */}
          <div
            key={shakeKey}
            className={`login-ui-fade lg:col-span-5 relative transition-all duration-700 delay-300 ease-out ${
              entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            } ${shakeKey > 0 ? 'login-shake' : ''}`}
          >
            {/* Outer Futuristic Glowing Emerald & Antique Gold Terminal */}
            <div className="relative rounded-2xl p-[2px] bg-gradient-to-b from-[#2CF2AF] via-[#C9A24B] to-[#12D897] shadow-[0_0_40px_rgba(20,232,158,0.28),0_24px_60px_rgba(0,0,0,0.8)]">
              <div className="relative rounded-[14px] bg-gradient-to-b from-[#0A3127]/95 via-[#07241C]/96 to-[#051813]/98 p-4 sm:p-5 overflow-hidden">
                {/* Subtle Emerald Digital Grid Texture */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(44,242,175,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(44,242,175,0.12) 1px, transparent 1px)',
                    backgroundSize: '26px 26px',
                  }}
                />

                {/* Antique Gold Corner Brackets */}
                <span aria-hidden="true" className="pointer-events-none absolute top-2 left-2 w-5 h-5 border-t-[3px] border-l-[3px] border-[#FFD45C] rounded-tl" />
                <span aria-hidden="true" className="pointer-events-none absolute top-2 right-2 w-5 h-5 border-t-[3px] border-r-[3px] border-[#FFD45C] rounded-tr" />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-2 left-2 w-5 h-5 border-b-[3px] border-l-[3px] border-[#FFD45C] rounded-bl" />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 w-5 h-5 border-b-[3px] border-r-[3px] border-[#FFD45C] rounded-br" />

                {/* Animated Scan Line across Terminal during Authentication */}
                {authPhase === 'scanning' && (
                  <div
                    aria-hidden="true"
                    className="login-scan-line pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#2CF2AF] to-transparent shadow-[0_0_16px_#2CF2AF] z-20"
                  />
                )}

                {/* Gold Stamp "AKSES DIBENARKAN" Slam on Success */}
                {authPhase === 'granted' && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="pointer-events-none absolute inset-0 z-30 bg-[#062019]/80 flex items-center justify-center p-4"
                  >
                    <div className="login-stamp-slam px-6 py-3.5 rounded-xl border-4 border-[#FFD45C] bg-[#0B3328]/95 shadow-[0_0_44px_rgba(255,212,92,0.7)] text-center">
                      <p className="font-mono-tabular text-lg sm:text-2xl font-extrabold tracking-[0.22em] text-[#FFF3C4]">
                        AKSES DIBENARKAN
                      </p>
                    </div>
                  </div>
                )}

                {/* Terminal Header */}
                <div className="relative z-10 flex items-center justify-between gap-3 border-b border-[#2CF2AF]/30 pb-3 mb-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1 rounded-xl bg-[#07221B] border border-[#D9B45B]/75 shadow-inner shrink-0">
                      <AcademyEmblem className="w-10 h-10" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display text-lg sm:text-xl font-black tracking-wide text-[#F7DA82] leading-tight">
                        SECRET AGENT
                      </h2>
                      <p className="font-mono-tabular text-xs sm:text-sm font-extrabold tracking-[0.18em] text-[#FFFFFF]">
                        ACCESS TERMINAL
                      </p>
                    </div>
                  </div>

                  {/* Glowing Emerald Telemetry Bars */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div aria-hidden="true" className="flex items-center gap-1">
                      {[0, 1, 2, 3, 4].map((b) => (
                        <span
                          key={b}
                          className="w-2 h-4 -skew-x-[22deg] rounded-[1px] bg-gradient-to-b from-[#5BFFCA] to-[#12B981] shadow-[0_0_8px_rgba(44,242,175,0.6)]"
                        />
                      ))}
                    </div>
                    {mode === 'register' && (
                      <span className="px-2 py-0.5 rounded bg-[#FFD45C] text-[#07201A] font-mono-tabular text-[9px] font-black tracking-wider">
                        MOD PENDAFTARAN
                      </span>
                    )}
                  </div>
                </div>

                {/* Auth Form */}
                <form onSubmit={handleSubmit} noValidate className="relative z-10 space-y-3">
                  {mode === 'register' && (
                    <div className="rounded-xl bg-[#041913]/90 border border-[#2CF2AF]/35 p-2.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono-tabular text-[10px] font-extrabold tracking-widest uppercase text-[#F7DA82]">
                          PERANAN AKAUN
                        </span>
                        <div className="inline-flex rounded-lg bg-[#07241C] border border-[#D9B45B]/45 p-0.5">
                          <button
                            type="button"
                            onClick={() => setAccountRole('student')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                              accountRole === 'student'
                                ? 'bg-[#D9B45B] text-[#07201A]'
                                : 'text-[#DCE9DF] hover:text-white'
                            }`}
                          >
                            Ejen Murid
                          </button>
                          <button
                            type="button"
                            onClick={() => setAccountRole('teacher')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                              accountRole === 'teacher'
                                ? 'bg-[#36D9FF] text-[#07201A]'
                                : 'text-[#DCE9DF] hover:text-white'
                            }`}
                          >
                            Guru Pembimbing
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          disabled={isBusy}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder={
                            accountRole === 'teacher'
                              ? 'Nama Penuh Guru (cth: Cikgu Aina)'
                              : 'Nama Penuh Murid (pilihan)'
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-[#041913] border border-[#2CF2AF]/35 focus:border-[#FFD45C] focus:outline-none text-xs text-white placeholder-[#DCE9DF]/45"
                        />
                        {accountRole === 'teacher' ? (
                          <input
                            type="text"
                            disabled={isBusy}
                            value={teacherCode}
                            onChange={(e) => setTeacherCode(e.target.value)}
                            placeholder="Kod Guru (GURU2026)"
                            className="w-full px-3 py-1.5 rounded-lg bg-[#041913] border border-[#36D9FF]/55 focus:border-[#36D9FF] focus:outline-none text-xs text-white placeholder-[#DCE9DF]/45 font-mono-tabular"
                          />
                        ) : (
                          <select
                            disabled={isBusy}
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#041913] border border-[#2CF2AF]/35 focus:border-[#FFD45C] focus:outline-none text-xs text-white"
                          >
                            <option value="5 Bestari">5 Bestari</option>
                            <option value="5 Cemerlang">5 Cemerlang</option>
                            <option value="6 Bestari">6 Bestari</option>
                            <option value="6 Harmoni">6 Harmoni</option>
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ID EJEN */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#092B22] border border-[#D9B45B]/75 flex items-center justify-center shrink-0 shadow">
                      <User className="w-5 h-5 text-[#F7DA82]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor="login-username"
                        className="block font-mono-tabular text-[11px] font-extrabold tracking-widest uppercase text-[#F7DA82] mb-1"
                      >
                        ID EJEN
                      </label>
                      <input
                        id="login-username"
                        type="text"
                        disabled={isBusy}
                        autoComplete="username"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="Masukkan kod identiti anda..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#041913]/95 border border-[#2CF2AF]/45 focus:border-[#FFD45C] focus:ring-2 focus:ring-[#2CF2AF]/35 focus:outline-none text-[#FFFFFF] placeholder-[#DCE9DF]/50 text-sm transition-colors disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* KOD KESELAMATAN */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#092B22] border border-[#D9B45B]/75 flex items-center justify-center shrink-0 shadow">
                      <Lock className="w-5 h-5 text-[#F7DA82]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor="login-password"
                        className="block font-mono-tabular text-[11px] font-extrabold tracking-widest uppercase text-[#F7DA82] mb-1"
                      >
                        KOD KESELAMATAN
                      </label>
                      <div className="relative">
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          disabled={isBusy}
                          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) setError('');
                          }}
                          placeholder={
                            mode === 'login'
                              ? 'Masukkan kata laluan anda...'
                              : 'Minimum 6 aksara rahsia...'
                          }
                          className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-[#041913]/95 border border-[#2CF2AF]/45 focus:border-[#FFD45C] focus:ring-2 focus:ring-[#2CF2AF]/35 focus:outline-none text-[#FFFFFF] placeholder-[#DCE9DF]/50 text-sm transition-colors disabled:opacity-60"
                        />
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Sembunyi kata laluan' : 'Papar kata laluan'}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#D9B45B] hover:text-[#FFFFFF] transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pl-[52px] text-xs">
                    <label className="inline-flex items-center gap-2 text-[#DCE9DF] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={isBusy}
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-[#D9B45B] bg-[#041913] accent-[#FFD45C]"
                      />
                      <span className="font-semibold">Ingat saya</span>
                    </label>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        gameAudio.playClick();
                        setResetUser(username);
                        setResetStatus(null);
                        setForgotOpen(true);
                      }}
                      className="font-semibold text-[#D9B45B] hover:text-[#FFF3C4] underline underline-offset-4 transition-colors"
                    >
                      Lupa kata laluan?
                    </button>
                  </div>

                  {/* Validation Error */}
                  <div aria-live="polite">
                    {error && (
                      <div
                        role="alert"
                        className="p-2.5 rounded-xl bg-[#4A1C15]/95 border border-[#E57B63] text-xs font-medium text-[#FDEAE6] flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 text-[#F29C85] shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  {/* Dominant Illuminated Gold Action Button: AKTIFKAN MISI */}
                  <button
                    ref={submitBtnRef}
                    type="submit"
                    disabled={isBusy}
                    className="group relative overflow-hidden w-full min-h-[50px] inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-b from-[#FFF0AE] via-[#E4BA4E] to-[#B48120] hover:brightness-105 active:scale-[0.985] disabled:opacity-75 text-[#08221A] border-2 border-[#FFF8D8] font-display text-base sm:text-lg font-black tracking-wider uppercase shadow-[0_0_28px_rgba(255,212,92,0.52)] transition-all"
                  >
                    {authPhase === 'scanning' && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-full bg-[#FFFFFF]/30 origin-left transition-transform duration-500"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] group-hover:translate-x-[320%] transition-transform duration-700"
                    />
                    <span className="relative w-7 h-7 rounded-lg bg-[#08221A] text-[#FFD45C] flex items-center justify-center shadow">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <span className="relative">
                      {authPhase === 'scanning'
                        ? 'MENGESAHKAN...'
                        : mode === 'login'
                          ? 'AKTIFKAN MISI'
                          : 'DAFTAR & AKTIFKAN MISI'}
                    </span>
                  </button>
                </form>

                {/* Preserved Registration & Access Recovery Links */}
                <div className="relative z-10 mt-3.5 pt-3 border-t border-[#2CF2AF]/25 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs font-bold">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      gameAudio.playClick();
                      setMode((prev) => (prev === 'login' ? 'register' : 'login'));
                      setError('');
                      setNurinTargetText(DIALOGUE_WELCOME);
                    }}
                    className="inline-flex items-center gap-1.5 text-[#F5ECD4] hover:text-[#FFD45C] underline underline-offset-4 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#FFD45C]" />
                    <span>
                      {mode === 'login' ? 'Pendaftaran Ejen' : 'Kembali ke Log Masuk'}
                    </span>
                  </button>

                  <span aria-hidden="true" className="text-[#D9B45B]/60">
                    |
                  </span>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      gameAudio.playClick();
                      setResetUser(username);
                      setResetStatus(null);
                      setForgotOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-[#F5ECD4] hover:text-[#FFD45C] underline underline-offset-4 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#FFD45C]" />
                    <span>Pemulihan Akses</span>
                  </button>
                </div>

                {/* Compact Demo Access Helper Slip */}
                <div className="relative z-10 mt-3 rounded-xl border border-dashed border-[#D9B45B]/55 bg-[#051B15]/85 px-3 py-2 flex flex-col gap-1.5 font-mono-tabular">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[10px] sm:text-[11px] leading-snug text-[#DCE9DF]">
                      <span className="text-[#FFD45C] font-bold">Demo Murid: </span>
                      <strong className="text-[#FFFFFF]">ejen.bestari</strong> /{' '}
                      <strong className="text-[#FFFFFF]">Bestari#2026</strong>
                    </div>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={handleFillDemo}
                      className="px-2.5 py-1 rounded-lg bg-[#D9B45B] hover:bg-[#F7DA82] text-[#07201A] text-[10px] font-extrabold transition-colors"
                    >
                      Isi Murid
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#2CF2AF]/15">
                    <div className="text-[10px] sm:text-[11px] leading-snug text-[#DCE9DF]">
                      <span className="text-[#36D9FF] font-bold">Demo Guru: </span>
                      <strong className="text-[#FFFFFF]">profesor.nurin</strong> /{' '}
                      <strong className="text-[#FFFFFF]">Akademi#2026</strong>
                    </div>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={handleFillTeacherDemo}
                      className="px-2.5 py-1 rounded-lg bg-[#36D9FF]/90 hover:bg-[#7CE7FF] text-[#062019] text-[10px] font-extrabold transition-colors"
                    >
                      Isi Guru
                    </button>
                  </div>
                </div>

                {/* Terminal Base Footer Caption */}
                <p className="relative z-10 mt-2.5 text-center font-mono-tabular text-[10px] font-bold tracking-[0.22em] text-[#5BFFCA]/85 uppercase">
                  SECURE ACCESS SYSTEM &nbsp;•&nbsp; EJEN BAHASA
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: CLASSIFIED SYSTEM STATUS & EJEN BAHASA MOTTO */}
        <footer
          className={`login-ui-fade flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 pt-1 transition-all duration-700 delay-300 ease-out ${
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Bottom-Left Case Status Strip */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-[#071C16]/92 border border-[#D9B45B]/75 shadow-lg">
            <div aria-hidden="true" className="flex items-center gap-1">
              {[0, 1, 2, 3].map((t) => (
                <span
                  key={t}
                  className="w-1.5 h-3.5 -skew-x-[22deg] bg-[#D9B45B]"
                />
              ))}
            </div>
            <p className="font-mono-tabular text-[11px] sm:text-xs font-extrabold tracking-wider text-[#F5ECD4]">
              KES: <span className="text-[#FFD45C]">EB-001</span>
              <span className="mx-2 text-[#D9B45B]">|</span>
              STATUS:{' '}
              <span
                className={
                  authPhase === 'granted' ? 'text-[#5BFFCA]' : 'text-[#FFD45C]'
                }
              >
                {systemStatusText}
              </span>
            </p>
          </div>

          {/* Bottom-Right Motto & Vintage Quill Feather */}
          <div className="relative inline-flex items-center justify-end gap-2 px-4 py-2 rounded-xl bg-[#071C16]/92 border border-[#D9B45B]/75 shadow-lg">
            <p className="font-display italic text-xs sm:text-sm font-semibold text-[#F5ECD4] text-right leading-snug">
              “Menelusuri Peribahasa,
              <br />
              Menyemai Budi, Memugar Estetika Bahasa”
            </p>
            <div className="-my-3 -mr-2 shrink-0 pointer-events-none">
              <QuillFeatherArt />
            </div>
          </div>
        </footer>
      </div>

      {/* Preserved Password Recovery Modal */}
      {forgotOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-title"
          className="fixed inset-0 z-50 bg-[#051813]/85 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <div className="dossier-unfold w-full max-w-md rounded-2xl bg-[#F4EBD0] text-[#0B2A21] border-2 border-[#C9A24B] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-[#15402F]/20 pb-3">
              <div>
                <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#8A6A2F]">
                  Protokol Pemulihan Akses
                </p>
                <h2 id="forgot-title" className="font-display text-xl font-bold text-[#0B2A21]">
                  Tetapkan Semula Kata Laluan
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                aria-label="Tutup tetingkap pemulihan"
                className="p-1.5 rounded-lg text-[#15402F] hover:bg-[#E5D8BD]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-3.5">
              <div>
                <label
                  htmlFor="reset-username"
                  className="block text-xs font-semibold text-[#15402F] mb-1"
                >
                  Nama Pengguna / ID Ejen
                </label>
                <input
                  id="reset-username"
                  type="text"
                  value={resetUser}
                  onChange={(e) => setResetUser(e.target.value)}
                  placeholder="Contoh: ejen.bestari"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#15402F]/25 text-base text-[#0B2A21]"
                />
              </div>

              <div>
                <label
                  htmlFor="reset-code"
                  className="block text-xs font-semibold text-[#15402F] mb-1"
                >
                  Kod Keselamatan Akademi (Kod Rasmi: BESTARI2026)
                </label>
                <input
                  id="reset-code"
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="Masukkan kod keselamatan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#15402F]/25 text-base text-[#0B2A21]"
                />
              </div>

              <div>
                <label
                  htmlFor="reset-new-pw"
                  className="block text-xs font-semibold text-[#15402F] mb-1"
                >
                  Kata Laluan Baharu (Min. 6 aksara)
                </label>
                <input
                  id="reset-new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata laluan baharu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#15402F]/25 text-base text-[#0B2A21]"
                />
              </div>

              {resetStatus && (
                <div
                  role="alert"
                  className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                    resetStatus.type === 'ok'
                      ? 'bg-[#CDDCCF] border-[#15402F]/40 text-[#0B2A21]'
                      : 'bg-[#FBECE8] border-[#C2593F] text-[#8C331D]'
                  }`}
                >
                  {resetStatus.type === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#15402F] shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-[#C2593F] shrink-0" />
                  )}
                  <span>{resetStatus.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#E5D8BD] text-xs font-semibold text-[#0B2A21]"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#15402F] hover:bg-[#0B2A21] text-[#F4EBD0] text-xs font-bold border border-[#C9A24B]"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#C9A24B]" />
                  {resetLoading ? 'Memproses...' : 'Sahkan Tetapan Semula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCESS GRANTED Flash Overlay */}
      <div aria-hidden="true" className={`login-flash ${flashOn ? 'on' : ''}`} />
    </div>
  );
}
