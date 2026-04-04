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

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignIn() {
  const [, setLocation] = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const signInMutation = trpc.auth.signin.useMutation();

  const onSubmit = async (data: SignInForm) => {
    try {
      const result = await signInMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });

      if (result.success) {
        toast.success("Signed in successfully!");
        setTimeout(() => setLocation("/studio"), 1000);
      } else {
        toast.error(result.message || "Sign in failed");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800 backdrop-blur">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-sm text-zinc-400">
              Sign in to your AppStudio account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || signInMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold gap-2"
            >
              {isSubmitting || signInMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
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

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm text-zinc-400">
            Don't have an account?{" "}
            <button
              onClick={() => setLocation("/signup")}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
            >
              Sign Up
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
