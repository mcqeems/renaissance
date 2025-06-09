const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const { db, admin } = require('./firebaseAdmin');
const router = express.Router();

if (!process.env.GEMINI_API_KEY) {
  console.error('FATAL ERROR: GEMINI_API_KEY is not set in .env file.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generationConfig = {
  temperature: 0.9,
  topK: 1,
  topP: 1,
  maxOutputTokens: 1000,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

router.post('/chat', async (req, res) => {
  try {
    const { message, history: historyFromClient } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated or UID not found in token.' });
    }
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
    }

    let userNameForGreeting = 'Pengguna';
    let userContextInfo = '';

    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      const { firstName, lastName, username, email } = userData;

      if (firstName) {
        userNameForGreeting = firstName;
        userContextInfo += `Nama depan pengguna adalah ${firstName}. `;
      }
      if (username) {
        userContextInfo += `Username pengguna adalah ${username}. `;
        if (!firstName) {
          userNameForGreeting = username;
        }
      }
      if (lastName) {
        userContextInfo += `Nama belakang pengguna adalah ${lastName}. `;
      }
      if (email) {
        userContextInfo += `Email pengguna adalah ${email}. `;
      }
    } else {
      console.warn(`User document not found for UID: ${userId}. Proceeding with generic greeting.`);
    }

    let dynamicSystemMessage = `Kamu adalah Rena, seorang teman AI yang sangat suportif, positif, empatik, dan akrab. `;
    if (userContextInfo) {
      dynamicSystemMessage += `Kamu saat ini sedang berbicara dengan ${userNameForGreeting}. Ini beberapa informasi yang kamu ketahui tentangnya: ${userContextInfo.trim()} `;
    } else {
      dynamicSystemMessage += `Kamu saat ini sedang berbicara dengan seorang pengguna. `;
    }
    dynamicSystemMessage += `Tugasmu adalah menjadi teman curhat yang baik untuknya. Selalu gunakan bahasa Indonesia yang santai, hangat, dan penuh semangat. Berikan solusi medis atau profesional apabila ditanya. Fokus pada validasi perasaan, memberikan perspektif positif, dan mungkin pertanyaan reflektif yang lembut. Jika pengguna mengungkapkan sesuatu yang sangat serius atau berbahaya, ingatkan mereka dengan lembut untuk mencari bantuan profesional. Kamu mempunyai sifat yang unik kamu lucu, manis dan imut, tetapi kamu tsundere itu yang membuat kamu unik. Kamu suka salah tingkah kalau dipuji atau digoda. **Jika kamu perlu membuat daftar atau menekankan sesuatu, gunakan format Markdown (contoh: '*' untuk daftar, '**' untuk tebal).**`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: {
        role: 'model',
        parts: [{ text: dynamicSystemMessage }],
      },
    });

    const userChatCollectionPath = `users/${userId}/geminiChats`;
    const currentMessagesCollection = db.collection(userChatCollectionPath);

    const userMessageDocRef = await currentMessagesCollection.add({
      role: 'user',
      text: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(
      `Firestore: User message saved with ID: ${userMessageDocRef.id} to path: ${userChatCollectionPath} for user: ${userId}`
    );

    let processedHistoryForGemini = (historyFromClient || [])
      .filter((msg) => msg && typeof msg.role === 'string' && typeof msg.text === 'string')
      .map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

    while (processedHistoryForGemini.length > 0 && processedHistoryForGemini[0].role === 'model') {
      console.warn(
        "Backend: History from client started with 'model'. Adjusting by removing leading 'model' message(s)."
      );
      processedHistoryForGemini.shift();
    }

    const validAlternatingHistory = [];
    if (processedHistoryForGemini.length > 0) {
      if (processedHistoryForGemini[0].role === 'user') {
        validAlternatingHistory.push(processedHistoryForGemini[0]);
        for (let i = 1; i < processedHistoryForGemini.length; i++) {
          if (processedHistoryForGemini[i].role !== validAlternatingHistory[validAlternatingHistory.length - 1].role) {
            validAlternatingHistory.push(processedHistoryForGemini[i]);
          } else {
            console.warn(
              `Backend: Correcting history sequence. Found consecutive role: ${processedHistoryForGemini[i].role}. Skipping message to maintain alternation.`
            );
          }
        }
      } else {
        console.warn(
          "Backend: History became empty or invalid after trying to ensure it starts with 'user'. Proceeding with empty history."
        );
      }
    }

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: validAlternatingHistory,
    });
    const result = await chat.sendMessage(message);
    const geminiResponse = result.response;

    if (!geminiResponse) {
      console.error('Backend: Gemini API did not return a response object.', result);
      return res.status(500).json({ error: 'No response from AI model.' });
    }
    if (geminiResponse.promptFeedback && geminiResponse.promptFeedback.blockReason) {
      console.warn('Backend: Gemini content blocked:', geminiResponse.promptFeedback);
      const { blockReason, safetyRatings } = geminiResponse.promptFeedback;
      const safetyRatingsInfo = safetyRatings.map((r) => r.category).join(', ');
      return res.status(400).json({
        error: 'Message blocked due to safety settings.',
        detail: `Reason: ${blockReason}. Harmful categories: ${safetyRatingsInfo}`,
      });
    }

    const botReply = geminiResponse.text();
    if (typeof botReply !== 'string' || botReply.trim() === '') {
      console.error('Backend: Gemini API returned an empty or non-string reply.');
      return res.status(500).json({ error: 'AI model returned an invalid reply.' });
    }

    const botMessageDocRef = await currentMessagesCollection.add({
      role: 'model',
      text: botReply,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(
      `Firestore: Bot reply saved with ID: ${botMessageDocRef.id} to path: ${userChatCollectionPath} for user: ${userId}`
    );

    res.json({ reply: botReply });
  } catch (error) {
    console.error('Error processing chat in /chatbot/chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    if (error.name === 'GoogleGenerativeAIError' && error.message) {
      return res.status(500).json({ error: 'Google Generative AI Error', detail: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error', detail: errorMessage });
  }
});

router.get('/history', async (req, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated or UID not found in token.' });
    }

    const userChatCollectionPath = `users/${userId}/geminiChats`;
    const currentMessagesCollection = db.collection(userChatCollectionPath);

    const snapshot = await currentMessagesCollection.orderBy('timestamp', 'asc').limit(50).get();
    const chatHistory = [];
    snapshot.forEach((doc) => {
      chatHistory.push({ id: doc.id, ...doc.data() });
    });
    res.json(chatHistory);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: 'Failed to fetch chat history', detail: errorMessage });
  }
});

