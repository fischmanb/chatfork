import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, X, ArrowUp, ArrowDown, Check } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onGetStarted: () => void;
}

function ForkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="12" r="3" />
      <path d="M6 9v3a3 3 0 0 0 3 3h3" />
      <path d="M15 12h3" />
    </svg>
  );
}

function SwitchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <path d="M8 3L4 7l4 4" />
      <path d="M4 7h16" />
      <path d="M16 21l4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  );
}

function MergeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="12" r="3" />
      <path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9" />
    </svg>
  );
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const mainRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const sectionTriggers = useRef<ScrollTrigger[]>([]);

  const sections = ['hero', 'features', 'split', 'merge', 'keyboard', 'pricing', 'cta'];
  const totalSections = sections.length;

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Kill any existing triggers
    sectionTriggers.current.forEach(st => st.kill());
    sectionTriggers.current = [];

    // MOBILE: Use CSS animations with IntersectionObserver (works reliably on iOS)
    if (isMobile) {
      const style = document.createElement('style');
      style.textContent = `
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), 
                      transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-on-scroll.animate-left {
          transform: translateX(-60px);
        }
        .animate-on-scroll.animate-right {
          transform: translateX(60px);
        }
        .animate-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0) translateX(0);
        }
      `;
      document.head.appendChild(style);

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

      document.querySelectorAll('.animate-item').forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
      });
      document.querySelectorAll('.split-left, .merge-left').forEach(el => {
        el.classList.add('animate-on-scroll', 'animate-left');
        observer.observe(el);
      });
      document.querySelectorAll('.split-right, .merge-right').forEach(el => {
        el.classList.add('animate-on-scroll', 'animate-right');
        observer.observe(el);
      });

      return () => {
        observer.disconnect();
        style.remove();
      };
    }

    // DESKTOP: Use GSAP ScrollTrigger with pinning
    const ctx = gsap.context(() => {
      // DESKTOP: Pinned sections with scrub animations
        const createSectionAnimation = (
          sectionClass: string,
          enterAnimation: gsap.TweenVars,
          exitAnimation: gsap.TweenVars,
          isFirst = false
        ) => {
          const section = document.querySelector(sectionClass);
          if (!section) return;

          // Set initial state - hero starts visible, others hidden
          if (isFirst) {
            gsap.set(section.querySelectorAll('.animate-item'), { opacity: 1, x: 0, y: 0, scale: 1 });
          } else {
            gsap.set(section.querySelectorAll('.animate-item'), { ...enterAnimation, opacity: 0 });
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: '+=130%',
              pin: true,
              scrub: 0.3,
              onUpdate: (self) => {
                const progress = self.progress;
                const sectionIndex = sections.findIndex(s => sectionClass.includes(s));
                
                if (progress > 0.1 && progress < 0.9) {
                  setCurrentSection(sectionIndex);
                }
              }
            }
          });

          // ENTRANCE: 0% to 30%
          tl.fromTo(
            section.querySelectorAll('.animate-item'),
            { ...enterAnimation, opacity: 0 },
            { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' },
            0
          );

          // EXIT: 70% to 100%
          tl.to(
            section.querySelectorAll('.animate-item'),
            { ...exitAnimation, opacity: 0, duration: 0.3, stagger: 0.03, ease: 'power2.in' },
            0.7
          );

          if (tl.scrollTrigger) {
            sectionTriggers.current.push(tl.scrollTrigger);
          }
        };

        // Hero (first section - starts visible)
        createSectionAnimation('.section-hero',
          { y: 80, scale: 0.95 },
          { y: -100, scale: 1.05 },
          true
        );

        // Features
        createSectionAnimation('.section-features',
          { y: 100 },
          { y: -120 }
        );

        // Split
        const splitSection = document.querySelector('.section-split');
        if (splitSection) {
          gsap.set(splitSection.querySelectorAll('.split-left'), { x: -150, opacity: 0 });
          gsap.set(splitSection.querySelectorAll('.split-right'), { x: 150, opacity: 0 });

          const splitTl = gsap.timeline({
            scrollTrigger: {
              trigger: splitSection,
              start: 'top top',
              end: '+=130%',
              pin: true,
              scrub: 0.3,
              onUpdate: (self) => {
                if (self.progress > 0.1 && self.progress < 0.9) setCurrentSection(2);
              }
            }
          });

          splitTl.to(splitSection.querySelectorAll('.split-left'), 
            { x: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }, 0);
          splitTl.to(splitSection.querySelectorAll('.split-right'), 
            { x: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }, 0.05);

          splitTl.to(splitSection.querySelectorAll('.split-left'), 
            { x: -100, opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.7);
          splitTl.to(splitSection.querySelectorAll('.split-right'), 
            { x: 100, opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.7);

          if (splitTl.scrollTrigger) sectionTriggers.current.push(splitTl.scrollTrigger);
        }

        // Merge
        const mergeSection = document.querySelector('.section-merge');
        if (mergeSection) {
          gsap.set(mergeSection.querySelectorAll('.merge-left'), { x: -150, opacity: 0 });
          gsap.set(mergeSection.querySelectorAll('.merge-right'), { x: 150, opacity: 0 });

          const mergeTl = gsap.timeline({
            scrollTrigger: {
              trigger: mergeSection,
              start: 'top top',
              end: '+=130%',
              pin: true,
              scrub: 0.3,
              onUpdate: (self) => {
                if (self.progress > 0.1 && self.progress < 0.9) setCurrentSection(3);
              }
            }
          });

          mergeTl.to(mergeSection.querySelectorAll('.merge-left'), 
            { x: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }, 0);
          mergeTl.to(mergeSection.querySelectorAll('.merge-right'), 
            { x: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }, 0.05);

          mergeTl.to(mergeSection.querySelectorAll('.merge-left'), 
            { x: -100, opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.7);
          mergeTl.to(mergeSection.querySelectorAll('.merge-right'), 
            { x: 100, opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.7);

          if (mergeTl.scrollTrigger) sectionTriggers.current.push(mergeTl.scrollTrigger);
        }

        // Keyboard
        createSectionAnimation('.section-keyboard',
          { y: 80, scale: 0.9 },
          { y: -100, scale: 1.1 }
        );

        // Pricing
        createSectionAnimation('.section-pricing',
          { y: 100 },
          { y: -100 }
        );

        // CTA
        const ctaSection = document.querySelector('.section-cta');
        if (ctaSection) {
          gsap.set(ctaSection.querySelectorAll('.animate-item'), { y: 60, opacity: 0 });

          const ctaTl = gsap.timeline({
            scrollTrigger: {
              trigger: ctaSection,
              start: 'top top',
              end: '+=100%',
              pin: true,
              scrub: 0.3,
              onUpdate: (self) => {
                if (self.progress > 0.1) setCurrentSection(6);
              }
            }
          });

          ctaTl.to(ctaSection.querySelectorAll('.animate-item'), 
            { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' }, 0);

          if (ctaTl.scrollTrigger) sectionTriggers.current.push(ctaTl.scrollTrigger);
        }

        // GLOBAL SNAP - Desktop only
        ScrollTrigger.create({
          snap: {
            snapTo: (progress) => {
              const sectionProgress = 1 / totalSections;
              const rawSection = progress / sectionProgress;
              const section = Math.round(rawSection);
              const clampedSection = Math.max(0, Math.min(section, totalSections - 1));
              return clampedSection * sectionProgress;
            },
            duration: { min: 0.2, max: 0.4 },
            delay: 0,
            ease: 'power2.inOut'
          }
        });
      }, mainRef);

      return () => {
        sectionTriggers.current.forEach(st => st.kill());
        ctx.revert();
      };
    }, [isMobile]);

  const scrollToSection = (index: number) => {
    if (index < 0 || index >= totalSections) return;
    const sectionEl = document.querySelector(`.section-${sections[index]}`);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={mainRef} className="relative bg-black">
      {/* Fixed Navigation - Mobile optimized */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-black/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ForkIcon className="w-5 h-5 md:w-6 md:h-6 text-[#a3e635]" />
          <span className="text-lg md:text-xl font-semibold text-white">Chatfork</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection(5)} className="text-sm text-white/60 hover:text-white transition-colors">Pricing</button>
          <button onClick={onGetStarted} className="text-sm text-white/60 hover:text-white transition-colors">Sign in</button>
        </div>
        <button 
          onClick={onGetStarted}
          className="px-3 py-1.5 md:px-5 md:py-2 text-xs md:text-sm font-medium text-[#a3e635] border border-[#a3e635]/50 rounded-lg hover:bg-[#a3e635]/10 transition-colors"
        >
          Get started
        </button>
      </nav>

      {/* Section Indicators - Hidden on mobile */}
      <div className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-3">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            className={`w-2 rounded-full transition-all duration-300 ${
              currentSection === index 
                ? 'bg-[#a3e635] h-6' 
                : 'bg-white/20 h-2 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* HERO SECTION */}
      <section className="section-hero relative min-h-[100dvh] min-h-screen md:h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-0">
        <div className="animate-item absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&q=80" 
            alt="Developer workspace"
            className="w-full h-full object-cover opacity-20 md:opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 w-full py-8 md:py-0">
          <p className="animate-item text-[10px] md:text-xs tracking-[0.2em] text-white/40 uppercase mb-4 md:mb-8">
            Branched Chat for Product Teams
          </p>

          <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
            <div>
              <h1 className="animate-item text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light leading-[1.1] mb-4 md:mb-8">
                <span className="block text-white">Fork the thread.</span>
                <span className="block text-white/60">Keep context.</span>
              </h1>
              
              <p className="animate-item text-sm md:text-lg text-white/50 max-w-md mb-6 md:mb-10 leading-relaxed">
                Chatfork turns any message into a branch—explore ideas without losing the main line.
              </p>

              <div className="animate-item">
                <button 
                  onClick={onGetStarted}
                  className="group px-4 py-2 md:px-6 md:py-3 bg-[#a3e635] text-black text-sm md:text-base font-medium rounded-lg hover:bg-[#b9f564] transition-all flex items-center gap-2"
                >
                  Get started free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="animate-item relative mt-4 md:mt-0">
              <div className="bg-[#141414]/90 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-2xl max-w-sm md:max-w-none mx-auto">
                <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <ForkIcon className="w-3 h-3 md:w-4 md:h-4 text-[#a3e635]" />
                    <span className="text-xs md:text-sm text-white/60 font-mono">chat-fork-demo</span>
                  </div>
                  <div className="flex gap-1 md:gap-1.5">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white/20" />
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white/20" />
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white/20" />
                  </div>
                </div>

                <div className="p-3 md:p-4 space-y-2 md:space-y-4">
                  <div className="bg-white/5 rounded-lg p-2 md:p-4">
                    <p className="text-xs md:text-sm text-white/80">
                      Hey! I'm working on a new feature idea for our product. Want to brainstorm?
                    </p>
                  </div>
                  
                  <div className="bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-lg p-2 md:p-4">
                    <p className="text-xs md:text-sm text-white/80">
                      Absolutely! I'd love to help. What kind of feature are you thinking about?
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-2 md:p-4">
                    <p className="text-xs md:text-sm text-white/80">
                      I'm thinking of adding a collaborative workspace feature...
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button className="flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-3 md:py-1.5 bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-md text-[10px] md:text-xs text-[#a3e635]">
                      <ForkIcon className="w-2.5 h-2.5 md:w-3 md:h-3" />
                      forked → feature-idea
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="section-features relative min-h-[100dvh] min-h-screen md:h-screen flex items-center justify-center bg-black py-12 md:py-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 w-full">
          <h2 className="animate-item text-2xl sm:text-3xl md:text-5xl font-light text-center mb-8 md:mb-20 text-white">
            Three moves. Total control.
          </h2>

          <div className="grid md:grid-cols-3 gap-4 md:gap-8">
            {[
              { icon: ForkIcon, title: 'Fork', desc: 'Start a new branch from any message. Explore without polluting the main thread.' },
              { icon: SwitchIcon, title: 'Switch', desc: 'Jump between branches instantly. Context stays intact—no scrolling, no confusion.' },
              { icon: MergeIcon, title: 'Merge', desc: 'Bring the best ideas back. Compare before you commit.' },
            ].map((feature, i) => (
              <div key={i} className="animate-item group bg-[#141414] border border-white/5 rounded-xl md:rounded-2xl p-5 md:p-8 hover:border-white/10 transition-all hover:scale-[1.02]">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#a3e635]/10 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-6">
                  <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-[#a3e635]" />
                </div>
                <h3 className="text-xl md:text-2xl font-medium mb-2 md:mb-4 text-white">{feature.title}</h3>
                <p className="text-sm md:text-base text-white/50 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPLIT SECTION */}
      <section className="section-split relative min-h-[100dvh] min-h-screen md:h-screen flex items-center justify-center bg-black py-12 md:py-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 w-full">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="split-left order-2 md:order-1">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-light mb-4 md:mb-6">
                <span className="block text-white">Split the</span>
                <span className="block text-white/60">stream.</span>
              </h2>
              <p className="text-sm md:text-lg text-white/50 mb-6 md:mb-8 leading-relaxed">
                Every tangent becomes a branch. Name it. Own it. Come back anytime.
              </p>
            </div>

            <div className="split-right bg-[#141414] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 order-1 md:order-2">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <span className="text-xs md:text-sm text-white/40">Branch Map</span>
                <div className="flex gap-1 md:gap-1.5">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#a3e635]" />
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white/20" />
                </div>
              </div>
              
              <svg viewBox="0 0 300 250" className="w-full h-40 md:h-auto">
                <line x1="150" y1="20" x2="150" y2="230" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                <circle cx="150" cy="30" r="6" fill="#a3e635" stroke="#0a0a0a" strokeWidth="2" />
                <circle cx="150" cy="80" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <circle cx="150" cy="130" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <circle cx="150" cy="180" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <circle cx="150" cy="230" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                
                <path d="M 150 80 Q 100 80 80 120 Q 60 160 60 200" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                <circle cx="60" cy="200" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <text x="30" y="205" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace">copy-tweaks</text>
                
                <path d="M 150 130 Q 200 130 220 160 Q 240 190 240 220" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                <circle cx="240" cy="220" r="5" fill="none" stroke="#a3e635" strokeWidth="2" />
                <text x="200" y="235" fill="#a3e635" fontSize="10" fontFamily="monospace">feature-idea</text>
                
                <path d="M 240 190 Q 270 190 280 210" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                <circle cx="280" cy="220" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <text x="260" y="240" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace">experiment</text>
                
                <text x="160" y="25" fill="#a3e635" fontSize="10" fontFamily="monospace">main</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* MERGE SECTION */}
      <section className="section-merge relative min-h-[100dvh] min-h-screen md:h-screen flex items-center justify-center bg-black py-12 md:py-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 w-full">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="merge-left bg-[#141414] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                  <span className="text-white/40">Compare</span>
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-white/20" />
                  <span className="text-[#a3e635] font-mono">main</span>
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-white/20 rotate-180" />
                  <span className="text-white/60 font-mono">feature-idea</span>
                </div>
                <button className="flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-3 md:py-1.5 bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-md text-[10px] md:text-xs text-[#a3e635]">
                  <Check className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  Merge
                </button>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="p-2 md:p-3 bg-white/5 rounded-lg">
                  <span className="text-[10px] md:text-xs text-white/40 font-mono">main</span>
                  <p className="text-xs md:text-sm text-white/60 mt-1">Let's finalize the Q4 roadmap.</p>
                </div>
                
                <div className="p-2 md:p-3 bg-[#a3e635]/5 border border-[#a3e635]/20 rounded-lg">
                  <span className="text-[10px] md:text-xs text-[#a3e635]/60 font-mono">feature-idea</span>
                  <p className="text-xs md:text-sm text-[#a3e635] mt-1">+ Add collaborative workspaces</p>
                </div>
                
                <div className="p-2 md:p-3 bg-[#a3e635]/5 border border-[#a3e635]/20 rounded-lg">
                  <span className="text-[10px] md:text-xs text-[#a3e635]/60 font-mono">feature-idea</span>
                  <p className="text-xs md:text-sm text-[#a3e635] mt-1">+ Real-time cursors</p>
                </div>
                
                <div className="p-2 md:p-3 bg-white/5 rounded-lg">
                  <span className="text-[10px] md:text-xs text-white/40 font-mono">main</span>
                  <p className="text-xs md:text-sm text-white/60 mt-1">Timeline: 6 weeks</p>
                </div>
              </div>

              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-white/40">Preview</span>
                  <span className="text-[#a3e635]">4 changes</span>
                </div>
              </div>
            </div>

            <div className="merge-right">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-light mb-4 md:mb-6">
                <span className="block text-white">Bring it</span>
                <span className="block text-white/60">back.</span>
              </h2>
              <p className="text-sm md:text-lg text-white/50 mb-6 md:mb-8 leading-relaxed">
                Merge the best parts. Preview changes, resolve conflicts, and keep the history clean.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KEYBOARD SECTION */}
      <section className="section-keyboard relative min-h-[100dvh] min-h-screen md:h-screen flex items-center justify-center bg-black py-12 md:py-0">
        <div className="max-w-4xl mx-auto px-4 md:px-6 w-full text-center">
          <h2 className="animate-item text-2xl sm:text-3xl md:text-5xl font-light mb-4 md:mb-6 text-white">
            Keyboard-first. No friction.
          </h2>
          <p className="animate-item text-sm md:text-lg text-white/50 mb-8 md:mb-16">
            Branch, switch, and merge without touching the mouse.
          </p>

          <div className="grid md:grid-cols-3 gap-4 md:gap-8">
            {[
              { keys: ['⌘', 'Shift', 'F'], icon: ForkIcon, label: 'Fork from here' },
              { keys: ['⌘', 'Shift', '↑'], icon: ArrowUp, label: 'Previous branch' },
              { keys: ['⌘', 'Shift', '↓'], icon: ArrowDown, label: 'Next branch' },
            ].map((shortcut, i) => (
              <div key={i} className="animate-item bg-[#141414] border border-white/5 rounded-xl md:rounded-2xl p-5 md:p-8 hover:border-white/10 transition-all">
                <div className="flex justify-center gap-1.5 md:gap-2 mb-4 md:mb-6">
                  {shortcut.keys.map((key, j) => (
                    <kbd key={j} className="px-2 py-1 md:px-3 md:py-2 bg-white/5 rounded-md md:rounded-lg text-xs md:text-sm font-mono text-white/60 border border-white/10">
                      {key}
                    </kbd>
                  ))}
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#a3e635]/10 rounded-lg flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <shortcut.icon className="w-4 h-4 md:w-5 md:h-5 text-[#a3e635]" />
                </div>
                <p className="text-sm md:text-base text-white/60">{shortcut.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="section-pricing relative min-h-[100dvh] min-h-screen md:h-screen flex items-center justify-center bg-black py-12 md:py-0">
        <div className="max-w-5xl mx-auto px-4 md:px-6 w-full">
          <h2 className="animate-item text-2xl sm:text-3xl md:text-5xl font-light text-center mb-4 md:mb-6 text-white">
            Simple plans.
          </h2>
          <p className="animate-item text-sm md:text-lg text-white/50 text-center mb-10 md:mb-16 max-w-xl mx-auto">
            Start free. Upgrade when you need more branches and teammates.
          </p>

          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            <div className="animate-item bg-[#141414] border border-white/5 rounded-xl md:rounded-2xl p-5 md:p-8">
              <p className="text-[10px] md:text-xs text-white/40 uppercase tracking-wider mb-3 md:mb-4">Free</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl md:text-5xl font-light text-white">$0</span>
              </div>
              <p className="text-sm md:text-base text-white/50 mb-6 md:mb-8">Perfect for personal use</p>

              <ul className="space-y-2 md:space-y-4 mb-6 md:mb-8">
                {['3 branches', '7-day history', 'Fork & switch', 'Basic merge'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 md:gap-3">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-[#a3e635]" />
                    <span className="text-sm md:text-base text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <button onClick={onGetStarted} className="w-full py-2.5 md:py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm md:text-base">
                Start free
              </button>
            </div>

            <div className="animate-item bg-[#141414] border border-[#a3e635]/30 rounded-xl md:rounded-2xl p-5 md:p-8 relative">
              <div className="absolute top-0 right-6 md:right-8 -translate-y-1/2">
                <span className="px-2 py-0.5 md:px-3 md:py-1 bg-[#a3e635]/20 text-[#a3e635] text-[10px] md:text-xs rounded-full">Popular</span>
              </div>
              
              <p className="text-[10px] md:text-xs text-white/40 uppercase tracking-wider mb-3 md:mb-4">Pro</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl md:text-5xl font-light text-white">$12</span>
                <span className="text-sm md:text-base text-white/40">/user/mo</span>
              </div>
              <p className="text-sm md:text-base text-white/50 mb-6 md:mb-8">For product teams</p>

              <ul className="space-y-2 md:space-y-4 mb-6 md:mb-8">
                {['Unlimited branches', 'Unlimited history', 'Merge & compare', 'SSO', 'Priority support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 md:gap-3">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-[#a3e635]" />
                    <span className="text-sm md:text-base text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <button onClick={onGetStarted} className="w-full py-2.5 md:py-3 bg-[#a3e635] hover:bg-[#b9f564] text-black font-medium rounded-lg transition-colors text-sm md:text-base">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="section-cta relative min-h-[100dvh] min-h-screen md:h-screen flex items-center justify-center overflow-hidden py-12 md:py-0">
        <div className="animate-item absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1920&q=80" 
            alt="Office"
            className="w-full h-full object-cover opacity-15 md:opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 w-full text-center">
          <h2 className="animate-item text-2xl sm:text-3xl md:text-5xl font-light mb-4 md:mb-6 text-white">
            Start for free today.
          </h2>
          <p className="animate-item text-sm md:text-lg text-white/50 mb-6 md:mb-10">
            No credit card. No setup. Just fork your first thread.
          </p>

          <div className="animate-item flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Email address"
              className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm md:text-base placeholder-white/30 focus:outline-none focus:border-[#a3e635]/50"
            />
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-4 py-2.5 md:px-6 md:py-3 bg-[#a3e635] hover:bg-[#b9f564] text-black text-sm md:text-base font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="animate-item mt-4 md:mt-6 text-xs md:text-sm text-white/30">
            By signing up, you agree to our Terms & Privacy.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 md:py-8 px-4 md:px-6 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
          <div className="flex items-center gap-2">
            <ForkIcon className="w-4 h-4 md:w-5 md:h-5 text-white/40" />
            <span className="text-sm md:text-base text-white/40">Chatfork</span>
          </div>
          <p className="text-xs md:text-sm text-white/30">
            Powered by Kimi AI • Built with Cloudflare Workers
          </p>
        </div>
      </footer>
    </div>
  );
}

// AuthModal component
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSignup: (email: string, password: string, name?: string) => Promise<boolean>;
  error: string | null;
  isLoading: boolean;
}

export function AuthModal({ isOpen, onClose, onLogin, onSignup, error, isLoading }: AuthModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalError(null);
      setEmail('');
      setPassword('');
      setName('');
    }
  }, [isOpen, isLoginMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const result = isLoginMode
      ? await onLogin(email, password)
      : await onSignup(email, password, name || undefined);

    if (!result) {
      setLocalError(error || 'Authentication failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden mx-4">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 pb-0">
          <div className="flex items-center gap-3 mb-6">
            <ForkIcon className="w-6 h-6 text-[#a3e635]" />
            <span className="text-xl font-semibold text-white">Chatfork</span>
          </div>
          <h2 className="text-2xl font-light text-white mb-2">
            {isLoginMode ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-white/50 text-sm md:text-base">
            {isLoginMode ? 'Sign in to continue chatting' : 'Sign up to start forking conversations'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
          {(localError || error) && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {localError || error}
            </div>
          )}

          {!isLoginMode && (
            <div>
              <label className="block text-sm text-white/60 mb-2">Name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#a3e635]/50"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-white/60 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#a3e635]/50"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#a3e635]/50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#a3e635] hover:bg-[#b9f564] text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                {isLoginMode ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              isLoginMode ? 'Sign in' : 'Create account'
            )}
          </button>
        </form>

        <div className="px-6 md:px-8 pb-6 md:pb-8 text-center">
          <p className="text-white/40 text-sm">
            {isLoginMode ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => setIsLoginMode(!isLoginMode)} className="ml-1 text-[#a3e635] hover:text-[#b9f564] font-medium">
              {isLoginMode ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
