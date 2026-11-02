# EDU SPRINT - Game lari kuis 3D (siap deploy di Vercel)

Isi folder:
- `index.html`  : game lari 3D dengan gerbang kuis, form guru, dan generator soal
- `api/generate.js` : fungsi server yang memanggil Gemini (kunci API aman di server)
- `vercel.json`, `package.json` : konfigurasi Vercel

## 1. Ambil kunci API Gemini
Buka https://aistudio.google.com/apikey, buat API key, salin.

## 2. Deploy ke Vercel
Cara A (GitHub): unggah folder ini ke repositori GitHub, lalu di vercel.com pilih Add New > Project > Import repositori. Framework: Other. Tidak perlu build command.
Cara B (CLI): `npm i -g vercel`, masuk ke folder ini, jalankan `vercel` lalu `vercel --prod`.

## 3. Isi Environment Variables (Project Settings > Environment Variables)
| Nama | Wajib | Keterangan |
|---|---|---|
| `GEMINI_API_KEY` | ya | kunci dari langkah 1 |
| `GEMINI_MODEL` | tidak | bawaan `gemini-2.5-flash`; ganti jika Google menyediakan nama model lain |
| `ACCESS_CODE` | disarankan | kode rahasia guru; tanpa ini siapa pun yang tahu alamat web bisa memakai kuota Gemini Anda |

Setelah menambah variabel, **deploy ulang** (Deployments > Redeploy).

## 4. Cek
- Buka `https://NAMA-ANDA.vercel.app/api/generate` : harus tampil `{"ok":true,...}`. Jika `ok:false`, kunci belum terbaca.
- Buka halaman utama: di bawah tombol generator tertulis "Generator AI server aktif". Jika `needCode:true`, isi Kode akses guru.

## Catatan
- Game ini tidak memakai kamera. Soal dibuat sesuai mapel, jenjang, topik, dan tujuan pembelajaran dari form guru; jumlah soal 10-30.
- Kunci API tidak pernah dikirim ke browser siswa. Soal dibuat per 5 soal agar cepat (batas fungsi 30 detik).
- Tanpa kunci pun, tombol **Buat soal dari materi** (tempel materi atau daftar istilah) dan soal hitungan offline tetap bekerja.
- Periksa soal dari AI di editor sebelum dipakai di kelas.
