import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

export function copyFileEnsuringDir(sourceFile: string, destinationFile: string): void {
  mkdirSync(path.dirname(destinationFile), { recursive: true });
  copyFileSync(sourceFile, destinationFile);
}

export function assertFileExists(filePath: string): void {
  if (!existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }
}
