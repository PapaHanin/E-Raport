import React from 'react';
import { ActiveTab, TeacherAccount, SchoolProfile, ClassLevel } from '../types';
import {
  LayoutDashboard,
  Calculator,
  Sparkles,
  Printer,
  Send,
  Database,
  BookMarked,
  HelpCircle,
  Settings,
  Compass,
  History,
  Cloud,
  ChevronLeft,
  ChevronRight,
  Pin,
  Lock,
  X,
  Layers,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab | string;
  onTabChange?: (tab: ActiveTab) => void;
  onSelectTab?: (tab: any) => void;
  totalStudents?: number;
  schoolProfile?: SchoolProfile;
  activeClassLevel?: ClassLevel;
  currentUser?: TeacherAccount | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItemDef {
  id: ActiveTab;
  aliases?: string[];
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  category: 'penilaian' | 'cetak' | 'data' | 'sistem';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onSelectTab,
  schoolProfile,
  activeClassLevel,
  currentUser,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const handleTab = (tabId: ActiveTab) => {
    if (onTabChange) onTabChange(tabId);
    if (onSelectTab) onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const navItems: NavItemDef[] = [
    // 1. Penilaian & Pembelajaran
    {
      id: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      category: 'penilaian',
    },
    {
      id: 'gradebook',
      aliases: ['buku-nilai'],
      label: 'Buku Nilai (Gradebook)',
      shortLabel: 'Nilai',
      icon: <Calculator className="w-5 h-5 shrink-0 text-teal-400" />,
      badge: 'NA Fleksibel',
      badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold',
      category: 'penilaian',
    },
    {
      id: 'ai-narasi',
      label: 'AI Narasi Rapor',
      shortLabel: 'AI Narasi',
      icon: <Sparkles className="w-5 h-5 shrink-0 text-yellow-400" />,
      badge: 'Gemini AI',
      badgeColor: 'bg-yellow-400 text-slate-950 font-black',
      category: 'penilaian',
    },
    {
      id: 'projek-p5',
      aliases: ['p5-project'],
      label: 'Projek P5',
      shortLabel: 'P5',
      icon: <Compass className="w-5 h-5 shrink-0 text-emerald-400" />,
      badge: 'Pancasila',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold',
      category: 'penilaian',
    },

    // 2. Cetak & Laporan
    {
      id: 'tarik-data',
      aliases: ['tarik-data-siswa', 'ogomojolo-sync', 'tarik'],
      label: 'Tarik Data Siswa',
      shortLabel: 'Tarik Data',
      icon: <UserCheck className="w-5 h-5 shrink-0 text-emerald-400" />,
      badge: 'Auto Sync',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold',
      category: 'cetak',
    },
    {
      id: 'cetak-rapor',
      label: 'Cetak E-Rapor PDF',
      shortLabel: 'E-Rapor',
      icon: <Printer className="w-5 h-5 shrink-0 text-indigo-400" />,
      badge: 'A4 / F4',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold',
      category: 'cetak',
    },
    {
      id: 'whatsapp-gateway',
      aliases: ['whatsapp'],
      label: 'WhatsApp Gateway',
      shortLabel: 'WA Rapor',
      icon: <Send className="w-5 h-5 shrink-0 text-pink-400" />,
      badge: 'Bulk WA',
      badgeColor: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-300 font-bold',
      category: 'cetak',
    },

    // 3. Data & Sinkronisasi
    {
      id: 'dapodik-sync',
      aliases: ['dapodik', 'impor-nilai'],
      label: 'Impor Nilai (Dapodik / Excel)',
      shortLabel: 'Impor Nilai',
      icon: <FileSpreadsheet className="w-5 h-5 shrink-0 text-blue-400" />,
      badge: 'Khusus Nilai',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold',
      category: 'data',
    },
    {
      id: 'bank-tp',
      label: 'Bank TP & Mapel',
      shortLabel: 'Bank TP',
      icon: <BookMarked className="w-5 h-5 shrink-0 text-purple-400" />,
      category: 'data',
    },
    {
      id: 'cloud-sync' as any,
      aliases: ['cloud'],
      label: 'Cloud Sync (Multi-User)',
      shortLabel: 'Cloud',
      icon: <Cloud className="w-5 h-5 shrink-0 text-sky-400" />,
      badge: 'Multi-Guru',
      badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold',
      category: 'data',
    },
    {
      id: 'audit-log',
      aliases: ['audit-trail'],
      label: 'Audit Log & Snapshot',
      shortLabel: 'Audit',
      icon: <History className="w-5 h-5 shrink-0 text-amber-400" />,
      badge: 'Undo/Redo',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold',
      category: 'data',
    },

    // 4. Sistem
    {
      id: 'komparasi-kurikulum',
      aliases: ['komparasi'],
      label: 'Panduan Kurikulum',
      shortLabel: 'Panduan',
      icon: <HelpCircle className="w-5 h-5 shrink-0 text-cyan-400" />,
      badge: 'K-13 vs KM',
      badgeColor: 'bg-indigo-100 text-indigo-700 font-bold',
      category: 'sistem',
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan & Backup',
      shortLabel: 'Setting',
      icon: <Settings className="w-5 h-5 shrink-0 text-slate-400" />,
      category: 'sistem',
    },
  ];

  const categories = [
    { key: 'penilaian', title: 'PENILAIAN & AKADEMIK' },
    { key: 'cetak', title: 'CETAK & KOMUNIKASI' },
    { key: 'data', title: 'DATA & SINKRONISASI' },
    { key: 'sistem', title: 'PANDUAN & SISTEM' },
  ];

  return (
    <>
      {/* Pinned / Locked Left Sidebar (Desktop & Tablet) + Drawer (Mobile) */}
      <aside
        id="pinned-sidebar-navigation"
        className={`print:hidden fixed top-0 bottom-0 left-0 z-50 lg:sticky lg:top-0 lg:h-screen bg-slate-900 text-white flex flex-col border-r-2 border-slate-800 shadow-2xl transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64 sm:w-72'}`}
      >
        {/* Sidebar Header / Brand */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 bg-yellow-400 rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-lg transform rotate-2 shrink-0">
              <span className="text-2xl font-black text-slate-950">i</span>
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black text-base tracking-tight text-white font-sans">
                    iihh Beres
                  </h1>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40">
                    SD
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  {schoolProfile?.schoolName || 'e-Rapor Merdeka'}
                </p>
              </div>
            )}
          </div>

          {/* Controls: Collapse on desktop, Close on mobile */}
          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title={isCollapsed ? 'Perluas Navigasi Samping' : 'Ciutkan Navigasi Samping'}
                id="btn-toggle-sidebar-collapse"
                className="hidden lg:flex p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Lock / Pinned Status Indicator */}
        {!isCollapsed && (
          <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-900/40 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-teal-400 font-bold">
              <Pin className="w-3.5 h-3.5 fill-teal-400 rotate-45" />
              <span>Navigasi Terkunci di Samping</span>
            </div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">
              {activeClassLevel || 'Kelas 4'}
            </span>
          </div>
        )}

        {/* Navigation Items List (Scrollable inside sidebar if viewport is small) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
          {categories.map((cat) => {
            const items = navItems.filter((i) => i.category === cat.key);
            if (items.length === 0) return null;

            return (
              <div key={cat.key} className="space-y-1">
                {!isCollapsed ? (
                  <h4 className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <span>{cat.title}</span>
                  </h4>
                ) : (
                  <div className="w-6 h-0.5 bg-slate-800 mx-auto my-2 rounded-full" />
                )}

                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive =
                      activeTab === item.id ||
                      (item.aliases && item.aliases.includes(activeTab as string));

                    return (
                      <button
                        key={item.id}
                        id={`sidebar-nav-${item.id}`}
                        onClick={() => handleTab(item.id)}
                        title={item.label}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer text-left group ${
                          isActive
                            ? 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-600/30 scale-[1.01]'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        } ${isCollapsed ? 'justify-center px-2' : ''}`}
                      >
                        <div
                          className={`shrink-0 transition-transform ${
                            isActive ? 'scale-110' : 'group-hover:scale-105 text-slate-400 group-hover:text-slate-200'
                          }`}
                        >
                          {item.icon}
                        </div>

                        {!isCollapsed && (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-black leading-none uppercase ml-2 shrink-0 ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : item.badgeColor || 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Active Dot Indicator */}
                        {isActive && isCollapsed && (
                          <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-teal-400 shadow-xs shadow-teal-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm ${
                currentUser?.role === 'admin' ? 'bg-amber-500' : 'bg-[#4F46E5]'
              }`}
            >
              {currentUser?.role === 'admin' ? 'ADM' : currentUser?.assignedClass?.replace('Kelas ', 'K') || 'GK'}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-white truncate leading-tight">
                  {currentUser?.name || 'Administrator'}
                </p>
                <p className="text-[10px] text-teal-400 font-bold truncate flex items-center gap-1 mt-0.5">
                  <Lock className="w-2.5 h-2.5" />
                  <span>{currentUser?.role === 'admin' ? 'Admin Sekolah' : `Wali ${currentUser?.assignedClass}`}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
