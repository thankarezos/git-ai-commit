import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export const configuration = JSON.parse(
  readFileSync(join(here, "configuration.json"), "utf8")
);
