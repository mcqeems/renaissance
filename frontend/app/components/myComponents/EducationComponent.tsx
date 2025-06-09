import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import { SplitText } from 'gsap/SplitText';
import '../../education.css'; // Pastikan path ini benar
import { Spinner } from '../ui/spinner';
import MainNavbar from './MainNavbar';
import { Button } from '../ui/button';
import { Link } from 'react-router';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(Observer, SplitText);
}

// Path untuk musik latar global
const GLOBAL_BACKGROUND_MUSIC_SRC = '/education/BgMusic.mp3'; // Path relatif ke folder public

// Path untuk musik spesifik per section
const sectionAudioFiles = [
  null, // Section 1 TIDAK memiliki musik spesifik tambahan, hanya global
  '/education/1.mp3', // Musik untuk section kedua (relatif ke folder public)
  '/education/2.mp3', // Musik untuk section ketiga
  '/education/3.mp3', // Musik untuk section keempat
  '/education/4.mp3',
  '/education/5.mp3',
  '/education/6.mp3',
  '/education/7.mp3',
  '/education/8.mp3',
];

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
      color: 'white',
      fontSize: '24px',
      zIndex: 9999,
    }}
  >
    <Spinner className="text-[#c2d2ff]" size={'large'} />
  </div>
);

const EducationComponent: React.FC = () => {
  const componentRef = useRef<HTMLDivElement>(null);
  const globalBgMusicRef = useRef<HTMLAudioElement | null>(null);
  const sectionAudioPlayersRef = useRef<(HTMLAudioElement | null)[]>([]);
  // Refs for sections are not strictly needed for querySelector inside gotoSection if using sections[index]
  // but they are already defined, so no harm.
  const sectionTwoRef = useRef<HTMLDivElement>(null);
  const sectionThreeRef = useRef<HTMLDivElement>(null);
  const sectionFourRef = useRef<HTMLDivElement>(null);
  const sectionFiveRef = useRef<HTMLDivElement>(null);
  const sectionSixRef = useRef<HTMLDivElement>(null);
  const sectionSevenRef = useRef<HTMLDivElement>(null);
  const sectionEightRef = useRef<HTMLDivElement>(null);
  const sectionNineRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [assetsLoadedCount, setAssetsLoadedCount] = useState(0);

  const totalAudioAssets = 1 + sectionAudioFiles.filter((src) => src !== null).length;

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    let loadedCount = 0;
    const incrementLoadedCount = () => {
      loadedCount++;
      setAssetsLoadedCount(loadedCount);
      if (loadedCount === totalAudioAssets) {
        console.log('All audio assets loaded.');
        setIsLoading(false);
      }
    };

    const onError = (src: string | null, e: Event) => {
      console.error(`Error loading audio: ${src || GLOBAL_BACKGROUND_MUSIC_SRC}`, e);
      incrementLoadedCount();
    };

    const globalAudio = new Audio(GLOBAL_BACKGROUND_MUSIC_SRC); //
    globalAudio.loop = true; //
    globalAudio.preload = 'auto'; //

    // ===== TAMBAHKAN BARIS INI =====
    globalAudio.volume = 0.6; // Mengatur volume menjadi 60%
    // ===============================

    globalAudio.addEventListener('canplaythrough', () => {
      //
      console.log('Global background music can play through.'); //
      globalBgMusicRef.current = globalAudio; //
      incrementLoadedCount(); //
    }); //
    globalAudio.addEventListener('error', (e) => onError(GLOBAL_BACKGROUND_MUSIC_SRC, e)); //

    sectionAudioPlayersRef.current = sectionAudioFiles.map((src) => {
      if (!src) return null;
      const audio = new Audio(src);
      audio.loop = false;
      audio.preload = 'auto';
      audio.addEventListener('canplaythrough', () => {
        console.log(`Section audio ${src} can play through.`);
        incrementLoadedCount();
      });
      audio.addEventListener('error', (e) => onError(src, e));
      return audio;
    });

    return () => {
      if (globalBgMusicRef.current) {
        globalBgMusicRef.current.pause();
        globalBgMusicRef.current.currentTime = 0;
        globalBgMusicRef.current = null;
      }
      sectionAudioPlayersRef.current.forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      sectionAudioPlayersRef.current = [];
    };
  }, [totalAudioAssets]);

  useEffect(() => {
    if (isLoading || typeof window === 'undefined' || !componentRef.current) {
      return;
    }

    if (globalBgMusicRef.current && globalBgMusicRef.current.paused) {
      globalBgMusicRef.current.play().catch((error) => {
        console.warn('Global background music autoplay was blocked:', error);
        const playOnFirstInteraction = () => {
          if (globalBgMusicRef.current && globalBgMusicRef.current.paused) {
            globalBgMusicRef.current.play().catch((e) => console.error('Failed to play global on interaction:', e));
          }
          window.removeEventListener('click', playOnFirstInteraction, true);
          window.removeEventListener('scroll', playOnFirstInteraction, true);
          window.removeEventListener('touchstart', playOnFirstInteraction, true);
        };
        window.addEventListener('click', playOnFirstInteraction, { once: true, capture: true });
        window.addEventListener('scroll', playOnFirstInteraction, { once: true, capture: true });
        window.addEventListener('touchstart', playOnFirstInteraction, { once: true, capture: true });
      });
    }

    const container = componentRef.current;
    const sections = gsap.utils.toArray<HTMLElement>('.section-item', container);
    const images = gsap.utils.toArray<HTMLElement>('.bg', container); // These are the .bg divs
    const headings = gsap.utils.toArray<HTMLElement>('.section-heading', container);
    const outerWrappers = gsap.utils.toArray<HTMLElement>('.outer', container);
    const innerWrappers = gsap.utils.toArray<HTMLElement>('.inner', container);

    if (sections.length === 0) return;

    const splitHeadings = headings.map(
      (heading) => new SplitText(heading, { type: 'chars,words,lines', linesClass: 'clip-text' })
    );

    let currentIndex = -1;
    let animating = false;
    let observerInstance: Observer | null = null;

    gsap.set(outerWrappers, { yPercent: 100 });
    gsap.set(innerWrappers, { yPercent: -100 });
    gsap.set(sections, { autoAlpha: 0, zIndex: 0 });

    function manageAudioPlayback(newIndex: number, oldIndex: number) {
      const currentSectionAudioPlayer = sectionAudioPlayersRef.current[newIndex];
      const oldSectionAudioPlayer = oldIndex >= 0 ? sectionAudioPlayersRef.current[oldIndex] : null;

      if (oldSectionAudioPlayer && oldIndex !== newIndex) {
        oldSectionAudioPlayer.pause();
        oldSectionAudioPlayer.currentTime = 0;
      }

      if (currentSectionAudioPlayer) {
        currentSectionAudioPlayer.currentTime = 0;
        currentSectionAudioPlayer.play().catch((e) => console.warn(`Failed to play section ${newIndex} audio:`, e));
      }
    }

    function gotoSection(index: number, direction: number) {
      if (index < 0 || index >= sections.length || (index === currentIndex && !animating)) {
        animating = false;
        return;
      }

      animating = true;
      const oldCurrentIndex = currentIndex;
      const fromTop = direction === -1;
      const dFactor = fromTop ? -1 : 1;

      const tl = gsap.timeline({
        defaults: { duration: 1.25, ease: 'power1.inOut' },
        onComplete: () => {
          animating = false;
          currentIndex = index;
          manageAudioPlayback(currentIndex, oldCurrentIndex);
        },
      });

      if (
        oldCurrentIndex >= 0 &&
        oldCurrentIndex < sections.length &&
        sections[oldCurrentIndex] &&
        oldCurrentIndex !== index
      ) {
        gsap.set(sections[oldCurrentIndex], { zIndex: 0 });
        if (images[oldCurrentIndex]) {
          tl.to(images[oldCurrentIndex], { yPercent: -15 * dFactor });
        }
        tl.set(sections[oldCurrentIndex], { autoAlpha: 0 });
      }

      if (sections[index]) {
        gsap.set(sections[index], { autoAlpha: 1, zIndex: 1 });
        const currentSection = sections[index];
        const contentAnimationStartTime = 0.4; // Time offset for content animations within the timeline

        // Animations for Section 2 (index 1)
        if (index === 1) {
          // "Aku Dodi..."
          const textElement = currentSection.querySelector('p');
          const imageElement = currentSection.querySelector('img[src="/education/DodiTenang.png"]');
          if (textElement) {
            tl.fromTo(
              textElement,
              { autoAlpha: 0, xPercent: -30 },
              { autoAlpha: 1, xPercent: 0, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
          if (imageElement) {
            tl.fromTo(
              imageElement,
              { autoAlpha: 0, xPercent: 30 },
              { autoAlpha: 1, xPercent: 0, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
        }
        // Animations for Section 3 (index 2) - "Dahulu semua..."
        else if (index === 2) {
          const textElement = currentSection.querySelector('p');
          const imageElement = currentSection.querySelector('img[src="/education/DodiDuduk.png"]');
          if (textElement) {
            tl.fromTo(
              textElement,
              { autoAlpha: 0, xPercent: 30 },
              { autoAlpha: 1, xPercent: 0, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
          if (imageElement) {
            tl.fromTo(
              imageElement,
              { autoAlpha: 0, xPercent: -30 },
              { autoAlpha: 1, xPercent: 0, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
        }
        // Animations for Section 4 (index 3) - "Aku pun mencoba..."
        else if (index === 3) {
          const textElement = currentSection.querySelector('p');
          const imageElement = currentSection.querySelector('img[src="/education/PesanJudolBadan.png"]');
          if (textElement) {
            tl.fromTo(
              textElement,
              { autoAlpha: 0, yPercent: -30 },
              { autoAlpha: 1, yPercent: 0, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
          if (imageElement) {
            tl.fromTo(
              imageElement,
              { autoAlpha: 0, yPercent: 30, scale: 0.9 },
              { autoAlpha: 1, yPercent: 0, scale: 1, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
        }
        // Animations for Section 5 (index 4) - "Awalnya aku menang..."
        else if (index === 4) {
          const textElement = currentSection.querySelector('p');
          const imgKecanduan = currentSection.querySelector('img[src="/education/DodiKecanduan.png"]');
          const imgMaxwin = currentSection.querySelector('img[src="/education/Maxwin.png"]');
          const imgGacor = currentSection.querySelector('img[src="/education/Gacor.png"]');

          if (textElement) {
            tl.fromTo(
              textElement,
              { autoAlpha: 0, xPercent: 30 },
              { autoAlpha: 1, xPercent: 0, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
          if (imgKecanduan) {
            tl.fromTo(
              imgKecanduan,
              { autoAlpha: 0, scale: 0.8 },
              { autoAlpha: 1, scale: 1, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
          if (imgMaxwin) {
            tl.fromTo(
              imgMaxwin,
              { autoAlpha: 0, scale: 0.5, rotate: -25 },
              { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(1.7)' },
              contentAnimationStartTime + 0.2 // Staggered start
            );
          }
          if (imgGacor) {
            tl.fromTo(
              imgGacor,
              { autoAlpha: 0, scale: 0.5, rotate: 25 },
              { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(1.7)' },
              contentAnimationStartTime + 0.3 // Staggered start
            );
          }
        }
        // Animations for Section 6 (index 5) - "Penyesalan pun datang..."
        else if (index === 5) {
          const textElement = currentSection.querySelector('p');
          const imageElement = currentSection.querySelector('img[src="/education/DodiMarah.png"]');
          if (textElement) {
            tl.fromTo(
              textElement,
              { autoAlpha: 0, xPercent: -30 },
              { autoAlpha: 1, xPercent: 0, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
          if (imageElement) {
            tl.fromTo(
              imageElement,
              { autoAlpha: 0, xPercent: 30, scale: 0.9 },
              { autoAlpha: 1, xPercent: 0, scale: 1, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
        }
        // Animations for Section 7 (index 6) - "Hingga akhirnya..."
        else if (index === 6) {
          const textElement = currentSection.querySelector('p');
          const imageElement = currentSection.querySelector(
            'img[src="/education/DodiDudukDepresiPesanRenaissance.png"]'
          );
          if (textElement) {
            tl.fromTo(
              textElement,
              { autoAlpha: 0, xPercent: 30 },
              { autoAlpha: 1, xPercent: 0, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
          if (imageElement) {
            tl.fromTo(
              imageElement,
              { autoAlpha: 0, xPercent: -30 },
              { autoAlpha: 1, xPercent: 0, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
        }
        // Animations for Section 8 (index 7) - "Sebulan setelah..." (HTML id="scene-eigth")
        else if (index === 7) {
          const textElement = currentSection.querySelector('p');
          const imageElement = currentSection.querySelector('img[src="/education/DodiSenyum1.png"]');
          if (textElement) {
            tl.fromTo(
              textElement,
              { autoAlpha: 0, xPercent: 30 },
              { autoAlpha: 1, xPercent: 0, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
          if (imageElement) {
            tl.fromTo(
              imageElement,
              { autoAlpha: 0, xPercent: -30 },
              { autoAlpha: 1, xPercent: 0, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
        }
        // Animations for Section 9 (index 8) - "Kamu pun juga bisa..."
        else if (index === 8) {
          // Using a more specific selector for the paragraph based on its container div
          const textElement = currentSection.querySelector('.bg div.max-w-\\[700px\\] > p');
          const imageElement = currentSection.querySelector('img[src="/education/DodiSenyumJalan.png"]');
          const links = gsap.utils.toArray(currentSection.querySelectorAll('.bg div.mt-4 a')); // Target Link components

          if (textElement) {
            tl.fromTo(
              textElement,
              { autoAlpha: 0, xPercent: -30 },
              { autoAlpha: 1, xPercent: 0, duration: 1, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
          if (imageElement) {
            tl.fromTo(
              imageElement,
              { autoAlpha: 0, xPercent: 30, scale: 0.8 },
              { autoAlpha: 1, xPercent: 0, scale: 1, duration: 1.3, ease: 'power2.out' },
              contentAnimationStartTime
            );
          }
          if (links.length > 0) {
            tl.fromTo(
              links,
              { autoAlpha: 0, scale: 0.7 },
              { autoAlpha: 1, scale: 1, stagger: 0.2, duration: 0.8, ease: 'power2.out' },
              contentAnimationStartTime + 0.2 // Staggered start after text/image
            );
          }
        }
      }

      if (outerWrappers[index] && innerWrappers[index]) {
        tl.fromTo(
          [outerWrappers[index], innerWrappers[index]],
          { yPercent: (i) => (i ? -100 * dFactor : 100 * dFactor) },
          { yPercent: 0 },
          0 // Timeline position 0
        );
      }
      if (images[index]) {
        // This is the .bg div
        tl.fromTo(images[index], { yPercent: 15 * dFactor }, { yPercent: 0 }, 0); // Timeline position 0
      }
      if (splitHeadings[index] && splitHeadings[index].chars && splitHeadings[index].chars.length > 0) {
        tl.fromTo(
          splitHeadings[index].chars,
          { autoAlpha: 0, yPercent: 150 * dFactor },
          {
            autoAlpha: 1,
            yPercent: 0,
            duration: 1, // Adjusted duration for potentially faster heading animation
            ease: 'power2',
            stagger: { each: 0.02, from: 'random' },
          },
          0.2 // Starts at 0.2s into the timeline
        );
      } else if (headings[index]) {
        // Fallback for non-split headings
        tl.fromTo(
          headings[index],
          { autoAlpha: 0, yPercent: 30 * dFactor },
          { autoAlpha: 1, yPercent: 0, duration: 1, ease: 'power2' },
          0.2 // Starts at 0.2s
        );
      }
    }

    observerInstance = Observer.create({
      target: container,
      type: 'wheel,touch,pointer',
      wheelSpeed: -1,
      onDown: () => !animating && currentIndex > 0 && gotoSection(currentIndex - 1, -1),
      onUp: () => !animating && currentIndex < sections.length - 1 && gotoSection(currentIndex + 1, 1),
      tolerance: 10,
      preventDefault: true,
    });

    if (sections.length > 0) {
      currentIndex = -1; // Ensure first section animation plays correctly
      gotoSection(0, 1); // Initialize first section
    }

    return () => {
      const activeShootingStars = document.querySelectorAll('.shooting-star');
      activeShootingStars.forEach((starNode) => {
        if (document.body.contains(starNode)) document.body.removeChild(starNode);
      });
      const starsContainer = document.getElementById('stars');
      if (starsContainer) starsContainer.innerHTML = '';
      if (observerInstance) observerInstance.kill();
      splitHeadings.forEach((sh) => sh && typeof sh.revert === 'function' && sh.revert());
      gsap.killTweensOf([sections, images, headings, outerWrappers, innerWrappers]);
      // Clear specific properties for all elements that might have been animated by new logic
      sections.forEach((section) => {
        gsap.utils.toArray<HTMLElement>(section.querySelectorAll('p, img, a')).forEach((el) => {
          gsap.set(el, { clearProps: 'autoAlpha,xPercent,yPercent,scale,rotate' });
        });
      });
      gsap.set(outerWrappers, { clearProps: 'yPercent' });
      gsap.set(innerWrappers, { clearProps: 'yPercent' });
      gsap.set(sections, { clearProps: 'autoAlpha,zIndex' });
      gsap.set(images, { clearProps: 'yPercent' }); // .bg divs
      headings.forEach((h) =>
        gsap.set(h.querySelectorAll('.clip-text div, .clip-text, .section-heading'), {
          clearProps: 'autoAlpha,yPercent,opacity,transform',
        })
      );
    };
  }, [isLoading, totalAudioAssets]); // Added totalAudioAssets dependency based on original code

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <MainNavbar />
      <div
        ref={componentRef}
        className="scroll-animation-container"
        style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}
      >
        {/* SECTION 1 */}
        <section
          id="scene-first"
          className="section-item first"
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <div className="outer">
            <div className="inner">
              <div className="bg one flex flex-col">
                <img className="md:h-[400px]" src="/logo/Renaissance.svg"></img>
                <h2 className="section-heading md:text-5xl text-4xl text-center">
                  <b> Renaissance's Education</b>
                  <br />
                  <span className="md:text-xl text-lg text-blue-300">Scroll ke bawah untuk memulai</span>
                </h2>
                <div className="arrowCta scale-70 md:scale-100"></div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 */}
        <section
          ref={sectionTwoRef}
          id="scene-second"
          className="section-item second"
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <div className="outer">
            <div className="inner">
              <div className="bg">
                {' '}
                {/* images[1] refers to this element */}
                <p className="absolute z-50 sm:left-25 top-20 text-xl sm:text-3xl text-shadow-md md:text-left text-center px-2 md:px-0">
                  Aku Dodi, dan aku adalah seorang
                  <br />
                  <span className="md:text-7xl text-6xl text-blue-200">
                    <b>Mahasiswa.</b>
                  </span>
                </p>
                <img
                  className="h-[1000px] md:top-[200px] top-[300px] object-cover relative"
                  src="/education/DodiTenang.png"
                ></img>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 */}
        <section
          ref={sectionThreeRef}
          id="scene-third"
          className="section-item third"
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <div className="outer">
            <div className="inner">
              <div className="bg">
                <p className="absolute z-50 sm:right-20 top-20 text-xl sm:text-3xl text-shadow-md max-w-[600px] w-full md:text-right text-center px-2 md:px-0">
                  Dahulu semua terasa baik-baik saja. Sampai ayahku sakit parah dan membutuhkan biaya operasi yang
                  besar.
                </p>
                <img
                  className="h-[1000px] md:top-[200px] top-[300px] object-cover relative"
                  src="/education/DodiDuduk.png"
                ></img>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 */}
        <section
          ref={sectionFourRef}
          id="scene-fourth"
          className="section-item fourth"
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <div className="outer">
            <div className="inner">
              <div className="bg">
                <p className="absolute z-50 sm:left-25 top-20 text-xl sm:text-3xl  text-shadow-md max-w-[500px] w-full text-center md:text-left px-2 md:px-0">
                  Aku pun mencoba mengambil jalan pintas dengan bermain
                  <br />
                  <span className="md:text-7xl text-6xl text-red-500">
                    <b>Judi Online.</b>
                  </span>
                </p>
                <img
                  className="md:h-[1200px] h-[750px] md:top-[250px] top-[200px] md:left-25 object-cover relative"
                  src="/education/PesanJudolBadan.png"
                ></img>{' '}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 */}
        <section
          ref={sectionFiveRef}
          id="scene-fifth"
          className="section-item fifth"
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <div className="outer">
            <div className="inner">
              <div className="bg">
                <p className="absolute z-50 sm:right-20 right-2 top-20 text-xl sm:text-3xl text-shadow-md max-w-[600px] w-full md:text-right text-center px-2 md:px-0">
                  Awalnya aku menang banyak dan tanpa kusadari aku..
                  <br />
                  <span className="md:text-7xl text-6xl text-[#00FF11]">
                    <b>Kecanduan.</b>
                  </span>
                </p>
                <img // DodiKecanduan
                  className="md:h-[800px] h-[600px] md:top-[150px] top-[200px] md:right-25 object-cover relative"
                  src="/education/DodiKecanduan.png"
                ></img>
                <img // Maxwin
                  className="absolute z-50 md:h-[250px] h-[100px] rotate-30 md:left-215 right-10 top-80"
                  src="/education/Maxwin.png"
                ></img>
                <img // Gacor
                  className="absolute z-50 md:h-[300px] h-[150px] rotate-335 md:right-265 md:left-45 md:top-20 top-60 left-10"
                  src="/education/Gacor.png"
                ></img>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6 */}
        <section
          ref={sectionSixRef}
          id="scene-sixth"
          className="section-item sixth"
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <div className="outer">
            <div className="inner">
              <div className="bg">
                <p className="absolute z-50 sm:left-25 top-20 text-xl sm:text-3xl  text-shadow-md max-w-[500px] w-full md:text-left text-center md:px-0 px-2">
                  Penyesalan pun datang di akhir.. Aku sudah tidak punya apa-apa lagi, Kesehatan mentalku pun kacau..
                </p>
                <img
                  className="md:h-[900px] h-[650px] md:top-[200px] top-[150px] md:left-25 object-cover relative"
                  src="/education/DodiMarah.png"
                ></img>{' '}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 */}
        <section
          ref={sectionSevenRef}
          id="scene-seventh"
          className="section-item seventh"
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <div className="outer">
            <div className="inner">
              <div className="bg">
                <p className="absolute z-50 sm:left-25 top-20 text-xl sm:text-3xl  text-shadow-md max-w-[600px] w-full md:text-left text-center md:px-0 px-2">
                  Hingga akhirnya aku menemukan sebuah situs yang dapat mengobati kesehatan mentalku bernama
                  <br />
                  <span className="md:text-7xl text-6xl text-blue-400">
                    <b>Renaissance.</b>
                  </span>
                </p>
                <img
                  className="md:h-[1000px] h-[850px] md:top-[200px] top-[300px] md:left-30 object-cover object-[70%_50%] md:object-[10] relative"
                  src="/education/DodiDudukDepresiPesanRenaissance.png"
                ></img>{' '}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8 */}
        <section
          ref={sectionEightRef}
          id="scene-eight" /* Note: "eigth" has a typo, original HTML uses this */
          className="section-item eigth"
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <div className="outer">
            <div className="inner">
              <div className="bg">
                <p className="absolute z-50 sm:right-20 top-20 text-xl sm:text-3xl text-shadow-md max-w-[600px] w-full md:text-right text-center px-2 md:px-0">
                  Sebulan setelah memakai Renaissance, Aku pun terlahir kembali menjadi seseorang yang baru dan lebih
                  baik dari sebelumnya.
                </p>
                <img
                  className="h-[1000px] md:top-[200px] top-[300px] md:right-[75px] object-cover relative"
                  src="/education/DodiSenyum1.png"
                ></img>{' '}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9 */}
        <section
          ref={sectionNineRef}
          id="scene-ninth"
          className="section-item ninth"
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <div className="outer">
            <div className="inner">
              <div className="bg">
                <div className="absolute z-50 sm:left-25 top-20 max-w-[700px] w-full">
                  {' '}
                  {/* Container for text and buttons */}
                  <p className=" text-xl sm:text-3xl text-shadow-md text-center md:text-left md:px-0 px-2">
                    Kamu pun juga bisa menjadi seperti aku, Kamu dapat belajar dari artikel ini atau kamu dapat daftar
                    ke Renaissance secara Gratis!
                  </p>
                  <div className="mt-4 flex flex-row gap-5 justify-center md:justify-start">
                    {' '}
                    {/* Container for Link components */}
                    <Link to="/articles" className="max-w-[130px] w-full">
                      <Button className="border-2 bg-transparent text-white border-white hover:bg-blue-300/60 hover:border-blue-300 cursor-pointer max-w-[130px] w-full">
                        {' '}
                        <b>Artikel</b>
                      </Button>{' '}
                    </Link>
                    <Link to="/register" className="max-w-[130px] w-full">
                      <Button className="border-2 bg-transparent text-white border-white hover:bg-blue-300/60 hover:border-blue-300 cursor-pointer max-w-[130px] w-full">
                        {' '}
                        <b>Daftar</b>
                      </Button>{' '}
                    </Link>
                  </div>
                </div>
                <img
                  className="md:h-[465px] h-[400px] md:top-[120px] top-[100px] md:left-25 left-15 object-cover relative"
                  src="/education/DodiSenyumJalan.png"
                ></img>{' '}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default EducationComponent;
