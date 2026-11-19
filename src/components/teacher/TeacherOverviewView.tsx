import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownUp,
  Award,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Filter,
  Lightbulb,
  PieChart,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import type { TeacherDashboardFilters } from '../../game/teacherClient';
import type { LocationId, TeacherDashboardPayload } from '../../game/types';
import { TeacherCampusMap3D } from './TeacherCampusMap3D';
import {
  formatDateTime,
  type TeacherNavSection,
} from './teacherUtils';

interface TeacherOverviewViewProps {
  payload: TeacherDashboardPayload;
  filters: TeacherDashboardFilters;
  onChangeFilters: (next: TeacherDashboardFilters) => void;
  onOpenExportModalOrTab: () => void;
  onOpenStudentDossier: (username: string) => void;
  onNavigateSubmissionsForPhase: (phaseId: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5') => void;
  onNavigateSubmissionsForLocation: (locId: LocationId) => void;
  onSelectSection: (section: TeacherNavSection) => void;
}

function CircularProgressRing({
  percent,
  color,
  size = 56,
}: {
  percent: number;
  color: string;
  size?: number;
}) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c * (1 - clamped / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="transition-all duration-700"
      />
    </svg>
  );
}

export function TeacherOverviewView({
  payload,
  filters,
  onChangeFilters,
  onOpenExportModalOrTab,
  onOpenStudentDossier,
  onNavigateSubmissionsForPhase,
  onNavigateSubmissionsForLocation,
  onSelectSection,
}: TeacherOverviewViewProps) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'donut'>('bar');
  const [compareMode, setCompareMode] = useState<'class' | 'individual'>('class');
  const [compareStudentUsername, setCompareStudentUsername] = useState<string>(
    payload.students[0]?.username || ''
  );
  const [sortBy, setSortBy] = useState<'score' | 'completion' | 'xp'>('score');

  const uniqueYears = useMemo(
    () => Array.from(new Set(payload.classes.map((c) => c.yearLevel))).sort(),
    [payload.classes]
  );

  const selectedIndividual = useMemo(
    () =>
      payload.students.find((s) => s.username === compareStudentUsername) ||
      payload.students[0] ||
      null,
    [payload.students, compareStudentUsername]
  );

  const sortedRanking = useMemo(() => {
    const arr = [...payload.students];
    arr.sort((a, b) => {
      if (sortBy === 'xp') return b.xp - a.xp;
      if (sortBy === 'completion') {
        return b.metrics.missionCompletionPercent - a.metrics.missionCompletionPercent;
      }
      return (b.metrics.overallAcademicScore ?? -1) - (a.metrics.overallAcademicScore ?? -1);
    });
    return arr;
  }, [payload.students, sortBy]);

  const { kpis } = payload;

  const activeStudentsPct =
    kpis.totalStudents > 0 ? Math.round((kpis.activeStudents / kpis.totalStudents) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Main Header & Tagline */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#36D9FF]/20 pb-4">
        <div>
          <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.22em] text-[#36D9FF]">
            PUSAT KAWALAN AKADEMIK · DETECTIVE ACADEMY
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F0E5] mt-1">
            DASHBOARD ANALITIK GURU
          </h1>
          <p className="font-mono-tabular text-xs font-semibold tracking-[0.16em] text-[#D9B45B] mt-1">
            PANTAU PRESTASI • ANALISIS DATA • BIMBING PEMBELAJARAN
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenExportModalOrTab}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D9B45B] to-[#E7C878] hover:brightness-105 text-[#092D27] text-xs font-extrabold uppercase tracking-wider shadow-[0_0_20px_rgba(217,180,91,0.3)] transition-all"
          >
            <Download className="w-4 h-4" />
            <span>EKSPORT LAPORAN</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Sesi semasa, Tahun, Kelas, Murid, Julat tarikh */}
      <div className="no-print teacher-holo-panel rounded-2xl p-3.5 sm:p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#36D9FF] mb-3">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-mono-tabular uppercase tracking-wider">Penapis Data Masa Nyata</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <div>
            <label className="block text-[11px] text-[#DCE9DF]/75 mb-1">Sesi Semasa</label>
            <select
              value={filters.session || 'semua'}
              onChange={(e) => onChangeFilters({ ...filters, session: e.target.value })}
              className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-2.5 py-2 text-xs text-white focus:border-[#36D9FF] focus:outline-none"
            >
              <option value="semua">Semua Sesi</option>
              {payload.sessions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#DCE9DF]/75 mb-1">Tahun</label>
            <select
              value={filters.year || 'semua'}
              onChange={(e) => onChangeFilters({ ...filters, year: e.target.value })}
              className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-2.5 py-2 text-xs text-white focus:border-[#36D9FF] focus:outline-none"
            >
              <option value="semua">Semua Tahun</option>
              {uniqueYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#DCE9DF]/75 mb-1">Kelas</label>
            <select
              value={filters.className || 'semua'}
              onChange={(e) => onChangeFilters({ ...filters, className: e.target.value })}
              className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-2.5 py-2 text-xs text-white focus:border-[#36D9FF] focus:outline-none"
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
            <label className="block text-[11px] text-[#DCE9DF]/75 mb-1">Murid</label>
            <select
              value={filters.student || 'semua'}
              onChange={(e) => onChangeFilters({ ...filters, student: e.target.value })}
              className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-2.5 py-2 text-xs text-white focus:border-[#36D9FF] focus:outline-none"
            >
              <option value="semua">Semua Murid</option>
              {payload.students.map((s) => (
                <option key={s.username} value={s.username}>
                  {s.name} ({s.className})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#DCE9DF]/75 mb-1">Tarikh Dari</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => onChangeFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-2.5 py-2 text-xs text-white font-mono-tabular focus:border-[#36D9FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#DCE9DF]/75 mb-1">Tarikh Hingga</label>
            <div className="flex gap-1.5">
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => onChangeFilters({ ...filters, dateTo: e.target.value })}
                className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-2.5 py-2 text-xs text-white font-mono-tabular focus:border-[#36D9FF] focus:outline-none"
              />
              {(filters.session !== 'semua' ||
                filters.year !== 'semua' ||
                filters.className !== 'semua' ||
                filters.student !== 'semua' ||
                filters.dateFrom ||
                filters.dateTo) && (
                <button
                  type="button"
                  onClick={() =>
                    onChangeFilters({
                      session: 'semua',
                      year: 'semua',
                      className: 'semua',
                      student: 'semua',
                      dateFrom: '',
                      dateTo: '',
                      includeDemo: filters.includeDemo,
                    })
                  }
                  className="px-2.5 rounded-lg bg-[#1D6652] hover:bg-[#00BFA6] hover:text-[#092D27] text-xs font-bold text-white transition-colors shrink-0"
                  title="Set semula penapis"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: JUMLAH MURID */}
        <div className="teacher-holo-panel rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#36D9FF]">
              JUMLAH MURID
            </p>
            <p className="font-mono-tabular text-3xl font-extrabold text-white mt-1">
              {kpis.totalStudents}
            </p>
            <p className="text-xs text-[#DCE9DF]/80 mt-1">
              Aktif menyiasat: <strong className="text-[#5BFFCA] font-mono-tabular">{kpis.activeStudents}</strong>
            </p>
          </div>
          <div className="relative flex items-center justify-center">
            <CircularProgressRing percent={activeStudentsPct} color="#36D9FF" />
            <Users className="w-4 h-4 text-[#36D9FF] absolute" />
          </div>
        </div>

        {/* KPI 2: TUGASAN SELESAI */}
        <div className="teacher-holo-panel rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#00BFA6]">
              TUGASAN SELESAI
            </p>
            <p className="font-mono-tabular text-3xl font-extrabold text-white mt-1">
              {kpis.completionPercent}%
            </p>
            <p className="text-xs text-[#DCE9DF]/80 mt-1 font-mono-tabular">
              {kpis.completedAssignments} selesai · {kpis.pendingAssignments} belum
            </p>
          </div>
          <div className="relative flex items-center justify-center">
            <CircularProgressRing percent={kpis.completionPercent} color="#00BFA6" />
            <CheckCircle2 className="w-4 h-4 text-[#00BFA6] absolute" />
          </div>
        </div>

        {/* KPI 3: PURATA PENCAPAIAN */}
        <div className="teacher-holo-panel rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#D9B45B]">
              PURATA PENCAPAIAN
            </p>
            <p className="font-mono-tabular text-3xl font-extrabold text-white mt-1">
              {kpis.averageAcademicScore !== null ? `${kpis.averageAcademicScore}%` : '—'}
            </p>
            <p className="text-xs text-[#DCE9DF]/80 mt-1">
              {kpis.performanceDelta !== null ? (
                <span>
                  Perubahan percubaan:{' '}
                  <strong
                    className={`font-mono-tabular ${
                      kpis.performanceDelta >= 0 ? 'text-[#5BFFCA]' : 'text-[#F29C85]'
                    }`}
                  >
                    {kpis.performanceDelta >= 0 ? `+${kpis.performanceDelta}%` : `${kpis.performanceDelta}%`}
                  </strong>
                </span>
              ) : (
                'Berdasarkan rubrik akademik'
              )}
            </p>
          </div>
          <div className="relative flex items-center justify-center">
            <CircularProgressRing
              percent={kpis.averageAcademicScore ?? 0}
              color="#D9B45B"
            />
            <TrendingUp className="w-4 h-4 text-[#D9B45B] absolute" />
          </div>
        </div>

        {/* KPI 4: PENCAPAIAN TERTINGGI */}
        <div className="teacher-holo-panel rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#F7DA82]">
              PENCAPAIAN TERTINGGI
            </p>
            {kpis.topStudent ? (
              <>
                <p className="font-display text-lg font-bold text-white mt-1 truncate">
                  {kpis.topStudent.name}
                </p>
                <p className="text-xs text-[#DCE9DF]/85 mt-1 font-mono-tabular truncate">
                  Skor {kpis.topStudent.scorePercent}% · {kpis.topStudent.badgeName}
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-lg font-bold text-[#DCE9DF]/70 mt-1">
                  Belum ada data
                </p>
                <p className="text-xs text-[#DCE9DF]/65 mt-1">
                  Menunggu tugasan dihantar
                </p>
              </>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#D9B45B]/15 border border-[#D9B45B]/45 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-[#D9B45B]" />
          </div>
        </div>
      </div>

      {/* MAIN ANALYTICS GRID: Charts (Left 7 cols) + Task Summary & Recent Activity (Right 5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* LEFT: PRESTASI MENGIKUT FASA */}
        <div className="xl:col-span-7 teacher-holo-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#36D9FF]/20 pb-3">
            <div>
              <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-[0.18em] text-[#36D9FF]">
                ANALITIK FASA PEMBELAJARAN
              </p>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                Prestasi Mengikut Fasa
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Chart Type Switcher */}
              <div className="inline-flex rounded-lg bg-[#092D27] border border-[#36D9FF]/25 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                    chartType === 'bar' ? 'bg-[#1D6652] text-white' : 'text-[#DCE9DF]/75 hover:text-white'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5 text-[#36D9FF]" />
                  <span>Bar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('line')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                    chartType === 'line' ? 'bg-[#1D6652] text-white' : 'text-[#DCE9DF]/75 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[#00BFA6]" />
                  <span>Garis</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('donut')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                    chartType === 'donut' ? 'bg-[#1D6652] text-white' : 'text-[#DCE9DF]/75 hover:text-white'
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5 text-[#D9B45B]" />
                  <span>Donat</span>
                </button>
              </div>

              {/* Class vs Individual Switcher */}
              <div className="inline-flex rounded-lg bg-[#092D27] border border-[#D9B45B]/30 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCompareMode('class')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    compareMode === 'class' ? 'bg-[#D9B45B] text-[#092D27]' : 'text-[#DCE9DF]/80'
                  }`}
                >
                  Kelas
                </button>
                <button
                  type="button"
                  onClick={() => setCompareMode('individual')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    compareMode === 'individual' ? 'bg-[#D9B45B] text-[#092D27]' : 'text-[#DCE9DF]/80'
                  }`}
                >
                  Individu
                </button>
              </div>
            </div>
          </div>

          {compareMode === 'individual' && payload.students.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#092D27]/75 border border-[#36D9FF]/20 rounded-xl px-3 py-2 text-xs">
              <span className="text-[#DCE9DF]">Pilih murid untuk bandingkan dengan purata kelas:</span>
              <select
                value={selectedIndividual?.username || ''}
                onChange={(e) => setCompareStudentUsername(e.target.value)}
                className="rounded-lg bg-[#123E34] border border-[#36D9FF]/40 px-2.5 py-1 text-xs text-white"
              >
                {payload.students.map((s) => (
                  <option key={s.username} value={s.username}>
                    {s.name} ({s.className})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Chart Canvas Area */}
          {chartType === 'bar' && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-5 gap-2 sm:gap-4 items-end h-56 pt-4 px-2 bg-[#092D27]/65 rounded-xl border border-white/10">
                {payload.phaseSummary.map((p) => {
                  const classScore = p.averageScore ?? 0;
                  const indScore =
                    selectedIndividual && p.phaseId === 'phase1'
                      ? selectedIndividual.metrics.phase1Score ?? 0
                      : selectedIndividual && p.phaseId === 'phase2'
                        ? selectedIndividual.metrics.phase2Score ?? 0
                        : selectedIndividual && p.phaseId === 'phase3'
                          ? selectedIndividual.metrics.phase3Score ?? 0
                          : selectedIndividual && p.phaseId === 'phase4'
                            ? selectedIndividual.metrics.phase4Score ?? 0
                            : selectedIndividual && p.phaseId === 'phase5'
                              ? selectedIndividual.metrics.phase5Score ?? 0
                              : 0;

                  return (
                    <div key={p.phaseId} className="flex flex-col items-center h-full justify-end pb-2">
                      <div className="flex items-end justify-center gap-1.5 w-full flex-1 px-1">
                        {/* Completion % Bar */}
                        <div className="flex flex-col items-center justify-end h-full w-4 sm:w-6">
                          <span className="font-mono-tabular text-[10px] text-[#36D9FF] mb-1">
                            {p.completionPercent}%
                          </span>
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-[#00BFA6] to-[#36D9FF] transition-all duration-500 min-h-[4px]"
                            style={{ height: `${Math.max(4, p.completionPercent)}%` }}
                            title={`Siap: ${p.completionPercent}%`}
                          />
                        </div>

                        {/* Average Score % Bar (or Individual comparison) */}
                        <div className="flex flex-col items-center justify-end h-full w-4 sm:w-6">
                          <span className="font-mono-tabular text-[10px] text-[#D9B45B] mb-1">
                            {compareMode === 'individual'
                              ? `${indScore}%`
                              : p.averageScore !== null
                                ? `${classScore}%`
                                : '—'}
                          </span>
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-[#B48120] to-[#F3DBA0] transition-all duration-500 min-h-[4px]"
                            style={{
                              height: `${Math.max(
                                4,
                                compareMode === 'individual' ? indScore : classScore
                              )}%`,
                            }}
                            title={
                              compareMode === 'individual'
                                ? `Skor Individu: ${indScore}%`
                                : `Purata Skor: ${p.averageScore ?? 0}%`
                            }
                          />
                        </div>
                      </div>
                      <p className="font-mono-tabular text-[10px] font-bold text-[#DCE9DF] text-center mt-2 leading-tight">
                        {p.shortLabel}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-[#DCE9DF]">
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-[#36D9FF]" />
                  <span>Peratus Kemajuan Misi</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-[#D9B45B]" />
                  <span>
                    {compareMode === 'individual' && selectedIndividual
                      ? `Skor Akademik: ${selectedIndividual.name}`
                      : 'Purata Skor Akademik (%)'}
                  </span>
                </span>
              </div>
            </div>
          )}

          {chartType === 'line' && (
            <div className="space-y-3 py-2">
              {payload.timelineSeries.length === 0 ? (
                <div className="h-56 rounded-xl bg-[#092D27]/65 border border-white/10 flex flex-col items-center justify-center p-6 text-center">
                  <Activity className="w-8 h-8 text-[#36D9FF]/60 mb-2" />
                  <p className="text-sm font-semibold text-[#F5F0E5]">
                    Belum Ada Siri Garis Masa Penghantaran
                  </p>
                  <p className="text-xs text-[#DCE9DF]/70 mt-1 max-w-sm">
                    Graf garis akan terisi secara automatik apabila murid mula menghantar jawapan tugasan pada tarikh berbeza.
                  </p>
                </div>
              ) : (
                <div className="h-56 rounded-xl bg-[#092D27]/65 border border-white/10 p-4 flex flex-col justify-between">
                  <svg viewBox="0 0 500 160" className="w-full h-36 overflow-visible">
                    {[0, 50, 100].map((v) => {
                      const y = 140 - (v / 100) * 120;
                      return (
                        <g key={v}>
                          <line
                            x1="32"
                            y1={y}
                            x2="490"
                            y2={y}
                            stroke="rgba(255,255,255,0.12)"
                            strokeDasharray="4 4"
                          />
                          <text
                            x="0"
                            y={y + 4}
                            fill="#DCE9DF"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            {v}%
                          </text>
                        </g>
                      );
                    })}
                    {(() => {
                      const pts = payload.timelineSeries.map((pt, i) => {
                        const x =
                          payload.timelineSeries.length === 1
                            ? 260
                            : 44 + (i * 430) / (payload.timelineSeries.length - 1);
                        const val = pt.averageScore ?? 0;
                        const y = 140 - (val / 100) * 120;
                        return { x, y, ...pt, val };
                      });
                      const pathD = pts
                        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                        .join(' ');
                      return (
                        <>
                          {pts.length === 1 ? (
                            <line
                              x1="44"
                              y1={pts[0].y}
                              x2="474"
                              y2={pts[0].y}
                              stroke="#36D9FF"
                              strokeOpacity="0.45"
                              strokeWidth="2"
                              strokeDasharray="6 4"
                            />
                          ) : (
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#36D9FF"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          {pts.map((p) => (
                            <g key={p.dateLabel}>
                              {pts.length === 1 && (
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r="10"
                                  fill="#36D9FF"
                                  fillOpacity="0.2"
                                />
                              )}
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="5"
                                fill="#D9B45B"
                                stroke="#092D27"
                                strokeWidth="2"
                              />
                              <text
                                x={p.x}
                                y={Math.max(14, p.y - 10)}
                                textAnchor="middle"
                                fill="#F5F0E5"
                                fontSize="10"
                                fontFamily="monospace"
                              >
                                {p.val}% ({p.submissionsCount})
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                  <div
                    className={`flex items-center text-[10px] font-mono-tabular text-[#DCE9DF]/75 px-2 ${
                      payload.timelineSeries.length === 1 ? 'justify-center' : 'justify-between'
                    }`}
                  >
                    {payload.timelineSeries.map((pt) => (
                      <span key={pt.dateLabel}>{pt.dateLabel}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {chartType === 'donut' && (
            <div className="h-56 rounded-xl bg-[#092D27]/65 border border-white/10 p-4 flex flex-col sm:flex-row items-center justify-around gap-4">
              {(() => {
                const total = payload.phaseSummary.reduce(
                  (acc, p) => acc + p.completedCount + p.inProgressCount + p.notStartedCount,
                  0
                );
                const comp = payload.phaseSummary.reduce((acc, p) => acc + p.completedCount, 0);
                const prog = payload.phaseSummary.reduce((acc, p) => acc + p.inProgressCount, 0);
                const notS = payload.phaseSummary.reduce((acc, p) => acc + p.notStartedCount, 0);
                const compPct = total > 0 ? Math.round((comp / total) * 100) : 0;
                const rawProgPct = total > 0 ? Math.round((prog / total) * 100) : 0;
                const progPct = Math.min(rawProgPct, Math.max(0, 100 - compPct));
                const notPct = Math.max(0, 100 - compPct - progPct);

                return (
                  <>
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        <circle
                          cx="60"
                          cy="60"
                          r="44"
                          fill="none"
                          stroke="rgba(255,255,255,0.12)"
                          strokeWidth="14"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="44"
                          fill="none"
                          stroke="#00BFA6"
                          strokeWidth="14"
                          strokeDasharray={`${(compPct / 100) * 276.46} 276.46`}
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="44"
                          fill="none"
                          stroke="#D9B45B"
                          strokeWidth="14"
                          strokeDasharray={`${(progPct / 100) * 276.46} 276.46`}
                          strokeDashoffset={-((compPct / 100) * 276.46)}
                        />
                      </svg>
                      <div className="absolute text-center">
                        <p className="font-mono-tabular text-xl font-extrabold text-white">
                          {compPct}%
                        </p>
                        <p className="text-[10px] text-[#DCE9DF]/75">Selesai</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between gap-6">
                        <span className="inline-flex items-center gap-2 text-[#DCE9DF]">
                          <span className="w-3 h-3 rounded-full bg-[#00BFA6]" />
                          Selesai Sepenuhnya
                        </span>
                        <span className="font-mono-tabular font-bold text-white">
                          {comp} ({compPct}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <span className="inline-flex items-center gap-2 text-[#DCE9DF]">
                          <span className="w-3 h-3 rounded-full bg-[#D9B45B]" />
                          Sedang Berjalan
                        </span>
                        <span className="font-mono-tabular font-bold text-white">
                          {prog} ({progPct}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <span className="inline-flex items-center gap-2 text-[#DCE9DF]">
                          <span className="w-3 h-3 rounded-full bg-white/25" />
                          Belum Mula
                        </span>
                        <span className="font-mono-tabular font-bold text-white">
                          {notS} ({notPct}%)
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* RIGHT: RINGKASAN TUGASAN + AKTIVITI TERKINI */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          {/* RINGKASAN TUGASAN */}
          <div className="teacher-holo-panel rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-[0.18em] text-[#00BFA6]">
                  PENYIAPAN MODUL
                </p>
                <h2 className="font-display text-lg font-bold text-white">Ringkasan Tugasan</h2>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection('submissions')}
                className="text-xs font-semibold text-[#36D9FF] hover:underline"
              >
                Semua Tugasan →
              </button>
            </div>

            <div className="space-y-2">
              {payload.phaseSummary.map((p) => (
                <button
                  key={p.phaseId}
                  type="button"
                  onClick={() => onNavigateSubmissionsForPhase(p.phaseId)}
                  className="w-full text-left rounded-xl bg-[#092D27]/80 hover:bg-[#123E34] border border-white/10 hover:border-[#36D9FF]/45 p-2.5 transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#F5F0E5] group-hover:text-white truncate">
                      {p.label}
                    </span>
                    <span className="font-mono-tabular font-bold text-[#5BFFCA] shrink-0">
                      {p.completionPercent}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#00BFA6] to-[#36D9FF]"
                        style={{ width: `${p.completionPercent}%` }}
                      />
                    </div>
                    <span className="font-mono-tabular text-[10px] text-[#DCE9DF]/70 shrink-0">
                      {p.completedCount} siap · {p.inProgressCount} aktif
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* AKTIVITI TERKINI */}
          <div className="teacher-holo-panel rounded-2xl p-4 sm:p-5 space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D9B45B]" />
                <h2 className="font-display text-lg font-bold text-white">Aktiviti Terkini</h2>
              </div>
              <span className="font-mono-tabular text-[11px] text-[#DCE9DF]/70">
                {payload.recentActivities.length} rekod
              </span>
            </div>

            {payload.recentActivities.length === 0 ? (
              <div className="rounded-xl bg-[#092D27]/70 border border-white/10 p-5 text-center text-xs text-[#DCE9DF]/75">
                Belum ada log aktiviti terkini bagi penapis yang dipilih.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {payload.recentActivities.slice(0, 8).map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => onOpenStudentDossier(act.studentUsername)}
                    className="w-full text-left rounded-xl bg-[#092D27]/75 hover:bg-[#123E34] border border-white/10 hover:border-[#36D9FF]/45 p-2.5 transition-colors flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#F5F0E5] truncate">
                        {act.studentName} · <span className="text-[#36D9FF]">{act.className}</span>
                      </p>
                      <p className="text-xs text-[#DCE9DF]/85 line-clamp-1 mt-0.5">
                        {act.description}
                      </p>
                    </div>
                    <span className="font-mono-tabular text-[10px] text-[#D9B45B] whitespace-nowrap shrink-0">
                      {formatDateTime(act.timestamp)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PETA PENYIASATAN SEKOLAH 3D */}
      <TeacherCampusMap3D
        locationAggregates={payload.locationAggregates}
        onInspectLocationSubmissions={onNavigateSubmissionsForLocation}
      />

      {/* LOWER GRID: PRESTASI MURID (RANKING) + PENCAPAIAN & PERKEMBANGAN + PETUA PENGAJAR */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* PRESTASI MURID */}
        <div className="xl:col-span-7 teacher-holo-panel rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#36D9FF]/20 pb-3">
            <div>
              <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-[0.18em] text-[#36D9FF]">
                PEMISAHAN SKOR AKADEMIK VS GAMIFIKASI
              </p>
              <h2 className="font-display text-lg font-bold text-white">Prestasi Murid</h2>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <ArrowDownUp className="w-3.5 h-3.5 text-[#D9B45B]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'completion' | 'xp')}
                className="rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-2.5 py-1.5 text-xs text-white"
              >
                <option value="score">Susun: Skor Akademik</option>
                <option value="completion">Susun: Kemajuan Misi</option>
                <option value="xp">Susun: XP Detektif</option>
              </select>
            </div>
          </div>

          {sortedRanking.length === 0 ? (
            <div className="rounded-xl bg-[#092D27]/70 border border-white/10 p-6 text-center text-xs text-[#DCE9DF]/75">
              Tiada murid dalam penapis semasa.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/15 text-[11px] font-mono-tabular uppercase text-[#DCE9DF]/75">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-3">Murid</th>
                    <th className="py-2 pr-3">Skor Akademik</th>
                    <th className="py-2 pr-3">Kemajuan</th>
                    <th className="py-2 pr-3">XP & Pangkat</th>
                    <th className="py-2 text-right">Fail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {sortedRanking.map((s, idx) => (
                    <tr
                      key={s.username}
                      className="hover:bg-[#1D6652]/40 transition-colors"
                    >
                      <td className="py-2.5 pr-2 font-mono-tabular font-bold text-[#D9B45B]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 pr-3">
                        <p className="font-bold text-[#F5F0E5]">
                          {s.name}
                          {s.isDemo && (
                            <span className="ml-1.5 text-[10px] font-mono-tabular text-[#D9B45B]">
                              [DEMO]
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-[#DCE9DF]/70 font-mono-tabular">
                          {s.studentId} · {s.className}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3 font-mono-tabular font-bold text-[#5BFFCA]">
                        {s.metrics.overallAcademicScore !== null
                          ? `${s.metrics.overallAcademicScore}%`
                          : 'Belum ada'}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2 font-mono-tabular">
                          <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-[#36D9FF]"
                              style={{ width: `${s.metrics.missionCompletionPercent}%` }}
                            />
                          </div>
                          <span>{s.metrics.missionCompletionPercent}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <p className="font-mono-tabular font-bold text-[#F7DA82]">{s.xp} XP</p>
                        <p className="text-[10px] text-[#DCE9DF]/70">{s.rank}</p>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenStudentDossier(s.username)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#123E34] hover:bg-[#36D9FF] hover:text-[#092D27] border border-[#36D9FF]/35 text-[11px] font-bold text-[#F5F0E5] transition-colors"
                        >
                          <span>Fail</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT 5 COLS: PENCAPAIAN MURID & PETUA PENGAJAR */}
        <div className="xl:col-span-5 space-y-5">
          {/* PENCAPAIAN & PERKEMBANGAN MURID */}
          <div className="teacher-holo-panel rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#D9B45B]" />
                <h2 className="font-display text-lg font-bold text-white">
                  Pencapaian & Lencana Terbaharu
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection('achievements')}
                className="text-xs font-semibold text-[#36D9FF] hover:underline"
              >
                Lihat Semua →
              </button>
            </div>

            {payload.achievements.length === 0 ? (
              <p className="text-xs text-[#DCE9DF]/75 bg-[#092D27]/70 border border-white/10 rounded-xl p-4">
                Belum ada lencana dibuka oleh murid dalam penapis semasa.
              </p>
            ) : (
              <div className="space-y-2">
                {payload.achievements.slice(0, 4).map((ach, i) => (
                  <div
                    key={`${ach.studentUsername}_${ach.badgeId}_${i}`}
                    className="rounded-xl bg-[#092D27]/80 border border-[#D9B45B]/30 p-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#F7DA82] truncate">{ach.badgeName}</p>
                      <p className="text-[11px] text-[#DCE9DF]/85 truncate">
                        {ach.studentName} · {ach.className}
                      </p>
                    </div>
                    <span className="font-mono-tabular text-[10px] text-[#DCE9DF]/70 shrink-0">
                      {formatDateTime(ach.unlockedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PETUA PENGAJAR (DATA-DRIVEN) */}
          <div className="teacher-light-panel rounded-2xl p-4 sm:p-5 text-[#26382F] space-y-3">
            <div className="flex items-center gap-2 border-b border-[#1D6652]/15 pb-2">
              <Lightbulb className="w-4 h-4 text-[#B48120]" />
              <h2 className="font-display text-lg font-bold text-[#26382F]">
                Petua Pengajar (Analisis Sebenar)
              </h2>
            </div>

            <div className="space-y-2.5">
              {payload.insights.map((ins) => (
                <div
                  key={ins.id}
                  className={`rounded-xl p-3 border text-xs space-y-1 ${
                    ins.severity === 'warning'
                      ? 'bg-[#FFF5EB] border-[#C2593F]/40'
                      : ins.severity === 'positive'
                        ? 'bg-[#DCE9DF] border-[#1D6652]/35'
                        : 'bg-white border-[#1D6652]/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-[#26382F]">{ins.title}</p>
                    {ins.affectedCount > 0 && (
                      <span className="font-mono-tabular text-[11px] font-bold text-[#1D6652] shrink-0">
                        {ins.affectedCount} murid
                      </span>
                    )}
                  </div>
                  <p className="text-[#26382F]/85 leading-relaxed">{ins.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
