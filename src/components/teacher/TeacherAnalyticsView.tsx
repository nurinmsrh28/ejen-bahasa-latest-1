import React, { useMemo } from 'react';
import { BarChart3, CheckCircle2, Layers, TrendingUp } from 'lucide-react';
import { LOCATIONS, LOGIC_CHALLENGES } from '../../game/data';
import type { TeacherDashboardPayload, TeacherStudentDossier } from '../../game/types';

interface TeacherAnalyticsViewProps {
  payload: TeacherDashboardPayload;
  dossiersByUsername: Record<string, TeacherStudentDossier>;
  loadingDossiers: boolean;
  onOpenStudentDossier: (username: string) => void;
}

export function TeacherAnalyticsView({
  payload,
  dossiersByUsername,
  loadingDossiers,
  onOpenStudentDossier,
}: TeacherAnalyticsViewProps) {
  const dossiers = useMemo(
    () =>
      payload.students
        .map((s) => dossiersByUsername[s.username])
        .filter((d): d is TeacherStudentDossier => Boolean(d)),
    [payload.students, dossiersByUsername]
  );

  // Class-level aggregation
  const classBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { count: number; avgCompletion: number; scores: number[]; xpSum: number }
    >();
    for (const s of payload.students) {
      const cur = map.get(s.className) || {
        count: 0,
        avgCompletion: 0,
        scores: [],
        xpSum: 0,
      };
      cur.count += 1;
      cur.avgCompletion += s.metrics.missionCompletionPercent;
      if (s.metrics.overallAcademicScore !== null) {
        cur.scores.push(s.metrics.overallAcademicScore);
      }
      cur.xpSum += s.xp;
      map.set(s.className, cur);
    }
    return Array.from(map.entries()).map(([className, data]) => ({
      className,
      count: data.count,
      avgCompletion: data.count > 0 ? Math.round(data.avgCompletion / data.count) : 0,
      avgScore:
        data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : null,
      avgXp: data.count > 0 ? Math.round(data.xpSum / data.count) : 0,
    }));
  }, [payload.students]);

  // 3-Criteria Rubric Diagnostics across Phase 2 & Phase 3
  const criteriaDiagnostics = useMemo(() => {
    let p2Total = 0;
    let p2Complete = 0;
    let p2Evidence = 0;
    let p2Clarity = 0;

    let p3Total = 0;
    let p3Complete = 0;
    let p3Cue = 0;
    let p3Relevance = 0;

    for (const d of dossiers) {
      for (const loc of LOCATIONS) {
        const op = (d.gameState.opinions[loc.id]?.opinionText || '').trim();
        if (op.length > 0) {
          p2Total += 1;
          const ev = d.opinionEvaluations[loc.id];
          if (ev.completeness.met) p2Complete += 1;
          if (ev.evidenceLink.met) p2Evidence += 1;
          if (ev.clarity.met) p2Clarity += 1;
        }
        const reason = (d.gameState.opinions[loc.id]?.reasonText || '').trim();
        if (reason.length > 0) {
          p3Total += 1;
          const rv = d.reasoningEvaluations[loc.id];
          if (rv.completeness.met) p3Complete += 1;
          if (rv.reasoningCue.met) p3Cue += 1;
          if (rv.relevanceLink.met) p3Relevance += 1;
        }
      }
    }

    const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : null);

    return {
      p2Total,
      p2: [
        { label: 'Kelengkapan Ayat Pendapat', pct: pct(p2Complete, p2Total), count: p2Complete },
        { label: 'Perkaitan dengan Bukti', pct: pct(p2Evidence, p2Total), count: p2Evidence },
        { label: 'Kejelasan Penyampaian', pct: pct(p2Clarity, p2Total), count: p2Clarity },
      ],
      p3Total,
      p3: [
        { label: 'Kelengkapan Ayat Alasan', pct: pct(p3Complete, p3Total), count: p3Complete },
        { label: 'Penanda Wacana / Kata Hubung', pct: pct(p3Cue, p3Total), count: p3Cue },
        { label: 'Perkaitan dengan Pendapat', pct: pct(p3Relevance, p3Total), count: p3Relevance },
      ],
    };
  }, [dossiers]);

  // Logic Challenge accuracy breakdown
  const logicStats = useMemo(() => {
    return LOGIC_CHALLENGES.map((ch) => {
      let attempted = 0;
      let correct = 0;
      for (const d of dossiers) {
        const ans = d.gameState.logicChallengeAnswers[ch.id];
        if (ans) {
          attempted += 1;
          const opt = ch.options.find((o) => o.id === ans);
          if (opt?.isRelevant) correct += 1;
        }
      }
      return {
        id: ch.id,
        title: ch.contextTitle,
        attempted,
        correct,
        accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : null,
      };
    });
  }, [dossiers]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#36D9FF]/20 pb-4">
        <div>
          <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.2em] text-[#36D9FF]">
            03 — ANALITIK PRESTASI & RUBRIK BAHASA
          </p>
          <h1 className="font-display text-2xl font-bold text-[#F5F0E5] mt-0.5">
            Analitik Terperinci Mengikut Fasa & Kriteria
          </h1>
        </div>
        {loadingDossiers && (
          <span className="font-mono-tabular text-xs text-[#36D9FF]">
            Memuatkan diagnostik rubrik...
          </span>
        )}
      </div>

      {/* Phase Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {payload.phaseSummary.map((p) => (
          <div key={p.phaseId} className="teacher-holo-panel rounded-2xl p-4 space-y-2">
            <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-[#36D9FF]">
              {p.shortLabel}
            </p>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono-tabular text-2xl font-extrabold text-white">
                {p.averageScore !== null ? `${p.averageScore}%` : '—'}
              </span>
              <span className="font-mono-tabular text-xs font-bold text-[#5BFFCA]">
                {p.completionPercent}% siap
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00BFA6] to-[#36D9FF]"
                style={{ width: `${p.completionPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-[#DCE9DF]/75 font-mono-tabular">
              Selesai: {p.completedCount} · Aktif: {p.inProgressCount}
            </p>
          </div>
        ))}
      </div>

      {/* 3-Criteria Diagnostics (Phase 2 & Phase 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="teacher-holo-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#36D9FF]/20 pb-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00BFA6]" />
              <h2 className="font-display text-lg font-bold text-white">
                Diagnostik 3 Kriteria Fasa 2 (Ayat Pendapat)
              </h2>
            </div>
            <span className="font-mono-tabular text-xs text-[#DCE9DF]/75">
              {criteriaDiagnostics.p2Total} jawapan dinilai
            </span>
          </div>

          {criteriaDiagnostics.p2Total === 0 ? (
            <p className="text-xs text-[#DCE9DF]/75 py-4">
              Belum ada jawapan Fasa 2 dihantar oleh murid dalam penapis semasa.
            </p>
          ) : (
            <div className="space-y-3">
              {criteriaDiagnostics.p2.map((c) => (
                <div key={c.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#F5F0E5]">{c.label}</span>
                    <span className="font-mono-tabular font-bold text-[#5BFFCA]">
                      {c.pct !== null ? `${c.pct}% lulus (${c.count}/${criteriaDiagnostics.p2Total})` : '—'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00BFA6] to-[#36D9FF]"
                      style={{ width: `${c.pct ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="teacher-holo-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#36D9FF]/20 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D9B45B]" />
              <h2 className="font-display text-lg font-bold text-white">
                Diagnostik 3 Kriteria Fasa 3 (Alasan Penyokong)
              </h2>
            </div>
            <span className="font-mono-tabular text-xs text-[#DCE9DF]/75">
              {criteriaDiagnostics.p3Total} jawapan dinilai
            </span>
          </div>

          {criteriaDiagnostics.p3Total === 0 ? (
            <p className="text-xs text-[#DCE9DF]/75 py-4">
              Belum ada alasan bertulis Fasa 3 dihantar oleh murid dalam penapis semasa.
            </p>
          ) : (
            <div className="space-y-3">
              {criteriaDiagnostics.p3.map((c) => (
                <div key={c.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#F5F0E5]">{c.label}</span>
                    <span className="font-mono-tabular font-bold text-[#F7DA82]">
                      {c.pct !== null ? `${c.pct}% lulus (${c.count}/${criteriaDiagnostics.p3Total})` : '—'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#D9B45B] to-[#F3DBA0]"
                      style={{ width: `${c.pct ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logic Challenge Accuracy + Class Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#36D9FF]/20 pb-2.5">
            <BarChart3 className="w-4 h-4 text-[#36D9FF]" />
            <h2 className="font-display text-lg font-bold text-white">
              Ketepatan Cabaran Logik (Fasa 3 Bahagian A)
            </h2>
          </div>
          <div className="space-y-2.5">
            {logicStats.map((ls) => (
              <div
                key={ls.id}
                className="rounded-xl bg-[#092D27]/80 border border-white/10 p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#F5F0E5] truncate">{ls.title}</p>
                  <p className="text-[11px] font-mono-tabular text-[#DCE9DF]/70">
                    {ls.correct}/{ls.attempted} murid memilih alasan relevan
                  </p>
                </div>
                <span className="font-mono-tabular text-base font-extrabold text-[#36D9FF] shrink-0">
                  {ls.accuracy !== null ? `${ls.accuracy}%` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#36D9FF]/20 pb-2.5">
            <TrendingUp className="w-4 h-4 text-[#00BFA6]" />
            <h2 className="font-display text-lg font-bold text-white">
              Perbandingan Mengikut Kelas & Perkembangan
            </h2>
          </div>

          {classBreakdown.length === 0 ? (
            <p className="text-xs text-[#DCE9DF]/75">Tiada kelas ditemui.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/15 font-mono-tabular text-[11px] uppercase text-[#DCE9DF]/75">
                    <th className="py-2 pr-3">Kelas</th>
                    <th className="py-2 pr-3">Bil. Murid</th>
                    <th className="py-2 pr-3">Purata Kemajuan</th>
                    <th className="py-2 pr-3">Purata Skor</th>
                    <th className="py-2">Purata XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {classBreakdown.map((cb) => (
                    <tr key={cb.className}>
                      <td className="py-2.5 pr-3 font-bold text-white">{cb.className}</td>
                      <td className="py-2.5 pr-3 font-mono-tabular">{cb.count}</td>
                      <td className="py-2.5 pr-3 font-mono-tabular text-[#36D9FF] font-bold">
                        {cb.avgCompletion}%
                      </td>
                      <td className="py-2.5 pr-3 font-mono-tabular text-[#5BFFCA] font-bold">
                        {cb.avgScore !== null ? `${cb.avgScore}%` : '—'}
                      </td>
                      <td className="py-2.5 font-mono-tabular text-[#D9B45B] font-bold">
                        {cb.avgXp} XP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Students with positive improvement delta */}
          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-[#D9B45B]">
              Peningkatan Dari Percubaan Awal ke Terkini
            </p>
            <div className="flex flex-wrap gap-2">
              {payload.students
                .filter((s) => s.metrics.improvementDelta !== null)
                .map((s) => (
                  <button
                    key={s.username}
                    type="button"
                    onClick={() => onOpenStudentDossier(s.username)}
                    className="px-2.5 py-1 rounded-lg bg-[#092D27] border border-[#00BFA6]/35 text-xs text-[#F5F0E5] hover:border-[#36D9FF]"
                  >
                    {s.name}:{' '}
                    <strong className="font-mono-tabular text-[#5BFFCA]">
                      {(s.metrics.improvementDelta || 0) >= 0
                        ? `+${s.metrics.improvementDelta}%`
                        : `${s.metrics.improvementDelta}%`}
                    </strong>
                  </button>
                ))}
              {payload.students.every((s) => s.metrics.improvementDelta === null) && (
                <p className="text-xs text-[#DCE9DF]/70">
                  Akan dipaparkan apabila murid membuat semakan / kemas kini jawapan lebih daripada satu versi.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
