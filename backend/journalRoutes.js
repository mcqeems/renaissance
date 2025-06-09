const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db, admin } = require('./firebaseAdmin');
const { openAIClient } = require('./azureOpenAIClient');

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!req.user || !req.user.uid) return res.status(401).json({ error: 'User not authenticated.' });
    const userId = req.user.uid;
    if (!text || text.trim() === '') return res.status(400).json({ error: 'Teks jurnal tidak boleh kosong.' });

    let sentimentData = { sentiment: 'neutral', confidenceScores: { neutral: 1.0 } };
    if (process.env.AZURE_TEXT_ANALYTICS_KEY && process.env.AZURE_TEXT_ANALYTICS_ENDPOINT) {
      const azureTextAnalyticsEndpoint = process.env.AZURE_TEXT_ANALYTICS_ENDPOINT + 'text/analytics/v3.1/sentiment';
      const azureTextAnalyticsKey = process.env.AZURE_TEXT_ANALYTICS_KEY;
      const documentsForAzureTA = { documents: [{ id: '1', language: 'id', text: text }] };
      try {
        const taResponse = await axios.post(azureTextAnalyticsEndpoint, documentsForAzureTA, {
          headers: { 'Ocp-Apim-Subscription-Key': azureTextAnalyticsKey, 'Content-Type': 'application/json' },
        });
        if (taResponse.data.documents && taResponse.data.documents.length > 0) {
          const result = taResponse.data.documents[0];
          if (!result.error) sentimentData = { sentiment: result.sentiment, confidenceScores: result.confidenceScores };
        }
      } catch (azureError) {
        console.error('Error calling Text Analytics:', azureError.message);
      }
    } else {
      console.warn('Azure Text Analytics environment variables not set. Skipping sentiment analysis.');
    }

    let botResponseText = 'Terima kasih sudah berbagi. Ingatlah, setiap perasaan itu valid.';

    if (openAIClient && process.env.AZURE_OPENAI_DEPLOYMENT_NAME) {
      const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
      const systemMessage = `Anda adalah Rena, seorang teman AI yang suportif, empatik, dan bijaksana. Tujuan Anda adalah memberikan kenyamanan dan perspektif positif. Selalu gunakan bahasa Indonesia yang baik, hangat, dan mudah dipahami. Buat respon yang memberi solusi untuk menjaga dirinya dari hal hal yang tidak diinginkan. Selalu beri pesan dan nasehat untuk masalah yang dia hadapi dan berikan solusi yang terbaik entah itu tentang hal-hal yang berkaitan dengan medis, psikologis dan lain-lain.`;
      const userPrompt = `Seorang teman baru saja menulis curhatan ini: "${text}". Sentimen yang terdeteksi dari curhatannya adalah "${sentimentData.sentiment}". Berikan respons yang menunjukkan bahwa Anda mendengarkan, memvalidasi perasaannya, dan mungkin menawarkan pertanyaan reflektif yang lembut atau pengingat positif. Hindari solusi konkret.`;
      const messages = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt },
      ];

      try {
        console.log(`Sending prompt to Azure OpenAI (Deployment: ${deploymentName})...`);
        const result = await openAIClient.getChatCompletions(deploymentName, messages, {
          maxTokens: 3000,
          temperature: 0.7,
        });

        let gptGeneratedResponse = '';
        if (result.choices && result.choices.length > 0 && result.choices[0].message) {
          gptGeneratedResponse = result.choices[0].message.content || '';
        }

        if (gptGeneratedResponse.trim()) {
          botResponseText = gptGeneratedResponse.trim();
          console.log('Azure OpenAI Response:', botResponseText);
        } else {
          console.warn('Azure OpenAI returned an empty response or no content. Using default.');
        }
      } catch (openAiError) {
        console.error('Error calling Azure OpenAI:', openAiError.message, openAiError.stack);
      }
    } else {
      console.warn('Azure OpenAI client or deployment name not configured. Using default bot response.');
    }

    const journalData = {
      userId: userId,
      text: text,
      sentiment: sentimentData.sentiment,
      sentimentScores: sentimentData.confidenceScores,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      botResponse: botResponseText,
    };

    const journalRef = await db.collection('journals').add(journalData);
    const newJournalSnapshot = await journalRef.get();
    const newJournalData = newJournalSnapshot.data();

    let createdAtForClient = newJournalData.createdAt;
    if (newJournalData.createdAt && typeof newJournalData.createdAt.toDate === 'function') {
      createdAtForClient = newJournalData.createdAt.toDate();
    }

    res.status(201).json({
      id: newJournalSnapshot.id,
      text: newJournalData.text,
      sentiment: newJournalData.sentiment,
      sentimentScores: newJournalData.sentimentScores,
      createdAt: createdAtForClient,
      botResponse: newJournalData.botResponse,
    });
  } catch (error) {
    console.error('Error in POST /journals:', error.message, error.stack);
    res.status(500).json({ error: 'Terjadi kesalahan internal saat menyimpan jurnal.' });
  }
});

router.get('/', async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    const userId = req.user.uid;

    const journalsSnapshot = await db
      .collection('journals')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const journals = [];
    journalsSnapshot.forEach((doc) => {
      const data = doc.data();
      let createdAt = data.createdAt;

      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAt = data.createdAt.toDate();
      }

      journals.push({
        id: doc.id,
        text: data.text,
        sentiment: data.sentiment,
        sentimentScores: data.sentimentScores,
        createdAt: createdAt,
        botResponse: data.botResponse || null,
      });
    });

    res.status(200).json(journals);
  } catch (error) {
    console.error('Error in GET /journals:', error.message, error.stack);
    res.status(500).json({ error: 'Terjadi kesalahan internal saat mengambil jurnal.' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    const userId = req.user.uid;

    const journalsSnapshot = await db.collection('journals').where('userId', '==', userId).get();

    if (journalsSnapshot.empty) {
      return res.status(200).json({
        count: 0,
        sentiments: { positive: 0, neutral: 0, negative: 0 },
        message: 'Curhat tidak ditemukan.',
      });
    }

    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    const totalJournals = journalsSnapshot.size;

    journalsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Asumsi field 'sentiment' menyimpan 'positive', 'neutral', atau 'negative'
      // Sesuaikan dengan nama field dan nilai yang Anda simpan
      if (data.sentiment && typeof data.sentiment === 'string') {
        const sentimentLowerCase = data.sentiment.toLowerCase();
        if (sentimentLowerCase === 'positive') positiveCount++;
        else if (sentimentLowerCase === 'neutral') neutralCount++;
        else if (sentimentLowerCase === 'negative') negativeCount++;
      }
    });

    // Hitung persentase hanya jika totalJournals > 0 untuk menghindari pembagian dengan nol
    const stats = {
      count: totalJournals,
      sentiments: {
        positive: totalJournals > 0 ? Math.round((positiveCount / totalJournals) * 100) : 0,
        neutral: totalJournals > 0 ? Math.round((neutralCount / totalJournals) * 100) : 0,
        negative: totalJournals > 0 ? Math.round((negativeCount / totalJournals) * 100) : 0,
      },
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error in GET /journals/stats:', error.message, error.stack);
    res.status(500).json({ error: 'Terjadi kesalahan internal saat mengambil statistik jurnal.' });
  }
});

module.exports = router;
