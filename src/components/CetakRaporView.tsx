import React, { useState, useEffect } from 'react';
import {
  MataPelajaran,
  NilaiSiswaMapel,
  RaporSiswaDetail,
  SchoolProfile,
  Student,
  ClassLevel,
  P5Project,
  P5StudentScore,
  getFaseByClass,
  isIPASActiveForClass,
} from '../types';
import { getSubjectsForClass } from '../data/initialData';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Printer,
  FileDown,
  User,
  CheckCircle2,
  QrCode,
  Shield,
  Layers,
  ChevronLeft,
  ChevronRight,
  Search,
  GraduationCap,
  Edit3,
  Save,
  Check,
  X,
  Info,
  Download,
  FileSpreadsheet,
  Maximize2,
  FileText,
  Compass,
  Award,
  BookOpen,
  HelpCircle,
  FileCheck,
  ExternalLink,
  Sparkles,
  Users,
  AlertTriangle,
  CalendarCheck,
} from 'lucide-react';
import { downloadExcelTemplate, exportClassDataToExcel } from '../utils/excelService';
import { openPrintWindow, downloadReportAsHtmlFile } from '../utils/printReportService';
import { SignatureSettingsModal } from './SignatureSettingsModal';
import { OgomojoloSyncModal } from './OgomojoloSyncModal';
import { generateQrCodeDataUrl, buildQrSignPayload } from '../utils/qrCodeService';
import { SignatureMode } from '../types';

interface CetakRaporViewProps {
  students: Student[];
  subjects: MataPelajaran[];
  grades: NilaiSiswaMapel[];
  schoolProfile: SchoolProfile;
  raporDetails: Record<string, RaporSiswaDetail>;
  p5Projects?: P5Project[];
  p5Scores?: P5StudentScore[];
  activeClassLevel?: ClassLevel;
  currentUser?: any;
  initialStudentId?: string;
  onSelectClassLevel?: (classLevel: ClassLevel) => void;
  onUpdateRaporDetail: (studentId: string, detail: RaporSiswaDetail) => void;
  onUpdateAllRaporDetails?: (newDetails: Record<string, RaporSiswaDetail>) => void;
  onUpdateStudent?: (student: Student) => void;
  onUpdateSchoolProfile?: (profile: SchoolProfile) => void;
  onRegisterStudentsFromOgomojolo?: (students: Student[], raporDetails: Record<string, RaporSiswaDetail>) => void;
  onClearAllDummyData?: () => void;
}

export type PaperSize = 'F4';
export type DocumentTab = 'nilai' | 'cover' | 'identitas' | 'p5' | 'petunjuk' | 'bundle';

