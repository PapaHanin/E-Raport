import React, { useState, useRef } from 'react';
import {
  SchoolProfile,
  Student,
  MataPelajaran,
  NilaiSiswaMapel,
  RaporSiswaDetail,
  SystemBackupData,
  ClassLevel,
  TeacherAccount,
} from '../types';
import {
  Settings,
  Save,
  CheckCircle2,
  Building,
  UserCheck,
  Calendar,
  RotateCcw,
  Download,
  Upload,
  Database,
  FileJson,
  AlertTriangle,
  FileCheck,
  GraduationCap,
  Users,
  Shield,
  QrCode,
  Edit3,
  Lock,
} from 'lucide-react';
import { PengaturanGuruSection } from './PengaturanGuruSection';
import { SignatureSettingsModal } from './SignatureSettingsModal';
import { SignatureSettings } from '../types';
import { compressAndOptimizeImage } from '../utils/imageOptimizer';

interface PengaturanViewProps {
  schoolProfile: SchoolProfile;
  students: Student[];
  subjects: MataPelajaran[];
  grades: NilaiSiswaMapel[];
  raporDetails: Record<string, RaporSiswaDetail>;
  activeClassLevel: ClassLevel;
  teachers?: TeacherAccount[];
  currentUser?: TeacherAccount | null;
  onUpdateSchoolProfile: (updatedProfile: SchoolProfile) => void;
  onUpdateTeachers?: (updatedTeachers: TeacherAccount[]) => void;
  onImportFullBackup: (backupData: SystemBackupData) => void;
  onResetToDefault: () => void;
  onSelectClassLevel?: (classLevel: ClassLevel) => void;
  onSwitchUser?: (user: TeacherAccount) => void;
  initialSubTab?: 'identitas' | 'guru' | 'ttd' | 'backup';
}

