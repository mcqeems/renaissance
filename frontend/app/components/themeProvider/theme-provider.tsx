import { createContext, useContext, useEffect, useState } from 'react'; // Pastikan ReactNode diimpor

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode; // Menggunakan ReactNode yang diimpor
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

// initialState untuk konteks bisa tetap, berguna sebagai fallback atau tipe default
const initialState: ThemeProviderState = {
  theme: 'system', // Ini akan menjadi nilai jika context digunakan di luar Provider sebelum provider siap
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props // Menyebarkan props sisa ke Provider jika ada (mis. untuk testing wrapper)
}: ThemeProviderProps) {
  // 1. Inisialisasi state dengan defaultTheme. Ini aman untuk SSR.
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  // 2. useEffect untuk memuat tema dari localStorage HANYA di sisi klien.
  useEffect(() => {
    // Kode ini hanya akan berjalan di browser setelah komponen di-mount.
    let storedTheme: Theme | null = null;
    try {
      storedTheme = localStorage.getItem(storageKey) as Theme | null;
    } catch (e) {
      console.warn(`Failed to read theme from localStorage with key "${storageKey}":`, e);
      // Biarkan theme menggunakan defaultTheme jika localStorage tidak dapat diakses
    }

    if (storedTheme && ['dark', 'light', 'system'].includes(storedTheme)) {
      setThemeState(storedTheme);
    }
    // Jika tidak ada tema di localStorage atau tidak valid,
    // tema akan tetap menggunakan nilai dari `defaultTheme` yang diinisialisasi di useState.
  }, [storageKey]); // Efek ini hanya perlu dijalankan sekali saat mount, atau jika storageKey berubah (jarang terjadi)

  // 3. useEffect untuk menerapkan tema ke DOM (sudah benar, hanya berjalan di klien).
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    root.classList.add(effectiveTheme);
  }, [theme]); // Efek ini berjalan setiap kali state 'theme' berubah.

  // Fungsi untuk mengubah tema, yang juga menyimpan ke localStorage.
  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (e) {
      console.warn(`Failed to save theme to localStorage with key "${storageKey}":`, e);
    }
    setThemeState(newTheme);
  };

  const value = {
    theme,
    setTheme, // Menggunakan fungsi setTheme yang sudah menghandle localStorage
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    // Bisa juga periksa initialState jika ingin lebih spesifik
    // if (context === initialState) {
    //   console.warn('useTheme called outside of a fully initialized ThemeProvider or before client hydration');
    //   return initialState; // Kembalikan nilai default agar tidak break di SSR, meski idealnya tidak terjadi
    // }
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
