import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dir, "../..");
const envLocalPath = path.join(projectRoot, ".env.local");

let loaded = false;

export function loadEnvLocal(): void {
  if (loaded || !existsSync(envLocalPath)) {
    loaded = true;
    return;
  }

  const content = readFileSync(envLocalPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  loaded = true;
}

export function requireEnv(name: string): string {
  loadEnvLocal();
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getProjectRoot(): string {
  return projectRoot;
}
