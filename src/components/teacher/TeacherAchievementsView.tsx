import React from 'react';
import { Award, GraduationCap, Medal, Trophy } from 'lucide-react';
import { BADGES } from '../../game/data';
import type { TeacherDashboardPayload } from '../../game/types';
import { formatDateTime } from './teacherUtils';

interface TeacherAchievementsViewProps {
  payload: TeacherDashboardPayload;
  onOpenStudentDossier: (username: string) => void;
}

export function TeacherAchievementsView({
  payload,
  onOpenStudentDossier,
}: TeacherAchievementsViewProps) {
  const academicLeaders = [...payload.students]
    .filter((s) => s.metrics.overallAcademicScore !== null)
    .sort(
      (a, b) =>
        (b.metrics.overallAcademicScore || 0) - (a.metrics.overallAcademicScore || 0)
    );

  const xpLeaders = [...payload.students].sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-5">
      <div className="border-b border-[#36D9FF]/20 pb-4">
        <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.2em] text-[#D9B45B]">
          06 — PENCAPAIAN AKADEMIK & REKOD GAMIFIKASI MURID
        </p>
        <h1 className="font-display text-2xl font-bold text-[#F5F0E5] mt-0.5">
          Lencana, XP & Kedudukan Prestasi Murid
        </h1>
      </div>

      {/* Strict Side-by-Side Separation: Academic Ranking vs Gamification XP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#36D9FF]/20 pb-2.5">
            <GraduationCap className="w-5 h-5 text-[#00BFA6]" />
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Kedudukan Pencapaian Akademik
              </h2>
              <p className="text-[11px] text-[#DCE9DF]/70">
                Berdasarkan rubrik kualiti ayat pendapat, alasan & pelan sekolah impian
              </p>
            </div>
          </div>

          {academicLeaders.length === 0 ? (
            <p className="text-xs text-[#DCE9DF]/70 py-4">
              Belum ada skor akademik dijana dalam penapis semasa.
            </p>
          ) : (
            <div className="space-y-2">
              {academicLeaders.map((s, idx) => (
                <button
                  key={s.username}
                  type="button"
                  onClick={() => onOpenStudentDossier(s.username)}
                  className="w-full text-left rounded-xl bg-[#092D27]/80 hover:bg-[#123E34] border border-white/10 hover:border-[#00BFA6]/50 p-3 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-[#00BFA6]/20 text-[#5BFFCA] font-mono-tabular text-xs font-extrabold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white truncate">{s.name}</p>
                      <p className="text-[11px] text-[#DCE9DF]/70 font-mono-tabular">
                        {s.className} · Misi {s.metrics.missionCompletionPercent}%
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-tabular text-base font-extrabold text-[#5BFFCA] shrink-0">
                    {s.metrics.overallAcademicScore}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#D9B45B]/25 pb-2.5">
            <Trophy className="w-5 h-5 text-[#D9B45B]" />
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Kedudukan XP & Pangkat Detektif (Gamifikasi)
              </h2>
              <p className="text-[11px] text-[#DCE9DF]/70">
                Mata pengalaman penglibatan permainan — tidak dicampurkan dengan markah akademik
              </p>
            </div>
          </div>

          {xpLeaders.length === 0 ? (
            <p className="text-xs text-[#DCE9DF]/70 py-4">Tiada murid ditemui.</p>
          ) : (
            <div className="space-y-2">
              {xpLeaders.map((s, idx) => (
                <button
                  key={s.username}
                  type="button"
                  onClick={() => onOpenStudentDossier(s.username)}
                  className="w-full text-left rounded-xl bg-[#092D27]/80 hover:bg-[#123E34] border border-white/10 hover:border-[#D9B45B]/50 p-3 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-[#D9B45B]/20 text-[#F7DA82] font-mono-tabular text-xs font-extrabold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white truncate">{s.name}</p>
                      <p className="text-[11px] text-[#DCE9DF]/75 truncate">
                        {s.rank} · {s.earnedBadges.length}/{BADGES.length} Lencana
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-tabular text-base font-extrabold text-[#F7DA82] shrink-0">
                    {s.xp} XP
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gold Badge Unlock Registry */}
      <div className="teacher-holo-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#36D9FF]/20 pb-2.5">
          <Medal className="w-5 h-5 text-[#D9B45B]" />
          <h2 className="font-display text-lg font-bold text-white">
            Log Lencana Detektif Dibuka ({payload.achievements.length})
          </h2>
        </div>

        {payload.achievements.length === 0 ? (
          <p className="text-xs text-[#DCE9DF]/75 py-4">
            Belum ada lencana dibuka oleh murid dalam penapis semasa.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {payload.achievements.map((a, idx) => (
              <button
                key={`${a.studentUsername}_${a.badgeId}_${idx}`}
                type="button"
                onClick={() => onOpenStudentDossier(a.studentUsername)}
                className="text-left rounded-xl bg-[#092D27]/85 hover:bg-[#123E34] border border-[#D9B45B]/35 p-3.5 space-y-1.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-sm text-[#F7DA82] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#D9B45B]" />
                    {a.badgeName}
                  </span>
                  <span className="font-mono-tabular text-[10px] text-[#36D9FF]">
                    {a.className}
                  </span>
                </div>
                <p className="text-xs font-bold text-white">{a.studentName}</p>
                <p className="font-mono-tabular text-[10px] text-[#DCE9DF]/70">
                  Dibuka: {formatDateTime(a.unlockedAt)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
