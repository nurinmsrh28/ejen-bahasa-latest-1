import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import type { TeacherDashboardPayload } from '../../game/types';
import {
  buildExportRows,
  exportSummaryCsv,
  exportSummaryExcel,
} from './teacherUtils';

interface TeacherExportViewProps {
  payload: TeacherDashboardPayload;
}

export function TeacherExportView({ payload }: TeacherExportViewProps) {
  const [classFilter, setClassFilter] = useState('semua');
  const [studentFilter, setStudentFilter] = useState('semua');
  const [onlyCompleted, setOnlyCompleted] = useState(false);

  useEffect(() => {
    if (
      studentFilter !== 'semua' &&
      !payload.students.some((s) => s.username === studentFilter)
    ) {
      setStudentFilter('semua');
    }
  }, [payload.students, studentFilter]);

  useEffect(() => {
    if (
      classFilter !== 'semua' &&
      !payload.classes.some((c) => c.name === classFilter)
    ) {
      setClassFilter('semua');
    }
  }, [payload.classes, classFilter]);

  const filteredStudents = useMemo(() => {
    return payload.students.filter((s) => {
      if (classFilter !== 'semua' && s.className !== classFilter) return false;
      if (studentFilter !== 'semua' && s.username !== studentFilter) return false;
      if (onlyCompleted && s.metrics.missionCompletionPercent < 100) return false;
      return true;
    });
  }, [payload.students, classFilter, studentFilter, onlyCompleted]);

  const rows = useMemo(() => buildExportRows(filteredStudents), [filteredStudents]);

  const filterLabel = `${classFilter === 'semua' ? 'Semua Kelas' : classFilter} · ${
    studentFilter === 'semua'
      ? 'Semua Murid'
      : filteredStudents[0]?.name || studentFilter
  }`;

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-end justify-between gap-3 border-b border-[#36D9FF]/20 pb-4">
        <div>
          <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.2em] text-[#36D9FF]">
            08 — JANA & EKSPORT LAPORAN RASMI
          </p>
          <h1 className="font-display text-2xl font-bold text-[#F5F0E5] mt-0.5">
            Pusat Eksport Laporan Analitik Guru
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={rows.length === 0}
            onClick={() => exportSummaryCsv(rows)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#123E34] hover:bg-[#1D6652] border border-[#36D9FF]/45 text-xs font-bold text-white disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#36D9FF]" />
            <span>Eksport CSV</span>
          </button>
          <button
            type="button"
            disabled={rows.length === 0}
            onClick={() =>
              exportSummaryExcel(rows, {
                teacherName: payload.teacher.profile?.name || payload.teacher.username,
                filterLabel,
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00BFA6] hover:bg-[#2CF2AF] text-[#092D27] text-xs font-extrabold disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Eksport Excel (.xls)</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D9B45B] hover:bg-[#F3DBA0] text-[#092D27] text-xs font-extrabold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Report Configuration Filters */}
      <div className="no-print teacher-holo-panel rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-[#DCE9DF]/80 mb-1">Tapis Kelas</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-white"
          >
            <option value="semua">Semua Kelas</option>
            {payload.classes.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[#DCE9DF]/80 mb-1">Tapis Murid</label>
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-white"
          >
            <option value="semua">Semua Murid</option>
            {payload.students.map((s) => (
              <option key={s.username} value={s.username}>
                {s.name} ({s.className})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="inline-flex items-center gap-2 text-[#F5F0E5] cursor-pointer">
            <input
              type="checkbox"
              checked={onlyCompleted}
              onChange={(e) => setOnlyCompleted(e.target.checked)}
              className="w-4 h-4 accent-[#D9B45B]"
            />
            <span>Hanya murid yang selesai 100% misi</span>
          </label>
        </div>
      </div>

      {/* Printable Report Preview Table */}
      <div className="teacher-print-surface rounded-2xl bg-[#F5F0E5] text-[#26382F] border border-[#1D6652]/30 p-5 space-y-4">
        <div className="border-b border-[#1D6652]/20 pb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#1D6652]">
              DETECTIVE ACADEMY · SEKOLAH SERI BESTARI
            </p>
            <h2 className="font-display text-xl font-bold text-[#26382F]">
              Laporan Prestasi & Rekod Pembelajaran Murid
            </h2>
            <p className="text-xs text-[#4B6357] mt-0.5">
              Guru: <strong>{payload.teacher.profile?.name || payload.teacher.username}</strong> · Penapis: {filterLabel}
            </p>
          </div>
          <p className="font-mono-tabular text-xs text-[#4B6357]">
            {rows.length} rekod murid · {new Date().toLocaleDateString('ms-MY')}
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-[#4B6357] py-6 text-center">
            Tiada rekod murid untuk dieksport bagi pilihan penapis ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#092D27] text-[#F5F0E5] font-mono-tabular">
                  <th className="py-2 px-2.5">ID</th>
                  <th className="py-2 px-2.5">Nama Murid</th>
                  <th className="py-2 px-2.5">Kelas</th>
                  <th className="py-2 px-2.5">Purata Akademik</th>
                  <th className="py-2 px-2.5">Misi</th>
                  <th className="py-2 px-2.5">F1</th>
                  <th className="py-2 px-2.5">F2</th>
                  <th className="py-2 px-2.5">F3</th>
                  <th className="py-2 px-2.5">F4</th>
                  <th className="py-2 px-2.5">F5</th>
                  <th className="py-2 px-2.5">XP (Gamifikasi)</th>
                  <th className="py-2 px-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D6652]/15">
                {rows.map((r, idx) => (
                  <tr key={`${r.studentId}-${idx}`} className="hover:bg-[#DCE9DF]/50">
                    <td className="py-2 px-2.5 font-mono-tabular font-semibold">{r.studentId}</td>
                    <td className="py-2 px-2.5 font-bold">{r.studentName}</td>
                    <td className="py-2 px-2.5">{r.className}</td>
                    <td className="py-2 px-2.5 font-mono-tabular font-bold text-[#1D6652]">
                      {r.overallScore}
                    </td>
                    <td className="py-2 px-2.5 font-mono-tabular">{r.completionPercent}</td>
                    <td className="py-2 px-2.5 font-mono-tabular">{r.phase1Score}</td>
                    <td className="py-2 px-2.5 font-mono-tabular">{r.phase2Score}</td>
                    <td className="py-2 px-2.5 font-mono-tabular">{r.phase3Score}</td>
                    <td className="py-2 px-2.5 font-mono-tabular">{r.phase4Score}</td>
                    <td className="py-2 px-2.5 font-mono-tabular">{r.phase5Score}</td>
                    <td className="py-2 px-2.5 font-mono-tabular">{r.xp} XP</td>
                    <td className="py-2 px-2.5">{r.needsReview}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
