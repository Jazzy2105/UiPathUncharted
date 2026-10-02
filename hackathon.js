// ─── Hackathon countdown ─────────────────────────────
// Counts down to kick-off, then to the submission deadline, then shows closed.
const hackWrap = document.getElementById('hackCountdownWrap');
const hackTimer = document.getElementById('hackCountdown');

if (hackWrap && hackTimer) {
  const start = new Date(hackWrap.dataset.start).getTime();
  const end = new Date(hackWrap.dataset.end).getTime();
  const phaseEl = document.getElementById('hackPhase');
  const dateEl = document.getElementById('hackDate');
  const timeEl = document.getElementById('hackTime');
  const nums = {
    days: hackTimer.querySelector('[data-cd="days"]'),
    hours: hackTimer.querySelector('[data-cd="hours"]'),
    minutes: hackTimer.querySelector('[data-cd="minutes"]'),
    seconds: hackTimer.querySelector('[data-cd="seconds"]'),
  };
  const pad = (n) => String(n).padStart(2, '0');
  let timer;

  const show = (diff) => {
    nums.days.textContent = pad(Math.floor(diff / 86400000));
    nums.hours.textContent = pad(Math.floor((diff % 86400000) / 3600000));
    nums.minutes.textContent = pad(Math.floor((diff % 3600000) / 60000));
    nums.seconds.textContent = pad(Math.floor((diff % 60000) / 1000));
  };

  const tick = () => {
    const now = Date.now();

    if (now < start) {
      show(start - now);
      return;
    }

    if (now < end) {
      hackWrap.classList.add('is-live');
      phaseEl.textContent = 'Hackathon is live - submissions close in';
      dateEl.textContent = '19 October 2026';
      show(end - now);
      return;
    }

    show(0);
    phaseEl.textContent = 'Hackathon closed';
    dateEl.textContent = 'Submissions are closed - thank you!';
    if (timeEl) timeEl.style.display = 'none';
    if (timer) clearInterval(timer);
  };

  tick();
  timer = setInterval(tick, 1000);
}

// ─── Submission form ─────────────────────────────────
// Static site, no backend: post to the form service set in data-endpoint,
// or, while that is empty, build a prefilled email and hand it to the mail app.
const subForm = document.getElementById('submissionForm');
const subStatus = document.getElementById('submissionStatus');

