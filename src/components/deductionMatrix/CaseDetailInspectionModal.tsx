import React, { useEffect } from 'react';
import {
  CheckCircle2,
  FileText,
  HelpCircle,
  Lock,
  PlusCircle,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { LOCATION_MAP } from '../../game/data';
import type { GameState, LocationId } from '../../game/types';
import { CASE_FILE_META } from '../DetectiveDeductionLab';
import { LOCATION_HOTSPOTS, LOCATION_PHOTO_URLS } from '../LocationScenes';

interface CaseDetailInspectionModalProps {
  state: GameState;
  locationId: LocationId;
  isSelected: boolean;
  selectedCount: number;
  onToggleSelect: (locId: LocationId) => void;
  onProceedToDeduction: (locId: LocationId) => void;
  onClose: () => void;
}

export function CaseDetailInspectionModal({
  state,
  locationId,
  isSelected,
  selectedCount,
  onToggleSelect,
  onProceedToDeduction,
  onClose,
}: CaseDetailInspectionModalProps) {
  const loc = LOCATION_MAP[locationId];
  const inv = state.investigations[locationId];
  const meta = CASE_FILE_META[locationId];
  const hotspots = LOCATION_HOTSPOTS[locationId];
  const photoUrl = LOCATION_PHOTO_URLS[locationId];
  const LocIcon = meta.icon;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Teliti Fail Kes: ${loc.name}`}
      className="fixed inset-0 z-50 bg-[#051C18]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="p1-toast-enter relative w-full max-w-4xl rounded-2xl bg-gradient-to-b from-[#0F3931] via-[#0A2D27] to-[#07201C] border-2 border-[#36D9FF] shadow-[0_24px_60px_rgba(0,0,0,0.7)] text-[#F5F0E5] overflow-hidden"
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-[#07211C] border-b border-[#36D9FF]/45 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#123E34] border border-[#FFD45C] text-[#FFD45C] flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(255,212,92,0.3)]">
              <LocIcon className="w-5 h-5" />
            </span>
            <div>
              <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-widest text-[#36D9FF]">
                {meta.caseNumber} · {loc.zoneLabel}
              </p>
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#FFFFFF]">
                {loc.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup paparan fail kes"
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#123E34] hover:bg-[#195447] border border-[#36D9FF]/60 text-xs font-bold text-[#DCE9DF] transition-colors"
          >
            <X className="w-4 h-4 text-[#36D9FF]" />
            <span>Tutup</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Photograph + Clues */}
            <div className="md:col-span-6 space-y-3">
              <div className="relative rounded-xl overflow-hidden border-2 border-[#D9B45B] bg-[#061D19] aspect-[16/10] shadow-lg">
                <img
                  src={photoUrl}
                  alt={`Gambar lokasi siasatan ${loc.name}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-[#092D27]/90 border border-[#36D9FF]/60 font-mono-tabular text-[10px] font-bold text-[#36D9FF]">
                  {inv.discoveredClueIds.length}/{loc.clues.length} BUKTI LAPANGAN
                </span>
              </div>

              {/* 3 Clues with Mini Zoom Crops */}
              <div className="rounded-xl bg-[#07211C] border border-[#36D9FF]/35 p-3 space-y-2">
                <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#36D9FF] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" />
                  <span>Bukti Dikesan di Lokasi</span>
                </p>
                <div className="space-y-2">
                  {loc.clues.map((clue) => {
                    const found = inv.discoveredClueIds.includes(clue.id);
                    const coord = hotspots.find((h) => h.clueId === clue.id);
                    return (
                      <div
                        key={clue.id}
                        className={`rounded-lg p-2.5 border flex items-start gap-2.5 ${
                          found
                            ? 'bg-[#123E34]/85 border-[#00BFA6]/60'
                            : 'bg-[#092822] border-[#36D9FF]/20 opacity-75'
                        }`}
                      >
                        <div
                          className="w-12 h-10 rounded-md border border-[#D9B45B]/55 bg-[#061D19] shrink-0 bg-no-repeat"
                          style={{
                            backgroundImage: `url(${photoUrl})`,
                            backgroundPosition: coord
                              ? `${coord.xPercent}% ${coord.yPercent}%`
                              : '50% 50%',
                            backgroundSize: '280%',
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#FFFFFF] flex items-center justify-between gap-2">
                            <span>{clue.label}</span>
                            {found ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#00BFA6] shrink-0" />
                            ) : (
                              <Lock className="w-3 h-3 text-[#DCE9DF]/60 shrink-0" />
                            )}
                          </p>
                          <p className="text-[11px] text-[#DCE9DF] leading-snug mt-0.5">
                            {clue.issueSummary}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Ringkasan Kes, Soalan Utama & Student Fasa 1 Notes */}
            <div className="md:col-span-6 space-y-3.5">
              <div className="rounded-xl bg-[#F5F0E5] text-[#092D27] border-2 border-[#D9B45B] p-4 space-y-2 shadow-md">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#123E34]">
                  <HelpCircle className="w-4 h-4 text-[#A98135]" />
                  <span>Soalan Utama Penyiasatan</span>
                </div>
                <p className="font-display text-sm sm:text-base font-bold text-[#092D27] leading-snug">
                  {meta.stimulatingQuestion}
                </p>
              </div>

              <div className="rounded-xl bg-[#0C352E] border border-[#36D9FF]/40 p-3.5 space-y-1.5">
                <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#36D9FF]">
                  Ringkasan Kes
                </p>
                <p className="text-xs sm:text-sm text-[#DCE9DF] leading-relaxed">{loc.briefing}</p>
              </div>

              <div className="rounded-xl bg-[#07211C] border border-[#D9B45B]/45 p-3.5 space-y-1.5">
                <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#FFD45C] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Catatan Pemerhatian Murid (Fasa 1)</span>
                </p>
                <p className="text-xs sm:text-sm text-[#F5F0E5] leading-relaxed">
                  {inv.notes.trim() || 'Tiada catatan direkodkan dalam Fasa 1.'}
                </p>
              </div>

              <div className="rounded-xl bg-[#07211C] border border-[#00BFA6]/45 p-3.5 space-y-1.5">
                <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#00BFA6]">
                  Cadangan Penyelesaian Awal
                </p>
                <p className="text-xs sm:text-sm text-[#F5F0E5] leading-relaxed">
                  {inv.initialProposal.trim() || 'Tiada cadangan awal direkodkan.'}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-[#36D9FF]/30 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono-tabular text-xs font-bold text-[#36D9FF]">
              BUKTI DIPILIH: {selectedCount}/3 (Min 2 · Maks 3)
            </span>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onToggleSelect(locationId)}
                className={`min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition-all ${
                  isSelected
                    ? 'bg-[#123E34] hover:bg-[#195447] text-[#FFD45C] border-[#FFD45C]'
                    : 'bg-gradient-to-b from-[#FFE68A] via-[#D9B45B] to-[#B6842A] hover:brightness-105 text-[#092D27] border-[#FFFFFF]'
                }`}
              >
                {isSelected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#00BFA6]" />
                    <span>Keluarkan dari Rak Bukti</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Pilih Kes ke Rak Bukti</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isSelected && selectedCount < 3) {
                    onToggleSelect(locationId);
                  }
                  onProceedToDeduction(locationId);
                }}
                className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00BFA6] hover:bg-[#18D6BD] text-[#092D27] text-xs sm:text-sm font-extrabold border border-[#FFFFFF]/70 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Buka Deduction Circuit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
