(function () {
  const form = document.getElementById('team-form');
  const success = document.getElementById('success');
  const error = document.getElementById('error');

  function show(node) { node.hidden = false; }
  function hide(node) { node.hidden = true; }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hide(success); hide(error);

    const name  = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const role  = document.getElementById('role').value.trim();

    const ok = !!name && isValidEmail(email) && !!role;

    if (ok) {
      show(success);
    } else {
      show(error);
    }
  });
})();
