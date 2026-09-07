import { MataPelajaran, SchoolProfile, Student, NilaiSiswaMapel, RaporSiswaDetail, ClassLevel, TeacherAccount, getFaseByClass, isIPASActiveForClass } from '../types';
import { calculateGrade, findExtremeTPs, generateDefaultNarasi } from '../utils/calculator';

export const initialTeachers: TeacherAccount[] = [
  {
    id: 'usr-admin',
    name: 'Fadli, S.Pd.',
    nip: '198908152016021001',
    email: 'fadli46046@gmail.com',
    username: 'fadli',
    pin: '1234',
    role: 'admin',
    phone: '081234567890',
    status: 'aktif',
  },
  {
    id: 'usr-wali-4',
    name: 'Siti Rahmawati, S.Pd.',
    nip: '199203142019032005',
    email: 'sitirahmawati@gmail.com',
    username: 'siti_wali4',
    pin: '1234',
    role: 'guru_wali_kelas',
    assignedClass: 'Kelas 4',
    phone: '081398765432',
    status: 'aktif',
  },
  {
    id: 'usr-mapel-pai',
    name: 'Ust. Abdul Halim, S.Pd.I.',
    nip: '198705122014031002',
    email: 'abdulhalim.pai@gmail.com',
    username: 'halim_pai',
    pin: '1234',
    role: 'guru_mapel',
    assignedSubjectId: 'mapel-1',
    assignedSubjectName: 'Pendidikan Agama Islam dan Budi Pekerti',
    phone: '081211223344',
    status: 'aktif',
  },
  {
    id: 'usr-mapel-pjok',
    name: 'Budi Santoso, S.Pd.',
    nip: '199008202018011003',
    email: 'budisantoso.pjok@gmail.com',
    username: 'budi_pjok',
    pin: '1234',
    role: 'guru_mapel',
    assignedSubjectId: 'mapel-7',
    assignedSubjectName: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    phone: '081255667788',
    status: 'aktif',
  },
  {
    id: 'usr-mapel-bing',
    name: 'Sarah Anggraini, S.Pd.',
    nip: '199411052020122008',
    email: 'sarah.bing@gmail.com',
    username: 'sarah_bing',
    pin: '1234',
    role: 'guru_mapel',
    assignedSubjectId: 'mapel-8',
    assignedSubjectName: 'Bahasa Inggris',
    phone: '081377889900',
    status: 'aktif',
  },
];

export const initialSchoolProfile: SchoolProfile = {
  schoolName: 'SD Negeri 01 Merdeka Mandiri',
  npsn: '20104567',
  nss: '101026001001',
  address: 'Jl. Pendidikan No. 45, Kompleks Edukasi',
  village: 'Menteng',
  district: 'Menteng',
  city: 'Kota Jakarta Pusat',
  province: 'DKI Jakarta',
  postalCode: '10310',
  website: 'www.sdn01merdekamandiri.sch.id',
  email: 'fadli46046@gmail.com',
  headmasterName: 'Fadli, S.Pd.',
  headmasterNIP: '198908152016021001',
  teacherName: 'Fadli, S.Pd.',
  teacherNIP: '198908152016021001',
  academicYear: '2024/2025',
  semester: '1 (Ganjil)',
  reportDate: '20 Desember 2024',
  placeDate: 'Jakarta Pusat, 20 Desember 2024',
  activeClassLevel: 'Kelas 4',
};

