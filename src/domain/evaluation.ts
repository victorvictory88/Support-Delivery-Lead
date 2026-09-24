import { allCitationsExist, runCase } from "./engine.ts";
import { SCENARIOS } from "./scenarios.ts";

export interface EvaluationRow {
  caseId: string;
  findingMatched: boolean;
  citationsValid: boolean;
  gateCorrect: boolean;
  planStructured: boolean;
  evidenceCoverage: number;
  traceComplete: boolean;
}

export interface EvaluationReport {
  rows: EvaluationRow[];
  findingMatchRate: number;
  citationValidity: number;
  gateCompliance: number;
  planStructureRate: number;
  meanEvidenceCoverage: number;
  traceCompleteness: number;
  passed: boolean;
}

export function evaluateFixtures(): EvaluationReport {
  const rows = SCENARIOS.map((item) => {
    const result = runCase(item);
    return {
      caseId: item.id,
      findingMatched: result.diagnosis.code === item.expectedFinding,
      citationsValid: allCitationsExist(item, result),
      gateCorrect:
        result.gate.required ===
        (["billing", "policy", "launch"].includes(item.kind) ||
          result.severity === "P0" ||
          result.diagnosis.confidence < 0.7),
      planStructured:
        result.actionPlan.steps.length >= 2 &&
        result.actionPlan.steps.every(
          (step) => step.owner.length > 0 && step.action.length > 0 && step.proof.length > 0,
        ) &&
        (!result.gate.required || result.actionPlan.steps.at(-1)?.status === "review"),
      evidenceCoverage: result.evidenceCoverage,
      traceComplete:
        result.trace.length === 7 && new Set(result.trace.map((step) => step.id)).size === 7,
    };
  });
  const average = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;
  const report = {
    rows,
    findingMatchRate: average(rows.map((row) => Number(row.findingMatched))),
    citationValidity: average(rows.map((row) => Number(row.citationsValid))),
    gateCompliance: average(rows.map((row) => Number(row.gateCorrect))),
    planStructureRate: average(rows.map((row) => Number(row.planStructured))),
    meanEvidenceCoverage: average(rows.map((row) => row.evidenceCoverage)),
    traceCompleteness: average(rows.map((row) => Number(row.traceComplete))),
  };
  return {
    ...report,
    passed:
      report.findingMatchRate === 1 &&
      report.citationValidity === 1 &&
      report.gateCompliance === 1 &&
      report.planStructureRate === 1 &&
      report.traceCompleteness === 1,
  };
}
