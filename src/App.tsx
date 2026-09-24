import { useEffect, useState } from "react";
import { findingLabel, runCase } from "./domain/engine.ts";
import { evaluateFixtures } from "./domain/evaluation.ts";
import { SCENARIOS } from "./domain/scenarios.ts";
import type { ActionStatus, AgentId, RunResult, SupportCase } from "./domain/types.ts";
import InfoTip from "./InfoTip.tsx";

const AGENTS: AgentId[] = [
  "orchestrator",
  "intake",
  "triage",
  "diagnosis",
  "trust",
  "response",
  "insights",
];

const agentMeta: Record<AgentId, { label: string; role: string }> = {
  orchestrator: { label: "Orchestrator", role: "Owns handoffs" },
  intake: { label: "Intake", role: "Structures signals" },
  triage: { label: "Triage", role: "Sets urgency" },
  diagnosis: { label: "Diagnosis", role: "Tests the cause" },
  trust: { label: "Trust gate", role: "Routes review" },
  response: { label: "Response", role: "Drafts guidance" },
  insights: { label: "Insights", role: "Feeds Product" },
};

const agentHelp: Record<AgentId, string> = {
  orchestrator: "Keeps the case state and assigns each handoff.",
  intake: "Collects the case signals and source records.",
  triage: "Sets priority from scope, exposure, and deadline.",
  diagnosis: "Selects a cause and cites supporting records.",
  trust: "Checks if a named person must review the draft.",
  response: "Prepares customer wording without sending it.",
  insights: "Turns a case pattern into a process or product suggestion.",
};

const kindLabel: Record<SupportCase["kind"], string> = {
  delivery: "Delivery",
  measurement: "Measurement",
  billing: "Billing",
  policy: "Policy",
  launch: "Launch readiness",
};

const actionStatusLabel: Record<ActionStatus, string> = {
  in_record: "EVIDENCE IN HAND",
  next: "NEXT ACTION",
  waiting: "AWAITING INPUT",
  conditional: "IF GAP PERSISTS",
  review: "HUMAN REVIEW",
};

function Icon({
  name,
  size = 18,
}: {
  name: "arrow" | "check" | "lock" | "spark" | "branch";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  const path = {
    arrow: <path d="M5 12h13M13 6l6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    spark: (
      <>
        <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
        <path d="m19 17 .6 2.4L22 20l-2.4.6L19 23l-.6-2.4L16 20l2.4-.6L19 17Z" />
      </>
    ),
    branch: (
      <>
        <circle cx="6" cy="5" r="2" />
        <circle cx="18" cy="7" r="2" />
        <circle cx="18" cy="18" r="2" />
        <path d="M6 7v8a3 3 0 0 0 3 3h7M8 5h8" />
      </>
    ),
  }[name];
  return <svg {...common}>{path}</svg>;
}

function Trend({ values, positive = false }: { values: number[]; positive?: boolean }) {
  const points = values
    .map((value, index) => `${index * (256 / (values.length - 1))},${88 - value * 0.7}`)
    .join(" ");
  return (
    <svg className="trend" viewBox="0 0 256 88" role="img" aria-label="Synthetic case signal trend">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={positive ? "#b3d9ca" : "#ea916f"} stopOpacity=".4" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 87H256" stroke="#deded6" strokeDasharray="3 4" />
      <polygon points={`0,88 ${points} 256,88`} fill="url(#chartFill)" />
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#2d8b6a" : "#d45f37"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="256"
        cy={88 - values[values.length - 1]! * 0.7}
        r="4.5"
        fill={positive ? "#2d8b6a" : "#d45f37"}
        stroke="#fff"
        strokeWidth="2"
      />
    </svg>
  );
}

