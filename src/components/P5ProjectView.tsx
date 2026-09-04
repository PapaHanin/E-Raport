import React, { useState } from 'react';
import {
  Student,
  ClassLevel,
  SchoolProfile,
  P5Project,
  P5StudentScore,
  P5Predikat,
  P5Dimension,
  getFaseByClass,
} from '../types';
import {
  Compass,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  Sparkles,
  Printer,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  BookOpen,
  Info,
  Users,
} from 'lucide-react';

interface P5ProjectViewProps {
  students: Student[];
  projects: P5Project[];
  scores: P5StudentScore[];
  activeClassLevel: ClassLevel;
  schoolProfile: SchoolProfile;
  onUpdateProjects: (projects: P5Project[]) => void;
  onUpdateScores: (scores: P5StudentScore[]) => void;
  onSelectClassLevel?: (classLevel: ClassLevel) => void;
  onNavigateToPrint?: () => void;
}

// Available 6 Dimensions of Profil Pelajar Pancasila
const DIMENSION_OPTIONS = [
  {
    name: 'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
    subElements: [
      { code: 'D1.E1', title: 'Menjaga Lingkungan Alam Sekitar', targetCapai: 'Membiasakan diri berperilaku ramah lingkungan dan menjaga kebersihan alam sekitar.' },
      { code: 'D1.E2', title: 'Akhlak Pribadi (Integritas & Kejujuran)', targetCapai: 'Berperilaku jujur dan berakhlak mulia dalam perkataan maupun perbuatan sehari-hari.' },
    ],
  },
  {
    name: 'Berkebinekaan Global',
    subElements: [
      { code: 'D2.E1', title: 'Mendalami Budaya dan Identitas Budaya', targetCapai: 'Mengidentifikasi dan menghargai keragaman budaya lokal nusantara.' },
      { code: 'D2.E2', title: 'Komunikasi dan Interaksi Antar Budaya', targetCapai: 'Menghargai perbedaan pendapat dan latar belakang orang lain secara inklusif.' },
    ],
  },
  {
    name: 'Bergotong Royong',
    subElements: [
      { code: 'D3.E1', title: 'Kerjasama dalam Kelompok', targetCapai: 'Menampilkan tindakan yang selaras dengan tujuan kelompok dan saling membantu.' },
      { code: 'D3.E2', title: 'Kepedulian dan Berbagi', targetCapai: 'Tanggap terhadap lingkungan sosial dan mau berbagi pengetahuan serta peralatan.' },
    ],
  },
  {
    name: 'Mandiri',
    subElements: [
      { code: 'D4.E1', title: 'Percaya Diri dan Tangguh', targetCapai: 'Memiliki kepercayaan diri dan daya juang saat menghadapi kesulitan dalam proyek.' },
      { code: 'D4.E2', title: 'Regulasi Emosi dan Mengatur Diri', targetCapai: 'Dapat mengelola waktu dan berkonsentrasi menyelesaikan tugas mandiri.' },
    ],
  },
  {
    name: 'Bernalar Kritis',
    subElements: [
      { code: 'D5.E1', title: 'Mengajukan Pertanyaan dan Mengolah Informasi', targetCapai: 'Mengidentifikasi informasi penting dan berani bertanya untuk memperjelas konsep.' },
      { code: 'D5.E2', title: 'Refleksi Pemikiran dan Proses Berpikir', targetCapai: 'Menjelaskan alasan di balik keputusan atau ide yang diajukan.' },
    ],
  },
  {
    name: 'Kreatif',
    subElements: [
      { code: 'D6.E1', title: 'Menghasilkan Karya dan Gagasan Orisinal', targetCapai: 'Mengekspresikan ide dalam bentuk karya nyata yang inovatif dan bermanfaat.' },
      { code: 'D6.E2', title: 'Keluwesan Berpikir dalam Mencari Alternatif', targetCapai: 'Mencari berbagai alternatif solusi ketika menghadapi kendala pembuatan produk.' },
    ],
  },
];

