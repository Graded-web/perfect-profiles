// Delivery via FormSubmit.co — set FORM_EMAIL to the business inbox to go live.
// First real submission triggers a one-time activation email from FormSubmit.
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

  if (!FORM_EMAIL) {
    status.hidden = false;
    status.textContent =
      'Our quote form isn’t accepting submissions just yet – please check back soon.';
    return;
  }

  button.disabled = true;
  button.textContent = 'Sending…';
  const data = new FormData(form);
  const name = [data.get('first-name'), data.get('surname')].filter(Boolean).join(' ');
  data.append('_subject', 'Quote request – ' + (name || 'Perfect Profile site'));

  try {
    const res = await fetch('https://formsubmit.co/ajax/' + FORM_EMAIL, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    status.hidden = false;
    status.textContent =
      'Thank you – we have your details and will reply within one business day.';
    form.reset();
  } catch (err) {
    status.hidden = false;
    status.textContent =
      'Something went wrong sending your request – please try again in a moment.';
  } finally {
    button.disabled = false;
    button.textContent = 'Request a quote';
  }
});
