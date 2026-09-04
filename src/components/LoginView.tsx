import React, { useState } from 'react';
import { TeacherAccount, SchoolProfile } from '../types';
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
  const [showDirectory, setShowDirectory] = useState<boolean>(false);

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
        setErrorMessage('PIN / Kata Sandi salah untuk akun ini.');
        return;
      }
    }

    setIsSubmitting(false);
    setSuccessMessage(`Autentikasi Berhasil! Selamat datang, ${foundTeacher.name}.`);

    setTimeout(() => {
      onLoginSuccess(foundTeacher);
    }, 600);
  };

  const handleSelectDemoTeacher = (t: TeacherAccount) => {
    setEmailInput(t.email);
    setPinInput(t.pin || '1234');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-yellow-400 selection:text-black transition-colors duration-300">
      <div className="w-full max-w-md space-y-6">
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
          <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider mb-1">
              <Lock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Portal Masuk Guru & Admin</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
              Masuk dengan Email Terdaftar
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
              Gunakan email manual yang telah didaftarkan oleh Administrator sekolah.
            </p>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Alamat Email Guru:</span>
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
                placeholder="fadli46046@gmail.com"
                className="w-full p-3.5 bg-gray-50 dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-hidden transition-all"
                autoFocus
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
              className="w-full inline-flex items-center justify-center gap-2 p-4 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4 text-yellow-300" />
              <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk ke e-Rapor'}</span>
            </button>
          </form>

          {/* Directory Reference for Easy Testing */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowDirectory(!showDirectory)}
              className="w-full flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl text-[11px] font-bold text-indigo-700 dark:text-indigo-300 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Daftar Email Guru Terdaftar ({teachers.length} Akun)</span>
              </span>
              {showDirectory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDirectory && (
              <div className="mt-2 space-y-1.5 p-2.5 bg-gray-50 dark:bg-slate-800/80 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs animate-fadeIn max-h-48 overflow-y-auto">
                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase mb-1">
                  Klik untuk otomatis mengisi email & PIN:
                </p>
                {teachers.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectDemoTeacher(t)}
                    className="p-2 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-900 dark:text-white truncate">{t.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-md font-black ${
                            t.role === 'admin'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300'
                              : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-300'
                          }`}
                        >
                          {t.role === 'admin' ? 'Admin' : t.assignedClass}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono truncate">{t.email}</p>
                    </div>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 shrink-0">
                      Isi
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-indigo-200/80 font-medium">
          Hak Cipta © {schoolProfile.schoolName} • Kurikulum Merdeka SD
        </p>
      </div>
    </div>
  );
};
