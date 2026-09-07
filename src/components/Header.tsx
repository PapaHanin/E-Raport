import React from 'react';
import { SchoolProfile, ClassLevel, TeacherAccount, getFaseByClass } from '../types';
import {
  Sparkles,
  CheckCircle2,
  Printer,
  MessageSquare,
  GraduationCap,
  Lock,
  ChevronDown,
  LogIn,
  Moon,
  Sun,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Cloud,
} from 'lucide-react';

interface HeaderProps {
  schoolProfile: SchoolProfile;
  activeTab?: string;
  onTabChange?: (tab: any) => void;
  onSelectTab?: (tab: any) => void;
  aiConnected?: boolean;
  totalStudents?: number;
  completedNarrativesCount?: number;
  totalSubjects?: number;
  activeClassLevel?: ClassLevel;
  onSelectClassLevel?: (classLevel: ClassLevel) => void;
  currentUser?: TeacherAccount | null;
  onOpenAccountModal?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onToggleMobileSidebar?: () => void;
  onToggleCollapseSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  schoolProfile,
  onTabChange,
  onSelectTab,
  aiConnected = true,
  totalStudents = 32,
  completedNarrativesCount = 32,
  totalSubjects = 8,
  activeClassLevel = 'Kelas 4',
  onSelectClassLevel,
  currentUser,
  onOpenAccountModal,
  isDarkMode = false,
  onToggleDarkMode,
  onToggleMobileSidebar,
  onToggleCollapseSidebar,
  isSidebarCollapsed = false,
}) => {
  const handleTab = onTabChange || onSelectTab || (() => {});
  const totalExpectedNarratives = totalStudents * totalSubjects;
  const progressPct = totalExpectedNarratives > 0 
    ? Math.round((completedNarrativesCount / totalExpectedNarratives) * 100) 
    : 0;

  const classLevels: ClassLevel[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
  const currentFase = getFaseByClass(activeClassLevel);

  const isTeacherLocked = currentUser?.role === 'guru_wali_kelas';
  const isGuruMapel = currentUser?.role === 'guru_mapel';

  const getMapelShortCode = (subjectName?: string) => {
    const s = (subjectName || '').toLowerCase();
    if (s.includes('pjok') || s.includes('jasmani')) return 'PJOK';
    if (s.includes('pai') || s.includes('agama islam')) return 'PAI';
    if (s.includes('inggris')) return 'BING';
    return 'MP';
  };

  return (
    <header className="print:hidden bg-white dark:bg-slate-900 border-b-2 border-indigo-100 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200" id="app-main-header">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 gap-3">
          {/* Left: Sidebar Toggle Button + School Context */}
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Drawer Toggle */}
            {onToggleMobileSidebar && (
              <button
                type="button"
                id="btn-header-mobile-sidebar"
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-2 rounded-2xl bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-slate-700 border border-indigo-200 dark:border-slate-700"
                title="Buka Navigasi Samping"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Desktop Sidebar Collapse / Expand toggle */}
            {onToggleCollapseSidebar && (
              <button
                type="button"
                id="btn-header-desktop-sidebar-toggle"
                onClick={onToggleCollapseSidebar}
                className="hidden lg:flex p-2 rounded-2xl bg-indigo-50/80 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-slate-700 border border-indigo-200 dark:border-slate-700"
                title={isSidebarCollapsed ? 'Buka Penuh Navigasi Samping' : 'Ciutkan Navigasi Samping'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white truncate">
                  {schoolProfile.schoolName}
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Kurikulum Merdeka
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium flex items-center gap-1.5 truncate">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{activeClassLevel} ({currentFase})</span>
                <span>•</span>
                <span>TA {schoolProfile.academicYear}</span>
                <span>•</span>
                <span className="text-gray-400 font-mono">NPSN: {schoolProfile.schoolNPSN}</span>
              </p>
            </div>
          </div>

          {/* Right: Status Indicators & User Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Class Selector / Lock Indicator */}
            {onSelectClassLevel && (
              <div className="flex items-center gap-1.5 bg-indigo-50/80 dark:bg-slate-800 p-1 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-xs">
                {isTeacherLocked ? (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-black"
                    title={`Akses Terkunci: Anda login sebagai Wali ${currentUser?.assignedClass}. Data kelas lain diamankan.`}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>{currentUser?.assignedClass} (Terkunci)</span>
                  </div>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 ml-1.5 shrink-0" />
                    <select
                      id="header-select-class-level"
                      value={activeClassLevel}
                      onChange={(e) => onSelectClassLevel(e.target.value as ClassLevel)}
                      aria-label="Pilih Kelas"
                      className="text-xs font-black bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 text-indigo-900 dark:text-indigo-300 rounded-xl px-2.5 py-1 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
                    >
                      {classLevels.map((lvl) => (
                        <option key={lvl} value={lvl} className="dark:bg-slate-900 dark:text-white">
                          👑 {lvl} ({getFaseByClass(lvl).split(' ')[0]} {getFaseByClass(lvl).split(' ')[1]})
                        </option>
                      ))}
                    </select>
                    {isGuruMapel && (
                      <span className="hidden xl:inline-block text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/80 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                        Input Mapel Kelas 1-6
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Account Profile Switcher / Login Button */}
            {currentUser && onOpenAccountModal ? (
              <button
                type="button"
                id="header-btn-user-account"
                onClick={onOpenAccountModal}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-2 border-indigo-200 dark:border-slate-700 shadow-xs text-xs font-bold text-gray-800 dark:text-slate-200 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                title="Klik untuk lihat profil / masuk dengan email guru lain"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] text-white ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-500'
                      : currentUser.role === 'guru_mapel'
                      ? 'bg-teal-600'
                      : 'bg-[#4F46E5]'
                  }`}
                >
                  {currentUser.role === 'admin'
                    ? 'ADM'
                    : currentUser.role === 'guru_mapel'
                    ? getMapelShortCode(currentUser.assignedSubjectName)
                    : currentUser.assignedClass?.replace('Kelas ', 'K') || 'GK'}
                </div>

                <div className="text-left hidden md:block">
                  <p className="text-xs font-black text-gray-900 dark:text-white leading-tight truncate max-w-[120px]">
                    {currentUser.name.split(',')[0]}
                  </p>
                  <p className="text-[10px] font-bold leading-tight flex items-center gap-0.5 truncate max-w-[140px]">
                    {currentUser.role === 'admin' && (
                      <span className="text-amber-700 dark:text-amber-400">👑 Admin Sekolah</span>
                    )}
                    {currentUser.role === 'guru_wali_kelas' && (
                      <span className="text-indigo-600 dark:text-indigo-400">🔒 Wali {currentUser.assignedClass}</span>
                    )}
                    {currentUser.role === 'guru_mapel' && (
                      <span className="text-teal-700 dark:text-teal-300 font-bold truncate">
                        ⚽ Guru {currentUser.assignedSubjectName?.split('(')[0]?.trim() || 'Mapel'}
                      </span>
                    )}
                  </p>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
              </button>
            ) : onOpenAccountModal ? (
              <button
                type="button"
                id="header-btn-login"
                onClick={onOpenAccountModal}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#4F46E5] hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 text-xs font-black transition-all hover:scale-[1.01] active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5 text-yellow-300" />
                <span>Masuk dengan Email</span>
              </button>
            ) : null}

            {/* Dark Mode Toggle Button */}
            {onToggleDarkMode && (
              <button
                type="button"
                id="header-btn-toggle-dark-mode"
                onClick={onToggleDarkMode}
                title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap / Malam'}
                aria-label="Toggle dark mode"
                className="p-2 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-yellow-400 border border-gray-200 dark:border-slate-700 shadow-xs transition-all active:scale-95 shrink-0"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>
            )}

            {/* Quick Action Buttons */}
            <button
              id="header-btn-cloud-sync"
              onClick={() => handleTab('cloud-sync')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-2xl transition-all border border-indigo-200 dark:border-indigo-800 shadow-xs active:scale-95 cursor-pointer"
              title="Sinkronisasi Cloud Firestore Multi-Perangkat"
            >
              <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Cloud Sync</span>
            </button>

            <button
              id="header-btn-cetak-rapor"
              onClick={() => handleTab('cetak-rapor')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-800 bg-yellow-300 hover:bg-yellow-400 rounded-2xl transition-all border border-yellow-400 shadow-xs active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-gray-900" />
              <span className="hidden sm:inline">Cetak Rapor</span>
            </button>

            <button
              id="header-btn-wa-gateway"
              onClick={() => handleTab('whatsapp-gateway')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#4F46E5] hover:bg-indigo-700 rounded-2xl transition-all shadow-md shadow-indigo-500/25 active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">WA Wali</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
