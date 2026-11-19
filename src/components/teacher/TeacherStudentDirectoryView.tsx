import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileSearch, Search } from 'lucide-react';
import type { TeacherStudentSummary } from '../../game/types';
import {
  formatDateTime,
  getPhaseStatusBadgeClass,
  getPhaseStatusLabel,
} from './teacherUtils';

interface TeacherStudentDirectoryViewProps {
  students: TeacherStudentSummary[];
  classes: string[];
  onOpenStudentDossier: (username: string) => void;
}

export function TeacherStudentDirectoryView({
  students,
  classes,
  onOpenStudentDossier,
}: TeacherStudentDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('semua');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [sortField, setSortField] = useState<'name' | 'score' | 'completion' | 'xp'>('name');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = students.filter((s) => {
      if (classFilter !== 'semua' && s.className !== classFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.studentId.toLowerCase().includes(q) && !s.username.toLowerCase().includes(q)) {
        return false;
      }
      if (statusFilter === 'selesai') return s.metrics.missionCompletionPercent === 100;
      if (statusFilter === 'sedang_berjalan') {
        return s.metrics.missionCompletionPercent > 0 && s.metrics.missionCompletionPercent < 100;
      }
      if (statusFilter === 'belum_mula') return !s.metrics.hasAnySubmission && s.xp === 0;
      if (statusFilter === 'perlu_semakan') return s.needsReview;
      return true;
    });

    list.sort((a, b) => {
      if (sortField === 'score') {
        return (b.metrics.overallAcademicScore ?? -1) - (a.metrics.overallAcademicScore ?? -1);
      }
      if (sortField === 'completion') {
        return b.metrics.missionCompletionPercent - a.metrics.missionCompletionPercent;
      }
      if (sortField === 'xp') return b.xp - a.xp;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [students, searchQuery, classFilter, statusFilter, sortField]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#36D9FF]/20 pb-4">
        <div>
          <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.2em] text-[#36D9FF]">
            02 — DIREKTORI & REKOD MURID
          </p>
          <h1 className="font-display text-2xl font-bold text-[#F5F0E5] mt-0.5">
            Senarai Murid Akademi
          </h1>
        </div>
        <p className="font-mono-tabular text-xs text-[#DCE9DF]/80">
          Menunjukkan <strong>{filtered.length}</strong> daripada <strong>{students.length}</strong> murid
        </p>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="teacher-holo-panel rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#36D9FF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama, ID murid atau username..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#092D27] border border-[#36D9FF]/30 text-xs text-white placeholder-[#DCE9DF]/45 focus:border-[#36D9FF] focus:outline-none"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-xs text-white"
        >
          <option value="semua">Semua Kelas</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-xs text-white"
        >
          <option value="semua">Semua Status Tugasan</option>
          <option value="selesai">Selesai Sepenuhnya</option>
          <option value="sedang_berjalan">Sedang Berjalan</option>
          <option value="belum_mula">Belum Mula</option>
          <option value="perlu_semakan">Perlu Semakan Guru</option>
        </select>

        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as 'name' | 'score' | 'completion' | 'xp')}
          className="rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-xs text-white"
        >
          <option value="name">Susun: Nama (A–Z)</option>
          <option value="score">Susun: Skor Akademik Tertinggi</option>
          <option value="completion">Susun: Kemajuan Misi</option>
          <option value="xp">Susun: XP Detektif</option>
        </select>
      </div>

      {/* Directory Table */}
      <div className="teacher-holo-panel rounded-2xl overflow-hidden">
        {pageItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#DCE9DF]/75">
            Tiada rekod murid sepadan dengan carian atau penapis yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#092D27]/90 border-b border-[#36D9FF]/25 font-mono-tabular text-[11px] uppercase text-[#36D9FF]">
                <tr>
                  <th className="py-3 px-4">Murid & ID</th>
                  <th className="py-3 px-3">Kelas</th>
                  <th className="py-3 px-3">Status Fasa 1–5</th>
                  <th className="py-3 px-3">Skor Akademik</th>
                  <th className="py-3 px-3">XP / Pangkat</th>
                  <th className="py-3 px-3">Aktiviti Terkini</th>
                  <th className="py-3 px-4 text-right">Fail Akademik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {pageItems.map((s) => (
                  <tr key={s.username} className="hover:bg-[#1D6652]/35 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-sm text-white">
                        {s.name}
                        {s.isDemo && (
                          <span className="ml-1.5 text-[10px] font-mono-tabular text-[#D9B45B]">
                            [DEMO]
                          </span>
                        )}
                      </p>
                      <p className="font-mono-tabular text-[11px] text-[#DCE9DF]/70">
                        {s.studentId} · @{s.username}
                      </p>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#F5F0E5] whitespace-nowrap">
                      {s.className}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {(
                          [
                            ['F1', s.metrics.phase1Status],
                            ['F2', s.metrics.phase2Status],
                            ['F3', s.metrics.phase3Status],
                            ['F4', s.metrics.phase4Status],
                            ['F5', s.metrics.phase5Status],
                          ] as const
                        ).map(([code, st]) => (
                          <span
                            key={code}
                            title={`${code}: ${getPhaseStatusLabel(st)}`}
                            className={`px-1.5 py-0.5 rounded font-mono-tabular text-[10px] font-bold ${getPhaseStatusBadgeClass(
                              st
                            )}`}
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono-tabular">
                      <p className="font-extrabold text-sm text-[#5BFFCA]">
                        {s.metrics.overallAcademicScore !== null
                          ? `${s.metrics.overallAcademicScore}%`
                          : '—'}
                      </p>
                      <p className="text-[10px] text-[#DCE9DF]/70">
                        Misi: {s.metrics.missionCompletionPercent}%
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-mono-tabular font-bold text-[#F7DA82]">{s.xp} XP</p>
                      <p className="text-[11px] text-[#DCE9DF]/75">{s.rank}</p>
                    </td>
                    <td className="py-3 px-3 max-w-[220px]">
                      <p className="text-[#F5F0E5] truncate">{s.latestActivityText}</p>
                      <p className="font-mono-tabular text-[10px] text-[#DCE9DF]/65">
                        {formatDateTime(s.latestActivityAt)}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenStudentDossier(s.username)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D9B45B] hover:bg-[#F3DBA0] text-[#092D27] text-xs font-extrabold transition-colors"
                      >
                        <FileSearch className="w-3.5 h-3.5" />
                        <span>Buka Fail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-[#DCE9DF]">
            <span className="font-mono-tabular">
              Halaman {safePage} / {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-[#123E34] border border-white/15 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-[#123E34] border border-white/15 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
