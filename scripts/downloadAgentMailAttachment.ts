import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getStringArg, parseArgs, requireStringArg, usage } from "./lib/cli";
import { requireEnv } from "./lib/config";

const DEFAULT_API_BASE_URL = "https://api.agentmail.to";
const DEFAULT_MAX_BYTES = 250 * 1024 * 1024;

type MessageAttachment = {
  attachment_id?: string;
  attachmentId?: string;
  id?: string;
  filename?: string;
  size?: number;
  content_type?: string;
  contentType?: string;
  content_disposition?: string;
  contentDisposition?: string;
  content_id?: string;
  contentId?: string;
};

type AttachmentDownloadMetadata = MessageAttachment & {
  download_url?: string;
  downloadUrl?: string;
  expires_at?: string;
  expiresAt?: string;
};

type MessageRef = {
  inboxId: string;
  messageId: string;
  messageUrl: string;
};

const args = parseArgs(process.argv.slice(2));
const outDir = requireStringArg(args, "out-dir");
const attachmentIdArg = getStringArg(args, "attachment-id");
const outputFilenameArg = getStringArg(args, "filename");
const apiBaseUrl = getStringArg(args, "api-base-url") ?? DEFAULT_API_BASE_URL;
const maxBytes = parsePositiveIntegerArg("max-bytes", DEFAULT_MAX_BYTES);
const messageRef = getMessageRef();
const token = requireEnv("AGENTMAIL_TO_API_KEY");

const message = await fetchJson(messageRef.messageUrl, token);
const attachments = getAttachments(message);
const selected = selectAttachment(attachments, attachmentIdArg);
const selectedId = getAttachmentId(selected);

if (!selectedId) {
  throw new Error("Selected attachment does not include an attachment_id");
}

const expectedBytes = getAttachmentSize(selected);
if (expectedBytes !== null && expectedBytes > maxBytes) {
  throw new Error(
    `Attachment is ${expectedBytes} bytes, which exceeds --max-bytes ${maxBytes}`,
  );
}

const attachmentMetadataUrl = `${messageRef.messageUrl}/attachments/${encodeURIComponent(selectedId)}`;
const metadataResponse = await fetch(attachmentMetadataUrl, {
  headers: {
    authorization: `Bearer ${token}`,
  },
});

if (!metadataResponse.ok) {
  throw new Error(
    `AgentMail attachment metadata request failed (${metadataResponse.status})`,
  );
}

const metadataContentType = metadataResponse.headers.get("content-type") ?? "";
let downloadBuffer: Buffer;
let downloadMetadata: AttachmentDownloadMetadata | null = null;

if (metadataContentType.includes("application/json")) {
  downloadMetadata = (await metadataResponse.json()) as AttachmentDownloadMetadata;
  const downloadUrl = getDownloadUrl(downloadMetadata);
  if (!downloadUrl) {
    throw new Error("AgentMail attachment metadata did not include download_url");
  }

  downloadBuffer = await downloadFromTemporaryUrl(downloadUrl);
} else {
  downloadBuffer = Buffer.from(await metadataResponse.arrayBuffer());
}

const bytesActual = downloadBuffer.byteLength;
const bytesExpected = getAttachmentSize(downloadMetadata ?? selected);
if (bytesExpected !== null && bytesActual !== bytesExpected) {
  throw new Error(`Downloaded ${bytesActual} bytes, expected ${bytesExpected}`);
}

mkdirSync(outDir, { recursive: true });
const sourceFilename = getAttachmentFilename(downloadMetadata ?? selected) ?? selectedId;
const outputFilename = safeBasename(outputFilenameArg ?? sourceFilename);
const downloadedPath = path.resolve(outDir, outputFilename);
writeFileSync(downloadedPath, downloadBuffer);

console.log(
  JSON.stringify(
    {
      inboxId: messageRef.inboxId,
      messageId: messageRef.messageId,
      attachmentId: selectedId,
      sourceFilename,
      downloadedPath,
      bytesExpected,
      bytesActual,
      contentType: getAttachmentContentType(downloadMetadata ?? selected),
      expiresAt: getAttachmentExpiresAt(downloadMetadata),
    },
    null,
    2,
  ),
);

function getMessageRef(): MessageRef {
  const messageUrlArg = getStringArg(args, "message-url");
  if (messageUrlArg) {
    return parseMessageUrl(messageUrlArg);
  }

  const inboxId = requireStringArg(args, "inbox-id");
  const messageId = requireStringArg(args, "message-id");
  const messageUrl =
    `${apiBaseUrl.replace(/\/+$/, "")}/v0/inboxes/` +
    `${encodeURIComponent(inboxId)}/messages/${encodeURIComponent(messageId)}`;

  return {
    inboxId,
    messageId,
    messageUrl,
  };
}

