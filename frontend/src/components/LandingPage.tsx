import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Github, 
  X,
  ArrowUp,
  ArrowDown,
  Check
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

// Custom Fork icon that matches the design
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <ForkIcon className="w-6 h-6 text-[#a3e635]" />
            </div>
            <span className="text-xl font-semibold text-white">Chatfork</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#docs" className="text-sm text-white/60 hover:text-white transition-colors">Docs</a>
            <a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</a>
            <button onClick={onGetStarted} className="text-sm text-white/60 hover:text-white transition-colors">Sign in</button>
          </div>
          <button 
            onClick={onGetStarted}
            className="px-5 py-2 text-sm font-medium text-[#a3e635] border border-[#a3e635]/50 rounded-lg hover:bg-[#a3e635]/10 transition-colors"
          >
            Get started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&q=80" 
            alt="Developer workspace"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
          {/* Eyebrow */}
          <p className="text-xs tracking-[0.2em] text-white/40 uppercase mb-8">
            Branched Chat for Product Teams
          </p>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Content */}
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1] mb-8">
                <span className="text-white">Fork the thread.</span>
                <br />
                <span className="text-white/60">Keep context.</span>
              </h1>
              
              <p className="text-lg text-white/50 max-w-md mb-10 leading-relaxed">
                Chatfork turns any message into a branch—explore ideas without losing the main line.
              </p>

              <div className="flex items-center gap-4 mb-16">
                <button 
                  onClick={onGetStarted}
                  className="group px-6 py-3 bg-[#a3e635] text-[#0a0a0a] font-medium rounded-lg hover:bg-[#b9f564] transition-colors flex items-center gap-2"
                >
                  Get started free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-6 py-3 text-white/60 hover:text-white transition-colors">
                  See how it works
                </button>
              </div>
            </div>

            {/* Right - Chat Demo */}
            <div className="relative">
              <div className="bg-[#141414]/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                {/* Chat Header */}
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

                {/* Chat Messages */}
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

                  {/* Fork Button */}
                  <div className="flex justify-end">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-md text-xs text-[#a3e635] hover:bg-[#a3e635]/20 transition-colors">
                      <ForkIcon className="w-3 h-3" />
                      forked → feature-idea
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Tags */}
          <div className="absolute bottom-8 left-6 right-6 flex items-center justify-between text-xs text-white/30">
            <div className="flex items-center gap-6">
              <span>Git-style branching</span>
              <span className="text-white/10">|</span>
              <span>Merge & compare</span>
              <span className="text-white/10">|</span>
              <span>Keyboard-first</span>
            </div>
            <span>v1.0.0</span>
          </div>
        </div>
      </section>

      {/* Features Section - Three Moves */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light text-center mb-20">
            Three moves. Total control.
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Fork Card */}
            <div className="group bg-[#141414] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors">
              <div className="mb-6">
                <svg viewBox="0 0 100 40" className="w-full h-10">
                  <line x1="10" y1="20" x2="50" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <line x1="50" y1="20" x2="90" y2="10" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <line x1="50" y1="20" x2="90" y2="30" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <circle cx="50" cy="20" r="4" fill="#a3e635" />
                </svg>
              </div>
              <div className="w-12 h-12 bg-[#a3e635]/10 rounded-xl flex items-center justify-center mb-6">
                <ForkIcon className="w-6 h-6 text-[#a3e635]" />
              </div>
              <h3 className="text-2xl font-medium mb-4">Fork</h3>
              <p className="text-white/50 leading-relaxed">
                Start a new branch from any message. Explore without polluting the main thread.
              </p>
            </div>

            {/* Switch Card */}
            <div className="group bg-[#141414] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors">
              <div className="mb-6">
                <svg viewBox="0 0 100 40" className="w-full h-10">
                  <line x1="10" y1="20" x2="30" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <circle cx="30" cy="20" r="4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  <line x1="30" y1="20" x2="70" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <circle cx="70" cy="20" r="4" fill="none" stroke="#a3e635" strokeWidth="2" />
                  <line x1="70" y1="20" x2="90" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                </svg>
              </div>
              <div className="w-12 h-12 bg-[#a3e635]/10 rounded-xl flex items-center justify-center mb-6">
                <SwitchIcon className="w-6 h-6 text-[#a3e635]" />
              </div>
              <h3 className="text-2xl font-medium mb-4">Switch</h3>
              <p className="text-white/50 leading-relaxed">
                Jump between branches instantly. Context stays intact—no scrolling, no confusion.
              </p>
            </div>

            {/* Merge Card */}
            <div className="group bg-[#141414] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors">
              <div className="mb-6">
                <svg viewBox="0 0 100 40" className="w-full h-10">
                  <line x1="10" y1="10" x2="50" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <line x1="10" y1="30" x2="50" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <line x1="50" y1="20" x2="90" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <circle cx="50" cy="20" r="4" fill="#a3e635" />
                </svg>
              </div>
              <div className="w-12 h-12 bg-[#a3e635]/10 rounded-xl flex items-center justify-center mb-6">
                <MergeIcon className="w-6 h-6 text-[#a3e635]" />
              </div>
              <h3 className="text-2xl font-medium mb-4">Merge</h3>
              <p className="text-white/50 leading-relaxed">
                Bring the best ideas back. Compare before you commit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Split the Stream Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-light mb-6">
                <span className="text-white">Split the</span>
                <br />
                <span className="text-white/60">stream.</span>
              </h2>
              <p className="text-lg text-white/50 mb-8 leading-relaxed">
                Every tangent becomes a branch. Name it. Own it. Come back anytime.
              </p>
              <button className="group flex items-center gap-2 text-[#a3e635] hover:text-[#b9f564] transition-colors">
                Explore branching
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right - Branch Map */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-white/40">Branch Map</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#a3e635]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                </div>
              </div>
              
              {/* Branch Visualization */}
              <svg viewBox="0 0 300 250" className="w-full">
                {/* Main branch line */}
                <line x1="150" y1="20" x2="150" y2="230" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                
                {/* Main branch nodes */}
                <circle cx="150" cy="30" r="6" fill="#a3e635" stroke="#0a0a0a" strokeWidth="2" />
                <circle cx="150" cy="80" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <circle cx="150" cy="130" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <circle cx="150" cy="180" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <circle cx="150" cy="230" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                
                {/* copy-tweaks branch */}
                <path d="M 150 80 Q 100 80 80 120 Q 60 160 60 200" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                <circle cx="60" cy="200" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <text x="30" y="205" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace">copy-tweaks</text>
                
                {/* feature-idea branch */}
                <path d="M 150 130 Q 200 130 220 160 Q 240 190 240 220" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                <circle cx="240" cy="220" r="5" fill="none" stroke="#a3e635" strokeWidth="2" />
                <text x="200" y="235" fill="#a3e635" fontSize="10" fontFamily="monospace">feature-idea</text>
                
                {/* experiment branch */}
                <path d="M 240 190 Q 270 190 280 210" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                <circle cx="280" cy="220" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <text x="260" y="240" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace">experiment</text>
                
                {/* Labels */}
                <text x="160" y="25" fill="#a3e635" fontSize="10" fontFamily="monospace">main</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Bring it Back Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Merge UI */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 order-2 lg:order-1">
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

            {/* Right Content */}
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-light mb-6">
                <span className="text-white">Bring it</span>
                <span className="text-white/60"> back.</span>
              </h2>
              <p className="text-lg text-white/50 mb-8 leading-relaxed">
                Merge the best parts. Preview changes, resolve conflicts, and keep the history clean.
              </p>
              <button className="group flex items-center gap-2 text-[#a3e635] hover:text-[#b9f564] transition-colors">
                See merge options
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light mb-6">
            Keyboard-first. No friction.
          </h2>
          <p className="text-lg text-white/50 mb-16">
            Branch, switch, and merge without touching the mouse.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Fork Shortcut */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-8">
              <div className="flex justify-center gap-2 mb-6">
                <kbd className="px-3 py-2 bg-white/5 rounded-lg text-sm font-mono text-white/60">⌘</kbd>
                <kbd className="px-3 py-2 bg-white/5 rounded-lg text-sm font-mono text-white/60">Shift</kbd>
                <kbd className="px-3 py-2 bg-white/5 rounded-lg text-sm font-mono text-white/60">F</kbd>
              </div>
              <div className="w-10 h-10 bg-[#a3e635]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ForkIcon className="w-5 h-5 text-[#a3e635]" />
              </div>
              <p className="text-white/60">Fork from here</p>
            </div>

            {/* Previous Branch */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-8">
              <div className="flex justify-center gap-2 mb-6">
                <kbd className="px-3 py-2 bg-white/5 rounded-lg text-sm font-mono text-white/60">⌘</kbd>
                <kbd className="px-3 py-2 bg-white/5 rounded-lg text-sm font-mono text-white/60">Shift</kbd>
                <kbd className="px-3 py-2 bg-white/5 rounded-lg text-sm font-mono text-white/60">↑</kbd>
              </div>
              <div className="w-10 h-10 bg-[#a3e635]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ArrowUp className="w-5 h-5 text-[#a3e635]" />
              </div>
              <p className="text-white/60">Previous branch</p>
            </div>

            {/* Next Branch */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-8">
              <div className="flex justify-center gap-2 mb-6">
                <kbd className="px-3 py-2 bg-white/5 rounded-lg text-sm font-mono text-white/60">⌘</kbd>
                <kbd className="px-3 py-2 bg-white/5 rounded-lg text-sm font-mono text-white/60">Shift</kbd>
                <kbd className="px-3 py-2 bg-white/5 rounded-lg text-sm font-mono text-white/60">↓</kbd>
              </div>
              <div className="w-10 h-10 bg-[#a3e635]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ArrowDown className="w-5 h-5 text-[#a3e635]" />
              </div>
              <p className="text-white/60">Next branch</p>
            </div>
          </div>

          <button className="mt-12 text-white/40 hover:text-white transition-colors">
            View all shortcuts
          </button>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light text-center mb-6">
            Simple plans.
          </h2>
          <p className="text-lg text-white/50 text-center mb-16 max-w-xl mx-auto">
            Start free. Upgrade when you need more branches and teammates.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-8">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Free</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-light">$0</span>
              </div>
              <p className="text-white/50 mb-8">Perfect for personal use</p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#a3e635]" />
                  <span className="text-white/80">3 branches</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#a3e635]" />
                  <span className="text-white/80">7-day history</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#a3e635]" />
                  <span className="text-white/80">Fork & switch</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#a3e635]" />
                  <span className="text-white/80">Basic merge</span>
                </li>
              </ul>

              <button 
                onClick={onGetStarted}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Start free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-[#141414] border border-[#a3e635]/30 rounded-2xl p-8 relative">
              <div className="absolute top-0 right-8 -translate-y-1/2">
                <span className="px-3 py-1 bg-[#a3e635]/20 text-[#a3e635] text-xs rounded-full">Popular</span>
              </div>
              
              <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Pro</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-light">$12</span>
                <span className="text-white/40">/user/mo</span>
              </div>
              <p className="text-white/50 mb-8">For product teams</p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#a3e635]" />
                  <span className="text-white/80">Unlimited branches</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#a3e635]" />
                  <span className="text-white/80">Unlimited history</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#a3e635]" />
                  <span className="text-white/80">Merge & compare</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#a3e635]" />
                  <span className="text-white/80">SSO</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#a3e635]" />
                  <span className="text-white/80">Priority support</span>
                </li>
              </ul>

              <button 
                onClick={onGetStarted}
                className="w-full py-3 bg-[#a3e635] hover:bg-[#b9f564] text-[#0a0a0a] font-medium rounded-lg transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1920&q=80" 
            alt="Office"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/60" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light mb-6">
            Start for free today.
          </h2>
          <p className="text-lg text-white/50 mb-10">
            No credit card. No setup. Just fork your first thread.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Email address"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#a3e635]/50"
            />
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-6 py-3 bg-[#a3e635] hover:bg-[#b9f564] text-[#0a0a0a] font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-6 text-sm text-white/30">
            By signing up, you agree to our Terms & Privacy.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ForkIcon className="w-5 h-5 text-[#a3e635]" />
                <span className="text-lg font-semibold">Chatfork</span>
              </div>
              <p className="text-sm text-white/40">
                Git-style branching for AI conversations. Built for product teams.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Product</p>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Company</p>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Legal</p>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between pt-8 border-t border-white/5">
            <p className="text-sm text-white/30">
              Powered by Kimi AI • Built with Cloudflare Workers
            </p>
            <a 
              href="https://github.com/fischmanb/chatfork" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/30 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
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

        {/* Form */}
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
            className="w-full py-3 bg-[#a3e635] hover:bg-[#b9f564] text-[#0a0a0a] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                {isLoginMode ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              isLoginMode ? 'Sign in' : 'Create account'
            )}
          </button>
        </form>

        {/* Toggle */}
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
