import React, { useState, useEffect, useCallback } from 'react';
import StartScreen from '../../components/mentalCheck/StartScreen';
import QuestionScreen from '../../components/mentalCheck/QuestionScreen';
import ResultScreen from '../../components/mentalCheck/ResultScreen';
import axiosInstance from '../../axiosInstance'; // Kita akan coba override header untuk satu panggilan ini
import { mentalCheckQuestions } from '../../lib/questions';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '~/context/authContext';
import { type User as FirebaseUser } from 'firebase/auth'; // Impor tipe User dari firebase/auth

interface AIReport {
  description: string;
  analysis: any;
  conclusion: string;
  solution: string;
}

interface MentalCheckHistoryItem {
  id: string;
  userId: string;
  answers?: string[];
  aiReport: AIReport;
  createdAt: string; // ISO string date
}

interface SolutionDetail {
  // Pastikan interface ini ada jika solution adalah objek
  short_term?: string;
  long_term?: string;
  spiritual_support?: string;
  professional_assistance?: string;
  [key: string]: string | undefined;
}

const CekMentalPage: React.FC = () => {
  const { currentUser } = useAuth() as { currentUser: FirebaseUser | null };
  const [questions] = useState<string[]>(mentalCheckQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>(() => new Array(questions.length).fill(''));
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [isCheckingStarted, setIsCheckingStarted] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIReport | null>(null);
  const [latestCheckResult, setLatestCheckResult] = useState<MentalCheckHistoryItem | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Cek Mental - Renaissance';
  }, []);

  const getIdTokenForRequest = useCallback(async (): Promise<string | null> => {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken(true); // true untuk force refresh
        console.log('CekMentalPage AUTH: Fetched ID Token:', token ? 'Token Present' : 'No Token');
        return token;
      } catch (error) {
        console.error('CekMentalPage AUTH: Error getting ID token:', error);
        setError('Gagal mendapatkan sesi autentikasi. Silakan coba login ulang.');
        return null;
      }
    }
    console.log('CekMentalPage AUTH: No current user to get ID token from.');
    return null;
  }, [currentUser]);

  const fetchLatestHistory = useCallback(async () => {
    if (!currentUser) {
      setIsLoadingHistory(false);
      setLatestCheckResult(null);
      console.log('fetchLatestHistory: No current user, skipping fetch.'); // Log tambahan
      return;
    }
    setIsLoadingHistory(true);
    setError(null);
    console.log('fetchLatestHistory: Attempting to fetch...'); // Log tambahan

    const idToken = await getIdTokenForRequest(); // Dapatkan token sebelum request

    if (!idToken) {
      setIsLoadingHistory(false);
      console.log('fetchLatestHistory: No ID token, fetch aborted.');
      setError('Autentikasi dibutuhkan untuk melihat riwayat. Silakan login.'); // Pesan error lebih jelas
      return;
    }

    try {
      console.log('fetchLatestHistory: Sending GET request to /api/mental-check/latest');
      const response = await axiosInstance.get<{ message: string; data: MentalCheckHistoryItem | null }>(
        '/api/mental-check/latest',
        {
          // Menambahkan header Authorization secara eksplisit
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      console.log('fetchLatestHistory: Response received:', response.data);
      if (response.data && response.data.data) {
        setLatestCheckResult(response.data.data);
      } else {
        setLatestCheckResult(null);
        console.log('fetchLatestHistory: No history data found in response.');
      }
    } catch (err: any) {
      console.error('Failed to fetch latest mental check history (raw error):', err);
      if (err.response) {
        console.error('fetchLatestHistory: Error response data:', err.response.data);
        console.error('fetchLatestHistory: Error response status:', err.response.status);
        setError(
          err.response.data?.error ||
            err.response.data?.message ||
            `Gagal memuat riwayat (status: ${err.response.status}).`
        );
      } else if (err.request) {
        console.error('fetchLatestHistory: No response received:', err.request);
        setError('Tidak ada respons dari server saat memuat riwayat.');
      } else {
        console.error('fetchLatestHistory: Error setting up request:', err.message);
        setError(`Terjadi kesalahan: ${err.message}`);
      }
      setLatestCheckResult(null);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [currentUser, getIdTokenForRequest]); // Tambahkan getIdTokenForRequest

  useEffect(() => {
    // Hanya fetch history jika ada currentUser untuk menghindari error 403 di awal jika auth belum siap
    if (currentUser) {
      fetchLatestHistory();
    }
  }, [currentUser, fetchLatestHistory]); // fetchLatestHistory sekarang menjadi dependensi yang stabil karena useCallback

  useEffect(() => {
    if (isCheckingStarted && !isCompleted) {
      setCurrentAnswer(answers[currentQuestionIndex] || '');
    }
  }, [currentQuestionIndex, answers, isCheckingStarted, isCompleted]);

  const resetCheckState = useCallback(() => {
    setCurrentQuestionIndex(0);
    setAnswers(new Array(questions.length).fill(''));
    setCurrentAnswer('');
    setIsCompleted(false);
    setAiResult(null);
    setError(null);
  }, [questions.length]);

  const handleStartChecking = useCallback(() => {
    if (!currentUser) {
      setError('Harap login terlebih dahulu untuk memulai pengecekan.');
      return;
    }
    resetCheckState();
    setIsCheckingStarted(true);
  }, [currentUser, resetCheckState]);

  const handleAnswerChange = useCallback((text: string) => {
    setCurrentAnswer(text);
  }, []);

  const saveCurrentAnswer = useCallback(() => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = currentAnswer;
    setAnswers(newAnswers);
    return newAnswers;
  }, [answers, currentAnswer, currentQuestionIndex]);

  const handleSubmitAnswers = useCallback(
    async (finalAnswers: string[]) => {
      if (!currentUser) {
        setError('Anda harus login untuk mengirim jawaban.');
        setIsSubmitting(false); // Pastikan di-set false jika return awal
        return;
      }
      setIsSubmitting(true);
      setError(null);

      const idToken = await getIdTokenForRequest(); // Dapatkan token yang fresh

      if (!idToken) {
        // Error sudah di-set oleh getIdTokenForRequest
        setIsSubmitting(false);
        return;
      }

      try {
        // Mengirim request dengan header Authorization secara eksplisit
        // Ini untuk memastikan token dikirim, mengabaikan sementara bagaimana interceptor axiosInstance bekerja
        const response = await axiosInstance.post<AIReport>(
          '/api/mental-check',
          { answers: finalAnswers },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );
        setAiResult(response.data);
        setIsCompleted(true);
        fetchLatestHistory(); // Refresh histori setelah submit
      } catch (err: any) {
        console.error('Error submitting answers:', err);
        const errMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Terjadi kesalahan saat mengirim jawaban.';
        setError(errMessage);
        if (err.response?.status === 401 || err.response?.status === 403) {
          // Tambahkan pesan yang lebih spesifik untuk error auth
          setError(
            `Autentikasi gagal atau sesi berakhir (${err.response.status}). Silakan coba login ulang. Detail: ${errMessage}`
          );
        }
        setIsCompleted(false);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      currentUser,
      fetchLatestHistory,
      getIdTokenForRequest /* dependensi lain yang relevan seperti saveCurrentAnswer jika dipanggil di sini*/,
    ]
  );

  const handleNextQuestion = useCallback(() => {
    setError(null);
    const updatedAnswers = saveCurrentAnswer();

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      handleSubmitAnswers(updatedAnswers);
    }
  }, [saveCurrentAnswer, currentQuestionIndex, questions.length, handleSubmitAnswers]);

  const handlePreviousQuestion = useCallback(() => {
    setError(null);
    if (currentQuestionIndex > 0) {
      saveCurrentAnswer();
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
    }
  }, [saveCurrentAnswer, currentQuestionIndex]);

  const handleExitToStart = useCallback(() => {
    setIsCheckingStarted(false);
    resetCheckState();
    if (currentUser) {
      // Hanya fetch jika ada user setelah kembali ke start
      fetchLatestHistory();
    }
  }, [resetCheckState, fetchLatestHistory, currentUser]);

  if (!isCheckingStarted) {
    return (
      <StartScreen onStart={handleStartChecking} latestResult={latestCheckResult} isLoadingHistory={isLoadingHistory} />
    );
  }

  if (isCompleted && aiResult) {
    return <ResultScreen result={aiResult} onRetake={handleStartChecking} onExit={handleExitToStart} />;
  }

  return (
    <div className="flex-grow w-full flex flex-col justify-center items-center p-4 overflow-hidden">
      {error && (
        <Alert variant="destructive" className="mb-4 w-full max-w-xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <QuestionScreen
        question={questions[currentQuestionIndex]}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        answer={currentAnswer}
        onAnswerChange={handleAnswerChange}
        onNext={handleNextQuestion}
        onPrevious={handlePreviousQuestion}
        onExit={handleExitToStart}
        isFirstQuestion={currentQuestionIndex === 0}
        isSubmitting={isSubmitting}
        isLastQuestion={currentQuestionIndex === questions.length - 1}
      />
    </div>
  );
};

export default CekMentalPage;