// Sample Dummy Roster (Demo) across SD Grade levels (Kelas 1 to Kelas 6)
export const sampleDummyStudents: Student[] = [
  // --- KELAS 1 (Fase A) ---
  {
    id: 'std-k1-1',
    nisn: '0183456701',
    nis: '24001',
    name: 'Alvaro Rizky Pratama',
    gender: 'L',
    gradeLevel: 'Kelas 1',
    fase: 'Fase A (Kelas 1-2)',
    parentName: 'Rizky Kurniawan',
    parentPhone: '6281211112222',
    address: 'Jl. Kenari No. 3, Jakarta',
  },
  {
    id: 'std-k1-2',
    nisn: '0183456702',
    nis: '24002',
    name: 'Bella Salsabila',
    gender: 'P',
    gradeLevel: 'Kelas 1',
    fase: 'Fase A (Kelas 1-2)',
    parentName: 'Indra Gunawan',
    parentPhone: '6281233334444',
    address: 'Jl. Pegangsaan Timur No. 15, Jakarta',
  },
  {
    id: 'std-k1-3',
    nisn: '0183456703',
    nis: '24003',
    name: 'Clarissa Aurelia',
    gender: 'P',
    gradeLevel: 'Kelas 1',
    fase: 'Fase A (Kelas 1-2)',
    parentName: 'Bambang Sudibyo',
    parentPhone: '6281255556666',
    address: 'Jl. Johar Baru No. 8, Jakarta',
  },
  {
    id: 'std-k1-4',
    nisn: '0183456704',
    nis: '24004',
    name: 'Dafi Al-Ghifari',
    gender: 'L',
    gradeLevel: 'Kelas 1',
    fase: 'Fase A (Kelas 1-2)',
    parentName: 'M. Ghifari',
    parentPhone: '6281277778888',
    address: 'Jl. Percetakan Negara No. 20, Jakarta',
  },

  // --- KELAS 2 (Fase A) ---
  {
    id: 'std-k2-1',
    nisn: '0173456711',
    nis: '23001',
    name: 'Edo Nugroho',
    gender: 'L',
    gradeLevel: 'Kelas 2',
    fase: 'Fase A (Kelas 1-2)',
    parentName: 'Joko Nugroho',
    parentPhone: '6281311112222',
    address: 'Jl. Kramat Raya No. 10, Jakarta',
  },
  {
    id: 'std-k2-2',
    nisn: '0173456712',
    nis: '23002',
    name: 'Fiona Putri Kirana',
    gender: 'P',
    gradeLevel: 'Kelas 2',
    fase: 'Fase A (Kelas 1-2)',
    parentName: 'H. Sudirman',
    parentPhone: '6281333334444',
    address: 'Jl. Salemba Tengah No. 12, Jakarta',
  },

  // --- KELAS 3 (Fase B) ---
  {
    id: 'std-k3-1',
    nisn: '0163456721',
    nis: '22001',
    name: 'Gilang Ramadhan',
    gender: 'L',
    gradeLevel: 'Kelas 3',
    fase: 'Fase B (Kelas 3-4)',
    parentName: 'Surya Saputra',
    parentPhone: '6281411112222',
    address: 'Jl. Menteng Pulo No. 4, Jakarta',
  },
  {
    id: 'std-k3-2',
    nisn: '0163456722',
    nis: '22002',
    name: 'Hana Marwah',
    gender: 'P',
    gradeLevel: 'Kelas 3',
    fase: 'Fase B (Kelas 3-4)',
    parentName: 'Drs. Usman',
    parentPhone: '6281433334444',
    address: 'Jl. Teuku Cik Ditiro No. 9, Jakarta',
  },

  // --- KELAS 4 (Fase B) - Main Default Showcase ---
  {
    id: 'std-1',
    nisn: '0123456789',
    nis: '21001',
    name: 'Ahmad Fauzan',
    gender: 'L',
    gradeLevel: 'Kelas 4',
    fase: 'Fase B (Kelas 3-4)',
    parentName: 'H. Fauzan Pratama',
    parentPhone: '6281234567890',
    address: 'Jl. Merdeka No. 12, Jakarta',
  },
  {
    id: 'std-2',
    nisn: '0123456790',
    nis: '21002',
    name: 'Aisyah Putri Rahmadani',
    gender: 'P',
    gradeLevel: 'Kelas 4',
    fase: 'Fase B (Kelas 3-4)',
    parentName: 'Rahmat Hidayat',
    parentPhone: '6281298765432',
    address: 'Jl. Cempaka Putih No. 5, Jakarta',
  },
  {
    id: 'std-3',
    nisn: '0123456791',
    nis: '21003',
    name: 'Dimas Aditya Pratama',
    gender: 'L',
    gradeLevel: 'Kelas 4',
    fase: 'Fase B (Kelas 3-4)',
    parentName: 'Agus Pratama',
    parentPhone: '6281311223344',
    address: 'Jl. Kebon Sirih No. 88, Jakarta',
  },
  {
    id: 'std-4',
    nisn: '0123456792',
    nis: '21004',
    name: 'Nabila Zahra Khairunnisa',
    gender: 'P',
    gradeLevel: 'Kelas 4',
    fase: 'Fase B (Kelas 3-4)',
    parentName: 'dr. Hendra Kurniawan',
    parentPhone: '6281555667788',
    address: 'Jl. Salemba Raya No. 24, Jakarta',
  },
  {
    id: 'std-5',
    nisn: '0123456793',
    nis: '21005',
    name: 'Rizky Ramadhan',
    gender: 'L',
    gradeLevel: 'Kelas 4',
    fase: 'Fase B (Kelas 3-4)',
    parentName: 'Syamsul Bahri',
    parentPhone: '6281778899001',
    address: 'Jl. Wahid Hasyim No. 10, Jakarta',
  },
  {
    id: 'std-6',
    nisn: '0123456794',
    nis: '21006',
    name: 'Zhafira Kirana Larasati',
    gender: 'P',
    gradeLevel: 'Kelas 4',
    fase: 'Fase B (Kelas 3-4)',
    parentName: 'Ir. Bambang Triyono',
    parentPhone: '6281899001122',
    address: 'Jl. Matraman Baru No. 17, Jakarta',
  },

  // --- KELAS 5 (Fase C) ---
  {
    id: 'std-k5-1',
    nisn: '0143456741',
    nis: '20001',
    name: 'Irfan Maulana',
    gender: 'L',
    gradeLevel: 'Kelas 5',
    fase: 'Fase C (Kelas 5-6)',
    parentName: 'Dedi Maulana',
    parentPhone: '6281611112222',
    address: 'Jl. Raden Saleh No. 18, Jakarta',
  },
  {
    id: 'std-k5-2',
    nisn: '0143456742',
    nis: '20002',
    name: 'Jessica Amanda',
    gender: 'P',
    gradeLevel: 'Kelas 5',
    fase: 'Fase C (Kelas 5-6)',
    parentName: 'Ferry Amanda',
    parentPhone: '6281633334444',
    address: 'Jl. Cikini Raya No. 40, Jakarta',
  },

  // --- KELAS 6 (Fase C) ---
  {
    id: 'std-k6-1',
    nisn: '0133456751',
    nis: '19001',
    name: 'Kevin Pratama',
    gender: 'L',
    gradeLevel: 'Kelas 6',
    fase: 'Fase C (Kelas 5-6)',
    parentName: 'Hendrik Pratama',
    parentPhone: '6281711112222',
    address: 'Jl. Medan Merdeka Barat No. 2, Jakarta',
  },
  {
    id: 'std-k6-2',
    nisn: '0133456752',
    nis: '19002',
    name: 'Lathifah Nuraini',
    gender: 'P',
    gradeLevel: 'Kelas 6',
    fase: 'Fase C (Kelas 5-6)',
    parentName: 'H. Anshori',
    parentPhone: '6281733334444',
    address: 'Jl. Taman Suropati No. 7, Jakarta',
  },
];

