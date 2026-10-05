// UiPath Uncharted — Field Notes (blog) interactions.
// Plain JS, no dependencies. Every page works without it; this layers on
// filtering, copy buttons and the interactive walkthrough pieces.
(() => {
  'use strict';

  // ─── Reading progress + "On this page" highlight ───────
  const progress = document.querySelector('.uu-progress span');
  const toTop = document.querySelector('.to-top');
  const toTopRing = toTop && toTop.querySelector('.to-top-progress');
  const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
  const tocTargets = tocLinks
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);
  let ticking = false;

  function onScrollFrame() {
    ticking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (progress) progress.style.transform = `scaleX(${ratio})`;
    if (toTop) {
      toTop.classList.toggle('is-visible', window.scrollY > 500);
      toTopRing.style.strokeDashoffset = String(100 - ratio * 100);
    }

    if (tocTargets.length) {
      let active = tocTargets[0];
      tocTargets.forEach((el) => {
        if (el.getBoundingClientRect().top < 140) active = el;
      });
      tocLinks.forEach((link) => {
        const on = link.hash === `#${active.id}`;
        link.classList.toggle('is-active', on);
        if (on) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }

  function requestFrame() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScrollFrame);
  }

  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame, { passive: true });
  onScrollFrame();

  // ─── Back to top: eased glide, cancelled if the reader scrolls ─
  if (toTop) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);
    let frame = null;

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
      document.querySelector('.uu-brand').focus({ preventScroll: true });
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

  // ─── Blog home: search, pillar and status filters ──────
  const feed = document.querySelector('[data-feed]');
  if (feed) {
    const items = [...feed.querySelectorAll('[data-post]')];
    const search = document.getElementById('post-search');
    const pillarButtons = [...document.querySelectorAll('[data-filter-pillar]')];
    const statusButtons = [...document.querySelectorAll('[data-filter-status]')];
    const resultLine = document.querySelector('[data-result]');
    const clearButton = document.querySelector('[data-clear]');
    const emptyState = document.querySelector('[data-empty]');
    const state = { q: '', pillar: null, status: 'all' };

    const apply = () => {
      const q = state.q.trim().toLowerCase();
      let shown = 0;
      items.forEach((item) => {
        const match =
          (!state.pillar || item.dataset.pillar === state.pillar) &&
          (state.status === 'all' || item.dataset.status === state.status) &&
          (!q || item.dataset.search.includes(q));
        item.hidden = !match;
        if (match) shown += 1;
      });
      pillarButtons.forEach((btn) =>
        btn.setAttribute('aria-pressed', String(btn.dataset.filterPillar === state.pillar)));
      statusButtons.forEach((btn) =>
        btn.setAttribute('aria-pressed', String(btn.dataset.filterStatus === state.status)));
      resultLine.textContent = `${shown} of ${items.length} posts`
        + (state.pillar ? ` · ${state.pillar}` : '')
        + (state.status !== 'all' ? ` · ${state.status}` : '');
      clearButton.hidden = !(state.pillar || q || state.status !== 'all');
      emptyState.hidden = shown !== 0;
    };

    search.addEventListener('input', () => {
      state.q = search.value;
      apply();
    });
    pillarButtons.forEach((btn) => btn.addEventListener('click', () => {
      state.pillar = state.pillar === btn.dataset.filterPillar ? null : btn.dataset.filterPillar;
      apply();
    }));
    statusButtons.forEach((btn) => btn.addEventListener('click', () => {
      state.status = btn.dataset.filterStatus;
      apply();
    }));
    clearButton.addEventListener('click', () => {
      Object.assign(state, { q: '', pillar: null, status: 'all' });
      search.value = '';
      apply();
    });
  }

  // ─── Copy buttons (terminal blocks + code windows) ─────
  // Terminals copy only the runnable lines ($ commands and › prompts),
  // never comments or sample output, and only the visible OS variant.
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;
    const box = button.closest('.term, .code-win');
    const text = box.classList.contains('code-win')
      ? box.querySelector('pre').textContent
      : [...box.querySelectorAll('.ln-p, .ln-a')]
        .filter((line) => line.offsetParent !== null)
        .map((line) => line.querySelector('.txt').textContent)
        .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'copied';
      button.classList.add('is-copied');
    } catch {
      button.textContent = 'copy failed';
    }
    clearTimeout(button.resetTimer);
    button.resetTimer = setTimeout(() => {
      button.textContent = 'copy';
      button.classList.remove('is-copied');
    }, 1600);
  });

  // ─── macOS / Windows command toggle ────────────────────
  const OS_KEY = 'uu-blog-os';
  const readOs = () => {
    try { return localStorage.getItem(OS_KEY); } catch { return null; }
  };
  document.querySelectorAll('[data-os]').forEach((root) => {
    const buttons = [...root.querySelectorAll('[data-os-choice]')];
    const setOs = (os, remember) => {
      root.dataset.os = os;
      buttons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.osChoice === os)));
      if (remember) {
        try { localStorage.setItem(OS_KEY, os); } catch { /* storage unavailable */ }
      }
    };
    buttons.forEach((btn) => btn.addEventListener('click', () => setOs(btn.dataset.osChoice, true)));
    setOs(readOs() || (/Windows/i.test(navigator.userAgent) ? 'win' : 'mac'), false);
  });

  // ─── 4-tier report: one row open at a time ─────────────
  document.querySelectorAll('[data-tiers]').forEach((list) => {
    const tiers = [...list.querySelectorAll('.tier')];
    const setOpen = (target) => tiers.forEach((tier) => {
      const open = tier === target;
      tier.classList.toggle('is-open', open);
      tier.querySelector('.tier-btn').setAttribute('aria-expanded', String(open));
      tier.querySelector('.tier-why').hidden = !open;
    });
    tiers.forEach((tier) => tier.querySelector('.tier-btn').addEventListener('click', () => {
      setOpen(tier.classList.contains('is-open') ? null : tier);
    }));
  });

  // ─── Pipeline stages: tabs + prev/next ─────────────────
  document.querySelectorAll('[data-stages]').forEach((widget) => {
    const tabs = [...widget.querySelectorAll('[role="tab"]')];
    const panels = [...widget.querySelectorAll('[role="tabpanel"]')];
    const bar = widget.querySelector('.stage-bar span');
    let index = 0;
    const go = (next, focus) => {
      index = (next + tabs.length) % tabs.length;
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      panels.forEach((panel, i) => { panel.hidden = i !== index; });
      bar.style.width = `${((index + 1) / tabs.length) * 100}%`;
      if (focus) tabs[index].focus();
    };
    tabs.forEach((tab, i) => tab.addEventListener('click', () => go(i)));
    widget.querySelector('[role="tablist"]').addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') go(index + 1, true);
      if (event.key === 'ArrowLeft') go(index - 1, true);
    });
    widget.querySelector('[data-prev]').addEventListener('click', () => go(index - 1));
    widget.querySelector('[data-next]').addEventListener('click', () => go(index + 1));
    go(0);
  });

  // ─── Back-of-envelope calculator ───────────────────────
  // Assumes ~1,800 productive hours per FTE-year (stated in the post).
  document.querySelectorAll('[data-calc]').forEach((calc) => {
    const input = (name) => calc.querySelector(`[name="${name}"]`);
    const output = (name) => calc.querySelector(`[data-out="${name}"]`);
    const vol = input('vol');
    const mins = input('mins');
    const cov = input('cov');
    const update = () => {
      const hours = Math.round((vol.value * 12 * mins.value) / 60 * (cov.value / 100));
      output('vol').textContent = Number(vol.value).toLocaleString();
      output('mins').textContent = `${mins.value} min`;
      output('cov').textContent = `${cov.value}%`;
      output('hours').textContent = hours.toLocaleString();
      output('fte').textContent = (hours / 1800).toFixed(1);
    };
    calc.addEventListener('input', update);
    update();
  });

  // ─── Annotated screenshots: pins <-> explanation cards ─
  document.querySelectorAll('[data-anat]').forEach((anat) => {
    const pins = [...anat.querySelectorAll('.pin')];
    const cards = [...anat.querySelectorAll('.pin-card')];
    const select = (index, fromPin) => {
      pins.forEach((pin, i) => pin.setAttribute('aria-pressed', String(i === index)));
      cards.forEach((card, i) => card.setAttribute('aria-pressed', String(i === index)));
      if (fromPin) cards[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    pins.forEach((pin, i) => pin.addEventListener('click', () => select(i, true)));
    cards.forEach((card, i) => card.addEventListener('click', () => select(i, false)));
  });
})();
