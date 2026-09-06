import React, { useState, useEffect, useMemo } from 'react';
import {
  Student,
  RaporSiswaDetail,
  ClassLevel,
  OgomojoloAttendanceRecord,
  SchoolProfile,
} from '../types';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  ArrowDownToLine,
  UploadCloud,
  Layers,
  Database,
  CalendarCheck,
  UserCheck,
  ExternalLink,
  ShieldCheck,
  Info,
  UserPlus,
  Trash2,
  Users,
  Search,
} from 'lucide-react';
import {
  fetchOgomojoloAttendanceRecords,
  pushBatchOgomojoloAttendance,
  syncOgomojoloToRaporDetails,
  convertOgomojoloToStudents,
  syncAllOgomojoloData,
  parseGradeLevel,
  OGOMOJOLO_COLLECTION_NAME,
} from '../utils/firebase';

interface OgomojoloSyncModalProps {
  students: Student[];
  raporDetails: Record<string, RaporSiswaDetail>;
  activeClassLevel: ClassLevel;
  schoolProfile: SchoolProfile;
  isOpen: boolean;
  onClose: () => void;
  onApplyRaporDetails: (newDetails: Record<string, RaporSiswaDetail>, count: number) => void;
  onRegisterStudentsFromOgomojolo?: (newStudents: Student[], newRaporDetails: Record<string, RaporSiswaDetail>) => void;
  onSyncAllFromOgomojolo?: (updatedStudents: Student[], updatedRaporDetails: Record<string, RaporSiswaDetail>, newStudentsAdded: Student[]) => void;
  onClearAllDummyData?: () => void;
}