// Pristine clean initial students roster for real school import
export const initialStudents: Student[] = [];

export const initialSubjects: MataPelajaran[] = [
  {
    id: 'mapel-1',
    code: 'PAI',
    name: 'Pendidikan Agama Islam dan Budi Pekerti',
    category: 'Wajib',
    fase: 'Fase B (Kelas 3-4)',
    tujuanPembelajaran: [
      {
        id: 'tp-pai-1',
        code: 'TP 1',
        description: 'Membaca dan menulis kalimat dalam QS Al-Hujurat ayat 13 dengan tartil',
        subjectId: 'mapel-1',
        lingkupMateri: 'Al-Qur’an dan Hadis',
      },
      {
        id: 'tp-pai-2',
        code: 'TP 2',
        description: 'Memahami makna Asmaulhusna Al-Malik, Al-Aziz, Al-Quddus, As-Salam',
        subjectId: 'mapel-1',
        lingkupMateri: 'Akidah Islam',
      },
      {
        id: 'tp-pai-3',
        code: 'TP 3',
        description: 'Menerapkan perilaku terpuji saling menghargai keragaman suku dan budaya',
        subjectId: 'mapel-1',
        lingkupMateri: 'Akhlak Mulia',
      },
      {
        id: 'tp-pai-4',
        code: 'TP 4',
        description: 'Mempraktikkan tata cara salat Jumat, salat duha, dan sujud syukur',
        subjectId: 'mapel-1',
        lingkupMateri: 'Fikih Ibadah',
      },
    ],
  },
  {
    id: 'mapel-2',
    code: 'PPKN',
    name: 'Pendidikan Pancasila',
    category: 'Wajib',
    fase: 'Fase B (Kelas 3-4)',
    tujuanPembelajaran: [
      {
        id: 'tp-ppkn-1',
        code: 'TP 1',
        description: 'Mengidentifikasi dan menerapkan nilai-nilai sila Pancasila dalam kehidupan sehari-hari',
        subjectId: 'mapel-2',
        lingkupMateri: 'Pancasila Sebagai Pandangan Hidup',
      },
      {
        id: 'tp-ppkn-2',
        code: 'TP 2',
        description: 'Mengidentifikasi aturan di keluarga, sekolah, dan lingkungan tempat tinggal',
        subjectId: 'mapel-2',
        lingkupMateri: 'Undang-Undang Dasar 1945',
      },
      {
        id: 'tp-ppkn-3',
        code: 'TP 3',
        description: 'Menghargai keragaman identitas suku, agama, dan budaya di Indonesia',
        subjectId: 'mapel-2',
        lingkupMateri: 'Bhinneka Tunggal Ika',
      },
      {
        id: 'tp-ppkn-4',
        code: 'TP 4',
        description: 'Menjelaskan lingkungan tempat tinggal sebagai bagian wilayah NKRI',
        subjectId: 'mapel-2',
        lingkupMateri: 'Negara Kesatuan Republik Indonesia',
      },
    ],
  },
  {
    id: 'mapel-3',
    code: 'BINDO',
    name: 'Bahasa Indonesia',
    category: 'Wajib',
    fase: 'Fase B (Kelas 3-4)',
    tujuanPembelajaran: [
      {
        id: 'tp-bindo-1',
        code: 'TP 1',
        description: 'Menemukan informasi penting dan ide pokok dalam teks narasi dan deskripsi',
        subjectId: 'mapel-3',
        lingkupMateri: 'Membaca dan Memirsa',
      },
      {
        id: 'tp-bindo-2',
        code: 'TP 2',
        description: 'Menyampaikan pendapat dengan santun dalam diskusi kelas tentang topik keseharian',
        subjectId: 'mapel-3',
        lingkupMateri: 'Berbicara dan Mempresentasikan',
      },
      {
        id: 'tp-bindo-3',
        code: 'TP 3',
        description: 'Menulis teks laporan sederhana dengan kaidah ejaan bahasa Indonesia yang baik',
        subjectId: 'mapel-3',
        lingkupMateri: 'Menulis Teks Faktual',
      },
      {
        id: 'tp-bindo-4',
        code: 'TP 4',
        description: 'Memahami makna kata baru dan kosakata khusus dalam kamus kontekstual',
        subjectId: 'mapel-3',
        lingkupMateri: 'Pengembangan Kosakata',
      },
    ],
  },
  {
    id: 'mapel-4',
    code: 'MTK',
    name: 'Matematika',
    category: 'Wajib',
    fase: 'Fase B (Kelas 3-4)',
    tujuanPembelajaran: [
      {
        id: 'tp-mtk-1',
        code: 'TP 1',
        description: 'Memahami konsep pecahan senilai dan operasi hitung dasar',
        subjectId: 'mapel-4',
        lingkupMateri: 'Bilangan dan Pecahan',
      },
      {
        id: 'tp-mtk-2',
        code: 'TP 2',
        description: 'Menyelesaikan masalah pola gambar dan bilangan perkalian pembagian',
        subjectId: 'mapel-4',
        lingkupMateri: 'Aljabar dan Operasi',
      },
      {
        id: 'tp-mtk-3',
        code: 'TP 3',
        description: 'Menghitung keliling dan luas bangun datar sederhana persegi dan persegi panjang',
        subjectId: 'mapel-4',
        lingkupMateri: 'Pengukuran dan Geometri',
      },
      {
        id: 'tp-mtk-4',
        code: 'TP 4',
        description: 'Menyajikan dan menafsirkan data dalam bentuk diagram batang',
        subjectId: 'mapel-4',
        lingkupMateri: 'Analisis Data dan Peluang',
      },
    ],
  },
  {
    id: 'mapel-5',
    code: 'IPAS',
    name: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
    category: 'Wajib',
    fase: 'Fase B (Kelas 3-4)',
    isOnlyFaseBC: true, // Only for Kelas 3, 4, 5, 6 (Fase B & C), NOT for Kelas 1 & 2
    tujuanPembelajaran: [
      {
        id: 'tp-ipas-1',
        code: 'TP 1',
        description: 'Mengidentifikasi bagian tubuh tumbuhan dan memahami fungsinya bagi kehidupan',
        subjectId: 'mapel-5',
        lingkupMateri: 'Struktur dan Fungsi Tumbuhan',
      },
      {
        id: 'tp-ipas-2',
        code: 'TP 2',
        description: 'Menjelaskan wujud zat dan perubahan bentuk materi di lingkungan sekitar',
        subjectId: 'mapel-5',
        lingkupMateri: 'Materi dan Perubahannya',
      },
      {
        id: 'tp-ipas-3',
        code: 'TP 3',
        description: 'Menjelaskan sumber energi alternatif di lingkungan sekitar',
        subjectId: 'mapel-5',
        lingkupMateri: 'Energi dan Transformasinya',
      },
      {
        id: 'tp-ipas-4',
        code: 'TP 4',
        description: 'Menganalisis kearifan lokal dan kegiatan ekonomi masyarakat daerah',
        subjectId: 'mapel-5',
        lingkupMateri: 'Sosial Budaya dan Ekonomi',
      },
    ],
  },
  {
    id: 'mapel-6',
    code: 'SENI',
    name: 'Seni Rupa dan Prakarya',
    category: 'Wajib',
    fase: 'Fase B (Kelas 3-4)',
    tujuanPembelajaran: [
      {
        id: 'tp-seni-1',
        code: 'TP 1',
        description: 'Mengenal unsur seni rupa (garis, bentuk, tekstur, warna) di alam',
        subjectId: 'mapel-6',
        lingkupMateri: 'Unsur Rupa',
      },
      {
        id: 'tp-seni-2',
        code: 'TP 2',
        description: 'Membuat karya seni rupa dua dimensi dan kriya berbahan daur ulang',
        subjectId: 'mapel-6',
        lingkupMateri: 'Karya Rupa Terapan',
      },
    ],
  },
  {
    id: 'mapel-7',
    code: 'PJOK',
    name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan',
    category: 'Wajib',
    fase: 'Fase B (Kelas 3-4)',
    tujuanPembelajaran: [
      {
        id: 'tp-pjok-1',
        code: 'TP 1',
        description: 'Mempraktikkan variasi pola gerak dasar lokomotor, nonlokomotor, dan manipulatif',
        subjectId: 'mapel-7',
        lingkupMateri: 'Gerak Dasar Olahraga',
      },
      {
        id: 'tp-pjok-2',
        code: 'TP 2',
        description: 'Memahami cara menjaga kebersihan diri dan pola makan sehat bergizi',
        subjectId: 'mapel-7',
        lingkupMateri: 'Kesehatan Pribadi',
      },
    ],
  },
  {
    id: 'mapel-8',
    code: 'BING',
    name: 'Bahasa Inggris',
    category: 'Pilihan',
    fase: 'Fase B (Kelas 3-4)',
    tujuanPembelajaran: [
      {
        id: 'tp-bing-1',
        code: 'TP 1',
        description: 'Merespons instruksi sederhana dalam bahasa Inggris di lingkungan kelas',
        subjectId: 'mapel-8',
        lingkupMateri: 'Listening & Responding',
      },
      {
        id: 'tp-bing-2',
        code: 'TP 2',
        description: 'Menyebutkan kosakata benda, warna, dan angka dengan pelafalan yang tepat',
        subjectId: 'mapel-8',
        lingkupMateri: 'Vocabulary & Speaking',
      },
    ],
  },
];

