import React, { useState, useRef, useEffect } from 'react';
import { SchoolProfile, SignatureSettings, SignatureMode, ClassLevel, TeacherAccount } from '../types';
import {
  X,
  Check,
  Upload,
  QrCode,
  PenTool,
  FileSignature,
  Stamp,
  Trash2,
  Sparkles,
  Info,
  ShieldCheck,
  RotateCcw,
  Image as ImageIcon,
  Lock,
  Shield,
} from 'lucide-react';
import { generateQrCodeDataUrl, buildQrSignPayload } from '../utils/qrCodeService';
import { compressAndOptimizeImage } from '../utils/imageOptimizer';

interface SignatureSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolProfile: SchoolProfile;
  activeClassLevel?: ClassLevel;
  currentUser?: TeacherAccount | null;
  onSave: (updatedProfile: SchoolProfile) => void;
}

export const SignatureSettingsModal: React.FC<SignatureSettingsModalProps> = ({
  isOpen,
  onClose,
  schoolProfile,
  activeClassLevel = 'Kelas 4',
  currentUser,
  onSave,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const effectiveClass = currentUser?.role === 'guru_wali_kelas' && currentUser.assignedClass
    ? currentUser.assignedClass
    : activeClassLevel;

  const currentSettings: SignatureSettings = schoolProfile.signatureSettings || {
    mode: 'qr_code',
    showSchoolStamp: true,
  };

  // Check if there is a per-class teacher signature configured
  const classSpecificSig = currentSettings.classTeacherSignatures?.[effectiveClass];

  const [mode, setMode] = useState<SignatureMode>(currentSettings.mode || 'qr_code');
  const [teacherSignImage, setTeacherSignImage] = useState<string>(
    classSpecificSig?.teacherSignImage || currentSettings.teacherSignImage || currentSettings.teacherSignatureImage || ''
  );
  const [headmasterSignImage, setHeadmasterSignImage] = useState<string>(
    currentSettings.headmasterSignImage || currentSettings.headmasterSignatureImage || ''
  );
  const [customTeacherQrImage, setCustomTeacherQrImage] = useState<string>(
    classSpecificSig?.customTeacherQrImage || currentSettings.customTeacherQrImage || ''
  );
  const [customHeadmasterQrImage, setCustomHeadmasterQrImage] = useState<string>(
    currentSettings.customHeadmasterQrImage || ''
  );
  const [schoolStampImage, setSchoolStampImage] = useState<string>(
    currentSettings.schoolStampImage || ''
  );
  const [showSchoolStamp, setShowSchoolStamp] = useState<boolean>(
    currentSettings.showSchoolStamp ?? true
  );

  // Sync state when modal opens or effectiveClass changes
  useEffect(() => {
    if (isOpen) {
      const clsSig = schoolProfile.signatureSettings?.classTeacherSignatures?.[effectiveClass];
      setMode(schoolProfile.signatureSettings?.mode || 'qr_code');
      setTeacherSignImage(
        clsSig?.teacherSignImage || schoolProfile.signatureSettings?.teacherSignImage || schoolProfile.signatureSettings?.teacherSignatureImage || ''
      );
      setCustomTeacherQrImage(
        clsSig?.customTeacherQrImage || schoolProfile.signatureSettings?.customTeacherQrImage || ''
      );
      setHeadmasterSignImage(
        schoolProfile.signatureSettings?.headmasterSignImage || schoolProfile.signatureSettings?.headmasterSignatureImage || ''
      );
      setCustomHeadmasterQrImage(
        schoolProfile.signatureSettings?.customHeadmasterQrImage || ''
      );
      setSchoolStampImage(
        schoolProfile.signatureSettings?.schoolStampImage || ''
      );
      setShowSchoolStamp(
        schoolProfile.signatureSettings?.showSchoolStamp ?? true
      );
    }
  }, [isOpen, schoolProfile, effectiveClass]);

  // Canvas drawing state
  const [activeDrawingRole, setActiveDrawingRole] = useState<'teacher' | 'headmaster' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Hidden File input refs for guaranteed click responsiveness
  const teacherQrInputRef = useRef<HTMLInputElement | null>(null);
  const headmasterQrInputRef = useRef<HTMLInputElement | null>(null);
  const teacherSignInputRef = useRef<HTMLInputElement | null>(null);
  const headmasterSignInputRef = useRef<HTMLInputElement | null>(null);
  const schoolStampInputRef = useRef<HTMLInputElement | null>(null);

  // Preview Auto-generated QR code
  const [previewTeacherQr, setPreviewTeacherQr] = useState<string>('');
  const [previewHeadmasterQr, setPreviewHeadmasterQr] = useState<string>('');

  useEffect(() => {
    async function loadQRs() {
      const tPayload = buildQrSignPayload({
        signerRole: 'Guru Kelas / Wali Kelas',
        signerName: schoolProfile.teacherName,
        signerNIP: schoolProfile.teacherNIP,
        schoolName: schoolProfile.schoolName,
        academicYear: schoolProfile.academicYear,
      });
      const hPayload = buildQrSignPayload({
        signerRole: 'Kepala Sekolah',
        signerName: schoolProfile.headmasterName,
        signerNIP: schoolProfile.headmasterNIP,
        schoolName: schoolProfile.schoolName,
        academicYear: schoolProfile.academicYear,
      });

      const [tQr, hQr] = await Promise.all([
        generateQrCodeDataUrl(tPayload),
        generateQrCodeDataUrl(hPayload),
      ]);
      setPreviewTeacherQr(tQr);
      setPreviewHeadmasterQr(hQr);
    }

    if (isOpen) {
      loadQRs();
    }
  }, [isOpen, schoolProfile]);

  if (!isOpen) return null;

  // Generic Image Upload handler with auto-compression & optimization
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimized = await compressAndOptimizeImage(file, {
        maxWidth: 600,
        maxHeight: 350,
        quality: 0.85,
        format: 'image/png',
      });
      setter(optimized.dataUrl);
    } catch (err: any) {
      console.warn("Compression fallback to basic reader:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        setter(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset to allow re-uploading the same file if needed
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (activeDrawingRole === 'teacher') {
      setTeacherSignImage(dataUrl);
    } else if (activeDrawingRole === 'headmaster') {
      setHeadmasterSignImage(dataUrl);
    }
    setActiveDrawingRole(null);
  };

  const handleSave = () => {
    // Preserve other class teacher signatures
    const prevClassSignatures = schoolProfile.signatureSettings?.classTeacherSignatures || {};
    const updatedClassSignatures = {
      ...prevClassSignatures,
      [effectiveClass]: {
        teacherSignImage,
        customTeacherQrImage,
      },
    };

    const updatedSettings: SignatureSettings = {
      mode,
      teacherSignImage,
      headmasterSignImage: isAdmin ? headmasterSignImage : (schoolProfile.signatureSettings?.headmasterSignImage || schoolProfile.signatureSettings?.headmasterSignatureImage || ''),
      customTeacherQrImage,
      customHeadmasterQrImage: isAdmin ? customHeadmasterQrImage : (schoolProfile.signatureSettings?.customHeadmasterQrImage || ''),
      teacherSignatureImage: teacherSignImage,
      headmasterSignatureImage: isAdmin ? headmasterSignImage : (schoolProfile.signatureSettings?.headmasterSignatureImage || schoolProfile.signatureSettings?.headmasterSignImage || ''),
      schoolStampImage: isAdmin ? schoolStampImage : (schoolProfile.signatureSettings?.schoolStampImage || ''),
      showSchoolStamp,
      classTeacherSignatures: updatedClassSignatures,
    };

    onSave({
      ...schoolProfile,
      signatureSettings: updatedSettings,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border-2 border-indigo-100 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 my-auto text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <FileSignature className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Pengaturan Tanda Tangan & Pengesahan Rapor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih format pengesahan: TTD Basah (Manual), Barcode / QR Code e-Sign resmi, atau Scan TTD Digital.
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

        {/* Mode Selector Cards */}
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
            Pilih Format Pengesahan Rapor:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Mode 1: Manual */}
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                mode === 'manual'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  <PenTool className="w-4 h-4" />
                </div>
                {mode === 'manual' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">1. TTD Basah (Manual)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Ruang tanda tangan kosong yang lapang untuk tanda tangan pulpen & cap basah fisik.
                </p>
              </div>
            </button>

            {/* Mode 2: QR Code e-Sign */}
            <button
              type="button"
              onClick={() => setMode('qr_code')}
              className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                mode === 'qr_code'
                  ? 'border-sky-600 bg-sky-50/50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100 shadow-md ring-2 ring-sky-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-sky-600 text-white">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-200 dark:bg-sky-800 text-sky-900 dark:text-sky-100">
                  Resmi Kemdikbud
                </span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">2. Barcode / QR Code e-Sign</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Otomatis terenkripsi atau unggah berkas Barcode / QR Code resmi sekolah sendiri.
                </p>
              </div>
            </button>

            {/* Mode 3: Scan / Draw Digital */}
            <button
              type="button"
              onClick={() => setMode('digital_image')}
              className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                mode === 'digital_image'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <FileSignature className="w-4 h-4" />
                </div>
                {mode === 'digital_image' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">3. Scan TTD & Stempel</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Upload gambar scan tanda tangan / gores di canvas serta stempel cap sekolah.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* MODE 2: QR CODE CONFIGURATION (AUTO OR UPLOAD CUSTOM) */}
        {mode === 'qr_code' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs text-sky-900 dark:text-sky-200">
                <p className="font-bold">Pengaturan Barcode / QR Code Tanda Tangan Elektronik (e-Sign):</p>
                <p className="text-[11px] text-sky-700 dark:text-sky-300 mt-0.5">
                  Anda dapat menggunakan <strong>QR Code Otomatis (Standar Kemdikbud)</strong> atau <strong>Mengunggah Gambar QR Code Resmi Sekolah Sendiri</strong> (PNG/JPG).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Teacher QR Code Box */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-sky-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    QR Guru Kelas: {schoolProfile.teacherName}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
                    {customTeacherQrImage ? 'QR Unggahan' : 'QR Otomatis'}
                  </span>
                </div>

                <div className="h-32 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-sky-300 dark:border-slate-700 flex items-center justify-center p-2">
                  {customTeacherQrImage ? (
                    <img
                      src={customTeacherQrImage}
                      alt="QR Guru Kustom"
                      className="max-h-28 max-w-[120px] object-contain border p-1 rounded-lg bg-white shadow-2xs"
                    />
                  ) : previewTeacherQr ? (
                    <img
                      src={previewTeacherQr}
                      alt="QR Guru Otomatis"
                      className="max-h-28 max-w-[120px] object-contain border p-1 rounded-lg bg-white shadow-2xs"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Memuat QR...</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="modal-input-teacher-qr"
                    className="flex-1 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs select-none"
                  >
                    <Upload className="w-3.5 h-3.5 pointer-events-none" />
                    <span className="pointer-events-none">{customTeacherQrImage ? 'Ganti Berkas QR' : 'Unggah QR Guru'}</span>
                    <input
                      id="modal-input-teacher-qr"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="sr-only"
                      onChange={(e) => handleImageUpload(e, setCustomTeacherQrImage)}
                    />
                  </label>

                  {customTeacherQrImage && (
                    <button
                      type="button"
                      onClick={() => setCustomTeacherQrImage('')}
                      className="px-2.5 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Gunakan QR Otomatis"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Headmaster QR Code Box */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-sky-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    QR Kepala Sekolah: {schoolProfile.headmasterName}
                  </span>
                  <div className="flex items-center gap-1">
                    {!isAdmin && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Admin Only</span>
                      </span>
                    )}
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
                      {customHeadmasterQrImage ? 'QR Unggahan' : 'QR Otomatis'}
                    </span>
                  </div>
                </div>

                <div className="h-32 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-sky-300 dark:border-slate-700 flex items-center justify-center p-2">
                  {customHeadmasterQrImage ? (
                    <img
                      src={customHeadmasterQrImage}
                      alt="QR Kepsek Kustom"
                      className="max-h-28 max-w-[120px] object-contain border p-1 rounded-lg bg-white shadow-2xs"
                    />
                  ) : previewHeadmasterQr ? (
                    <img
                      src={previewHeadmasterQr}
                      alt="QR Kepsek Otomatis"
                      className="max-h-28 max-w-[120px] object-contain border p-1 rounded-lg bg-white shadow-2xs"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Memuat QR...</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <>
                      <label
                        htmlFor="modal-input-headmaster-qr"
                        className="flex-1 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs select-none"
                      >
                        <Upload className="w-3.5 h-3.5 pointer-events-none" />
                        <span className="pointer-events-none">{customHeadmasterQrImage ? 'Ganti Berkas QR' : 'Unggah QR Kepsek'}</span>
                        <input
                          id="modal-input-headmaster-qr"
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          className="sr-only"
                          onChange={(e) => handleImageUpload(e, setCustomHeadmasterQrImage)}
                        />
                      </label>

                      {customHeadmasterQrImage && (
                        <button
                          type="button"
                          onClick={() => setCustomHeadmasterQrImage('')}
                          className="px-2.5 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Gunakan QR Otomatis"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full py-2 px-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-xl text-center flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-200">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>Terkunci: Hanya Admin / Kepala Sekolah yang dapat merubah</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stempel Sekolah Switcher for QR Code mode */}
            <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-white/60 dark:bg-slate-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Stamp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Bubuhkan Cap Stempel Sekolah di Samping QR Kepala Sekolah
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <>
                    <label
                      htmlFor="modal-input-stamp-qr"
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-2xs select-none"
                    >
                      <Upload className="w-3.5 h-3.5 pointer-events-none" />
                      <span className="pointer-events-none">{schoolStampImage ? 'Ganti Cap' : 'Unggah Cap (PNG)'}</span>
                      <input
                        id="modal-input-stamp-qr"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="sr-only"
                        onChange={(e) => handleImageUpload(e, setSchoolStampImage)}
                      />
                    </label>
                    {schoolStampImage && (
                      <button
                        type="button"
                        onClick={() => setSchoolStampImage('')}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Hapus Cap Stempel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <Lock className="w-3 h-3" />
                    <span>Admin</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: DIGITAL SIGNATURE / SCAN / DRAW */}
        {mode === 'digital_image' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Guru Kelas Signature Box */}
              <div className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    TTD Guru Kelas: {schoolProfile.teacherName}
                  </span>
                </div>

                <div className="h-28 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center relative overflow-hidden">
                  {teacherSignImage ? (
                    <img src={teacherSignImage} alt="TTD Guru" className="max-h-24 max-w-[85%] object-contain" />
                  ) : (
                    <div className="text-center p-2 text-slate-400 text-xs">
                      <PenTool className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <span>Belum ada TTD Guru</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="modal-input-teacher-sign"
                    className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs select-none"
                  >
                    <Upload className="w-3.5 h-3.5 pointer-events-none" />
                    <span className="pointer-events-none">Unggah Gambar</span>
                    <input
                      id="modal-input-teacher-sign"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="sr-only"
                      onChange={(e) => handleImageUpload(e, setTeacherSignImage)}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDrawingRole('teacher');
                      setTimeout(clearCanvas, 100);
                    }}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Gores</span>
                  </button>

                  {teacherSignImage && (
                    <button
                      type="button"
                      onClick={() => setTeacherSignImage('')}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition cursor-pointer"
                      title="Hapus TTD"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Kepala Sekolah Signature Box */}
              <div className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    TTD Kepsek: {schoolProfile.headmasterName}
                  </span>
                  {!isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Admin Only</span>
                    </span>
                  )}
                </div>

                <div className="h-28 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center relative overflow-hidden">
                  {headmasterSignImage ? (
                    <img src={headmasterSignImage} alt="TTD Kepsek" className="max-h-24 max-w-[85%] object-contain" />
                  ) : (
                    <div className="text-center p-2 text-slate-400 text-xs">
                      <PenTool className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <span>Belum ada TTD Kepsek</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <>
                      <label
                        htmlFor="modal-input-headmaster-sign"
                        className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs select-none"
                      >
                        <Upload className="w-3.5 h-3.5 pointer-events-none" />
                        <span className="pointer-events-none">Unggah Gambar</span>
                        <input
                          id="modal-input-headmaster-sign"
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          className="sr-only"
                          onChange={(e) => handleImageUpload(e, setHeadmasterSignImage)}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveDrawingRole('headmaster');
                          setTimeout(clearCanvas, 100);
                        }}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Gores</span>
                      </button>

                      {headmasterSignImage && (
                        <button
                          type="button"
                          onClick={() => setHeadmasterSignImage('')}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition cursor-pointer"
                          title="Hapus TTD"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full py-2 px-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-xl text-center flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-200">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>Terkunci: Hanya Admin / Kepala Sekolah yang dapat merubah</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stempel Sekolah (Opsional) */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shrink-0">
                  <Stamp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Stempel Cap Sekolah Resmi</h4>
                  <p className="text-[11px] text-slate-500">
                    Otomatis dibubuhkan di kolom Kepala Sekolah dengan transparansi realistis.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {schoolStampImage && (
                  <img src={schoolStampImage} alt="Stempel" className="w-10 h-10 object-contain border rounded-lg bg-white p-0.5" />
                )}
                {isAdmin ? (
                  <>
                    <label
                      htmlFor="modal-input-stamp-digital"
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-2xs select-none"
                    >
                      <Upload className="w-3.5 h-3.5 pointer-events-none" />
                      <span className="pointer-events-none">{schoolStampImage ? 'Ganti Cap' : 'Upload Cap (PNG)'}</span>
                      <input
                        id="modal-input-stamp-digital"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="sr-only"
                        onChange={(e) => handleImageUpload(e, setSchoolStampImage)}
                      />
                    </label>
                    {schoolStampImage && (
                      <button
                        type="button"
                        onClick={() => setSchoolStampImage('')}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Hapus Stempel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <Lock className="w-3 h-3" />
                    <span>Admin</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Drawing Canvas Overlay */}
        {activeDrawingRole && (
          <div className="p-4 rounded-2xl bg-indigo-900 text-white space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-2">
                <PenTool className="w-4 h-4 text-yellow-300" />
                <span>Goreskan Tanda Tangan ({activeDrawingRole === 'teacher' ? 'Guru' : 'Kepala Sekolah'})</span>
              </span>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-indigo-200 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Bersihkan</span>
              </button>
            </div>

            <div className="bg-white rounded-xl overflow-hidden border-2 border-indigo-400">
              <canvas
                ref={canvasRef}
                width={500}
                height={160}
                className="w-full h-36 touch-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveDrawingRole(null)}
                className="px-3 py-1.5 text-xs text-indigo-200 hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveDrawnSignature}
                className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-black font-black text-xs rounded-xl shadow cursor-pointer"
              >
                Simpan Goresan TTD
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 font-medium">
            Format Terpilih: <strong>{mode === 'manual' ? 'TTD Basah (Manual)' : mode === 'qr_code' ? 'Barcode / QR Code e-Sign' : 'Gambar Digital & Stempel'}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-600/25 transition hover:scale-[1.02] cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan ke Rapor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