function parseMessageUrl(value: string): MessageRef {
  const url = new URL(value);
  const parts = url.pathname.split("/").filter(Boolean);
  const inboxIndex = parts.indexOf("inboxes");
  const messagesIndex = parts.indexOf("messages");

  if (
    inboxIndex === -1 ||
    messagesIndex === -1 ||
    messagesIndex !== inboxIndex + 2 ||
    !parts[inboxIndex + 1] ||
    !parts[messagesIndex + 1]
  ) {
    usage(`Could not parse AgentMail message URL: ${value}`);
  }

  const inboxPart = parts[inboxIndex + 1];
  const messagePart = parts[messagesIndex + 1];
  return {
    inboxId: decodeURIComponent(inboxPart),
    messageId: decodeURIComponent(messagePart),
    messageUrl: `${url.origin}/${parts.slice(0, messagesIndex + 2).join("/")}`,
  };
}

async function fetchJson(url: string, token: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`AgentMail message request failed (${response.status})`);
  }

  return response.json();
}

function getAttachments(value: unknown): MessageAttachment[] {
  if (!value || typeof value !== "object") {
    throw new Error("AgentMail message response was not an object");
  }

  const attachmentArrays = findAttachmentArrays(value);
  if (attachmentArrays.length === 0) {
    throw new Error("AgentMail message response did not include any attachments");
  }

  return attachmentArrays.flat() as MessageAttachment[];
}

function findAttachmentArrays(value: unknown): unknown[][] {
  if (!value || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => findAttachmentArrays(item));
  }

  const arrays: unknown[][] = [];
  for (const [key, item] of Object.entries(value)) {
    if (key === "attachments" && Array.isArray(item)) {
      arrays.push(item);
      continue;
    }

    if (item && typeof item === "object") {
      arrays.push(...findAttachmentArrays(item));
    }
  }

  return arrays;
}

function selectAttachment(
  attachments: MessageAttachment[],
  attachmentId: string | undefined,
): MessageAttachment {
  if (attachmentId) {
    const match = attachments.find((attachment) => getAttachmentId(attachment) === attachmentId);
    if (!match) {
      throw new Error(`No attachment found with attachment_id ${attachmentId}`);
    }
    return match;
  }

  const audioAttachments = attachments.filter(isEpisodeAudioAttachment);
  if (audioAttachments.length === 0) {
    throw new Error("No MP3/audio attachment found; pass --attachment-id to select one");
  }
  if (audioAttachments.length > 1) {
    const ids = audioAttachments.map((attachment) => getAttachmentId(attachment)).join(", ");
    throw new Error(`Multiple MP3/audio attachments found; pass --attachment-id. IDs: ${ids}`);
  }

  return audioAttachments[0];
}

function isEpisodeAudioAttachment(attachment: MessageAttachment): boolean {
  const contentType = getAttachmentContentType(attachment)?.toLowerCase() ?? "";
  const filename = getAttachmentFilename(attachment)?.toLowerCase() ?? "";
  const disposition = getAttachmentDisposition(attachment)?.toLowerCase() ?? "";

  if (disposition === "inline" && !contentType.startsWith("audio/")) {
    return false;
  }

  return contentType === "audio/mpeg" || contentType === "audio/mp3" || filename.endsWith(".mp3");
}

function getAttachmentId(attachment: MessageAttachment): string | undefined {
  return attachment.attachment_id ?? attachment.attachmentId ?? attachment.id;
}

function getAttachmentFilename(attachment: MessageAttachment | null): string | undefined {
  return attachment?.filename;
}

function getAttachmentContentType(attachment: MessageAttachment | null): string | null {
  return attachment?.content_type ?? attachment?.contentType ?? null;
}

function getAttachmentDisposition(attachment: MessageAttachment): string | null {
  return attachment.content_disposition ?? attachment.contentDisposition ?? null;
}

function getAttachmentSize(attachment: MessageAttachment | null): number | null {
  const size = attachment?.size;
  return Number.isInteger(size) && size >= 0 ? size : null;
}

function getDownloadUrl(metadata: AttachmentDownloadMetadata): string | undefined {
  return metadata.download_url ?? metadata.downloadUrl;
}

function getAttachmentExpiresAt(metadata: AttachmentDownloadMetadata | null): string | null {
  return metadata?.expires_at ?? metadata?.expiresAt ?? null;
}

async function downloadFromTemporaryUrl(downloadUrl: string): Promise<Buffer> {
  const response = await fetch(downloadUrl, {
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Attachment download failed (${response.status})`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function safeBasename(filename: string): string {
  const base = path.basename(filename).trim();
  if (!base || base === "." || base === "..") {
    throw new Error(`Invalid output filename: ${filename}`);
  }
  return base;
}

function parsePositiveIntegerArg(name: string, fallback: number): number {
  const value = getStringArg(args, name);
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    usage(`--${name} must be a positive integer`);
  }
  return parsed;
}
