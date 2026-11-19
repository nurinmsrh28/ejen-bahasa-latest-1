import React from 'react';
import {
  ArrowRight,
  Award,
  Backpack,
  BookOpen,
  CheckCircle2,
  Compass,
  FolderOpen,
  Menu,
  Play,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { LOCATIONS, LOCATION_MAP } from '../../game/data';
import { isPhase1Complete } from '../../game/rules';
import type { GameState, LocationId } from '../../game/types';
import { ProfesorCitraPortrait } from '../DetectiveArt';
import { ZONE_TRIGGERS } from './campusWorldBuilder';
import type { SimulatorTelemetry } from './types';

interface SimulatorHudProps {
  state: GameState;
  activeLocationId: LocationId;
  telemetry: SimulatorTelemetry;
  sprintLocked: boolean;
  dialogueText: string;
  toastClueId: string | null;
  toastClueLocationId: LocationId;
  minimapArrowRef: React.RefObject<HTMLDivElement | null>;
  minimapPlayerDotRef: React.RefObject<HTMLDivElement | null>;
  onToggleSprint: () => void;
  onAdvanceHint: () => void;
  onOpenJournal: () => void;
  onOpenBadges: () => void;
  onOpenInventory: () => void;
  onOpenPauseMenu: () => void;
  onBackToHq: () => void;
  onProceedToPhase2: () => void;
  onTeleportZone: (locId: LocationId) => void;
  onInteractPrompt: () => void;
  onDismissToast: () => void;
}

export function SimulatorHud({
  state,
  activeLocationId,
  telemetry,
  sprintLocked,
  dialogueText,
  toastClueId,
  toastClueLocationId,
  minimapArrowRef,
  minimapPlayerDotRef,
  onToggleSprint,
  onAdvanceHint,
  onOpenJournal,
  onOpenBadges,
  onOpenInventory,
  onOpenPauseMenu,
  onBackToHq,
  onProceedToPhase2,
  onTeleportZone,
  onInteractPrompt,
  onDismissToast,
}: SimulatorHudProps) {
  const completedCount = LOCATIONS.filter((l) => state.investigations[l.id].completed).length;
  const totalCluesFound = LOCATIONS.reduce(
    (sum, l) => sum + state.investigations[l.id].discoveredClueIds.length,
    0
  );
  const totalClues = LOCATIONS.reduce((sum, l) => sum + l.clues.length, 0);
  const allDone = isPhase1Complete(state);

  const nearbyClueObj =
    telemetry.nearbyClueId && telemetry.nearbyClueLocationId
      ? LOCATION_MAP[telemetry.nearbyClueLocationId]?.clues.find(
          (c) => c.id === telemetry.nearbyClueId
        ) || null
      : null;

  const nearbyZoneObj = telemetry.nearbyZoneId ? LOCATION_MAP[telemetry.nearbyZoneId] : null;

  const toastLoc = LOCATION_MAP[toastClueLocationId];
  const toastInv = state.investigations[toastClueLocationId];
  const toastClue = toastClueId ? toastLoc.clues.find((c) => c.id === toastClueId) || null : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-4 select-none">
      {/* ===================================================================
          TOP ROW: LEFT OBJEKTIF MISI  +  RIGHT CIRCULAR N/E/S/W MINI-MAP
         =================================================================== */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Objektif Misi Card + Toast */}
        <div className="flex flex-col items-start gap-2.5 max-w-[300px] sm:max-w-[340px]">
          <div className="pointer-events-auto w-full rounded-xl bg-[rgba(16,61,48,0.93)] border-2 border-[#E7C878] shadow-[0_10px_28px_rgba(9,33,26,0.5)] overflow-hidden">
            <div className="px-3 py-1.5 bg-[rgba(12,46,36,0.98)] border-b border-[#E7C878]/45 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#E7C878] text-[#103D30] flex items-center justify-center shrink-0">
                  <Target className="w-3.5 h-3.5 stroke-[2.5]" />
                </span>
                <span className="font-display text-xs sm:text-sm font-bold text-[#FFF4CC] tracking-wide">
                  Objektif Misi
                </span>
              </div>
              <span className="font-mono-tabular text-[11px] font-bold text-[#E7C878] bg-[#174C39] px-2 py-0.5 rounded border border-[#E7C878]/45">
                {completedCount}/4 · {totalCluesFound}/{totalClues} Bukti
              </span>
            </div>

            <div className="px-3.5 py-2.5 text-[#F5E8CF] space-y-1.5">
              <p className="text-xs sm:text-[13px] font-semibold leading-snug flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#E7C878] shrink-0 mt-0.5" />
                <span>
                  {allDone
                    ? 'Semua 4 lokasi lengkap! Buka Jurnal Detektif atau teruskan ke Fasa 2.'
                    : `Terokai lokasi di sekolah dan cari bukti. Fokus: ${LOCATION_MAP[activeLocationId].name}.`}
                </span>
              </p>
            </div>
          </div>

          {/* Evidence Discovered Toast */}
          {toastClue && (
            <div
              role="status"
              className="pointer-events-auto w-full rounded-xl bg-[#FFFFFF] border-2 border-[#E7C878] text-[#26382F] p-3 shadow-2xl space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#E7C878] text-[#103D30] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-mono-tabular font-extrabold uppercase tracking-wider text-[#174C39]">
                      BUKTI DITEMUI · {toastLoc.shortName} ({toastInv.discoveredClueIds.length}/
                      {toastLoc.clues.length})
                    </p>
                    <p className="text-xs font-bold text-[#26382F] leading-tight">
                      {toastClue.label}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onDismissToast}
                  aria-label="Tutup notifikasi bukti"
                  className="p-1 rounded text-[#4A6358] hover:text-[#26382F] hover:bg-[#DCE9D9]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-[#4A6358] leading-snug">{toastClue.issueSummary}</p>
              <div className="flex items-center justify-end pt-0.5">
                <button
                  type="button"
                  onClick={onOpenJournal}
                  className="px-2.5 py-1 rounded-lg bg-[#174C39] hover:bg-[#103D30] text-[#FFF4CC] text-[11px] font-bold transition-colors"
                >
                  Buka Jurnal Detektif
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Circular N/E/S/W Mini-Map + Quick Menu Buttons */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onBackToHq}
              className="min-h-[34px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(16,61,48,0.93)] hover:bg-[#174C39] border border-[#E7C878]/75 text-[#F5E8CF] text-[11px] font-bold shadow-md transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#E7C878]" />
              <span className="hidden sm:inline">Pusat Operasi</span>
              <span className="sm:hidden">HQ</span>
            </button>
            <button
              type="button"
              onClick={onOpenPauseMenu}
              className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[rgba(16,61,48,0.93)] hover:bg-[#174C39] border border-[#E7C878]/75 text-[#FFF4CC] text-[11px] font-bold shadow-md transition-colors"
              aria-label="Buka menu jeda (Esc)"
            >
              <Menu className="w-3.5 h-3.5 text-[#E7C878]" />
              <span>Esc</span>
            </button>
          </div>

          {/* Circular Compass Mini-Map matching Reference Image */}
          <div className="relative flex flex-col items-center">
            <div className="relative w-[122px] h-[122px] sm:w-[138px] sm:h-[138px] rounded-full border-[3px] border-[#E7C878] bg-[#2D4F3B] shadow-[0_10px_26px_rgba(9,33,26,0.58)] overflow-hidden">
              {/* Stylized Top-Down Campus Map Graphics */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#466B4F_0%,#2E4E3B_68%,#1E392A_100%)]" />
              {/* Main Building top rectangle */}
              <div className="absolute top-[11%] left-[24%] w-[52%] h-[16%] rounded-sm bg-[#D8D0C0] border border-[#8C3B2B]" />
              {/* Cross Walkways */}
              <div className="absolute top-[28%] left-[44%] w-[12%] h-[58%] bg-[#CBB99B]/85 rounded-sm" />
              <div className="absolute top-[48%] left-[14%] w-[72%] h-[11%] bg-[#CBB99B]/85 rounded-sm" />
              {/* Central Plaza Ring */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full bg-[#D8CBB2] border border-[#7FA8B4]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[12%] h-[12%] rounded-full bg-[#6AB5C9]" />

              {/* 4 Clickable Zone Dots (projected from [-32..+32]) */}
              {LOCATIONS.map((loc) => {
                const z = ZONE_TRIGGERS[loc.id];
                const leftPct = Math.min(88, Math.max(12, ((z.center[0] + 32) / 64) * 100));
                const topPct = Math.min(88, Math.max(12, ((z.center[2] + 32) / 64) * 100));
                const done = state.investigations[loc.id].completed;
                const isAct = activeLocationId === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => onTeleportZone(loc.id)}
                    title={`Pergi ke ${loc.name}`}
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-125 ${
                      done
                        ? 'bg-[#22C55E] border-[#FFFFFF]'
                        : isAct
                          ? 'bg-[#FACC15] border-[#FFFFFF] scale-110'
                          : 'bg-[#E7C878] border-[#103D30]'
                    }`}
                    aria-label={`Pergi pantas ke ${loc.name}`}
                  >
                    {done && <CheckCircle2 className="w-2.5 h-2.5 text-[#FFFFFF]" />}
                  </button>
                );
              })}

              {/* Live Player Dot & Rotating Direction Arrow (Imperatively updated by Three.js RAF) */}
              <div
                ref={minimapPlayerDotRef}
                style={{ left: '50%', top: '74%' }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center"
              >
                <div
                  ref={minimapArrowRef}
                  className="w-5 h-5 flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                    <polygon
                      points="12,2 20,20 12,16 4,20"
                      fill="#FFE066"
                      stroke="#103D30"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Cardinal Compass Ring */}
              <span className="pointer-events-none absolute top-0.5 left-1/2 -translate-x-1/2 text-[10px] font-extrabold text-[#FFF4CC] drop-shadow">
                N
              </span>
              <span className="pointer-events-none absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] font-extrabold text-[#FFF4CC] drop-shadow">
                S
              </span>
              <span className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-[#FFF4CC] drop-shadow">
                W
              </span>
              <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-[#FFF4CC] drop-shadow">
                E
              </span>
            </div>

            <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[rgba(16,61,48,0.92)] border border-[#E7C878]/70 text-[10px] font-semibold text-[#FFF4CC] shadow max-w-[165px] truncate">
              {telemetry.currentAreaName}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================
          BOTTOM HUD BAR: CONTROLS (LEFT) · NURIN DIALOGUE (CENTER) · DECK (RIGHT)
         =================================================================== */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-2.5 sm:gap-3">
        {/* Bottom-Left: Keyboard/Mouse Guide + Sprint Toggle */}
        <div className="hidden sm:flex flex-col items-start gap-2 shrink-0">
          <div className="pointer-events-auto rounded-xl bg-[rgba(16,61,48,0.9)] border border-[#E7C878]/65 px-3 py-2 text-[#F5E8CF] shadow-xl space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5">
                {['W', 'A', 'S', 'D'].map((k) => (
                  <kbd
                    key={k}
                    className="w-5 h-5 rounded bg-[#1F4A3B] border border-[#E7C878]/70 text-[#FFF4CC] font-mono-tabular text-[10px] font-bold flex items-center justify-center"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
              <span className="font-semibold">Bergerak</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#1F4A3B] border border-[#E7C878]/70 text-[#E7C878] flex items-center justify-center shrink-0">
                <Compass className="w-3 h-3" />
              </span>
              <span className="font-semibold">Seret Kawal Kamera</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 h-5 rounded bg-[#1F4A3B] border border-[#E7C878]/70 text-[#FFF4CC] font-mono-tabular text-[10px] font-bold flex items-center justify-center">
                Shift
              </kbd>
              <span className="font-semibold">Berlari ·</span>
              <kbd className="px-1.5 h-5 rounded bg-[#1F4A3B] border border-[#E7C878]/70 text-[#FFF4CC] font-mono-tabular text-[10px] font-bold flex items-center justify-center">
                Space
              </kbd>
              <span className="font-semibold">Lompat</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="w-5 h-5 rounded bg-[#E7C878] text-[#103D30] font-mono-tabular text-[10px] font-extrabold flex items-center justify-center">
                E
              </kbd>
              <span className="font-semibold">Interaksi Objek / Lokasi</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleSprint}
            aria-pressed={sprintLocked}
            title={sprintLocked ? 'Mod Lari Aktif' : 'Klik untuk Togol Lari'}
            className={`pointer-events-auto w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition-transform hover:scale-105 ${
              sprintLocked
                ? 'bg-[#E7C878] border-[#FFFFFF] text-[#103D30]'
                : 'bg-[rgba(16,61,48,0.92)] border-[#E7C878] text-[#FFF4CC]'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="14" cy="4.5" r="2" />
              <path d="M7 17l3-4 2.5 2.5 4.5-6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.5 10.5l3.5-2 3 3h3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 20l4-3" strokeLinecap="round" />
            </svg>
            <span className="text-[8px] font-extrabold uppercase leading-none">
              {sprintLocked ? 'LARI' : 'JALAN'}
            </span>
          </button>
        </div>

        {/* Bottom-Center: Interactive [E] Prompt + Professor Nurin Dialogue Box */}
        <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col items-center gap-2">
          {/* Proximity [E] Interaction Banner */}
          {(nearbyClueObj || nearbyZoneObj) && (
            <button
              type="button"
              onClick={onInteractPrompt}
              className="pointer-events-auto inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#FFF2B2] via-[#E7C878] to-[#D4A63E] text-[#103D30] border-2 border-[#FFFFFF] shadow-[0_8px_24px_rgba(16,61,48,0.6)] font-extrabold text-xs sm:text-sm hover:scale-[1.03] transition-transform"
            >
              <kbd className="px-2 py-0.5 rounded bg-[#103D30] text-[#FFF4CC] font-mono-tabular text-xs font-extrabold">
                E
              </kbd>
              <span>
                {nearbyClueObj
                  ? `PERIKSA BUKTI: ${nearbyClueObj.label}`
                  : `SIASAT LOKASI: ${nearbyZoneObj?.name.toUpperCase()}`}
              </span>
            </button>
          )}

          {/* Professor Nurin Cream Parchment Dialogue Box matching Reference */}
          <div className="pointer-events-auto relative w-full rounded-2xl bg-[#F5E8CF] border-[3px] border-[#C99B3B] shadow-[0_14px_34px_rgba(9,33,26,0.58)] pl-3 sm:pl-4 pr-3 py-2.5 flex items-center gap-3">
            {/* Professor Portrait */}
            <ProfesorCitraPortrait
              realistic
              className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 -mt-5 sm:-mt-6 shadow-xl"
            />

            {/* Header Ribbon + Dialogue Content */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#174C39] border border-[#E7C878] text-[#FFF4CC] text-[11px] font-display font-bold shadow -mt-6 mb-1">
                <span>Professor Nurin</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#1E3127] leading-snug line-clamp-2">
                {dialogueText}
              </p>
            </div>

            {/* Next Hint Button */}
            <button
              type="button"
              onClick={onAdvanceHint}
              title="Dengar petunjuk seterusnya daripada Profesor Nurin"
              aria-label="Petunjuk seterusnya daripada Profesor Nurin"
              className="w-9 h-9 rounded-full bg-[#174C39] hover:bg-[#103D30] border border-[#E7C878] text-[#FFF4CC] flex items-center justify-center shrink-0 shadow transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </button>
          </div>
        </div>

        {/* Bottom-Right: Square Icon Action Deck (Jurnal Detektif, Lencana Ejen, Inventori) */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {allDone && (
            <button
              type="button"
              onClick={onProceedToPhase2}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFF2B2] via-[#E7C878] to-[#D4A63E] text-[#103D30] border-2 border-[#FFFFFF] text-xs font-extrabold shadow-xl hover:brightness-105 transition-all"
            >
              <span>Fasa 2: Makmal Kes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenJournal}
              className="w-[74px] sm:w-[82px] py-2 px-1.5 rounded-xl bg-[rgba(16,61,48,0.94)] hover:bg-[#174C39] border-2 border-[#E7C878] text-[#FFF4CC] shadow-xl flex flex-col items-center gap-1 transition-transform hover:-translate-y-0.5"
            >
              <BookOpen className="w-6 h-6 text-[#E7C878]" />
              <span className="text-[10px] font-bold leading-tight text-center">
                Jurnal Detektif
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenBadges}
              className="w-[74px] sm:w-[82px] py-2 px-1.5 rounded-xl bg-[rgba(16,61,48,0.94)] hover:bg-[#174C39] border-2 border-[#E7C878] text-[#FFF4CC] shadow-xl flex flex-col items-center gap-1 transition-transform hover:-translate-y-0.5"
            >
              <Award className="w-6 h-6 text-[#E7C878]" />
              <span className="text-[10px] font-bold leading-tight text-center">
                Lencana Ejen
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenInventory}
              className="w-[74px] sm:w-[82px] py-2 px-1.5 rounded-xl bg-[rgba(16,61,48,0.94)] hover:bg-[#174C39] border-2 border-[#E7C878] text-[#FFF4CC] shadow-xl flex flex-col items-center gap-1 transition-transform hover:-translate-y-0.5"
            >
              <Backpack className="w-6 h-6 text-[#E7C878]" />
              <span className="text-[10px] font-bold leading-tight text-center">Inventori</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
