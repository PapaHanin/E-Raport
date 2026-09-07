import React, { useState, useEffect, useMemo } from 'react';
import { MataPelajaran, NilaiSiswaMapel, SchoolProfile, Student, TujuanPembelajaran, ClassLevel, getFaseByClass, isIPASActiveForClass, TeacherAccount } from '../types';
import { findExtremeTPs, generateDefaultNarasi } from '../utils/calculator';
import { getSubjectsForClass } from '../data/initialData';
import {
  Sparkles,
  BookOpen,
  User,
  CheckCircle2,
  Copy,
  Check,
  RotateCw,
  Sliders,
  Layers,
  Code,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  FileText,
  GraduationCap,
  Info,
  Lock,
} from 'lucide-react';

interface AINarasiViewProps {
  students: Student[];
  subjects: MataPelajaran[];
  grades: NilaiSiswaMapel[];
  schoolProfile: SchoolProfile;
  activeClassLevel?: ClassLevel;
  currentUser?: TeacherAccount | null;
  onSelectClassLevel?: (classLevel: ClassLevel) => void;
  initialStudentId?: string;
  initialSubjectId?: string;
  onUpdateGrade: (updatedGrade: NilaiSiswaMapel) => void;
  onBatchUpdateGrades: (updatedGrades: NilaiSiswaMapel[]) => void;
}

