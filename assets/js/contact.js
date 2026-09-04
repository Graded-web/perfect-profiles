// Two steps, in this order: record the lead on our own worker first so it can
// never be lost, then deliver it. Delivery has to happen here in the browser —
// FormSubmit sits behind Cloudflare and refuses a server-side relay from our
// worker, so the worker captures and the page delivers.
const QUOTE_ENDPOINT = '/api/quote';
const FORM_EMAIL = 'info@perfectprofile.com.au';

const form = document.getElementById('quote-form');
const status = form.querySelector('.lx-form-status');
const button = form.querySelector('button[type="submit"]');
const emailInput = form.querySelector('#email');
const mobileInput = form.querySelector('#mobile');

// Stricter than the browser's type=email check, which accepts "a@b".
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function emailProblem(value) {
  return EMAIL_RE.test(value) ? '' : "That doesn't look like a valid email address.";
}

// Lenient international rules: formatting characters are ignored, a country
// code (+ or 00) allows 8–15 digits (E.164), and numbers written the
// Australian way (single leading 0) must have the standard 10 digits.
function phoneProblem(value) {
  const cleaned = value.replace(/[\s().\-]/g, '');
  if (!/^\+?\d+$/.test(cleaned)) {
    return 'Phone numbers can only contain digits, spaces and a leading +.';
  }
  const hasCountryCode = cleaned.startsWith('+') || cleaned.startsWith('00');
  const digits = cleaned.replace(/^\+/, '').replace(/^00/, '');
  if (!hasCountryCode && digits.startsWith('0')) {
    return digits.length === 10 ? '' : 'Australian numbers should have 10 digits.';
  }
  if (digits.length < 8) {
    return hasCountryCode
      ? 'That number looks too short.'
      : "That number looks too short – include a country code if you're outside Australia.";
  }
  if (digits.length > 15) return 'That number looks too long.';
  return '';
}

function setFieldError(input, message) {
  const field = input.closest('.lx-field');
  let error = field.querySelector('.lx-field-error');
  if (message) {
    if (!error) {
      error = document.createElement('p');
      error.className = 'lx-field-error';
      error.id = input.id + '-error';
      field.appendChild(error);
    }
    error.textContent = message;
    field.classList.add('lx-field-invalid');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', error.id);
  } else if (error) {
    error.remove();
    field.classList.remove('lx-field-invalid');
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  }
}

const checks = [
  [emailInput, emailProblem],
  [mobileInput, phoneProblem],
];

checks.forEach(([input, problem]) => {
  input.addEventListener('blur', () => {
    if (input.value.trim()) setFieldError(input, problem(input.value.trim()));
  });
  input.addEventListener('input', () => setFieldError(input, ''));
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  let firstInvalid = null;
  checks.forEach(([input, problem]) => {
    const message = problem(input.value.trim());
    setFieldError(input, message);
    if (message && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  button.disabled = true;
  button.textContent = 'Sending…';

  const data = new FormData(form);
  const name = [data.get('first-name'), data.get('surname')].filter(Boolean).join(' ');
  data.append('_subject', 'Quote request – ' + (name || 'Perfect Profile site'));
  // Set Reply-To explicitly rather than relying on FormSubmit guessing from the
  // field name, so hitting Reply in the inbox reaches the prospect.
  data.append('_replyto', data.get('email') || '');

  let captured = false;
  let captureKey = null;
  let rateLimited = false;

  // 1. Capture first — a lead we hold is a lead we can still act on.
  try {
    const res = await fetch(QUOTE_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data,
    });
    const result = await res.json().catch(() => ({}));
    rateLimited = result.error === 'rate_limited';
    captured = !!result.stored;
    captureKey = result.key || null;
  } catch (err) {
    // Capture is best-effort; delivery below still gets its chance.
  }

  if (rateLimited) {
    status.hidden = false;
    status.textContent =
      'That request has already been sent – give it a moment before trying again.';
    button.disabled = false;
    button.textContent = 'Request a quote';
    return;
  }

  // 2. Deliver. A 200 is not proof — FormSubmit reports the real outcome as the
  // string "true"/"false" in the body, so read that rather than the status.
  let delivered = false;
  try {
    const res = await fetch('https://formsubmit.co/ajax/' + FORM_EMAIL, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data,
    });
    const body = await res.json().catch(() => ({}));
    delivered = res.ok && String(body.success) === 'true';
  } catch (err) {
    delivered = false;
  }

  // 3. Tell the worker it arrived, so a stored lead isn't chased unnecessarily.
  if (delivered && captureKey) {
    fetch(QUOTE_ENDPOINT + '/confirm?key=' + encodeURIComponent(captureKey), {
      method: 'POST',
    }).catch(() => {});
  }

  status.hidden = false;
  if (captured || delivered) {
    status.textContent =
      'Thank you – we have your details and will reply within one business day.';
    form.reset();
  } else {
    status.textContent =
      'Something went wrong sending your request – please call or email us and we’ll pick it up.';
  }
  button.disabled = false;
  button.textContent = 'Request a quote';
});
