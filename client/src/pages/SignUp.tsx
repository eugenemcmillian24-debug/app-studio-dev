import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [, setLocation] = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  const signUpMutation = trpc.auth.signup.useMutation();

  const onSubmit = async (data: SignUpForm) => {
    try {
      const result = await signUpMutation.mutateAsync({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (result.success) {
        toast.success("Account created! Redirecting to login...");
        setTimeout(() => setLocation("/signin"), 1500);
      } else {
        toast.error(result.message || "Sign up failed");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign up failed";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800 backdrop-blur">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-sm text-zinc-400">
              Join AppStudio and start building full-stack apps
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-zinc-300">
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register("name")}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              {errors.name && (
                <p className="text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-zinc-300">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-zinc-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm text-zinc-300">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || signUpMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold gap-2"
            >
              {isSubmitting || signUpMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-700" />
            <span className="text-xs text-zinc-500">OR</span>
            <div className="flex-1 h-px bg-zinc-700" />
          </div>

          {/* OAuth */}
          <Button
            variant="outline"
            className="w-full border-zinc-700 hover:bg-zinc-800/50 text-zinc-300"
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
          >
            Continue with Manus
          </Button>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <button
              onClick={() => setLocation("/signin")}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
