// backend/firebaseAdmin.js
const admin = require('firebase-admin');
const path = require('path'); // Impor modul path
require('dotenv').config();

const serviceAccountPath = path.join(__dirname, 'renaissance-62c30-firebase-adminsdk-fbsvc-d6259c807d.json'); // Atau nama file JSON Anda

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (e) {
  console.error('Failed to require service account key. Path: ', serviceAccountPath, 'Error: ', e);
  process.exit(1);
}

if (!serviceAccount || Object.keys(serviceAccount).length === 0) {
  console.error('Service account key file is empty or invalid. Path: ' + serviceAccountPath);
  process.exit(1);
}

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully (from firebaseAdmin.js with service account key).');
  } else {
    console.log('Firebase Admin SDK already initialized (from firebaseAdmin.js).');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK (from firebaseAdmin.js):', error);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
