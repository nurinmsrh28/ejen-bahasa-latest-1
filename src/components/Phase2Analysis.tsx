import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileSearch,
  Fingerprint,
  Flag,
  Lightbulb,
  Link2,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import officeBackdropUrl from '../assets/images/detective_office_backdrop_1794998231603.jpg';
import professorNurinStandingUrl from '../assets/images/professor_nurin_standing_1794998233968.jpg';
import { gameAudio } from '../game/audio';
import { LOCATIONS, LOCATION_MAP } from '../game/data';
import { countWords, validateEvidenceSelection } from '../game/rules';
import type { GameState, LocationId } from '../game/types';
import { CASE_FILE_META, evaluateOpinionFeedback } from './DetectiveDeductionLab';
import { LOCATION_PHOTO_URLS } from './LocationScenes';
import { CaseDetailInspectionModal } from './deductionMatrix/CaseDetailInspectionModal';
import {
  DeductionCircuitWorkspace,
  type MatrixStageId,
} from './deductionMatrix/DeductionCircuitWorkspace';

interface Phase2AnalysisProps {
  state: GameState;
  onSaveAnalysis: (
    selectedIds: LocationId[],
    opinionsByLoc: Record<LocationId, string>
  ) => void;
  onBackToHq: () => void;
  onProceedToPhase3: () => void;
}

const MATRIX_STAGES: {
  id: MatrixStageId;
  num: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'vault', num: '01', label: 'Teliti Fail Kes', icon: Search },
  { id: 'select', num: '02', label: 'Pilih Bukti Utama', icon: Fingerprint },
  { id: 'circuit', num: '03', label: 'Bina Pendapat', icon: Brain },
  { id: 'scanner', num: '04', label: 'Uji Kekuatan Hujah', icon: ScanSearch },
  { id: 'decision', num: '05', label: 'Simpan Keputusan', icon: Flag },
];

function DetectiveBackpackSvg() {
  return (
    <svg
      viewBox="0 0 84 96"
      className="w-14 h-16 sm:w-16 sm:h-20 shrink-0 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Top Handle & Straps */}
      <path
        d="M32 14C32 8 36 5 42 5C48 5 52 8 52 14"
        stroke="#C59148"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Main Pack Body */}
      <rect
        x="14"
        y="16"
        width="56"
        height="68"
        rx="14"
        fill="#133D35"
        stroke="#D9B45B"
        strokeWidth="2.5"
      />
      {/* Top Flap */}
      <path
        d="M14 28C14 19 20 15 28 15H56C64 15 70 19 70 28V43C70 46 67 48 64 48H20C17 48 14 46 14 43V28Z"
        fill="#1E5448"
        stroke="#E7C878"
        strokeWidth="2.2"
      />
      {/* Leather Straps & Gold Buckles */}
      <rect x="25" y="22" width="7" height="32" rx="3" fill="#8C592C" stroke="#E7C878" strokeWidth="1.2" />
      <rect x="52" y="22" width="7" height="32" rx="3" fill="#8C592C" stroke="#E7C878" strokeWidth="1.2" />
      <rect x="24" y="42" width="9" height="7" rx="1.5" fill="#FFD45C" />
      <rect x="51" y="42" width="9" height="7" rx="1.5" fill="#FFD45C" />
      {/* Front Pocket */}
      <rect
        x="21"
        y="55"
        width="42"
        height="22"
        rx="6"
        fill="#0D2C26"
        stroke="#36D9FF"
        strokeWidth="1.8"
      />
      {/* Center Emblem */}
      <circle cx="42" cy="66" r="5.5" fill="#FFD45C" stroke="#092D27" strokeWidth="1.4" />
      <path d="M42 62.5L43.2 65.5L46 66L43.2 66.5L42 69.5L40.8 66.5L38 66L40.8 65.5L42 62.5Z" fill="#092D27" />
    </svg>
  );
}

interface HoloRingGaugeProps {
  percent: number;
  accentColor?: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

function HoloRingGauge({
  percent,
  accentColor = '#00BFA6',
  size = 56,
  strokeWidth = 5,
  label,
  sublabel,
}: HoloRingGaugeProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="rgba(5, 27, 23, 0.8)"
          stroke="rgba(54, 217, 255, 0.2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.35s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        {label !== undefined && (
          <span className="font-mono-tabular text-[11px] font-extrabold text-[#FFFFFF]">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[8px] font-bold text-[#DCE9DF]/85 mt-0.5">{sublabel}</span>
        )}
      </div>
    </div>
  );
}

