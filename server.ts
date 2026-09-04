import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini AI client initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aiEnabled: Boolean(process.env.GEMINI_API_KEY) });
});

// Fallback rule-based generator implementing exact Kurikulum Merdeka Kemdikbudristek format
function generateRuleBasedNarasi(
  studentName: string,
  _subjectName: string,
  highestTP: string,
  lowestTP: string
): string {
  const name = studentName.trim();
  const high = highestTP.trim().replace(/\.$/, "");
  const low = lowestTP.trim().replace(/\.$/, "");

  if (high && low && high !== low) {
    return `Ananda ${name} menunjukkan penguasaan yang sangat baik dalam ${high.toLowerCase()}. Perlu peningkatan dan bimbingan lanjutan pada materi ${low.toLowerCase()}.`;
  } else if (high) {
    return `Ananda ${name} menunjukkan penguasaan yang sangat baik dan konsisten dalam ${high.toLowerCase()}. Pertahankan capaian belajar yang membanggakan ini.`;
  } else if (low) {
    return `Ananda ${name} telah mengikuti seluruh proses pembelajaran dengan baik dan membutuhkan bimbingan lanjutan pada materi ${low.toLowerCase()}.`;
  }
  return `Ananda ${name} menunjukkan ketercapaian kompetensi pembelajaran yang baik dan aktif selama kegiatan belajar mengajar di kelas.`;
}

// API endpoint to generate single or batch narrative for e-Rapor
app.post("/api/gemini/generate-narasi", async (req, res) => {
  try {
    const { studentName, gradeLevel, subjectName, highestTP, lowestTP, customNotes, tone = "standar" } = req.body;

    if (!studentName) {
      return res.status(400).json({ error: "Nama siswa diperlukan" });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Graceful fallback to compliant rule-based narrative
      const fallbackNarasi = generateRuleBasedNarasi(studentName, subjectName || "Mata Pelajaran", highestTP || "", lowestTP || "");
      return res.json({
        narasi: fallbackNarasi,
        source: "rule_engine",
      });
    }

    const systemRole = "Anda adalah Asisten Guru Senior Sekolah Dasar yang ahli dalam menyusun deskripsi rapor naratif berbasis Kurikulum Merdeka Republik Indonesia (Kemdikbudristek).";
    
    let toneInstruction = "Buatlah deskripsi rapor sumatif naratif yang memotivasi dalam 2 kalimat positif, menggunakan bahasa Indonesia baku, santun, dan sesuai format resmi Kemdikbudristek.";
    if (tone === "hangat") {
      toneInstruction = "Buatlah deskripsi narasi rapor yang sangat apresiatif, hangat, dan memotivasi siswa untuk terus bersemangat dalam 2 kalimat terstruktur.";
    } else if (tone === "ringkas") {
      toneInstruction = "Buatlah deskripsi narasi rapor yang padat, lugas, jelas, dan memuat capaian tertinggi serta aspek bimbingan dalam 2 kalimat presisi.";
    }

    const promptText = `
SYSTEM_ROLE: ${systemRole}
INPUT_DATA:
- Nama Siswa: "${studentName}"
- Kelas / Fase: "${gradeLevel || "4 SD"}"
- Mata Pelajaran: "${subjectName || "Umum"}"
- Nilai Tertinggi (TP Tercapai): "${highestTP || "memahami konsep materi utama"}"
- Nilai Terendah (Perlu Bimbingan): "${lowestTP || "penerapan latihan lanjutan"}"
${customNotes ? `- Catatan Khusus Guru: "${customNotes}"` : ""}

INSTRUCTION: ${toneInstruction} Format umum diawali dengan 'Ananda [Nama Siswa] menunjukkan penguasaan yang sangat baik dalam...' dan diakhiri dengan kalimat bimbingan positif 'Perlu peningkatan dan bimbingan lanjutan pada materi...'.

HANYA berikan output teks narasi rapor akhir tanpa tanda kutip pembuka/penutup dan tanpa label tambahan.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: promptText,
    });

    const generatedText = response.text?.trim() || generateRuleBasedNarasi(studentName, subjectName || "", highestTP || "", lowestTP || "");

    res.json({
      narasi: generatedText.replace(/^["']|["']$/g, ""),
      source: "gemini_ai",
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Return fallback on any API error so the user is never blocked
    const fallbackNarasi = generateRuleBasedNarasi(
      req.body.studentName || "Siswa",
      req.body.subjectName || "",
      req.body.highestTP || "",
      req.body.lowestTP || ""
    );
    res.json({
      narasi: fallbackNarasi,
      source: "rule_engine_fallback",
      warning: "Menggunakan generator standar karena API sedang sibuk.",
    });
  }
});

// Batch generation endpoint for multiple students in a subject
app.post("/api/gemini/batch-generate-narasi", async (req, res) => {
  try {
    const { items, gradeLevel, subjectName, tone = "standar" } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Daftar siswa kosong" });
    }

    const ai = getGeminiClient();

    if (!ai) {
      const results = items.map((item: any) => ({
        studentId: item.studentId,
        narasi: generateRuleBasedNarasi(item.studentName, subjectName || "", item.highestTP || "", item.lowestTP || ""),
      }));
      return res.json({ results, source: "rule_engine" });
    }

    const itemsSummary = items.map((it: any, idx: number) => 
      `${idx + 1}. ID: "${it.studentId}" | Nama: "${it.studentName}" | TP Tertinggi: "${it.highestTP || "Menguasai materi utama"}" | TP Terendah: "${it.lowestTP || "Latihan lanjutan"}"`
    ).join("\n");

    const promptText = `
SYSTEM_ROLE: Anda adalah Asisten Guru Senior Sekolah Dasar yang ahli dalam menyusun deskripsi rapor naratif berbasis Kurikulum Merdeka (Kemdikbudristek).
Kelas/Fase: ${gradeLevel || "4 SD"}
Mata Pelajaran: ${subjectName || "Umum"}

DAFTAR SISWA:
${itemsSummary}

INSTRUCTION: Buatlah narasi rapor 2 kalimat positif untuk setiap siswa sesuai standar Kemdikbudristek. Format umum: "Ananda [Nama] menunjukkan penguasaan yang sangat baik dalam [TP Tertinggi]. Perlu peningkatan dan bimbingan lanjutan pada materi [TP Terendah]."
Keluarkan HANYA dalam format JSON valid sebagai array objek: [{"studentId": "...", "narasi": "..."}] tanpa markdown wrapping.
`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ results: parsed, source: "gemini_ai" });
      }
    } catch (parseErr) {
      console.warn("Failed to parse batch JSON from Gemini, fallback to rule engine", parseErr);
    }

    // Fallback if parsing fails
    const results = items.map((item: any) => ({
      studentId: item.studentId,
      narasi: generateRuleBasedNarasi(item.studentName, subjectName || "", item.highestTP || "", item.lowestTP || ""),
    }));
    return res.json({ results, source: "rule_engine_fallback" });
  } catch (error: any) {
    console.error("Batch Generation Error:", error);
    res.status(500).json({ error: "Gagal memproses narasi batch" });
  }
});

// Vite Middleware & Static Serving Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`iihh Beres server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
