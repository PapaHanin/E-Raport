import React, { useState } from 'react';
import {
  Student,
  MataPelajaran,
  NilaiSiswaMapel,
  RaporSiswaDetail,
  ClassLevel,
  SchoolProfile,
  getFaseByClass,
} from '../types';
import { initialSchoolProfile } from '../data/initialData';
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
  HelpCircle,
} from 'lucide-react';
import {
  downloadExcelTemplate,
  exportClassDataToExcel,
  inspectExcelOrCSVFile,
  validateAndTransformRows,
  ColumnMapping,
  InspectResult,
  ValidationSummary,
} from '../utils/excelService';

interface DapodikSyncViewProps {
  students: Student[];
  subjects?: MataPelajaran[];
  grades?: NilaiSiswaMapel[];
  raporDetails?: Record<string, RaporSiswaDetail>;
  schoolProfile?: SchoolProfile;
  activeClassLevel?: ClassLevel;
  onSelectClassLevel?: (classLevel: ClassLevel) => void;
  onImportStudents: (newStudents: Student[]) => void;
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
}) => {
  const classLevels: ClassLevel[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];

  // Inspection & Mapping State
  const [inspectData, setInspectData] = useState<InspectResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // UI view controls
  const [filterTab, setFilterTab] = useState<'all' | 'error' | 'warning' | 'valid'>('all');
  const [skipErrors, setSkipErrors] = useState<boolean>(true);
  const [showMappingPanel, setShowMappingPanel] = useState<boolean>(true);
  const [csvText, setCsvText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // Re-run validation whenever mapping changes or activeClassLevel changes
  const applyMappingAndValidate = (newMapping: ColumnMapping, currentInspect = inspectData) => {
    if (!currentInspect) return;
    const targetClass = (activeClassLevel || 'Kelas 4') as ClassLevel;
    const summary = validateAndTransformRows(currentInspect.rawRows, newMapping, targetClass);
    setValidationSummary(summary);
    setColumnMapping(newMapping);
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
      const inspect = await inspectExcelOrCSVFile(file);
      setInspectData(inspect);
      setColumnMapping(inspect.suggestedMapping);
      const targetClass = (activeClassLevel || 'Kelas 4') as ClassLevel;
      const summary = validateAndTransformRows(inspect.rawRows, inspect.suggestedMapping, targetClass);
      setValidationSummary(summary);
      setSuccessMessage(
        `Berkas "${file.name}" berhasil dianalisis: ${inspect.rawRows.length} baris data ditemukan pada sheet "${inspect.selectedSheet}".`
      );
    } catch (err: any) {
      setErrorMessage(`Gagal memproses berkas Excel: ${err.message || 'Format tidak dikenali'}`);
      setInspectData(null);
      setValidationSummary(null);
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  // Handle manual CSV paste
  const handleParseManualCSV = (rawText: string) => {
    if (!rawText.trim()) return;
    try {
      const lines = rawText.trim().split('\n');
      if (lines.length < 2) {
        setErrorMessage('Data CSV harus memiliki baris header dan minimal 1 baris data siswa.');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
      const rawRows = lines.slice(1).map((l) => l.split(',').map((c) => c.replace(/^"|"$/g, '').trim()));

      const inspect: InspectResult = {
        sheetNames: ['CSV_Input'],
        selectedSheet: 'CSV_Input',
        headers,
        rawRows,
        suggestedMapping: {
          nisn: headers.findIndex((h) => h.toLowerCase().includes('nisn')),
          nis: headers.findIndex((h) => h.toLowerCase().includes('nis') && !h.toLowerCase().includes('nisn')),
          name: headers.findIndex((h) => h.toLowerCase().includes('nama')),
          gender: headers.findIndex((h) => h.toLowerCase().includes('kelamin') || h.toLowerCase().includes('l/p')),
          gradeLevel: headers.findIndex((h) => h.toLowerCase().includes('kelas')),
          parentName: headers.findIndex((h) => h.toLowerCase().includes('wali') || h.toLowerCase().includes('ortu')),
          parentPhone: headers.findIndex((h) => h.toLowerCase().includes('wa') || h.toLowerCase().includes('hp')),
          address: headers.findIndex((h) => h.toLowerCase().includes('alamat')),
          birthDate: headers.findIndex((h) => h.toLowerCase().includes('lahir')),
        },
      };

      setUploadedFileName('Teks_CSV_Manual.csv');
      setInspectData(inspect);
      setColumnMapping(inspect.suggestedMapping);
      const targetClass = (activeClassLevel || 'Kelas 4') as ClassLevel;
      const summary = validateAndTransformRows(inspect.rawRows, inspect.suggestedMapping, targetClass);
      setValidationSummary(summary);
      setErrorMessage(null);
      setSuccessMessage(`Berhasil menguraikan ${rawRows.length} baris dari teks CSV manual.`);
    } catch (err: any) {
      setErrorMessage(`Gagal memproses CSV: ${err.message}`);
    }
  };

  // Change individual column mapping dropdown
  const handleColumnMappingChange = (field: keyof ColumnMapping, columnIndex: number) => {
    if (!columnMapping || !inspectData) return;
    const updated: ColumnMapping = {
      ...columnMapping,
      [field]: columnIndex,
    };
    applyMappingAndValidate(updated, inspectData);
  };

  // Commit valid students to main state
  const handleCommitImport = () => {
    if (!validationSummary) return;

    const toImport = skipErrors
      ? validationSummary.studentsToImport
      : validationSummary.items.map((i) => i.student);

    if (toImport.length === 0) {
      setErrorMessage('Tidak ada data siswa yang dapat diimpor. Periksa kolom atau baris kesalahan.');
      return;
    }

    onImportStudents(toImport);
    setSuccessMessage(
      `Sukses! ${toImport.length} siswa berhasil diimpor ke sistem rapor untuk ${activeClassLevel}.`
    );

    // Reset inspection view after successful import
    setInspectData(null);
    setValidationSummary(null);
    setColumnMapping(null);
    setCsvText('');
  };

  const handleCancelInspection = () => {
    setInspectData(null);
    setValidationSummary(null);
    setColumnMapping(null);
  };

  // Filter items in preview table
  const filteredValidationItems = validationSummary?.items.filter((item) => {
    if (filterTab === 'error') return item.status === 'error';
    if (filterTab === 'warning') return item.status === 'warning';
    if (filterTab === 'valid') return item.status === 'valid';
    return true;
  }) || [];

  return (
    <div className="space-y-6" id="dapodik-sync-container">
      {/* Top Hero Banner */}
      <div className="bg-[#4F46E5] text-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xl shadow-indigo-500/20 border-2 border-indigo-400/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-black text-xs font-black uppercase tracking-wider shadow-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-black" />
              <span>Smart Excel & Sinkronisasi Dapodik</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Impor & Pemetaan Kolom Cerdas Excel / CSV
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm font-medium leading-relaxed">
              Dilengkapi <strong>Smart Column Mapping</strong> otomatis dan <strong>Validasi Pra-Impor</strong> untuk mendeteksi NISN duplikat, kesalahan format, serta normalisasi data sebelum dimasukkan ke dalam buku nilai rapor.
            </p>
          </div>

          {/* Quick Action Download Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              id="btn-download-template-excel"
              onClick={() => downloadExcelTemplate((activeClassLevel || 'Kelas 4') as ClassLevel)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs sm:text-sm shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-4 h-4 text-black" />
              <span>Unduh Format Excel (.xlsx)</span>
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
              <span>Ekspor Rapor Kelas (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Class Level Selector */}
      {onSelectClassLevel && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border-2 border-indigo-100 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3 transition-colors">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider">
              Target Tingkat Kelas Impor:
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto">
            {classLevels.map((lvl) => {
              const isActive = lvl === activeClassLevel;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    onSelectClassLevel(lvl);
                    if (inspectData && columnMapping) {
                      const summary = validateAndTransformRows(inspectData.rawRows, columnMapping, lvl);
                      setValidationSummary(summary);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#4F46E5] text-white shadow-xs scale-[1.02]'
                      : 'text-gray-700 dark:text-slate-300 hover:text-indigo-700 hover:bg-white/80 dark:hover:bg-slate-700'
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
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD & INPUT AREA (When no file active) */}
      {!inspectData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Drag & Drop File Upload + Paste (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-black text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Unggah Berkas Excel / CSV Siswa</span>
                </h3>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-slate-700">
                  .xlsx, .xls, .csv
                </span>
              </div>

              {/* Drag & Drop Upload Zone */}
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-3xl bg-indigo-50/50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all cursor-pointer text-center group">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-indigo-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform mb-3">
                  <FileSpreadsheet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white mb-1">
                  {isProcessingFile ? 'Membaca dan menganalisis berkas...' : 'Klik untuk Pilih atau Tarik Berkas Excel ke Sini'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm">
                  Sistem otomatis mendeteksi kolom nama, NISN, jenis kelamin, dan nomor WA orang tua.
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessingFile}
                />
              </label>

              {/* Paste Raw CSV Area as alternate */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                    Atau Tempel (Paste) Teks CSV Dapodik Manual:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = `NISN,NIS,Nama Siswa,L/P,Kelas,Nama Wali,WhatsApp Ortu,Alamat\n0183456701,24001,Ahmad Fauzan Pratama,L,${activeClassLevel},H. Fauzan Pratama,081234567890,Jl. Merdeka No. 12 Jakarta\n0183456702,24002,Aisyah Putri Rahmadani,P,${activeClassLevel},Rahmat Hidayat,081298765432,Jl. Melati No. 5 Jakarta\n0183456703,24003,Bima Sakti Nugroho,L,${activeClassLevel},Bambang N.,081311223344,Jl. Sudirman 88`;
                      setCsvText(sample);
                      handleParseManualCSV(sample);
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Isi Contoh CSV
                  </button>
                </div>
                <textarea
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                  }}
                  rows={3}
                  placeholder="NISN,NIS,Nama Siswa,L/P,Kelas,Nama Wali,WhatsApp Ortu,Alamat..."
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs font-mono"
                />
                {csvText.trim() && (
                  <button
                    type="button"
                    onClick={() => handleParseManualCSV(csvText)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Analisis Teks CSV
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Structure Guide (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors">
              <h3 className="font-black text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Fitur Pemetaan Kolom Cerdas</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Auto-Detect Header:</span>
                  </div>
                  <p className="text-gray-600 dark:text-slate-400 leading-relaxed text-[11px]">
                    Sistem otomatis mengenali variasi nama kolom seperti "Nama Peserta Didik", "Nama Murid", "JK", "Gender", atau "No WA".
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-slate-800/80 border border-emerald-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Validasi Pra-Impor:</span>
                  </div>
                  <p className="text-gray-600 dark:text-slate-400 leading-relaxed text-[11px]">
                    Memeriksa baris data sebelum masuk database. Baris yang memiliki kesalahan dapat diperbaiki atau diabaikan secara aman.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold">
                    <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Normalisasi Otomatis:</span>
                  </div>
                  <p className="text-gray-600 dark:text-slate-400 leading-relaxed text-[11px]">
                    Nomor HP 08xx diubah otomatis menjadi format internasional 628xx untuk integrasi WhatsApp Gateway.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => downloadExcelTemplate((activeClassLevel || 'Kelas 4') as ClassLevel)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Format Template Resmi (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: SMART COLUMN MAPPING & PRE-FLIGHT VALIDATION (Active when inspectData is present) */}
      {inspectData && validationSummary && columnMapping && (
        <div className="space-y-6 animate-fadeIn">
          {/* File Overview Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    {uploadedFileName || 'Berkas Excel'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Sheet: {inspectData.selectedSheet}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Ditemukan {inspectData.rawRows.length} baris data • {inspectData.headers.length} kolom terdeteksi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMappingPanel(!showMappingPanel)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  showMappingPanel
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showMappingPanel ? 'Sembunyikan Pemetaan' : 'Atur Pemetaan Kolom'}</span>
              </button>

              <button
                type="button"
                onClick={handleCancelInspection}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Ganti Berkas</span>
              </button>
            </div>
          </div>

          {/* Smart Column Mapping Config Panel */}
          {showMappingPanel && (
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <h4 className="font-black text-gray-900 dark:text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Penyesuaian Kolom Cerdas (Smart Column Mapping)</span>
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Periksa atau ubah pasangan kolom berkas Anda ke kolom sistem rapor Kurikulum Merdeka.
                  </p>
                </div>
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  ✨ Terpetakan Otomatis
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. Nama Siswa */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                    <span>Nama Siswa <span className="text-rose-500">*Wajib</span></span>
                    {columnMapping.name !== -1 && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                  <select
                    value={columnMapping.name}
                    onChange={(e) => handleColumnMappingChange('name', Number(e.target.value))}
                    className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl p-2 cursor-pointer"
                  >
                    <option value={-1}>-- Tidak Terpetakan --</option>
                    {inspectData.headers.map((h, idx) => (
                      <option key={idx} value={idx}>
                        Kolom {idx + 1}: {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. NISN */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                    <span>NISN</span>
                    {columnMapping.nisn !== -1 && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                  <select
                    value={columnMapping.nisn}
                    onChange={(e) => handleColumnMappingChange('nisn', Number(e.target.value))}
                    className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl p-2 cursor-pointer"
                  >
                    <option value={-1}>-- Otomatis Digenerate --</option>
                    {inspectData.headers.map((h, idx) => (
                      <option key={idx} value={idx}>
                        Kolom {idx + 1}: {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. NIS */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                    <span>NIS / NIPD</span>
                    {columnMapping.nis !== -1 && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                  <select
                    value={columnMapping.nis}
                    onChange={(e) => handleColumnMappingChange('nis', Number(e.target.value))}
                    className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl p-2 cursor-pointer"
                  >
                    <option value={-1}>-- Otomatis Digenerate --</option>
                    {inspectData.headers.map((h, idx) => (
                      <option key={idx} value={idx}>
                        Kolom {idx + 1}: {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Jenis Kelamin */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                    <span>Jenis Kelamin (L/P)</span>
                    {columnMapping.gender !== -1 && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                  <select
                    value={columnMapping.gender}
                    onChange={(e) => handleColumnMappingChange('gender', Number(e.target.value))}
                    className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl p-2 cursor-pointer"
                  >
                    <option value={-1}>-- Default: L --</option>
                    {inspectData.headers.map((h, idx) => (
                      <option key={idx} value={idx}>
                        Kolom {idx + 1}: {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. WhatsApp Orang Tua */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                    <span>Nomor WhatsApp Wali</span>
                    {columnMapping.parentPhone !== -1 && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                  <select
                    value={columnMapping.parentPhone}
                    onChange={(e) => handleColumnMappingChange('parentPhone', Number(e.target.value))}
                    className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl p-2 cursor-pointer"
                  >
                    <option value={-1}>-- Kosongkan / Default --</option>
                    {inspectData.headers.map((h, idx) => (
                      <option key={idx} value={idx}>
                        Kolom {idx + 1}: {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Nama Wali */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                    <span>Nama Orang Tua / Wali</span>
                    {columnMapping.parentName !== -1 && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                  <select
                    value={columnMapping.parentName}
                    onChange={(e) => handleColumnMappingChange('parentName', Number(e.target.value))}
                    className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl p-2 cursor-pointer"
                  >
                    <option value={-1}>-- Default: Wali Murid --</option>
                    {inspectData.headers.map((h, idx) => (
                      <option key={idx} value={idx}>
                        Kolom {idx + 1}: {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Validation Metrics & Action Summary Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-100 dark:border-slate-800">
              {/* Validation Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200'
                  }`}
                >
                  Semua ({validationSummary.items.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('valid')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterTab === 'valid'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{validationSummary.validCount} Sempurna</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('warning')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterTab === 'warning'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{validationSummary.warningCount} Peringatan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('error')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterTab === 'error'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>{validationSummary.errorCount} Kesalahan</span>
                </button>
              </div>

              {/* Commit Action */}
              <div className="flex flex-wrap items-center gap-3">
                {validationSummary.errorCount > 0 && (
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipErrors}
                      onChange={(e) => setSkipErrors(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Abaikan baris kesalahan (impor {validationSummary.studentsToImport.length} siswa valid)</span>
                  </label>
                )}

                <button
                  type="button"
                  id="btn-commit-smart-import"
                  onClick={handleCommitImport}
                  disabled={validationSummary.studentsToImport.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>
                    Simpan & Impor {validationSummary.studentsToImport.length} Siswa ke {activeClassLevel}
                  </span>
                </button>
              </div>
            </div>

            {/* Validation Table Preview */}
            <div className="max-h-[380px] overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold sticky top-0 z-10 shadow-xs">
                  <tr>
                    <th className="p-3 w-16">Baris</th>
                    <th className="p-3 w-28">Status</th>
                    <th className="p-3">NISN</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3 w-16">L/P</th>
                    <th className="p-3">No WhatsApp Ortu</th>
                    <th className="p-3">Catatan Validasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-900 dark:text-slate-200">
                  {filteredValidationItems.map((item) => {
                    const isError = item.status === 'error';
                    const isWarning = item.status === 'warning';
                    return (
                      <tr
                        key={item.rowNumber}
                        className={`transition-colors ${
                          isError
                            ? 'bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                            : isWarning
                            ? 'bg-amber-50/50 dark:bg-amber-950/20'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-gray-500 dark:text-slate-400">
                          #{item.rowNumber}
                        </td>
                        <td className="p-3">
                          {isError ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              <span>Error</span>
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Peringatan</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Valid</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {item.student.nisn}
                        </td>
                        <td className="p-3 font-bold">
                          {item.student.name}
                        </td>
                        <td className="p-3 font-mono font-bold">
                          {item.student.gender}
                        </td>
                        <td className="p-3 font-mono text-gray-600 dark:text-slate-300">
                          {item.student.parentPhone}
                        </td>
                        <td className="p-3">
                          {item.messages.length > 0 ? (
                            <div className="space-y-0.5">
                              {item.messages.map((msg, mIdx) => (
                                <p
                                  key={mIdx}
                                  className={`text-[11px] font-medium leading-tight ${
                                    isError ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'
                                  }`}
                                >
                                  • {msg}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Data sesuai standar
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
