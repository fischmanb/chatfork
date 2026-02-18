import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, X, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { useState } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>('.pinned-section');
      
      sections.forEach((section, i) => {
        const items = section.querySelectorAll('.gsap-item');
        const isHero = i === 0;
        
        // Set initial states
        if (!isHero) {
          gsap.set(items, { y: 60, opacity: 0 });
        }
        
        // Create timeline for this section with pin
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=130%',
            pin: true,
            scrub: 0.5,
            snap: {
              snapTo: (progress) => {
                if (progress < 0.15) return 0.15; // Snap to settle start
                if (progress > 0.85) return 1;     // Snap to end
                return 0.5; // Stay in settle phase
              },
              duration: { min: 0.15, max: 0.35 },
              delay: 0,
              ease: 'power2.out'
            }
          }
        });
        
        if (!isHero) {
          // ENTRANCE: 0-20% - items slide up and fade in
          tl.to(items, {
            y: 0,
            opacity: 1,
            duration: 0.2,
            stagger: 0.02,
            ease: 'power2.out'
          }, 0);
          
          // SETTLE: 20-80% - content stays fully visible (no animation)
          // EXIT: 80-100% - items slide up and fade out
          tl.to(items, {
            y: -60,
            opacity: 0,
            duration: 0.2,
            stagger: 0.02,
            ease: 'power2.in'
          }, 0.8);
        } else {
          // Hero section - just fade out at the end
          tl.to(items, {
            y: -40,
            opacity: 0,
            duration: 0.2,
            stagger: 0.02,
            ease: 'power2.in'
          }, 0.8);
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-black/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ForkIcon className="w-6 h-6 text-[#a3e635]" />
          <span className="text-xl font-semibold text-white">Chatfork</span>
        </div>
        <button onClick={onGetStarted} className="px-5 py-2 text-sm font-medium text-[#a3e635] border border-[#a3e635]/50 rounded-lg hover:bg-[#a3e635]/10 transition-colors">
          Get started
        </button>
      </nav>

      {/* HERO */}
      <section className="pinned-section relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&q=80" alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-20">
          <p className="gsap-item text-xs tracking-[0.2em] text-white/40 uppercase mb-8">
            Branched Chat for Product Teams
          </p>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="gsap-item text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1] mb-8">
                <span className="block text-white">Fork the thread.</span>
                <span className="block text-white/60">Keep context.</span>
              </h1>
              <p className="gsap-item text-lg text-white/50 max-w-md mb-10 leading-relaxed">
                Chatfork turns any message into a branch—explore ideas without losing the main line.
              </p>
              <div className="gsap-item">
                <button onClick={onGetStarted} className="group px-6 py-3 bg-[#a3e635] text-black font-medium rounded-lg hover:bg-[#b9f564] transition-all flex items-center gap-2">
                  Get started free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="gsap-item relative">
              <div className="bg-[#141414]/90 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
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
                    <p className="text-sm text-white/80">Hey! I'm working on a new feature idea for our product. Want to brainstorm?</p>
                  </div>
                  <div className="bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-lg p-4">
                    <p className="text-sm text-white/80">Absolutely! I'd love to help. What kind of feature are you thinking about?</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/80">I'm thinking of adding a collaborative workspace feature...</p>
                  </div>
                  <div className="flex justify-end">
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-md text-xs text-[#a3e635]">
                      <ForkIcon className="w-3 h-3" />
                      forked → feature-idea
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="pinned-section relative h-screen flex items-center justify-center bg-black">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <h2 className="gsap-item text-4xl md:text-5xl font-light text-center mb-20 text-white">
            Three moves. Total control.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: ForkIcon, title: 'Fork', desc: 'Start a new branch from any message. Explore without polluting the main thread.' },
              { icon: SwitchIcon, title: 'Switch', desc: 'Jump between branches instantly. Context stays intact—no scrolling, no confusion.' },
              { icon: MergeIcon, title: 'Merge', desc: 'Bring the best ideas back. Compare before you commit.' },
            ].map((f, i) => (
              <div key={i} className="gsap-item bg-[#141414] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all">
                <div className="w-12 h-12 bg-[#a3e635]/10 rounded-xl flex items-center justify-center mb-6">
                  <f.icon className="w-6 h-6 text-[#a3e635]" />
                </div>
                <h3 className="text-2xl font-medium mb-4 text-white">{f.title}</h3>
                <p className="text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPLIT */}
      <section className="pinned-section relative h-screen flex items-center justify-center bg-black">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="gsap-item">
              <h2 className="text-4xl md:text-5xl font-light mb-6">
                <span className="block text-white">Split the</span>
                <span className="block text-white/60">stream.</span>
              </h2>
              <p className="text-lg text-white/50 mb-8 leading-relaxed">
                Every tangent becomes a branch. Name it. Own it. Come back anytime.
              </p>
            </div>
            <div className="gsap-item bg-[#141414] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-white/40">Branch Map</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#a3e635]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                </div>
              </div>
              <svg viewBox="0 0 300 250" className="w-full">
                <line x1="150" y1="20" x2="150" y2="230" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                <circle cx="150" cy="30" r="6" fill="#a3e635" />
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

      {/* MERGE */}
      <section className="pinned-section relative h-screen flex items-center justify-center bg-black">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="gsap-item bg-[#141414] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-white/40">Compare</span>
                  <ArrowRight className="w-4 h-4 text-white/20" />
                  <span className="text-[#a3e635] font-mono">main</span>
                  <ArrowRight className="w-4 h-4 text-white/20 rotate-180" />
                  <span className="text-white/60 font-mono">feature-idea</span>
                </div>
                <span className="flex items-center gap-2 px-3 py-1.5 bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-md text-xs text-[#a3e635]">
                  <Check className="w-3 h-3" />
                  Merge
                </span>
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
            <div className="gsap-item">
              <h2 className="text-4xl md:text-5xl font-light mb-6">
                <span className="block text-white">Bring it</span>
                <span className="block text-white/60">back.</span>
              </h2>
              <p className="text-lg text-white/50 mb-8 leading-relaxed">
                Merge the best parts. Preview changes, resolve conflicts, and keep the history clean.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KEYBOARD */}
      <section className="pinned-section relative h-screen flex items-center justify-center bg-black">
        <div className="max-w-4xl mx-auto px-6 w-full text-center">
          <h2 className="gsap-item text-4xl md:text-5xl font-light mb-6 text-white">
            Keyboard-first. No friction.
          </h2>
          <p className="gsap-item text-lg text-white/50 mb-16">
            Branch, switch, and merge without touching the mouse.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { keys: ['⌘', 'Shift', 'F'], icon: ForkIcon, label: 'Fork from here' },
              { keys: ['⌘', 'Shift', '↑'], icon: ArrowUp, label: 'Previous branch' },
              { keys: ['⌘', 'Shift', '↓'], icon: ArrowDown, label: 'Next branch' },
            ].map((s, i) => (
              <div key={i} className="gsap-item bg-[#141414] border border-white/5 rounded-2xl p-8">
                <div className="flex justify-center gap-2 mb-6">
                  {s.keys.map((k, j) => (
                    <kbd key={j} className="px-3 py-2 bg-white/5 rounded-lg text-sm font-mono text-white/60 border border-white/10">{k}</kbd>
                  ))}
                </div>
                <div className="w-10 h-10 bg-[#a3e635]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-5 h-5 text-[#a3e635]" />
                </div>
                <p className="text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pinned-section relative h-screen flex items-center justify-center bg-black">
        <div className="max-w-5xl mx-auto px-6 w-full">
          <h2 className="gsap-item text-4xl md:text-5xl font-light text-center mb-6 text-white">
            Simple plans.
          </h2>
          <p className="gsap-item text-lg text-white/50 text-center mb-16 max-w-xl mx-auto">
            Start free. Upgrade when you need more branches and teammates.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="gsap-item bg-[#141414] border border-white/5 rounded-2xl p-8">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Free</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-light text-white">$0</span>
              </div>
              <p className="text-white/50 mb-8">Perfect for personal use</p>
              <ul className="space-y-4 mb-8">
                {['3 branches', '7-day history', 'Fork & switch', 'Basic merge'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#a3e635]" />
                    <span className="text-white/80">{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">Start free</button>
            </div>
            <div className="gsap-item bg-[#141414] border border-[#a3e635]/30 rounded-2xl p-8 relative">
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
                {['Unlimited branches', 'Unlimited history', 'Merge & compare', 'SSO', 'Priority support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#a3e635]" />
                    <span className="text-white/80">{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="w-full py-3 bg-[#a3e635] hover:bg-[#b9f564] text-black font-medium rounded-lg transition-colors">Upgrade to Pro</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pinned-section relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1920&q=80" alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 w-full text-center">
          <h2 className="gsap-item text-4xl md:text-5xl font-light mb-6 text-white">
            Start for free today.
          </h2>
          <p className="gsap-item text-lg text-white/50 mb-10">
            No credit card. No setup. Just fork your first thread.
          </p>
          <div className="gsap-item flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <input type="email" placeholder="Email address" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#a3e635]/50" />
            <button onClick={onGetStarted} className="w-full sm:w-auto px-6 py-3 bg-[#a3e635] hover:bg-[#b9f564] text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              Get started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="gsap-item mt-6 text-sm text-white/30">
            By signing up, you agree to our Terms & Privacy.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ForkIcon className="w-5 h-5 text-white/40" />
            <span className="text-white/40">Chatfork</span>
          </div>
          <p className="text-sm text-white/30">Powered by Kimi AI • Built with Cloudflare Workers</p>
        </div>
      </footer>
    </div>
  );
}

// AuthModal
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
    const result = isLoginMode ? await onLogin(email, password) : await onSignup(email, password, name || undefined);
    if (!result) setLocalError(error || 'Authentication failed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="p-8 pb-0">
          <div className="flex items-center gap-3 mb-6">
            <ForkIcon className="w-6 h-6 text-[#a3e635]" />
            <span className="text-xl font-semibold text-white">Chatfork</span>
          </div>
          <h2 className="text-2xl font-light text-white mb-2">{isLoginMode ? 'Welcome back' : 'Create account'}</h2>
          <p className="text-white/50">{isLoginMode ? 'Sign in to continue chatting' : 'Sign up to start forking conversations'}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {(localError || error) && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{localError || error}</div>
          )}
          {!isLoginMode && (
            <div>
              <label className="block text-sm text-white/60 mb-2">Name (optional)</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#a3e635]/50" />
            </div>
          )}
          <div>
            <label className="block text-sm text-white/60 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#a3e635]/50" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#a3e635]/50" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#a3e635] hover:bg-[#b9f564] text-black font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {isLoading ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />{isLoginMode ? 'Signing in...' : 'Creating account...'}</> : isLoginMode ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <div className="px-8 pb-8 text-center">
          <p className="text-white/40 text-sm">{isLoginMode ? "Don't have an account?" : "Already have an account?"}<button onClick={() => setIsLoginMode(!isLoginMode)} className="ml-1 text-[#a3e635] hover:text-[#b9f564] font-medium">{isLoginMode ? 'Sign up' : 'Sign in'}</button></p>
        </div>
      </div>
    </div>
  );
}
