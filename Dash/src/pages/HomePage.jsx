import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  Eye,
  BarChart3,
  Globe,
  Zap,
  Lock,
  ArrowRight,
  Terminal,
  Network,
} from 'lucide-react';
import HeroFeed from '../components/HeroFeed';

const FEATURES = [
  {
    icon: ShieldAlert,
    title: 'Threat Detection',
    description:
      'Detect brute force attacks, port scans, exploit probes, and lateral movement as they happen on your network.',
  },
  {
    icon: Eye,
    title: 'Live Intrusion Feed',
    description:
      'Watch every connection attempt scroll in real time with severity classification, source IP, and attack type.',
  },
  {
    icon: BarChart3,
    title: 'Top Attackers',
    description:
      'Visual charts ranked by attempt count and color-coded by threat level. Instantly see who is targeting you.',
  },
  {
    icon: Network,
    title: 'Protocol Analysis',
    description:
      'Deep packet inspection classifies TCP, UDP, HTTP, DNS, SSH, and 20+ protocols with byte-level accuracy.',
  },
  {
    icon: Zap,
    title: 'Heuristic Engine',
    description:
      'Six detection rules run client-side: port scan, SSH brute force, RDP scan, SMB lateral, volume anomaly, DNS tunneling.',
  },
  {
    icon: Lock,
    title: 'Attack Classification',
    description:
      'Every attempt is categorized and ranked by severity. Critical threats are highlighted immediately.',
  },
];

const STATS = [
  { value: '6', label: 'Detection rules' },
  { value: '20+', label: 'Protocols classified' },
  { value: '<1s', label: 'Detection latency' },
  { value: '176', label: 'Hosts per scan' },
];

const STEPS = [
  {
    num: '01',
    title: 'Capture',
    desc: 'Run a single CLI command. TrafficLens captures packets on your network interface and discovers every host via ARP scanning.',
    icon: Terminal,
  },
  {
    num: '02',
    title: 'Analyze',
    desc: 'Traffic is classified by protocol. Six heuristic rules detect port scans, brute force, lateral movement, and anomalies.',
    icon: Eye,
  },
  {
    num: '03',
    title: 'Visualize',
    desc: 'Upload to the cloud and open the dashboard. See every threat, every host, every connection -- ranked and color-coded.',
    icon: BarChart3,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 hero-grid opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-primary" />

        <div className="relative max-w-[1440px] mx-auto px-6 pt-16 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-bg-card/60 text-accent text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
                Real-time intrusion detection
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary leading-[1.1] tracking-tight">
                See Every Threat.{' '}
                <span className="text-gradient-accent">Stop It Instantly.</span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed max-w-md">
                TrafficLens monitors every connection on your network. Capture packets,
                detect intrusion patterns, and visualize threats in a single dashboard.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-text-inverse font-semibold rounded-lg transition-all duration-150 no-underline text-sm btn-press"
                >
                  Start Monitoring
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border hover:border-text-secondary text-text-primary font-medium rounded-lg transition-all duration-150 no-underline text-sm btn-press"
                >
                  View Live Demo
                </a>
              </div>
            </div>

            {/* Right — Live feed mockup */}
            <div className="relative">
              <div className="absolute -inset-4 bg-accent/5 rounded-2xl blur-2xl" />
              <div className="relative">
                <HeroFeed />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-bg-card/50">
        <div className="max-w-[1440px] mx-auto px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-accent tracking-tight">{stat.value}</div>
              <div className="mt-1 text-xs text-text-secondary uppercase tracking-wider font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-[1440px] mx-auto px-6 py-20">
        <div className="max-w-2xl mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Everything you need to defend your network
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed">
            From packet capture to threat visualization, one tool covers the entire pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-bg-card border border-border rounded-xl p-5 card-interactive"
            >
              <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center mb-3">
                <feature.icon className="w-4.5 h-4.5 text-accent" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1.5">
                {feature.title}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-border bg-bg-card/30">
        <div className="max-w-[1440px] mx-auto px-6 py-20">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Three steps to full visibility
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-xs font-mono text-text-tertiary uppercase tracking-widest">Step {step.num}</span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* CLI preview */}
          <div className="mt-12 max-w-2xl">
            <div className="rounded-xl border border-border bg-bg-primary overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border">
                <span className="w-2.5 h-2.5 rounded-full bg-critical/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-medium/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-low/60" />
                <span className="text-[11px] font-mono text-text-tertiary ml-2">terminal</span>
              </div>
              <div className="p-4 font-mono text-xs leading-relaxed">
                <div className="text-text-secondary">$ <span className="text-accent">sudo -E python3 -m trafficlens</span> -i wlp0s20f3 -d 30 --upload</div>
                <div className="text-text-tertiary mt-2">Phase 1: Scanning network...</div>
                <div className="text-text-tertiary">Phase 2: Capturing packets... <span className="text-accent">1,956 captured</span></div>
                <div className="text-text-tertiary">Phase 3: Analyzing traffic... <span className="text-low">176 hosts found</span></div>
                <div className="text-text-tertiary">Phase 4: Uploading to backend... <span className="text-low">done</span></div>
                <div className="text-text-secondary mt-2">$ <span className="animate-pulse-dot">_</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="max-w-[1440px] mx-auto px-6 py-20">
        <div className="max-w-2xl mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Built for security teams
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed">
            A dashboard that shows you every hostile connection, categorized, ranked, and analyzed automatically.
          </p>
        </div>

        {/* Dashboard mockup image */}
        <div className="rounded-xl border border-border overflow-hidden bg-bg-card shadow-[var(--shadow-elevated)]">
          <img
            src="/hero-bg.png"
            alt="TrafficLens network visualization showing connected nodes and threat detection"
            className="w-full h-auto object-cover opacity-80"
            loading="lazy"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="max-w-[1440px] mx-auto px-6 py-16">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mb-3">
              See your threats in real time
            </h2>
            <p className="text-text-secondary mb-6">
              Open the dashboard and start monitoring. One command to scan, instant visibility into your network.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-text-inverse font-semibold rounded-lg transition-all duration-150 no-underline text-sm btn-press"
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-[1440px] mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-text-primary">TrafficLens</span>
          </div>
          <p className="text-xs text-text-tertiary">
            Intrusion Detection &mdash; v0.1
          </p>
        </div>
      </footer>
    </div>
  );
}
