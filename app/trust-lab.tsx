"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CASES,
  evaluateAll,
  evaluateBlindChallenge,
  evaluateCase,
  scorePredictions,
} from "@/lib/trust-engine.js";
import {
  CHALLENGE_ID,
  createBlindCommitment,
  createBlindEmailSubmissionUrl,
  createBlindSubmissionUrl,
  createChallengeReceipt,
} from "@/lib/challenge-receipt.js";
import validationLedger from "@/evidence/external-validation-ledger.json";
import campaignLedgersV2 from "@/evidence/campaign-ledgers-v2.json";

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
type BlindCommitment = {
  schema: string;
  commitment_id: string;
  challenge_id: string;
  labels: { case_id: string; predicted: Prediction }[];
  verification_status: "LOCAL_UNSUBMITTED";
  count_weight: 0;
  personal_data_collected_by_lab: false;
  execution_authorized: false;
  verification_note: string;
};
type ChallengeReceipt = {
  schema: string;
  receipt_id: string;
  challenge_id: string;
  labels: { case_id: string; predicted: Prediction }[];
  score: number;
  total: number;
  self_reported: true;
  independence_status: "UNVERIFIED_SELF_REPORTED";
  count_weight: 0;
  personal_data_collected_by_lab: false;
  execution_authorized: false;
  verification_note: string;
};

