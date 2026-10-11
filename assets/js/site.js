(() => {
  document.documentElement.classList.add('has-js');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (navToggle && nav) {
    const setMenuOpen = (open) => {
      nav.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.textContent = open ? 'Close menu' : 'Menu';
    };
    navToggle.addEventListener('click', () => setMenuOpen(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenuOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenuOpen(false);
        navToggle.focus();
      }
    });
    document.addEventListener('pointerdown', (event) => {
      if (nav.classList.contains('is-open') && !nav.contains(event.target) && !navToggle.contains(event.target)) {
        setMenuOpen(false);
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && nav.classList.contains('is-open')) setMenuOpen(false);
    });
  }
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const fallback = document.querySelector('[data-contact-direct]');
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('button[type="submit"]');
  const endpoint = (window.GL_SITE_CONFIG?.contactEndpoint || '').trim();
  if (!endpoint) return;
  form.hidden = false;
  if (fallback) fallback.hidden = true;

  function clearFieldError(field) {
    const id = 'error-' + (field.id || field.name);
    document.getElementById(id)?.remove();
    field.removeAttribute('aria-invalid');
    const describedBy = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(part => part && part !== id);
    if (describedBy.length) field.setAttribute('aria-describedby', describedBy.join(' '));
    else field.removeAttribute('aria-describedby');
  }
  function fieldErrorMessage(field) {
    if (field.validity.valueMissing) {
      return field.type === 'checkbox' ? 'Please confirm the acknowledgment before submitting.' : 'This field is required.';
    }
    if (field.validity.typeMismatch && field.type === 'email') {
      return 'Enter a valid email address, such as name@example.com.';
    }
    return field.validationMessage || 'Please check this field.';
  }
  function showFieldError(field) {
    clearFieldError(field);
    const id = 'error-' + (field.id || field.name);
    const message = document.createElement('span');
    message.id = id;
    message.className = 'field-error';
    message.textContent = fieldErrorMessage(field);
    field.closest('.field')?.appendChild(message);
    field.setAttribute('aria-invalid', 'true');
    const current = field.getAttribute('aria-describedby') || '';
    field.setAttribute('aria-describedby', [current, id].filter(Boolean).join(' '));
  }
  const updateError = (event) => {
    const field = event.target;
    if (field.matches('input, textarea, select') && field.checkValidity()) clearFieldError(field);
  };
  form.addEventListener('input', updateError);
  form.addEventListener('change', updateError);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fields = [...form.querySelectorAll('input:not([type="hidden"]), select, textarea')].filter(field => !field.closest('.honeypot'));
    const invalid = fields.filter(field => !field.checkValidity());
    fields.forEach(clearFieldError);
    if (invalid.length) {
      invalid.forEach(showFieldError);
      status.setAttribute('role', 'alert');
      status.dataset.state = 'error';
      status.textContent = 'Please correct the highlighted fields and try again.';
      invalid[0].focus();
      return;
    }
    const honeypot = form.querySelector('[name="website"]');
    if (honeypot?.value) return;
    const original = submit.textContent;
    submit.disabled = true;
    submit.textContent = 'Sending…';
    status.setAttribute('role', 'status');
    status.textContent = '';
    status.dataset.state = '';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      form.reset();
      fields.forEach(clearFieldError);
      status.dataset.state = 'success';
      status.textContent = 'Thank you. Your request has been submitted.';
    } catch (error) {
      console.error('Contact form delivery failed:', error);
      status.setAttribute('role', 'alert');
      status.dataset.state = 'error';
      status.textContent = 'We could not send your request. Please email jack@glanzlaw.com or call (718) 569-7757.';
    } finally {
      submit.disabled = false;
      submit.textContent = original;
    }
  });
})();