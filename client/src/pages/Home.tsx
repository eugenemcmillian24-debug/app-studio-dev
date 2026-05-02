"use client";
import { useLocation } from "wouter";
import { Sparkles, Zap, Download, Globe, FileCode2, Database, ArrowRight, Github, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const EXAMPLE_PROMPTS = [
  "A task management SaaS with team collaboration and kanban boards",
  "An e-commerce store for handmade jewelry with Stripe payments",
  "A social platform for book readers with reviews and reading lists",
  "A personal finance dashboard with expense tracking and budgets",
  "A blog platform with markdown editor and SEO optimization",
  "A real-time chat app with channels and direct messages",
];

const FEATURES = [
  {
    icon: FileCode2,
    title: "Multi-File Scaffold",
    desc: "Complete Next.js 14 project with pages, API routes, components, and config — not just snippets.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Database,
    title: "Supabase Schema",
    desc: "Auto-generated SQL migrations with RLS policies, ready to paste into your Supabase SQL editor.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Download,
    title: "Download as ZIP",
    desc: "Get the full project as a .zip file. Run npm install and you're ready to develop locally.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Globe,
    title: "One-Click Vercel Deploy",
    desc: "Pre-wired Deploy to Vercel button. Your app goes live in under 60 seconds — for free.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: FileCode2,
    title: "File Tree Preview",
    desc: "Interactive explorer showing all generated files with syntax-highlighted code preview.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Zap,
    title: "Production-Ready",
    desc: "TypeScript, Tailwind CSS, ESLint, proper env templates, and a complete README included.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "Founder, TechStartup",
    quote: "AppStudio saved us 3 months of development time. We went from idea to MVP in 2 weeks.",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Lead Developer, Agency",
    quote: "The generated code is production-ready. We barely needed to modify anything.",
    avatar: "MJ",
  },
  {
    name: "Lisa Rodriguez",
    role: "Solo Developer",
    quote: "Finally, I can focus on business logic instead of boilerplate. This is a game-changer.",
    avatar: "LR",
  },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const handleStartBuilding = () => {
    if (user) {
      navigate("/studio");
    } else {
      window.location.href = getLoginUrl("/studio");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">AppStudio</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/gallery")}
            className="text-muted-foreground hover:text-foreground">
            Gallery
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")}
            className="text-muted-foreground hover:text-foreground">
            Pricing
          </Button>
          {user ? (
            <Button size="sm" onClick={() => navigate("/studio")}
              className="bg-violet-600 hover:bg-violet-500 text-white">
              Open Studio
            </Button>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.href = getLoginUrl("/")}
              >
                <LogIn className="size-4 mr-2" />
                Sign In
              </Button>
              <Button 
                size="sm" 
                onClick={handleStartBuilding}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                Start Building
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-cyan-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-6">
            <Sparkles className="size-3.5" />
            AI-powered full-stack scaffold generator
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            Build{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              real apps
            </span>
            ,<br />
            not just blueprints
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Describe your app idea and get a complete, production-ready Next.js + Supabase project —
            with all files, SQL schema, and one-click Vercel deployment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={handleStartBuilding}
              className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold px-8 py-6 text-base rounded-xl shadow-lg shadow-violet-900/30"
            >
              <Sparkles className="size-4 mr-2" />
              {user ? "Open Studio" : "Start Building Free"}
              <ArrowRight className="size-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/pricing")}
              className="border-border/50 hover:border-border text-foreground font-semibold px-8 py-6 text-base rounded-xl"
            >
              View Pricing
            </Button>
          </div>

          {/* Example prompts */}
          <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
            {EXAMPLE_PROMPTS.slice(0, 4).map((p, i) => (
              <button
                key={i}
                onClick={handleStartBuilding}
                className="px-3 py-1.5 rounded-full border border-border/50 bg-card/50 text-muted-foreground text-xs hover:border-violet-500/40 hover:text-foreground hover:bg-card transition-all"
              >
                {p.slice(0, 45)}...
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to ship
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From idea to deployed app in minutes. No boilerplate hunting, no configuration hell.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-border/50 bg-card/50 hover:border-border hover:bg-card transition-all group"
              >
                <div className={`size-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`size-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-card/50 border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by developers
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Join thousands of developers who are shipping faster with AppStudio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border/50 bg-background">
                <div className="flex items-center gap-4 mb-4">
                  <div className="size-12 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"{t.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack section */}
      <section className="py-16 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground text-sm uppercase tracking-widest mb-8 font-medium">
            Every generated project includes
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {["Next.js 14", "TypeScript", "Tailwind CSS", "Supabase", "Vercel", "ESLint", "Prettier", "React 18"].map(t => (
              <span key={t} className="px-4 py-2 rounded-xl border border-border/50 bg-card/50 text-sm font-mono text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Start free. Scale as you grow. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { name: "Basic", price: "$3.99", desc: "Try AppStudio" },
              { name: "Starter", price: "$29", desc: "For individuals" },
              { name: "Professional", price: "$99", desc: "For teams", highlighted: true },
              { name: "Enterprise", price: "Custom", desc: "For organizations" },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-2xl border transition-all ${
                  plan.highlighted
                    ? "border-violet-500/50 bg-violet-500/5 ring-2 ring-violet-500/20"
                    : "border-border/50 bg-card/50 hover:border-border hover:bg-card"
                }`}
              >
                <h3 className="font-semibold mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold mb-1">{plan.price}</p>
                <p className="text-sm text-muted-foreground">{plan.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/pricing")}
              className="border-border/50 hover:border-border text-foreground font-semibold px-8 py-6 text-base rounded-xl"
            >
              View Full Pricing
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-8 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-cyan-500/5">
            <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
            <p className="text-muted-foreground mb-8">
              Describe your app and get a complete, deployable project in seconds.
            </p>
            <Button
              size="lg"
              onClick={handleStartBuilding}
              className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold px-10 py-6 text-base rounded-xl"
            >
              <Sparkles className="size-4 mr-2" />
              {user ? "Open Studio" : "Start for Free"}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50 text-center text-muted-foreground text-sm">
        <p>AppStudio — AI-powered full-stack scaffold generator. <a href="/pricing" className="text-violet-400 hover:text-violet-300">Plans start at $3.99/month</a>.</p>
      </footer>
    </div>
  );
}
