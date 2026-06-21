(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── nav: drop-in on load, blur/background once scrolled ── */
  function initNav() {
    var bar = document.querySelector(".bar");
    if (!bar) return;
    requestAnimationFrame(function () {
      bar.classList.remove("is-hidden-init");
    });
    function onScroll() {
      bar.classList.toggle("scrolled", window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var toggle = document.querySelector(".menu-toggle");
    var links = document.querySelector(".bar .links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        links.classList.toggle("is-open");
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { links.classList.remove("is-open"); });
      });
    }
  }

  /* ── top scroll-progress bar ── */
  function initProgress() {
    var bar = document.querySelector(".progress");
    if (!bar) return;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = pct + "%";
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ── line-reveal headlines: hero ones reveal on load, others on scroll-into-view ── */
  function initLineReveals() {
    var masks = document.querySelectorAll(".mask");
    if (!masks.length) return;

    var heroMasks = document.querySelectorAll(".hero .mask, .curtain-gate .mask");
    heroMasks.forEach(function (m, i) {
      setTimeout(function () { m.classList.add("is-revealed"); }, 150 + i * 110);
    });

    var observed = Array.prototype.filter.call(masks, function (m) {
      return !m.closest(".hero") && !m.closest(".curtain-gate");
    });
    if (!observed.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    observed.forEach(function (m) { io.observe(m); });
  }

  /* ── scroll-triggered fade-ups ── */
  function initFadeUps() {
    var items = document.querySelectorAll(".fade-up, .fade-up-stagger");
    if (!items.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ── curtain intro: Home only ── */
  function initCurtain() {
    var curtain = document.querySelector(".curtain");
    if (!curtain) return;
    requestAnimationFrame(function () {
      curtain.classList.add("show-mark");
    });
    var delay = reduceMotion ? 0 : 1100;
    setTimeout(function () {
      curtain.classList.add("lift");
    }, delay);
  }

  /* ── pinned hero: fade/scale the inner content as it scrolls past ── */
  function initPinnedHero() {
    var pin = document.querySelector(".hero-pin");
    var inner = document.querySelector(".hero-inner");
    if (!pin || !inner || reduceMotion) return;
    function update() {
      var rect = pin.getBoundingClientRect();
      var scrollable = pin.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      var progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
      inner.style.opacity = String(Math.max(1 - progress * 1.3, 0));
      inner.style.transform = "scale(" + (1 - progress * 0.08) + ") translateY(" + progress * 40 + "px)";
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ── contact form: client-side validation only ── */
  function initContactForm() {
    var form = document.querySelector("#quote-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = form.checkValidity();
      var status = document.querySelector(".form-status");
      if (!valid) {
        form.reportValidity();
        return;
      }
      // TODO: wire to a form backend (e.g. Formspree or Netlify Forms) — no submission endpoint yet.
      form.hidden = true;
      if (status) {
        status.hidden = false;
        status.textContent = "Thanks — that's saved on our end for now. Real submission handling isn't wired up yet, so nothing was actually sent.";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initProgress();
    initLineReveals();
    initFadeUps();
    initCurtain();
    initPinnedHero();
    initContactForm();
  });
})();