const PREDIKAT_LABELS: Record<P5Predikat, { label: string; bg: string; text: string; full: string }> = {
  MB: { label: 'MB', full: 'Mulai Berkembang', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-400' },
  SB: { label: 'SB', full: 'Sedang Berkembang', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-400' },
  BSH: { label: 'BSH', full: 'Berkembang Sesuai Harapan', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-400' },
  SAB: { label: 'SAB', full: 'Sangat Berkembang', bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-400' },
};

export const P5ProjectView: React.FC<P5ProjectViewProps> = ({
  students,
  projects,
  scores,
  activeClassLevel,
  schoolProfile,
  onUpdateProjects,
  onUpdateScores,
  onSelectClassLevel,
  onNavigateToPrint,
}) => {
  const classLevels: ClassLevel[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
  const filteredStudents = students.filter((s) => s.gradeLevel === activeClassLevel);
  const classProjects = projects.filter((p) => p.classLevel === activeClassLevel);

  const [activeProjectId, setActiveProjectId] = useState<string>(classProjects[0]?.id || '');
  const [showAddProjectModal, setShowAddProjectModal] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<P5Project | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTheme, setNewTheme] = useState<P5Project['theme']>('Gaya Hidup Berkelanjutan');
  const [newDesc, setNewDesc] = useState('');
  const [selectedDims, setSelectedDims] = useState<string[]>([
    'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
    'Bergotong Royong',
    'Kreatif',
  ]);

  const activeProject = classProjects.find((p) => p.id === activeProjectId) || classProjects[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Flatten all subelements for current project table
  const currentSubElements = activeProject
    ? activeProject.dimensions.flatMap((d) => d.subElements)
    : [];

  const handleScoreChange = (studentId: string, subElementId: string, pred: P5Predikat) => {
    if (!activeProject) return;

    const existingIdx = scores.findIndex(
      (s) => s.studentId === studentId && s.projectId === activeProject.id
    );

    let updatedScores = [...scores];
    if (existingIdx >= 0) {
      updatedScores[existingIdx] = {
        ...updatedScores[existingIdx],
        scores: {
          ...updatedScores[existingIdx].scores,
          [subElementId]: pred,
        },
      };
    } else {
      updatedScores.push({
        studentId,
        projectId: activeProject.id,
        scores: { [subElementId]: pred },
        catatanProses: `Ananda telah mengikuti proyek ${activeProject.title} dengan aktif.`,
      });
    }

    onUpdateScores(updatedScores);
  };

  const handleNotesChange = (studentId: string, note: string) => {
    if (!activeProject) return;
    const existingIdx = scores.findIndex(
      (s) => s.studentId === studentId && s.projectId === activeProject.id
    );

    let updatedScores = [...scores];
    if (existingIdx >= 0) {
      updatedScores[existingIdx] = {
        ...updatedScores[existingIdx],
        catatanProses: note,
      };
    } else {
      updatedScores.push({
        studentId,
        projectId: activeProject.id,
        scores: {},
        catatanProses: note,
      });
    }
    onUpdateScores(updatedScores);
  };

  const handleBatchFillAll = (pred: P5Predikat) => {
    if (!activeProject) return;
    let updatedScores = [...scores];

    filteredStudents.forEach((student) => {
      const idx = updatedScores.findIndex(
        (s) => s.studentId === student.id && s.projectId === activeProject.id
      );

      const batchObj: Record<string, P5Predikat> = {};
      currentSubElements.forEach((sub) => {
        batchObj[sub.id] = pred;
      });

      if (idx >= 0) {
        updatedScores[idx] = {
          ...updatedScores[idx],
          scores: { ...updatedScores[idx].scores, ...batchObj },
        };
      } else {
        updatedScores.push({
          studentId: student.id,
          projectId: activeProject.id,
          scores: batchObj,
          catatanProses: `Ananda menunjukkan perkembangan yang sangat baik dalam seluruh alur projek profil.`,
        });
      }
    });

    onUpdateScores(updatedScores);
    showToast(`Berhasil menerapkan rubrik ${pred} (${PREDIKAT_LABELS[pred].full}) ke seluruh siswa!`);
  };

  const handleSaveNewProject = () => {
    if (!newTitle.trim()) {
      alert('Judul proyek tidak boleh kosong');
      return;
    }

    const dimsConfig = selectedDims.map((dName) => {
      const opt = DIMENSION_OPTIONS.find((o) => o.name === dName);
      return {
        dimensionName: dName,
        subElements: (opt?.subElements || []).map((sub, i) => ({
          id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${i}`,
          code: sub.code,
          title: sub.title,
          targetCapai: sub.targetCapai,
        })),
      };
    });

    const newProj: P5Project = {
      id: `p5-${Date.now()}`,
      title: newTitle,
      theme: newTheme,
      description: newDesc || `Projek Penguatan Profil Pelajar Pancasila jenjang ${activeClassLevel}`,
      academicYear: schoolProfile.academicYear || '2024/2025',
      semester: schoolProfile.semester || '1 (Ganjil)',
      classLevel: activeClassLevel,
      dimensions: dimsConfig,
    };

    const updated = [...projects, newProj];
    onUpdateProjects(updated);
    setActiveProjectId(newProj.id);
    setShowAddProjectModal(false);
    setNewTitle('');
    setNewDesc('');
    showToast(`Projek P5 "${newProj.title}" berhasil ditambahkan!`);
  };

  const handleDeleteProject = (projId: string) => {
    if (!window.confirm('Hapus projek P5 ini beserta seluruh catatan penilaiannya?')) return;
    const updated = projects.filter((p) => p.id !== projId);
    onUpdateProjects(updated);
    if (activeProjectId === projId) {
      const remain = updated.filter((p) => p.classLevel === activeClassLevel);
      setActiveProjectId(remain[0]?.id || '');
    }
    showToast('Projek P5 berhasil dihapus.');
  };

  return (
    <div className="space-y-6" id="p5-project-container">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-indigo-800 text-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xl shadow-teal-900/20 border-2 border-teal-400/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-black text-xs font-black uppercase tracking-wider shadow-xs">
              <Compass className="w-3.5 h-3.5" />
              <span>Modul Kokurikuler P5 Kurikulum Merdeka</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Projek Penguatan Profil Pelajar Pancasila (P5)
            </h2>
            <p className="text-teal-100 text-xs sm:text-sm font-medium leading-relaxed">
              Rancang tema projek, tentukan dimensi dan target capaian fase, input penilaian rubrik siswa (MB, SB, BSH, SAB), serta cetak lembar Rapor P5 resmi Kemendikbudristek.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddProjectModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs sm:text-sm shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Projek P5 Baru</span>
            </button>

            {onNavigateToPrint && (
              <button
                type="button"
                onClick={onNavigateToPrint}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm border border-white/30 transition-all cursor-pointer backdrop-blur-xs"
              >
                <Printer className="w-4 h-4 text-yellow-300" />
                <span>Cetak Rapor P5</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Class Selector & Project Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border-2 border-teal-100 dark:border-slate-800 shadow-xs space-y-4">
        {/* Class Level Selector */}
        {onSelectClassLevel && (
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider">
                Pilih Jenjang Kelas:
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto">
              {classLevels.map((lvl) => {
                const isActive = lvl === activeClassLevel;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onSelectClassLevel(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-xs scale-[1.02]'
                        : 'text-gray-700 dark:text-slate-300 hover:text-teal-700 hover:bg-white/80 dark:hover:bg-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Project Selector Chips */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Pilih Projek ({classProjects.length}):</span>
            {classProjects.map((p, idx) => {
              const isSelected = p.id === (activeProject?.id || '');
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveProjectId(p.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 scale-[1.02]'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Projek {idx + 1}: {p.title}</span>
                </button>
              );
            })}
          </div>

          {activeProject && (
            <button
              type="button"
              onClick={() => handleDeleteProject(activeProject.id)}
              className="text-rose-600 hover:text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Projek Ini</span>
            </button>
          )}
        </div>
      </div>

      {activeProject ? (
        <div className="space-y-6">
          {/* Active Project Card Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-teal-100 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div>
                <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800">
                  Tema: {activeProject.theme}
                </span>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1">
                  {activeProject.title}
                </h3>
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400">
                <span>T.P. {activeProject.academicYear} • Semester {activeProject.semester} • {activeProject.classLevel}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
              {activeProject.description}
            </p>

            {/* Target Dimensions & Sub-elements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {activeProject.dimensions.map((dim, dIdx) => (
                <div
                  key={dIdx}
                  className="p-4 rounded-2xl bg-teal-50/50 dark:bg-slate-800/60 border border-teal-100 dark:border-slate-700 space-y-2"
                >
                  <h4 className="font-black text-teal-900 dark:text-teal-300 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>{dim.dimensionName}</span>
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-gray-600 dark:text-slate-400">
                    {dim.subElements.map((sub) => (
                      <li key={sub.id} className="border-l-2 border-teal-400 pl-2">
                        <strong className="text-gray-900 dark:text-slate-200">{sub.title}</strong>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{sub.targetCapai}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment Rubric Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-teal-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Matriks Penilaian Rubrik Peserta Didik ({filteredStudents.length} Siswa)</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Pilih capaian: <strong>MB</strong> (Mulai Berkembang), <strong>SB</strong> (Sedang Berkembang), <strong>BSH</strong> (Berkembang Sesuai Harapan), <strong>SAB</strong> (Sangat Berkembang).
                </p>
              </div>

              {/* Quick Auto-Fill Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Isi Cepat Semua:</span>
                {(['BSH', 'SAB', 'SB'] as P5Predikat[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleBatchFillAll(p)}
                    className="px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-teal-800 dark:text-teal-300 text-xs font-black border border-gray-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    Semua {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Rubrik Table */}
            <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-teal-50/80 dark:bg-slate-800 text-gray-800 dark:text-slate-200 font-bold border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3 min-w-[180px]">Nama Peserta Didik</th>
                    {currentSubElements.map((sub, sIdx) => (
                      <th key={sub.id} className="p-3 text-center min-w-[140px]" title={sub.targetCapai}>
                        <div className="font-black text-teal-900 dark:text-teal-300">{sub.code}</div>
                        <div className="text-[10px] text-gray-600 dark:text-slate-400 font-normal truncate max-w-[130px]">
                          {sub.title}
                        </div>
                      </th>
                    ))}
                    <th className="p-3 min-w-[220px]">Catatan Proses & Perkembangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-900 dark:text-slate-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={currentSubElements.length + 3} className="text-center py-10 text-gray-400 text-xs">
                        Belum ada siswa terdaftar di {activeClassLevel}.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => {
                      const studentScoreRecord = scores.find(
                        (s) => s.studentId === student.id && s.projectId === activeProject.id
                      );

                    return (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 text-center font-bold text-gray-500">{idx + 1}</td>
                        <td className="p-3 font-bold">
                          <div className="text-gray-900 dark:text-white">{student.name}</div>
                          <div className="text-[10px] font-mono text-gray-400">{student.nisn}</div>
                        </td>

                        {currentSubElements.map((sub) => {
                          const currentVal = studentScoreRecord?.scores?.[sub.id] || 'BSH';
                          return (
                            <td key={sub.id} className="p-2 text-center">
                              <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                                {(['MB', 'SB', 'BSH', 'SAB'] as P5Predikat[]).map((p) => {
                                  const isSelected = currentVal === p;
                                  const style = PREDIKAT_LABELS[p];
                                  return (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => handleScoreChange(student.id, sub.id, p)}
                                      title={style.full}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                        isSelected
                                          ? `${style.bg} ${style.text} shadow-xs font-black ring-1 ring-teal-500`
                                          : 'text-gray-400 hover:text-gray-700 dark:hover:text-slate-200'
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          );
                        })}

                        <td className="p-2">
                          <input
                            type="text"
                            value={studentScoreRecord?.catatanProses || ''}
                            onChange={(e) => handleNotesChange(student.id, e.target.value)}
                            placeholder="Catatan keaktifan siswa dalam proyek..."
                            className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-slate-700 space-y-4">
          <Award className="w-12 h-12 text-teal-600 mx-auto" />
          <h3 className="text-lg font-black text-gray-900 dark:text-white">
            Belum ada Projek P5 untuk {activeClassLevel}
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
            Kurikulum Merdeka mewajibkan 2–3 projek kokurikuler P5 dalam 1 tahun ajaran. Silakan klik tombol di bawah untuk membuat projek baru.
          </p>
          <button
            type="button"
            onClick={() => setShowAddProjectModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md shadow-teal-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Projek P5 Sekarang</span>
          </button>
        </div>
      )}

      {/* Modal Add Project */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-2xl w-full p-6 sm:p-8 space-y-5 border border-teal-200 dark:border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                <span>Rancang Projek P5 Baru ({activeClassLevel})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProjectModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Pilih Tema Kemendikbudristek:
                </label>
                <select
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value as any)}
                  className="w-full p-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white font-bold"
                >
                  <option value="Gaya Hidup Berkelanjutan">Gaya Hidup Berkelanjutan</option>
                  <option value="Kearifan Lokal">Kearifan Lokal</option>
                  <option value="Bhinneka Tunggal Ika">Bhinneka Tunggal Ika</option>
                  <option value="Bangunlah Jiwa dan Raganya">Bangunlah Jiwa dan Raganya</option>
                  <option value="Rekayasa dan Teknologi">Rekayasa dan Teknologi</option>
                  <option value="Kewirausahaan">Kewirausahaan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Judul Projek:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Apotek Hidup Mini di Halaman Sekolah"
                  className="w-full p-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Deskripsi / Sinopsis Projek:
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Jelaskan gambaran umum alur kegiatan projek..."
                  className="w-full p-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-2">
                  Pilih Dimensi Profil Pelajar Pancasila yang Dikembangkan:
                </label>
                <div className="space-y-2">
                  {DIMENSION_OPTIONS.map((dim) => {
                    const isChecked = selectedDims.includes(dim.name);
                    return (
                      <label
                        key={dim.name}
                        className={`flex items-start gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700'
                            : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDims([...selectedDims, dim.name]);
                            } else {
                              setSelectedDims(selectedDims.filter((d) => d !== dim.name));
                            }
                          }}
                          className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="font-bold text-gray-900 dark:text-slate-200">{dim.name}</span>
                          <span className="block text-[11px] text-gray-500 dark:text-slate-400">
                            {dim.subElements.map((s) => s.title).join(' • ')}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddProjectModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNewProject}
                className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md shadow-teal-600/20 cursor-pointer"
              >
                Simpan Projek P5
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
