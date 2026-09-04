import React, { useState, useEffect, useRef } from 'react';
import {
  MataPelajaran,
  NilaiSiswaMapel,
  RaporSiswaDetail,
  SchoolProfile,
  Student,
  ClassLevel,
  TeacherAccount,
} from '../types';
import { getSubjectsForClass } from '../data/initialData';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  ExternalLink,
  User,
  Phone,
  HelpCircle,
  Sparkles,
  Award,
  Calendar,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  Smartphone,
  Save,
  Edit2,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  ListOrdered,
  Users,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';

interface WhatsAppGatewayViewProps {
  students: Student[];
  subjects: MataPelajaran[];
  grades: NilaiSiswaMapel[];
  schoolProfile: SchoolProfile;
  raporDetails: Record<string, RaporSiswaDetail>;
  activeClassLevel?: ClassLevel;
  onSelectClassLevel?: (classLevel: ClassLevel) => void;
  currentUser?: TeacherAccount | null;
  teachers?: TeacherAccount[];
  onUpdateSchoolProfile?: (profile: SchoolProfile) => void;
}

export const WhatsAppGatewayView: React.FC<WhatsAppGatewayViewProps> = ({
  students,
  subjects,
  grades,
  schoolProfile,
  raporDetails,
  activeClassLevel = 'Kelas 4',
  onSelectClassLevel,
  currentUser,
  teachers = [],
  onUpdateSchoolProfile,
}) => {
  const classLevels: ClassLevel[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];

  // Filter students for active class
  const classStudents = students.filter(
    (std) => std.gradeLevel === activeClassLevel || (!std.gradeLevel && activeClassLevel === 'Kelas 4')
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    return classStudents[0]?.id || students[0]?.id || 'std-1';
  });

  // Keep selectedStudentId valid
  useEffect(() => {
    if (classStudents.length > 0 && !classStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(classStudents[0].id);
    }
  }, [activeClassLevel, classStudents, selectedStudentId]);

  // Find Homeroom Teacher for active class or fallback to currentUser / schoolProfile
  const assignedTeacher =
    teachers.find((t) => t.assignedClass === activeClassLevel) ||
    currentUser || {
      name: schoolProfile.teacherName || 'Fadli, S.Pd.',
      phone: '081234567890',
    };

  // State for Wali Kelas WhatsApp Sender configuration
  const [waliKelasName, setWaliKelasName] = useState<string>(() => {
    const saved = localStorage.getItem(`iihh_wali_name_${activeClassLevel}`);
    return saved || assignedTeacher.name || schoolProfile.teacherName || 'Fadli, S.Pd.';
  });

  const [waliKelasPhone, setWaliKelasPhone] = useState<string>(() => {
    const saved = localStorage.getItem(`iihh_wali_phone_${activeClassLevel}`);
    return saved || assignedTeacher.phone || '081234567890';
  });

  const [isEditingSender, setIsEditingSender] = useState<boolean>(false);
  const [saveSenderToast, setSaveSenderToast] = useState<boolean>(false);

  useEffect(() => {
    const savedName = localStorage.getItem(`iihh_wali_name_${activeClassLevel}`);
    const savedPhone = localStorage.getItem(`iihh_wali_phone_${activeClassLevel}`);
    if (savedName) setWaliKelasName(savedName);
    if (savedPhone) setWaliKelasPhone(savedPhone);
  }, [activeClassLevel]);

  const handleSaveSender = () => {
    localStorage.setItem(`iihh_wali_name_${activeClassLevel}`, waliKelasName);
    localStorage.setItem(`iihh_wali_phone_${activeClassLevel}`, waliKelasPhone);
    setIsEditingSender(false);
    setSaveSenderToast(true);
    setTimeout(() => setSaveSenderToast(false), 3000);
  };

  // Status logs for delivery tracking
  const [sentStatus, setSentStatus] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`iihh_wa_sent_${activeClassLevel}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bulk Broadcast Queue States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkQueueIndex, setBulkQueueIndex] = useState<number>(0);
  const [isBulkRunning, setIsBulkRunning] = useState<boolean>(false);
  const [bulkIntervalSeconds, setBulkIntervalSeconds] = useState<number>(4);
  const [countdown, setCountdown] = useState<number>(0);

  // Format WhatsApp Message Generator
  const generateMessage = (student: Student): string => {
    const sSubjects = getSubjectsForClass(subjects, (student.gradeLevel as ClassLevel) || activeClassLevel);
    const sDetail = raporDetails[student.id] || {
      studentId: student.id,
      catatanWaliKelas: 'Menunjukkan perkembangan akademik dan karakter yang sangat baik.',
      statusKenaikan: 'Naik ke Kelas Berikutnya',
      presensi: { sakit: 0, izin: 0, tanpaKeterangan: 0 },
    };

    const studentGrades = sSubjects.map((subj) => {
      const g = grades.find((gr) => gr.studentId === student.id && gr.subjectId === subj.id);
      return {
        name: subj.name,
        nilai: g?.nilaiAkhir ?? 80,
      };
    });

    const avg =
      studentGrades.length > 0
        ? (studentGrades.reduce((acc, curr) => acc + curr.nilai, 0) / studentGrades.length).toFixed(1)
        : '0';

    const gradeListText = studentGrades.map((g) => `• ${g.name}: *${g.nilai}*`).join('\n');

    return `*LAPORAN HASIL BELAJAR PESERTA DIDIK (E-RAPOR)*
