import type {
  LocationId,
  PhaseStatus,
  SubmissionHistoryEntry,
  TeacherDashboardPayload,
  TeacherStudentDossier,
  TeacherStudentSummary,
} from '../../game/types';

export const PHASE_LABELS: Record<'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5', string> = {
  phase1: 'Fasa 1 · Operasi Jejak Bukti',
  phase2: 'Fasa 2 · Makmal Analisis Kes',
  phase3: 'Fasa 3 · Buktikan Teori',
  phase4: 'Cabaran Akhir · Studio Arkitek',
  phase5: 'Produk Akhir · Laporan Sekolah Impian',
};

export const PHASE_SHORT_LABELS: Record<
  'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5',
  string
> = {
  phase1: 'Fasa 1',
  phase2: 'Fasa 2',
  phase3: 'Fasa 3',
  phase4: 'Arkitek',
  phase5: 'Laporan',
};

export function formatShortDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getPhaseStatusLabel(status: PhaseStatus): string {
  switch (status) {
    case 'completed':
      return 'Selesai';
    case 'submitted':
      return 'Telah Dihantar';
    case 'in_progress':
      return 'Sedang Berjalan';
    default:
      return 'Belum Mula';
  }
}

export function getPhaseStatusBadgeClass(status: PhaseStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-[#00BFA6]/20 text-[#5BFFCA] border border-[#00BFA6]/50';
    case 'submitted':
      return 'bg-[#36D9FF]/20 text-[#9CEEFF] border border-[#36D9FF]/50';
    case 'in_progress':
      return 'bg-[#D9B45B]/20 text-[#F7DA82] border border-[#D9B45B]/50';
    default:
      return 'bg-white/5 text-[#DCE9DF]/70 border border-white/15';
  }
}

export function getAssessmentDecisionLabel(
  decision?: 'cemerlang' | 'memuaskan' | 'perlu_bimbingan' | ''
): string {
  switch (decision) {
    case 'cemerlang':
      return 'Cemerlang';
    case 'memuaskan':
      return 'Memuaskan';
    case 'perlu_bimbingan':
      return 'Perlu Bimbingan';
    default:
      return 'Belum Dinilai';
  }
}

export function escapeCsvCell(val: unknown): string {
  const str = String(val ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadBlob(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ExportRow {
  studentId: string;
  studentName: string;
  className: string;
  overallScore: string;
  completionPercent: string;
  phase1Score: string;
  phase2Score: string;
  phase3Score: string;
  phase4Score: string;
  phase5Score: string;
  xp: number;
  rank: string;
  badgesCount: number;
  latestActivity: string;
  needsReview: string;
}

export function buildExportRows(students: TeacherStudentSummary[]): ExportRow[] {
  return students.map((s) => ({
    studentId: s.studentId,
    studentName: s.name,
    className: s.className,
    overallScore:
      s.metrics.overallAcademicScore !== null ? `${s.metrics.overallAcademicScore}%` : 'Belum ada',
    completionPercent: `${s.metrics.missionCompletionPercent}%`,
    phase1Score: s.metrics.phase1Score !== null ? `${s.metrics.phase1Score}%` : '—',
    phase2Score: s.metrics.phase2Score !== null ? `${s.metrics.phase2Score}%` : '—',
    phase3Score: s.metrics.phase3Score !== null ? `${s.metrics.phase3Score}%` : '—',
    phase4Score: s.metrics.phase4Score !== null ? `${s.metrics.phase4Score}%` : '—',
    phase5Score: s.metrics.phase5Score !== null ? `${s.metrics.phase5Score}%` : '—',
    xp: s.xp,
    rank: s.rank,
    badgesCount: s.earnedBadges.length,
    latestActivity: s.latestActivityAt ? formatDateTime(s.latestActivityAt) : 'Tiada aktiviti',
    needsReview: s.needsReview ? 'Perlu Semakan' : 'Disemak / Tiada Tunggakan',
  }));
}

export function exportSummaryCsv(
  rows: ExportRow[],
  filenamePrefix = 'laporan_analitik_guru'
): void {
  const headers = [
    'ID Murid',
    'Nama Murid',
    'Kelas',
    'Purata Akademik',
    'Kemajuan Misi',
    'Skor Fasa 1',
    'Skor Fasa 2',
    'Skor Fasa 3',
    'Skor Studio Arkitek',
    'Skor Laporan Akhir',
    'XP Detektif',
    'Pangkat',
    'Bil. Lencana',
    'Aktiviti Terkini',
    'Status Semakan',
  ];
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) =>
      [
        r.studentId,
        r.studentName,
        r.className,
        r.overallScore,
        r.completionPercent,
        r.phase1Score,
        r.phase2Score,
        r.phase3Score,
        r.phase4Score,
        r.phase5Score,
        r.xp,
        r.rank,
        r.badgesCount,
        r.latestActivity,
        r.needsReview,
      ]
        .map(escapeCsvCell)
        .join(',')
    ),
  ];
  const bom = '\uFEFF';
  const dateTag = new Date().toISOString().slice(0, 10);
  downloadBlob(`${filenamePrefix}_${dateTag}.csv`, bom + lines.join('\n'), 'text/csv;charset=utf-8');
}

