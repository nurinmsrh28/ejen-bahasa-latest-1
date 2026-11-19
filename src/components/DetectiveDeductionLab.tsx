import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  BookOpenCheck,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Fingerprint,
  GraduationCap,
  HelpCircle,
  Library,
  Lightbulb,
  Lock,
  Pencil,
  Play,
  PlusCircle,
  RotateCcw,
  Save,
  Scale,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trees,
  Utensils,
} from 'lucide-react';
import officeBackdropUrl from '../assets/images/detective_office_backdrop_1794998231603.jpg';
import kantinPhotoUrl from '../assets/images/kantin_ceria_realistik_1794831646132.jpg';
import kelasPhotoUrl from '../assets/images/kelas_harmoni_realistik_1794831926269.jpg';
import perpustakaanPhotoUrl from '../assets/images/perpustakaan_ilmu_realistik_1794832156528.jpg';
import professorNurinStandingUrl from '../assets/images/professor_nurin_standing_1794998233968.jpg';
import tamanPhotoUrl from '../assets/images/taman_rekreasi_realistik_1794832375203.jpg';
import { gameAudio } from '../game/audio';
import { LOCATIONS, LOCATION_MAP } from '../game/data';
import {
  countWords,
  getAgentRank,
  getEarnedBadgeIds,
  validateEvidenceSelection,
} from '../game/rules';
import type { GameState, LocationId } from '../game/types';
import { ProfesorCitraPortrait } from './DetectiveArt';

export const CASE_FILE_META: Record<
  LocationId,
  {
    orderCode: string;
    caseNumber: string;
    shortCaseNum: string;
    icon: React.ComponentType<{ className?: string }>;
    photoUrl: string;
    stimulatingQuestion: string;
    briefGuide: string;
    domainKeywords: string[];
  }
> = {
  kantin: {
    orderCode: '01',
    caseNumber: 'FAIL KES #01',
    shortCaseNum: 'KES #001',
    icon: Utensils,
    photoUrl: kantinPhotoUrl,
    stimulatingQuestion:
      'Apakah isu paling ketara daripada bukti di Kantin Ceria, dan bagaimanakah keadaan ini dapat diperbaiki demi keselesaan murid?',
    briefGuide:
      'Fikirkan perkara yang anda perhatikan dalam catatan siasatan anda, kemudian nyatakan satu pendapat anda sendiri tentang tindakan yang wajar diambil.',
    domainKeywords: ['kantin', 'makan', 'sampah', 'meja', 'lantai', 'tong', 'sisa', 'bersih', 'bungkusan'],
  },
  kelas: {
    orderCode: '02',
    caseNumber: 'FAIL KES #02',
    shortCaseNum: 'KES #002',
    icon: BookOpenCheck,
    photoUrl: kelasPhotoUrl,
    stimulatingQuestion:
      'Mengapakah situasi yang anda kesan di Kelas Harmoni perlu diberi perhatian, dan apakah perubahan yang dapat membantu pembelajaran murid?',
    briefGuide:
      'Hubungkan pemerhatian anda tentang ruang kelas dengan satu cadangan pendapat yang lahir daripada pemikiran anda sendiri.',
    domainKeywords: ['kelas', 'meja', 'kerusi', 'sudut', 'bahan', 'buku', 'belajar', 'susun', 'kemas', 'laluan'],
  },
  perpustakaan: {
    orderCode: '03',
    caseNumber: 'FAIL KES #03',
    shortCaseNum: 'KES #003',
    icon: Library,
    photoUrl: perpustakaanPhotoUrl,
    stimulatingQuestion:
      'Apakah halangan yang menjejaskan keselesaan murid di Perpustakaan Ilmu, dan apakah pendapat anda untuk menggalakkan budaya membaca?',
    briefGuide:
      'Renungkan bukti yang telah anda temui di perpustakaan dan bina satu ayat pendapat yang jelas menggunakan kata-kata anda sendiri.',
    domainKeywords: ['perpustakaan', 'buku', 'baca', 'rak', 'kerusi', 'meja', 'sudut', 'selesa', 'kategori'],
  },
  taman: {
    orderCode: '04',
    caseNumber: 'FAIL KES #04',
    shortCaseNum: 'KES #004',
    icon: Trees,
    photoUrl: tamanPhotoUrl,
    stimulatingQuestion:
      'Apakah kekurangan yang anda temui di Taman Rekreasi, dan bagaimanakah kawasan ini boleh dimanfaatkan oleh warga sekolah?',
    briefGuide:
      'Gunakan catatan pemerhatian anda sebagai asas untuk menyatakan pendapat anda tentang penjagaan dan kemudahan di taman sekolah.',
    domainKeywords: ['taman', 'pokok', 'bunga', 'tumbuhan', 'bangku', 'duduk', 'laman', 'hijau', 'rehat'],
  },
};

export const INTERACTIVE_STARTERS: { label: string; insertText: string }[] = [
  {
    label: 'Pada pendapat saya...',
    insertText: 'Pada pendapat saya, ',
  },
  {
    label: 'Saya berpendapat bahawa...',
    insertText: 'Saya berpendapat bahawa ',
  },
  {
    label: 'Bagi mengatasi masalah ini...',
    insertText: 'Bagi mengatasi masalah ini, ',
  },
];

const OPINION_MARKERS = [
  'pendapat',
  'berpendapat',
  'mengatasi',
  'perlu',
  'wajar',
  'patut',
  'sepatutnya',
  'harus',
  'supaya',
  'agar',
  'kerana',
  'bagi',
  'untuk',
  'cadang',
];

export interface GeneralFeedbackResult {
  completeness: { met: boolean; message: string };
  evidenceLink: { met: boolean; message: string };
  clarity: { met: boolean; message: string };
}

export function evaluateOpinionFeedback(
  text: string,
  locId: LocationId,
  studentNotes: string,
  studentProposal: string
): GeneralFeedbackResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const words = countWords(trimmed);
  const endsWithPunctuation = /[.!?]$/.test(trimmed);

  const completenessMet = words >= 7 && endsWithPunctuation;
  const completenessMsg = completenessMet
    ? `Ayat anda lengkap (${words} perkataan) dan diakhiri dengan tanda baca yang betul.`
    : words < 7
      ? `Ayat masih agak ringkas (${words} perkataan). Cuba kembangkan lagi supaya idea anda lebih lengkap.`
      : 'Struktur ayat sudah baik, tetapi pastikan ayat diakhiri dengan tanda noktah (.) supaya lebih lengkap.';

  const meta = CASE_FILE_META[locId];
  const noteTokens = `${studentNotes} ${studentProposal}`
    .toLowerCase()
    .split(/[^a-z0-9\u00C0-\u024F]+/)
    .filter((w) => w.length >= 4);
  const combinedKeywords = Array.from(new Set([...meta.domainKeywords, ...noteTokens]));
  const hasEvidenceConnection = combinedKeywords.some((kw) => lower.includes(kw));

  const evidenceMsg = hasEvidenceConnection
    ? 'Pendapat anda menunjukkan perkaitan yang baik dengan lokasi dan bukti siasatan yang dipilih.'
    : 'Perkaitan dengan bukti masih umum. Cuba kaitkan terus ayat anda dengan perkara yang dicatatkan dalam fail kes ini.';

  const hasOpinionCue = OPINION_MARKERS.some((m) => lower.includes(m));
  const clarityMet = words >= 8 && hasOpinionCue;
  const clarityMsg = clarityMet
    ? 'Pendirian dan pendapat anda dinyatakan dengan jelas dan mudah difahami.'
    : 'Pendapat boleh diperjelaskan lagi dengan menyatakan pendirian serta tujuan atau kesan cadangan anda.';

  return {
    completeness: { met: completenessMet, message: completenessMsg },
    evidenceLink: { met: hasEvidenceConnection, message: evidenceMsg },
    clarity: { met: clarityMet, message: clarityMsg },
  };
}

type DeductionStageId = 'observation' | 'evidence' | 'opinion' | 'justification';

