import { evaluateFixtures } from "../src/domain/evaluation.ts";

const report = evaluateFixtures();
console.table(
  report.rows.map((row) => ({
    case: row.caseId,
    finding: row.findingMatched ? "pass" : "fail",
    citations: row.citationsValid ? "pass" : "fail",
    gate: row.gateCorrect ? "pass" : "fail",
    plan: row.planStructured ? "pass" : "fail",
    coverage: `${Math.round(row.evidenceCoverage * 100)}%`,
    trace: row.traceComplete ? "pass" : "fail",
  })),
);
console.log(
  `Finding match: ${Math.round(report.findingMatchRate * 100)}% | Citation validity: ${Math.round(report.citationValidity * 100)}% | Gate compliance: ${Math.round(report.gateCompliance * 100)}% | Plan structure: ${Math.round(report.planStructureRate * 100)}%`,
);
if (!report.passed) process.exitCode = 1;
