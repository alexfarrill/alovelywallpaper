import { parseArgs, requireStringArg } from "./lib/cli";
import { readAudioMetadata } from "./lib/audio";
import { assertFileExists } from "./lib/fsUtils";
import { uploadEpisodeFile, assertPublicUrlAccessible } from "./lib/s3";

const args = parseArgs(process.argv.slice(2));
const file = requireStringArg(args, "file");
const filename = requireStringArg(args, "filename");

assertFileExists(file);

const metadata = await readAudioMetadata(file);
const upload = await uploadEpisodeFile(file, filename);
await assertPublicUrlAccessible(upload.publicUrl);

console.log(
  JSON.stringify(
    {
      filename,
      publicUrl: upload.publicUrl,
      s3Key: upload.key,
      bytes: metadata.bytes,
      durationSeconds: metadata.durationSeconds,
      durationDisplay: metadata.durationDisplay,
      etag: upload.etag,
    },
    null,
    2,
  ),
);
