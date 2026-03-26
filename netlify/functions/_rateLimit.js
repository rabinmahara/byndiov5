// Simple in-memory rate limiter for Netlify serverless functions
// Resets each cold start — good enough for burst protection on free tier
const hits = {};

/**
 * @param {string} key  — IP or user identifier
 * @param {number} max  — max requests allowed
 * @param {number} windowMs — time window in milliseconds
 * @returns {boolean} true if request is allowed
 */
function rateLimit(key, max = 20, windowMs = 60_000) {
  const now = Date.now();
  if (!hits[key]) hits[key] = [];
  // Purge old entries
  hits[key] = hits[key].filter(t => now - t < windowMs);
  if (hits[key].length >= max) return false;
  hits[key].push(now);
  return true;
}

module.exports = { rateLimit };
