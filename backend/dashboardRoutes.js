const express = require('express');
const router = express.Router();
const { db, admin } = require('./firebaseAdmin'); // Firestore instance dan admin untuk Timestamp
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Atau Azure OpenAI client

// Inisialisasi AI Model (Contoh dengan Gemini)
let genAI, modelForHolisticSummary;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  modelForHolisticSummary = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
} else {
  console.warn('GEMINI_API_KEY not found, holistic summary with Gemini might not work.');
}

// MODIFIKASI: Endpoint untuk generate DAN MENYIMPAN ringkasan holistik
router.post('/generate-overall-summary', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    // 1. Kumpulkan Data (Jurnal, Chat, Cek Mental - logika ini tetap sama seperti sebelumnya)
    const journalsSnapshot = await db
      .collection('journals')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    const recentJournals = [];
    journalsSnapshot.forEach((doc) => {
      const data = doc.data();
      recentJournals.push({
        text: data.text,
        sentiment: data.sentiment,
        createdAt: data.createdAt.toDate().toLocaleDateString('id-ID'),
      });
    });

    const chatSnapshot = await db
      .collection(`users/${userId}/geminiChats`)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    const recentChatMessages = [];
    chatSnapshot.forEach((doc) => {
      const data = doc.data();
      recentChatMessages.push(`${data.role === 'user' ? 'Pengguna' : 'Rena'}: ${data.text}`);
    });
    recentChatMessages.reverse();

    const mentalCheckSnapshot = await db
      .collection('mentalCheckResults')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    let latestMentalCheckReport = null;
    if (!mentalCheckSnapshot.empty) {
      const data = mentalCheckSnapshot.docs[0].data();
      latestMentalCheckReport = {
        description: data.aiReport.description,
        conclusion: data.aiReport.conclusion,
        createdAt: data.createdAt.toDate().toLocaleDateString('id-ID'),
      };
    }

    let dataForPrompt = 'Data Pengguna untuk Ringkasan Holistik:\n\n';
    dataForPrompt +=
      '=== Jurnal Terakhir ===\n' +
      (recentJournals.length > 0
        ? recentJournals
            .map((j) => `Tgl: ${j.createdAt}, Sentimen: ${j.sentiment}, Isi: "${j.text.substring(0, 100)}..."`)
            .join('\n')
        : 'Tidak ada data jurnal.') +
      '\n';
    dataForPrompt +=
      '\n=== Cuplikan Chat Terakhir ===\n' +
      (recentChatMessages.length > 0
        ? recentChatMessages.join('\n').substring(0, 500) + '...'
        : 'Tidak ada histori chat.') +
      '\n';
    dataForPrompt +=
      '\n=== Hasil Cek Mental Terakhir ===\n' +
      (latestMentalCheckReport
        ? `Tgl: ${latestMentalCheckReport.createdAt}, Kesimpulan: "${latestMentalCheckReport.conclusion}"`
        : 'Tidak ada data cek mental.') +
      '\n';

    if (!modelForHolisticSummary) {
      return res.status(500).json({ error: 'Model AI untuk ringkasan holistik tidak terkonfigurasi.' });
    }

    const holisticSummaryPrompt = `Anda adalah Rena, AI suportif. Berdasarkan data aktivitas pengguna berikut, buat "Ringkasan Holistik" dan "Wawasan Kunci" (maksimal 3-4 poin). Fokus pada aspek positif, area pertumbuhan, dan berikan pandangan umum. Output HARUS berupa JSON valid tanpa markdown wrapper:\n{\n  "summaryText": "...",\n  "keyInsights": ["...", "..."]\n}\n\nData Pengguna:\n${dataForPrompt}`;

    let aiResponseObject;
    try {
      const result = await modelForHolisticSummary.generateContent(holisticSummaryPrompt);
      const response = result.response;
      let textResponse = response.text();

      const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
      let cleanJsonString = jsonMatch
        ? jsonMatch[1]
          ? jsonMatch[1].trim()
          : jsonMatch[2]
          ? jsonMatch[2].trim()
          : null
        : textResponse.trim();

      if (!cleanJsonString) {
        throw new Error('Could not extract JSON from AI response.');
      }
      aiResponseObject = JSON.parse(cleanJsonString);
    } catch (aiError) {
      console.error('Error calling or parsing AI for holistic summary:', aiError.message);
      return res
        .status(500)
        .json({ error: 'Gagal memproses atau menghasilkan ringkasan dari AI.', detail: aiError.message });
    }

    if (!aiResponseObject || !aiResponseObject.summaryText) {
      return res.status(500).json({ error: 'AI tidak memberikan ringkasan yang valid.' });
    }

    // MENYIMPAN HASIL KE FIRESTORE
    const summaryToSave = {
      userId: userId,
      summaryText: aiResponseObject.summaryText,
      keyInsights: aiResponseObject.keyInsights || [],
      generatedAt: admin.firestore.FieldValue.serverTimestamp(), // Timestamp server
      // Anda bisa juga menyimpan dataForPrompt jika perlu untuk referensi
      // sourceDataSnapshot: {
      //   journalsCount: recentJournals.length,
      //   chatMessagesCount: recentChatMessages.length,
      //   mentalCheckIncluded: !!latestMentalCheckReport
      // }
    };
    await db.collection('holisticSummaries').add(summaryToSave);
    console.log(`Holistic summary saved for user ${userId}`);

    res.status(200).json({
      summaryText: aiResponseObject.summaryText,
      keyInsights: aiResponseObject.keyInsights || [],
      lastGenerated: new Date().toISOString(), // Kirim tanggal generate saat ini
    });
  } catch (error) {
    console.error('Error in POST /dashboard/generate-overall-summary:', error.message, error.stack);
    res.status(500).json({ error: 'Terjadi kesalahan internal saat membuat ringkasan holistik.' });
  }
});

// ENDPOINT BARU: Untuk mengambil ringkasan holistik terakhir
router.get('/latest-overall-summary', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const snapshot = await db
      .collection('holisticSummaries')
      .where('userId', '==', userId)
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ data: null, message: 'No holistic summary found for this user.' });
    }

    const doc = snapshot.docs[0];
    const latestSummaryData = doc.data();

    const responseData = {
      id: doc.id,
      summaryText: latestSummaryData.summaryText,
      keyInsights: latestSummaryData.keyInsights || [],
      // Ubah nama field agar konsisten dengan yang diharapkan frontend (lastGenerated)
      lastGenerated:
        latestSummaryData.generatedAt && typeof latestSummaryData.generatedAt.toDate === 'function'
          ? latestSummaryData.generatedAt.toDate().toISOString()
          : new Date().toISOString(), // Fallback jika format tidak sesuai
    };

    res.status(200).json({ data: responseData });
  } catch (error) {
    console.error('Error fetching latest holistic summary:', error.message);
    res.status(500).json({ error: 'Failed to fetch latest holistic summary.' });
  }
});

module.exports = router;
