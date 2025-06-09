import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import axios, { AxiosError } from 'axios';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { ScrollArea, ScrollBar } from '~/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '~/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '~/components/ui/card';
import { Loader2, Sparkles, RotateCcw, HelpCircle, Send } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!RAW_API_BASE_URL) {
  console.error(
    'FATAL ERROR: VITE_API_BASE_URL is not defined in .env.local. Please set it and restart the dev server.'
  );
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
console.log('API_BASE_URL loaded in component:', API_BASE_URL);

interface ChatMessage {
  id: string | number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface GeminiHistoryItem {
  role: 'user' | 'model';
  text: string;
}

interface ChatApiResponse {
  reply: string;
}

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
}
interface HistoryMessageFromApi {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: { seconds: number; nanoseconds: number } | { _seconds: number; _nanoseconds: number } | string;
}

function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [botStatus, setBotStatus] = useState<string>('Memeriksa status...');

  const [animateMessageRef, enableAnimations] = useAutoAnimate(/* optional config */);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Chat - Renaissance';
  }, []);

  function isTimestampWithSeconds(obj: any): obj is { seconds: number; nanoseconds?: number } {
    return obj && typeof obj.seconds === 'number';
  }

  function isTimestampWithUnderscoreSeconds(obj: any): obj is { _seconds: number; _nanoseconds?: number } {
    return obj && typeof obj._seconds === 'number';
  }

  useEffect(() => {
    const authInstance = getAuth();
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setCurrentUser(user);
      if (!user) {
        setMessages([
          {
            sender: 'bot',
            text: 'Silakan login untuk menggunakan chatbot.',
            id: 'login_prompt_' + Date.now(),
            timestamp: new Date(),
          },
        ]);
      }
    });
    return () => unsubscribe();
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken(true);
        console.log('FRONTEND AUTH: Fetched ID Token:', token ? 'Token Present' : 'No Token');
        return token;
      } catch (error) {
        console.error('FRONTEND AUTH: Error getting ID token:', error);
        return null;
      }
    }
    console.log('FRONTEND AUTH: No current user to get ID token from.');
    return null;
  };

  useEffect(() => {
    const scrollToBottom = () => {
      if (contentWrapperRef.current) {
        let scrollableViewport: HTMLElement | null = null;

        let parentElement = contentWrapperRef.current.parentElement;
        while (parentElement) {
          const viewportCandidate = parentElement.querySelector(
            '[data-radix-scroll-area-viewport]'
          ) as HTMLElement | null;
          if (
            viewportCandidate &&
            (getComputedStyle(viewportCandidate).overflowY === 'auto' ||
              getComputedStyle(viewportCandidate).overflowY === 'scroll')
          ) {
            scrollableViewport = viewportCandidate;
            break;
          }
          if (
            parentElement.hasAttribute('data-radix-scroll-area-viewport') &&
            (getComputedStyle(parentElement).overflowY === 'auto' ||
              getComputedStyle(parentElement).overflowY === 'scroll')
          ) {
            scrollableViewport = parentElement;
            break;
          }
          if (parentElement.hasAttribute('data-radix-scroll-area-root')) {
            break;
          }
          parentElement = parentElement.parentElement;
        }

        if (
          !scrollableViewport &&
          contentWrapperRef.current.parentElement?.hasAttribute('data-radix-scroll-area-viewport')
        ) {
          scrollableViewport = contentWrapperRef.current.parentElement;
        }

        if (scrollableViewport) {
          console.log(
            'Attempting to scroll viewport:',
            scrollableViewport,
            'ScrollHeight:',
            scrollableViewport.scrollHeight,
            'Current scrollTop:',
            scrollableViewport.scrollTop,
            'ClientHeight:',
            scrollableViewport.clientHeight
          );
          scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
          console.log('New scrollTop after scroll:', scrollableViewport.scrollTop);
        } else {
          console.log('Scrollable viewport not found. Will try to scroll contentWrapperRef itself as a fallback.');
          if (
            contentWrapperRef.current &&
            (getComputedStyle(contentWrapperRef.current).overflowY === 'auto' ||
              getComputedStyle(contentWrapperRef.current).overflowY === 'scroll')
          ) {
            contentWrapperRef.current.scrollTop = contentWrapperRef.current.scrollHeight;
            console.log('Fallback scroll on contentWrapper. New scrollTop:', contentWrapperRef.current.scrollTop);
          } else if (contentWrapperRef.current) {
            console.log(
              'contentWrapperRef is not scrollable itself. ScrollHeight:',
              contentWrapperRef.current.scrollHeight
            );
          }
        }
      } else {
        console.log('contentWrapperRef.current is null for scrolling.');
      }
    };

    const timerId = setTimeout(scrollToBottom, 150);
    return () => clearTimeout(timerId);
  }, [messages]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      const idToken = await getIdToken();
      if (!idToken) {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'Sesi tidak valid. Silakan login kembali.',
            id: 'token_err_' + Date.now(),
            timestamp: new Date(),
          },
        ]);
        return;
      }

      try {
        console.log('Fetching history with token:', idToken ? 'Token Present' : 'No Token');
        const response = await axios.get<HistoryMessageFromApi[]>(`${API_BASE_URL}/api/chatbot/history`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        setBotStatus('Online');

        if (!response.data || !Array.isArray(response.data)) {
          console.error('History data is not an array or is undefined:', response.data);
          setMessages((prev) => [
            ...prev,
            {
              sender: 'bot' as 'bot',
              text: 'Format histori tidak sesuai.',
              id: 'hist_format_err_' + Date.now(),
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
          return;
        }
        const historyMessages: ChatMessage[] = response.data
          .map((msg: HistoryMessageFromApi): ChatMessage => {
            let dateTimestamp: Date;

            if (typeof msg.timestamp === 'string') {
              dateTimestamp = new Date(msg.timestamp);
            } else if (isTimestampWithSeconds(msg.timestamp)) {
              dateTimestamp = new Date(msg.timestamp.seconds * 1000 + (msg.timestamp.nanoseconds || 0) / 1000000);
            } else if (isTimestampWithUnderscoreSeconds(msg.timestamp)) {
              dateTimestamp = new Date(msg.timestamp._seconds * 1000 + (msg.timestamp._nanoseconds || 0) / 1000000);
            } else {
              console.warn('Invalid timestamp format received from backend:', msg.timestamp);
              dateTimestamp = new Date();
            }

            return {
              sender: msg.role === 'user' ? 'user' : 'bot',
              text: msg.text,
              id: msg.id,
              timestamp: dateTimestamp,
            };
          })
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        console.log('Processed history messages for UI:', historyMessages);

        setMessages([
          {
            sender: 'bot' as 'bot',
            text: 'Hai, aku Rena 😊 Aku di sini buat kamu siap mendengar, menemani, dan membantu kamu bangkit perlahan. Tidak apa rasanya sedih, lelah, atau bingung. Kamu nggak sendirian 💙 Aku percaya kamu kuat. Dan aku akan selalu ada buatmu.',
            id: 'hist_intro_' + Date.now(),
            timestamp: new Date(),
          },
          ...historyMessages,
        ]);
      } catch (err) {
        const error = err as AxiosError<{ error?: string }>;
        console.error('Error fetching chat history:', error);
        const errorMsg =
          error.response?.status === 401 || error.response?.status === 403
            ? 'Sesi Anda berakhir. Silakan login kembali.'
            : error.response?.data?.error || 'Gagal memuat histori.';
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: errorMsg,
            id: 'hist_fail_' + Date.now(),
            timestamp: new Date(),
          },
        ]);
        console.error('Error object in fetchHistory catch:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchHistory();
    }
  }, [currentUser]);

  const handleResetChatOnFrontend = () => {
    setMessages([
      {
        sender: 'bot' as 'bot',
        text: 'Hai, aku Rena 😊 Aku di sini buat kamu siap mendengar, menemani, dan membantu kamu bangkit perlahan. Tidak apa rasanya sedih, lelah, atau bingung. Kamu nggak sendirian 💙 Aku percaya kamu kuat. Dan aku akan selalu ada buatmu.',
        id: 'greeting_reset_' + Date.now(),
        timestamp: new Date(),
      },
    ]);
    console.log('Chat history UI reset on frontend.');
  };

  const confirmAndResetChat = async () => {
    if (!currentUser) {
      console.error('Cannot reset chat: No current user.');

      setIsResetOpen(false);
      return;
    }

    setIsLoading(true);
    const idToken = await getIdToken();

    if (!idToken) {
      console.error('Cannot reset chat: Failed to get ID token.');
      setIsLoading(false);

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Gagal mereset chat: Autentikasi bermasalah.',
          id: 'reset_auth_err_' + Date.now(),
          timestamp: new Date(),
        },
      ]);
      setIsResetOpen(false);
      return;
    }

    try {
      console.log('Attempting to reset chat history on backend...');
      await axios.delete(`${API_BASE_URL}/api/chatbot/history`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      console.log('Chat history successfully reset on backend.');
      handleResetChatOnFrontend();
    } catch (err) {
      const error = err as AxiosError<{ error?: string; detail?: string }>;
      console.error('Error resetting chat history on backend:', error);
      const errorMsg =
        error.response?.data?.detail || error.response?.data?.error || 'Gagal mereset riwayat chat di server.';

      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: `Error: ${errorMsg}`, id: 'reset_server_err_' + Date.now(), timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
      setIsResetOpen(false);
    }
  };
  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !currentUser) return;

    const newUserMessage: ChatMessage = {
      sender: 'user',
      text: input,
      id: 'user_' + Date.now(),
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    const idToken = await getIdToken();
    console.log(
      'FRONTEND AUTH: Using ID Token for request:',
      idToken ? `Token starts with ${idToken.substring(0, 10)}...` : 'No Token'
    );

    if (!idToken) {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Autentikasi gagal. Coba login ulang.',
          id: 'auth_fail_' + Date.now(),
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const geminiHistory: GeminiHistoryItem[] = messages
      .filter((msg) => msg.id !== newUserMessage.id)
      .slice(-50)
      .map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        text: msg.text,
      }));

    try {
      const response = await axios.post<ChatApiResponse>(
        `${API_BASE_URL}/api/chatbot/chat`,
        { message: currentInput, history: geminiHistory },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      console.log('Raw send message response from backend:', response);
      console.log('Send message data from backend:', response.data);

      if (!response.data || typeof response.data.reply !== 'string') {
        console.error('Reply is missing or not a string:', response.data);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: 'bot' as 'bot',
            text: `Error: Respons tidak valid dari server.`,
            id: 'send_resp_err_' + Date.now(),
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      const botReply = response.data.reply;
      console.log('Bot reply received:', botReply);

      const newBotMessage: ChatMessage = {
        sender: 'bot',
        text: botReply,
        id: 'bot_' + Date.now(),
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, newBotMessage]);
    } catch (err) {
      const error = err as AxiosError<{ error?: string; details?: any }>;
      console.error('Error sending message:', error);
      let errorText = error.response?.data?.error || 'Gagal mengirim pesan.';
      if (error.response?.data?.details) {
        errorText += ` Detail: ${JSON.stringify(error.response.data.details)}`;
      }
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: `Error: ${errorText}`, id: 'send_err_' + Date.now(), timestamp: new Date() },
      ]);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'Sesi Anda berakhir. Silakan login kembali.',
            id: 'session_exp_' + Date.now(),
            timestamp: new Date(),
          },
        ]);
      }
      console.error('Error object in handleSendMessage catch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Card className="w-full max-w-2xl mx-auto my-8 h-[80vh] flex flex-col">
        <CardHeader>
          <CardTitle>Rena AI</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <p className="text-muted-foreground">Silakan login untuk memulai percakapan.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto my-8 h-[80vh] flex flex-col gap-0">
      <CardHeader className="flex flex-row items-center justify-between border-b px-4 h-12">
        {' '}
        {/* items-center dan justify-between */}
        <div className="flex flex-row items-center">
          {' '}
          {/* Grup Avatar dan Teks */}
          <Avatar className="h-13 w-13 mr-3">
            {' '}
            {/* Sesuaikan ukuran dan margin */}
            <AvatarImage src="/rena/RenaIcon3.svg" alt="AI" />
            <AvatarFallback></AvatarFallback>
          </Avatar>
          <div className="my-auto">
            <CardTitle>Rena AI</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{botStatus}</CardDescription>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {' '}
          {/* Grup Tombol */}
          <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="text-green-600 hover:text-green-800 border-green-600 hover:border-green-800"
                title="Panduan Penggunaan"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Panduan Penggunaan Rena AI</DialogTitle>
                <DialogDescription>Beberapa tips untuk berinteraksi dengan Rena.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>Ketik pesan atau curhatanmu di kolom input yang tersedia.</li>
                  <li>Rena akan berusaha merespons dengan suportif, empatik, dan positif.</li>
                  <li>Gunakan tombol "Reset Chat" (ikon panah melingkar) untuk memulai percakapan baru dari awal.</li>
                  <li>Rena ada di sini untuk menjadi teman curhatmu dan membantumu merefleksikan perasaan.</li>
                  <li className="mt-3 font-semibold text-foreground">
                    Penting: Rena bukan pengganti saran medis atau psikologis profesional. Jika kamu merasa dalam
                    kondisi bahaya atau membutuhkan bantuan serius, sangat disarankan untuk segera menghubungi
                    profesional kesehatan atau layanan darurat.
                  </li>
                </ul>
              </div>
              <DialogFooter>
                <Button type="button" onClick={() => setIsGuideOpen(false)}>
                  Tutup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="text-red-600 hover:text-red-800 border-red-600 hover:border-red-800"
                title="Reset Chat"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-red-600 text-center text-2xl font-bold">Peringatan!</DialogTitle>
                <DialogDescription className="text-center pt-2">
                  Menekan tombol reset akan mereset semua riwayat percakapan Anda di tampilan ini. Apakah Anda yakin
                  ingin melanjutkan?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-row justify-center sm:justify-center pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Batal
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmAndResetChat}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Ya, Reset Chat
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div ref={contentWrapperRef} className="h-auto min-h-full p-4">
            <div ref={animateMessageRef} className="space-y-4">
              {isLoading && messages.length === 0 && (
                <div className="flex justify-center items-center h-96">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <Avatar className="h-8 w-8 ">
                      <AvatarImage src="/rena/RenaIcon3.svg" alt="AI" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg px-3 pt-2 text-sm break-words ${
                      msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                  {msg.sender === 'user' && (
                    <Avatar className="h-8 w-8 ">
                      <AvatarImage className="h-6 w-6 m-auto " src="/others/catIcon.svg" />
                      <AvatarFallback>
                        {currentUser.displayName ? currentUser.displayName.substring(0, 1).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'user' && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="chat-bubble">
                    <div className="typing">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="Ketik pesanmu..."
            disabled={isLoading || !currentUser}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim() || !currentUser}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

export default ChatbotPage;
