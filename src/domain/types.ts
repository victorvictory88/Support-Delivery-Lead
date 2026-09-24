export type CaseKind = "delivery" | "measurement" | "billing" | "policy" | "launch";
export type Severity = "P0" | "P1" | "P2";
export type AgentId =
  | "orchestrator"
  | "intake"
  | "triage"
  | "diagnosis"
  | "trust"
  | "response"
  | "insights";
export type FindingCode =
  | "payment_failure"
  | "measurement_discrepancy"
  | "billing_model_misread"
  | "landing_page_access"
  | "launch_readiness_gap"
  | "insufficient_evidence";

export interface Evidence {
  id: string;
  label: string;
  source: string;
  observedAt: string;
  detail: string;
}

interface CaseBase {
  id: string;
  title: string;
  customer: string;
  summary: string;
  openedAt: string;
  affectedAccounts: number;
  exposureUsd: number;
  deadlineMinutes: number;
  evidence: Evidence[];
  trend: number[];
  expectedFinding: FindingCode;
}

export interface DeliveryCase extends CaseBase {
  kind: "delivery";
  signals: {
    priorImpressions: number;
    currentImpressions: number;
    paymentState: "healthy" | "failed";
    adState: "serving" | "not_serving";
    budgetRemainingUsd: number;
    recentChange: string;
  };
}

export interface MeasurementCase extends CaseBase {
  kind: "measurement";
  signals: {
    adsManagerClicks: number;
    siteSessions: number;
    utmPresent: boolean;
    attributionWindowDays: number;
    reportAgeHours: number;
  };
}

export interface BillingCase extends CaseBase {
  kind: "billing";
  signals: {
    objective: "views" | "clicks" | "conversions";
    billingMode: "impression" | "click";
    chargedEvents: number;
    conversions: number;
    invoiceUsd: number;
    dailyBudgetUsd: number;
  };
}

export interface PolicyCase extends CaseBase {
  kind: "policy";
  signals: {
    adState: "approved" | "rejected";
    landingPageReachable: boolean;
    reviewRequested: boolean;
    rejectionCode: string;
  };
}

export interface LaunchCase extends CaseBase {
  kind: "launch";
  signals: {
    daysToLaunch: number;
    runbookReady: boolean;
    routingTested: boolean;
    rollbackReady: boolean;
    knownIssues: number;
  };
}

export type SupportCase = DeliveryCase | MeasurementCase | BillingCase | PolicyCase | LaunchCase;

export interface Diagnosis {
  code: FindingCode;
  title: string;
  explanation: string;
  confidence: number;
  evidenceIds: string[];
  nextCheck: string;
}

export interface TraceStep {
  id: AgentId;
  label: string;
  summary: string;
  detail: string;
  evidenceIds: string[];
  status: "complete" | "review";
  durationMs: number;
}

export interface HumanGate {
  required: boolean;
  reason: string;
  reviewer: string;
}

export type ActionStatus = "in_record" | "next" | "waiting" | "conditional" | "review";

export interface ActionStep {
  status: ActionStatus;
  owner: string;
  action: string;
  proof: string;
  evidenceIds: string[];
}

export interface ActionPlan {
  decision: string;
  update: string;
  closure: string;
  steps: ActionStep[];
}

export interface RunResult {
  caseId: string;
  severity: Severity;
  route: string;
  diagnosis: Diagnosis;
  trace: TraceStep[];
  gate: HumanGate;
  actionPlan: ActionPlan;
  responseDraft: string;
  operationalInsight: string;
  evidenceCoverage: number;
  automationTimeMs: number;
}
