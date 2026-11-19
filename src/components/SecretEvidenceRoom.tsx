import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Compass,
  FileText,
  Library,
  Lock,
  Pin,
  Search,
  ShieldCheck,
  Sparkles,
  Trees,
  Utensils,
  X,
  ZoomIn,
} from 'lucide-react';
import { LOCATIONS } from '../game/data';
import { gameAudio } from '../game/audio';
import type { GameState, LocationId } from '../game/types';

interface SecretEvidenceRoomProps {
  state: GameState;
  selectedIds: LocationId[];
  error: string;
  onToggleEvidence: (locId: LocationId) => void;
  onClearError: () => void;
}

interface CaseBoardStyle {
  caseNo: string;
  tabLabel: string;
  tiltClass: string;
  pinColor: string;
  accentBorder: string;
  accentBg: string;
  threadPath: string;
  pinX: number;
  pinY: number;
  icon: React.ComponentType<{ className?: string }>;
}

const CASE_BOARD_STYLES: Record<LocationId, CaseBoardStyle> = {
  kantin: {
    caseNo: 'KES #01',
    tabLabel: 'SEKTOR UTARA · A2',
    tiltClass: 'md:-rotate-[0.75deg]',
    pinColor: 'from-[#f4d17a] to-[#b58124]',
    accentBorder: 'border-[#c9a24b]',
    accentBg: 'bg-[#f6eedb]',
    threadPath: 'M 400 215 Q 290 150, 195 105',
    pinX: 195,
    pinY: 105,
    icon: Utensils,
  },
  kelas: {
    caseNo: 'KES #02',
    tabLabel: 'SEKTOR BARAT · D2',
    tiltClass: 'md:rotate-[0.65deg]',
    pinColor: 'from-[#8fd4b2] to-[#2c7a56]',
    accentBorder: 'border-[#74a98c]',
    accentBg: 'bg-[#f4efe1]',
    threadPath: 'M 400 215 Q 510 150, 605 105',
    pinX: 605,
    pinY: 105,
    icon: BookOpenCheck,
  },
  perpustakaan: {
    caseNo: 'KES #03',
    tabLabel: 'SEKTOR TIMUR · D4',
    tiltClass: 'md:-rotate-[0.55deg]',
    pinColor: 'from-[#a6c8e8] to-[#3c6f9c]',
    accentBorder: 'border-[#7c9eb8]',
    accentBg: 'bg-[#f7f0df]',
    threadPath: 'M 400 215 Q 290 280, 195 325',
    pinX: 195,
    pinY: 325,
    icon: Library,
  },
  taman: {
    caseNo: 'KES #04',
    tabLabel: 'SEKTOR SELATAN · A4',
    tiltClass: 'md:rotate-[0.75deg]',
    pinColor: 'from-[#df8f74] to-[#a94c31]',
    accentBorder: 'border-[#c8886d]',
    accentBg: 'bg-[#f3ecda]',
    threadPath: 'M 400 215 Q 510 280, 605 325',
    pinX: 605,
    pinY: 325,
    icon: Trees,
  },
};

const DUST_MOTES = [
  { id: 0, left: '11%', top: '18%', size: 4, dur: '6.2s', delay: '0s' },
  { id: 1, left: '88%', top: '24%', size: 3, dur: '7.1s', delay: '0.8s' },
  { id: 2, left: '34%', top: '44%', size: 3, dur: '5.8s', delay: '1.4s' },
  { id: 3, left: '68%', top: '52%', size: 4, dur: '6.9s', delay: '0.4s' },
  { id: 4, left: '19%', top: '82%', size: 3, dur: '6.4s', delay: '1.9s' },
  { id: 5, left: '82%', top: '80%', size: 4, dur: '5.5s', delay: '1.1s' },
];

const SELECT_SPARKLES = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  const dist = 34 + ((i * 19) % 36);
  return {
    id: i,
    tx: `${Math.round(Math.cos(angle) * dist)}px`,
    ty: `${Math.round(Math.sin(angle) * dist - 10)}px`,
    delay: `${(i % 4) * 0.04}s`,
    dur: `${0.85 + (i % 3) * 0.16}s`,
  };
});

