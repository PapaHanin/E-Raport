import React, { useState, useMemo } from 'react';
import {
  Student,
  MataPelajaran,
  NilaiSiswaMapel,
  RaporSiswaDetail,
  ClassLevel,
  SchoolProfile,
} from '../types';
import { initialSchoolProfile, getSubjectsForClass } from '../data/initialData';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  GraduationCap,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  X,
  Layers,
  FileCheck,
  UserCheck,
  Check,
  Calculator,
  Search,
} from 'lucide-react';
import {
  downloadGradeTemplateExcel,
  exportClassDataToExcel,
} from '../utils/excelService';
import * as XLSX from 'xlsx';

interface DapodikSyncViewProps {
  students: Student[];
  subjects?: MataPelajaran[];
  grades?: NilaiSiswaMapel[];
  raporDetails?: Record<string, RaporSiswaDetail>;
  schoolProfile?: SchoolProfile;
  activeClassLevel?: ClassLevel;
  onSelectClassLevel?: (classLevel: ClassLevel) => void;
  onImportStudents?: (newStudents: Student[]) => void;
  onUpdateGrades?: (newGrades: NilaiSiswaMapel[]) => void;
  onNavigateToTarikData?: () => void;
}

interface GradeColumnMapping {
  nisn: number;
  studentName: number;
  subjectName: number;
  lm1: number;
  lm2: number;
  lm3: number;
  lm4: number;
  sas: number;
  nilaiAkhir: number;
  narasi: number;
}

interface GradeRowValidationItem {
  rowNumber: number;
  studentId: string;
  studentName: string;
  nisn: string;
  subjectId: string;
  subjectName: string;
  rataRataLM: number;
  sumatifSAS: number;
  nilaiAkhir: number;
  predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
  narasiRapor: string;
  status: 'valid' | 'warning' | 'error';
  messages: string[];
}

