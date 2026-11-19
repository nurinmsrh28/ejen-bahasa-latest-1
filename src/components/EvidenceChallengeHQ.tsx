import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Award,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  FileCheck2,
  FileSearch,
  FileText,
  HelpCircle,
  Library,
  MessageCircle,
  Radar,
  Scale,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Trees,
  Utensils,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import kantinPhotoUrl from '../assets/images/kantin_ceria_realistik_1794831646132.jpg';
import kelasPhotoUrl from '../assets/images/kelas_harmoni_realistik_1794831926269.jpg';
import perpustakaanPhotoUrl from '../assets/images/perpustakaan_ilmu_realistik_1794832156528.jpg';
import tamanPhotoUrl from '../assets/images/taman_rekreasi_realistik_1794832375203.jpg';
import { gameAudio } from '../game/audio';
import { LOCATION_MAP, LOGIC_CHALLENGES } from '../game/data';
import {
  areLogicChallengesComplete,
  getAgentRank,
  getEarnedBadgeIds,
} from '../game/rules';
import type { GameState, LocationId } from '../game/types';
import { ProfesorCitraPortrait } from './DetectiveArt';

type CaseSlotId = 'logic_kantin' | 'logic_kelas' | 'logic_taman' | 'ref_perpustakaan';

interface CaseDescriptor {
  slotId: CaseSlotId;
  caseCode: string;
  locId: LocationId;
  challengeId: string | null;
  icon: React.ComponentType<{ className?: string }>;
  photoUrl: string;
}

const CASE_SLOTS: CaseDescriptor[] = [
  {
    slotId: 'logic_kantin',
    caseCode: 'CASE 01',
    locId: 'kantin',
    challengeId: 'logic_kantin',
    icon: Utensils,
    photoUrl: kantinPhotoUrl,
  },
  {
    slotId: 'logic_kelas',
    caseCode: 'CASE 02',
    locId: 'kelas',
    challengeId: 'logic_kelas',
    icon: BookOpenCheck,
    photoUrl: kelasPhotoUrl,
  },
  {
    slotId: 'ref_perpustakaan',
    caseCode: 'CASE 03',
    locId: 'perpustakaan',
    challengeId: null,
    icon: Library,
    photoUrl: perpustakaanPhotoUrl,
  },
  {
    slotId: 'logic_taman',
    caseCode: 'CASE 04',
    locId: 'taman',
    challengeId: 'logic_taman',
    icon: Trees,
    photoUrl: tamanPhotoUrl,
  },
];

const AMBIENT_PARTICLES = [
  { id: 0, left: '7%', top: '16%', dur: '7.4s', delay: '0s' },
  { id: 1, left: '92%', top: '24%', dur: '6.6s', delay: '0.9s' },
  { id: 2, left: '28%', top: '76%', dur: '8.1s', delay: '0.4s' },
  { id: 3, left: '74%', top: '68%', dur: '7.0s', delay: '1.5s' },
  { id: 4, left: '51%', top: '28%', dur: '8.6s', delay: '1.1s' },
];

interface EvidenceChallengeHQProps {
  state: GameState;
  pendingSelections: Record<string, 'A' | 'B' | undefined>;
  confirmedChallenges: Record<string, boolean>;
  labSoundEnabled: boolean;
  onPickOption: (challengeId: string, optId: 'A' | 'B') => void;
  onConfirmOption: (challengeId: string) => void;
  onContinueToNotebook: () => void;
}

