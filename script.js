// ─── Mobile nav toggle ───────────────────────────────
const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');
const siteHeader = document.getElementById('siteHeader');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    siteNav.classList.toggle('open');
  });
}

const navLinks = document.querySelectorAll('.site-nav a');
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

window.addEventListener('DOMContentLoaded', () => {
  const currentYear = new Date().getFullYear();
  document.querySelectorAll('.js-current-year').forEach((el) => {
    el.textContent = currentYear;
  });
});

// ─── Header scroll state ─────────────────────────────
window.addEventListener('scroll', () => {
  if (siteHeader) {
    siteHeader.classList.toggle('scrolled', window.scrollY > 20);
  }
}, { passive: true });

// ─── Active nav link highlighting ────────────────────
const sections = document.querySelectorAll('section[id]');

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === '#' + entry.target.id
          );
        });
      }
    });
  },
  { threshold: 0.35 }
);

sections.forEach((section) => navObserver.observe(section));

// ─── Scroll animations ───────────────────────────────
const animateObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        animateObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('[data-animate]').forEach((el) => {
  animateObserver.observe(el);
});
