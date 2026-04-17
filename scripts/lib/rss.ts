import { readFileSync } from "node:fs";
import path from "node:path";
import { getProjectRoot } from "./config";

const rssPath = path.join(getProjectRoot(), "index.rss");

export type EpisodeRef = {
  number: number;
  guid: string;
  enclosureUrl: string;
  filename: string;
};

export function getRssPath(): string {
  return rssPath;
}

export function readEpisodes(): EpisodeRef[] {
  const xml = readFileSync(rssPath, "utf8");
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  return items
    .map((match) => parseEpisode(match[1]))
    .filter((episode): episode is EpisodeRef => episode !== null);
}

export function getHighestEpisodeNumber(): number {
  return readEpisodes().reduce((max, episode) => Math.max(max, episode.number), 0);
}

export function getNextEpisodeNumber(): number {
  return getHighestEpisodeNumber() + 1;
}

function parseEpisode(itemXml: string): EpisodeRef | null {
  const guid = itemXml.match(/<guid>([^<]+)<\/guid>/)?.[1]?.trim();
  const enclosureUrl = itemXml.match(/<enclosure[^>]*url="([^"]+)"/)?.[1]?.trim();

  if (!guid || !enclosureUrl) {
    return null;
  }

  const guidNumber = guid.match(/EP(\d+)/i)?.[1];
  const filename = enclosureUrl.split("/").pop();
  const fileNumber = filename?.match(/^EP(\d+)-/i)?.[1];
  const numberText = guidNumber ?? fileNumber;

  if (!numberText || !filename) {
    return null;
  }

  return {
    number: Number.parseInt(numberText, 10),
    guid,
    enclosureUrl,
    filename,
  };
}