export function EvidenceChallengeHQ({
  state,
  pendingSelections,
  confirmedChallenges,
  labSoundEnabled,
  onPickOption,
  onConfirmOption,
  onContinueToNotebook,
}: EvidenceChallengeHQProps) {
  const [activeSlotId, setActiveSlotId] = useState<CaseSlotId>('logic_kantin');
  const [mobileCasesOpen, setMobileCasesOpen] = useState(false);
  const [mobileMentorOpen, setMobileMentorOpen] = useState(true);
  const [showMentorHint, setShowMentorHint] = useState<Record<string, boolean>>({});
  const [scanningChallengeId, setScanningChallengeId] = useState<string | null>(null);
  const [scanLabel, setScanLabel] = useState('MENGANALISIS KERELEVANAN BUKTI...');
  const [imageErrorMap, setImageErrorMap] = useState<Partial<Record<LocationId, boolean>>>({});

  const scanMidRef = useRef<number | null>(null);
  const scanEndRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (scanMidRef.current !== null) window.clearTimeout(scanMidRef.current);
      if (scanEndRef.current !== null) window.clearTimeout(scanEndRef.current);
    };
  }, []);

  const solvedCount = LOGIC_CHALLENGES.filter((ch) => {
    const ans = state.logicChallengeAnswers[ch.id];
    return Boolean(
      confirmedChallenges[ch.id] && ch.options.find((o) => o.id === ans)?.isRelevant
    );
  }).length;

  const allChallengesSolved =
    areLogicChallengesComplete(state) && solvedCount === LOGIC_CHALLENGES.length;

  const earnedBadges = getEarnedBadgeIds(state);
  const agentRank = getAgentRank(state.xp, state.finalReportSaved);

  const activeSlot =
    CASE_SLOTS.find((slot) => slot.slotId === activeSlotId) ?? CASE_SLOTS[0];
  const activeLoc = LOCATION_MAP[activeSlot.locId];
  const activeChallenge = activeSlot.challengeId
    ? LOGIC_CHALLENGES.find((ch) => ch.id === activeSlot.challengeId) ?? null
    : null;

  const pendingId = activeChallenge ? pendingSelections[activeChallenge.id] : undefined;
  const isConfirmed = Boolean(
    activeChallenge &&
      confirmedChallenges[activeChallenge.id] &&
      state.logicChallengeAnswers[activeChallenge.id]
  );
  const confirmedOpt =
    activeChallenge && isConfirmed
      ? activeChallenge.options.find(
          (o) => o.id === state.logicChallengeAnswers[activeChallenge.id]
        )
      : undefined;
  const isCaseSolved = Boolean(confirmedOpt?.isRelevant);
  const isScanningHere = Boolean(
    activeChallenge && scanningChallengeId === activeChallenge.id
  );
  const hintOpen = Boolean(showMentorHint[activeSlot.slotId]);

  const handleSelectSlot = (slotId: CaseSlotId) => {
    if (labSoundEnabled) {
      gameAudio.playClick();
    }
    setActiveSlotId(slotId);
    setMobileCasesOpen(false);
  };

  const handleTriggerScanner = (challengeId: string) => {
    if (!pendingSelections[challengeId] || scanningChallengeId) return;

    if (scanMidRef.current !== null) window.clearTimeout(scanMidRef.current);
    if (scanEndRef.current !== null) window.clearTimeout(scanEndRef.current);

    if (labSoundEnabled) {
      gameAudio.playClick();
    }
    setScanLabel('MENGANALISIS KERELEVANAN BUKTI...');
    setScanningChallengeId(challengeId);

    scanMidRef.current = window.setTimeout(() => {
      setScanLabel('MEMADANKAN PERNYATAAN DENGAN BUKTI...');
    }, 480);

    scanEndRef.current = window.setTimeout(() => {
      setScanningChallengeId(null);
      onConfirmOption(challengeId);
    }, 980);
  };

  // Mentor expression & dialogue state
  const mentorState: 'guidance' | 'scanning' | 'success' | 'encourage' = (() => {
    if (isScanningHere) return 'scanning';
    if (confirmedOpt?.isRelevant) return 'success';
    if (confirmedOpt && !confirmedOpt.isRelevant) return 'encourage';
    return 'guidance';
  })();

  const mentorMessage = (() => {
    if (!activeChallenge) {
      return `Fail ${activeLoc.name} ialah fail rujukan lapangan anda daripada Fasa 1 & 2. Jika anda memilih lokasi ini pada Fasa 2, tulis alasan anda di Buku Nota Bahagian B di bawah.`;
    }
    if (isScanningHere) {
      return 'Pengimbas Makmal Bukti sedang menyemak sama ada dokumen pilihan anda benar-benar menyokong pernyataan pendapat ini...';
    }
    if (isConfirmed && confirmedOpt) {
      return confirmedOpt.explanation;
    }
    if (pendingId) {
      return `Anda telah memilih Dokumen Bukti ${pendingId}. Klik "SAHKAN & IMBAS BUKTI" untuk menguji kerelevanannya dengan makmal forensik HQ.`;
    }
    return `Teliti pernyataan pendapat bagi ${activeLoc.name}. Bandingkan Dokumen Bukti A dan B — manakah yang menerangkan sebab atau kesan langsung?`;
  })();

  const mentorHeaderLabel = (() => {
    if (mentorState === 'scanning') return 'Sedang Mengimbas Bukti...';
    if (mentorState === 'success') return 'Maklum Balas Profesor Nurin (Tepat)';
    if (mentorState === 'encourage') return 'Maklum Balas Profesor Nurin (Cuba Semula)';
    return 'Bimbingan Profesor Nurin';
  })();

  return (
    <section
      aria-labelledby="part-a-heading"
      className="hq-secret-chamber relative overflow-hidden rounded-2xl border-2 border-[#E7C878] p-4 sm:p-6 lg:p-7 space-y-5 text-[#26382F]"
    >
      {/* Subtle Ambient Floating Golden Particles */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {AMBIENT_PARTICLES.map((p) => (
          <span
            key={p.id}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#E7C878]/55 float-mote"
            style={
              {
                left: p.left,
                top: p.top,
                '--mote-dur': p.dur,
                '--mote-delay': p.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* 7. GAME-LIKE PROGRESSION HUD BAR */}
      <div className="relative rounded-xl bg-[#F5F0E5] border border-[#E7C878]/80 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="relative w-12 h-12 rounded-xl bg-[#315C48] border-2 border-[#E7C878] flex items-center justify-center shrink-0">
              <Radar className="w-6 h-6 text-[#E7C878] hq-radar-ring" />
            </div>
            <div className="space-y-0.5">
              <p className="font-mono-tabular text-[11px] font-bold tracking-widest text-[#6E5338]">
                THE SECRET DETECTIVE HEADQUARTERS · BAHAGIAN A
              </p>
              <h2
                id="part-a-heading"
                className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#315C48]"
              >
                UJIAN MAKMAL BUKTI (PROFESOR NURIN)
              </h2>
            </div>
          </div>

          {/* Connected Real Player HUD Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="rounded-lg bg-[#FFFFFF] border border-[#A8C5A0] px-3 py-2">
              <p className="text-[11px] text-[#445A4F]">Identiti Ejen</p>
              <p className="text-xs sm:text-sm font-bold text-[#26382F] truncate">
                {state.profile?.name || 'Ejen Bestari'}
              </p>
            </div>
            <div className="rounded-lg bg-[#FFFFFF] border border-[#A8C5A0] px-3 py-2">
              <p className="text-[11px] text-[#445A4F]">XP &amp; Pangkat</p>
              <p className="font-mono-tabular text-xs sm:text-sm font-bold text-[#315C48]">
                {state.xp} XP · {agentRank}
              </p>
            </div>
            <div className="rounded-lg bg-[#FFFFFF] border border-[#A8C5A0] px-3 py-2">
              <p className="text-[11px] text-[#445A4F]">Kemajuan Kes</p>
              <p className="font-mono-tabular text-xs sm:text-sm font-bold text-[#26382F]">
                {solvedCount}/{LOGIC_CHALLENGES.length} SOLVED
              </p>
            </div>
            <div className="rounded-lg bg-[#FFFFFF] border border-[#A8C5A0] px-3 py-2">
              <p className="text-[11px] text-[#445A4F]">Lencana · Bukti</p>
              <p className="font-mono-tabular text-xs sm:text-sm font-bold text-[#26382F]">
                {earnedBadges.length}/5 · {state.selectedEvidenceIds.length} Kes
              </p>
            </div>
          </div>
        </div>

        {/* Compact Progress Meter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#A8C5A0]/60">
          <span className="font-mono-tabular text-xs font-bold text-[#315C48]">
            CASE PROGRESS: {solvedCount}/{LOGIC_CHALLENGES.length} SOLVED
          </span>
          <div className="flex-1 min-w-[160px] max-w-md h-2.5 rounded-full bg-[#DCE9D9] border border-[#A8C5A0] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#315C48] via-[#A8C5A0] to-[#E7C878] transition-all duration-300"
              style={{
                width: `${Math.round((solvedCount / LOGIC_CHALLENGES.length) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 9. MASTER DETECTIVE ACHIEVEMENT SEQUENCE (ONLY WHEN ALL REAL CASES SOLVED) */}
      <AnimatePresence>
        {allChallengesSolved && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            className="relative rounded-xl hq-brass-plaque p-4 sm:p-5 text-[#26382F] border-2 border-[#E7C878] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#315C48] text-[#E7C878] flex items-center justify-center shrink-0 shadow-md room-stamp-slam">
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="font-mono-tabular text-xs font-extrabold tracking-widest uppercase text-[#26382F]">
                  MASTER DETECTIVE UNLOCKED!
                </p>
                <p className="font-display text-base sm:text-lg font-bold text-[#26382F]">
                  TAHNIAH! ANDA TELAH BERJAYA MENGANALISIS SEMUA BUKTI DENGAN TEPAT.
                </p>
                <p className="text-xs font-semibold text-[#315C48]">
                  {LOGIC_CHALLENGES.length}/{LOGIC_CHALLENGES.length} Ujian Makmal Bukti Selesai ·
                  Ganjaran +120 XP Makmal Bukti Aktif
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onContinueToNotebook}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#315C48] hover:bg-[#264938] text-[#FFFFFF] font-bold text-xs sm:text-sm shadow-md transition-colors whitespace-nowrap shrink-0"
            >
              Teruskan ke Bahagian B
              <ArrowDown className="w-4 h-4 text-[#E7C878]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. THREE-PANEL DETECTIVE HQ INTERFACE */}
      <div className="relative grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL: CASE SELECTOR */}
        <aside
          aria-label="Pemilih Fail Kes"
          className="md:col-span-4 xl:col-span-3 rounded-xl bg-[#F5F0E5] border border-[#A8C5A0] p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#A8C5A0]/60 pb-2.5">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#315C48]" />
              <h3 className="font-display text-base font-bold text-[#315C48]">
                Pemilih Fail Kes
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setMobileCasesOpen((prev) => !prev)}
              aria-expanded={mobileCasesOpen}
              className="md:hidden inline-flex items-center gap-1 text-xs font-bold text-[#315C48] px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#A8C5A0]"
            >
              {mobileCasesOpen ? 'Tutup' : 'Pilih Kes'}
              {mobileCasesOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <nav
            aria-label="Senarai Kes Penyiasatan"
            className={`${mobileCasesOpen ? 'block' : 'hidden'} md:block space-y-2.5`}
          >
            {CASE_SLOTS.map((slot) => {
              const slotLoc = LOCATION_MAP[slot.locId];
              const SlotIcon = slot.icon;
              const isSelectedSlot = activeSlotId === slot.slotId;
              const slotChallenge = slot.challengeId
                ? LOGIC_CHALLENGES.find((c) => c.id === slot.challengeId)
                : null;
              const slotAns = slot.challengeId
                ? state.logicChallengeAnswers[slot.challengeId]
                : undefined;
              const slotConfirmed = Boolean(
                slot.challengeId && confirmedChallenges[slot.challengeId] && slotAns
              );
              const slotSolved = Boolean(
                slotConfirmed &&
                  slotChallenge?.options.find((o) => o.id === slotAns)?.isRelevant
              );
              const slotRetry = Boolean(slotConfirmed && !slotSolved);
              const slotPending = Boolean(
                slot.challengeId && !slotConfirmed && pendingSelections[slot.challengeId]
              );

              const statusText = !slotChallenge
                ? 'Arkib Lapangan'
                : slotSolved
                  ? 'Disahkan Tepat'
                  : slotRetry
                    ? 'Cuba Semula'
                    : slotPending
                      ? 'Sedia Diimbas'
                      : 'Menunggu Analisis';

              return (
                <button
                  key={slot.slotId}
                  type="button"
                  onClick={() => handleSelectSlot(slot.slotId)}
                  aria-current={isSelectedSlot ? 'true' : undefined}
                  className={`group w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all duration-200 hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878] ${
                    isSelectedSlot
                      ? 'bg-[#315C48] border-[#E7C878] text-[#FFFFFF] shadow-md'
                      : 'bg-[#FFFFFF] border-[#A8C5A0]/80 text-[#26382F] hover:border-[#315C48]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                      isSelectedSlot
                        ? 'bg-[#E7C878] text-[#26382F] border-[#FFFFFF]'
                        : slotSolved
                          ? 'bg-[#DCE9D9] text-[#315C48] border-[#315C48]/40'
                          : 'bg-[#F5F0E5] text-[#315C48] border-[#A8C5A0]'
                    }`}
                  >
                    <SlotIcon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`font-mono-tabular text-[11px] font-bold ${
                          isSelectedSlot ? 'text-[#E7C878]' : 'text-[#6E5338]'
                        }`}
                      >
                        {slot.caseCode}
                      </span>
                      {slotSolved ? (
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            isSelectedSlot ? 'text-[#E7C878]' : 'text-[#315C48]'
                          }`}
                        />
                      ) : slotRetry ? (
                        <AlertCircle className="w-4 h-4 text-[#C2593F] shrink-0" />
                      ) : isSelectedSlot ? (
                        <ArrowRight className="w-3.5 h-3.5 text-[#E7C878] shrink-0" />
                      ) : null}
                    </div>
                    <p
                      className={`text-xs sm:text-sm font-bold truncate ${
                        isSelectedSlot ? 'text-[#FFFFFF]' : 'text-[#26382F]'
                      }`}
                    >
                      {slotLoc.name}
                    </p>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        isSelectedSlot ? 'text-[#DCE9D9]' : 'text-[#445A4F]'
                      }`}
                    >
                      {statusText}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* CENTRE PANEL: MAIN EVIDENCE INVESTIGATION TERMINAL */}
        <article
          key={activeSlot.slotId}
          aria-label={`Terminal Siasatan ${activeLoc.name}`}
          className="md:col-span-8 xl:col-span-6 relative overflow-hidden rounded-xl bg-[#FFFFFF] border-2 border-[#E7C878] p-4 sm:p-6 space-y-5 shadow-md lab-report-reveal"
        >
          {/* 5. CINEMATIC EVIDENCE SCANNER OVERLAY */}
          {isScanningHere && (
            <div
              aria-live="polite"
              className="absolute inset-0 z-30 bg-[#315C48]/95 flex flex-col items-center justify-center p-6 text-center text-[#FFFFFF]"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-[#E7C878]/50 to-transparent border-b-2 border-[#E7C878] lab-scanner-beam pointer-events-none"
              />
              <div className="relative z-10 flex flex-col items-center gap-4 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-[#264938] border-2 border-[#E7C878] flex items-center justify-center shadow-[0_0_28px_rgba(231,200,120,0.45)]">
                  <ScanSearch className="w-8 h-8 text-[#E7C878]" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-mono-tabular text-xs sm:text-sm font-bold tracking-widest text-[#E7C878]">
                    {scanLabel}
                  </p>
                  <p className="text-xs text-[#DCE9D9]">
                    Menyemak hubung kait antara pernyataan pendapat dengan dokumen bukti
                  </p>
                </div>
                <div className="w-52 h-1.5 rounded-full bg-[#264938] overflow-hidden border border-[#E7C878]/50">
                  <div className="h-full w-3/4 rounded-full bg-[#E7C878] animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* TERMINAL CASE HEADER WITH LOCATION SCENE */}
          <div className="relative overflow-hidden rounded-xl border border-[#A8C5A0] bg-[#315C48]">
            <div className="relative h-32 sm:h-36 w-full bg-[#315C48]">
              {!imageErrorMap[activeSlot.locId] ? (
                <img
                  src={activeSlot.photoUrl}
                  alt={`Pemandangan lokasi ${activeLoc.name}`}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setImageErrorMap((prev) => ({ ...prev, [activeSlot.locId]: true }))
                  }
                  className="w-full h-full object-cover opacity-85"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#E7C878]/65">
                  <activeSlot.icon className="w-14 h-14" />
                </div>
              )}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#26382F]/90 via-[#26382F]/45 to-transparent"
              />

              {/* Verification Status Marker */}
              {isCaseSolved && (
                <div className="absolute top-3 right-3 px-3 py-1 rounded-md bg-[#315C48] border-2 border-[#E7C878] text-[#E7C878] font-mono-tabular text-[11px] font-extrabold tracking-widest shadow-lg room-stamp-slam flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>VERIFIED</span>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 p-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="font-mono-tabular text-[11px] font-bold tracking-wider text-[#E7C878]">
                    {activeSlot.caseCode} · {activeLoc.name.toUpperCase()}
                  </p>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#FFFFFF]">
                    {activeChallenge
                      ? activeChallenge.contextTitle
                      : `Arkib Bukti Lapangan · ${activeLoc.name}`}
                  </h3>
                </div>
                {activeChallenge && (
                  <span className="font-mono-tabular text-xs font-bold text-[#DCE9D9]">
                    {solvedCount}/{LOGIC_CHALLENGES.length} Selesai
                  </span>
                )}
              </div>
            </div>
          </div>

          {!activeChallenge ? (
            /* PERPUSTAKAAN ILMU FIELD DOSSIER REFERENCE (PRESERVING REAL DATA WITHOUT FAKE A/B QUIZ) */
            <div className="space-y-4">
              <div className="rounded-xl bg-[#F5F0E5] text-[#26382F] p-4 sm:p-5 border border-[#E7C878] space-y-2">
                <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#6E5338]">
                  Arkib Bukti &amp; Pendapat Fasa 2
                </p>
                <p className="text-sm font-bold text-[#26382F]">
                  {state.opinions.perpustakaan.opinionText.trim()
                    ? `“${state.opinions.perpustakaan.opinionText}”`
                    : 'Tiada pernyataan pendapat Fasa 2 direkodkan bagi Perpustakaan Ilmu.'}
                </p>
              </div>

              <div className="rounded-xl bg-[#DCE9D9]/55 border border-[#A8C5A0] p-4 space-y-2.5 text-xs sm:text-sm text-[#26382F]">
                <p className="font-bold text-[#315C48]">
                  Petunjuk Lapangan Ditemui ({state.investigations.perpustakaan.discoveredClueIds.length}/
                  {activeLoc.clues.length})
                </p>
                <ul className="space-y-1.5 text-[#26382F]">
                  {activeLoc.clues.map((clue) => (
                    <li key={clue.id}>
                      <strong className="text-[#315C48]">{clue.label}:</strong>{' '}
                      {clue.issueSummary}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[#445A4F] pt-2 border-t border-[#A8C5A0]">
                  Lokasi ini tidak mempunyai ujian pilihan A/B dalam Makmal Bukti. Teruskan memilih{' '}
                  <strong className="text-[#315C48]">CASE 01, CASE 02 atau CASE 04</strong> untuk menguji kesesuaian bukti,
                  atau tulis alasan anda sendiri pada Bahagian B di bawah.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* ORIGINAL OPINION STATEMENT IN PARCHMENT TERMINAL BRIEF */}
              <div className="rounded-xl bg-[#F5F0E5] text-[#26382F] p-4 sm:p-5 border-2 border-[#E7C878] shadow-sm space-y-1.5">
                <p className="font-mono-tabular text-[11px] font-bold tracking-wider text-[#6E5338]">
                  PERNYATAAN PENDAPAT ASAL:
                </p>
                <p className="font-display text-base sm:text-lg font-bold leading-snug text-[#26382F]">
                  “{activeChallenge.opinion}”
                </p>
              </div>

              {/* 4. VISUAL DEDUCTION CONNECTION SYSTEM: OPINION -> EVIDENCE -> JUSTIFICATION */}
              <div className="rounded-xl bg-[#DCE9D9]/55 border border-[#A8C5A0] p-3.5 sm:p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono-tabular font-bold text-[#315C48] inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#6E5338]" />
                    SISTEM SAMBUNGAN DEDUKSI
                  </span>
                  <span className="text-[#445A4F] font-semibold">
                    {isConfirmed && confirmedOpt
                      ? confirmedOpt.isRelevant
                        ? 'Relevan · Menyokong Pendapat'
                        : 'Tidak Relevan · Fakta Umum Sahaja'
                      : pendingId
                        ? `Menyambung Dokumen Bukti ${pendingId}`
                        : 'Pilih Dokumen Bukti A atau B'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center">
                  <div className="rounded-lg bg-[#FFFFFF] border border-[#A8C5A0] px-2.5 py-2">
                    <p className="font-mono-tabular text-[10px] font-bold text-[#6E5338]">01</p>
                    <p className="text-[11px] sm:text-xs font-bold text-[#315C48]">PENDAPAT</p>
                  </div>
                  <div
                    className={`rounded-lg px-2.5 py-2 border transition-colors ${
                      pendingId
                        ? 'bg-[#315C48] border-[#E7C878] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] border-[#A8C5A0] text-[#445A4F]'
                    }`}
                  >
                    <p
                      className={`font-mono-tabular text-[10px] font-bold ${
                        pendingId ? 'text-[#E7C878]' : 'text-[#6E5338]'
                      }`}
                    >
                      02
                    </p>
                    <p className="text-[11px] sm:text-xs font-bold">
                      BUKTI {pendingId ? `(${pendingId})` : ''}
                    </p>
                  </div>
                  <div
                    className={`rounded-lg px-2.5 py-2 border transition-colors ${
                      isCaseSolved
                        ? 'hq-brass-plaque border-[#E7C878] text-[#26382F]'
                        : 'bg-[#FFFFFF] border-[#A8C5A0] text-[#445A4F]'
                    }`}
                  >
                    <p
                      className={`font-mono-tabular text-[10px] font-bold ${
                        isCaseSolved ? 'text-[#26382F]' : 'text-[#6E5338]'
                      }`}
                    >
                      03
                    </p>
                    <p className="text-[11px] sm:text-xs font-bold">JUSTIFIKASI</p>
                  </div>
                </div>

                {/* Dynamic Animated Forest/Gold Branch Connecting to Option A or Option B */}
                <svg
                  viewBox="0 0 240 28"
                  className="w-full h-7"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M120 2 L120 13 L60 13 L60 27"
                    stroke="#315C48"
                    strokeOpacity="0.2"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M120 2 L120 13 L180 13 L180 27"
                    stroke="#315C48"
                    strokeOpacity="0.2"
                    strokeWidth="2"
                    fill="none"
                  />
                  {pendingId === 'A' && (
                    <motion.path
                      d="M120 2 L120 13 L60 13 L60 27"
                      stroke={
                        isConfirmed && confirmedOpt && !confirmedOpt.isRelevant
                          ? '#C2593F'
                          : '#315C48'
                      }
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      fill="none"
                      className="lab-gold-line-flow"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.25 }}
                    />
                  )}
                  {pendingId === 'B' && (
                    <motion.path
                      d="M120 2 L120 13 L180 13 L180 27"
                      stroke={
                        isConfirmed && confirmedOpt && !confirmedOpt.isRelevant
                          ? '#C2593F'
                          : '#315C48'
                      }
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      fill="none"
                      className="lab-gold-line-flow"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.25 }}
                    />
                  )}
                </svg>
              </div>

              {/* 3. PHYSICAL EVIDENCE DOCUMENT CARDS (OPTION A & OPTION B) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeChallenge.options.map((opt) => {
                  const isPicked = pendingId === opt.id;
                  const showRight = isConfirmed && isPicked && opt.isRelevant;
                  const showWrong = isConfirmed && isPicked && !opt.isRelevant;
                  const DocIcon = opt.id === 'A' ? FileText : FileSearch;

                  return (
                    <motion.button
                      key={opt.id}
                      type="button"
                      onClick={() => onPickOption(activeChallenge.id, opt.id)}
                      aria-pressed={isPicked}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className={`hq-ivory-paper relative text-left rounded-xl p-4 sm:p-5 border-2 text-[#26382F] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E7C878] ${
                        showRight
                          ? 'border-[#315C48] ring-2 ring-[#E7C878] shadow-md -translate-y-1'
                          : showWrong
                            ? 'border-[#C2593F] ring-2 ring-[#C2593F]/40 shadow-md'
                            : isPicked
                              ? 'border-[#315C48] ring-2 ring-[#E7C878]/80 shadow-md -translate-y-1'
                              : 'border-[#A8C5A0] hover:border-[#315C48]'
                      }`}
                    >
                      {/* Document Stamp / Header */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#A8C5A0]/60">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                              isPicked
                                ? 'bg-[#315C48] text-[#E7C878] border-[#E7C878]'
                                : 'bg-[#DCE9D9] text-[#315C48] border-[#A8C5A0]'
                            }`}
                          >
                            {showRight ? (
                              <FileCheck2 className="w-4 h-4" />
                            ) : (
                              <DocIcon className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-mono-tabular text-[11px] font-extrabold tracking-wider text-[#6E5338]">
                              DOKUMEN BUKTI · KOD {opt.id}
                            </p>
                            <p className="text-[11px] font-bold text-[#315C48]">
                              Pilihan {opt.id}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                            showRight
                              ? 'bg-[#315C48] border-[#E7C878] text-[#E7C878]'
                              : showWrong
                                ? 'bg-[#C2593F] border-[#8C331D] text-white'
                                : isPicked
                                  ? 'bg-[#E7C878] border-[#315C48]/40 text-[#26382F]'
                                  : 'bg-[#FFFFFF] border-[#A8C5A0]'
                          }`}
                        >
                          {isPicked && <Check className="w-4 h-4 stroke-[3]" />}
                        </span>
                      </div>

                      <p className="text-sm font-medium leading-relaxed text-[#26382F]">
                        {opt.text}
                      </p>

                      {isPicked && (
                        <div className="mt-3 pt-2 border-t border-[#A8C5A0]/50 flex items-center justify-between text-[11px] font-mono-tabular font-bold">
                          <span
                            className={
                              showWrong
                                ? 'text-[#8C331D]'
                                : showRight
                                  ? 'text-[#315C48]'
                                  : 'text-[#6E5338]'
                            }
                          >
                            {showRight
                              ? 'BUKTI DISAHKAN'
                              : showWrong
                                ? 'KURANG RELEVAN'
                                : 'DIPILIH UNTUK IMBASAN'}
                          </span>
                          <Scale className="w-3.5 h-3.5 text-[#6E5338]" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* VERIFY & TRIGGER EVIDENCE SCANNER BUTTON */}
              {pendingId && !isConfirmed && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-[#445A4F]">
                    Anda boleh menukar Dokumen A atau B sebelum menjalankan imbasan HQ.
                  </p>
                  <button
                    type="button"
                    disabled={isScanningHere}
                    onClick={() => handleTriggerScanner(activeChallenge.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl hq-brass-plaque hover:brightness-105 disabled:opacity-60 text-[#26382F] border border-[#315C48]/25 font-bold text-xs sm:text-sm shadow-md transition-all whitespace-nowrap shrink-0"
                  >
                    <ScanSearch className="w-4 h-4" />
                    Sahkan Pilihan {pendingId} · Imbas Bukti
                  </button>
                </div>
              )}

              {/* INLINE RESULT BANNER (FOR TABLET/MOBILE + REINFORCEMENT AFTER SCAN) */}
              <AnimatePresence mode="wait">
                {isConfirmed && confirmedOpt && (
                  <motion.div
                    key={`${activeChallenge.id}-${confirmedOpt.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`rounded-xl p-4 text-xs sm:text-sm flex items-start gap-3 border-2 ${
                      confirmedOpt.isRelevant
                        ? 'bg-[#DCE9D9] text-[#26382F] border-[#315C48]'
                        : 'bg-[#FBECE8] text-[#7D2918] border-[#C2593F]'
                    }`}
                  >
                    {confirmedOpt.isRelevant ? (
                      <ShieldCheck className="w-5 h-5 text-[#315C48] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#C2593F] shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p
                        className={`font-bold ${
                          confirmedOpt.isRelevant ? 'text-[#315C48]' : 'text-[#8C331D]'
                        }`}
                      >
                        {mentorHeaderLabel}
                      </p>
                      <p className="leading-relaxed">{confirmedOpt.explanation}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </article>

        {/* RIGHT PANEL: PROFESSOR NURIN (DETECTIVE MENTOR CHARACTER) */}
        <aside
          aria-label="Mentor Penyiasatan Profesor Nurin"
          className="md:col-span-12 xl:col-span-3 rounded-xl bg-[#F5F0E5] border border-[#A8C5A0] p-4 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#A8C5A0]/60 pb-2.5">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#315C48]" />
              <h3 className="font-display text-base font-bold text-[#315C48]">
                Profesor Nurin
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setMobileMentorOpen((prev) => !prev)}
              aria-expanded={mobileMentorOpen}
              className="md:hidden inline-flex items-center gap-1 text-xs font-bold text-[#315C48] px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#A8C5A0]"
            >
              {mobileMentorOpen ? 'Tutup' : 'Buka'}
              {mobileMentorOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className={`${mobileMentorOpen ? 'space-y-4' : 'hidden md:block space-y-4'}`}>
            {/* Illustrated Portrait with Detective Aura & Speaking Indicator */}
            <div className="flex flex-row xl:flex-col items-center gap-3.5 xl:text-center">
              <div
                className={`p-1 rounded-full bg-gradient-to-br ${
                  mentorState === 'encourage'
                    ? 'from-[#C2593F] to-[#E7C878]'
                    : 'from-[#E7C878] to-[#315C48]'
                } shrink-0 ${
                  mentorState === 'scanning' || mentorState === 'success' || hintOpen
                    ? 'lab-mentor-speak'
                    : ''
                }`}
              >
                <ProfesorCitraPortrait realistic className="w-16 h-16 xl:w-20 xl:h-20" />
              </div>

              <div className="space-y-0.5">
                <p className="font-display text-base font-bold text-[#315C48]">
                  Profesor Nurin
                </p>
                <p className="font-mono-tabular text-[11px] font-semibold text-[#6E5338]">
                  {mentorState === 'success'
                    ? 'Status: Reaksi Positif'
                    : mentorState === 'encourage'
                      ? 'Status: Memberi Penjelasan'
                      : mentorState === 'scanning'
                        ? 'Status: Mengimbas Bukti'
                        : 'Ketua Makmal Forensik HQ'}
                </p>
              </div>
            </div>

            {/* Animated Dialogue Bubble */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeSlot.slotId}-${mentorState}-${pendingId ?? 'none'}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`rounded-xl p-3.5 border text-xs sm:text-sm leading-relaxed ${
                  mentorState === 'encourage'
                    ? 'bg-[#FBECE8] border-[#C2593F] text-[#7D2918]'
                    : 'bg-[#FFFFFF] border-[#E7C878] text-[#26382F]'
                }`}
              >
                <p
                  className={`font-bold text-[11px] mb-1 ${
                    mentorState === 'encourage' ? 'text-[#8C331D]' : 'text-[#315C48]'
                  }`}
                >
                  {mentorHeaderLabel}
                </p>
                <p>“{mentorMessage}”</p>
              </motion.div>
            </AnimatePresence>

            {/* Contextual Hint Toggle */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  if (labSoundEnabled) gameAudio.playHint();
                  setShowMentorHint((prev) => ({
                    ...prev,
                    [activeSlot.slotId]: !hintOpen,
                  }));
                }}
                aria-expanded={hintOpen}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#315C48] hover:bg-[#264938] text-[#FFFFFF] border border-[#E7C878] text-xs font-bold transition-colors whitespace-nowrap"
              >
                <HelpCircle className="w-4 h-4 text-[#E7C878]" />
                {hintOpen ? 'Tutup Petunjuk Mentor' : 'Minta Petunjuk Profesor'}
              </button>

              {hintOpen && (
                <div className="rounded-xl bg-[#FFFFFF] border border-[#E7C878] p-3.5 text-xs text-[#26382F] space-y-2 lab-report-reveal">
                  <p className="font-bold text-[#315C48]">Petunjuk Analisis Bukti:</p>
                  <p className="leading-relaxed">
                    Alasan yang relevan menerangkan <strong>sebab</strong> atau{' '}
                    <strong>manfaat langsung</strong> apabila cadangan dalam pernyataan pendapat itu
                    dilaksanakan — bukan sekadar menyebut ciri fizikal atau fakta umum.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
