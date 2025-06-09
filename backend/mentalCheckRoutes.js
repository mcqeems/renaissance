const express = require('express');
const router = express.Router();
const { getComprehensiveMentalAnalysis } = require('./services/aiAnalysisService');
const { db, admin } = require('./firebaseAdmin');
const axios = require('axios');
// const { protect } = require('./middleware/authMiddleware'); // Aktifkan jika perlu autentikasi
router.post('/', async (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.user?.uid; // Asumsi middleware auth sudah mengisi req.user

    // Validasi dasar input
    if (!answers || !Array.isArray(answers) || answers.length !== 30) {
      return res.status(400).json({
        message: 'Format jawaban tidak valid. Harap berikan array berisi 30 jawaban teks.',
      });
    }

    // Panggil service yang akan berinteraksi dengan Azure OpenAI
    const analysisResult = await getComprehensiveMentalAnalysis(answers);

    // Simpan hasil ke Firestore
    const mentalCheckResultData = {
      userId: userId,
      answers: answers, // Menyimpan jawaban mentah pengguna
      aiReport: analysisResult, // Menyimpan laporan lengkap dari AI
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const resultRef = await db.collection('mentalCheckResults').add(mentalCheckResultData);
    console.log(`Mental check result saved with ID: ${resultRef.id} for user: ${userId}`);

    // Kirim hasil analisis kembali ke client
    res.json(analysisResult);
  } catch (error) {
    console.error('Error in /api/mental-check:', error.message);
    if (error.isAxiosError) {
      // Jika menggunakan axios di dalam service AI
      console.error('Axios error details:', error.response?.data);
    } else if (error.code && error.status) {
      // Error dari Azure SDK mungkin memiliki ini
      console.error('Azure SDK error details:', error.message);
    }
    res.status(error.status || 500).json({
      message: error.message || 'Terjadi kesalahan internal saat memproses cek mental.',
    });
  }
});

// Endpoint BARU untuk mengambil hasil cek mental terakhir
router.get('/latest', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const snapshot = await db
      .collection('mentalCheckResults')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ message: 'No mental check history found.', data: null }); // Mengembalikan 200 dengan data null
    }

    const doc = snapshot.docs[0];
    let latestResult = { id: doc.id, ...doc.data() };

    // Konversi Firestore Timestamp ke format Date ISO string agar mudah di-parse di frontend
    if (latestResult.createdAt && typeof latestResult.createdAt.toDate === 'function') {
      latestResult.createdAt = latestResult.createdAt.toDate().toISOString();
    }

    // Jika answers juga merupakan array besar, Anda bisa memilih untuk tidak mengirimkannya di /latest
    // atau hanya mengirim bagian tertentu dari aiReport untuk ringkasan.
    // Untuk saat ini, kita kirim semua dulu.
    // delete latestResult.answers; // Opsional: hapus jawaban mentah jika tidak perlu di ringkasan

    res.json({ message: 'Latest mental check result fetched.', data: latestResult });
  } catch (error) {
    console.error('Error in GET /api/mental-check/latest:', error.message);
    res.status(500).json({ error: 'Failed to fetch latest mental check result.' });
  }
});

module.exports = router;
