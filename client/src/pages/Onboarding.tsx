import React from "react";
import { useLocation } from "wouter";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export default function Onboarding() {
  const [, navigate] = useLocation();

  const handleComplete = () => {
    navigate("/studio");
  };

  const handleSkip = () => {
    navigate("/studio");
  };

  return (
    <OnboardingFlow
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
