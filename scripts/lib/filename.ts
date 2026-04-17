import path from "node:path";

export function buildEpisodeFilename(
  episodeNumber: number,
  showTitle: string,
  guestName: string,
): string {
  if (!Number.isInteger(episodeNumber) || episodeNumber < 1) {
    throw new Error(`Invalid episode number: ${episodeNumber}`);
  }

  const prefix = `EP${String(episodeNumber).padStart(2, "0")}`;
  const normalizedShowTitle = normalizeSegment(showTitle);
  const normalizedGuestName = normalizeSegment(guestName);
  return `${prefix}-${normalizedShowTitle}-${normalizedGuestName}.mp3`;
}

export function normalizeSegment(value: string): string {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (!cleaned) {
    throw new Error("Filename segment is empty after normalization");
  }

  return cleaned;
}

export function resolveTargetFilePath(sourceFile: string, filename: string): string {
  return path.join(path.dirname(sourceFile), filename);
}
