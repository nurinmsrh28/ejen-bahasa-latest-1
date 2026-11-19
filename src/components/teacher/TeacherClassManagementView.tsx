import React, { useEffect, useState } from 'react';
import { FolderPlus, UserPlus, Users } from 'lucide-react';
import {
  assignStudentClass,
  createStudentByTeacher,
  createTeacherClass,
} from '../../game/teacherClient';
import type { TeacherDashboardPayload } from '../../game/types';

interface TeacherClassManagementViewProps {
  payload: TeacherDashboardPayload;
  onRefreshDashboard: () => Promise<void>;
  onOpenStudentDossier: (username: string) => void;
}

export function TeacherClassManagementView({
  payload,
  onRefreshDashboard,
  onOpenStudentDossier,
}: TeacherClassManagementViewProps) {
  const [classNameInput, setClassNameInput] = useState('');
  const [yearLevel, setYearLevel] = useState('Tahun 6');
  const [sessionYear, setSessionYear] = useState('2026/2027');
  const [classMsg, setClassMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [creatingClass, setCreatingClass] = useState(false);

  const [stuUsername, setStuUsername] = useState('');
  const [stuName, setStuName] = useState('');
  const [stuClass, setStuClass] = useState(payload.classes[0]?.name || '6 Bestari');
  const [stuPassword, setStuPassword] = useState('Bestari#2026');
  const [stuMsg, setStuMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [creatingStudent, setCreatingStudent] = useState(false);

  const [assigningUser, setAssigningUser] = useState<string | null>(null);
  const [assignMsg, setAssignMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (payload.classes.length > 0 && !payload.classes.some((c) => c.name === stuClass)) {
      setStuClass(payload.classes[0].name);
    }
  }, [payload.classes, stuClass]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassMsg(null);
    setCreatingClass(true);
    const res = await createTeacherClass({
      name: classNameInput.trim(),
      yearLevel,
      sessionYear,
    });
    setCreatingClass(false);
    if (!res.ok) {
      setClassMsg({ type: 'err', text: res.error || 'Gagal mencipta kelas.' });
      return;
    }
    setClassNameInput('');
    setClassMsg({
      type: 'ok',
      text: `Kelas "${res.classRecord?.name}" berjaya didaftarkan ke dalam sistem.`,
    });
    await onRefreshDashboard();
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStuMsg(null);
    setCreatingStudent(true);
    const res = await createStudentByTeacher({
      username: stuUsername.trim().toLowerCase(),
      fullName: stuName.trim(),
      className: stuClass,
      password: stuPassword,
    });
    setCreatingStudent(false);
    if (!res.ok || !res.student) {
      setStuMsg({ type: 'err', text: res.error || 'Gagal mendaftar murid.' });
      return;
    }
    setStuUsername('');
    setStuName('');
    setStuMsg({
      type: 'ok',
      text: `Murid ${res.student.name} (${res.student.studentId}) berjaya ditambah ke kelas ${res.student.className}.`,
    });
    await onRefreshDashboard();
  };

  const handleMoveStudentClass = async (username: string, nextClass: string) => {
    setAssignMsg(null);
    setAssigningUser(username);
    const res = await assignStudentClass(username, nextClass);
    setAssigningUser(null);
    if (!res.ok) {
      setAssignMsg({ type: 'err', text: res.error || 'Gagal menukar penempatan kelas murid.' });
      return;
    }
    setAssignMsg({
      type: 'ok',
      text: `Penempatan kelas untuk ${res.student?.name || username} berjaya ditukar ke ${nextClass}.`,
    });
    await onRefreshDashboard();
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-[#36D9FF]/20 pb-4">
        <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.2em] text-[#36D9FF]">
          07 — PENGURUSAN KELAS, SESI & KUMPULAN MURID
        </p>
        <h1 className="font-display text-2xl font-bold text-[#F5F0E5] mt-0.5">
          Pengurusan Kelas & Pendaftaran Murid
        </h1>
      </div>

      {/* Forms: Create Class + Register Student */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <form
          onSubmit={handleCreateClass}
          className="teacher-holo-panel rounded-2xl p-5 space-y-3"
        >
          <div className="flex items-center gap-2 border-b border-[#36D9FF]/20 pb-2">
            <FolderPlus className="w-4 h-4 text-[#36D9FF]" />
            <h2 className="font-display text-lg font-bold text-white">Cipta Kelas Baharu</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-1">
              <label className="block text-[#DCE9DF]/80 mb-1">Nama Kelas</label>
              <input
                type="text"
                required
                value={classNameInput}
                onChange={(e) => setClassNameInput(e.target.value)}
                placeholder="cth: 6 Arif"
                className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-[#DCE9DF]/80 mb-1">Tahun</label>
              <select
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-white"
              >
                <option value="Tahun 4">Tahun 4</option>
                <option value="Tahun 5">Tahun 5</option>
                <option value="Tahun 6">Tahun 6</option>
              </select>
            </div>
            <div>
              <label className="block text-[#DCE9DF]/80 mb-1">Sesi Akademik</label>
              <input
                type="text"
                value={sessionYear}
                onChange={(e) => setSessionYear(e.target.value)}
                className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-white font-mono-tabular"
              />
            </div>
          </div>

          {classMsg && (
            <p
              className={`text-xs font-semibold ${
                classMsg.type === 'ok' ? 'text-[#5BFFCA]' : 'text-[#F29C85]'
              }`}
            >
              {classMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={creatingClass}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#36D9FF] hover:bg-[#7CE7FF] text-[#092D27] text-xs font-extrabold disabled:opacity-50"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{creatingClass ? 'Menyimpan...' : 'Tambah Kelas'}</span>
          </button>
        </form>

        <form
          onSubmit={handleCreateStudent}
          className="teacher-holo-panel rounded-2xl p-5 space-y-3"
        >
          <div className="flex items-center gap-2 border-b border-[#D9B45B]/25 pb-2">
            <UserPlus className="w-4 h-4 text-[#D9B45B]" />
            <h2 className="font-display text-lg font-bold text-white">
              Daftar Murid Baharu ke Kelas
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#DCE9DF]/80 mb-1">ID Pengguna Murid</label>
              <input
                type="text"
                required
                value={stuUsername}
                onChange={(e) => setStuUsername(e.target.value)}
                placeholder="cth: ejen.amirul"
                className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-white font-mono-tabular"
              />
            </div>
            <div>
              <label className="block text-[#DCE9DF]/80 mb-1">Nama Penuh Murid</label>
              <input
                type="text"
                required
                value={stuName}
                onChange={(e) => setStuName(e.target.value)}
                placeholder="cth: Amirul Hakim"
                className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-[#DCE9DF]/80 mb-1">Kelas</label>
              <select
                value={stuClass}
                onChange={(e) => setStuClass(e.target.value)}
                className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-white"
              >
                {payload.classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.sessionYear})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#DCE9DF]/80 mb-1">Kata Laluan Awal</label>
              <input
                type="text"
                value={stuPassword}
                onChange={(e) => setStuPassword(e.target.value)}
                className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-white font-mono-tabular"
              />
            </div>
          </div>

          {stuMsg && (
            <p
              className={`text-xs font-semibold ${
                stuMsg.type === 'ok' ? 'text-[#5BFFCA]' : 'text-[#F29C85]'
              }`}
            >
              {stuMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={creatingStudent}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D9B45B] hover:bg-[#F3DBA0] text-[#092D27] text-xs font-extrabold disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{creatingStudent ? 'Mendaftar...' : 'Daftar Murid'}</span>
          </button>
        </form>
      </div>

      {/* Existing Classes Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {payload.classes.map((c) => {
          const classStudents = payload.students.filter((s) => s.className === c.name);
          const avgCompletion =
            classStudents.length > 0
              ? Math.round(
                  classStudents.reduce((sum, s) => sum + s.metrics.missionCompletionPercent, 0) /
                    classStudents.length
                )
              : 0;
          return (
            <div key={c.id} className="teacher-holo-panel rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono-tabular text-[10px] font-bold text-[#36D9FF]">
                  {c.yearLevel} · {c.sessionYear}
                </span>
                <Users className="w-4 h-4 text-[#D9B45B]" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">{c.name}</h3>
              <p className="text-xs font-mono-tabular text-[#DCE9DF]/80">
                {classStudents.length} murid · Purata Misi: <strong className="text-[#5BFFCA]">{avgCompletion}%</strong>
              </p>
            </div>
          );
        })}
      </div>

      {/* Reassign Student Classes */}
      <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#36D9FF]/20 pb-2">
          <h2 className="font-display text-lg font-bold text-white">
            Penempatan & Pengurusan Kelas Murid
          </h2>
          {assignMsg && (
            <p
              className={`text-xs font-semibold ${
                assignMsg.type === 'ok' ? 'text-[#5BFFCA]' : 'text-[#F29C85]'
              }`}
            >
              {assignMsg.text}
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/15 font-mono-tabular text-[11px] uppercase text-[#36D9FF]">
                <th className="py-2 pr-3">Murid</th>
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Kelas Semasa</th>
                <th className="py-2 pr-3">Tukar Penempatan Kelas</th>
                <th className="py-2 text-right">Fail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {payload.students.map((s) => (
                <tr key={s.username}>
                  <td className="py-2.5 pr-3 font-bold text-white">{s.name}</td>
                  <td className="py-2.5 pr-3 font-mono-tabular text-[#DCE9DF]/80">
                    {s.studentId}
                  </td>
                  <td className="py-2.5 pr-3 font-semibold text-[#5BFFCA]">{s.className}</td>
                  <td className="py-2.5 pr-3">
                    <select
                      disabled={assigningUser === s.username}
                      value={s.className}
                      onChange={(e) => handleMoveStudentClass(s.username, e.target.value)}
                      className="rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-2.5 py-1 text-xs text-white disabled:opacity-50"
                    >
                      {!payload.classes.some((c) => c.name === s.className) && (
                        <option value={s.className}>{s.className}</option>
                      )}
                      {payload.classes.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenStudentDossier(s.username)}
                      className="text-xs font-bold text-[#D9B45B] hover:underline"
                    >
                      Buka Fail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
