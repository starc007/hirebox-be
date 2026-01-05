export type PlanType = "free" | "basic" | "pro";

export type PlanConfig = {
  name: string;
  maxGmailAccounts: number; // -1 for unlimited
  features: {
    emailScanning: boolean;
    aiClassification: boolean;
    autoReplies: boolean;
    interviewScheduling: boolean;
    analytics: boolean;
  };
};

export const plans: Record<PlanType, PlanConfig> = {
  free: {
    name: "Free",
    maxGmailAccounts: 1,
    features: {
      emailScanning: true,
      aiClassification: false,
      autoReplies: false,
      interviewScheduling: false,
      analytics: false,
    },
  },
  basic: {
    name: "Basic",
    maxGmailAccounts: 5,
    features: {
      emailScanning: true,
      aiClassification: true,
      autoReplies: true,
      interviewScheduling: true,
      analytics: false,
    },
  },
  pro: {
    name: "Pro",
    maxGmailAccounts: -1, // Unlimited
    features: {
      emailScanning: true,
      aiClassification: true,
      autoReplies: true,
      interviewScheduling: true,
      analytics: true,
    },
  },
};

export function getPlanConfig(planType: PlanType): PlanConfig {
  return plans[planType] || plans.free;
}

export function canAddGmailAccount(
  planType: PlanType,
  currentAccountCount: number
): boolean {
  const plan = getPlanConfig(planType);

  if (plan.maxGmailAccounts === -1) {
    return true; // Unlimited
  }

  return currentAccountCount < plan.maxGmailAccounts;
}

export function getMaxGmailAccounts(planType: PlanType): number {
  const plan = getPlanConfig(planType);
  return plan.maxGmailAccounts;
}
