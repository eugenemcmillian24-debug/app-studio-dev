/**
 * Email Verification & Onboarding Router
 * Handle email verification, onboarding flow, and user activation
 */

import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import crypto from "crypto";

interface VerificationToken {
  token: string;
  email: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

interface OnboardingStep {
  id: string;
  userId: string;
  step: number;
  completed: boolean;
  completedAt?: Date;
  skipped: boolean;
}

interface OnboardingProgress {
  userId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  progress: number;
  lastUpdated: Date;
}

// In-memory storage (in production, use database)
const verificationTokens = new Map<string, VerificationToken>();
const onboardingProgress = new Map<string, OnboardingProgress>();
const completedSteps = new Map<string, OnboardingStep[]>();

const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "Welcome to AppStudio",
    description: "Get started with your AI-powered scaffold generator",
    duration: 2,
  },
  {
    id: "features",
    title: "Explore Key Features",
    description: "Learn about multi-file scaffolds, Supabase schemas, and Vercel deployment",
    duration: 5,
  },
  {
    id: "templates",
    title: "Browse Templates",
    description: "Discover pre-built templates for common app types",
    duration: 3,
  },
  {
    id: "first-generation",
    title: "Generate Your First App",
    description: "Create your first app using a simple prompt",
    duration: 10,
  },
  {
    id: "github-setup",
    title: "Connect GitHub",
    description: "Link your GitHub account for seamless integration",
    duration: 5,
  },
  {
    id: "deployment",
    title: "Deploy to Vercel",
    description: "Deploy your generated app with one click",
    duration: 3,
  },
];

