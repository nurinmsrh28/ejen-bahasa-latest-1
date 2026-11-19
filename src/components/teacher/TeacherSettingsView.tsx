import React, { useState } from 'react';
import { Database, Save, Trash2, UserCheck, Volume2, VolumeX } from 'lucide-react';
import { toggleDemoPreviewData, updateTeacherSettings } from '../../game/teacherClient';
import type { AuthUser } from '../../game/types';

interface TeacherSettingsViewProps {
  teacher: AuthUser;
  hasDemoStudents: boolean;
  includeDemo: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onToggleIncludeDemo: (next: boolean) => void;
  onTeacherUpdated: (user: AuthUser) => void;
  onRefreshDashboard: () => Promise<void>;
}

const PHOTO_PRESETS = [
  {
    label: 'Profesor Nurin (Pejabat)',
    url: '/assets/aistudio/Professor_Detective_in_the_Investigation_Office_54081002.png',
  },
  {
    label: 'Potret Profesor Rasmi',
    url: '/assets/aistudio/Screenshot_2026-11-18_212930_6331fbe5.png',
  },
];

export function TeacherSettingsView({
  teacher,
  hasDemoStudents,
  includeDemo,
  soundEnabled,
  onToggleSound,
  onToggleIncludeDemo,
  onTeacherUpdated,
  onRefreshDashboard,
}: TeacherSettingsViewProps) {
  const [name, setName] = useState(teacher.profile?.name || teacher.username);
  const [designation, setDesignation] = useState(
    teacher.profile?.designation || 'Guru Bahasa Melayu · Pembimbing Operasi'
  );
  const [photoUrl, setPhotoUrl] = useState(teacher.profile?.photoUrl || PHOTO_PRESETS[0].url);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoMsg, setDemoMsg] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await updateTeacherSettings({
      name: name.trim(),
      designation: designation.trim(),
      photoUrl: photoUrl.trim(),
    });
    setSaving(false);
    if (!res.ok || !res.user) {
      setMsg({ type: 'err', text: res.error || 'Gagal menyimpan tetapan profil.' });
      return;
    }
    onTeacherUpdated(res.user);
    setMsg({ type: 'ok', text: 'Profil guru berjaya dikemas kini pada sistem.' });
  };

  const handleToggleDemoAccounts = async (enable: boolean) => {
    setDemoBusy(true);
    setDemoMsg(null);
    const res = await toggleDemoPreviewData(enable);
    setDemoBusy(false);
    if (!res.ok) {
      setDemoMsg(res.error || 'Operasi gagal.');
      return;
    }
    onToggleIncludeDemo(enable);
    setDemoMsg(res.message || 'Selesai.');
    await onRefreshDashboard();
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-[#36D9FF]/20 pb-4">
        <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.2em] text-[#36D9FF]">
          09 — TETAPAN SISTEM & PROFIL GURU
        </p>
        <h1 className="font-display text-2xl font-bold text-[#F5F0E5] mt-0.5">
          Tetapan Akaun Guru & Pengurusan Data
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile Form */}
        <form
          onSubmit={handleSaveProfile}
          className="teacher-holo-panel rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-[#36D9FF]/20 pb-2.5">
            <UserCheck className="w-4 h-4 text-[#D9B45B]" />
            <h2 className="font-display text-lg font-bold text-white">
              Profil Guru Disahkan
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#DCE9DF]/80 mb-1">Nama Guru</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-[#DCE9DF]/80 mb-1">Jawatan / Peranan</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-[#DCE9DF]/80 mb-1">Foto Profil (URL atau Pilihan)</label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full rounded-lg bg-[#092D27] border border-[#36D9FF]/30 px-3 py-2 text-white font-mono-tabular"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {PHOTO_PRESETS.map((p) => (
                  <button
                    key={p.url}
                    type="button"
                    onClick={() => setPhotoUrl(p.url)}
                    className="px-2.5 py-1 rounded-lg bg-[#123E34] border border-[#36D9FF]/25 text-[11px] text-[#DCE9DF] hover:border-[#36D9FF]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {msg && (
            <p
              className={`text-xs font-semibold ${
                msg.type === 'ok' ? 'text-[#5BFFCA]' : 'text-[#F29C85]'
              }`}
            >
              {msg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D9B45B] hover:bg-[#F3DBA0] text-[#092D27] text-xs font-extrabold disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Profil Guru'}</span>
          </button>
        </form>

        {/* System Audio & Optional Demo Preview Data Controls */}
        <div className="space-y-5">
          <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-white border-b border-[#36D9FF]/20 pb-2">
              Kawalan Audio & Antara Muka
            </h2>
            <div className="flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-[#F5F0E5]">Kesan Bunyi Sistem</p>
                <p className="text-[#DCE9DF]/70">
                  Aktifkan atau senyapkan kesan bunyi klik dan notifikasi.
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleSound}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold ${
                  soundEnabled
                    ? 'bg-[#00BFA6]/20 border-[#00BFA6] text-[#5BFFCA]'
                    : 'bg-[#092D27] border-white/20 text-[#DCE9DF]'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? 'Aktif' : 'Senyap'}</span>
              </button>
            </div>
          </div>

          <div className="teacher-holo-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-[#D9B45B]/25 pb-2">
              <Database className="w-4 h-4 text-[#D9B45B]" />
              <h2 className="font-display text-lg font-bold text-white">
                Mod Data Pratonton Demo (Terpisah)
              </h2>
            </div>
            <p className="text-xs text-[#DCE9DF]/80 leading-relaxed">
              Secara lalai, papan pemuka guru hanya memaparkan rekod murid sebenar daripada pangkalan data. Anda boleh memuatkan 3 rekod murid pratonton bertanda <strong>[DEMO]</strong> untuk menguji carta dan laporan tanpa menjejaskan akaun murid sebenar.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              {!hasDemoStudents ? (
                  <button
                    type="button"
                    disabled={demoBusy}
                    onClick={() => handleToggleDemoAccounts(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#36D9FF] hover:bg-[#7CE7FF] text-[#092D27] text-xs font-extrabold disabled:opacity-50"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{demoBusy ? 'Memuat...' : 'Muatkan Data Pratonton [DEMO]'}</span>
                  </button>
                ) : (
                  <>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#F5F0E5] mr-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeDemo}
                        onChange={(e) => onToggleIncludeDemo(e.target.checked)}
                        className="w-4 h-4 accent-[#36D9FF]"
                      />
                      <span>Papar murid [DEMO] dalam analitik</span>
                    </label>
                    <button
                      type="button"
                      disabled={demoBusy}
                      onClick={() => handleToggleDemoAccounts(false)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C2593F] hover:bg-[#D96B50] text-white text-xs font-bold disabled:opacity-50"
                    >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Padam Semua Rekod [DEMO]</span>
                  </button>
                </>
              )}
            </div>

            {demoMsg && <p className="text-xs text-[#5BFFCA] font-semibold">{demoMsg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
