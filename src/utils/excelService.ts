import * as XLSX from 'xlsx';
import {
  Student,
  MataPelajaran,
  NilaiSiswaMapel,
  RaporSiswaDetail,
  ClassLevel,
  SchoolProfile,
  getFaseByClass,
} from '../types';
import { getSubjectsForClass } from '../data/initialData';

/**
 * Downloads a comprehensive, clean, multi-sheet Excel (.xlsx) template matching the application's exact format.
 */
export function downloadExcelTemplate(activeClassLevel: ClassLevel = 'Kelas 4') {
  const fase = getFaseByClass(activeClassLevel);
  const wb = XLSX.utils.book_new();

  // --- SHEET 1: DATA_SISWA ---
  const siswaHeaders = [
    'No',
    'NISN (Wajib)',
    'NIS',
    'Nama Lengkap Siswa (Wajib)',
    'Jenis Kelamin (L/P)',
    'Tingkat Kelas',
    'Fase',
    'Nama Orang Tua / Wali',
    'Nomor WhatsApp Wali (Contoh: 62812xxxx)',
    'Alamat Lengkap',
    'Tanggal Lahir (YYYY-MM-DD)',
  ];

  const sampleSiswaData = [
    [
      1,
      '0123456781',
      '24001',
      'Ahmad Fauzan Pratama',
      'L',
      activeClassLevel,
      fase,
      'H. Fauzan Pratama',
      '6281234567890',
      'Jl. Merdeka No. 10, Jakarta',
      '2014-05-12',
    ],
    [
      2,
      '0123456782',
      '24002',
      'Aisyah Putri Rahmadani',
      'P',
      activeClassLevel,
      fase,
      'Rahmat Hidayat',
      '6281298765432',
      'Jl. Cempaka Putih No. 5, Jakarta',
      '2014-08-20',
    ],
    [
      3,
      '0123456783',
      '24003',
      'Bima Sakti Nugroho',
      'L',
      activeClassLevel,
      fase,
      'Bambang Nugroho',
      '6281311223344',
      'Jl. Kenari Raya No. 12, Jakarta',
      '2014-02-14',
    ],
    [
      4,
      '0123456784',
      '24004',
      'Cantika Dewi Lestari',
      'P',
      activeClassLevel,
      fase,
      'Lestari Widodo',
      '6281566778899',
      'Jl. Melati No. 8, Jakarta',
      '2014-11-03',
    ],
    [
      5,
      '0123456785',
      '24005',
      'Dimas Aditya Pratama',
      'L',
      activeClassLevel,
      fase,
      'Aditya Kurniawan',
      '6281788990011',
      'Jl. Menteng Asri No. 24, Jakarta',
      '2014-06-25',
    ],
  ];

  const wsSiswa = XLSX.utils.aoa_to_sheet([siswaHeaders, ...sampleSiswaData]);
  wsSiswa['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 10 },
    { wch: 30 },
    { wch: 18 },
    { wch: 15 },
    { wch: 22 },
    { wch: 26 },
    { wch: 28 },
    { wch: 35 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSiswa, 'DATA_SISWA');

  // --- SHEET 2: NILAI_SUMATIF_MAPEL ---
  const nilaiHeaders = [
    'No',
    'NISN',
    'Nama Siswa',
    'Mata Pelajaran',
    'LM 1 (0-100)',
    'LM 2 (0-100)',
    'LM 3 (0-100)',
    'LM 4 (0-100)',
    'Nilai SAS (0-100)',
    'Catatan / Narasi Capaian Rapor',
  ];

  const sampleNilaiData = [
    [
      1,
      '0123456781',
      'Ahmad Fauzan Pratama',
      'Pendidikan Pancasila',
      88,
      90,
      85,
      92,
      88,
      'Menunjukkan penguasaan yang sangat baik dalam memahami makna simbol Pancasila.',
    ],
    [
      2,
      '0123456781',
      'Ahmad Fauzan Pratama',
      'Bahasa Indonesia',
      85,
      82,
      88,
      90,
      86,
      'Sangat terampil dalam menyusun paragraf deskripsi yang runtut dan ekspresif.',
    ],
    [
      3,
      '0123456781',
      'Ahmad Fauzan Pratama',
      'Matematika',
      82,
      80,
      85,
      78,
      84,
      'Cakap dalam operasi bilangan pecahan dan perlu latihan pada soal cerita.',
    ],
    [
      4,
      '0123456782',
      'Aisyah Putri Rahmadani',
      'Pendidikan Pancasila',
      92,
      95,
      90,
      94,
      93,
      'Menunjukkan teladan yang luar biasa dalam penerapan norma dan aturan di sekolah.',
    ],
  ];

  const wsNilai = XLSX.utils.aoa_to_sheet([nilaiHeaders, ...sampleNilaiData]);
  wsNilai['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 28 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 55 },
  ];
  XLSX.utils.book_append_sheet(wb, wsNilai, 'NILAI_SUMATIF');

  // --- SHEET 3: PRESENSI_DAN_EKSKUL ---
  const presensiHeaders = [
    'No',
    'NISN',
    'Nama Siswa',
    'Sakit (Hari)',
    'Izin (Hari)',
    'Alpa (Hari)',
    'Kegiatan Ekstrakurikuler',
    'Predikat Ekskul (Sangat Baik/Baik/Cukup)',
    'Catatan Wali Kelas',
    'Keputusan Kenaikan (Naik ke Kelas Berikutnya/Lulus)',
  ];

  const samplePresensiData = [
    [
      1,
      '0123456781',
      'Ahmad Fauzan Pratama',
      0,
      1,
      0,
      'Pramuka Siaga/Penggalang',
      'Sangat Baik',
      'Menunjukkan perkembangan akademik dan kepemimpinan yang sangat baik.',
      'Naik ke Kelas Berikutnya',
    ],
    [
      2,
      '0123456782',
      'Aisyah Putri Rahmadani',
      1,
      0,
      0,
      'Seni Tari Tradisional',
      'Sangat Baik',
      'Selalu aktif, sopan, dan berprestasi dalam setiap kegiatan kelas.',
      'Naik ke Kelas Berikutnya',
    ],
  ];

  const wsPresensi = XLSX.utils.aoa_to_sheet([presensiHeaders, ...samplePresensiData]);
  wsPresensi['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 28 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 28 },
    { wch: 25 },
    { wch: 45 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPresensi, 'PRESENSI_EKSKUL');

  // --- SHEET 4: PETUNJUK_PENGISIAN ---
  const petunjuk = [
    ['PETUNJUK PENGISIAN FORMAT EXCEL e-RAPOR KURIKULUM MERDEKA (iihh Beres)'],
    [''],
    ['1. SHEET DATA_SISWA:'],
    ['   - Kolom NISN dan Nama Lengkap WAJIB diisi.'],
    ['   - Jenis Kelamin diisi "L" untuk Laki-laki atau "P" untuk Perempuan.'],
    ['   - Tingkat Kelas dapat diisi: "Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", atau "Kelas 6".'],
    ['   - Nomor WhatsApp Wali ditulis dengan awalan "62" atau "08" (contoh: 6281234567890).'],
    [''],
    ['2. SHEET NILAI_SUMATIF:'],
    ['   - Nilai LM (Lingkup Materi) dan SAS diisi angka rentang 0 s.d. 100.'],
    ['   - Rumus Nilai Akhir (NA) otomatis diolah sistem: NA = (Rata-rata LM × 60%) + (SAS × 40%).'],
    ['   - Kolom Narasi Capaian dapat dikosongkan jika ingin digenerate otomatis oleh AI di dalam aplikasi.'],
    [''],
    ['3. KETENTUAN MATA PELAJARAN:'],
    ['   - Pada Kelas 1 dan Kelas 2 (Fase A), mata pelajaran IPAS otomatis ditiadakan sesuai Permendikbudristek.'],
    ['   - Pada Kelas 3, 4, 5, dan 6 (Fase B & C), IPAS aktif.'],
    [''],
    ['4. CARA IMPORT KE APLIKASI:'],
    ['   - Simpan berkas ini setelah diedit (.xlsx atau .csv).'],
    ['   - Masuk ke menu "Dapodik / Excel" pada aplikasi iihh Beres.'],
    ['   - Unggah berkas Excel ini, lalu klik tombol "Impor Data ke Aplikasi".'],
  ];

  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjuk);
  wsPetunjuk['!cols'] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'PETUNJUK_PENGISIAN');

  // Trigger download
  const fileName = `Format_Template_Siswa_eRapor_${activeClassLevel.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Exports all active class students and their complete grades, presensi, and notes into an Excel (.xlsx) file.
 */
export function exportClassDataToExcel(
  students: Student[],
  subjects: MataPelajaran[],
  grades: NilaiSiswaMapel[],
  raporDetails: Record<string, RaporSiswaDetail>,
  activeClassLevel: ClassLevel,
  schoolProfile: SchoolProfile
) {
  const wb = XLSX.utils.book_new();

  // Filter students for active class
  const classStudents = students.filter(
    (std) => std.gradeLevel === activeClassLevel || (!std.gradeLevel && activeClassLevel === 'Kelas 4')
  );
  const classSubjects = getSubjectsForClass(subjects, activeClassLevel);

  // 1. Sheet Data Siswa
  const siswaData = [
    [
      'No',
      'NISN',
      'NIS',
      'Nama Peserta Didik',
      'L/P',
      'Kelas',
      'Fase',
      'Nama Orang Tua / Wali',
      'No HP / WhatsApp',
      'Alamat',
    ],
    ...classStudents.map((std, idx) => [
      idx + 1,
      std.nisn,
      std.nis,
      std.name,
      std.gender,
      std.gradeLevel || activeClassLevel,
      std.fase || getFaseByClass(activeClassLevel),
      std.parentName || '-',
      std.parentPhone || '-',
      std.address || '-',
    ]),
  ];
  const wsSiswa = XLSX.utils.aoa_to_sheet(siswaData);
  wsSiswa['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 10 },
    { wch: 28 },
    { wch: 6 },
    { wch: 12 },
    { wch: 20 },
    { wch: 24 },
    { wch: 22 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSiswa, 'Data_Siswa');

  // 2. Sheet Rekap Nilai Akhir (Matrix Table)
  const matrixHeaders = [
    'No',
    'NISN',
    'Nama Siswa',
    ...classSubjects.map((s) => s.name),
    'Rata-rata Nilai',
    'Peringkat / Status',
  ];

  const matrixRows = classStudents.map((std, idx) => {
    let totalScore = 0;
    let scoreCount = 0;
    const scores = classSubjects.map((subj) => {
      const g = grades.find((gr) => gr.studentId === std.id && gr.subjectId === subj.id);
      const score = g?.nilaiAkhir ?? 0;
      if (score > 0) {
        totalScore += score;
        scoreCount++;
      }
      return score || '-';
    });
    const avg = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : '-';
    return [idx + 1, std.nisn, std.name, ...scores, avg, 'Tuntas'];
  });

  const wsMatrix = XLSX.utils.aoa_to_sheet([matrixHeaders, ...matrixRows]);
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Rekap_Nilai_Akhir');

  // 3. Sheet Rincian & Narasi Rapor
  const rincianHeaders = [
    'No',
    'NISN',
    'Nama Siswa',
    'Mata Pelajaran',
    'Rata LM',
    'SAS',
    'Nilai Akhir',
    'Predikat',
    'Narasi Capaian Kompetensi (Kemdikbud)',
  ];

  const rincianRows: any[] = [];
  let rowNo = 1;
  classStudents.forEach((std) => {
    classSubjects.forEach((subj) => {
      const g = grades.find((gr) => gr.studentId === std.id && gr.subjectId === subj.id);
      rincianRows.push([
        rowNo++,
        std.nisn,
        std.name,
        subj.name,
        g?.rataRataLM ?? 80,
        g?.sumatifSAS ?? 80,
        g?.nilaiAkhir ?? 80,
        g?.predikat ?? 'Baik',
        g?.narasiRapor || `Ananda ${std.name} menunjukkan penguasaan yang baik dalam materi ${subj.name}.`,
      ]);
    });
  });

  const wsRincian = XLSX.utils.aoa_to_sheet([rincianHeaders, ...rincianRows]);
  wsRincian['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 26 },
    { wch: 22 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 55 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRincian, 'Rincian_Narasi');

  // 4. Sheet Presensi & Catatan Wali Kelas
  const presensiHeaders = [
    'No',
    'NISN',
    'Nama Siswa',
    'Sakit',
    'Izin',
    'Alpa',
    'Catatan Wali Kelas',
    'Keputusan Kenaikan',
  ];

  const presensiRows = classStudents.map((std, idx) => {
    const detail = raporDetails[std.id];
    return [
      idx + 1,
      std.nisn,
      std.name,
      detail?.presensi.sakit ?? 0,
      detail?.presensi.izin ?? 0,
      detail?.presensi.tanpaKeterangan ?? 0,
      detail?.catatanWaliKelas || 'Menunjukkan perkembangan belajar yang baik.',
      detail?.statusKenaikan || 'Naik ke Kelas Berikutnya',
    ];
  });

  const wsPresensi = XLSX.utils.aoa_to_sheet([presensiHeaders, ...presensiRows]);
  wsPresensi['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 28 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 45 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPresensi, 'Presensi_Catatan');

  const fileName = `Rekap_eRapor_${activeClassLevel.replace(/\s+/g, '_')}_${schoolProfile.schoolName.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export interface ColumnMapping {
  nisn: number;
  nis: number;
  name: number;
  gender: number;
  gradeLevel: number;
  parentName: number;
  parentPhone: number;
  address: number;
  birthDate: number;
}

export interface RowValidationItem {
  rowNumber: number;
  student: Student;
  status: 'valid' | 'warning' | 'error';
  messages: string[];
}

export interface InspectResult {
  sheetNames: string[];
  selectedSheet: string;
  headers: string[];
  rawRows: any[][];
  suggestedMapping: ColumnMapping;
}

export interface ValidationSummary {
  items: RowValidationItem[];
  validCount: number;
  warningCount: number;
  errorCount: number;
  studentsToImport: Student[];
}

/**
 * Heuristic detector for matching column header text to expected Student fields.
 */
export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normHeaders = headers.map((h) => String(h || '').trim().toLowerCase());

  const findCol = (keywords: string[]): number => {
    return normHeaders.findIndex((h) => keywords.some((k) => h.includes(k)));
  };

  const nisnIdx = findCol(['nisn', 'nomor induk siswa nasional', 'no nisn']);
  const nisIdx = normHeaders.findIndex((h) => (h.includes('nis') || h.includes('nipd') || h.includes('no induk')) && !h.includes('nisn'));
  const nameIdx = findCol(['nama lengkap', 'nama siswa', 'nama murid', 'nama peserta', 'nama']);
  const genderIdx = findCol(['jenis kelamin', 'kelamin', 'l/p', 'gender', 'jk', 'sex']);
  const gradeIdx = findCol(['kelas', 'tingkat', 'rombel', 'grade']);
  const parentIdx = findCol(['nama orang tua', 'orang tua', 'wali', 'ayah', 'ibu', 'ortu', 'parent']);
  const phoneIdx = findCol(['whatsapp', 'nomor wa', 'no hp', 'telepon', 'phone', 'hp', 'kontak']);
  const addressIdx = findCol(['alamat', 'domisili', 'tempat tinggal', 'jalan', 'address']);
  const birthIdx = findCol(['tanggal lahir', 'tgl lahir', 'tgl_lahir', 'tgl. lahir', 'lahir', 'birth']);

  return {
    nisn: nisnIdx,
    nis: nisIdx,
    name: nameIdx,
    gender: genderIdx,
    gradeLevel: gradeIdx,
    parentName: parentIdx,
    parentPhone: phoneIdx,
    address: addressIdx,
    birthDate: birthIdx,
  };
}

/**
 * Inspects an Excel or CSV file without mutating state.
 * Returns sheet list, detected headers, raw sample rows, and suggested mappings.
 */
export async function inspectExcelOrCSVFile(file: File): Promise<InspectResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Berkas tidak memiliki sheet data.');
        }

        // Auto-select most appropriate sheet
        const selectedSheet =
          workbook.SheetNames.find((s) => {
            const upper = s.toUpperCase();
            return upper.includes('SISWA') || upper.includes('DATA') || upper.includes('DAPODIK') || upper.includes('PESERTA');
          }) || workbook.SheetNames[0];

        const worksheet = workbook.Sheets[selectedSheet];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rows.length === 0) {
          throw new Error('Lembar kerja Excel kosong.');
        }

        // Identify header row (find first row with at least 2 non-empty string cells)
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const stringCells = (rows[i] || []).filter((c) => typeof c === 'string' && c.trim().length > 0);
          if (stringCells.length >= 2) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = (rows[headerRowIndex] || []).map((h: any, idx: number) => {
          const txt = String(h || '').trim();
          return txt || `Kolom ${idx + 1}`;
        });

        const rawRows = rows.slice(headerRowIndex + 1).filter((r) => r && r.some((c: any) => String(c).trim() !== ''));

        const suggestedMapping = detectColumnMapping(headers);

        resolve({
          sheetNames: workbook.SheetNames,
          selectedSheet,
          headers,
          rawRows,
          suggestedMapping,
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validates and transforms raw sheet rows using a specific column mapping.
 * Identifies errors, warnings, duplicate NISNs, and produces clean Student models.
 */
export function validateAndTransformRows(
  rows: any[][],
  mapping: ColumnMapping,
  defaultClassLevel: ClassLevel = 'Kelas 4'
): ValidationSummary {
  const items: RowValidationItem[] = [];
  const seenNisns = new Set<string>();
  const studentsToImport: Student[] = [];

  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // considering 1-based index and header
    const messages: string[] = [];
    let status: 'valid' | 'warning' | 'error' = 'valid';

    // 1. Name Check (Strict Error)
    const rawName = mapping.name !== -1 && row[mapping.name] ? String(row[mapping.name]).trim() : '';
    if (!rawName) {
      status = 'error';
      messages.push('Nama Siswa kosong / tidak terpetakan.');
    }

    // 2. NISN Check (Warning if missing or non-standard)
    let rawNisn = mapping.nisn !== -1 && row[mapping.nisn] ? String(row[mapping.nisn]).trim().replace(/\D/g, '') : '';
    if (!rawNisn) {
      status = status === 'error' ? 'error' : 'warning';
      messages.push('NISN kosong, dibuatkan otomatis oleh sistem.');
      rawNisn = `018${Date.now().toString().slice(-5)}${String(idx + 1).padStart(2, '0')}`;
    } else if (rawNisn.length !== 10) {
      status = status === 'error' ? 'error' : 'warning';
      messages.push(`Panjang NISN (${rawNisn.length} digit) tidak standar (umumnya 10 digit).`);
    }

    // Duplicate NISN check in this batch
    if (seenNisns.has(rawNisn)) {
      status = status === 'error' ? 'error' : 'warning';
      messages.push(`NISN ${rawNisn} duplikat di dalam berkas ini.`);
    } else {
      seenNisns.add(rawNisn);
    }

    // 3. NIS
    const rawNis = mapping.nis !== -1 && row[mapping.nis] ? String(row[mapping.nis]).trim() : `240${String(idx + 1).padStart(2, '0')}`;

    // 4. Gender normalization
    const rawGender = mapping.gender !== -1 && row[mapping.gender] ? String(row[mapping.gender]).trim().toUpperCase() : 'L';
    let gender: 'L' | 'P' = 'L';
    if (rawGender.startsWith('P') || rawGender.includes('WANITA') || rawGender.includes('PEREMPUAN')) {
      gender = 'P';
    } else if (rawGender.startsWith('L') || rawGender.includes('PRIA') || rawGender.includes('LAKI')) {
      gender = 'L';
    } else {
      status = status === 'error' ? 'error' : 'warning';
      messages.push(`Jenis kelamin "${rawGender}" tidak baku, otomatis diatur ke 'L'.`);
    }

    // 5. Grade level normalization
    const rawGrade = mapping.gradeLevel !== -1 && row[mapping.gradeLevel] ? String(row[mapping.gradeLevel]).trim() : defaultClassLevel;
    let gradeLevel: ClassLevel = defaultClassLevel;
    if (rawGrade.includes('1') || rawGrade.toUpperCase() === 'I') gradeLevel = 'Kelas 1';
    else if (rawGrade.includes('2') || rawGrade.toUpperCase() === 'II') gradeLevel = 'Kelas 2';
    else if (rawGrade.includes('3') || rawGrade.toUpperCase() === 'III') gradeLevel = 'Kelas 3';
    else if (rawGrade.includes('4') || rawGrade.toUpperCase() === 'IV') gradeLevel = 'Kelas 4';
    else if (rawGrade.includes('5') || rawGrade.toUpperCase() === 'V') gradeLevel = 'Kelas 5';
    else if (rawGrade.includes('6') || rawGrade.toUpperCase() === 'VI') gradeLevel = 'Kelas 6';

    // 6. Parent Name & Phone
    const parentName = mapping.parentName !== -1 && row[mapping.parentName] ? String(row[mapping.parentName]).trim() : 'Orang Tua / Wali';
    let parentPhone = mapping.parentPhone !== -1 && row[mapping.parentPhone] ? String(row[mapping.parentPhone]).trim() : '6281234567890';
    // Clean and normalize phone number to international WhatsApp format
    const cleanedPhone = parentPhone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('08')) {
      parentPhone = '62' + cleanedPhone.slice(1);
    } else if (cleanedPhone.startsWith('8')) {
      parentPhone = '62' + cleanedPhone;
    } else if (cleanedPhone.startsWith('62')) {
      parentPhone = cleanedPhone;
    }

    // 7. Address & Birth date
    const address = mapping.address !== -1 && row[mapping.address] ? String(row[mapping.address]).trim() : 'Alamat Domisili Siswa';
    const birthDate = mapping.birthDate !== -1 && row[mapping.birthDate] ? String(row[mapping.birthDate]).trim() : undefined;

    const student: Student = {
      id: `std-imp-${Date.now()}-${idx + 1}`,
      nisn: rawNisn,
      nis: rawNis,
      name: rawName || `Siswa Baris #${rowNum}`,
      gender,
      gradeLevel,
      fase: getFaseByClass(gradeLevel),
      parentName: parentName || 'Wali Murid',
      parentPhone: parentPhone || '6281234567890',
      address: address || 'Indonesia',
      birthDate,
    };

    if (status === 'valid') validCount++;
    else if (status === 'warning') warningCount++;
    else errorCount++;

    items.push({
      rowNumber: rowNum,
      student,
      status,
      messages,
    });

    if (status !== 'error') {
      studentsToImport.push(student);
    }
  });

  return {
    items,
    validCount,
    warningCount,
    errorCount,
    studentsToImport,
  };
}

/**
 * Backward compatibility parser for direct file upload.
 */
export async function parseExcelOrCSVFile(file: File): Promise<Student[]> {
  const inspect = await inspectExcelOrCSVFile(file);
  const result = validateAndTransformRows(inspect.rawRows, inspect.suggestedMapping);
  if (result.studentsToImport.length === 0) {
    throw new Error('Tidak ada data siswa yang valid untuk diimpor.');
  }
  return result.studentsToImport;
}

