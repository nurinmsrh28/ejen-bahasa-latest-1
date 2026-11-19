import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  History,
  MessageSquarePlus,
  Send,
  X,
  XCircle,
} from 'lucide-react';
import { saveTeacherFeedback } from '../../game/teacherClient';
import type { TeacherFeedbackRecord } from '../../game/types';
import {
  formatDateTime,
  getAssessmentDecisionLabel,
  PHASE_LABELS,
  type InspectableSubmissionItem,
} from './teacherUtils';

interface TeacherResponseModalProps {
  item: InspectableSubmissionItem;
  existingFeedback: TeacherFeedbackRecord[];
  onClose: () => void;
  onFeedbackSaved: (saved: TeacherFeedbackRecord) => void;
}

export function TeacherResponseModal({
  item,
  existingFeedback,
  onClose,
  onFeedbackSaved,
}: TeacherResponseModalProps) {
  const latestTeacherNote = existingFeedback.find((f) => f.itemKey === item.itemKey);

  const [comment, setComment] = useState(latestTeacherNote?.comment || '');
  const [decision, setDecision] = useState<
    'cemerlang' | 'memuaskan' | 'perlu_bimbingan' | ''
  >(latestTeacherNote?.assessmentDecision || '');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const note = existingFeedback.find((f) => f.itemKey === item.itemKey);
    setComment(note?.comment || '');
    setDecision(note?.assessmentDecision || '');
    setStatusMsg(null);
  }, [item.itemKey, existingFeedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 2) {
      setStatusMsg({
        type: 'err',
        text: 'Sila tulis komen bimbingan guru sekurang-kurangnya 2 aksara.',
      });
      return;
    }
    setSaving(true);
    setStatusMsg(null);
    const res = await saveTeacherFeedback({
      studentUsername: item.studentUsername,
      phaseId: item.phaseId,
      itemKey: item.itemKey,
      comment: comment.trim(),
      assessmentDecision: decision,
    });
    setSaving(false);

    if (!res.ok || !res.feedback) {
      setStatusMsg({ type: 'err', text: res.error || 'Gagal menyimpan ulasan guru.' });
      return;
    }

    setStatusMsg({
      type: 'ok',
      text: 'Ulasan guru berjaya disimpan dalam rekod berasingan (jawapan asal murid dikekalkan).',
    });
    onFeedbackSaved(res.feedback);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="response-modal-title"
      className="no-print fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#092D27] border border-[#36D9FF]/45 shadow-[0_24px_60px_rgba(0,0,0,0.65)] text-[#F5F0E5]">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-[#092D27]/95 backdrop-blur-md px-5 py-4 border-b border-[#36D9FF]/25 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#36D9FF]">
              SEMAKAN JAWAPAN PENUH · {PHASE_LABELS[item.phaseId]}
            </p>
            <h2 id="response-modal-title" className="font-display text-xl font-bold text-white mt-0.5">
              {item.itemTitle}
            </h2>
            <p className="text-xs text-[#DCE9DF]/85 mt-1 font-mono-tabular">
              {item.studentName} · {item.studentId} · {item.className} ·{' '}
              <span className="text-[#D9B45B]">
                Dihantar: {formatDateTime(item.submittedAt)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup paparan jawapan"
            className="p-2 rounded-lg bg-[#123E34] border border-[#36D9FF]/30 text-[#DCE9DF] hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Prompt / Question & Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-xl bg-[#123E34]/85 border border-[#00BFA6]/30 p-4">
              <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-[#00BFA6] mb-1">
                Soalan / Arahan Tugasan Asal
              </p>
              <p className="text-sm text-[#F5F0E5] leading-relaxed">{item.question}</p>
            </div>

            <div className="rounded-xl bg-[#123E34]/85 border border-[#D9B45B]/35 p-4 flex flex-col justify-between">
              <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-[#D9B45B]">
                Penilaian Akademik Automatik
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono-tabular text-3xl font-extrabold text-white">
                  {item.scorePercent !== null ? `${item.scorePercent}%` : '—'}
                </span>
                <span className="text-xs text-[#DCE9DF]/75">Skor Kriteria</span>
              </div>
              <p className="text-[11px] text-[#DCE9DF]/80 mt-1">
                Status Ulasan: {getAssessmentDecisionLabel(latestTeacherNote?.assessmentDecision)}
              </p>
            </div>
          </div>

          {/* Verbatim Student Response (Warm Ivory Surface for high reading clarity) */}
          <div className="rounded-xl bg-[#F5F0E5] text-[#26382F] border border-[#D9B45B]/60 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-[#1D6652]/15 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1D6652]" />
                <h3 className="font-display text-base font-bold text-[#26382F]">
                  Jawapan Asal Murid (Rekod Kekal)
                </h3>
              </div>
              <span className="font-mono-tabular text-[11px] font-semibold text-[#1D6652]">
                Tidak boleh diubah oleh guru
              </span>
            </div>

            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-[#26382F]">
              {item.responseText}
            </p>

            {item.secondaryText && (
              <div className="pt-3 border-t border-[#1D6652]/15">
                <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#1D6652] mb-1">
                  {item.phaseId === 'phase1' ? 'Cadangan Penyelesaian Awal' : 'Maklumat Tambahan'}
                </p>
                <p className="text-sm text-[#26382F] whitespace-pre-wrap">{item.secondaryText}</p>
              </div>
            )}

            {item.selectedEvidence.length > 0 && (
              <div className="pt-3 border-t border-[#1D6652]/15">
                <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#1D6652] mb-1.5">
                  Bukti / Bahan Berkaitan Dipilih
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {item.selectedEvidence.map((ev, idx) => (
                    <span
                      key={`${ev}_${idx}`}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#DCE9DF] text-[#26382F] border border-[#1D6652]/20"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3-Criteria Breakdown (When applicable for Phase 2 & 3) */}
          {item.criteriaRows && item.criteriaRows.length > 0 && (
            <div className="rounded-xl bg-[#123E34]/80 border border-[#36D9FF]/25 p-4 space-y-2.5">
              <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#36D9FF]">
                Semakan 3 Kriteria Bahasa Melayu & Penaakulan
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {item.criteriaRows.map((c) => (
                  <div
                    key={c.label}
                    className={`rounded-lg p-3 border ${
                      c.met
                        ? 'bg-[#00BFA6]/10 border-[#00BFA6]/40'
                        : 'bg-[#C2593F]/15 border-[#E57B63]/45'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{c.label}</span>
                      {c.met ? (
                        <CheckCircle2 className="w-4 h-4 text-[#5BFFCA] shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#F29C85] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#DCE9DF]/90 leading-snug">{c.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Version History Comparison */}
          {item.historyVersions.length > 0 && (
            <div className="rounded-xl bg-[#123E34]/70 border border-white/10 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#D9B45B]" />
                  <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#D9B45B]">
                    Sejarah Versi & Perkembangan Jawapan ({item.historyVersions.length} rekod)
                  </p>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {item.historyVersions.map((ver) => (
                  <div
                    key={ver.id}
                    className="rounded-lg bg-[#092D27] border border-white/10 p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 font-mono-tabular text-[11px] text-[#36D9FF]">
                      <span>
                        Versi {ver.version} · {formatDateTime(ver.submittedAt)}
                      </span>
                      <span className="text-[#D9B45B] font-bold">
                        {ver.scorePercent !== null ? `Skor: ${ver.scorePercent}%` : 'Disimpan'}
                      </span>
                    </div>
                    <p className="text-[#F5F0E5] whitespace-pre-wrap">{ver.responseText}</p>
                    {ver.secondaryText && (
                      <p className="text-[#DCE9DF]/80 italic">Catatan: {ver.secondaryText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Separate Teacher Feedback Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-xl bg-[#123E34] border border-[#D9B45B]/45 p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-[#D9B45B]" />
                <h3 className="font-display text-base font-bold text-[#F5F0E5]">
                  Bimbingan & Ulasan Guru (Disimpan Berasingan)
                </h3>
              </div>
              {latestTeacherNote && (
                <span className="inline-flex items-center gap-1 font-mono-tabular text-[11px] text-[#DCE9DF]/80">
                  <Clock className="w-3.5 h-3.5 text-[#36D9FF]" />
                  Dikemaskini: {formatDateTime(latestTeacherNote.updatedAt)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#DCE9DF] mb-1">
                  Komen Konstruktif & Panduan Penambahbaikan
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tulis bimbingan khusus untuk membantu murid menambah baik ayat pendapat atau alasan..."
                  className="w-full rounded-xl bg-[#092D27] border border-[#36D9FF]/35 focus:border-[#D9B45B] focus:outline-none px-3.5 py-2.5 text-sm text-white placeholder-[#DCE9DF]/45"
                />
              </div>

              <div className="flex flex-col justify-between gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#DCE9DF] mb-1">
                    Keputusan Semakan Guru
                  </label>
                  <select
                    value={decision}
                    onChange={(e) =>
                      setDecision(
                        e.target.value as 'cemerlang' | 'memuaskan' | 'perlu_bimbingan' | ''
                      )
                    }
                    className="w-full rounded-xl bg-[#092D27] border border-[#36D9FF]/35 focus:border-[#D9B45B] focus:outline-none px-3 py-2.5 text-sm text-white"
                  >
                    <option value="">— Pilih Keputusan —</option>
                    <option value="cemerlang">Cemerlang</option>
                    <option value="memuaskan">Memuaskan</option>
                    <option value="perlu_bimbingan">Perlu Bimbingan</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D9B45B] hover:bg-[#F3DBA0] text-[#092D27] text-xs font-extrabold uppercase tracking-wider transition-colors disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Ulasan Guru'}</span>
                </button>
              </div>
            </div>

            {statusMsg && (
              <p
                role="status"
                className={`text-xs font-semibold px-3 py-2 rounded-lg border ${
                  statusMsg.type === 'ok'
                    ? 'bg-[#00BFA6]/15 border-[#00BFA6]/45 text-[#5BFFCA]'
                    : 'bg-[#C2593F]/20 border-[#E57B63]/50 text-[#FDEAE6]'
                }`}
              >
                {statusMsg.text}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
