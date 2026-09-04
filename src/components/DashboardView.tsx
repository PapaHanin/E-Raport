import React from 'react';
import {
  MataPelajaran,
  NilaiSiswaMapel,
  SchoolProfile,
  Student,
  ActiveTab,
  ClassLevel,
  getFaseByClass,
  isIPASActiveForClass,
} from '../types';
import { getSubjectsForClass } from '../data/initialData';
import {
  Users,
  Award,
  Sparkles,
  Printer,
  Send,
  BookOpen,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  TrendingUp,
  ArrowRight,
  GraduationCap,
  Info,
} from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  subjects: MataPelajaran[];
  grades: NilaiSiswaMapel[];
  schoolProfile: SchoolProfile;
  activeClassLevel?: ClassLevel;
  onSelectClassLevel?: (classLevel: ClassLevel) => void;
  onNavigate: (tab: ActiveTab, params?: any) => void;
  onSelectStudent?: (studentId: string) => void;
  onSelectStudentForAI?: (studentId: string, subjectId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  subjects,
  grades,
  schoolProfile,
  activeClassLevel = 'Kelas 4',
  onSelectClassLevel,
  onNavigate,
  onSelectStudent,
  onSelectStudentForAI,
}) => {
  const classLevels: ClassLevel[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
  const currentFase = getFaseByClass(activeClassLevel);
  const isIPASVisible = isIPASActiveForClass(activeClassLevel);

  // Filter students for active class
  const classStudents = students.filter(
    (std) => std.gradeLevel === activeClassLevel || (!std.gradeLevel && activeClassLevel === 'Kelas 4')
  );

  // Filter subjects for active class (Excluding IPAS for Kelas 1 & 2)
  const activeClassSubjects = getSubjectsForClass(subjects, activeClassLevel);

  // Calculate aggregate stats for active class
  const classStudentIds = new Set(classStudents.map((s) => s.id));
  const classSubjectIds = new Set(activeClassSubjects.map((s) => s.id));

  const validClassGrades = grades.filter(
    (g) => classStudentIds.has(g.studentId) && classSubjectIds.has(g.subjectId) && g.nilaiAkhir > 0
  );

  const classAvg = validClassGrades.length > 0
    ? (validClassGrades.reduce((sum, g) => sum + g.nilaiAkhir, 0) / validClassGrades.length).toFixed(1)
    : '0';

  const completedNarratives = grades.filter(
    (g) =>
      classStudentIds.has(g.studentId) &&
      classSubjectIds.has(g.subjectId) &&
      g.narasiRapor &&
      g.narasiRapor.trim().length > 10
  ).length;

  const totalExpectedNarratives = classStudents.length * activeClassSubjects.length;
  const narrativePct = totalExpectedNarratives > 0
    ? Math.round((completedNarratives / totalExpectedNarratives) * 100)
    : 0;

  const needsImprovementCount = validClassGrades.filter((g) => g.nilaiAkhir < 75).length;

  // Calculate student-level averages for active class
  const studentStats = classStudents.map((std) => {
    const stdGrades = grades.filter(
      (g) => g.studentId === std.id && classSubjectIds.has(g.subjectId) && g.nilaiAkhir > 0
    );
    const avg = stdGrades.length > 0
      ? (stdGrades.reduce((sum, g) => sum + g.nilaiAkhir, 0) / stdGrades.length).toFixed(1)
      : '0';
    const completedNarasi = grades.filter(
      (g) => g.studentId === std.id && classSubjectIds.has(g.subjectId) && g.narasiRapor && g.narasiRapor.trim().length > 10
    ).length;
    return {
      ...std,
      average: avg,
      completedNarasi,
      totalSubjects: activeClassSubjects.length,
    };
  });

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Header Breadcrumb & Quick Class Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border-2 border-indigo-100 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm font-bold text-gray-400 dark:text-slate-500">Home /</span>
          <span className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Ringkasan Penilaian e-Rapor
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {activeClassLevel} ({currentFase})
          </span>
        </div>

        {/* Class Switcher */}
        {onSelectClassLevel && (
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto">
            <span className="text-[11px] font-black text-gray-500 dark:text-slate-400 px-2 uppercase tracking-wider">
              Kelas:
            </span>
            {classLevels.map((lvl) => {
              const isActive = lvl === activeClassLevel;
              return (
                <button
                  key={lvl}
                  onClick={() => onSelectClassLevel(lvl)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                    isActive
                      ? 'bg-[#4F46E5] text-white shadow-xs'
                      : 'text-gray-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Notice for Kelas 1 & 2 IPAS */}
      {!isIPASVisible && (
        <div className="flex items-center gap-2 p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 font-medium">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Aturan Kurikulum Merdeka Fase A:</strong> Pada <strong>{activeClassLevel}</strong>, mata pelajaran <strong>IPAS</strong> ditiadakan secara otomatis. Total mata pelajaran aktif adalah <strong>{activeClassSubjects.length} Mapel</strong>.
          </span>
        </div>
      )}

      {/* 3-Column Vibrant Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Siswa Aktif */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-b-8 border-r-8 border-indigo-500 flex flex-col justify-between h-36 shadow-xs transition-all hover:-translate-y-1 duration-200">
          <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
            Siswa Aktif ({activeClassLevel})
          </span>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{classStudents.length}</span>
            <span className="bg-green-100 dark:bg-emerald-950/60 text-green-700 dark:text-emerald-300 border border-transparent dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-black uppercase">
              {activeClassSubjects.length} Mapel
            </span>
          </div>
        </div>

        {/* Belum Dinilai / Priority */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-b-8 border-r-8 border-pink-500 flex flex-col justify-between h-36 shadow-xs transition-all hover:-translate-y-1 duration-200">
          <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
            Perlu Bimbingan / Belum Tuntas
          </span>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-black text-pink-500 dark:text-pink-400">{needsImprovementCount || '0'}</span>
            <span className="bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 border border-transparent dark:border-pink-800 px-3 py-1 rounded-full text-xs font-black uppercase">
              Priority
            </span>
          </div>
        </div>

        {/* Rata-rata Nilai Kelas */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-b-8 border-r-8 border-yellow-400 flex flex-col justify-between h-36 shadow-xs transition-all hover:-translate-y-1 duration-200">
          <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
            Rata-rata Nilai {activeClassLevel}
          </span>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-black text-yellow-500 dark:text-yellow-400">{classAvg}</span>
            <span className="bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border border-transparent dark:border-yellow-800 px-3 py-1 rounded-full text-xs font-black uppercase">
              {currentFase.split(' ')[0]} {currentFase.split(' ')[1]}
            </span>
          </div>
        </div>
      </div>

      {/* Main 12-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Table Roster Penilaian */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[40px] shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden transition-colors">
          <div className="px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/70 dark:bg-slate-800/60">
            <div>
              <h2 className="font-black text-lg text-gray-900 dark:text-white">
                Daftar Antrian Penilaian • {activeClassLevel}
              </h2>
              <p className="text-xs font-medium text-gray-400 dark:text-slate-400">
                Status kelengkapan nilai sumatif dan deskripsi capaian pembelajaran
              </p>
            </div>
            <button
              onClick={() => onNavigate('gradebook')}
              className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline uppercase tracking-wider"
            >
              BUKA BUKU NILAI
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50/70 dark:bg-slate-800/60">
                <tr className="text-left text-[11px] uppercase tracking-widest text-gray-400 dark:text-slate-400 border-b border-gray-100 dark:border-slate-800">
                  <th className="px-6 sm:px-8 py-3.5">Peserta Didik</th>
                  <th className="px-4 py-3.5 text-center">Rata NA</th>
                  <th className="px-4 py-3.5">Status Narasi</th>
                  <th className="px-6 sm:px-8 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                {studentStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-400 dark:text-slate-500 text-xs">
                      Tidak ada siswa di {activeClassLevel}.
                    </td>
                  </tr>
                ) : (
                  studentStats.map((std) => {
                    const isAllDone = std.completedNarasi === std.totalSubjects;
                    return (
                      <tr key={std.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 sm:px-8 py-4 font-bold text-gray-900 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-black text-xs flex items-center justify-center shrink-0">
                              {std.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{std.name}</p>
                              <p className="text-[11px] text-gray-400 dark:text-slate-400 font-normal">
                                NISN: {std.nisn} • Wali: {std.parentName || '-'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-xs border border-indigo-100 dark:border-slate-700">
                            {std.average}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                              isAllDone ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300' : 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300'
                            }`}
                          >
                            {isAllDone ? 'Lengkap' : `${std.completedNarasi}/${std.totalSubjects} Mapel`}
                          </span>
                        </td>
                        <td className="px-6 sm:px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                if (onSelectStudentForAI) {
                                  onSelectStudentForAI(std.id, activeClassSubjects[0]?.id || 'mapel-1');
                                }
                                onNavigate('ai-narasi');
                              }}
                              className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-xl transition-colors"
                            >
                              AI Narasi
                            </button>
                            <button
                              onClick={() => {
                                if (onSelectStudent) onSelectStudent(std.id);
                                onNavigate('cetak-rapor');
                              }}
                              className="text-xs font-black text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-xl transition-colors"
                            >
                              Cetak
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (4 cols): Deep Slate AI Card & Canary Yellow Siap Cetak */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Deep Dark Graphite Card (#2D3142) */}
          <div className="bg-[#2D3142] dark:bg-slate-900 text-white p-7 sm:p-8 rounded-[32px] sm:rounded-[40px] flex-1 flex flex-col justify-between relative overflow-hidden shadow-lg border border-slate-700 dark:border-slate-800">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-teal-300" />
                <span>Gemini AI Engine</span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                Analisis Capaian {activeClassLevel}
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                iihh Beres memproses otomatis narasi capaian pembelajaran berbasis formula NA Kurikulum Merdeka Kemdikbudristek.
              </p>
            </div>

            <div className="space-y-4 relative z-10 my-6">
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                  Kemajuan Narasi
                </span>
                <span className="text-xl font-black text-teal-400">{narrativePct}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, narrativePct)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 font-bold">
                <span>Narasi Selesai:</span>
                <span className="text-teal-300 font-black">
                  {completedNarratives}/{totalExpectedNarratives}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('ai-narasi')}
              className="relative z-10 w-full py-3 bg-[#4F46E5] hover:bg-indigo-600 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Buka Generator AI Narasi</span>
            </button>

            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          {/* Canary Yellow Call to Action Card (#FACC15 / bg-yellow-400) */}
          <div
            onClick={() => onNavigate('cetak-rapor')}
            className="bg-yellow-400 hover:bg-yellow-300 p-6 rounded-[32px] sm:rounded-[40px] flex items-center justify-between shadow-lg text-black cursor-pointer transition-all duration-200 transform hover:scale-[1.02] border-2 border-yellow-300"
          >
            <div className="flex flex-col">
              <span className="font-black text-2xl text-black">Siap Cetak?</span>
              <span className="text-xs font-bold text-yellow-950 mt-0.5">
                Cetak Rapor {activeClassLevel} Sekarang
              </span>
            </div>
            <button className="h-12 w-12 bg-black rounded-full flex items-center justify-center text-white shrink-0 shadow-md">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Formula & Rule Explanation Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-indigo-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Calculator className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-gray-900 dark:text-white text-sm sm:text-base">
              Rumus Pengolahan Nilai Akhir (NA) Rapor Kurikulum Merdeka
            </h4>
            <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              Sistem otomatis mengkalkulasi <strong className="text-indigo-700 dark:text-indigo-400">NA = (Rata-rata LM × 60%) + (SAS × 40%)</strong>, mengevaluasi capaian TP tertinggi & terendah, dan merangkum narasi 2 kalimat apresiatif.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('gradebook')}
          className="px-5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-black text-xs border border-indigo-200 dark:border-slate-700 whitespace-nowrap transition-colors"
        >
          Buka Buku Nilai
        </button>
      </div>
    </div>
  );
};
