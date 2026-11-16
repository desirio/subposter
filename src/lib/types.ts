export interface SubstackPost {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  content: string;
  author?: string;
}

export type TweetFormat = 'single' | 'thread';
export type TweetTone = 'casual' | 'professional' | 'witty' | 'inspirational';

export interface TweetVariant {
  id: string;
  format: TweetFormat;
  label: string;
  tweets: string[]; // single tweet = array of 1, thread = array of N
}

export interface GenerateRequest {
  post: SubstackPost;
  formats: TweetFormat[];
  tone: TweetTone;
  includeLink: boolean;
}

export interface GenerateResponse {
  variants: TweetVariant[];
  error?: string;
}

export interface PostTweetRequest {
  tweets: string[];
  format: TweetFormat;
}

export interface PostTweetResponse {
  success: boolean;
  tweetId?: string;
  error?: string;
}

export interface PostThreadsRequest {
  tweets: string[];
  format: TweetFormat;
}

export interface PostThreadsResponse {
  success: boolean;
  threadId?: string;
  error?: string;
}

export interface PostLinkedInRequest {
  tweets: string[];
  format: TweetFormat;
}

export interface PostLinkedInResponse {
  success: boolean;
  postId?: string;
  error?: string;
}

// --- Agent types ---

export type ContentStatus = 'draft' | 'approved' | 'posted' | 'rejected';

export interface Skill {
  name: string;
  description: string;
  triggers: string[];
  body: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  generatedContent?: GeneratedContent[];
  timestamp: number;
}

export interface GeneratedContent {
  id: string;
  variants: ContentVariant[];
  sourceArticle?: { title: string; link: string };
  skill: string;
}

export interface ContentVariant extends TweetVariant {
  status: ContentStatus;
  platform?: 'x' | 'threads' | 'linkedin';
}

export interface AgentChatRequest {
  message: string;
  sessionId?: string;
  context?: {
    selectedPost?: SubstackPost;
    substackUrl?: string;
  };
}

export interface AgentChatResponse {
  message: AgentMessage;
  sessionId: string;
  error?: string;
}

// --- Onboarding types ---

export type PricingPlan = 'starter' | 'plus' | 'pro';
export type BillingInterval = 'monthly' | 'annual';
export type OnboardingStep = 1 | 2 | 3 | 4;

export interface UsageLimits {
  articlesPerMonth: number;
  chatMessagesPerMonth: number;
  socialAccounts: number;
  users: number;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  substack_url: string | null;
  content_focus: string | null;
  selected_plan: PricingPlan;
  billing_interval: BillingInterval;
  onboarding_completed: boolean;
  onboarding_step: OnboardingStep;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  articles_used: number;
  chat_messages_used: number;
  usage_reset_at: string;
  created_at: string;
  updated_at: string;
}
