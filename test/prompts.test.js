import { test, describe } from "node:test";
import { strict as assert } from "node:assert";

import { defaults, mergeConfig } from "../bin/prompts.js";

describe("mergeConfig", () => {
  test("returns defaults when user config is empty", () => {
    const result = mergeConfig(defaults, {});
    assert.deepEqual(result.prompt, defaults.prompt);
    assert.equal(result.commitMessageTag, defaults.commitMessageTag);
    assert.deepEqual(result.removeLinesMatching, defaults.removeLinesMatching);
    assert.deepEqual(result.stopLinesMatching, defaults.stopLinesMatching);
  });

  test("user prompt replaces default prompt", () => {
    const result = mergeConfig(defaults, {
      prompt: ["one-line", "{extraPrompt}"],
    });
    assert.deepEqual(result.prompt, ["one-line", "{extraPrompt}"]);
  });

  test("user commitMessageTag replaces default", () => {
    const result = mergeConfig(defaults, { commitMessageTag: "msg" });
    assert.equal(result.commitMessageTag, "msg");
  });

  test("user removeLinesMatching replaces defaults (not appends)", () => {
    const result = mergeConfig(defaults, {
      removeLinesMatching: ["^MY:"],
    });
    assert.deepEqual(result.removeLinesMatching, ["^MY:"]);
  });

  test("user stopLinesMatching replaces defaults", () => {
    const result = mergeConfig(defaults, { stopLinesMatching: ["^STOP$"] });
    assert.deepEqual(result.stopLinesMatching, ["^STOP$"]);
  });

  test("placeholders are never overridden by user config", () => {
    const result = mergeConfig(defaults, {
      placeholders: { evil: "yes" },
    });
    assert.deepEqual(result.placeholders, defaults.placeholders);
  });

  test("missing user fields fall back to defaults", () => {
    const result = mergeConfig(defaults, { commitMessageTag: "x" });
    assert.deepEqual(result.prompt, defaults.prompt);
    assert.deepEqual(result.removeLinesMatching, defaults.removeLinesMatching);
  });
});
