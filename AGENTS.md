# AGENTS

## Setup
- This repository publishes the RSS feed at `index.rss`.
- The live RSS feed is deployed from the `main` branch.
- Episode audio lives in the S3 bucket `alovelywallpaper` under the `episodes/` prefix.
- IAM credentials for S3 upload live in `.env.local` as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
- A local archive copy of every finalized episode file must be saved to `/Users/alexfarrill/Documents/podcastSource/Episode Masters`.
- Use the Bun/TypeScript scripts in `scripts/` for episode planning, filename normalization, and S3 upload.
- Use `camelCase` for script filenames and similar code artifacts in this repository. Do not use `kebab-case` for new script files.
- Do not invent data. If required information is missing and that would make it impossible to complete the full task, stop and ask the user for the missing information.

## Expected Input
- The user will usually start with an audio file and episode metadata in prose, for example:

```text
In this episode, Abby interviews Nora Lange, novelist and short story writer, about her books Us Fools and Day Care. Together, they present “Collaboration with Fly” by Lydia Davis.
Recitation begins at 60:32.

Collaboration with Fly
Lydia Davis

I put the word on the page but he added the apostrophe.
```

- This kind of blurb is not guaranteed to contain everything needed to finish the task.
- You must extract what you can from the user’s message, then identify what is still missing.

## Required Procedure
1. Read `index.rss` and determine the next episode number.
   The next episode number must be exactly one higher than the highest existing episode number in the feed. Episodes are sequential.
2. Collect all required episode data before making changes.
   Required data includes everything needed to fully create the RSS item and upload the file correctly, including any metadata not present in the initial user message.
   If anything required is missing, stop and ask follow-up questions.
   Do not continue until the missing information has been provided.
   Do not invent placeholders, guesses, or derived facts that are not explicitly supported by the file, the feed, or the user.
3. Determine the final filename before upload.
   The uploaded MP3 filename must match the established naming pattern used by existing episode files in `index.rss`.
   Rename the source file to the finalized filename before upload.
   Save a copy of that finalized file to `/Users/alexfarrill/Documents/podcastSource/Episode Masters`.
   Use the naming script if needed to keep the filename consistent and reviewable.
4. Upload and validate the audio file.
   Upload the finalized MP3 to the `alovelywallpaper` bucket under `episodes/`.
   Determine the final public URL from the actual uploaded object.
   Determine the file size from the actual uploaded file.
   Determine the audio duration from the actual file.
   Validate that the public MP3 URL is accessible before editing the feed.
5. Update `index.rss` directly.
   Do not stop at drafting XML for copy/paste.
   Generate the GUID from the episode number.
   Use today’s date for the item timestamp unless the user explicitly says otherwise.
   Fill every field in the new RSS item with real data only.
6. Show the user a reviewable summary before deployment.
   Make it easy for the user to see everything.
   Show the episode number, finalized filename, public URL, file size, duration, and the `index.rss` diff or equivalent clear summary of the feed change.
7. Ask for confirmation before deploying.
   Do not push automatically.
   Ask the user to confirm the changes before pushing.
8. Deploy by pushing `main`.
   Once the user confirms, push directly to `main`.

## Non-Negotiable Rules
- Do not invent data.
- Do not guess the filename, file size, audio length, episode number, or any RSS field.
- Do not skip follow-up questions when required information is missing.
- Do not push without user confirmation.
- Keep edits focused on the episode being added and any scripts needed to support that workflow.
- You are not allowed to do one-off work. If I ask you to do something and it's the kind of thing that will need to happen again, you must: do it manually the first time. Show me the output. If I approve, codify it into a script or a skill file or `AGENTS.md`. The test: if I have to ask you for something twice, you failed.