// Helper to filter subjects based on class level (Kurikulum Merdeka SD)
export function getSubjectsForClass(allSubjects: MataPelajaran[], classLevel: string): MataPelajaran[] {
  const isIPASEligible = isIPASActiveForClass(classLevel);
  return allSubjects.filter((subj) => {
    // If it's IPAS and class is Kelas 1 or 2 (Fase A), do NOT include it!
    if (subj.code === 'IPAS' || subj.isOnlyFaseBC) {
      return isIPASEligible;
    }
    return true;
  });
}

// Helper to construct realistic initial grades for demo students
export function createInitialGrades(studentsList: Student[] = sampleDummyStudents, subjectsList: MataPelajaran[] = initialSubjects): NilaiSiswaMapel[] {
  const grades: NilaiSiswaMapel[] = [];

  // Define score profiles for students
  const scoreProfiles: Record<string, Record<string, { lm: number[]; sas: number }>> = {
    'std-1': { // Ahmad Fauzan (matches PDF Example on Page 4!)
      'mapel-1': { lm: [88, 85, 90, 84], sas: 88 },
      'mapel-2': { lm: [85, 86, 92, 88], sas: 87 },
      'mapel-3': { lm: [86, 90, 84, 88], sas: 86 },
      'mapel-4': { lm: [95, 92, 88, 85], sas: 92 }, // TP 1 Pecahan Senilai highest (95)
      'mapel-5': { lm: [86, 84, 68, 85], sas: 78 }, // TP 3 Sumber Energi lowest (68) -> Exactly matches PDF prompt!
      'mapel-6': { lm: [85, 88], sas: 86 },
      'mapel-7': { lm: [90, 88], sas: 89 },
      'mapel-8': { lm: [84, 82], sas: 85 },
    },
    'std-2': { // Aisyah Putri
      'mapel-1': { lm: [92, 94, 90, 95], sas: 93 },
      'mapel-2': { lm: [90, 88, 92, 91], sas: 90 },
      'mapel-3': { lm: [94, 96, 92, 95], sas: 95 },
      'mapel-4': { lm: [88, 90, 86, 85], sas: 87 },
      'mapel-5': { lm: [90, 92, 88, 94], sas: 91 },
      'mapel-6': { lm: [95, 94], sas: 95 },
      'mapel-7': { lm: [85, 87], sas: 86 },
      'mapel-8': { lm: [92, 90], sas: 91 },
    },
    'std-3': { // Dimas Aditya
      'mapel-1': { lm: [80, 82, 78, 80], sas: 81 },
      'mapel-2': { lm: [78, 80, 82, 79], sas: 80 },
      'mapel-3': { lm: [75, 78, 76, 77], sas: 76 },
      'mapel-4': { lm: [70, 72, 74, 68], sas: 71 },
      'mapel-5': { lm: [76, 75, 72, 74], sas: 74 },
      'mapel-6': { lm: [82, 84], sas: 83 },
      'mapel-7': { lm: [92, 94], sas: 93 },
      'mapel-8': { lm: [72, 70], sas: 71 },
    },
    'std-4': { // Nabila Zahra
      'mapel-1': { lm: [95, 96, 94, 98], sas: 96 },
      'mapel-2': { lm: [92, 90, 95, 93], sas: 93 },
      'mapel-3': { lm: [92, 94, 90, 92], sas: 93 },
      'mapel-4': { lm: [90, 92, 94, 91], sas: 92 },
      'mapel-5': { lm: [94, 92, 90, 93], sas: 93 },
      'mapel-6': { lm: [90, 92], sas: 91 },
      'mapel-7': { lm: [86, 88], sas: 87 },
      'mapel-8': { lm: [95, 96], sas: 96 },
    },
    'std-5': { // Rizky Ramadhan
      'mapel-1': { lm: [82, 84, 80, 85], sas: 83 },
      'mapel-2': { lm: [80, 82, 84, 81], sas: 82 },
      'mapel-3': { lm: [81, 83, 79, 82], sas: 81 },
      'mapel-4': { lm: [84, 86, 82, 80], sas: 84 },
      'mapel-5': { lm: [83, 85, 80, 82], sas: 83 },
      'mapel-6': { lm: [86, 88], sas: 87 },
      'mapel-7': { lm: [90, 92], sas: 91 },
      'mapel-8': { lm: [78, 80], sas: 79 },
    },
    'std-6': { // Zhafira Kirana
      'mapel-1': { lm: [89, 91, 88, 92], sas: 90 },
      'mapel-2': { lm: [90, 88, 92, 89], sas: 90 },
      'mapel-3': { lm: [92, 90, 94, 91], sas: 92 },
      'mapel-4': { lm: [86, 88, 85, 87], sas: 87 },
      'mapel-5': { lm: [88, 90, 87, 89], sas: 89 },
      'mapel-6': { lm: [94, 96], sas: 95 },
      'mapel-7': { lm: [84, 86], sas: 85 },
      'mapel-8': { lm: [89, 91], sas: 90 },
    },
  };

  studentsList.forEach((student) => {
    // Only generate grades for subjects that are active for the student's class
    const studentSubjects = getSubjectsForClass(subjectsList, student.gradeLevel);

    studentSubjects.forEach((subj) => {
      const p = scoreProfiles[student.id]?.[subj.id] || {
        lm: [82, 85, 84, 86].slice(0, subj.tujuanPembelajaran.length),
        sas: 84,
      };

      const sumatifLM = subj.tujuanPembelajaran.map((tp, idx) => ({
        tpId: tp.id,
        tpCode: tp.code,
        tpDescription: tp.description,
        score: p.lm[idx] ?? 82,
      }));

      const { rataRataLM, nilaiAkhir, predikat } = calculateGrade(
        sumatifLM.map((x) => x.score),
        p.sas
      );

      const { highest, lowest } = findExtremeTPs(sumatifLM);

      let narasi = generateDefaultNarasi(student.name, highest?.desc, lowest?.desc);
      if (student.id === 'std-1' && subj.id === 'mapel-5') {
        // Exactly matches PDF page 4 generator
        narasi = 'Ananda Ahmad Fauzan menunjukkan penguasaan yang sangat baik dalam memahami struktur dan fungsi bagian tumbuhan. Perlu peningkatan dan bimbingan lanjutan pada materi menjelaskan sumber energi alternatif di lingkungan sekitar.';
      } else if (student.id === 'std-1' && subj.id === 'mapel-4') {
        narasi = 'Ananda Ahmad Fauzan menunjukkan penguasaan yang sangat baik dalam memahami konsep pecahan senilai dan operasi hitung dasar. Perlu penguatan pada materi menghitung keliling dan luas bangun datar.';
      }

      grades.push({
        studentId: student.id,
        subjectId: subj.id,
        formatifScores: [85, 88, 90],
        formatifNotes: 'Aktif bertanya dan mandiri menyelesaikan LKPD',
        sumatifLM,
        sumatifSAS: p.sas,
        rataRataLM,
        nilaiAkhir,
        predikat,
        highestTPId: highest?.id,
        highestTPDescription: highest?.desc,
        lowestTPId: lowest?.id,
        lowestTPDescription: lowest?.desc,
        narasiRapor: narasi,
        isAIGenerated: student.id === 'std-1',
      });
    });
  });

  return grades;
}

