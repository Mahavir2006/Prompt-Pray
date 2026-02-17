import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

/* ============================================
   MAGNET BUTTON — follows cursor magnetically
   ============================================ */
function MagnetButton({ children, className = '', onClick, style = {} }) {
    const btnRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const btn = btnRef.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (btnRef.current) {
            btnRef.current.style.transform = 'translate(0, 0)';
        }
    }, []);

    return (
        <button
            ref={btnRef}
            className={`magnet-btn ${className}`}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transition: 'transform 0.2s ease-out', ...style }}
        >
            {children}
        </button>
    );
}

/* ============================================
   SCROLL REVEAL HOOK — IntersectionObserver
   ============================================ */
function useScrollReveal() {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('revealed');
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return ref;
}

/* ============================================
   PARALLAX HOOK — moves element based on scroll
   ============================================ */
function useParallax(speed = 0.3) {
    const ref = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!ref.current) return;
            const scrollY = window.scrollY;
            ref.current.style.transform = `translateY(${scrollY * speed}px)`;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [speed]);

    return ref;
}

/* ============================================
   ANIMATED COUNTER
   ============================================ */
function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const animated = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !animated.current) {
                animated.current = true;
                const start = performance.now();
                const animate = (now) => {
                    const progress = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    setCount(Math.floor(target * eased));
                    if (progress < 1) requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }
        }, { threshold: 0.3 });

        observer.observe(el);
        return () => observer.disconnect();
    }, [target, duration]);

    return <span ref={ref}>{count}{suffix}</span>;
}

/* ============================================
   FLOATING PARTICLE (decorative)
   ============================================ */
function FloatingParticle({ size, top, left, delay, color }) {
    return (
        <div
            className="absolute rounded-full opacity-20 animate-float pointer-events-none"
            style={{
                width: size,
                height: size,
                top,
                left,
                background: color,
                animationDelay: delay,
                filter: 'blur(1px)',
            }}
        />
    );
}

/* ============================================
   TILT CARD — 3D tilt on hover
   ============================================ */
function TiltCard({ children, className = '' }) {
    const cardRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (cardRef.current) {
            cardRef.current.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale(1)';
        }
    }, []);

    return (
        <div
            ref={cardRef}
            className={className}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transition: 'transform 0.2s ease-out' }}
        >
            {children}
        </div>
    );
}

/* ============================================
   TYPING EFFECT
   ============================================ */
function TypingText({ texts, className = '' }) {
    const [textIndex, setTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const current = texts[textIndex];
        const delay = isDeleting ? 40 : 80;

        if (!isDeleting && charIndex === current.length) {
            setTimeout(() => setIsDeleting(true), 2000);
            return;
        }
        if (isDeleting && charIndex === 0) {
            setIsDeleting(false);
            setTextIndex((prev) => (prev + 1) % texts.length);
            return;
        }

        const timer = setTimeout(() => {
            setCharIndex(prev => isDeleting ? prev - 1 : prev + 1);
        }, delay);

        return () => clearTimeout(timer);
    }, [charIndex, isDeleting, textIndex, texts]);

    return (
        <span className={className}>
            {texts[textIndex].substring(0, charIndex)}
            <span className="animate-pulse" style={{ color: 'var(--accent-primary)' }}>|</span>
        </span>
    );
}

/* ============================================
   MAIN LANDING PAGE
   ============================================ */
