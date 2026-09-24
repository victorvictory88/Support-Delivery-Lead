import assert from "node:assert/strict";
import test from "node:test";
import { evaluateFixtures } from "./evaluation.ts";

test("fixture suite meets the published deterministic thresholds", () => {
  const report = evaluateFixtures();
  assert.equal(report.rows.length, 5);
  assert.equal(report.passed, true);
  assert.equal(report.findingMatchRate, 1);
  assert.equal(report.citationValidity, 1);
  assert.equal(report.gateCompliance, 1);
  assert.equal(report.planStructureRate, 1);
  assert.equal(report.meanEvidenceCoverage, 1);
});
