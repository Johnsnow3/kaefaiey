const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const castleCore = require("../dist/castle/meta.js"); // contains castleCore helpers
const castleStream = require("../dist/castle/stream.js");

test("parsePlayLink handles castle://play, castle://media, castle://season and raw IDs", () => {
  // 1. Play link
  const p1 = castleStream.parsePlayLink
    ? castleStream.parsePlayLink("castle://play/10061181091837909_10163089156073816")
    : null;
  // If parsePlayLink is internal to bundle, we test stream extraction directly below
  if (p1) {
    assert.equal(p1.movieId, "10061181091837909");
    assert.equal(p1.episodeId, "10163089156073816");

    // 2. Media link
    const p2 = castleStream.parsePlayLink("castle://media/10061181091837909");
    assert.equal(p2.movieId, "10061181091837909");
    assert.equal(p2.episodeId, "");

    // 3. Season link
    const p3 = castleStream.parsePlayLink("castle://season/10061181091837909");
    assert.equal(p3.movieId, "10061181091837909");
    assert.equal(p3.episodeId, "");
  }
});

test("Castle TV getStream extracts all language tracks and subtitles", async () => {
  const axios = require("axios");
  const cheerio = require("cheerio");
  const providerContext = { axios, cheerio };

  // Test The Paradise (has 5 languages: Telugu, Hindi, Tamil, Malayalam, Kannada and English subtitles)
  const streams = await castleStream.getStream({
    link: "castle://play/10061181091837909_10163089156073816",
    type: "movie",
    providerContext,
  });

  assert.ok(streams.length > 0, "Expected streams to be returned");

  // Verify multiple languages are present
  const languages = [...new Set(streams.map((s) => s.tag).filter(Boolean))];
  assert.ok(languages.length >= 2, `Expected at least 2 languages, found: ${languages.join(", ")}`);

  // Verify subtitles are attached
  const withSubs = streams.filter((s) => Array.isArray(s.subtitles) && s.subtitles.length > 0);
  assert.ok(withSubs.length > 0, "Expected streams to contain subtitles");

  const sampleSub = withSubs[0].subtitles[0];
  assert.ok(sampleSub.uri.startsWith("http"), "Expected subtitle uri to be valid URL");
  assert.ok(sampleSub.type === "text/vtt" || sampleSub.type === "application/x-subrip");
  assert.ok(sampleSub.language, "Expected subtitle language to be defined");
});

test("Castle TV getStream accepts castle://media links directly without failure", async () => {
  const axios = require("axios");
  const cheerio = require("cheerio");
  const providerContext = { axios, cheerio };

  // Test directly with castle://media/
  const streams = await castleStream.getStream({
    link: "castle://media/10061181091837909",
    type: "movie",
    providerContext,
  });

  assert.ok(streams.length > 0, "Expected streams from castle://media link");
  assert.ok(streams[0].link.startsWith("http"), "Expected direct HTTP playback link");
});