if (subForm && subStatus) {
  const endpoint = (subForm.dataset.endpoint || '').trim();
  const subNote = document.getElementById('submissionNote');
  const subButton = subForm.querySelector('button[type="submit"]');

  if (endpoint && subNote) {
    subNote.textContent = 'Fill this in once your video is ready. You will see a confirmation here as soon as your entry is received.';
  }

  const v = (name) => subForm.elements[name].value.trim();
  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
  const isWebLink = (s) => {
    try {
      const u = new URL(s);
      return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.');
    } catch (err) {
      return false;
    }
  };

  // One rule per field: returns an error message, or '' when the value is fine
  const rules = {
    team: (s) => (s.length < 2 ? 'Enter your team name.' : ''),
    contact: (s) => (s.length < 2 ? 'Enter the name of your contact person.' : ''),
    email: (s) => (!s ? 'Enter a contact email address.' : !isEmail(s) ? 'Enter a valid email address, like name@example.com.' : ''),
    members: (s) => (s.split(',').filter((m) => m.trim()).length > 4 ? 'A team can have up to four members.' : ''),
    solution: (s) => (s.length < 2 ? 'Enter a name for your solution.' : ''),
    community: (s) => (s.length < 3 ? 'Tell us which community you built for.' : ''),
    problem: (s) => (!s ? 'Describe the problem.' : s.length < 20 ? 'Add a little more detail - at least 20 characters.' : ''),
    products: (s) => (s.length < 2 ? 'List the UiPath products you used.' : ''),
    video: (s) => (!s ? 'Add the link to your video.' : !isWebLink(s) ? 'Enter a full link starting with https://' : ''),
    guide: (s) => (s && !isWebLink(s) ? 'Enter a full link starting with https://' : ''),
  };
  const checkNames = ['c_built', 'c_video', 'c_data', 'c_share'];

  const validateField = (name) => {
    const input = subForm.elements[name];
    const message = rules[name](input.value.trim());
    const field = input.closest('.hack-field');
    let errorEl = field.querySelector('.hack-error');
    if (!errorEl) {
      errorEl = document.createElement('small');
      errorEl.className = 'hack-error';
      errorEl.id = 'err-' + name;
      field.appendChild(errorEl);
      input.setAttribute('aria-describedby', errorEl.id);
    }
    errorEl.textContent = message;
    input.setCustomValidity(message);
    input.setAttribute('aria-invalid', String(Boolean(message)));
    field.classList.toggle('has-error', Boolean(message));
    return !message;
  };

  // Validate a field when it is left, and re-check as it is corrected
  Object.keys(rules).forEach((name) => {
    const input = subForm.elements[name];
    input.addEventListener('blur', () => validateField(name));
    input.addEventListener('input', () => {
      if (input.closest('.hack-field').classList.contains('has-error')) validateField(name);
    });
  });

  // Success pop-up with a burst of confetti
  const modal = document.getElementById('successModal');
  const confetti = document.getElementById('successConfetti');
  const modalClose = document.getElementById('successClose');
  const confettiColours = ['#7c5cff', '#42d6ff', '#6ee7a8', '#fbbf24', '#fb7185', '#ffffff'];

  const hideSuccess = () => {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    confetti.textContent = '';
    subButton.focus();
  };

  const showSuccess = (sent) => {
    if (!modal) return;
    document.getElementById('successSolution').textContent = sent.solution;
    document.getElementById('successTeam').textContent = sent.team;
    document.getElementById('successEmail').textContent = sent.email;

    confetti.textContent = '';
    for (let i = 0; i < 70; i += 1) {
      const piece = document.createElement('i');
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = confettiColours[i % confettiColours.length];
      piece.style.animationDuration = 2.2 + Math.random() * 2 + 's';
      piece.style.animationDelay = Math.random() * 0.6 + 's';
      piece.style.setProperty('--drift', Math.random() * 240 - 120 + 'px');
      piece.style.setProperty('--spin', Math.random() * 1080 - 540 + 'deg');
      confetti.appendChild(piece);
    }

    modal.hidden = false;
    modalClose.focus();
  };

  if (modal) {
    modalClose.addEventListener('click', hideSuccess);
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target === confetti) hideSuccess();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideSuccess();
    });

    // hackathon.html?preview=success shows the pop-up with sample details, without submitting
    if (new URLSearchParams(window.location.search).get('preview') === 'success') {
      showSuccess({ solution: 'Food Bank Intake Agent', team: 'Team Rocket', email: 'sam@example.com' });
    }
  }

  subForm.addEventListener('submit', (e) => {
    e.preventDefault();
    subForm.classList.add('was-validated');
    subStatus.className = 'hack-form-status';

    const badFields = Object.keys(rules).filter((name) => !validateField(name));
    const unticked = checkNames.filter((name) => !subForm.elements[name].checked);

    if (badFields.length || unticked.length) {
      subStatus.textContent = badFields.length
        ? 'Please fix the highlighted fields before submitting.'
        : 'Please tick all four confirmations before submitting.';
      subStatus.classList.add('is-error');
      subForm.elements[badFields[0] || unticked[0]].focus();
      return;
    }

    const body = [
      'UiPath Uncharted Community Hackathon - submission',
      '',
      'Team name: ' + v('team'),
      'Contact person: ' + v('contact'),
      'Contact email: ' + v('email'),
      'Team members: ' + (v('members') || '-'),
      '',
      'Solution name: ' + v('solution'),
      'Community: ' + v('community'),
      'Problem: ' + v('problem'),
      'UiPath products used: ' + v('products'),
      '',
      'Video link: ' + v('video'),
      'User guide link: ' + (v('guide') || '-'),
      '',
      'Confirmed: built on UiPath during the hackathon window; video is 10 minutes or less and covers all five chapters; no real personal or sensitive data shown; UiPath Uncharted may share the video.',
    ].join('\n');

    const subject = 'Hackathon submission - ' + v('team');

    if (endpoint) {
      // Honeypot filled means a bot: pretend it worked and send nothing
      if (v('_gotcha')) {
        subForm.reset();
        subStatus.textContent = 'Entry received - thank you, and good luck!';
        subStatus.classList.add('is-ok');
        return;
      }

      // Keep these keys in step with the flow's request body JSON schema
      const payload = {
        subject: subject,
        submittedAt: new Date().toISOString(),
        teamName: v('team'),
        contactPerson: v('contact'),
        contactEmail: v('email'),
        teamMembers: v('members'),
        solutionName: v('solution'),
        community: v('community'),
        problem: v('problem'),
        uipathProducts: v('products'),
        videoLink: v('video'),
        userGuideLink: v('guide'),
        confirmedBuiltOnUiPath: true,
        confirmedVideoRequirements: true,
        confirmedNoPersonalData: true,
        confirmedShareConsent: true,
      };

      // Captured now because the form is cleared once the entry is accepted
      const sent = { solution: v('solution'), team: v('team'), email: v('email') };

      subButton.disabled = true;
      subStatus.textContent = 'Sending your entry...';

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Submission failed: ' + res.status);
          subForm.reset();
          subForm.classList.remove('was-validated');
          subStatus.textContent = 'Entry received - thank you, and good luck! A confirmation email is on its way.';
          subStatus.classList.add('is-ok');
          showSuccess(sent);
        })
        .catch(() => {
          subStatus.textContent = 'We could not send your entry. Please try again, or email the details to ' + subForm.dataset.to + '.';
          subStatus.classList.add('is-error');
        })
        .finally(() => {
          subButton.disabled = false;
        });
      return;
    }

    window.location.href = 'mailto:' + subForm.dataset.to +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    subStatus.textContent = 'Your email is ready in your mail app - press send to complete your entry. Nothing opened? Email the details to ' + subForm.dataset.to + '.';
    subStatus.classList.add('is-ok');
  });
}
