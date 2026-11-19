import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Compass,
  FileSearch,
  FolderOpen,
  Lightbulb,
  Lock,
  Pencil,
  Play,
  RotateCw,
  Save,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import detectiveOfficeBackdropUrl from '../assets/images/detective_office_backdrop_1794998231603.jpg';
import professorNurinStandingUrl from '../assets/images/professor_nurin_standing_1794998233968.jpg';
import { LOCATIONS, LOCATION_MAP } from '../game/data';
import { isPhase1Complete } from '../game/rules';
import type { ClueItem, GameState, LocationId } from '../game/types';
import { ProfesorCitraPortrait } from './DetectiveArt';
import { LOCATION_HOTSPOTS, LOCATION_PHOTO_URLS } from './LocationScenes';

interface CsiInvestigationModalProps {
  state: GameState;
  activeLocationId: LocationId;
  activeClueId: string | null;
  notes: string;
  proposal: string;
  error: string;
  savedNotice: boolean;
  dialogueOverride: string | null;
  onSelectLocation: (locId: LocationId) => void;
  onCollectClue: (clueId: string) => void;
  onAdvanceHint: () => void;
  onNotesChange: (value: string) => void;
  onProposalChange: (value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onTeleportZone: (locId: LocationId) => void;
  onProceedToPhase2: () => void;
  onClose: () => void;
}

const MISSION_TITLES: Record<LocationId, string> = {
  kantin: 'Operasi Menyelamatkan Kantin Ceria',
  kelas: 'Operasi Memulihkan Kelas Harmoni',
  perpustakaan: 'Operasi Menyusun Perpustakaan Ilmu',
  taman: 'Operasi Menghijaukan Taman Rekreasi',
};

const MISSION_BRIEFINGS: Record<LocationId, string> = {
  kantin: 'Siasat, kenal pasti masalah dan bantu memulihkan kantin.',
  kelas: 'Teliti susunan bilik darjah dan sudut pembelajaran murid.',
  perpustakaan: 'Periksa kategori buku dan keselesaan ruang membaca.',
  taman: 'Tinjau keadaan tumbuhan, laman dan kemudahan tempat duduk.',
};

const SHORT_INVENTORY_LABELS: Record<string, string> = {
  kantin_sampah: 'Sampah Bertaburan',
  kantin_meja: 'Sisa Makanan',
  kantin_tong: 'Tong Sampah Penuh',
  kelas_meja: 'Meja Berselerak',
  kelas_sudut: 'Sudut Pembelajaran',
  kelas_bahan: 'Bahan Bersepah',
  perpus_buku: 'Buku Bercampur',
  perpus_selesa: 'Ruang Membaca',
  perpus_sudut: 'Sudut Terbiar',
  taman_tumbuhan: 'Tumbuhan Layu',
  taman_kawasan: 'Laman Kosong',
  taman_duduk: 'Tiada Bangku',
};

function DetectiveBackpackSvg({ className = 'w-16 h-20' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 92 108"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="packLeather" x1="16" y1="14" x2="76" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A67442" />
          <stop offset="55%" stopColor="#7C512B" />
          <stop offset="100%" stopColor="#523217" />
        </linearGradient>
        <linearGradient id="packBrass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF2B2" />
          <stop offset="50%" stopColor="#E7C878" />
          <stop offset="100%" stopColor="#B8882C" />
        </linearGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="46" cy="99" rx="31" ry="5.5" fill="#061812" fillOpacity="0.65" />
      {/* Top Handle */}
      <path
        d="M35 20V14C35 10.2 38.5 8 46 8C53.5 8 57 10.2 57 14V20"
        stroke="#5D3A1A"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* Side Pockets */}
      <rect x="11" y="48" width="12" height="34" rx="5" fill="#174C39" stroke="#E7C878" strokeWidth="1.5" />
      <rect x="69" y="48" width="12" height="34" rx="5" fill="#174C39" stroke="#E7C878" strokeWidth="1.5" />
      {/* Main Pack Body */}
      <rect
        x="18"
        y="22"
        width="56"
        height="72"
        rx="14"
        fill="url(#packLeather)"
        stroke="#E7C878"
        strokeWidth="2"
      />
      {/* Academy Teal Accent Panel */}
      <path
        d="M22 44H70V84C70 88.4 66.4 92 62 92H30C25.6 92 22 88.4 22 84V44Z"
        fill="#153B2E"
        stroke="#E7C878"
        strokeOpacity="0.45"
        strokeWidth="1.4"
      />
      {/* Top Flap */}
      <path
        d="M18 32C18 25.4 23.4 20 30 20H62C68.6 20 74 25.4 74 32V49C74 52.3 71.3 55 68 55H24C20.7 55 18 52.3 18 49V32Z"
        fill="url(#packLeather)"
        stroke="#E7C878"
        strokeWidth="1.8"
      />
      {/* Front Pocket */}
      <rect
        x="27"
        y="60"
        width="38"
        height="25"
        rx="5"
        fill="#6A4423"
        stroke="#E7C878"
        strokeWidth="1.5"
      />
      {/* Straps & Brass Buckles */}
      <rect x="29" y="21" width="7" height="38" rx="2.5" fill="#462912" />
      <rect x="56" y="21" width="7" height="38" rx="2.5" fill="#462912" />
      <rect x="27.5" y="47" width="10" height="8" rx="2" fill="url(#packBrass)" stroke="#462912" strokeWidth="1.2" />
      <rect x="54.5" y="47" width="10" height="8" rx="2" fill="url(#packBrass)" stroke="#462912" strokeWidth="1.2" />
      {/* Detective Crest */}
      <circle cx="46" cy="37" r="7.5" fill="#103D30" stroke="#E7C878" strokeWidth="1.6" />
      <circle cx="45" cy="36" r="3.2" stroke="#E7C878" strokeWidth="1.5" />
      <line x1="47.5" y1="38.5" x2="50" y2="41" stroke="#E7C878" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CsiInvestigationModal({
  state,
  activeLocationId,
  activeClueId,
  notes,
  proposal,
  error,
  savedNotice,
  dialogueOverride,
  onSelectLocation,
  onCollectClue,
  onAdvanceHint,
  onNotesChange,
  onProposalChange,
  onSave,
  onTeleportZone,
  onProceedToPhase2,
  onClose,
}: CsiInvestigationModalProps) {
  const loc = LOCATION_MAP[activeLocationId];
  const locIndex = LOCATIONS.findIndex((item) => item.id === activeLocationId);
  const inv = state.investigations[activeLocationId];
  const hotspots = LOCATION_HOTSPOTS[activeLocationId];
  const photoUrl = LOCATION_PHOTO_URLS[activeLocationId];

  const [inspectedClueId, setInspectedClueId] = useState<string | null>(activeClueId);
  const [isScanning, setIsScanning] = useState(false);
  const [justCollectedId, setJustCollectedId] = useState<string | null>(null);
  const [portraitFallback, setPortraitFallback] = useState(false);
  const [backdropFallback, setBackdropFallback] = useState(false);

  const notesInputRef = useRef<HTMLTextAreaElement | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const confirmTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setInspectedClueId(null);
    setIsScanning(false);
    setJustCollectedId(null);
  }, [activeLocationId]);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current);
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const triggerInspectClue = (clueId: string) => {
    if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current);
    setInspectedClueId(clueId);
    setIsScanning(true);
    scanTimerRef.current = window.setTimeout(() => {
      setIsScanning(false);
    }, 520);
  };

  const handleCollectInspected = (clue: ClueItem) => {
    onCollectClue(clue.id);
    if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
    setJustCollectedId(clue.id);
    confirmTimerRef.current = window.setTimeout(() => {
      setJustCollectedId(null);
    }, 900);
  };

  const discoveredCount = inv.discoveredClueIds.length;
  const totalClues = loc.clues.length;
  const allCluesFound = discoveredCount >= totalClues;
  const notesReady = notes.trim().length >= 8;
  const proposalReady = proposal.trim().length >= 8;
  const all4Done = isPhase1Complete(state);

  // Real progress percentage for the current mission
  const clueScore = (discoveredCount / totalClues) * 50;
  const notesScore = notesReady ? 20 : notes.trim().length > 0 ? 10 : 0;
  const proposalScore = proposalReady ? 20 : proposal.trim().length > 0 ? 10 : 0;
  const completedScore = inv.completed ? 10 : 0;
  const missionPct = inv.completed
    ? 100
    : Math.min(95, Math.round(clueScore + notesScore + proposalScore + completedScore));

  // Objective states
  const objectives = [
    {
      num: '01',
      label: `Kumpul ${totalClues} bukti.`,
      done: allCluesFound,
      active: !allCluesFound,
      icon: Search,
    },
    {
      num: '02',
      label: 'Analisis punca masalah.',
      done: notesReady,
      active: allCluesFound && !notesReady,
      icon: FileSearch,
    },
    {
      num: '03',
      label: 'Cadangkan penyelesaian.',
      done: proposalReady,
      active: allCluesFound && notesReady && !proposalReady,
      icon: Lightbulb,
    },
    {
      num: '04',
      label: 'Hasilkan laporan akhir.',
      done: inv.completed,
      active: allCluesFound && notesReady && proposalReady && !inv.completed,
      icon: Award,
    },
  ];

  const inspectedClue = loc.clues.find((c) => c.id === inspectedClueId) || null;
  const inspectedCoord = hotspots.find((h) => h.clueId === inspectedClueId) || null;
  const isInspectedCollected = inspectedClue
    ? inv.discoveredClueIds.includes(inspectedClue.id)
    : false;

  // Next incomplete location helper
  const nextIncompleteLocation = LOCATIONS.find(
    (item) => item.id !== activeLocationId && !state.investigations[item.id].completed
  );

  // Contextual Profesor Nurin speech
  const speechText = (() => {
    if (savedNotice) {
      return `Syabas, Ejen! Laporan ${loc.name} telah direkodkan. Teruskan ke cabaran seterusnya.`;
    }
    if (inspectedClue) {
      if (isInspectedCollected) {
        return inspectedClue.profesorReaction;
      }
      return `Bukti dikesan: "${inspectedClue.label}". Periksa butiran imbasan dan tekan Kumpulkan Bukti!`;
    }
    if (dialogueOverride) {
      return dialogueOverride;
    }
    if (activeLocationId === 'kantin' && discoveredCount === 0) {
      return 'Ejen, perhatikan keadaan kantin ini. Adakah terdapat sebarang masalah?';
    }
    if (allCluesFound && !inv.completed) {
      return 'Bagus! Semua bukti telah dikumpulkan. Lengkapkan catatan pemerhatian dan cadangan penyelesaian di bawah.';
    }
    return `Imbas kawasan mencurigakan di ${loc.name} untuk menemui ${totalClues - discoveredCount} lagi bukti.`;
  })();

  const activeHintText =
    inv.hintLevelUsed > 0
      ? loc.hints[inv.hintLevelUsed - 1]
      : 'Pastikan anda mengenal pasti semua bukti sebelum membuat kesimpulan.';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Jurnal Detektif: Fail Penyiasatan"
      className="absolute inset-0 z-40 bg-[#071F17] text-[#F5E8CF] overflow-hidden"
    >
      {/* Atmospheric Detective Office Backdrop */}
      {!backdropFallback && (
        <img
          src={detectiveOfficeBackdropUrl}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          onError={() => setBackdropFallback(true)}
          className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-20 blur-[2px] scale-105"
        />
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_65%_at_50%_40%,rgba(23,76,57,0.78)_0%,rgba(9,35,26,0.94)_65%,rgba(5,20,15,0.98)_100%)]"
      />

      {/* Main Content Container (div:nth-of-type(1) > div:nth-of-type(1)) */}
      <div className="relative z-10 w-full h-full flex flex-col overflow-y-auto">
        <div className="w-full max-w-[1440px] mx-auto flex-1 flex flex-col justify-between gap-2.5 px-3 sm:px-5 py-2.5">
          {/* =================================================================
              COMPACT MISSION SECTOR SWITCHER + 3D RETURN BAR
             ================================================================= */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-[#E7C878]/25">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-xs sm:text-sm font-extrabold tracking-wide text-[#E7C878] uppercase whitespace-nowrap">
                Detective Eco-Rescue
              </span>
              <span aria-hidden="true" className="text-[#E7C878]/40">
                |
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {LOCATIONS.map((item, idx) => {
                  const itemInv = state.investigations[item.id];
                  const isAct = item.id === activeLocationId;
                  const done = itemInv.completed;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectLocation(item.id)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${
                        isAct
                          ? 'bg-gradient-to-b from-[#F5DE93] to-[#D4A63E] border-[#FFFFFF] text-[#103D30] shadow-md'
                          : done
                            ? 'bg-[#174C39] border-[#4ADE80]/60 text-[#FFFFFF] hover:bg-[#1E5C45]'
                            : 'bg-[#0C2F24]/90 border-[#E7C878]/35 text-[#F5E8CF] hover:border-[#E7C878]'
                      }`}
                    >
                      <span className="font-mono-tabular">0{idx + 1}</span>
                      <span>{item.name}</span>
                      <span className="font-mono-tabular opacity-90">
                        {done ? '✓' : `${itemInv.discoveredClueIds.length}/${item.clues.length}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onTeleportZone(activeLocationId)}
                className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0E3629] hover:bg-[#174C39] border border-[#E7C878]/65 text-[11px] font-bold text-[#FFF4CC] whitespace-nowrap shrink-0 transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-[#E7C878]" />
                <span>Kampus 3D</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup Fail Penyiasatan"
                className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#E7C878] hover:bg-[#F5DE93] text-[#103D30] text-[11px] font-extrabold whitespace-nowrap shrink-0 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Tutup</span>
              </button>
            </div>
          </div>

          {/* =================================================================
              MAIN 3-COLUMN GAME ARENA: MISI SEMASA | CSI SCANNER | PROF. NURIN
             ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch flex-1 min-h-0">
            {/* ---------------------------------------------------------------
                LEFT PANEL: MISI SEMASA (MISSION CONTROL PANEL)
               --------------------------------------------------------------- */}
            <aside className="lg:col-span-3 flex flex-col gap-2.5">
              <div className="relative flex-1 rounded-2xl bg-gradient-to-b from-[#134232] via-[#0E3327] to-[#08221A] border-2 border-[#E7C878] shadow-[0_14px_34px_rgba(0,0,0,0.48)] p-3.5 flex flex-col justify-between gap-3">
                {/* Brass Clipboard Clasp Accent */}
                <div
                  aria-hidden="true"
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-3.5 rounded-t-md bg-gradient-to-b from-[#F5E09B] to-[#B6842A] border border-[#FFF4CC]/60 shadow"
                />

                {/* Heading */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E7C878]/35">
                    <span className="w-7 h-7 rounded-full bg-[#19533F] border border-[#E7C878] text-[#E7C878] flex items-center justify-center shadow-[0_0_12px_rgba(231,200,120,0.35)] shrink-0">
                      <Target className="w-4 h-4" />
                    </span>
                    <h2 className="font-display text-sm sm:text-base font-extrabold tracking-wide text-[#E7C878] uppercase">
                      Misi Semasa
                    </h2>
                  </div>

                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#FFFFFF] leading-snug">
                      {MISSION_TITLES[activeLocationId]}
                    </h3>
                    <p className="text-xs text-[#DCE9D9] mt-1 leading-relaxed">
                      {MISSION_BRIEFINGS[activeLocationId]}
                    </p>
                  </div>

                  {/* Interactive Checklist (01–04) */}
                  <div className="space-y-1.5 pt-1 border-t border-[#E7C878]/25">
                    <p className="text-[11px] font-bold text-[#E7C878] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Objektif:</span>
                    </p>

                    <ul className="space-y-1.5">
                      {objectives.map((obj) => {
                        const IconComp = obj.icon;
                        return (
                          <li
                            key={obj.num}
                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border text-xs transition-all duration-200 ${
                              obj.done
                                ? 'bg-[#174E3B] border-[#4ADE80]/65 text-[#FFFFFF]'
                                : obj.active
                                  ? 'bg-[#154534] border-[#E7C878] text-[#FFF4CC] shadow-[0_0_12px_rgba(231,200,120,0.18)]'
                                  : 'bg-[#09241B]/75 border-[#E7C878]/20 text-[#A8C5A0]/80'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                                  obj.done
                                    ? 'bg-[#22C55E] border-[#FFFFFF] text-[#FFFFFF]'
                                    : obj.active
                                      ? 'bg-[#E7C878] border-[#FFF4CC] text-[#103D30]'
                                      : 'bg-[#0E3125] border-[#E7C878]/35 text-[#A8C5A0]'
                                }`}
                              >
                                {obj.done ? (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                ) : (
                                  <IconComp className="w-3 h-3" />
                                )}
                              </span>
                              <span className="font-medium truncate">
                                <span className="font-mono-tabular font-bold mr-1">{obj.num}</span>
                                — {obj.label}
                              </span>
                            </div>

                            <span className="shrink-0">
                              {obj.done ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                              ) : obj.active ? (
                                <span className="text-[10px] font-mono-tabular font-bold text-[#E7C878]">
                                  Aktif
                                </span>
                              ) : (
                                <Lock className="w-3 h-3 text-[#A8C5A0]/60" />
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Mission Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-[#E7C878]/25">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#FFF4CC]">Kemajuan Misi</span>
                    <span className="font-mono-tabular text-[#E7C878]">{missionPct}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={missionPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Kemajuan misi lokasi"
                    className="h-3 w-full rounded-full bg-[#061B14] border border-[#E7C878]/70 overflow-hidden p-0.5"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#C8962E] via-[#E7C878] to-[#FFF2B2] transition-all duration-300"
                      style={{ width: `${Math.max(8, missionPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* GANJARAN XP CARD */}
              <div className="rounded-2xl bg-gradient-to-r from-[#134232] via-[#174C39] to-[#10382B] border-2 border-[#E7C878] shadow-[0_10px_24px_rgba(0,0,0,0.45)] px-3.5 py-2.5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FFF2B2] via-[#E7C878] to-[#B6842A] border border-[#FFFFFF]/70 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(231,200,120,0.45)]">
                  <Award className="w-6 h-6 text-[#103D30]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono-tabular font-bold uppercase tracking-widest text-[#E7C878]">
                    Ganjaran
                  </p>
                  <p className="font-display text-lg font-extrabold text-[#FFFFFF] leading-tight font-mono-tabular">
                    +80 XP
                  </p>
                  <p className="text-[10px] text-[#DCE9D9]">+20 XP setiap bukti ditemui</p>
                </div>
              </div>
            </aside>

            {/* ---------------------------------------------------------------
                CENTRE PANEL: MAIN 3D INVESTIGATION ENVIRONMENT (DOMINANT)
               --------------------------------------------------------------- */}
            <section
              aria-label={`Persekitaran Siasatan ${loc.name}`}
              className="lg:col-span-6 flex flex-col gap-2.5 min-h-0"
            >
              {/* Header Banner + Bukti Ditemui Counter */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex-1 min-w-[240px] rounded-xl bg-gradient-to-r from-[#113D2E] via-[#174C39] to-[#0E3327] border-2 border-[#E7C878] px-3.5 py-2 shadow-lg flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFF2B2] to-[#C8962E] text-[#103D30] flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(231,200,120,0.45)]">
                    <Search className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="font-display text-sm sm:text-base font-extrabold text-[#E7C878] tracking-wide uppercase truncate">
                      Cabaran {locIndex + 1} : CSI Scanner
                    </h1>
                    <p className="text-[11px] sm:text-xs text-[#F5E8CF] truncate">
                      Klik pada kawasan yang mencurigakan untuk mengumpul bukti.
                    </p>
                  </div>
                </div>

                {/* BUKTI DITEMUI COUNTER */}
                <div
                  className={`rounded-xl bg-gradient-to-b from-[#174C39] to-[#0E3327] border-2 border-[#E7C878] px-3.5 py-2 shadow-lg flex items-center gap-2.5 shrink-0 transition-transform duration-200 ${
                    justCollectedId ? 'scale-105' : ''
                  }`}
                >
                  <span className="w-8 h-8 rounded-lg bg-[#E7C878]/20 border border-[#E7C878]/65 text-[#E7C878] flex items-center justify-center shrink-0">
                    <FolderOpen className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold text-[#DCE9D9] uppercase tracking-wider leading-none">
                      Bukti Ditemui:
                    </p>
                    <p className="font-mono-tabular text-base sm:text-lg font-extrabold text-[#FFFFFF] leading-tight mt-0.5">
                      {discoveredCount} / {totalClues}
                    </p>
                  </div>
                </div>
              </div>

              {/* MAIN CAFETERIA / LOCATION PHOTOGRAPH + GLOWING MARKERS */}
              <div className="relative flex-1 min-h-[290px] sm:min-h-[360px] rounded-2xl border-[3px] border-[#E7C878] bg-[#08221A] shadow-[0_18px_45px_rgba(0,0,0,0.6)] overflow-hidden select-none">
                <img
                  src={photoUrl}
                  alt={`Gambar sebenar ${loc.name} untuk imbasan bukti detektif`}
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="w-full h-full object-cover object-center block"
                />

                {/* Subtle cinematic vignette around frame edges */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 shadow-[inset_0_0_48px_rgba(6,24,18,0.45)]"
                />

                {/* 3 Glowing Magnifying-Glass Markers at Exact Hotspot Coordinates */}
                {hotspots.map((coord, idx) => {
                  const clue = loc.clues.find((c) => c.id === coord.clueId);
                  if (!clue) return null;
                  const discovered = inv.discoveredClueIds.includes(clue.id);
                  const isSelected = inspectedClueId === clue.id;
                  const showSpotlight = inv.hintLevelUsed >= 3 && !discovered;
                  const isCelebrating = justCollectedId === clue.id;

                  return (
                    <button
                      key={clue.id}
                      type="button"
                      onClick={() => triggerInspectClue(clue.id)}
                      aria-label={`Imbas bukti ${idx + 1}: ${clue.label}`}
                      style={{
                        left: `${coord.xPercent}%`,
                        top: `${coord.yPercent}%`,
                        width: `${coord.zoneWidthPercent ?? 20}%`,
                        height: `${coord.zoneHeightPercent ?? 20}%`,
                      }}
                      className={`group absolute -translate-x-1/2 -translate-y-1/2 min-w-[48px] min-h-[48px] rounded-2xl flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E7C878] ${
                        isSelected
                          ? 'border-2 border-[#FFF2B2] bg-[#E7C878]/20 shadow-[0_0_24px_rgba(231,200,120,0.55)]'
                          : showSpotlight
                            ? 'border-2 border-dashed border-[#FACC15] bg-[#DC2626]/20'
                            : 'border border-transparent hover:border-2 hover:border-dashed hover:border-[#E7C878]/85 hover:bg-[#E7C878]/10'
                      }`}
                    >
                      {/* Soft gold emission halo under marker */}
                      {!discovered && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute w-20 h-20 rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.42)_0%,rgba(231,200,120,0.16)_45%,transparent_72%)]"
                        />
                      )}

                      {/* Celebration burst ring on collection */}
                      {isCelebrating && (
                        <span
                          aria-hidden="true"
                          className="csi-gold-burst pointer-events-none absolute w-20 h-20 rounded-full border-4 border-[#FFF2B2]"
                        />
                      )}

                      {/* Outer pulsing ring */}
                      {!discovered && (
                        <span
                          aria-hidden="true"
                          className={`clue-beacon-ring pointer-events-none absolute w-14 h-14 rounded-full ${
                            showSpotlight
                              ? 'border-[3px] border-[#F97316]'
                              : 'border-2 border-[#FFF2B2]/85'
                          }`}
                        />
                      )}

                      {/* Center Marker Disc */}
                      <span
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-150 ${
                          discovered
                            ? 'bg-gradient-to-br from-[#22C55E] to-[#15803D] text-[#FFFFFF] border-[2.5px] border-[#E7C878] shadow-[0_0_20px_rgba(34,197,94,0.65)] group-hover:scale-105'
                            : isSelected
                              ? 'bg-gradient-to-br from-[#FFF4B8] via-[#FACC15] to-[#D97706] text-[#103D30] border-[2.5px] border-[#FFFFFF] scale-110 shadow-[0_0_26px_rgba(250,204,21,0.9)]'
                              : 'bg-gradient-to-br from-[#FFF2B2] via-[#E7C878] to-[#C8962E] text-[#103D30] border-2 border-[#FFFFFF] shadow-[0_0_22px_rgba(250,204,21,0.8)] group-hover:scale-110'
                        }`}
                      >
                        {discovered ? (
                          <Check className="w-6 h-6 stroke-[3]" />
                        ) : (
                          <Search className="w-6 h-6 stroke-[2.6]" />
                        )}
                      </span>
                    </button>
                  );
                })}

                {/* =============================================================
                    INTERACTIVE EVIDENCE SCANNER OVERLAY CARD (BUKTI DIKESAN!)
                   ============================================================= */}
                {inspectedClue && inspectedCoord && (
                  <div
                    role="region"
                    aria-label={`Pengimbas Bukti: ${inspectedClue.label}`}
                    className="p1-toast-enter absolute inset-x-3 bottom-3 sm:left-3 sm:right-auto sm:w-[415px] max-w-[calc(100%-1.5rem)] rounded-2xl bg-[#0B2A20]/95 backdrop-blur-md border-2 border-[#E7C878] shadow-[0_20px_48px_rgba(0,0,0,0.75)] p-3.5 text-[#F5E8CF]"
                  >
                    <div className="flex items-start gap-3">
                      {/* Circular Magnification Lens Preview of Real Photo Hotspot */}
                      <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full border-[3px] border-[#E7C878] bg-[#061A13] overflow-hidden shrink-0 shadow-[0_0_20px_rgba(231,200,120,0.4)]">
                        <div
                          className="w-full h-full transition-transform duration-300"
                          style={{
                            backgroundImage: `url(${photoUrl})`,
                            backgroundPosition: `${inspectedCoord.xPercent}% ${inspectedCoord.yPercent}%`,
                            backgroundSize: '310%',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                        {/* Crosshair reticle */}
                        <div
                          aria-hidden="true"
                          className="csi-reticle-spin pointer-events-none absolute inset-1 rounded-full border border-dashed border-[#4ADE80]/80"
                        />
                        {isScanning && (
                          <div
                            aria-hidden="true"
                            className="scanner-cyan-beam pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-transparent via-[#34D399] to-transparent"
                          />
                        )}
                      </div>

                      {/* Identification Label + Description + Action */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-mono-tabular font-extrabold uppercase tracking-widest text-[#4ADE80] flex items-center gap-1">
                              {isScanning ? (
                                <>
                                  <RotateCw className="w-3 h-3 animate-spin" />
                                  <span>MENGIMBAS OBJEK...</span>
                                </>
                              ) : isInspectedCollected ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-[#4ADE80]" />
                                  <span>BUKTI DIKUMPULKAN</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 text-[#E7C878]" />
                                  <span className="text-[#E7C878]">BUKTI DIKESAN!</span>
                                </>
                              )}
                            </p>
                            <h3 className="font-display text-sm sm:text-base font-bold text-[#FFFFFF] leading-tight mt-0.5">
                              {inspectedClue.label}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={() => setInspectedClueId(null)}
                            aria-label="Tutup paparan imbasan bukti"
                            className="p-1 rounded-lg text-[#DCE9D9] hover:text-[#FFFFFF] hover:bg-[#174C39] transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-[#DCE9D9] leading-snug">
                          {inspectedClue.issueSummary}
                        </p>

                        <div className="pt-1 flex items-center gap-2">
                          {!isInspectedCollected ? (
                            <button
                              type="button"
                              onClick={() => handleCollectInspected(inspectedClue)}
                              className="min-h-[38px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-b from-[#FFF2B2] via-[#E7C878] to-[#C8962E] hover:brightness-105 text-[#103D30] border border-[#FFFFFF] text-xs font-extrabold shadow-lg transition-all whitespace-nowrap"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>KUMPULKAN BUKTI (+20 XP)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setInspectedClueId(null);
                                notesInputRef.current?.focus();
                              }}
                              className="min-h-[36px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#174C39] hover:bg-[#1F6149] border border-[#4ADE80]/70 text-[#FFFFFF] text-xs font-bold transition-colors whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                              <span>Catat Pemerhatian</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ---------------------------------------------------------------
                RIGHT PANEL: PROFESOR NURIN & PETUNJUK SIASATAN
               --------------------------------------------------------------- */}
            <aside className="lg:col-span-3 flex flex-col justify-between gap-2.5">
              {/* PROFESOR NURIN ASSISTANT CARD */}
              <div className="relative flex-1 rounded-2xl bg-gradient-to-b from-[#134232]/90 to-[#09241B]/95 border-2 border-[#E7C878] shadow-[0_14px_34px_rgba(0,0,0,0.48)] p-3 flex flex-col justify-between overflow-hidden">
                {/* Speech Bubble */}
                <div className="relative z-10 rounded-xl bg-[#F5E8CF] border-2 border-[#C8962E] px-3 py-2.5 text-[#1E3127] shadow-lg">
                  <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-[#C8962E]/35">
                    <Award className="w-3.5 h-3.5 text-[#8A5A12] shrink-0" />
                    <span className="font-display text-xs font-extrabold text-[#103D30]">
                      Profesor Nurin
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-snug text-[#26382F]">
                    “{speechText}”
                  </p>
                  {/* Tail */}
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-2 left-8 w-3.5 h-3.5 rotate-45 bg-[#F5E8CF] border-r-2 border-b-2 border-[#C8962E]"
                  />
                </div>

                {/* Standing Profesor Nurin Portrait */}
                <div className="relative mt-2 flex-1 min-h-[165px] rounded-xl overflow-hidden border border-[#E7C878]/45 bg-[#103D30]">
                  {!portraitFallback ? (
                    <img
                      src={professorNurinStandingUrl}
                      alt="Profesor Nurin membimbing penyiasatan"
                      referrerPolicy="no-referrer"
                      onError={() => setPortraitFallback(true)}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <ProfesorCitraPortrait realistic className="w-28 h-28" />
                    </div>
                  )}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#082118] via-[#082118]/65 to-transparent"
                  />
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#0E3327]/90 border border-[#E7C878] text-[11px] font-display font-bold text-[#FFF4CC]">
                      Profesor Nurin
                    </span>
                    <span className="text-[10px] font-mono-tabular font-bold text-[#E7C878]">
                      Mentor Akademi
                    </span>
                  </div>
                </div>
              </div>

              {/* PETUNJUK SIASATAN PANEL */}
              <div className="rounded-2xl bg-gradient-to-b from-[#134232] to-[#0A271D] border-2 border-[#E7C878] shadow-[0_12px_28px_rgba(0,0,0,0.45)] p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-[#E7C878]/30 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-[#FACC15]" />
                    <h3 className="font-display text-xs sm:text-sm font-extrabold text-[#FFF4CC]">
                      Petunjuk Siasatan
                    </h3>
                  </div>
                  <span className="font-mono-tabular text-[10px] font-bold text-[#E7C878]">
                    {inv.hintLevelUsed}/3
                  </span>
                </div>

                <p className="text-xs text-[#F5E8CF] leading-relaxed min-h-[42px]">
                  {activeHintText}
                </p>

                <button
                  type="button"
                  onClick={onAdvanceHint}
                  disabled={inv.hintLevelUsed >= 3}
                  className="min-h-[40px] w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-b from-[#FFF2B2] via-[#E7C878] to-[#C8962E] hover:brightness-105 disabled:opacity-55 disabled:cursor-not-allowed text-[#103D30] border border-[#FFFFFF]/80 text-xs font-extrabold shadow transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {inv.hintLevelUsed >= 3
                      ? 'Semua Hint Aktif'
                      : `Dapatkan Hint (${inv.hintLevelUsed + 1}/3)`}
                  </span>
                </button>
              </div>
            </aside>
          </div>

          {/* =================================================================
              BOTTOM DOCK: INVENTORI BUKTI | CATATAN EJEN | TERUSKAN CTA
             ================================================================= */}
          <form
            onSubmit={onSave}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch"
          >
            {/* ---------------------------------------------------------------
                BOTTOM LEFT: INVENTORI BUKTI (BACKPACK + 3 EVIDENCE SLOTS)
               --------------------------------------------------------------- */}
            <section
              aria-label="Inventori Bukti"
              className="lg:col-span-5 rounded-2xl bg-gradient-to-b from-[#134232] to-[#08221A] border-2 border-[#E7C878] shadow-[0_12px_28px_rgba(0,0,0,0.48)] p-2.5 sm:p-3 flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#FFF4CC]">
                  Inventori Bukti
                </span>
                <span className="text-[11px] font-mono-tabular font-bold text-[#E7C878]">
                  {discoveredCount}/{totalClues} Dikumpul
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <DetectiveBackpackSvg className="w-14 h-16 sm:w-16 sm:h-20 shrink-0" />

                <div className="flex-1 grid grid-cols-3 gap-2">
                  {loc.clues.map((clue, idx) => {
                    const coord = hotspots.find((h) => h.clueId === clue.id);
                    const collected = inv.discoveredClueIds.includes(clue.id);
                    const isSelected = inspectedClueId === clue.id;
                    const shortLabel = SHORT_INVENTORY_LABELS[clue.id] || clue.label;

                    return (
                      <button
                        key={clue.id}
                        type="button"
                        onClick={() => triggerInspectClue(clue.id)}
                        className={`group relative rounded-xl p-1.5 border text-left flex flex-col items-center gap-1 transition-all duration-150 ${
                          collected
                            ? isSelected
                              ? 'bg-[#195440] border-[#FFF2B2] shadow-[0_0_16px_rgba(231,200,120,0.45)]'
                              : 'bg-[#123E2F] border-[#E7C878] hover:bg-[#195440] hover:-translate-y-0.5'
                            : isSelected
                              ? 'bg-[#0E3125] border-[#E7C878]/85'
                              : 'bg-[#082018] border-[#E7C878]/35 hover:border-[#E7C878]/75'
                        }`}
                      >
                        {/* Top-right Status Icon */}
                        <span
                          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border shadow ${
                            collected
                              ? 'bg-[#22C55E] border-[#FFFFFF] text-[#FFFFFF]'
                              : 'bg-[#0D3024] border-[#E7C878]/60 text-[#E7C878]'
                          }`}
                        >
                          {collected ? (
                            <Check className="w-3 h-3 stroke-[3]" />
                          ) : (
                            <Lock className="w-2.5 h-2.5" />
                          )}
                        </span>

                        {/* Evidence Photo Thumbnail Crop */}
                        <div className="w-full h-11 rounded-lg overflow-hidden border border-[#E7C878]/40 bg-[#061912] relative">
                          <div
                            className={`w-full h-full transition-all duration-200 ${
                              collected
                                ? 'opacity-100 group-hover:scale-105'
                                : 'opacity-30 grayscale blur-[1px]'
                            }`}
                            style={{
                              backgroundImage: `url(${photoUrl})`,
                              backgroundPosition: coord
                                ? `${coord.xPercent}% ${coord.yPercent}%`
                                : '50% 50%',
                              backgroundSize: '290%',
                              backgroundRepeat: 'no-repeat',
                            }}
                          />
                          {!collected && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono-tabular font-bold text-[#E7C878]">
                              0{idx + 1}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] sm:text-[11px] font-bold text-center leading-tight text-[#FFF4CC] line-clamp-2">
                          0{idx + 1} — {shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------------------
                BOTTOM CENTRE: CATATAN PEMERHATIAN EJEN & CADANGAN
               --------------------------------------------------------------- */}
            <section
              aria-label="Catatan Pemerhatian Ejen"
              className="lg:col-span-5 rounded-2xl bg-gradient-to-b from-[#134232] to-[#08221A] border-2 border-[#E7C878] shadow-[0_12px_28px_rgba(0,0,0,0.48)] p-2.5 sm:p-3 flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-[#E7C878]" />
                  <span className="font-display text-xs sm:text-sm font-extrabold text-[#FFF4CC]">
                    Catatan Pemerhatian Ejen
                  </span>
                </div>
                <span className="text-[10px] font-mono-tabular text-[#DCE9D9]">
                  {notesReady && proposalReady
                    ? '✓ Sedia Disimpan'
                    : 'Minimum 8 aksara setiap ruang'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                <div className="flex flex-col">
                  <label htmlFor="csi-notes-textarea" className="sr-only">
                    Catatan Pemerhatian Ejen
                  </label>
                  <textarea
                    id="csi-notes-textarea"
                    ref={notesInputRef}
                    rows={2}
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder="Tekan pada bukti untuk melihat maklumat dan buat pemerhatian anda di sini..."
                    className="w-full flex-1 min-h-[64px] rounded-xl px-2.5 py-2 bg-[#071D15] border border-[#E7C878]/50 focus:border-[#E7C878] focus:bg-[#0A271D] focus:outline-none text-xs text-[#FFFFFF] placeholder:text-[#A8C5A0]/75 resize-none"
                  />
                </div>

                <div className="flex flex-col">
                  <label htmlFor="csi-proposal-textarea" className="sr-only">
                    Cadangan Penyelesaian Awal
                  </label>
                  <textarea
                    id="csi-proposal-textarea"
                    rows={2}
                    value={proposal}
                    onChange={(e) => onProposalChange(e.target.value)}
                    placeholder={`Cadangan penyelesaian awal untuk ${loc.name}...`}
                    className="w-full flex-1 min-h-[64px] rounded-xl px-2.5 py-2 bg-[#071D15] border border-[#E7C878]/50 focus:border-[#E7C878] focus:bg-[#0A271D] focus:outline-none text-xs text-[#FFFFFF] placeholder:text-[#A8C5A0]/75 resize-none"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="px-2.5 py-1.5 rounded-lg bg-[#5A1B12] border border-[#F87171] text-[11px] font-semibold text-[#FEE2E2]"
                >
                  {error}
                </div>
              )}

              {savedNotice && !error && (
                <div
                  role="status"
                  className="px-2.5 py-1.5 rounded-lg bg-[#164E38] border border-[#4ADE80]/70 text-[11px] font-bold text-[#DCFCE7]"
                >
                  Bukti bagi {loc.name} telah disimpan ke Fail Bukti Ejen!
                </div>
              )}
            </section>

            {/* ---------------------------------------------------------------
                BOTTOM RIGHT: SAVE & TERUSKAN KE ANALISIS BUTTON
               --------------------------------------------------------------- */}
            <div className="lg:col-span-2 flex flex-col justify-between gap-2">
              <button
                type="submit"
                className="min-h-[42px] w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#174C39] hover:bg-[#1F6149] border-2 border-[#E7C878] text-[#FFF4CC] text-xs font-extrabold shadow-lg transition-colors whitespace-nowrap"
              >
                <Save className="w-4 h-4 text-[#E7C878]" />
                <span>Simpan Bukti</span>
              </button>

              {all4Done ? (
                <button
                  type="button"
                  onClick={onProceedToPhase2}
                  className="flex-1 min-h-[54px] w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-b from-[#FFF2B2] via-[#E7C878] to-[#C8962E] hover:brightness-105 text-[#103D30] border-2 border-[#FFFFFF] text-xs sm:text-sm font-extrabold uppercase tracking-wide shadow-[0_10px_26px_rgba(231,200,120,0.35)] transition-all"
                >
                  <span className="text-center leading-tight">Teruskan Ke Analisis</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              ) : inv.completed && nextIncompleteLocation ? (
                <button
                  type="button"
                  onClick={() => onSelectLocation(nextIncompleteLocation.id)}
                  className="flex-1 min-h-[54px] w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-b from-[#FFF2B2] via-[#E7C878] to-[#C8962E] hover:brightness-105 text-[#103D30] border-2 border-[#FFFFFF] text-xs sm:text-sm font-extrabold uppercase tracking-wide shadow-[0_10px_26px_rgba(231,200,120,0.35)] transition-all"
                >
                  <span className="text-center leading-tight">
                    Siasat {nextIncompleteLocation.shortName}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 min-h-[54px] w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-b from-[#FFF2B2] via-[#E7C878] to-[#C8962E] hover:brightness-105 text-[#103D30] border-2 border-[#FFFFFF] text-xs sm:text-sm font-extrabold uppercase tracking-wide shadow-[0_10px_26px_rgba(231,200,120,0.35)] transition-all"
                >
                  <span className="text-center leading-tight">Teruskan Ke Analisis</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
