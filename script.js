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

// ─── Episode countdown ───────────────────────────────
const countdownWrap = document.querySelector('.episode-countdown');
const countdownEl = document.getElementById('episodeCountdown');

if (countdownWrap && countdownEl) {
  const target = new Date(countdownWrap.dataset.target).getTime();
  const eventEndMs = 2 * 60 * 60 * 1000; // event runs ~2 hours
  const nums = {
    days: countdownEl.querySelector('[data-cd="days"]'),
    hours: countdownEl.querySelector('[data-cd="hours"]'),
    minutes: countdownEl.querySelector('[data-cd="minutes"]'),
    seconds: countdownEl.querySelector('[data-cd="seconds"]'),
  };
  const pad = (n) => String(n).padStart(2, '0');
  let timer;

  const setAll = (v) => {
    nums.days.textContent = nums.hours.textContent = v;
    nums.minutes.textContent = nums.seconds.textContent = v;
  };

  const tick = () => {
    const diff = target - Date.now();

    if (diff <= 0) {
      setAll('00');
      countdownWrap.classList.add('is-live');
      const dateEl = countdownWrap.querySelector('.ec-date');
      const timeEl = countdownWrap.querySelector('.ec-time');
      // Show a live state during the ~2h window, then a wrap-up message
      if (Date.now() - target < eventEndMs) {
        if (dateEl) dateEl.textContent = 'We are live now!';
      } else if (dateEl) {
        dateEl.textContent = 'That is a wrap - thank you!';
        if (timeEl) timeEl.style.display = 'none';
      }
      if (timer) clearInterval(timer);
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    nums.days.textContent = pad(d);
    nums.hours.textContent = pad(h);
    nums.minutes.textContent = pad(m);
    nums.seconds.textContent = pad(s);
  };

  tick();
  timer = setInterval(tick, 1000);
}
