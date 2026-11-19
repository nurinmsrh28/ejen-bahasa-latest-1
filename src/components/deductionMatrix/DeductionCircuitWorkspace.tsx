import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Cpu,
  Fingerprint,
  HelpCircle,
  Link2,
  Pencil,
  RotateCcw,
  Save,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { LOCATION_MAP } from '../../game/data';
import { countWords } from '../../game/rules';
import type { GameState, LocationId } from '../../game/types';
import {
  CASE_FILE_META,
  INTERACTIVE_STARTERS,
  evaluateOpinionFeedback,
} from '../DetectiveDeductionLab';
import { LOCATION_PHOTO_URLS } from '../LocationScenes';

export type MatrixStageId = 'vault' | 'select' | 'circuit' | 'scanner' | 'decision';

interface DeductionCircuitWorkspaceProps {
  state: GameState;
  activeStage: Extract<MatrixStageId, 'circuit' | 'scanner' | 'decision'>;
  selectedIds: LocationId[];
  focusedLocId: LocationId;
  draftOpinions: Record<LocationId, string>;
  textareaRefs: React.MutableRefObject<Partial<Record<LocationId, HTMLTextAreaElement | null>>>;
  scanningLoc: LocationId | null;
  canProceed: boolean;
  error: string;
  savedNotice: string | null;
  onSelectFocusedLoc: (locId: LocationId) => void;
  onDraftChange: (locId: LocationId, value: string) => void;
  onInsertText: (locId: LocationId, text: string) => void;
  onClearOpinion: (locId: LocationId) => void;
  onSaveSingleOpinion: (locId: LocationId) => boolean;
  onSaveAll: () => void;
  onRunScanner: (locId: LocationId) => void;
  onSwitchStage: (stage: MatrixStageId) => void;
  onProceedToPhase3: () => void;
}

const REASON_CONNECTORS = [
  { label: '+ supaya...', text: 'supaya ' },
  { label: '+ agar...', text: 'agar ' },
  { label: '+ kerana...', text: 'kerana ' },
  { label: '+ demi keselesaan murid.', text: 'demi keselesaan murid.' },
];

