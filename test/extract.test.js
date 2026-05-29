import { test, describe, beforeEach } from "node:test";
import { strict as assert } from "node:assert";

import { extractCommitMessage } from "../bin/extract.js";
import { applyUserOverrides } from "../bin/prompts.js";

describe("extractCommitMessage", () => {
  beforeEach(() => {
    applyUserOverrides({});
  });

  test("extracts from <commit_message> tags", () => {
    const raw =
      "Some preface\n<commit_message>\nfeat: x\n\nbody\n</commit_message>\nlater junk";
    assert.equal(extractCommitMessage(raw), "feat: x\n\nbody");
  });

  test("strips Claude/Anthropic noise inside the tag", () => {
    const raw =
      "<commit_message>\nfeat: x\nClaude wrote this\nbody\n</commit_message>";
    assert.equal(extractCommitMessage(raw), "feat: x\nbody");
  });

  test("falls back to first conventional-commit line when no tag", () => {
    const raw = "preface garbage\nfeat(scope): x\nbody line\n";
    assert.equal(extractCommitMessage(raw), "feat(scope): x\nbody line");
  });

  test("returns empty string when no tag and no conventional header", () => {
    assert.equal(extractCommitMessage("just some prose"), "");
  });

  test("recognises breaking-change marker '!:' in fallback", () => {
    const raw = "feat!: drop deprecated API\nbody";
    assert.equal(extractCommitMessage(raw), "feat!: drop deprecated API\nbody");
  });

  test("honours a custom commitMessageTag override", () => {
    applyUserOverrides({ commitMessageTag: "msg" });
    const raw = "garbage\n<msg>\nfeat: x\n</msg>\nlater";
    assert.equal(extractCommitMessage(raw), "feat: x");
  });

  test("empty input returns empty string", () => {
    assert.equal(extractCommitMessage(""), "");
  });
});
