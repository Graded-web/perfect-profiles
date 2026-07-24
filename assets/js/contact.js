// Delivery via FormSubmit.co — set FORM_EMAIL to the business inbox to go live.
// First real submission triggers a one-time activation email from FormSubmit.
const FORM_EMAIL = '';

const form = document.getElementById('quote-form');
const status = form.querySelector('.lx-form-status');
const button = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!FORM_EMAIL) {
    status.hidden = false;
    status.textContent =
      'Our quote form isn’t accepting submissions just yet — please check back soon.';
    return;
  }

  button.disabled = true;
  button.textContent = 'Sending…';
  const data = new FormData(form);
  data.append('_subject', 'Quote request — ' + (data.get('company') || 'Perfect Profiles site'));

  try {
    const res = await fetch('https://formsubmit.co/ajax/' + FORM_EMAIL, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    status.hidden = false;
    status.textContent =
      'Thank you — we have your details and will reply within one business day.';
    form.reset();
  } catch (err) {
    status.hidden = false;
    status.textContent =
      'Something went wrong sending your request — please try again in a moment.';
  } finally {
    button.disabled = false;
    button.textContent = 'Request a quote';
  }
});
