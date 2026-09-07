import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MataPelajaran, NilaiSiswaMapel, Student, Predikat, ClassLevel, TeacherAccount, getFaseByClass, isIPASActiveForClass } from '../types';
import { calculateGrade, findExtremeTPs, generateDefaultNarasi } from '../utils/calculator';
import { getSubjectsForClass } from '../data/initialData';
import {
  Calculator,
  Search,
  Sparkles,
  BookOpen,
  Check,
  AlertCircle,
  Download,
  SlidersHorizontal,
  GraduationCap,
  Edit2,
  X,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
  Filter,
  Lock,
} from 'lucide-react';
import { downloadExcelTemplate, exportClassDataToExcel } from '../utils/excelService';

interface GradebookViewProps {
  students: Student[];
  subjects: MataPelajaran[];
  grades: NilaiSiswaMapel[];
  activeClassLevel?: ClassLevel;
  currentUser?: TeacherAccount | null;
  onSelectClassLevel?: (classLevel: ClassLevel) => void;
  onUpdateGrade: (updatedGrade: NilaiSiswaMapel) => void;
  onBatchUpdateGrades: (updatedGrades: NilaiSiswaMapel[]) => void;
  onOpenAIGenerator: (studentId: string, subjectId: string) => void;
}

export const GradebookView: React.FC<GradebookViewProps> = ({
  students,
  subjects,
  grades,
  activeClassLevel = 'Kelas 4',
  currentUser,
  onSelectClassLevel,
  onUpdateGrade,
  onBatchUpdateGrades,
  onOpenAIGenerator,
}) => {
  const classLevels: ClassLevel[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
  const currentFase = getFaseByClass(activeClassLevel);
  const isIPASVisible = isIPASActiveForClass(activeClassLevel);

  // Filter subjects for the active class level (Excluding IPAS for Kelas 1 & 2)
  const activeClassSubjects = getSubjectsForClass(subjects, activeClassLevel);

  // Check Guru Mapel and Wali Kelas Roles
  const isGuruMapel = currentUser?.role === 'guru_mapel';
  const isWaliKelas = currentUser?.role === 'guru_wali_kelas';
  
  // Find subject assigned to this Guru Mapel
  const assignedSubject = useMemo(() => {
    if (!isGuruMapel || !currentUser) return null;
    return (
      activeClassSubjects.find(
        (s) =>
          s.id === currentUser.assignedSubjectId ||
          (currentUser.assignedSubjectName && s.name.toLowerCase() === currentUser.assignedSubjectName.toLowerCase()) ||
          (currentUser.assignedSubjectName && s.name.toLowerCase().includes(currentUser.assignedSubjectName.toLowerCase())) ||
          (currentUser.assignedSubjectName && currentUser.assignedSubjectName.toLowerCase().includes(s.name.toLowerCase()))
      ) ||
      // Fallback matching
      activeClassSubjects.find((s) => {
        const mapelName = (currentUser.assignedSubjectName || '').toLowerCase();
        if (mapelName.includes('pjok') || mapelName.includes('olahraga')) {
          return s.name.toLowerCase().includes('olahraga') || s.name.toLowerCase().includes('pjok');
        }
        if (mapelName.includes('agama') || mapelName.includes('pai') || mapelName.includes('islam')) {
          return s.name.toLowerCase().includes('agama') || s.id === 'mapel-1';
        }
        if (mapelName.includes('inggris')) {
          return s.name.toLowerCase().includes('inggris');
        }
        return false;
      }) ||
      null
    );
  }, [isGuruMapel, currentUser, activeClassSubjects]);

  // Subjects displayed in the selector:
  // IF Guru Mapel: STRICTLY LOCKED to their assigned subject only! Cannot view other subjects.
  const displayedSubjects = useMemo(() => {
    if (isGuruMapel) {
      return assignedSubject ? [assignedSubject] : [];
    }
    return activeClassSubjects;
  }, [isGuruMapel, assignedSubject, activeClassSubjects]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    if (isGuruMapel && assignedSubject) return assignedSubject.id;
    return activeClassSubjects[0]?.id || 'mapel-1';
  });

  // Keep selectedSubjectId valid when class or user changes
  useEffect(() => {
    if (isGuruMapel && assignedSubject) {
      setSelectedSubjectId(assignedSubject.id);
      return;
    }
    const isValid = displayedSubjects.some((s) => s.id === selectedSubjectId);
    if (!isValid && displayedSubjects.length > 0) {
      setSelectedSubjectId(displayedSubjects[0].id);
    }
  }, [activeClassLevel, isGuruMapel, assignedSubject, displayedSubjects, selectedSubjectId]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTabSubView, setActiveTabSubView] = useState<'sumatif' | 'formatif'>('sumatif');

  // Inline Narrative Editor modal/popover state
  const [editingNarasiStudentId, setEditingNarasiStudentId] = useState<string | null>(null);
  const [tempNarasiText, setTempNarasiText] = useState<string>('');

  // Batch Quick Fill Modal
  const [showBatchFillModal, setShowBatchFillModal] = useState<boolean>(false);
  const [batchFillType, setBatchFillType] = useState<'all_lm' | 'sas'>('all_lm');
  const [batchFillScore, setBatchFillScore] = useState<number>(85);

  // Dynamic Grade Weights & KKM state
  const [showWeightModal, setShowWeightModal] = useState<boolean>(false);
  const [lmWeight, setLmWeight] = useState<number>(() => {
    const saved = localStorage.getItem('iihh_lm_weight');
    return saved ? Number(saved) : 60;
  });
  const [sasWeight, setSasWeight] = useState<number>(() => {
    const saved = localStorage.getItem('iihh_sas_weight');
    return saved ? Number(saved) : 40;
  });
  const [kkmThreshold, setKkmThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('iihh_kkm');
    return saved ? Number(saved) : 75;
  });

  const handleSaveWeights = () => {
    localStorage.setItem('iihh_lm_weight', String(lmWeight));
    localStorage.setItem('iihh_sas_weight', String(sasWeight));
    localStorage.setItem('iihh_kkm', String(kkmThreshold));

    // Recalculate all grades with new weights
    const recalculated = grades.map((g) => {
      const { rataRataLM, nilaiAkhir, predikat } = calculateGrade(
        g.sumatifLM.map((x) => x.score),
        g.sumatifSAS,
        lmWeight,
        sasWeight,
        kkmThreshold
      );
      return {
        ...g,
        rataRataLM,
        nilaiAkhir,
        predikat,
      };
    });

    onBatchUpdateGrades(recalculated);
    setShowWeightModal(false);
  };

  // Success indicator for inline edits
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const currentSubject = activeClassSubjects.find((s) => s.id === selectedSubjectId) || activeClassSubjects[0];
  const currentTPs = currentSubject?.tujuanPembelajaran || [];

  // Filter students for the active class level
  const classStudents = students.filter(
    (std) => std.gradeLevel === activeClassLevel || (!std.gradeLevel && activeClassLevel === 'Kelas 4')
  );

  // Filter with search query
  const filteredStudents = classStudents.filter(
    (std) =>
      std.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      std.nisn.includes(searchQuery) ||
      std.nis.includes(searchQuery)
  );

  // Get or initialize grade entry for a student
  const getGradeEntry = (studentId: string): NilaiSiswaMapel => {
    const existing = grades.find(
      (g) => g.studentId === studentId && g.subjectId === selectedSubjectId
    );
    if (existing) return existing;

    const sumatifLM = currentTPs.map((tp) => ({
      tpId: tp.id,
      tpCode: tp.code,
      tpDescription: tp.description,
      score: 80,
    }));

    const { rataRataLM, nilaiAkhir, predikat } = calculateGrade(
      sumatifLM.map((x) => x.score),
      80
    );

    const { highest, lowest } = findExtremeTPs(sumatifLM);
    const student = students.find((s) => s.id === studentId);
    const narasi = generateDefaultNarasi(student?.name || 'Siswa', highest?.desc, lowest?.desc);

    return {
      studentId,
      subjectId: selectedSubjectId,
      formatifScores: [85, 85, 85],
      formatifNotes: 'Aktif mengikuti proses pembelajaran',
      sumatifLM,
      sumatifSAS: 80,
      rataRataLM,
      nilaiAkhir,
      predikat,
      highestTPId: highest?.id,
      highestTPDescription: highest?.desc,
      lowestTPId: lowest?.id,
      lowestTPDescription: lowest?.desc,
      narasiRapor: narasi,
    };
  };

  // Keyboard navigation across input cells (ArrowDown, ArrowUp, Enter)
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colType: string,
    colIndex: number
  ) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextInput = document.querySelector(
        `input[data-row="${rowIndex + 1}"][data-col="${colType}-${colIndex}"]`
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.querySelector(
        `input[data-row="${rowIndex - 1}"][data-col="${colType}-${colIndex}"]`
      ) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  // Handler for LM Score change (Direct Inline)
  const handleScoreLMChange = (studentId: string, tpIndex: number, newScoreVal: string) => {
    const score = parseInt(newScoreVal, 10);
    const validScore = isNaN(score) ? 0 : Math.max(0, Math.min(100, score));

    const current = getGradeEntry(studentId);
    const updatedLM = [...current.sumatifLM];

    if (updatedLM[tpIndex]) {
      updatedLM[tpIndex] = {
        ...updatedLM[tpIndex],
        score: validScore,
      };
    } else {
      const tp = currentTPs[tpIndex];
      if (tp) {
        updatedLM[tpIndex] = {
          tpId: tp.id,
          tpCode: tp.code,
          tpDescription: tp.description,
          score: validScore,
        };
      }
    }

    const { rataRataLM, nilaiAkhir, predikat } = calculateGrade(
      updatedLM.map((x) => x.score),
      current.sumatifSAS
    );

    const { highest, lowest } = findExtremeTPs(updatedLM);
    const student = students.find((s) => s.id === studentId);
    const autoNarasi = generateDefaultNarasi(student?.name || 'Siswa', highest?.desc, lowest?.desc);

    const updated: NilaiSiswaMapel = {
      ...current,
      sumatifLM: updatedLM,
      rataRataLM,
      nilaiAkhir,
      predikat,
      highestTPId: highest?.id,
      highestTPDescription: highest?.desc,
      lowestTPId: lowest?.id,
      lowestTPDescription: lowest?.desc,
      narasiRapor: current.isAIGenerated ? current.narasiRapor : autoNarasi,
    };

    onUpdateGrade(updated);
    setLastSavedId(`${studentId}-lm-${tpIndex}`);
    setTimeout(() => setLastSavedId(null), 1200);
  };

  // Handler for SAS Score change (Direct Inline)
  const handleScoreSASChange = (studentId: string, newScoreVal: string) => {
    const score = parseInt(newScoreVal, 10);
    const validScore = isNaN(score) ? 0 : Math.max(0, Math.min(100, score));

    const current = getGradeEntry(studentId);
    const { rataRataLM, nilaiAkhir, predikat } = calculateGrade(
      current.sumatifLM.map((x) => x.score),
      validScore
    );

    const updated: NilaiSiswaMapel = {
      ...current,
      sumatifSAS: validScore,
      rataRataLM,
      nilaiAkhir,
      predikat,
    };

    onUpdateGrade(updated);
    setLastSavedId(`${studentId}-sas`);
    setTimeout(() => setLastSavedId(null), 1200);
  };

  // Handler for Formatif Score change (Direct Inline)
  const handleFormatifChange = (studentId: string, idx: number, val: string) => {
    const score = parseInt(val, 10);
    const validScore = isNaN(score) ? 0 : Math.max(0, Math.min(100, score));
    const current = getGradeEntry(studentId);
    const nextFormatif = [...(current.formatifScores || [80, 80, 80])];
    nextFormatif[idx] = validScore;

    onUpdateGrade({
      ...current,
      formatifScores: nextFormatif,
    });
    setLastSavedId(`${studentId}-f-${idx}`);
    setTimeout(() => setLastSavedId(null), 1200);
  };

  // Handler for Inline Narasi Rapor Save
  const handleSaveInlineNarasi = (studentId: string) => {
    const current = getGradeEntry(studentId);
    onUpdateGrade({
      ...current,
      narasiRapor: tempNarasiText.trim(),
      isAIGenerated: true,
    });
    setEditingNarasiStudentId(null);
  };

  // Handler to Reset Narasi to Auto Formula
  const handleResetInlineNarasi = (studentId: string) => {
    const current = getGradeEntry(studentId);
    const student = students.find((s) => s.id === studentId);
    const autoNarasi = generateDefaultNarasi(
      student?.name || 'Siswa',
      current.highestTPDescription,
      current.lowestTPDescription
    );
    onUpdateGrade({
      ...current,
      narasiRapor: autoNarasi,
      isAIGenerated: false,
    });
    setEditingNarasiStudentId(null);
  };

  // Batch Quick Fill Execution
  const handleExecuteBatchFill = () => {
    const validScore = Math.max(0, Math.min(100, batchFillScore));
    const updatedGrades = grades.map((g) => {
      if (g.subjectId !== selectedSubjectId) return g;
      const isStudentInClass = classStudents.some((s) => s.id === g.studentId);
      if (!isStudentInClass) return g;

      if (batchFillType === 'all_lm') {
        const updatedLM = g.sumatifLM.map((lm) => ({ ...lm, score: validScore }));
        const { rataRataLM, nilaiAkhir, predikat } = calculateGrade(
          updatedLM.map((x) => x.score),
          g.sumatifSAS
        );
        const { highest, lowest } = findExtremeTPs(updatedLM);
        const student = students.find((s) => s.id === g.studentId);
        const narasi = generateDefaultNarasi(student?.name || 'Siswa', highest?.desc, lowest?.desc);

        return {
          ...g,
          sumatifLM: updatedLM,
          rataRataLM,
          nilaiAkhir,
          predikat,
          highestTPId: highest?.id,
          highestTPDescription: highest?.desc,
          lowestTPId: lowest?.id,
          lowestTPDescription: lowest?.desc,
          narasiRapor: g.isAIGenerated ? g.narasiRapor : narasi,
        };
      } else {
        const { rataRataLM, nilaiAkhir, predikat } = calculateGrade(
          g.sumatifLM.map((x) => x.score),
          validScore
        );
        return {
          ...g,
          sumatifSAS: validScore,
          rataRataLM,
          nilaiAkhir,
          predikat,
        };
      }
    });

    onBatchUpdateGrades(updatedGrades);
    setShowBatchFillModal(false);
  };

  // Export current subject grade sheet to CSV
  const handleExportCSV = () => {
    const headers = [
      'Kelas',
      'NISN',
      'Nama Siswa',
      ...currentTPs.map((tp) => `LM_${tp.code}`),
      'Rata_Rata_LM (60%)',
      'SAS (40%)',
      'Nilai_Akhir',
      'Predikat',
      'TP_Tertinggi',
      'TP_Terendah',
      'Narasi_Rapor',
    ];

    const rows = filteredStudents.map((std) => {
      const g = getGradeEntry(std.id);
      const lmValues = currentTPs.map((tp, idx) => g.sumatifLM[idx]?.score ?? 0);
      return [
        `"${std.gradeLevel}"`,
        `"${std.nisn}"`,
        `"${std.name}"`,
        ...lmValues,
        g.rataRataLM,
        g.sumatifSAS,
        g.nilaiAkhir,
        `"${g.predikat}"`,
        `"${g.highestTPDescription || ''}"`,
        `"${g.lowestTPDescription || ''}"`,
        `"${(g.narasiRapor || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nilai_${currentSubject?.name.replace(/\s+/g, '_')}_${activeClassLevel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Subject summary calculations
  const subjectGrades = filteredStudents.map((s) => getGradeEntry(s.id));
  const avgNA = subjectGrades.length > 0
    ? Math.round(subjectGrades.reduce((sum, g) => sum + g.nilaiAkhir, 0) / subjectGrades.length)
    : 0;

  return (
    <div className="space-y-6" id="gradebook-container">
      {/* Top Level Bar: Class Selector & Phase Status */}
      <div className="bg-white rounded-[32px] border-2 border-indigo-100 shadow-xs p-6 space-y-4">
        {/* Class Selection & Title */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">Buku Nilai (Gradebook)</h2>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-[#4F46E5] text-white shadow-xs">
                {activeClassLevel} • {currentFase}
              </span>
              {!isIPASVisible && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Fase A: Tanpa Mapel IPAS
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Rumus Pengolahan Nilai Akhir Kemdikbudristek:{' '}
              <strong className="text-indigo-700 font-black">
                NA = (Rata-rata LM × 60%) + (SAS × 40%)
              </strong>
              {' '}• Edit langsung nilai di tabel untuk auto-hitung instan!
            </p>
          </div>

          {/* Class Switcher Pills */}
          {onSelectClassLevel && (
            isWaliKelas ? (
              <div className="flex items-center gap-2 bg-amber-100/90 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 px-4 py-2 rounded-2xl text-xs font-black shadow-xs">
                <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>{currentUser?.assignedClass || activeClassLevel} (Terkunci Khusus Wali Kelas)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto">
                <span className="text-[11px] font-black text-gray-500 dark:text-slate-400 px-2 uppercase tracking-wider">
                  Pilih Kelas:
                </span>
                {classLevels.map((lvl) => {
                  const isActive = lvl === activeClassLevel;
                  return (
                    <button
                      key={lvl}
                      onClick={() => onSelectClassLevel(lvl)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        isActive
                          ? 'bg-[#4F46E5] text-white shadow-xs scale-[1.03]'
                          : 'text-gray-700 dark:text-slate-300 hover:text-indigo-700 hover:bg-white/80 dark:hover:bg-slate-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Guru Mapel Role Banner (Strictly Locked to Assigned Subject) */}
        {isGuruMapel && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 rounded-2xl border-2 border-teal-300 dark:border-teal-700 text-xs shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-teal-950 dark:text-teal-200 text-xs sm:text-sm">
                    Portal Guru Mapel: {assignedSubject ? assignedSubject.name : currentUser?.assignedSubjectName || 'Mapel Khusus'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Terkunci Khusus Mapel Ini
                  </span>
                </div>
                <p className="text-[11px] text-teal-800/90 dark:text-teal-300/90 font-medium mt-0.5">
                  Anda berwenang menginput nilai sumatif, formatif, dan narasi rapor untuk mapel ini pada semua rombel (Kelas 1 - 6). Akses mapel lain dikunci demi kerahasiaan & integritas data.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-200 bg-white/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-700 flex items-center gap-1.5 shadow-2xs">
                <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Nilai otomatis terbaca di Wali Kelas</span>
              </span>
            </div>
          </div>
        )}

        {/* Informational banner for Wali Kelas when inspecting Guru Mapel's Subject */}
        {isWaliKelas && (currentSubject?.name.toLowerCase().includes('olahraga') || currentSubject?.name.toLowerCase().includes('pjok') || currentSubject?.name.toLowerCase().includes('agama') || currentSubject?.name.toLowerCase().includes('inggris')) && (
          <div className="flex items-center gap-2 p-3 bg-teal-50/90 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 font-medium">
            <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>
              <strong>Integrasi Guru Mapel:</strong> Nilai mata pelajaran <strong>{currentSubject?.name}</strong> diinput langsung oleh Guru Mapel bersangkutan. Semua nilai otomatis tersinkronisasi ke dalam tabel buku nilai ini dan siap dicetak ke e-Rapor kelas Anda.
            </span>
          </div>
        )}

        {/* IPAS Info Notice for Kelas 1 & 2 */}
        {!isIPASVisible && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Perhatian Kurikulum Merdeka:</strong> Untuk <strong>{activeClassLevel} (Fase A)</strong>, mata pelajaran <strong>IPAS</strong> tidak diajarkan dan otomatis tidak diikutsertakan dalam buku nilai serta e-Rapor.
            </span>
          </div>
        )}

        {/* Subject Pills Horizontal Scroll */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                Mata Pelajaran Aktif ({displayedSubjects.length} Mapel):
              </span>
              {isGuruMapel && (
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Terkunci Mapel Anda
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowWeightModal(true)}
                id="btn-open-weights-config"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-black transition-all shadow-xs cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                <span>Bobot ({lmWeight}:{sasWeight}) & KKM ({kkmThreshold})</span>
              </button>
              <button
                type="button"
                onClick={() => downloadExcelTemplate((activeClassLevel || 'Kelas 4') as ClassLevel)}
                title="Unduh Format Excel Sesuai Struktur Aplikasi"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Format Excel</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  exportClassDataToExcel(
                    students,
                    subjects,
                    grades,
                    {},
                    (activeClassLevel || 'Kelas 4') as ClassLevel,
                    { schoolName: 'SD Negeri 01 Merdeka Mandiri' } as any
                  )
                }
                title="Ekspor Nilai Kelas ke Excel (.xlsx)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>Ekspor Excel</span>
              </button>
              <button
                type="button"
                onClick={() => setShowBatchFillModal(true)}
                id="btn-open-batch-fill"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Pengisian Cepat (Batch)</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                id="btn-export-csv"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
            {displayedSubjects.map((subj) => {
              const isSelected = subj.id === selectedSubjectId;
              const isMySubject = isGuruMapel && assignedSubject?.id === subj.id;
              return (
                <button
                  key={subj.id}
                  id={`gradebook-subject-${subj.id}`}
                  onClick={() => setSelectedSubjectId(subj.id)}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected
                      ? isGuruMapel
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20 scale-[1.02]'
                        : 'bg-[#4F46E5] text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{subj.name}</span>
                  {isMySubject && (
                    <span className="text-[9px] bg-teal-800 text-white px-1.5 py-0.5 rounded-full uppercase font-black">
                      Mapel Anda
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      isSelected ? 'bg-yellow-400 text-black' : 'bg-white text-gray-600'
                    }`}
                  >
                    {subj.tujuanPembelajaran.length} TP
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-view Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-gray-200 p-1 rounded-2xl self-start">
          <button
            onClick={() => setActiveTabSubView('sumatif')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTabSubView === 'sumatif'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Asesmen Sumatif (LM & SAS)
          </button>
          <button
            onClick={() => setActiveTabSubView('formatif')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTabSubView === 'formatif'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Asesmen Formatif (Proses Belajar)
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Cari siswa ${activeClassLevel} atau NISN...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border-2 border-gray-200 rounded-full focus:outline-hidden focus:border-indigo-500 shadow-xs font-medium"
          />
        </div>
      </div>

      {/* TP Reference Header Box for Active Subject */}
      {currentSubject && (
        <div className="bg-[#2D3142] text-white rounded-[32px] p-5 sm:p-6 shadow-md border border-slate-700 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-300" />
              <h3 className="font-black text-sm sm:text-base text-white">
                Tujuan Pembelajaran (TP) • {currentSubject.name} ({activeClassLevel})
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-300 font-bold">
              <span>
                Rata-rata Nilai Akhir: <strong className="text-teal-400 text-sm font-black">{avgNA}</strong>
              </span>
              <span>•</span>
              <span>
                Total: <strong>{filteredStudents.length} Siswa</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {currentTPs.map((tp, idx) => (
              <div key={tp.id} className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-teal-300 text-[11px] uppercase tracking-wider">
                    LM {idx + 1} ({tp.code})
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium truncate max-w-[100px]">
                    {tp.lingkupMateri}
                  </span>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed line-clamp-2 font-normal" title={tp.description}>
                  {tp.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grade Table with Inline Editing */}
      <div className="bg-white rounded-[32px] sm:rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {activeTabSubView === 'sumatif' ? (
            <table className="w-full text-left text-xs" id="table-gradebook-sumatif">
              <thead className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-100 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-3 py-3.5 text-center w-10">No</th>
                  <th className="px-4 py-3.5 min-w-[170px]">Nama Siswa ({activeClassLevel})</th>
                  {currentTPs.map((tp, idx) => (
                    <th key={tp.id} className="px-2 py-3.5 text-center min-w-[80px]" title={tp.description}>
                      <div className="text-indigo-900 font-black">LM {idx + 1}</div>
                      <div className="text-[9px] font-normal text-gray-400 truncate max-w-[75px]">{tp.code}</div>
                    </th>
                  ))}
                  <th className="px-2 py-3.5 text-center min-w-[85px] bg-gray-100/70 text-gray-700">
                    <div>Rata LM</div>
                    <div className="text-[9px] font-black text-indigo-600">(60%)</div>
                  </th>
                  <th className="px-2 py-3.5 text-center min-w-[80px] bg-yellow-50 text-yellow-900">
                    <div>SAS</div>
                    <div className="text-[9px] font-black text-yellow-700">(40%)</div>
                  </th>
                  <th className="px-3 py-3.5 text-center min-w-[75px] bg-teal-50 text-teal-900 font-black">
                    <div>NA</div>
                    <div className="text-[9px] font-normal text-teal-700">Rapor</div>
                  </th>
                  <th className="px-2 py-3.5 text-center min-w-[95px]">Predikat</th>
                  <th className="px-4 py-3.5 min-w-[300px]">Capaian Kompetensi (Narasi Rapor)</th>
                  <th className="px-4 py-3.5 text-center min-w-[100px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={currentTPs.length + 7} className="text-center py-12 text-gray-400">
                      <p className="font-bold text-sm">Tidak ada siswa ditemukan di {activeClassLevel}</p>
                      <p className="text-xs mt-1">Silakan impor data siswa melalui menu Impor Dapodik / Excel</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((std, studentIdx) => {
                    const g = getGradeEntry(std.id);
                    return (
                      <tr key={std.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-3 py-3 text-center font-bold text-gray-400">
                          {studentIdx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900 text-xs">{std.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">NISN: {std.nisn}</p>
                        </td>

                        {/* LM Inline Inputs with Keydown Navigation */}
                        {currentTPs.map((tp, tpIdx) => {
                          const scoreVal = g.sumatifLM[tpIdx]?.score ?? 80;
                          const isRecentlySaved = lastSavedId === `${std.id}-lm-${tpIdx}`;
                          return (
                            <td key={tp.id} className="px-2 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                data-row={studentIdx}
                                data-col={`lm-${tpIdx}`}
                                value={scoreVal}
                                onChange={(e) => handleScoreLMChange(std.id, tpIdx, e.target.value)}
                                onKeyDown={(e) => handleCellKeyDown(e, studentIdx, 'lm', tpIdx)}
                                className={`w-14 text-center py-1.5 px-1 text-xs font-black border rounded-xl transition-all ${
                                  isRecentlySaved
                                    ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300'
                                    : 'bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                              />
                            </td>
                          );
                        })}

                        {/* Rata-rata LM (Calculated automatically) */}
                        <td className="px-2 py-3 text-center font-black text-indigo-900 bg-gray-50">
                          {g.rataRataLM}
                        </td>

                        {/* SAS Inline Input with Keydown Navigation */}
                        <td className="px-2 py-3 text-center bg-yellow-50/50">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            data-row={studentIdx}
                            data-col="sas-0"
                            value={g.sumatifSAS}
                            onChange={(e) => handleScoreSASChange(std.id, e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, studentIdx, 'sas', 0)}
                            className="w-14 text-center py-1.5 px-1 text-xs font-black bg-white border border-yellow-300 text-yellow-900 rounded-xl focus:ring-2 focus:ring-yellow-400"
                          />
                        </td>

                        {/* Nilai Akhir (NA) */}
                        <td className="px-3 py-3 text-center bg-teal-50/60 font-black text-sm text-teal-900">
                          {g.nilaiAkhir}
                        </td>

                        {/* Predikat */}
                        <td className="px-2 py-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              g.predikat === 'Sangat Baik'
                                ? 'bg-teal-100 text-teal-800'
                                : g.predikat === 'Baik'
                                ? 'bg-indigo-100 text-indigo-800'
                                : g.predikat === 'Cukup'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-pink-100 text-pink-800'
                            }`}
                          >
                            {g.predikat}
                          </span>
                        </td>

                        {/* Narasi Rapor with Direct Inline Edit Popover / Modal Trigger */}
                        <td className="px-4 py-3 text-gray-700 text-xs">
                          {editingNarasiStudentId === std.id ? (
                            <div className="space-y-2 bg-indigo-50/70 p-2.5 rounded-2xl border border-indigo-200">
                              <textarea
                                value={tempNarasiText}
                                onChange={(e) => setTempNarasiText(e.target.value)}
                                rows={3}
                                className="w-full p-2 text-xs font-medium bg-white border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                              />
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleResetInlineNarasi(std.id)}
                                  className="text-[10px] font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Otomatis</span>
                                </button>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingNarasiStudentId(null)}
                                    className="p-1 rounded-lg text-gray-500 hover:bg-gray-200"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveInlineNarasi(std.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Simpan</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingNarasiStudentId(std.id);
                                setTempNarasiText(g.narasiRapor);
                              }}
                              className="group cursor-pointer hover:bg-white p-1.5 rounded-xl border border-transparent hover:border-gray-200 transition-all relative"
                              title="Klik untuk edit narasi rapor langsung"
                            >
                              <p className="line-clamp-2 leading-relaxed text-[11px] font-medium text-gray-800">
                                {g.narasiRapor || (
                                  <span className="text-gray-400 italic">Klik untuk mengisi narasi...</span>
                                )}
                              </p>
                              <Edit2 className="w-3 h-3 text-gray-400 group-hover:text-indigo-600 absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-center">
                          <button
                            id={`btn-open-ai-gen-${std.id}`}
                            onClick={() => onOpenAIGenerator(std.id, selectedSubjectId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs border border-indigo-200 transition-all shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>AI Narasi</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* Formatif Inline Table */
            <table className="w-full text-left text-xs" id="table-gradebook-formatif">
              <thead className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-100 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-3 py-3.5 text-center w-10">No</th>
                  <th className="px-4 py-3.5 min-w-[180px]">Nama Siswa ({activeClassLevel})</th>
                  <th className="px-3 py-3.5 text-center min-w-[95px]">Formatif 1 (Refleksi)</th>
                  <th className="px-3 py-3.5 text-center min-w-[95px]">Formatif 2 (Tugas/LKPD)</th>
                  <th className="px-3 py-3.5 text-center min-w-[95px]">Formatif 3 (Observasi)</th>
                  <th className="px-4 py-3.5 min-w-[280px]">Catatan Perkembangan Formatif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.map((std, idx) => {
                  const g = getGradeEntry(std.id);
                  const formatif = g.formatifScores || [85, 85, 85];
                  return (
                    <tr key={std.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-3 py-3 text-center font-bold text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{std.name}</td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formatif[0] ?? 85}
                          onChange={(e) => handleFormatifChange(std.id, 0, e.target.value)}
                          className="w-16 text-center py-1.5 text-xs border border-gray-200 rounded-xl font-bold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formatif[1] ?? 85}
                          onChange={(e) => handleFormatifChange(std.id, 1, e.target.value)}
                          className="w-16 text-center py-1.5 text-xs border border-gray-200 rounded-xl font-bold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formatif[2] ?? 85}
                          onChange={(e) => handleFormatifChange(std.id, 2, e.target.value)}
                          className="w-16 text-center py-1.5 text-xs border border-gray-200 rounded-xl font-bold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <input
                          type="text"
                          defaultValue={g.formatifNotes || 'Menunjukkan kemajuan yang konsisten dan aktif berdiskusi'}
                          onBlur={(e) => {
                            onUpdateGrade({
                              ...g,
                              formatifNotes: e.target.value,
                            });
                          }}
                          className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Batch Quick Fill Modal */}
      {showBatchFillModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] border-2 border-indigo-100 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-base">Pengisian Nilai Cepat (Batch Fill)</h3>
              <button
                onClick={() => setShowBatchFillModal(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Isi nilai sekaligus untuk seluruh siswa <strong>{activeClassLevel}</strong> pada mata pelajaran <strong>{currentSubject?.name}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Target Kolom Penilaian:</label>
                <select
                  value={batchFillType}
                  onChange={(e) => setBatchFillType(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                >
                  <option value="all_lm">Semua Lingkup Materi (LM 1 s/d selesai)</option>
                  <option value="sas">Sumatif Akhir Semester (SAS)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nilai yang Diterapkan (0 - 100):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={batchFillScore}
                  onChange={(e) => setBatchFillScore(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-center text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBatchFillModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteBatchFill}
                className="px-5 py-2 rounded-xl text-xs font-black bg-[#4F46E5] hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
              >
                Terapkan ke Semua Siswa
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Dynamic Weights & KKM Configuration Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] border-2 border-indigo-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base">Konfigurasi Bobot Nilai & KKM</h3>
                  <p className="text-xs text-gray-500 font-medium">Pengolahan Nilai Akhir (NA) Kurikulum Merdeka</p>
                </div>
              </div>
              <button
                onClick={() => setShowWeightModal(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1">
                <span className="font-bold text-indigo-900 block">Rumus Perhitungan Nilai Akhir:</span>
                <p className="font-mono text-xs font-black text-indigo-700">
                  NA = (Rata-rata LM × {lmWeight}%) + (SAS × {sasWeight}%)
                </p>
                <span className="text-[11px] text-gray-600 block pt-1">
                  Total Bobot: <strong>{lmWeight + sasWeight}%</strong> {lmWeight + sasWeight !== 100 && <span className="text-rose-600 font-bold">(Peringatan: Total harus 100%)</span>}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Bobot Lingkup Materi (LM %):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={lmWeight}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setLmWeight(val);
                      setSasWeight(Math.max(0, 100 - val));
                    }}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-center text-sm text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Bobot Sumatif Akhir (SAS %):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={sasWeight}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setSasWeight(val);
                      setLmWeight(Math.max(0, 100 - val));
                    }}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-center text-sm text-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Kriteria Ketercapaian / Batas KKM (KKTP):</label>
                <input
                  type="number"
                  min="50"
                  max="90"
                  value={kkmThreshold}
                  onChange={(e) => setKkmThreshold(Number(e.target.value) || 75)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-center text-sm text-gray-900"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Nilai di bawah batas KKM akan mendapat predikat <em>Perlu Bimbingan</em> dan narasi remedial otomatis.
                </p>
              </div>

              {/* Preset Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-500 block">Pilihan Preset Cepat:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Standar 60 : 40', lm: 60, sas: 40 },
                    { label: 'Proses Dominan 70 : 30', lm: 70, sas: 30 },
                    { label: 'Seimbang 50 : 50', lm: 50, sas: 50 },
                    { label: 'Hanya Portofolio 100 : 0', lm: 100, sas: 0 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setLmWeight(preset.lm);
                        setSasWeight(preset.sas);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowWeightModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleSaveWeights}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#4F46E5] hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
              >
                Simpan & Hitung Ulang Seluruh Nilai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
