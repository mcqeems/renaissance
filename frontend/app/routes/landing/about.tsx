import React, { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother'; // <-- Import ScrollSmoother
import { useGSAP } from '@gsap/react';
import MainNavbar from '~/components/myComponents/MainNavbar';
import MainFooter from '~/components/myComponents/MainFooter';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Spinner } from '~/components/ui/spinner';
import {
  Mail,
  Github,
  Linkedin,
  BookOpenCheck,
  Sparkles,
  Lock,
  BrainCircuit,
  FileText,
  HeartPulse,
} from 'lucide-react';
import { Link } from 'react-router';

// Registrasi plugin GSAP
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// Data (developer, solutions, values) tetap sama
const developer = {
  name: "Mustaqim Nawahhudi Ma'arif",
  role: 'Full-Stack Developer',
  bio: 'Mustaqim adalah seorang Full Stack Developer yang berasal dari Karawang, Indonesia. Saat ini, ia tengah menempuh pendidikan sarjana di Universitas Darussalam Gontor, mengasah kemampuannya dalam pengembangan perangkat lunak secara menyeluruh. Dengan latar belakang pendidikan dan keahlian di bidang full-stack development, Mustaqim siap untuk berkontribusi dalam inovasi teknologi.',
  image: '/others/Qeem.jpg',
};
const solutions = [
  {
    title: 'Artikel Edukatif',
    description:
      'Akses kumpulan artikel dan modul pembelajaran singkat yang mudah dipahami tentang risiko psikologis serta finansial dari judi online dan tips pengelolaan diri. ',
    icon: <FileText className="w-8 h-8 text-blue-300" />,
  },
  {
    title: 'Jurnal Curhat AI',
    description:
      'Tulis catatan harian untuk merefleksikan perasaan dan pemicu. AI akan menganalisis sentimen tulisan untuk membantu refleksi diri yang lebih dalam. ',
    icon: <Sparkles className="w-8 h-8 text-blue-300" />,
  },
  {
    title: 'Cek Kondisi Mental',
    description:
      'Jawab serangkaian pertanyaan psikologis terstruktur untuk menilai keadaan mental, lalu dapatkan analisis, kesimpulan, dan solusi perbaikan dari AI. ',
    icon: <HeartPulse className="w-8 h-8 text-blue-300" />,
  },
  {
    title: 'Chatbot Rena AI',
    description:
      'Berinteraksi dengan asisten virtual yang memberikan tips motivasi, strategi coping umum, dan informasi dasar untuk membangun ketahanan mental. ',
    icon: <BrainCircuit className="w-8 h-8 text-blue-300" />,
  },
];
const values = [
  {
    title: 'Edukasi Preventif',
    description: 'Memberikan pengetahuan yang mudah diakses tentang risiko psikologis dan finansial dari judi online.',
    icon: <BookOpenCheck className="w-8 h-8 text-blue-300" />,
  },
  {
    title: 'Dukungan & Refleksi Diri',
    description:
      'Menyediakan alat seperti Jurnal Curhat dan AI Chat untuk membantu pengguna memahami pemicu dan mengelola diri.',
    icon: <Sparkles className="w-8 h-8 text-blue-300" />,
  },
  {
    title: 'Aksesibilitas & Keamanan',
    description:
      'Membangun platform yang mudah dijangkau siapa saja, dengan prioritas utama pada privasi dan keamanan data pengguna.',
    icon: <Lock className="w-8 h-8 text-blue-300" />,
  },
  {
    title: 'Pemberdayaan Digital',
    description:
      'Menggunakan kekuatan AI secara bertanggung jawab untuk memberdayakan individu dalam membangun ketahanan mental di era digital.',
    icon: <BrainCircuit className="w-8 h-8 text-blue-300" />,
  },
];
// --- Akhir dari Data ---

