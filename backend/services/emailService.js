const nodemailer = require('nodemailer');
require('dotenv').config(); // Pastikan variabel env dimuat

// Konfigurasi Transporter Nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Fungsi untuk mengirim email
async function sendFeedbackEmail({ name, userEmail, message }) {
  const mailOptions = {
    from: `"${name} - Renaissance Feedback" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `Pesan Feedback Baru dari ${name}`,
    html: `
      <h1>Pesan Feedback Baru Diterima</h1>
      <p><strong>Nama:</strong> ${name}</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <hr>
      <h2>Pesan:</h2>
      <p style="white-space: pre-wrap;">${message}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Gagal mengirim email:', error);
    throw new Error('Gagal mengirim email.');
  }
}

module.exports = { sendFeedbackEmail };
