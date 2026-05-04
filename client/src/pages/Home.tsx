import React, { useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, Zap, Github, Gitlab, ArrowRight, Check, Users, Rocket, TrendingUp, Shield, Zap as ZapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");

  const handleGetStarted = () => {
    if (user) {
      navigate("/studio");
    } else {
      navigate(getLoginUrl("/studio"));
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Generation",
      description: "Describe your app idea and get a complete, production-ready codebase in seconds",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Github,
      title: "GitHub Integration",
      description: "Auto-create repos, manage PRs, and sync changes bidirectionally with your GitHub account",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Rocket,
      title: "Vercel Deployment",
      description: "One-click deployment to Vercel with automatic updates on every push",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Track user signups, feature adoption, deployment success rates, and revenue metrics",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Role-based access control, audit logging, and compliance reporting for teams",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: ZapIcon,
      title: "Real-time Monitoring",
      description: "Live deployment logs, performance metrics, and instant alerts for issues",
      color: "from-yellow-500 to-orange-500",
    },
  ];

  const plans = [
    {
      name: "Basic",
      price: "$3.99",
      period: "/month",
      description: "Perfect for trying out AppStudio",
      features: [
        "1 AI-generated app per month",
        "Basic GitHub integration",
        "Manual deployments",
        "Community support",
        "5 team members",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "For individual developers",
      features: [
        "10 AI-generated apps per month",
        "Full GitHub/Vercel integration",
        "Auto-deployment on push",
        "Analytics dashboard",
        "Email support",
        "Unlimited team members",
        "Custom domain support",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Professional",
      price: "$99",
      period: "/month",
      description: "For growing teams",
      features: [
        "Unlimited AI-generated apps",
        "Advanced GitHub Actions integration",
        "Performance monitoring",
        "Custom webhooks",
        "Priority support",
        "Team collaboration tools",
        "Advanced analytics",
        "API access",
      ],
      cta: "Upgrade Now",
      highlighted: false,
    },
    {
      name: "Enterprise",
      price: "$299",
      period: "/month",
      description: "For large organizations",
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantee",
        "Advanced security features",
        "White-label options",
        "On-premise deployment",
        "24/7 phone support",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Startup Founder",
      content: "AppStudio cut our development time by 80%. We went from idea to deployed app in hours, not weeks.",
      avatar: "SC",
    },
    {
      name: "James Wilson",
      role: "Lead Developer",
      content: "The GitHub integration is seamless. Our entire workflow is now automated and we have zero deployment issues.",
      avatar: "JW",
    },
    {
      name: "Maria Garcia",
      role: "Product Manager",
      content: "The analytics dashboard gives us insights we never had before. We can make data-driven decisions instantly.",
      avatar: "MG",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            <span className="text-2xl font-bold text-white">AppStudio</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
            <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
            {user ? (
              <Button onClick={() => navigate("/studio")} className="bg-purple-600 hover:bg-purple-700">
                Open Studio
              </Button>
            ) : (
              <Button onClick={handleGetStarted} className="bg-purple-600 hover:bg-purple-700">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-purple-300">AI-Powered App Generation</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Build Real Apps,<br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              Not Just Blueprints
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Describe your app idea and get a complete, production-ready codebase with GitHub integration and Vercel deployment — all in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/gallery")}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              View Gallery
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 border-t border-gray-800">
            <div>
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-gray-400">Apps Generated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-gray-400">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-400">Everything you need to build and deploy production apps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="p-6 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition group">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} p-3 mb-4 group-hover:scale-110 transition`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-400">Choose the perfect plan for your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg p-8 transition ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-purple-600/20 to-purple-600/5 border-2 border-purple-500 scale-105"
                    : "bg-slate-800/50 border border-slate-700"
                }`}
              >
                {plan.highlighted && (
                  <div className="mb-4 inline-block px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-sm text-purple-300">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <Button
                  className={`w-full mb-6 ${
                    plan.highlighted
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                  onClick={handleGetStarted}
                >
                  {plan.cta}
                </Button>
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Loved by Developers</h2>
            <p className="text-xl text-gray-400">See what our users are saying</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="p-6 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-300">{testimonial.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-12 border border-purple-500/20">
          <h2 className="text-4xl font-bold text-white">Ready to Build Your Next App?</h2>
          <p className="text-xl text-gray-300">Join thousands of developers using AppStudio to build production apps in minutes.</p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2"
          >
            <Sparkles className="h-5 w-5" />
            Start Building Now
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            <span className="text-lg font-bold text-white">AppStudio</span>
          </div>
          <div className="text-gray-400 text-sm">
            © 2026 AppStudio. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
