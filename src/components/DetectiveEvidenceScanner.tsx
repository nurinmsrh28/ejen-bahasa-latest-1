import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  FileCheck2,
  FileText,
  Lightbulb,
  Pencil,
  Play,
  RotateCcw,
  Save,
  ScanSearch,
  Search,
  Shield,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import officeBackdropUrl from '../assets/images/detective_office_backdrop_1794998231603.jpg';
import kantinPhotoUrl from '../assets/images/kantin_ceria_realistik_1794831646132.jpg';
import kelasPhotoUrl from '../assets/images/kelas_harmoni_realistik_1794831926269.jpg';
import perpustakaanPhotoUrl from '../assets/images/perpustakaan_ilmu_realistik_1794832156528.jpg';
import professorNurinStandingUrl from '../assets/images/professor_nurin_standing_1794998233968.jpg';
import tamanPhotoUrl from '../assets/images/taman_rekreasi_realistik_1794832375203.jpg';
import { gameAudio } from '../game/audio';
import { LOCATION_MAP, LOGIC_CHALLENGES } from '../game/data';
import {
  areLogicChallengesComplete,
  countWords,
  getAgentRank,
  isPhase3Complete,
} from '../game/rules';
import type { GameState, LocationId, LogicChallenge } from '../game/types';

type LogicChallengeOption = LogicChallenge['options'][number];

const CHALLENGE_LOCATION_MAP: Record<string, LocationId> = {
  logic_kantin: 'kantin',
  logic_kelas: 'kelas',
  logic_taman: 'taman',
};

const LOCATION_PHOTO_MAP: Record<LocationId, string> = {
  kantin: kantinPhotoUrl,
  kelas: kelasPhotoUrl,
  perpustakaan: perpustakaanPhotoUrl,
  taman: tamanPhotoUrl,
};

const REASON_CONNECTORS = [
  'kerana',
  'supaya',
  'agar',
  'untuk',
  'bagi',
  'dapat',
  'boleh',
  'membantu',
  'membolehkan',
  'meningkatkan',
  'mengelakkan',
  'menjadikan',
  'sebab',
  'kesannya',
];

const CASE_DOMAIN_KEYWORDS: Record<LocationId, string[]> = {
  kantin: ['kantin', 'makan', 'sampah', 'tong', 'meja', 'lantai', 'bersih', 'sisa'],
  kelas: ['kelas', 'meja', 'kerusi', 'sudut', 'belajar', 'tumpuan', 'kemas', 'laluan'],
  perpustakaan: ['perpustakaan', 'buku', 'baca', 'rak', 'selesa', 'kategori', 'ilmu'],
  taman: ['taman', 'pokok', 'bunga', 'bangku', 'rehat', 'hijau', 'alam', 'selesa'],
};

const FLOATING_MOTES = [
  { id: 0, left: '8%', top: '20%', dur: '7.4s', delay: '0s' },
  { id: 1, left: '84%', top: '16%', dur: '6.8s', delay: '0.9s' },
  { id: 2, left: '26%', top: '52%', dur: '8.2s', delay: '0.4s' },
  { id: 3, left: '72%', top: '48%', dur: '7.1s', delay: '1.3s' },
  { id: 4, left: '49%', top: '28%', dur: '8.6s', delay: '0.7s' },
];

interface ReasoningEvalResult {
  completeness: { met: boolean; message: string };
  reasoningCue: { met: boolean; message: string };
  relevanceLink: { met: boolean; message: string };
}

function evaluateReasoningInput(
  reasonText: string,
  opinionText: string,
  locId: LocationId
): ReasoningEvalResult {
  const trimmed = reasonText.trim();
  const lower = trimmed.toLowerCase();
  const words = countWords(trimmed);
  const endsWithPunctuation = /[.!?]$/.test(trimmed);

  const completenessMet = trimmed.length >= 10 && words >= 6 && endsWithPunctuation;
  const completenessMsg = completenessMet
    ? `Alasan anda lengkap (${words} patah perkataan) dan diakhiri dengan tanda baca yang tepat.`
    : words < 6
      ? `Alasan masih ringkas (${words} patah perkataan). Huraikan sebab dan kesannya dengan lebih jelas.`
      : 'Struktur alasan sudah baik, tetapi pastikan ayat diakhiri dengan tanda noktah (.).';

  const hasConnector = REASON_CONNECTORS.some((c) => lower.includes(c));
  const reasoningCueMet = hasConnector && words >= 6;
  const reasoningCueMsg = reasoningCueMet
    ? 'Penggunaan kata hubung sebab dan kesan amat jelas serta teratur.'
    : 'Sertakan kata hubung sebab atau kesan seperti "kerana", "supaya" atau "agar" untuk menguatkan alasan.';

  const opinionTokens = opinionText
    .toLowerCase()
    .split(/[^a-z0-9\u00C0-\u024F]+/)
    .filter((w) => w.length >= 4);
  const combined = Array.from(
    new Set([...(CASE_DOMAIN_KEYWORDS[locId] || []), ...opinionTokens])
  );
  const relevanceMet = combined.some((kw) => lower.includes(kw));
  const relevanceMsg = relevanceMet
    ? `Alasan anda berkait rapat dengan pernyataan pendapat dan situasi di ${LOCATION_MAP[locId].name}.`
    : `Kaitkan alasan anda secara langsung dengan isu di ${LOCATION_MAP[locId].name} agar hujah lebih meyakinkan.`;

  return {
    completeness: { met: completenessMet, message: completenessMsg },
    reasoningCue: { met: reasoningCueMet, message: reasoningCueMsg },
    relevanceLink: { met: relevanceMet, message: relevanceMsg },
  };
}