*${schoolProfile.schoolName.toUpperCase()}*
_Tahun Ajaran ${schoolProfile.academicYear} - Semester ${schoolProfile.semester}_
━━━━━━━━━━━━━━━━━━━━━

Kepada Yth. 
*Bapak/Ibu Orang Tua / Wali dari:*
Nama: *${student.name}*
NISN/NIS: ${student.nisn} / ${student.nis}
Kelas: *${student.gradeLevel || activeClassLevel}*

Berikut ringkasan capaian kompetensi pembelajaran ananda:

*REKAPITULASI NILAI AKHIR:*
${gradeListText}

📊 *Rata-rata Nilai:* *${avg}*

📋 *Catatan Wali Kelas:*
_"${sDetail.catatanWaliKelas}"_

🩺 *Kehadiran:*
• Sakit: ${sDetail.presensi?.sakit ?? 0} hari
• Izin: ${sDetail.presensi?.izin ?? 0} hari
• Tanpa Keterangan: ${sDetail.presensi?.tanpaKeterangan ?? 0} hari

🎯 *Keputusan:* *${sDetail.statusKenaikan || 'Naik ke Kelas Berikutnya'}*

━━━━━━━━━━━━━━━━━━━━━
Pesan ini dikirimkan secara resmi oleh:
*Wali Kelas ${activeClassLevel}*: *${waliKelasName}*
Kontak Resmi: +${waliKelasPhone}
_${schoolProfile.schoolName}_`;
  };

  const getCleanPhone = (phoneStr: string): string => {
    let clean = phoneStr.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (!clean.startsWith('62')) {
      clean = '62' + clean;
    }
    return clean;
  };

  const currentStudent = classStudents.find((s) => s.id === selectedStudentId) || classStudents[0];
  const currentMessage = currentStudent ? generateMessage(currentStudent) : '';

  const handleSendWA = (student: Student) => {
    const rawPhone = student.parentPhone || '081234567890';
    const targetPhone = getCleanPhone(rawPhone);
    const msg = generateMessage(student);
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;

    const newStatus = { ...sentStatus, [student.id]: true };
    setSentStatus(newStatus);
    localStorage.setItem(`iihh_wa_sent_${activeClassLevel}`, JSON.stringify(newStatus));

    window.open(url, '_blank');
  };

  const handleCopyMessage = (student: Student) => {
    const msg = generateMessage(student);
    navigator.clipboard.writeText(msg);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleResetStatus = () => {
    setSentStatus({});
    localStorage.removeItem(`iihh_wa_sent_${activeClassLevel}`);
  };

  // Bulk Broadcast Runner effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBulkRunning && bulkQueueIndex < classStudents.length) {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      } else {
        // Trigger current student send
        const targetStudent = classStudents[bulkQueueIndex];
        if (targetStudent) {
          handleSendWA(targetStudent);
        }

        if (bulkQueueIndex + 1 < classStudents.length) {
          setBulkQueueIndex((idx) => idx + 1);
          setCountdown(bulkIntervalSeconds);
        } else {
          setIsBulkRunning(false);
          setBulkQueueIndex(classStudents.length);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [isBulkRunning, bulkQueueIndex, countdown, classStudents, bulkIntervalSeconds]);

  const handleStartBulk = () => {
    setIsBulkModalOpen(true);
    setBulkQueueIndex(0);
    setCountdown(1);
    setIsBulkRunning(true);
  };

  const totalSent = Object.keys(sentStatus).filter((id) => classStudents.some((s) => s.id === id)).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {saveSenderToast && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-teal-900 text-white rounded-2xl shadow-2xl border border-teal-400 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">Pengaturan Pengirim Wali Kelas Tersimpan!</span>
        </div>
      )}

      {/* Top Banner with Homeroom Verification */}
      <div className="rounded-[32px] bg-gradient-to-r from-indigo-900 via-indigo-800 to-teal-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-teal-300 text-xs font-black backdrop-blur-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Gateway Resmi Wali Kelas</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Distribusi Rekap Nilai & Tautan Rapor ke Orang Tua Siswa
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm font-medium leading-relaxed">
              Kirimkan ringkasan capaian kompetensi dan link e-rapor secara instan dan aman langsung dari nomor WhatsApp <strong>Wali Kelas {activeClassLevel}</strong> ke orang tua murid.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleStartBulk}
              id="btn-bulk-broadcast-wa"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Siaran Sekaligus (Bulk Broadcast)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Wali Kelas Sender Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-teal-200 dark:border-teal-900/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black text-lg shadow-inner">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Nomor WA Pengirim (Wali Kelas {activeClassLevel})
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                <ShieldCheck className="w-3 h-3 text-teal-600" />
                <span>Terverifikasi</span>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-black text-gray-900 dark:text-white">{waliKelasName}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-900">
                +{waliKelasPhone}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditingSender ? (
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={waliKelasName}
                onChange={(e) => setWaliKelasName(e.target.value)}
                placeholder="Nama Wali Kelas"
                className="px-3 py-1.5 text-xs font-bold bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl"
              />
              <input
                type="text"
                value={waliKelasPhone}
                onChange={(e) => setWaliKelasPhone(e.target.value)}
                placeholder="Nomor WA (0812...)"
                className="px-3 py-1.5 text-xs font-mono font-bold bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl w-36"
              />
              <button
                type="button"
                onClick={handleSaveSender}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingSender(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-xs font-bold transition-all cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Ubah Nomor WA Wali Kelas</span>
            </button>
          )}
        </div>
      </div>

      {/* Class Level Selector */}
      {onSelectClassLevel && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border-2 border-indigo-100 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3 transition-colors">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider">
              Pilih Kelas:
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

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student List & Delivery Status (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-gray-900 dark:text-white text-sm">
                  Daftar Kontak Wali Murid ({activeClassLevel})
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                  {totalSent} dari {classStudents.length} siswa sudah dikirim
                </p>
              </div>
              {totalSent > 0 && (
                <button
                  type="button"
                  onClick={handleResetStatus}
                  title="Reset Status Terkirim"
                  className="text-[10px] text-gray-400 hover:text-rose-500 font-bold underline cursor-pointer"
                >
                  Reset Status
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-teal-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${classStudents.length > 0 ? (totalSent / classStudents.length) * 100 : 0}%` }}
              />
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {classStudents.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Tidak ada siswa di kelas ini.</p>
              ) : (
                classStudents.map((std) => {
                  const isSelected = std.id === selectedStudentId;
                  const isSent = sentStatus[std.id];
                  return (
                    <div
                      key={std.id}
                      onClick={() => setSelectedStudentId(std.id)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                          : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">{std.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                          <span>Wali: {std.parentName || '-'}</span>
                          <span>•</span>
                          <span className="font-mono text-indigo-700 dark:text-indigo-400 font-bold">+{std.parentPhone}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                            <Check className="w-3 h-3 text-teal-600" />
                            <span>Terkirim</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-1 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400 font-bold">
                            Belum
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Message Preview & Direct Send (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {currentStudent ? (
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-sm">
                    Pratinjau Pesan WhatsApp • {currentStudent.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                    Nomor Tujuan: +{currentStudent.parentPhone} | Pengirim: <strong>{waliKelasName}</strong> (+{waliKelasPhone})
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
              </div>

              {/* Simulated WhatsApp Chat Bubble */}
              <div className="bg-[#EFEAE2] dark:bg-slate-950 p-5 rounded-2xl border border-gray-300 dark:border-slate-700 shadow-inner">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none shadow-xs border border-gray-200 dark:border-slate-800 text-xs font-sans whitespace-pre-wrap leading-relaxed text-gray-900 dark:text-slate-100 max-w-lg">
                  {currentMessage}
                  <div className="text-right text-[10px] text-gray-400 mt-2 font-medium">
                    Dikirim via nomor resmi Wali Kelas
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyMessage(currentStudent)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {copiedId === currentStudent.id ? (
                    <>
                      <Check className="w-4 h-4 text-teal-600" />
                      <span>Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Format Pesan</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-send-whatsapp-direct"
                  type="button"
                  onClick={() => handleSendWA(currentStudent)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-teal-600/25 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim via WhatsApp Wali Kelas</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 p-8 text-center text-gray-400 text-xs">
              Pilih siswa untuk melihat pratinjau pesan WhatsApp.
            </div>
          )}

          {/* WhatsApp Guidance Card */}
          <div className="bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-slate-800 rounded-[32px] p-5 text-xs text-gray-700 dark:text-slate-300 space-y-1.5 shadow-xs transition-colors">
            <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Petunjuk Pengiriman WhatsApp:</span>
            </h4>
            <p className="text-[11px] leading-relaxed font-medium text-gray-600 dark:text-slate-400">
              Tombol <strong>"Kirim via WhatsApp Wali Kelas"</strong> akan langsung membuka aplikasi WhatsApp di perangkat Wali Kelas, dengan nomor tujuan orang tua dan pesan yang sudah siap dikirim dari nomor Wali Kelas.
            </p>
          </div>
        </div>
      </div>

      {/* Bulk Broadcast Modal Queue Engine */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-teal-400 dark:border-teal-600 max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black">
                  <Zap className="w-5 h-5 fill-teal-600 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-base">
                    Antrian Siaran Massal WhatsApp
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Pengirim: <strong>{waliKelasName}</strong> ({activeClassLevel})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBulkRunning(false);
                  setIsBulkModalOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Progress Overview */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
                <span>Progres Pengiriman:</span>
                <span>{bulkQueueIndex} / {classStudents.length} Siswa</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(bulkQueueIndex / classStudents.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Target Card */}
            {bulkQueueIndex < classStudents.length ? (
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 space-y-2">
                <span className="text-[10px] font-black tracking-wider uppercase text-teal-800 dark:text-teal-300 block">
                  Target Saat Ini ({bulkQueueIndex + 1} dari {classStudents.length})
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-gray-900 dark:text-white text-sm">
                      {classStudents[bulkQueueIndex]?.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-slate-300">
                      Wali: {classStudents[bulkQueueIndex]?.parentName} (+{classStudents[bulkQueueIndex]?.parentPhone})
                    </p>
                  </div>
                  {isBulkRunning && (
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-teal-700 dark:text-teal-400">
                        Jeda: {countdown}s
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-black text-emerald-900 dark:text-emerald-100 text-sm">
                  Siaran Massal Selesai!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Seluruh {classStudents.length} pesan telah disiapkan dan dikirimkan.
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Jeda Antar Pesan:</span>
                <select
                  value={bulkIntervalSeconds}
                  onChange={(e) => setBulkIntervalSeconds(Number(e.target.value))}
                  className="text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white p-1.5 rounded-xl border border-gray-300 dark:border-slate-700"
                >
                  <option value={3}>3 Detik</option>
                  <option value={5}>5 Detik</option>
                  <option value={8}>8 Detik</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {isBulkRunning ? (
                  <button
                    type="button"
                    onClick={() => setIsBulkRunning(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Jeda Antrian</span>
                  </button>
                ) : bulkQueueIndex < classStudents.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkRunning(true);
                      setCountdown(1);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Lanjutkan Siaran</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    setIsBulkRunning(false);
                    setIsBulkModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs hover:bg-gray-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
