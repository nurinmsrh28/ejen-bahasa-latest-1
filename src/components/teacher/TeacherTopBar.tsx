import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { AuthUser } from '../../game/types';
import { AcademyEmblem } from '../DetectiveArt';
import type { TeacherNavSection } from './teacherUtils';

interface TeacherTopBarProps {
  teacher: AuthUser;
  activeSection: TeacherNavSection;
  soundEnabled: boolean;
  onSelectSection: (section: TeacherNavSection) => void;
  onToggleSound: () => void;
  onToggleMobileMenu: () => void;
  onLogout: () => void;
}

export function TeacherTopBar({
  teacher,
  activeSection,
  soundEnabled,
  onSelectSection,
  onToggleSound,
  onToggleMobileMenu,
  onLogout,
}: TeacherTopBarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const teacherName = teacher.profile?.name || teacher.username;
  const teacherDesignation =
    teacher.profile?.designation || teacher.role || 'Guru Pembimbing Akademi';
  const photoUrl = teacher.profile?.photoUrl;

  useEffect(() => {
    setImgFailed(false);
  }, [photoUrl]);

  const initials = teacherName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const topLinks: { id: TeacherNavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'submissions', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'classes', label: 'Pengurusan Kelas', icon: FolderKanban },
    { id: 'settings', label: 'Tetapan', icon: Settings },
  ];

  return (
    <header className="no-print sticky top-0 z-40 h-16 border-b border-[#36D9FF]/25 bg-[#092D27]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-3">
      {/* Left: Mobile Drawer Trigger + Detective Academy Emblem & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Buka menu kawalan guru"
          className="lg:hidden p-2 rounded-lg bg-[#123E34] border border-[#36D9FF]/30 text-[#F5F0E5] hover:border-[#36D9FF] transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#123E34] border border-[#D9B45B]/70 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(217,180,91,0.2)]">
            <AcademyEmblem className="w-7 h-7" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-[0.18em] text-[#36D9FF] truncate">
              DETECTIVE ACADEMY · TEACHER COMMAND CENTER
            </p>
            <p className="font-display text-sm font-bold text-[#F5F0E5] truncate">
              Sekolah Seri Bestari
            </p>
          </div>
        </div>
      </div>

      {/* Center: Primary Single-Line Quick Navigation */}
      <nav aria-label="Navigasi pantas guru" className="hidden xl:flex items-center gap-1.5">
        {topLinks.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`whitespace-nowrap shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#1D6652] text-[#FFFFFF] border border-[#36D9FF]/60 shadow-[0_0_14px_rgba(54,217,255,0.22)]'
                  : 'text-[#DCE9DF] hover:text-[#FFFFFF] hover:bg-[#123E34] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#36D9FF]' : 'text-[#D9B45B]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right: Authenticated Teacher Profile + Audio + Logout */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2.5 pr-2 sm:border-r border-[#36D9FF]/20">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#D9B45B] bg-[#123E34] flex items-center justify-center shrink-0">
            {photoUrl && !imgFailed ? (
              <img
                key={photoUrl}
                src={photoUrl}
                alt={teacherName}
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-mono-tabular text-xs font-bold text-[#D9B45B]">
                {initials || 'GR'}
              </span>
            )}
          </div>
          <div className="hidden md:block text-left leading-tight max-w-[210px]">
            <p className="text-xs font-bold text-[#F5F0E5] truncate">{teacherName}</p>
            <p className="text-[11px] text-[#36D9FF] font-medium truncate">
              {teacherDesignation}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleSound}
          title={soundEnabled ? 'Kesan Bunyi: Aktif' : 'Kesan Bunyi: Senyap'}
          aria-label={soundEnabled ? 'Senyapkan bunyi' : 'Aktifkan bunyi'}
          className="w-9 h-9 rounded-lg bg-[#123E34] border border-[#36D9FF]/25 hover:border-[#36D9FF] text-[#DCE9DF] flex items-center justify-center transition-colors shrink-0"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-[#00BFA6]" />
          ) : (
            <VolumeX className="w-4 h-4 text-[#DCE9DF]/60" />
          )}
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#123E34] hover:bg-[#1D6652] border border-[#D9B45B]/55 text-xs font-bold text-[#F5F0E5] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 text-[#D9B45B]" />
          <span className="hidden sm:inline">Log Keluar</span>
        </button>
      </div>
    </header>
  );
}
