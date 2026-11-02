
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

module.exports = async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  const accessCode = process.env.ACCESS_CODE;

  if (req.method === "GET") {
    return res.status(200).json({
      ok: !!key,
      model: MODEL,
      needCode: !!accessCode
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!key) {
    return res.status(503).json({
      code: "no_key",
      error: "Gemini API Key belum diatur"
    });
  }

  if (accessCode &&
      req.headers["x-access-code"] !== accessCode) {
    return res.status(401).json({
      code: "unauthorized",
      error: "Kode akses guru salah"
    });
  }

  try {
    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body || {};

    const { mapel, jenjang, topik, tujuan, prev } = body;
    const n = Math.max(1, Math.min(5, Number(body.n) || 5));
    const start = Math.max(0, Number(body.start) || 0);

    if (!mapel || !jenjang || !topik || !tujuan) {
      return res.status(400).json({
        code: "invalid_input",
        error: "Lengkapi data mata pelajaran, jenjang, topik, dan tujuan."
      });
    }

    const prompt = `
Kamu adalah guru ahli penyusun soal pendidikan Indonesia.

Buat tepat ${n} soal pilihan ganda.
Mata pelajaran: ${mapel}
Jenjang: ${jenjang}
Topik: ${topik}
Tujuan pembelajaran: ${tujuan}

Ini soal nomor ${start + 1} sampai ${start + n}.
Buat soal sesuai usia dan jenjang siswa.
Gunakan bahasa Indonesia yang jelas.
Setiap soal harus memiliki tepat 4 pilihan jawaban.
Hanya satu jawaban yang benar.
Variasikan posisi jawaban benar.
Sertakan pembahasan singkat dan ramah siswa.
Pastikan fakta dan jawaban benar.

Jangan mengulang soal berikut:
${Array.isArray(prev) ? prev.join("\n") : ""}

Keluarkan HANYA JSON array dengan format:
[
  {
    "q": "Pertanyaan",
    "options": ["A", "B", "C", "D"],
    "answer": 0,
    "explain": "Pembahasan"
  }
]
answer adalah indeks jawaban benar, dimulai dari 0.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 5000
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const status = response.status;
      return res.status(502).json({
        code: status === 429 ? "quota" :
              status === 400 || status === 403 ? "bad_key" : "gemini_error",
        error: data.error?.message || "Gemini gagal membuat soal"
      });
    }

    const raw = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "").join("");

    if (!raw) throw new Error("Jawaban AI kosong");

    const questions = JSON.parse(raw);

    if (!Array.isArray(questions)) {
      throw new Error("Format soal tidak valid");
    }

    const valid = questions.filter(q =>
      q &&
      typeof q.q === "string" &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.options.every(o => typeof o === "string" && o.trim()) &&
      Number.isInteger(q.answer) &&
      q.answer >= 0 &&
      q.answer < 4
    );

    return res.status(200).json({
      questions: valid
    });

  } catch (error) {
    return res.status(500).json({
      code: "generation_error",
      error: error.message || "Terjadi kesalahan saat membuat soal"
    });
  }
};