export default function LandingPage() {
    const navigate = useNavigate();
    const { isDark, setLight } = useTheme();
    const parallaxRef = useParallax(-0.15);

    // Default to light theme for landing
    useEffect(() => {
        setLight();
    }, [setLight]);

    const features = [
        {
            title: 'Real-Time Monitoring',
            desc: 'WebSocket-powered live updates. Every metric, every model, every second.',
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
            ),
        },
        {
            title: 'Intelligent Alerts',
            desc: 'Threshold-based rule engine with severity tiers and one-click resolution.',
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                    <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
                </svg>
            ),
        },
        {
            title: 'ML + LLM Coverage',
            desc: 'Unified monitoring for traditional ML accuracy and LLM hallucination rates.',
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
            ),
        },
        {
            title: 'Governance & Audit',
            desc: 'Complete compliance trail. Every action logged, every change tracked.',
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                </svg>
            ),
        },
        {
            title: 'Risk Scoring',
            desc: 'Weighted risk computation across all models. Critical-to-low severity mapping.',
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            ),
        },
        {
            title: 'Time-Series Analytics',
            desc: 'Bucket-aggregated charts with ECharts. Smooth, interactive, real-time.',
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" x2="18" y1="20" y2="10" />
                    <line x1="12" x2="12" y1="20" y2="4" />
                    <line x1="6" x2="6" y1="20" y2="14" />
                </svg>
            ),
        },
    ];

    const techStack = [
        'React 18', 'Socket.IO', 'ECharts', 'TanStack Query',
        'Express.js', 'MongoDB', 'JWT Auth', 'Tailwind CSS',
    ];

    const revealRef1 = useScrollReveal();
    const revealRef2 = useScrollReveal();
    const revealRef3 = useScrollReveal();
    const revealRef4 = useScrollReveal();
    const revealRef5 = useScrollReveal();

    return (
        <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
            {/* ===== Background Decorative Elements ===== */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div
                    ref={parallaxRef}
                    className="gradient-orb animate-parallax-slow"
                    style={{ width: 500, height: 500, top: '-10%', right: '-10%', background: 'radial-gradient(circle, #d4a017, transparent)' }}
                />
                <div
                    className="gradient-orb animate-float-delayed"
                    style={{ width: 400, height: 400, bottom: '10%', left: '-8%', background: 'radial-gradient(circle, #6f5b3e, transparent)' }}
                />
                <FloatingParticle size="6px" top="15%" left="10%" delay="0s" color="var(--accent-primary)" />
                <FloatingParticle size="4px" top="30%" left="85%" delay="1s" color="var(--accent-primary)" />
                <FloatingParticle size="8px" top="60%" left="20%" delay="2s" color="var(--accent-primary)" />
                <FloatingParticle size="5px" top="75%" left="70%" delay="3s" color="var(--accent-primary)" />
                <FloatingParticle size="3px" top="45%" left="50%" delay="1.5s" color="var(--accent-primary)" />
            </div>

            {/* ===== NAVBAR ===== */}
            <nav
                className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
                style={{
                    backgroundColor: isDark ? 'rgba(13,13,13,0.85)' : 'rgba(253,248,240,0.85)',
                    borderColor: 'var(--border-secondary)',
                }}
            >
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
                            style={{ background: 'linear-gradient(135deg, #6f5b3e, #5a4a32)', color: '#fef9c3' }}
                        >
                            AI
                        </div>
                        <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                            Observability
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <a href="#features" className="text-sm font-medium hover:opacity-75 transition-opacity hidden sm:block" style={{ color: 'var(--text-muted)' }}>Features</a>
                        <a href="#stats" className="text-sm font-medium hover:opacity-75 transition-opacity hidden sm:block" style={{ color: 'var(--text-muted)' }}>Stats</a>
                        <a href="#tech" className="text-sm font-medium hover:opacity-75 transition-opacity hidden sm:block" style={{ color: 'var(--text-muted)' }}>Tech</a>
                        <MagnetButton
                            onClick={() => navigate('/login')}
                            className="px-5 py-2 rounded-lg text-sm font-semibold"
                            style={{
                                background: 'linear-gradient(135deg, #6f5b3e, #5a4a32)',
                                color: '#fef9c3',
                                boxShadow: '0 4px 16px rgba(111,91,62,0.3)',
                            }}
                        >
                            Launch Dashboard
                        </MagnetButton>
                    </div>
                </div>
            </nav>

            {/* ===== HERO SECTION ===== */}
            <section className="relative min-h-screen flex items-center pt-16">
                <div className="max-w-7xl mx-auto px-6 py-20 w-full">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left: Text */}
                        <div>
                            <div
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 animate-fade-in"
                                style={{
                                    backgroundColor: isDark ? 'rgba(212,160,23,0.1)' : 'rgba(111,91,62,0.08)',
                                    color: 'var(--accent-primary)',
                                    border: `1px solid ${isDark ? 'rgba(212,160,23,0.2)' : 'rgba(111,91,62,0.15)'}`,
                                }}
                            >
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Enterprise-Grade AI Monitoring
                            </div>

                            <h1
                                className="text-5xl lg:text-7xl font-extrabold leading-[1.08] mb-6 animate-fade-in-up"
                                style={{ color: 'var(--text-primary)', animationDelay: '0.15s' }}
                            >
                                Every Model.{' '}
                                <span className="shimmer-text">Every Metric.</span>{' '}
                                In Real-Time.
                            </h1>

                            <div
                                className="text-lg mb-4 animate-fade-in-up"
                                style={{ color: 'var(--text-muted)', animationDelay: '0.35s', minHeight: '2em' }}
                            >
                                <TypingText
                                    texts={[
                                        'Monitor ML drift scores across production models',
                                        'Track LLM hallucination rates in real-time',
                                        'Automatic threshold-based alerting and resolution',
                                        'Full governance audit trail for compliance',
                                    ]}
                                />
                            </div>

                            <p
                                className="text-base mb-10 animate-fade-in-up"
                                style={{ color: 'var(--text-muted)', animationDelay: '0.5s' }}
                            >
                                Centralized observability for ML and LLM systems.
                                Built for banking, fintech, and enterprise workloads.
                            </p>

                            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '0.65s' }}>
                                <MagnetButton
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-3.5 rounded-xl text-base font-bold"
                                    style={{
                                        background: 'linear-gradient(135deg, #6f5b3e, #463a27)',
                                        color: '#fef9c3',
                                        boxShadow: '0 8px 32px rgba(111,91,62,0.35)',
                                    }}
                                >
                                    Open Platform
                                </MagnetButton>
                                <MagnetButton
                                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-8 py-3.5 rounded-xl text-base font-semibold"
                                    style={{
                                        backgroundColor: 'transparent',
                                        color: 'var(--accent-primary)',
                                        border: `2px solid var(--accent-primary)`,
                                    }}
                                >
                                    Explore Features
                                </MagnetButton>
                            </div>
                        </div>

                        {/* Right: Animated Dashboard Preview */}
                        <div className="relative animate-fade-in-right" style={{ animationDelay: '0.4s' }}>
                            <TiltCard className="relative z-10">
                                <div
                                    className="rounded-2xl p-6 border"
                                    style={{
                                        backgroundColor: 'var(--bg-card)',
                                        borderColor: 'var(--border-secondary)',
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 0 40px var(--accent-glow)',
                                    }}
                                >
                                    {/* Mini Dashboard Preview */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                                        <span className="text-xs ml-2" style={{ color: 'var(--text-faint)' }}>AI Observability Dashboard</span>
                                    </div>

                                    {/* Mini metric cards */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {[
                                            { label: 'Risk Score', val: '42', color: '#f59e0b' },
                                            { label: 'Active Alerts', val: '7', color: '#ef4444' },
                                            { label: 'System Health', val: '94%', color: '#22c55e' },
                                        ].map((m, i) => (
                                            <div
                                                key={i}
                                                className="rounded-lg p-3 border animate-fade-in-up"
                                                style={{
                                                    backgroundColor: 'var(--bg-tertiary)',
                                                    borderColor: 'var(--border-secondary)',
                                                    animationDelay: `${0.8 + i * 0.15}s`,
                                                }}
                                            >
                                                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{m.label}</p>
                                                <p className="text-xl font-bold mt-1" style={{ color: m.color }}>{m.val}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mini chart (SVG) */}
                                    <div
                                        className="rounded-lg p-4 border"
                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
                                    >
                                        <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>24h Trend</p>
                                        <svg viewBox="0 0 300 80" className="w-full" style={{ opacity: 0.8 }}>
                                            <defs>
                                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#6f5b3e" stopOpacity="0.3" />
                                                    <stop offset="100%" stopColor="#6f5b3e" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <path
                                                d="M0,60 L25,55 L50,45 L75,50 L100,35 L125,40 L150,25 L175,30 L200,20 L225,28 L250,15 L275,22 L300,10"
                                                fill="none"
                                                stroke="#6f5b3e"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                className="animate-draw-line"
                                                style={{ strokeDasharray: 500, strokeDashoffset: 500, animation: 'drawLine 2s ease-out 1s forwards' }}
                                            />
                                            <path
                                                d="M0,60 L25,55 L50,45 L75,50 L100,35 L125,40 L150,25 L175,30 L200,20 L225,28 L250,15 L275,22 L300,10 L300,80 L0,80 Z"
                                                fill="url(#chartGrad)"
                                                className="animate-fade-in"
                                                style={{ animationDelay: '1.5s' }}
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </TiltCard>

                            {/* Glow behind card */}
                            <div
                                className="absolute -inset-4 rounded-3xl -z-10 animate-glow-pulse"
                                style={{
                                    background: 'radial-gradient(ellipse, var(--accent-glow), transparent 70%)',
                                    filter: 'blur(40px)',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== MARQUEE TICKER ===== */}
            <section className="py-6 border-y overflow-hidden" style={{ borderColor: 'var(--border-secondary)' }}>
                <div className="marquee-track">
                    {[...techStack, ...techStack].map((tech, i) => (
                        <span
                            key={i}
                            className="flex-shrink-0 px-8 text-sm font-medium whitespace-nowrap"
                            style={{ color: 'var(--text-faint)' }}
                        >
                            {tech}
                            <span className="mx-6" style={{ color: 'var(--accent-primary)', opacity: 0.3 }}>
                                /
                            </span>
                        </span>
                    ))}
                </div>
            </section>

            {/* ===== FEATURES SECTION ===== */}
            <section id="features" className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div ref={revealRef1} className="reveal text-center mb-16">
                        <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent-primary)' }}>
                            Platform Capabilities
                        </p>
                        <h2 className="text-4xl lg:text-5xl font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>
                            Built for Production AI
                        </h2>
                        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
                            Every component designed with enterprise patterns, efficiency, and real-time data flow in mind.
                        </p>
                    </div>

                    <div ref={revealRef2} className="reveal grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <TiltCard
                                key={i}
                                className="rounded-2xl p-6 border group cursor-default"
                                style={{
                                    backgroundColor: 'var(--bg-card)',
                                    borderColor: 'var(--border-secondary)',
                                    transitionDelay: `${i * 0.05}s`,
                                }}
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(212,160,23,0.1)' : 'rgba(111,91,62,0.08)',
                                        color: 'var(--accent-primary)',
                                    }}
                                >
                                    {f.icon}
                                </div>
                                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                            </TiltCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== STATS SECTION ===== */}
            <section id="stats" className="py-24" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="max-w-7xl mx-auto px-6">
                    <div ref={revealRef3} className="reveal">
                        <p className="text-sm font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--accent-primary)' }}>
                            By the Numbers
                        </p>
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-center mb-16" style={{ color: 'var(--text-primary)' }}>
                            Designed for Scale
                        </h2>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { label: 'Models Monitored', value: 7, suffix: '+' },
                                { label: 'Metrics Tracked', value: 15, suffix: '+' },
                                { label: 'Real-Time Latency', value: 10, suffix: 's' },
                                { label: 'Uptime Target', value: 99, suffix: '.9%' },
                            ].map((stat, i) => (
                                <div
                                    key={i}
                                    className="text-center p-6 rounded-2xl border"
                                    style={{
                                        backgroundColor: 'var(--bg-card)',
                                        borderColor: 'var(--border-secondary)',
                                    }}
                                >
                                    <p className="text-5xl lg:text-6xl font-extrabold mb-2" style={{ color: 'var(--accent-primary)' }}>
                                        <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                    </p>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== ARCHITECTURE SECTION ===== */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div ref={revealRef4} className="reveal">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            {/* Left: Architecture Diagram */}
                            <div
                                className="rounded-2xl p-8 border"
                                style={{
                                    backgroundColor: 'var(--bg-card)',
                                    borderColor: 'var(--border-secondary)',
                                }}
                            >
                                <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--accent-primary)' }}>
                                    Architecture
                                </p>
                                <div className="space-y-4">
                                    {[
                                        { layer: 'Frontend', items: ['React 18', 'TanStack Query', 'ECharts', 'Socket.IO Client'] },
                                        { layer: 'API Layer', items: ['Express.js', 'JWT Auth', 'Rate Limiting', 'Compression'] },
                                        { layer: 'Real-Time', items: ['Socket.IO', 'Event Emitter', 'Cache Invalidation'] },
                                        { layer: 'Data', items: ['MongoDB', 'Time-Series', 'Aggregation', 'Mock Store'] },
                                    ].map((row, ri) => (
                                        <div key={ri} className="flex items-center gap-4">
                                            <span
                                                className="text-xs font-bold w-20 flex-shrink-0 text-right"
                                                style={{ color: 'var(--accent-primary)' }}
                                            >
                                                {row.layer}
                                            </span>
                                            <div className="flex-1 flex flex-wrap gap-2">
                                                {row.items.map((item, ii) => (
                                                    <span
                                                        key={ii}
                                                        className="text-xs px-3 py-1.5 rounded-lg font-medium"
                                                        style={{
                                                            backgroundColor: isDark ? 'rgba(212,160,23,0.08)' : 'rgba(111,91,62,0.06)',
                                                            color: 'var(--text-secondary)',
                                                            border: `1px solid ${isDark ? 'rgba(212,160,23,0.15)' : 'rgba(111,91,62,0.1)'}`,
                                                        }}
                                                    >
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Details */}
                            <div>
                                <h2 className="text-4xl font-extrabold mb-6" style={{ color: 'var(--text-primary)' }}>
                                    Enterprise Architecture
                                </h2>
                                <div className="space-y-6">
                                    {[
                                        { title: 'Modular Backend', desc: 'Each concern — auth, metrics, alerts, governance — lives in its own module. Plug in, swap out.' },
                                        { title: 'Real-Time Pipeline', desc: 'Metrics flow from ingestion to rule evaluation to alert creation to WebSocket broadcast in one cycle.' },
                                        { title: 'Efficient Frontend', desc: 'Selective cache invalidation, memoized components, lazy-loaded charts. Only what changed re-renders.' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div
                                                className="w-1 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: 'var(--accent-primary)' }}
                                            />
                                            <div>
                                                <h4 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== TECH STACK SECTION ===== */}
            <section id="tech" className="py-24" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="max-w-7xl mx-auto px-6">
                    <div ref={revealRef5} className="reveal text-center">
                        <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent-primary)' }}>
                            Technology
                        </p>
                        <h2 className="text-4xl lg:text-5xl font-extrabold mb-16" style={{ color: 'var(--text-primary)' }}>
                            Powered By
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                            {techStack.map((tech, i) => (
                                <TiltCard
                                    key={i}
                                    className="p-5 rounded-xl border text-center"
                                    style={{
                                        backgroundColor: 'var(--bg-card)',
                                        borderColor: 'var(--border-secondary)',
                                    }}
                                >
                                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{tech}</p>
                                </TiltCard>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CTA SECTION ===== */}
            <section className="py-24">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2
                        className="text-4xl lg:text-6xl font-extrabold mb-6"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Ready to Monitor?
                    </h2>
                    <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
                        Sign in with a demo account and explore the full platform. Real-time updates start immediately.
                    </p>
                    <MagnetButton
                        onClick={() => navigate('/login')}
                        className="px-10 py-4 rounded-xl text-lg font-bold"
                        style={{
                            background: 'linear-gradient(135deg, #6f5b3e, #463a27)',
                            color: '#fef9c3',
                            boxShadow: '0 12px 40px rgba(111,91,62,0.4)',
                        }}
                    >
                        Launch Dashboard
                    </MagnetButton>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="py-8 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs"
                            style={{ background: 'linear-gradient(135deg, #6f5b3e, #5a4a32)', color: '#fef9c3' }}
                        >
                            AI
                        </div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                            AI Observability Platform
                        </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                        Built with React, Express, Socket.IO
                    </p>
                </div>
            </footer>

            {/* drawLine keyframe override for SVG */}
            <style>{`
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
        </div>
    );
}
