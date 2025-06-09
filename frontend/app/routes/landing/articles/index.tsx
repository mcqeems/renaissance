import { useState, useEffect, useMemo, useRef } from 'react'; // Added useRef
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Button } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { id as dateFnsIdLocale } from 'date-fns/locale';
import { Spinner } from '~/components/ui/spinner';
import MainNavbar from '~/components/myComponents/MainNavbar';
import MainFooter from '~/components/myComponents/MainFooter';

// GSAP imports
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother'; // Make sure this path is correct for your setup
import { useGSAP } from '@gsap/react'; // Ensure you have @gsap/react installed

import ArticlePost, { mockArticlesData, type ArticleSummary } from './ArticlePost'; // SESUAIKAN PATH INI

export default function ArticlesIndexPage() {
  const [allArticlesMaster, setAllArticlesMaster] = useState<ArticleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [monthForCalendar, setMonthForCalendar] = useState<Date>(startOfMonth(new Date()));

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Refs for GSAP and ScrollSmoother
  const smoothWrapperRef = useRef<HTMLDivElement>(null);
  const smoothContentRef = useRef<HTMLDivElement>(null);
  const mainContentContainerRef = useRef<HTMLElement>(null); // Ref for the <main> tag

  const genres = useMemo(() => {
    const dynamicGenres = new Set(mockArticlesData.map((article) => article.genre).filter(Boolean) as string[]);
    return ['Semua Genre', ...Array.from(dynamicGenres)];
  }, []);

  useEffect(() => {
    document.title = 'Artikel - Renaissance';
    const fetchArticles = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      const sortedArticles = [...mockArticlesData].sort(
        (a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
      );
      setAllArticlesMaster(sortedArticles);
      setIsLoading(false);
    };
    fetchArticles();
  }, []);

  // GSAP Animations and ScrollSmoother setup
  useGSAP(() => {
    // Don't run animations if still loading or refs are not available
    if (isLoading || !smoothWrapperRef.current || !smoothContentRef.current || !mainContentContainerRef.current) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

    const smoother = ScrollSmoother.create({
      wrapper: smoothWrapperRef.current,
      content: smoothContentRef.current,
      smooth: 1.2, // Feel free to adjust the smoothness (default is 1)
      effects: true, // Allows usage of data-speed and data-lag attributes on elements
      smoothTouch: 0.1, // Smoother scrolling on touch devices
    });

    // --- Opening Animations ---

    // 1. Main content container (<main> tag) - Scale and Opacity
    gsap.fromTo(
      mainContentContainerRef.current,
      { opacity: 0, scale: 0.8 },
      {
        opacity: 1,
        scale: 1,
        duration: 1.0, // Duration of the animation
        ease: 'power3.out', // Easing function for a smooth effect
        delay: 0.2, // Slight delay after ScrollSmoother initializes
      }
    );

    // 2. Hero Image animation
    const heroImage = mainContentContainerRef.current.querySelector('.hero-image-animation');
    if (heroImage) {
      gsap.fromTo(
        heroImage,
        { opacity: 0, y: -20, scale: 1.1 }, // Start from slightly above and larger
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.0,
          ease: 'power3.out',
          delay: 0.4, // Stagger slightly after the main container starts
        }
      );
    }

    // 3. Hero section text (Title and Subtitle)
    const heroTitle = mainContentContainerRef.current.querySelector('.animated-hero-title');
    const heroSubtitle = mainContentContainerRef.current.querySelector('.animated-hero-subtitle');

    if (heroTitle && heroSubtitle) {
      gsap.fromTo(
        [heroTitle, heroSubtitle],
        { opacity: 0, y: 40 }, // Start from below and transparent
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'circ.out', // A nice bouncy ease
          stagger: 0.2, // Animate one after the other with a small delay
          delay: 0.6, // Start after the main container animation
        }
      );
    }

    // 4. "Newest Article" section - Fade in on scroll
    const newestArticleSection = mainContentContainerRef.current.querySelector('.newest-article-section');
    if (newestArticleSection) {
      gsap.fromTo(
        newestArticleSection,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            // Trigger animation when this section scrolls into view
            trigger: newestArticleSection,
            start: 'top 85%', // Start animation when 85% of the element is visible
            toggleActions: 'play none none none', // Play animation once and don't reverse
          },
        }
      );
    }

    // 5. "Artikel Lainnya" section - Fade in on scroll
    const otherArticlesSection = mainContentContainerRef.current.querySelector('#artikel-lainnya-section');
    if (otherArticlesSection) {
      gsap.fromTo(
        otherArticlesSection,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: otherArticlesSection,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Optional: Animate filter controls within "Artikel Lainnya"
      const filterControls = otherArticlesSection.querySelector('.filter-controls-container');
      if (filterControls && filterControls.children.length > 0) {
        gsap.fromTo(
          Array.from(filterControls.children),
          {
            // Animate each child of the filter container
            opacity: 0,
            y: 20,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: otherArticlesSection,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    }

    // Cleanup function for when the component unmounts or isLoading changes
    return () => {
      if (smoother) {
        smoother.kill(); // Important to kill the ScrollSmoother instance
      }
      // GSAP's useGSAP hook automatically cleans up tweens and ScrollTriggers created within its scope.
      // If you had manually created ScrollTriggers outside of tweens, you'd kill them here.
    };
  }, [isLoading]); // Rerun animations if isLoading state changes (e.g., after data is loaded)

  const newestArticle = useMemo(() => {
    return allArticlesMaster.length > 0 ? allArticlesMaster[0] : null;
  }, [allArticlesMaster]);

  const articlesForFiltering = useMemo(() => {
    return allArticlesMaster;
  }, [allArticlesMaster]);

  const filteredOtherArticles = useMemo(() => {
    setCurrentPage(1);
    return articlesForFiltering
      .filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (article.excerpt && article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .filter((article) =>
        selectedDate
          ? format(new Date(article.publicationDate), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
          : true
      )
      .filter((article) => (selectedGenre && selectedGenre !== 'Semua Genre' ? article.genre === selectedGenre : true));
  }, [articlesForFiltering, searchTerm, selectedDate, selectedGenre]);

  const totalPages = Math.ceil(filteredOtherArticles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVisibleArticles = filteredOtherArticles.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const section = document.getElementById('artikel-lainnya-section');
    if (section) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = section.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const getPaginationButtons = () => {
    const pageButtons = [];
    const maxVisibleButtons = 5;
    let startPage = 1;
    let endPage = totalPages;

    if (totalPages > maxVisibleButtons) {
      const maxPagesBeforeCurrent = Math.floor(maxVisibleButtons / 2);
      const maxPagesAfterCurrent = Math.ceil(maxVisibleButtons / 2) - 1;

      if (currentPage <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxVisibleButtons;
      } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxVisibleButtons + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrent;
        endPage = currentPage + maxPagesAfterCurrent;
      }
    }
    startPage = Math.max(1, startPage);
    endPage = Math.min(totalPages, endPage);

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <Button
          key={i}
          variant={currentPage === i ? 'default' : 'outline'}
          size="icon"
          onClick={() => handlePageChange(i)}
          className="h-9 w-9 sm:h-10 sm:w-10"
        >
          {i}
        </Button>
      );
    }
    return pageButtons;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDate(undefined);
    setSelectedGenre('');
    setCurrentPage(1);
    setMonthForCalendar(startOfMonth(new Date()));
  };

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-[#12151e]">
        <Spinner className="text-[#c2d2ff]" size={'large'} />
      </div>
    );
  }

  return (
    // Wrappers for GSAP ScrollSmoother
    <>
      <MainNavbar />
      <div id="smooth-wrapper" ref={smoothWrapperRef}>
        <div id="smooth-content" ref={smoothContentRef}>
          {/* Add ref to <main> and initial opacity-0 for GSAP animation */}
          <main
            ref={mainContentContainerRef}
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 opacity-0" // Start with opacity-0
          >
            <section className="flex justify-center items-center flex-col gap-5 mb-15">
              {/* Added a class to the image for animation targeting */}
              <img
                className="object-fit h-[500px] hero-image-animation"
                src="/logo/Renaissance.svg"
                alt="Renaissance Logo"
              />
              {/* Added classes for animation targeting */}
              <h2 className="text-5xl plus-jakarta-sans-700 animated-hero-title text-center">Renaissance's Articles</h2>
              <p className="text-muted-foreground plus-jakarta-sans-400 animated-hero-subtitle text-center">
                Temukan artikel menarik seputar kesehatan mental dan pencegahan Judi Online
              </p>
            </section>

            {newestArticle && (
              // Added a class for animation targeting
              <section className="mb-12 newest-article-section">
                <ArticlePost article={newestArticle} type="featured" />
              </section>
            )}

            {/* ID is already present for targeting, can also add a class if preferred */}
            <section id="artikel-lainnya-section">
              <h2 className="text-2xl font-semibold dark:border-gray-700">Artikel Lainnya</h2>
              <div className="w-full mx-auto py-4 sm:py-6 md:py-8">
                <Input
                  type="search"
                  placeholder="Cari di Artikel Lainnya..."
                  className="w-full text-base mb-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {/* Added class to the container of filter controls for animation */}
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={`w-full sm:w-auto justify-start text-left font-normal flex-grow ${
                          !selectedDate && 'text-muted-foreground'
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, 'PPP', { locale: dateFnsIdLocale })
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (date) {
                            setMonthForCalendar(startOfMonth(date));
                          }
                        }}
                        month={monthForCalendar}
                        onMonthChange={setMonthForCalendar}
                        locale={dateFnsIdLocale}
                        showOutsideDays={false}
                      />
                    </PopoverContent>
                  </Popover>
                  <Select
                    value={selectedGenre}
                    onValueChange={(value) => setSelectedGenre(value === 'Semua Genre' ? '' : value)}
                  >
                    <SelectTrigger className="w-full sm:w-auto flex-grow">
                      <SelectValue placeholder="Filter genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    onClick={handleResetFilters}
                    className="w-full sm:w-auto flex-shrink-0 px-3"
                  >
                    <RotateCcw className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                </div>
              </div>
              {currentVisibleArticles.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {currentVisibleArticles.map((article) => (
                      <ArticlePost key={article.slug} article={article} type="standard" />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-10">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-9 w-9 sm:h-10 sm:w-10"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {getPaginationButtons()}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-9 w-9 sm:h-10 sm:w-10"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                !isLoading && (
                  <p className="text-center text-muted-foreground text-lg col-span-full py-8">
                    Tidak ada artikel lainnya yang cocok dengan kriteria pencarian Anda.
                  </p>
                )
              )}
            </section>
          </main>
          <MainFooter />
        </div>
      </div>
    </>
  );
}
