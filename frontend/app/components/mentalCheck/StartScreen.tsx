// frontend/src/components/mentalCheck/StartScreen.tsx
import React, { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
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
import {
  Loader2,
  CalendarDays,
  FileText,
  Info,
  Lightbulb,
  ClipboardList,
  Circle as FilledCircleIcon,
  CheckCircle2, // Untuk item solusi di dialog
} from 'lucide-react';

// --- Interface yang diperlukan ---
interface SolutionDetail {
  short_term?: string;
  long_term?: string;
  spiritual_support?: string;
  professional_assistance?: string;
  [key: string]: string | undefined;
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

interface AIReport {
  description: string;
  analysis: AnalysisDetail | string;
  conclusion: string;
  solution: SolutionDetail | string; // Tipe solution sudah diupdate
}

interface MentalCheckHistoryItem {
  id: string;
  aiReport: AIReport;
  createdAt: string; // ISO string date
}

interface StartScreenProps {
  onStart: () => void;
  // Menambahkan props yang diperlukan untuk menampilkan hasil terakhir
  latestResult: MentalCheckHistoryItem | null;
  isLoadingHistory: boolean;
}
// ---

const formatDate = (dateString: string) => {
  if (!dateString) return 'Tanggal tidak tersedia';
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
};

const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
};

// Komponen AnalysisItem dan SolutionItemDialog akan diletakkan di sini
const AnalysisItem: React.FC<{ icon?: React.ElementType; title: string; content?: string }> = ({
  icon: IconComponent = FilledCircleIcon,
  title,
  content,
}) => {
  if (!content) return null;
  return (
    <div className="flex items-start space-x-2">
      <IconComponent className="h-2.5 w-2.5 text-gray-800 dark:text-gray-300 mt-[7px] flex-shrink-0 fill-current" />
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

const SolutionItemDialog: React.FC<{ title: string; content?: string }> = ({ title, content }) => {
  if (!content) return null;
  return (
    <div className="flex items-start space-x-2">
      <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
      <div>
        <p className="font-semibold text-sm">{toTitleCase(title)}:</p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};
// ---

const StartScreen: React.FC<StartScreenProps> = ({ onStart, latestResult, isLoadingHistory }) => {
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const renderAnalysisDetailsInDialog = (analysisData: AnalysisDetail | string) => {
    if (typeof analysisData === 'string') {
      return <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisData}</p>;
    }
    const analysisKeys: Array<keyof AnalysisDetail & string> = [
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
      <div className="space-y-3 mt-2">
        {analysisKeys.map((key) => {
          if (analysisData[key]) {
            renderedKeys.add(key);
            return <AnalysisItem key={key} title={getDisplayTitle(key)} content={analysisData[key]} />;
          }
          return null;
        })}
        {Object.keys(analysisData)
          .filter((key) => !renderedKeys.has(key) && analysisData[key])
          .map((key) => (
            <AnalysisItem key={key} title={getDisplayTitle(key)} content={analysisData[key]} />
          ))}
      </div>
    );
  };

  const renderSolutionDetailsInDialog = (solutionData: SolutionDetail | string) => {
    if (typeof solutionData === 'string') {
      return <p className="text-sm text-muted-foreground whitespace-pre-wrap">{solutionData}</p>;
    }
    const solutionKeys: Array<keyof SolutionDetail & string> = [
      'short_term',
      'long_term',
      'spiritual_support',
      'professional_assistance',
    ];
    return (
      <div className="space-y-2 mt-1">
        {solutionKeys.map((key) => {
          if (solutionData[key]) {
            return <SolutionItemDialog key={key} title={key} content={solutionData[key]} />;
          }
          return null;
        })}
        {Object.keys(solutionData)
          .filter((key) => !solutionKeys.includes(key as any) && solutionData[key])
          .map((key) => (
            <SolutionItemDialog key={key} title={key} content={solutionData[key]} />
          ))}
      </div>
    );
  };

  return (
    // Ini adalah div luar dari kode StartScreen yang Anda berikan terakhir, saya pertahankan
    <div className=" w-full flex flex-col justify-center items-center p-4 space-y-6">
      {/* Kartu Utama "Cek Kondisi Mental Anda" - styling dari kode Anda */}
      <Card
        className="w-full max-w-md shadow-xl flex flex-col overflow-hidden
                       max-h-[90vh] sm:max-h-[80vh] md:max-h-[500px]"
      >
        <CardHeader className="pt-6 pb-1 text-center">
          <CardTitle className="text-xl md:text-2xl font-bold">Cek Kondisi Mental Anda</CardTitle>
          <CardDescription className="pt-2 text-sm md:text-base ">
            Jawablah {30} pertanyaan untuk mendapatkan gambaran kondisi mental Anda.
          </CardDescription>
        </CardHeader>
        {/* Saya menambahkan CardContent yang mungkin terlewat di versi Anda, untuk konsistensi */}

        <CardFooter className="flex justify-center pb-2">
          {' '}
          {/* mt-auto dari kode Anda */}
          <Button size="lg" onClick={onStart} className="w-full sm:w-auto">
            Mulai Pengecekan
          </Button>
        </CardFooter>
      </Card>

      {/* Kartu "Hasil Pengecekan Terakhir" - ditambahkan di sini */}
      <Card className="w-full max-w-md shadow-xl flex flex-col overflow-hidden max-h-[300px]">
        {' '}
        {/* max-w-md agar sama dengan kartu utama */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Hasil Pengecekan Terakhir</CardTitle>
        </CardHeader>
        <CardContent className="pb-4 flex-grow overflow-y-auto custom-scrollbar">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Memuat riwayat...</p>
            </div>
          ) : latestResult && latestResult.aiReport ? (
            <div className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Tanggal: {formatDate(latestResult.createdAt)}</span>
              </div>
              <div className="flex items-start text-sm">
                <div>
                  <span className="font-medium text-foreground">Kesimpulan: </span>
                  <span className="text-muted-foreground">
                    {latestResult.aiReport.conclusion || 'Tidak ada kesimpulan.'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada riwayat pengecekan. Mulai pengecekan baru untuk melihat hasilnya di sini.
            </p>
          )}
        </CardContent>
        {latestResult && latestResult.aiReport && (
          <CardFooter>
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className=" text-sm w-full md:w-auto">
                  {' '}
                  {/* Dibuat md:w-auto agar lebih adaptif */}
                  Selengkapnya...
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle className="text-xl">Detail Hasil Pengecekan</DialogTitle>
                  <DialogDescription>Dilakukan pada: {formatDate(latestResult.createdAt)}</DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 py-2 space-y-4">
                  <div className="mb-3">
                    <h4 className="font-semibold text-md mb-1 flex items-center">
                      <Info className="h-4 w-4 mr-2 text-blue-500" /> Deskripsi Umum
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {latestResult.aiReport.description || 'N/A'}
                    </p>
                  </div>
                  <div className="mb-3">
                    <h4 className="font-semibold text-md mb-1 flex items-center">
                      <ClipboardList className="h-4 w-4 mr-2 text-indigo-500" /> Analisis Mendalam
                    </h4>
                    {renderAnalysisDetailsInDialog(latestResult.aiReport.analysis)}
                  </div>
                  {/* Menggunakan renderSolutionDetailsInDialog untuk menampilkan solusi */}
                  <div className="mb-3">
                    <h4 className="font-semibold text-md mb-1 flex items-center">
                      <Lightbulb className="h-4 w-4 mr-2 text-green-500" /> Solusi dan Saran
                    </h4>
                    {renderSolutionDetailsInDialog(latestResult.aiReport.solution)}
                  </div>
                  <div className="mb-3">
                    <h4 className="font-semibold text-md mb-1 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-purple-500" /> Kesimpulan
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {latestResult.aiReport.conclusion || 'N/A'}
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default StartScreen;
