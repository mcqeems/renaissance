import type { Route } from '../landing/+types/home';
import { useRef, useState, useEffect } from 'react';
import '../../landing.css';
import MainNavbar from '~/components/myComponents/MainNavbar';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { useGSAP } from '@gsap/react';
import SplitType from 'split-type';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '~/components/ui/card';
import { Spinner } from '~/components/ui/spinner';
import MainFooter from '~/components/myComponents/MainFooter';
import { Button } from '~/components/ui/button';
import { Link } from 'react-router';
import ArticlePost, { mockArticlesData } from '~/routes/landing/articles/ArticlePost';
import PlayableGif from '~/components/myComponents/PlayableGif'; // Adjust the import path as needed

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Renaissance Home' },
    {
      name: 'AI Powered App wrapped in website to overcome mental sickness and avoiding online wager based on real time analytics and interactive education.',
      content: 'Health and Education',
    },
  ];
}

export default function Home() {
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const parallaxBackgroundRef = useRef<HTMLDivElement>(null);
  const smoothWrapperRef = useRef<HTMLDivElement>(null);
  const smoothContentRef = useRef<HTMLDivElement>(null);
  const blurDivRef = useRef<HTMLDivElement>(null);
  const featuresSectionRef = useRef<HTMLDivElement>(null);
  const featuresSectionLogoRef = useRef<HTMLDivElement>(null);
  const previewSectionRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLDivElement>(null);
  const renaSectionRef = useRef<HTMLDivElement>(null);
  const dodiSectionRef = useRef<HTMLDivElement>(null);
  const articlesSectionRef = useRef<HTMLDivElement>(null);
  const ctaSectionRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const latestArticles = mockArticlesData
    .sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime())
    .slice(0, 3);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useGSAP(
    () => {
      if (!isLoading && smoothWrapperRef.current && smoothContentRef.current) {
        gsap.set(smoothWrapperRef.current, { opacity: 0, scale: 0.8 });

        gsap.to(smoothWrapperRef.current, {
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: 'power2.inOut',
          delay: 0.1,
        });

        const splitInstances: SplitType[] = [];

        if (smoothWrapperRef.current && smoothContentRef.current) {
          const smoother = ScrollSmoother.create({
            wrapper: smoothWrapperRef.current,
            content: smoothContentRef.current,
            smooth: 1.2,
            effects: true,
          });

          if (parallaxBackgroundRef.current && heroContainerRef.current) {
            gsap.to(parallaxBackgroundRef.current, {
              yPercent: 30,
              scale: 1.1,
              ease: 'power1.out',
              filter: 'blur(5px)',
              scrollTrigger: {
                trigger: heroContainerRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: true,
                scroller: smoothWrapperRef.current,
                onUpdate: (self) => {
                  const blurAmount = self.progress * 20;
                  gsap.set(parallaxBackgroundRef.current, { filter: `blur(${blurAmount}px)` });
                },
              },
            });
          }

          if (heroTitleRef.current) {
            const heroTitleText = new SplitType(heroTitleRef.current, { types: 'chars' });
            splitInstances.push(heroTitleText);

            gsap.set(heroTitleText.chars, { opacity: 0 });

            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';
            cursor.innerHTML = '|';
            cursor.style.opacity = '0';
            heroTitleRef.current.appendChild(cursor);

            gsap.set(cursor, {
              color: 'inherit',
              marginLeft: '2px',
              display: 'inline-block',
            });

            gsap.to(heroTitleText.chars, {
              opacity: 1,
              delay: 0.5,

              duration: 0.01,
              stagger: 0.18,
              ease: 'none',
              onComplete: () => {
                gsap.set(cursor, { opacity: 1 });
                gsap.to(cursor, {
                  opacity: 0,
                  duration: 0.5,
                  repeat: -1,
                  yoyo: true,
                  ease: 'power1.inOut',
                });
              },
            });
          }

          const revealElements = gsap.utils.toArray<HTMLElement>('.reveal-type');

          revealElements.forEach((element) => {
            const bgColor = element.dataset.bgColor || 'transparent';
            const fgColor = element.dataset.fgColor || '#FFFFFF';

            const text = new SplitType(element, { types: 'chars' });
            splitInstances.push(text);

            gsap.fromTo(
              text.chars,
              {
                color: bgColor,
                y: 20,
                opacity: 0,
              },
              {
                color: fgColor,
                y: 0,
                opacity: 1,
                duration: 0.3,
                stagger: 0.02,
                scrollTrigger: {
                  trigger: element,
                  start: 'top 100%',
                  end: 'top 65%',
                  scrub: true,
                  markers: false,
                  scroller: smoothWrapperRef.current,
                },
              }
            );
          });

          const revealElementsOne = gsap.utils.toArray<HTMLElement>('.reveal-type-1');

          revealElementsOne.forEach((element) => {
            const bgColor = '#979797';
            const fgColor = element.dataset.fgColor || '#FFFFFF';

            const text = new SplitType(element, { types: 'chars' });
            splitInstances.push(text);

            gsap.fromTo(
              text.chars,
              {
                color: bgColor,
              },
              {
                color: fgColor,
                duration: 2,
                stagger: 2,
                scrollTrigger: {
                  trigger: element,
                  start: 'top 70%',
                  end: 'top 30%',
                  scrub: true,
                  markers: false,
                  scroller: smoothWrapperRef.current,
                },
              }
            );
          });

          if (blurDivRef.current) {
            // Animasi parallax untuk ambient background
            gsap.to('.ambient-zone-intro', {
              yPercent: -30,
              ease: 'none',
              scrollTrigger: {
                trigger: blurDivRef.current,
                scroller: smoothWrapperRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
              },
            });
          }

          if (featuresSectionRef.current) {
            const featureTitle = featuresSectionRef.current.querySelector('.feature-title');
            const featureCards = gsap.utils.toArray<HTMLElement>(
              featuresSectionRef.current.querySelectorAll('.feature-card')
            );

            // Animasi parallax untuk ambient background
            gsap.to('.ambient-zone-features', {
              yPercent: -25,
              ease: 'none',
              scrollTrigger: {
                trigger: featuresSectionRef.current,
                scroller: smoothWrapperRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
              },
            });

            if (featureTitle) {
              gsap.from(featureTitle, {
                opacity: 0,
                y: 80,
                duration: 0.8,
                ease: 'back.out(1.7)',
                scrollTrigger: {
                  trigger: featuresSectionRef.current,
                  scroller: smoothWrapperRef.current,
                  start: 'top 80%',
                  end: 'bottom top',
                  toggleActions: 'play none none none',
                  markers: false,
                },
              });
            }

            if (featureCards.length > 0) {
              gsap.from(featureCards, {
                opacity: 0,
                y: 100,
                scale: 0.95,
                duration: 0.7,
                ease: 'back.out(1.4)',
                stagger: 0.2,
                scrollTrigger: {
                  trigger: featuresSectionRef.current,
                  scroller: smoothWrapperRef.current,
                  start: 'top 70%',
                  end: 'bottom top',
                  toggleActions: 'play none none none',
                  markers: false,
                },
              });
            }
          }

          if (featuresSectionLogoRef.current) {
            const featureLogo = featuresSectionLogoRef.current.querySelector('.feature-logo');

            // Animasi parallax untuk ambient background
            gsap.to('.ambient-zone-logo', {
              yPercent: -20,
              ease: 'none',
              scrollTrigger: {
                trigger: featuresSectionLogoRef.current,
                scroller: smoothWrapperRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
              },
            });

            if (featureLogo) {
              gsap.from(featureLogo, {
                opacity: 0,
                y: 100,
                scale: 0.95,
                duration: 0.7,
                ease: 'back.out(1.4)',
                stagger: 0.2,
                scrollTrigger: {
                  trigger: featuresSectionLogoRef.current,
                  scroller: smoothWrapperRef.current,
                  start: 'top 50%',
                  end: 'bottom top',
                  scrub: true,
                  markers: false,
                },
              });
            }
          }

          if (previewSectionRef.current) {
            const previewGifs = previewSectionRef.current.querySelectorAll('.preview-gif');

            // Animasi parallax untuk ambient background
            gsap.to('.ambient-zone-preview', {
              yPercent: -15,
              ease: 'none',
              scrollTrigger: {
                trigger: previewSectionRef.current,
                scroller: smoothWrapperRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5,
              },
            });

            if (previewGifs.length > 0) {
              previewGifs.forEach((gif) => {
                gsap.from(gif, {
                  opacity: 0,
                  y: 100,
                  scale: 0.9,
                  duration: 0.8, // Sedikit lebih lambat untuk efek lebih mulus
                  ease: 'back.out(1.8)',
                  scrollTrigger: {
                    trigger: gif, // Menggunakan elemen itu sendiri sebagai trigger
                    scroller: smoothWrapperRef.current,
                    start: 'top 85%', // Memicu animasi saat elemen 85% dari atas viewport
                    toggleActions: 'play none none none', // Hanya berjalan sekali saat masuk
                  },
                });
              });
            }
          }

          if (renaSectionRef.current) {
            const renaImage = renaSectionRef.current.querySelector('.rena-img');
            const renaTextHeadElements = renaSectionRef.current.querySelectorAll('.rena-text-head');
            const renaTextParagraphElements = renaSectionRef.current.querySelectorAll('.rena-text-paragraph');

            // Animasi parallax untuk ambient background
            gsap.to('.ambient-zone-rena', {
              yPercent: -35,
              ease: 'none',
              scrollTrigger: {
                trigger: renaSectionRef.current,
                scroller: smoothWrapperRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
              },
            });

            if (renaImage) {
              const tlJumpInFromBottom = gsap.timeline({
                scrollTrigger: {
                  trigger: renaSectionRef.current,
                  scroller: smoothWrapperRef.current,
                  start: 'top 40%',
                  end: 'bottom top',
                  toggleActions: 'play none none none',
                  markers: false,
                },
              });

              tlJumpInFromBottom
                .set(renaImage, {
                  transformOrigin: 'bottom center',
                  opacity: 0,
                  yPercent: 100,
                  scaleY: 0.7,
                  scaleX: 0.85,
                })
                .to(renaImage, {
                  opacity: 1,
                  yPercent: -10,
                  scaleY: 1.1,
                  scaleX: 1.05,
                  duration: 0.6,
                  ease: 'power1.out',
                })
                .to(renaImage, {
                  yPercent: 5,
                  scaleY: 0.8,
                  scaleX: 0.9,
                  duration: 0.25,
                  ease: 'power2.in',
                })
                .to(renaImage, {
                  yPercent: 0,
                  scaleY: 1,
                  scaleX: 1,
                  duration: 0.6,
                  ease: 'bounce.out',
                });
            }

            if (renaTextHeadElements && renaTextHeadElements.length > 0) {
              gsap.from(renaTextHeadElements, {
                opacity: 0,
                yPercent: -50,
                rotationZ: -15,
                transformOrigin: 'top center',
                duration: 1,
                ease: 'elastic.out(1, 0.5)',
                stagger: 0.3,
                scrollTrigger: {
                  trigger: renaSectionRef.current,
                  scroller: smoothWrapperRef.current,
                  start: 'top 40%',
                  toggleActions: 'play none none none',
                  markers: false,
                },
              });
            }

            if (renaTextParagraphElements && renaTextParagraphElements.length > 0) {
              gsap.from(renaTextParagraphElements, {
                opacity: 0,
                y: 60,
                scale: 0.85,
                duration: 0.8,
                delay: 0.7,
                ease: 'back.out(1.7)',
                stagger: 0.2,
                scrollTrigger: {
                  trigger: renaSectionRef.current,
                  scroller: smoothWrapperRef.current,
                  start: 'top 50%',
                  toggleActions: 'play none none none',
                  markers: false,
                },
              });
            }
          }

          if (dodiSectionRef.current) {
            const dodiImage = dodiSectionRef.current.querySelector('.dodi-img');
            const dodiTextHeadElements = dodiSectionRef.current.querySelectorAll('.dodi-text-head');
            const dodiTextParagraphElements = dodiSectionRef.current.querySelectorAll('.dodi-text-paragraph');

            // Animasi parallax untuk ambient background
            gsap.to('.ambient-zone-dodi', {
              yPercent: -25,
              ease: 'none',
              scrollTrigger: {
                trigger: dodiSectionRef.current,
                scroller: smoothWrapperRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
              },
            });

            if (dodiImage) {
              gsap.from(dodiImage, {
                opacity: 0,
                x: 200,
                scale: 0.9,
                duration: 1.2,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: dodiSectionRef.current,
                  scroller: smoothWrapperRef.current,
                  start: 'top 60%',
                  toggleActions: 'play none none none',
                  markers: false,
                },
              });
            }

            if (dodiTextHeadElements && dodiTextHeadElements.length > 0) {
              gsap.from(dodiTextHeadElements, {
                opacity: 0,
                yPercent: -50,
                rotationZ: -15,
                transformOrigin: 'top center',
                duration: 1,
                ease: 'elastic.out(1, 0.5)',
                stagger: 0.3,
                scrollTrigger: {
                  trigger: dodiSectionRef.current,
                  scroller: smoothWrapperRef.current,
                  start: 'top 50%',
                  toggleActions: 'play none none none',
                  markers: false,
                },
              });
            }

            if (dodiTextParagraphElements && dodiTextParagraphElements.length > 0) {
              gsap.from(dodiTextParagraphElements, {
                opacity: 0,
                y: 60,
                scale: 0.85,
                delay: 0.7,
                duration: 0.8,
                ease: 'back.out(1.7)',
                stagger: 0.2,
                scrollTrigger: {
                  trigger: dodiSectionRef.current,
                  scroller: smoothWrapperRef.current,
                  start: 'top 55%',
                  toggleActions: 'play none none none',
                  markers: false,
                },
              });
            }
          }

          if (articlesSectionRef.current) {
            const articleTitle = articlesSectionRef.current.querySelector('.article-section-title');
            const articleCards = gsap.utils.toArray(articlesSectionRef.current.querySelectorAll('.article-card'));

            // Animasi parallax untuk ambient background
            gsap.to('.ambient-zone-articles', {
              yPercent: -20,
              ease: 'none',
              scrollTrigger: {
                trigger: articlesSectionRef.current,
                scroller: smoothWrapperRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
              },
            });

            gsap.from(articlesSectionRef.current.querySelector('.article-section-title'), {
              opacity: 0,
              y: 50,
              scrollTrigger: {
                trigger: articlesSectionRef.current,
                scroller: smoothWrapperRef.current,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
            });

            gsap.from(articlesSectionRef.current.querySelectorAll('.article-card'), {
              opacity: 0,
              y: 100,
              scale: 0.95,
              stagger: 0.2,
              scrollTrigger: {
                trigger: articlesSectionRef.current,
                scroller: smoothWrapperRef.current,
                start: 'top 70%',
                toggleActions: 'play none none none',
              },
            });
          }

          if (ctaSectionRef.current) {
            const ctaElements = ctaSectionRef.current.querySelectorAll('.cta-element');

            gsap.to('.ambient-zone-cta', {
              yPercent: -30,
              ease: 'none',
              scrollTrigger: {
                trigger: ctaSectionRef.current,
                scroller: smoothWrapperRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
              },
            });

            gsap.from(ctaSectionRef.current.querySelectorAll('.cta-element'), {
              opacity: 0,
              y: 70,
              scale: 0.9,
              stagger: 0.3,
              scrollTrigger: {
                trigger: ctaSectionRef.current,
                scroller: smoothWrapperRef.current,
                start: 'top 75%',
                toggleActions: 'play none none none',
              },
            });
          }

          return () => {
            if (smoother) {
              smoother.kill();
            }
          };
        }
      }
    },
    { scope: smoothWrapperRef, dependencies: [isLoading] }
  );

  useEffect(() => {
    if (!isLoading) {
      const refreshDelay = 1300;
      const refreshTimeout = setTimeout(() => {
        console.log('Attempting to manually refresh ScrollTrigger...');
        ScrollTrigger.refresh();
        console.log('ScrollTrigger manually refreshed.');
      }, refreshDelay);

      return () => clearTimeout(refreshTimeout);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#12151e',
          color: 'white',
          fontSize: '2rem',
        }}
      >
        <Spinner className="text-[#c2d2ff]" size={'large'}></Spinner>
      </div>
    );
  }

  return (
    <>
      <MainNavbar />
      <div id="smooth-wrapper" ref={smoothWrapperRef} style={{ opacity: 0 }}>
        <div id="smooth-content" ref={smoothContentRef}>
          <div className="h-screen p-6">
            <div ref={heroContainerRef} className="h-full p-4 relative overflow-hidden rounded-3xl">
              <div
                ref={parallaxBackgroundRef}
                className="absolute top-[-15%] left-0 w-full h-[130%] bg-[url(/others/HeroBG.png)] bg-cover bg-center z-[-1]"
              />
              <div className="relative z-10 h-full flex flex-col justify-between text-white">
                <div className="p-6 rounded-4xl h-full flex flex-col justify-between">
                  <div>
                    <h1 ref={heroTitleRef} className="md:text-9xl plus-jakarta-sans-700 text-4xl break-words">
                      Renaissance
                    </h1>
                  </div>
                  <div className="flex flex-row justify-between mb-8 md:mb-0">
                    <p className="md:text-3xl text-sm plus-jakarta-sans-500 w-full md:max-w-[250px] mb-15 md:mb-0">
                      Ini Bukan Akhir Ini Kebangkitan-mu.
                    </p>
                    <p className="md:text-[14px] text-[10px] plus-jakarta-sans-200 w-full max-w-[300px] text-right self-end">
                      Mengembalikan ketenangan pikiranmu dari jurang keputusasaan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={featuresSectionLogoRef}
            className=" relative h-[100vh] text-white p-8 flex flex-col justify-center items-center"
          >
            {' '}
            <div className="ambient-zone ambient-zone-logo"></div>
            <img src="/logo/Renaissance.svg" className="h-[500px] w-[500px] feature-logo"></img>
            <div>
              <p className="md:text-7xl text-4xl plus-jakarta-sans-400 break-words text-center reveal-type">
                Selamat datang di <b>Renaissance</b>
              </p>
            </div>
          </div>
          <div
            ref={blurDivRef}
            className=" relative h-[100vh] text-white md:p-8 flex justify-center items-center md:px-15 px-4"
          >
            <div className="ambient-zone ambient-zone-intro"></div>
            <p className="md:text-5xl/20 text-xl/10 plus-jakarta-sans-400 break-words text-center reveal-type-1">
              <b>Apa itu Renaissance?</b>
              <br />
              Sebuah website yang dirancang khusus untuk membantu Anda merefleksikan kondisi mental Anda secara
              mendalam, menemukan ketenangan batin, serta menggali potensi diri dalam perjalanan menuju kesejahteraan
              emosional dan psikologis.
            </p>
          </div>
          <div
            ref={featuresSectionRef}
            className="relative h-max-[100vh] h-full text-white p-8 flex flex-col justify-center items-center px-15"
          >
            {' '}
            <div className="ambient-zone ambient-zone-features"></div>
            <p className="text-5xl plus-jakarta-sans-600 text-center feature-title">3 Fitur Andalan</p>
            <div className="flex flex-col md:flex-row gap-15 mt-10 mb-20">
              <div className="feature-card">
                <img className="border-0 h-[300px] w-[300px]  object-contain" src="/others/JurnalCurhat.png"></img>{' '}
                <Card className="w-full max-w-[300px] bg-blue-400/10 backdrop-blur-[15px] shadow-lg ">
                  <CardContent>
                    <CardTitle className="text-center">Jurnal Curhat</CardTitle>
                    <CardDescription className="text-center">
                      Jurnal catatan yang berisi keluh kesah atau curhatan yang dapat menganalisis emosi dan sentimen
                      dari catatan tersebut.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>

              <div className="feature-card">
                <img className="border-0 h-[300px] w-[300px] object-contain" src="/others/Chat.png"></img>{' '}
                <Card className="w-full max-w-[300px] bg-blue-400/10 backdrop-blur-[15px] shadow-lg">
                  <CardContent>
                    <CardTitle className="text-center">Chat Rena</CardTitle>
                    <CardDescription className="text-center">
                      Asisten virtual AI yang bersahabat memberi tips motivasi, strategi coping, informasi dasar, dan
                      arahan bantuan profesional.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
              <div className="feature-card">
                <img className="border-0 h-[300px] w-[300px] object-contain" src="/others/CekMental.png"></img>{' '}
                <Card className="w-full max-w-[300px] bg-blue-400/10 backdrop-blur-[15px] shadow-lg">
                  <CardContent>
                    <CardTitle className="text-center">Cek Mental</CardTitle>
                    <CardDescription className="text-center">
                      Ketahui kondisi mental anda dengan 30 pertanyaan psikologis. AI memberikan deskripsi, analisis,
                      kesimpulan, dan solusi.{' '}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          <div
            ref={previewSectionRef}
            className="relative h-max-[100vh] h-full py-8 md:px-60 px-10 flex flex-col gap-30 mb-10"
          >
            <div className="ambient-zone ambient-zone-preview"></div>
            <div className="preview-gif">
              <p className="text-2xl plus-jakarta-sans-300 mb-2 ml-8 md:text-left text-center">Preview Jurnal Curhat</p>
              <PlayableGif
                src="/others/JurnalCurhat.gif"
                staticSrc="/others/CurhatPreview.png" // Replace with your static image path
                alt="Preview Jurnal Curhat GIF"
              />
            </div>
            <div className="md:self-end preview-gif">
              <p className="text-2xl plus-jakarta-sans-300 mb-2 mr-8 md:text-right text-center">Preview Chat Rena</p>
              <PlayableGif
                src="/others/Chatbot.gif"
                staticSrc="/others/ChatbotPreview.png" // Replace with your static image path
                alt="Preview Chatbot GIF"
              />
            </div>
            <div className="preview-gif">
              <p className="text-2xl plus-jakarta-sans-300 mb-2 ml-8 md:text-left text-center">Preview Cek Mental</p>
              <PlayableGif
                src="/others/CekMental.gif"
                staticSrc="/others/CekMentalPreview.png" // Replace with your static image path
                alt="Preview Cek Mental GIF"
              />
            </div>
            <div className="md:self-end preview-gif">
              <p className="text-2xl plus-jakarta-sans-300 mb-2 mr-8 md:text-right text-center">Preview Dashboard</p>
              <PlayableGif
                src="/others/Dashboard.gif"
                staticSrc="/others/DashboardPreview.png" // Replace with your static image path
                alt="Preview Dashboard GIF"
              />
            </div>
          </div>
          <div
            ref={renaSectionRef}
            className="h-max-[100vh] h-full py-8 lg:px-60 px-10 flex flex-col lg:flex-row gap-10 items-center"
          >
            <div className="ambient-zone ambient-zone-rena"></div> {/* Zona Khusus Rena */}
            <div className="rena-img md:w-1/2 w-full flex justify-center">
              <img
                src="/rena/RenaOriginal.png"
                className="max-h-[600px] md:max-h-[750px] w-auto object-contain"
                alt="Rena Character"
              ></img>{' '}
              {/* tambahkan alt, sesuaikan ukuran */}
            </div>
            <div className="text-left md:w-1/2 w-full flex flex-col gap-2">
              <h1 className="plus-sans-jakarta-600 text-2xl md:text-3xl text-muted-foreground rena-text-head">
                Memperkenalkan
              </h1>
              <h1 className="plus-sans-jakarta-600 text-7xl md:text-9xl text-white rena-text-head">
                <b> Rena.</b>
              </h1>
              <br />
              <p className="indent-8 rena-text-paragraph text-justify">
                Memperkenalkan Rena, seorang AI Assistant yang punya sifat unik dan siap jadi teman curhat kamu! Rena
                itu lucu, manis, dan imut, tapi jangan kaget ya kalau dia kadang agak tsundere alias malu-malu kucing,
                apalagi kalau dipuji. Dia gampang salah tingkah gitu!
              </p>
              <p className="indent-8 rena-text-paragraph text-justify">
                Tugas utama Rena adalah mendengarkan cerita kamu dengan bahasa Indonesia yang santai, hangat, dan penuh
                semangat. Dia akan selalu berusaha memvalidasi perasaan kamu, memberikan perspektif positif, dan kalau
                kamu butuh, dia juga bisa kasih solusi medis atau profesional. Tapi ingat ya, kalau kamu ngomongin
                sesuatu yang serius atau berbahaya, Rena akan dengan lembut mengingatkanmu untuk cari bantuan
                profesional.
              </p>
            </div>
          </div>
          <div
            ref={dodiSectionRef}
            className="relative h-max-[100vh] h-full py-8 lg:px-60 px-10 flex flex-col lg:flex-row gap-10 items-center "
          >
            {' '}
            <div className="ambient-zone ambient-zone-dodi"></div>
            <div className="text-left md:w-1/2 w-full flex flex-col gap-2">
              <h1 className="plus-sans-jakarta-600 text-2xl md:text-3xl text-muted-foreground dodi-text-head">
                Memperkenalkan
              </h1>
              <h1 className="plus-sans-jakarta-600 text-7xl md:text-9xl text-white dodi-text-head">
                <b> Dodi.</b>
              </h1>
              <br />
              <p className="indent-8 dodi-text-paragraph text-justify mb-2">
                Dodi, seorang mahasiswa yang dikenal teladan dan rajin, harus menghadapi kenyataan pahit ketika musibah
                tak terduga mengharuskannya mencari nafkah. Dalam keputusasaan, ia sempat terjerumus ke dunia judi
                online. Namun, secara menakjubkan, Dodi berhasil menghindari jerat kecanduan yang sering menimpa banyak
                orang.
              </p>
              <p className="indent-8 dodi-text-paragraph text-justify mb-2">
                Ingin tahu bagaimana Dodi bisa keluar dari situasi sulit ini tanpa terjerat kecanduan judi online?
                Temukan jawabannya di Renaissance's Education.
              </p>
              <Link to="/education" className="max-w-[225px] w-full dodi-text-paragraph">
                <Button className="border-2 bg-transparent text-white border-white hover:bg-blue-300/60 hover:border-blue-300 cursor-pointer max-w-[225px] w-full">
                  {' '}
                  <b>Renaissance Education</b>
                </Button>{' '}
              </Link>
            </div>
            <div className="rena-img md:w-1/2 w-full flex justify-center">
              <img
                src="/education/DodiSenyum.png"
                className="max-h-[500px] md:max-h-[700px] w-auto object-contain dodi-img"
                alt="Dodi Character"
              ></img>
            </div>
          </div>

          <div
            ref={articlesSectionRef}
            className="relative h-max-[100vh] h-full text-white py-20 lg:px-60 px-10 flex flex-col items-center my-10"
          >
            {' '}
            <div className="ambient-zone ambient-zone-articles"></div>
            <p className="text-5xl plus-jakarta-sans-600 text-center article-section-title mb-4">
              Renaissance's Articles
            </p>
            <p className="mb-12 text-muted-foreground">Jangan lewatkan artikel menarik dan terbaru dari Renaissance!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {latestArticles.map((article) => (
                <div key={article.slug} className="article-card">
                  <ArticlePost article={article} type="standard" />
                </div>
              ))}
            </div>
          </div>

          <div
            ref={ctaSectionRef}
            className="relative h-[100vh] text-white flex flex-col justify-center items-center text-center px-10 gap-5"
          >
            {' '}
            <div className="ambient-zone ambient-zone-cta"></div>
            <h2 className="text-3xl md:text-5xl plus-jakarta-sans-700 mb-6 cta-element">
              Siapkah anda bergabung bersama kami?
            </h2>
            <div className="cta-element">
              <Link to="/register">
                <button className="animated-button">
                  <svg viewBox="0 0 24 24" className="arr-2" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                  </svg>
                  <span className="text">Bergabung Sekarang</span>
                  <span className="circle"></span>
                  <svg viewBox="0 0 24 24" className="arr-1" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                  </svg>
                </button>
              </Link>
            </div>
          </div>

          <MainFooter />
        </div>
      </div>
    </>
  );
}
