import { createHmac, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { requireEnv } from "./config";

const REGION = "us-west-2";
const SERVICE = "s3";
const BUCKET = "alovelywallpaper";
const PREFIX = "episodes";
const PUBLIC_BASE_URL = "https://alovelywallpaper.s3.us-west-2.amazonaws.com/episodes";

type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
};

export type UploadResult = {
  key: string;
  publicUrl: string;
  etag: string | null;
};

export function getPublicEpisodeUrl(filename: string): string {
  return `${PUBLIC_BASE_URL}/${encodeURIComponent(filename).replace(/%2F/g, "/")}`;
}

export async function uploadEpisodeFile(filePath: string, filename: string): Promise<UploadResult> {
  const credentials = getCredentials();
  const key = `${PREFIX}/${filename}`;
  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  const body = readFileSync(filePath);
  const now = new Date();

  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);
  const canonicalUri = `/${encodeS3Path(key)}`;
  const canonicalHeaders =
    `host:${BUCKET}.s3.${REGION}.amazonaws.com\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = getSigningKey(credentials.secretAccessKey, dateStamp, REGION, SERVICE);
  const signature = hmacHex(signingKey, stringToSign);
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      authorization,
      "content-length": String(body.byteLength),
      "content-type": "audio/mpeg",
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`S3 upload failed (${response.status}): ${errorText}`);
  }

  return {
    key,
    publicUrl: getPublicEpisodeUrl(filename),
    etag: response.headers.get("etag"),
  };
}

export async function assertPublicUrlAccessible(publicUrl: string): Promise<void> {
  const response = await fetch(publicUrl, {
    method: "HEAD",
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Public URL is not accessible yet (${response.status}): ${publicUrl}`);
  }
}

function getCredentials(): AwsCredentials {
  return {
    accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
  };
}

function toAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function sha256Hex(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: string | Uint8Array, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: string | Uint8Array, value: string): string {
  return createHmac("sha256", key).update(value).digest("hex");
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function encodeS3Path(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
