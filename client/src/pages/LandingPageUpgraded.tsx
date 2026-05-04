import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronRight, Sparkles, Code2, Zap, GitBranch, Rocket, Users, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export default function LandingPageUpgraded() {
  const [, navigate] = useLocation();
  const user = trpc.auth.me.useQuery().data;
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleStartBuilding = () => {
    if (user) {
      navigate("/studio");
    } else {
      const loginUrl = getLoginUrl("/studio");
      if (loginUrl) {
        window.location.href = loginUrl;
      }
    }
  };

  const features = [
    {
      icon: <Code2 className="h-8 w-8" />,
      title: "Full-Stack Generation",
      description: "Complete Next.js projects with TypeScript, Tailwind, and Supabase in seconds",
      color: "from-violet-500 to-purple-500",
    },
    {
      icon: <GitBranch className="h-8 w-8" />,
      title: "GitHub Integration",
      description: "Auto-create repos, 2-way sync, PR management, and issue tracking",
      color: "from-gray-500 to-slate-500",
    },
    {
      icon: <Rocket className="h-8 w-8" />,
      title: "One-Click Deploy",
      description: "Automatic Vercel deployment with custom domains and SSL",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "AI-Powered",
      description: "Describe your app idea and let AI generate production-ready code",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Team Collaboration",
      description: "Share projects, manage permissions, and deploy with approval workflows",
      color: "from-cyan-500 to-blue-500",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Analytics & Monitoring",
      description: "Real-time deployment tracking, performance metrics, and SLA reporting",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const stats = [
    { number: "50K+", label: "Apps Generated", icon: "🚀" },
    { number: "10K+", label: "Active Users", icon: "👥" },
    { number: "99.9%", label: "Uptime", icon: "⚡" },
    { number: "2M+", label: "Deployments", icon: "📊" },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Founder, TechStartup",
      quote: "AppStudio saved us 3 months of development time. We went from idea to MVP in 2 weeks.",
      avatar: "SC",
    },
    {
      name: "Marcus Johnson",
      role: "Lead Developer, Digital Agency",
      quote: "The generated code is production-ready. We barely needed to modify anything.",
      avatar: "MJ",
    },
    {
      name: "Lisa Rodriguez",
      role: "Solo Developer, Freelancer",
      quote: "Finally, I can focus on business logic instead of boilerplate. This is a game-changer.",
      avatar: "LR",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 via-background to-background" />
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          style={{ transform: `translateY(${-scrollY * 0.5}px)` }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/5">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-400">AI-powered full-stack scaffold generator</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Build{" "}
            <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              real apps
            </span>
            ,<br />
            not just blueprints
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Describe your app idea and get a complete, production-ready Next.js project with database schema, API routes, and one-click Vercel deployment.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              onClick={handleStartBuilding}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-8 py-6 text-lg gap-2 group"
            >
              <Sparkles className="h-5 w-5" />
              Start Building Free
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => navigate("/pricing")}
              variant="outline"
              className="px-8 py-6 text-lg gap-2"
            >
              View Pricing
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Demo/Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <p className="text-2xl font-bold">{stat.number}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground">Everything you need to build, deploy, and scale</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                className="p-8 border-border/50 hover:border-violet-500/50 transition-all hover:shadow-lg hover:shadow-violet-500/10 group"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} p-3 mb-4 text-white group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Three simple steps to your production app</p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: 1,
                title: "Describe Your App",
                description: "Write a simple description of your app idea. Include features, tech stack preferences, and any specific requirements.",
                icon: "✍️",
              },
              {
                step: 2,
                title: "AI Generates Code",
                description: "Our AI generates a complete Next.js project with database schema, API routes, UI components, and deployment configuration.",
                icon: "🤖",
              },
              {
                step: 3,
                title: "Deploy Instantly",
                description: "Push to GitHub and deploy to Vercel with one click. Your app is live with a custom domain and SSL certificate.",
                icon: "🚀",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-violet-600 text-white font-bold text-lg">
                    {item.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-2">
                    Step {item.step}: {item.title}
                  </h3>
                  <p className="text-lg text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Developers</h2>
            <p className="text-xl text-muted-foreground">See what users are saying about AppStudio</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="p-8 border-border/50 hover:border-violet-500/50 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 rounded-2xl p-12 border border-violet-500/20">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Build?</h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of developers building production apps with AppStudio
          </p>
          <Button
            onClick={handleStartBuilding}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-8 py-6 text-lg gap-2 group"
          >
            <Sparkles className="h-5 w-5" />
            Start Building Now
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition">Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">About</a></li>
                <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Twitter</a></li>
                <li><a href="#" className="hover:text-foreground transition">GitHub</a></li>
                <li><a href="#" className="hover:text-foreground transition">Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 AppStudio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
