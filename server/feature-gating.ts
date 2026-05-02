/**
 * Feature Gating System
 * Control feature access based on subscription tier
 */

type SubscriptionTier = "starter" | "professional" | "enterprise";

interface FeatureGate {
  name: string;
  tiers: SubscriptionTier[];
  description: string;
  usageMetric?: string;
}

// Define all features and which tiers can access them
export const FEATURE_GATES: Record<string, FeatureGate> = {
  // GitHub Integration Features
  github_basic_integration: {
    name: "Basic GitHub Integration",
    tiers: ["starter", "professional", "enterprise"],
    description: "Link GitHub repositories and auto-deploy",
  },
  github_full_integration: {
    name: "Full GitHub Integration",
    tiers: ["professional", "enterprise"],
    description: "PR/Issue management, webhooks, advanced workflows",
  },
  github_actions_workflows: {
    name: "GitHub Actions Workflow Management",
    tiers: ["professional", "enterprise"],
    description: "Manage and monitor GitHub Actions workflows",
  },

  // Vercel Integration Features
  vercel_single_project: {
    name: "Single Vercel Project",
    tiers: ["starter", "professional", "enterprise"],
    description: "Deploy to one Vercel project",
  },
  vercel_multiple_projects: {
    name: "Multiple Vercel Projects",
    tiers: ["professional", "enterprise"],
    description: "Deploy to multiple Vercel projects",
  },
  vercel_env_management: {
    name: "Environment Variable Management",
    tiers: ["professional", "enterprise"],
    description: "Manage deployment environment variables",
  },

  // Deployment Features
  deployment_monitoring: {
    name: "Deployment Monitoring",
    tiers: ["starter", "professional", "enterprise"],
    description: "Basic deployment status monitoring",
  },
  deployment_advanced_monitoring: {
    name: "Advanced Deployment Monitoring",
    tiers: ["professional", "enterprise"],
    description: "Real-time logs, metrics, and health checks",
  },
  deployment_rollback: {
    name: "Deployment Rollback",
    tiers: ["professional", "enterprise"],
    description: "Rollback to previous deployments",
  },
  deployment_approval_workflows: {
    name: "Deployment Approval Workflows",
    tiers: ["professional", "enterprise"],
    description: "Multi-level approval workflows for deployments",
  },

  // Team & Governance Features
  team_collaboration: {
    name: "Team Collaboration",
    tiers: ["starter", "professional", "enterprise"],
    description: "Basic team member management (up to 3)",
  },
  team_advanced_collaboration: {
    name: "Advanced Team Collaboration",
    tiers: ["professional", "enterprise"],
    description: "Advanced RBAC and team management",
  },
  audit_logging: {
    name: "Audit Logging",
    tiers: ["professional", "enterprise"],
    description: "Comprehensive audit logs and compliance reports",
  },

  // Monitoring & Observability
  health_monitoring: {
    name: "Health Monitoring",
    tiers: ["professional", "enterprise"],
    description: "Real-time health metrics and SLA tracking",
  },
  performance_metrics: {
    name: "Performance Metrics Dashboard",
    tiers: ["professional", "enterprise"],
    description: "Build time, bundle size, and Lighthouse tracking",
  },
  alert_management: {
    name: "Alert Management",
    tiers: ["professional", "enterprise"],
    description: "Customizable alerts and notifications",
  },

  // Cost & Optimization
  cost_tracking: {
    name: "Cost Tracking",
    tiers: ["professional", "enterprise"],
    description: "Track deployment costs and budget",
  },
  cost_optimization: {
    name: "Cost Optimization",
    tiers: ["enterprise"],
    description: "AI-powered cost optimization recommendations",
  },

  // Notifications
  email_notifications: {
    name: "Email Notifications",
    tiers: ["starter", "professional", "enterprise"],
    description: "Email alerts for deployments",
  },
  slack_notifications: {
    name: "Slack/Discord Notifications",
    tiers: ["professional", "enterprise"],
    description: "Send alerts to Slack or Discord",
  },
  custom_webhooks: {
    name: "Custom Webhooks",
    tiers: ["enterprise"],
    description: "Custom webhook integrations",
  },

  // Support
  email_support: {
    name: "Email Support",
    tiers: ["starter", "professional", "enterprise"],
    description: "Email support",
  },
  priority_support: {
    name: "Priority Support",
    tiers: ["professional", "enterprise"],
    description: "Priority email support (2-hour response)",
  },
  dedicated_support: {
    name: "Dedicated Support",
    tiers: ["enterprise"],
    description: "24/7 dedicated support (30-minute response)",
  },
};

/**
 * Check if a feature is available for a tier
 */
export function hasFeatureAccess(tier: SubscriptionTier, feature: string): boolean {
  const gate = FEATURE_GATES[feature];
  if (!gate) {
    console.warn(`Unknown feature: ${feature}`);
    return false;
  }
  return gate.tiers.includes(tier);
}

/**
 * Get all available features for a tier
 */
export function getTierFeatures(tier: SubscriptionTier): string[] {
  return Object.entries(FEATURE_GATES)
    .filter(([, gate]) => gate.tiers.includes(tier))
    .map(([name]) => name);
}

/**
 * Get feature details
 */
export function getFeatureDetails(feature: string): FeatureGate | null {
  return FEATURE_GATES[feature] || null;
}

/**
 * Check if upgrade is needed for feature
 */
export function getRequiredTierForFeature(feature: string): SubscriptionTier | null {
  const gate = FEATURE_GATES[feature];
  if (!gate || gate.tiers.length === 0) {
    return null;
  }
  // Return the minimum tier that has this feature
  const tiers: SubscriptionTier[] = ["starter", "professional", "enterprise"];
  for (const tier of tiers) {
    if (gate.tiers.includes(tier)) {
      return tier;
    }
  }
  return null;
}

/**
 * Get upgrade path for feature
 */
export function getUpgradePathForFeature(
  currentTier: SubscriptionTier,
  feature: string
): SubscriptionTier | null {
  if (hasFeatureAccess(currentTier, feature)) {
    return null; // Already has access
  }

  const requiredTier = getRequiredTierForFeature(feature);
  if (!requiredTier) {
    return null;
  }

  const tiers: SubscriptionTier[] = ["starter", "professional", "enterprise"];
  const currentIndex = tiers.indexOf(currentTier);
  const requiredIndex = tiers.indexOf(requiredTier);

  if (requiredIndex > currentIndex) {
    return requiredTier;
  }

  return null;
}

/**
 * Get all features locked for a tier
 */
export function getLockedFeatures(tier: SubscriptionTier): FeatureGate[] {
  const tiers: SubscriptionTier[] = ["starter", "professional", "enterprise"];
  const tierIndex = tiers.indexOf(tier);

  return Object.values(FEATURE_GATES).filter((gate) => {
    const minTierIndex = Math.min(...gate.tiers.map((t) => tiers.indexOf(t)));
    return minTierIndex > tierIndex;
  });
}

/**
 * Get all features available for upgrade
 */
export function getUpgradableFeatures(tier: SubscriptionTier): FeatureGate[] {
  return getLockedFeatures(tier);
}

/**
 * Get tier comparison
 */
export function getTierComparison(): Record<SubscriptionTier, string[]> {
  return {
    starter: getTierFeatures("starter"),
    professional: getTierFeatures("professional"),
    enterprise: getTierFeatures("enterprise"),
  };
}
