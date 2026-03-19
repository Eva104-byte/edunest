/**
 * EduNest API Configuration
 * ─────────────────────────────────────────────────────────────
 * BACKEND points to the InfinityFree PHP server.
 * The Netlify frontend calls this for all API requests.
 */
const BACKEND = 'https://edunest.42web.io';

function API(path) {
  return BACKEND.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}

window.API     = API;
window.BACKEND = BACKEND;