export const DapodikSyncView: React.FC<DapodikSyncViewProps> = ({
  students,
  subjects = [],
  grades = [],
  raporDetails = {},
  schoolProfile = initialSchoolProfile,
  activeClassLevel = 'Kelas 4',
  onSelectClassLevel,
  onImportStudents,
  onUpdateGrades,
  onNavigateToTarikData,
}) => {
  const classLevels: ClassLevel[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];

  // Inspection & Mapping State
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<GradeColumnMapping | null>(null);
  const [validationItems, setValidationItems] = useState<GradeRowValidationItem[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // UI state
  const [filterTab, setFilterTab] = useState<'all' | 'error' | 'warning' | 'valid'>('all');
  const [showMappingPanel, setShowMappingPanel] = useState<boolean>(true);
  const [csvText, setCsvText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [searchTableQuery, setSearchTableQuery] = useState<string>('');

  // Active class students & subjects
  const classStudents = useMemo(() => {
    return students.filter(
      (s) => s.gradeLevel === activeClassLevel || (!s.gradeLevel && activeClassLevel === 'Kelas 4')
    );
  }, [students, activeClassLevel]);

  const classSubjects = useMemo(() => {
    return getSubjectsForClass(subjects, activeClassLevel);
  }, [subjects, activeClassLevel]);

  // Detect column mapping for grades
  const detectGradeColumnMapping = (headerList: string[]): GradeColumnMapping => {
    const norm = headerList.map((h) => String(h || '').trim().toLowerCase());
    const findCol = (keywords: string[]): number => {
      return norm.findIndex((h) => keywords.some((k) => h.includes(k)));
    };

    return {
      nisn: findCol(['nisn', 'no nisn', 'nomor induk']),
      studentName: findCol(['nama siswa', 'nama murid', 'nama lengkap', 'nama peserta', 'nama']),
      subjectName: findCol(['mata pelajaran', 'mapel', 'pelajaran', 'subject']),
      lm1: findCol(['lm 1', 'lm1', 'tp 1', 'tp1', 'formatif 1', 'lingkup materi 1']),
      lm2: findCol(['lm 2', 'lm2', 'tp 2', 'tp2', 'formatif 2', 'lingkup materi 2']),
      lm3: findCol(['lm 3', 'lm3', 'tp 3', 'tp3', 'formatif 3', 'lingkup materi 3']),
      lm4: findCol(['lm 4', 'lm4', 'tp 4', 'tp4', 'formatif 4', 'lingkup materi 4']),
      sas: findCol(['sas', 'sumatif akhir semester', 'pas', 'uas', 'ujian semester', 'nilai sas']),
      nilaiAkhir: findCol(['nilai akhir', 'na', 'nilai rapor', 'rapor']),
      narasi: findCol(['catatan', 'narasi', 'capaian', 'deskripsi', 'keterangan']),
    };
  };

  // Helper to match subject name
  const resolveSubject = (rawSubject: string): MataPelajaran | undefined => {
    if (!rawSubject) return classSubjects[0];
    const clean = rawSubject.trim().toLowerCase();
    // Direct or includes match
    return (
      classSubjects.find((s) => s.name.toLowerCase() === clean) ||
      classSubjects.find((s) => s.name.toLowerCase().includes(clean) || clean.includes(s.name.toLowerCase())) ||
      classSubjects[0]
    );
  };

  // Helper to match student by NISN or name
  const resolveStudent = (rawNisn: string, rawName: string): Student | undefined => {
    const cleanNisn = String(rawNisn || '').trim();
    const cleanName = String(rawName || '').trim().toLowerCase();

    if (cleanNisn) {
      const matchByNisn = students.find((s) => s.nisn && s.nisn.trim() === cleanNisn);
      if (matchByNisn) return matchByNisn;
    }

    if (cleanName) {
      const matchByName = students.find((s) => s.name.trim().toLowerCase() === cleanName);
      if (matchByName) return matchByName;
      const fuzzyByName = students.find((s) => s.name.trim().toLowerCase().includes(cleanName) || cleanName.includes(s.name.trim().toLowerCase()));
      if (fuzzyByName) return fuzzyByName;
    }

    return undefined;
  };

  // Validate and transform raw score rows
  const validateGradeRows = (rows: any[][], mapping: GradeColumnMapping): GradeRowValidationItem[] => {
    return rows
      .map((row, idx): GradeRowValidationItem | null => {
        if (!row || row.length === 0 || row.every((c) => c === null || c === undefined || c === '')) {
          return null;
        }

        const rawNisn = mapping.nisn >= 0 ? String(row[mapping.nisn] || '').trim() : '';
        const rawName = mapping.studentName >= 0 ? String(row[mapping.studentName] || '').trim() : '';
        const rawSubject = mapping.subjectName >= 0 ? String(row[mapping.subjectName] || '').trim() : '';
        const rawLM1 = mapping.lm1 >= 0 ? parseFloat(String(row[mapping.lm1]).replace(',', '.')) : NaN;
        const rawLM2 = mapping.lm2 >= 0 ? parseFloat(String(row[mapping.lm2]).replace(',', '.')) : NaN;
        const rawLM3 = mapping.lm3 >= 0 ? parseFloat(String(row[mapping.lm3]).replace(',', '.')) : NaN;
        const rawLM4 = mapping.lm4 >= 0 ? parseFloat(String(row[mapping.lm4]).replace(',', '.')) : NaN;
        const rawSAS = mapping.sas >= 0 ? parseFloat(String(row[mapping.sas]).replace(',', '.')) : NaN;
        const rawNA = mapping.nilaiAkhir >= 0 ? parseFloat(String(row[mapping.nilaiAkhir]).replace(',', '.')) : NaN;
        const rawNarasi = mapping.narasi >= 0 ? String(row[mapping.narasi] || '').trim() : '';

        const messages: string[] = [];
        let status: 'valid' | 'warning' | 'error' = 'valid';

        // Match student
        const matchedStudent = resolveStudent(rawNisn, rawName);
        if (!matchedStudent) {
          status = 'error';
          messages.push(`Siswa "${rawName || rawNisn || 'Baris ' + (idx + 1)}" tidak ditemukan di e-Rapor. Tarik data siswa terlebih dahulu di menu "Tarik Data Siswa".`);
        }

        // Match subject
        const matchedSubj = resolveSubject(rawSubject);
        if (!matchedSubj) {
          status = 'warning';
          messages.push(`Mata pelajaran "${rawSubject}" diselaraskan dengan mapel kelas: ${classSubjects[0]?.name || 'Utama'}`);
        }

        // Calculate LM Average
        const validLMs = [rawLM1, rawLM2, rawLM3, rawLM4].filter((n) => !isNaN(n) && n >= 0 && n <= 100);
        let avgLM = validLMs.length > 0 ? Math.round(validLMs.reduce((a, b) => a + b, 0) / validLMs.length) : 80;
        let sasScore = !isNaN(rawSAS) && rawSAS >= 0 && rawSAS <= 100 ? Math.round(rawSAS) : 80;

        if (validLMs.length === 0 && isNaN(rawSAS) && isNaN(rawNA)) {
          status = 'warning';
          messages.push('Nilai angka kosong/tidak valid. Diberi nilai default 80.');
        }

        let calculatedNA = !isNaN(rawNA) && rawNA >= 0 && rawNA <= 100
          ? Math.round(rawNA)
          : Math.round(avgLM * 0.6 + sasScore * 0.4);

        let predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan' = 'Baik';
        if (calculatedNA >= 90) predikat = 'Sangat Baik';
        else if (calculatedNA >= 80) predikat = 'Baik';
        else if (calculatedNA >= 70) predikat = 'Cukup';
        else predikat = 'Perlu Bimbingan';

        const finalStudentId = matchedStudent?.id || `unknown-${idx}`;
        const finalStudentName = matchedStudent?.name || rawName || 'Siswa Tidak Dikenal';
        const finalNisn = matchedStudent?.nisn || rawNisn || '-';
        const finalSubjectId = matchedSubj?.id || classSubjects[0]?.id || 's-1';
        const finalSubjectName = matchedSubj?.name || rawSubject || 'Mata Pelajaran';

        const defaultNarasi = `Ananda ${finalStudentName} menunjukkan penguasaan yang ${predikat.toLowerCase()} dalam materi ${finalSubjectName}.`;

        return {
          rowNumber: idx + 1,
          studentId: finalStudentId,
          studentName: finalStudentName,
          nisn: finalNisn,
          subjectId: finalSubjectId,
          subjectName: finalSubjectName,
          rataRataLM: avgLM,
          sumatifSAS: sasScore,
          nilaiAkhir: calculatedNA,
          predikat,
          narasiRapor: rawNarasi || defaultNarasi,
          status,
          messages,
        };
      })
      .filter((i): i is GradeRowValidationItem => i !== null);
  };

  // Handle uploaded Excel/CSV file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessingFile(true);
    setUploadedFileName(file.name);

    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const workbook = XLSX.read(data, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Berkas tidak memiliki sheet data.');
      }

      // Prefer sheet that has 'NILAI' in its name, otherwise first sheet
      const preferredSheet =
        workbook.SheetNames.find((s) => s.toUpperCase().includes('NILAI')) ||
        workbook.SheetNames[0];

      const worksheet = workbook.Sheets[preferredSheet];
      const sheetData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
        header: 1,
        blankrows: false,
        defval: '',
      });

      if (sheetData.length < 2) {
        throw new Error(`Sheet "${preferredSheet}" tidak memiliki cukup baris data (minimal header + 1 baris).`);
      }

      const rawHeaderRow = sheetData[0].map((h: any) => String(h || '').trim());
      const contentRows = sheetData.slice(1);

      setSheetNames(workbook.SheetNames);
      setSelectedSheet(preferredSheet);
      setHeaders(rawHeaderRow);
      setRawRows(contentRows);

      const mapping = detectGradeColumnMapping(rawHeaderRow);
      setColumnMapping(mapping);

      const validated = validateGradeRows(contentRows, mapping);
      setValidationItems(validated);

      setSuccessMessage(
        `Berkas "${file.name}" berhasil dibaca: ${contentRows.length} baris nilai diuraikan dari sheet "${preferredSheet}".`
      );
    } catch (err: any) {
      setErrorMessage(`Gagal memproses berkas Excel: ${err.message || 'Format tidak dikenali'}`);
      setRawRows([]);
      setValidationItems([]);
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  // Handle manual CSV paste for grades
  const handleParseManualCSV = (rawText: string) => {
    if (!rawText.trim()) return;
    try {
      const lines = rawText.trim().split('\n');
      if (lines.length < 2) {
        setErrorMessage('Data CSV harus memiliki baris header dan minimal 1 baris nilai siswa.');
        return;
      }
      const headerLine = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
      const contentLines = lines.slice(1).map((l) => l.split(',').map((c) => c.replace(/^"|"$/g, '').trim()));

      setUploadedFileName('Teks_CSV_Nilai.csv');
      setSheetNames(['CSV_Input']);
      setSelectedSheet('CSV_Input');
      setHeaders(headerLine);
      setRawRows(contentLines);

      const mapping = detectGradeColumnMapping(headerLine);
      setColumnMapping(mapping);

      const validated = validateGradeRows(contentLines, mapping);
      setValidationItems(validated);
      setErrorMessage(null);
      setSuccessMessage(`Berhasil menganalisis ${contentLines.length} baris nilai dari teks CSV.`);
    } catch (err: any) {
      setErrorMessage(`Gagal memproses CSV: ${err.message}`);
    }
  };

  // Commit valid grades to main state
  const handleCommitGrades = () => {
    const validRows = validationItems.filter((item) => item.status !== 'error');

    if (validRows.length === 0) {
      setErrorMessage('Tidak ada data nilai yang valid untuk diimpor. Pastikan siswa sudah terdaftar di e-Rapor.');
      return;
    }

    const transformedGrades: NilaiSiswaMapel[] = validRows.map((row) => ({
      studentId: row.studentId,
      subjectId: row.subjectId,
      tpScores: {},
      sumatifScores: {},
      rataRataLM: row.rataRataLM,
      sumatifSAS: row.sumatifSAS,
      nilaiAkhir: row.nilaiAkhir,
      predikat: row.predikat,
      narasiRapor: row.narasiRapor,
      isAutoNarasi: false,
    }));

    if (onUpdateGrades) {
      onUpdateGrades(transformedGrades);
    }

    setSuccessMessage(
      `Alhamdulillah! Berhasil mengimpor & menyimpan ${transformedGrades.length} data nilai mata pelajaran ke Buku Nilai e-Rapor.`
    );

    // Reset view
    setRawRows([]);
    setValidationItems([]);
    setColumnMapping(null);
    setCsvText('');
  };

  // Filter items in preview table
  const filteredItems = useMemo(() => {
    return validationItems.filter((item) => {
      if (filterTab === 'error' && item.status !== 'error') return false;
      if (filterTab === 'warning' && item.status !== 'warning') return false;
      if (filterTab === 'valid' && item.status !== 'valid') return false;

      if (searchTableQuery.trim()) {
        const q = searchTableQuery.toLowerCase();
        const matchName = item.studentName.toLowerCase().includes(q);
        const matchNisn = item.nisn.toLowerCase().includes(q);
        const matchSubj = item.subjectName.toLowerCase().includes(q);
        return matchName || matchNisn || matchSubj;
      }
      return true;
    });
  }, [validationItems, filterTab, searchTableQuery]);

  const validCount = validationItems.filter((i) => i.status === 'valid').length;
  const warningCount = validationItems.filter((i) => i.status === 'warning').length;
  const errorCount = validationItems.filter((i) => i.status === 'error').length;

  return (
    <div className="space-y-6" id="dapodik-sync-container">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xl shadow-blue-700/20 border-2 border-blue-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-950" />
              <span>Khusus Impor Nilai Mata Pelajaran</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Impor Nilai Siswa (Dapodik / Excel / CSV)
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm font-medium leading-relaxed">
              Unggah dan impor nilai siswa (Sumatif Lingkup Materi, Nilai SAS, Nilai Akhir, dan Narasi Capaian) ke dalam Buku Nilai rapor. Otomatis menghitung rata-rata, nilai akhir, dan predikat Kurikulum Merdeka.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              type="button"
              id="btn-download-grade-template"
              onClick={() =>
                downloadGradeTemplateExcel(
                  (activeClassLevel || 'Kelas 4') as ClassLevel,
                  students,
                  subjects
                )
              }
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Unduh Template Nilai ({activeClassLevel})</span>
            </button>

            <button
              type="button"
              id="btn-export-rekap-excel"
              onClick={() =>
                exportClassDataToExcel(
                  students,
                  subjects,
                  grades,
                  raporDetails,
                  (activeClassLevel || 'Kelas 4') as ClassLevel,
                  schoolProfile
                )
              }
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer backdrop-blur-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Ekspor Rekap Rapor (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clear Separation Notice Banner */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-emerald-200">
              Data Identitas Siswa Kini Otomatis Melalui Navigasi "Tarik Data Siswa"
            </h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              Tidak perlu mengimpor biodata siswa di sini. Navigasi ini khusus untuk mengisi atau mengunggah nilai mata pelajaran siswa.
            </p>
          </div>
        </div>

        {onNavigateToTarikData && (
          <button
            type="button"
            onClick={onNavigateToTarikData}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer shrink-0"
          >
            <span>Buka Navigasi Tarik Data Siswa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Class Level Selector */}
      {onSelectClassLevel && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border-2 border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3 transition-colors">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Target Tingkat Kelas Impor Nilai:
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto">
            {classLevels.map((lvl) => {
              const isActive = lvl === activeClassLevel;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onSelectClassLevel(lvl)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs scale-[1.02]'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Notification Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-bold flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: UPLOAD AREA (When no active inspection) */}
      {validationItems.length === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Box */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-blue-100 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Unggah Berkas Nilai (.xlsx / .csv)</span>
                </h3>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-blue-200 dark:border-slate-700">
                  {activeClassLevel}
                </span>
              </div>

              {/* Drag & Drop Upload Zone */}
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-3xl bg-blue-50/40 dark:bg-slate-800/40 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all cursor-pointer text-center group">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-blue-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform mb-3">
                  <FileSpreadsheet className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white mb-1">
                  {isProcessingFile ? 'Menganalisis nilai siswa...' : 'Klik untuk Memilih atau Tarik Berkas Nilai ke Sini'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Otomatis mendeteksi kolom NISN, Nama Siswa, Mata Pelajaran, LM 1 s/d 4, dan SAS.
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessingFile}
                />
              </label>

              {/* Paste Raw CSV */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Atau Tempel (Paste) Teks CSV Nilai:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const sampleStudent = classStudents[0]?.name || 'Ahmad Fauzan Pratama';
                      const sampleNisn = classStudents[0]?.nisn || '0123456781';
                      const sample = `NISN,Nama Siswa,Mata Pelajaran,LM 1,LM 2,LM 3,LM 4,Nilai SAS,Nilai Akhir,Catatan Capaian\n${sampleNisn},${sampleStudent},Pendidikan Pancasila,88,90,85,92,88,89,Menunjukkan penguasaan yang sangat baik dalam memahami norma aturan.\n${sampleNisn},${sampleStudent},Bahasa Indonesia,85,82,88,90,86,86,Sangat terampil dalam menyusun paragraf deskripsi.`;
                      setCsvText(sample);
                      handleParseManualCSV(sample);
                    }}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Isi Contoh Nilai CSV
                  </button>
                </div>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={3}
                  placeholder="NISN,Nama Siswa,Mata Pelajaran,LM 1,LM 2,LM 3,LM 4,Nilai SAS..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono"
                />
                {csvText.trim() && (
                  <button
                    type="button"
                    onClick={() => handleParseManualCSV(csvText)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Analisis Teks CSV
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Guide Box */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-blue-100 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Format Pengisian Nilai e-Rapor</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Perhitungan Nilai Akhir Otomatis:</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                    Rumus Nilai Akhir (NA) = (Rata-rata LM × 60%) + (Nilai SAS × 40%). Jika kolom NA kosong, sistem otomatis menghitungnya.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-slate-800/80 border border-emerald-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Penyelarasan Siswa Otomatis:</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                    Sistem mencocokkan baris nilai dengan siswa terdaftar berdasarkan NISN atau Nama Lengkap secara akurat.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadGradeTemplateExcel(
                      (activeClassLevel || 'Kelas 4') as ClassLevel,
                      students,
                      subjects
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Format Template Nilai (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PRE-FLIGHT VALIDATION & GRADE TABLE (When inspection active) */}
      {validationItems.length > 0 && (
        <div className="space-y-6 animate-fadeIn">
          {/* File Overview Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-blue-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  {uploadedFileName || 'Berkas Nilai Excel'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sheet: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedSheet}</span> • Total {validationItems.length} baris nilai dianalisis
                </p>
              </div>
            </div>

            {/* Validation Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Semua ({validationItems.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('valid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  filterTab === 'valid'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                Valid ({validCount})
              </button>

              {warningCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterTab('warning')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    filterTab === 'warning'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  Peringatan ({warningCount})
                </button>
              )}

              {errorCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterTab('error')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    filterTab === 'error'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  Kesalahan ({errorCount})
                </button>
              )}
            </div>
          </div>

          {/* Table of Validated Scores */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>Pratinjau Nilai Rapor Hasil Analisis</span>
              </h4>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama / mapel..."
                  value={searchTableQuery}
                  onChange={(e) => setSearchTableQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-48"
                />
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[450px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 pl-4">No</th>
                    <th className="p-2.5">Nama Siswa</th>
                    <th className="p-2.5">Mata Pelajaran</th>
                    <th className="p-2.5 text-center">Rata LM</th>
                    <th className="p-2.5 text-center">Nilai SAS</th>
                    <th className="p-2.5 text-center">Nilai Akhir</th>
                    <th className="p-2.5 text-center">Predikat</th>
                    <th className="p-2.5">Narasi Capaian</th>
                    <th className="p-2.5 pr-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.map((item, idx) => (
                    <tr
                      key={`${item.studentId}-${item.subjectId}-${idx}`}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        item.status === 'error' ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="p-2.5 pl-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">
                        <div>{item.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NISN: {item.nisn}</div>
                      </td>
                      <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">
                        {item.subjectName}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.rataRataLM}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.sumatifSAS}
                      </td>
                      <td className="p-2.5 text-center font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                        {item.nilaiAkhir}
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.predikat === 'Sangat Baik'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.predikat === 'Baik'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.predikat}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate text-[11px]">
                        {item.narasiRapor}
                      </td>
                      <td className="p-2.5 pr-4 text-center whitespace-nowrap">
                        {item.status === 'valid' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <Check className="w-3 h-3" /> Valid
                          </span>
                        ) : item.status === 'warning' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <AlertCircle className="w-3 h-3" /> Peringatan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" title={item.messages.join('; ')}>
                            <AlertTriangle className="w-3 h-3" /> Siswa Belum Ada
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Commit & Cancel Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setRawRows([]);
                  setValidationItems([]);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal / Unggah Ulang Berkas Lain
              </button>

              <button
                type="button"
                onClick={handleCommitGrades}
                disabled={validCount + warningCount === 0}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>
                  Terapkan & Simpan {validCount + warningCount} Nilai ke Buku Nilai e-Rapor
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
