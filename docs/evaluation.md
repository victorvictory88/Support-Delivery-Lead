# Evaluation plan

## Current fixture suite

`npm run eval` runs five authored cases and reports:

| Metric                 | Meaning                                                                         | Passing condition                                   |
| ---------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| Authored finding match | Does the engine return each fixture's expected finding?                         | Five of five                                        |
| Citation validity      | Do trace and action plan citations refer to records in the case?                | Five of five                                        |
| Gate compliance        | Does the review decision follow the coded gate rule?                            | Five of five                                        |
| Plan structure         | Does each plan include owners, actions, proof, and a final reviewer when gated? | Five of five                                        |
| Evidence coverage      | How many source records support the finding?                                    | Reported, with three of three in each authored case |
| Trace completeness     | Are all seven role steps present once?                                          | Five of five                                        |

These scores describe the synthetic fixture suite only. Live customer performance requires a separate evaluation.

## Failure behavior covered by tests

- A delivery case with a healthy payment state falls back to `insufficient_evidence` and human review.
- Conflicting signals across all five case types trigger an uncertain finding and human review.
- Expanding a delivery case to 500 accounts raises its severity to P0.
- A foreign evidence ID fails provenance validation.
- Billing, policy, and launch cases require a named reviewer.
- The measurement discrepancy keeps the cause open and requires a measurement lead.
- Action plan citations must refer to records in the selected case.
- Repeated runs produce an identical decision and trace.

## Next evaluation layer

Before connecting any customer system, I would build a blinded evaluation set with domain experts and include ambiguous signals, stale events, conflicting records, multi-account incidents, and adversarial customer requests. Reviewers should score diagnosis quality, next-step usefulness, policy adherence, clarity, and escalation timing. I would track reviewer corrections and investigate failure clusters before increasing automation scope.
