/**
 * API Contracts matching architecture.md specification
 */

// ============================================================================
// Audit Contracts
// ============================================================================

export interface CreateAuditRequest {
  site_url: string;
  repo_url?: string;
}

export interface CreateAuditResponse {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface GetAuditResponse {
  id: string;
  site_url: string;
  repo_url?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: AuditResults;
  created_at: string;
  updated_at: string;
}

export interface AuditResults {
  issues: Issue[];
  summary: AuditSummary;
  pr_url?: string;
}

export interface Issue {
  id: string;
  type: 'overflow' | 'spacing' | 'typescale' | 'color' | 'accessibility' | 'design-system';
  severity: 'critical' | 'high' | 'medium' | 'low';
  element: string;
  viewport: string;
  message: string;
  screenshot?: string;
  fix?: IssueFix;
}

export interface IssueFix {
  file: string;
  before: string;
  after: string;
}

export interface AuditSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

// ============================================================================
// Stripe Contracts
// ============================================================================

export interface CreateCheckoutSessionRequest {
  priceId: string;
  type: 'subscription' | 'payment';
}

export interface CreateCheckoutSessionResponse {
  url: string;
}

// ============================================================================
// GitHub Contracts
// ============================================================================

export interface CreatePullRequestRequest {
  repoUrl: string;
  issues: Issue[];
}

export interface CreatePullRequestResponse {
  pr_url: string;
}

// ============================================================================
// Subscription Contracts
// ============================================================================

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'free';
  plan_type: 'free' | 'pro';
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Profile Contracts
// ============================================================================

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
