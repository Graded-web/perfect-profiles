(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var box = document.querySelector('.lx-hero-slides');
  if (!box) return;
  var slides = Array.from(box.querySelectorAll('img'));
  if (slides.length < 2) return;
  var caption = document.getElementById('lx-hero-caption');
  var counter = document.getElementById('lx-hero-count');
  var i = 0;
  function load(img) {
    if (img.dataset.srcset) { img.srcset = img.dataset.srcset; delete img.dataset.srcset; }
    if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
  }
  function tick() {
    if (document.hidden) return;
    var next = (i + 1) % slides.length;
    load(slides[next]);
    load(slides[(next + 1) % slides.length]);
    slides[i].classList.remove('is-active');
    slides[next].classList.add('is-active');
    i = next;
    if (caption) caption.textContent = slides[i].dataset.caption || '';
    if (counter) counter.textContent = (i + 1) + ' / ' + slides.length;
  }
  load(slides[1]);
  setInterval(tick, 3200);
})();