export const sampleDummyGrades: NilaiSiswaMapel[] = createInitialGrades();
export const initialGrades: NilaiSiswaMapel[] = [];

export const sampleDummyRaporDetails: Record<string, RaporSiswaDetail> = {
  'std-1': {
    studentId: 'std-1',
    catatanWaliKelas: 'Ahmad Fauzan memiliki semangat belajar dan rasa ingin tahu yang tinggi. Pertahankan prestasi dan tingkatkan konsistensi ketelitian pada materi hitungan & sains.',
    statusKenaikan: 'Naik ke Kelas Berikutnya',
    ekstrakurikuler: [
      { id: 'ekskul-1', name: 'Pramuka Siaga/Penggalang', predicate: 'Sangat Baik', description: 'Aktif, disiplin, dan cakap dalam tali-temali serta kerja sama regu.' },
      { id: 'ekskul-2', name: 'Dokter Kecil / UKS', predicate: 'Baik', description: 'Memahami prinsip pertolongan pertama dan aktif menjaga kebersihan sekolah.' },
    ],
    presensi: { sakit: 1, izin: 1, tanpaKeterangan: 0 },
    tinggiBadan: 138,
    beratBadan: 34,
    kondisiKesehatan: 'Sangat Baik dan Sehat',
  },
  'std-2': {
    studentId: 'std-2',
    catatanWaliKelas: 'Aisyah sangat cerdas, tekun, dan menjadi teladan bagi teman-temannya. Pertahankan kepemimpinan positifmu.',
    statusKenaikan: 'Naik ke Kelas Berikutnya',
    ekstrakurikuler: [
      { id: 'ekskul-1', name: 'Seni Tari Tradisional', predicate: 'Sangat Baik', description: 'Sangat lentur dan hafal gerakan tari kreasi daerah.' },
      { id: 'ekskul-2', name: 'Pramuka', predicate: 'Sangat Baik', description: 'Menunjukkan jiwa kepemimpinan sebagai pemimpin regu.' },
    ],
    presensi: { sakit: 0, izin: 0, tanpaKeterangan: 0 },
    tinggiBadan: 136,
    beratBadan: 31,
    kondisiKesehatan: 'Sangat Baik dan Sehat',
  },
  'std-3': {
    studentId: 'std-3',
    catatanWaliKelas: 'Dimas anak yang aktif, percaya diri, dan memiliki bakat olahraga luar biasa. Luangkan waktu lebih untuk latihan membaca dan matematika di rumah.',
    statusKenaikan: 'Naik ke Kelas Berikutnya',
    ekstrakurikuler: [
      { id: 'ekskul-1', name: 'Futsal / Sepak Bola', predicate: 'Sangat Baik', description: 'Keterampilan menggiring dan menembak bola sangat memuaskan.' },
      { id: 'ekskul-2', name: 'Pramuka', predicate: 'Baik', description: 'Cukup tertib mengikuti kegiatan perkemahan.' },
    ],
    presensi: { sakit: 2, izin: 1, tanpaKeterangan: 0 },
    tinggiBadan: 142,
    beratBadan: 36,
    kondisiKesehatan: 'Sehat dan Bugar',
  },
  'std-4': {
    studentId: 'std-4',
    catatanWaliKelas: 'Nabila sangat santun, berakhlak mulia, dan berprestasi akademik konsisten. Selamat atas pencapaian gemilang semester ini.',
    statusKenaikan: 'Naik ke Kelas Berikutnya',
    ekstrakurikuler: [
      { id: 'ekskul-1', name: 'English Club', predicate: 'Sangat Baik', description: 'Percaya diri berbicara bahasa Inggris dalam percakapan sehari-hari.' },
      { id: 'ekskul-2', name: 'Pramuka', predicate: 'Sangat Baik', description: 'Disiplin dan selalu hadir tepat waktu.' },
    ],
    presensi: { sakit: 0, izin: 1, tanpaKeterangan: 0 },
    tinggiBadan: 135,
    beratBadan: 30,
    kondisiKesehatan: 'Sangat Baik dan Sehat',
  },
  'std-5': {
    studentId: 'std-5',
    catatanWaliKelas: 'Rizky menunjukkan kemajuan pesat dalam kerja kelompok dan kemandirian belajar. Tetap pertahankan antusiasmemu!',
    statusKenaikan: 'Naik ke Kelas Berikutnya',
    ekstrakurikuler: [
      { id: 'ekskul-1', name: 'Pramuka', predicate: 'Baik', description: 'Mampu bekerja sama dalam tim regu penggalang.' },
    ],
    presensi: { sakit: 1, izin: 0, tanpaKeterangan: 0 },
    tinggiBadan: 137,
    beratBadan: 33,
    kondisiKesehatan: 'Sehat',
  },
  'std-6': {
    studentId: 'std-6',
    catatanWaliKelas: 'Zhafira adalah siswa yang berdedikasi tinggi, kreatif, dan memiliki bakat seni yang menonjol. Hebat!',
    statusKenaikan: 'Naik ke Kelas Berikutnya',
    ekstrakurikuler: [
      { id: 'ekskul-1', name: 'Seni Lukis / Gambar', predicate: 'Sangat Baik', description: 'Penguasaan komposisi warna dan perspektif sangat indah.' },
      { id: 'ekskul-2', name: 'Pramuka', predicate: 'Baik', description: 'Aktif mengikuti kegiatan kepramukaan.' },
    ],
    presensi: { sakit: 0, izin: 0, tanpaKeterangan: 0 },
    tinggiBadan: 139,
    beratBadan: 32,
    kondisiKesehatan: 'Sangat Baik dan Sehat',
  },
};