export const OgomojoloSyncModal: React.FC<OgomojoloSyncModalProps> = ({
  students,
  raporDetails,
  activeClassLevel,
  schoolProfile,
  isOpen,
  onClose,
  onApplyRaporDetails,
  onRegisterStudentsFromOgomojolo,
  onSyncAllFromOgomojolo,
  onClearAllDummyData,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [records, setRecords] = useState<OgomojoloAttendanceRecord[]>([]);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [selectedSyncScope, setSelectedSyncScope] = useState<ClassLevel | 'Semua Kelas'>('Semua Kelas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const classTabs: Array<{ id: ClassLevel | 'Semua Kelas'; label: string }> = [
    { id: 'Semua Kelas', label: 'Semua Kelas' },
    { id: 'Kelas 1', label: 'Kelas 1' },
    { id: 'Kelas 2', label: 'Kelas 2' },
    { id: 'Kelas 3', label: 'Kelas 3' },
    { id: 'Kelas 4', label: 'Kelas 4' },
    { id: 'Kelas 5', label: 'Kelas 5' },
    { id: 'Kelas 6', label: 'Kelas 6' },
  ];

  // Cloud records count per class
  const classCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Semua Kelas': records.length,
      'Kelas 1': 0,
      'Kelas 2': 0,
      'Kelas 3': 0,
      'Kelas 4': 0,
      'Kelas 5': 0,
      'Kelas 6': 0,
    };
    records.forEach((r) => {
      const gl = parseGradeLevel(r.kelas);
      counts[gl] = (counts[gl] || 0) + 1;
    });
    return counts;
  }, [records]);

  // Existing local students count per class
  const localClassCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Semua Kelas': students.length,
      'Kelas 1': 0,
      'Kelas 2': 0,
      'Kelas 3': 0,
      'Kelas 4': 0,
      'Kelas 5': 0,
      'Kelas 6': 0,
    };
    students.forEach((s) => {
      if (s.gradeLevel && counts[s.gradeLevel] !== undefined) {
        counts[s.gradeLevel]++;
      }
    });
    return counts;
  }, [students]);

  // Filtered records by selected scope and search query
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedSyncScope !== 'Semua Kelas') {
        const gl = parseGradeLevel(r.kelas);
        if (gl !== selectedSyncScope) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.namaSiswa?.toLowerCase().includes(q);
        const matchNisn = r.nisn?.toLowerCase().includes(q);
        const matchNis = r.nis?.toLowerCase().includes(q);
        return matchName || matchNisn || matchNis;
      }
      return true;
    });
  }, [records, selectedSyncScope, searchQuery]);

  // Matching analysis for filtered records
  const matchingStats = useMemo(() => {
    return filteredRecords.reduce(
      (acc, r) => {
        const match = students.some(
          (s) =>
            (s.nisn && s.nisn.trim() === r.nisn.trim()) ||
            (s.nis && r.nis && s.nis.trim() === r.nis.trim()) ||
            s.name.trim().toLowerCase() === r.namaSiswa.trim().toLowerCase()
        );
        if (match) acc.matched++;
        else acc.unmatched++;
        return acc;
      },
      { matched: 0, unmatched: 0 }
    );
  }, [filteredRecords, students]);

  const classStudents = students.filter((s) => s.gradeLevel === activeClassLevel);

  const promptText = `Tolong buatkan fitur pengiriman seluruh data siswa dan rekap kehadiran siswa dari aplikasi SDK Ogomojolo ke aplikasi e-Rapor Merdeka (iihh Beres) melalui Google Cloud Firestore.

Gunakan konfigurasi Firebase yang sama:
- Project ID: reliable-enigma-s1ttq
- Database ID: ai-studio-iihhberes-db02674d-a027-43d4-b17e-50573c47075a
- Koleksi Firestore: "rekap_absensi_ogomojolo"

Pada aplikasi SDK Ogomojolo ini, buatkan tombol "Kirim Data Siswa & Rekap ke e-Rapor" yang mengumpulkan profil lengkap siswa (Nama, NISN, NIS, Jenis Kelamin, Orang Tua, HP, Alamat) beserta total Sakit, Izin, dan Tanpa Keterangan tiap siswa, lalu simpan dokumen ke koleksi "rekap_absensi_ogomojolo" dengan ID dokumen = NISN siswa:
{
  "nisn": "0012345678",
  "nis": "2401",
  "namaSiswa": "Ahmad Fadhil Pratama",
  "gender": "L",
  "kelas": "${activeClassLevel}",
  "semester": ${schoolProfile.semester || 1},
  "tahunAjaran": "${schoolProfile.academicYear || '2024/2025'}",
  "parentName": "Bambang Pratama",
  "parentPhone": "081234567890",
  "address": "Jl. Pendidikan No. 12",
  "birthDate": "2015-05-12",
  "birthPlace": "Kota Pelajar",
  "nik": "3201234567890001",
  "agama": "Islam",
  "sakit": 2,
  "izin": 1,
  "tanpaKeterangan": 0,
  "kehadiran": {
    "sakit": 2,
    "izin": 1,
    "tanpaKeterangan": 0
  },
  "updatedAt": new Date().toISOString()
}`;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchOgomojoloAttendanceRecords();
      setRecords(data);
      if (data.length > 0) {
        setStatusMessage({
          text: `Berhasil memuat ${data.length} catatan siswa & absensi dari Firestore Cloud (${OGOMOJOLO_COLLECTION_NAME}).`,
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: `Belum ada catatan di koleksi '${OGOMOJOLO_COLLECTION_NAME}'. Anda dapat menyalin perintah ke SDK Ogomojolo atau klik 'Kirim Data Uji Coba' di bawah.`,
          type: 'info',
        });
      }
    } catch (err: any) {
      console.error('Failed to load Ogomojolo records:', err);
      setStatusMessage({
        text: `Gagal memuat data dari Cloud: ${err.message || 'Periksa koneksi'}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Primary Action: Synchronize ALL student profile data AND attendance data to e-Rapor
  const handleSyncAllStudentsAndAttendance = (targetScope: ClassLevel | 'Semua Kelas' = selectedSyncScope) => {
    if (records.length === 0) {
      setStatusMessage({ text: 'Tidak ada data siswa atau kehadiran yang dapat disinkronkan.', type: 'error' });
      return;
    }

    const {
      updatedStudents,
      updatedRaporDetails,
      newStudents,
      updatedExistingCount,
      newStudentsCount,
      totalCount,
      syncedStudentNames,
    } = syncAllOgomojoloData(records, students, raporDetails, targetScope);

    if (totalCount === 0) {
      setStatusMessage({
        text: `Tidak ditemukan data siswa untuk ${targetScope} di koleksi Ogomojolo.`,
        type: 'error',
      });
      return;
    }

    if (onSyncAllFromOgomojolo) {
      onSyncAllFromOgomojolo(updatedStudents, updatedRaporDetails, newStudents);
    } else {
      if (onRegisterStudentsFromOgomojolo) {
        onRegisterStudentsFromOgomojolo(updatedStudents, updatedRaporDetails);
      }
      if (onApplyRaporDetails) {
        onApplyRaporDetails(updatedRaporDetails, totalCount);
      }
    }

    const namesSample = syncedStudentNames.slice(0, 3).join(', ') + (syncedStudentNames.length > 3 ? ` dan ${syncedStudentNames.length - 3} lainnya` : '');
    const scopeLabel = targetScope === 'Semua Kelas' ? 'Semua Kelas (Kelas 1 - 6)' : targetScope;

    setStatusMessage({
      text: `Alhamdulillah! Berhasil menyalin ${totalCount} data siswa lengkap untuk ${scopeLabel} (${newStudentsCount} siswa baru ditambahkan ke Data Siswa, ${updatedExistingCount} profil siswa & kehadiran diselaraskan). Contoh: ${namesSample}.`,
      type: 'success',
    });
  };

  // Secondary Action: Only apply attendance to already matched students
  const handleApplyToRapor = () => {
    if (records.length === 0) {
      setStatusMessage({ text: 'Tidak ada data kehadiran yang dapat disinkronkan.', type: 'error' });
      return;
    }

    const { updatedDetails, matchedCount, matchedStudentNames } = syncOgomojoloToRaporDetails(
      records,
      students,
      raporDetails,
      selectedSyncScope === 'Semua Kelas' ? undefined : selectedSyncScope
    );

    if (matchedCount === 0) {
      setStatusMessage({
        text: `Tidak ada siswa yang cocok dengan NISN/Nama di ${selectedSyncScope}. Klik tombol "Salin Semua Data Siswa & Absensi" untuk menyalin siswa baru secara otomatis.`,
        type: 'error',
      });
      return;
    }

    onApplyRaporDetails(updatedDetails, matchedCount);
    setStatusMessage({
      text: `Alhamdulillah! Berhasil menyelaraskan data kehadiran untuk ${matchedCount} siswa (${matchedStudentNames.slice(0, 3).join(', ')}${matchedStudentNames.length > 3 ? '...' : ''}) ke lembar Rapor.`,
      type: 'success',
    });
  };

  const handleRegisterAllFromOgomojolo = () => {
    handleSyncAllStudentsAndAttendance();
  };

  const handleSimulateData = async () => {
    setIsSimulating(true);
    setStatusMessage({ text: 'Mengunggah data simulasi profil siswa & kehadiran SDK Ogomojolo ke Firestore...', type: 'info' });

    try {
      const sampleProfiles = [
        {
          name: 'Ahmad Fadhil Pratama',
          nisn: '0078912301',
          nis: '2401',
          gender: 'L' as const,
          parentName: 'Bambang Pratama',
          parentPhone: '081234567801',
          address: 'Jl. Merdeka No. 10, RT 01/RW 02',
          birthDate: '2015-02-14',
          birthPlace: 'Jakarta',
          nik: '3201011402150001',
          agama: 'Islam',
        },
        {
          name: 'Bunga Anindya Putri',
          nisn: '0078912302',
          nis: '2402',
          gender: 'P' as const,
          parentName: 'Hendra Gunawan',
          parentPhone: '081234567802',
          address: 'Jl. Melati No. 4, RT 02/RW 03',
          birthDate: '2015-05-20',
          birthPlace: 'Bandung',
          nik: '3201012005150002',
          agama: 'Islam',
        },
        {
          name: 'Chairul Rahmat Hidayat',
          nisn: '0078912303',
          nis: '2403',
          gender: 'L' as const,
          parentName: 'Rahmat Santoso',
          parentPhone: '081234567803',
          address: 'Jl. Mawar No. 18, RT 03/RW 01',
          birthDate: '2015-08-09',
          birthPlace: 'Surabaya',
          nik: '3201010908150003',
          agama: 'Islam',
        },
        {
          name: 'Dina Salsabila',
          nisn: '0078912304',
          nis: '2404',
          gender: 'P' as const,
          parentName: 'Agus Salim',
          parentPhone: '081234567804',
          address: 'Jl. Cempaka No. 7, RT 01/RW 04',
          birthDate: '2015-11-12',
          birthPlace: 'Semarang',
          nik: '3201011211150004',
          agama: 'Islam',
        },
        {
          name: 'Erlangga Kurniawan',
          nisn: '0078912305',
          nis: '2405',
          gender: 'L' as const,
          parentName: 'Kurniawan Dwi',
          parentPhone: '081234567805',
          address: 'Jl. Kenanga No. 25, RT 04/RW 02',
          birthDate: '2015-03-30',
          birthPlace: 'Yogyakarta',
          nik: '3201013003150005',
          agama: 'Islam',
        },
      ];

      // Use class students if available to enrich, or use realistic sample profiles
      const sourceList = classStudents.length > 0
        ? classStudents.map((s, idx) => ({
            name: s.name,
            nisn: s.nisn || `007891230${idx + 1}`,
            nis: s.nis || `240${idx + 1}`,
            gender: s.gender || (idx % 2 === 0 ? ('L' as const) : ('P' as const)),
            parentName: s.parentName || 'Orang Tua Murid',
            parentPhone: s.parentPhone || '081234567890',
            address: s.address || 'Alamat Siswa',
            birthDate: s.birthDate || '2015-05-10',
            birthPlace: s.birthPlace || 'Kota Sekolah',
            nik: s.nik || '',
            agama: s.religion || 'Islam',
          }))
        : sampleProfiles;

      // Create complete mock records
      const mockRecords: OgomojoloAttendanceRecord[] = sourceList.map((std, idx) => {
        const sakitDays = idx % 4 === 0 ? 2 : idx % 3 === 0 ? 1 : 0;
        const izinDays = idx % 2 === 0 ? 1 : 0;
        const alpaDays = idx === 1 ? 1 : 0;

        return {
          id: std.nisn,
          nisn: std.nisn,
          nis: std.nis,
          namaSiswa: std.name,
          gender: std.gender,
          jenisKelamin: std.gender,
          kelas: activeClassLevel,
          semester: Number(schoolProfile.semester) || 1,
          tahunAjaran: schoolProfile.academicYear || '2024/2025',
          parentName: std.parentName,
          parentPhone: std.parentPhone,
          address: std.address,
          birthDate: std.birthDate,
          birthPlace: std.birthPlace,
          nik: std.nik,
          religion: std.agama as any,
          sakit: sakitDays,
          izin: izinDays,
          tanpaKeterangan: alpaDays,
          updatedAt: new Date().toISOString(),
          catatan: 'Disinkronkan otomatis dari rekap data siswa & absensi harian SDK Ogomojolo',
        };
      });

      await pushBatchOgomojoloAttendance(mockRecords);
      await loadData();

      setStatusMessage({
        text: `Sukses! ${mockRecords.length} data profil lengkap siswa & absensi ${activeClassLevel} berhasil diunggah ke koleksi '${OGOMOJOLO_COLLECTION_NAME}'. Klik tombol "Salin Semua Data Siswa & Absensi" di bawah untuk memasukkan ke e-Rapor!`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Simulation error:', err);
      setStatusMessage({
        text: `Gagal mengirim data simulasi: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border-2 border-indigo-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-sky-600 text-white rounded-2xl shadow-md shadow-indigo-600/20">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Integrasi SDK Ogomojolo: Data Siswa & Absensi
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Shared Firestore
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Menyalin seluruh data siswa (Nama, NISN, NIS, Gender, Ortu, Kontak, Alamat) dan kehadiran (Sakit, Izin, Alpa) ke e-Rapor {activeClassLevel}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast Message */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5 shrink-0 animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{statusMessage.text}</div>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Cloud Connection Specs Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Koleksi Firestore Bersama:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{OGOMOJOLO_COLLECTION_NAME}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cakupan Data Disalin:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Profil Lengkap Siswa + Presensi
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Kunci Penyelarasan:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                NISN / NIS / Nama Siswa
              </span>
            </div>
          </div>

          {/* Quick Prompt Copy Box for AI in SDK Ogomojolo */}
          <div className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 rounded-2xl border-2 border-sky-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Perintah AI Siap Pakai untuk SDK Ogomojolo (Kirim Profil Lengkap Siswa & Absensi):
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? 'Tersalin ke Clipboard!' : 'Salin Perintah Prompt'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Buka aplikasi <strong>SDK Ogomojolo</strong> Anda di AI Studio, lalu salin dan kirimkan teks prompt di bawah ini ke AI di sana. AI di SDK Ogomojolo akan otomatis mengirimkan profil siswa lengkap (Nama, NISN, NIS, Gender, Ortu, Alamat) dan rekap absensi ke database ini.
            </p>
            <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-sky-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap">
              {promptText}
            </div>
          </div>

          {/* Notice when Students are empty or cleaned */}
          {classStudents.length === 0 && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-emerald-950 dark:text-emerald-200 text-sm">
                    Daftar Siswa {activeClassLevel} Masih Bersih (0 Siswa)
                  </div>
                  <div className="text-emerald-800 dark:text-emerald-300 text-[11px]">
                    Sistem siap menerima seluruh data siswa lengkap dan kehadiran dari SDK Ogomojolo.
                  </div>
                </div>
              </div>
              {records.length > 0 && (
                <button
                  type="button"
                  onClick={handleSyncAllStudentsAndAttendance}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-2 shrink-0 transition hover:scale-[1.02] cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Salin Semua Data Siswa dari Ogomojolo</span>
                </button>
              )}
            </div>
          )}

          {/* Quick Dummy Data Cleaner Option */}
          {onClearAllDummyData && students.length > 0 && (
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/80 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-[11px]">
                <Trash2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Masih ada {students.length} data siswa tersimpan. Ingin mengosongkan sebelum menyalin data baru?</span>
              </div>
              {showClearConfirm ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Yakin bersihkan semua?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllDummyData();
                      setShowClearConfirm(false);
                      setStatusMessage({
                        text: 'Semua data siswa dummy telah dikosongkan. Sistem sekarang bersih untuk menerima data baru!',
                        type: 'success',
                      });
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition"
                  >
                    Ya, Bersihkan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-1 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 font-bold text-[11px] rounded-xl transition cursor-pointer"
                >
                  Kosongkan Data Dummy Sekarang
                </button>
              )}
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
                <span>Muat Ulang Data</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateData}
                disabled={isSimulating}
                title="Unggah contoh data profil siswa & kehadiran untuk mencoba integrasi langsung"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs transition cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                <span>{isSimulating ? 'Mengunggah...' : 'Kirim Data Simulasi'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Secondary option: only update attendance */}
              {matchingStats.matched > 0 && (
                <button
                  type="button"
                  onClick={handleApplyToRapor}
                  disabled={records.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hanya Absensi ({matchingStats.matched})</span>
                </button>
              )}

              {/* Class-specific sync button when a single class tab is selected */}
              {selectedSyncScope !== 'Semua Kelas' && (
                <button
                  type="button"
                  onClick={() => handleSyncAllStudentsAndAttendance(selectedSyncScope)}
                  disabled={filteredRecords.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Salin {selectedSyncScope} ({filteredRecords.length} Siswa)</span>
                </button>
              )}

              {/* PRIMARY PROMINENT ACTION: Salin SEMUA KELAS (132 Siswa) Sekaligus */}
              <button
                type="button"
                onClick={() => handleSyncAllStudentsAndAttendance('Semua Kelas')}
                disabled={records.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Salin Seluruh Siswa Semua Kelas (1-6) Sekaligus ({records.length} Siswa)</span>
              </button>
            </div>
          </div>

          {/* Class Filter Tabs & Search Bar */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Class Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {classTabs.map((tab) => {
                  const isSelected = selectedSyncScope === tab.id;
                  const count = classCounts[tab.id] || 0;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedSyncScope(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama / NISN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-6 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-48 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Sub-header info */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Menampilkan: <strong>{filteredRecords.length} data siswa</strong> untuk filter <strong>{selectedSyncScope}</strong>
              </span>
              <span>
                Sudah ada di e-Rapor: <strong>{matchingStats.matched}</strong> • Siswa baru akan disalin: <strong>{filteredRecords.length - matchingStats.matched}</strong>
              </span>
            </div>

            {/* Preview Table of Ogomojolo Attendance in Cloud */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="p-2.5 pl-4">No</th>
                      <th className="p-2.5">NISN / NIS</th>
                      <th className="p-2.5">Nama Siswa & JK</th>
                      <th className="p-2.5">Kelas Terbaca</th>
                      <th className="p-2.5">Orang Tua & Alamat</th>
                      <th className="p-2.5 text-center">Sakit</th>
                      <th className="p-2.5 text-center">Izin</th>
                      <th className="p-2.5 text-center">Alpa</th>
                      <th className="p-2.5 pr-4 text-right">Status di e-Rapor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          <Layers className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                          <p className="font-bold text-slate-600 dark:text-slate-400">
                            Tidak ada data siswa untuk filter "{selectedSyncScope}"
                          </p>
                          {searchQuery && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              Coba kosongkan kata pencarian "{searchQuery}"
                            </p>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r, i) => {
                        const existingStudent = students.find(
                          (s) =>
                            (s.nisn && s.nisn.trim() === r.nisn.trim()) ||
                            (s.nis && r.nis && s.nis.trim() === r.nis.trim()) ||
                            s.name.trim().toLowerCase() === r.namaSiswa.trim().toLowerCase()
                        );
                        const isMatch = Boolean(existingStudent);
                        const resolvedGrade = parseGradeLevel(r.kelas);
                        const genderShort = r.gender === 'P' || r.jenisKelamin === 'P' ? 'P' : 'L';

                        return (
                          <tr
                            key={r.id || `${r.nisn}-${i}`}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                              isMatch ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''
                            }`}
                          >
                            <td className="p-2.5 pl-4 text-slate-400 font-mono text-[11px]">
                              {i + 1}
                            </td>
                            <td className="p-2.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
                              <div>{r.nisn || '-'}</div>
                              {r.nis && <div className="text-[10px] text-slate-400 font-sans">NIS: {r.nis}</div>}
                            </td>
                            <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <span>{r.namaSiswa}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                  genderShort === 'L' ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300' : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                                }`}>
                                  {genderShort}
                                </span>
                              </div>
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {resolvedGrade}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400 max-w-[160px] truncate text-[11px]">
                              <div>{r.parentName || r.namaOrtu || '-'}</div>
                              <div className="text-slate-400 truncate">{r.address || r.alamat || '-'}</div>
                            </td>
                            <td className="p-2.5 text-center font-bold text-amber-600 dark:text-amber-400">
                              {r.sakit} hr
                            </td>
                            <td className="p-2.5 text-center font-bold text-sky-600 dark:text-sky-400">
                              {r.izin} hr
                            </td>
                            <td className="p-2.5 text-center font-bold text-rose-600 dark:text-rose-400">
                              {r.tanpaKeterangan} hr
                            </td>
                            <td className="p-2.5 pr-4 text-right whitespace-nowrap">
                              {isMatch ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Sudah di e-Rapor
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800">
                                  <UserPlus className="w-3 h-3 text-indigo-600" />
                                  Siswa Baru (Akan Disalin)
                                </span>
                              )}
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-3 shrink-0">
          <span className="text-[11px] text-slate-400">
            Database Cloud: Google Firebase Firestore • Penyalinan Lengkap Profil & Absensi Siap Pakai
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
