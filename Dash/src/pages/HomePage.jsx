import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  Activity,
  Eye,
  BarChart3,
  Globe,
  Zap,
  Lock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const FEATURES = [
  {
    icon: ShieldAlert,
    title: 'Real-Time Threat Detection',
    description:
      'Monitor incoming connection attempts as they happen. Detect brute force attacks, port scans, SQL injection probes, and more -- before they succeed.',
  },
  {
    icon: Eye,
    title: 'Live Intrusion Feed',
    description:
      'Watch every suspicious connection attempt scroll in real time with threat severity, source IP, target port, and attack classification.',
  },
  {
    icon: BarChart3,
    title: 'Top Attackers Dashboard',
    description:
      'Instantly see which IPs are hitting your system the hardest. Visual bar charts ranked by attempt count and color-coded by threat level.',
  },
  {
    icon: Globe,
    title: 'Geographic Origin Tracking',
    description:
      'Identify where attacks are coming from by country. Spot coordinated campaigns from specific regions targeting your infrastructure.',
  },
  {
    icon: Zap,
    title: 'Automated Blocking',
    description:
      'Threats are automatically classified and blocked. Critical and high-severity attacks are stopped at the firewall level in milliseconds.',
  },
  {
    icon: Lock,
    title: 'Attack Classification',
    description:
      'Every attempt is categorized: brute force, credential stuffing, DDoS, XSS probes, exploit attempts, directory traversal, and more.',
  },
];

const STATS = [
  { value: '4,750+', label: 'Threats blocked daily' },
  { value: '8', label: 'Attack types detected' },
  { value: '<50ms', label: 'Detection latency' },
  { value: '99.9%', label: 'Uptime' },
];

const TESTIMONIALS = [
  {
    quote: 'TrafficLens caught a coordinated brute force campaign from 3 different countries within seconds. Our old IDS took hours.',
    author: 'Security Engineer',
    company: 'Series B Startup',
  },
  {
    quote: 'The live feed is addictive. Being able to watch attacks get blocked in real time gives us confidence our infrastructure is protected.',
    author: 'DevOps Lead',
    company: 'E-commerce Platform',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-[1440px] mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-8">
          <Activity className="w-4 h-4" />
          Real-time intrusion detection for modern infrastructure
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight max-w-4xl mx-auto">
          Know who's trying to
          <span className="text-accent"> break in</span> -- and stop them
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
          TrafficLens monitors every connection attempt to your system in real time.
          Detect brute force attacks, port scans, exploit probes, and DDoS attempts
          before they cause damage.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors no-underline text-base"
          >
            Open Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-bg-card border border-border hover:border-text-secondary text-text-primary font-semibold rounded-xl transition-colors no-underline text-base"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-bg-card">
        <div className="max-w-[1440px] mx-auto px-6 py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-accent">{stat.value}</div>
              <div className="mt-1 text-sm text-text-secondary">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-[1440px] mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
            Everything you need to defend your system
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            A single dashboard that shows you every hostile connection attempt,
            categorized, ranked, and blocked automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-bg-card border border-border rounded-xl p-6 hover:border-accent/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-bg-card">
        <div className="max-w-[1440px] mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
              How TrafficLens works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '01',
                title: 'Monitor',
                desc: 'TrafficLens listens on your network interface and captures every incoming connection attempt to your system.',
              },
              {
                step: '02',
                title: 'Classify',
                desc: 'Each attempt is analyzed and classified by attack type, threat severity, and geographic origin in real time.',
              },
              {
                step: '03',
                title: 'Defend',
                desc: 'Critical threats are blocked instantly. You get a live dashboard showing who is attacking, how, and from where.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-5xl font-bold text-accent/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-[1440px] mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
            Trusted by security teams
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="bg-bg-card border border-border rounded-xl p-6"
            >
              <p className="text-text-primary leading-relaxed italic">"{t.quote}"</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">{t.author}</div>
                  <div className="text-xs text-text-secondary">{t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-bg-card">
        <div className="max-w-[1440px] mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            See your threats in real time
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto">
            Open the dashboard and start monitoring. No setup, no configuration --
            just instant visibility into who's attacking your system.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors no-underline text-base"
          >
            Open Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            <span className="text-sm font-semibold text-text-primary">TrafficLens</span>
          </div>
          <p className="text-xs text-text-secondary">
            Intrusion Detection Dashboard &mdash; v0.1
          </p>
        </div>
      </footer>
    </div>
  );
}
