import React, { useState, useEffect } from "react";
import { ChevronRight, CheckCircle2, SkipForward, BookOpen, Zap, Github, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  duration: number;
  icon?: React.ReactNode;
  content?: React.ReactNode;
}

interface OnboardingFlowProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

const STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to AppStudio",
    description: "Your AI-powered full-stack scaffold generator",
    duration: 2,
    icon: <Sparkles className="h-12 w-12 text-violet-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-lg text-muted-foreground">
          AppStudio generates complete, production-ready applications from simple text descriptions.
        </p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span>Full Next.js 14 projects with TypeScript</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span>Supabase database schemas with migrations</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span>One-click Vercel deployment</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "features",
    title: "Key Features",
    description: "Explore what AppStudio can do",
    duration: 5,
    icon: <Zap className="h-12 w-12 text-yellow-500" />,
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-border/50 bg-card/50">
          <h4 className="font-semibold mb-2">Multi-File Scaffold</h4>
          <p className="text-sm text-muted-foreground">
            Complete project structure with pages, API routes, components, and configuration.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border/50 bg-card/50">
          <h4 className="font-semibold mb-2">Database Schema</h4>
          <p className="text-sm text-muted-foreground">
            Auto-generated SQL migrations with RLS policies and relationships.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border/50 bg-card/50">
          <h4 className="font-semibold mb-2">GitHub Integration</h4>
          <p className="text-sm text-muted-foreground">
            Automatic repository creation and 2-way sync with your codebase.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border/50 bg-card/50">
          <h4 className="font-semibold mb-2">Deployment Ready</h4>
          <p className="text-sm text-muted-foreground">
            One-click deployment to Vercel with environment configuration.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "templates",
    title: "Browse Templates",
    description: "Start with pre-built templates",
    duration: 3,
    icon: <BookOpen className="h-12 w-12 text-cyan-500" />,
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          "Task Management SaaS",
          "E-commerce Store",
          "Social Platform",
          "Analytics Dashboard",
          "Blog Platform",
          "Chat Application",
        ].map((template) => (
          <button
            key={template}
            className="p-3 rounded-lg border border-border/50 bg-card/50 hover:border-violet-500/50 hover:bg-card transition-all text-left"
          >
            <p className="font-medium text-sm">{template}</p>
          </button>
        ))}
      </div>
    ),
  },
  {
    id: "first-generation",
    title: "Generate Your First App",
    description: "Create your first application",
    duration: 10,
    icon: <Sparkles className="h-12 w-12 text-purple-500" />,
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <p className="font-semibold mb-2">Try this prompt:</p>
          <p className="text-sm text-muted-foreground italic">
            "A task management app with teams, projects, and kanban boards. Include user authentication, real-time updates, and Stripe billing."
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Simply describe your app idea and AppStudio will generate a complete, ready-to-deploy project in seconds.
        </p>
      </div>
    ),
  },
  {
    id: "github-setup",
    title: "Connect GitHub",
    description: "Link your GitHub account",
    duration: 5,
    icon: <Github className="h-12 w-12 text-gray-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Connect your GitHub account to enable automatic repository creation and 2-way sync.
        </p>
        <div className="p-4 rounded-lg border border-border/50 bg-card/50">
          <h4 className="font-semibold mb-2">Benefits:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ Auto-create repositories for generated apps</li>
            <li>✓ Sync changes between AppStudio and GitHub</li>
            <li>✓ Manage pull requests and issues</li>
            <li>✓ Track deployment history</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "deployment",
    title: "Deploy to Vercel",
    description: "Go live in seconds",
    duration: 3,
    icon: <Rocket className="h-12 w-12 text-orange-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Deploy your generated app to Vercel with a single click. Your app will be live with a custom domain.
        </p>
        <div className="p-4 rounded-lg border border-border/50 bg-card/50">
          <h4 className="font-semibold mb-2">What you get:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ Global CDN distribution</li>
            <li>✓ Automatic SSL certificates</li>
            <li>✓ Environment variable management</li>
            <li>✓ Deployment history and rollbacks</li>
          </ul>
        </div>
      </div>
    ),
  },
];

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const step = STEPS[currentStep];
  const progress = ((completedSteps.length + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSkip?.();
    }
  };

  const handleSkipAll = () => {
    onSkip?.();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Get Started with AppStudio</h1>
            <button
              onClick={handleSkipAll}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip all
            </button>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>

        {/* Content */}
        <Card className="p-8 mb-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {step.icon}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2">{step.title}</h2>
          <p className="text-center text-muted-foreground mb-8">{step.description}</p>

          {/* Content */}
          <div className="mb-8">
            {step.content}
          </div>

          {/* Duration */}
          <div className="text-center text-sm text-muted-foreground mb-8">
            ⏱️ This step takes about {step.duration} minutes
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={handleSkip}
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip this step
            </Button>
            <Button
              onClick={handleNext}
              className="bg-violet-600 hover:bg-violet-500"
            >
              {currentStep === STEPS.length - 1 ? "Complete" : "Next"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Step indicators */}
        <div className="flex gap-2 justify-center flex-wrap">
          {STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep
                  ? "bg-violet-600 w-8"
                  : completedSteps.includes(idx)
                    ? "bg-green-500 w-2"
                    : "bg-muted w-2"
              }`}
              title={STEPS[idx].title}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
