import assert from "node:assert/strict";
import test from "node:test";
import { allCitationsExist, runCase } from "./engine.ts";
import { deriveSimulation, SCENARIOS } from "./scenarios.ts";
import type { SupportCase } from "./types.ts";

for (const item of SCENARIOS) {
  test(`${item.id} identifies its seeded cause with source evidence`, () => {
    const result = runCase(item);
    assert.equal(result.diagnosis.code, item.expectedFinding);
    assert.ok(result.diagnosis.evidenceIds.length > 0);
    assert.ok(allCitationsExist(item, result));
    assert.equal(result.trace.length, 7);
    assert.match(result.responseDraft, /I /);
    assert.ok(result.actionPlan.decision.length > 0);
    assert.ok(result.actionPlan.update.length > 0);
    assert.ok(result.actionPlan.closure.length > 0);
    assert.ok(result.actionPlan.steps.length >= 3);
    assert.ok(
      result.actionPlan.steps.every(
        (step) => step.owner.length > 0 && step.action.length > 0 && step.proof.length > 0,
      ),
    );
  });
}

test("billing, policy, and launch guidance requires a named human reviewer", () => {
  for (const item of SCENARIOS.filter((entry) =>
    ["billing", "policy", "launch"].includes(entry.kind),
  )) {
    const result = runCase(item);
    assert.equal(result.gate.required, true);
    assert.ok(result.gate.reviewer.length > 0);
    assert.equal(result.trace.find((step) => step.id === "response")?.status, "review");
  }
});

test("missing decisive signal falls back to an uncertain finding and review", () => {
  const delivery = SCENARIOS[0] as Extract<SupportCase, { kind: "delivery" }>;
  const changed: SupportCase = {
    ...delivery,
    signals: { ...delivery.signals, paymentState: "healthy" },
  };
  const result = runCase(changed);
  assert.equal(result.diagnosis.code, "insufficient_evidence");
  assert.equal(result.gate.required, true);
  assert.equal(result.diagnosis.evidenceIds.length, 0);
});

test("repeat runs produce the same trace and decision", () => {
  assert.deepEqual(runCase(SCENARIOS[1]!), runCase(SCENARIOS[1]!));
});

test("foreign evidence IDs fail provenance validation", () => {
  const item = SCENARIOS[0]!;
  const result = runCase(item);
  result.trace[0]!.evidenceIds.push("UNKNOWN-1");
  assert.equal(allCitationsExist(item, result), false);
});

test("foreign action plan evidence IDs fail provenance validation", () => {
  const item = SCENARIOS[0]!;
  const result = runCase(item);
  result.actionPlan.steps[0]!.evidenceIds.push("UNKNOWN-2");
  assert.equal(allCitationsExist(item, result), false);
});

test("sensitive cases keep the final action with a named reviewer", () => {
  for (const item of SCENARIOS.filter((entry) =>
    ["billing", "policy", "launch"].includes(entry.kind),
  )) {
    const result = runCase(item);
    assert.equal(result.actionPlan.steps.at(-1)?.status, "review");
    assert.ok(result.actionPlan.steps.at(-1)?.owner);
  }
});

test("measurement mismatch stays open for reconciliation and lead review", () => {
  const item = SCENARIOS.find((entry) => entry.kind === "measurement")!;
  const result = runCase(item);
  assert.equal(result.diagnosis.code, "measurement_discrepancy");
  assert.equal(result.gate.required, true);
  assert.equal(result.gate.reviewer, "Measurement lead");
  assert.equal(result.actionPlan.steps.at(-1)?.status, "review");
  assert.ok(
    result.actionPlan.steps.some(
      (step) => step.status === "conditional" && step.owner.includes("Engineering"),
    ),
  );
  assert.match(result.diagnosis.explanation, /cannot explain the total session gap/);
});

test("broader impact raises a delivery case to P0 and requires a lead", () => {
  const item = deriveSimulation(SCENARIOS[0]!, { conflictingSignal: false, broadImpact: true });
  const result = runCase(item);
  assert.equal(result.severity, "P0");
  assert.equal(result.gate.required, true);
  assert.equal(item.affectedAccounts, 500);
});

test("conflicting signal creates an uncertain result across every scenario", () => {
  for (const base of SCENARIOS) {
    const item = deriveSimulation(base, { conflictingSignal: true, broadImpact: false });
    const result = runCase(item);
    assert.equal(result.diagnosis.code, "insufficient_evidence");
    assert.equal(result.gate.required, true);
    assert.match(result.operationalInsight, /Reconcile the conflicting source records/);
    assert.match(result.actionPlan.decision, /Hold a cause-specific recommendation/);
    assert.ok(result.actionPlan.steps.every((step) => step.status !== "in_record"));
  }
});