export function SecretEvidenceRoom({
  state,
  selectedIds,
  error,
  onToggleEvidence,
  onClearError,
}: SecretEvidenceRoomProps) {
  const [inspectedLocId, setInspectedLocId] = useState<LocationId>(
    () => selectedIds[0] || LOCATIONS[0].id
  );
  const [magnifierOpenLocId, setMagnifierOpenLocId] = useState<LocationId | null>(null);
  const [recentSparkleLocId, setRecentSparkleLocId] = useState<LocationId | null>(null);
  const [lensPos, setLensPos] = useState({ x: 50, y: 40 });

  const selectedCount = selectedIds.length;
  const isCollectionComplete = selectedCount >= 2;
  const inspectedLoc = LOCATIONS.find((l) => l.id === inspectedLocId) || LOCATIONS[0];
  const inspectedInv = state.investigations[inspectedLoc.id];
  const inspectedStyle = CASE_BOARD_STYLES[inspectedLoc.id];
  const InspectedIcon = inspectedStyle.icon;

  // Close Magnifying Glass Dossier on Escape
  useEffect(() => {
    if (!magnifierOpenLocId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMagnifierOpenLocId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [magnifierOpenLocId]);

  const handleSelectCase = (locId: LocationId) => {
    if (state.soundEnabled) gameAudio.playClick();
    onClearError();
    setInspectedLocId(locId);
  };

  const handleOpenMagnifier = (locId: LocationId) => {
    if (state.soundEnabled) gameAudio.playHint();
    onClearError();
    setInspectedLocId(locId);
    setMagnifierOpenLocId(locId);
  };

  const handleTogglePinEvidence = (locId: LocationId) => {
    const alreadySelected = selectedIds.includes(locId);
    if (!alreadySelected && selectedIds.length >= 3) {
      if (state.soundEnabled) gameAudio.playError();
      onToggleEvidence(locId);
      return;
    }

    if (state.soundEnabled) {
      if (alreadySelected) {
        gameAudio.playClick();
      } else {
        gameAudio.playClueFound();
      }
    }

    setInspectedLocId(locId);
    onToggleEvidence(locId);

    if (!alreadySelected) {
      setRecentSparkleLocId(locId);
      window.setTimeout(() => {
        setRecentSparkleLocId((cur) => (cur === locId ? null : cur));
      }, 1100);
    }
  };

  const magnifierLoc = magnifierOpenLocId
    ? LOCATIONS.find((l) => l.id === magnifierOpenLocId) || null
    : null;

  return (
    <section
      aria-labelledby="secret-evidence-room-heading"
      className="bg-[#FFFFFF] relative rounded-2xl border-2 border-[#A8C5A0] p-4 sm:p-6 lg:p-7 space-y-6 overflow-hidden shadow-lg text-[#26382F]"
    >
      {/* Brass Corner Rivets */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#F5F0E5] via-[#E7C878] to-[#b58c38]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#F5F0E5] via-[#E7C878] to-[#b58c38]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 left-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#F5F0E5] via-[#E7C878] to-[#b58c38]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#F5F0E5] via-[#E7C878] to-[#b58c38]"
      />

      {/* 1. ROOM HEADER + ANIMATED INVESTIGATION STATUS */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#DCE9D9] pb-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#315C48] border border-[#E7C878] font-mono-tabular text-[11px] font-bold uppercase tracking-[0.16em] text-[#E7C878]">
              <Compass className="w-3.5 h-3.5 misi-compass-spin" />
              <span>
                {selectedCount === 0
                  ? 'STATUS: MENUNGGU ANALISIS'
                  : selectedCount === 1
                  ? 'STATUS: PENGUMPULAN BUKTI (1/3)'
                  : 'STATUS: BUKTI UTAMA SEDIA'}
              </span>
            </span>
            <span className="font-mono-tabular text-xs font-semibold text-[#4A6358]">
              MEJA &amp; PAPAN BUKTI PENYIASATAN DETEKTIF MUDA
            </span>
          </div>

          <h2
            id="secret-evidence-room-heading"
            className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#315C48] tracking-tight"
          >
            THE SECRET EVIDENCE ROOM
          </h2>
          <p className="text-sm sm:text-base text-[#4A6358] max-w-2xl">
            Setiap petunjuk menyimpan rahsia. Teliti, analisis dan pilih bukti paling penting.
          </p>
        </div>

        {/* Highlighted Live Counter Badge */}
        <div className="shrink-0 rounded-xl bg-[#315C48] border-2 border-[#E7C878] px-4 py-3 shadow-md space-y-1.5 min-w-[235px] text-[#FFFFFF]">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono-tabular text-sm font-extrabold tracking-wide text-[#E7C878]">
              BUKTI DIPILIH: {selectedCount}/3
            </span>
            <span className="text-[11px] font-mono-tabular text-[#DCE9D9]">Min 2 · Maks 3</span>
          </div>
          <div className="h-2 rounded-full bg-[#244637] border border-[#E7C878]/40 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E7C878] to-[#A8C5A0] transition-all duration-300"
              style={{ width: `${Math.min(100, (selectedCount / 3) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. CREATIVE EVIDENCE COLLECTION RACK (3 Pinned Slip Slots) */}
      <div className="relative z-10 rounded-xl bg-[#F5F0E5] border-2 border-[#A8C5A0] p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#315C48] flex items-center gap-2">
            <Pin className="w-3.5 h-3.5 text-[#315C48]" />
            <span>RAK BUKTI TERPILIH ({selectedCount}/3 SLOT DISASAR)</span>
          </p>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded font-mono-tabular ${
              isCollectionComplete
                ? 'bg-[#315C48] text-[#FFFFFF] border border-[#E7C878]'
                : 'bg-[#FFFFFF] text-[#315C48] border border-[#A8C5A0]'
            }`}
          >
            {isCollectionComplete
              ? 'Bukti utama dikenal pasti'
              : selectedCount === 1
              ? 'Bukti direkodkan · Tambah 1 lagi'
              : 'Pilih sekurang-kurangnya 2 fail kes'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((slotIdx) => {
            const locId = selectedIds[slotIdx];
            const loc = locId ? LOCATIONS.find((l) => l.id === locId) : null;
            const style = locId ? CASE_BOARD_STYLES[locId] : null;
            const SlotIcon = style?.icon;

            if (loc && style && SlotIcon) {
              return (
                <div
                  key={`slot-filled-${loc.id}`}
                  className="room-slip-pin relative bg-[#FFFFFF] rounded-lg border-2 border-[#E7C878] p-3 text-[#26382F] flex items-center justify-between gap-2.5 shadow-sm"
                >
                  {/* Brass Tack */}
                  <span
                    aria-hidden="true"
                    className={`absolute -top-1.5 left-4 w-3 h-3 rounded-full bg-gradient-to-br ${style.pinColor} border border-[#26382F] shadow`}
                  />

                  <button
                    type="button"
                    onClick={() => handleSelectCase(loc.id)}
                    className="flex items-center gap-2.5 text-left min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315C48] rounded"
                  >
                    <span className="w-9 h-9 rounded-lg bg-[#315C48] text-[#E7C878] flex items-center justify-center shrink-0">
                      <SlotIcon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono-tabular text-[10px] font-extrabold uppercase tracking-wider text-[#315C48]">
                        {style.caseNo} ·{' '}
                        {isCollectionComplete ? 'Bukti utama dikenal pasti' : 'Bukti direkodkan'}
                      </span>
                      <span className="block font-display text-sm font-bold text-[#26382F] truncate">
                        {loc.name}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePinEvidence(loc.id)}
                    aria-label={`Keluarkan ${loc.name} daripada koleksi bukti`}
                    title="Keluarkan bukti ini"
                    className="w-7 h-7 rounded-md bg-[#F5F0E5] hover:bg-[#c2593f] hover:text-white text-[#26382F] flex items-center justify-center transition-colors shrink-0 border border-[#A8C5A0]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={`slot-empty-${slotIdx}`}
                className="rounded-lg border-2 border-dashed border-[#A8C5A0] bg-[#FFFFFF]/75 p-3 flex items-center justify-between gap-2 text-[#4A6358]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-[#DCE9D9] border border-[#A8C5A0] flex items-center justify-center font-mono-tabular text-xs font-bold text-[#315C48]">
                    0{slotIdx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#26382F]">Pilih bukti</p>
                    <p className="text-[10px] font-mono-tabular text-[#4A6358]">
                      {slotIdx < 2 ? 'Slot Utama (Wajib)' : 'Slot Tambahan (Pilihan)'}
                    </p>
                  </div>
                </div>
                <Lock className="w-3.5 h-3.5 text-[#4A6358] shrink-0" />
              </div>
            );
          })}
        </div>

        {/* Selection Limit Error Notification */}
        {error && (
          <div
            role="alert"
            className="p1-toast-enter rounded-xl bg-[#FBECE8] border-2 border-[#C2593F] px-4 py-3 text-xs sm:text-sm font-semibold text-[#8C331D] flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#C2593F] shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={onClearError}
              aria-label="Tutup amaran"
              className="p-1 rounded hover:bg-[#C2593F]/10 text-[#8C331D]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 3. INTERACTIVE INVESTIGATION BOARD + PINNED CASE FILES + GOLDEN CONNECTING THREADS */}
      <div className="room-corkboard-surface relative rounded-2xl border-2 border-[#A8C5A0] p-4 sm:p-6 overflow-hidden shadow-inner">
        {/* Subtle Floating Dust Particles */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          {DUST_MOTES.map((m) => (
            <span
              key={m.id}
              className="peta-float-mote absolute rounded-full bg-[#E7C878]/70"
              style={
                {
                  left: m.left,
                  top: m.top,
                  width: `${m.size}px`,
                  height: `${m.size}px`,
                  '--mote-dur': m.dur,
                  '--mote-delay': m.delay,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* Background SVG Golden Thread Web & Central Investigation Hub (Desktop) */}
        <svg
          viewBox="0 0 800 430"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="hidden md:block pointer-events-none absolute inset-0 w-full h-full z-0"
        >
          <defs>
            <radialGradient id="roomCenterSpot" cx="50%" cy="50%" r="48%">
              <stop offset="0%" stopColor="rgba(231, 200, 120, 0.25)" />
              <stop offset="100%" stopColor="rgba(220, 233, 217, 0)" />
            </radialGradient>
          </defs>
          <circle cx="400" cy="215" r="210" fill="url(#roomCenterSpot)" />

          {LOCATIONS.map((loc) => {
            const st = CASE_BOARD_STYLES[loc.id];
            const isInspected = inspectedLocId === loc.id;
            const isSelected = selectedIds.includes(loc.id);
            const pathId = `room-thread-${loc.id}`;

            return (
              <g key={loc.id}>
                <path
                  id={pathId}
                  d={st.threadPath}
                  fill="none"
                  stroke={isInspected || isSelected ? '#315C48' : '#A8C5A0'}
                  strokeOpacity={isInspected ? 0.78 : isSelected ? 0.55 : 0.4}
                  strokeWidth={isInspected ? 3 : isSelected ? 2.4 : 1.5}
                  strokeDasharray={isInspected ? '8 5' : '6 6'}
                  className={isInspected ? 'peta-route-active' : undefined}
                />
                {(isInspected || isSelected) && (
                  <circle r="3.5" fill="#E7C878" opacity="0.95">
                    <animateMotion dur="2.2s" repeatCount="indefinite">
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                )}
                <circle
                  cx={st.pinX}
                  cy={st.pinY}
                  r={isInspected ? 6 : 4}
                  fill={isSelected ? '#315C48' : '#E7C878'}
                  fillOpacity={isInspected ? 0.95 : 0.65}
                />
              </g>
            );
          })}

          {/* Central Brass Investigation Emblem Hub */}
          <circle
            cx="400"
            cy="215"
            r="34"
            fill="#315C48"
            fillOpacity="0.95"
            stroke="#E7C878"
            strokeWidth="2.5"
          />
          <circle
            cx="400"
            cy="215"
            r="41"
            fill="none"
            stroke="#E7C878"
            strokeOpacity="0.65"
            strokeWidth="1.2"
            strokeDasharray="3 4"
          />
          <text
            x="400"
            y="212"
            textAnchor="middle"
            fill="#E7C878"
            fontSize="9"
            fontWeight="700"
            fontFamily="monospace"
          >
            PUSAT
          </text>
          <text
            x="400"
            y="224"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="9"
            fontWeight="700"
            fontFamily="monospace"
          >
            KES
          </text>
        </svg>

        {/* 4 Pinned Detective Case Dossiers + Detailed Inspection Panel */}
        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left 8 Columns: 4 Unique Pinned Case Files on Investigation Wall */}
          <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {LOCATIONS.map((loc) => {
              const inv = state.investigations[loc.id];
              const isSelected = selectedIds.includes(loc.id);
              const isInspected = inspectedLocId === loc.id;
              const style = CASE_BOARD_STYLES[loc.id];
              const LocIcon = style.icon;
              const showSparkle = recentSparkleLocId === loc.id;

              return (
                <div
                  key={loc.id}
                  className={`group relative rounded-xl transition-all duration-200 ${
                    style.tiltClass
                  } hover:rotate-0 ${
                    isSelected
                      ? '-translate-y-1.5 shadow-[0_18px_36px_rgba(49,92,72,0.18)]'
                      : isInspected
                      ? '-translate-y-1 shadow-[0_14px_28px_rgba(49,92,72,0.14)]'
                      : 'hover:-translate-y-1 shadow-[0_10px_22px_rgba(49,92,72,0.10)]'
                  }`}
                >
                  {/* Folder Top Tab */}
                  <div className="flex items-end justify-between px-3">
                    <div
                      className={`px-3 py-1 rounded-t-lg border border-b-0 font-mono-tabular text-[10px] font-extrabold tracking-wider ${
                        isSelected
                          ? 'bg-[#E7C878] border-[#315C48] text-[#26382F]'
                          : isInspected
                          ? 'bg-[#315C48] border-[#315C48] text-[#E7C878]'
                          : 'bg-[#F5F0E5] border-[#A8C5A0] text-[#315C48]'
                      }`}
                    >
                      {style.caseNo} · {style.tabLabel}
                    </div>

                    {/* Decorative Colored Brass Pushpin */}
                    <span
                      aria-hidden="true"
                      className={`w-4 h-4 -mb-2 z-20 rounded-full bg-gradient-to-br ${style.pinColor} border-2 border-[#26382F] shadow-md`}
                    />
                  </div>

                  {/* Case Dossier Sheet */}
                  <div
                    className={`relative rounded-b-xl rounded-tr-xl border-2 p-4 sm:p-5 space-y-3.5 overflow-hidden transition-colors ${
                      isSelected
                        ? 'bg-[#FFFFFF] border-[#E7C878]'
                        : isInspected
                        ? 'bg-[#FFFFFF] border-[#315C48]'
                        : 'bg-[#F5F0E5] border-[#A8C5A0] hover:border-[#315C48]'
                    }`}
                  >
                    {/* Subtle Paper Lines Overlay */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-45"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to bottom, transparent 0px, transparent 25px, rgba(49, 92, 72, 0.05) 26px)',
                      }}
                    />

                    {/* Selection Sparkle Burst */}
                    {showSparkle && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute right-10 top-8 z-30"
                      >
                        {SELECT_SPARKLES.map((sp) => (
                          <span
                            key={sp.id}
                            className="hq-sparkle-piece absolute block w-2 h-2 rounded-full bg-[#E7C878] shadow-[0_0_6px_#E7C878]"
                            style={
                              {
                                '--tx': sp.tx,
                                '--ty': sp.ty,
                                '--delay': sp.delay,
                                '--dur': sp.dur,
                              } as React.CSSProperties
                            }
                          />
                        ))}
                      </div>
                    )}

                    {/* Clickable Case Identity Header (Inspects on Board) */}
                    <button
                      type="button"
                      onClick={() => handleSelectCase(loc.id)}
                      className="relative z-10 w-full text-left flex items-start justify-between gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315C48]"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-2 shadow-sm transition-colors ${
                            isSelected
                              ? 'bg-[#315C48] text-[#E7C878] border-[#E7C878]'
                              : 'bg-[#DCE9D9] text-[#315C48] border-[#A8C5A0] group-hover:bg-[#315C48] group-hover:text-[#E7C878]'
                          }`}
                        >
                          <LocIcon className="w-5 h-5" />
                        </span>

                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono-tabular text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border border-[#8c331d]/45 text-[#8c331d] bg-[#FBECE8]">
                              SULIT
                            </span>
                            <span className="font-mono-tabular text-[11px] font-bold text-[#4A6358]">
                              {loc.shortName}
                            </span>
                          </div>
                          <h3 className="font-display text-lg sm:text-xl font-bold text-[#26382F] leading-snug mt-0.5">
                            {style.caseNo} — {loc.name}
                          </h3>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="room-stamp-slam inline-flex items-center gap-1 px-2 py-0.5 rounded border-2 border-[#315C48] bg-[#315C48] text-[#E7C878] font-mono-tabular text-[10px] font-extrabold tracking-wider shadow-sm shrink-0">
                          <ShieldCheck className="w-3 h-3" />
                          DIPILIH
                        </span>
                      )}
                    </button>

                    {/* Original Observation Notes & Initial Proposal */}
                    <div className="relative z-10 space-y-2.5 text-xs sm:text-sm text-[#26382F]">
                      <div className="rounded-lg bg-[#F5F0E5]/85 border border-[#A8C5A0]/65 p-2.5">
                        <p className="text-[11px] font-mono-tabular font-bold uppercase tracking-wide text-[#315C48] mb-0.5">
                          Catatan Pemerhatian Murid
                        </p>
                        <p className="leading-relaxed text-[#26382F] line-clamp-3">
                          {inv.notes || 'Tiada catatan direkodkan.'}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#F5F0E5]/85 border border-[#A8C5A0]/65 p-2.5">
                        <p className="text-[11px] font-mono-tabular font-bold uppercase tracking-wide text-[#315C48] mb-0.5">
                          Cadangan Awal
                        </p>
                        <p className="leading-relaxed text-[#26382F] line-clamp-2">
                          {inv.initialProposal || 'Tiada cadangan awal.'}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Controls: TELITI BUKTI + PILIH BUKTI */}
                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DCE9D9]">
                      <button
                        type="button"
                        onClick={() => handleOpenMagnifier(loc.id)}
                        className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DCE9D9] hover:bg-[#cfe0cb] text-[#26382F] border border-[#A8C5A0] text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        <Search className="w-3.5 h-3.5 text-[#315C48]" />
                        <span>TELITI BUKTI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePinEvidence(loc.id)}
                        aria-pressed={isSelected}
                        className={`min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#315C48] hover:bg-[#264938] text-[#FFFFFF] border-[#E7C878] shadow-sm'
                            : 'hq-brass-plaque text-[#26382F] border-[#E7C878] hover:brightness-105'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected
                              ? 'bg-[#E7C878] border-[#E7C878] text-[#26382F]'
                              : 'bg-white border-[#315C48]/40'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span>{isSelected ? 'BUKTI DIPILIH' : 'Pilih Bukti'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right 4 Columns: Detailed Spotlight Case Inspection Panel */}
          <aside
            aria-label="Panel Pemeriksaan Fail Kes Terperinci"
            className="xl:col-span-4 bg-[#FFFFFF] relative rounded-xl border-2 border-[#E7C878] p-5 text-[#26382F] shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between gap-2 border-b-2 border-[#DCE9D9] pb-2.5">
              <span className="font-mono-tabular text-xs font-extrabold uppercase tracking-wider text-[#315C48]">
                MEJA PEMERIKSAAN · {inspectedStyle.caseNo}
              </span>
              <span className="font-mono-tabular text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#315C48] text-[#E7C878]">
                FOKUS KES
              </span>
            </div>

            <div key={inspectedLoc.id} className="peta-dossier-switch space-y-3.5">
              <div className="flex items-start gap-3">
                <span className="w-11 h-11 rounded-xl bg-[#315C48] text-[#E7C878] border border-[#E7C878] flex items-center justify-center shrink-0">
                  <InspectedIcon className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-mono-tabular text-xs font-bold text-[#4A6358]">
                    {inspectedLoc.zoneLabel}
                  </p>
                  <h3 className="font-display text-xl font-bold text-[#26382F] leading-snug">
                    {inspectedLoc.name}
                  </h3>
                </div>
              </div>

              <div className="rounded-xl bg-[#F5F0E5] border border-[#A8C5A0] p-3.5 space-y-1.5">
                <p className="text-xs font-mono-tabular font-bold uppercase tracking-wide text-[#315C48]">
                  Catatan Pemerhatian Penuh
                </p>
                <p className="text-sm text-[#26382F] leading-relaxed">
                  {inspectedInv.notes || 'Tiada catatan direkodkan.'}
                </p>
              </div>

              <div className="rounded-xl bg-[#F5F0E5] border border-[#A8C5A0] p-3.5 space-y-1.5">
                <p className="text-xs font-mono-tabular font-bold uppercase tracking-wide text-[#315C48]">
                  Cadangan Penyelesaian Awal
                </p>
                <p className="text-sm text-[#26382F] leading-relaxed">
                  {inspectedInv.initialProposal || 'Tiada cadangan awal.'}
                </p>
              </div>

              {/* Phase 1 Discovered Clues Summary */}
              <div className="rounded-xl bg-[#DCE9D9] border border-[#A8C5A0] p-3 space-y-2">
                <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wide text-[#315C48]">
                  Petunjuk Lapangan Ditemui ({inspectedInv.discoveredClueIds.length}/
                  {inspectedLoc.clues.length})
                </p>
                <ul className="space-y-1.5">
                  {inspectedLoc.clues.map((clue) => {
                    const found = inspectedInv.discoveredClueIds.includes(clue.id);
                    return (
                      <li key={clue.id} className="flex items-start gap-2 text-xs text-[#26382F]">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            found ? 'text-[#315C48]' : 'text-[#4A6358]/45'
                          }`}
                        />
                        <span className={found ? 'font-medium' : 'opacity-65'}>
                          {clue.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleOpenMagnifier(inspectedLoc.id)}
                className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#315C48] hover:bg-[#264938] text-[#FFFFFF] border border-[#E7C878] text-xs sm:text-sm font-bold transition-colors"
              >
                <ZoomIn className="w-4 h-4 text-[#E7C878]" />
                <span>TELITI BUKTI (KANTA)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTogglePinEvidence(inspectedLoc.id)}
                className={`min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                  selectedIds.includes(inspectedLoc.id)
                    ? 'bg-[#DCE9D9] text-[#26382F] border-[#315C48] hover:bg-[#cfe0cb]'
                    : 'hq-brass-plaque text-[#26382F] border-[#E7C878]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#315C48]" />
                <span>
                  {selectedIds.includes(inspectedLoc.id)
                    ? 'Keluarkan dari Koleksi'
                    : 'Semat ke Rak Bukti'}
                </span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* 4. MAGNIFYING GLASS INSPECTION MODAL ("TELITI BUKTI") */}
      {magnifierLoc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Teliti Bukti: ${magnifierLoc.name}`}
          className="fixed inset-0 z-50 bg-[#26382F]/60 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setMagnifierOpenLocId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setLensPos({
                x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
                y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
              });
            }}
            className="p1-toast-enter relative w-full max-w-2xl bg-[#FFFFFF] rounded-2xl border-2 border-[#E7C878] p-5 sm:p-7 text-[#26382F] shadow-2xl overflow-hidden space-y-5"
          >
            {/* Interactive Magnifying Lens Spotlight following pointer */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(circle 190px at ${lensPos.x}% ${lensPos.y}%, rgba(231, 200, 120, 0.16), transparent 72%)`,
              }}
            />

            {/* Top Classified Stamp & Animated Magnifier Badge */}
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#DCE9D9] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl bg-[#315C48] text-[#E7C878] border-2 border-[#E7C878] flex items-center justify-center shadow-md">
                  <Search className="w-6 h-6 room-magnifier-scan" />
                </div>
                <div>
                  <p className="font-mono-tabular text-xs font-extrabold uppercase tracking-wider text-[#8c331d]">
                    DOKUMEN BUKTI TERPERINCI · {CASE_BOARD_STYLES[magnifierLoc.id].caseNo}
                  </p>
                  <h3 className="font-display text-2xl font-bold text-[#26382F]">
                    {magnifierLoc.name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMagnifierOpenLocId(null)}
                aria-label="Tutup paparan kanta pembesar"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-[#315C48] hover:bg-[#264938] text-[#FFFFFF] border border-[#E7C878] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Layered Document Sheets */}
            <div className="relative z-10 space-y-4">
              <div className="rounded-xl bg-[#F5F0E5] border border-[#A8C5A0] p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular font-bold uppercase tracking-wider text-[#315C48]">
                    <FileText className="w-4 h-4 text-[#315C48]" />
                    Catatan Pemerhatian Ejen (Sorotan Utama)
                  </span>
                  <span className="font-mono-tabular text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#E7C878] text-[#315C48]">
                    DISAHKAN FASA 1
                  </span>
                </div>
                <p className="text-base text-[#26382F] font-medium leading-relaxed bg-[#FFFFFF] px-3 py-2 rounded-lg border-l-4 border-[#E7C878]">
                  {state.investigations[magnifierLoc.id].notes || 'Tiada catatan direkodkan.'}
                </p>
              </div>

              <div className="rounded-xl bg-[#F5F0E5] border border-[#A8C5A0] p-4 shadow-xs space-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular font-bold uppercase tracking-wider text-[#315C48]">
                  <Sparkles className="w-4 h-4 text-[#315C48]" />
                  Cadangan Penyelesaian Awal
                </span>
                <p className="text-base text-[#26382F] leading-relaxed">
                  {state.investigations[magnifierLoc.id].initialProposal || 'Tiada cadangan awal.'}
                </p>
              </div>

              <div className="rounded-xl bg-[#DCE9D9] border border-[#A8C5A0] p-4 space-y-2">
                <p className="font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#315C48]">
                  Senarai Petunjuk Lapangan ({magnifierLoc.name})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {magnifierLoc.clues.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg bg-[#FFFFFF] border border-[#A8C5A0] p-2.5 text-xs space-y-1"
                    >
                      <p className="font-bold text-[#26382F] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#315C48] shrink-0" />
                        <span>{c.label}</span>
                      </p>
                      <p className="text-[#4A6358] leading-snug">{c.issueSummary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer: Select/Unselect Evidence Directly */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DCE9D9]">
              <span className="font-mono-tabular text-xs font-bold text-[#315C48]">
                BUKTI DIPILIH: {selectedCount}/3
              </span>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setMagnifierOpenLocId(null)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F5F0E5] hover:bg-[#DCE9D9] text-[#26382F] border border-[#A8C5A0] font-bold text-sm transition-colors"
                >
                  Tutup Fail
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleTogglePinEvidence(magnifierLoc.id);
                  }}
                  className={`min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm border transition-all ${
                    selectedIds.includes(magnifierLoc.id)
                      ? 'bg-[#315C48] text-[#FFFFFF] border-[#E7C878]'
                      : 'hq-brass-plaque text-[#26382F] border-[#E7C878]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {selectedIds.includes(magnifierLoc.id)
                      ? 'Sudah Dipilih (Klik untuk Keluar)'
                      : 'Pilih Sebagai Bukti Utama'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
