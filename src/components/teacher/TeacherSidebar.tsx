import React from 'react';
import {
  Award,
  BarChart3,
  ClipboardList,
  Download,
  FileSearch,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  X,
} from 'lucide-react';
import type { TeacherNavSection } from './teacherUtils';

interface SidebarItem {
  id: TeacherNavSection;
  code: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: 'overview',
    code: '01',
    title: 'DASHBOARD UTAMA',
    subtitle: 'Ringkasan kelas & kemajuan',
    icon: LayoutDashboard,
  },
  {
    id: 'students',
    code: '02',
    title: 'SENARAI MURID',
    subtitle: 'Direktori & status individu',
    icon: Users,
  },
  {
    id: 'analytics',
    code: '03',
    title: 'ANALITIK PRESTASI',
    subtitle: 'Prestasi mengikut fasa & rubrik',
    icon: BarChart3,
  },
  {
    id: 'submissions',
    code: '04',
    title: 'LAPORAN TUGASAN',
    subtitle: 'Semua jawapan & hantaran murid',
    icon: ClipboardList,
  },
  {
    id: 'dossier',
    code: '05',
    title: 'FAIL AKADEMIK INDIVIDU',
    subtitle: 'Sejarah lengkap pembelajaran',
    icon: FileSearch,
  },
  {
    id: 'achievements',
    code: '06',
    title: 'PENCAPAIAN MURID',
    subtitle: 'XP, lencana & kedudukan',
    icon: Award,
  },
  {
    id: 'classes',
    code: '07',
    title: 'PENGURUSAN KELAS',
    subtitle: 'Kelas, murid & sesi akademik',
    icon: FolderKanban,
  },
  {
    id: 'export',
    code: '08',
    title: 'LAPORAN EKSPORT',
    subtitle: 'Jana PDF, CSV & Excel',
    icon: Download,
  },
  {
    id: 'settings',
    code: '09',
    title: 'TETAPAN SISTEM',
    subtitle: 'Profil guru & pengurusan data',
    icon: Settings,
  },
];

interface TeacherSidebarProps {
  activeSection: TeacherNavSection;
  mobileOpen: boolean;
  pendingReviewCount: number;
  onSelectSection: (section: TeacherNavSection) => void;
  onCloseMobile: () => void;
}

export function TeacherSidebar({
  activeSection,
  mobileOpen,
  pendingReviewCount,
  onSelectSection,
  onCloseMobile,
}: TeacherSidebarProps) {
  const navContent = (
    <div className="flex flex-col h-full py-4 px-3 space-y-1.5">
      <div className="px-2.5 pb-3 mb-1 border-b border-[#36D9FF]/20 flex items-center justify-between">
        <div>
          <p className="font-mono-tabular text-[10px] font-bold tracking-[0.2em] text-[#36D9FF] uppercase">
            PANEL KAWALAN
          </p>
          <p className="text-xs font-semibold text-[#DCE9DF]/85">Mod Pengawasan Guru</p>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Tutup menu sisi"
          className="lg:hidden p-1.5 rounded-lg text-[#DCE9DF] hover:bg-[#1D6652]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav aria-label="Menu utama guru" className="flex-1 overflow-y-auto space-y-1 pr-0.5">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                onCloseMobile();
              }}
              className={`group w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                isActive
                  ? 'bg-[#1D6652]/85 border-[#36D9FF]/65 shadow-[0_0_18px_rgba(54,217,255,0.16)]'
                  : 'bg-transparent border-transparent hover:bg-[#123E34]/90 hover:border-[#00BFA6]/35'
              }`}
            >
              <div
                className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#36D9FF]/20 text-[#36D9FF] border border-[#36D9FF]/45'
                    : 'bg-[#092D27] text-[#D9B45B] border border-[#D9B45B]/25 group-hover:border-[#00BFA6]/50'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-mono-tabular text-[11px] font-bold tracking-wide truncate ${
                      isActive ? 'text-[#FFFFFF]' : 'text-[#F5F0E5]'
                    }`}
                  >
                    {item.code} — {item.title}
                  </span>
                  {item.id === 'submissions' && pendingReviewCount > 0 && (
                    <span className="font-mono-tabular text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#D9B45B] text-[#092D27] shrink-0">
                      {pendingReviewCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#DCE9DF]/70 truncate mt-0.5">{item.subtitle}</p>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="no-print hidden lg:block w-68 xl:w-72 shrink-0 border-r border-[#36D9FF]/20 bg-[#092D27]/95">
        <div className="sticky top-16 h-[calc(100vh-4rem)]">{navContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="no-print lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full bg-[#092D27] border-r border-[#36D9FF]/35 shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
