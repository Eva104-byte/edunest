// EduNest shared dark-mode theme manager
// Include this script in every page: <script src="theme.js"></script>

(function(){
  const DARK_KEY = 'edunest_dark_mode';
  
  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem(DARK_KEY, dark ? '1' : '0');
    // Update any toggle buttons on the page
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = dark ? '☀ Light' : '🌙 Dark';
      btn.title = dark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
  }

  function initTheme() {
    const saved = localStorage.getItem(DARK_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved !== null ? saved === '1' : prefersDark);
  }

  // Expose globally
  window.EduTheme = { toggle: toggleTheme, init: initTheme, apply: applyTheme };
  
  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
