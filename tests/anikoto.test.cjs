const test = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");
const cheerio = require("cheerio");

const anikotoMeta = require("../dist/anikoto/meta.js");
const anikotoStream = require("../dist/anikoto/stream.js");
const anikotoEpisodes = require("../dist/anikoto/episodes.js");

const providerContext = {
  axios,
  cheerio,
  commonHeaders: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  openWebView: async () => {},
  kvStore: {
    get: async () => null,
    set: async () => {},
    delete: async () => {},
  },
  Aes: {},
};

test("Anikoto getMeta extracts all 1100+ episodes of One Piece grouped in ranges", async () => {
  const getMeta = anikotoMeta.getMeta || anikotoMeta.default?.getMeta;
  const res = await getMeta({
    link: "https://anikototv.to/watch/one-piece-odmau/ep-1",
    providerContext,
  });

  assert.ok(res, "Expected meta object");
  assert.equal(res.title, "One Piece");
  assert.ok(Array.isArray(res.linkList), "Expected linkList array");
  assert.ok(
    res.linkList.length >= 10,
    `Expected at least 10 episode range groups, got ${res.linkList.length}`
  );

  let totalEpisodes = 0;
  for (const group of res.linkList) {
    assert.ok(group.title.startsWith("Episodes "), `Unexpected range title: ${group.title}`);
    assert.ok(Array.isArray(group.directLinks), "Expected directLinks");
    assert.ok(group.directLinks.length > 0, "Expected directLinks to have episodes");
    totalEpisodes += group.directLinks.length;
  }

  assert.ok(
    totalEpisodes >= 1100,
    `Expected at least 1100 total episodes, found ${totalEpisodes}`
  );

  // Check first and last episode in Group 1
  const firstEp = res.linkList[0].directLinks[0];
  assert.equal(firstEp.title, "Episode 1");
  const payload = JSON.parse(firstEp.link);
  assert.equal(payload.slug, "one-piece-odmau");
  assert.equal(payload.epNum, "1");
  assert.ok(payload.dataIds, "Expected dataIds in episode payload");
});

test("Anikoto getEpisodes returns all episodes across ranges", async () => {
  const getEpisodes = anikotoEpisodes.getEpisodes || anikotoEpisodes.default?.getEpisodes;
  const eps = await getEpisodes({
    url: "https://anikototv.to/watch/one-piece-odmau/ep-1",
    providerContext,
  });

  assert.ok(Array.isArray(eps), "Expected episodes array");
  assert.ok(eps.length >= 1100, `Expected at least 1100 episodes, found ${eps.length}`);
  assert.equal(eps[0].title, "Episode 1");
});

test("Anikoto getStream extracts SUB/DUB streams and raw subtitles without dead 1proxy worker", async () => {
  const getMeta = anikotoMeta.getMeta || anikotoMeta.default?.getMeta;
  const getStream = anikotoStream.getStream || anikotoStream.default?.getStream;

  const metaRes = await getMeta({
    link: "https://anikototv.to/watch/one-piece-odmau/ep-1",
    providerContext,
  });
  const firstEp = metaRes.linkList[0].directLinks[0];

  const streams = await getStream({
    link: firstEp.link,
    type: "series",
    signal: new AbortController().signal,
    providerContext,
  });

  assert.ok(Array.isArray(streams) && streams.length > 0, "Expected streams to be returned");

  // Check that both SUB and DUB streams are present
  const hasSub = streams.some((s) => s.server.includes("(SUB)"));
  const hasDub = streams.some((s) => s.server.includes("(DUB)"));
  assert.ok(hasSub, "Expected at least one (SUB) stream");
  assert.ok(hasDub, "Expected at least one (DUB) stream");

  // Verify subtitles
  const withSubs = streams.filter((s) => Array.isArray(s.subtitles) && s.subtitles.length > 0);
  assert.ok(withSubs.length > 0, "Expected streams to contain subtitles");

  const sampleSub = withSubs[0].subtitles[0];
  assert.ok(sampleSub.uri, "Expected subtitle uri");
  assert.ok(sampleSub.uri.startsWith("http"), "Expected subtitle uri to be an HTTP URL");
  assert.ok(
    !sampleSub.uri.includes("fetch.1proxy.workers.dev"),
    "Subtitle uri must NOT use the dead fetch.1proxy worker"
  );
  assert.equal(sampleSub.type, "text/vtt");
});
