/* Perfect Profile — sitewide: mobile menu + once-only scroll fades.
   Motion stays inside the quiet-luxe contract: transform/opacity only,
   fades 500ms sparing, menu 200ms, nothing replays, reduced motion = static. */
(function () {
  var nav = document.querySelector('.lx-nav');
  var toggle = nav && nav.querySelector('.lx-nav-toggle');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.documentElement.classList.toggle('lx-menu-open', open);
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setMenu(!nav.classList.contains('is-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    var desktop = window.matchMedia('(min-width: 768px)');
    desktop.addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // FAQ answers unfold like the portfolio range strips (native toggle without JS)
  Array.prototype.forEach.call(document.querySelectorAll('.lx-faq details'), function (details) {
    var summary = details.querySelector('summary');
    if (!summary) return;
    var body = document.createElement('div');
    body.className = 'lx-faq-body';
    var inner = document.createElement('div');
    body.appendChild(inner);
    while (summary.nextSibling) inner.appendChild(summary.nextSibling);
    details.appendChild(body);
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      if (body.classList.contains('open')) {
        body.classList.remove('open');
        var onEnd = function (ev) {
          if (ev.propertyName !== 'grid-template-rows') return;
          if (!body.classList.contains('open')) details.open = false;
          body.removeEventListener('transitionend', onEnd);
        };
        body.addEventListener('transitionend', onEnd);
      } else {
        details.open = true;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            body.classList.add('open');
          });
        });
      }
    });
  });

  if (!('IntersectionObserver' in window)) return;

  var SELECTOR = [
    '.lx-section-head',
    '.lx-plate',
    '.lx-plates-note',
    '.lx-prov-row',
    '.lx-steps > li',
    '.lx-step-row',
    '.lx-included',
    '.lx-quote',
    '.lx-quote-source',
    '.lx-faq',
    '.lx-cta-inner',
    '.lx-direct'
  ].join(', ');

  var io = new IntersectionObserver(function (entries) {
    var batch = entries
      .filter(function (e) { return e.isIntersecting; })
      .sort(function (a, b) {
        return a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
    batch.forEach(function (e, i) {
      // Elements of a grid arriving in the same frame stagger; lone arrivals don't.
      e.target.style.transitionDelay = Math.min(i, 3) * 90 + 'ms';
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px 160px 0px', threshold: 0 });

  Array.prototype.forEach.call(document.querySelectorAll(SELECTOR), function (el) {
    // Anything already on screen stays static — the hero owns the load moment.
    if (el.getBoundingClientRect().top < window.innerHeight - 40) return;
    el.classList.add('lx-reveal');
    io.observe(el);
  });
})();