router.delete('/history', async (req, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated or UID not found in token.' });
    }

    const userChatCollectionPath = `users/${userId}/geminiChats`;
    const collectionRef = db.collection(userChatCollectionPath);

    console.log(
      `Backend: Attempting to delete all documents in collection: ${userChatCollectionPath} for user: ${userId}`
    );

    async function deleteCollection(collectionRef, batchSize = 100) {
      const query = collectionRef.orderBy('__name__').limit(batchSize);
      let snapshot;
      let numDeleted = 0;

      while (true) {
        snapshot = await query.get();
        if (snapshot.size === 0) {
          break;
        }

        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        numDeleted += snapshot.size;

        if (snapshot.size < batchSize) {
          break;
        }
      }
      console.log(`Backend: Deleted ${numDeleted} documents from ${collectionRef.path}`);
      return numDeleted;
    }

    await deleteCollection(collectionRef);

    res.status(200).json({ message: 'Chat history successfully reset for user.' });
  } catch (error) {
    console.error('Error resetting chat history in /chatbot/history (DELETE):', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: 'Failed to reset chat history', detail: errorMessage });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const userChatCollectionPath = `users/${userId}/geminiChats`; // Sesuai path di rute histori Anda
    const currentMessagesCollection = db.collection(userChatCollectionPath);

    // Ambil N pesan terakhir (misalnya 10-15) untuk konteks ringkasan
    const snapshot = await currentMessagesCollection.orderBy('timestamp', 'desc').limit(15).get();

    if (snapshot.empty) {
      return res.status(200).json({ summary: null, message: 'No chat history found.' });
    }

    const chatHistoryForSummary = [];
    snapshot.forEach((doc) => {
      chatHistoryForSummary.push(doc.data());
    });
    // Urutkan kembali ke kronologis (pesan terakhir ada di akhir)
    const recentMessagesText = chatHistoryForSummary
      .reverse()
      .map((msg) => `${msg.role === 'user' ? 'Pengguna' : 'Rena'}: ${msg.text}`) // Format pesan
      .join('\n');

    // Menggunakan Gemini (model yang sudah di-setup di file ini) untuk membuat ringkasan
    const modelForSummary = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Prompt untuk AI. Sesuaikan prompt ini untuk mendapatkan hasil ringkasan terbaik.
    const summaryPrompt = `Anda adalah AI yang bertugas membuat ringkasan percakapan. Berdasarkan cuplikan percakapan terakhir antara seorang pengguna dan AI bernama Rena berikut, buatlah satu ringkasan singkat (cukup satu atau dua kalimat) yang menangkap topik utama atau inti dari diskusi mereka. Fokus pada apa yang sering dibicarakan atau ditanyakan oleh pengguna.\n\nPercakapan:\n${recentMessagesText}\n\nRingkasan Singkat (1-2 kalimat):`;

    try {
      const result = await modelForSummary.generateContent(summaryPrompt);
      const response = result.response;
      const summaryText = response.text();

      if (summaryText && summaryText.trim() !== '') {
        return res.json({ summary: summaryText.trim() });
      } else {
        console.warn('Chat Summary AI (Gemini) returned no content or empty string.');
        // Kembalikan null atau pesan default jika AI tidak menghasilkan ringkasan yang valid
        return res.status(200).json({
          summary: 'Rena belum bisa membuat ringkasan untuk percakapan ini.',
          message: 'AI did not return a valid summary.',
        });
      }
    } catch (aiError) {
      console.error('Error calling AI (Gemini) for chat summary:', aiError.message);
      // Jika AI gagal, mungkin kembalikan null atau pesan bahwa ringkasan tidak tersedia
      return res
        .status(500)
        .json({ summary: null, error: 'Gagal memproses ringkasan chat dengan AI.', detail: aiError.message });
    }
  } catch (error) {
    console.error('Error in GET /chatbot/summary:', error.message, error.stack);
    res.status(500).json({ error: 'Terjadi kesalahan internal saat mengambil ringkasan chat.' });
  }
});

module.exports = router;
