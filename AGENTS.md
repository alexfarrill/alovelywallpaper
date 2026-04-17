# AGENTS

## Project Overview
- This repository publishes the RSS feed at `index.rss`.
- The public feed is served from the repository's `main` branch via GitHub Pages.

## Working Rules
- Make RSS feed updates directly in `index.rss` unless the task explicitly requires another file.
- For this project, push directly to `main` to deploy feed changes. Do not use a feature branch or PR workflow unless the user explicitly asks for it.
- Keep edits minimal and avoid unrelated cleanup in this repository.

## Episode Workflow
- The typical task is adding a new episode entry to `index.rss`.
- The user may omit required metadata on the first message. You must ask follow-up questions for any missing information.
- Every RSS field for the new item must be filled. Do not invent data.
- Do not assume the filename, file size, or audio length.
- Episode audio files are served from `https://alovelywallpaper.s3.us-west-2.amazonaws.com/episodes/` and that bucket corresponds to the CloudFront URL used by existing entries.
- Generate the GUID from the episode number. If the episode number is missing, ask for it.
- Use today's date for the item timestamp unless the user explicitly says otherwise.
- Validate that the MP3 file is publicly accessible before updating the feed.

## Direct Editing Behavior
- Do not stop at drafting XML for copy/paste. Once all required data is available and validated, update `index.rss` directly.
- The user is expected to start each thread with the episode metadata and the file.
- Upload the provided audio file to the correct S3 bucket path when needed.
- Determine the final public file location and the audio length from the actual uploaded file rather than guessing.
- If S3 bucket setup or access is not yet configured correctly, treat that as a blocker and resolve it before editing the feed.
