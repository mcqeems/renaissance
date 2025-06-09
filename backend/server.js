const express = require('express');
const cors = require('cors');
const dashboardRoutes = require('./dashboardRoutes');
const feedbackRoutes = require('./feedbackroutes');

require('dotenv').config();

const chatbotRoutes = require('./chatbotRoutes');
const mentalCheckRoutes = require('./mentalCheckRoutes');
const journalRoutes = require('./journalRoutes');

const app = express();
const port = process.env.PORT || 3001;

// CORS Options
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://renaissance.qeem.site',
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Middleware untuk Verifikasi Token Firebase
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).send('Unauthorized: No token provided or malformed token.');
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const { auth } = require('./firebaseAdmin'); // Pastikan ini diimpor dengan benar
    const decodedToken = await auth.verifyIdToken(idToken);

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error.code, error.message);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Unauthorized: Token expired.' });
    }
    return res.status(403).json({ error: 'Unauthorized: Invalid token.' });
  }
}

app.use('/api/dashboard', verifyToken, dashboardRoutes); // Gunakan dengan verifyToken
app.use('/api/mental-check', verifyToken, mentalCheckRoutes);
app.use('/api/journals', verifyToken, journalRoutes);
app.use('/api/chatbot', verifyToken, chatbotRoutes);
app.use('/api/feedback', feedbackRoutes);

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong from Renascent Backend!' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ error: 'Something broke!', message: err.message });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`HTTP Server listening on port ${port}`);
  console.log(`Access API (example): http://renaissance.qeem.site:${port}/api/ping`);
  console.log(`Chatbot API (example): http://renaissance.qeem.site:${port}/api/chatbot/chat`);
  console.log(`Frontend expected at: http://renaissance.qeem.site or http://renaissance.qeem.site:3000`);
});
