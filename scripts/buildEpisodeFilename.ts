import { parseArgs, requireStringArg } from "./lib/cli";
import { buildEpisodeFilename } from "./lib/filename";

const args = parseArgs(process.argv.slice(2));
const episodeNumberText = requireStringArg(args, "episode");
const showTitle = requireStringArg(args, "show");
const guestName = requireStringArg(args, "guest");

const episodeNumber = Number.parseInt(episodeNumberText, 10);
if (!Number.isInteger(episodeNumber) || episodeNumber < 1) {
  throw new Error(`Invalid episode number: ${episodeNumberText}`);
}

const filename = buildEpisodeFilename(episodeNumber, showTitle, guestName);

console.log(
  JSON.stringify(
    {
      episodeNumber,
      showTitle,
      guestName,
      filename,
    },
    null,
    2,
  ),
);