export function Phase2Analysis({
  state,
  onSaveAnalysis,
  onBackToHq,
  onProceedToPhase3,
}: Phase2AnalysisProps) {
  const [selectedIds, setSelectedIds] = useState<LocationId[]>(state.selectedEvidenceIds);
  const [focusedLocId, setFocusedLocId] = useState<LocationId>(
    state.selectedEvidenceIds[0] || 'kantin'
  );
  const [activeStage, setActiveStage] = useState<MatrixStageId>(() => {
    if (state.selectedEvidenceIds.length >= 2) {
      const hasAnySaved = state.selectedEvidenceIds.some(
        (id) => (state.opinions[id]?.opinionText || '').trim().length >= 10
      );
      return hasAnySaved ? 'decision' : 'circuit';
    }
    return 'vault';
  });

  const [draftOpinions, setDraftOpinions] = useState<Record<LocationId, string>>({
    kantin: state.opinions.kantin.opinionText,
    kelas: state.opinions.kelas.opinionText,
    perpustakaan: state.opinions.perpustakaan.opinionText,
    taman: state.opinions.taman.opinionText,
  });

  const [inspectingLocId, setInspectingLocId] = useState<LocationId | null>(null);
  const [scanningLoc, setScanningLoc] = useState<LocationId | null>(null);
  const [hintStepByLoc, setHintStepByLoc] = useState<Record<LocationId, 1 | 2 | 3>>({
    kantin: 1,
    kelas: 1,
    perpustakaan: 1,
    taman: 1,
  });

  const [error, setError] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const textareaRefs = useRef<Partial<Record<LocationId, HTMLTextAreaElement | null>>>({});

  const canProceed =
    selectedIds.length >= 2 &&
    selectedIds.length <= 3 &&
    selectedIds.every((id) => (state.opinions[id]?.opinionText || '').trim().length >= 10);

  const focusedLoc = LOCATION_MAP[focusedLocId];
  const focusedInv = state.investigations[focusedLocId];
  const focusedMeta = CASE_FILE_META[focusedLocId];
  const focusedDraft = draftOpinions[focusedLocId] || '';
  const focusedWords = countWords(focusedDraft);

  const liveFeedback = useMemo(
    () =>
      evaluateOpinionFeedback(
        focusedDraft,
        focusedLocId,
        focusedInv.notes,
        focusedInv.initialProposal
      ),
    [focusedDraft, focusedLocId, focusedInv.notes, focusedInv.initialProposal]
  );

  const completenessPct = liveFeedback.completeness.met
    ? 100
    : focusedWords === 0
      ? 0
      : Math.min(85, Math.round((focusedWords / 7) * 80));
  const evidencePct = liveFeedback.evidenceLink.met ? 100 : 0;
  const clarityPct = liveFeedback.clarity.met
    ? 100
    : focusedDraft.trim().length > 0
      ? 45
      : 0;

  const toggleEvidence = (locId: LocationId) => {
    setError('');
    setSavedNotice(null);
    setFocusedLocId(locId);

    setSelectedIds((prev) => {
      if (prev.includes(locId)) {
        gameAudio.playClick();
        const next = prev.filter((id) => id !== locId);
        if (next.length === 0 && activeStage !== 'vault' && activeStage !== 'select') {
          setActiveStage('select');
        }
        return next;
      }
      if (prev.length >= 3) {
        gameAudio.playError();
        setError('Anda hanya boleh memilih maksimum 3 bukti lokasi untuk analisis mendalam.');
        return prev;
      }
      gameAudio.playPlace();
      if (activeStage === 'vault') {
        setActiveStage('select');
      }
      return [...prev, locId];
    });
  };

  const insertText = (locId: LocationId, text: string) => {
    setError('');
    setSavedNotice(null);
    gameAudio.playClick();

    setDraftOpinions((prev) => {
      const current = prev[locId] || '';
      if (current.trim().length === 0) {
        return { ...prev, [locId]: text };
      }
      const needsSpace = !/\s$/.test(current);
      return { ...prev, [locId]: `${current}${needsSpace ? ' ' : ''}${text}` };
    });

    window.requestAnimationFrame(() => {
      textareaRefs.current[locId]?.focus();
    });
  };

  const handleClearOpinion = (locId: LocationId) => {
    setError('');
    setSavedNotice(null);
    gameAudio.playClick();
    setDraftOpinions((prev) => ({ ...prev, [locId]: '' }));
    window.requestAnimationFrame(() => {
      textareaRefs.current[locId]?.focus();
    });
  };

  const handleSaveSingleOpinion = (locId: LocationId): boolean => {
    const selCheck = validateEvidenceSelection(selectedIds);
    if (!selCheck.valid) {
      gameAudio.playError();
      setError(
        selCheck.error ||
          'Pilih sekurang-kurangnya 2 bukti lokasi di Secret Evidence Vault dahulu.'
      );
      return false;
    }

    const text = (draftOpinions[locId] || '').trim();
    if (text.length < 10) {
      gameAudio.playError();
      setError(
        `Sila tulis ayat pendapat untuk "${LOCATION_MAP[locId].name}" dengan lebih lengkap (sekurang-kurangnya 10 aksara).`
      );
      return false;
    }

    gameAudio.playSuccess();
    setError('');
    onSaveAnalysis(selectedIds, draftOpinions);
    setSavedNotice(`Jawapan pendapat bagi ${LOCATION_MAP[locId].name} telah disimpan!`);
    return true;
  };

  const handleSaveAll = () => {
    const selCheck = validateEvidenceSelection(selectedIds);
    if (!selCheck.valid) {
      gameAudio.playError();
      setError(selCheck.error || 'Pilih 2 hingga 3 bukti lokasi.');
      return;
    }

    for (const locId of selectedIds) {
      if ((draftOpinions[locId] || '').trim().length < 10) {
        gameAudio.playError();
        setFocusedLocId(locId);
        setActiveStage('circuit');
        setError(
          `Sila tulis ayat pendapat anda untuk bukti "${LOCATION_MAP[locId].name}" dengan lebih lengkap.`
        );
        return;
      }
    }

    gameAudio.playSuccess();
    setError('');
    onSaveAnalysis(selectedIds, draftOpinions);
    setSavedNotice('Semua ayat pendapat telah disimpan ke dalam Kad Keputusan Ejen!');
  };

  const handleRunScanner = (locId: LocationId) => {
    gameAudio.playTransition();
    setScanningLoc(locId);
    window.setTimeout(() => {
      setScanningLoc((curr) => (curr === locId ? null : curr));
    }, 850);
  };

  const handleStageClick = (target: MatrixStageId) => {
    setError('');
    if ((target === 'circuit' || target === 'scanner' || target === 'decision') && selectedIds.length < 2) {
      gameAudio.playError();
      setError('Sila pilih sekurang-kurangnya 2 bukti kes di Secret Evidence Vault dahulu.');
      setActiveStage('select');
      return;
    }
    gameAudio.playClick();
    if ((target === 'circuit' || target === 'scanner' || target === 'decision') && !selectedIds.includes(focusedLocId)) {
      setFocusedLocId(selectedIds[0]);
    }
    setActiveStage(target);
  };

  const handleCycleHint = () => {
    gameAudio.playHint();
    setHintStepByLoc((prev) => {
      const current = prev[focusedLocId] || 1;
      const next: 1 | 2 | 3 = current === 1 ? 2 : current === 2 ? 3 : 1;
      return { ...prev, [focusedLocId]: next };
    });
  };

  const currentHintStep = hintStepByLoc[focusedLocId] || 1;
  const strategicHints: Record<1 | 2 | 3, string> = {
    1: `Fikirkan kesan masalah di ${focusedLoc.name} terhadap keselesaan murid di sekolah.`,
    2: `Gunakan petunjuk utama "${focusedLoc.clues[0].label}" bersama frasa permulaan seperti "Pada pendapat saya..."`,
    3: `Pastikan ayat lengkap sekurang-kurangnya 7 perkataan, ada kata kunci bukti (${focusedMeta.domainKeywords.slice(0, 3).join(', ')}), dan berakhir dengan noktah (.).`,
  };

  const profesorDialogue = (() => {
    if (selectedIds.length === 0) {
      return `Ejen, pilih kes yang paling penting dan teliti semua bukti yang tersedia di Secret Evidence Vault.`;
    }
    if (selectedIds.length === 1) {
      return `Bagus! Anda sudah memilih 1 bukti (${LOCATION_MAP[selectedIds[0]].shortName}). Pilih sekurang-kurangnya 1 lagi kes untuk meneruskan analisis.`;
    }
    if (activeStage === 'vault' || activeStage === 'select') {
      return `Hebat! ${selectedIds.length} bukti utama telah dipilih. Tekan "TERUSKAN KE ANALISIS" untuk membina pendapat anda di Deduction Circuit.`;
    }
    if (activeStage === 'circuit') {
      return `Hubungkan bukti di Node A dengan pendapat anda di Node C bagi ${focusedLoc.name}. Gunakan pemula ayat supaya hujah lebih mantap!`;
    }
    if (activeStage === 'scanner') {
      return `Logic Scanner menyemak 3 kriteria: kelengkapan ayat, perkaitan bukti dan kejelasan pendapat. Pastikan ketiga-tiganya lulus!`;
    }
    return canProceed
      ? `Cemerlang, Ejen! Semua keputusan telah disahkan. Tekan "TERUSKAN KE FASA 3" untuk membuktikan teori anda.`
      : `Semak kes terpilih dan tekan "SIMPAN KE KAD KEPUTUSAN EJEN" sebelum melangkah ke Fasa 3.`;
  })();

  const handlePrimaryBottomAction = () => {
    if (selectedIds.length < 2) {
      gameAudio.playError();
      setError('Pilih sekurang-kurangnya 2 bukti lokasi di Secret Evidence Vault untuk meneruskan.');
      setActiveStage('select');
      return;
    }
    if (activeStage === 'vault' || activeStage === 'select') {
      gameAudio.playTransition();
      if (!selectedIds.includes(focusedLocId)) {
        setFocusedLocId(selectedIds[0]);
      }
      setActiveStage('circuit');
      return;
    }
    if (activeStage === 'circuit') {
      handleRunScanner(focusedLocId);
      setActiveStage('scanner');
      return;
    }
    if (activeStage === 'scanner') {
      gameAudio.playClick();
      if (focusedDraft.trim().length >= 10) {
        handleSaveSingleOpinion(focusedLocId);
      }
      setActiveStage('decision');
      return;
    }
    if (!canProceed) {
      handleSaveAll();
      return;
    }
    gameAudio.playSuccess();
    onProceedToPhase3();
  };

  const primaryBottomLabel =
    selectedIds.length < 2
      ? 'PILIH MIN 2 BUKTI'
      : activeStage === 'vault' || activeStage === 'select'
        ? 'TERUSKAN KE ANALISIS'
        : activeStage === 'circuit'
          ? 'UJI KEKUATAN HUJAH'
          : activeStage === 'scanner'
            ? 'SIMPAN KEPUTUSAN'
            : canProceed
              ? 'TERUSKAN KE FASA 3'
              : 'SAHKAN & SIMPAN';

  const statusGaugePercent = Math.round(
    (focusedInv.discoveredClueIds.length / Math.max(1, focusedLoc.clues.length)) * 100
  );

  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-[#06211C] text-[#F5F0E5] overflow-hidden">
      {/* Futuristic Detective Intelligence Laboratory Backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={officeBackdropUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-20 mix-blend-luminosity scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#072621]/90 via-[#092D27]/80 to-[#051B17]/95" />
        <div className="absolute inset-0 matrix-lab-grid" />
        {/* Soft Holographic Floor Bloom */}
        <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 w-[780px] h-[360px] rounded-full bg-[#36D9FF]/12 blur-[90px]" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-5 py-3.5 sm:py-4 space-y-3.5">
        {/* TOP ROW: Back Button + Holographic Title Banner + Selection Pill */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5">
          <div className="w-full lg:w-auto flex items-center justify-between lg:justify-start gap-3">
            <button
              type="button"
              onClick={() => {
                gameAudio.playClick();
                onBackToHq();
              }}
              className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B332C]/90 hover:bg-[#12453B] border border-[#36D9FF]/50 text-xs font-bold text-[#DCE9DF] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#36D9FF]" />
              <span>Kembali ke Pusat Operasi</span>
            </button>

            <span className="lg:hidden font-mono-tabular text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#0B332C] border border-[#FFD45C]/70 text-[#FFD45C]">
              BUKTI DIPILIH: {selectedIds.length}/3
            </span>
          </div>

          {/* Center Holographic Title Plaque */}
          <div className="relative text-center px-6 sm:px-10 py-2 rounded-2xl bg-gradient-to-b from-[#0F3C34]/95 to-[#07231E]/95 border-2 border-[#36D9FF]/75 shadow-[0_0_32px_rgba(54,217,255,0.22)]">
            <div
              aria-hidden="true"
              className="hidden sm:block absolute -left-2 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-l bg-[#FFD45C] shadow-[0_0_12px_rgba(255,212,92,0.65)]"
            />
            <div
              aria-hidden="true"
              className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-r bg-[#FFD45C] shadow-[0_0_12px_rgba(255,212,92,0.65)]"
            />
            <h1 className="font-display text-lg sm:text-2xl font-black tracking-wide text-[#FFD45C] drop-shadow-[0_2px_10px_rgba(255,212,92,0.35)]">
              THE DEDUCTION MATRIX
            </h1>
            <p className="text-[11px] sm:text-xs font-bold tracking-wider text-[#FFFFFF]">
              • Makmal Deduksi Digital •
            </p>
            <p className="mt-0.5 font-mono-tabular text-[10px] font-bold tracking-[0.2em] text-[#36D9FF]">
              TELITI • PILIH • HUBUNGKAN • BUKTIKAN
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B332C]/90 border border-[#FFD45C]/65 shadow-md">
            <Fingerprint className="w-4 h-4 text-[#FFD45C]" />
            <div className="leading-tight">
              <p className="font-mono-tabular text-xs font-extrabold text-[#FFD45C]">
                BUKTI DIPILIH: {selectedIds.length}/3
              </p>
              <p className="text-[10px] text-[#DCE9DF]">Min 2 · Maks 3 kes</p>
            </div>
          </div>
        </div>

        {/* 5-STAGE HOLOGRAPHIC MISSION PROGRESSION PATH */}
        <nav
          aria-label="Laluan Misi Makmal Deduksi Digital"
          className="flex items-center justify-start lg:justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 px-1"
        >
          {MATRIX_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = activeStage === stage.id;
            const isLocked =
              (stage.id === 'circuit' || stage.id === 'scanner' || stage.id === 'decision') &&
              selectedIds.length < 2;
            const isCompleted =
              (stage.id === 'vault' && selectedIds.length >= 1) ||
              (stage.id === 'select' && selectedIds.length >= 2) ||
              (stage.id === 'circuit' && canProceed) ||
              (stage.id === 'scanner' && canProceed) ||
              (stage.id === 'decision' && canProceed);

            return (
              <React.Fragment key={stage.id}>
                <button
                  type="button"
                  onClick={() => handleStageClick(stage.id)}
                  className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-left transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#3D2F10] via-[#17483D] to-[#0E372F] border-[#FFD45C] text-[#FFFFFF] shadow-[0_0_20px_rgba(255,212,92,0.4)]'
                      : isCompleted
                        ? 'bg-[#0E3D34]/95 border-[#00BFA6]/80 text-[#E6FFF9] hover:border-[#36D9FF]'
                        : isLocked
                          ? 'bg-[#082620]/85 border-[#36D9FF]/25 text-[#DCE9DF]/65 hover:border-[#36D9FF]/50'
                          : 'bg-[#0B332C]/90 border-[#36D9FF]/60 text-[#FFFFFF] hover:border-[#FFD45C]'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono-tabular text-[11px] font-extrabold border ${
                      isActive
                        ? 'bg-[#FFD45C] text-[#092D27] border-[#FFFFFF]'
                        : isCompleted
                          ? 'bg-[#00BFA6] text-[#092D27] border-[#FFFFFF]/70'
                          : 'bg-[#123E34] text-[#36D9FF] border-[#36D9FF]/60'
                    }`}
                  >
                    {isActive ? (
                      <Icon className="w-3.5 h-3.5" />
                    ) : isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      stage.num
                    )}
                  </span>
                  <span className="text-xs font-extrabold whitespace-nowrap">{stage.label}</span>
                </button>
                {idx < MATRIX_STAGES.length - 1 && (
                  <ChevronRight
                    aria-hidden="true"
                    className="w-4 h-4 shrink-0 text-[#36D9FF]/70"
                  />
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Inline Error Alert (only when outside Stage 03-05 workspace which displays its own) */}
        {error && (activeStage === 'vault' || activeStage === 'select') && (
          <div
            role="alert"
            className="max-w-3xl mx-auto rounded-xl bg-[#4A1C1C]/95 border border-[#FF8F8F] px-4 py-2 text-xs sm:text-sm font-semibold text-[#FFE5E5] flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#FF9B9B]" />
              {error}
            </span>
            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Tutup amaran"
              className="text-xs font-bold underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* MAIN 3-COLUMN HOLOGRAPHIC LABORATORY */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
          {/* LEFT PANEL: KES PENYIASATAN */}
          <aside
            aria-label="Kes Penyiasatan Terpilih"
            className="xl:col-span-3 rounded-2xl bg-gradient-to-b from-[#0E3931]/95 to-[#07211C]/95 border-2 border-[#D9B45B]/75 shadow-[0_18px_40px_rgba(0,0,0,0.45)] p-3.5 flex flex-col justify-between gap-3"
          >
            <div className="space-y-3">
              {/* Panel Header */}
              <div className="flex items-center justify-between gap-2 border-b border-[#D9B45B]/35 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#123E34] border border-[#FFD45C] text-[#FFD45C] flex items-center justify-center">
                    <FileSearch className="w-4 h-4" />
                  </span>
                  <h2 className="font-display text-sm font-extrabold tracking-wide text-[#FFD45C] uppercase">
                    KES PENYIASATAN
                  </h2>
                </div>
                <span className="font-mono-tabular text-[10px] font-bold text-[#36D9FF]">
                  {focusedMeta.orderCode}/04
                </span>
              </div>

              {/* Location Photo Card */}
              <div className="relative rounded-xl overflow-hidden border-2 border-[#D9B45B]/80 aspect-[16/10] bg-[#061D19]">
                <img
                  src={LOCATION_PHOTO_URLS[focusedLocId]}
                  alt={`Lokasi siasatan ${focusedLoc.name}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#051B17] via-[#051B17]/75 to-transparent px-2.5 py-2 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#FFFFFF]">
                    <MapPin className="w-3.5 h-3.5 text-[#FFD45C]" />
                    {focusedLoc.name}
                  </span>
                  {selectedIds.includes(focusedLocId) && (
                    <span className="px-2 py-0.5 rounded bg-[#00BFA6] text-[#092D27] font-mono-tabular text-[9px] font-extrabold">
                      DIPILIH
                    </span>
                  )}
                </div>
              </div>

              {/* Ringkasan Kes + Original Stimulating Question */}
              <div className="rounded-xl bg-[#07241F] border border-[#36D9FF]/35 p-3 space-y-1.5">
                <p className="font-mono-tabular text-[11px] font-bold text-[#36D9FF] uppercase tracking-wider">
                  Ringkasan Kes
                </p>
                <p className="text-xs text-[#F5F0E5] leading-relaxed font-medium">
                  {focusedMeta.stimulatingQuestion}
                </p>
              </div>

              {/* Lihat Butiran CTA */}
              <button
                type="button"
                onClick={() => {
                  gameAudio.playClick();
                  setInspectingLocId(focusedLocId);
                }}
                className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-b from-[#FFE68A] via-[#D9B45B] to-[#B6842A] hover:brightness-105 text-[#092D27] text-xs font-extrabold border border-[#FFFFFF] shadow-[0_0_16px_rgba(255,212,92,0.3)] transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lihat Butiran</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bottom Status Kes Gauge */}
            <div className="rounded-xl bg-[#06201B] border border-[#36D9FF]/35 p-2.5 flex items-center gap-3">
              <HoloRingGauge
                percent={statusGaugePercent}
                accentColor="#00BFA6"
                size={52}
                strokeWidth={5}
                label={`${focusedInv.discoveredClueIds.length}/${focusedLoc.clues.length}`}
                sublabel="Bukti"
              />
              <div className="min-w-0">
                <p className="font-mono-tabular text-[11px] font-bold text-[#36D9FF] uppercase">
                  Status Kes
                </p>
                <p className="text-xs font-extrabold text-[#FFFFFF]">
                  {focusedInv.discoveredClueIds.length}/{focusedLoc.clues.length} Bukti Dikesan
                </p>
                <p className="text-[11px] text-[#DCE9DF]/85 truncate">
                  {(state.opinions[focusedLocId]?.opinionText || '').trim().length >= 10
                    ? '✓ Pendapat kes telah disimpan'
                    : 'Sedia untuk analisis pendapat'}
                </p>
              </div>
            </div>
          </aside>

          {/* CENTER PANEL: SECRET EVIDENCE VAULT (Stage 01/02) OR DEDUCTION CIRCUIT / SCANNER / DECISION (Stage 03-05) */}
          <section
            aria-label="Kawasan Utama Makmal Deduksi"
            className="xl:col-span-6 flex flex-col justify-between gap-3"
          >
            {activeStage === 'vault' || activeStage === 'select' ? (
              <div className="relative flex-1 rounded-2xl bg-gradient-to-b from-[#0A342D]/80 via-[#072621]/90 to-[#06201B]/95 border border-[#36D9FF]/50 p-3.5 sm:p-5 flex flex-col justify-between overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                {/* Vault Banner */}
                <div className="relative z-10 text-center space-y-1.5">
                  <div className="inline-block px-5 py-1.5 rounded-xl bg-[#07221D]/90 border border-[#36D9FF]/75 shadow-[0_0_24px_rgba(54,217,255,0.22)]">
                    <h2 className="font-display text-sm sm:text-lg font-black tracking-wide text-[#36D9FF] uppercase">
                      THE SECRET EVIDENCE VAULT
                    </h2>
                    <p className="text-[11px] sm:text-xs font-semibold text-[#F5F0E5]">
                      {selectedIds.length < 2
                        ? 'Pilih sekurang-kurangnya 2 bukti daripada 4 kes.'
                        : `${selectedIds.length} bukti dipilih — klik "Terokai" atau "Teruskan ke Analisis".`}
                    </p>
                  </div>
                </div>

                {/* Circular 3D Holographic Platform Energy Rings */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 bottom-2 -translate-x-1/2 w-[540px] h-[220px] flex items-center justify-center opacity-80"
                >
                  <div className="relative w-[460px] h-[460px] [transform:rotateX(72deg)]">
                    <div className="matrix-holo-ring absolute inset-0 rounded-full border-2 border-dashed border-[#36D9FF]/70 shadow-[0_0_32px_rgba(54,217,255,0.4)]" />
                    <div className="matrix-holo-ring-rev absolute inset-7 rounded-full border-2 border-[#FFD45C]/70 shadow-[0_0_24px_rgba(255,212,92,0.35)]" />
                    <div className="absolute inset-16 rounded-full border border-[#00BFA6]/70 bg-radial from-[#36D9FF]/25 via-[#00BFA6]/10 to-transparent" />
                  </div>
                </div>

                {/* 4 Holographic Case Stations */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 my-4 items-end">
                  {LOCATIONS.map((loc, idx) => {
                    const meta = CASE_FILE_META[loc.id];
                    const inv = state.investigations[loc.id];
                    const isSelected = selectedIds.includes(loc.id);
                    const isFocused = focusedLocId === loc.id;
                    const discovered = inv.discoveredClueIds.length;
                    const total = loc.clues.length;
                    const ratioPct = Math.round((discovered / Math.max(1, total)) * 100);
                    const hasSavedOpinion =
                      (state.opinions[loc.id]?.opinionText || '').trim().length >= 10;

                    return (
                      <div
                        key={loc.id}
                        className={`relative pt-4 transition-transform duration-300 ${
                          isFocused || isSelected ? '-translate-y-1.5' : ''
                        }`}
                      >
                        {/* Active Floating Gold Pointer Arrow */}
                        {isFocused && (
                          <div
                            aria-hidden="true"
                            className="matrix-pulse-beacon absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center"
                          >
                            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-[#FFD45C] drop-shadow-[0_0_8px_rgba(255,212,92,0.9)]" />
                          </div>
                        )}

                        <div
                          onClick={() => {
                            gameAudio.playClick();
                            setFocusedLocId(loc.id);
                          }}
                          className={`cursor-pointer rounded-2xl p-2.5 border-2 transition-all flex flex-col justify-between gap-2 ${
                            isSelected || isFocused
                              ? 'bg-gradient-to-b from-[#2A3316]/95 via-[#113930]/95 to-[#08241E]/95 border-[#FFD45C] shadow-[0_0_28px_rgba(255,212,92,0.35)]'
                              : 'bg-gradient-to-b from-[#0E3F37]/92 to-[#07231E]/95 border-[#36D9FF]/80 shadow-[0_0_22px_rgba(54,217,255,0.2)] hover:border-[#FFD45C]'
                          }`}
                        >
                          {/* Top Number Badge */}
                          <div className="flex items-center justify-between -mt-5 mb-0.5 px-1">
                            <span
                              className={`mx-auto px-2.5 py-0.5 rounded-full font-mono-tabular text-[11px] font-black border ${
                                isSelected || isFocused
                                  ? 'bg-[#FFD45C] text-[#092D27] border-[#FFFFFF]'
                                  : 'bg-[#072621] text-[#36D9FF] border-[#36D9FF]'
                              }`}
                            >
                              0{idx + 1}
                            </span>
                          </div>

                          {/* Location Thumbnail */}
                          <div className="relative rounded-xl overflow-hidden aspect-[4/3] border border-[#FFFFFF]/30 bg-[#051B17]">
                            <img
                              src={LOCATION_PHOTO_URLS[loc.id]}
                              alt={loc.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover object-center"
                            />
                            {hasSavedOpinion && (
                              <span
                                title="Pendapat telah disimpan"
                                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#00BFA6] text-[#092D27] flex items-center justify-center shadow"
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>

                          {/* Name & Real Clue Progress */}
                          <div className="text-center space-y-1">
                            <h3 className="font-display text-xs sm:text-sm font-extrabold text-[#FFFFFF] leading-tight">
                              {loc.name}
                            </h3>
                            <p className="font-mono-tabular text-[11px] font-bold text-[#DCE9DF]">
                              {discovered} / {total}
                            </p>
                            <div className="h-1.5 w-full rounded-full bg-[#051B17] overflow-hidden border border-[#36D9FF]/30">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isSelected || isFocused ? 'bg-[#FFD45C]' : 'bg-[#36D9FF]'
                                }`}
                                style={{ width: `${ratioPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Station Actions: Terokai + Pilih */}
                          <div className="space-y-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                gameAudio.playClick();
                                setFocusedLocId(loc.id);
                                setInspectingLocId(loc.id);
                              }}
                              className="w-full min-h-[30px] inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-[#082620] hover:bg-[#12453B] border border-[#36D9FF]/60 text-[11px] font-bold text-[#FFFFFF] transition-colors"
                            >
                              <Search className="w-3 h-3 text-[#36D9FF]" />
                              <span>Terokai</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEvidence(loc.id);
                              }}
                              className={`w-full min-h-[32px] inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold border transition-all ${
                                isSelected
                                  ? 'bg-[#00BFA6] hover:bg-[#18D6BD] text-[#092D27] border-[#FFFFFF]'
                                  : 'bg-gradient-to-b from-[#FFE68A] via-[#D9B45B] to-[#B6842A] hover:brightness-105 text-[#092D27] border-[#FFFFFF]'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Dipilih</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Pilih Kes</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Vault Status Strip */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#06201B]/90 border border-[#36D9FF]/35 px-3.5 py-2 text-xs">
                  <span className="text-[#DCE9DF] font-medium">
                    Klik <strong className="text-[#FFD45C]">Terokai</strong> untuk teliti bukti Fasa 1, atau klik{' '}
                    <strong className="text-[#00BFA6]">Pilih Kes</strong> untuk masukkan ke Rak Bukti Utama.
                  </span>
                  {selectedIds.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => handleStageClick('circuit')}
                      className="inline-flex items-center gap-1 font-extrabold text-[#FFD45C] hover:underline"
                    >
                      <span>Buka Deduction Circuit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <DeductionCircuitWorkspace
                state={state}
                activeStage={activeStage}
                selectedIds={selectedIds}
                focusedLocId={focusedLocId}
                draftOpinions={draftOpinions}
                textareaRefs={textareaRefs}
                scanningLoc={scanningLoc}
                canProceed={canProceed}
                error={error}
                savedNotice={savedNotice}
                onSelectFocusedLoc={(id) => {
                  gameAudio.playClick();
                  setFocusedLocId(id);
                }}
                onDraftChange={(locId, value) => {
                  setDraftOpinions((prev) => ({ ...prev, [locId]: value }));
                  setSavedNotice(null);
                  if (error) setError('');
                }}
                onInsertText={insertText}
                onClearOpinion={handleClearOpinion}
                onSaveSingleOpinion={handleSaveSingleOpinion}
                onSaveAll={handleSaveAll}
                onRunScanner={handleRunScanner}
                onSwitchStage={handleStageClick}
                onProceedToPhase3={onProceedToPhase3}
              />
            )}
          </section>

          {/* RIGHT PANEL: PROFESOR NURIN & PETUNJUK STRATEGIK */}
          <aside
            aria-label="Profesor Nurin dan Petunjuk Strategik"
            className="xl:col-span-3 rounded-2xl bg-gradient-to-b from-[#0E3931]/95 to-[#07211C]/95 border-2 border-[#36D9FF]/50 shadow-[0_18px_40px_rgba(0,0,0,0.45)] p-3.5 flex flex-col justify-between gap-3"
          >
            {/* Profesor Nurin Nameplate & Speech Bubble */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 border-b border-[#36D9FF]/30 pb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#FFD45C] uppercase tracking-wider">
                  <MessageCircle className="w-4 h-4 text-[#FFD45C]" />
                  Profesor Nurin
                </span>
                <span className="px-2 py-0.5 rounded bg-[#123E34] border border-[#36D9FF]/45 font-mono-tabular text-[10px] font-bold text-[#36D9FF]">
                  MENTOR AI-LAB
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden border-2 border-[#FFD45C]/80 bg-[#051B17] shrink-0 shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
                  <img
                    src={professorNurinStandingUrl}
                    alt="Profesor Nurin"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Contextual Dialogue Bubble */}
                <div className="relative flex-1 rounded-xl bg-[#F5F0E5] text-[#092D27] border-2 border-[#D9B45B] p-2.5 shadow-md">
                  <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
                    “{profesorDialogue}”
                  </p>
                </div>
              </div>
            </div>

            {/* Petunjuk Strategik Card */}
            <div className="rounded-xl bg-[#07231E] border-2 border-[#D9B45B]/75 p-3 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#FFD45C]">
                  <Lightbulb className="w-4 h-4 text-[#FFD45C]" />
                  <span>Petunjuk Strategik</span>
                </span>
                <span className="font-mono-tabular text-[10px] font-bold text-[#36D9FF]">
                  Tahap {currentHintStep}/3
                </span>
              </div>

              <p className="text-xs text-[#F5F0E5] leading-relaxed min-h-[48px]">
                {strategicHints[currentHintStep]}
              </p>

              <button
                type="button"
                onClick={handleCycleHint}
                className="w-full min-h-[36px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-b from-[#FFE68A] via-[#D9B45B] to-[#B6842A] hover:brightness-105 text-[#092D27] text-xs font-extrabold border border-[#FFFFFF] transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dapatkan Hint</span>
              </button>
            </div>
          </aside>
        </div>

        {/* BOTTOM HOLOGRAPHIC DOCK (RAK BUKTI UTAMA + CATATAN + LOGIC SCANNER + CTA) */}
        <section
          aria-label="Dok Kawalan Bukti, Catatan dan Pengimbas Logik"
          className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch"
        >
          {/* 1. RAK BUKTI UTAMA (Backpack + 3 Slots) */}
          <div className="lg:col-span-4 rounded-2xl bg-gradient-to-b from-[#0E3931]/95 to-[#07211C]/95 border-2 border-[#36D9FF]/55 p-3 flex items-center gap-3 shadow-lg">
            <div className="flex flex-col items-center shrink-0">
              <DetectiveBackpackSvg />
              <span className="font-mono-tabular text-[10px] font-extrabold text-[#FFD45C] mt-0.5">
                {selectedIds.length}/3 DIPILIH
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-xs sm:text-sm font-extrabold text-[#FFD45C] uppercase tracking-wide">
                  RAK BUKTI UTAMA
                </h3>
                <span className="text-[10px] font-bold text-[#36D9FF]">Min 2 · Maks 3</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((slotIdx) => {
                  const slotLocId = selectedIds[slotIdx];
                  const slotLoc = slotLocId ? LOCATION_MAP[slotLocId] : null;
                  const slotPlaceholder =
                    slotIdx === 0
                      ? 'Bukti Utama 1'
                      : slotIdx === 1
                        ? 'Bukti Utama 2'
                        : 'Bukti Tambahan';

                  if (!slotLoc || !slotLocId) {
                    return (
                      <button
                        key={slotIdx}
                        type="button"
                        onClick={() => setActiveStage('select')}
                        className="rounded-xl border border-dashed border-[#36D9FF]/45 bg-[#051B17]/80 p-2 flex flex-col items-center justify-center text-center min-h-[76px] hover:border-[#FFD45C] transition-colors"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#123E34] text-[#36D9FF] font-mono-tabular text-[10px] font-extrabold flex items-center justify-center mb-1">
                          {slotIdx + 1}
                        </span>
                        <span className="text-[10px] font-semibold text-[#DCE9DF]/75 leading-tight">
                          {slotPlaceholder}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <div
                      key={slotLocId}
                      onClick={() => setFocusedLocId(slotLocId)}
                      className={`relative cursor-pointer rounded-xl border p-1.5 flex flex-col justify-between min-h-[76px] transition-all ${
                        focusedLocId === slotLocId
                          ? 'bg-[#17483D] border-[#FFD45C] shadow-[0_0_12px_rgba(255,212,92,0.3)]'
                          : 'bg-[#0C352E] border-[#00BFA6]/70 hover:border-[#FFD45C]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEvidence(slotLocId);
                        }}
                        aria-label={`Keluarkan ${slotLoc.name} dari Rak Bukti`}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#092D27] hover:bg-[#4A1C1C] border border-[#FFD45C] text-[#FFFFFF] flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      <img
                        src={LOCATION_PHOTO_URLS[slotLocId]}
                        alt={slotLoc.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-9 rounded-lg object-cover border border-[#FFFFFF]/25"
                      />
                      <p className="text-[10px] font-extrabold text-[#FFFFFF] text-center truncate mt-1">
                        {slotLoc.shortName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. CATATAN PENYIASATAN (Digital Spiral Notebook synced with focused draft) */}
          <div className="lg:col-span-3 rounded-2xl bg-gradient-to-b from-[#0E3931]/95 to-[#07211C]/95 border-2 border-[#D9B45B]/75 p-3 pl-4 relative flex flex-col justify-between gap-2 shadow-lg">
            {/* Spiral Notebook Coils */}
            <div
              aria-hidden="true"
              className="absolute left-1.5 top-3 bottom-3 flex flex-col justify-between"
            >
              {[0, 1, 2, 3, 4].map((dot) => (
                <span
                  key={dot}
                  className="w-2 h-2 rounded-full bg-[#D9B45B] border border-[#092D27]"
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-[#FFD45C]" />
                <h3 className="font-display text-xs font-extrabold text-[#FFD45C] uppercase tracking-wide">
                  CATATAN PENYIASATAN
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#123E34] border border-[#36D9FF]/45 font-mono-tabular text-[10px] font-bold text-[#36D9FF]">
                {focusedLoc.shortName}
              </span>
            </div>

            <textarea
              value={focusedDraft}
              onChange={(e) => {
                setDraftOpinions((prev) => ({ ...prev, [focusedLocId]: e.target.value }));
                setSavedNotice(null);
                if (error) setError('');
              }}
              rows={2}
              maxLength={500}
              placeholder={`Tulis catatan pendapat anda untuk ${focusedLoc.name} di sini...`}
              aria-label={`Catatan pendapat untuk ${focusedLoc.name}`}
              className="w-full rounded-xl bg-[#051B17]/90 border border-[#36D9FF]/35 focus:border-[#FFD45C] focus:outline-none px-2.5 py-2 text-xs text-[#FFFFFF] placeholder-[#DCE9DF]/55 leading-snug resize-none"
            />

            <div className="flex items-center justify-between gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => insertText(focusedLocId, 'Pada pendapat saya, ')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#123E34] hover:bg-[#195346] border border-[#36D9FF]/45 font-bold text-[#36D9FF]"
              >
                <Link2 className="w-3 h-3" />
                <span>+ Pemula Ayat</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="font-mono-tabular text-[10px] text-[#DCE9DF]">
                  {focusedDraft.length} / 500
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveSingleOpinion(focusedLocId)}
                  aria-label="Simpan catatan pendapat"
                  title="Simpan pendapat kes ini"
                  className="w-7 h-7 rounded-lg bg-[#FFD45C] hover:bg-[#FFE38D] text-[#092D27] flex items-center justify-center shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. LOGIC SCANNER — UJIAN KEKUATAN HUJAH */}
          <button
            type="button"
            onClick={() => {
              if (selectedIds.length >= 2) {
                handleRunScanner(focusedLocId);
                setActiveStage('scanner');
              } else {
                setError('Pilih sekurang-kurangnya 2 bukti dahulu untuk membuka Logic Scanner.');
              }
            }}
            className="lg:col-span-3 text-left rounded-2xl bg-gradient-to-b from-[#0E3931]/95 to-[#07211C]/95 border-2 border-[#36D9FF]/60 hover:border-[#FFD45C] p-3 flex flex-col justify-between gap-2 shadow-lg transition-colors"
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#36D9FF]" />
                <h3 className="font-display text-xs font-extrabold text-[#FFFFFF] uppercase tracking-wide">
                  LOGIC SCANNER
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#36D9FF]">Ujian Kekuatan Hujah</span>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full text-center">
              <div className="flex flex-col items-center gap-1">
                <HoloRingGauge
                  percent={completenessPct}
                  accentColor="#00BFA6"
                  size={48}
                  strokeWidth={4}
                  label={`${completenessPct}%`}
                />
                <span className="text-[10px] font-bold text-[#DCE9DF] leading-tight">
                  Kelengkapan Ayat
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <HoloRingGauge
                  percent={evidencePct}
                  accentColor="#36D9FF"
                  size={48}
                  strokeWidth={4}
                  label={`${evidencePct}%`}
                />
                <span className="text-[10px] font-bold text-[#DCE9DF] leading-tight">
                  Perkaitan Bukti
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <HoloRingGauge
                  percent={clarityPct}
                  accentColor="#FFD45C"
                  size={48}
                  strokeWidth={4}
                  label={`${clarityPct}%`}
                />
                <span className="text-[10px] font-bold text-[#DCE9DF] leading-tight">
                  Kejelasan Pendapat
                </span>
              </div>
            </div>
          </button>

          {/* 4. PRIMARY ACTION GOLD PEDESTAL CTA */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-[#0E3931]/90 to-[#07211C]/95 border border-[#FFD45C]/50 p-3 relative overflow-hidden shadow-lg">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 w-36 h-10 rounded-full bg-[#FFD45C]/25 blur-md"
            />
            <button
              type="button"
              onClick={handlePrimaryBottomAction}
              className="relative z-10 w-full min-h-[58px] px-3.5 py-2.5 rounded-2xl bg-gradient-to-b from-[#FFE891] via-[#E5BA4E] to-[#B78223] hover:brightness-105 active:scale-[0.98] text-[#092D27] border-2 border-[#FFFFFF] shadow-[0_0_26px_rgba(255,212,92,0.45)] flex items-center justify-center gap-1.5 font-display text-xs sm:text-sm font-black tracking-wide text-center transition-all"
            >
              <span>{primaryBottomLabel}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
            <p className="relative z-10 mt-1.5 text-[10px] font-bold text-[#DCE9DF] text-center">
              {canProceed
                ? 'Fasa 3 sedia dibuka!'
                : selectedIds.length >= 2
                  ? 'Lengkapkan pendapat & simpan'
                  : 'Pilih min 2 bukti kes'}
            </p>
          </div>
        </section>
      </div>

      {/* CASE DETAIL INSPECTION MODAL (Lihat Butiran / Terokai) */}
      {inspectingLocId && (
        <CaseDetailInspectionModal
          state={state}
          locationId={inspectingLocId}
          isSelected={selectedIds.includes(inspectingLocId)}
          selectedCount={selectedIds.length}
          onToggleSelect={toggleEvidence}
          onProceedToDeduction={(locId) => {
            setInspectingLocId(null);
            setFocusedLocId(locId);
            if (selectedIds.length >= 2 || (selectedIds.length === 1 && !selectedIds.includes(locId))) {
              setActiveStage('circuit');
            } else {
              setActiveStage('select');
            }
          }}
          onClose={() => setInspectingLocId(null)}
        />
      )}
    </div>
  );
}
