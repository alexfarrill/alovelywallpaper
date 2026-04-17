import path from "node:path";

export function buildEpisodeFilename(episodeNumber: number, stem: string): string {
  if (!Number.isInteger(episodeNumber) || episodeNumber < 1) {
    throw new Error(`Invalid episode number: ${episodeNumber}`);
  }

  const normalizedStem = normalizeStem(stem);
  const prefix = `EP${String(episodeNumber).padStart(2, "0")}`;
  return `${prefix}-${normalizedStem}.mp3`;
}

export function normalizeStem(stem: string): string {
  const cleaned = stem
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!cleaned) {
    throw new Error("Filename stem is empty after normalization");
  }

  return cleaned;
}

export function resolveTargetFilePath(sourceFile: string, filename: string): string {
  return path.join(path.dirname(sourceFile), filename);
}
