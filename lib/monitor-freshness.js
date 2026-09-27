/**
 * Public-demonstrator freshness rule, not a signature or monitor verifier.
 * Timestamps are UTC ISO strings with seconds and optional .mmm precision.
 * Freshness is inclusive at TTL (0 <= age <= ttl); no future-clock tolerance.
 */
function timestampMs(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
  ) return null;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  // Reject calendar overflow normalized by Date.parse (e.g. February 30).
  const canonical = value.includes(".") ? value : value.replace("Z", ".000Z");
  return new Date(ms).toISOString() === canonical ? ms : null;
}

export function assessHeartbeat(input) {
  const reject = (reason, ageSeconds = null) => ({
    fresh: false,
    ageSeconds,
    reasonCodes: [reason, "AUTHORIZATION_REVOKED"],
  });
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return reject("HEARTBEAT_INPUT_INVALID");
  }
  const { evaluatedAt, lastHeartbeat, ttlSeconds = 10 } = input;
  if (typeof ttlSeconds !== "number" || !Number.isFinite(ttlSeconds) || ttlSeconds < 0) {
    return reject("HEARTBEAT_TTL_INVALID");
  }
  const now = timestampMs(evaluatedAt);
  if (now === null) return reject("EVALUATION_TIME_INVALID");
  if (lastHeartbeat === undefined || lastHeartbeat === null || lastHeartbeat === "") {
    return reject("HEARTBEAT_MISSING");
  }
  const heartbeat = timestampMs(lastHeartbeat);
  if (heartbeat === null) return reject("HEARTBEAT_INVALID");
  const ageSeconds = (now - heartbeat) / 1000;
  if (ageSeconds < 0) return reject("HEARTBEAT_FUTURE", ageSeconds);
  if (ageSeconds > ttlSeconds) {
    // Preserve the existing stale-fixture wire contract, even though its
    // historical reason name covers expired rather than absent telemetry.
    return reject("TELEMETRY_MISSING_FAIL_CLOSED", ageSeconds);
  }
  return { fresh: true, ageSeconds, reasonCodes: ["HEARTBEAT_FRESH"] };
}