const campaignTarget = validationLedger.campaign.validation_target;
const openLaneCount = validationLedger.open_lanes.length;
const protocolProgress = campaignLedgersV2.progress;

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

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function TrustLab() {
  const [activeId, setActiveId] = useState(CASES[0].id);
  const [tampered, setTampered] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const [hostileMatrix, setHostileMatrix] = useState<Result[]>([]);
  const [challengeResults, setChallengeResults] = useState<Result[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [revealed, setRevealed] = useState(false);
  const [blindCommitment, setBlindCommitment] =
    useState<BlindCommitment | null>(null);
  const [challengeReceipt, setChallengeReceipt] =
    useState<ChallengeReceipt | null>(null);
  const [shareState, setShareState] = useState("Invite one reviewer");

  const activeCase = useMemo(
    () => CASES.find((item) => item.id === activeId) ?? CASES[0],
    [activeId],
  );
  const challengeComplete = Object.keys(predictions).length === CASES.length;
  const challengeReady =
    challengeComplete && challengeResults.length === CASES.length;
  const score = useMemo(
    () => scorePredictions(predictions, challengeResults),
    [predictions, challengeResults],
  );
  const sealedLabels = useMemo(
    () =>
      CASES.flatMap((item) => {
        const predicted = predictions[item.id];
        return predicted ? [{ case_id: item.id, predicted }] : [];
      }),
    [predictions],
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

  useEffect(() => {
    let cancelled = false;
    if (sealedLabels.length !== CASES.length) return;
    createBlindCommitment({ labels: sealedLabels })
      .then((commitment) => {
        if (!cancelled) setBlindCommitment(commitment as BlindCommitment);
      })
      .catch(() => {
        if (!cancelled) setBlindCommitment(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sealedLabels]);

  useEffect(() => {
    let cancelled = false;
    if (!revealed || score.total !== CASES.length) return;
    createChallengeReceipt({
      labels: score.rows.map(({ case_id, predicted }) => ({
        case_id,
        predicted,
      })),
      score: score.score,
      total: score.total,
    })
      .then((receipt) => {
        if (!cancelled) setChallengeReceipt(receipt as ChallengeReceipt);
      })
      .catch(() => {
        if (!cancelled) setChallengeReceipt(null);
      });
    return () => {
      cancelled = true;
    };
  }, [revealed, score]);

  const calibrationRecord = useMemo(
    () => ({
      schema: "veritas-omega-trust-lab-calibration/v0.2",
      challenge_id: CHALLENGE_ID,
      receipt: challengeReceipt,
      labels: score.rows.map((row) => ({
        case_id: row.case_id,
        predicted: row.predicted,
      })),
      score: revealed ? score.score : null,
      total: score.total,
      revealed,
      consent_boundary:
        "Generated locally. Nothing is uploaded unless the participant explicitly submits the public GitHub issue or manually sends the private email commitment.",
      personal_data_collected_by_lab: false,
    }),
    [challengeReceipt, revealed, score],
  );

  const preRevealContributionUrl = useMemo(() => {
    if (!blindCommitment) return "";
    return createBlindSubmissionUrl(blindCommitment);
  }, [blindCommitment]);

  const preRevealEmailUrl = useMemo(() => {
    if (!blindCommitment) return "";
    return createBlindEmailSubmissionUrl(blindCommitment);
  }, [blindCommitment]);

  function resetChallenge() {
    setPredictions({});
    setRevealed(false);
    setBlindCommitment(null);
    setChallengeReceipt(null);
    setShareState("Invite one reviewer");
  }

  async function shareReviewerInvite() {
    if (!challengeReceipt) return;
    const pageUrl = `${window.location.href.split("#")[0]}#challenge`;
    const text = [
      `I took the six-case VERITAS Agent Trust Lab blind challenge and scored ${score.score}/${score.total}.`,
      `Self-reported receipt: ${challengeReceipt.receipt_id}`,
      "Can you take it before reading the source or answer key?",
      "A receipt is reproducible but does not count as independent validation unless an outside participant voluntarily submits a verifiable label set.",
    ].join("\n");
    try {
      if (navigator.share) {
        await navigator.share({
          title: "VERITAS Agent Trust Lab blind challenge",
          text,
          url: pageUrl,
        });
        setShareState("Invite shared");
        return;
      }
      await copyText(`${text}\n${pageUrl}`);
      setShareState("Invite copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyText(`${text}\n${pageUrl}`);
      setShareState("Invite copied");
    }
  }

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="VERITAS Omega Agent Trust Lab">
          <span className="omega-mark" aria-hidden="true">Ω</span>
          VERITAS / Trust Lab
        </a>
        <span className="header-index">Public reference demonstrator · V0.1</span>
        <a className="header-link" href="#external-evidence">
          Protocol v2 / {protocolProgress.qualifying_events} verified ↗
        </a>
      </header>

      <div className="status-strip" aria-label="Product boundaries">
        <span>Zero signup</span><span>Runs locally</span>
        <span>About 5 minutes</span>
        <span>Mobile-friendly</span>
        <span>{protocolProgress.qualifying_events}/{campaignTarget} verified</span>
        <span>Execution: false</span>
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
              on your device unless you explicitly submit them on GitHub or
              manually send the private email commitment.
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
                About five minutes on phone or desktop. Six packets, no signup,
                and no upload unless you explicitly submit. Make every decision
                before the answer key appears.
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
                <div className="pre-reveal-copy">
                  <span>{Object.keys(predictions).length}/6 decisions sealed locally</span>
                  <p>
                    Download your score-free commitment first. To contribute an
                    outside attempt, submit it through GitHub or email before
                    revealing, then return here for your immediate personal
                    result. GitHub is public. Email is private, manually sent,
                    and discloses your email address to the recipient. Either
                    timestamp proves only receipt of the six labels—not
                    independence, expertise, honesty, or source blindness.
                  </p>
                </div>
                <div className="pre-reveal-actions">
                  <button
                    className="secondary-link"
                    disabled={!blindCommitment}
                    onClick={() =>
                      blindCommitment &&
                      downloadJson(
                        "veritas-trust-lab-pre-reveal-commitment.json",
                        blindCommitment,
                      )
                    }
                    type="button"
                  >
                    Download pre-reveal commitment ↓
                  </button>
                  {blindCommitment && (
                    <a
                      className="primary-link"
                      href={preRevealContributionUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Commit labels publicly before reveal ↗
                    </a>
                  )}
                  {blindCommitment && (
                    <a
                      className="secondary-link"
                      href={preRevealEmailUrl}
                    >
                      Prepare private email commitment ↗
                    </a>
                  )}
                  <button
                    className="secondary-link"
                    disabled={!challengeReady}
                    onClick={() => setRevealed(true)}
                    type="button"
                  >
                    Reveal privately (weight 0)
                  </button>
                </div>
              </>
            ) : (
              <div className="scoreboard">
                <div><span>Your calibration score</span><strong>{score.score}<small>/6</small></strong></div>
                <div className="score-actions">
                  <button
                    disabled={!challengeReceipt}
                    onClick={() => downloadJson("veritas-trust-lab-calibration.json", calibrationRecord)}
                    type="button"
                  >
                    Download receipt ↓
                  </button>
                  <button
                    disabled={!challengeReceipt}
                    onClick={shareReviewerInvite}
                    type="button"
                  >
                    {shareState}
                  </button>
                  <button onClick={resetChallenge} type="button">Try again</button>
                </div>
                <div className="receipt-card">
                  <span>SELF-REPORTED CHALLENGE RECEIPT / WEIGHT 0</span>
                  <code>
                    {challengeReceipt?.receipt_id ?? "Computing local receipt…"}
                  </code>
                  <p>
                    Deterministically commits to this challenge version, label
                    set, and score. It is not signed and does not prove identity,
                    independence, expertise, or correctness.
                  </p>
                </div>
                <p>
                  This post-reveal record remains a self-report at weight zero.
                  A potentially qualifying attempt must be submitted through a
                  pre-reveal commitment action and is counted only after its
                  identity, independence evidence, and exact scope are verified.
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

      <section className="section" id="external-evidence">
        <div className="section-inner">
          <header className="section-heading">
            <span>06 / EXTERNAL</span>
            <div>
              <h2>Eight independently attributable outside actions now qualify.</h2>
              <p>
                Three external curators merged scoped Trust Lab catalogue or
                watchlist entries. A separate repository owner independently reproduced a concrete
                security defect in a campaign-produced Action contribution and
                issued a blocking technical review, then re-reviewed and merged
                the corrected contribution. That lifecycle remains one event.
                A fourth external repository owner merged a campaign-produced
                regression fix. A Trail of Bits collaborator then required a
                concrete documentation correction, and a freedesktop-rs member
                approved a separate contribution while considering its source
                break. A Rask repository actor then closed a reachability patch
                without merge and identified the unaddressed root cause as the
                mangling collision. That unfavorable review counts once and is
                separately recorded as a negative outcome and closed lane.
              </p>
            </div>
          </header>
          <div className="campaign-meter" aria-label="Protocol v2 balanced evidence state">
            <div>
              <span>PROTOCOL V2 / BALANCED EVIDENCE</span>
              <strong>
                {protocolProgress.qualifying_events}
                <small>/{campaignTarget}</small>
              </strong>
            </div>
            <div>
              <span
                style={{
                  width: `${(protocolProgress.qualifying_events / campaignTarget) * 100}%`,
                }}
              />
            </div>
            <p>
              {protocolProgress.remaining.qualifying_events} qualifying
              events remain. Blind labels:{" "}
              {protocolProgress.pre_reveal_blind_label_sets}/15. Technical:{" "}
              {protocolProgress.technical_reproductions_reviews_or_integrations}/10.
              Adopter reports: {protocolProgress.structured_adopter_reports}/5.
              Hostile cases:{" "}
              {protocolProgress.independently_proposed_or_executed_hostile_cases}/5.
              Verifier runs:{" "}
              {protocolProgress.independent_verifier_runs_cross_evaluations_or_compatible_implementations}/3.
              {" "}{openLaneCount} legacy open lanes, local receipts, bots,
              traffic, outreach, and thanks stay at weight zero. Settled
              arms-length pilot revenue: ${protocolProgress.settled_revenue_usd}/$750.
            </p>
          </div>
          <div className="principles">
            <article>
              <span>WHAT IT PROVES</span>
              <h3>Three curator decisions, one reproduction, two integrations, and two reviews are public.</h3>
              <p>
                GitHub records separate external merge actors for
                systempromptio pull request #27, gmh5225 pull request #18, and
                scadastrangelove pull request #29. The first two upstream
                READMEs and the third repository&apos;s WATCHLIST each contain one
                scoped Trust Lab entry. The
                AgentDoctor owner separately reported reproducing an
                outside-workspace write through an output-file symlink and
                requested a focused remediation matrix, then independently
                re-verified the corrected commit and merged pull request #18.
                That reproduction, review, approval, and merge remain one
                event. The Drift owner separately merged the staleness sampling
                regression fix in pull request #792. The Dylint collaborator
                separately required synchronized rustdoc and generated README
                corrections, then merged the corrected pull request. Its review
                and merge also remain one event. The nmrs member separately
                approved pull request #521 while retaining the merge decision
                for source-compatibility review. The Rask repository actor
                separately closed pull request #469 without merge and stated
                that the patch addressed the symptom rather than the mangling
                collision. That negative root-cause review is counted once.
              </p>
            </article>
            <article>
              <span>WHAT REMAINS OPEN</span>
              <h3>External action is not VERITAS efficacy.</h3>
              <p>
                No independent participant has contributed a pre-reveal label
                set, and no customer has purchased the pilot. Efficacy,
                calibration, certification, adoption, endorsement, and
                commercial demand remain unproven.
              </p>
            </article>
          </div>
          <div className="references">
            <a href="https://github.com/systempromptio/awesome-ai-agent-governance/pull/27" target="_blank" rel="noreferrer">
              <b>Merged curator decision</b>
              <span>One-line, source-linked catalog submission merged by an independent maintainer.</span>
              <i>↗</i>
            </a>
            <a href="https://github.com/systempromptio/awesome-ai-agent-governance/blob/main/README.md" target="_blank" rel="noreferrer">
              <b>Live upstream catalog entry</b>
              <span>Security, Red-Teaming, and Threat Models section.</span>
              <i>↗</i>
            </a>
            <a href="https://github.com/gmh5225/awesome-ai-security/pull/18" target="_blank" rel="noreferrer">
              <b>Second merged curator decision</b>
              <span>Independent AI-security repository owner accepted the scoped entry.</span>
              <i>↗</i>
            </a>
            <a href="https://github.com/gmh5225/awesome-ai-security/blob/main/README.md" target="_blank" rel="noreferrer">
              <b>Second live upstream entry</b>
              <span>Public catalogue readback at the recorded merge commit.</span>
              <i>↗</i>
            </a>
            <a href="https://github.com/scadastrangelove/awesome-ai-security-tools/pull/29" target="_blank" rel="noreferrer">
              <b>Third merged curator decision</b>
              <span>External repository owner accepted the scoped Trust Lab entry into the new-project watchlist.</span>
              <i>↗</i>
            </a>
            <a href="https://github.com/pranee54/AgentDoctor/pull/18" target="_blank" rel="noreferrer">
              <b>Reproduced, corrected, and merged</b>
              <span>External repository owner reproduced the Action defect, required remediation, re-verified the fix, and merged it as one counted event.</span>
              <i>↗</i>
            </a>
            <a href="https://github.com/mick-gsk/drift/pull/792" target="_blank" rel="noreferrer">
              <b>Merged external integration</b>
              <span>External repository owner accepted the focused staleness sampling regression fix.</span>
              <i>↗</i>
            </a>
            <a href="https://github.com/trailofbits/dylint/pull/2016" target="_blank" rel="noreferrer">
              <b>Trail of Bits merged integration</b>
              <span>External collaborator reviewed, corrected, and merged the focused lint fix; this remains one counted event.</span>
              <i>↗</i>
            </a>
            <a href="https://github.com/freedesktop-rs/nmrs/pull/521#pullrequestreview-4814368955" target="_blank" rel="noreferrer">
              <b>freedesktop-rs approval</b>
              <span>External project member approved the fix and retained the merge decision for source-break consideration.</span>
              <i>↗</i>
            </a>
            <a href="https://github.com/rask-lang/rask/pull/469#issuecomment-5133606097" target="_blank" rel="noreferrer">
              <b>Rask root-cause rejection</b>
              <span>External repository actor closed the patch without merge and identified the missed mangling-collision root cause.</span>
              <i>↗</i>
            </a>
            <a href="https://github.com/VrtxOmega/veritas-agent-trust-lab/blob/main/protocol/campaign-protocol-v2.json" target="_blank" rel="noreferrer">
              <b>Signed Campaign Protocol v2</b>
              <span>Prospective diversity caps, evidence minima, commercial boundary, and negative stop rules.</span>
              <i>↗</i>
            </a>
          </div>
          <p className="boundary">
            <strong>SCOPE</strong> Qualifying external validations:{" "}
            {protocolProgress.qualifying_events}, from{" "}
            {protocolProgress.distinct_independent_validators} distinct validators: three
            scoped curator-fit decisions and one independent technical
            reproduction, two accepted external integrations, and two
            substantive external reviews. One review rejected the Rask patch
            for missing the mangling-collision root cause. These do not establish VERITAS
            efficacy, endorsement, product adoption, release inclusion, deployed
            use of the AgentDoctor Action, merge of the still-open nmrs pull
            request, correctness or acceptance of the rejected Rask patch, or
            payment. Independent blind label sets: 0. Verified payments:
            ${protocolProgress.settled_revenue_usd}.
          </p>
        </div>
      </section>

      <section className="section" id="participate">
        <div className="section-inner">
          <header className="section-heading">
            <span>07 / PARTICIPATE</span>
            <div>
              <h2>Contribute the evidence that is still missing.</h2>
              <p>
                Three narrow routes. No signup for the challenge, no claim that
                a submission proves expertise or endorsement, and no automatic
                promotion into the canonical six-case score.
              </p>
            </div>
          </header>
          <div className="principles">
            <article>
              <span>FIVE MINUTES / BLIND</span>
              <h3>Commit six labels before reveal.</h3>
              <p>
                Works on phone or desktop. Download the score-free commitment,
                choose public GitHub or private manual email, then reveal your
                personal result immediately.
              </p>
              <a className="primary-link" href="#challenge">Take the blind challenge ↓</a>
            </article>
            <article>
              <span>EXTERNAL CANDIDATE / HOSTILE</span>
              <h3>Show us a failure mode the six cases miss.</h3>
              <p>
                Submit a synthetic or public scenario, expected safe outcome,
                rationale, reproduction path, and conflicts. It enters the
                candidate corpus first—not the canonical challenge.
              </p>
              <a
                className="primary-link"
                href="https://github.com/VrtxOmega/veritas-agent-trust-lab/issues/new?template=new-attack.yml"
                target="_blank"
                rel="noreferrer"
              >
                Propose a hostile case ↗
              </a>
            </article>
            <article>
              <span>REAL WORKFLOW / ADOPTER</span>
              <h3>Report one consequential agent operation.</h3>
              <p>
                Record the operation, evidence, VERITAS and human decisions,
                actual outcome, errors, usefulness, failures, and whether you
                would use the method again.
              </p>
              <a
                className="primary-link"
                href="https://github.com/VrtxOmega/veritas-agent-trust-lab/issues/new?template=adopter-report.yml"
                target="_blank"
                rel="noreferrer"
              >
                Submit an adopter report ↗
              </a>
            </article>
          </div>
          <p className="boundary">
            <strong>PRIVACY</strong> GitHub issue submissions are public and
            attached to the submitter&apos;s account. Do not include secrets,
            credentials, customer data, private logs, or production identifiers.
            A submission remains uncounted until its identity, independence,
            evidence, scope, and Protocol v2 caps are verified.
          </p>
        </div>
      </section>

      <section className="section" id="pilot">
        <div className="section-inner">
          <header className="section-heading"><span>08 / PILOT</span><div><h2>Put one real agent workflow under hostile review.</h2><p>The first commercial offer is deliberately small enough to finish, inspect, and falsify.</p></div></header>
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
              <div className="pilot-actions">
                <a className="primary-link" href="mailto:VrtxOmega@pm.me?subject=VERITAS%20Founding%20Agent%20Action%20Assurance%20Pilot">Request the founding pilot ↗</a>
                <a className="secondary-link" href="./founding-pilot-sample.md">Inspect sample dossier ↗</a>
                <a className="secondary-link" href="./founding-pilot-sample.json">Machine-readable sample ↗</a>
              </div>
            </div>
            <aside>
              <p>AUTHOR-SIDE TECHNICAL PILOT<br />DELIVERY / 7–10 BUSINESS DAYS</p>
              <ul><li>Sample is illustrative, not client work</li><li>Not an independent audit</li><li>Not certification or compliance</li><li>No production credentials</li><li>No execution authority</li><li>Customer keeps every final decision</li></ul>
            </aside>
          </div>
        </div>
      </section>

      <section className="section context">
        <div className="section-inner">
          <header className="section-heading"><span>09 / CONTEXT</span><div><h2>Built between evaluation and action.</h2><p>Sandboxes, policy engines, identity systems, and standards work solve adjacent layers. These organizations do not endorse VERITAS.</p></div></header>
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