function DetectiveHatEmblem({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Fedora Hat Crown */}
      <path
        d="M22 36L27 19C28.5 14.5 34 13 40 15C46 13 51.5 14.5 53 19L58 36H22Z"
        fill="#3F444B"
        stroke="#1E2429"
        strokeWidth="2"
      />
      {/* Gold Hat Ribbon */}
      <path d="M23.5 31H56.5L58 36H22L23.5 31Z" fill="#E7C878" stroke="#8F6A24" strokeWidth="1.2" />
      {/* Fedora Brim */}
      <ellipse cx="40" cy="38" rx="28" ry="6.5" fill="#2A3036" stroke="#E7C878" strokeWidth="1.4" />
      {/* Magnifying Glass Overlay */}
      <circle
        cx="49"
        cy="49"
        r="12.5"
        fill="#DCE9D9"
        fillOpacity="0.32"
        stroke="#E7C878"
        strokeWidth="3.2"
      />
      <path d="M44 44C46 41.5 49 41 52 42" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <line
        x1="58"
        y1="58"
        x2="67"
        y2="67"
        stroke="#E7C878"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface DetectiveEvidenceScannerProps {
  state: GameState;
  pendingSelections: Record<string, 'A' | 'B' | undefined>;
  confirmedChallenges: Record<string, boolean>;
  draftReasons: Record<LocationId, string>;
  labSoundEnabled: boolean;
  error: string;
  savedNotice: boolean;
  celebrationVisible: boolean;
  onPickOption: (challengeId: string, optId: 'A' | 'B') => void;
  onConfirmOption: (challengeId: string) => void;
  onReasonChange: (locId: LocationId, value: string) => void;
  onClearReason: (locId: LocationId) => void;
  onSaveSingleReason: (locId: LocationId) => boolean;
  onSubmitReasons: (e: React.FormEvent) => void;
  onBackToHq: () => void;
  onProceedToPhase4: () => void;
  onShowIntroModal?: () => void;
}

export function DetectiveEvidenceScanner({
  state,
  pendingSelections,
  confirmedChallenges,
  draftReasons,
  labSoundEnabled,
  error,
  savedNotice,
  celebrationVisible,
  onPickOption,
  onConfirmOption,
  onReasonChange,
  onClearReason,
  onSaveSingleReason,
  onSubmitReasons,
  onBackToHq,
  onProceedToPhase4,
}: DetectiveEvidenceScannerProps) {
  const [activeChallengeIdx, setActiveChallengeIdx] = useState<number>(() => {
    const firstUnsolved = LOGIC_CHALLENGES.findIndex((ch) => {
      const ans = state.logicChallengeAnswers[ch.id];
      return !ch.options.find((o) => o.id === ans)?.isRelevant;
    });
    return firstUnsolved >= 0 ? firstUnsolved : 0;
  });

  const activeChallenge = LOGIC_CHALLENGES[activeChallengeIdx] ?? LOGIC_CHALLENGES[0];
  const challengeLocId = CHALLENGE_LOCATION_MAP[activeChallenge.id] ?? 'kantin';
  const challengePhotoUrl = LOCATION_PHOTO_MAP[challengeLocId];

  const journalLocations: LocationId[] =
    state.selectedEvidenceIds.length > 0 ? state.selectedEvidenceIds : [challengeLocId];

  const [journalLocId, setJournalLocId] = useState<LocationId>(() =>
    journalLocations.includes(challengeLocId) ? challengeLocId : journalLocations[0]
  );

  // Sync journal location when switching challenges if that location is selected
  useEffect(() => {
    if (journalLocations.includes(challengeLocId)) {
      setJournalLocId(challengeLocId);
    }
  }, [activeChallenge.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [inspectedOption, setInspectedOption] = useState<LogicChallengeOption | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanTargetOpt, setScanTargetOpt] = useState<'A' | 'B' | null>(null);
  const [scanStageLabel, setScanStageLabel] = useState('Mengimbas Dokumen...');
  const [dragHoverScanner, setDragHoverScanner] = useState(false);
  const [hintExpanded, setHintExpanded] = useState(false);
  const [reasonAnalysisResult, setReasonAnalysisResult] = useState<{
    locId: LocationId;
    result: ReasoningEvalResult;
  } | null>(null);
  const [localError, setLocalError] = useState('');

  const scanMidRef = useRef<number | null>(null);
  const scanEndRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    return () => {
      if (scanMidRef.current !== null) window.clearTimeout(scanMidRef.current);
      if (scanEndRef.current !== null) window.clearTimeout(scanEndRef.current);
    };
  }, []);

  useEffect(() => {
    if (!inspectedOption) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInspectedOption(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inspectedOption]);

  const pendingOptId = pendingSelections[activeChallenge.id];
  const confirmedOptId = confirmedChallenges[activeChallenge.id]
    ? state.logicChallengeAnswers[activeChallenge.id]
    : undefined;
  const confirmedOpt = confirmedOptId
    ? activeChallenge.options.find((o) => o.id === confirmedOptId)
    : undefined;
  const selectedDocId = pendingOptId || confirmedOptId;

  const solvedChallengesCount = LOGIC_CHALLENGES.filter((ch) => {
    const ans = state.logicChallengeAnswers[ch.id];
    return Boolean(confirmedChallenges[ch.id] && ch.options.find((o) => o.id === ans)?.isRelevant);
  }).length;
  const allChallengesPassed = areLogicChallengesComplete(state);
  const phase3Done = isPhase3Complete(state);

  const savedJournalCount = journalLocations.filter(
    (id) => (state.opinions[id]?.reasonText || '').trim().length >= 10
  ).length;

  const totalSteps = LOGIC_CHALLENGES.length + journalLocations.length;
  const completedSteps = solvedChallengesCount + savedJournalCount;
  const progressRatio = totalSteps > 0 ? Math.min(1, completedSteps / totalSteps) : 0;

  const currentRank = getAgentRank(state.xp, state.finalReportSaved);
  const shortStageLabel = currentRank.includes('Arkitek')
    ? 'Arkitek'
    : currentRank.includes('Pakar')
      ? 'Pakar'
      : currentRank.includes('Penyiasat')
        ? 'Penyiasat'
        : 'Pelatih';

  const currentJournalLoc = LOCATION_MAP[journalLocId];
  const currentJournalText = draftReasons[journalLocId] || '';
  const currentWordCount = countWords(currentJournalText);
  const currentCharCount = currentJournalText.trim().length;
  const referenceOpinionForJournal =
    (state.opinions[journalLocId]?.opinionText || '').trim() || activeChallenge.opinion;

  const startScannerSequence = (optId: 'A' | 'B') => {
    if (isScanning) return;
    if (scanMidRef.current !== null) window.clearTimeout(scanMidRef.current);
    if (scanEndRef.current !== null) window.clearTimeout(scanEndRef.current);

    setInspectedOption(null);
    onPickOption(activeChallenge.id, optId);

    if (labSoundEnabled) gameAudio.playClick();
    setScanTargetOpt(optId);
    setScanStageLabel(`Mengimbas Dokumen ${optId}...`);
    setIsScanning(true);

    scanMidRef.current = window.setTimeout(() => {
      setScanStageLabel('Menilai Kerelevanan Alasan...');
    }, 460);

    scanEndRef.current = window.setTimeout(() => {
      setIsScanning(false);
      setScanTargetOpt(null);
      onConfirmOption(activeChallenge.id);
    }, 950);
  };

  const handleInspectDocument = (opt: LogicChallengeOption) => {
    if (labSoundEnabled) gameAudio.playHint();
    onPickOption(activeChallenge.id, opt.id);
    setInspectedOption(opt);
  };

  const handleAnalyseMyReason = () => {
    setLocalError('');
    if (currentCharCount < 10) {
      if (labSoundEnabled) gameAudio.playError();
      setLocalError(
        `Sila tulis alasan yang relevan untuk ${currentJournalLoc.name} sekurang-kurangnya 10 aksara sebelum menjalankan analisis.`
      );
      textareaRef.current?.focus();
      return;
    }
    if (labSoundEnabled) gameAudio.playClueFound();
    const res = evaluateReasoningInput(
      currentJournalText,
      referenceOpinionForJournal,
      journalLocId
    );
    setReasonAnalysisResult({ locId: journalLocId, result: res });
  };

  const handleSaveSingleToDecisionCard = () => {
    setLocalError('');
    const ok = onSaveSingleReason(journalLocId);
    if (ok) {
      const res = evaluateReasoningInput(
        currentJournalText,
        referenceOpinionForJournal,
        journalLocId
      );
      setReasonAnalysisResult({ locId: journalLocId, result: res });
    }
  };

  const professorDialogue = (() => {
    if (isScanning && scanTargetOpt) {
      return `Pengimbas sedang meneliti kandungan Dokumen ${scanTargetOpt} dan memadankannya dengan pernyataan pendapat kes ini...`;
    }
    if (confirmedOpt) {
      return confirmedOpt.explanation;
    }
    if (pendingOptId) {
      return `Dokumen ${pendingOptId} telah dipilih! Klik "Hantar ke Pengimbas" atau seret dokumen ke pengimbas di tengah untuk menguji kerelevanannya.`;
    }
    return 'Pilih salah satu dokumen (A atau B) yang memberikan alasan yang paling relevan dengan pendapat tersebut.';
  })();

  const optionA = activeChallenge.options.find((o) => o.id === 'A') ?? activeChallenge.options[0];
  const optionB = activeChallenge.options.find((o) => o.id === 'B') ?? activeChallenge.options[1];

  const ringRadius = 38;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - progressRatio);

  return (
    <div className="relative min-h-[calc(100vh-68px)] w-full overflow-hidden bg-[#1D3226] text-[#26382F]">
      {/* 1. LUXURIOUS DETECTIVE OFFICE BACKGROUND + WOODEN INVESTIGATION DESK */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <img
          src={officeBackdropUrl}
          alt=""
          className="w-full h-full object-cover object-center"
        />
        {/* Warm bright sunlit room veil keeping readability high */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(245, 232, 207, 0.24) 0%, rgba(232, 212, 176, 0.16) 44%, rgba(56, 35, 18, 0.58) 76%, rgba(36, 21, 10, 0.82) 100%)',
          }}
        />
        {/* Floating subtle gold dust motes */}
        {FLOATING_MOTES.map((mote) => (
          <span
            key={mote.id}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#E7C878]/65 float-mote"
            style={
              {
                left: mote.left,
                top: mote.top,
                '--mote-dur': mote.dur,
                '--mote-delay': mote.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* FOREGROUND WORKSPACE CONTAINER */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-6 pt-3 pb-6 space-y-3.5">
        {/* 2. TOP HORIZONTAL MISSION HEADER BANNER */}
        <section
          aria-label="Maklumat Misi Semasa"
          className="relative rounded-2xl bg-gradient-to-r from-[#174C39] via-[#124131] to-[#103D30] border-2 border-[#E7C878] shadow-[0_12px_30px_rgba(10,28,20,0.45)] px-3.5 sm:px-5 py-2.5 text-[#FFFFFF]"
        >
          {/* Decorative corner gold ticks */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#F5E8CF]/75 rounded-tl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#F5E8CF]/75 rounded-tr"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#F5E8CF]/75 rounded-bl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#F5E8CF]/75 rounded-br"
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Back Link + Mission Emblem + Title & Description */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={onBackToHq}
                title="Kembali ke Pusat Operasi"
                aria-label="Kembali ke Pusat Operasi"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#0D3327] hover:bg-[#1E5D46] border border-[#E7C878]/70 text-[#E7C878] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878]"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0D3327] border border-[#E7C878] shadow-inner shrink-0">
                <span className="w-7 h-7 rounded-full bg-[#E7C878] text-[#103D30] flex items-center justify-center font-bold">
                  <ScanSearch className="w-4 h-4" />
                </span>
                <div className="leading-none">
                  <span className="block font-mono-tabular text-[10px] uppercase tracking-wider text-[#E7C878]">
                    Scanner
                  </span>
                  <span className="block font-display text-sm sm:text-base font-bold text-[#FFFFFF]">
                    Misi {activeChallengeIdx + 1}
                  </span>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-lg sm:text-2xl font-bold text-[#FFFFFF] tracking-tight leading-tight">
                    Bina Alasan yang Relevan
                  </h1>
                  <span className="font-mono-tabular text-[11px] font-semibold text-[#E7C878]">
                    · {activeChallenge.contextTitle}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#DCE9D9] truncate sm:whitespace-normal">
                  Analisis dokumen bukti untuk menentukan alasan yang paling relevan.
                </p>
              </div>
            </div>

            {/* Right: Mission Step Circles + XP Reward + Detective Stage */}
            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-5 shrink-0">
              {/* Interactive Case Step Circles */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#F5E8CF]">
                  Kemajuan Misi: ({solvedChallengesCount}/{LOGIC_CHALLENGES.length} Kes)
                </span>
                <div className="flex items-center gap-1.5">
                  {LOGIC_CHALLENGES.map((ch, idx) => {
                    const ans = state.logicChallengeAnswers[ch.id];
                    const solved = Boolean(
                      confirmedChallenges[ch.id] &&
                        ch.options.find((o) => o.id === ans)?.isRelevant
                    );
                    const isCurrent = idx === activeChallengeIdx;

                    return (
                      <React.Fragment key={ch.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (labSoundEnabled) gameAudio.playClick();
                            setActiveChallengeIdx(idx);
                            setInspectedOption(null);
                          }}
                          aria-label={`Pilih ${ch.contextTitle}`}
                          aria-current={isCurrent ? 'step' : undefined}
                          title={ch.contextTitle}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-mono-tabular text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878] ${
                            solved
                              ? 'bg-[#10B981] border-[#E7C878] text-[#FFFFFF] shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                              : isCurrent
                                ? 'bg-[#1E5D46] border-[#E7C878] text-[#E7C878] ring-2 ring-[#E7C878]/40'
                                : 'bg-[#0D3327] border-[#E7C878]/45 text-[#DCE9D9] hover:border-[#E7C878]'
                          }`}
                        >
                          {solved ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                        </button>
                        {idx < LOGIC_CHALLENGES.length - 1 && (
                          <span
                            aria-hidden="true"
                            className={`w-5 h-0.5 rounded-full ${
                              solved ? 'bg-[#E7C878]' : 'bg-[#E7C878]/35'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <span aria-hidden="true" className="hidden sm:block h-9 w-px bg-[#E7C878]/35" />

              {/* XP Reward */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0D3327] border border-[#E7C878]/70 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-[#E7C878] text-[#E7C878]" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-[#DCE9D9]">Ganjaran XP</p>
                  <p className="font-mono-tabular text-sm sm:text-base font-extrabold text-[#E7C878]">
                    +120 / +130
                  </p>
                </div>
              </div>

              <span aria-hidden="true" className="hidden sm:block h-9 w-px bg-[#E7C878]/35" />

              {/* Detective Stage / Rank */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0D3327] border border-[#E7C878]/70 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#E7C878]" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-[#DCE9D9]">Tahap</p>
                  <p className="font-display text-sm sm:text-base font-bold text-[#FFFFFF]">
                    {shortStageLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. OPINION STATEMENT — CONFIDENTIAL CASE FILE (UPPER CENTRE) */}
        <div className="flex justify-center pt-1">
          <motion.div
            key={`opinion-${activeChallenge.id}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="relative w-full max-w-2xl aged-dossier-paper rounded-xl border-2 border-[#C7A972] px-6 sm:px-10 pt-6 pb-4 text-center"
          >
            {/* Red Pushpin at Upper-Left Corner */}
            <span
              aria-hidden="true"
              className="absolute -top-2 left-4 w-5 h-5 rounded-full bg-gradient-to-br from-[#F87171] via-[#DC2626] to-[#7F1D1D] border-2 border-[#FFFFFF]/80 shadow-[0_3px_6px_rgba(0,0,0,0.45)]"
            />
            <span
              aria-hidden="true"
              className="absolute top-0.5 left-5 w-1.5 h-1.5 rounded-full bg-[#FECACA]/85"
            />

            {/* Green-and-Gold Title Label */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-gradient-to-b from-[#174C39] to-[#103D30] border-2 border-[#E7C878] shadow-md whitespace-nowrap">
              <span className="font-display text-xs sm:text-sm font-bold tracking-wide text-[#F5E8CF]">
                Pernyataan Pendapat
              </span>
            </div>

            <p className="font-display text-base sm:text-xl font-bold text-[#26382F] leading-snug">
              “{activeChallenge.opinion}”
            </p>
          </motion.div>
        </div>

        {/* 4. MAIN INVESTIGATION DESK ROW: DOKUMEN A | EVIDENCE SCANNER | DOKUMEN B | PROFESSOR NURIN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-1">
          {/* LEFT: DOKUMEN A */}
          <div className="lg:col-span-3 flex flex-col items-center">
            <DocumentFileCard
              docId="A"
              option={optionA}
              photoUrl={challengePhotoUrl}
              locationName={LOCATION_MAP[challengeLocId].name}
              isSelected={selectedDocId === 'A'}
              isConfirmed={Boolean(confirmedOpt?.id === 'A')}
              isRelevant={confirmedOpt?.id === 'A' ? confirmedOpt.isRelevant : undefined}
              tiltClass="lg:-rotate-[2.5deg]"
              onInspect={() => handleInspectDocument(optionA)}
              onScanDirect={() => startScannerSequence('A')}
            />
          </div>

          {/* CENTRE: FUTURISTIC GLOWING EVIDENCE SCANNER */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragHoverScanner(true);
              }}
              onDragLeave={() => setDragHoverScanner(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragHoverScanner(false);
                const dropped = e.dataTransfer.getData('text/plain');
                if (dropped === 'A' || dropped === 'B') {
                  startScannerSequence(dropped);
                }
              }}
              aria-label="Pengimbas Bukti Evidence Scanner"
              className={`relative w-full rounded-2xl p-2.5 sm:p-3 transition-all duration-200 border-2 ${
                dragHoverScanner
                  ? 'border-[#34F5C5] scale-[1.015] shadow-[0_0_35px_rgba(52,245,197,0.45)]'
                  : 'border-[#E7C878] shadow-[0_22px_45px_rgba(10,25,18,0.6)]'
              } bg-gradient-to-b from-[#697874] via-[#2B433B] to-[#132921]`}
            >
              {/* Top Metallic Hood Bar + Cyan Light Tube */}
              <div className="relative h-6 rounded-t-xl bg-gradient-to-b from-[#8A9893] via-[#4C5C57] to-[#283B35] border-b border-[#E7C878]/50 flex items-center justify-center px-4">
                <div className="w-2/3 h-2 rounded-full bg-gradient-to-r from-[#10B981] via-[#7CFEE1] to-[#10B981] shadow-[0_0_16px_#34F5C5]" />
              </div>

              {/* Glass Scanning Chamber */}
              <div
                className={`scanner-bay-glow relative min-h-[215px] sm:min-h-[235px] rounded-lg border-2 overflow-hidden flex flex-col items-center justify-center p-4 text-center transition-colors ${
                  confirmedOpt && !isScanning
                    ? confirmedOpt.isRelevant
                      ? 'border-[#34F5C5] bg-gradient-to-b from-[#083B2E]/95 via-[#0F5A45]/90 to-[#093227]/95'
                      : 'border-[#F59E0B] bg-gradient-to-b from-[#3E2412]/95 via-[#582B19]/90 to-[#2E170D]/95'
                    : 'border-[#34F5C5]/80 bg-gradient-to-b from-[#0C382D]/95 via-[#105341]/92 to-[#092C23]/95'
                }`}
              >
                {/* Holographic Subtle Grid Lines */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-25"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(124,254,225,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(124,254,225,0.22) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                  }}
                />

                {/* Scanning Cyan Laser Beam */}
                {isScanning && (
                  <div
                    aria-hidden="true"
                    className="scanner-cyan-beam pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-[#5EFCE0]/65 to-transparent border-b-2 border-[#A7FFF0] z-20"
                  />
                )}

                <AnimatePresence mode="wait">
                  {isScanning && scanTargetOpt ? (
                    <motion.div
                      key={`scanning-${scanTargetOpt}`}
                      initial={{ opacity: 0, scale: 0.78, x: scanTargetOpt === 'A' ? -90 : 90 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="relative z-10 w-full max-w-[270px] space-y-3"
                    >
                      <div className="rounded-lg bg-[#F5E8CF] border-2 border-[#34F5C5] p-3 text-left text-[#26382F] shadow-[0_0_24px_rgba(52,245,197,0.4)]">
                        <div className="flex items-center justify-between text-[10px] font-mono-tabular font-bold text-[#174C39] mb-1">
                          <span>DOKUMEN {scanTargetOpt}</span>
                          <span className="text-[#059669]">MENGIMBAS...</span>
                        </div>
                        <p className="text-xs font-medium leading-snug line-clamp-3">
                          {scanTargetOpt === 'A' ? optionA.text : optionB.text}
                        </p>
                      </div>
                      <p className="font-mono-tabular text-xs font-bold tracking-wider text-[#7CFEE1]">
                        {scanStageLabel}
                      </p>
                    </motion.div>
                  ) : confirmedOpt ? (
                    <motion.div
                      key={`result-${activeChallenge.id}-${confirmedOpt.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      className="relative z-10 space-y-2.5 text-[#FFFFFF]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {confirmedOpt.isRelevant ? (
                          <CheckCircle2 className="w-6 h-6 text-[#5EFCE0] shrink-0" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-[#FBBF24] shrink-0" />
                        )}
                        <span
                          className={`font-mono-tabular text-xs sm:text-sm font-extrabold tracking-widest uppercase px-3 py-1 rounded-md border ${
                            confirmedOpt.isRelevant
                              ? 'bg-[#064E3B] border-[#5EFCE0] text-[#5EFCE0]'
                              : 'bg-[#7C2D12] border-[#FBBF24] text-[#FDE68A]'
                          }`}
                        >
                          {confirmedOpt.isRelevant ? 'ALASAN RELEVAN' : 'KURANG RELEVAN'}
                        </span>
                      </div>

                      <p className="text-xs sm:text-[13px] leading-relaxed text-[#F5F0E5] max-w-xs mx-auto">
                        {confirmedOpt.explanation}
                      </p>

                      {confirmedOpt.isRelevant ? (
                        activeChallengeIdx < LOGIC_CHALLENGES.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (labSoundEnabled) gameAudio.playClick();
                              setActiveChallengeIdx((idx) => idx + 1);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E7C878] hover:bg-[#F3DBA0] text-[#103D30] font-bold text-xs shadow-md transition-colors"
                          >
                            <span>Misi Seterusnya</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono-tabular font-bold text-[#5EFCE0]">
                            <Sparkles className="w-3.5 h-3.5" />
                            Semua 3 Kes Disahkan · Lengkapkan Jurnal di Bawah
                          </span>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            startScannerSequence(confirmedOpt.id === 'A' ? 'B' : 'A')
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#174C39] hover:bg-[#1E6049] border border-[#E7C878] text-[#E7C878] font-bold text-xs transition-colors"
                        >
                          <ScanSearch className="w-3.5 h-3.5" />
                          <span>Cuba Imbas Dokumen {confirmedOpt.id === 'A' ? 'B' : 'A'}</span>
                        </button>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="scanner-idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative z-10 flex flex-col items-center gap-3 text-[#FFFFFF]"
                    >
                      <div className="w-14 h-14 rounded-full bg-[#10B981]/20 border-2 border-[#7CFEE1] flex items-center justify-center shadow-[0_0_24px_rgba(94,252,224,0.35)]">
                        <Search className="w-7 h-7 text-[#7CFEE1]" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-display text-base sm:text-lg font-bold text-[#FFFFFF] leading-tight">
                          Sila pilih dokumen
                          <br />
                          untuk dianalisis
                        </p>
                        <p className="text-[11px] text-[#A7F3D0]">
                          Klik Dokumen A / B atau seret ke pengimbas ini
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Front Metallic Base + EVIDENCE SCANNER Nameplate */}
              <div className="mt-2.5 flex items-center justify-between gap-2 px-2">
                <span
                  aria-hidden="true"
                  className="w-7 h-1.5 rounded-full bg-[#34F5C5] shadow-[0_0_8px_#34F5C5]"
                />
                <div className="px-5 py-1 rounded-md bg-gradient-to-b from-[#2B3E36] to-[#10261E] border border-[#E7C878] shadow-inner">
                  <span className="font-mono-tabular text-[11px] sm:text-xs font-extrabold tracking-[0.22em] text-[#E7C878]">
                    EVIDENCE SCANNER
                  </span>
                </div>
                <span
                  aria-hidden="true"
                  className="w-7 h-1.5 rounded-full bg-[#34F5C5] shadow-[0_0_8px_#34F5C5]"
                />
              </div>
            </div>
          </div>

          {/* RIGHT-MID: DOKUMEN B */}
          <div className="lg:col-span-3 flex flex-col items-center">
            <DocumentFileCard
              docId="B"
              option={optionB}
              photoUrl={challengePhotoUrl}
              locationName={LOCATION_MAP[challengeLocId].name}
              isSelected={selectedDocId === 'B'}
              isConfirmed={Boolean(confirmedOpt?.id === 'B')}
              isRelevant={confirmedOpt?.id === 'B' ? confirmedOpt.isRelevant : undefined}
              tiltClass="lg:rotate-[2.5deg]"
              onInspect={() => handleInspectDocument(optionB)}
              onScanDirect={() => startScannerSequence('B')}
            />
          </div>

          {/* FAR RIGHT: PROFESSOR NURIN STANDING CHARACTER + DIALOGUE + DENGAR HINT */}
          <aside
            aria-label="Bimbingan Profesor Nurin"
            className="lg:col-span-2 flex flex-col items-center lg:items-end justify-end relative"
          >
            {/* Character Portrait Framed Beside Desk */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative w-36 sm:w-44 lg:w-full max-w-[195px] -mb-4 z-0 rounded-t-2xl overflow-hidden border-2 border-[#E7C878]/80 shadow-xl bg-[#F5E8CF]"
            >
              <img
                src={professorNurinStandingUrl}
                alt="Profesor Nurin membimbing penyiasatan"
                referrerPolicy="no-referrer"
                className="w-full h-44 sm:h-48 object-cover object-top"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#103D30]/40 to-transparent"
              />
            </motion.div>

            {/* Cream Dialogue Box */}
            <div className="relative z-10 w-full rounded-2xl aged-dossier-paper border-2 border-[#E7C878] p-3.5 pt-5 text-[#26382F] shadow-xl">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF] border-2 border-[#E7C878] shadow-sm whitespace-nowrap">
                <Lightbulb className="w-3.5 h-3.5 text-[#D97706]" />
                <span className="font-display text-xs font-bold text-[#174C39]">
                  Professor Nurin
                </span>
              </div>

              <p className="text-xs leading-relaxed text-[#26382F] font-medium">
                {professorDialogue}
              </p>

              {hintExpanded && (
                <div className="mt-2.5 pt-2 border-t border-[#C7A972]/60 text-[11px] text-[#174C39] space-y-1 lab-report-reveal">
                  <p className="font-bold">Petunjuk Mentor:</p>
                  <p className="leading-snug text-[#26382F]">
                    Alasan yang relevan menerangkan <strong>sebab</strong> atau{' '}
                    <strong>manfaat langsung</strong> apabila cadangan dilaksanakan (gunakan kata
                    hubung <em>kerana, supaya, agar</em>).
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (labSoundEnabled) gameAudio.playHint();
                setHintExpanded((prev) => !prev);
              }}
              aria-expanded={hintExpanded}
              className="mt-2 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-b from-[#1A5842] to-[#103D30] hover:from-[#216B51] hover:to-[#174C39] text-[#FFFFFF] border-2 border-[#E7C878] text-xs font-bold shadow-lg transition-all whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-[#E7C878] text-[#E7C878]" />
              <span>{hintExpanded ? 'Tutup Hint' : 'Dengar Hint'}</span>
            </button>
          </aside>
        </div>

        {/* 5. BOTTOM ROW: CIRCULAR DETECTIVE PROGRESS EMBLEM (LEFT) + JURNAL DETEKTIF (CENTRE-RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end pt-1">
          {/* BOTTOM-LEFT: CIRCULAR MISSION PROGRESS EMBLEM */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* Circular Gold Progress Ring */}
                <svg
                  viewBox="0 0 92 92"
                  className="absolute inset-0 w-full h-full -rotate-90"
                  aria-hidden="true"
                >
                  <circle
                    cx="46"
                    cy="46"
                    r={ringRadius}
                    fill="#103D30"
                    stroke="rgba(231, 200, 120, 0.25)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="46"
                    cy="46"
                    r={ringRadius}
                    fill="none"
                    stroke="#E7C878"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringDashOffset}
                    style={{ transition: 'stroke-dashoffset 0.45s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                </svg>

                <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-b from-[#1C5742] to-[#0E3126] border border-[#E7C878]/60 flex items-center justify-center shadow-inner">
                  <DetectiveHatEmblem className="w-16 h-16" />
                </div>
              </div>

              {/* Deep Green & Gold Step Label */}
              <div className="-mt-3 relative z-20 px-5 py-2 rounded-xl bg-gradient-to-b from-[#174C39] to-[#103D30] border-2 border-[#E7C878] text-center shadow-lg min-w-[175px]">
                <p className="font-mono-tabular text-xs font-extrabold tracking-wider text-[#FFFFFF]">
                  LANGKAH {completedSteps} / {totalSteps}
                </p>
                <p className="font-mono-tabular text-[10px] font-bold tracking-widest uppercase text-[#E7C878]">
                  {allChallengesPassed ? 'PENULISAN JURNAL' : 'ANALISIS DOKUMEN'}
                </p>
              </div>
            </div>
          </div>

          {/* BOTTOM CENTRE-RIGHT: LARGE DETECTIVE JOURNAL */}
          <form
            id="part-b-notebook"
            onSubmit={onSubmitReasons}
            className="lg:col-span-9 relative rounded-2xl aged-dossier-paper border-2 border-[#E7C878] p-4 sm:p-5 pt-7 text-[#26382F] shadow-[0_18px_40px_rgba(10,24,18,0.48)]"
          >
            {/* Forest-Green & Gold Top Header Tab: Jurnal Detektif */}
            <div className="absolute -top-4 left-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-b from-[#174C39] to-[#103D30] border-2 border-[#E7C878] shadow-md">
              <Pencil className="w-4 h-4 text-[#E7C878]" />
              <span className="font-display text-sm sm:text-base font-bold text-[#FFFFFF]">
                Jurnal Detektif
              </span>
            </div>

            {/* Subtle Spiral Notebook Rings on Right Edge (Desktop) */}
            <div
              aria-hidden="true"
              className="hidden sm:flex flex-col justify-evenly absolute right-1.5 top-6 bottom-6 w-2.5 pointer-events-none"
            >
              {Array.from({ length: 7 }).map((_, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-[#3A4340] border border-[#E7C878]/60 shadow-inner"
                />
              ))}
            </div>

            <div className="sm:pr-4 space-y-3">
              {/* Location Tabs for Selected Phase 2 Cases + Instruction */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-bold text-[#26382F]">
                  Tuliskan alasan yang relevan dan jelaskan kaitannya dengan pendapat tersebut.
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  {journalLocations.map((locId) => {
                    const loc = LOCATION_MAP[locId];
                    const isActive = locId === journalLocId;
                    const isSaved = (state.opinions[locId]?.reasonText || '').trim().length >= 10;
                    return (
                      <button
                        key={locId}
                        type="button"
                        onClick={() => {
                          if (labSoundEnabled) gameAudio.playClick();
                          setJournalLocId(locId);
                          setLocalError('');
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors ${
                          isActive
                            ? 'bg-[#174C39] border-[#E7C878] text-[#FFFFFF]'
                            : 'bg-[#FFFFFF]/80 border-[#C7A972] text-[#26382F] hover:bg-[#FFFFFF]'
                        }`}
                      >
                        {isSaved && (
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              isActive ? 'text-[#E7C878]' : 'text-[#174C39]'
                            }`}
                          />
                        )}
                        <span>{loc.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reference Opinion for Active Journal Location */}
              <div className="rounded-lg bg-[#FFFFFF]/85 border border-[#C7A972]/70 px-3 py-2 text-xs text-[#26382F]">
                <span className="font-bold text-[#174C39]">
                  Pendapat ({currentJournalLoc.name}):{' '}
                </span>
                <span className="font-medium">“{referenceOpinionForJournal}”</span>
              </div>

              {/* Writing Input + Action Stack */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
                <div className="md:col-span-8 flex flex-col gap-1.5">
                  <label htmlFor={`reason-${journalLocId}`} className="sr-only">
                    Tulis alasan relevan bagi {currentJournalLoc.name}
                  </label>
                  <textarea
                    ref={textareaRef}
                    id={`reason-${journalLocId}`}
                    rows={3}
                    value={currentJournalText}
                    onChange={(e) => {
                      onReasonChange(journalLocId, e.target.value);
                      setLocalError('');
                      setReasonAnalysisResult(null);
                    }}
                    placeholder="Taip jawapan anda di sini..."
                    className="w-full min-h-[96px] rounded-xl p-3 bg-[#FFFFFF] border-2 border-[#C7A972] focus:border-[#174C39] focus:ring-2 focus:ring-[#E7C878]/60 focus:outline-none text-sm leading-relaxed text-[#26382F] placeholder-[#6A7B73]"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#26382F]">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <FileText className="w-3.5 h-3.5 text-[#174C39]" />
                      Minimum: 10 aksara (cadangan ≥ 6 patah perkataan)
                    </span>
                    <div className="flex items-center gap-3 font-mono-tabular font-bold text-[#174C39]">
                      <span>{currentWordCount} patah perkataan</span>
                      {currentCharCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (labSoundEnabled) gameAudio.playClick();
                            onClearReason(journalLocId);
                            setReasonAnalysisResult(null);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-[#7F1D1D] hover:underline"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Kosongkan
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons: ANALISIS ALASAN SAYA & SIMPAN KE KAD KEPUTUSAN */}
                <div className="md:col-span-4 flex flex-col justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleAnalyseMyReason}
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#1C5C45] to-[#103D30] hover:from-[#236D52] hover:to-[#174C39] text-[#FFFFFF] border-2 border-[#E7C878]/85 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
                  >
                    <Search className="w-4 h-4 text-[#E7C878]" />
                    <span>Analisis Alasan Saya</span>
                  </button>

                  {journalLocations.length > 1 && savedJournalCount < journalLocations.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleSaveSingleToDecisionCard}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#F5E0A0] via-[#E7C878] to-[#D2A748] hover:brightness-105 text-[#26382F] border-2 border-[#A67F28] font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
                    >
                      <Save className="w-4 h-4 text-[#174C39]" />
                      <span>Simpan ke Kad Keputusan</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#F5E0A0] via-[#E7C878] to-[#D2A748] hover:brightness-105 text-[#26382F] border-2 border-[#A67F28] font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
                    >
                      <Save className="w-4 h-4 text-[#174C39]" />
                      <span>Simpan ke Kad Keputusan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Analysis Checklist Feedback */}
              {reasonAnalysisResult && reasonAnalysisResult.locId === journalLocId && (
                <div className="rounded-xl bg-[#FFFFFF] border-2 border-[#174C39]/35 p-3 space-y-2 lab-report-reveal">
                  <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#174C39]">
                    Keputusan Analisis Alasan · {currentJournalLoc.name}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { label: 'Kelengkapan Ayat', item: reasonAnalysisResult.result.completeness },
                      { label: 'Kata Hubung', item: reasonAnalysisResult.result.reasoningCue },
                      { label: 'Perkaitan Kes', item: reasonAnalysisResult.result.relevanceLink },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className={`rounded-lg p-2 border flex items-start gap-2 ${
                          row.item.met
                            ? 'bg-[#DCE9D9]/55 border-[#174C39]/30 text-[#26382F]'
                            : 'bg-[#FEF3C7]/70 border-[#D97706]/40 text-[#26382F]'
                        }`}
                      >
                        {row.item.met ? (
                          <CheckCircle2 className="w-4 h-4 text-[#174C39] shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold text-[#174C39]">{row.label}</p>
                          <p className="text-[11px] leading-snug">{row.item.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Error */}
              {(localError || error) && (
                <div
                  role="alert"
                  className="rounded-xl bg-[#FEE2E2] border-2 border-[#DC2626] px-3.5 py-2.5 text-xs font-semibold text-[#7F1D1D] flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span>{localError || error}</span>
                </div>
              )}

              {/* Completion Banner & Next Phase CTA */}
              {(savedNotice || phase3Done) && (
                <div
                  role="status"
                  className="rounded-xl bg-gradient-to-r from-[#174C39] to-[#103D30] border-2 border-[#E7C878] p-3.5 text-[#FFFFFF] flex flex-wrap items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-[#E7C878] text-[#103D30] flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="font-mono-tabular text-[11px] font-extrabold uppercase tracking-wider text-[#E7C878]">
                        {celebrationVisible ? 'MISI SELESAI · +130 XP' : 'ALASAN DISAHKAN'}
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-[#F5E8CF]">
                        Lencana Ahli Logik diperoleh! Rekod anda disimpan dalam Kad Keputusan.
                      </p>
                    </div>
                  </div>

                  {phase3Done && (
                    <button
                      type="button"
                      onClick={onProceedToPhase4}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E7C878] hover:bg-[#F3DBA0] text-[#103D30] font-bold text-xs sm:text-sm shadow transition-colors whitespace-nowrap"
                    >
                      <span>Buka Cabaran Akhir: Studio Arkitek</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* 6. ENLARGED DOCUMENT INSPECTION MODAL */}
      <AnimatePresence>
        {inspectedOption && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Pemeriksaan Terperinci Dokumen ${inspectedOption.id}`}
            onClick={() => setInspectedOption(null)}
            className="fixed inset-0 z-50 bg-[#0A1E17]/70 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg aged-dossier-paper rounded-2xl border-2 border-[#E7C878] p-5 sm:p-6 text-[#26382F] shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#C7A972] pb-3">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded bg-[#174C39] border border-[#E7C878] font-mono-tabular text-[11px] font-bold text-[#E7C878] mb-1">
                    DOKUMEN {inspectedOption.id} · BUKTI {inspectedOption.id}
                  </span>
                  <h2 className="font-display text-xl font-bold text-[#26382F]">
                    Fail Kandungan Bukti ({LOCATION_MAP[challengeLocId].name})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedOption(null)}
                  aria-label="Tutup paparan dokumen"
                  className="w-9 h-9 rounded-lg bg-[#174C39] hover:bg-[#103D30] text-[#FFFFFF] border border-[#E7C878] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border-2 border-[#C7A972] h-40 bg-[#DCE9D9]">
                <img
                  src={challengePhotoUrl}
                  alt={`Gambar lokasi ${LOCATION_MAP[challengeLocId].name}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-3 right-3 px-3 py-1 rounded border-2 border-[#DC2626] text-[#DC2626] bg-[#FFFFFF]/90 font-mono-tabular text-xs font-extrabold tracking-widest -rotate-6 shadow"
                >
                  BUKTI {inspectedOption.id}
                </div>
              </div>

              <div className="rounded-xl bg-[#FFFFFF] border border-[#C7A972] p-4 space-y-1.5">
                <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#174C39]">
                  Pernyataan Bukti / Alasan Untuk Diuji:
                </p>
                <p className="text-sm sm:text-base font-semibold leading-relaxed text-[#26382F]">
                  “{inspectedOption.text}”
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setInspectedOption(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#E8D4B0] border border-[#C7A972] text-xs sm:text-sm font-bold text-[#26382F]"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => startScannerSequence(inspectedOption.id)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#1C5C45] to-[#103D30] hover:from-[#236D52] hover:to-[#174C39] text-[#FFFFFF] border-2 border-[#E7C878] text-xs sm:text-sm font-bold shadow-md"
                >
                  <ScanSearch className="w-4 h-4 text-[#E7C878]" />
                  <span>Hantar ke Pengimbas Bukti</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DocumentFileCardProps {
  docId: 'A' | 'B';
  option: LogicChallengeOption;
  photoUrl: string;
  locationName: string;
  isSelected: boolean;
  isConfirmed: boolean;
  isRelevant?: boolean;
  tiltClass: string;
  onInspect: () => void;
  onScanDirect: () => void;
}

function DocumentFileCard({
  docId,
  option,
  photoUrl,
  locationName,
  isSelected,
  isConfirmed,
  isRelevant,
  tiltClass,
  onInspect,
  onScanDirect,
}: DocumentFileCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', docId);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`group relative w-full max-w-[265px] transition-all duration-200 ${tiltClass} hover:rotate-0 ${
        isSelected ? '-translate-y-1.5' : 'hover:-translate-y-1'
      }`}
    >
      {/* Top Green-and-Gold Tab */}
      <div className="flex justify-center -mb-2.5 relative z-20">
        <div className="px-4 py-1 rounded-full bg-gradient-to-b from-[#174C39] to-[#103D30] border-2 border-[#E7C878] shadow-md">
          <span className="font-display text-xs sm:text-sm font-bold text-[#F5E8CF]">
            Dokumen {docId}
          </span>
        </div>
      </div>

      {/* Physical Clipboard Sheet */}
      <div
        className={`relative aged-dossier-paper rounded-xl border-2 p-3.5 pt-5 space-y-2.5 transition-all ${
          isConfirmed && isRelevant === true
            ? 'border-[#10B981] ring-4 ring-[#10B981]/35'
            : isConfirmed && isRelevant === false
              ? 'border-[#DC2626] ring-4 ring-[#DC2626]/25'
              : isSelected
                ? 'border-[#E7C878] ring-4 ring-[#E7C878]/45'
                : 'border-[#C7A972] hover:border-[#E7C878]'
        }`}
      >
        {/* Metallic Silver Paperclip */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 left-3.5 w-3.5 h-8 rounded-full border-2 border-[#94A3B8] bg-transparent shadow-sm"
        />

        {/* Clickable Document Preview Area */}
        <button
          type="button"
          onClick={onInspect}
          aria-pressed={isSelected}
          aria-label={`Teliti kandungan Dokumen ${docId}`}
          className="w-full text-left space-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174C39] rounded-lg"
        >
          {/* Evidence Thumbnail Photo */}
          <div className="relative h-20 w-full rounded-lg overflow-hidden border border-[#C7A972] bg-[#DCE9D9]">
            <img
              src={photoUrl}
              alt={`Foto bukti ${locationName}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Evidence Statement Snippet */}
          <p className="text-xs font-semibold leading-snug text-[#26382F] line-clamp-3 min-h-[48px]">
            {option.text}
          </p>
        </button>

        {/* Bottom Stamp + Quick Scan & Magnifying Glass */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={onScanDirect}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
              isSelected
                ? 'bg-[#174C39] text-[#E7C878] border-[#E7C878]'
                : 'bg-[#FFFFFF] hover:bg-[#174C39] text-[#174C39] hover:text-[#FFFFFF] border-[#174C39]/35'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Imbas {docId}</span>
          </button>

          {/* Red Rubber Stamp */}
          <span
            aria-hidden="true"
            className="px-2 py-0.5 rounded border-2 border-[#DC2626] bg-[#FFFFFF]/80 font-mono-tabular text-[10px] font-extrabold tracking-widest text-[#DC2626] -rotate-6 shadow-xs"
          >
            BUKTI {docId}
          </span>

          {/* Magnifying Glass Button */}
          <button
            type="button"
            onClick={onInspect}
            aria-label={`Buka kanta pembesar Dokumen ${docId}`}
            title={`Teliti Dokumen ${docId}`}
            className="w-9 h-9 rounded-full bg-gradient-to-b from-[#174C39] to-[#103D30] hover:from-[#236D52] hover:to-[#174C39] border-2 border-[#E7C878] text-[#E7C878] flex items-center justify-center shadow-md transition-transform hover:scale-105 shrink-0"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
