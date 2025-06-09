// frontend/src/components/mentalCheck/ResultScreen.tsx
import React from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import {
  Terminal, // Mungkin tidak lagi relevan untuk Solusi jika bukan string
  Info,
  ShieldAlert,
  Lightbulb, // Tetap relevan untuk judul Solusi
  FileText,
  Circle as FilledCircleIcon,
  ClipboardList,
  CheckCircle2, // Ikon baru untuk sub-item solusi
} from 'lucide-react';

// Interface untuk struktur baru 'solution'
interface SolutionDetail {
  short_term?: string;
  long_term?: string;
  spiritual_support?: string;
  professional_assistance?: string;
  [key: string]: string | undefined; // Untuk menangani key lain jika ada
}

interface AnalysisDetail {
  emotion?: string;
  stress?: string;
  coping?: string;
  social_relationships?: string;
  communication?: string;
  self_esteem?: string;
  ambitions?: string;
  [key: string]: string | undefined;
}

interface AIResult {
  description: string;
  analysis: AnalysisDetail | string;
  conclusion: string;
  solution: SolutionDetail | string; // Mengubah tipe 'solution' menjadi objek atau string
}

interface ResultScreenProps {
  result: AIResult;
  onRetake?: () => void;
  onExit?: () => void;
}

const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
};

const AnalysisItem: React.FC<{ icon?: React.ElementType; title: string; content?: string }> = ({
  icon: IconComponent = FilledCircleIcon,
  title,
  content,
}) => {
  if (!content) return null;
  return (
    <div className="flex items-start space-x-2">
      <IconComponent className="h-2.5 w-2.5  mt-[7px] flex-shrink-0 fill-current" />
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

// Komponen baru untuk merender item solusi
const SolutionItem: React.FC<{ title: string; content?: string }> = ({ title, content }) => {
  if (!content) return null;
  return (
    <div className="flex items-start space-x-2">
      <CheckCircle2 className="h-4 w-4 text-green-300 mt-1 flex-shrink-0" />
      <div>
        <p className="font-semibold text-sm">{toTitleCase(title)}:</p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

const ResultScreen: React.FC<ResultScreenProps> = ({ result, onRetake, onExit }) => {
  const renderAnalysisDetails = (analysisData: AnalysisDetail | string) => {
    // ... (fungsi ini tetap sama seperti sebelumnya)
    if (typeof analysisData === 'string') {
      return <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisData}</p>;
    }

    const prioritizedAnalysisKeys: Array<keyof AnalysisDetail & string> = [
      'emotion',
      'stress',
      'coping',
      'social_relationships',
      'communication',
      'self_esteem',
      'ambitions',
    ];

    const getDisplayTitle = (key: string): string => {
      if (key === 'social_relationships') return 'Relationships';
      if (key === 'self_esteem') return 'Self-esteem';
      return toTitleCase(key);
    };
    const renderedKeys = new Set<string>();
    return (
      <div className="space-y-3">
        {prioritizedAnalysisKeys.map((key) => {
          if (analysisData[key]) {
            renderedKeys.add(key);
            return (
              <AnalysisItem
                key={key}
                icon={FilledCircleIcon}
                title={getDisplayTitle(key)}
                content={analysisData[key]}
              />
            );
          }
          return null;
        })}
        {Object.keys(analysisData)
          .filter((key) => !renderedKeys.has(key) && analysisData[key])
          .map((key) => (
            <AnalysisItem key={key} icon={FilledCircleIcon} title={getDisplayTitle(key)} content={analysisData[key]} />
          ))}
      </div>
    );
  };

  // Fungsi BARU untuk merender detail solusi
  const renderSolutionDetails = (solutionData: SolutionDetail | string) => {
    if (typeof solutionData === 'string') {
      // Jika solusi adalah string biasa, tampilkan seperti sebelumnya
      return <p className="text-sm whitespace-pre-wrap">{solutionData}</p>;
    }
    // Jika solusi adalah objek, render setiap item
    const solutionKeys: Array<keyof SolutionDetail & string> = [
      // Tentukan urutan jika perlu
      'short_term',
      'long_term',
      'spiritual_support',
      'professional_assistance',
    ];

    return (
      <div className="space-y-2 mt-1">
        {solutionKeys.map((key) => {
          if (solutionData[key]) {
            // Pastikan hanya render jika ada value
            return <SolutionItem key={key} title={key} content={solutionData[key]} />;
          }
          return null;
        })}
        {/* Fallback untuk key lain dalam objek solution jika ada */}
        {Object.keys(solutionData)
          .filter((key) => !solutionKeys.includes(key as any) && solutionData[key])
          .map((key) => (
            <SolutionItem key={key} title={key} content={solutionData[key]} />
          ))}
      </div>
    );
  };

  return (
    <div className="w-full flex justify-center py-8 px-4 dark:bg-slate-900">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className=" dark:bg-slate-800 rounded-t-lg p-6">
          <CardTitle className="text-2xl font-bold text-center ">Hasil Analisis Kondisi Mental Anda</CardTitle>
          <CardDescription className="text-center  pt-1">
            Berikut adalah hasil analisis berdasarkan jawaban yang telah Anda berikan.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* 1. Deskripsi Umum */}
          <div>
            <h3 className="font-semibold mb-2 text-xl   flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-500" /> Deskripsi Umum
            </h3>
            <p className="text-sm  whitespace-pre-wrap">
              {result.description || 'Tidak ada deskripsi yang diberikan.'}
            </p>
          </div>

          {/* 2. Analisis Mendalam */}
          <div>
            <h3 className="font-semibold mb-3 text-xl flex items-center">
              <ClipboardList className="h-5 w-5 mr-2 text-indigo-500" /> Analisis Mendalam:
            </h3>
            {renderAnalysisDetails(result.analysis)}
          </div>

          {/* 3. Solusi dan Saran - Menggunakan renderSolutionDetails */}
          <div>
            <h3 className="font-semibold mb-2 text-xl  flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-green-500" /> Solusi dan Saran
            </h3>
            {renderSolutionDetails(result.solution)} {/* MODIFIKASI DI SINI */}
          </div>

          {/* 4. Kesimpulan */}
          <div>
            <h3 className="font-semibold mb-2 text-xl  flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-500" /> Kesimpulan
            </h3>
            <p className="text-sm  whitespace-pre-wrap">
              {result.conclusion || 'Tidak ada kesimpulan yang diberikan.'}
            </p>
          </div>

          {/* 5. Penting! (Alert) */}
          <Alert variant="destructive" className="mt-8">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="font-semibold">Penting!</AlertTitle>
            <AlertDescription>
              Hasil ini bukanlah diagnosis medis. Jika Anda merasa membutuhkan bantuan lebih lanjut atau memiliki
              kekhawatiran serius mengenai kondisi mental Anda, sangat disarankan untuk berkonsultasi dengan psikolog
              atau profesional kesehatan mental.
            </AlertDescription>
          </Alert>
        </CardContent>

        {(onRetake || onExit) && (
          <CardFooter className="flex justify-center dark:bg-slate-800 rounded-b-lg border-t gap-5 p-6">
            {onRetake && (
              <Button variant="outline" onClick={onRetake}>
                Ulangi
              </Button>
            )}
            {onExit && (
              <Button variant="default" onClick={onExit}>
                Selesai
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ResultScreen;
