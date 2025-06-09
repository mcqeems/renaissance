import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { mockArticlesData, type ArticleSummary } from './ArticlePost';

import MainFooter from '~/components/myComponents/MainFooter';
import MainNavbar from '~/components/myComponents/MainNavbar';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { Spinner } from '~/components/ui/spinner';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { useGSAP } from '@gsap/react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

// TIDAK ADA LAGI KOMPONEN ArticleDetailLayout TERPISAH
// SEMUANYA KINI ADA DI DALAM ArticleSlugPage

export default function ArticleSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleSummary | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // --- Refs untuk GSAP (MENGIKUTI POLA INDEX.TSX) ---
  const smoothWrapperRef = useRef<HTMLDivElement>(null);
  const smoothContentRef = useRef<HTMLDivElement>(null);
  const mainContentContainerRef = useRef<HTMLElement>(null); // Ref untuk <main>

  // --- Mengambil data ---
  useEffect(() => {
    setIsLoading(true);
    document.title = `Membaca Artikel... - Renaissance`;
    // Simulasi fetch
    setTimeout(() => {
      if (slug) {
        const foundArticle = mockArticlesData.find((a) => a.slug === slug);
        setArticle(foundArticle || null);
        if (foundArticle) {
          document.title = `${foundArticle.title} - Renaissance`;
        } else {
          document.title = `Artikel Tidak Ditemukan - Renaissance`;
        }
      } else {
        setArticle(null);
        document.title = `Artikel Tidak Ditemukan - Renaissance`;
      }
      setIsLoading(false);
    }, 300); // Sedikit delay untuk simulasi
  }, [slug]);

  // --- GSAP dan ScrollSmoother (MENGIKUTI POLA INDEX.TSX) ---
  useGSAP(() => {
    // Guard clause, jangan jalankan jika loading atau ref belum siap
    if (isLoading || !smoothWrapperRef.current || !smoothContentRef.current || !mainContentContainerRef.current) {
      return;
    }

    // Inisialisasi smoother dengan ref eksplisit
    const smoother = ScrollSmoother.create({
      wrapper: smoothWrapperRef.current,
      content: smoothContentRef.current,
      smooth: 1.2,
      effects: true,
      smoothTouch: 0.1,
    });

    // Animasi fade-in untuk seluruh konten
    gsap.from(mainContentContainerRef.current, {
      opacity: 0,
      y: 60,
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.2,
    });

    // Cleanup function yang penting
    return () => {
      if (smoother) {
        smoother.kill();
      }
    };
  }, [isLoading]); // Dependensi pada [isLoading]

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-[#12151e]">
        <Spinner className="text-[#c2d2ff]" size={'large'} />
      </div>
    );
  }

  return (
    <>
      <MainNavbar />
      <div id="smooth-wrapper" ref={smoothWrapperRef}>
        <div id="smooth-content" ref={smoothContentRef}>
          {/* Tag <main> sekarang menjadi container utama */}
          <main ref={mainContentContainerRef}>
            {' '}
            {/* Dimulai dengan opacity-0 */}
            {article ? (
              <article className="max-w-3xl mx-auto px-4 py-8 sm:py-12 lg:py-16">
                <div className="mb-6">
                  <Link to="/articles" className="inline-flex items-center text-sm text-primary hover:underline mb-4">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Kembali ke Daftar Artikel
                  </Link>
                </div>
                <header className="mb-8">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                    {article.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span>Oleh {article.authorName}</span>
                    <span>&bull;</span>
                    <time dateTime={new Date(article.publicationDate).toISOString()}>
                      {new Date(article.publicationDate).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                  {article.tags && article.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </header>
                {article.featuredImageUrl && (
                  <img
                    src={article.featuredImageUrl}
                    alt={`Gambar unggulan untuk ${article.title}`}
                    className="w-full h-auto rounded-lg shadow-md mb-8"
                  />
                )}
                <Separator className="my-8" />
                <div
                  className="prose prose-lg dark:prose-invert max-w-none 
             prose-img:rounded-lg prose-img:shadow-sm 
             prose-headings:font-semibold 
             prose-headings:text-blue-400
             prose-a:text-primary hover:prose-a:text-primary/80
             prose-p:text-gray-200
             prose-strong:text-white
             prose-li:text-gray-300
             prose-ul:text-gray-300
             prose-ol:text-gray-300
             prose-code:text-pink-400
             prose-blockquote:text-gray-400 prose-blockquote:border-gray-700"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.contentMarkdown}</ReactMarkdown>
                </div>
              </article>
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-8 text-center">
                <h1 className="text-3xl font-bold mb-4">Artikel Tidak Ditemukan</h1>
                <p className="text-muted-foreground mb-6">Maaf, artikel yang Anda cari tidak dapat ditemukan.</p>
                <Link to="/articles" className="text-primary hover:underline">
                  &larr; Kembali ke Daftar Artikel
                </Link>
              </div>
            )}
          </main>
          <MainFooter />
        </div>
      </div>
    </>
  );
}
