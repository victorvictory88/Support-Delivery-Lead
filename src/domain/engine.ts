import type {
  Diagnosis,
  FindingCode,
  RunResult,
  Severity,
  SupportCase,
  TraceStep,
} from "./types.ts";
import { buildActionPlan } from "./actionPlan.ts";

const AGENT_LABELS = {
  orchestrator: "Orchestrator",
  intake: "Intake agent",
  triage: "Triage agent",
  diagnosis: "Diagnosis agent",
  trust: "Trust gate",
  response: "Response agent",
  insights: "Insights agent",
} as const;

function diagnose(item: SupportCase): Diagnosis {
  switch (item.kind) {
    case "delivery":
      return item.signals.paymentState === "failed" && item.signals.adState === "not_serving"
        ? {
            code: "payment_failure",
            title: "Payment failure stopped serving",
            explanation:
              "The payment attempt failed before serving stopped. Budget remains available, so the payment state is the strongest lead.",
            confidence: 0.94,
            evidenceIds: ["DEL-1", "DEL-2", "DEL-3"],
            nextCheck:
              "Confirm the payment state and serving recovery after the advertiser updates payment details.",
          }
        : insufficient("Confirm payment, budget, and serving state before assigning a cause.");
    case "measurement":
      return item.signals.adsManagerClicks > item.signals.siteSessions
        ? {
            code: "measurement_discrepancy",
            title: "Clicks and sessions need reconciliation",
            explanation:
              "Clicks and site sessions count different events, and these reports disagree. Missing URL tags weaken campaign attribution but cannot explain the total session gap on their own. Match report settings, then check redirects, consent, and analytics capture before assigning a cause.",
            confidence: 0.62,
            evidenceIds: ["MEA-1", "MEA-2", "MEA-3"],
            nextCheck:
              "Align the account, campaign, date range, time zone, and filters; then test redirects and analytics capture.",
          }
        : insufficient("Verify the report settings and confirm that a discrepancy remains.");
    case "billing":
      return item.signals.objective === "conversions" && item.signals.billingMode === "click"
        ? {
            code: "billing_model_misread",
            title: "Optimization and billing are different",
            explanation:
              "The campaign optimizes toward conversions while its selected billing mode charges valid clicks. A billing specialist should confirm the invoice before any customer commitment.",
            confidence: 0.91,
            evidenceIds: ["BIL-1", "BIL-2", "BIL-3"],
            nextCheck:
              "Have billing reconcile invoice line items and confirm the configured buying mode.",
          }
        : insufficient("Reconcile the invoice with configured billing terms.");
    case "policy":
      return item.signals.adState === "rejected" && !item.signals.landingPageReachable
        ? {
            code: "landing_page_access",
            title: "Landing page access blocked review",
            explanation:
              "The review record and crawler check point to an inaccessible landing page. The team should route the case through the established review process without promising an exception.",
            confidence: 0.9,
            evidenceIds: ["POL-1", "POL-2", "POL-3"],
            nextCheck:
              "Ask the advertiser to restore crawler access, then route any appeal to policy review.",
          }
        : insufficient("Review the rejection code and page access before advising the buyer.");
    case "launch":
      return !item.signals.runbookReady || !item.signals.rollbackReady
        ? {
            code: "launch_readiness_gap",
            title: "Support readiness needs a decision",
            explanation:
              "The runbook is incomplete and rollback remains untested. These gaps require an owner and a launch decision before broad rollout.",
            confidence: 0.96,
            evidenceIds: ["LAU-1", "LAU-2", "LAU-3"],
            nextCheck:
              "Assign owners to the runbook and rollback test, then review launch criteria with Product and Engineering.",
          }
        : insufficient("Complete a readiness review before launch.");
  }
}

function insufficient(nextCheck: string): Diagnosis {
  return {
    code: "insufficient_evidence",
    title: "More evidence is needed",
    explanation:
      "The current signals support an uncertain finding. A specialist should gather the missing checks before giving a definitive answer.",
    confidence: 0.36,
    evidenceIds: [],
    nextCheck,
  };
}

function severity(item: SupportCase): Severity {
  if (item.affectedAccounts >= 100 || item.exposureUsd >= 100000) return "P0";
  if (item.deadlineMinutes <= 120 || item.exposureUsd >= 40000) return "P1";
  return "P2";
}

function route(item: SupportCase): string {
  return (
    {
      delivery: "Ads delivery + Billing",
      measurement: "Measurement + Engineering",
      billing: "Billing operations",
      policy: "Policy review + Trust & Safety",
      launch: "Product + Engineering + Support",
    } as const
  )[item.kind];
}

function draft(item: SupportCase, diagnosis: Diagnosis): string {
  if (item.kind === "launch")
    return "I found two support readiness gaps for the upcoming launch: the runbook needs completion, and the rollback path needs a test. I recommend a review with Product, Engineering, and Support before expanding the rollout. I will track owners and share the decision once the checks are complete.";
  if (diagnosis.code === "insufficient_evidence")
    return "I reviewed the available account signals and need a few more checks before giving you a conclusion. I will work with the specialist team and share an update after that review.";
  switch (item.kind) {
    case "delivery":
      return "I reviewed the delivery decline and the available account signals. A payment attempt failed before the campaign stopped serving, while budget remained available. Please update the payment details, and I will check the payment state and serving recovery afterward.";
    case "measurement":
      return "I reviewed the click and session reports and found a difference that needs investigation. These reports count different events, and missing URL tags may limit campaign attribution. I will align the reporting settings and check redirects, consent, and analytics capture before giving you a cause.";
    case "billing":
      return "I reviewed the campaign settings and invoice records. The campaign optimizes toward conversions, while its configured buying mode charges valid clicks. I will ask a billing specialist to confirm the invoice details before I give you a final explanation.";
    case "policy":
      return "I checked the review record and landing page access result. The page returned an access-denied response to the crawler, which appears to have triggered the rejection. Please restore crawler access, and I will route your review request to the policy team.";
  }
}

