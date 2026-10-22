const test = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");

const { getPosts, getSearchPosts } = require("../dist/mxplayer/posts.js");
const { getMeta } = require("../dist/mxplayer/meta.js");
const { getEpisodes } = require("../dist/mxplayer/episodes.js");
const { getStream } = require("../dist/mxplayer/stream.js");

const ctx = {
  axios,
  kvStore: { get: () => null, set: () => null },
};

test("MX Player getPosts returns movies and series", async () => {
  const moviePosts = await getPosts({ filter: "movie", page: 1, providerContext: ctx });
  assert.ok(Array.isArray(moviePosts) && moviePosts.length > 0, "Movies should return posts");
  assert.ok(moviePosts[0].title, "Movie post must have title");
  assert.ok(moviePosts[0].link.startsWith("https://www.mxplayer.in/detail/movie/"), "Movie post link format");

  const showPosts = await getPosts({ filter: "series", page: 1, providerContext: ctx });
  assert.ok(Array.isArray(showPosts) && showPosts.length > 0, "Shows should return posts");
  assert.ok(showPosts[0].title, "Show post must have title");
});

test("MX Player getMeta extracts movie details and season links for TV shows", async () => {
  // Movie Meta
  const movieMeta = await getMeta({
    link: "https://www.mxplayer.in/detail/movie/9f3a74f8f9ce84c206589846cd62b418",
    providerContext: ctx,
  });
  assert.equal(movieMeta.title, "Dybbuk");
  assert.equal(movieMeta.type, "movie");
  assert.ok(movieMeta.linkList.length > 0, "Movie must have linkList entry");

  // TV Show Meta
  const showMeta = await getMeta({
    link: "https://www.mxplayer.in/detail/tvshow/d1924002234d9096126aaee2ff997632",
    providerContext: ctx,
  });
  assert.ok(showMeta.title.includes("Aashram"), "Show title must include Aashram");
  assert.equal(showMeta.type, "series");
  assert.ok(showMeta.linkList.length > 0, "Show must have seasons");
  assert.ok(showMeta.linkList[0].episodesLink, "Season must have episodesLink");
});

test("MX Player getEpisodes returns episode list with serialized streamData and id", async () => {
  const showMeta = await getMeta({
    link: "https://www.mxplayer.in/detail/tvshow/d1924002234d9096126aaee2ff997632",
    providerContext: ctx,
  });
  const seasonId = showMeta.linkList[0].episodesLink;
  const episodes = await getEpisodes({ url: seasonId, providerContext: ctx });

  assert.ok(episodes.length > 0, "Episodes must be fetched");
  assert.ok(episodes[0].title, "Episode must have title");
  assert.ok(episodes[0].link.startsWith("{"), "Episode link must be serialized JSON");

  const parsed = JSON.parse(episodes[0].link);
  assert.ok(parsed.id, "Episode JSON must have id");
  assert.ok(parsed.stream, "Episode JSON must have stream");
});

test("MX Player getStream resolves movie streams and prioritizes HLS m3u8", async () => {
  const streams = await getStream({
    link: "https://www.mxplayer.in/detail/movie/9f3a74f8f9ce84c206589846cd62b418",
    type: "movie",
    providerContext: ctx,
  });

  assert.ok(streams.length > 0, "Streams must be found");
  assert.equal(streams[0].type, "m3u8", "First stream must be HLS m3u8 for web playback");
  assert.ok(streams[0].link.includes("cloudfront.net"), "Stream must be on CloudFront CDN");
  assert.ok(streams[0].headers?.Referer.includes("mxplayer.in"), "Stream must have mxplayer Referer");
});

test("MX Player getStream resolves TV Show container, episode link, and episode JSON", async () => {
  // 1. From TV Show link
  const showStreams = await getStream({
    link: "https://www.mxplayer.in/detail/tvshow/d1924002234d9096126aaee2ff997632",
    type: "series",
    providerContext: ctx,
  });
  assert.ok(showStreams.length > 0, "Show streams must resolve episode 1");
  assert.equal(showStreams[0].type, "m3u8", "Show first stream must be m3u8");

  // 2. From Episode JSON (as emitted by episodes.ts)
  const episodes = await getEpisodes({
    url: "https://www.mxplayer.in/detail/tvshow/d1924002234d9096126aaee2ff997632",
    providerContext: ctx,
  });
  assert.ok(episodes.length > 0);

  const epStreams = await getStream({
    link: episodes[0].link,
    type: "episode",
    providerContext: ctx,
  });
  assert.ok(epStreams.length > 0, "Episode JSON streams must resolve");
  assert.equal(epStreams[0].type, "m3u8", "Episode first stream must be m3u8");

  // 3. From Episode URL
  const epId = JSON.parse(episodes[0].link).id;
  const epUrlStreams = await getStream({
    link: `https://www.mxplayer.in/detail/episode/${epId}`,
    type: "episode",
    providerContext: ctx,
  });
  assert.ok(epUrlStreams.length > 0, "Episode URL must resolve streams");
  assert.equal(epUrlStreams[0].type, "m3u8", "Episode URL first stream must be m3u8");
});
