import React, { useState } from 'react';
import { TeacherAccount, SchoolProfile, UserRole } from '../types';
import {
  Lock,
  Mail,
  KeyRound,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Shield,
  GraduationCap,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Building,
  BookOpen,
  Activity,
  Languages,
  Users,
  Award,
} from 'lucide-react';

interface LoginViewProps {
  schoolProfile: SchoolProfile;
  teachers: TeacherAccount[];
  onLoginSuccess: (user: TeacherAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  schoolProfile,
  teachers,
  onLoginSuccess,
}) => {
  const [emailInput, setEmailInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'guru_mapel' | 'guru_wali_kelas' | 'admin'>('all');
  const [showDirectory, setShowDirectory] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPin = pinInput.trim();

    if (!cleanEmail) {
      setErrorMessage('Silakan masukkan alamat email yang telah didaftarkan oleh admin.');
      return;
    }

    setIsSubmitting(true);

    const foundTeacher = teachers.find(
      (t) =>
        t.email?.trim().toLowerCase() === cleanEmail ||
        t.username?.trim().toLowerCase() === cleanEmail
    );

    if (!foundTeacher) {
      setIsSubmitting(false);
      setErrorMessage(
        `Email "${emailInput.trim()}" belum didaftarkan oleh Admin Sekolah. Hubungi Administrator untuk mendaftarkan akun guru Anda.`
      );
      return;
    }

    if (foundTeacher.status === 'nonaktif') {
      setIsSubmitting(false);
      setErrorMessage('Akun ini sedang dinonaktifkan oleh Admin Sekolah.');
      return;
    }

    if (foundTeacher.pin && foundTeacher.pin.trim() !== '') {
      if (cleanPin !== foundTeacher.pin.trim()) {
        setIsSubmitting(false);
        setErrorMessage('PIN / Kata Sandi salah untuk akun ini. (Bawaan: 1234)');
        return;
      }
    }

    setIsSubmitting(false);
    setSuccessMessage(`Autentikasi Berhasil! Selamat datang, ${foundTeacher.name}.`);

    setTimeout(() => {
      onLoginSuccess(foundTeacher);
    }, 500);
  };

  const handleSelectAndLogin = (t: TeacherAccount) => {
    setEmailInput(t.email);
    setPinInput(t.pin || '1234');
    setErrorMessage(null);
    setSuccessMessage(`Masuk otomatis sebagai ${t.name}...`);
    setTimeout(() => {
      onLoginSuccess(t);
    }, 400);
  };

  const handleFillCredentials = (t: TeacherAccount) => {
    setEmailInput(t.email);
    setPinInput(t.pin || '1234');
    setErrorMessage(null);
  };

  // Filter teachers by selected role
  const filteredTeachers = teachers.filter((t) => {
    if (roleFilter === 'all') return true;
    return t.role === roleFilter;
  });

  const getSubjectIcon = (subjectName?: string) => {
    const s = (subjectName || '').toLowerCase();
    if (s.includes('jasmani') || s.includes('pjok') || s.includes('olahraga')) {
      return <Activity className="w-3.5 h-3.5 text-emerald-500" />;
    }
    if (s.includes('inggris') || s.includes('bahasa')) {
      return <Languages className="w-3.5 h-3.5 text-sky-500" />;
    }
    return <BookOpen className="w-3.5 h-3.5 text-amber-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-yellow-400 selection:text-black transition-colors duration-300">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand Logo & School Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-yellow-400 rounded-3xl shadow-xl border-4 border-white/20 transform -rotate-3 mb-2">
            <span className="text-4xl font-black text-black">i</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-sans">
            iihh Beres
          </h1>
          <p className="text-xs sm:text-sm font-bold text-yellow-300">
            Sistem Penilaian & e-Rapor Kurikulum Merdeka SD
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 dark:bg-black/40 border border-white/20 text-indigo-100 text-xs font-semibold">
            <Building className="w-3.5 h-3.5" />
            <span>{schoolProfile.schoolName}</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[36px] shadow-2xl p-6 sm:p-8 space-y-5 border-4 border-white/30 dark:border-slate-800 transition-colors">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider mb-1">
                <Lock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Portal Masuk Guru & Admin</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                Pilih Peran atau Masuk Mandiri
              </h2>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 dark:text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Wali Kelas & Guru Mapel
              </span>
            </div>
          </div>

          {/* Quick Role Selection Tabs */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Masuk Cepat Berdasarkan Akun:</span>
              </label>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setRoleFilter('all')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    roleFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs font-black'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('guru_mapel')}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    roleFilter === 'guru_mapel'
                      ? 'bg-teal-600 text-white shadow-xs font-black'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>Guru Mapel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('guru_wali_kelas')}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    roleFilter === 'guru_wali_kelas'
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
                  }`}
                >
                  <GraduationCap className="w-3 h-3" />
                  <span>Wali Kelas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('admin')}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    roleFilter === 'admin'
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Teacher Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredTeachers.map((t) => {
                const isMapel = t.role === 'guru_mapel';
                const isWali = t.role === 'guru_wali_kelas';
                const isAdmin = t.role === 'admin';

                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectAndLogin(t)}
                    className={`p-3 rounded-2xl border-2 text-left cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group relative flex flex-col justify-between ${
                      isMapel
                        ? 'bg-teal-50/50 hover:bg-teal-100/60 dark:bg-teal-950/30 dark:hover:bg-teal-950/60 border-teal-200 dark:border-teal-800'
                        : isWali
                        ? 'bg-indigo-50/50 hover:bg-indigo-100/60 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
                        : 'bg-amber-50/50 hover:bg-amber-100/60 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                            isMapel
                              ? 'bg-teal-600 text-white'
                              : isWali
                              ? 'bg-indigo-600 text-white'
                              : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {isMapel && <Activity className="w-2.5 h-2.5" />}
                          {isWali && <GraduationCap className="w-2.5 h-2.5" />}
                          {isAdmin && <Shield className="w-2.5 h-2.5" />}
                          {isMapel ? 'GURU MAPEL' : isWali ? `WALI ${t.assignedClass}` : 'ADMINISTRATOR'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                          Masuk →
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
                        {t.name}
                      </h4>
                      {isMapel && (
                        <p className="text-[10px] font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1 mt-0.5 truncate">
                          {getSubjectIcon(t.assignedSubjectName)}
                          <span className="truncate">{t.assignedSubjectName || 'Guru Mapel'}</span>
                        </p>
                      )}
                      {isWali && (
                        <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
                          Wali Kelas: {t.assignedClass}
                        </p>
                      )}
                      {isAdmin && (
                        <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium mt-0.5">
                          Kepala Sekolah / Pengelola
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-200/60 dark:border-slate-700/60 text-[10px] text-gray-500 dark:text-slate-400 font-mono">
                      <span className="truncate">{t.email}</span>
                      <span className="shrink-0 font-bold text-indigo-600 dark:text-indigo-400">PIN: {t.pin || '1234'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notifications */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 rounded-2xl text-xs font-bold flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Manual Input */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Atau Masukkan Alamat Email Guru:</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                id="login-input-email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="misal: budisantoso.pjok@gmail.com atau sitirahmawati@gmail.com"
                className="w-full p-3.5 bg-gray-50 dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-hidden transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>PIN / Kata Sandi:</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">Bawaan: 1234</span>
              </div>
              <input
                type="password"
                required
                maxLength={10}
                id="login-input-pin"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Ketik PIN akun guru..."
                className="w-full p-3.5 bg-gray-50 dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-mono font-bold tracking-widest text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-hidden transition-all"
              />
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 p-4 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-yellow-300" />
              <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk ke Aplikasi e-Rapor'}</span>
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-indigo-200/80 font-medium">
          Hak Cipta © {schoolProfile.schoolName} • Kurikulum Merdeka SD
        </p>
      </div>
    </div>
  );
};
