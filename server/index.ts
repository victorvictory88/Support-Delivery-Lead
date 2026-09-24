import http from "node:http";
import { deriveSimulation, getScenario } from "../src/domain/scenarios.ts";
import { runCase } from "../src/domain/engine.ts";

const port = Number(process.env.PORT || 8787);
const model = process.env.OPENAI_MODEL || "";
const key = process.env.OPENAI_API_KEY || "";

function json(response: http.ServerResponse, status: number, body: object) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

async function readBody(request: http.IncomingMessage): Promise<unknown> {
  let raw = "";
  for await (const chunk of request) {
    raw += String(chunk);
    if (raw.length > 4096) throw new Error("Request is too large.");
  }
  return JSON.parse(raw);
}

function extractText(payload: unknown): string {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("output" in payload) ||
    !Array.isArray(payload.output)
  )
    return "";
  return payload.output
    .flatMap((item: { content?: { type?: string; text?: string }[] }) => item.content ?? [])
    .filter(
      (entry: { type?: string; text?: string }) =>
        entry.type === "output_text" && typeof entry.text === "string",
    )
    .map((entry: { text?: string }) => entry.text ?? "")
    .join("\n")
    .trim();
}

http
  .createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/api/health")
      return json(response, 200, {
        enabled: Boolean(key && model),
        mode: key && model ? "optional-draft" : "offline",
      });
    if (request.method !== "POST" || request.url !== "/api/draft")
      return json(response, 404, { error: "Route unavailable." });
    const origin = request.headers.origin;
    if (origin && origin !== "http://127.0.0.1:5173" && origin !== "http://localhost:5173") {
      return json(response, 403, {
        error: "This local service accepts requests from the demo origin only.",
      });
    }
    if (!key || !model)
      return json(response, 503, { error: "The optional draft assistant is not configured." });
    try {
      const input = await readBody(request);
      const caseId =
        input && typeof input === "object" && "caseId" in input && typeof input.caseId === "string"
          ? input.caseId
          : "";
      const baseScenario = getScenario(caseId);
      if (!baseScenario) return json(response, 400, { error: "Choose a known synthetic case." });
      const scenario = deriveSimulation(baseScenario, {
        conflictingSignal:
          input && typeof input === "object" && "conflictingSignal" in input
            ? input.conflictingSignal === true
            : false,
        broadImpact:
          input && typeof input === "object" && "broadImpact" in input
            ? input.broadImpact === true
            : false,
      });
      const result = runCase(scenario);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20_000);
      try {
        const upstream = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            store: false,
            max_output_tokens: 320,
            instructions:
              "You draft a brief support update for a synthetic portfolio demo. For launch readiness, address the internal Product, Engineering, Support, and GTM teams. For all other cases, address the advertiser. Use only the supplied finding, evidence, and proposed decision. Write in the first person with a calm, clear tone. Do not invent completed actions, promise policy exceptions or credits, or imply a message was sent. Keep the approval requirement intact. Return only the draft text.",
            input: JSON.stringify({
              case: scenario.id,
              kind: scenario.kind,
              customer: scenario.customer,
              summary: scenario.summary,
              finding: result.diagnosis,
              proposedDecision: result.actionPlan.decision,
              evidence: scenario.evidence,
              humanReview: result.gate,
            }),
          }),
          signal: controller.signal,
        });
        if (!upstream.ok)
          return json(response, 502, {
            error: `The draft service returned HTTP ${upstream.status}.`,
          });
        const draft = extractText(await upstream.json());
        if (!draft) return json(response, 502, { error: "The draft service returned no text." });
        return json(response, 200, {
          draft,
          reviewRequired: result.gate.required,
          reviewer: result.gate.reviewer,
        });
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      return json(response, 400, {
        error: error instanceof Error ? error.message : "Draft request failed.",
      });
    }
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Optional draft service listening at http://127.0.0.1:${port}`);
  });
