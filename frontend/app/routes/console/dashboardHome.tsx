import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '~/context/authContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Loader2, Brain, MessageSquareText, BookText, Sparkles, Info, AlertCircle } from 'lucide-react';
import { Separator } from '~/components/ui/separator'; // Impor Separator
import axiosInstance from '~/axiosInstance';
import { type User as FirebaseUser } from 'firebase/auth';
import SentimentPieChart from '~/components/myComponents/SentimentPieChart';

interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}
interface CurhatStats {
  count: number;
  sentiments: SentimentDistribution;
  message?: string;
}
interface MentalCheckReport {
  description: string;
  analysis: any;
  conclusion: string;
  solution: any;
}
interface MentalCheckHistoryItem {
  id: string;
  aiReport: MentalCheckReport;
  createdAt: string;
}
interface AIOverallSummary {
  summaryText: string;
  keyInsights?: string[];
  lastGenerated?: string;
}
interface ChatSummaryResponse {
  summary: string | null;
  message?: string;
}
// ---

const DashboardHomePage: React.FC = () => {
  const { currentUser } = useAuth() as { currentUser: FirebaseUser | null };
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Pengguna';
  const [aiOverallSummary, setAiOverallSummary] = useState<AIOverallSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isLoadingOverallSummary, setIsLoadingOverallSummary] = useState(false);
  const [curhatStats, setCurhatStats] = useState<CurhatStats | null>(null);
  const [isLoadingCurhat, setIsLoadingCurhat] = useState(false);
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [latestMentalCheck, setLatestMentalCheck] = useState<MentalCheckHistoryItem | null>(null);
  const [isLoadingMentalCheck, setIsLoadingMentalCheck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    document.title = 'Dashboard - Renaissance';
  }, []);

  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Format tanggal tidak valid';
    }
  }, []);

  const getIdTokenForRequest = useCallback(async (): Promise<string | null> => {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken(true);
        return token;
      } catch (error) {
        console.error('DashboardPage AUTH: Error getting ID token:', error);
        setError('Gagal mendapatkan sesi autentikasi.');
        return null;
      }
    }
    return null;
  }, [currentUser]);

  const fetchCurhatStats = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingCurhat(true);
    setError(null);
    const idToken = await getIdTokenForRequest();
    if (!idToken) {
      setIsLoadingCurhat(false);
      return;
    }
    try {
      const response = await axiosInstance.get<CurhatStats>('/api/journals/stats', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setCurhatStats(response.data);
    } catch (error: any) {
      console.error('Error fetching curhat stats:', error);
      setError(error.response?.data?.error || error.message || 'Gagal memuat statistik jurnal.');
      setCurhatStats({
        count: 0,
        sentiments: { positive: 0, neutral: 0, negative: 0 },
        message: 'Gagal memuat data.',
      });
    } finally {
      setIsLoadingCurhat(false);
    }
  }, [currentUser, getIdTokenForRequest]);

  const fetchChatSummary = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingChat(true);
    setError(null);
    const idToken = await getIdTokenForRequest();
    if (!idToken) {
      setIsLoadingChat(false);
      return;
    }
    try {
      const response = await axiosInstance.get<ChatSummaryResponse>('/api/chatbot/summary', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setChatSummary(response.data.summary);
      if (!response.data.summary && response.data.message) {
        console.log('Chat summary message from backend:', response.data.message);
      }
    } catch (error: any) {
      console.error('Error fetching chat summary:', error);
      setError(error.response?.data?.error || error.message || 'Gagal memuat ringkasan chat.');
      setChatSummary(null);
    } finally {
      setIsLoadingChat(false);
    }
  }, [currentUser, getIdTokenForRequest]);

  const fetchLatestMentalCheck = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingMentalCheck(true);
    setError(null);
    const idToken = await getIdTokenForRequest();
    if (!idToken) {
      setIsLoadingMentalCheck(false);
      return;
    }
    try {
      const response = await axiosInstance.get<{ data: MentalCheckHistoryItem | null }>('/api/mental-check/latest', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setLatestMentalCheck(response.data?.data || null);
    } catch (error: any) {
      console.error('Error fetching latest mental check:', error);
      setError(error.response?.data?.error || error.message || 'Gagal memuat riwayat cek mental.');
      setLatestMentalCheck(null);
    } finally {
      setIsLoadingMentalCheck(false);
    }
  }, [currentUser, getIdTokenForRequest]);

  const fetchLatestOverallSummary = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingOverallSummary(true);
    setError(null);
    const idToken = await getIdTokenForRequest();
    if (!idToken) {
      setIsLoadingOverallSummary(false);
      return;
    }
    try {
      const response = await axiosInstance.get<{ data: AIOverallSummary | null }>(
        '/api/dashboard/latest-overall-summary',
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      if (response.data && response.data.data) {
        setAiOverallSummary(response.data.data);
      } else {
        setAiOverallSummary(null);
      }
    } catch (error: any) {
      console.error('Error fetching latest overall summary:', error);
      setAiOverallSummary(null);
    } finally {
      setIsLoadingOverallSummary(false);
    }
  }, [currentUser, getIdTokenForRequest]);

  useEffect(() => {
    if (currentUser && !hasFetched.current) {
      hasFetched.current = true;
      fetchCurhatStats();
      fetchChatSummary();
      fetchLatestMentalCheck();
      fetchLatestOverallSummary();
    } else if (!currentUser) {
      hasFetched.current = false;
      setCurhatStats(null);
      setChatSummary(null);
      setLatestMentalCheck(null);
      setAiOverallSummary(null);
      setError(null);
    }
  }, [currentUser, fetchCurhatStats, fetchChatSummary, fetchLatestMentalCheck, fetchLatestOverallSummary]);

  const handleGenerateOverallSummary = async () => {
    if (!currentUser) {
      setError('Harap login untuk menghasilkan ringkasan.');
      return;
    }
    setIsGeneratingSummary(true);
    setError(null);
    const idToken = await getIdTokenForRequest();
    if (!idToken) {
      setIsGeneratingSummary(false);
      return;
    }
    try {
      const response = await axiosInstance.post<AIOverallSummary>(
        '/api/dashboard/generate-overall-summary',
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      setAiOverallSummary(response.data);
    } catch (error: any) {
      console.error('Error generating overall AI summary:', error);
      setError(
        error.response?.data?.error ||
          error.response?.data?.detail ||
          error.message ||
          'Gagal menghasilkan ringkasan AI dari server.'
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
        Welcome, <span className="text-primary">{userName}</span>!
      </h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Terjadi Kesalahan</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Kontainer Utama Dashboard dengan Lebar Maksimal dan Layout Dua Kolom */}
      <div className="w-full mx-auto flex flex-col lg:flex-row gap-6">
        {/* Kolom Pertama: Ringkasan Holistik */}
        <div className="lg:w-2/3 w-full">
          <Card className="shadow-lg h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center text-xl md:text-2xl">
                <Sparkles className="h-6 w-6 mr-3 text-blue-400" />
                Ringkasan Holistik
              </CardTitle>
              <CardDescription>
                Rena akan menganalisis aktivitas Anda di fitur Curhat, Chat, dan Cek Mental untuk memberikan wawasan.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto custom-scrollbar min-h-[200px] lg:max-h-[calc(3*170px+2*1.5rem)]">
              {/* ... (Isi konten Ringkasan Holistik tetap sama) ... */}
              {isLoadingOverallSummary && !aiOverallSummary && (
                <div className="flex flex-col items-center justify-center text-muted-foreground py-4 h-full">
                  <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                  <p>Memuat ringkasan terakhir Anda...</p>
                </div>
              )}
              {isGeneratingSummary && (
                <div className="flex flex-col items-center justify-center text-muted-foreground py-4 h-full">
                  <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                  <p>Rena sedang menganalisis data Anda...</p>
                </div>
              )}
              {!isLoadingOverallSummary && !isGeneratingSummary && aiOverallSummary && (
                <div className="space-y-3 py-2">
                  <p className="text-sm md:text-base ">{aiOverallSummary.summaryText}</p>
                  {aiOverallSummary.keyInsights && aiOverallSummary.keyInsights.length > 0 && (
                    <>
                      <h4 className="font-semibold text-sm pt-2">Wawasan Kunci:</h4>
                      <ul className="list-disc list-inside pl-1 space-y-1 text-sm ">
                        {aiOverallSummary.keyInsights.map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {aiOverallSummary.lastGenerated && (
                    <p className="text-xs text-muted-foreground pt-2">
                      Terakhir digenerate: {formatDate(aiOverallSummary.lastGenerated)}
                    </p>
                  )}
                </div>
              )}
              {!isLoadingOverallSummary && !isGeneratingSummary && !aiOverallSummary && (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 border border-dashed rounded-md min-h-[150px] h-full">
                  <Info className="h-10 w-10 mb-3 text-primary/70" />
                  <p className="text-sm">
                    Tekan tombol di bawah untuk melihat bagaimana Rena menganalisis progres Anda.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="shrink-0 border-t pt-4">
              <Button onClick={handleGenerateOverallSummary} disabled={isGeneratingSummary || isLoadingOverallSummary}>
                {isGeneratingSummary || isLoadingOverallSummary ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isGeneratingSummary
                  ? 'Sedang Menganalisis...'
                  : isLoadingOverallSummary
                  ? 'Memuat...'
                  : aiOverallSummary
                  ? 'Generate Ulang Ringkasan'
                  : 'Generate Ringkasan AI'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Kolom Kedua: Satu Card untuk Tiga Fitur (Tersusun vertikal di dalamnya) */}
        <div className="lg:w-1/3 w-full">
          <Card className="shadow-lg flex flex-col h-full">
            {' '}
            {/* h-full agar tingginya menyesuaikan kolom pertama jika memungkinkan */}
            <CardContent className="flex-grow space-y-4 overflow-y-auto custom-scrollbar px-4 md:px-6">
              {/* Bagian Jurnal Curhat */}
              <section className="relative">
                <h3 className="text-lg font-semibold flex items-center mb-1">
                  <BookText className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Jurnal Curhat
                </h3>
                {/* 1. Tambahkan position: relative di sini */}
                {isLoadingCurhat ? (
                  <div className="flex justify-center items-center" style={{ minHeight: '120px' }}>
                    <Loader2 className="animate-spin text-primary h-7 w-7" />
                  </div>
                ) : curhatStats ? (
                  curhatStats.count > 0 ? (
                    <div>
                      {' '}
                      {/* Wrapper untuk konten teks dan chart absolut */}
                      {/* Kontainer Teks (agar tidak tertimpa chart) */}
                      {/* Sesuaikan padding-right (pr-[XXXpx]) dengan lebar chart + sedikit jarak */}
                      <div className="pr-[100px] md:pr-[110px]">
                        {' '}
                        {/* Contoh: pr-[100px] jika chart width 90px + 10px gap */}
                        <div className="text-sm space-y-1 mt-2">
                          {' '}
                          {/* Beri sedikit jarak dari judul ke statistik */}
                          <p>
                            Total Curhat: <span className="font-semibold">{curhatStats.count}</span>
                          </p>
                          <p className="font-medium mt-1">Distribusi Sentimen:</p>
                          <ul className="list-none pl-1 text-xs text-muted-foreground">
                            <li>
                              <span
                                className="inline-block w-2 h-2 rounded-full mr-1.5"
                                style={{ backgroundColor: 'hsl(var(--chart-green))' }}
                              ></span>
                              Positif: {curhatStats.sentiments.positive}%
                            </li>
                            <li>
                              <span
                                className="inline-block w-2 h-2 rounded-full mr-1.5"
                                style={{ backgroundColor: 'hsl(var(--chart-gray))' }}
                              ></span>
                              Netral: {curhatStats.sentiments.neutral}%
                            </li>
                            <li>
                              <span
                                className="inline-block w-2 h-2 rounded-full mr-1.5"
                                style={{ backgroundColor: 'hsl(var(--chart-red))' }}
                              ></span>
                              Negatif: {curhatStats.sentiments.negative}%
                            </li>
                          </ul>
                        </div>
                      </div>
                      {/* Kontainer Chart (Absolute Position) */}
                      {/* 2. Atur posisi chart di sini */}
                      <div
                        className="absolute top-0 right-0" // Posisi absolut, di kanan atas section
                        style={{
                          width: '110px', // 3. Sesuaikan lebar chart ini (misal: 90px, 100px)
                          height: '100%', // 4. Chart akan mengisi tinggi section
                        }}
                      >
                        <SentimentPieChart
                          positive={curhatStats.sentiments.positive}
                          neutral={curhatStats.sentiments.neutral}
                          negative={curhatStats.sentiments.negative}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className=" text-sm text-center py-4" style={{ minHeight: '120px' }}>
                      {curhatStats.message || 'Belum ada data jurnal.'}
                    </p>
                  )
                ) : (
                  <p className=" text-sm text-center py-4" style={{ minHeight: '120px' }}>
                    Gagal memuat data jurnal.
                  </p>
                )}
              </section>

              <Separator className="my-4" />

              {/* Bagian Obrolan dengan Rena */}
              <section>
                <h3 className="text-lg font-semibold flex items-center mb-2">
                  <MessageSquareText className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  Obrolan dengan Rena
                </h3>
                {isLoadingChat ? (
                  <div className="flex justify-center items-center h-20">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                ) : chatSummary ? (
                  <p className=" text-sm italic leading-relaxed">"{chatSummary}"</p>
                ) : (
                  <p className=" text-sm">Anda belum memulai chat dengan Rena. Mulai chat Anda dengan Rena sekarang!</p>
                )}
              </section>

              <Separator className="my-4" />

              <section>
                <h3 className="text-lg font-semibold flex items-center mb-2">
                  <Brain className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Pengecekan Mental
                </h3>
                {isLoadingMentalCheck ? (
                  <div className="flex justify-center items-center h-20">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                ) : latestMentalCheck && latestMentalCheck.aiReport ? (
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-semibold">Terakhir dicek:</span> {formatDate(latestMentalCheck.createdAt)}
                    </p>
                    <p className=" pt-1">
                      <span className="font-semibold">Kesimpulan AI:</span> {latestMentalCheck.aiReport.conclusion}
                    </p>
                  </div>
                ) : (
                  <p className=" text-sm">Belum ada riwayat pengecekan mental.</p>
                )}
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardHomePage;
