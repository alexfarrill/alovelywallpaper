import { getHighestEpisodeNumber, getNextEpisodeNumber, readEpisodes } from "./lib/rss";

const episodes = readEpisodes();
const highest = getHighestEpisodeNumber();
const next = getNextEpisodeNumber();
const latest = episodes.find((episode) => episode.number === highest);

console.log(
  JSON.stringify(
    {
      rssPath: "index.rss",
      highestEpisodeNumber: highest,
      nextEpisodeNumber: next,
      latestFilename: latest?.filename ?? null,
      latestGuid: latest?.guid ?? null,
    },
    null,
    2,
  ),
);
