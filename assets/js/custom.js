// =========================
// custom.js - Vulpine Solutions
// =========================

function normalizePath(p) {
  // treat "/" and "/index.html" as the same
  return (p || "/").replace(/\/index\.html$/i, "/");
}

// Smooth scroll for same-page anchor links only (ignore dropdown toggles)
document.querySelectorAll('a.nav-link, .btn, .dropdown-item').forEach(a => {
  a.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href) return;

    // Ignore dropdown toggles and plain "#"
    if (this.matches('.dropdown-toggle') || href === '#') return;

    // Only smooth scroll when staying on the same page and a real hash exists
    if (href.includes('#')) {
      const url = new URL(href, window.location.origin);
      const currentPath = normalizePath(window.location.pathname);
      const targetPath = normalizePath(url.pathname);
      const samePage = currentPath === targetPath ||
        (targetPath === '/' && (currentPath === '/')) ||
        (targetPath === '/index.html' && (currentPath === '/'));

      if (url.hash && url.hash.length > 1 && samePage) {
        const target = document.querySelector(url.hash);
        if (target) {
          e.preventDefault();
          const nav = document.querySelector('.navbar');
          const yOffset = nav ? nav.offsetHeight + 10 : 64;
          const y = target.getBoundingClientRect().top + window.pageYOffset - yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });

          const navbarCollapse = document.querySelector('.navbar-collapse.show');
          if (navbarCollapse) new bootstrap.Collapse(navbarCollapse).hide();
        }
      }
    }
  });
});

// Active state: sections on home, pathname elsewhere
function updateActiveNav() {
  const onHome = !!document.querySelector('#home');
  const currentPath = normalizePath(window.location.pathname);

  document.querySelectorAll('.nav-link, .dropdown-item').forEach(link => link.classList.remove('active'));

  if (onHome) {
    const sections = ['#home', '#services', '#about', '#contact'];
    let current = null;
    sections.forEach(id => {
      const el = document.querySelector(id);
      if (el && el.getBoundingClientRect().top <= 120) current = id;
    });
    if (current) {
      // Find any nav-link whose hash matches and whose path is "/" or "/index.html"
      document.querySelectorAll('.nav-link').forEach(link => {
        try {
          const u = new URL(link.getAttribute('href'), location.origin);
          if ((normalizePath(u.pathname) === '/') && u.hash === current) {
            link.classList.add('active');
          }
        } catch { }
      });
    }
  } else {
    // Page-based: mark the dropdown item that matches the current path,
    // and ALSO mark its parent toggle (Trust/People) as active.
    const currentPath = normalizePath(window.location.pathname);

    const links = document.querySelectorAll('.navbar a.nav-link, .navbar .dropdown-item');
    links.forEach(a => {
      try {
        const u = new URL(a.getAttribute('href'), location.origin);
        const linkPath = normalizePath(u.pathname);

        // Only match full pages (no hash-only links)
        if (linkPath === currentPath && (!u.hash || u.hash === '')) {
          a.classList.add('active');

          // If it's inside a dropdown, highlight the parent toggle too
          const dropdown = a.closest('.dropdown');
          if (dropdown) {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            if (toggle) toggle.classList.add('active');
          }
        }
      } catch { /* ignore bad hrefs */ }
    });
  }
}

window.addEventListener('scroll', updateActiveNav);
window.addEventListener('DOMContentLoaded', updateActiveNav);
document.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
  link.addEventListener('click', () => setTimeout(updateActiveNav, 200));
});