const DEDUCTION_STAGES: {
  id: DeductionStageId;
  stepNum: string;
  code: string;
  title: string;
  shortDesc: string;
  explanation: string;
  writingHint: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'observation',
    stepNum: '1',
    code: '01',
    title: 'Pemerhatian',
    shortDesc: 'Perhatikan lokasi dengan teliti.',
    explanation:
      'Setiap kes bermula dengan apa yang anda lihat dan rekodkan sendiri di lapangan semasa Fasa 1.',
    writingHint:
      'Rujuk catatan pemerhatian anda untuk mengenal pasti masalah utama di lokasi ini.',
    icon: Eye,
  },
  {
    id: 'evidence',
    stepNum: '2',
    code: '02',
    title: 'Bukti',
    shortDesc: 'Cari bukti yang berkaitan.',
    explanation:
      'Petunjuk fizikal yang ditemui mengesahkan masalah sebenar dan menjadi asas kepada pendirian anda.',
    writingHint:
      'Sebutkan unsur bukti nyata (contohnya keadaan meja, buku, sampah atau bangku) dalam ayat anda.',
    icon: Fingerprint,
  },
  {
    id: 'opinion',
    stepNum: '3',
    code: '03',
    title: 'Pendapat',
    shortDesc: 'Buat kesimpulan anda.',
    explanation:
      'Daripada pemerhatian dan bukti, anda membina satu ayat pendapat yang menyatakan tindakan wajar diambil.',
    writingHint:
      'Gunakan frasa permulaan seperti "Pada pendapat saya..." diikuti cadangan yang jelas dan tanda noktah (.).',
    icon: Brain,
  },
  {
    id: 'justification',
    stepNum: '4',
    code: '04',
    title: 'Justifikasi',
    shortDesc: 'Sokong jawapan anda dengan alasan.',
    explanation:
      'Pendapat yang kukuh di sini akan diteruskan ke Fasa 3 untuk disokong dengan hujah sebab dan akibat.',
    writingHint:
      'Sertakan tujuan atau kesan baik (contohnya "supaya murid lebih selesa") untuk menguatkan pendapat anda.',
    icon: Scale,
  },
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlightedOpinion(
  text: string,
  locId: LocationId,
  studentNotes: string,
  studentProposal: string
): React.ReactNode {
  const meta = CASE_FILE_META[locId];
  const noteTokens = `${studentNotes} ${studentProposal}`
    .toLowerCase()
    .split(/[^a-z0-9\u00C0-\u024F]+/)
    .filter((w) => w.length >= 4);
  const tokens = Array.from(
    new Set([...meta.domainKeywords, ...noteTokens, ...OPINION_MARKERS])
  )
    .filter((t) => t.length >= 3)
    .sort((a, b) => b.length - a.length);

  if (tokens.length === 0 || !text) {
    return text;
  }

  const pattern = new RegExp(`(${tokens.map(escapeRegex).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    const lower = part.toLowerCase();
    const isMarker = OPINION_MARKERS.includes(lower);
    const isEvidence =
      meta.domainKeywords.includes(lower) || noteTokens.includes(lower);

    if (isEvidence) {
      return (
        <mark
          key={`${idx}-${part}`}
          className="bg-[#D9B45B]/35 text-[#0D3025] font-semibold px-1 rounded border-b border-[#A98135]"
          title="Kata kunci bukti siasatan"
        >
          {part}
        </mark>
      );
    }
    if (isMarker) {
      return (
        <mark
          key={`${idx}-${part}`}
          className="bg-[#B8CCB3]/55 text-[#0D3025] font-semibold px-1 rounded border-b border-[#173D2E]/50"
          title="Penanda pendapat"
        >
          {part}
        </mark>
      );
    }
    return <React.Fragment key={`${idx}-${part}`}>{part}</React.Fragment>;
  });
}

function LeatherJournalBookArt() {
  return (
    <svg
      viewBox="0 0 88 78"
      className="w-16 h-14 sm:w-20 sm:h-16 shrink-0 drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]"
      fill="none"
      aria-hidden="true"
    >
      {/* Pages bottom edge */}
      <path d="M16 58L58 68L78 52L36 42L16 58Z" fill="#EAD9B9" stroke="#7A5635" strokeWidth="1.6" />
      <path d="M18 53L58 63L77 48" stroke="#C7B28E" strokeWidth="1.3" />
      {/* Leather Hardcover */}
      <path
        d="M12 24L35 10L78 21L56 54L12 43V24Z"
        fill="#5C3A21"
        stroke="#D9B45B"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Spine */}
      <path d="M12 24L12 56L56 67V54L12 43" fill="#49301F" stroke="#A98135" strokeWidth="1.6" />
      {/* Gold Corner Brackets */}
      <path d="M32 13L39 11L36 18" stroke="#D9B45B" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M71 21L77 22L73 28" stroke="#D9B45B" strokeWidth="2.2" strokeLinecap="round" />
      {/* Gold Embossed Title */}
      <text
        x="45"
        y="34"
        transform="rotate(14 45 34)"
        textAnchor="middle"
        fill="#D9B45B"
        fontSize="8.5"
        fontWeight="800"
        fontFamily="serif"
        letterSpacing="0.8"
      >
        JURNAL
      </text>
      <line x1="31" y1="37" x2="57" y2="43" stroke="#D9B45B" strokeOpacity="0.65" strokeWidth="1.2" />
    </svg>
  );
}

interface DetectiveDeductionLabProps {
  state: GameState;
  selectedIds: LocationId[];
  draftOpinions: Record<LocationId, string>;
  editingLocs: Record<LocationId, boolean>;
  openHints: Record<LocationId, boolean>;
  textareaRefs: React.MutableRefObject<Partial<Record<LocationId, HTMLTextAreaElement | null>>>;
  error: string;
  savedNotice: string | null;
  canProceed: boolean;
  onToggleEvidence: (locId: LocationId) => void;
  onDraftChange: (locId: LocationId, value: string) => void;
  onSetEditingLoc: (locId: LocationId, editing: boolean) => void;
  onToggleHint: (locId: LocationId) => void;
  onInsertStarter: (locId: LocationId, insertText: string) => void;
  onClearOpinion: (locId: LocationId) => void;
  onClearAllOpinions: () => void;
  onSaveSingleOpinion: (locId: LocationId) => boolean;
  onSaveAll: (e: React.FormEvent) => void;
  onProceedToPhase3: () => void;
}

export function DetectiveDeductionLab({
  state,
  selectedIds,
  draftOpinions,
  editingLocs,
  openHints,
  textareaRefs,
  error,
  savedNotice,
  canProceed,
  onToggleEvidence,
  onDraftChange,
  onSetEditingLoc,
  onToggleHint,
  onInsertStarter,
  onClearOpinion,
  onClearAllOpinions,
  onSaveSingleOpinion,
  onSaveAll,
  onProceedToPhase3,
}: DetectiveDeductionLabProps) {
  const [focusedLocId, setFocusedLocId] = useState<LocationId>(
    selectedIds[0] ?? 'kantin'
  );
  const [activeStageByLoc, setActiveStageByLoc] = useState<
    Record<LocationId, DeductionStageId>
  >({
    kantin: 'evidence',
    kelas: 'evidence',
    perpustakaan: 'evidence',
    taman: 'evidence',
  });
  const [hintStepByLoc, setHintStepByLoc] = useState<Record<LocationId, number>>({
    kantin: 1,
    kelas: 1,
    perpustakaan: 1,
    taman: 1,
  });
  const [journalExpanded, setJournalExpanded] = useState<boolean>(true);
  const [scanningLoc, setScanningLoc] = useState<LocationId | null>(null);
  const [scanStageText, setScanStageText] = useState('SEDANG MENGANALISIS HUJAH ANDA...');
  const [successBannerLoc, setSuccessBannerLoc] = useState<LocationId | null>(null);
  const [imageErrorByLoc, setImageErrorByLoc] = useState<Partial<Record<LocationId, boolean>>>({});
  const [nurinImgError, setNurinImgError] = useState(false);

  const scanTimerRef = useRef<number | null>(null);
  const scanMidTimerRef = useRef<number | null>(null);
  const bannerTimerRef = useRef<number | null>(null);
  const journalSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current !== null) window.clearTimeout(scanTimerRef.current);
      if (scanMidTimerRef.current !== null) window.clearTimeout(scanMidTimerRef.current);
      if (bannerTimerRef.current !== null) window.clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const earnedBadges = getEarnedBadgeIds(state);
  const agentRank = getAgentRank(state.xp, state.finalReportSaved);
  const selectedCount = selectedIds.length;
  const completedSelectedCount = selectedIds.filter(
    (id) => (state.opinions[id]?.opinionText || '').trim().length >= 10
  ).length;
  const totalCluesFound = LOCATIONS.reduce(
    (sum, item) => sum + state.investigations[item.id].discoveredClueIds.length,
    0
  );
  const totalCluesCount = LOCATIONS.reduce((sum, item) => sum + item.clues.length, 0);

  // Active mission data
  const loc = LOCATION_MAP[focusedLocId];
  const inv = state.investigations[focusedLocId];
  const meta = CASE_FILE_META[focusedLocId];
  const LocIcon = meta.icon;
  const isSelectedForAnalysis = selectedIds.includes(focusedLocId);
  const currentText = draftOpinions[focusedLocId] || '';
  const wordCount = countWords(currentText);
  const isEditing = editingLocs[focusedLocId] ?? true;
  const isSavedTextValid =
    (state.opinions[focusedLocId]?.opinionText || '').trim().length >= 10;
  const hintVisible = openHints[focusedLocId];
  const revealedHintStep = hintStepByLoc[focusedLocId] ?? 1;
  const activeStageId = activeStageByLoc[focusedLocId] ?? 'evidence';
  const activeStageDef =
    DEDUCTION_STAGES.find((s) => s.id === activeStageId) ?? DEDUCTION_STAGES[1];
  const isScanning = scanningLoc === focusedLocId;
  const showDeductionSuccess = successBannerLoc === focusedLocId;

  const savedOrDraft = state.opinions[focusedLocId]?.opinionText || currentText;
  const feedback =
    isSelectedForAnalysis && !isEditing && isSavedTextValid
      ? evaluateOpinionFeedback(
          savedOrDraft,
          focusedLocId,
          inv.notes,
          inv.initialProposal
        )
      : null;

  const criteriaMetCount = feedback
    ? [
        feedback.completeness.met,
        feedback.evidenceLink.met,
        feedback.clarity.met,
      ].filter(Boolean).length
    : 0;

  const hasPeriod = /[.!?]$/.test(currentText.trim());
  const wordProgressPct = Math.min(100, Math.round((wordCount / 10) * 100));

  // Professor Nurin's contextual dialogue
  const mentorDialogue = (() => {
    if (!isSelectedForAnalysis) {
      return `Bagus, Ejen! Perhatikan setiap butiran di ${loc.name}. Klik "Pilih Kes Ini" untuk memulakan hujah anda.`;
    }
    if (isScanning) {
      return 'Bertenang, Ejen. Pengimbas HQ sedang meneliti kelengkapan dan perkaitan bukti hujah anda...';
    }
    if (feedback) {
      if (criteriaMetCount === 3) {
        return `Syabas, Ejen! Ketiga-tiga kriteria bagi ${loc.name} telah dipenuhi. Anda bersedia ke kes seterusnya atau Fasa 3.`;
      }
      return `Hujah anda bagi ${loc.name} telah direkodkan. Semak maklum balas di bawah atau klik "Edit Jawapan" untuk memperhalusinya.`;
    }
    if (wordCount === 0) {
      return `Perhatikan setiap butiran di ${loc.name}. Kadang-kadang, petunjuk tersembunyi pada perkara yang kecil.`;
    }
    if (!hasPeriod) {
      return `Bagus, anda sudah menulis ${wordCount} perkataan. Jangan lupa akhiri ayat pendapat anda dengan tanda noktah (.).`;
    }
    return `Jurnal anda kelihatan kemas (${wordCount} perkataan). Tekan "SEMAK DEDUKSI" untuk menjalankan imbasan HQ!`;
  })();

  // Progressive investigation checklist items for Professor Nurin's panel
  const progressiveHintsList = [
    {
      id: 1,
      text: `Perhatikan persekitaran sekitar ${loc.name}.`,
    },
    {
      id: 2,
      text: meta.briefGuide,
    },
    {
      id: 3,
      text: 'Gunakan frasa seperti "Pada pendapat saya..." dan kaitkan bukti nyata sebelum menutup ayat dengan noktah (.).',
    },
  ];

  const handleSelectMission = (locId: LocationId) => {
    if (state.soundEnabled) gameAudio.playClick();
    setFocusedLocId(locId);
  };

  const handleRevealNextHint = () => {
    if (state.soundEnabled) gameAudio.playHint();
    const curStep = hintStepByLoc[focusedLocId] ?? 1;
    if (!hintVisible) {
      onToggleHint(focusedLocId);
    }
    setHintStepByLoc((prev) => ({
      ...prev,
      [focusedLocId]: curStep < 3 ? curStep + 1 : 3,
    }));
  };

  const handleOpenJournalCase = () => {
    if (state.soundEnabled) gameAudio.playClick();
    if (!isSelectedForAnalysis) {
      onToggleEvidence(focusedLocId);
    }
    setJournalExpanded(true);
    setActiveStageByLoc((prev) => ({ ...prev, [focusedLocId]: 'opinion' }));
    window.requestAnimationFrame(() => {
      journalSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      textareaRefs.current[focusedLocId]?.focus();
    });
  };

  const handleRunDeductionScanner = (locId: LocationId) => {
    const selCheck = validateEvidenceSelection(selectedIds);
    const text = (draftOpinions[locId] || '').trim();
    if (!selCheck.valid || text.length < 10) {
      if (state.soundEnabled) gameAudio.playError();
      onSaveSingleOpinion(locId);
      return;
    }

    if (scanTimerRef.current !== null) window.clearTimeout(scanTimerRef.current);
    if (scanMidTimerRef.current !== null) window.clearTimeout(scanMidTimerRef.current);
    if (bannerTimerRef.current !== null) window.clearTimeout(bannerTimerRef.current);

    if (state.soundEnabled) gameAudio.playClick();
    setScanStageText('SEDANG MENGANALISIS HUJAH ANDA...');
    setScanningLoc(locId);

    scanMidTimerRef.current = window.setTimeout(() => {
      setScanStageText('MENYEMAK PERKAITAN BUKTI & KEJELASAN PENDAPAT...');
    }, 520);

    scanTimerRef.current = window.setTimeout(() => {
      const ok = onSaveSingleOpinion(locId);
      setScanningLoc(null);
      if (ok) {
        const currentInv = state.investigations[locId];
        const result = evaluateOpinionFeedback(
          text,
          locId,
          currentInv.notes,
          currentInv.initialProposal
        );
        const allMet =
          result.completeness.met && result.evidenceLink.met && result.clarity.met;

        if (state.soundEnabled) {
          if (allMet) gameAudio.playSuccess();
          else gameAudio.playClueFound();
        }
        setActiveStageByLoc((prev) => ({
          ...prev,
          [locId]: result.clarity.met ? 'justification' : 'opinion',
        }));
        setSuccessBannerLoc(locId);
        bannerTimerRef.current = window.setTimeout(() => {
          setSuccessBannerLoc((curr) => (curr === locId ? null : curr));
        }, 4200);
      }
    }, 1050);
  };

  return (
    <form
      onSubmit={onSaveAll}
      aria-label="Bilik Siasatan Rahsia — Makmal Deduksi Detektif"
      className="relative overflow-hidden rounded-2xl border-2 border-[#D9B45B] shadow-[0_24px_56px_rgba(13,48,37,0.38)] bg-[#0D3025] text-[#FFFDF7]"
    >
      {/* Warm Detective Office Room & Wooden Desk Atmosphere Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-28"
        style={{ backgroundImage: `url(${officeBackdropUrl})` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0D3025]/92 via-[#173D2E]/88 to-[#2B1B10]/94"
      />
      {/* Warm Desk Lamp Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 right-12 w-72 h-72 rounded-full bg-[#D9B45B]/15 blur-3xl"
      />

      {/* Brass Corner Accents */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#FFFDF7] via-[#D9B45B] to-[#A98135] z-10"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#FFFDF7] via-[#D9B45B] to-[#A98135] z-10"
      />

      {/* MAIN CONTAINER CONTENT */}
      <div className="relative z-10 p-3.5 sm:p-5 lg:p-6 space-y-4">
        {/* TOP CASE ROOM TITLE RIBBON */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#0D3025]/95 border border-[#D9B45B]/75 px-4 py-2.5 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-[#D9B45B] text-[#0D3025] flex items-center justify-center shrink-0 shadow">
              <Search className="w-4 h-4 stroke-[2.5]" />
            </span>
            <div className="min-w-0">
              <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9B45B]">
                BILIK SIASATAN RAHSIA · DETECTIVE CASE ROOM
              </p>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#FFFDF7] truncate">
                Analisis Fail Kes &amp; Pembinaan Pendapat Ejen
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular">
            <span className="px-2.5 py-1 rounded-lg bg-[#173D2E] border border-[#D9B45B]/60 text-[#F5F0E5] font-bold">
              Fokus: {meta.shortCaseNum} · {loc.shortName}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#D9B45B] text-[#0D3025] font-extrabold">
              {selectedCount}/3 Bukti Dipilih
            </span>
          </div>
        </div>

        {/* DEDUCTION SUCCESS TOAST */}
        {showDeductionSuccess && (
          <div
            role="status"
            className="rounded-xl hq-brass-plaque p-3.5 text-[#26382F] flex flex-wrap items-center justify-between gap-3 shadow-lg p1-toast-enter"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#173D2E] text-[#D9B45B] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="font-mono-tabular text-[11px] font-extrabold tracking-widest uppercase">
                  DEDUCTION SUCCESSFUL!
                </p>
                <p className="text-xs sm:text-sm font-bold">
                  Hujah bagi {loc.name} telah diimbas dan direkodkan ke Kad Keputusan Ejen.
                </p>
              </div>
            </div>
            <span className="font-mono-tabular text-xs font-bold px-3 py-1 rounded bg-[#FFFDF7]/85 border border-[#173D2E]/30 text-[#173D2E]">
              {criteriaMetCount}/3 Kriteria Dipenuhi
            </span>
          </div>
        )}

        {/* =================================================================
            MAIN 3-COLUMN CASE ROOM GRID:
            LEFT: FAIL MISI (3 cols) | CENTRE: CASE FILE + DEDUCTION BOARD (6 cols) | RIGHT: PROFESOR NURIN (3 cols)
           ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* ---------------------------------------------------------------
              LEFT COLUMN — SECRET MISSION FILES (★ FAIL MISI ★)
             --------------------------------------------------------------- */}
          <aside
            aria-label="Fail Misi Penyiasatan"
            className="lg:col-span-3 flex flex-col justify-between rounded-xl bg-gradient-to-b from-[#173D2E] via-[#123326] to-[#0D3025] border-2 border-[#D9B45B] p-3.5 shadow-xl space-y-3"
          >
            <div className="space-y-3">
              {/* Header Plaque */}
              <div className="rounded-lg bg-[#0D3025] border border-[#D9B45B]/80 py-2 px-3 text-center shadow-inner">
                <p className="font-display text-sm font-extrabold tracking-widest uppercase text-[#D9B45B]">
                  ★ FAIL MISI ★
                </p>
              </div>

              {/* 4 Confidential Case Folders */}
              <nav aria-label="Senarai Fail Misi 01 hingga 04" className="space-y-2.5">
                {LOCATIONS.map((item) => {
                  const itemMeta = CASE_FILE_META[item.id];
                  const itemInv = state.investigations[item.id];
                  const isFocused = focusedLocId === item.id;
                  const isSelected = selectedIds.includes(item.id);
                  const isVerified =
                    isSelected &&
                    !(editingLocs[item.id] ?? true) &&
                    (state.opinions[item.id]?.opinionText || '').trim().length >= 10;

                  // Real mission completion % based on clues + notes + selection + verified opinion
                  const clueRatio =
                    item.clues.length > 0
                      ? itemInv.discoveredClueIds.length / item.clues.length
                      : 0;
                  const realProgressPct = isVerified
                    ? 100
                    : isSelected
                      ? Math.min(90, Math.round(50 + clueRatio * 25 + (draftOpinions[item.id]?.trim().length >= 10 ? 15 : 0)))
                      : itemInv.completed
                        ? 50
                        : Math.round(clueRatio * 35);

                  const folderStateLabel = isVerified
                    ? 'Selesai'
                    : isFocused
                      ? 'Aktif'
                      : isSelected
                        ? 'Dipilih'
                        : 'Kunci';

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectMission(item.id)}
                      aria-current={isFocused ? 'true' : undefined}
                      className={`group relative w-full rounded-xl p-2 border-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B45B] ${
                        isFocused
                          ? 'bg-gradient-to-r from-[#21523E] to-[#173D2E] border-[#D9B45B] shadow-[0_0_20px_rgba(217,180,91,0.45)] scale-[1.015]'
                          : isVerified || isSelected
                            ? 'bg-[#133829] border-[#A98135]/75 hover:border-[#D9B45B]'
                            : 'bg-[#0C291F]/90 border-[#345C4B] hover:border-[#A98135] opacity-90 hover:opacity-100'
                      }`}
                    >
                      {/* Top-Right Status Badge */}
                      <span
                        className={`absolute -top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-mono-tabular font-extrabold uppercase tracking-wider border shadow-sm ${
                          isVerified
                            ? 'bg-[#22C55E] text-[#0D3025] border-[#FFFDF7]'
                            : isFocused
                              ? 'bg-[#2E8B57] text-[#FFFDF7] border-[#D9B45B]'
                              : isSelected
                                ? 'bg-[#D9B45B] text-[#0D3025] border-[#FFFDF7]'
                                : 'bg-[#1D3E31] text-[#B8CCB3] border-[#4A7562]'
                        }`}
                      >
                        {folderStateLabel}
                      </span>

                      <div className="flex items-center gap-2.5">
                        {/* Location Photo Thumbnail */}
                        <div
                          className={`relative rounded-lg overflow-hidden border shrink-0 bg-[#173D2E] ${
                            isFocused
                              ? 'w-16 h-12 border-[#D9B45B] shadow'
                              : 'w-14 h-11 border-[#A98135]/60'
                          }`}
                        >
                          <img
                            src={itemMeta.photoUrl}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full object-cover ${
                              !isFocused && !isSelected && !isVerified ? 'brightness-75' : ''
                            }`}
                          />
                        </div>

                        {/* Folder Details + Real Progress Bar */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono-tabular text-[11px] font-extrabold text-[#D9B45B]">
                              {itemMeta.orderCode}
                            </span>
                            {isFocused ? (
                              <Search className="w-3.5 h-3.5 text-[#D9B45B] shrink-0" />
                            ) : isVerified ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                            ) : !isSelected ? (
                              <Lock className="w-3.5 h-3.5 text-[#B8CCB3]/70 shrink-0" />
                            ) : null}
                          </div>

                          <p className="font-display text-xs sm:text-sm font-bold text-[#FFFDF7] truncate leading-tight">
                            {item.name}
                          </p>

                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-[#091F17] border border-[#D9B45B]/35 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#A98135] to-[#D9B45B] transition-all duration-300"
                                style={{ width: `${realProgressPct}%` }}
                              />
                            </div>
                            <span className="font-mono-tabular text-[10px] font-bold text-[#EAD9B9]">
                              {realProgressPct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Decorative Parchment Strip + Clear All Utility */}
            <div className="space-y-2 pt-2">
              <div className="rounded-lg bg-[#EAD9B9] border border-[#A98135] px-3 py-2 text-[#26382F] shadow-inner flex items-center gap-2">
                <Star className="w-4 h-4 fill-[#D9B45B] text-[#A98135] shrink-0" />
                <p className="text-[11px] font-bold leading-snug">
                  Selesaikan semua misi untuk membuka kes seterusnya!
                </p>
              </div>

              {selectedIds.some((id) => (draftOpinions[id] || '').trim().length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    if (state.soundEnabled) gameAudio.playClick();
                    onClearAllOpinions();
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#2B1D14] hover:bg-[#49301F] text-[#F5F0E5] border border-[#A98135]/60 text-[11px] font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#D9B45B]" />
                  <span>Kosongkan Semua Jawapan</span>
                </button>
              )}
            </div>
          </aside>

          {/* ---------------------------------------------------------------
              CENTRE COLUMN — CONFIDENTIAL CASE FILE + DEDUCTION BOARD
             --------------------------------------------------------------- */}
          <section
            key={focusedLocId}
            aria-label={`Fail Kes Sulit ${loc.name}`}
            className="lg:col-span-6 flex flex-col justify-between gap-3.5 lab-report-reveal"
          >
            {/* 5. CENTRAL CONFIDENTIAL CASE FILE (AGED PAPER ON DESK) */}
            <div className="relative aged-dossier-paper rounded-xl border-2 border-[#C7A972] text-[#26382F] shadow-[0_18px_40px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* Caution Hazard Top-Right Corner Accent */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 right-0 w-24 h-3 opacity-85"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(-45deg, #26382F 0px, #26382F 7px, #D9B45B 7px, #D9B45B 14px)',
                }}
              />

              {/* Top Case Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 pt-3.5 pb-2.5 border-b border-[#C7A972]/70">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded bg-[#FFFDF7] border border-[#A98135] font-mono-tabular text-xs font-extrabold text-[#49301F] shadow-xs -rotate-1">
                    {meta.shortCaseNum}
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold text-[#173D2E] tracking-tight">
                    {loc.name}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      isSelectedForAnalysis && !isEditing && isSavedTextValid
                        ? 'bg-[#173D2E] text-[#D9B45B] border-[#D9B45B]'
                        : isSelectedForAnalysis
                          ? 'bg-[#2E6F4E] text-[#FFFDF7] border-[#173D2E]'
                          : 'bg-[#EAD9B9] text-[#49301F] border-[#A98135]'
                    }`}
                  >
                    {isSelectedForAnalysis && !isEditing && isSavedTextValid
                      ? 'Disahkan'
                      : isSelectedForAnalysis
                        ? 'Dalam Siasatan'
                        : 'Arkib Kes'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (state.soundEnabled) gameAudio.playClick();
                    onToggleEvidence(focusedLocId);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
                    isSelectedForAnalysis
                      ? 'bg-[#173D2E] hover:bg-[#0D3025] text-[#FFFDF7] border-[#D9B45B]'
                      : 'hq-brass-plaque hover:brightness-105 text-[#26382F] border-[#A98135]'
                  }`}
                >
                  {isSelectedForAnalysis ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D9B45B]" />
                      <span>Dipilih ({selectedCount}/3)</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Pilih Kes Ini ({selectedCount}/3)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Document Main Body: Photo on Left + Ringkasan Kes & Soalan Utama on Right */}
              <div className="p-4 sm:p-5 space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* 5.1 LOCATION EVIDENCE PHOTOGRAPH (PINNED WITH RED PUSHPIN) */}
                  <div className="md:col-span-5 relative">
                    {/* Red Pushpin */}
                    <span
                      aria-hidden="true"
                      className="absolute -top-2 left-3 z-20 w-5 h-5 rounded-full bg-gradient-to-br from-[#F87171] via-[#DC2626] to-[#7F1D1D] border-2 border-[#FFFDF7] shadow-[0_3px_6px_rgba(0,0,0,0.45)]"
                    />
                    <div className="bg-[#FFFDF7] p-2 rounded-lg border border-[#C7A972] shadow-[0_10px_24px_rgba(38,56,47,0.22)] md:-rotate-[2deg] hover:rotate-0 transition-transform duration-200">
                      <div className="relative aspect-[4/3] rounded overflow-hidden bg-[#DCE9D9]">
                        {!imageErrorByLoc[focusedLocId] ? (
                          <img
                            src={meta.photoUrl}
                            alt={`Foto bukti lokasi ${loc.name}`}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setImageErrorByLoc((prev) => ({ ...prev, [focusedLocId]: true }))
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#173D2E]/50">
                            <LocIcon className="w-14 h-14" />
                          </div>
                        )}
                      </div>
                      <div className="pt-1.5 flex items-center justify-between text-[11px] font-mono-tabular font-bold text-[#49301F]">
                        <span>{loc.shortName.toUpperCase()}</span>
                        <span>
                          {inv.discoveredClueIds.length}/{loc.clues.length} Bukti
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5.2 RINGKASAN KES + 5.3 SOALAN UTAMA */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#173D2E]">
                        <Search className="w-3.5 h-3.5 text-[#173D2E]" />
                        <span>Ringkasan Kes</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#26382F] leading-relaxed font-medium">
                        {loc.briefing}
                      </p>
                    </div>

                    {/* Highlighted Champagne-Gold Question Strip */}
                    <div className="relative rounded-lg bg-[#EAD9B9] border-2 border-[#D9B45B] p-3 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-5 h-5 rounded-full bg-[#D9B45B] text-[#0D3025] flex items-center justify-center shrink-0">
                          <HelpCircle className="w-3.5 h-3.5 stroke-[2.6]" />
                        </span>
                        <span className="font-mono-tabular text-[11px] font-extrabold uppercase tracking-wider text-[#49301F]">
                          Soalan Utama
                        </span>
                      </div>
                      <p className="font-display text-sm sm:text-[15px] font-bold text-[#173D2E] leading-snug">
                        {meta.stimulatingQuestion}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5.4 OBSERVATION NOTES + 5.5 TOP SECRET STAMP */}
                <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  {/* Dark Pinned Observation Notepad with Binder Rings */}
                  <div className="relative flex-1 rounded-lg bg-[#1A2A23] border border-[#A98135]/70 pl-6 pr-3.5 py-2.5 text-[#F5F0E5] shadow-md">
                    {/* Left Binder Rings */}
                    <div
                      aria-hidden="true"
                      className="absolute left-1.5 top-2.5 bottom-2.5 flex flex-col justify-between"
                    >
                      {[0, 1, 2].map((ring) => (
                        <span
                          key={ring}
                          className="w-2.5 h-2 rounded-full bg-gradient-to-r from-[#D9B45B] to-[#6E5322] border border-[#0D3025]"
                        />
                      ))}
                    </div>

                    <p className="font-mono-tabular text-[11px] font-bold text-[#D9B45B] uppercase tracking-wider mb-1">
                      Nota Pemerhatian:
                    </p>
                    <ul className="space-y-0.5 text-xs text-[#FFFDF7]/90 leading-snug">
                      <li>
                        •{' '}
                        {inv.notes.trim()
                          ? inv.notes
                          : `Perhatikan persekitaran ${loc.shortName.toLowerCase()} & catatan lapangan Fasa 1.`}
                      </li>
                      {inv.initialProposal.trim() && (
                        <li>• Cadangan awal: {inv.initialProposal}</li>
                      )}
                      {loc.clues.slice(0, 2).map((clue) => (
                        <li key={clue.id} className="text-[#B8CCB3]">
                          • {clue.label}: {clue.issueSummary}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Decorative TOP SECRET Stamp */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none select-none self-end sm:self-center shrink-0 px-3 py-1 rounded border-2 border-[#B91C1C]/65 text-[#B91C1C]/70 font-mono-tabular text-xs sm:text-sm font-black tracking-[0.18em] uppercase -rotate-12 bg-[#B91C1C]/5"
                  >
                    TOP SECRET
                  </div>
                </div>
              </div>
            </div>

            {/* 6. LOWER CENTRAL SECTION — WOODEN PAPAN DEDUKSI INTERAKTIF */}
            <div className="rounded-xl bg-gradient-to-b from-[#5B3A23] via-[#49301F] to-[#342013] border-2 border-[#D9B45B] p-3.5 sm:p-4 shadow-xl space-y-3">
              {/* Board Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#2A190E] border border-[#D9B45B]/80 shadow-inner">
                  <Sparkles className="w-3.5 h-3.5 text-[#D9B45B]" />
                  <h4 className="font-display text-sm font-bold text-[#FFFDF7] tracking-wide">
                    Papan Deduksi Interaktif
                  </h4>
                </div>
                <span className="text-[11px] font-medium text-[#EAD9B9]">
                  Klik peringkat untuk teliti &amp; buka jurnal hujah
                </span>
              </div>

              {/* 4 Interconnected Stage Cards with Glowing Gold Arrows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 relative">
                {DEDUCTION_STAGES.map((stage, idx) => {
                  const StageIcon = stage.icon;
                  const isStageComplete =
                    stage.id === 'observation'
                      ? inv.notes.trim().length > 0 || inv.discoveredClueIds.length > 0
                      : stage.id === 'evidence'
                        ? isSelectedForAnalysis && inv.discoveredClueIds.length > 0
                        : stage.id === 'opinion'
                          ? !isEditing && isSavedTextValid
                          : isSavedTextValid && Boolean(feedback?.clarity.met);

                  const isStageFocused = activeStageId === stage.id;
                  const isStageLocked =
                    (stage.id === 'opinion' || stage.id === 'justification') &&
                    !isSelectedForAnalysis;

                  return (
                    <div key={stage.id} className="relative flex items-stretch">
                      <button
                        type="button"
                        onClick={() => {
                          if (state.soundEnabled) gameAudio.playClick();
                          setActiveStageByLoc((prev) => ({
                            ...prev,
                            [focusedLocId]: stage.id,
                          }));
                          if (stage.id === 'opinion' || stage.id === 'justification') {
                            if (!isSelectedForAnalysis) {
                              onToggleEvidence(focusedLocId);
                            }
                            setJournalExpanded(true);
                            window.requestAnimationFrame(() => {
                              journalSectionRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'nearest',
                              });
                            });
                          }
                        }}
                        className={`relative w-full rounded-xl p-2.5 pt-3 border-2 flex flex-col items-center justify-between text-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B45B] ${
                          isStageFocused
                            ? 'bg-[#FFFDF7] border-[#D9B45B] text-[#26382F] shadow-[0_0_18px_rgba(217,180,91,0.5)]'
                            : isStageLocked
                              ? 'bg-[#25312C] border-[#4B6357] text-[#B8CCB3]'
                              : 'bg-[#F5F0E5] border-[#A98135]/75 text-[#26382F] hover:border-[#D9B45B]'
                        }`}
                      >
                        {/* Stage Number Circle */}
                        <span
                          className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full font-mono-tabular text-[10px] font-extrabold flex items-center justify-center border ${
                            isStageFocused
                              ? 'bg-[#D9B45B] text-[#0D3025] border-[#49301F]'
                              : isStageComplete
                                ? 'bg-[#173D2E] text-[#D9B45B] border-[#D9B45B]'
                                : 'bg-[#EAD9B9] text-[#49301F] border-[#A98135]'
                          }`}
                        >
                          {stage.stepNum}
                        </span>

                        {/* Distinctive Stage Icon */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center mt-1 border ${
                            isStageFocused
                              ? 'bg-[#EAD9B9] text-[#49301F] border-[#D9B45B]'
                              : isStageLocked
                                ? 'bg-[#17221E] text-[#B8CCB3] border-[#4B6357]'
                                : 'bg-[#FFFDF7] text-[#173D2E] border-[#C7A972]'
                          }`}
                        >
                          <StageIcon className="w-5 h-5" />
                        </div>

                        <div className="space-y-0.5">
                          <p className="font-display text-xs sm:text-sm font-extrabold leading-tight">
                            {stage.title}
                          </p>
                          <p
                            className={`text-[10px] leading-snug ${
                              isStageLocked ? 'text-[#B8CCB3]/80' : 'text-[#49301F]/85'
                            }`}
                          >
                            {stage.shortDesc}
                          </p>
                        </div>

                        {/* Status Pill Strip at Bottom */}
                        <span
                          className={`w-full py-1 px-2 rounded-md font-mono-tabular text-[10px] font-extrabold inline-flex items-center justify-center gap-1 border ${
                            isStageComplete
                              ? 'bg-[#173D2E] text-[#FFFDF7] border-[#4ADE80]/60'
                              : isStageFocused
                                ? 'hq-brass-plaque text-[#0D3025] border-[#A98135]'
                                : isStageLocked
                                  ? 'bg-[#19231F] text-[#B8CCB3] border-[#4B6357]'
                                  : 'bg-[#EAD9B9] text-[#26382F] border-[#A98135]/60'
                          }`}
                        >
                          {isStageComplete ? (
                            <>
                              <Check className="w-3 h-3 text-[#4ADE80] stroke-[3]" />
                              <span>Selesai</span>
                            </>
                          ) : isStageFocused ? (
                            <>
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Dalam Proses</span>
                            </>
                          ) : isStageLocked ? (
                            <>
                              <Lock className="w-2.5 h-2.5" />
                              <span>Kunci</span>
                            </>
                          ) : (
                            <span>Tersedia</span>
                          )}
                        </span>
                      </button>

                      {/* Glowing Connecting Arrow Between Cards on Desktop */}
                      {idx < DEDUCTION_STAGES.length - 1 && (
                        <div
                          aria-hidden="true"
                          className="hidden xl:flex items-center justify-center -mr-2.5 ml-0.5 z-20 pointer-events-none"
                        >
                          <ArrowRight
                            className={`w-4 h-4 drop-shadow-[0_0_6px_rgba(217,180,91,0.8)] ${
                              isStageComplete ? 'text-[#4ADE80]' : 'text-[#D9B45B]'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Active Stage Explanation & Tip Strip */}
              <div className="rounded-lg bg-[#FFFDF7] border border-[#D9B45B] px-3.5 py-2.5 text-xs text-[#26382F] flex flex-wrap items-center justify-between gap-2 shadow-sm">
                <div className="space-y-0.5">
                  <p className="font-bold text-[#173D2E] flex items-center gap-1.5">
                    <activeStageDef.icon className="w-3.5 h-3.5 text-[#A98135]" />
                    <span>
                      Peringkat {activeStageDef.code}: {activeStageDef.title} —{' '}
                      {activeStageDef.explanation}
                    </span>
                  </p>
                  <p className="text-[11px] text-[#49301F]">
                    <strong>Tip:</strong> {activeStageDef.writingHint}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------------------
              RIGHT COLUMN — PROFESOR NURIN & PETUNJUK SIASATAN
             --------------------------------------------------------------- */}
          <aside
            aria-label="Pembantu Detektif Profesor Nurin"
            className="lg:col-span-3 flex flex-col justify-between gap-3 rounded-xl bg-gradient-to-b from-[#173D2E]/95 to-[#0D3025]/98 border-2 border-[#D9B45B] p-3.5 shadow-xl"
          >
            {/* Upper: Nameplate + Speech Bubble + Character Visual */}
            <div className="space-y-2.5">
              {/* Nameplate */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D3025] border border-[#D9B45B] shadow">
                <GraduationCap className="w-4 h-4 text-[#D9B45B]" />
                <span className="font-display text-xs sm:text-sm font-bold text-[#FFFDF7]">
                  Profesor Nurin
                </span>
              </div>

              {/* Character Standing Portrait + Confidential Speech Bubble */}
              <div className="grid grid-cols-12 gap-2.5 items-center">
                <div className="col-span-5 relative">
                  <div
                    className={`relative rounded-xl overflow-hidden border-2 border-[#D9B45B] bg-[#F5E8CF] shadow-lg ${
                      hintVisible || isScanning || Boolean(feedback) ? 'lab-mentor-speak' : ''
                    }`}
                  >
                    {!nurinImgError ? (
                      <img
                        src={professorNurinStandingUrl}
                        alt="Profesor Nurin membimbing siasatan"
                        referrerPolicy="no-referrer"
                        onError={() => setNurinImgError(true)}
                        className="w-full h-36 sm:h-40 object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-36 flex items-center justify-center p-2">
                        <ProfesorCitraPortrait realistic className="w-20 h-20" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Speech Bubble */}
                <div className="col-span-7 relative rounded-xl bg-[#FFFDF7] border-2 border-[#D9B45B] p-3 text-[#26382F] shadow-md">
                  <p className="text-xs leading-relaxed font-medium">“{mentorDialogue}”</p>
                </div>
              </div>
            </div>

            {/* Lower: PETUNJUK SIASATAN + DAPATKAN HINT */}
            <div className="rounded-xl bg-[#092119] border-2 border-[#D9B45B]/85 p-3.5 space-y-3 shadow-inner">
              <div className="flex items-center justify-between gap-2 border-b border-[#D9B45B]/35 pb-2">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-[#D9B45B]" />
                  <h4 className="font-display text-xs sm:text-sm font-bold text-[#D9B45B] tracking-wide">
                    Petunjuk Siasatan
                  </h4>
                </div>
                <span className="font-mono-tabular text-[10px] font-bold text-[#B8CCB3]">
                  {revealedHintStep}/3
                </span>
              </div>

              <ul className="space-y-2 text-xs">
                {progressiveHintsList.slice(0, revealedHintStep).map((hint) => (
                  <li
                    key={hint.id}
                    className="flex items-start gap-2 text-[#FFFDF7] leading-snug lab-report-reveal"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80] shrink-0 mt-0.5" />
                    <span>{hint.text}</span>
                  </li>
                ))}
              </ul>

              {hintVisible && (
                <div className="rounded-lg bg-[#173D2E] border border-[#D9B45B]/45 p-2.5 text-[11px] text-[#EAD9B9] space-y-1 lab-report-reveal">
                  <p className="font-bold text-[#D9B45B]">Senarai Semak Pantas:</p>
                  <p>1. Mulakan ayat dengan pendirian jelas.</p>
                  <p>2. Kaitkan dengan bukti lokasi pilihan anda.</p>
                  <p>3. Akhiri ayat dengan tanda noktah (.).</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleRevealNextHint}
                className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl hq-brass-plaque hover:brightness-105 text-[#0D3025] border border-[#FFFDF7]/60 text-xs sm:text-sm font-extrabold shadow-md transition-all"
              >
                <Lightbulb className="w-4 h-4 text-[#49301F]" />
                <span>
                  {revealedHintStep < 3 ? 'Dapatkan Hint' : 'Lihat Panduan Lengkap'}
                </span>
              </button>
            </div>
          </aside>
        </div>

        {/* =================================================================
            BOTTOM SECTION — JURNAL PERIBADI DETEKTIF (LEFT-CENTER) + XP REWARD HUD (RIGHT)
           ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* BOTTOM-LEFT & CENTER: LEATHER DETECTIVE JOURNAL BAR */}
          <div className="lg:col-span-8 rounded-xl bg-gradient-to-r from-[#173D2E] via-[#133528] to-[#0D3025] border-2 border-[#D9B45B] p-3.5 sm:px-5 sm:py-3.5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
              <LeatherJournalBookArt />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div>
                  <h4 className="font-display text-base sm:text-lg font-bold text-[#D9B45B] leading-tight">
                    Jurnal Peribadi Detektif
                  </h4>
                  <p className="text-xs text-[#F5F0E5]">
                    Catat dapatan dan refleksi anda di sini.
                  </p>
                </div>

                {/* Journal Progress Bar */}
                <div className="flex items-center gap-2.5 max-w-sm">
                  <span className="font-mono-tabular text-[11px] font-bold text-[#EAD9B9] whitespace-nowrap">
                    Kemajuan Jurnal: {completedSelectedCount} / {Math.max(2, selectedCount)}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-[#091F17] border border-[#D9B45B]/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#A98135] to-[#D9B45B] transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((completedSelectedCount / Math.max(2, selectedCount)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (journalExpanded) {
                  if (state.soundEnabled) gameAudio.playClick();
                  setJournalExpanded(false);
                } else {
                  handleOpenJournalCase();
                }
              }}
              aria-expanded={journalExpanded}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl hq-brass-plaque hover:brightness-105 text-[#0D3025] border border-[#FFFDF7]/70 font-extrabold text-xs sm:text-sm shadow-lg transition-all whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-4 h-4 text-[#49301F]" />
              <span>{journalExpanded ? 'Tutup Paparan Jurnal' : 'Buka Jurnal Kes Ini'}</span>
              {journalExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 9. BOTTOM-RIGHT: XP & INVESTIGATION REWARD PANEL */}
          <div className="lg:col-span-4 rounded-xl bg-gradient-to-r from-[#0D3025] to-[#173D2E] border-2 border-[#D9B45B] px-4 py-3 shadow-xl grid grid-cols-3 gap-2 items-center">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-[#092119] border border-[#D9B45B]/60 text-[#D9B45B] flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] text-[#B8CCB3] truncate">Bukti Ditemui</p>
                <p className="font-mono-tabular text-xs sm:text-sm font-extrabold text-[#FFFDF7]">
                  {totalCluesFound} / {totalCluesCount}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0 border-x border-[#D9B45B]/25 px-2">
              <span className="w-8 h-8 rounded-lg bg-[#092119] border border-[#D9B45B]/60 text-[#D9B45B] flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 fill-[#D9B45B]" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] text-[#B8CCB3] truncate">XP Diperoleh</p>
                <p className="font-mono-tabular text-xs sm:text-sm font-extrabold text-[#D9B45B]">
                  {state.xp} XP
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center min-w-0 pl-1">
              <div className="w-8 h-8 rounded-full bg-[#1F513E] border-2 border-[#D9B45B] text-[#D9B45B] flex items-center justify-center shadow">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-[#EAD9B9] truncate max-w-full mt-0.5">
                {agentRank}
              </p>
              <p className="font-mono-tabular text-[9px] text-[#B8CCB3]">
                {earnedBadges.length}/5 Lencana
              </p>
            </div>
          </div>
        </div>

        {/* =================================================================
            EXPANDABLE WRITING WORKSPACE & DEDUCTION SCANNER (PRESERVED LOGIC)
           ================================================================= */}
        {journalExpanded && (
          <div ref={journalSectionRef} className="space-y-4 lab-report-reveal">
            {!isSelectedForAnalysis ? (
              <div className="rounded-xl bg-[#F5F0E5] border-2 border-dashed border-[#A98135] p-5 text-sm text-[#26382F] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-bold text-[#173D2E]">
                    Jurnal Peribadi Detektif Berkunci Untuk {loc.name}
                  </p>
                  <p className="text-xs sm:text-sm text-[#49301F]">
                    Pilih 2 hingga 3 kes untuk dianalisis. Klik &ldquo;Pilih Kes Ini&rdquo; untuk
                    membuka ruang penulisan pendapat bagi {loc.name}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (state.soundEnabled) gameAudio.playClick();
                    onToggleEvidence(focusedLocId);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg hq-brass-plaque text-[#0D3025] font-bold text-xs sm:text-sm whitespace-nowrap shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Pilih &amp; Buka Jurnal {loc.shortName}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-xl lab-journal-paper border-2 border-[#D9B45B] p-4 sm:p-5 text-[#26382F] shadow-lg">
                  {/* Futuristic Scanner Overlay */}
                  {isScanning && (
                    <div
                      aria-live="polite"
                      className="absolute inset-0 z-20 bg-[#0D3025]/95 flex flex-col items-center justify-center p-6 text-center text-[#FFFDF7]"
                    >
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-transparent via-[#D9B45B]/55 to-transparent border-b-2 border-[#D9B45B] lab-scanner-beam pointer-events-none"
                      />
                      <div className="relative z-10 flex flex-col items-center gap-3.5 max-w-sm">
                        <div className="w-14 h-14 rounded-full bg-[#173D2E] border-2 border-[#D9B45B] flex items-center justify-center shadow-[0_0_24px_rgba(217,180,91,0.45)]">
                          <ScanSearch className="w-7 h-7 text-[#D9B45B]" />
                        </div>
                        <p className="font-mono-tabular text-xs sm:text-sm font-bold tracking-widest text-[#D9B45B]">
                          {scanStageText}
                        </p>
                        <div className="w-48 h-1.5 rounded-full bg-[#173D2E] overflow-hidden border border-[#D9B45B]/40">
                          <div className="h-full w-2/3 rounded-full bg-[#D9B45B] animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Journal Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#173D2E]/15 pl-6">
                    <div>
                      <p className="font-mono-tabular text-[11px] font-bold tracking-wider text-[#173D2E]">
                        DETECTIVE&apos;S PRIVATE JOURNAL · {meta.shortCaseNum}
                      </p>
                      <h4 className="font-display text-lg font-bold text-[#26382F]">
                        Jurnal Peribadi Detektif — {loc.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 font-mono-tabular text-xs font-bold text-[#173D2E]">
                      {isEditing && currentText.trim().length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[#8A4526]">
                          <span className="w-2 h-2 rounded-full bg-[#C2593F] lab-cursor-blink" />
                          Menulis
                        </span>
                      )}
                      <span>{wordCount} perkataan</span>
                    </div>
                  </div>

                  {/* Saved Highlighted View vs Active Writing Workspace */}
                  {!isEditing && isSavedTextValid ? (
                    <div className="space-y-4 pl-6 lab-report-reveal">
                      <div className="rounded-xl bg-[#FFFDF7] border-2 border-[#D9B45B] p-4 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular font-bold text-[#173D2E]">
                          <span>AYAT PENDAPAT EJEN (SOROTAN BUKTI &amp; PENANDA)</span>
                          <span className="px-2 py-0.5 rounded bg-[#173D2E] text-[#D9B45B]">
                            DISIMPAN
                          </span>
                        </div>
                        <p className="text-sm sm:text-base leading-relaxed text-[#26382F]">
                          {renderHighlightedOpinion(
                            savedOrDraft,
                            focusedLocId,
                            inv.notes,
                            inv.initialProposal
                          )}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DCE9D9]">
                          <span className="text-xs text-[#4A6358]">
                            Sorotan emas: kata kunci bukti · Sorotan hijau: penanda pendapat
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (state.soundEnabled) gameAudio.playClick();
                              onSetEditingLoc(focusedLocId, true);
                              window.requestAnimationFrame(() => {
                                textareaRefs.current[focusedLocId]?.focus();
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#173D2E] hover:bg-[#0D3025] text-[#FFFDF7] border border-[#D9B45B] font-bold text-xs transition-colors whitespace-nowrap"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[#D9B45B]" />
                            <span>Edit Jawapan</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5 pl-6">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-[#173D2E]">
                          Frasa Permulaan Ayat (klik untuk masukkan ke jurnal):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {INTERACTIVE_STARTERS.map((starter) => (
                            <button
                              key={starter.label}
                              type="button"
                              onClick={() => {
                                if (state.soundEnabled) gameAudio.playClick();
                                onInsertStarter(focusedLocId, starter.insertText);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#FFFDF7] hover:bg-[#173D2E] hover:text-[#FFFDF7] text-[#26382F] border border-[#A98135]/60 hover:border-[#D9B45B] text-xs font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0"
                            >
                              + {starter.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor={`opinion-${focusedLocId}`} className="sr-only">
                          Ruang jawapan ayat pendapat bagi {loc.name}
                        </label>
                        <textarea
                          ref={(el) => {
                            textareaRefs.current[focusedLocId] = el;
                          }}
                          id={`opinion-${focusedLocId}`}
                          rows={4}
                          value={currentText}
                          onChange={(e) => onDraftChange(focusedLocId, e.target.value)}
                          placeholder={`Taip ayat pendapat anda sendiri bagi ${loc.name} di sini...`}
                          className="w-full min-h-[128px] rounded-xl p-3.5 bg-[#FFFDF7] border-2 border-[#B8CCB3] focus:border-[#173D2E] focus:ring-2 focus:ring-[#D9B45B]/60 focus:outline-none text-sm sm:text-base leading-relaxed text-[#26382F] placeholder-[#6B7F77]"
                        />
                      </div>

                      <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#49301F]">
                          <span>
                            {wordCount >= 7
                              ? 'Panjang ayat mencukupi'
                              : `${wordCount}/7+ perkataan disyorkan`}
                            {' · '}
                            {hasPeriod
                              ? 'Tanda baca lengkap'
                              : 'Akhiri ayat dengan noktah (.)'}
                          </span>
                        </div>

                        <div className="h-2 w-full rounded-full bg-[#EAD9B9] overflow-hidden border border-[#A98135]/50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#B8CCB3] via-[#D9B45B] to-[#173D2E] transition-all duration-300"
                            style={{ width: `${wordProgressPct}%` }}
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <span className="text-xs text-[#49301F] font-medium">
                            Tulis menggunakan pemikiran anda sendiri
                          </span>

                          <div className="flex flex-wrap items-center gap-2">
                            {currentText.trim().length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (state.soundEnabled) gameAudio.playClick();
                                  onClearOpinion(focusedLocId);
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EAD9B9] hover:bg-[#DFCA9F] text-[#26382F] border border-[#A98135] font-bold text-xs transition-colors whitespace-nowrap shrink-0"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Kosongkan</span>
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isScanning}
                              onClick={() => handleRunDeductionScanner(focusedLocId)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#173D2E] hover:bg-[#0D3025] disabled:opacity-60 text-[#FFFDF7] border-2 border-[#D9B45B] font-bold text-xs sm:text-sm shadow-md transition-colors whitespace-nowrap shrink-0"
                            >
                              <ScanSearch className="w-4 h-4 text-[#D9B45B]" />
                              <span>SEMAK DEDUKSI</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suitability Evaluation Report */}
                {feedback && (
                  <div className="rounded-xl bg-[#DCE9D9] border-2 border-[#D9B45B] p-4 sm:p-5 text-[#26382F] space-y-3 shadow-md lab-report-reveal">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#A8C5A0] pb-2">
                      <div>
                        <p className="font-mono-tabular text-[11px] font-bold tracking-wider text-[#173D2E]">
                          LAPORAN PENILAIAN KESESUAIAN
                        </p>
                        <h4 className="font-display text-base sm:text-lg font-bold text-[#26382F]">
                          Keputusan Imbasan Deduksi
                        </h4>
                      </div>
                      <span className="font-mono-tabular text-xs font-bold text-[#173D2E] bg-[#FFFDF7] px-2.5 py-1 rounded-md border border-[#A8C5A0]">
                        {criteriaMetCount}/3 Kriteria Terpenuhi
                      </span>
                    </div>

                    <ul className="space-y-2 text-xs sm:text-sm text-[#26382F]">
                      <li className="flex items-start gap-2.5 rounded-lg bg-[#FFFDF7] border border-[#A8C5A0] p-3">
                        {feedback.completeness.met ? (
                          <CheckCircle2 className="w-4 h-4 text-[#173D2E] shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-[#C2593F] shrink-0 mt-0.5" />
                        )}
                        <span>
                          <strong className="text-[#173D2E]">Kelengkapan Ayat:</strong>{' '}
                          {feedback.completeness.message}
                        </span>
                      </li>

                      <li className="flex items-start gap-2.5 rounded-lg bg-[#FFFDF7] border border-[#A8C5A0] p-3">
                        {feedback.evidenceLink.met ? (
                          <CheckCircle2 className="w-4 h-4 text-[#173D2E] shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-[#C2593F] shrink-0 mt-0.5" />
                        )}
                        <span>
                          <strong className="text-[#173D2E]">Perkaitan dengan Bukti:</strong>{' '}
                          {feedback.evidenceLink.message}
                        </span>
                      </li>

                      <li className="flex items-start gap-2.5 rounded-lg bg-[#FFFDF7] border border-[#A8C5A0] p-3">
                        {feedback.clarity.met ? (
                          <CheckCircle2 className="w-4 h-4 text-[#173D2E] shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-[#C2593F] shrink-0 mt-0.5" />
                        )}
                        <span>
                          <strong className="text-[#173D2E]">Kejelasan Pendapat:</strong>{' '}
                          {feedback.clarity.message}
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VALIDATION ERROR & STATUS NOTICES */}
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-[#FBECE8] border-2 border-[#C2593F] text-sm font-semibold text-[#8C331D] flex items-start gap-2.5"
          >
            <AlertCircle className="w-5 h-5 text-[#C2593F] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {savedNotice && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-[#DCE9D9] border-2 border-[#D9B45B] text-sm font-semibold text-[#173D2E] flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-5 h-5 text-[#173D2E] shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* BOTTOM SAVE & PHASE 3 ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#D9B45B]/35">
          <button
            type="submit"
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173D2E] hover:bg-[#0D3025] border-2 border-[#D9B45B] text-[#FFFDF7] font-bold text-xs sm:text-sm shadow-md transition-colors whitespace-nowrap"
          >
            <Save className="w-4 h-4 text-[#D9B45B]" />
            <span>Simpan Semua ke Kad Keputusan Ejen</span>
          </button>

          {canProceed && (
            <button
              type="button"
              onClick={() => {
                if (state.soundEnabled) gameAudio.playSuccess();
                onProceedToPhase3();
              }}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl hq-brass-plaque hover:brightness-105 text-[#0D3025] border border-[#FFFDF7]/70 font-extrabold text-xs sm:text-sm shadow-md transition-all whitespace-nowrap"
            >
              <span>Teruskan ke Fasa 3: Buktikan Teori</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
