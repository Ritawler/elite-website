// Server-only helper for Bunny Stream. Never import from a Client Component —
// BUNNY_STREAM_TOKEN_AUTH_KEY must never reach the browser.
//
// Computes a short-lived signed embed URL using Bunny's "Token Authentication"
// scheme: token = sha256(security_key + video_id + expires), as documented at
// https://docs.bunny.net/stream/token-authentication
// The video_id itself isn't secret — without a valid, unexpired token the
// embed request is rejected by Bunny regardless of who has the link.

import crypto from "crypto";

const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
const TOKEN_AUTH_KEY = process.env.BUNNY_STREAM_TOKEN_AUTH_KEY;
const PLAYBACK_TTL_SECONDS = 60 * 60 * 2; // ساعتين

export function getSignedEmbedUrl(videoId) {
  const expires = Math.floor(Date.now() / 1000) + PLAYBACK_TTL_SECONDS;
  const token = crypto
    .createHash("sha256")
    .update(`${TOKEN_AUTH_KEY}${videoId}${expires}`)
    .digest("hex");

  return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}?token=${token}&expires=${expires}`;
}
