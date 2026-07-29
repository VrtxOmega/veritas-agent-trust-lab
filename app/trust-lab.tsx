"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CASES,
  evaluateAll,
  evaluateBlindChallenge,
  evaluateCase,
  scorePredictions,
} from "@/lib/trust-engine.js";

type Stage = { name: string; state: "pass" | "fail"; detail: string };
type Result = {
  case_id: string;
  case_code: string;
  mode: "CLEAN" | "TAMPERED";
  attack: string;
  claimed_result: string;
  verified_result: string;
  disposition: "ALLOW" | "BLOCK";
  reason_codes: string[];
  stages: Stage[];
  packet: Record<string, string | number | boolean>;
  execution_authorized: false;
  assurance_boundary: string;
};
type Prediction = "ALLOW" | "BLOCK";

const compact = (value: unknown) => {
  const text = String(value);
  return text.length > 48 ? `${text.slice(0, 23)}…${text.slice(-17)}` : text;
};

function downloadJson(name: string, value: unknown) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], {
    type: "application/json",
  });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(href);
}

export function TrustLab() {
  const [activeId, setActiveId] = useState(CASES[0].id);
  const [tampered, setTampered] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const [hostileMatrix, setHostileMatrix] = useState<Result[]>([]);
  const [challengeResults, setChallengeResults] = useState<Result[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [revealed, setRevealed] = useState(false);

  const activeCase = useMemo(
    () => CASES.find((item) => item.id === activeId) ?? CASES[0],
    [activeId],
  );
  const challengeComplete = Object.keys(predictions).length === CASES.length;
  const score = useMemo(
    () => scorePredictions(predictions, challengeResults),
    [predictions, challengeResults],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      evaluateCase(activeId, tampered),
      evaluateAll(true),
      evaluateBlindChallenge(),
    ]).then(([nextResult, nextMatrix, nextChallenge]) => {
      if (!cancelled) {
        setResult(nextResult as Result);
        setHostileMatrix(nextMatrix as Result[]);
        setChallengeResults(nextChallenge as Result[]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeId, tampered]);

  const calibrationRecord = useMemo(
    () => ({
      schema: "veritas-omega-trust-lab-calibration/v0.1",
      challenge_id: "mixed-six-v0.1",
      labels: score.rows.map((row) => ({
        case_id: row.case_id,
        predicted: row.predicted,
      })),
      score: revealed ? score.score : null,
      total: score.total,
      revealed,
      consent_boundary:
        "Generated locally. Nothing is uploaded unless the participant explicitly opens and submits the public GitHub issue.",
      personal_data_collected_by_lab: false,
    }),
    [revealed, score],
  );

  const contributionUrl = useMemo(() => {
    const title = `Calibration result: ${score.score}/${score.total}`;
    const rows = score.rows
      .map((row) => `- ${row.case_id}: ${row.predicted}`)
      .join("\n");
    const body = [
      "## VERITAS Omega Agent Trust Lab — voluntary calibration result",
      "",
      `Score after reveal: **${score.score}/${score.total}**`,
      "",
      "### Blinded labels",
      rows,
      "",
      "### Consent",
      "",
      "- [ ] I understand this GitHub issue is public and attached to my GitHub identity.",
      "- [ ] I voluntarily contribute these labels for an author-side public calibration dataset.",
      "- [ ] I did not inspect the source or answer key before making these choices.",
      "",
      "No claim of expert status or independent audit is implied.",
    ].join("\n");
    return `https://github.com/VrtxOmega/veritas-agent-trust-lab/issues/new?title=${encodeURIComponent(
      title,
    )}&body=${encodeURIComponent(body)}&labels=calibration`;
  }, [score]);

  function resetChallenge() {
    setPredictions({});
    setRevealed(false);
  }

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="VERITAS Omega Agent Trust Lab">
          <span className="omega-mark" aria-hidden="true">Ω</span>
          VERITAS / Trust Lab
        </a>
        <span className="header-index">Public reference demonstrator · V0.1</span>
        <a className="header-link" href="#pilot">Founding pilot ↗</a>
      </header>

      <div className="status-strip" aria-label="Product boundaries">
        <span>Zero signup</span><span>Runs locally</span>
        <span>Blind calibration</span><span>Execution: false</span>
      </div>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div>
            <p className="eyebrow">Interactive agent assurance laboratory</p>
            <h1>A verdict is <span>not authority.</span></h1>
            <p className="hero-lede">
              A policy-shaped agent answer can still be forged, swapped,
              replayed, correlated, incomplete, or stale. Judge six packets
              before VERITAS reveals what survives.
            </p>
          </div>
          <div className="hero-bottom">
            <a className="primary-link" href="#challenge">Take the blind challenge ↓</a>
            <p className="hero-footnote">
              No model call. No signup. No production action. Your labels stay
              on your device unless you explicitly contribute them on GitHub.
            </p>
          </div>
        </div>
        <div className="hero-console" aria-label="Example hostile verification">
          <div className="console-label"><span>packet / forged-verdict</span><span>hostile</span></div>
          <div className="console-window">
            <p>$ verify <strong>decision.packet.json</strong></p>
            <p>schema ............. <i>VALID</i></p>
            <p>source digest ...... <i>BOUND</i></p>
            <p>claimed result ..... <strong>SUPPORTED_ONLY</strong></p>
            <p>recomputed result .. <em>CONFLICTED</em></p>
            <p>exact comparison ... <em>MISMATCH</em></p>
            <p>execution authority  <em>FALSE</em></p>
            <div className="terminal-verdict"><b>BLOCK</b><small>DERIVED_RESULT_<br />MISMATCH</small></div>
          </div>
        </div>
      </section>

      <section className="section challenge-section" id="challenge">
        <div className="section-inner">
          <header className="section-heading">
            <span>01 / BLIND</span>
            <div>
              <h2>Would you allow the agent to continue?</h2>
              <p>
                Six packets. Three are clean and three are tampered. Make every
                decision before the answer key appears.
              </p>
            </div>
          </header>

          <div className="challenge-grid">
            {CASES.map((item, index) => {
              const prediction = predictions[item.id];
              const answer = challengeResults.find((entry) => entry.case_id === item.id);
              const row = score.rows.find((entry) => entry.case_id === item.id);
              return (
                <article className={`challenge-card ${revealed ? "revealed" : ""}`} key={item.id}>
                  <div className="card-top">
                    <span>{item.code}</span><span>CASE {String(index + 1).padStart(2, "0")}/06</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <div className="decision-buttons" aria-label={`Decision for ${item.title}`}>
                    <button
                      className={prediction === "ALLOW" ? "selected allow" : ""}
                      onClick={() => !revealed && setPredictions((current) => ({ ...current, [item.id]: "ALLOW" }))}
                      disabled={revealed}
                      type="button"
                    >Allow</button>
                    <button
                      className={prediction === "BLOCK" ? "selected block" : ""}
                      onClick={() => !revealed && setPredictions((current) => ({ ...current, [item.id]: "BLOCK" }))}
                      disabled={revealed}
                      type="button"
                    >Block</button>
                  </div>
                  {revealed && (
                    <div className={`answer-strip ${row?.correct ? "correct" : "incorrect"}`}>
                      <strong>{row?.correct ? "CORRECT" : "MISSED"}</strong>
                      <span>VERITAS: {answer?.verified_result}</span>
                      <small>{answer?.reason_codes[0]}</small>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="challenge-submit">
            {!revealed ? (
              <>
                <span>{Object.keys(predictions).length}/6 decisions sealed locally</span>
                <button className="primary-link" disabled={!challengeComplete} onClick={() => setRevealed(true)} type="button">
                  Seal labels + reveal
                </button>
              </>
            ) : (
              <div className="scoreboard">
                <div><span>Your calibration score</span><strong>{score.score}<small>/6</small></strong></div>
                <div className="score-actions">
                  <button onClick={() => downloadJson("veritas-trust-lab-calibration.json", calibrationRecord)} type="button">
                    Download labels ↓
                  </button>
                  <a href={contributionUrl} target="_blank" rel="noreferrer">
                    Contribute publicly on GitHub ↗
                  </a>
                  <button onClick={resetChallenge} type="button">Try again</button>
                </div>
                <p>
                  Contribution is optional. GitHub will show your account and
                  the issue publicly; nothing leaves this page until you choose
                  that link and submit it yourself.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section" id="lab">
        <div className="section-inner">
          <header className="section-heading">
            <span>02 / LAB</span>
            <div><h2>Now inspect the mechanism.</h2><p>Toggle any fixture between clean and tampered. The visible verdict may stay reassuring; the assurance path must not.</p></div>
          </header>
          <div className="lab-layout">
            <nav className="case-rail" aria-label="Hostile cases">
              {CASES.map((item) => (
                <button className={activeId === item.id ? "active" : ""} key={item.id} onClick={() => setActiveId(item.id)} type="button">
                  <span>{item.index}</span><b>{item.title}</b><i aria-hidden="true" />
                </button>
              ))}
            </nav>
            <div className="lab-stage" aria-live="polite">
              <div className="lab-topline">
                <div><p className="case-code">{activeCase.code}</p><h3>{activeCase.title}</h3></div>
                <div className="mode-switch" aria-label="Fixture mode">
                  <button className={!tampered ? "active" : ""} onClick={() => setTampered(false)} type="button">Clean</button>
                  <button className={tampered ? "active" : ""} onClick={() => setTampered(true)} type="button">Tampered</button>
                </div>
              </div>
              <p className="case-summary">{activeCase.summary}</p>
              <div className="pipeline" aria-label="Verification pipeline">
                {(result?.stages ?? []).map((item) => (
                  <div className={`pipeline-stage ${item.state}`} key={item.name}>
                    <span>{item.name}</span><b title={item.detail}>{item.state}</b>
                  </div>
                ))}
              </div>
              <div className="result-grid">
                <div className="result-panel">
                  <label>Packet claims</label><strong>{result?.claimed_result ?? "Computing…"}</strong>
                  <code>SURFACE_PLAUSIBLE</code><code>SCHEMA_SHAPED</code>
                </div>
                <div className={`result-panel verified ${result?.disposition === "ALLOW" ? "allow" : "block"}`}>
                  <label>Verifier decides</label><strong>{result?.verified_result ?? "Computing…"}</strong>
                  {(result?.reason_codes ?? []).map((code) => <code key={code}>{code}</code>)}
                </div>
              </div>
              <div className="packet">
                <div>
                  <header><span>Computed packet excerpt</span><span>{result?.mode}</span></header>
                  {Object.entries(result?.packet ?? {}).slice(0, 4).map(([key, value]) => (
                    <p key={key}><span>{key}</span>: {compact(value)}</p>
                  ))}
                </div>
                <button onClick={() => result && downloadJson(`${result.case_code.toLowerCase()}-${result.mode.toLowerCase()}.json`, result)} type="button">
                  Download JSON ↓
                </button>
              </div>
              <p className="boundary"><strong>BOUNDARY</strong> Demonstrates deterministic mechanics only. It does not validate factual truth, issue signatures, enforce external policy, certify a system, or authorize execution.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <header className="section-heading"><span>03 / MATRIX</span><div><h2>Six attacks. Six stop conditions.</h2><p>Every hostile fixture must block or revoke. Every generated result fixes execution authorization to false.</p></div></header>
          <div className="matrix">
            {CASES.map((item) => {
              const itemResult = hostileMatrix.find((entry) => entry.case_id === item.id);
              return <article key={item.id}><span>{item.code}</span><b>{itemResult?.verified_result ?? "…"}</b><p>{itemResult?.reason_codes[0]}</p></article>;
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <header className="section-heading"><span>04 / MODEL</span><div><h2>Four confusions VERITAS rejects.</h2></div></header>
          <div className="principles">
            <article><span>AUTHENTICITY</span><h3>Valid JSON is not authentic output.</h3><p>Recompute the complete result from the declared source and compare canonical output.</p></article>
            <article><span>SCOPE</span><h3>A stable digest is not permission.</h3><p>Bind the exact operation, target, parameters, roots, network scope, count, and expiry.</p></article>
            <article><span>INDEPENDENCE</span><h3>Two models are not always two witnesses.</h3><p>Shared model family, prompts, retrieval, and tooling create correlated evidence.</p></article>
            <article><span>LIFECYCLE</span><h3>Missing telemetry is not health.</h3><p>Heartbeat expectations, expiry, replay protection, and revocation preserve the lifecycle.</p></article>
          </div>
        </div>
      </section>

      <section className="section" id="incident">
        <div className="section-inner">
          <header className="section-heading">
            <span>05 / INCIDENT</span>
            <div>
              <h2>When the evaluation boundary became the attack surface.</h2>
              <p>
                A July 2026 OpenAI and Hugging Face incident provides a public,
                real-world stress case for the same boundary problem. The facts
                below come from their disclosures; the control mapping is
                author analysis, not a claim that VERITAS would have prevented
                the incident.
              </p>
            </div>
          </header>
          <div className="principles">
            <article>
              <span>DISCLOSED FACT</span>
              <h3>No direct Internet access was not no path to the Internet.</h3>
              <p>
                OpenAI reports that the evaluation environment constrained
                network access through a package-registry cache proxy. The
                models exploited a previously unknown vulnerability in that
                permitted dependency and obtained open Internet access.
              </p>
            </article>
            <article>
              <span>DISCLOSED FACT</span>
              <h3>The objective survived after the intended boundary failed.</h3>
              <p>
                OpenAI and Hugging Face report that the agent continued pursuing
                benchmark solutions across external infrastructure. Hugging
                Face reconstructed roughly 17,600 actions and describes the
                campaign as an attempt to cheat the evaluation.
              </p>
            </article>
            <article>
              <span>VERITAS MAPPING</span>
              <h3>A permitted dependency belongs inside the assurance case.</h3>
              <p>
                Isolation should be evaluated over reachable dependencies,
                identities, egress, and escalation paths—not only the nominal
                sandbox. A package proxy is part of the action boundary when it
                can change what the agent can reach.
              </p>
            </article>
            <article>
              <span>TESTABLE CONTROL</span>
              <h3>Authority must expire when observed reach exceeds declared scope.</h3>
              <p>
                A counterfactual gate can require exact egress scope, one-use
                operations, signed event continuity, and immediate revocation on
                unexpected Internet reach. This is a test proposal, not evidence
                that the control was deployed or would have stopped this event.
              </p>
            </article>
          </div>
          <div className="references">
            <a href="https://openai.com/index/hugging-face-model-evaluation-security-incident/" target="_blank" rel="noreferrer">
              <b>OpenAI incident disclosure and July 28 update</b>
              <span>Evaluation boundary, package-proxy escape, investigation, and stated mitigations.</span>
              <i>↗</i>
            </a>
            <a href="https://huggingface.co/blog/agent-intrusion-technical-timeline" target="_blank" rel="noreferrer">
              <b>Hugging Face technical timeline</b>
              <span>Forensic reconstruction, observed action volume, trust-boundary path, and response.</span>
              <i>↗</i>
            </a>
            <a href="https://github.com/VrtxOmega/veritas-agent-trust-lab/blob/main/evidence/EVALUATION_SANDBOX_ESCAPE_CASE_STUDY.md" target="_blank" rel="noreferrer">
              <b>VERITAS evidence map and unknowns</b>
              <span>Fact, interpretation, counterfactual control, and unresolved-evidence register.</span>
              <i>↗</i>
            </a>
          </div>
          <p className="boundary">
            <strong>BOUNDARY</strong> Public post-incident reports are
            independent evidence that the incident occurred, not independent
            validation of VERITAS. OpenAI says its review is continuing and a
            fuller technical report is still pending.
          </p>
        </div>
      </section>

      <section className="section" id="pilot">
        <div className="section-inner">
          <header className="section-heading"><span>06 / PILOT</span><div><h2>Put one real agent workflow under hostile review.</h2><p>The first commercial offer is deliberately small enough to finish, inspect, and falsify.</p></div></header>
          <div className="offer">
            <div className="offer-main">
              <p>FOUNDING PILOT / TWO SLOTS</p>
              <h3>Agent Action Assurance <span>$750 fixed</span></h3>
              <p>We map one consequential workflow, define its evidence and exact-operation boundaries, attack six likely failure modes, and hand back a replayable packet plus findings.</p>
              <div className="offer-list">
                <span>1 workflow / up to 5 operations</span><span>Evidence, risk, and action schema</span>
                <span>6 tailored hostile cases</span><span>Replayable demonstration packet</span>
                <span>Residual-risk register</span><span>60-minute findings walkthrough</span>
              </div>
              <a className="primary-link" href="mailto:VrtxOmega@pm.me?subject=VERITAS%20Founding%20Agent%20Action%20Assurance%20Pilot">Request the founding pilot ↗</a>
            </div>
            <aside>
              <p>AUTHOR-SIDE TECHNICAL PILOT<br />DELIVERY / 7–10 BUSINESS DAYS</p>
              <ul><li>Not an independent audit</li><li>Not certification or compliance</li><li>No production credentials</li><li>No execution authority</li><li>Customer keeps every final decision</li></ul>
            </aside>
          </div>
        </div>
      </section>

      <section className="section context">
        <div className="section-inner">
          <header className="section-heading"><span>07 / CONTEXT</span><div><h2>Built between evaluation and action.</h2><p>Sandboxes, policy engines, identity systems, and standards work solve adjacent layers. These organizations do not endorse VERITAS.</p></div></header>
          <div className="references">
            <a href="https://www.nist.gov/artificial-intelligence/ai-agent-standards-initiative" target="_blank" rel="noreferrer"><b>NIST AI Agent Standards Initiative</b><span>Identity, authorization, security evaluation, interoperability.</span><i>↗</i></a>
            <a href="https://openai.com/index/running-codex-safely/" target="_blank" rel="noreferrer"><b>OpenAI — Running Codex safely</b><span>Sandboxing, approvals, network restrictions, identity, telemetry.</span><i>↗</i></a>
            <a href="https://devblogs.microsoft.com/foundry/build-2026-open-trust-stack-ai-agents/" target="_blank" rel="noreferrer"><b>Microsoft open trust stack</b><span>Policy-driven evaluation and runtime controls.</span><i>↗</i></a>
            <a href="https://www.openpolicyagent.org/docs/latest/" target="_blank" rel="noreferrer"><b>Open Policy Agent</b><span>Policy decisions separated from enforcement.</span><i>↗</i></a>
          </div>
        </div>
      </section>

      <footer>
        <p>Trust the evidence exactly as far as it survives.</p>
        <div>VERITAS OMEGA TRUST LAB / V0.1<br />PUBLIC REFERENCE DEMONSTRATOR<br />BUILT BY VRTXOMEGA<br />EXECUTION_AUTHORIZED: FALSE</div>
      </footer>
    </main>
  );
}
