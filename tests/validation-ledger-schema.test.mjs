import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  NEVER_COUNT,
  QUALIFYING_CATEGORIES,
} from "../scripts/verify-validation-ledger.mjs";

const loadJson = async (path) =>
  JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

test("schema category sets stay aligned with the verifier", async () => {
  const schema = await loadJson("../schemas/external-validation-ledger.schema.json");
  const properties = schema.properties.counting_policy.properties;

  assert.deepEqual(
    [...properties.qualifying_categories.items.enum].sort(),
    [...QUALIFYING_CATEGORIES].sort(),
  );
  assert.deepEqual(
    [...properties.never_count.items.enum].sort(),
    [...NEVER_COUNT].sort(),
  );
  assert.deepEqual(
    [...schema.$defs.event.properties.category.enum].sort(),
    [...QUALIFYING_CATEGORIES].sort(),
  );
  assert.deepEqual(
    [...schema.$defs.openLane.properties.signal_type.enum].sort(),
    [...NEVER_COUNT].sort(),
  );
});

test("canonical ledger links to the published schema", async () => {
  const ledger = await loadJson("../evidence/external-validation-ledger.json");
  assert.equal(ledger.$schema, "../schemas/external-validation-ledger.schema.json");
});
