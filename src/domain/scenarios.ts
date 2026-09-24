import type { SupportCase } from "./types.ts";

export const SCENARIOS: SupportCase[] = [
  {
    id: "CASE-1042",
    kind: "delivery",
    title: "Campaign delivery drops overnight",
    customer: "Northstar Outfitters",
    summary:
      "A launch campaign loses most impressions within one hour. The buyer needs an answer before a planned promotion.",
    openedAt: "09:14 UTC",
    affectedAccounts: 1,
    exposureUsd: 42000,
    deadlineMinutes: 90,
    expectedFinding: "payment_failure",
    trend: [89, 92, 95, 90, 93, 28, 7, 4],
    signals: {
      priorImpressions: 184000,
      currentImpressions: 8400,
      paymentState: "failed",
      adState: "not_serving",
      budgetRemainingUsd: 18000,
      recentChange: "Payment attempt failed at 08:51 UTC",
    },
    evidence: [
      {
        id: "DEL-1",
        label: "Delivery trend",
        source: "Synthetic campaign telemetry",
        observedAt: "09:03 UTC",
        detail: "Impressions fell from a 184,000 daily baseline to 8,400 projected.",
      },
      {
        id: "DEL-2",
        label: "Account status",
        source: "Synthetic billing event",
        observedAt: "08:51 UTC",
        detail: "A card payment attempt failed before the serving status changed.",
      },
      {
        id: "DEL-3",
        label: "Budget check",
        source: "Synthetic campaign settings",
        observedAt: "09:06 UTC",
        detail: "The campaign has $18,000 in remaining budget.",
      },
    ],
  },
  {
    id: "CASE-2087",
    kind: "measurement",
    title: "Clicks exceed site sessions",
    customer: "Lumen Learning",
    summary:
      "Ads Manager shows healthy click volume, while the advertiser's web analytics records fewer sessions.",
    openedAt: "11:26 UTC",
    affectedAccounts: 1,
    exposureUsd: 12000,
    deadlineMinutes: 240,
    expectedFinding: "measurement_discrepancy",
    trend: [53, 58, 62, 67, 71, 74, 76, 80],
    signals: {
      adsManagerClicks: 3820,
      siteSessions: 2370,
      utmPresent: false,
      attributionWindowDays: 30,
      reportAgeHours: 12,
    },
    evidence: [
      {
        id: "MEA-1",
        label: "Platform report",
        source: "Synthetic Ads Manager export",
        observedAt: "11:12 UTC",
        detail: "The campaign reports 3,820 clicks in the selected period.",
      },
      {
        id: "MEA-2",
        label: "Site analytics",
        source: "Synthetic customer dashboard",
        observedAt: "11:18 UTC",
        detail: "The customer dashboard records 2,370 sessions.",
      },
      {
        id: "MEA-3",
        label: "URL inspection",
        source: "Synthetic landing page configuration",
        observedAt: "11:21 UTC",
        detail: "The landing URL has no campaign tracking parameters.",
      },
    ],
  },
  {
    id: "CASE-3164",
    kind: "billing",
    title: "Invoice differs from expected conversions",
    customer: "Mosaic Home",
    summary:
      "An advertiser expects charges only after conversions, while the campaign uses click billing.",
    openedAt: "14:05 UTC",
    affectedAccounts: 1,
    exposureUsd: 68000,
    deadlineMinutes: 120,
    expectedFinding: "billing_model_misread",
    trend: [31, 36, 41, 49, 55, 64, 70, 78],
    signals: {
      objective: "conversions",
      billingMode: "click",
      chargedEvents: 15400,
      conversions: 620,
      invoiceUsd: 46200,
      dailyBudgetUsd: 1500,
    },
    evidence: [
      {
        id: "BIL-1",
        label: "Campaign objective",
        source: "Synthetic campaign settings",
        observedAt: "14:10 UTC",
        detail: "The campaign optimizes toward conversions.",
      },
      {
        id: "BIL-2",
        label: "Billing selection",
        source: "Synthetic billing configuration",
        observedAt: "14:10 UTC",
        detail: "The selected buying mode bills valid clicks.",
      },
      {
        id: "BIL-3",
        label: "Invoice events",
        source: "Synthetic invoice ledger",
        observedAt: "14:12 UTC",
        detail: "The invoice reflects 15,400 billable clicks and 620 attributed conversions.",
      },
    ],
  },
  {
    id: "CASE-4271",
    kind: "policy",
    title: "Ad rejected before launch",
    customer: "Harbor Desk",
    summary:
      "A buyer asks for a policy exception after an ad enters a rejected state ahead of a product announcement.",
    openedAt: "16:42 UTC",
    affectedAccounts: 1,
    exposureUsd: 25000,
    deadlineMinutes: 70,
    expectedFinding: "landing_page_access",
    trend: [77, 75, 76, 74, 25, 0, 0, 0],
    signals: {
      adState: "rejected",
      landingPageReachable: false,
      reviewRequested: true,
      rejectionCode: "LANDING_PAGE_UNAVAILABLE",
    },
    evidence: [
      {
        id: "POL-1",
        label: "Review status",
        source: "Synthetic ad review record",
        observedAt: "16:46 UTC",
        detail: "The ad is rejected with a landing page access code.",
      },
      {
        id: "POL-2",
        label: "Page check",
        source: "Synthetic crawler test",
        observedAt: "16:49 UTC",
        detail: "The landing page returns an access-denied response to a crawler.",
      },
      {
        id: "POL-3",
        label: "Customer request",
        source: "Synthetic support ticket",
        observedAt: "16:44 UTC",
        detail: "The advertiser requests an exception for the launch date.",
      },
    ],
  },
  {
    id: "CASE-5308",
    kind: "launch",
    title: "New feature misses the support bar",
    customer: "Internal launch simulation",
    summary:
      "A conversion feature is scheduled to launch with an incomplete runbook and no tested rollback path.",
    openedAt: "08:30 UTC",
    affectedAccounts: 180,
    exposureUsd: 110000,
    deadlineMinutes: 1440,
    expectedFinding: "launch_readiness_gap",
    trend: [15, 20, 28, 42, 51, 63, 74, 88],
    signals: {
      daysToLaunch: 2,
      runbookReady: false,
      routingTested: true,
      rollbackReady: false,
      knownIssues: 4,
    },
    evidence: [
      {
        id: "LAU-1",
        label: "Readiness checklist",
        source: "Synthetic launch plan",
        observedAt: "08:31 UTC",
        detail: "The runbook is incomplete and four issues remain open.",
      },
      {
        id: "LAU-2",
        label: "Routing test",
        source: "Synthetic support exercise",
        observedAt: "08:33 UTC",
        detail: "Case routing passed a dry run.",
      },
      {
        id: "LAU-3",
        label: "Rollback check",
        source: "Synthetic engineering note",
        observedAt: "08:35 UTC",
        detail: "The rollback path has not been tested.",
      },
    ],
  },
];

export function getScenario(id: string): SupportCase | undefined {
  return SCENARIOS.find((item) => item.id === id);
}

export function deriveSimulation(
  item: SupportCase,
  options: { conflictingSignal: boolean; broadImpact: boolean },
): SupportCase {
  const scope = options.broadImpact
    ? { affectedAccounts: 500, exposureUsd: 250000 }
    : { affectedAccounts: item.affectedAccounts, exposureUsd: item.exposureUsd };
  if (!options.conflictingSignal) return { ...item, ...scope };
  switch (item.kind) {
    case "delivery":
      return { ...item, ...scope, signals: { ...item.signals, paymentState: "healthy" } };
    case "measurement":
      return {
        ...item,
        ...scope,
        signals: {
          ...item.signals,
          utmPresent: true,
          siteSessions: item.signals.adsManagerClicks,
        },
      };
    case "billing":
      return { ...item, ...scope, signals: { ...item.signals, billingMode: "impression" } };
    case "policy":
      return { ...item, ...scope, signals: { ...item.signals, landingPageReachable: true } };
    case "launch":
      return {
        ...item,
        ...scope,
        signals: { ...item.signals, runbookReady: true, rollbackReady: true },
      };
  }
}
