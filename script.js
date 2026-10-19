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

// ─── Add to calendar (.ics download) ─────────────────
const calBtn = document.getElementById('addToCalendar');
const joinLink = document.getElementById('episodeJoinLink');

if (calBtn) {
  const meetingUrl = joinLink ? joinLink.href : '';
  const DTSTART = '20261120T100000Z'; // 12:00 SAST (UTC+2)
  const DTEND = '20261120T120000Z';   // 14:00 SAST (UTC+2)

  // Escape text per RFC 5545 (backslash, semicolon, comma, newline)
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  // Fold content lines to <=75 chars with CRLF + space continuation
  const fold = (line) => {
    let out = '';
    while (line.length > 74) { out += line.slice(0, 74) + '\r\n '; line = line.slice(74); }
    return out + line;
  };

  calBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UiPath Uncharted//Episode 4//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:ep4-20261120@uipathuncharted.co.za',
      'DTSTAMP:' + stamp,
      'DTSTART:' + DTSTART,
      'DTEND:' + DTEND,
      fold('SUMMARY:' + esc('UiPath Uncharted - Episode 4 (UiPath Process & Communications Mining)')),
      fold('DESCRIPTION:' + esc('Episode 4 of UiPath Uncharted - UiPath Process & Communications Mining, live on Microsoft Teams. Register: ' + meetingUrl)),
      fold('LOCATION:' + esc('Microsoft Teams')),
      fold('URL:' + meetingUrl),
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uipath-uncharted-episode-4.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

// ─── Back to top ─────────────────────────────────────
// Appears once you scroll, its ring fills with page progress, and a click
// glides (eased) back to the top. Cancelled if the reader scrolls mid-way.
const toTop = document.querySelector('.to-top');

if (toTop) {
  const ring = toTop.querySelector('.to-top-progress');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);
  let ticking = false;
  let frame = null;

  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    toTop.classList.toggle('is-visible', window.scrollY > 500);
    ring.style.strokeDashoffset = String(100 - ratio * 100);
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();

  const stop = () => {
    cancelAnimationFrame(frame);
    frame = null;
    document.documentElement.style.scrollBehavior = '';
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
  };

  toTop.addEventListener('click', () => {
    const start = window.scrollY;
    if (!start) return;
    const firstHeaderControl = [...document.querySelectorAll('.site-header a, .site-header button')]
      .find((el) => el.offsetParent !== null);
    if (firstHeaderControl) firstHeaderControl.focus({ preventScroll: true });
    if (reduceMotion.matches) {
      window.scrollTo(0, 0);
      return;
    }
    stop();
    // Our own easing, so the native smooth-scroll mustn't fight it.
    document.documentElement.style.scrollBehavior = 'auto';
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    const duration = Math.min(1100, Math.max(500, start * 0.25));
    const began = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - began) / duration);
      window.scrollTo(0, start * (1 - easeInOut(t)));
      if (t < 1) frame = requestAnimationFrame(step);
      else stop();
    };
    frame = requestAnimationFrame(step);
  });
}
