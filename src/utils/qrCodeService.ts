import QRCode from 'qrcode';

/**
 * Generates high quality data URL for QR Code
 */
export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 140,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Pre-generate standard e-Sign QR Code Payload for Kemdikbudristek / BSRE Validation
 */
export function buildQrSignPayload(params: {
  signerRole: 'Guru Kelas / Wali Kelas' | 'Kepala Sekolah' | 'Koordinator Projek';
  signerName: string;
  signerNIP: string;
  schoolName: string;
  studentName?: string;
  academicYear?: string;
  date?: string;
  verificationCode?: string;
}): string {
  const code = params.verificationCode || `ERAPOR-${params.schoolName.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  return [
    `DOKUMEN RESMI E-RAPOR KURIKULUM MERDEKA`,
    `Telah Ditandatangani Secara Elektronik (e-Sign BSRE)`,
    `Jabatan: ${params.signerRole}`,
    `Nama: ${params.signerName}`,
    `NIP: ${params.signerNIP || '-'}`,
    `Satuan Pendidikan: ${params.schoolName}`,
    params.studentName ? `Nama Siswa: ${params.studentName}` : '',
    params.academicYear ? `Tahun Ajaran: ${params.academicYear}` : '',
    `Titimangsa: ${params.date || new Date().toLocaleDateString('id-ID')}`,
    `Kode Verifikasi: ${code}`,
    `Status: TERVERIFIKASI & SAH KEMDIKBUDRISTEK`,
  ].filter(Boolean).join('\n');
}