function insight(item: SupportCase): string {
  return (
    {
      delivery:
        "Add a payment-state check to the delivery playbook and surface failed attempts in the support view.",
      measurement:
        "Add a report-comparison checklist and URL-tagging check to the measurement playbook.",
      billing: "Clarify buying mode during setup and add invoice examples to advertiser education.",
      policy: "Add a preflight crawler check and a clear appeal path to launch guidance.",
      launch:
        "Require runbook ownership and a tested rollback path in the launch readiness checklist.",
    } as const
  )[item.kind];
}

export function runCase(item: SupportCase): RunResult {
  const finding = diagnose(item);
  const operationalInsight =
    finding.code === "insufficient_evidence"
      ? "Reconcile the conflicting source records before proposing a process or product change."
      : insight(item);
  const priority = severity(item);
  const needsReview =
    item.kind === "billing" ||
    item.kind === "policy" ||
    item.kind === "launch" ||
    priority === "P0" ||
    finding.confidence < 0.7;
  const gate = {
    required: needsReview,
    reason: needsReview
      ? item.kind === "policy"
        ? "A policy specialist must review any appeal or exception request."
        : item.kind === "billing"
          ? "A billing specialist must confirm invoice interpretation before a customer commitment."
          : item.kind === "launch"
            ? "A launch owner must approve the readiness decision."
            : "A lead must review high-severity or uncertain guidance."
      : "The support lead can review the draft within the standard queue.",
    reviewer:
      item.kind === "policy"
        ? "Policy specialist"
        : item.kind === "billing"
          ? "Billing specialist"
          : item.kind === "launch"
            ? "Launch owner"
            : item.kind === "measurement"
              ? "Measurement lead"
              : "Support lead",
  };
  const step = (
    id: TraceStep["id"],
    summary: string,
    detail: string,
    evidenceIds: string[],
    durationMs: number,
    status: TraceStep["status"] = "complete",
  ): TraceStep => ({
    id,
    label: AGENT_LABELS[id],
    summary,
    detail,
    evidenceIds,
    status,
    durationMs,
  });
  const trace: TraceStep[] = [
    step(
      "orchestrator",
      "Case accepted",
      `Opened ${item.id} and assigned a traceable workflow.`,
      [],
      34,
    ),
    step(
      "intake",
      "Signals normalized",
      `Loaded ${item.evidence.length} source records and the ${item.kind} signal set.`,
      item.evidence.map((e) => e.id),
      78,
    ),
    step(
      "triage",
      `${priority} priority assigned`,
      `${item.affectedAccounts} affected account(s), $${item.exposureUsd.toLocaleString()} exposure estimate, and ${item.deadlineMinutes}-minute decision window.`,
      [],
      91,
    ),
    step("diagnosis", finding.title, finding.explanation, finding.evidenceIds, 203),
    step(
      "trust",
      needsReview ? "Human approval required" : "Standard review route",
      gate.reason,
      finding.evidenceIds,
      56,
      needsReview ? "review" : "complete",
    ),
    step(
      "response",
      "Response draft prepared",
      "The response remains a draft. No message is sent by this prototype.",
      finding.evidenceIds,
      139,
      needsReview ? "review" : "complete",
    ),
    step("insights", "Recurring issue captured", operationalInsight, finding.evidenceIds, 87),
  ];
  const validIds = new Set(item.evidence.map((e) => e.id));
  const cited = new Set(finding.evidenceIds.filter((id) => validIds.has(id)));
  return {
    caseId: item.id,
    severity: priority,
    route: route(item),
    diagnosis: finding,
    trace,
    gate,
    actionPlan: buildActionPlan(item, finding),
    responseDraft: draft(item, finding),
    operationalInsight,
    evidenceCoverage: item.evidence.length ? cited.size / item.evidence.length : 0,
    automationTimeMs: trace.reduce((sum, entry) => sum + entry.durationMs, 0),
  };
}

export function allCitationsExist(item: SupportCase, result: RunResult): boolean {
  const ids = new Set(item.evidence.map((e) => e.id));
  return (
    result.trace.every((entry) => entry.evidenceIds.every((id) => ids.has(id))) &&
    result.actionPlan.steps.every((entry) => entry.evidenceIds.every((id) => ids.has(id)))
  );
}

export function findingLabel(code: FindingCode): string {
  return (
    {
      payment_failure: "Payment failure",
      measurement_discrepancy: "Measurement discrepancy",
      billing_model_misread: "Billing model confusion",
      landing_page_access: "Landing page access",
      launch_readiness_gap: "Launch readiness gap",
      insufficient_evidence: "Insufficient evidence",
    } as const
  )[code];
}