export const CetakRaporView: React.FC<CetakRaporViewProps> = ({
  students,
  subjects,
  grades,
  schoolProfile,
  raporDetails,
  p5Projects = [],
  p5Scores = [],
  activeClassLevel = 'Kelas 4',
  currentUser,
  initialStudentId,
  onSelectClassLevel,
  onUpdateRaporDetail,
  onUpdateAllRaporDetails,
  onUpdateStudent,
  onUpdateSchoolProfile,
  onRegisterStudentsFromOgomojolo,
  onClearAllDummyData,
}) => {
  const classLevels: ClassLevel[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
  const currentFase = getFaseByClass(activeClassLevel);
  const isIPASVisible = isIPASActiveForClass(activeClassLevel);

  // Filter students by active class level
  const classStudents = students.filter(
    (std) => std.gradeLevel === activeClassLevel || (!std.gradeLevel && activeClassLevel === 'Kelas 4')
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (initialStudentId && classStudents.some((s) => s.id === initialStudentId)) {
      return initialStudentId;
    }
    return classStudents[0]?.id || students[0]?.id || 'std-1';
  });

  // Active document tab
  const [docTab, setDocTab] = useState<DocumentTab>('nilai');

  // Paper Size strictly locked to 'F4' (215x330mm / Folio) standard
  const paperSize: PaperSize = 'F4';

  // Keep selectedStudentId valid
  useEffect(() => {
    if (initialStudentId && classStudents.some((s) => s.id === initialStudentId)) {
      setSelectedStudentId(initialStudentId);
    } else if (classStudents.length > 0 && !classStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(classStudents[0].id);
    }
  }, [activeClassLevel, classStudents, selectedStudentId, initialStudentId]);

  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [isEditingBiodata, setIsEditingBiodata] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [isOgomojoloModalOpen, setIsOgomojoloModalOpen] = useState<boolean>(false);
  const [isEditingPresensi, setIsEditingPresensi] = useState<boolean>(false);
  const [printSuccessToast, setPrintSuccessToast] = useState<string | null>(null);

  // Pre-generate QR Code e-Sign
  const [teacherQrCode, setTeacherQrCode] = useState<string>('');
  const [headmasterQrCode, setHeadmasterQrCode] = useState<string>('');

  const currentSignatureMode: SignatureMode = schoolProfile.signatureSettings?.mode || 'qr_code';

  const currentStudent = classStudents.find((s) => s.id === selectedStudentId) || classStudents[0] || students[0];

  useEffect(() => {
    let isMounted = true;
    async function generateQRs() {
      const tPayload = buildQrSignPayload({
        signerRole: 'Guru Kelas / Wali Kelas',
        signerName: schoolProfile.teacherName,
        signerNIP: schoolProfile.teacherNIP,
        schoolName: schoolProfile.schoolName,
        studentName: currentStudent?.name,
        academicYear: schoolProfile.academicYear,
        date: schoolProfile.placeDate,
      });
      const hPayload = buildQrSignPayload({
        signerRole: 'Kepala Sekolah',
        signerName: schoolProfile.headmasterName,
        signerNIP: schoolProfile.headmasterNIP,
        schoolName: schoolProfile.schoolName,
        studentName: currentStudent?.name,
        academicYear: schoolProfile.academicYear,
        date: schoolProfile.placeDate,
      });

      const [tQr, hQr] = await Promise.all([
        generateQrCodeDataUrl(tPayload),
        generateQrCodeDataUrl(hPayload),
      ]);
      if (isMounted) {
        setTeacherQrCode(tQr);
        setHeadmasterQrCode(hQr);
      }
    }
    generateQRs();
    return () => {
      isMounted = false;
    };
  }, [schoolProfile, currentStudent]);

  // Biodata edit form state
  const [bioForm, setBioForm] = useState<Student>(currentStudent || ({} as Student));

  useEffect(() => {
    if (currentStudent) {
      setBioForm(currentStudent);
    }
  }, [currentStudent]);

  const handleQuickChangeSignatureMode = (mode: SignatureMode) => {
    if (onUpdateSchoolProfile) {
      onUpdateSchoolProfile({
        ...schoolProfile,
        signatureSettings: {
          ...(schoolProfile.signatureSettings || {}),
          mode,
        },
      });
      setPrintSuccessToast(`Format tanda tangan diubah ke: ${mode === 'manual' ? 'TTD Basah (Manual)' : mode === 'qr_code' ? 'Barcode / QR Code e-Sign' : 'Gambar TTD & Stempel'}`);
      setTimeout(() => setPrintSuccessToast(null), 3000);
    }
  };

  // Reusable Signature Renderer with anti-split protection and calibrated F4 height
  const renderSignatureBlock = (
    role: 'parent' | 'teacher' | 'headmaster',
    titleTop: React.ReactNode,
    name: string,
    nip?: string,
    studentParentName?: string
  ) => {
    const mode = currentSignatureMode;
    const showStamp = schoolProfile.signatureSettings?.showSchoolStamp ?? true;
    
    // Check if there is a class-specific teacher signature for activeClassLevel
    const classSig = schoolProfile.signatureSettings?.classTeacherSignatures?.[activeClassLevel];
    const teacherImg = classSig?.teacherSignImage || schoolProfile.signatureSettings?.teacherSignImage || schoolProfile.signatureSettings?.teacherSignatureImage;
    const headmasterImg = schoolProfile.signatureSettings?.headmasterSignImage || schoolProfile.signatureSettings?.headmasterSignatureImage;
    const stampImg = schoolProfile.signatureSettings?.schoolStampImage;
    const teacherQrToUse = classSig?.customTeacherQrImage || schoolProfile.signatureSettings?.customTeacherQrImage || teacherQrCode;
    const headmasterQrToUse = schoolProfile.signatureSettings?.customHeadmasterQrImage || headmasterQrCode;

    return (
      <div 
        className="flex flex-col justify-between items-center text-center font-sans text-xs min-h-[155px] h-full break-inside-avoid"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        {/* Title / Titimangsa */}
        <div className="min-h-[34px] flex items-center justify-center font-medium text-slate-800 text-center leading-tight">
          <div>{titleTop}</div>
        </div>

        {/* Signature Space / Area */}
        <div className="h-20 sm:h-24 w-full flex items-center justify-center relative my-1">
          {role === 'parent' ? (
            <div className="w-full h-full flex items-center justify-center" />
          ) : role === 'teacher' ? (
            mode === 'qr_code' && teacherQrToUse ? (
              <div className="flex flex-col items-center justify-center">
                <img
                  src={teacherQrToUse}
                  alt="QR TTD Guru"
                  className="w-16 h-16 sm:w-18 sm:h-18 object-contain p-0.5 border border-slate-300 rounded bg-white shadow-2xs"
                />
                <span className="text-[8px] text-slate-500 font-mono tracking-tighter uppercase mt-0.5">
                  e-Sign Kemdikbud
                </span>
              </div>
            ) : mode === 'digital_image' && teacherImg ? (
              <img src={teacherImg} alt="TTD Guru" className="max-h-18 max-w-[130px] object-contain" />
            ) : (
              <div className="w-full h-full" />
            )
          ) : (
            // Headmaster
            mode === 'qr_code' && headmasterQrToUse ? (
              <div className="flex flex-col items-center justify-center relative">
                <img
                  src={headmasterQrToUse}
                  alt="QR TTD Kepsek"
                  className="w-16 h-16 sm:w-18 sm:h-18 object-contain p-0.5 border border-slate-300 rounded bg-white shadow-2xs z-10"
                />
                <span className="text-[8px] text-slate-500 font-mono tracking-tighter uppercase mt-0.5 z-10">
                  e-Sign BSRE
                </span>
                {showStamp && stampImg && (
                  <img
                    src={stampImg}
                    alt="Stempel Sekolah"
                    className="absolute -left-6 -top-2 w-18 h-18 object-contain opacity-75 pointer-events-none rotate-[-8deg] z-20"
                  />
                )}
              </div>
            ) : mode === 'digital_image' && headmasterImg ? (
              <div className="relative flex items-center justify-center">
                <img src={headmasterImg} alt="TTD Kepsek" className="max-h-18 max-w-[130px] object-contain z-10" />
                {showStamp && stampImg && (
                  <img
                    src={stampImg}
                    alt="Stempel Sekolah"
                    className="absolute -left-7 -top-3 w-18 h-18 object-contain opacity-80 pointer-events-none rotate-[-10deg] z-20"
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center">
                {showStamp && stampImg && (
                  <img
                    src={stampImg}
                    alt="Stempel Sekolah"
                    className="absolute left-1/4 top-1 w-18 h-18 object-contain opacity-65 pointer-events-none rotate-[-8deg]"
                  />
                )}
              </div>
            )
          )}
        </div>

        {/* Name and NIP */}
        <div className="w-full">
          {role === 'parent' ? (
            <p className="border-b border-slate-400 pb-0.5 font-bold text-slate-900 mx-auto max-w-[190px]">
              ( {studentParentName || '.........................'} )
            </p>
          ) : (
            <div>
              <p className="font-bold underline uppercase text-slate-950 text-xs">{name}</p>
              {nip && <p className="text-[10px] text-slate-600 font-mono">NIP. {nip}</p>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleSaveBiodata = () => {
    if (onUpdateStudent && bioForm) {
      onUpdateStudent(bioForm);
      setIsEditingBiodata(false);
      setPrintSuccessToast(`Biodata ${bioForm.name} berhasil diperbarui!`);
      setTimeout(() => setPrintSuccessToast(null), 3000);
    }
  };

  const getDocTitle = () => {
    switch (docTab) {
      case 'cover': return 'Sampul Rapor';
      case 'identitas': return 'Identitas Peserta Didik';
      case 'nilai': return 'Lembar Nilai Rapor';
      case 'p5': return 'Rapor Projek P5';
      case 'petunjuk': return 'Petunjuk Penggunaan Rapor';
      case 'bundle': return 'Rapor Lengkap (Semua Berkas)';
      default: return 'Laporan Hasil Belajar';
    }
  };

  // Method 1: Open dedicated printable window (100% works bypassing iframe restrictions)
  const handlePrintInNewTab = () => {
    const el = document.getElementById('printable-document-area');
    if (!el) {
      setPrintSuccessToast('Area dokumen rapor tidak ditemukan');
      return;
    }

    const docName = getDocTitle();
    const title = `${docName} - ${currentStudent?.name || activeClassLevel} (${activeClassLevel})`;
    const success = openPrintWindow(el.innerHTML, title, paperSize);
    if (success) {
      setPrintSuccessToast('Membuka jendela cetak mandiri di tab baru...');
      setTimeout(() => setPrintSuccessToast(null), 3500);
      setIsPrintModalOpen(false);
    } else {
      setPrintSuccessToast('Jendela popup diblokir peramban. Silakan gunakan tombol "Unduh File Rapor"');
      setTimeout(() => setPrintSuccessToast(null), 4000);
    }
  };

  // Method 2: Download standalone HTML report file
  const handleDownloadReportFile = () => {
    const el = document.getElementById('printable-document-area');
    if (!el) return;

    const studentSafeName = (currentStudent?.name || 'Siswa').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Rapor_${studentSafeName}_${(activeClassLevel || 'Kelas').replace(/\s+/g, '_')}_${docTab}.html`;
    const title = `${getDocTitle()} - ${currentStudent?.name || activeClassLevel} - ${schoolProfile.schoolName}`;

    downloadReportAsHtmlFile(el.innerHTML, filename, title, paperSize);
    setPrintSuccessToast(`Berkas siap cetak "${filename}" berhasil diunduh!`);
    setTimeout(() => setPrintSuccessToast(null), 3500);
    setIsPrintModalOpen(false);
  };

  // Method 3: Browser native print with fallback prompt
  const handleNativePrint = () => {
    setPrintSuccessToast('Memicu dialog cetak browser...');
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Print trigger error:', err);
      }
      setPrintSuccessToast(null);
      setIsPrintModalOpen(false);
    }, 300);
  };

  // Render Cover Depan Rapor Resmi
  const renderCover = (student: Student) => {
    return (
      <div className="bg-white text-slate-900 p-8 sm:p-12 border-4 border-double border-slate-900 rounded-2xl shadow-xl min-h-[900px] flex flex-col justify-between items-center text-center font-serif relative">
        {/* Top Header */}
        <div className="space-y-4 pt-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-slate-100 border-2 border-slate-800 flex items-center justify-center p-3">
            <GraduationCap className="w-16 h-16 text-slate-800" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900">
            LAPORAN HASIL BELAJAR
          </h2>
          <h3 className="text-lg font-bold uppercase tracking-widest text-slate-700">
            PESERTA DIDIK SEKOLAH DASAR (SD)
          </h3>
          <p className="text-xs font-sans font-bold text-slate-600 uppercase tracking-widest">
            KURIKULUM MERDEKA
          </p>
        </div>

        {/* Center Student Info Box */}
        <div className="w-full max-w-md my-8 space-y-6">
          <div className="p-6 border-2 border-slate-800 rounded-2xl bg-slate-50 space-y-3 font-sans">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nama Lengkap Peserta Didik:</span>
              <span className="text-xl font-black text-slate-950 uppercase">{student?.name}</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nomor Induk Siswa Nasional (NISN):</span>
              <span className="text-lg font-black font-mono text-slate-900">{student?.nisn}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nomor Induk Siswa (NIS):</span>
              <span className="text-base font-bold font-mono text-slate-800">{student?.nis}</span>
            </div>
          </div>
        </div>

        {/* Bottom School Info */}
        <div className="space-y-2 pb-4 font-sans">
          <h4 className="text-base font-black uppercase text-slate-900">
            {schoolProfile.schoolName}
          </h4>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {schoolProfile.address}, {schoolProfile.village}, {schoolProfile.district}, {schoolProfile.city}
          </p>
          <p className="text-xs font-mono font-bold text-slate-500">
            NPSN: {schoolProfile.npsn} • NSS: {schoolProfile.nss}
          </p>
          <p className="text-xs font-bold text-slate-800 pt-2">
            TAHUN AJARAN {schoolProfile.academicYear}
          </p>
        </div>
      </div>
    );
  };

  // Render Lembar Identitas Peserta Didik Lengkap
  const renderIdentitas = (student: Student) => {
    if (!student) return null;
    const detail = raporDetails[student.id] || {
      studentId: student.id,
      catatanWaliKelas: '',
      statusKenaikan: 'Naik ke Kelas Berikutnya',
      ekstrakurikuler: [],
      presensi: { sakit: 0, izin: 0, tanpaKeterangan: 0 },
    };

    return (
      <div className="bg-white text-slate-900 p-6 sm:p-10 border border-slate-300 rounded-2xl shadow-xl space-y-6 font-sans text-xs">
        {/* Header */}
        <div className="text-center pb-3 border-b-2 border-slate-800 space-y-1">
          <h3 className="text-base font-black uppercase tracking-wider text-slate-950">
            KETERANGAN TENTANG DIRI PESERTA DIDIK
          </h3>
          <p className="text-slate-600 text-[11px]">
            Lembar Biodata Resmi Satuan Pendidikan Kurikulum Merdeka
          </p>
        </div>

        {/* Biodata Table (16 Item Standar Buku Induk / Dapodik) */}
        <table className="w-full border-collapse">
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="py-2 w-8 font-bold text-slate-500">1.</td>
              <td className="py-2 w-48 font-medium text-slate-700">Nama Lengkap Peserta Didik</td>
              <td className="py-2 font-bold text-slate-950">: {student.name}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">2.</td>
              <td className="py-2 font-medium text-slate-700">Nomor Induk Siswa Nasional (NISN)</td>
              <td className="py-2 font-mono font-bold text-slate-900">: {student.nisn}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">3.</td>
              <td className="py-2 font-medium text-slate-700">Nomor Induk Siswa (NIS)</td>
              <td className="py-2 font-mono text-slate-900">: {student.nis}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">4.</td>
              <td className="py-2 font-medium text-slate-700">Nomor Induk Kependudukan (NIK)</td>
              <td className="py-2 font-mono text-slate-900">: {student.nik || '3171012345670001'}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">5.</td>
              <td className="py-2 font-medium text-slate-700">Tempat, Tanggal Lahir</td>
              <td className="py-2 font-medium text-slate-900">: {student.birthPlace || 'Jakarta'}, {student.birthDate || '12 Agustus 2014'}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">6.</td>
              <td className="py-2 font-medium text-slate-700">Jenis Kelamin</td>
              <td className="py-2 text-slate-900">: {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">7.</td>
              <td className="py-2 font-medium text-slate-700">Agama dan Kepercayaan</td>
              <td className="py-2 text-slate-900">: {student.religion || 'Islam'}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">8.</td>
              <td className="py-2 font-medium text-slate-700">Pendidikan Sebelumnya / TK</td>
              <td className="py-2 text-slate-900">: {student.previousSchool || 'TK / PAUD Kartini'}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">9.</td>
              <td className="py-2 font-medium text-slate-700">Alamat Tempat Tinggal Siswa</td>
              <td className="py-2 text-slate-900">: {student.address || 'Jl. Pendidikan No. 12, Jakarta'}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">10.</td>
              <td className="py-2 font-medium text-slate-700">Nama Ayah Kandung</td>
              <td className="py-2 font-medium text-slate-900">: {student.fatherName || student.parentName || 'Fauzan Pratama'}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">11.</td>
              <td className="py-2 font-medium text-slate-700">Pekerjaan Ayah</td>
              <td className="py-2 text-slate-900">: {student.fatherJob || 'Karyawan Swasta'}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">12.</td>
              <td className="py-2 font-medium text-slate-700">Nama Ibu Kandung</td>
              <td className="py-2 font-medium text-slate-900">: {student.motherName || 'Siti Aminah'}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">13.</td>
              <td className="py-2 font-medium text-slate-700">Pekerjaan Ibu</td>
              <td className="py-2 text-slate-900">: {student.motherJob || 'Ibu Rumah Tangga'}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">14.</td>
              <td className="py-2 font-medium text-slate-700">Nomor Telepon / WhatsApp Orang Tua</td>
              <td className="py-2 font-mono text-slate-900">: {student.parentPhone}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-slate-500">15.</td>
              <td className="py-2 font-medium text-slate-700">Tinggi & Berat Badan</td>
              <td className="py-2 text-slate-900">: {detail.tinggiBadan || 135} cm / {detail.beratBadan || 32} kg</td>
            </tr>
          </tbody>
        </table>

        {/* Pas Foto & Tanda Tangan */}
        <div 
          className="pt-8 grid grid-cols-2 items-center text-center gap-6 border-t border-slate-200 mt-6 break-inside-avoid"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          <div className="flex justify-center">
            <div className="w-28 h-36 border-2 border-dashed border-slate-400 rounded-lg flex flex-col items-center justify-center text-slate-400 text-[10px] p-2 bg-slate-50">
              <User className="w-8 h-8 mb-1 text-slate-300" />
              <span>Pas Foto Siswa</span>
              <span>3 x 4 cm</span>
            </div>
          </div>

          <div>
            {renderSignatureBlock(
              'headmaster',
              <>
                <p>{schoolProfile.placeDate}</p>
                <p>Kepala {schoolProfile.schoolName},</p>
              </>,
              schoolProfile.headmasterName,
              schoolProfile.headmasterNIP
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Lembar Rapor Projek P5
  const renderRaporP5 = (student: Student) => {
    if (!student) return null;
    const classP5 = p5Projects.filter((p) => p.classLevel === activeClassLevel);

    return (
      <div className="bg-white text-slate-900 p-6 sm:p-10 border border-slate-300 rounded-2xl shadow-xl space-y-6 font-sans text-xs">
        {/* Header */}
        <div className="text-center pb-3 border-b-2 border-slate-800 space-y-1">
          <h3 className="text-base font-black uppercase tracking-wider text-slate-950">
            RAPOR PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5)
          </h3>
          <p className="text-slate-600 text-[11px]">
            {schoolProfile.schoolName} • Tahun Ajaran {schoolProfile.academicYear}
          </p>
        </div>

        {/* Student Info Box */}
        <div className="grid grid-cols-2 gap-4 border-y border-slate-300 py-2.5 text-xs">
          <div>
            <div className="flex"><span className="w-28 text-slate-500">Nama Siswa:</span><span className="font-bold">: {student.name}</span></div>
            <div className="flex"><span className="w-28 text-slate-500">NISN / NIS:</span><span className="font-mono">: {student.nisn} / {student.nis}</span></div>
          </div>
          <div>
            <div className="flex"><span className="w-28 text-slate-500">Kelas / Fase:</span><span className="font-bold">: {student.gradeLevel || activeClassLevel} / {currentFase}</span></div>
            <div className="flex"><span className="w-28 text-slate-500">Semester:</span><span>: {schoolProfile.semester}</span></div>
          </div>
        </div>

        {/* P5 Projects List & Matrix */}
        {classP5.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl">
            Belum ada Projek P5 yang dikonfigurasi untuk {activeClassLevel}. Buat projek di modul <strong>Projek P5</strong>.
          </div>
        ) : (
          classP5.map((proj, pIdx) => {
            const studentScore = p5Scores.find((s) => s.studentId === student.id && s.projectId === proj.id);

            return (
              <div key={proj.id} className="space-y-3 p-4 border border-slate-300 rounded-xl bg-slate-50/40 break-inside-avoid" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-sm">
                    Projek {pIdx + 1}: {proj.title}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px]">
                    Tema: {proj.theme}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 italic">{proj.description}</p>

                {/* Rubrik Table */}
                <table className="w-full border border-slate-400 text-xs mt-2 bg-white">
                  <thead className="bg-slate-100 border-b border-slate-400 font-bold text-center">
                    <tr>
                      <th className="p-2 text-left border-r border-slate-400">Dimensi & Target Capaian Sub-Elemen</th>
                      <th className="p-2 border-r border-slate-400 w-12" title="Mulai Berkembang">MB</th>
                      <th className="p-2 border-r border-slate-400 w-12" title="Sedang Berkembang">SB</th>
                      <th className="p-2 border-r border-slate-400 w-12" title="Berkembang Sesuai Harapan">BSH</th>
                      <th className="p-2 w-12" title="Sangat Berkembang">SAB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {proj.dimensions.flatMap((dim) =>
                      dim.subElements.map((sub) => {
                        const scoreVal = studentScore?.scores?.[sub.id] || 'BSH';
                        return (
                          <tr key={sub.id} className="align-middle">
                            <td className="p-2 border-r border-slate-300">
                              <span className="font-bold text-slate-900 block">{sub.title}</span>
                              <span className="text-[10px] text-slate-500">{sub.targetCapai}</span>
                            </td>
                            <td className="p-2 border-r border-slate-300 text-center font-bold">
                              {scoreVal === 'MB' ? '✓' : ''}
                            </td>
                            <td className="p-2 border-r border-slate-300 text-center font-bold">
                              {scoreVal === 'SB' ? '✓' : ''}
                            </td>
                            <td className="p-2 border-r border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/50">
                              {scoreVal === 'BSH' ? '✓' : ''}
                            </td>
                            <td className="p-2 text-center font-bold text-indigo-700 bg-indigo-50/50">
                              {scoreVal === 'SAB' ? '✓' : ''}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Catatan Proses */}
                <div className="p-2.5 border border-slate-300 rounded bg-white text-[11px] space-y-1">
                  <span className="font-bold text-slate-800 block">Catatan Proses Fasilitator / Guru:</span>
                  <p className="italic text-slate-700">
                    "{studentScore?.catatanProses || 'Peserta didik aktif berpartisipasi dan mampu merealisasikan ide proyek dengan baik.'}"
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Signatures */}
        <div 
          className="pt-8 grid grid-cols-2 text-center gap-6 border-t border-slate-200 mt-6 break-inside-avoid"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          {renderSignatureBlock(
            'parent',
            <>Mengetahui,<br />Orang Tua / Wali Murid</>,
            '',
            undefined,
            student.parentName
          )}

          {renderSignatureBlock(
            'teacher',
            <>{schoolProfile.placeDate}<br />Koordinator Projek / Guru Kelas,</>,
            schoolProfile.teacherName,
            schoolProfile.teacherNIP
          )}
        </div>
      </div>
    );
  };

  // Render Petunjuk Penggunaan Rapor
  const renderPetunjuk = () => {
    return (
      <div className="bg-white text-slate-900 p-6 sm:p-10 border border-slate-300 rounded-2xl shadow-xl space-y-6 font-sans text-xs">
        <div className="text-center pb-3 border-b-2 border-slate-800 space-y-1">
          <h3 className="text-base font-black uppercase tracking-wider text-slate-950">
            PETUNJUK PENGGUNAAN LAPORAN HASIL BELAJAR (E-RAPOR)
          </h3>
          <p className="text-slate-600 text-[11px]">
            Panduan Penilaian & Skala Nilai Kurikulum Merdeka Jenjang Sekolah Dasar
          </p>
        </div>

        <div className="space-y-4 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">1. Prinsip Penilaian Kurikulum Merdeka</h4>
            <p className="text-slate-700">
              Penilaian merupakan bagian terpadu dari proses pembelajaran, memfasilitasi pembelajaran, dan menyediakan informasi yang holistik sebagai umpan balik untuk pendidik, peserta didik, dan orang tua/wali agar dapat memandu mereka dalam menentukan strategi pembelajaran selanjutnya.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">2. Rentang Nilai Akhir & Predikat</h4>
            <table className="w-full border border-slate-400 text-xs">
              <thead className="bg-slate-100 font-bold border-b border-slate-400">
                <tr>
                  <th className="p-2 border-r border-slate-400 text-left">Rentang Nilai</th>
                  <th className="p-2 border-r border-slate-400 text-left">Predikat Capaian</th>
                  <th className="p-2 text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">86 – 100</td>
                  <td className="p-2 border-r border-slate-300 font-bold text-indigo-700">Sangat Baik (A)</td>
                  <td className="p-2 text-slate-600">Menunjukkan penguasaan kompetensi yang sangat optimal dan mandiri.</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">75 – 85</td>
                  <td className="p-2 border-r border-slate-300 font-bold text-emerald-700">Baik (B)</td>
                  <td className="p-2 text-slate-600">Menunjukkan penguasaan kompetensi yang baik dan konsisten.</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">60 – 74</td>
                  <td className="p-2 border-r border-slate-300 font-bold text-amber-700">Cukup (C)</td>
                  <td className="p-2 text-slate-600">Mencapai kriteria ketuntasan minimal dengan bimbingan reguler.</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">&lt; 60</td>
                  <td className="p-2 border-r border-slate-300 font-bold text-rose-700">Perlu Bimbingan (D)</td>
                  <td className="p-2 text-slate-600">Belum mencapai ketuntasan tujuan pembelajaran, memerlukan remedial.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">3. Keterangan Rubrik Projek P5</h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li><strong>MB (Mulai Berkembang):</strong> Peserta didik masih memerlukan bimbingan penuh dalam memulai inisiatif proyek.</li>
              <li><strong>SB (Sedang Berkembang):</strong> Peserta didik mulai menunjukkan kemampuan namun belum konsisten.</li>
              <li><strong>BSH (Berkembang Sesuai Harapan):</strong> Peserta didik telah mencapai target capaian fase secara mandiri.</li>
              <li><strong>SAB (Sangat Berkembang):</strong> Peserta didik melampaui target capaian fase dan mampu menginspirasi teman sebayanya.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Render Rapor Capaian Hasil Belajar Siswa (Lembar Nilai)
  const renderNilaiRapor = (student: Student) => {
    if (!student) return null;
    const detail = raporDetails[student.id] || {
      studentId: student.id,
      catatanWaliKelas: 'Menunjukkan perkembangan belajar yang baik dan berpartisipasi aktif.',
      statusKenaikan: 'Naik ke Kelas Berikutnya',
      ekstrakurikuler: [
        { id: 'ekskul-1', name: 'Pramuka', predicate: 'Baik', description: 'Aktif mengikuti kegiatan regu penggalang.' },
      ],
      presensi: { sakit: 0, izin: 0, tanpaKeterangan: 0 },
    };

    const studentGrades = getSubjectsForClass(subjects, (student.gradeLevel as ClassLevel) || activeClassLevel).map((subject) => {
      const g = grades.find((gr) => gr.studentId === student.id && gr.subjectId === subject.id);
      return {
        subject,
        nilaiAkhir: g?.nilaiAkhir ?? 82,
        narasi: g?.narasiRapor || `Menunjukkan penguasaan kompetensi yang baik dalam materi ${subject.name}.`,
      };
    });

    return (
      <div className="bg-white text-slate-900 p-6 sm:p-10 border border-slate-300 rounded-2xl shadow-xl space-y-6 font-sans text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center p-1.5">
              <GraduationCap className="w-7 h-7 text-slate-800" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase text-slate-900">
                {schoolProfile.schoolName}
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                NPSN: {schoolProfile.npsn} • {schoolProfile.city}
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-0.5">
          <h3 className="text-base font-black uppercase tracking-wider underline">
            LAPORAN HASIL BELAJAR (RAPOR)
          </h3>
          <p className="text-xs font-sans text-slate-600">
            Kurikulum Merdeka Pendidikan Dasar
          </p>
        </div>

        {/* Student Biodata Box */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs font-sans border-y border-slate-300 py-3">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 text-slate-600">Nama Peserta Didik</span>
              <span className="font-bold text-slate-950">: {student.name}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">NISN / NIS</span>
              <span className="font-mono">: {student.nisn} / {student.nis}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Sekolah</span>
              <span>: {schoolProfile.schoolName}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 text-slate-600">Kelas / Fase</span>
              <span className="font-bold">: {student.gradeLevel || activeClassLevel} / {student.fase || currentFase}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Semester</span>
              <span>: {schoolProfile.semester}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Tahun Ajaran</span>
              <span>: {schoolProfile.academicYear}</span>
            </div>
          </div>
        </div>

        {/* Section A: Tabel Nilai & Capaian Pembelajaran */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold font-sans uppercase text-slate-800">
            A. Nilai Akhir & Capaian Kompetensi Pembelajaran
          </h4>
          <table className="w-full border border-slate-400 text-xs font-sans">
            <thead className="bg-slate-100 text-slate-900 border-b border-slate-400 font-bold text-center">
              <tr>
                <th className="border-r border-slate-400 p-2 w-10">No</th>
                <th className="border-r border-slate-400 p-2 text-left min-w-[160px]">Mata Pelajaran</th>
                <th className="border-r border-slate-400 p-2 w-16">Nilai Akhir</th>
                <th className="p-2 text-left">Capaian Kompetensi (Deskripsi Naratif Kemdikbudristek)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {studentGrades.map((item, idx) => (
                <tr key={item.subject.id} className="align-top">
                  <td className="border-r border-slate-300 p-2 text-center font-bold text-slate-600">{idx + 1}</td>
                  <td className="border-r border-slate-300 p-2 font-bold text-slate-900">
                    {item.subject.name}
                  </td>
                  <td className="border-r border-slate-300 p-2 text-center font-black text-slate-950 bg-slate-50">
                    {item.nilaiAkhir}
                  </td>
                  <td className="p-2 text-[11px] text-slate-800 leading-relaxed">
                    {item.narasi}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Administrative & Signature Block - Kept solidly intact with break-inside-avoid */}
        <div 
          className="space-y-4 break-inside-avoid"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          {/* Section B: Ekstrakurikuler & Presensi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
            {/* Ekstrakurikuler */}
            <div className="space-y-1.5">
              <h4 className="font-bold uppercase text-slate-800">B. Kegiatan Ekstrakurikuler</h4>
              <table className="w-full border border-slate-400">
                <thead className="bg-slate-100 font-bold border-b border-slate-400 text-left">
                  <tr>
                    <th className="p-1.5 border-r border-slate-400">Kegiatan</th>
                    <th className="p-1.5 border-r border-slate-400 w-24">Predikat</th>
                    <th className="p-1.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-[11px]">
                  {(detail.ekstrakurikuler || []).map((ek) => (
                    <tr key={ek.id}>
                      <td className="p-1.5 border-r border-slate-300 font-semibold">{ek.name}</td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-bold text-emerald-800">{ek.predicate}</td>
                      <td className="p-1.5 text-slate-600">{ek.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Presensi / Ketidakhadiran */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold uppercase text-slate-800">C. Ketidakhadiran</h4>
                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    type="button"
                    onClick={() => setIsOgomojoloModalOpen(true)}
                    className="text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 font-bold px-2 py-0.5 rounded cursor-pointer transition flex items-center gap-1"
                    title="Tarik rekap absensi dari SDK Ogomojolo via Firebase"
                  >
                    <CalendarCheck className="w-3 h-3 text-amber-600" />
                    <span>Sinkron Ogomojolo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPresensi(!isEditingPresensi)}
                    className="text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 font-bold px-2 py-0.5 rounded cursor-pointer transition flex items-center gap-1"
                    title="Edit Sakit, Izin, Alpa untuk siswa ini secara manual"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingPresensi ? 'Tutup Sunting' : 'Ubah Manual'}</span>
                  </button>
                </div>
              </div>

              {/* Inline Quick Editor for Presensi */}
              {isEditingPresensi && (
                <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2 print:hidden mb-2 animate-fadeIn">
                  <span className="text-[11px] font-bold text-indigo-900 block">
                    ✏️ Sunting Langsung Kehadiran: {student.name}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">Sakit (Hari):</label>
                      <input
                        type="number"
                        min="0"
                        value={detail.presensi.sakit}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          onUpdateRaporDetail(student.id, {
                            ...detail,
                            presensi: { ...detail.presensi, sakit: val },
                          });
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded text-center font-bold text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">Izin (Hari):</label>
                      <input
                        type="number"
                        min="0"
                        value={detail.presensi.izin}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          onUpdateRaporDetail(student.id, {
                            ...detail,
                            presensi: { ...detail.presensi, izin: val },
                          });
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded text-center font-bold text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">Tanpa Keterangan:</label>
                      <input
                        type="number"
                        min="0"
                        value={detail.presensi.tanpaKeterangan}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          onUpdateRaporDetail(student.id, {
                            ...detail,
                            presensi: { ...detail.presensi, tanpaKeterangan: val },
                          });
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded text-center font-bold text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <table className="w-full border border-slate-400">
                <tbody className="divide-y divide-slate-300 text-xs">
                  <tr>
                    <td className="p-2 border-r border-slate-300 font-medium">Sakit</td>
                    <td className="p-2 font-bold text-center w-20">{detail.presensi.sakit} Hari</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-300 font-medium">Izin</td>
                    <td className="p-2 font-bold text-center w-20">{detail.presensi.izin} Hari</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-300 font-medium">Tanpa Keterangan</td>
                    <td className="p-2 font-bold text-center w-20">{detail.presensi.tanpaKeterangan} Hari</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section D: Catatan Wali Kelas */}
          <div className="space-y-1 font-sans text-xs">
            <h4 className="font-bold uppercase text-slate-800">D. Catatan Wali Kelas</h4>
            <div className="p-3 border border-slate-400 rounded bg-slate-50/50 text-[11px] leading-relaxed italic text-slate-900">
              "{detail.catatanWaliKelas}"
            </div>
          </div>

          {/* Section E: Keputusan Kenaikan */}
          <div className="font-sans text-xs border border-slate-400 p-2.5 rounded bg-slate-50 flex items-center justify-between">
            <span className="font-bold text-slate-800">Keputusan Akhir Semester:</span>
            <span className="font-black text-emerald-800 uppercase tracking-wide">
              {detail.statusKenaikan}
            </span>
          </div>

          {/* Signatures */}
          <div 
            className="pt-6 font-sans text-xs grid grid-cols-3 text-center gap-4 border-t border-slate-300 mt-4 break-inside-avoid"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
          >
            {renderSignatureBlock(
              'parent',
              <>Mengetahui,<br />Orang Tua / Wali Murid</>,
              '',
              undefined,
              student.parentName
            )}

            {renderSignatureBlock(
              'teacher',
              <>{schoolProfile.placeDate}<br />Guru Kelas / Wali Kelas,</>,
              schoolProfile.teacherName,
              schoolProfile.teacherNIP
            )}

            {renderSignatureBlock(
              'headmaster',
              <>Mengetahui,<br />Kepala Sekolah</>,
              schoolProfile.headmasterName,
              schoolProfile.headmasterNIP
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="cetak-rapor-container">
      {/* Strict F4 Print Style */}
      <style>
        {`
          @media print {
            @page {
              size: 215mm 330mm;
              margin: 8mm 12mm 8mm 12mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: white !important;
            }
            #cetak-rapor-container {
              margin: 0 !important;
              padding: 0 !important;
            }
            .break-inside-avoid, .page-break-inside-avoid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `}
      </style>

      {/* Toast Notification */}
      {printSuccessToast && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-indigo-900 text-white rounded-2xl shadow-2xl border border-indigo-400 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{printSuccessToast}</span>
        </div>
      )}

      {/* Control Bar (hidden during print) */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 space-y-5 print:hidden transition-colors">
        {/* Header & Class Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                Cetak Lembar Hasil Belajar (e-Rapor)
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-[#4F46E5] text-white shadow-xs">
                {activeClassLevel} • {currentFase}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-1">
              Format lengkap: Cover Depan, Lembar Identitas Siswa, Capaian Nilai, Rapor Projek P5, dan Petunjuk.
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => downloadExcelTemplate((activeClassLevel || 'Kelas 4') as ClassLevel)}
              title="Unduh Format Template Excel (.xlsx)"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Format Excel</span>
            </button>

            <button
              type="button"
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
              title="Ekspor Seluruh Nilai Kelas ke Excel"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-100" />
              <span>Ekspor Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOgomojoloModalOpen(true)}
              title="Sinkronkan Data Ketidakhadiran (Sakit, Izin, Alpa) dari SDK Ogomojolo melalui Firebase Firestore"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-amber-100" />
              <span>Sinkron Absensi Ogomojolo</span>
            </button>

            <button
              type="button"
              onClick={handlePrintInNewTab}
              title="Buka Lembar Cetak di Tab Baru (Bebas Hambatan Iframe)"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-sky-100" />
              <span>Buka Tab Cetak</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadReportFile}
              title="Unduh Berkas Rapor Mandiri (.HTML Siap Cetak & Simpan PDF)"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-violet-100" />
              <span>Unduh .HTML</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              id="btn-trigger-print"
              title="Buka Pilihan Metode Cetak & Simpan PDF"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Helpful Tip Banner for Iframe / Browser sandbox */}
        <div className="p-3.5 bg-indigo-50/70 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800 dark:text-slate-200 text-xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <p>
              <strong>💡 Panduan Cetak:</strong> Gunakan tombol <strong>"Buka Tab Cetak"</strong> atau <strong>"Unduh .HTML"</strong> untuk mencetak secara langsung atau menyimpan seluruh lembar rapor ke file PDF.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrintInNewTab}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition cursor-pointer"
            >
              Buka Tab Baru ↗
            </button>
          </div>
        </div>

        {/* Signature & Pengesahan Mode Switcher Bar */}
        <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-slate-800/80 dark:to-indigo-950/40 border border-indigo-200 dark:border-slate-700 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Format Pengesahan & Tanda Tangan:
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300">
                  {currentSignatureMode === 'manual' ? '✍️ TTD Basah (Manual)' : currentSignatureMode === 'qr_code' ? '📱 Barcode / QR Code e-Sign' : '🖊️ Scan Digital & Stempel'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Pilih format tanda tangan guru dan kepala sekolah pada seluruh lembar rapor.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 p-1 border border-indigo-200 dark:border-slate-700 shadow-2xs">
              {[
                { id: 'manual' as const, label: '✍️ TTD Basah' },
                { id: 'qr_code' as const, label: '📱 Barcode QR (e-Sign)' },
                { id: 'digital_image' as const, label: '🖊️ Scan / Digital' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleQuickChangeSignatureMode(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentSignatureMode === m.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsSignatureModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition hover:scale-[1.02] cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Atur Gambar & Stempel</span>
            </button>
          </div>
        </div>

        {/* Document Tabs Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-slate-800">
          {/* Document Section Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl w-full">
            {[
              { id: 'nilai' as const, label: 'Lembar Nilai Rapor', icon: <FileText className="w-3.5 h-3.5" /> },
              { id: 'cover' as const, label: 'Sampul / Cover', icon: <GraduationCap className="w-3.5 h-3.5" /> },
              { id: 'identitas' as const, label: 'Identitas Siswa', icon: <User className="w-3.5 h-3.5" /> },
              { id: 'p5' as const, label: 'Rapor Projek P5', icon: <Compass className="w-3.5 h-3.5" /> },
              { id: 'petunjuk' as const, label: 'Petunjuk Penggunaan', icon: <HelpCircle className="w-3.5 h-3.5" /> },
              { id: 'bundle' as const, label: 'Bundle Lengkap (Semua)', icon: <FileCheck className="w-3.5 h-3.5" /> },
            ].map((tab) => {
              const isActive = docTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDocTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Student Selector Carousel */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
              Pilih Siswa ({classStudents.length} siswa di {activeClassLevel}):
            </span>
            {docTab === 'identitas' && (
              <button
                type="button"
                onClick={() => setIsEditingBiodata(!isEditingBiodata)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingBiodata ? 'Tutup Sunting' : 'Sunting Biodata Lengkap'}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {classStudents.length === 0 ? (
              <div className="text-xs text-slate-400 py-1.5 italic flex items-center gap-2">
                <span>Belum ada data siswa di {activeClassLevel}.</span>
                <button
                  type="button"
                  onClick={() => setIsOgomojoloModalOpen(true)}
                  className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold hover:underline"
                >
                  Sinkronkan Siswa dari SDK Ogomojolo
                </button>
              </div>
            ) : (
              classStudents.map((std) => {
                const isSelected = std.id === selectedStudentId;
                return (
                  <button
                    key={std.id}
                    type="button"
                    onClick={() => setSelectedStudentId(std.id)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{std.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Biodata Editor Modal (if activated) */}
      {isEditingBiodata && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-indigo-200 dark:border-slate-800 shadow-md space-y-4 print:hidden">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
            <h3 className="font-black text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <span>Sunting Biodata Lengkap: {currentStudent?.name}</span>
            </h3>
            <button
              type="button"
              onClick={handleSaveBiodata}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Biodata</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-gray-600 dark:text-slate-400 font-bold mb-1">NIK Siswa:</label>
              <input
                type="text"
                value={bioForm.nik || ''}
                onChange={(e) => setBioForm({ ...bioForm, nik: e.target.value })}
                placeholder="317101..."
                className="w-full p-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-slate-400 font-bold mb-1">Tempat Lahir:</label>
              <input
                type="text"
                value={bioForm.birthPlace || ''}
                onChange={(e) => setBioForm({ ...bioForm, birthPlace: e.target.value })}
                placeholder="Jakarta"
                className="w-full p-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-slate-400 font-bold mb-1">Tanggal Lahir:</label>
              <input
                type="text"
                value={bioForm.birthDate || ''}
                onChange={(e) => setBioForm({ ...bioForm, birthDate: e.target.value })}
                placeholder="12 Agustus 2014"
                className="w-full p-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-slate-400 font-bold mb-1">Agama:</label>
              <select
                value={bioForm.religion || 'Islam'}
                onChange={(e) => setBioForm({ ...bioForm, religion: e.target.value as any })}
                className="w-full p-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
              >
                <option value="Islam">Islam</option>
                <option value="Kristen">Kristen</option>
                <option value="Katolik">Katolik</option>
                <option value="Hindu">Hindu</option>
                <option value="Buddha">Buddha</option>
                <option value="Konghucu">Konghucu</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 dark:text-slate-400 font-bold mb-1">Nama Ayah:</label>
              <input
                type="text"
                value={bioForm.fatherName || ''}
                onChange={(e) => setBioForm({ ...bioForm, fatherName: e.target.value })}
                placeholder="Nama Ayah Kandung"
                className="w-full p-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-slate-400 font-bold mb-1">Nama Ibu:</label>
              <input
                type="text"
                value={bioForm.motherName || ''}
                onChange={(e) => setBioForm({ ...bioForm, motherName: e.target.value })}
                placeholder="Nama Ibu Kandung"
                className="w-full p-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Document Preview Display */}
      <div id="printable-document-area" className="max-w-4xl mx-auto space-y-8">
        {!currentStudent ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 sm:p-12 text-center border-2 border-dashed border-indigo-200 dark:border-slate-800 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <User className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              Data Siswa di {activeClassLevel} Masih Bersih (0 Siswa)
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Seluruh data dummy siswa telah dibersihkan. Aplikasi e-Rapor kini dalam keadaan siap dan bersih untuk menerima transfer data kehadiran serta siswa dari aplikasi SDK Ogomojolo.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOgomojoloModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 hover:scale-[1.02] transition flex items-center gap-2 cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Buka Integrasi SDK Ogomojolo</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {docTab === 'cover' && renderCover(currentStudent)}
            {docTab === 'identitas' && renderIdentitas(currentStudent)}
            {docTab === 'nilai' && renderNilaiRapor(currentStudent)}
            {docTab === 'p5' && renderRaporP5(currentStudent)}
            {docTab === 'petunjuk' && renderPetunjuk()}
            {docTab === 'bundle' && (
              <div className="space-y-12">
                {renderCover(currentStudent)}
                <div className="page-break my-8 border-b-2 border-dashed border-gray-300" />
                {renderIdentitas(currentStudent)}
                <div className="page-break my-8 border-b-2 border-dashed border-gray-300" />
                {renderNilaiRapor(currentStudent)}
                <div className="page-break my-8 border-b-2 border-dashed border-gray-300" />
                {renderRaporP5(currentStudent)}
                <div className="page-break my-8 border-b-2 border-dashed border-gray-300" />
                {renderPetunjuk()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Pilihan Cetak & Ekspor Rapor */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs print:hidden animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border-2 border-indigo-100 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Pilihan Cetak & Simpan Rapor
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentStudent?.name} • {getDocTitle()} (Ukuran {paperSize})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option Cards */}
            <div className="space-y-3">
              {/* Option 1: Dedicated Tab (Recommended) */}
              <button
                type="button"
                onClick={handlePrintInNewTab}
                className="w-full p-4 rounded-2xl border-2 border-sky-200 dark:border-sky-800/80 bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-100/60 dark:hover:bg-sky-900/40 text-left flex items-start gap-4 transition group cursor-pointer"
              >
                <div className="p-3 bg-sky-600 text-white rounded-xl shadow-md group-hover:scale-105 transition shrink-0">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      1. Buka di Tab Baru (Disarankan)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-200 dark:bg-sky-800 text-sky-900 dark:text-sky-100">
                      100% Anti-Gagal
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Membuka halaman cetak bersih di jendela mandiri, bebas pembatasan browser iframe, dan memicu dialog Simpan PDF / Printer secara otomatis.
                  </p>
                </div>
              </button>

              {/* Option 2: Download Standalone HTML */}
              <button
                type="button"
                onClick={handleDownloadReportFile}
                className="w-full p-4 rounded-2xl border-2 border-violet-200 dark:border-violet-800/80 bg-violet-50/50 dark:bg-violet-950/30 hover:bg-violet-100/60 dark:hover:bg-violet-900/40 text-left flex items-start gap-4 transition group cursor-pointer"
              >
                <div className="p-3 bg-violet-600 text-white rounded-xl shadow-md group-hover:scale-105 transition shrink-0">
                  <FileDown className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      2. Unduh Berkas Rapor (.HTML Siap Cetak)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-200 dark:bg-violet-800 text-violet-900 dark:text-violet-100">
                      Offline / Arsip
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Menyimpan berkas rapor lengkap ke laptop/komputer Anda. Berkas dapat dibuka di browser mana pun dan dicetak kapan saja tanpa internet.
                  </p>
                </div>
              </button>

              {/* Option 3: Direct Browser Print */}
              <button
                type="button"
                onClick={handleNativePrint}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left flex items-start gap-4 transition group cursor-pointer"
              >
                <div className="p-3 bg-slate-700 dark:bg-slate-600 text-white rounded-xl shadow-md group-hover:scale-105 transition shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    3. Cetak Langsung di Jendela Ini
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Memicu perintah cetak browser (Ctrl+P). Catatan: Beberapa jendela preview iframe dapat menonaktifkan dialog pop-up ini.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-medium">
                Pilihan Ukuran Kertas: <strong>{paperSize}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Tanda Tangan & Stempel */}
      {isSignatureModalOpen && (
        <SignatureSettingsModal
          schoolProfile={schoolProfile}
          activeClassLevel={activeClassLevel}
          currentUser={currentUser}
          onClose={() => setIsSignatureModalOpen(false)}
          onSave={(updatedProfile) => {
            if (onUpdateSchoolProfile) {
              onUpdateSchoolProfile(updatedProfile);
              setPrintSuccessToast('Pengaturan tanda tangan & stempel berhasil disimpan!');
              setTimeout(() => setPrintSuccessToast(null), 3000);
            }
          }}
        />
      )}

      {/* Modal Sinkronisasi Absensi Ogomojolo (Option B - Shared Firestore) */}
      {isOgomojoloModalOpen && (
        <OgomojoloSyncModal
          students={students}
          raporDetails={raporDetails}
          activeClassLevel={activeClassLevel}
          schoolProfile={schoolProfile}
          isOpen={isOgomojoloModalOpen}
          onClose={() => setIsOgomojoloModalOpen(false)}
          onRegisterStudentsFromOgomojolo={onRegisterStudentsFromOgomojolo}
          onClearAllDummyData={onClearAllDummyData}
          onApplyRaporDetails={(newDetails, count) => {
            if (onUpdateAllRaporDetails) {
              onUpdateAllRaporDetails(newDetails);
            } else {
              Object.entries(newDetails).forEach(([sId, dt]) => {
                onUpdateRaporDetail(sId, dt);
              });
            }
            setPrintSuccessToast(`Alhamdulillah! Berhasil menyelaraskan ${count} data kehadiran siswa dari SDK Ogomojolo!`);
            setTimeout(() => setPrintSuccessToast(null), 3500);
          }}
        />
      )}
    </div>
  );
};