function AboutPage() {
  const mainRef = useRef(null);
  const wrapperRef = useRef(null); // <-- Ref untuk wrapper ScrollSmoother
  const contentRef = useRef(null); // <-- Ref untuk content ScrollSmoother
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'Renaissance - Education';
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useGSAP(
    () => {
      if (isLoading) return;

      // --- INISIALISASI SCROLLSMOOTHER ---
      const smoother = ScrollSmoother.create({
        wrapper: wrapperRef.current,
        content: contentRef.current,
        smooth: 1.5, // Tingkat kehalusan scroll
        effects: true, // Mengaktifkan efek parallax (jika ada data-speed/data-lag)
      });

      // Animasi section tetap berjalan seperti sebelumnya
      const sections = gsap.utils.toArray<HTMLElement>('.animate-section');
      sections.forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 100,
          ease: 'elastic.out(1, 0.75)',
          duration: 1.6,
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      });

      // --- FUNGSI CLEANUP ---
      return () => {
        // Penting: Matikan smoother saat komponen unmount
        if (smoother) smoother.kill();
      };
    },
    { scope: mainRef, dependencies: [isLoading] }
  );

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-[#12151e]">
        <Spinner className="text-[#c2d2ff]" size={'large'} />
      </div>
    );
  }

  return (
    // --- STRUKTUR BARU UNTUK SCROLLSMOOTHER ---
    <div ref={mainRef} className="bg-[#12151e]">
      <MainNavbar />
      <div id="smooth-wrapper" ref={wrapperRef}>
        <div id="smooth-content" ref={contentRef}>
          <main className="text-white plus-jakarta-sans-500 opacity-100 transition-opacity duration-300">
            <div className="mx-auto px-6 sm:px-10 lg:px-[240px] py-24 md:py-28">
              <header className="grid md:grid-cols-2 gap-30 items-center mb-24 md:mb-26 animate-section">
                <div className="about-section">
                  <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-none mb-5">
                    Tentang
                    <br />
                    <span className="text-6xl sm:text-7xl md:text-8xl">Renaissance.</span>
                  </h1>
                  <p className="text-xl text-gray-400 mb-6">Membangun Ketahanan Mental di Era Digital.</p>
                  <p className="text-gray-300 leading-relaxed">
                    Renaissance adalah platform web berbasis AI yang dirancang untuk edukasi dan dukungan diri untuk
                    menjaga dan merawat kondisi mental dan mencegah dampak negatif judi online.
                  </p>
                </div>
                <div className="philosophy-section">
                  <div className="w-full h-48 bg-white/5 rounded-xl mb-6 flex items-center justify-center bg-[url(/others/HeroBG.png)] bg-cover bg-center">
                    <img className="h-[180px]" src="/logo/Renaissance.svg" alt="Logo Renaissance" />
                  </div>
                  <h2 className="text-3xl font-bold mb-3">Filosofi Renaissance</h2>
                  <p className="text-gray-300 leading-relaxed">
                    Renaissance berasal dari bahasa Prancis yang berarti "kelahiran kembali". Filosofi ini menjadi inti
                    platform kami, dengan harapan setiap pengguna dapat merasakan momen kebangkitan untuk memulai
                    kehidupan yang lebih baik.
                  </p>
                </div>
              </header>

              <section className="grid md:grid-cols-2 gap-16 items-start mb-24 md:mb-32 animate-section">
                <div className="solution-right space-y-10">
                  {solutions.map((solution) => (
                    <div key={solution.title} className="flex items-start gap-6">
                      <div className="flex-shrink-0 mt-1">{solution.icon}</div>
                      <div>
                        <h3 className="text-2xl font-bold tracking-wide mb-2">{solution.title}</h3>
                        <p className="text-gray-400 leading-relaxed">{solution.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="solution-left">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">Solusi Inovatif Kami</h2>
                  <p className="text-gray-400 leading-relaxed mb-8">
                    Kami menggabungkan edukasi dan teknologi AI untuk menyediakan platform yang tidak hanya informatif
                    tetapi juga interaktif, memberikan dukungan proaktif bagi pengguna.
                  </p>
                  <div className="w-full h-80 md:h-100 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 bg-[url(/others/Inovative.png)] bg-cover bg-center"></div>
                </div>
              </section>

              <section className="grid md:grid-cols-2 gap-16 items-start mb-24 md:mb-32 animate-section">
                <div className="services-left">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">Nilai-Nilai Inti Kami</h2>
                  <p className="text-gray-400 leading-relaxed mb-8">
                    Setiap fitur yang kami kembangkan berlandaskan pada prinsip-prinsip berikut, untuk memastikan kami
                    memberikan solusi yang efektif dan bertanggung jawab.
                  </p>
                  <div className="w-full h-80 md:h-100 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 bg-[url(/others/Value.png)] bg-cover bg-position-[50%_30%]"></div>
                </div>
                <div className="services-right space-y-10">
                  {values.map((value) => (
                    <div key={value.title} className="flex items-start gap-6">
                      <div className="flex-shrink-0 mt-1">{value.icon}</div>
                      <div>
                        <h3 className="text-2xl font-bold tracking-wide mb-2">{value.title}</h3>
                        <p className="text-gray-400 leading-relaxed">{value.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="w-full mx-auto mb-24 md:mb-32 animate-section">
                <div className="grid md:grid-cols-2 items-center bg-white/5 rounded-3xl overflow-hidden">
                  <div className="developer-text p-8 md:p-12">
                    <h2 className="text-4xl font-bold mb-2">Developer Kami</h2>
                    <h3 className="text-2xl font-bold text-blue-300 mb-4">{developer.name}</h3>
                    <Badge>{developer.role}</Badge>
                    <p className="text-gray-400 leading-relaxed mt-4">{developer.bio}</p>
                  </div>
                  <div className="developer-image w-full h-full">
                    <div
                      className="w-full h-[300px] md:h-full md:min-h-[450px] bg-cover bg-center"
                      style={{ backgroundImage: `url(${developer.image})` }}
                    ></div>
                  </div>
                </div>
              </section>

              <section className="text-center py-16 animate-section">
                <h2 className="text-4xl font-bold mb-4">Hubungi Kami</h2>
                <p className="text-gray-400 max-w-xl mx-auto mb-8">
                  Punya pertanyaan, feedback, atau ingin berkolaborasi? Kami senang mendengar dari Anda!
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  <Link to={'/feedback'}>
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 hover:text-white cursor-pointer w-full sm:w-auto"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      mcqeemsofficial@gmail.com
                    </Button>
                  </Link>
                  <Link to={'https://github.com/mcqeems'}>
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 hover:text-white cursor-pointer w-full sm:w-auto"
                    >
                      <Github className="w-5 h-5 mr-2" />
                      GitHub
                    </Button>
                  </Link>
                  <Link to={'https://www.linkedin.com/in/mcqeems/'}>
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 hover:text-white cursor-pointer w-full sm:w-auto"
                    >
                      <Linkedin className="w-5 h-5 mr-2" />
                      LinkedIn
                    </Button>
                  </Link>
                </div>
              </section>
            </div>
          </main>
          <MainFooter />
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