export function DeductionCircuitWorkspace({
  state,
  activeStage,
  selectedIds,
  focusedLocId,
  draftOpinions,
  textareaRefs,
  scanningLoc,
  canProceed,
  error,
  savedNotice,
  onSelectFocusedLoc,
  onDraftChange,
  onInsertText,
  onClearOpinion,
  onSaveSingleOpinion,
  onSaveAll,
  onRunScanner,
  onSwitchStage,
  onProceedToPhase3,
}: DeductionCircuitWorkspaceProps) {
  const activeLocId = selectedIds.includes(focusedLocId)
    ? focusedLocId
    : selectedIds[0] || focusedLocId;

  const loc = LOCATION_MAP[activeLocId];
  const inv = state.investigations[activeLocId];
  const meta = CASE_FILE_META[activeLocId];
  const draftText = draftOpinions[activeLocId] || '';
  const words = countWords(draftText);
  const feedback = evaluateOpinionFeedback(
    draftText,
    activeLocId,
    inv.notes,
    inv.initialProposal
  );
  const passedCriteria = [
    feedback.completeness.met,
    feedback.evidenceLink.met,
    feedback.clarity.met,
  ].filter(Boolean).length;

  const isScanning = scanningLoc === activeLocId;

  const detectedKeywords = meta.domainKeywords.filter((kw) =>
    draftText.toLowerCase().includes(kw)
  );

  if (selectedIds.length < 2) {
    return (
      <div className="rounded-2xl bg-[#0B332C]/95 border-2 border-[#FFD45C]/80 p-6 text-center space-y-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
        <div className="w-12 h-12 rounded-2xl bg-[#123E34] border border-[#FFD45C] text-[#FFD45C] flex items-center justify-center mx-auto">
          <Fingerprint className="w-6 h-6" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="font-display text-lg font-extrabold text-[#FFFFFF]">
            Pilih Sekurang-kurangnya 2 Bukti Lokasi Dahulu
          </h3>
          <p className="text-xs sm:text-sm text-[#DCE9DF] leading-relaxed">
            Sebelum membina pendapat di Deduction Circuit atau menguji hujah di Logic Scanner, sila pilih 2 hingga 3 kes di Secret Evidence Vault.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSwitchStage('vault')}
          className="min-h-[42px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-b from-[#FFE68A] via-[#D9B45B] to-[#B6842A] text-[#092D27] text-xs sm:text-sm font-extrabold border border-[#FFFFFF]"
        >
          <span>Kembali ke Secret Evidence Vault</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Case Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#07231E]/90 border border-[#36D9FF]/45 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#36D9FF] mr-1">
            KES DIPILIH:
          </span>
          {selectedIds.map((id) => {
            const itemLoc = LOCATION_MAP[id];
            const isCurrent = id === activeLocId;
            const isSaved = (state.opinions[id]?.opinionText || '').trim().length >= 10;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectFocusedLoc(id)}
                className={`min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                  isCurrent
                    ? 'bg-[#FFD45C] text-[#092D27] border-[#FFFFFF] shadow-[0_0_16px_rgba(255,212,92,0.45)]'
                    : 'bg-[#123E34] text-[#DCE9DF] border-[#36D9FF]/40 hover:border-[#36D9FF]'
                }`}
              >
                <span>{itemLoc.shortName}</span>
                {isSaved && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#092D27]' : 'text-[#00BFA6]'}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onSwitchStage('vault')}
          className="text-xs font-bold text-[#36D9FF] hover:text-[#FFFFFF] underline-offset-4 hover:underline"
        >
          ← Lihat Secret Evidence Vault
        </button>
      </div>

      {/* Feedback / Validation Notices */}
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-[#4A1C1C]/95 border border-[#FF8F8F] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#FFE5E5] flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-[#FF9B9B]" />
          <span>{error}</span>
        </div>
      )}

      {savedNotice && (
        <div
          role="status"
          className="rounded-xl bg-[#0D4437]/95 border border-[#00BFA6] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#E8FFF9] flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00BFA6]" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* STAGE 03: DEDUCTION CIRCUIT — BINA PENDAPAT EJEN */}
      {activeStage === 'circuit' && (
        <div className="rounded-2xl bg-gradient-to-b from-[#0D3830]/95 to-[#07211C]/95 border-2 border-[#36D9FF]/75 p-4 sm:p-5 space-y-4 shadow-[0_18px_45px_rgba(0,0,0,0.5)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#36D9FF]/30 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[#123E34] border border-[#36D9FF] text-[#36D9FF] flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </span>
              <div>
                <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-widest text-[#36D9FF]">
                  TAHAP 03 · DEDUCTION CIRCUIT
                </p>
                <h3 className="font-display text-base sm:text-lg font-extrabold text-[#FFFFFF]">
                  Bina Pendapat Ejen — {loc.name}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono-tabular text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#123E34] border border-[#FFD45C]/50 text-[#FFD45C]">
                {words} perkataan · {passedCriteria}/3 kriteria
              </span>
            </div>
          </div>

          {/* 4 Connected Holographic Nodes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            {/* NODE A: BUKTI UTAMA */}
            <div className="lg:col-span-5 rounded-xl bg-[#07231E] border border-[#36D9FF]/45 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-mono-tabular text-[11px] font-bold text-[#36D9FF] uppercase">
                  <Fingerprint className="w-3.5 h-3.5" />
                  Node A · Bukti Utama
                </span>
                <span className="text-[10px] text-[#DCE9DF]/80">Klik atau seret ke Node C</span>
              </div>

              <div className="space-y-1.5">
                {loc.clues.map((clue) => {
                  const found = inv.discoveredClueIds.includes(clue.id);
                  const chipPhrase = clue.label.toLowerCase();
                  return (
                    <button
                      key={clue.id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', `${chipPhrase} `);
                      }}
                      onClick={() => onInsertText(activeLocId, `${chipPhrase} `)}
                      className={`w-full text-left rounded-lg p-2 border transition-all flex items-start gap-2 ${
                        found
                          ? 'bg-[#123E34]/85 hover:bg-[#195346] border-[#00BFA6]/55 text-[#F5F0E5]'
                          : 'bg-[#092923] hover:bg-[#103A31] border-[#36D9FF]/25 text-[#DCE9DF]'
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5 text-[#36D9FF] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-snug">{clue.label}</p>
                        <p className="text-[11px] text-[#DCE9DF]/85 leading-snug">
                          {clue.issueSummary}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {inv.notes.trim() && (
                <div className="rounded-lg bg-[#0B332C] border border-[#D9B45B]/45 p-2.5">
                  <p className="font-mono-tabular text-[10px] font-bold text-[#FFD45C] uppercase mb-0.5">
                    Nota Fasa 1 Anda
                  </p>
                  <p className="text-[11px] text-[#F5F0E5] leading-snug line-clamp-2">
                    {inv.notes}
                  </p>
                </div>
              )}
            </div>

            {/* NODE B + C + D Column */}
            <div className="lg:col-span-7 space-y-3">
              {/* NODE B: ISU / MASALAH */}
              <div className="rounded-xl bg-[#F5F0E5] text-[#092D27] border-2 border-[#D9B45B] p-3 space-y-1">
                <div className="flex items-center gap-1.5 font-mono-tabular text-[11px] font-extrabold uppercase text-[#123E34]">
                  <HelpCircle className="w-3.5 h-3.5 text-[#A98135]" />
                  <span>Node B · Soalan Rangsangan & Isu</span>
                </div>
                <p className="text-xs sm:text-sm font-bold leading-snug text-[#092D27]">
                  {meta.stimulatingQuestion}
                </p>
              </div>

              {/* NODE C: PENDAPAT EJEN */}
              <div className="rounded-xl bg-[#07231E] border-2 border-[#FFD45C]/80 p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-mono-tabular text-[11px] font-bold uppercase text-[#FFD45C]">
                    <Brain className="w-3.5 h-3.5" />
                    Node C · Ayat Pendapat Ejen
                  </span>

                  <button
                    type="button"
                    onClick={() => onClearOpinion(activeLocId)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#DCE9DF] hover:text-[#FFD45C]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Kosongkan</span>
                  </button>
                </div>

                {/* Interactive Starters */}
                <div className="flex flex-wrap gap-1.5">
                  {INTERACTIVE_STARTERS.map((starter) => (
                    <button
                      key={starter.label}
                      type="button"
                      onClick={() => onInsertText(activeLocId, starter.insertText)}
                      className="px-2.5 py-1 rounded-lg bg-[#123E34] hover:bg-[#1A584A] border border-[#36D9FF]/55 text-[11px] font-bold text-[#36D9FF] transition-colors"
                    >
                      + {starter.label}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={(el) => {
                    textareaRefs.current[activeLocId] = el;
                  }}
                  value={draftText}
                  onChange={(e) => onDraftChange(activeLocId, e.target.value)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dropped = e.dataTransfer.getData('text/plain');
                    if (dropped) {
                      onInsertText(activeLocId, dropped);
                    }
                  }}
                  rows={3}
                  maxLength={500}
                  placeholder="Contoh: Pada pendapat saya, pihak sekolah perlu menyediakan tong sampah yang lebih besar di Kantin Ceria supaya sampah tidak melimpah."
                  className="w-full rounded-xl bg-[#051B17] border border-[#36D9FF]/50 focus:border-[#FFD45C] focus:outline-none px-3 py-2.5 text-xs sm:text-sm text-[#FFFFFF] placeholder-[#DCE9DF]/50 leading-relaxed resize-y"
                />

                {/* Detected Keywords Live Indicator */}
                {detectedKeywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#00BFA6]">Kata kunci bukti dikesan:</span>
                    {detectedKeywords.slice(0, 5).map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded bg-[#00BFA6]/20 border border-[#00BFA6]/50 font-mono-tabular text-[10px] font-bold text-[#8FF7E9]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* NODE D: ALASAN / JUSTIFIKASI + ACTIONS */}
                <div className="pt-1.5 border-t border-[#36D9FF]/25 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#00BFA6] mr-1">
                      Node D · Penyambung Alasan:
                    </span>
                    {REASON_CONNECTORS.map((conn) => (
                      <button
                        key={conn.label}
                        type="button"
                        onClick={() => onInsertText(activeLocId, conn.text)}
                        className="px-2 py-0.5 rounded bg-[#0D3830] hover:bg-[#144E43] border border-[#00BFA6]/50 text-[11px] font-semibold text-[#8FF7E9]"
                      >
                        {conn.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSaveSingleOpinion(activeLocId)}
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00BFA6] hover:bg-[#19D4BB] text-[#092D27] text-xs font-extrabold border border-[#FFFFFF]/70 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Pendapat Kes Ini</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onRunScanner(activeLocId);
                        onSwitchStage('scanner');
                      }}
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-b from-[#FFE68A] via-[#D9B45B] to-[#B6842A] hover:brightness-105 text-[#092D27] text-xs font-extrabold border border-[#FFFFFF] shadow-[0_0_18px_rgba(255,212,92,0.35)]"
                    >
                      <ScanSearch className="w-4 h-4" />
                      <span>Imbas & Uji Kekuatan Hujah</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 04: LOGIC SCANNER — UJIAN KEKUATAN HUJAH */}
      {activeStage === 'scanner' && (
        <div className="rounded-2xl bg-gradient-to-b from-[#0D3830]/95 to-[#07211C]/95 border-2 border-[#36D9FF]/80 p-4 sm:p-5 space-y-4 shadow-[0_18px_45px_rgba(0,0,0,0.5)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#36D9FF]/30 pb-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-9 h-9 rounded-xl bg-[#123E34] border border-[#36D9FF] text-[#36D9FF] flex items-center justify-center ${
                  isScanning ? 'animate-pulse' : ''
                }`}
              >
                <ScanSearch className="w-5 h-5" />
              </span>
              <div>
                <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-widest text-[#36D9FF]">
                  TAHAP 04 · LOGIC SCANNER
                </p>
                <h3 className="font-display text-base sm:text-lg font-extrabold text-[#FFFFFF]">
                  Ujian Kekuatan Hujah — {loc.name}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRunScanner(activeLocId)}
                className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#123E34] hover:bg-[#195346] border border-[#36D9FF]/60 text-xs font-bold text-[#36D9FF]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isScanning ? 'Mengimbas...' : 'Imbas Semula'}</span>
              </button>
              <button
                type="button"
                onClick={() => onSwitchStage('circuit')}
                className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#123E34] hover:bg-[#195346] border border-[#FFD45C]/60 text-xs font-bold text-[#FFD45C]"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Ayat</span>
              </button>
            </div>
          </div>

          {/* Current Opinion Preview Box */}
          <div className="rounded-xl bg-[#051B17] border border-[#D9B45B]/55 p-3.5 space-y-1.5">
            <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-[#FFD45C]">
              Ayat Pendapat Semasa ({words} perkataan)
            </p>
            <p className="text-xs sm:text-sm text-[#FFFFFF] leading-relaxed">
              {draftText.trim() || 'Belum ada ayat pendapat ditulis. Klik "Edit Ayat" untuk mula menulis.'}
            </p>
          </div>

          {/* 3 Real Feedback Rubric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                code: '01',
                title: 'Kelengkapan Ayat',
                item: feedback.completeness,
              },
              {
                code: '02',
                title: 'Perkaitan dengan Bukti',
                item: feedback.evidenceLink,
              },
              {
                code: '03',
                title: 'Kejelasan Pendapat',
                item: feedback.clarity,
              },
            ].map((criterion) => (
              <div
                key={criterion.code}
                className={`rounded-xl p-3.5 border transition-colors ${
                  criterion.item.met
                    ? 'bg-[#0E4035]/90 border-[#00BFA6]/80'
                    : 'bg-[#17362F]/90 border-[#FFD45C]/55'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono-tabular text-[11px] font-bold text-[#36D9FF]">
                    {criterion.code} · {criterion.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono-tabular text-[10px] font-extrabold ${
                      criterion.item.met
                        ? 'bg-[#00BFA6] text-[#092D27]'
                        : 'bg-[#FFD45C] text-[#092D27]'
                    }`}
                  >
                    {criterion.item.met ? 'LULUS' : 'PERLU BAIKI'}
                  </span>
                </div>
                <p className="text-xs text-[#DCE9DF] leading-relaxed">{criterion.item.message}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => onSaveSingleOpinion(activeLocId)}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00BFA6] hover:bg-[#19D4BB] text-[#092D27] text-xs font-extrabold border border-[#FFFFFF]/70"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pendapat {loc.shortName}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (draftText.trim().length >= 10) {
                  onSaveSingleOpinion(activeLocId);
                }
                onSwitchStage('decision');
              }}
              className="min-h-[40px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-b from-[#FFE68A] via-[#D9B45B] to-[#B6842A] hover:brightness-105 text-[#092D27] text-xs font-extrabold border border-[#FFFFFF]"
            >
              <span>Semak & Simpan Keputusan Ejen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 05: SIMPAN KEPUTUSAN — KAD KEPUTUSAN EJEN */}
      {activeStage === 'decision' && (
        <div className="rounded-2xl bg-gradient-to-b from-[#0D3830]/95 to-[#07211C]/95 border-2 border-[#FFD45C]/85 p-4 sm:p-5 space-y-4 shadow-[0_18px_45px_rgba(0,0,0,0.5)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#FFD45C]/30 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[#123E34] border border-[#FFD45C] text-[#FFD45C] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-widest text-[#FFD45C]">
                  TAHAP 05 · KAD KEPUTUSAN EJEN
                </p>
                <h3 className="font-display text-base sm:text-lg font-extrabold text-[#FFFFFF]">
                  Rumusan & Simpan Keputusan Fasa 2
                </h3>
              </div>
            </div>

            <span className="font-mono-tabular text-xs font-bold px-3 py-1 rounded-lg bg-[#123E34] border border-[#36D9FF]/50 text-[#36D9FF]">
              {selectedIds.length} Kes Dipilih
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedIds.map((id) => {
              const cardLoc = LOCATION_MAP[id];
              const cardInv = state.investigations[id];
              const cardDraft = draftOpinions[id] || '';
              const cardSaved = (state.opinions[id]?.opinionText || '').trim().length >= 10;
              const cardEval = evaluateOpinionFeedback(
                cardDraft,
                id,
                cardInv.notes,
                cardInv.initialProposal
              );
              const score = [
                cardEval.completeness.met,
                cardEval.evidenceLink.met,
                cardEval.clarity.met,
              ].filter(Boolean).length;

              return (
                <div
                  key={id}
                  className="rounded-xl bg-[#07231E] border border-[#36D9FF]/45 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={LOCATION_PHOTO_URLS[id]}
                        alt={cardLoc.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-8 rounded object-cover border border-[#D9B45B]/60 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-[#FFFFFF] truncate">
                          {cardLoc.name}
                        </p>
                        <p className="font-mono-tabular text-[10px] text-[#36D9FF]">
                          {cardInv.discoveredClueIds.length}/{cardLoc.clues.length} bukti · {score}/3 kriteria
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectFocusedLoc(id);
                        onSwitchStage('circuit');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#123E34] hover:bg-[#195346] border border-[#36D9FF]/45 text-[11px] font-bold text-[#36D9FF]"
                    >
                      Edit
                    </button>
                  </div>

                  <p className="text-xs text-[#F5F0E5] bg-[#051B17] rounded-lg p-2.5 border border-[#36D9FF]/20 leading-relaxed">
                    {cardDraft.trim() || 'Belum diisi — klik Edit untuk menulis ayat pendapat.'}
                  </p>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className={cardSaved ? 'text-[#00BFA6] font-bold' : 'text-[#FFD45C] font-bold'}>
                      {cardSaved ? '✓ Disimpan dalam Kad Keputusan' : 'Menunggu simpanan rasmi'}
                    </span>
                    <Target className="w-3.5 h-3.5 text-[#36D9FF]" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#36D9FF]/25">
            <button
              type="button"
              onClick={onSaveAll}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#00BFA6] hover:bg-[#19D4BB] text-[#092D27] text-xs sm:text-sm font-extrabold border border-[#FFFFFF]/80 shadow-[0_0_18px_rgba(0,191,166,0.3)]"
            >
              <Save className="w-4 h-4" />
              <span>SIMPAN KE KAD KEPUTUSAN EJEN</span>
            </button>

            <button
              type="button"
              disabled={!canProceed}
              onClick={onProceedToPhase3}
              className={`min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition-all ${
                canProceed
                  ? 'bg-gradient-to-b from-[#FFE68A] via-[#D9B45B] to-[#B6842A] hover:brightness-105 text-[#092D27] border-[#FFFFFF] shadow-[0_0_24px_rgba(255,212,92,0.45)]'
                  : 'bg-[#123E34]/60 text-[#DCE9DF]/55 border-[#36D9FF]/25 cursor-not-allowed'
              }`}
            >
              <span>TERUSKAN KE FASA 3: BUKTIKAN TEORI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