const defaultAdminTeacher: TeacherAccount = {
  id: 'usr-admin',
  name: 'Fadli, S.Pd.',
  nip: '198908152016021001',
  email: 'fadli46046@gmail.com',
  username: 'fadli',
  pin: '1234',
  role: 'admin',
  phone: '081234567890',
  status: 'aktif',
};

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  schoolProfile,
  students,
  subjects,
  grades,
  raporDetails,
  activeClassLevel,
  teachers = [],
  currentUser = defaultAdminTeacher,
  onUpdateSchoolProfile,
  onUpdateTeachers,
  onImportFullBackup,
  onResetToDefault,
  onSelectClassLevel,
  onSwitchUser,
  initialSubTab = 'identitas',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'identitas' | 'guru' | 'ttd' | 'backup'>(initialSubTab);

  React.useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const [formData, setFormData] = useState<SchoolProfile>(schoolProfile);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import State
  const [pendingBackupData, setPendingBackupData] = useState<SystemBackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  // Direct Image Upload for TTD, QR, and Stamp with auto-compression
  const handleDirectImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'customTeacherQrImage' | 'customHeadmasterQrImage' | 'teacherSignImage' | 'headmasterSignImage' | 'schoolStampImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security check: only admin can modify headmaster or stamp
    if ((field === 'customHeadmasterQrImage' || field === 'headmasterSignImage' || field === 'schoolStampImage') && currentUser?.role !== 'admin') {
      alert('Akses Ditolak: Hanya Admin atau Kepala Sekolah yang dapat merubah tanda tangan / stempel Kepala Sekolah.');
      e.target.value = '';
      return;
    }

    try {
      const optResult = await compressAndOptimizeImage(file, {
        maxWidth: 600,
        maxHeight: 350,
        quality: 0.85,
        format: 'image/png',
      });
      const dataUrl = optResult.dataUrl;

      const currentSig = formData.signatureSettings || { mode: 'manual', showSchoolStamp: true };
      
      const effectiveClass = (currentUser?.role === 'guru_wali_kelas' && currentUser.assignedClass)
        ? currentUser.assignedClass
        : activeClassLevel;

      const prevClassSigs = currentSig.classTeacherSignatures || {};
      const existingClassSig = prevClassSigs[effectiveClass] || {};

      let updatedClassSigs = { ...prevClassSigs };
      if (field === 'teacherSignImage') {
        updatedClassSigs[effectiveClass] = {
          ...existingClassSig,
          teacherSignImage: dataUrl,
        };
      } else if (field === 'customTeacherQrImage') {
        updatedClassSigs[effectiveClass] = {
          ...existingClassSig,
          customTeacherQrImage: dataUrl,
        };
      }

      const updatedSig: SignatureSettings = {
        ...currentSig,
        [field]: dataUrl,
        classTeacherSignatures: updatedClassSigs,
      };

      if (field === 'teacherSignImage') {
        updatedSig.teacherSignatureImage = dataUrl;
      } else if (field === 'headmasterSignImage') {
        updatedSig.headmasterSignatureImage = dataUrl;
      }

      const updatedProfile: SchoolProfile = {
        ...formData,
        signatureSettings: updatedSig,
      };

      setFormData(updatedProfile);
      onUpdateSchoolProfile(updatedProfile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error("Image upload compression failed:", err);
      alert('Gagal mengoptimasi gambar: ' + (err.message || 'Format tidak didukung'));
    }

    e.target.value = '';
  };

  const handleResetSignatureField = (
    field: 'customTeacherQrImage' | 'customHeadmasterQrImage' | 'teacherSignImage' | 'headmasterSignImage' | 'schoolStampImage'
  ) => {
    if ((field === 'customHeadmasterQrImage' || field === 'headmasterSignImage' || field === 'schoolStampImage') && currentUser?.role !== 'admin') {
      alert('Akses Ditolak: Hanya Admin atau Kepala Sekolah yang dapat merubah tanda tangan Kepala Sekolah.');
      return;
    }

    const currentSig = formData.signatureSettings || { mode: 'manual', showSchoolStamp: true };
    const effectiveClass = (currentUser?.role === 'guru_wali_kelas' && currentUser.assignedClass)
      ? currentUser.assignedClass
      : activeClassLevel;

    const prevClassSigs = currentSig.classTeacherSignatures || {};
    const existingClassSig = prevClassSigs[effectiveClass] || {};

    let updatedClassSigs = { ...prevClassSigs };
    if (field === 'teacherSignImage') {
      updatedClassSigs[effectiveClass] = {
        ...existingClassSig,
        teacherSignImage: '',
      };
    } else if (field === 'customTeacherQrImage') {
      updatedClassSigs[effectiveClass] = {
        ...existingClassSig,
        customTeacherQrImage: '',
      };
    }

    const updatedSig: SignatureSettings = {
      ...currentSig,
      [field]: '',
      classTeacherSignatures: updatedClassSigs,
    };
    if (field === 'teacherSignImage') updatedSig.teacherSignatureImage = '';
    if (field === 'headmasterSignImage') updatedSig.headmasterSignatureImage = '';

    const updatedProfile: SchoolProfile = {
      ...formData,
      signatureSettings: updatedSig,
    };
    setFormData(updatedProfile);
    onUpdateSchoolProfile(updatedProfile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSchoolProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Export Full System Data as JSON File
  const handleExportSystemJSON = () => {
    const backup: SystemBackupData = {
      version: '1.3.0',
      exportedAt: new Date().toISOString(),
      activeClassLevel,
      schoolProfile: formData,
      students,
      subjects,
      grades,
      raporDetails,
      teachers,
      currentUser,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = `${now.getHours()}${now.getMinutes()}`;
    const fileName = `Backup_iihh_Beres_${formData.schoolName.replace(/\s+/g, '_')}_${dateStr}_${timeStr}.json`;

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle file selection for JSON backup import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation check
        if (!parsed.schoolProfile || !Array.isArray(parsed.students) || !Array.isArray(parsed.grades)) {
          throw new Error('Format file JSON tidak valid. Struktur data iihh Beres tidak ditemukan.');
        }

        setPendingBackupData(parsed as SystemBackupData);
      } catch (err: any) {
        setImportError(err.message || 'Gagal membaca file backup JSON.');
        setPendingBackupData(null);
      }
    };
    reader.readAsText(file);
  };

  // Confirm and apply the parsed backup data
  const handleConfirmImport = () => {
    if (!pendingBackupData) return;

    onImportFullBackup(pendingBackupData);
    setFormData(pendingBackupData.schoolProfile);
    setPendingBackupData(null);
    setImportSuccess(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setImportSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" id="pengaturan-container">
      {/* Top Banner */}
      <div className="bg-[#4F46E5] dark:bg-indigo-900 text-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xl shadow-indigo-500/20 border-2 border-indigo-400/40 relative overflow-hidden transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-black text-xs font-black uppercase tracking-wider shadow-xs">
              <Settings className="w-3.5 h-3.5 text-black" />
              <span>Pusat Administrasi & Keamanan Sistem</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pengaturan Identitas, Akun Guru & Cadangan Data
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm font-medium leading-relaxed">
              Kelola profil sekolah untuk kop e-Rapor, kelola penugasan guru wali kelas 1-6 dengan hak akses terisolasi, dan ekspor/impor basis data mandiri.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 dark:bg-black/20 p-2 rounded-2xl border border-white/20 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-black text-xs">
              {(currentUser?.role || 'admin') === 'admin' ? 'ADM' : currentUser?.assignedClass?.replace('Kelas ', 'K') || 'GK'}
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-yellow-300">Login Sebagai:</p>
              <p className="text-xs font-black text-white truncate max-w-[140px]">{currentUser?.name || 'Administrator'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border-2 border-indigo-100 dark:border-slate-800 shadow-xs overflow-x-auto transition-colors">
        <button
          type="button"
          onClick={() => setActiveSubTab('identitas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeSubTab === 'identitas'
              ? 'bg-[#4F46E5] text-white shadow-xs scale-[1.01]'
              : 'text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Profil Sekolah & Kop Rapor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ttd')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeSubTab === 'ttd'
              ? 'bg-[#4F46E5] text-white shadow-xs scale-[1.01]'
              : 'text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Tanda Tangan & Barcode</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-400 text-black font-black">
            {formData.signatureSettings?.mode === 'qr_code'
              ? '📱 Barcode QR'
              : formData.signatureSettings?.mode === 'digital_image'
              ? '🖊️ Digital'
              : '✍️ TTD Basah'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('guru')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeSubTab === 'guru'
              ? 'bg-[#4F46E5] text-white shadow-xs scale-[1.01]'
              : 'text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Akun & Guru Wali Kelas</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-400 text-black font-black">
            Hak Akses 🔒
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeSubTab === 'backup'
              ? 'bg-[#4F46E5] text-white shadow-xs scale-[1.01]'
              : 'text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup & Restore (JSON)</span>
        </button>
      </div>

      {/* SUB-TAB 1: IDENTITAS SEKOLAH & TITIMANGSA */}
      {activeSubTab === 'identitas' && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
          {/* Identitas Sekolah */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors">
            <h3 className="font-black text-gray-900 dark:text-white text-sm flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Identitas Satuan Pendidikan (KOP Surat e-Rapor)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1.5">Nama Sekolah / Satuan Pendidikan</label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1.5">NPSN Sekolah</label>
                <input
                  type="text"
                  value={formData.npsn}
                  onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-mono font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1.5">Alamat Lengkap Sekolah</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1.5">Kabupaten / Kota</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1.5">Provinsi</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Pejabat Penandatangan */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors">
            <h3 className="font-black text-gray-900 dark:text-white text-sm flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Kepala Sekolah & Guru Kelas / Wali Kelas</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1.5">Nama Kepala Sekolah</label>
                <input
                  type="text"
                  value={formData.headmasterName}
                  onChange={(e) => setFormData({ ...formData, headmasterName: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1.5">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={formData.headmasterNIP}
                  onChange={(e) => setFormData({ ...formData, headmasterNIP: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-mono font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1.5">Nama Guru Kelas / Wali Kelas ({activeClassLevel})</label>
                <input
                  type="text"
                  value={formData.teacherName}
                  onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1.5">NIP Guru Kelas</label>
                <input
                  type="text"
                  value={formData.teacherNIP}
                  onChange={(e) => setFormData({ ...formData, teacherNIP: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-mono font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Periode e-Rapor */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors">
            <h3 className="font-black text-gray-900 dark:text-white text-sm flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Periode & Tanggal Titimangsa Rapor</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1.5">Tahun Ajaran</label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1.5">Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500"
                >
                  <option value="1 (Ganjil)">1 (Ganjil)</option>
                  <option value="2 (Genap)">2 (Genap)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1.5">Tempat & Tanggal Rapor</label>
                <input
                  type="text"
                  value={formData.placeDate}
                  onChange={(e) => setFormData({ ...formData, placeDate: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset data sistem ke pengaturan awal?')) {
                  onResetToDefault();
                }
              }}
              className="inline-flex items-center gap-1.5 px-5 py-3 border-2 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:text-rose-600 text-xs font-bold rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data Default</span>
            </button>

            <button
              type="submit"
              id="btn-save-settings"
              className="inline-flex items-center gap-2 px-7 py-3 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs sm:text-sm font-black rounded-2xl shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Profil Sekolah</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 2: TANDA TANGAN & BARCODE / QR CODE */}
      {activeSubTab === 'ttd' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 sm:p-8 space-y-6 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-5">
              <div>
                <h3 className="font-black text-gray-900 dark:text-white text-lg flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Pengesahan Rapor: Tanda Tangan & Barcode</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-1">
                  Atur format pengesahan rapor siswa secara manual (TTD basah), Barcode QR Code verifikasi (e-Sign BSRE), atau scan tanda tangan digital & stempel sekolah.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] cursor-pointer shrink-0"
              >
                <Edit3 className="w-4 h-4" />
                <span>Buka Editor & Unggah File</span>
              </button>
            </div>

            {/* Mode Selection Cards */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
                Pilih Mode Tanda Tangan Utama di Rapor:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    id: 'manual' as const,
                    title: '1. Tanda Tangan Basah',
                    subtitle: 'Manual (Kertas)',
                    desc: 'Menyediakan ruang kosong yang proporsional dan garis tanda tangan untuk ditandatangani manual dengan pulpen basah.',
                    badge: 'Standar Fisik',
                    icon: '✍️',
                  },
                  {
                    id: 'qr_code' as const,
                    title: '2. Barcode / QR Code',
                    subtitle: 'e-Sign BSRE Kemdikbud',
                    desc: 'Menampilkan QR Code terenkripsi berisi data verifikasi keabsahan dokumen e-Rapor resmi.',
                    badge: 'Rekomendasi Digital',
                    icon: '📱',
                  },
                  {
                    id: 'digital_image' as const,
                    title: '3. Scan TTD & Stempel',
                    subtitle: 'Gambar Digital',
                    desc: 'Menempelkan gambar scan tanda tangan transparan atau hasil coretan kanvas beserta stempel sekolah.',
                    badge: 'Otomatis',
                    icon: '🖊️',
                  },
                ].map((mode) => {
                  const isSelected = (formData.signatureSettings?.mode || 'manual') === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        const newSettings: SignatureSettings = {
                          ...(formData.signatureSettings || {
                            mode: 'manual',
                            showSchoolStamp: true,
                          }),
                          mode: mode.id,
                        };
                        const updated = {
                          ...formData,
                          signatureSettings: newSettings,
                        };
                        setFormData(updated);
                        onUpdateSchoolProfile(updated);
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 2000);
                      }}
                      className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                          : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{mode.icon}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                            }`}
                          >
                            {isSelected ? '✓ Aktif' : mode.badge}
                          </span>
                        </div>
                        <h4 className="font-black text-sm text-gray-900 dark:text-white">
                          {mode.title}
                        </h4>
                        <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {mode.subtitle}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                          {mode.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Status Overview */}
            {(() => {
              const isAdmin = currentUser?.role === 'admin';
              const effectiveClass = (currentUser?.role === 'guru_wali_kelas' && currentUser.assignedClass)
                ? currentUser.assignedClass
                : activeClassLevel;
              const classSig = formData.signatureSettings?.classTeacherSignatures?.[effectiveClass];
              const teacherQr = classSig?.customTeacherQrImage || formData.signatureSettings?.customTeacherQrImage;
              const teacherSign = classSig?.teacherSignImage || formData.signatureSettings?.teacherSignatureImage || formData.signatureSettings?.teacherSignImage;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Headmaster Card */}
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                        Tanda Tangan / QR Kepala Sekolah:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {!isAdmin && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Admin Only</span>
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[130px]">
                          {formData.headmasterName}
                        </span>
                      </div>
                    </div>
                    <div className="h-24 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-center p-2 overflow-hidden">
                      {formData.signatureSettings?.mode === 'qr_code' ? (
                        formData.signatureSettings?.customHeadmasterQrImage ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={formData.signatureSettings.customHeadmasterQrImage}
                              alt="Custom QR Kepsek"
                              className="h-20 w-20 object-contain border border-slate-200 rounded p-1 bg-white"
                            />
                            <div className="text-left text-[11px]">
                              <span className="font-bold text-emerald-600 block">✓ Custom QR Kepsek</span>
                              <span className="text-gray-400 text-[10px]">Gambar QR Kustom Aktif</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            📱 QR Code Digital Otomatis Aktif (e-Sign BSRE)
                          </div>
                        )
                      ) : formData.signatureSettings?.mode === 'digital_image' ? (
                        (formData.signatureSettings?.headmasterSignatureImage || formData.signatureSettings?.headmasterSignImage) ? (
                          <img
                            src={formData.signatureSettings.headmasterSignatureImage || formData.signatureSettings.headmasterSignImage}
                            alt="TTD Kepsek"
                            referrerPolicy="no-referrer"
                            className="max-h-20 object-contain"
                          />
                        ) : (
                          <span className="text-[11px] text-gray-400 dark:text-slate-500 italic">
                            Belum ada gambar TTD Digital Kepsek
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-gray-400 dark:text-slate-500 italic">
                          Mode TTD Basah (Tanda tangan manual di kertas)
                        </span>
                      )}
                    </div>

                    {/* Direct Action on Headmaster Card */}
                    <div className="flex items-center gap-2 pt-1">
                      {isAdmin ? (
                        formData.signatureSettings?.mode === 'qr_code' ? (
                          <>
                            <label
                              htmlFor="direct-input-headmaster-qr"
                              className="flex-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs select-none"
                            >
                              <Upload className="w-3 h-3 pointer-events-none" />
                              <span className="pointer-events-none">{formData.signatureSettings?.customHeadmasterQrImage ? 'Ganti QR' : 'Unggah QR Kepsek'}</span>
                              <input
                                id="direct-input-headmaster-qr"
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="sr-only"
                                onChange={(e) => handleDirectImageUpload(e, 'customHeadmasterQrImage')}
                              />
                            </label>
                            {formData.signatureSettings?.customHeadmasterQrImage && (
                              <button
                                type="button"
                                onClick={() => handleResetSignatureField('customHeadmasterQrImage')}
                                className="px-2 py-1 text-rose-500 hover:bg-rose-50 text-[11px] font-bold border border-rose-200 rounded-lg cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </>
                        ) : formData.signatureSettings?.mode === 'digital_image' ? (
                          <>
                            <label
                              htmlFor="direct-input-headmaster-sign"
                              className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs select-none"
                            >
                              <Upload className="w-3 h-3 pointer-events-none" />
                              <span className="pointer-events-none">{formData.signatureSettings?.headmasterSignImage ? 'Ganti TTD' : 'Unggah TTD Kepsek'}</span>
                              <input
                                id="direct-input-headmaster-sign"
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="sr-only"
                                onChange={(e) => handleDirectImageUpload(e, 'headmasterSignImage')}
                              />
                            </label>
                            {formData.signatureSettings?.headmasterSignImage && (
                              <button
                                type="button"
                                onClick={() => handleResetSignatureField('headmasterSignImage')}
                                className="px-2 py-1 text-rose-500 hover:bg-rose-50 text-[11px] font-bold border border-rose-200 rounded-lg cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsSignatureModalOpen(true)}
                            className="w-full px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-[11px] font-bold rounded-lg cursor-pointer transition"
                          >
                            Buka Pengaturan TTD
                          </button>
                        )
                      ) : (
                        <div className="w-full py-1.5 px-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-lg text-center flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-200">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Terkunci (Hanya Admin / Kepala Sekolah)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Teacher Card */}
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                        Tanda Tangan / QR Guru ({effectiveClass}):
                      </span>
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[150px]">
                        {currentUser?.role === 'guru_wali_kelas' ? currentUser.name : formData.teacherName}
                      </span>
                    </div>
                    <div className="h-24 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-center p-2 overflow-hidden">
                      {formData.signatureSettings?.mode === 'qr_code' ? (
                        teacherQr ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={teacherQr}
                              alt="Custom QR Guru"
                              className="h-20 w-20 object-contain border border-slate-200 rounded p-1 bg-white"
                            />
                            <div className="text-left text-[11px]">
                              <span className="font-bold text-emerald-600 block">✓ Custom QR Guru ({effectiveClass})</span>
                              <span className="text-gray-400 text-[10px]">Gambar QR Kustom Aktif</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            📱 QR Code Digital Otomatis Aktif (e-Sign Kemdikbud)
                          </div>
                        )
                      ) : formData.signatureSettings?.mode === 'digital_image' ? (
                        teacherSign ? (
                          <img
                            src={teacherSign}
                            alt="TTD Guru"
                            referrerPolicy="no-referrer"
                            className="max-h-20 object-contain"
                          />
                        ) : (
                          <span className="text-[11px] text-gray-400 dark:text-slate-500 italic">
                            Belum ada gambar TTD Digital Guru ({effectiveClass})
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-gray-400 dark:text-slate-500 italic">
                          Mode TTD Basah (Tanda tangan manual di kertas)
                        </span>
                      )}
                    </div>

                    {/* Direct Action on Teacher Card */}
                    <div className="flex items-center gap-2 pt-1">
                      {formData.signatureSettings?.mode === 'qr_code' ? (
                        <>
                          <label
                            htmlFor="direct-input-teacher-qr"
                            className="flex-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs select-none"
                          >
                            <Upload className="w-3 h-3 pointer-events-none" />
                            <span className="pointer-events-none">{teacherQr ? 'Ganti QR' : `Unggah QR ${effectiveClass}`}</span>
                            <input
                              id="direct-input-teacher-qr"
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              className="sr-only"
                              onChange={(e) => handleDirectImageUpload(e, 'customTeacherQrImage')}
                            />
                          </label>
                          {teacherQr && (
                            <button
                              type="button"
                              onClick={() => handleResetSignatureField('customTeacherQrImage')}
                              className="px-2 py-1 text-rose-500 hover:bg-rose-50 text-[11px] font-bold border border-rose-200 rounded-lg cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </>
                      ) : formData.signatureSettings?.mode === 'digital_image' ? (
                        <>
                          <label
                            htmlFor="direct-input-teacher-sign"
                            className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs select-none"
                          >
                            <Upload className="w-3 h-3 pointer-events-none" />
                            <span className="pointer-events-none">{teacherSign ? 'Ganti TTD' : `Unggah TTD ${effectiveClass}`}</span>
                            <input
                              id="direct-input-teacher-sign"
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              className="sr-only"
                              onChange={(e) => handleDirectImageUpload(e, 'teacherSignImage')}
                            />
                          </label>
                          {teacherSign && (
                            <button
                              type="button"
                              onClick={() => handleResetSignatureField('teacherSignImage')}
                              className="px-2 py-1 text-rose-500 hover:bg-rose-50 text-[11px] font-bold border border-rose-200 rounded-lg cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsSignatureModalOpen(true)}
                          className="w-full px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-[11px] font-bold rounded-lg cursor-pointer transition"
                        >
                          Buka Pengaturan TTD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Action Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                {savedSuccess ? <CheckCircle2 className="w-4 h-4" /> : null}
                {savedSuccess ? 'Pengaturan tanda tangan berhasil disimpan!' : 'Pengaturan otomatis terintegrasi ke seluruh lembar rapor.'}
              </span>

              <button
                type="button"
                id="btn-open-signature-modal"
                onClick={() => setIsSignatureModalOpen(true)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition shadow-xs cursor-pointer flex items-center gap-2"
              >
                <span>🖊️</span>
                <span>Buka Editor / Unggah TTD, QR Code & Stempel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AKUN GURU & PENUGASAN WALI KELAS */}
      {activeSubTab === 'guru' && onUpdateTeachers && (
        <div className="animate-fadeIn">
          <PengaturanGuruSection
            teachers={teachers}
            currentUser={currentUser || defaultAdminTeacher}
            subjects={subjects}
            onUpdateTeachers={onUpdateTeachers}
            onSwitchUser={onSwitchUser}
            onUpdateCurrentTeacherSignature={(name, nip) => {
              setFormData((prev) => ({
                ...prev,
                teacherName: name,
                teacherNIP: nip,
              }));
              onUpdateSchoolProfile({
                ...schoolProfile,
                teacherName: name,
                teacherNIP: nip,
              });
            }}
          />
        </div>
      )}

      {/* SUB-TAB 4: BACKUP & RESTORE DATA JSON */}
      {activeSubTab === 'backup' && (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 sm:p-7 space-y-5 animate-fadeIn transition-colors">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-black text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Backup & Restore Data Sistem (JSON)</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-1">
                Simpan seluruh rekaman nilai, siswa, TP, serta akun guru ke dalam satu file berkas JSON cadangan.
              </p>
            </div>
            <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
              Mandiri & Aman
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Export Button */}
            <div className="p-5 bg-gray-50 dark:bg-slate-800/80 border-2 border-gray-200 dark:border-slate-700 rounded-3xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 font-black text-gray-900 dark:text-white text-sm mb-1">
                  <FileJson className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Ekspor Cadangan Lengkap</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed font-medium">
                  Unduh file <strong>.json</strong> berisi profil sekolah, {students.length} siswa (Kelas 1-6), {subjects.length} mata pelajaran, {grades.length} nilai, dan daftar akun guru.
                </p>
              </div>
              <button
                type="button"
                id="btn-export-backup-json"
                onClick={handleExportSystemJSON}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01]"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Backup JSON</span>
              </button>
            </div>

            {/* Import Uploader */}
            <div className="p-5 bg-gray-50 dark:bg-slate-800/80 border-2 border-gray-200 dark:border-slate-700 rounded-3xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 font-black text-gray-900 dark:text-white text-sm mb-1">
                  <Upload className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Pulihkan dari File Backup</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed font-medium">
                  Pilih file <strong>.json</strong> cadangan iihh Beres untuk memulihkan seluruh basis data aplikasi secara instan.
                </p>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input-backup"
                />
                <button
                  type="button"
                  id="btn-trigger-import-json"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-white border-2 border-gray-300 dark:border-slate-700 rounded-2xl text-xs font-black shadow-xs transition-all hover:scale-[1.01]"
                >
                  <Upload className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Pilih File Backup JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error / Success Notifications */}
          {importError && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importSuccess && (
            <div className="flex items-center gap-2 p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Data sistem berhasil dipulihkan dari file backup JSON!</span>
            </div>
          )}

          {/* Backup Preview Modal / Card before confirming */}
          {pendingBackupData && (
            <div className="p-5 bg-indigo-50 dark:bg-indigo-950/50 border-2 border-indigo-200 dark:border-indigo-800 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-black text-xs">
                <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Konfirmasi Pemulihan Data Cadangan:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white dark:bg-slate-900 p-4 rounded-2xl border border-indigo-100 dark:border-slate-800">
                <div>
                  <span className="text-gray-400 dark:text-slate-500 block text-[11px]">Satuan Pendidikan:</span>
                  <strong className="text-gray-900 dark:text-white">{pendingBackupData.schoolProfile?.schoolName || '-'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-slate-500 block text-[11px]">Total Siswa:</span>
                  <strong className="text-gray-900 dark:text-white">{pendingBackupData.students?.length || 0} Siswa</strong>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-slate-500 block text-[11px]">Total Mapel:</span>
                  <strong className="text-gray-900 dark:text-white">{pendingBackupData.subjects?.length || 0} Mapel</strong>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-slate-500 block text-[11px]">Rekaman Nilai:</span>
                  <strong className="text-gray-900 dark:text-white">{pendingBackupData.grades?.length || 0} Nilai</strong>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingBackupData(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  id="btn-confirm-import-backup"
                  onClick={handleConfirmImport}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
                >
                  Konfirmasi & Terapkan Data
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Pengaturan Tanda Tangan & Stempel Lengkap */}
      {isSignatureModalOpen && (
        <SignatureSettingsModal
          schoolProfile={formData}
          activeClassLevel={activeClassLevel}
          currentUser={currentUser}
          onClose={() => setIsSignatureModalOpen(false)}
          onSave={(updatedProfile) => {
            setFormData(updatedProfile);
            onUpdateSchoolProfile(updatedProfile);
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
          }}
        />
      )}
    </div>
  );
};