function AgentView({ result, activeIndex }: { result: RunResult; activeIndex: number }) {
  const active = AGENTS[activeIndex]!;
  const step = result.trace[activeIndex]!;
  return (
    <div className="agent-view" aria-label="Animated agent team view">
      <div className="agent-view-head">
        <span>AGENT TEAM VIEW</span>
        <span className="view-live">
          <i /> TRACE PLAYBACK
        </span>
      </div>
      <div className="agent-map">
        <div className="orchestrator-row">
          <InfoTip
            text={agentHelp.orchestrator}
            marker={false}
            className={`orchestrator-node ${active === "orchestrator" ? "current" : ""}`}
          >
            <span className="node-emblem">
              <Icon name="branch" size={21} />
            </span>
            <strong>Orchestrator</strong>
            <small>Owns handoffs</small>
            <span className="node-pulse" />
          </InfoTip>
        </div>
        <div className="map-stem">
          <span className="moving-light" />
        </div>
        <div className="agent-map-grid">
          {AGENTS.slice(1).map((id, index) => (
            <InfoTip
              text={agentHelp[id]}
              marker={false}
              edge={index % 3 === 2 ? "right" : "left"}
              className={`map-node ${active === id ? "current" : ""} ${id === "trust" ? "trust-node" : ""}`}
              key={id}
            >
              <span className="map-node-num">0{index + 1}</span>
              <span className="map-node-icon">
                {id === "trust" ? (
                  <Icon name="lock" size={16} />
                ) : id === "insights" ? (
                  <Icon name="spark" size={16} />
                ) : (
                  agentMeta[id].label.charAt(0)
                )}
              </span>
              <strong>{agentMeta[id].label}</strong>
              <small>{agentMeta[id].role}</small>
            </InfoTip>
          ))}
        </div>
      </div>
      <div className="agent-view-status" aria-live="off">
        <div>
          <small>
            0{activeIndex} / TRACE STEP / {agentMeta[active].label.toUpperCase()}
          </small>
          <strong>{step.summary}</strong>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [caseId, setCaseId] = useState(SCENARIOS[0]!.id);
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = SCENARIOS.find((item) => item.id === caseId)!;
  const result = runCase(selected);
  const nextHandoff = result.actionPlan.steps.find((step) => step.status !== "in_record")!;
  const report = evaluateFixtures();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActiveIndex((index) => (index + 1) % AGENTS.length);
    }, 1500);
    return () => window.clearInterval(timer);
  }, []);

  function selectCase(id: string) {
    setCaseId(id);
    setActiveIndex(0);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>
              SIGNAL<span className="brand-accent">/</span>OPS
            </strong>
            <small>ADS SUPPORT LAB</small>
          </span>
        </div>
        <div className="sidebar-rule" />
        <div className="rail-heading">
          LEAD BRIEF <span>{selected.id}</span>
        </div>
        <div className="rail-brief">
          <span>OPERATING DECISION</span>
          <strong>{result.actionPlan.decision}</strong>
        </div>
        <div className="rail-brief">
          <span>NEXT HANDOFF</span>
          <strong>{nextHandoff.owner}</strong>
          <small>{nextHandoff.action}</small>
        </div>
        <div className="rail-brief">
          <span>RESOLVE WHEN</span>
          <strong>{result.actionPlan.closure}</strong>
        </div>
        <div className="rail-divider" />
        <div className="rail-heading">
          CURRENT CASE <span>{selected.id}</span>
        </div>
        <div className="rail-readout">
          <InfoTip text="Priority reflects account scope, exposure, and the decision window.">
            PRIORITY
          </InfoTip>
          <strong>{result.severity}</strong>
        </div>
        <div className="rail-readout">
          <InfoTip text="The support groups assigned to investigate this case.">ROUTE</InfoTip>
          <strong>{result.route}</strong>
        </div>
        <div className="rail-readout">
          <InfoTip text="The person assigned to approve sensitive or uncertain guidance.">
            REVIEW OWNER
          </InfoTip>
          <strong>{result.gate.reviewer}</strong>
        </div>
        <div className="rail-divider" />
        <div className="rail-heading">
          HUMAN CHECK <span>{result.gate.required ? "REQUIRED" : "STANDARD"}</span>
        </div>
        <p className="rail-gate">{result.gate.reason}</p>
        <div className="sidebar-bottom">
          <span className="live-dot" />
          <span>LOCAL / SYNTHETIC</span>
          <p>Customer data and outbound messaging stay outside this prototype.</p>
        </div>
      </aside>

      <main id="top" className="main">
        <header className="topbar">
          <div className="breadcrumb">
            PORTFOLIO PROJECT <span>/</span> OPERATIONS CONSOLE
          </div>
          <div className="topbar-right">
            <span>v1.1 · SEPT 2026</span>
            <span className="topbar-status">
              GITHUB READY <Icon name="check" size={14} />
            </span>
          </div>
        </header>

        <section className="case-picker" aria-label="Choose a synthetic case">
          <div className="picker-heading">
            <span>CHOOSE A CASE</span>
            <small>One click updates the complete analysis.</small>
            <small className="mobile-hint">Swipe to view all five cases.</small>
          </div>
          <div className="case-picker-grid">
            {SCENARIOS.map((item, index) => (
              <button
                key={item.id}
                className={`case-tile ${caseId === item.id ? "selected" : ""}`}
                onClick={() => selectCase(item.id)}
                aria-pressed={caseId === item.id}
              >
                <span className="case-tile-top">
                  <span>
                    0{index + 1} / {kindLabel[item.kind].toUpperCase()}
                  </span>
                  <Icon name="arrow" size={14} />
                </span>
                <strong>{item.title}</strong>
                <span className="case-tile-summary">{item.summary}</span>
                <small>{item.id}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="hero">
          <div className="hero-main">
            <div className="eyebrow">
              <span /> A WORKING SUPPORT DELIVERY PROTOTYPE
            </div>
            <h1>
              Every signal.
              <br />
              <em>One clear response.</em>
            </h1>
            <p>
              Pick a case above to see the finding, supporting evidence, owned action plan, response
              draft, and human review path. The agent team stays visible as each role hands the case
              forward.
            </p>
            <div className="hero-proof">
              <span>
                <strong>05</strong> FICTIONAL CASES
              </span>
              <span>
                <strong>07</strong> AGENT ROLES
              </span>
              <span>
                <strong>01</strong> HUMAN CONTROL PATH
              </span>
            </div>
          </div>
          <AgentView result={result} activeIndex={activeIndex} />
        </section>

        <div className="content-wrap">
          <section className="section-head">
            <div>
              <div className="section-kicker">01 / CASE ANALYSIS</div>
              <h2>{selected.title}</h2>
            </div>
            <span className="section-note">The selected case is analyzed automatically.</span>
          </section>
          <section className="case-summary">
            <div className="case-summary-main">
              <div className="case-tag-row">
                <span className="pill pill-dark">{selected.id}</span>
                <span className="pill">{kindLabel[selected.kind]}</span>
                <span className="pill pill-synthetic">SYNTHETIC</span>
              </div>
              <p>{selected.summary}</p>
              <div className="case-meta">
                <span>
                  {selected.kind === "launch" ? "WORKSTREAM" : "ACCOUNT"}{" "}
                  <strong>{selected.customer}</strong>
                </span>
                <span>
                  OPENED <strong>{selected.openedAt}</strong>
                </span>
                <span>
                  DECISION WINDOW <strong>{selected.deadlineMinutes} MIN</strong>
                </span>
              </div>
            </div>
            <div className="signal-card">
              <div className="signal-top">
                <InfoTip text="The line shows the direction of a case signal from earlier to latest. Its height has no unit or calibrated scale. Use the cited records below for exact values and cause.">
                  SIGNAL PATTERN
                </InfoTip>
                <span>
                  <i /> SAMPLE DATA
                </span>
              </div>
              <Trend
                values={selected.trend}
                positive={["measurement", "billing", "launch"].includes(selected.kind)}
              />
              <div className="signal-footer">
                <span>EARLIER</span>
                <span>LATEST</span>
              </div>
            </div>
          </section>
          <section className="metric-row">
            <div>
              <InfoTip text="Priority reflects account scope, exposure, and the decision window.">
                PRIORITY
              </InfoTip>
              <strong>{result.severity}</strong>
              <small>{result.route}</small>
            </div>
            <div>
              <InfoTip text="The number of advertiser accounts included in this case's impact estimate.">
                ACCOUNTS AFFECTED
              </InfoTip>
              <strong>{selected.affectedAccounts}</strong>
              <small>Scenario scope</small>
            </div>
            <div>
              <InfoTip text="The estimated advertiser impact used to rank this case.">
                ESTIMATED EXPOSURE
              </InfoTip>
              <strong>${(selected.exposureUsd / 1000).toFixed(0)}K</strong>
              <small>Scenario planning input</small>
            </div>
            <div>
              <InfoTip text="The share of case records used to support the finding.">
                EVIDENCE COVERAGE
              </InfoTip>
              <strong>{Math.round(result.evidenceCoverage * 100)}%</strong>
              <small>Records used / total</small>
            </div>
          </section>

          <div className="analysis-grid">
            <section className="diagnosis-card">
              <div className="card-header">
                <InfoTip text="The leading cause and the records used to support it.">
                  DIAGNOSIS / EVIDENCE
                </InfoTip>
                <InfoTip
                  text="The authored records support this finding. Open checks still require review."
                  className="confidence"
                  edge="right"
                >
                  {result.diagnosis.confidence < 0.7 ? "REQUIRES REVIEW" : "SUPPORTED BY RECORDS"}
                </InfoTip>
              </div>
              <div className="diagnosis-body">
                <span className="finding-badge">{findingLabel(result.diagnosis.code)}</span>
                <h3>{result.diagnosis.title}</h3>
                <p>{result.diagnosis.explanation}</p>
                <div className="next-check">
                  <span>NEXT TECHNICAL CHECK</span>
                  <strong>{result.diagnosis.nextCheck}</strong>
                </div>
                <div className="source-list">
                  <span className="source-heading">SOURCE RECORDS</span>
                  {selected.evidence.map((source) => (
                    <div className="source-item" key={source.id}>
                      <span>{source.id}</span>
                      <div>
                        <strong>{source.label}</strong>
                        <small>{source.detail}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className={`gate-card ${result.gate.required ? "requires-review" : ""}`}>
              <div className="card-header">
                <InfoTip text="Sensitive or uncertain guidance goes to a named reviewer.">
                  HUMAN CONTROL
                </InfoTip>
                <Icon name="lock" size={16} />
              </div>
              <div className="gate-body">
                <span className="gate-status">
                  {result.gate.required ? "REVIEW REQUIRED" : "STANDARD REVIEW"}
                </span>
                <h3>{result.gate.reviewer}</h3>
                <p>{result.gate.reason}</p>
              </div>
            </section>
          </div>

          <section className="action-plan" aria-label="Case action plan and handoff">
            <div className="action-plan-header">
              <div>
                <span className="section-kicker">02 / OPERATOR HANDOFF</span>
                <h2>Decision, owners, and proof.</h2>
              </div>
              <span className="plan-boundary">PROPOSED ACTIONS · NO EXTERNAL ACTIONS RUN</span>
            </div>
            <div className="plan-decision">
              <span>OPERATING DECISION</span>
              <strong>{result.actionPlan.decision}</strong>
            </div>
            <ol className="plan-steps">
              {result.actionPlan.steps.map((step, index) => (
                <li key={`${selected.id}-${index}`}>
                  <span className="plan-index">0{index + 1}</span>
                  <div className="plan-step-main">
                    <div className="plan-step-top">
                      <span className={`plan-status plan-status-${step.status}`}>
                        {actionStatusLabel[step.status]}
                      </span>
                      <span className="plan-owner">OWNER / {step.owner}</span>
                    </div>
                    <strong>{step.action}</strong>
                    <p>
                      <b>{step.status === "in_record" ? "RECORDED PROOF" : "PROOF TO RECORD"}</b>{" "}
                      {step.proof}
                    </p>
                    {step.evidenceIds.length > 0 && (
                      <small>CASE EVIDENCE / {step.evidenceIds.join(" · ")}</small>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            <section className="response-card handoff-response">
              <div className="card-header">
                <InfoTip
                  text={
                    selected.kind === "launch"
                      ? "A draft update for Product, Engineering, Support, and GTM to review."
                      : "Suggested customer wording for the owner to review before sending."
                  }
                >
                  {selected.kind === "launch" ? "INTERNAL UPDATE" : "CUSTOMER SUMMARY"}
                </InfoTip>
                <span className="draft-tag">DRAFT ONLY</span>
              </div>
              <div className="response-body">
                <p>{result.responseDraft}</p>
                <small>
                  {selected.kind === "launch"
                    ? "The internal update remains a draft."
                    : "Customer messages stay inside this prototype."}
                </small>
              </div>
            </section>
            <div className="plan-footer">
              <div>
                <span>UPDATE PLAN</span>
                <p>{result.actionPlan.update}</p>
              </div>
              <div>
                <span>RESOLVE ONLY AFTER</span>
                <p>{result.actionPlan.closure}</p>
              </div>
            </div>
          </section>

          <section className="insight-bar">
            <span className="insight-icon">
              <Icon name="spark" size={21} />
            </span>
            <div>
              <InfoTip text="A process or tooling improvement suggested by this case.">
                SUPPORT → PRODUCT FEEDBACK
              </InfoTip>
              <strong>{result.operationalInsight}</strong>
            </div>
          </section>

          <section className="quality-strip">
            <div>
              <span className="section-kicker">03 / QUALITY CHECK</span>
              <h2>Checks passed for five sample cases.</h2>
              <p>
                Each source link matched its case, and each case followed its human review rule.
                Customer cases need separate testing.
              </p>
            </div>
            <div className="quality-metrics">
              <div>
                <strong>{report.rows.length}</strong>
                <InfoTip text="Five sample cases check delivery, measurement, billing, policy, and launch decisions.">
                  SAMPLE CASES
                </InfoTip>
              </div>
              <div>
                <strong>{Math.round(report.citationValidity * 100)}%</strong>
                <InfoTip text="Every source record named in an agent handoff or action plan belongs to its case.">
                  SOURCE LINKS CORRECT
                </InfoTip>
              </div>
              <div>
                <strong>{Math.round(report.gateCompliance * 100)}%</strong>
                <InfoTip
                  text="Each sample case follows the rule for when a named person must review the guidance."
                  edge="right"
                >
                  REVIEW RULES FOLLOWED
                </InfoTip>
              </div>
            </div>
          </section>

          <footer>
            <div>
              <strong>
                SIGNAL<span>/</span>OPS
              </strong>
              <p>
                An independent candidate project for Ads support delivery. All cases and
                organizations shown here are fictional.
              </p>
            </div>
            <div className="footer-right">
              <span>DETERMINISTIC CORE · HUMAN REVIEW</span>
              <span>© 2026 ALBERT CHAN</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
