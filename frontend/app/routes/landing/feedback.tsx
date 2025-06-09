// File: /frontend/app/routes/feedback.tsx

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import MainNavbar from '~/components/myComponents/MainNavbar';
import MainFooter from '~/components/myComponents/MainFooter';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Spinner } from '~/components/ui/spinner';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import axiosInstance from '~/axiosInstance'; // Mengimpor instance yang sudah dikonfigurasi

const LoadingScreen: React.FC = () => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#12151e',
      zIndex: 9999,
    }}
  >
    <Spinner className="text-[#c2d2ff]" size={'large'} />
  </div>
);

function FeedbackPage() {
  const [isLoading, setIsLoading] = useState(true);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [parentAutoAnimate] = useAutoAnimate();

  useEffect(() => {
    document.title = 'Feedback - Renaissance';
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useGSAP(
    () => {
      if (!isLoading) {
        gsap.from(mainContainerRef.current, {
          opacity: 0,
          scale: 0.98,
          y: 50,
          duration: 1.2,
          ease: 'power3.out',
        });
      }
    },
    { dependencies: [isLoading] }
  );

  // Fungsi submit form yang sudah menggunakan axiosInstance
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResponseMessage('');
    setIsError(false);

    try {
      // Menggunakan axiosInstance. URL lengkap (misal: http://localhost:3001/api/feedback/send)
      // akan dibentuk secara otomatis dari baseURL + endpoint ini.
      const response = await axiosInstance.post('/api/feedback/send', {
        name,
        email,
        message,
      });

      setResponseMessage(response.data.message);
      setIsError(false);
      setName('');
      setEmail('');
      setMessage('');
    } catch (error: any) {
      // Penanganan error yang sesuai dengan Axios
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Terjadi kesalahan saat mengirim feedback.';
      setResponseMessage(errorMessage);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <MainNavbar />
      <div ref={mainContainerRef} className="flex flex-col min-h-screen bg-[#12151e]">
        <main className="flex-grow flex items-center justify-center p-4">
          <Card
            ref={parentAutoAnimate}
            className="w-full max-w-2xl border-gray-700 text-white shadow-2xl shadow-blue-500/10"
          >
            <CardHeader className="text-center">
              <img className="h-[100px] justify-self-center mb-4" src="/logo/RenaissanceWhite.svg" alt="Logo"></img>
              <CardTitle className="text-3xl font-bold tracking-tight">Berikan Feedback Anda</CardTitle>
              <CardDescription className="text-gray-400 pt-2">
                Kami sangat menghargai setiap masukan untuk membuat Renaissance menjadi lebih baik.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Nama lengkap Anda"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-gray-800/50 border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Alamat Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@contoh.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-800/50 border-gray-600"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Pesan Anda</Label>
                  <Textarea
                    id="message"
                    placeholder="Tuliskan masukan atau laporan bug Anda di sini..."
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-gray-800/50 border-gray-600"
                  />
                </div>
                <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-8 w-8 text-[#12151e]" /> Mengirim...
                    </>
                  ) : (
                    'Kirim Feedback'
                  )}
                </Button>
              </form>
            </CardContent>
            {responseMessage && (
              <CardFooter>
                <div
                  className={`w-full p-4 rounded-md text-center text-sm ${
                    isError ? 'bg-red-900/40 text-red-200' : 'bg-green-900/40 text-green-200'
                  }`}
                >
                  {responseMessage}
                </div>
              </CardFooter>
            )}
          </Card>
        </main>
      </div>
      <MainFooter />
    </>
  );
}

export default FeedbackPage;
