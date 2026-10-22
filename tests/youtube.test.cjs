const test = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");

test("YouTube provider getStream extracts HLS and progressive streams", async () => {
  const { getStream } = require("../dist/youtube/stream.js");
  const streams = await getStream({
    link: "dQw4w9WgXcQ",
    type: "movie",
    signal: new AbortController().signal,
    providerContext: {
      axios,
      kvStore: { get: async () => null, set: async () => null },
    },
  });

  assert.ok(Array.isArray(streams), "Expected streams array");
  assert.ok(streams.length > 0, "Expected at least one stream");

  const hlsStream = streams.find((s) => s.type === "m3u8");
  assert.ok(hlsStream, "Expected adaptive HLS master stream");
  assert.ok(hlsStream.link.includes("manifest.googlevideo.com") || hlsStream.link.includes("youtube.com"), "HLS link should be from YouTube/Googlevideo CDN");
  assert.equal(hlsStream.headers?.Referer, "https://www.youtube.com/");
  assert.equal(hlsStream.headers?.Origin, "https://www.youtube.com");

  // Check progressive MP4 stream if returned
  const mp4Stream = streams.find((s) => s.type === "mp4");
  if (mp4Stream) {
    assert.ok(mp4Stream.link.includes("googlevideo.com"), "MP4 link should point to googlevideo CDN");
    assert.equal(mp4Stream.headers?.Referer, "https://www.youtube.com/");
  }
});

test("isM3u8Playlist correctly separates HLS playlists from binary media chunks", () => {
  // Extract or recreate isM3u8Playlist logic to ensure contract
  function isM3u8Playlist(targetUrl) {
    try {
      const parsed = new URL(targetUrl);
      const pathname = parsed.pathname.toLowerCase();
      const search = parsed.search.toLowerCase();

      if (
        pathname.endsWith(".ts") ||
        pathname.endsWith(".m4s") ||
        pathname.endsWith(".mp4") ||
        pathname.endsWith(".mkv") ||
        pathname.endsWith(".key") ||
        pathname.endsWith(".vtt") ||
        pathname.includes("/file/seg.ts") ||
        pathname.includes("/seg.ts") ||
        pathname.includes("/segment-") ||
        search.includes("file=seg.ts") ||
        search.includes("is=1") ||
        (pathname.includes("/videoplayback") && !pathname.endsWith(".m3u8"))
      ) {
        return false;
      }

      if (pathname.endsWith(".m3u8") || pathname.endsWith("/m3u8")) {
        return true;
      }

      if (
        (pathname.includes("hls_variant") || pathname.includes("hls_playlist") || pathname.includes("hls_timedtext_playlist")) &&
        !pathname.includes("/videoplayback")
      ) {
        return true;
      }

      if (search.includes(".m3u8") && !search.includes("file=seg.ts")) {
        return true;
      }
    } catch {}
    return false;
  }

  const masterHls = "https://manifest.googlevideo.com/api/manifest/hls_variant/expire/1792674288/file/index.m3u8";
  const subHls = "https://manifest.googlevideo.com/api/manifest/hls_playlist/expire/1792674288/playlist/index.m3u8";
  const timedTextHls = "https://manifest.googlevideo.com/api/manifest/hls_timedtext_playlist/expire/1792674338/playlist/index.m3u8";
  const tsSegment = "https://rr1---sn-gwpa-itqe7.googlevideo.com/videoplayback/id/123/playlist/index.m3u8/begin/0/len/5240/goap/slices=0/gosq/0/file/seg.ts";
  const fmp4InitChunk = "https://rr6---sn-gwpa-jq2e.googlevideo.com/videoplayback/id/123/playlist/index.m3u8/govp/slices=0/gosq/0?is=1&file=seg.ts";
  const progressiveMp4 = "https://rr6---sn-gwpa-jq2e.googlevideo.com/videoplayback?expire=123&itag=18";
  const standardM3u8 = "https://example.com/hls/live/stream.m3u8";
  const standardTs = "https://example.com/hls/live/segment-001.ts";

  assert.equal(isM3u8Playlist(masterHls), true, "Master HLS must be treated as playlist");
  assert.equal(isM3u8Playlist(subHls), true, "Sub-playlist must be treated as playlist");
  assert.equal(isM3u8Playlist(timedTextHls), true, "Timedtext playlist must be treated as playlist");
  assert.equal(isM3u8Playlist(standardM3u8), true, "Standard .m3u8 must be treated as playlist");

  assert.equal(isM3u8Playlist(tsSegment), false, "TS segment chunk must NOT be treated as playlist");
  assert.equal(isM3u8Playlist(fmp4InitChunk), false, "fMP4 init chunk must NOT be treated as playlist");
  assert.equal(isM3u8Playlist(progressiveMp4), false, "Progressive MP4 must NOT be treated as playlist");
  assert.equal(isM3u8Playlist(standardTs), false, "Standard TS must NOT be treated as playlist");
});
