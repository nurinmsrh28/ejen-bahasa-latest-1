import React, { useState } from 'react';
import {
  ArrowLeft,
  Award,
  Download,
  Eye,
  FileEdit,
  Printer,
  Save,
} from 'lucide-react';
import {
  DESIGN_ACTIONS,
  FACILITY_ASSET_MAP,
  GRID_COLS,
  GRID_ROWS,
  LOCATION_MAP,
} from '../game/data';
import { countSentences, countWords, getAgentRank, validateFinalReport } from '../game/rules';
import type { GameState } from '../game/types';
import { AcademyEmblem, BadgeIconSvg, FacilityIconSvg } from './DetectiveArt';

interface Phase5ReportProps {
  state: GameState;
  onSaveReport: (reportText: string) => void;
  onBackToHq: () => void;
  onExportJson: () => void;
}

export function Phase5Report({
  state,
  onSaveReport,
  onBackToHq,
  onExportJson,
}: Phase5ReportProps) {
  const [reportText, setReportText] = useState(state.finalReportText);
  const [previewMode, setPreviewMode] = useState(state.finalReportSaved);
  const [error, setError] = useState('');
  const [savedBanner, setSavedBanner] = useState(false);

  const sentenceCount = countSentences(reportText);
  const wordCount = countWords(reportText);
  const justifiedFacilities = state.builderPlan.filter(
    (item) => (item.justification || '').trim().length >= 8
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateFinalReport(reportText);
    if (!check.valid) {
      setError(check.error || 'Sila semak panjang laporan (3–5 ayat).');
      return;
    }
    setError('');
    onSaveReport(reportText.trim());
    setSavedBanner(true);
    setPreviewMode(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-[#26382F]">
      {/* Header */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 border-b border-[#A8C5A0] pb-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBackToHq}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E5338] hover:text-[#315C48] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Pusat Operasi
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#315C48]">
            Produk Akhir · Laporan Sekolah Impian
          </h1>
          <p className="text-sm text-[#445A4F]">
            Gabungkan maklumat siasatan, pendapat, alasan dan pelan anda menjadi satu laporan rasmi
            sepanjang 3 hingga 5 ayat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F0E5] border border-[#A8C5A0] text-[#26382F] text-xs font-semibold shadow-sm"
          >
            {previewMode ? (
              <>
                <FileEdit className="w-4 h-4 text-[#6E5338]" />
                Sunting Laporan
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-[#6E5338]" />
                Pratonton Laporan
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#315C48] hover:bg-[#264938] text-[#FFFFFF] border border-[#E7C878] text-xs font-bold shadow-sm"
          >
            <Printer className="w-4 h-4 text-[#E7C878]" />
            Cetak Laporan
          </button>

          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E7C878] hover:bg-[#F0D68C] text-[#26382F] text-xs font-bold shadow-sm"
          >
            <Download className="w-4 h-4 text-[#26382F]" />
            Eksport JSON
          </button>
        </div>
      </div>

      {/* Achievement Banner when Final Report Saved */}
      {state.finalReportSaved && (
        <div className="no-print bg-[#315C48] text-[#FFFFFF] rounded-2xl p-5 border-2 border-[#E7C878] flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4">
            <BadgeIconSvg badgeId="arkitek_impian" earned={true} className="w-14 h-14 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#E7C878]">
                Lencana Tertinggi Dianugerahkan
              </p>
              <h2 className="font-display text-2xl font-bold">ARKITEK SEKOLAH IMPIAN</h2>
              <p className="text-xs text-[#F5F0E5]">
                Tahniah, {state.profile?.name || 'Ejen Pelatih'}! Operasi Sekolah Impian berjaya disempurnakan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono-tabular text-sm font-bold text-[#E7C878]">
            <Award className="w-5 h-5" />
            <span>{state.xp} XP · Operasi Lengkap</span>
          </div>
        </div>
      )}

      {!previewMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Reference Notes from Student's Own Work */}
          <aside className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl p-5 border-2 border-[#E7C878] shadow-sm space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#6E5338]">
                Rujukan Hasil Kerja Anda
              </p>
              <h2 className="font-display text-xl font-bold text-[#315C48]">
                Kad Keputusan & Pelan Anda
              </h2>
            </div>

            <div className="space-y-3">
              {state.selectedEvidenceIds.map((locId) => {
                const op = state.opinions[locId];
                return (
                  <div
                    key={locId}
                    className="bg-[#DCE9D9]/65 rounded-xl p-3.5 border border-[#A8C5A0] text-xs space-y-1.5"
                  >
                    <p className="font-bold text-[#315C48]">{LOCATION_MAP[locId]?.name || locId}</p>
                    <p className="text-[#26382F]">
                      <strong className="text-[#26382F]">Pendapat:</strong> {op?.opinionText || '-'}
                    </p>
                    <p className="text-[#26382F]">
                      <strong className="text-[#26382F]">Alasan:</strong> {op?.reasonText || '-'}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#A8C5A0]/60">
              <p className="text-xs font-bold uppercase tracking-wider text-[#6E5338]">
                Justifikasi Studio Arkitek ({justifiedFacilities.length})
              </p>
              {justifiedFacilities.map((fac) => (
                <div
                  key={fac.uid}
                  className="bg-[#F5F0E5] rounded-xl p-3 border border-[#A8C5A0]/70 text-xs"
                >
                  <p className="font-bold text-[#26382F]">
                    {FACILITY_ASSET_MAP[fac.assetId]?.name || fac.assetId} (
                    {DESIGN_ACTIONS.find((a) => a.id === fac.actionType)?.label || 'Diubah suai'})
                  </p>
                  <p className="text-[#445A4F] mt-0.5">{fac.justification}</p>
                </div>
              ))}
            </div>
          </aside>

          {/* Right: Free-Form Report Editor */}
          <form
            onSubmit={handleSave}
            className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl p-6 border-2 border-[#E7C878] shadow-sm space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#6E5338]">
                  Penulisan Bebas Ejen
                </p>
                <h2 className="font-display text-2xl font-bold text-[#315C48]">
                  Tulis Laporan Sekolah Impian (3–5 Ayat)
                </h2>
              </div>

              <div className="font-mono-tabular text-xs font-bold flex items-center gap-4 bg-[#DCE9D9] px-3.5 py-2 rounded-xl border border-[#A8C5A0]">
                <span
                  className={
                    sentenceCount >= 3 && sentenceCount <= 5
                      ? 'text-[#315C48]'
                      : 'text-[#9F432C]'
                  }
                >
                  Kiraan Ayat: {sentenceCount} / 3–5
                </span>
                <span className="text-[#26382F]">{wordCount} patah perkataan</span>
              </div>
            </div>

            <p className="text-xs text-[#26382F] leading-relaxed bg-[#F5F0E5] p-3.5 rounded-xl border border-[#E7C878]">
              Susun laporan anda sendiri berdasarkan pemerhatian di Sekolah Seri Bestari, pendapat
              utama, alasan yang relevan serta cadangan perubahan pada Pelan Sekolah Impian anda.
              Pastikan setiap ayat diakhiri dengan tanda noktah (.).
            </p>

            <div>
              <label htmlFor="final-report-textarea" className="sr-only">
                Teks Laporan Sekolah Impian
              </label>
              <textarea
                id="final-report-textarea"
                rows={8}
                value={reportText}
                onChange={(e) => {
                  setReportText(e.target.value);
                  setSavedBanner(false);
                  if (error) setError('');
                }}
                placeholder="Tulis laporan pendapat anda sepanjang 3 hingga 5 ayat di sini..."
                className="w-full rounded-xl p-4 bg-[#FFFFFF] border-2 border-[#A8C5A0] focus:border-[#315C48] focus:outline-none text-base leading-relaxed text-[#26382F] placeholder-[#6B7F77]"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-[#FBECE8] border border-[#C2593F] text-sm font-medium text-[#8C331D]"
              >
                {error}
              </div>
            )}

            {savedBanner && (
              <div
                role="status"
                className="p-3.5 rounded-xl bg-[#DCE9D9] border border-[#315C48]/40 text-sm font-semibold text-[#26382F]"
              >
                Laporan Sekolah Impian berjaya disimpan!
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#315C48] hover:bg-[#264938] border-2 border-[#E7C878] text-[#FFFFFF] font-bold text-sm shadow transition-colors"
              >
                <Save className="w-4 h-4 text-[#E7C878]" />
                Simpan Laporan & Pratonton
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Official Dossier Print Preview combining Report + Blueprint Plan */
        <article className="print-only-full bg-[#FFFFFF] text-[#26382F] rounded-2xl p-6 sm:p-10 border-2 border-[#E7C878] shadow-md space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#A8C5A0] pb-5">
            <div className="flex items-center gap-4">
              <AcademyEmblem className="w-14 h-14 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#6E5338]">
                  Akademi Ejen Rahsia · Sekolah Seri Bestari
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#315C48]">
                  Laporan Rasmi Sekolah Impian
                </h2>
              </div>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <p className="font-bold text-sm text-[#26382F]">
                {state.profile?.name || 'Ejen Pelatih'}
              </p>
              <p className="text-[#445A4F]">
                Kelas: {state.profile?.className || 'Sekolah Seri Bestari'} ·{' '}
                {getAgentRank(state.xp, state.finalReportSaved)}
              </p>
              <p className="font-mono-tabular text-[#6E5338] font-semibold">
                Jumlah Ayat: {countSentences(reportText)} · {state.xp} XP
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Written Report */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-display text-xl font-bold text-[#315C48]">
                1. Laporan Pendapat Ejen
              </h3>
              <div className="bg-[#F5F0E5] rounded-xl p-5 border border-[#E7C878] leading-relaxed text-base text-[#26382F] whitespace-pre-line">
                {reportText || 'Belum ada teks laporan ditulis.'}
              </div>

              <h3 className="font-display text-xl font-bold text-[#315C48] pt-2">
                2. Ringkasan Justifikasi Reka Bentuk
              </h3>
              <ul className="space-y-2 text-sm">
                {justifiedFacilities.map((fac) => (
                  <li
                    key={fac.uid}
                    className="p-3 rounded-xl bg-[#DCE9D9]/65 border border-[#A8C5A0] text-[#26382F]"
                  >
                    <strong className="text-[#315C48]">
                      {FACILITY_ASSET_MAP[fac.assetId]?.name || fac.assetId} (
                      {DESIGN_ACTIONS.find((a) => a.id === fac.actionType)?.label || 'Ubah Suai'})
                    </strong>
                    : {fac.justification}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Blueprint Snapshot */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="font-display text-xl font-bold text-[#315C48]">
                3. Pelan Sekolah Impian
              </h3>
              <div className="blueprint-grid-bg rounded-xl p-3 border-2 border-[#E7C878]">
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: GRID_ROWS }).map((_, row) =>
                    Array.from({ length: GRID_COLS }).map((__, col) => {
                      const occ = state.builderPlan.find((p) => p.row === row && p.col === col);
                      return (
                        <div
                          key={`${row}-${col}`}
                          className={`aspect-square rounded flex items-center justify-center ${
                            occ
                              ? 'bg-[#FFFFFF] border border-[#315C48]'
                              : 'bg-[#FFFFFF]/65 border border-[#A8C5A0]'
                          }`}
                        >
                          {occ && <FacilityIconSvg assetId={occ.assetId} className="w-5 h-5" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <p className="text-xs text-[#445A4F]">
                Pelan susunan kemudahan Sekolah Seri Bestari oleh{' '}
                {state.profile?.name || 'Ejen Pelatih'}.
              </p>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
