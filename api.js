/**
 * EduNest API Configuration
 * ─────────────────────────
 * Set BACKEND to your InfinityFree PHP backend URL.
 * All pages use this so you only need to change it in one place.
 *
 * ✏️  Replace the URL below with your actual InfinityFree subdomain:
 */
const BACKEND = 'https://edunest.42web.io/';

/**
 * Build a full API URL from a relative PHP filename.
 * Usage:  fetch(API('auth.php?action=check'))
 *         fetch(API('tasks_api.php'), { method:'POST', body:fd })
 */
function API(path) {
  return BACKEND.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}

/**
 * Also expose as window.API so inline onclick handlers work.
 */
window.API      = API;
window.BACKEND  = BACKEND;
