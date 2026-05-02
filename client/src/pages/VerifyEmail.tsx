import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, AlertCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setStatus("error");
          setMessage("No verification token provided");
          return;
        }

        // Call verification API
        const response = await fetch("/api/trpc/emailVerification.verifyEmail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
          }),
        });

        if (response.ok) {
          setStatus("success");
          setMessage("Email verified successfully! Redirecting to onboarding...");
          setTimeout(() => {
            navigate("/onboarding");
          }, 2000);
        } else {
          setStatus("error");
          setMessage("Failed to verify email. Please try again.");
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "An error occurred during verification"
        );
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        {status === "loading" && (
          <>
            <Loader className="h-12 w-12 text-violet-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Verifying Email</h1>
            <p className="text-muted-foreground">Please wait while we verify your email address...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button
              onClick={() => navigate("/onboarding")}
              className="w-full bg-violet-600 hover:bg-violet-500"
            >
              Continue to Onboarding
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/")}
                className="w-full bg-violet-600 hover:bg-violet-500"
              >
                Back to Home
              </Button>
              <Button
                onClick={() => navigate("/studio")}
                variant="outline"
                className="w-full"
              >
                Go to Studio
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
