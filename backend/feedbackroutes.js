// File: /backend/feedbackRoutes.js

const express = require('express');
const router = express.Router();
const { sendFeedbackEmail } = require('./services/emailService'); // Impor service email

// Definisikan route POST untuk mengirim feedback
// Endpoint: POST /api/feedback/send
router.post('/send', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Semua field (nama, email, pesan) harus diisi.' });
  }

  try {
    await sendFeedbackEmail({ name: name, userEmail: email, message: message });
    res.status(200).json({ success: true, message: 'Feedback berhasil dikirim. Terima kasih!' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server saat mengirim email.' });
  }
});

module.exports = router;
