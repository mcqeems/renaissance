// frontend/src/components/mentalCheck/QuestionScreen.tsx
import React from 'react';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { Loader2, ArrowLeft, X as IconX } from 'lucide-react';

interface QuestionScreenProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  answer: string;
  onAnswerChange: (text: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onExit: () => void;
  isFirstQuestion: boolean;
  isSubmitting: boolean;
  isLastQuestion: boolean;
}

const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onAnswerChange,
  onNext,
  onPrevious,
  onExit,
  isFirstQuestion,
  isSubmitting,
  isLastQuestion,
}) => {
  const progressValue = (questionNumber / totalQuestions) * 100;

  // Fungsi untuk menangani penekanan tombol pada Textarea
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cek apakah tombol yang ditekan adalah "Enter"
    // dan apakah Shift tidak ditekan (agar Shift+Enter tetap bisa untuk baris baru jika diinginkan)
    // Namun, untuk kasus ini, kita akan buat Enter selalu submit/next.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Mencegah aksi default Enter (membuat baris baru)

      // Panggil onNext hanya jika tidak sedang submitting dan jawaban tidak kosong (setelah di-trim)
      // Ini meniru kondisi disabled pada tombol Next/Selesai.
      if (!isSubmitting && answer.trim()) {
        onNext();
      }
    }
  };

  return (
    <Card
      className="w-full max-w-xl shadow-xl flex flex-col overflow-hidden
                 max-h-[calc(100%-1rem)] mx-auto"
    >
      <CardHeader className="pt-4 pb-4 relative">
        {' '}
        <Button
          variant="default"
          size="icon"
          onClick={onExit}
          className="absolute left-2 top-[-15px] bg-black hover:bg-gray-800 text-white rounded-md p-1 h-7 w-7 " // Styling dari user
          aria-label="Keluar ke halaman awal"
        >
          <IconX className="h-4 w-4" strokeWidth={2.5} />
        </Button>
        <CardTitle className="text-lg md:text-xl font-semibold text-center pr-8 pl-8">
          Pertanyaan {questionNumber} dari {totalQuestions}
        </CardTitle>
        <CardDescription className="pt-3 text-sm md:text-base text-center  max-h-[100px] sm:max-h-[120px] overflow-y-auto custom-scrollbar">
          {question}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 py-4 flex-grow flex flex-col">
        <Progress value={progressValue} className="w-full mb-4 shrink-0" />
        <div className="flex-grow flex flex-col min-h-0">
          <Textarea
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Tulis jawaban Anda di sini..."
            rows={5}
            className="resize-none text-sm md:text-base flex-grow w-full custom-scrollbar"
            disabled={isSubmitting}
            // Tambahkan event handler onKeyDown di sini
            onKeyDown={handleKeyDown}
          />
        </div>
      </CardContent>

      <CardFooter className="gap-4 flex flex-col-reverse md:flex-row justify-between items-center pt-4 pb-2 px-6 border-t shrink-0">
        <Button
          className="w-full md:w-[50px]"
          variant="outline"
          size="icon"
          onClick={onPrevious}
          disabled={isFirstQuestion || isSubmitting}
          aria-label="Pertanyaan sebelumnya"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Button onClick={onNext} disabled={isSubmitting || !answer.trim()} size="lg" className="w-full md:w-[200px]">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Memproses...' : isLastQuestion ? 'Selesai & Lihat Hasil' : 'Pertanyaan Berikutnya'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuestionScreen;
