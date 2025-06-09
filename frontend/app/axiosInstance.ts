// frontend/src/api/axiosInstance.ts
import axios from 'axios';

// Akses variabel lingkungan menggunakan import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error(
    'VITE_API_BASE_URL tidak terdefinisi. Pastikan Anda sudah membuat file .env (misalnya .env.local) di root folder frontend dengan VITE_API_BASE_URL=http://your-backend-url'
  );
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Opsional: Interceptor untuk menambahkan token Authorization secara otomatis
// Ini memerlukan akses ke token, yang bisa lebih kompleks jika tidak disimpan global
// Untuk sekarang, kita akan menambahkan token secara manual di setiap panggilan API yang membutuhkannya
// seperti yang sudah dilakukan di CurhatPage.tsx.

/*
// Contoh Interceptor (jika Anda memiliki cara untuk mendapatkan token secara global)
axiosInstance.interceptors.request.use(
  async (config) => {
    // Logika untuk mendapatkan token (misalnya dari AuthContext atau localStorage)
    // const token = await getCurrentUserToken(); // Fungsi imajiner
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
*/

export default axiosInstance;
