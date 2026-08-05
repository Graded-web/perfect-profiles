(function () {
  var open = null; // { panel, plate }
  function rowEnd(plate) {
    var cards = Array.from(plate.parentElement.children).filter(function (el) {
      return el.classList.contains('lx-plate');
    });
    var top = plate.offsetTop;
    var row = cards.filter(function (c) { return c.offsetTop === top; });
    return row[row.length - 1];
  }
  function close(done) {
    if (!open) { if (done) done(); return; }
    var o = open; open = null;
    o.plate.setAttribute('aria-expanded', 'false');
    o.panel.classList.remove('open');
    var fired = false;
    function finish() {
      if (fired) return; fired = true;
      o.panel.remove();
      if (done) done();
    }
    o.panel.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 500);
  }
  function expand(plate) {
    var tpl = plate.querySelector('template');
    if (!tpl) return;
    var panel = document.createElement('div');
    panel.className = 'lx-plate-more lx-anim';
    var inner = document.createElement('div');
    inner.appendChild(tpl.content.cloneNode(true));
    panel.appendChild(inner);
    rowEnd(plate).after(panel);
    plate.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { panel.classList.add('open'); });
    });
    open = { panel: panel, plate: plate };
  }
  function toggle(plate) {
    var reopening = !open || open.plate !== plate;
    var target = reopening ? plate : null;
    close(function () { if (target) expand(target); });
  }
  document.querySelectorAll('.lx-plate[data-more]').forEach(function (plate) {
    plate.setAttribute('role', 'button');
    plate.setAttribute('tabindex', '0');
    plate.setAttribute('aria-expanded', 'false');
    plate.addEventListener('click', function () { toggle(plate); });
    plate.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(plate); }
    });
  });
})();