export const emailVerificationRouter = router({
  /**
   * Send verification email
   */
  sendVerificationEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Generate verification token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const verificationToken: VerificationToken = {
          token,
          email: input.email,
          expiresAt,
          verified: false,
          createdAt: new Date(),
        };

        verificationTokens.set(token, verificationToken);

        // In production, send actual email
        const verificationUrl = `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;

        console.log(`[Email] Verification email sent to ${input.email}`);
        console.log(`[Email] Verification URL: ${verificationUrl}`);

        return {
          success: true,
          message: "Verification email sent",
          token, // For testing only
        };
      } catch (error) {
        throw new Error(
          `Failed to send verification email: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Verify email token
   */
  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const verificationToken = verificationTokens.get(input.token);

        if (!verificationToken) {
          throw new Error("Invalid verification token");
        }

        if (new Date() > verificationToken.expiresAt) {
          throw new Error("Verification token has expired");
        }

        verificationToken.verified = true;

        return {
          success: true,
          email: verificationToken.email,
          message: "Email verified successfully",
        };
      } catch (error) {
        throw new Error(
          `Failed to verify email: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Check email verification status
   */
  checkVerificationStatus: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .query(async ({ input }) => {
      try {
        const token = Array.from(verificationTokens.values()).find(
          (t) => t.email === input.email && t.verified
        );

        return {
          verified: !!token,
          email: input.email,
        };
      } catch (error) {
        throw new Error(
          `Failed to check verification status: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get onboarding steps
   */
  getOnboardingSteps: protectedProcedure.query(async () => {
    try {
      return {
        steps: ONBOARDING_STEPS,
        totalSteps: ONBOARDING_STEPS.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to get onboarding steps: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Get onboarding progress
   */
  getOnboardingProgress: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = String(ctx.user?.id);
      let progress = onboardingProgress.get(userId);

      if (!progress) {
        progress = {
          userId,
          currentStep: 0,
          totalSteps: ONBOARDING_STEPS.length,
          completedSteps: 0,
          progress: 0,
          lastUpdated: new Date(),
        };
        onboardingProgress.set(userId, progress);
      }

      const userSteps = completedSteps.get(userId) || [];

      return {
        ...progress,
        completedSteps: userSteps.filter((s) => s.completed).length,
        progress: Math.round(
          (userSteps.filter((s) => s.completed).length / ONBOARDING_STEPS.length) * 100
        ),
        steps: ONBOARDING_STEPS.map((step, idx) => ({
          ...step,
          completed: userSteps.some((s) => s.step === idx && s.completed),
          skipped: userSteps.some((s) => s.step === idx && s.skipped),
        })),
      };
    } catch (error) {
      throw new Error(
        `Failed to get onboarding progress: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Complete onboarding step
   */
  completeOnboardingStep: protectedProcedure
    .input(
      z.object({
        stepIndex: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id);
        const userSteps = completedSteps.get(userId) || [];

        const existingStep = userSteps.find((s) => s.step === input.stepIndex);

        if (existingStep) {
          existingStep.completed = true;
          existingStep.completedAt = new Date();
        } else {
          userSteps.push({
            id: `step_${input.stepIndex}_${Date.now()}`,
            userId,
            step: input.stepIndex,
            completed: true,
            completedAt: new Date(),
            skipped: false,
          });
        }

        completedSteps.set(userId, userSteps);

        const progress = onboardingProgress.get(userId);
        if (progress) {
          progress.currentStep = input.stepIndex + 1;
          progress.lastUpdated = new Date();
        }

        return {
          success: true,
          message: `Step ${input.stepIndex + 1} completed`,
        };
      } catch (error) {
        throw new Error(
          `Failed to complete onboarding step: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Skip onboarding step
   */
  skipOnboardingStep: protectedProcedure
    .input(
      z.object({
        stepIndex: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id);
        const userSteps = completedSteps.get(userId) || [];

        const existingStep = userSteps.find((s) => s.step === input.stepIndex);

        if (existingStep) {
          existingStep.skipped = true;
        } else {
          userSteps.push({
            id: `step_${input.stepIndex}_${Date.now()}`,
            userId,
            step: input.stepIndex,
            completed: false,
            skipped: true,
          });
        }

        completedSteps.set(userId, userSteps);

        return {
          success: true,
          message: `Step ${input.stepIndex + 1} skipped`,
        };
      } catch (error) {
        throw new Error(
          `Failed to skip onboarding step: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Complete entire onboarding
   */
  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const userId = String(ctx.user?.id);

      const progress = onboardingProgress.get(userId);
      if (progress) {
        progress.currentStep = ONBOARDING_STEPS.length;
        progress.lastUpdated = new Date();
      }

      return {
        success: true,
        message: "Onboarding completed",
      };
    } catch (error) {
      throw new Error(
        `Failed to complete onboarding: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Get onboarding templates
   */
  getOnboardingTemplates: protectedProcedure.query(async () => {
    try {
      const templates = [
        {
          id: "task-manager",
          name: "Task Management SaaS",
          description: "Team collaboration with kanban boards",
          icon: "CheckSquare",
          category: "productivity",
          difficulty: "beginner",
          estimatedTime: "5 minutes",
        },
        {
          id: "ecommerce",
          name: "E-commerce Store",
          description: "Product catalog with Stripe payments",
          icon: "ShoppingCart",
          category: "commerce",
          difficulty: "intermediate",
          estimatedTime: "10 minutes",
        },
        {
          id: "social-platform",
          name: "Social Platform",
          description: "User profiles, feeds, and messaging",
          icon: "Users",
          category: "social",
          difficulty: "advanced",
          estimatedTime: "15 minutes",
        },
        {
          id: "analytics-dashboard",
          name: "Analytics Dashboard",
          description: "Real-time data visualization",
          icon: "BarChart3",
          category: "analytics",
          difficulty: "intermediate",
          estimatedTime: "8 minutes",
        },
        {
          id: "blog-platform",
          name: "Blog Platform",
          description: "Markdown editor with SEO optimization",
          icon: "BookOpen",
          category: "content",
          difficulty: "beginner",
          estimatedTime: "6 minutes",
        },
        {
          id: "chat-app",
          name: "Chat Application",
          description: "Real-time messaging with channels",
          icon: "MessageCircle",
          category: "communication",
          difficulty: "advanced",
          estimatedTime: "12 minutes",
        },
      ];

      return {
        templates,
      };
    } catch (error) {
      throw new Error(
        `Failed to get templates: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Get success stories
   */
  getSuccessStories: protectedProcedure.query(async () => {
    try {
      const stories = [
        {
          id: "story-1",
          name: "Sarah Chen",
          company: "TechStartup",
          role: "Founder",
          quote:
            "AppStudio saved us 3 months of development time. We went from idea to MVP in 2 weeks.",
          metric: "3 months saved",
          avatar: "SC",
        },
        {
          id: "story-2",
          name: "Marcus Johnson",
          company: "Digital Agency",
          role: "Lead Developer",
          quote:
            "The generated code is production-ready. We barely needed to modify anything.",
          metric: "80% less code",
          avatar: "MJ",
        },
        {
          id: "story-3",
          name: "Lisa Rodriguez",
          company: "Solo Developer",
          role: "Freelancer",
          quote:
            "Finally, I can focus on business logic instead of boilerplate. This is a game-changer.",
          metric: "5x faster",
          avatar: "LR",
        },
      ];

      return {
        stories,
      };
    } catch (error) {
      throw new Error(
        `Failed to get success stories: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),
});
