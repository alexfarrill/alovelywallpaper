import { statSync } from "node:fs";

export type AudioMetadata = {
  bytes: number;
  durationSeconds: number;
  durationDisplay: string;
};

export async function readAudioMetadata(filePath: string): Promise<AudioMetadata> {
  const stat = statSync(filePath);

  const proc = Bun.spawn({
    cmd: [
      "ffprobe",
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ],
    stdout: "pipe",
    stderr: "pipe",
  });

  const output = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`ffprobe failed for ${filePath}: ${stderr.trim()}`);
  }

  const durationSeconds = Math.round(Number.parseFloat(output.trim()));
  if (!Number.isFinite(durationSeconds)) {
    throw new Error(`Could not parse duration from ffprobe output: ${output}`);
  }

  return {
    bytes: stat.size,
    durationSeconds,
    durationDisplay: formatDuration(durationSeconds),
  };
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}
