import path from "node:path";
import { parseArgs, requireStringArg } from "./lib/cli";
import { buildEpisodeFilename } from "./lib/filename";
import { assertFileExists, copyFileEnsuringDir } from "./lib/fsUtils";
import { getNextEpisodeNumber } from "./lib/rss";

const MASTER_DIR = "/Users/alexfarrill/Documents/podcastSource/Episode Masters";

const args = parseArgs(process.argv.slice(2));
const source = requireStringArg(args, "source");
const stem = requireStringArg(args, "stem");
const copyToSourceDir = args["copy-to-source-dir"] === true;

assertFileExists(source);

const episodeNumber = getNextEpisodeNumber();
const filename = buildEpisodeFilename(episodeNumber, stem);
const masterPath = path.join(MASTER_DIR, filename);

copyFileEnsuringDir(source, masterPath);

let sourceDirCopyPath: string | null = null;
if (copyToSourceDir) {
  sourceDirCopyPath = path.join(path.dirname(source), filename);
  copyFileEnsuringDir(source, sourceDirCopyPath);
}

console.log(
  JSON.stringify(
    {
      nextEpisodeNumber: episodeNumber,
      filename,
      masterPath,
      sourceDirCopyPath,
    },
    null,
    2,
  ),
);
