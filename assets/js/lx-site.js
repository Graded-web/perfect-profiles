/* Perfect Profiles — sitewide: mobile menu + once-only scroll fades.
   Motion stays inside the quiet-luxe contract: transform/opacity only,
   fades 500ms sparing, menu 200ms, nothing replays, reduced motion = static. */
(function () {
  var nav = document.querySelector('.lx-nav');
  var toggle = nav && nav.querySelector('.lx-nav-toggle');

  function closeMenu() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) closeMenu();
    });
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });

  Array.prototype.forEach.call(document.querySelectorAll(SELECTOR), function (el) {
    // Anything already on screen stays static — the hero owns the load moment.
    if (el.getBoundingClientRect().top < window.innerHeight - 40) return;
    el.classList.add('lx-reveal');
    io.observe(el);
  });
})();
