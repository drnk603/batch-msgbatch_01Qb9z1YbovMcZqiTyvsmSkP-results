(function () {
  var header = document.querySelector('.dr-header');
  if (!header) return;

  var toggle = header.querySelector('.dr-nav-toggle');
  var panel = header.querySelector('.dr-nav-panel');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', function () {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    var nextState = !expanded;
    toggle.setAttribute('aria-expanded', String(nextState));
    if (nextState) {
      panel.classList.add('dr-is-open');
    } else {
      panel.classList.remove('dr-is-open');
    }
  });

  var yearEl = document.querySelector('.dr-footer-copy-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();