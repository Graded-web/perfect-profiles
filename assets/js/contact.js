// Posts to our own worker (/api/quote), which records the lead before relaying
// it to FormSubmit. The destination inbox lives in the worker, not here.
const QUOTE_ENDPOINT = '/api/quote';

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

  try {
    const res = await fetch(QUOTE_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    });
    // A 200 is not proof on its own — the worker reports the real outcome in the
    // body, so only say "thank you" when the lead was actually captured.
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.ok) {
      throw new Error(result.error || 'HTTP ' + res.status);
    }
    status.hidden = false;
    status.textContent =
      'Thank you – we have your details and will reply within one business day.';
    form.reset();
  } catch (err) {
    status.hidden = false;
    status.textContent =
      err.message === 'rate_limited'
        ? 'That request has already been sent – give it a moment before trying again.'
        : 'Something went wrong sending your request – please call or email us and we’ll pick it up.';
  } finally {
    button.disabled = false;
    button.textContent = 'Request a quote';
  }
});