export const AINarasiView: React.FC<AINarasiViewProps> = ({
  students,
  subjects,
  grades,
  schoolProfile,
  activeClassLevel = 'Kelas 4',
  currentUser,
  onSelectClassLevel,
  initialStudentId,
  initialSubjectId,
  onUpdateGrade,
  onBatchUpdateGrades,
}) => {
  const classLevels: ClassLevel[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
  const currentFase = getFaseByClass(activeClassLevel);
  const isIPASVisible = isIPASActiveForClass(activeClassLevel);

  // Role checks
  const isGuruMapel = currentUser?.role === 'guru_mapel';
  const isWaliKelas = currentUser?.role === 'guru_wali_kelas';

  // Filter students by active class
  const classStudents = useMemo(() => {
    return students.filter(
      (std) => std.gradeLevel === activeClassLevel || (!std.gradeLevel && activeClassLevel === 'Kelas 4')
    );
  }, [students, activeClassLevel]);

  // Filter subjects by active class (IPAS excluded for Kelas 1 & 2)
  const activeClassSubjects = useMemo(() => {
    return getSubjectsForClass(subjects, activeClassLevel);
  }, [subjects, activeClassLevel]);

  // Find assigned subject for Guru Mapel
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

  // Subjects displayed in the selector: LOCKED for Guru Mapel
  const displayedSubjects = useMemo(() => {
    if (isGuruMapel) {
      return assignedSubject ? [assignedSubject] : [];
    }
    return activeClassSubjects;
  }, [isGuruMapel, assignedSubject, activeClassSubjects]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || classStudents[0]?.id || students[0]?.id || 'std-1'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    if (isGuruMapel && assignedSubject) return assignedSubject.id;
    return initialSubjectId || activeClassSubjects[0]?.id || 'mapel-1';
  });

  // Keep selected values valid on class level switch
  useEffect(() => {
    if (classStudents.length > 0 && !classStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(classStudents[0].id);
    }
  }, [activeClassLevel, classStudents, selectedStudentId]);

  useEffect(() => {
    if (isGuruMapel && assignedSubject) {
      setSelectedSubjectId(assignedSubject.id);
      return;
    }
    if (displayedSubjects.length > 0 && !displayedSubjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(displayedSubjects[0].id);
    }
  }, [activeClassLevel, isGuruMapel, assignedSubject, displayedSubjects, selectedSubjectId]);

  const [selectedTone, setSelectedTone] = useState<'standar' | 'hangat' | 'ringkas'>('standar');
  const [customTeacherNotes, setCustomTeacherNotes] = useState<string>('');
  
  // High & Low TP selections
  const [highestTPText, setHighestTPText] = useState<string>('');
  const [lowestTPText, setLowestTPText] = useState<string>('');
  
  // Generator output states
  const [generatedNarasi, setGeneratedNarasi] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationSource, setGenerationSource] = useState<string>('');
  const [showPromptInspector, setShowPromptInspector] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Batch Generation State
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchSubjectId, setBatchSubjectId] = useState<string>(selectedSubjectId);
  const [batchResults, setBatchResults] = useState<{ studentId: string; studentName: string; narasi: string }[]>([]);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const currentTPs = currentSubject?.tujuanPembelajaran || [];

  // Find active grade entry
  const currentGradeEntry = grades.find(
    (g) => g.studentId === selectedStudentId && g.subjectId === selectedSubjectId
  );

  // Synchronize TP descriptions when student or subject changes
  useEffect(() => {
    if (currentGradeEntry) {
      const { highest, lowest } = findExtremeTPs(currentGradeEntry.sumatifLM || []);
      const defaultHigh = highest?.desc || currentTPs[0]?.description || 'Memahami konsep dasar materi';
      const defaultLow = lowest?.desc && lowest.desc !== defaultHigh 
        ? lowest.desc 
        : currentTPs[currentTPs.length - 1]?.description || 'Penerapan latihan lanjutan';

      setHighestTPText(currentGradeEntry.highestTPDescription || defaultHigh);
      setLowestTPText(currentGradeEntry.lowestTPDescription || defaultLow);
      setGeneratedNarasi(currentGradeEntry.narasiRapor || generateDefaultNarasi(currentStudent?.name || '', defaultHigh, defaultLow));
      setGenerationSource(currentGradeEntry.isAIGenerated ? 'gemini_ai' : 'rule_engine');
    }
  }, [selectedStudentId, selectedSubjectId, currentGradeEntry]);

  // Trigger Single AI Generation
  const handleGenerateAI = async () => {
    if (!currentStudent || !currentSubject) return;

    setIsGenerating(true);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/gemini/generate-narasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentName: currentStudent.name,
          gradeLevel: `${currentStudent.gradeLevel} SD (${currentStudent.fase})`,
          subjectName: currentSubject.name,
          highestTP: highestTPText,
          lowestTP: lowestTPText,
          customNotes: customTeacherNotes,
          tone: selectedTone,
        }),
      });

      const data = await response.json();
      if (data.narasi) {
        setGeneratedNarasi(data.narasi);
        setGenerationSource(data.source || 'gemini_ai');
      }
    } catch (err) {
      console.error('AI Generation fetch error:', err);
      // Fallback
      const fallback = generateDefaultNarasi(currentStudent?.name || 'Siswa', highestTPText, lowestTPText);
      setGeneratedNarasi(fallback);
      setGenerationSource('rule_engine_fallback');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated narrative to student's grade record
  const handleSaveNarasi = () => {
    if (!currentGradeEntry) return;

    const updated: NilaiSiswaMapel = {
      ...currentGradeEntry,
      narasiRapor: generatedNarasi,
      isAIGenerated: true,
      highestTPDescription: highestTPText,
      lowestTPDescription: lowestTPText,
      lastGeneratedAt: new Date().toISOString(),
    };

    onUpdateGrade(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(generatedNarasi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Start Batch Generation for all students in selected subject
  const handleStartBatchGeneration = async () => {
    const targetSubj = displayedSubjects.find((s) => s.id === batchSubjectId) || displayedSubjects[0] || currentSubject;
    setIsBatchRunning(true);
    setBatchProgress(10);
    setBatchResults([]);

    const itemsToGenerate = classStudents.map((std) => {
      const g = grades.find((gr) => gr.studentId === std.id && gr.subjectId === targetSubj.id);
      const { highest, lowest } = findExtremeTPs(g?.sumatifLM || []);
      return {
        studentId: std.id,
        studentName: std.name,
        highestTP: highest?.desc || targetSubj.tujuanPembelajaran[0]?.description || 'Materi utama',
        lowestTP: lowest?.desc || targetSubj.tujuanPembelajaran[targetSubj.tujuanPembelajaran.length - 1]?.description || 'Latihan lanjutan',
      };
    });

    try {
      setBatchProgress(40);
      const response = await fetch('/api/gemini/batch-generate-narasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToGenerate,
          gradeLevel: `${activeClassLevel} SD`,
          subjectName: targetSubj.name,
          tone: selectedTone,
        }),
      });

      setBatchProgress(80);
      const data = await response.json();
      const resultsWithNames = (data.results || []).map((res: any) => {
        const std = classStudents.find((s) => s.id === res.studentId);
        return {
          studentId: res.studentId,
          studentName: std?.name || 'Siswa',
          narasi: res.narasi,
        };
      });

      setBatchResults(resultsWithNames);
      setBatchProgress(100);
    } catch (err) {
      console.error('Batch generation error:', err);
      // Local fallback for all students
      const fallbackResults = itemsToGenerate.map((item) => ({
        studentId: item.studentId,
        studentName: item.studentName,
        narasi: generateDefaultNarasi(item.studentName, item.highestTP, item.lowestTP),
      }));
      setBatchResults(fallbackResults);
      setBatchProgress(100);
    } finally {
      setIsBatchRunning(false);
    }
  };

  // Apply all batch results to state
  const handleApplyBatchResults = () => {
    const targetSubjId = batchSubjectId;
    const updatedGrades = grades.map((g) => {
      if (g.subjectId !== targetSubjId) return g;
      const match = batchResults.find((r) => r.studentId === g.studentId);
      if (match) {
        return {
          ...g,
          narasiRapor: match.narasi,
          isAIGenerated: true,
          lastGeneratedAt: new Date().toISOString(),
        };
      }
      return g;
    });

    onBatchUpdateGrades(updatedGrades);
    setShowBatchModal(false);
    alert(`Berhasil menyimpan ${batchResults.length} narasi rapor AI untuk ${subjects.find(s => s.id === targetSubjId)?.name}!`);
  };

  return (
    <div className="space-y-6" id="ai-narasi-container">
      {/* Top Banner with System Prompt info from PDF */}
      <div className="bg-[#4F46E5] text-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xl shadow-indigo-500/20 border-2 border-indigo-400/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-black text-xs font-black uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>Prompt Sistem AI Narasi Rapor Otomatis</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AI Generator Narasi Rapor Kurikulum Merdeka
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm font-medium leading-relaxed">
              Menghasilkan deskripsi capaian pembelajaran 2 kalimat positif, santun, dan sesuai format baku Kemdikbudristek berdasarkan analisis otomatis TP Tertinggi & Terendah.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-open-batch-modal"
              onClick={() => {
                setBatchSubjectId(selectedSubjectId);
                setShowBatchModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs sm:text-sm transition-all shadow-md shadow-yellow-500/20 hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4 text-black" />
              <span>Generate Massal (1-Click)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guru Mapel Portal Banner */}
      {isGuruMapel && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border-2 border-teal-300 dark:border-teal-700 text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-teal-950 dark:text-teal-200 text-xs sm:text-sm">
                  Portal AI Narasi Guru Mapel: {assignedSubject ? assignedSubject.name : currentUser?.assignedSubjectName || 'Mapel Khusus'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Terkunci Mapel Ini
                </span>
              </div>
              <p className="text-[11px] text-teal-800/90 dark:text-teal-300/90 font-medium mt-0.5">
                Anda hanya dapat menyusun dan meng-generate narasi AI untuk mata pelajaran {assignedSubject?.name || currentUser?.assignedSubjectName}. Narasi yang Anda simpan otomatis langsung terbaca oleh Wali Kelas dan tercetak di e-Rapor.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-teal-800 dark:text-teal-200 bg-white/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-700 flex items-center gap-1.5 shadow-2xs">
              <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Otomatis Tersinkron ke Rapor</span>
            </span>
          </div>
        </div>
      )}

      {/* Main 2-Column Generator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Data & TP Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-[32px] border-2 border-indigo-100 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Parameter Input Siswa & Nilai</span>
              </h3>
              <span className="text-[11px] font-black text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Nilai Akhir: {currentGradeEntry?.nilaiAkhir ?? 85} ({currentGradeEntry?.predikat ?? 'Baik'})
              </span>
            </div>

            {/* Select Student */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Pilih Peserta Didik ({activeClassLevel})
                </label>
                {onSelectClassLevel && (
                  isWaliKelas ? (
                    <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      {currentUser?.assignedClass || activeClassLevel} (Terkunci)
                    </span>
                  ) : (
                    <select
                      value={activeClassLevel}
                      onChange={(e) => onSelectClassLevel(e.target.value as ClassLevel)}
                      className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl px-2 py-0.5"
                    >
                      {classLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  )
                )}
              </div>
              <select
                id="select-student-ai"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={classStudents.length === 0}
                className="w-full text-xs font-bold text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-2xl p-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-50"
              >
                {classStudents.length === 0 ? (
                  <option value="">(Belum ada siswa di {activeClassLevel} - Sinkronkan dari Ogomojolo)</option>
                ) : (
                  classStudents.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.name} (NISN: {std.nisn})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Select Subject */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Mata Pelajaran {isGuruMapel ? '(Terkunci)' : `(${displayedSubjects.length} Mapel Aktif)`}
                </label>
                {isGuruMapel && (
                  <span className="text-[10px] font-black bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Terkunci Mapel Anda
                  </span>
                )}
              </div>
              <select
                id="select-subject-ai"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={isGuruMapel}
                className={`w-full text-xs font-bold rounded-2xl p-3 border-2 transition-all ${
                  isGuruMapel
                    ? 'text-teal-900 bg-teal-50 border-teal-300 cursor-not-allowed'
                    : 'text-gray-900 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white'
                }`}
              >
                {displayedSubjects.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name} ({subj.tujuanPembelajaran.length} TP)
                  </option>
                ))}
              </select>
            </div>

            {/* Informative banner for Wali Kelas when inspecting Guru Mapel's Subject */}
            {isWaliKelas && (currentSubject?.name.toLowerCase().includes('olahraga') || currentSubject?.name.toLowerCase().includes('pjok') || currentSubject?.name.toLowerCase().includes('agama') || currentSubject?.name.toLowerCase().includes('inggris')) && (
              <div className="flex items-center gap-2 p-2.5 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 text-[11px] text-teal-900 dark:text-teal-200 font-medium">
                <Info className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  Narasi mapel <strong>{currentSubject?.name}</strong> ini dapat diinput/di-generate langsung oleh Guru Mapel bersangkutan.
                </span>
              </div>
            )}

            {/* Highest TP Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-teal-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Nilai Tertinggi (TP Tercapai Optimal)</span>
                </label>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Paling Dikuasai</span>
              </div>
              <textarea
                id="input-highest-tp"
                rows={2}
                value={highestTPText}
                onChange={(e) => setHighestTPText(e.target.value)}
                placeholder="Deskripsi TP yang paling dikuasai..."
                className="w-full text-xs p-3 bg-teal-50/50 border border-teal-200 rounded-2xl text-teal-950 font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
              <div className="flex flex-wrap gap-1.5">
                {currentTPs.map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => setHighestTPText(tp.description)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 hover:bg-teal-100 text-gray-700 hover:text-teal-900 border border-gray-200 transition-colors"
                  >
                    Set: {tp.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Lowest TP Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nilai Terendah (Perlu Bimbingan Lanjutan)</span>
                </label>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Aspek Peningkatan</span>
              </div>
              <textarea
                id="input-lowest-tp"
                rows={2}
                value={lowestTPText}
                onChange={(e) => setLowestTPText(e.target.value)}
                placeholder="Deskripsi TP yang membutuhkan bimbingan..."
                className="w-full text-xs p-3 bg-amber-50/50 border border-amber-200 rounded-2xl text-amber-950 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
              <div className="flex flex-wrap gap-1.5">
                {currentTPs.map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => setLowestTPText(tp.description)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 border border-gray-200 transition-colors"
                  >
                    Set: {tp.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone & Style Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Gaya Narasi AI
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTone('standar')}
                  className={`py-2 px-2 rounded-2xl text-xs font-black border-2 transition-all ${
                    selectedTone === 'standar'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-500 shadow-xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Standar
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTone('hangat')}
                  className={`py-2 px-2 rounded-2xl text-xs font-black border-2 transition-all ${
                    selectedTone === 'hangat'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-500 shadow-xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Hangat & Motivatif
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTone('ringkas')}
                  className={`py-2 px-2 rounded-2xl text-xs font-black border-2 transition-all ${
                    selectedTone === 'ringkas'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-500 shadow-xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Ringkas & Padat
                </button>
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Catatan Tambahan Guru (Opsional)
              </label>
              <input
                type="text"
                value={customTeacherNotes}
                onChange={(e) => setCustomTeacherNotes(e.target.value)}
                placeholder="Contoh: Sangat aktif saat praktikum kelompok..."
                className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-medium focus:bg-white"
              />
            </div>

            {/* Action Button */}
            <button
              id="btn-generate-ai-single"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-2xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all hover:scale-[1.01]"
            >
              {isGenerating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Gemini AI Sedang Menyusun Narasi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Generate Narasi dengan Gemini AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Generated Output, Verification & Prompt Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Output Box */}
          <div className="bg-white rounded-[32px] border-2 border-indigo-100 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="font-black text-gray-900 text-sm">
                  Hasil Narasi Deskripsi Rapor
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full font-black ${
                  generationSource === 'gemini_ai'
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{generationSource === 'gemini_ai' ? 'Disusun oleh Gemini AI' : 'Generator Standar Kemdikbud'}</span>
                </span>
              </div>
            </div>

            {/* Editable Output Textarea */}
            <div className="relative">
              <textarea
                id="textarea-generated-narasi"
                rows={5}
                value={generatedNarasi}
                onChange={(e) => setGeneratedNarasi(e.target.value)}
                placeholder="Hasil narasi deskripsi rapor akan tampil di sini..."
                className="w-full text-xs sm:text-sm leading-relaxed p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-gray-900 font-sans focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner font-medium"
              />
              <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1 px-1 font-medium">
                <span>{generatedNarasi.split('.').filter(s => s.trim().length > 0).length} Kalimat • {generatedNarasi.length} Karakter</span>
                <span className="text-teal-700 font-bold">✓ Sesuai Regulasi Kemdikbudristek</span>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPromptInspector(!showPromptInspector)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-800 text-xs font-bold hover:bg-indigo-100 transition-colors shadow-xs"
                >
                  <Code className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{showPromptInspector ? 'Tutup Format Prompt' : 'Lihat Format Prompt PDF'}</span>
                </button>
              </div>

              <button
                id="btn-save-narasi-to-grade"
                type="button"
                onClick={handleSaveNarasi}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02]"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                    <span>Tersimpan di e-Rapor!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan ke Rapor Siswa</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Prompt Inspector from PDF Page 4 */}
          {showPromptInspector && (
            <div className="bg-[#2D3142] text-slate-200 rounded-[32px] p-6 border border-slate-700 shadow-md space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="font-black text-teal-300 uppercase tracking-wider text-[11px]">
                  Struktur Prompt Sistem AI Rapor (Modul Kurikulum Merdeka Halaman 4)
                </span>
                <span className="text-[10px] text-gray-400 font-bold bg-slate-800 px-2 py-0.5 rounded-full">Gemini 2.5 Flash</span>
              </div>

              <div className="space-y-2 text-[11px] leading-relaxed">
                <div>
                  <span className="text-teal-300 font-bold">SYSTEM_ROLE:</span>{' '}
                  <span className="text-gray-300">
                    Anda adalah Asisten Guru Senior Sekolah Dasar yang ahli dalam menyusun deskripsi rapor naratif berbasis Kurikulum Merdeka.
                  </span>
                </div>

                <div>
                  <span className="text-teal-300 font-bold">INPUT_DATA:</span>
                  <div className="pl-3 border-l-2 border-slate-600 text-gray-300 space-y-0.5 mt-0.5">
                    <p>• Nama Siswa: "{currentStudent.name}" | Kelas: "{currentStudent.gradeLevel} SD"</p>
                    <p>• Mata Pelajaran: "{currentSubject.name}"</p>
                    <p>• Nilai Tertinggi (TP Tercapai): "{highestTPText}"</p>
                    <p>• Nilai Terendah (Perlu Bimbingan): "{lowestTPText}"</p>
                  </div>
                </div>

                <div>
                  <span className="text-teal-300 font-bold">INSTRUCTION:</span>{' '}
                  <span className="text-gray-300">
                    Buatlah deskripsi rapor sumatif naratif yang memotivasi dalam 2 kalimat positif, menggunakan bahasa Indonesia baku, santun, dan sesuai format Kemdikbudristek.
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                  <span className="text-teal-400 font-bold">OUTPUT_GENERATOR:</span>{' '}
                  <span className="text-teal-200 italic">
                    "{generatedNarasi}"
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Guidance Box */}
          <div className="bg-white border-2 border-indigo-100 rounded-[32px] p-5 text-xs text-gray-600 space-y-2 shadow-xs">
            <h4 className="font-black text-gray-800 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ketentuan Deskripsi Capaian Rapor Kurikulum Merdeka:</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-gray-600 leading-relaxed font-medium">
              <li>Deskripsi tidak lagi menggunakan ranking atau predikat angka kaku murni melainkan narasi kualitatif apresiatif.</li>
              <li>Kalimat pertama menegaskan kompetensi capaian pembelajaran yang paling dikuasai (TP Tertinggi).</li>
              <li>Kalimat kedua memberikan motivasi dan poin materi yang perlu penguatan/bimbingan lanjutan di semester depan.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Batch Generation Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-violet-300" />
                <div>
                  <h3 className="font-bold text-base">Generate Narasi AI Massal (1-Click)</h3>
                  <p className="text-xs text-violet-200">Menyusun narasi seluruh siswa dalam 1 mata pelajaran</p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Pilih Mata Pelajaran Target:
                  </label>
                  {isGuruMapel && (
                    <span className="text-[10px] font-black bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Terkunci Mapel Anda
                    </span>
                  )}
                </div>
                <select
                  value={batchSubjectId}
                  onChange={(e) => setBatchSubjectId(e.target.value)}
                  disabled={isGuruMapel}
                  className={`w-full text-xs font-bold p-2.5 border rounded-lg ${
                    isGuruMapel
                      ? 'bg-teal-50 border-teal-300 text-teal-900 cursor-not-allowed'
                      : 'border-slate-300 bg-slate-50 focus:bg-white'
                  }`}
                >
                  {displayedSubjects.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name} ({classStudents.length} Siswa {activeClassLevel})
                    </option>
                  ))}
                </select>
              </div>

              {isBatchRunning ? (
                <div className="text-center py-8 space-y-3">
                  <RotateCw className="w-8 h-8 text-violet-600 animate-spin mx-auto" />
                  <p className="font-bold text-sm text-slate-800">
                    Gemini AI sedang menyusun narasi untuk {classStudents.length} siswa ({activeClassLevel})...
                  </p>
                  <div className="w-full max-w-md mx-auto bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-violet-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${batchProgress}%` }}
                    />
                  </div>
                </div>
              ) : batchResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-bold text-emerald-700">✓ Selesai ({batchResults.length} Siswa)</span>
                    <span>Tinjau hasil sebelum menerapkan</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {batchResults.map((res) => (
                      <div key={res.studentId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                        <span className="font-bold text-slate-900">{res.studentName}</span>
                        <p className="text-slate-700 text-[11px] leading-relaxed">{res.narasi}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-xs text-violet-900 space-y-2">
                  <p className="font-bold">Informasi Batch AI:</p>
                  <p>Sistem akan menganalisis capaian nilai masing-masing siswa dan menyusun deskripsi narasi 2 kalimat secara otomatis.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Tutup
              </button>

              {batchResults.length > 0 ? (
                <button
                  type="button"
                  onClick={handleApplyBatchResults}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                >
                  Terapkan Semua ke Buku Nilai & Rapor
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isBatchRunning}
                  onClick={handleStartBatchGeneration}
                  className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Mulai Generate Massal</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
