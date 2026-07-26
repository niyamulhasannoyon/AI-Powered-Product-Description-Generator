export type SubscriptionPlan = 'free' | 'pro' | 'business';

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  stripeCustomerId?: string | null;
  plan: SubscriptionPlan;
  createdAt: Date;
}

export interface SubscriptionDetails {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  plan: SubscriptionPlan;
  currentPeriodEnd: Date;
}

export interface ProductItem {
  id: string;
  userId: string;
  imageUrl: string;
  keywords: string[];
  language: string;
  generatedTitle?: string | null;
  generatedDescription?: string | null;
  generatedTags: string[];
  promptTemplateId?: string | null;
  createdAt: Date;
}

export interface PromptTemplateItem {
  id: string;
  userId: string;
  name: string;
  templateText: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface UsageLogItem {
  id: string;
  userId: string;
  action: 'generate' | 'export';
  tokensUsed: number;
  createdAt: Date;
}

export interface GenerateDescriptionInput {
  imageUrl?: string;
  keywords: string[];
  productName?: string;
  category?: string;
  tone?: 'professional' | 'persuasive' | 'casual' | 'witty' | 'luxury';
  targetAudience?: string;
  language?: string;
  promptTemplateId?: string;
}

export interface GenerateDescriptionOutput {
  title: string;
  shortDescription: string;
  longDescription: string;
  bulletPoints: string[];
  seoTags: string[];
  metaTitle: string;
  metaDescription: string;
}

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
