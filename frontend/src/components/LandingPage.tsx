import { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  X,
  ArrowUp,
  ArrowDown,
  Check
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

// Custom Fork icon
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

// Custom Switch icon
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

// Custom Merge icon
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
  const [activeSection, setActiveSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const sections = [
    { id: 'hero', title: 'Hero' },
    { id: 'features', title: 'Features' },
    { id: 'split', title: 'Split' },
    { id: 'merge', title: 'Merge' },
    { id: 'keyboard', title: 'Keyboard' },
    { id: 'pricing', title: 'Pricing' },
    { id: 'cta', title: 'CTA' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isScrolling) return;
      
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Calculate which section is active based on scroll position
      const newSection = Math.round(scrollTop / windowHeight);
      if (newSection !== activeSection && newSection >= 0 && newSection < sections.length) {
        setActiveSection(newSection);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection, isScrolling, sections.length]);

  const scrollToSection = (index: number) => {
    if (index < 0 || index >= sections.length) return;
    
    setIsScrolling(true);
    setActiveSection(index);
    
    window.scrollTo({
      top: index * window.innerHeight,
      behavior: 'smooth'
    });
    
    setTimeout(() => setIsScrolling(false), 800);
  };

  // Handle wheel events for snap scrolling
  useEffect(() => {
    let lastScrollTime = 0;
    const scrollCooldown = 1000;

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime < scrollCooldown) {
        e.preventDefault();
        return;
      }

      const direction = e.deltaY > 0 ? 1 : -1;
      const newSection = activeSection + direction;
      
      if (newSection >= 0 && newSection < sections.length) {
        e.preventDefault();
        lastScrollTime = now;
        scrollToSection(newSection);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activeSection, sections.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToSection(activeSection + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToSection(activeSection - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, sections.length]);

  return (
    <div 
      ref={containerRef}
      className="relative bg-black"
      style={{ height: `${sections.length * 100}vh` }}
    >
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ForkIcon className="w-6 h-6 text-[#a3e635]" />
          <span className="text-xl font-semibold text-white">Chatfork</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection(5)} className="text-sm text-white/60 hover:text-white transition-colors">Pricing</button>
          <button onClick={onGetStarted} className="text-sm text-white/60 hover:text-white transition-colors">Sign in</button>
        </div>
        <button 
          onClick={onGetStarted}
          className="px-5 py-2 text-sm font-medium text-[#a3e635] border border-[#a3e635]/50 rounded-lg hover:bg-[#a3e635]/10 transition-colors"
        >
          Get started
        </button>
      </nav>

      {/* Section Indicators */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeSection === index 
                ? 'bg-[#a3e635] w-2 h-6' 
                : 'bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section 
        ref={el => { sectionRefs.current[0] = el; }}
        className="fixed inset-0 h-screen flex items-center justify-center overflow-hidden"
        style={{
          opacity: activeSection === 0 ? 1 : 0,
          transform: activeSection === 0 ? 'scale(1)' : `scale(${activeSection > 0 ? 0.8 : 1.2})`,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: activeSection === 0 ? 'auto' : 'none',
          zIndex: activeSection === 0 ? 10 : 0,
        }}
      >
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&q=80" 
            alt="Developer workspace"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <p className="text-xs tracking-[0.2em] text-white/40 uppercase mb-8 animate-fade-in-up">
            Branched Chat for Product Teams
          </p>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1] mb-8">
                <span className="block text-white animate-fade-in-up" style={{ animationDelay: '0.1s' }}>Fork the thread.</span>
                <span className="block text-white/60 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>Keep context.</span>
              </h1>
              
              <p className="text-lg text-white/50 max-w-md mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                Chatfork turns any message into a branch—explore ideas without losing the main line.
              </p>

              <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <button 
                  onClick={onGetStarted}
                  className="group px-6 py-3 bg-[#a3e635] text-black font-medium rounded-lg hover:bg-[#b9f564] transition-all flex items-center gap-2"
                >
                  Get started free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => scrollToSection(1)}
                  className="px-6 py-3 text-white/60 hover:text-white transition-colors"
                >
                  See how it works
                </button>
              </div>
            </div>

            {/* Chat Demo */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="bg-[#141414]/90 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <ForkIcon className="w-4 h-4 text-[#a3e635]" />
                    <span className="text-sm text-white/60 font-mono">chat-fork-demo</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      Hey! I'm working on a new feature idea for our product. Want to brainstorm?
                    </p>
                  </div>
                  
                  <div className="bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      Absolutely! I'd love to help. What kind of feature are you thinking about?
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      I'm thinking of adding a collaborative workspace feature. Users could create shared boards.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-md text-xs text-[#a3e635]">
                      <ForkIcon className="w-3 h-3" />
                      forked → feature-idea
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Three Moves */}
      <section 
        ref={el => { sectionRefs.current[1] = el; }}
        className="fixed inset-0 h-screen flex items-center justify-center overflow-hidden bg-black"
        style={{
          opacity: activeSection === 1 ? 1 : 0,
          transform: activeSection === 1 ? 'translateY(0) scale(1)' : `translateY(${activeSection > 1 ? '-100px' : '100px'}) scale(${activeSection > 1 ? 0.9 : 1.1})`,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: activeSection === 1 ? 'auto' : 'none',
          zIndex: activeSection === 1 ? 10 : 0,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 w-full">
          <h2 className="text-4xl md:text-5xl font-light text-center mb-20 text-white">
            Three moves. Total control.
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: ForkIcon, 
                title: 'Fork', 
                desc: 'Start a new branch from any message. Explore without polluting the main thread.',
                delay: 0
              },
              { 
                icon: SwitchIcon, 
                title: 'Switch', 
                desc: 'Jump between branches instantly. Context stays intact—no scrolling, no confusion.',
                delay: 0.1
              },
              { 
                icon: MergeIcon, 
                title: 'Merge', 
                desc: 'Bring the best ideas back. Compare before you commit.',
                delay: 0.2
              },
            ].map((feature, i) => (
              <div 
                key={i}
                className="group bg-[#141414] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all hover:scale-105"
                style={{
                  opacity: activeSection === 1 ? 1 : 0,
                  transform: activeSection === 1 ? 'translateY(0)' : 'translateY(50px)',
                  transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${feature.delay}s`,
                }}
              >
                <div className="w-12 h-12 bg-[#a3e635]/10 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-[#a3e635]" />
                </div>
                <h3 className="text-2xl font-medium mb-4 text-white">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Split Section */}
      <section 
        ref={el => { sectionRefs.current[2] = el; }}
        className="fixed inset-0 h-screen flex items-center justify-center overflow-hidden bg-black"
        style={{
          opacity: activeSection === 2 ? 1 : 0,
          transform: activeSection === 2 ? 'translateX(0) scale(1)' : `translateX(${activeSection > 2 ? '-100px' : '100px'}) scale(${activeSection > 2 ? 0.9 : 1.1})`,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: activeSection === 2 ? 'auto' : 'none',
          zIndex: activeSection === 2 ? 10 : 0,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div 
              style={{
                opacity: activeSection === 2 ? 1 : 0,
                transform: activeSection === 2 ? 'translateX(0)' : 'translateX(-50px)',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
              }}
            >
              <h2 className="text-4xl md:text-5xl font-light mb-6">
                <span className="block text-white">Split the</span>
                <span className="block text-white/60">stream.</span>
              </h2>
              <p className="text-lg text-white/50 mb-8 leading-relaxed">
                Every tangent becomes a branch. Name it. Own it. Come back anytime.
              </p>
              <button 
                onClick={() => scrollToSection(3)}
                className="group flex items-center gap-2 text-[#a3e635] hover:text-[#b9f564] transition-colors"
              >
                Explore branching
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div 
              className="bg-[#141414] border border-white/5 rounded-2xl p-6"
              style={{
                opacity: activeSection === 2 ? 1 : 0,
                transform: activeSection === 2 ? 'translateX(0) scale(1)' : 'translateX(50px) scale(0.9)',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-white/40">Branch Map</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#a3e635]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                </div>
              </div>
              
              <svg viewBox="0 0 300 250" className="w-full">
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

      {/* Merge Section */}
      <section 
        ref={el => { sectionRefs.current[3] = el; }}
        className="fixed inset-0 h-screen flex items-center justify-center overflow-hidden bg-black"
        style={{
          opacity: activeSection === 3 ? 1 : 0,
          transform: activeSection === 3 ? 'translateY(0) scale(1)' : `translateY(${activeSection > 3 ? '100px' : '-100px'}) scale(${activeSection > 3 ? 0.9 : 1.1})`,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: activeSection === 3 ? 'auto' : 'none',
          zIndex: activeSection === 3 ? 10 : 0,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div 
              className="bg-[#141414] border border-white/5 rounded-2xl p-6 order-2 lg:order-1"
              style={{
                opacity: activeSection === 3 ? 1 : 0,
                transform: activeSection === 3 ? 'translateX(0)' : 'translateX(-50px)',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-white/40">Compare</span>
                  <ArrowRight className="w-4 h-4 text-white/20" />
                  <span className="text-[#a3e635] font-mono">main</span>
                  <ArrowRight className="w-4 h-4 text-white/20 rotate-180" />
                  <span className="text-white/60 font-mono">feature-idea</span>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-md text-xs text-[#a3e635]">
                  <Check className="w-3 h-3" />
                  Merge
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-lg">
                  <span className="text-xs text-white/40 font-mono">main</span>
                  <p className="text-sm text-white/60 mt-1">Let's finalize the Q4 roadmap.</p>
                </div>
                
                <div className="p-3 bg-[#a3e635]/5 border border-[#a3e635]/20 rounded-lg">
                  <span className="text-xs text-[#a3e635]/60 font-mono">feature-idea</span>
                  <p className="text-sm text-[#a3e635] mt-1">+ Add collaborative workspaces</p>
                </div>
                
                <div className="p-3 bg-[#a3e635]/5 border border-[#a3e635]/20 rounded-lg">
                  <span className="text-xs text-[#a3e635]/60 font-mono">feature-idea</span>
                  <p className="text-sm text-[#a3e635] mt-1">+ Real-time cursors</p>
                </div>
                
                <div className="p-3 bg-white/5 rounded-lg">
                  <span className="text-xs text-white/40 font-mono">main</span>
                  <p className="text-sm text-white/60 mt-1">Timeline: 6 weeks</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Preview</span>
                  <span className="text-[#a3e635]">4 changes</span>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2"
              style={{
                opacity: activeSection === 3 ? 1 : 0,
                transform: activeSection === 3 ? 'translateX(0)' : 'translateX(50px)',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
              }}
            >
              <h2 className="text-4xl md:text-5xl font-light mb-6">
                <span className="block text-white">Bring it</span>
                <span className="block text-white/60">back.</span>
              </h2>
              <p className="text-lg text-white/50 mb-8 leading-relaxed">
                Merge the best parts. Preview changes, resolve conflicts, and keep the history clean.
              </p>
              <button 
                onClick={() => scrollToSection(4)}
                className="group flex items-center gap-2 text-[#a3e635] hover:text-[#b9f564] transition-colors"
              >
                See merge options
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Keyboard Section */}
      <section 
        ref={el => { sectionRefs.current[4] = el; }}
        className="fixed inset-0 h-screen flex items-center justify-center overflow-hidden bg-black"
        style={{
          opacity: activeSection === 4 ? 1 : 0,
          transform: activeSection === 4 ? 'scale(1)' : `scale(${activeSection > 4 ? 0.8 : 1.2})`,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: activeSection === 4 ? 'auto' : 'none',
          zIndex: activeSection === 4 ? 10 : 0,
        }}
      >
        <div className="max-w-4xl mx-auto px-6 w-full text-center">
          <h2 
            className="text-4xl md:text-5xl font-light mb-6 text-white"
            style={{
              opacity: activeSection === 4 ? 1 : 0,
              transform: activeSection === 4 ? 'translateY(0)' : 'translateY(-30px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
            }}
          >
            Keyboard-first. No friction.
          </h2>
          <p 
            className="text-lg text-white/50 mb-16"
            style={{
              opacity: activeSection === 4 ? 1 : 0,
              transform: activeSection === 4 ? 'translateY(0)' : 'translateY(-20px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
            }}
          >
            Branch, switch, and merge without touching the mouse.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { keys: ['⌘', 'Shift', 'F'], icon: ForkIcon, label: 'Fork from here', delay: 0.3 },
              { keys: ['⌘', 'Shift', '↑'], icon: ArrowUp, label: 'Previous branch', delay: 0.4 },
              { keys: ['⌘', 'Shift', '↓'], icon: ArrowDown, label: 'Next branch', delay: 0.5 },
            ].map((shortcut, i) => (
              <div 
                key={i}
                className="bg-[#141414] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all"
                style={{
                  opacity: activeSection === 4 ? 1 : 0,
                  transform: activeSection === 4 ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
                  transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${shortcut.delay}s`,
                }}
              >
                <div className="flex justify-center gap-2 mb-6">
                  {shortcut.keys.map((key, j) => (
                    <kbd key={j} className="px-3 py-2 bg-white/5 rounded-lg text-sm font-mono text-white/60 border border-white/10">
                      {key}
                    </kbd>
                  ))}
                </div>
                <div className="w-10 h-10 bg-[#a3e635]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <shortcut.icon className="w-5 h-5 text-[#a3e635]" />
                </div>
                <p className="text-white/60">{shortcut.label}</p>
              </div>
            ))}
          </div>

          <button 
            onClick={() => scrollToSection(5)}
            className="mt-12 text-white/40 hover:text-white transition-colors"
            style={{
              opacity: activeSection === 4 ? 1 : 0,
              transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.6s',
            }}
          >
            View all shortcuts
          </button>
        </div>
      </section>

      {/* Pricing Section */}
      <section 
        ref={el => { sectionRefs.current[5] = el; }}
        className="fixed inset-0 h-screen flex items-center justify-center overflow-hidden bg-black"
        style={{
          opacity: activeSection === 5 ? 1 : 0,
          transform: activeSection === 5 ? 'translateY(0) scale(1)' : `translateY(${activeSection > 5 ? '-100px' : '100px'}) scale(${activeSection > 5 ? 0.9 : 1.1})`,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: activeSection === 5 ? 'auto' : 'none',
          zIndex: activeSection === 5 ? 10 : 0,
        }}
      >
        <div className="max-w-5xl mx-auto px-6 w-full">
          <h2 
            className="text-4xl md:text-5xl font-light text-center mb-6 text-white"
            style={{
              opacity: activeSection === 5 ? 1 : 0,
              transform: activeSection === 5 ? 'translateY(0)' : 'translateY(-30px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
            }}
          >
            Simple plans.
          </h2>
          <p 
            className="text-lg text-white/50 text-center mb-16 max-w-xl mx-auto"
            style={{
              opacity: activeSection === 5 ? 1 : 0,
              transform: activeSection === 5 ? 'translateY(0)' : 'translateY(-20px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
            }}
          >
            Start free. Upgrade when you need more branches and teammates.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div 
              className="bg-[#141414] border border-white/5 rounded-2xl p-8"
              style={{
                opacity: activeSection === 5 ? 1 : 0,
                transform: activeSection === 5 ? 'translateX(0)' : 'translateX(-50px)',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
              }}
            >
              <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Free</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-light text-white">$0</span>
              </div>
              <p className="text-white/50 mb-8">Perfect for personal use</p>

              <ul className="space-y-4 mb-8">
                {['3 branches', '7-day history', 'Fork & switch', 'Basic merge'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#a3e635]" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={onGetStarted}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Start free
              </button>
            </div>

            {/* Pro Plan */}
            <div 
              className="bg-[#141414] border border-[#a3e635]/30 rounded-2xl p-8 relative"
              style={{
                opacity: activeSection === 5 ? 1 : 0,
                transform: activeSection === 5 ? 'translateX(0)' : 'translateX(50px)',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
              }}
            >
              <div className="absolute top-0 right-8 -translate-y-1/2">
                <span className="px-3 py-1 bg-[#a3e635]/20 text-[#a3e635] text-xs rounded-full">Popular</span>
              </div>
              
              <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Pro</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-light text-white">$12</span>
                <span className="text-white/40">/user/mo</span>
              </div>
              <p className="text-white/50 mb-8">For product teams</p>

              <ul className="space-y-4 mb-8">
                {['Unlimited branches', 'Unlimited history', 'Merge & compare', 'SSO', 'Priority support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#a3e635]" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={onGetStarted}
                className="w-full py-3 bg-[#a3e635] hover:bg-[#b9f564] text-black font-medium rounded-lg transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        ref={el => { sectionRefs.current[6] = el; }}
        className="fixed inset-0 h-screen flex items-center justify-center overflow-hidden"
        style={{
          opacity: activeSection === 6 ? 1 : 0,
          transform: activeSection === 6 ? 'scale(1)' : 'scale(0.8)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: activeSection === 6 ? 'auto' : 'none',
          zIndex: activeSection === 6 ? 10 : 0,
        }}
      >
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1920&q=80" 
            alt="Office"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 w-full text-center">
          <h2 
            className="text-4xl md:text-5xl font-light mb-6 text-white"
            style={{
              opacity: activeSection === 6 ? 1 : 0,
              transform: activeSection === 6 ? 'translateY(0)' : 'translateY(-30px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
            }}
          >
            Start for free today.
          </h2>
          <p 
            className="text-lg text-white/50 mb-10"
            style={{
              opacity: activeSection === 6 ? 1 : 0,
              transform: activeSection === 6 ? 'translateY(0)' : 'translateY(-20px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
            }}
          >
            No credit card. No setup. Just fork your first thread.
          </p>

          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto"
            style={{
              opacity: activeSection === 6 ? 1 : 0,
              transform: activeSection === 6 ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
            }}
          >
            <input 
              type="email" 
              placeholder="Email address"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#a3e635]/50"
            />
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-6 py-3 bg-[#a3e635] hover:bg-[#b9f564] text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p 
            className="mt-6 text-sm text-white/30"
            style={{
              opacity: activeSection === 6 ? 1 : 0,
              transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s',
            }}
          >
            By signing up, you agree to our Terms & Privacy.
          </p>
        </div>
      </section>

      {/* Footer - appears at the end */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between bg-black/50 backdrop-blur-md text-xs text-white/30"
        style={{
          opacity: activeSection >= 0 ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
      >
        <div className="flex items-center gap-6">
          <span>Git-style branching</span>
          <span className="text-white/10">|</span>
          <span>Merge & compare</span>
          <span className="text-white/10">|</span>
          <span>Keyboard-first</span>
        </div>
        <span>v1.0.0</span>
      </div>

      {/* CSS for fade-in animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

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

      <div className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pb-0">
          <div className="flex items-center gap-3 mb-6">
            <ForkIcon className="w-6 h-6 text-[#a3e635]" />
            <span className="text-xl font-semibold text-white">Chatfork</span>
          </div>
          <h2 className="text-2xl font-light text-white mb-2">
            {isLoginMode ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-white/50">
            {isLoginMode ? 'Sign in to continue chatting' : 'Sign up to start forking conversations'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
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

        <div className="px-8 pb-8 text-center">
          <p className="text-white/40 text-sm">
            {isLoginMode ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="ml-1 text-[#a3e635] hover:text-[#b9f564] font-medium"
            >
              {isLoginMode ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
