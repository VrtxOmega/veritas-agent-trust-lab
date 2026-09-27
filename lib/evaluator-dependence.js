/**
 * Counts DECLARED metadata groups, not authenticated independent evaluators.
 * The fixture contract uses model_family, prompt_ancestry and retrieval_set;
 * code-path independence, identity verification and provenance are not tested.
 */
const FIELDS = ["model_family", "prompt_ancestry", "retrieval_set"];

function normalizedLabel(value) {
  if (typeof value !== "string") throw new TypeError("Dependence labels must be strings");
  // Identifier policy, not a generic text or filesystem-path normalization.
  const label = value.normalize("NFKC").trim().toLowerCase();
  if (!label || /[\p{Cc}\p{Cf}]/u.test(label)) {
    throw new TypeError("Dependence labels must be nonempty and contain no control text");
  }
  return label;
}

export function declaredEvaluatorKey(evaluator) {
  if (!evaluator || typeof evaluator !== "object" || Array.isArray(evaluator)) {
    throw new TypeError("An evaluator must be an object with three declared labels");
  }
  const fields = FIELDS.map((field) => {
    if (!Object.hasOwn(evaluator, field)) throw new TypeError(`Missing dependence label: ${field}`);
    return normalizedLabel(evaluator[field]);
  });
  // A JSON array preserves tuple boundaries even when components contain '|'.
  return JSON.stringify(fields);
}

export function countDeclaredEvaluatorGroups(evaluators) {
  if (!Array.isArray(evaluators)) throw new TypeError("Evaluators must be an array");
  const groups = new Set();
  // for..of rejects sparse entries rather than silently omitting them.
  for (const evaluator of evaluators) groups.add(declaredEvaluatorKey(evaluator));
  return groups.size;
}
