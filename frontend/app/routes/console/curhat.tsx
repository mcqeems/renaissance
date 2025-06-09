import React, { useState, useEffect, type FormEvent } from 'react';
import { Navigate } from 'react-router';
import axiosInstance from '~/axiosInstance';
import { useAuth } from '~/context/authContext';

import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Calendar } from '~/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group';

import { Terminal, CalendarIcon, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';

const ITEMS_PER_PAGE = 3;
type TimeOfDay = 'pagi' | 'siang' | 'malam' | null;

interface JournalEntry {
  id: string;
  text: string;
  sentiment: string;
  sentimentScores?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  createdAt: Date | string;
  botResponse?: string;
}

const CurhatPage: React.FC = () => {
  const [newJournalText, setNewJournalText] = useState<string>('');
  const [allJournalsFromApi, setAllJournalsFromApi] = useState<JournalEntry[]>([]);
  const [displayedJournals, setDisplayedJournals] = useState<JournalEntry[]>([]);
  const [loadingJournals, setLoadingJournals] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE);
  const [hasMoreToLoad, setHasMoreToLoad] = useState<boolean>(false);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterTimeOfDay, setFilterTimeOfDay] = useState<TimeOfDay>(null);
  const [expandedBotResponses, setExpandedBotResponses] = useState<Record<string, boolean>>({});
  const [scrollToJournalId, setScrollToJournalId] = useState<string | null>(null);

  const { currentUser, loading: authLoading, initialAuthChecked } = useAuth();

  const toggleBotResponseExpand = (journalId: string) => {
    setExpandedBotResponses((prev) => ({
      ...prev,
      [journalId]: !prev[journalId],
    }));
  };

  const collapsedMaxHeight = '175px';
  const expandedMaxHeight = '5000px';

  useEffect(() => {
    document.title = 'Curhat - Renaissance';
  }, []);

  useEffect(() => {
    const fetchJournals = async () => {
      if (!currentUser) {
        setAllJournalsFromApi([]);
        setLoadingJournals(false);
        return;
      }
      setLoadingJournals(true);
      setPageError(null);
      try {
        const token = await currentUser.getIdToken();
        const response = await axiosInstance.get<JournalEntry[]>('/api/journals', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const formattedJournals = response.data.map((j) => ({
          ...j,
          createdAt: new Date(j.createdAt),
        }));
        setAllJournalsFromApi(formattedJournals);
      } catch (err: any) {
        setPageError(err.response?.data?.error || 'Gagal mengambil riwayat curhatan.');
        console.error('Fetch journals error:', err);
        setAllJournalsFromApi([]);
      }
      setLoadingJournals(false);
    };

    if (initialAuthChecked && currentUser) {
      fetchJournals();
    } else if (initialAuthChecked && !currentUser) {
      setLoadingJournals(false);
      setAllJournalsFromApi([]);
    }
  }, [currentUser, initialAuthChecked]);

  useEffect(() => {
    let journalsToProcess = [...allJournalsFromApi];
    if (filterDate) {
      journalsToProcess = journalsToProcess.filter((journal) => {
        const journalDate = new Date(journal.createdAt);
        return (
          journalDate.getFullYear() === filterDate.getFullYear() &&
          journalDate.getMonth() === filterDate.getMonth() &&
          journalDate.getDate() === filterDate.getDate()
        );
      });
    }
    if (filterTimeOfDay) {
      journalsToProcess = journalsToProcess.filter((journal) => {
        const journalHour = new Date(journal.createdAt).getHours();
        if (filterTimeOfDay === 'pagi') return journalHour >= 0 && journalHour <= 11;
        if (filterTimeOfDay === 'siang') return journalHour >= 12 && journalHour <= 17;
        if (filterTimeOfDay === 'malam') return journalHour >= 18 && journalHour <= 23;
        return true;
      });
    }
    setDisplayedJournals(journalsToProcess.slice(0, visibleCount));
    setHasMoreToLoad(journalsToProcess.length > visibleCount);
  }, [allJournalsFromApi, filterDate, filterTimeOfDay, visibleCount]);

  useEffect(() => {
    if (scrollToJournalId && displayedJournals.some((j) => `journal-${j.id}` === scrollToJournalId)) {
      const element = document.getElementById(scrollToJournalId);
      if (element) {
        requestAnimationFrame(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        });
      }
      setScrollToJournalId(null);
    }
  }, [scrollToJournalId, displayedJournals]);

  const loadMoreJournals = () => {
    setVisibleCount((prevCount) => prevCount + ITEMS_PER_PAGE);
  };

  const handleSaveJournal = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newJournalText.trim()) {
      setPageError('Curhatan tidak boleh kosong.');
      return;
    }
    if (!currentUser) {
      setPageError('Anda harus login untuk menyimpan curhatan.');
      return;
    }

    setSubmitting(true);
    setPageError(null);
    try {
      const token = await currentUser.getIdToken();
      const response = await axiosInstance.post<JournalEntry>(
        '/api/journals',
        { text: newJournalText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newEntry: JournalEntry = {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
      };

      setAllJournalsFromApi((prevJournals) => [newEntry, ...prevJournals]);

      setFilterDate(null);
      setFilterTimeOfDay(null);
      setVisibleCount(ITEMS_PER_PAGE);
      setNewJournalText('');

      setScrollToJournalId(`journal-${newEntry.id}`);
    } catch (err: any) {
      setPageError(err.response?.data?.error || 'Gagal menyimpan curhatan.');
      console.error('Save journal error:', err);
    }
    setSubmitting(false);
  };

  if (!initialAuthChecked || authLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-3xl">
        <Skeleton className="h-10 w-1/2 mb-6" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-10 w-32 mb-8" />
        <Skeleton className="h-40 w-full mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (initialAuthChecked && !currentUser) {
    return <Navigate to="/login" replace />;
  }

  const getSentimentColor = (sentiment: string): string => {
    if (sentiment === 'positive') return 'text-green-600 dark:text-green-400';
    if (sentiment === 'negative') return 'text-red-600 dark:text-red-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl">
      <Card className="mb-8 bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Tulis Curhatanmu</CardTitle>
          <CardDescription>Bagikan perasaanmu di sini. Kami akan membantumu merefleksikannya.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveJournal}>
            <Textarea
              value={newJournalText}
              onChange={(e) => setNewJournalText(e.target.value)}
              placeholder="Apa yang sedang kamu rasakan atau pikirkan hari ini?"
              rows={6}
              className="mb-4 bg-input text-foreground placeholder:text-muted-foreground"
              required
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Curhatan'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {pageError && (
        <Alert variant="destructive" className="mb-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Oops! Terjadi Kesalahan</AlertTitle>
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-8 bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Filter Riwayat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:gap-4">
            <div className="flex-grow mb-4 md:mb-0">
              <label htmlFor="date-filter" className="block text-sm font-medium text-muted-foreground mb-1">
                Tanggal
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-filter"
                    variant={'outline'}
                    className={`w-full justify-start text-left font-normal ${!filterDate && 'text-muted-foreground'}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDate ? format(filterDate, 'PPP', { locale: id }) : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filterDate || undefined}
                    onSelect={(date: Date | undefined) => {
                      setFilterDate(date || null);
                      setVisibleCount(ITEMS_PER_PAGE);
                    }}
                    locale={id}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Waktu</label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={filterTimeOfDay || undefined}
              onValueChange={(value: string) => {
                if (value === 'pagi' || value === 'siang' || value === 'malam') {
                  setFilterTimeOfDay(value as TimeOfDay);
                } else {
                  setFilterTimeOfDay(null);
                }
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full"
            >
              <ToggleGroupItem value="pagi" aria-label="Filter pagi" className="rounded-md">
                Pagi (00:00-11:59)
              </ToggleGroupItem>
              <ToggleGroupItem value="siang" aria-label="Filter siang" className="rounded-md">
                Siang (12:00-17:59)
              </ToggleGroupItem>
              <ToggleGroupItem value="malam" aria-label="Filter malam" className="rounded-md">
                Malam (18:00-23:59)
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          {(filterDate || filterTimeOfDay) && (
            <div className="pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setFilterDate(null);
                  setFilterTimeOfDay(null);
                  setVisibleCount(ITEMS_PER_PAGE);
                }}
                className="w-full md:w-auto"
              >
                Reset Semua Filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-semibold mb-4">Riwayat Curhatan</h3>

        {loadingJournals && displayedJournals.length === 0 && (
          <>
            <Skeleton className="h-40 w-full mb-4 bg-muted" />
            <Skeleton className="h-40 w-full mb-4 bg-muted" />
            <Skeleton className="h-40 w-full bg-muted" />
          </>
        )}
        {!loadingJournals && displayedJournals.length === 0 && !pageError && (
          <p className="text-muted-foreground text-center py-8">
            {filterDate || filterTimeOfDay
              ? 'Tidak ada curhatan yang sesuai dengan filter.'
              : 'Kamu belum memiliki curhatan tersimpan.'}
          </p>
        )}
        <div className="space-y-6">
          {displayedJournals.map((journal) => (
            <Card key={journal.id} id={`journal-${journal.id}`} className="bg-card text-card-foreground">
              {' '}
              <CardHeader>
                <CardTitle className="text-lg">
                  {new Date(journal.createdAt).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </CardTitle>
                <CardDescription>
                  Pukul{' '}
                  {new Date(journal.createdAt).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap mb-3">{journal.text}</p>
                <p className="text-sm">
                  <strong>Sentimen Terdeteksi:</strong>{' '}
                  <span className={`font-semibold ${getSentimentColor(journal.sentiment)}`}>
                    {journal.sentiment?.toUpperCase()}
                  </span>
                </p>
                {journal.sentimentScores && (
                  <p className="text-xs text-muted-foreground mt-1">
                    (Positif: {(journal.sentimentScores.positive * 100).toFixed(1)}% | Netral:{' '}
                    {(journal.sentimentScores.neutral * 100).toFixed(1)}% | Negatif:{' '}
                    {(journal.sentimentScores.negative * 100).toFixed(1)}%)
                  </p>
                )}

                {journal.botResponse &&
                  (() => {
                    const isExpanded = !!expandedBotResponses[journal.id];

                    return (
                      <Alert
                        variant="default"
                        className={`
                            mt-4 
                            
                            flex flex-col
                            transition-all duration-300 ease-in-out
                            relative overflow-hidden rounded-md 
                          `}
                        style={{
                          maxHeight: isExpanded ? expandedMaxHeight : collapsedMaxHeight,
                        }}
                      >
                        <div className="flex items-start p-3 flex-shrink-0">
                          <Sparkles className="h-5 w-5 mr-2 mt-0.5 text-blue-500 dark:text-blue-400" />
                          <AlertTitle className="font-semibold text-base">Rena Berkata:</AlertTitle>
                        </div>

                        <div className="flex-grow overflow-hidden px-3 relative min-h-0">
                          {' '}
                          <AlertDescription className="text-sm pb-2 pr-1 whitespace-pre-wrap">
                            {' '}
                            {journal.botResponse}
                          </AlertDescription>{' '}
                          {!isExpanded && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-10 
                         bg-gradient-to-t from-[#191e2e] via-[#191e2e]-/80 to-transparent 
                         dark:from-blue-900 dark:via-blue-900/80 dark:to-transparent 
                         pointer-events-none"
                            />
                          )}
                        </div>

                        <div className="flex-shrink-0 p-1 border-t w-full border-blue-200 dark:border-blue-600 flex justify-center items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBotResponseExpand(journal.id);
                            }}
                            className="w-full text-sm bg-[#191e2e] hover:bg-[#262d46]"
                            aria-expanded={isExpanded}
                            aria-controls={`bot-response-content-${journal.id}`}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 mr-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 mr-1" />
                            )}
                          </Button>
                        </div>
                      </Alert>
                    );
                  })()}
              </CardContent>
            </Card>
          ))}
        </div>

        {hasMoreToLoad && !loadingJournals && (
          <div className="mt-8 text-center">
            <Button onClick={loadMoreJournals} variant="outline">
              Lihat Riwayat Lainnya
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurhatPage;
