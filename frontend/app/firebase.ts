import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
// Impor getAnalytics dan Analytics type
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // Pastikan ini juga ada di .env jika Anda menggunakan analytics
};

// Inisialisasi Firebase App
const app: FirebaseApp = initializeApp(firebaseConfig);

// Inisialisasi layanan lain yang aman untuk SSR (seperti Auth, Firestore)
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app); // Jika Anda menggunakan Firestore

// Deklarasikan variabel analytics, bisa null jika tidak di client atau tidak didukung
let analytics: Analytics | null = null;

// Cek apakah kode berjalan di lingkungan browser
if (typeof window !== 'undefined') {
  // Lebih baik lagi, gunakan isSupported() dari Firebase Analytics
  // isSupported() mengembalikan Promise, jadi kita perlu menanganinya
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized on client.');
      } else {
        console.log('Firebase Analytics is not supported in this environment.');
      }
    })
    .catch((error) => {
      console.error('Error checking Firebase Analytics support:', error);
    });
}

// Ekspor 'app' dan 'analytics' (analytics akan null di server atau jika tidak didukung)
export { app, analytics };
