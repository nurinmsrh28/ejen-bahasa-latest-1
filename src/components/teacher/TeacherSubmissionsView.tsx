import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, FileSearch, MessageSquare } from 'lucide-react';
import { LOCATIONS } from '../../game/data';
import type {
  LocationId,
  TeacherDashboardPayload,
  TeacherStudentDossier,
} from '../../game/types';
import {
  extractInspectableItemsFromDossier,
  formatDateTime,
  PHASE_SHORT_LABELS,
  type InspectableSubmissionItem,
} from './teacherUtils';

interface TeacherSubmissionsViewProps {
  payload: TeacherDashboardPayload;
  dossiersByUsername: Record<string, TeacherStudentDossier>;
  loadingDossiers: boolean;
  initialPhaseFilter?: string;
  initialLocationFilter?: string;
  onInspectResponse: (item: InspectableSubmissionItem) => void;
  onOpenStudentDossier: (username: string) => void;
}

export function TeacherSubmissionsView({
  payload,
  dossiersByUsername,
  loadingDossiers,
  initialPhaseFilter = 'semua',
  initialLocationFilter = 'semua',
  onInspectResponse,
  onOpenStudentDossier,
}: TeacherSubmissionsViewProps) {
  const [phaseFilter, setPhaseFilter] = useState<string>(initialPhaseFilter);
  const [locationFilter, setLocationFilter] = useState<string>(initialLocationFilter);
  const [studentFilter, setStudentFilter] = useState<string>('semua');
  const [reviewFilter, setReviewFilter] = useState<'semua' | 'unreviewed' | 'reviewed'>('semua');

  useEffect(() => {
    setPhaseFilter(initialPhaseFilter);
  }, [initialPhaseFilter]);

  useEffect(() => {
    setLocationFilter(initialLocationFilter);
  }, [initialLocationFilter]);

  useEffect(() => {
    if (
      studentFilter !== 'semua' &&
      !payload.students.some((s) => s.username === studentFilter)
    ) {
      setStudentFilter('semua');
    }
  }, [payload.students, studentFilter]);

  const locationNames = useMemo(
    () =>
      LOCATIONS.reduce((acc, loc) => {
        acc[loc.id] = loc.name;
        return acc;
      }, {} as Record<LocationId, string>),
    []
  );

  const allItems = useMemo(() => {
    const out: (InspectableSubmissionItem & { hasFeedback: boolean })[] = [];
    for (const s of payload.students) {
      const dossier = dossiersByUsername[s.username];
      if (!dossier) continue;
      const extracted = extractInspectableItemsFromDossier(dossier, locationNames);
      for (const item of extracted) {
        const hasFeedback = dossier.teacherFeedback.some(
          (f) => f.itemKey === item.itemKey
        );
        out.push({ ...item, hasFeedback });
      }
    }
    out.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    return out;
  }, [payload.students, dossiersByUsername, locationNames]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (phaseFilter !== 'semua' && item.phaseId !== phaseFilter) return false;
      if (locationFilter !== 'semua' && item.locationId !== locationFilter) return false;
      if (studentFilter !== 'semua' && item.studentUsername !== studentFilter) return false;
      if (reviewFilter === 'unreviewed' && item.hasFeedback) return false;
      if (reviewFilter === 'reviewed' && !item.hasFeedback) return false;
      return true;
    });
  }, [allItems, phaseFilter, locationFilter, studentFilter, reviewFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#36D9FF]/20 pb-4">
        <div>
          <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.2em] text-[#36D9FF]">
            04 — LAPORAN & SEMAKAN TUGASAN MURID
          </p>
          <h1 className="font-display text-2xl font-bold text-[#F5F0E5] mt-0.5">
            Semua Jawapan & Hantaran Tugasan
          </h1>
        </div>
        <span className="font-mono-tabular text-xs text-[#DCE9DF]/85">
          {loadingDossiers
            ? 'Menghimpun rekod jawapan...'
            : `${filteredItems.length} rekod jawapan ditemui`}
        </span>
      </div>

      {/* Filters */}
      <div className="teacher-holo-panel rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-xs text-white"
        >
          <option value="semua">Semua Fasa (1–5)</option>
          <option value="phase1">Fasa 1 · Operasi Jejak Bukti</option>
          <option value="phase2">Fasa 2 · Makmal Analisis Kes</option>
          <option value="phase3">Fasa 3 · Buktikan Teori</option>
          <option value="phase4">Cabaran Akhir · Studio Arkitek</option>
          <option value="phase5">Produk Akhir · Laporan Sekolah Impian</option>
        </select>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-xs text-white"
        >
          <option value="semua">Semua Lokasi</option>
          {LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          className="rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-xs text-white"
        >
          <option value="semua">Semua Murid</option>
          {payload.students.map((s) => (
            <option key={s.username} value={s.username}>
              {s.name} ({s.className})
            </option>
          ))}
        </select>

        <select
          value={reviewFilter}
          onChange={(e) =>
            setReviewFilter(e.target.value as 'semua' | 'unreviewed' | 'reviewed')
          }
          className="rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-xs text-white"
        >
          <option value="semua">Semua Status Semakan</option>
          <option value="unreviewed">Belum Diulas Guru</option>
          <option value="reviewed">Sudah Ada Ulasan Guru</option>
        </select>
      </div>

      {/* Submissions List */}
      {filteredItems.length === 0 ? (
        <div className="teacher-holo-panel rounded-2xl p-8 text-center text-sm text-[#DCE9DF]/75">
          {loadingDossiers
            ? 'Memuatkan semua rekod tugasan daripada pangkalan data...'
            : 'Tiada jawapan tugasan ditemui untuk penapis yang dipilih.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={`${item.studentUsername}_${item.itemKey}`}
              className="teacher-holo-panel rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-tabular">
                  <span className="px-2 py-0.5 rounded bg-[#36D9FF]/15 text-[#36D9FF] border border-[#36D9FF]/35 font-bold">
                    {PHASE_SHORT_LABELS[item.phaseId]}
                  </span>
                  <span className="font-bold text-[#F7DA82]">{item.itemTitle}</span>
                  <span className="text-[#DCE9DF]/65">·</span>
                  <button
                    type="button"
                    onClick={() => onOpenStudentDossier(item.studentUsername)}
                    className="font-bold text-white hover:text-[#36D9FF] underline underline-offset-2"
                  >
                    {item.studentName}
                  </button>
                  <span className="text-[#DCE9DF]/75">({item.className})</span>
                  <span className="text-[#DCE9DF]/65">· {formatDateTime(item.submittedAt)}</span>
                </div>

                <p className="text-sm text-[#F5F0E5] line-clamp-2 leading-relaxed">
                  “{item.responseText}”
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono-tabular">
                  <span className="text-[#5BFFCA] font-bold">
                    Skor: {item.scorePercent !== null ? `${item.scorePercent}%` : '—'}
                  </span>
                  {item.historyVersions.length > 1 && (
                    <span className="text-[#D9B45B]">
                      {item.historyVersions.length} versi jawapan direkodkan
                    </span>
                  )}
                  {item.hasFeedback ? (
                    <span className="inline-flex items-center gap-1 text-[#5BFFCA]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sudah diulas guru
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#F7DA82]">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Menunggu ulasan guru
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenStudentDossier(item.studentUsername)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#123E34] hover:bg-[#1D6652] border border-[#36D9FF]/30 text-xs font-semibold text-[#F5F0E5] transition-colors"
                >
                  <FileSearch className="w-3.5 h-3.5 text-[#36D9FF]" />
                  <span>Fail Murid</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInspectResponse(item)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D9B45B] hover:bg-[#F3DBA0] text-[#092D27] text-xs font-extrabold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>LIHAT JAWAPAN PENUH</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