export function exportSummaryExcel(
  rows: ExportRow[],
  meta: { teacherName: string; filterLabel: string },
  filenamePrefix = 'laporan_analitik_guru'
): void {
  const escapeHtml = (s: unknown) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const tableRows = rows
    .map(
      (r) => `<tr>
      <td>${escapeHtml(r.studentId)}</td>
      <td>${escapeHtml(r.studentName)}</td>
      <td>${escapeHtml(r.className)}</td>
      <td>${escapeHtml(r.overallScore)}</td>
      <td>${escapeHtml(r.completionPercent)}</td>
      <td>${escapeHtml(r.phase1Score)}</td>
      <td>${escapeHtml(r.phase2Score)}</td>
      <td>${escapeHtml(r.phase3Score)}</td>
      <td>${escapeHtml(r.phase4Score)}</td>
      <td>${escapeHtml(r.phase5Score)}</td>
      <td>${escapeHtml(r.xp)}</td>
      <td>${escapeHtml(r.rank)}</td>
      <td>${escapeHtml(r.badgesCount)}</td>
      <td>${escapeHtml(r.latestActivity)}</td>
      <td>${escapeHtml(r.needsReview)}</td>
    </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8" /></head>
<body>
  <h3>DETECTIVE ACADEMY — LAPORAN ANALITIK GURU</h3>
  <p>Guru: ${escapeHtml(meta.teacherName)} | Penapis: ${escapeHtml(meta.filterLabel)} | Dijana pada: ${escapeHtml(
    new Date().toLocaleString('ms-MY')
  )}</p>
  <table border="1" cellspacing="0" cellpadding="5">
    <thead>
      <tr style="background:#092D27;color:#F5F0E5;font-weight:bold;">
        <th>ID Murid</th>
        <th>Nama Murid</th>
        <th>Kelas</th>
        <th>Purata Akademik</th>
        <th>Kemajuan Misi</th>
        <th>Skor Fasa 1</th>
        <th>Skor Fasa 2</th>
        <th>Skor Fasa 3</th>
        <th>Skor Studio Arkitek</th>
        <th>Skor Laporan Akhir</th>
        <th>XP Detektif</th>
        <th>Pangkat</th>
        <th>Bil. Lencana</th>
        <th>Aktiviti Terkini</th>
        <th>Status Semakan</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`;

  const dateTag = new Date().toISOString().slice(0, 10);
  downloadBlob(
    `${filenamePrefix}_${dateTag}.xls`,
    html,
    'application/vnd.ms-excel;charset=utf-8'
  );
}

export interface InspectableSubmissionItem {
  studentUsername: string;
  studentName: string;
  studentId: string;
  className: string;
  phaseId: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';
  itemKey: string;
  itemTitle: string;
  locationId?: LocationId;
  question: string;
  responseText: string;
  secondaryText?: string;
  selectedEvidence: string[];
  scorePercent: number | null;
  criteriaRows?: { label: string; met: boolean; message: string }[];
  submittedAt: string | null;
  historyVersions: SubmissionHistoryEntry[];
}

export function extractInspectableItemsFromDossier(
  dossier: TeacherStudentDossier,
  locationNames: Record<LocationId, string>
): InspectableSubmissionItem[] {
  const { summary, gameState, opinionEvaluations, reasoningEvaluations, submissionHistory } =
    dossier;
  const items: InspectableSubmissionItem[] = [];
  const locs: LocationId[] = ['kantin', 'kelas', 'perpustakaan', 'taman'];

  for (const locId of locs) {
    const inv = gameState.investigations[locId];
    if (inv.notes.trim() || inv.initialProposal.trim() || inv.discoveredClueIds.length > 0) {
      const key = `phase1_${locId}`;
      const versions = submissionHistory.filter((h) => h.itemKey === key);
      const cluesCount = inv.discoveredClueIds.length;
      const score = inv.completed
        ? Math.round(
            ((cluesCount / 3) * 0.5 +
              (inv.notes.trim().length >= 8 ? 0.25 : 0) +
              (inv.initialProposal.trim().length >= 8 ? 0.25 : 0)) *
              100
          )
        : null;
      items.push({
        studentUsername: summary.username,
        studentName: summary.name,
        studentId: summary.studentId,
        className: summary.className,
        phaseId: 'phase1',
        itemKey: key,
        itemTitle: `Fasa 1 · ${locationNames[locId]}`,
        locationId: locId,
        question: `Catatkan pemerhatian dan cadangan penyelesaian awal bagi lokasi ${locationNames[locId]}.`,
        responseText: inv.notes || '(Tiada catatan ditulis)',
        secondaryText: inv.initialProposal || '(Tiada cadangan awal)',
        selectedEvidence: inv.discoveredClueIds,
        scorePercent: score,
        submittedAt: inv.completedAt || versions[0]?.submittedAt || summary.lastUpdated,
        historyVersions: versions,
      });
    }
  }

  for (const locId of locs) {
    const op = (gameState.opinions[locId]?.opinionText || '').trim();
    if (op.length > 0) {
      const ev = opinionEvaluations[locId];
      const key = `phase2_${locId}`;
      const versions = submissionHistory.filter((h) => h.itemKey === key);
      items.push({
        studentUsername: summary.username,
        studentName: summary.name,
        studentId: summary.studentId,
        className: summary.className,
        phaseId: 'phase2',
        itemKey: key,
        itemTitle: `Fasa 2 · Ayat Pendapat (${locationNames[locId]})`,
        locationId: locId,
        question: `Bina ayat pendapat lengkap bagi penambahbaikan ${locationNames[locId]} berdasarkan bukti siasatan.`,
        responseText: op,
        selectedEvidence: gameState.investigations[locId].discoveredClueIds,
        scorePercent: ev.scorePercent,
        criteriaRows: [
          { label: 'Kelengkapan Ayat', ...ev.completeness },
          { label: 'Perkaitan dengan Bukti', ...ev.evidenceLink },
          { label: 'Kejelasan Pendapat', ...ev.clarity },
        ],
        submittedAt: versions[0]?.submittedAt || summary.lastUpdated,
        historyVersions: versions,
      });
    }
  }

  for (const locId of locs) {
    const reason = (gameState.opinions[locId]?.reasonText || '').trim();
    if (reason.length > 0) {
      const rv = reasoningEvaluations[locId];
      const key = `phase3_reason_${locId}`;
      const versions = submissionHistory.filter((h) => h.itemKey === key);
      items.push({
        studentUsername: summary.username,
        studentName: summary.name,
        studentId: summary.studentId,
        className: summary.className,
        phaseId: 'phase3',
        itemKey: key,
        itemTitle: `Fasa 3 · Alasan Penyokong (${locationNames[locId]})`,
        locationId: locId,
        question: `Nyatakan alasan relevan untuk menyokong pendapat: "${
          gameState.opinions[locId]?.opinionText || '—'
        }"`,
        responseText: reason,
        selectedEvidence: [gameState.opinions[locId]?.opinionText || locationNames[locId]],
        scorePercent: rv.scorePercent,
        criteriaRows: [
          { label: 'Kelengkapan Ayat', ...rv.completeness },
          { label: 'Penanda Wacana / Kata Hubung', ...rv.reasoningCue },
          { label: 'Perkaitan dengan Isu', ...rv.relevanceLink },
        ],
        submittedAt: versions[0]?.submittedAt || summary.lastUpdated,
        historyVersions: versions,
      });
    }
  }

  const justified = gameState.builderPlan.filter(
    (f) => (f.justification || '').trim().length > 0
  );
  if (gameState.builderSaved || justified.length > 0) {
    const key = 'phase4_architect';
    const versions = submissionHistory.filter((h) => h.itemKey === key);
    items.push({
      studentUsername: summary.username,
      studentName: summary.name,
      studentId: summary.studentId,
      className: summary.className,
      phaseId: 'phase4',
      itemKey: key,
      itemTitle: 'Cabaran Akhir · Pelan Studio Arkitek',
      question:
        'Reka Pelan Sekolah Impian dan tulis justifikasi reka bentuk yang berpaut kepada bukti.',
      responseText:
        justified.map((f) => `${f.assetId} (${f.actionType || 'ubah_suai'}): ${f.justification}`).join('\n') ||
        '(Pelan disimpan tanpa teks justifikasi terperinci)',
      selectedEvidence: gameState.selectedEvidenceIds.map((id) => locationNames[id] || id),
      scorePercent: dossier.summary.metrics.phase4Score,
      submittedAt: versions[0]?.submittedAt || summary.lastUpdated,
      historyVersions: versions,
    });
  }

  if (gameState.finalReportSaved || gameState.finalReportText.trim().length > 0) {
    const key = 'phase5_report';
    const versions = submissionHistory.filter((h) => h.itemKey === key);
    items.push({
      studentUsername: summary.username,
      studentName: summary.name,
      studentId: summary.studentId,
      className: summary.className,
      phaseId: 'phase5',
      itemKey: key,
      itemTitle: 'Produk Akhir · Laporan Sekolah Impian',
      question:
        'Gabungkan pemerhatian, pendapat, alasan relevan dan cadangan Pelan Sekolah Impian dalam 3–5 ayat.',
      responseText: gameState.finalReportText || '(Tiada teks laporan)',
      selectedEvidence: gameState.selectedEvidenceIds.map((id) => locationNames[id] || id),
      scorePercent: dossier.summary.metrics.phase5Score,
      submittedAt: versions[0]?.submittedAt || summary.lastUpdated,
      historyVersions: versions,
    });
  }

  return items;
}

export type TeacherNavSection =
  | 'overview'
  | 'students'
  | 'analytics'
  | 'submissions'
  | 'dossier'
  | 'achievements'
  | 'classes'
  | 'export'
  | 'settings';

export type DashboardDataReady = TeacherDashboardPayload;
