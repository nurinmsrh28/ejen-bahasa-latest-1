import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Eye,
  History,
  Lock,
  MessageSquare,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react';
import {
  BADGES,
  DESIGN_ACTIONS,
  FACILITY_ASSET_MAP,
  LOCATIONS,
  LOGIC_CHALLENGES,
} from '../../game/data';
import { CASE_META_TEXT } from '../../game/evaluation';
import type {
  LocationId,
  TeacherStudentDossier,
  TeacherStudentSummary,
} from '../../game/types';
import {
  extractInspectableItemsFromDossier,
  formatDateTime,
  formatShortDate,
  getAssessmentDecisionLabel,
  getPhaseStatusBadgeClass,
  getPhaseStatusLabel,
  PHASE_SHORT_LABELS,
  type InspectableSubmissionItem,
} from './teacherUtils';

interface TeacherStudentFileViewProps {
  students: TeacherStudentSummary[];
  selectedUsername: string;
  dossier: TeacherStudentDossier | null;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectStudent: (username: string) => void;
  onInspectResponse: (item: InspectableSubmissionItem) => void;
}

type FileTab = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export function TeacherStudentFileView({
  students,
  selectedUsername,
  dossier,
  loading,
  error,
  onRetry,
  onSelectStudent,
  onInspectResponse,
}: TeacherStudentFileViewProps) {
  const [activeTab, setActiveTab] = useState<FileTab>('A');

  const locationNames = useMemo(
    () =>
      LOCATIONS.reduce((acc, loc) => {
        acc[loc.id] = loc.name;
        return acc;
      }, {} as Record<LocationId, string>),
    []
  );

  const inspectableMap = useMemo(() => {
    if (!dossier) return new Map<string, InspectableSubmissionItem>();
    const items = extractInspectableItemsFromDossier(dossier, locationNames);
    return new Map(items.map((i) => [i.itemKey, i]));
  }, [dossier, locationNames]);

  const tabs: { id: FileTab; label: string; short: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'A', label: 'A. Profil Murid', short: 'A · Profil', icon: User },
    { id: 'B', label: 'B. Fasa 1 (Jejak Bukti)', short: 'B · Fasa 1', icon: Compass },
    { id: 'C', label: 'C. Fasa 2 (Analisis Kes)', short: 'C · Fasa 2', icon: ClipboardCheck },
    { id: 'D', label: 'D. Fasa 3, Arkitek & Laporan', short: 'D · Fasa 3–5', icon: Sparkles },
    { id: 'E', label: 'E. Rekod Gamifikasi', short: 'E · Gamifikasi', icon: Award },
    { id: 'F', label: 'F. Perkembangan Pembelajaran', short: 'F · Perkembangan', icon: History },
  ];

  const openInspectOrFallback = (itemKey: string, fallback: InspectableSubmissionItem) => {
    onInspectResponse(inspectableMap.get(itemKey) || fallback);
  };

  return (
    <div className="space-y-5">
      {/* Header + Student Selector */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#36D9FF]/20 pb-4">
        <div>
          <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.2em] text-[#36D9FF]">
            05 — FAIL AKADEMIK DETEKTIF
          </p>
          <h1 className="font-display text-2xl font-bold text-[#F5F0E5] mt-0.5">
            Fail Akademik & Rekod Pembelajaran Individu
          </h1>
        </div>

        <div className="w-full lg:w-80">
          <label className="block text-[11px] text-[#DCE9DF]/75 mb-1">
            Pilih Murid untuk Diperiksa
          </label>
          <select
            value={selectedUsername}
            onChange={(e) => onSelectStudent(e.target.value)}
            className="w-full rounded-xl bg-[#123E34] border border-[#36D9FF]/45 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-[#D9B45B] focus:outline-none"
          >
            {students.length === 0 && <option value="">Tiada murid berdaftar</option>}
            {students.map((s) => (
              <option key={s.username} value={s.username}>
                {s.name} ({s.className} · {s.studentId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="teacher-holo-panel rounded-2xl p-8 text-center text-sm text-[#36D9FF]">
          Memuatkan Fail Akademik Detektif daripada pangkalan data...
        </div>
      )}

      {!loading && error && !dossier && (
        <div className="teacher-holo-panel rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 border-[#E57B63]/50">
          <div className="flex items-center gap-3 text-sm text-[#FDEAE6]">
            <AlertCircle className="w-5 h-5 text-[#F29C85] shrink-0" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 rounded-lg bg-[#D9B45B] hover:bg-[#F3DBA0] text-[#092D27] text-xs font-extrabold"
            >
              Cuba Semula
            </button>
          )}
        </div>
      )}

      {!loading && !error && !dossier && (
        <div className="teacher-holo-panel rounded-2xl p-8 text-center text-sm text-[#DCE9DF]/80">
          Pilih seorang murid daripada senarai untuk membuka fail akademik lengkap.
        </div>
      )}

      {!loading && dossier && (
        <>
          {/* Student Executive Identity Banner (Separating Academic Score vs Gamification XP) */}
          <div className="teacher-holo-panel rounded-2xl p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-6 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono-tabular text-xs font-bold px-2.5 py-0.5 rounded bg-[#D9B45B] text-[#092D27]">
                  {dossier.summary.studentId}
                </span>
                <span className="font-mono-tabular text-xs text-[#36D9FF] font-semibold">
                  {dossier.summary.className} · @{dossier.summary.username}
                </span>
                {dossier.summary.isDemo && (
                  <span className="font-mono-tabular text-[11px] font-bold text-[#F7DA82]">
                    [DATA DEMO]
                  </span>
                )}
              </div>
              <h2 className="font-display text-2xl font-bold text-white">
                {dossier.summary.name}
              </h2>
              <p className="text-xs text-[#DCE9DF]/80">
                Gelaran Pasukan: <strong className="text-[#F5F0E5]">{dossier.summary.codenameBadge}</strong> · Kemaskini Terakhir:{' '}
                <span className="font-mono-tabular">{formatDateTime(dossier.summary.lastUpdated)}</span>
              </p>
            </div>

            <div className="lg:col-span-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#092D27]/90 border border-[#00BFA6]/35 p-3">
                <p className="font-mono-tabular text-[10px] font-bold uppercase text-[#00BFA6]">
                  SKOR AKADEMIK
                </p>
                <p className="font-mono-tabular text-2xl font-extrabold text-white mt-0.5">
                  {dossier.summary.metrics.overallAcademicScore !== null
                    ? `${dossier.summary.metrics.overallAcademicScore}%`
                    : '—'}
                </p>
                <p className="text-[10px] text-[#DCE9DF]/70">Penilaian Rubrik</p>
              </div>

              <div className="rounded-xl bg-[#092D27]/90 border border-[#36D9FF]/35 p-3">
                <p className="font-mono-tabular text-[10px] font-bold uppercase text-[#36D9FF]">
                  KEMAJUAN MISI
                </p>
                <p className="font-mono-tabular text-2xl font-extrabold text-white mt-0.5">
                  {dossier.summary.metrics.missionCompletionPercent}%
                </p>
                <p className="text-[10px] text-[#DCE9DF]/70">
                  {dossier.summary.metrics.completedPhasesCount}/5 Fasa Selesai
                </p>
              </div>

              <div className="rounded-xl bg-[#092D27]/90 border border-[#D9B45B]/35 p-3">
                <p className="font-mono-tabular text-[10px] font-bold uppercase text-[#D9B45B]">
                  XP GAMIFIKASI
                </p>
                <p className="font-mono-tabular text-2xl font-extrabold text-[#F7DA82] mt-0.5">
                  {dossier.summary.xp}
                </p>
                <p className="text-[10px] text-[#DCE9DF]/75 truncate">{dossier.summary.rank}</p>
              </div>
            </div>
          </div>

          {/* Sub-Tabs A–F */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#D9B45B] border-[#F3DBA0] text-[#092D27] shadow-[0_0_16px_rgba(217,180,91,0.3)]'
                      : 'bg-[#123E34]/85 border-[#36D9FF]/25 text-[#F5F0E5] hover:border-[#36D9FF]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.short}</span>
                </button>
              );
            })}
          </div>

          {/* TAB A: PROFIL MURID */}
          {activeTab === 'A' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
                <h3 className="font-display text-lg font-bold text-white border-b border-[#36D9FF]/20 pb-2">
                  Maklumat Identiti & Penglibatan Murid
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-[#092D27]/75 p-3 border border-white/10">
                    <dt className="text-[#DCE9DF]/70">ID Murid Rasmi</dt>
                    <dd className="font-mono-tabular font-bold text-sm text-[#36D9FF] mt-0.5">
                      {dossier.summary.studentId}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-[#092D27]/75 p-3 border border-white/10">
                    <dt className="text-[#DCE9DF]/70">Nama Penuh</dt>
                    <dd className="font-bold text-sm text-white mt-0.5">{dossier.summary.name}</dd>
                  </div>
                  <div className="rounded-xl bg-[#092D27]/75 p-3 border border-white/10">
                    <dt className="text-[#DCE9DF]/70">Kelas Semasa</dt>
                    <dd className="font-bold text-sm text-white mt-0.5">
                      {dossier.summary.className}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-[#092D27]/75 p-3 border border-white/10">
                    <dt className="text-[#DCE9DF]/70">Tarikh Daftar Akaun</dt>
                    <dd className="font-mono-tabular font-semibold text-white mt-0.5">
                      {formatShortDate(dossier.summary.createdAt)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-[#092D27]/75 p-3 border border-white/10">
                    <dt className="text-[#DCE9DF]/70">Tarikh Aktif Terakhir</dt>
                    <dd className="font-mono-tabular font-semibold text-white mt-0.5">
                      {formatDateTime(dossier.summary.latestActivityAt || dossier.summary.lastUpdated)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-[#092D27]/75 p-3 border border-white/10">
                    <dt className="text-[#DCE9DF]/70">Rekod Hantaran & Aktiviti</dt>
                    <dd className="font-mono-tabular font-bold text-[#5BFFCA] mt-0.5">
                      {dossier.submissionHistory.length} versi jawapan · {dossier.activityLogs.length} log
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
                <h3 className="font-display text-lg font-bold text-white border-b border-[#36D9FF]/20 pb-2">
                  Status Keseluruhan Mengikut Fasa
                </h3>
                <div className="space-y-2.5">
                  {(
                    [
                      ['Fasa 1 · Operasi Jejak Bukti', dossier.summary.metrics.phase1Status, dossier.summary.metrics.phase1Score],
                      ['Fasa 2 · Makmal Analisis Kes', dossier.summary.metrics.phase2Status, dossier.summary.metrics.phase2Score],
                      ['Fasa 3 · Buktikan Teori', dossier.summary.metrics.phase3Status, dossier.summary.metrics.phase3Score],
                      ['Cabaran Akhir · Studio Arkitek', dossier.summary.metrics.phase4Status, dossier.summary.metrics.phase4Score],
                      ['Produk Akhir · Laporan Sekolah Impian', dossier.summary.metrics.phase5Status, dossier.summary.metrics.phase5Score],
                    ] as const
                  ).map(([label, st, sc]) => (
                    <div
                      key={label}
                      className="rounded-xl bg-[#092D27]/80 border border-white/10 p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-semibold text-[#F5F0E5]">{label}</span>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono-tabular font-bold text-[#5BFFCA]">
                          {sc !== null ? `${sc}%` : '—'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono-tabular text-[11px] font-bold ${getPhaseStatusBadgeClass(
                            st
                          )}`}
                        >
                          {getPhaseStatusLabel(st)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB B: FASA 1 — OPERASI JEJAK BUKTI */}
          {activeTab === 'B' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LOCATIONS.map((loc) => {
                const inv = dossier.gameState.investigations[loc.id];
                const fb = dossier.teacherFeedback.find(
                  (f) => f.itemKey === `phase1_${loc.id}`
                );
                return (
                  <div key={loc.id} className="teacher-holo-panel rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-[#36D9FF]/20 pb-2.5">
                      <div>
                        <p className="font-mono-tabular text-[10px] font-bold uppercase text-[#36D9FF]">
                          {loc.zoneLabel}
                        </p>
                        <h3 className="font-display text-lg font-bold text-white">{loc.name}</h3>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded font-mono-tabular text-[11px] font-bold ${getPhaseStatusBadgeClass(
                          inv.completed
                            ? 'completed'
                            : inv.discoveredClueIds.length > 0 || inv.notes.trim()
                              ? 'in_progress'
                              : 'not_started'
                        )}`}
                      >
                        {inv.completed
                          ? 'Selesai'
                          : inv.discoveredClueIds.length > 0 || inv.notes.trim()
                            ? 'Dalam Siasatan'
                            : 'Belum Mula'}
                      </span>
                    </div>

                    <div className="text-xs space-y-2">
                      <p className="font-mono-tabular text-[#DCE9DF]">
                        Bukti Ditemui:{' '}
                        <strong className="text-[#5BFFCA]">
                          {inv.discoveredClueIds.length} / {loc.clues.length}
                        </strong>{' '}
                        · Petunjuk Bantuan Digunakan: <strong>Tahap {inv.hintLevelUsed}</strong>
                      </p>

                      {inv.discoveredClueIds.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {inv.discoveredClueIds.map((cid) => {
                            const clue = loc.clues.find((c) => c.id === cid);
                            return (
                              <span
                                key={cid}
                                className="px-2 py-0.5 rounded bg-[#092D27] border border-[#00BFA6]/35 text-[11px] text-[#5BFFCA]"
                              >
                                {clue?.label || cid}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="rounded-xl bg-[#F5F0E5] text-[#26382F] p-3.5 space-y-2 border border-[#D9B45B]/50">
                        <div>
                          <p className="font-mono-tabular text-[10px] font-bold uppercase text-[#1D6652]">
                            Catatan Pemerhatian Murid
                          </p>
                          <p className="text-xs mt-0.5 whitespace-pre-wrap">
                            {inv.notes.trim() || 'Belum ada catatan pemerhatian ditulis.'}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-[#1D6652]/15">
                          <p className="font-mono-tabular text-[10px] font-bold uppercase text-[#1D6652]">
                            Cadangan Penyelesaian Awal
                          </p>
                          <p className="text-xs mt-0.5 whitespace-pre-wrap">
                            {inv.initialProposal.trim() || 'Belum ada cadangan awal ditulis.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="font-mono-tabular text-[11px] text-[#DCE9DF]/70">
                          {inv.completedAt
                            ? `Disimpan: ${formatDateTime(inv.completedAt)}`
                            : 'Belum dimuktamadkan'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            openInspectOrFallback(`phase1_${loc.id}`, {
                              studentUsername: dossier.summary.username,
                              studentName: dossier.summary.name,
                              studentId: dossier.summary.studentId,
                              className: dossier.summary.className,
                              phaseId: 'phase1',
                              itemKey: `phase1_${loc.id}`,
                              itemTitle: `Fasa 1 · ${loc.name}`,
                              locationId: loc.id,
                              question: `Catatkan pemerhatian dan cadangan penyelesaian awal bagi lokasi ${loc.name}.`,
                              responseText: inv.notes || '(Tiada catatan ditulis)',
                              secondaryText: inv.initialProposal || '(Tiada cadangan awal)',
                              selectedEvidence: inv.discoveredClueIds,
                              scorePercent: null,
                              submittedAt: inv.completedAt || dossier.summary.lastUpdated,
                              historyVersions: dossier.submissionHistory.filter(
                                (h) => h.itemKey === `phase1_${loc.id}`
                              ),
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D9B45B] hover:bg-[#F3DBA0] text-[#092D27] text-xs font-extrabold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>LIHAT JAWAPAN PENUH</span>
                        </button>
                      </div>

                      {fb && (
                        <div className="rounded-lg bg-[#00BFA6]/10 border border-[#00BFA6]/35 p-2.5 text-xs">
                          <p className="font-bold text-[#5BFFCA]">
                            Ulasan Guru ({getAssessmentDecisionLabel(fb.assessmentDecision)}):
                          </p>
                          <p className="text-[#F5F0E5] mt-0.5">{fb.comment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB C: FASA 2 — MAKMAL ANALISIS KES (ALL 13 ITEMS) */}
          {activeTab === 'C' && (
            <div className="space-y-4">
              {/* Top Overview of Phase 2 */}
              <div className="teacher-holo-panel rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl bg-[#092D27]/85 border border-white/10 p-3">
                  <p className="text-[#DCE9DF]/70">1. Status Misi Fasa 2</p>
                  <p className="font-bold text-sm text-[#5BFFCA] mt-1">
                    {getPhaseStatusLabel(dossier.summary.metrics.phase2Status)}
                  </p>
                </div>
                <div className="rounded-xl bg-[#092D27]/85 border border-white/10 p-3">
                  <p className="text-[#DCE9DF]/70">2. Status Semakan Guru</p>
                  <p className="font-bold text-sm text-[#F7DA82] mt-1">
                    {dossier.teacherFeedback.some((f) => f.phaseId === 'phase2')
                      ? 'Sudah Diulas Guru'
                      : 'Menunggu Semakan'}
                  </p>
                </div>
                <div className="rounded-xl bg-[#092D27]/85 border border-white/10 p-3">
                  <p className="text-[#DCE9DF]/70">3. Bukti Utama Dipilih (Kad Keputusan)</p>
                  <p className="font-bold text-sm text-white mt-1">
                    {dossier.gameState.selectedEvidenceIds.length > 0
                      ? dossier.gameState.selectedEvidenceIds
                          .map((id) => locationNames[id])
                          .join(', ')
                      : 'Belum dipilih'}
                  </p>
                </div>
                <div className="rounded-xl bg-[#092D27]/85 border border-white/10 p-3">
                  <p className="text-[#DCE9DF]/70">10. Purata Skor Akademik Fasa 2</p>
                  <p className="font-mono-tabular font-extrabold text-xl text-[#36D9FF] mt-0.5">
                    {dossier.summary.metrics.phase2Score !== null
                      ? `${dossier.summary.metrics.phase2Score}%`
                      : 'Belum ada'}
                  </p>
                </div>
              </div>

              {/* Per-Location Detailed 13-Item Breakdown */}
              <div className="space-y-4">
                {LOCATIONS.map((loc) => {
                  const isSelected = dossier.gameState.selectedEvidenceIds.includes(loc.id);
                  const opText = (dossier.gameState.opinions[loc.id]?.opinionText || '').trim();
                  const inv = dossier.gameState.investigations[loc.id];
                  const ev = dossier.opinionEvaluations[loc.id];
                  const versions = dossier.submissionHistory.filter(
                    (h) => h.itemKey === `phase2_${loc.id}`
                  );
                  const fb = dossier.teacherFeedback.find(
                    (f) => f.itemKey === `phase2_${loc.id}`
                  );

                  return (
                    <div key={loc.id} className="teacher-holo-panel rounded-2xl p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#36D9FF]/20 pb-3">
                        <div>
                          <p className="font-mono-tabular text-[10px] font-bold uppercase text-[#36D9FF]">
                            {CASE_META_TEXT[loc.id].caseNumber} · {loc.name}
                          </p>
                          <h3 className="font-display text-lg font-bold text-white">
                            {CASE_META_TEXT[loc.id].stimulatingQuestion}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 font-mono-tabular text-xs">
                          <span
                            className={`px-2.5 py-1 rounded font-bold ${
                              isSelected
                                ? 'bg-[#00BFA6]/20 text-[#5BFFCA] border border-[#00BFA6]/40'
                                : 'bg-white/5 text-[#DCE9DF]/65 border border-white/10'
                            }`}
                          >
                            {isSelected ? 'Dipilih dalam Kad Keputusan' : 'Tidak Dipilih'}
                          </span>
                          <span className="px-2.5 py-1 rounded bg-[#D9B45B]/20 text-[#F7DA82] border border-[#D9B45B]/45 font-bold">
                            Skor: {opText ? `${ev.scorePercent}%` : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Metadata row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="rounded-lg bg-[#092D27]/75 p-2.5 border border-white/10">
                          <span className="text-[#DCE9DF]/70 block text-[11px]">Bil. Bukti Lokasi</span>
                          <strong className="font-mono-tabular text-[#5BFFCA]">
                            {inv.discoveredClueIds.length} / {loc.clues.length} Petunjuk
                          </strong>
                        </div>
                        <div className="rounded-lg bg-[#092D27]/75 p-2.5 border border-white/10">
                          <span className="text-[#DCE9DF]/70 block text-[11px]">Rekod Kad Keputusan</span>
                          <strong className="text-white">
                            {opText.length >= 10 && isSelected ? 'Tersimpan Sah' : opText ? 'Draf' : 'Kosong'}
                          </strong>
                        </div>
                        <div className="rounded-lg bg-[#092D27]/75 p-2.5 border border-white/10">
                          <span className="text-[#DCE9DF]/70 block text-[11px]">Bilangan Versi</span>
                          <strong className="font-mono-tabular text-white">{versions.length}</strong>
                        </div>
                        <div className="rounded-lg bg-[#092D27]/75 p-2.5 border border-white/10">
                          <span className="text-[#DCE9DF]/70 block text-[11px]">Tarikh Kemas Kini</span>
                          <strong className="font-mono-tabular text-white">
                            {versions[0] ? formatShortDate(versions[0].submittedAt) : '—'}
                          </strong>
                        </div>
                      </div>

                      {/* 5. Full Verbatim Opinion Sentence */}
                      <div className="rounded-xl bg-[#F5F0E5] text-[#26382F] p-4 border border-[#D9B45B]/60">
                        <p className="font-mono-tabular text-[10px] font-bold uppercase text-[#1D6652] mb-1">
                          5. Ayat Pendapat Lengkap Murid
                        </p>
                        <p className="text-sm font-medium whitespace-pre-wrap">
                          {opText || 'Murid belum menulis ayat pendapat bagi lokasi ini.'}
                        </p>
                      </div>

                      {/* 6, 7, 8: Three Criteria Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { num: '6', title: 'Kelengkapan Ayat', ...ev.completeness },
                          { num: '7', title: 'Perkaitan dengan Bukti', ...ev.evidenceLink },
                          { num: '8', title: 'Kejelasan Pendapat', ...ev.clarity },
                        ].map((crit) => (
                          <div
                            key={crit.title}
                            className={`rounded-xl p-3 border text-xs ${
                              crit.met
                                ? 'bg-[#00BFA6]/10 border-[#00BFA6]/40'
                                : 'bg-[#C2593F]/15 border-[#E57B63]/40'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-white">
                                {crit.num}. {crit.title}
                              </span>
                              {crit.met ? (
                                <CheckCircle2 className="w-4 h-4 text-[#5BFFCA] shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-[#F29C85] shrink-0" />
                              )}
                            </div>
                            <p className="text-[#DCE9DF]/90 leading-snug">{crit.message}</p>
                          </div>
                        ))}
                      </div>

                      {/* 13. Teacher Feedback + LIHAT JAWAPAN PENUH */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        {fb ? (
                          <div className="text-xs text-[#5BFFCA]">
                            <strong>Ulasan Guru ({getAssessmentDecisionLabel(fb.assessmentDecision)}):</strong>{' '}
                            <span className="text-[#F5F0E5]">{fb.comment}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#DCE9DF]/65">
                            Belum ada ulasan guru bagi item ini.
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            openInspectOrFallback(`phase2_${loc.id}`, {
                              studentUsername: dossier.summary.username,
                              studentName: dossier.summary.name,
                              studentId: dossier.summary.studentId,
                              className: dossier.summary.className,
                              phaseId: 'phase2',
                              itemKey: `phase2_${loc.id}`,
                              itemTitle: `Fasa 2 · Ayat Pendapat (${loc.name})`,
                              locationId: loc.id,
                              question: CASE_META_TEXT[loc.id].stimulatingQuestion,
                              responseText: opText || '(Tiada ayat pendapat)',
                              selectedEvidence: inv.discoveredClueIds,
                              scorePercent: ev.scorePercent,
                              criteriaRows: [
                                { label: 'Kelengkapan Ayat', ...ev.completeness },
                                { label: 'Perkaitan dengan Bukti', ...ev.evidenceLink },
                                { label: 'Kejelasan Pendapat', ...ev.clarity },
                              ],
                              submittedAt: versions[0]?.submittedAt || dossier.summary.lastUpdated,
                              historyVersions: versions,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D9B45B] hover:bg-[#F3DBA0] text-[#092D27] text-xs font-extrabold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>LIHAT JAWAPAN PENUH</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB D: FASA 3 (BUKTIKAN TEORI), STUDIO ARKITEK & PRODUK AKHIR */}
          {activeTab === 'D' && (
            <div className="space-y-5">
              {/* Phase 3 Part A: Logic Challenges */}
              <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
                <h3 className="font-display text-lg font-bold text-white border-b border-[#36D9FF]/20 pb-2">
                  Fasa 3 Bahagian A · Cabaran Logik (Alasan Relevan)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {LOGIC_CHALLENGES.map((ch) => {
                    const ans = dossier.gameState.logicChallengeAnswers[ch.id];
                    const chosen = ch.options.find((o) => o.id === ans);
                    return (
                      <div
                        key={ch.id}
                        className="rounded-xl bg-[#092D27]/80 border border-white/10 p-3.5 space-y-2 text-xs"
                      >
                        <p className="font-bold text-[#36D9FF]">{ch.contextTitle}</p>
                        <p className="text-[#DCE9DF]/85 italic">“{ch.opinion}”</p>
                        {chosen ? (
                          <div
                            className={`rounded-lg p-2.5 border ${
                              chosen.isRelevant
                                ? 'bg-[#00BFA6]/15 border-[#00BFA6]/45 text-[#5BFFCA]'
                                : 'bg-[#C2593F]/20 border-[#E57B63]/45 text-[#FDEAE6]'
                            }`}
                          >
                            <p className="font-bold">
                              Pilihan {chosen.id} ·{' '}
                              {chosen.isRelevant ? 'Tepat (Relevan)' : 'Kurang Tepat'}
                            </p>
                            <p className="text-[#F5F0E5] mt-1">{chosen.text}</p>
                          </div>
                        ) : (
                          <p className="text-[#DCE9DF]/60">Belum dijawab oleh murid.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phase 3 Part B: Written Reasons */}
              <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
                <h3 className="font-display text-lg font-bold text-white border-b border-[#36D9FF]/20 pb-2">
                  Fasa 3 Bahagian B · Alasan Penyokong Bertulis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {LOCATIONS.map((loc) => {
                    const reasonText = (dossier.gameState.opinions[loc.id]?.reasonText || '').trim();
                    const rv = dossier.reasoningEvaluations[loc.id];
                    const opText = dossier.gameState.opinions[loc.id]?.opinionText || '';
                    const versions = dossier.submissionHistory.filter(
                      (h) => h.itemKey === `phase3_reason_${loc.id}`
                    );
                    return (
                      <div
                        key={loc.id}
                        className="rounded-xl bg-[#092D27]/80 border border-white/10 p-4 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">{loc.name}</span>
                          <span className="font-mono-tabular font-bold text-[#F7DA82]">
                            Skor: {reasonText ? `${rv.scorePercent}%` : '—'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-[#F5F0E5] text-[#26382F] p-3">
                          <p className="font-medium whitespace-pre-wrap">
                            {reasonText || 'Belum ada alasan bertulis.'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={rv.completeness.met ? 'text-[#5BFFCA]' : 'text-[#F29C85]'}>
                            Kelengkapan: {rv.completeness.met ? 'Lulus' : 'Belum'}
                          </span>
                          <span>·</span>
                          <span className={rv.reasoningCue.met ? 'text-[#5BFFCA]' : 'text-[#F29C85]'}>
                            Kata Hubung: {rv.reasoningCue.met ? 'Lulus' : 'Belum'}
                          </span>
                          <span>·</span>
                          <span className={rv.relevanceLink.met ? 'text-[#5BFFCA]' : 'text-[#F29C85]'}>
                            Perkaitan: {rv.relevanceLink.met ? 'Lulus' : 'Belum'}
                          </span>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              openInspectOrFallback(`phase3_reason_${loc.id}`, {
                                studentUsername: dossier.summary.username,
                                studentName: dossier.summary.name,
                                studentId: dossier.summary.studentId,
                                className: dossier.summary.className,
                                phaseId: 'phase3',
                                itemKey: `phase3_reason_${loc.id}`,
                                itemTitle: `Fasa 3 · Alasan Penyokong (${loc.name})`,
                                locationId: loc.id,
                                question: `Nyatakan alasan relevan bagi pendapat: "${opText || '—'}"`,
                                responseText: reasonText || '(Tiada alasan bertulis)',
                                selectedEvidence: [opText || loc.name],
                                scorePercent: rv.scorePercent,
                                criteriaRows: [
                                  { label: 'Kelengkapan Ayat', ...rv.completeness },
                                  { label: 'Penanda Wacana / Kata Hubung', ...rv.reasoningCue },
                                  { label: 'Perkaitan dengan Isu', ...rv.relevanceLink },
                                ],
                                submittedAt: versions[0]?.submittedAt || dossier.summary.lastUpdated,
                                historyVersions: versions,
                              })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#D9B45B] text-[#092D27] font-extrabold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>LIHAT JAWAPAN PENUH</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phase 4 Studio Arkitek & Phase 5 Final Report */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#36D9FF]/20 pb-2">
                    <h3 className="font-display text-lg font-bold text-white">
                      Cabaran Akhir · Studio Arkitek Pelan Sekolah
                    </h3>
                    <span className="font-mono-tabular text-xs font-bold text-[#5BFFCA]">
                      {dossier.gameState.builderSaved ? 'Disimpan' : 'Belum Disimpan'}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                    {dossier.gameState.builderPlan
                      .filter((f) => (f.justification || '').trim().length > 0)
                      .map((f) => {
                        const assetName = FACILITY_ASSET_MAP[f.assetId]?.name || f.assetId;
                        const actionLabel =
                          DESIGN_ACTIONS.find((a) => a.id === f.actionType)?.label || 'Ubah Suai';
                        return (
                          <div
                            key={f.uid}
                            className="rounded-xl bg-[#F5F0E5] text-[#26382F] p-3 border border-[#D9B45B]/50"
                          >
                            <p className="font-bold text-[#1D6652]">
                              {assetName} · {actionLabel}
                            </p>
                            <p className="mt-0.5">{f.justification}</p>
                          </div>
                        );
                      })}
                    {dossier.gameState.builderPlan.every(
                      (f) => !(f.justification || '').trim()
                    ) && (
                      <p className="text-xs text-[#DCE9DF]/70">
                        Murid belum menulis justifikasi kemudahan pada pelan Sekolah Impian.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        openInspectOrFallback('phase4_architect', {
                          studentUsername: dossier.summary.username,
                          studentName: dossier.summary.name,
                          studentId: dossier.summary.studentId,
                          className: dossier.summary.className,
                          phaseId: 'phase4',
                          itemKey: 'phase4_architect',
                          itemTitle: 'Cabaran Akhir · Pelan Studio Arkitek',
                          question:
                            'Reka Pelan Sekolah Impian dan nyatakan justifikasi reka bentuk yang berpaut kepada bukti.',
                          responseText:
                            dossier.gameState.builderPlan
                              .filter((f) => (f.justification || '').trim().length > 0)
                              .map((f) => `${f.assetId}: ${f.justification}`)
                              .join('\n') || '(Tiada justifikasi ditulis)',
                          selectedEvidence: dossier.gameState.selectedEvidenceIds,
                          scorePercent: dossier.summary.metrics.phase4Score,
                          submittedAt: dossier.summary.lastUpdated,
                          historyVersions: dossier.submissionHistory.filter(
                            (h) => h.itemKey === 'phase4_architect'
                          ),
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D9B45B] text-[#092D27] text-xs font-extrabold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>LIHAT JAWAPAN PENUH</span>
                    </button>
                  </div>
                </div>

                <div className="teacher-holo-panel rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#36D9FF]/20 pb-2">
                      <h3 className="font-display text-lg font-bold text-white">
                        Produk Akhir · Laporan Sekolah Impian
                      </h3>
                      <span className="font-mono-tabular text-xs font-bold text-[#5BFFCA]">
                        {dossier.gameState.finalReportSaved ? 'Disahkan' : 'Belum Dihantar'}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#F5F0E5] text-[#26382F] p-4 border border-[#D9B45B]/55 min-h-[130px]">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {dossier.gameState.finalReportText.trim() ||
                          'Murid belum menyiapkan Laporan Rasmi Sekolah Impian.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        openInspectOrFallback('phase5_report', {
                          studentUsername: dossier.summary.username,
                          studentName: dossier.summary.name,
                          studentId: dossier.summary.studentId,
                          className: dossier.summary.className,
                          phaseId: 'phase5',
                          itemKey: 'phase5_report',
                          itemTitle: 'Produk Akhir · Laporan Sekolah Impian',
                          question:
                            'Gabungkan pemerhatian, pendapat, alasan relevan dan cadangan Pelan Sekolah Impian dalam 3–5 ayat.',
                          responseText:
                            dossier.gameState.finalReportText || '(Tiada laporan ditulis)',
                          selectedEvidence: dossier.gameState.selectedEvidenceIds,
                          scorePercent: dossier.summary.metrics.phase5Score,
                          submittedAt: dossier.summary.lastUpdated,
                          historyVersions: dossier.submissionHistory.filter(
                            (h) => h.itemKey === 'phase5_report'
                          ),
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D9B45B] text-[#092D27] text-xs font-extrabold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>LIHAT JAWAPAN PENUH</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB E: REKOD GAMIFIKASI (SEPARATE FROM ACADEMIC SCORES) */}
          {activeTab === 'E' && (
            <div className="space-y-4">
              <div className="teacher-holo-panel rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#D9B45B]">
                    REKOD GAMIFIKASI MURID (TERPISAH DARIPADA MARKAH AKADEMIK)
                  </p>
                  <h3 className="font-display text-xl font-bold text-white mt-0.5">
                    {dossier.summary.xp} XP · Pangkat: {dossier.summary.rank}
                  </h3>
                </div>
                <div className="font-mono-tabular text-xs text-[#DCE9DF]">
                  Lencana Dibuka:{' '}
                  <strong className="text-[#F7DA82]">
                    {dossier.summary.earnedBadges.length} / {BADGES.length}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {BADGES.map((b) => {
                  const unlocked = dossier.summary.earnedBadges.includes(b.id);
                  const unlockedAt = dossier.summary.badgeUnlockDates[b.id];
                  return (
                    <div
                      key={b.id}
                      className={`rounded-2xl p-4 border space-y-2 ${
                        unlocked
                          ? 'bg-[#123E34]/95 border-[#D9B45B]/75 shadow-[0_0_20px_rgba(217,180,91,0.18)]'
                          : 'bg-[#092D27]/70 border-white/10 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-bold text-base text-[#F7DA82]">
                          {b.name}
                        </span>
                        {unlocked ? (
                          <Award className="w-5 h-5 text-[#D9B45B] shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-[#DCE9DF]/50 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[#DCE9DF]/85 leading-relaxed">{b.description}</p>
                      <p className="font-mono-tabular text-[11px] text-[#36D9FF] pt-1">
                        {unlocked
                          ? `Dibuka pada: ${formatDateTime(unlockedAt || dossier.summary.lastUpdated)}`
                          : 'Belum dibuka'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB F: PERKEMBANGAN PEMBELAJARAN */}
          {activeTab === 'F' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 teacher-holo-panel rounded-2xl p-5 space-y-3">
                <h3 className="font-display text-lg font-bold text-white border-b border-[#36D9FF]/20 pb-2">
                  Garis Masa Sejarah Versi & Kemajuan
                </h3>
                {dossier.submissionHistory.length === 0 ? (
                  <p className="text-xs text-[#DCE9DF]/70 py-4">
                    Belum ada sejarah penyerahan direkodkan.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {dossier.submissionHistory.map((sub) => (
                      <div
                        key={sub.id}
                        className="rounded-xl bg-[#092D27]/80 border border-white/10 p-3 text-xs space-y-1"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tabular">
                          <span className="font-bold text-[#36D9FF]">
                            {PHASE_SHORT_LABELS[sub.phaseId]} · {sub.itemTitle} (v{sub.version})
                          </span>
                          <span className="text-[#D9B45B] font-bold">
                            {sub.scorePercent !== null ? `${sub.scorePercent}%` : 'Disimpan'} ·{' '}
                            {formatDateTime(sub.submittedAt)}
                          </span>
                        </div>
                        <p className="text-[#F5F0E5] line-clamp-2">{sub.responseText}</p>
                        {sub.criteriaSummary && (
                          <p className="text-[11px] text-[#5BFFCA]">{sub.criteriaSummary}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
                  <h3 className="font-display text-lg font-bold text-white border-b border-[#36D9FF]/20 pb-2">
                    Tugasan Belum Selesai ({dossier.summary.metrics.totalTasksPending})
                  </h3>
                  <ul className="space-y-2 text-xs">
                    {dossier.summary.metrics.phase1Status !== 'completed' && (
                      <li className="rounded-lg bg-[#092D27] border border-white/10 p-2.5 text-[#F5F0E5]">
                        Fasa 1 · Lengkapkan siasatan 4 lokasi & cadangan awal
                      </li>
                    )}
                    {dossier.summary.metrics.phase2Status !== 'completed' && (
                      <li className="rounded-lg bg-[#092D27] border border-white/10 p-2.5 text-[#F5F0E5]">
                        Fasa 2 · Pilih bukti utama & simpan ayat pendapat dalam Kad Keputusan
                      </li>
                    )}
                    {dossier.summary.metrics.phase3Status !== 'completed' && (
                      <li className="rounded-lg bg-[#092D27] border border-white/10 p-2.5 text-[#F5F0E5]">
                        Fasa 3 · Lengkapkan 3 Cabaran Logik & tulis alasan penyokong
                      </li>
                    )}
                    {dossier.summary.metrics.phase4Status !== 'completed' && (
                      <li className="rounded-lg bg-[#092D27] border border-white/10 p-2.5 text-[#F5F0E5]">
                        Cabaran Akhir · Simpan Pelan Studio Arkitek (min. 2 justifikasi)
                      </li>
                    )}
                    {dossier.summary.metrics.phase5Status !== 'completed' && (
                      <li className="rounded-lg bg-[#092D27] border border-white/10 p-2.5 text-[#F5F0E5]">
                        Produk Akhir · Sahkan Laporan Rasmi Sekolah Impian
                      </li>
                    )}
                    {dossier.summary.metrics.totalTasksPending === 0 && (
                      <li className="rounded-lg bg-[#00BFA6]/15 border border-[#00BFA6]/40 p-2.5 text-[#5BFFCA] font-semibold">
                        Tahniah! Semua 5 tugasan utama telah disiapkan oleh murid ini.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-[#36D9FF]/20 pb-2">
                    <MessageSquare className="w-4 h-4 text-[#D9B45B]" />
                    <h3 className="font-display text-lg font-bold text-white">
                      Sejarah Ulasan Guru ({dossier.teacherFeedback.length})
                    </h3>
                  </div>
                  {dossier.teacherFeedback.length === 0 ? (
                    <p className="text-xs text-[#DCE9DF]/70">
                      Belum ada ulasan guru disimpan untuk murid ini. Klik “LIHAT JAWAPAN PENUH” pada mana-mana tugasan untuk menambah bimbingan.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {dossier.teacherFeedback.map((fb) => (
                        <div
                          key={fb.id}
                          className="rounded-xl bg-[#092D27]/80 border border-[#D9B45B]/30 p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-mono-tabular text-[11px]">
                            <span className="font-bold text-[#F7DA82]">
                              {fb.itemKey} · {getAssessmentDecisionLabel(fb.assessmentDecision)}
                            </span>
                            <span className="text-[#DCE9DF]/65">{formatShortDate(fb.updatedAt)}</span>
                          </div>
                          <p className="text-[#F5F0E5]">{fb.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