// Pristine clean initial rapor details for real school data
export const initialRaporDetails: Record<string, RaporSiswaDetail> = {};
// Initial Grade Config (Default 60% LM + 40% SAS)
export const initialGradeConfig: {
  lmWeightPercent: number;
  sasWeightPercent: number;
  defaultLmCount: number;
  kkmThreshold: number;
} = {
  lmWeightPercent: 60,
  sasWeightPercent: 40,
  defaultLmCount: 4,
  kkmThreshold: 75,
};

// Initial P5 Projects (Projek Penguatan Profil Pelajar Pancasila)
export const initialP5Projects = [
  {
    id: 'p5-proj-1',
    title: 'Cerdik Mengolah Sampah Plastik Menjadi Karya Seni',
    theme: 'Gaya Hidup Berkelanjutan' as const,
    description: 'Peserta didik mengamati permasalahan sampah anorganik di sekitar sekolah, belajar memilah sampah, dan mendaur ulang botol plastik menjadi pot tanaman hias ramah lingkungan.',
    academicYear: '2024/2025',
    semester: '1 (Ganjil)' as const,
    classLevel: 'Kelas 4' as const,
    dimensions: [
      {
        dimensionName: 'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
        subElements: [
          {
            id: 'sub-1',
            code: 'D1.E1',
            title: 'Menjaga Lingkungan Alam Sekitar',
            targetCapai: 'Terbiasa memahami tindakan ramah dan tidak ramah lingkungan serta membiasakan diri untuk berperilaku ramah lingkungan di sekolah.',
          },
        ],
      },
      {
        dimensionName: 'Bergotong Royong',
        subElements: [
          {
            id: 'sub-2',
            code: 'D2.E1',
            title: 'Kerjasama dalam Kelompok',
            targetCapai: 'Menampilkan tindakan yang sesuai dengan harapan dan tujuan kelompok dalam merancang dan membuat karya daur ulang.',
          },
          {
            id: 'sub-3',
            code: 'D2.E2',
            title: 'Komunikasi untuk Mencapai Tujuan Bersama',
            targetCapai: 'Memahami informasi yang disampaikan orang lain dan menyampaikan gagasan dengan santun.',
          },
        ],
      },
      {
        dimensionName: 'Kreatif',
        subElements: [
          {
            id: 'sub-4',
            code: 'D3.E1',
            title: 'Menghasilkan Karya dan Tindakan Orisinal',
            targetCapai: 'Mengeksplorasi dan mengekspresikan pikiran dan/atau perasaannya sesuai dengan minat dan kesukaannya dalam bentuk karya seni daur ulang.',
          },
        ],
      },
    ],
  },
  {
    id: 'p5-proj-2',
    title: 'Festival Kuliner Tradisional Nusantara',
    theme: 'Kearifan Lokal' as const,
    description: 'Mengenal keanekaragaman makanan khas daerah nusantara, teknik pembuatan sederhana, dan menyelenggarakan bazar makanan tradisional di lingkungan sekolah.',
    academicYear: '2024/2025',
    semester: '1 (Ganjil)' as const,
    classLevel: 'Kelas 4' as const,
    dimensions: [
      {
        dimensionName: 'Berkebinekaan Global',
        subElements: [
          {
            id: 'sub-5',
            code: 'D4.E1',
            title: 'Mendalami Budaya dan Identitas Budaya',
            targetCapai: 'Mengidentifikasi dan mendeskripsikan keragaman budaya di sekitarnya serta menjelaskan peran budaya dalam kehidupan bermasyarakat.',
          },
        ],
      },
      {
        dimensionName: 'Mandiri',
        subElements: [
          {
            id: 'sub-6',
            code: 'D5.E1',
            title: 'Percaya Diri dan Tangguh',
            targetCapai: 'Berani mencoba dan tidak mudah menyerah saat menghadapi tantangan dalam mempersiapkan festival kuliner.',
          },
        ],
      },
    ],
  },
];

