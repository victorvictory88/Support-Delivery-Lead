import type { ActionPlan, Diagnosis, SupportCase } from "./types.ts";

export function buildActionPlan(item: SupportCase, finding: Diagnosis): ActionPlan {
  if (finding.code === "insufficient_evidence") {
    return {
      decision: "Hold a cause-specific recommendation until the conflicting signals are checked.",
      update:
        "Explain the evidence gap and name the specialist review before the decision window ends.",
      closure:
        "A specialist documents the reconciled signals and approves the next customer update.",
      steps: [
        {
          status: "next",
          owner: "Ads support engineer",
          action: "Reconcile the conflicting case signals with their source records.",
          proof: "The source and observed time are recorded for each disputed signal.",
          evidenceIds: [],
        },
        {
          status: "review",
          owner: "Support lead + domain specialist",
          action: "Review the finding and decide which further check is needed.",
          proof: "A named reviewer records the decision and its evidence.",
          evidenceIds: [],
        },
      ],
    };
  }

  switch (item.kind) {
    case "delivery":
      return {
        decision: "Restore serving after the advertiser clears the payment issue.",
        update:
          "Tell the buyer which payment check is underway before the promotion decision window.",
        closure: "Payment state clears and a fresh serving check shows recovery.",
        steps: [
          {
            status: "in_record",
            owner: "Ads support engineer",
            action: "Confirm that the failed payment event preceded the delivery decline.",
            proof: "The billing event and serving trend show the sequence.",
            evidenceIds: ["DEL-1", "DEL-2"],
          },
          {
            status: "waiting",
            owner: "Advertiser + Billing Ops",
            action: "Update payment details and confirm the account payment state.",
            proof: "The account records a cleared payment state.",
            evidenceIds: [],
          },
          {
            status: "review",
            owner: "Ads support engineer + Support lead",
            action: "Recheck serving and approve the customer update.",
            proof: "A fresh serving trend and lead review are recorded.",
            evidenceIds: [],
          },
        ],
      };
    case "measurement":
      return {
        decision: "Investigate the measurement gap before assigning click quality as the cause.",
        update:
          "Share the comparison plan and request site analytics details before the decision window.",
        closure:
          "Comparable reports and a tested final URL explain the discrepancy or identify the next escalation.",
        steps: [
          {
            status: "in_record",
            owner: "Measurement support",
            action: "Capture platform clicks, site sessions, and missing URL tags.",
            proof: "The three source records define the observed gap.",
            evidenceIds: ["MEA-1", "MEA-2", "MEA-3"],
          },
          {
            status: "next",
            owner: "Measurement support",
            action: "Align date ranges and time zones, then trace redirects to the final URL.",
            proof: "Matched reporting windows and the redirect path are documented.",
            evidenceIds: [],
          },
          {
            status: "waiting",
            owner: "Advertiser + Measurement support",
            action: "Check consent behavior and analytics tagging on the landing page.",
            proof: "A test visit appears in the expected analytics report.",
            evidenceIds: [],
          },
          {
            status: "conditional",
            owner: "Measurement support + Engineering",
            action: "Escalate matched reports and redirect tests if the gap persists.",
            proof:
              "The handoff includes account and campaign IDs, exports, filters, times, and test results.",
            evidenceIds: [],
          },
          {
            status: "review",
            owner: "Measurement lead",
            action: "Approve the customer explanation after the counts are reconciled.",
            proof: "The aligned reports and remaining discrepancy are documented.",
            evidenceIds: [],
          },
        ],
      };
    case "billing":
      return {
        decision: "Hold invoice conclusions until Billing Ops reconciles the charge basis.",
        update:
          "Tell the advertiser a billing specialist is checking the invoice before any commitment.",
        closure: "A specialist signs off on line items and the approved customer explanation.",
        steps: [
          {
            status: "in_record",
            owner: "Ads support engineer",
            action: "Capture the conversion objective, click billing mode, and invoice events.",
            proof: "The campaign settings and invoice ledger are attached.",
            evidenceIds: ["BIL-1", "BIL-2", "BIL-3"],
          },
          {
            status: "next",
            owner: "Billing specialist",
            action:
              "Reconcile invoice line items against the configured buying mode and report period.",
            proof:
              "The invoice ID, campaign IDs, dates, and charged event categories are documented.",
            evidenceIds: [],
          },
          {
            status: "review",
            owner: "Billing specialist + Support lead",
            action: "Approve the explanation or route any correction through billing review.",
            proof: "The specialist decision and approved customer wording are recorded.",
            evidenceIds: [],
          },
        ],
      };
    case "policy":
      return {
        decision: "Restore landing page access and use the established review path.",
        update:
          "Tell the buyer which page check failed and explain the review path before the launch window.",
        closure: "A new page check passes and the review team records its decision.",
        steps: [
          {
            status: "in_record",
            owner: "Ads support engineer",
            action: "Confirm the rejection code and crawler access failure.",
            proof: "The review record and page test identify the blocker.",
            evidenceIds: ["POL-1", "POL-2"],
          },
          {
            status: "waiting",
            owner: "Advertiser",
            action: "Restore crawler access and request a fresh page check.",
            proof: "The page returns an accessible response to the test crawler.",
            evidenceIds: [],
          },
          {
            status: "review",
            owner: "Policy specialist",
            action: "Route the ad through review or the approved appeal path.",
            proof: "The review outcome is recorded without an exception promise.",
            evidenceIds: [],
          },
        ],
      };
    case "launch":
      return {
        decision: "Hold broad rollout until support readiness and rollback checks pass.",
        update: "Tell Product, Engineering, and GTM which launch criteria remain open.",
        closure:
          "The runbook is approved, rollback is tested, and the launch owner records a decision.",
        steps: [
          {
            status: "in_record",
            owner: "Support lead",
            action: "Document the runbook gap, open issues, and missing rollback test.",
            proof: "The readiness checklist and engineering note show the gaps.",
            evidenceIds: ["LAU-1", "LAU-3"],
          },
          {
            status: "next",
            owner: "Support lead + Product",
            action: "Complete the runbook and assign owners to known support issues.",
            proof: "The runbook has an owner, escalation path, and approved issue list.",
            evidenceIds: [],
          },
          {
            status: "next",
            owner: "Engineering",
            action: "Run and document the rollback test.",
            proof: "The rollback exercise records a passing result or a blocker.",
            evidenceIds: [],
          },
          {
            status: "review",
            owner: "Launch owner",
            action: "Record the go or hold decision after the readiness review.",
            proof: "The decision cites the runbook and rollback test results.",
            evidenceIds: [],
          },
        ],
      };
  }
}