export const sampleDummyP5Scores = [
  {
    studentId: 'std-1',
    projectId: 'p5-proj-1',
    scores: {
      'sub-1': 'SAB' as const,
      'sub-2': 'BSH' as const,
      'sub-3': 'BSH' as const,
      'sub-4': 'SAB' as const,
    },
    catatanProses: 'Ahmad sangat antusias dalam memilah sampah dan menjadi ketua kelompok yang sangat menginspirasi teman-temannya saat membuat pot tanaman.',
  },
  {
    studentId: 'std-2',
    projectId: 'p5-proj-1',
    scores: {
      'sub-1': 'BSH' as const,
      'sub-2': 'BSH' as const,
      'sub-3': 'BSH' as const,
      'sub-4': 'BSH' as const,
    },
    catatanProses: 'Budi menunjukkan kerjasama yang solid dalam regu dan aktif membantu membersihkan area pembuatan proyek.',
  },
  {
    studentId: 'std-3',
    projectId: 'p5-proj-1',
    scores: {
      'sub-1': 'BSH' as const,
      'sub-2': 'SB' as const,
      'sub-3': 'BSH' as const,
      'sub-4': 'BSH' as const,
    },
    catatanProses: 'Citra memiliki ide artistik yang menarik dalam mewarnai pot bunga daur ulang.',
  },
];

export const initialP5Scores: typeof sampleDummyP5Scores = [];



