(() => {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('button[type="submit"]');
  const endpoint = (window.GL_SITE_CONFIG && window.GL_SITE_CONFIG.contactEndpoint || '').trim();
  const siteId = (window.GL_SITE_CONFIG && window.GL_SITE_CONFIG.siteId || '').trim();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.website && form.website.value) return;

    if (!endpoint) {
      status.dataset.state = 'error';
      status.textContent = 'Online submission is not configured yet. Please email jack@glanzlaw.com or call (718) 569-7757.';
      return;
    }

    const original = submit.textContent;
    submit.disabled = true;
    submit.textContent = 'Sending…';
    status.textContent = '';
    status.dataset.state = '';

    try {
      const payload = new FormData(form);
      payload.set('_site_id', siteId);
      payload.set('_page_url', window.location.href);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: payload,
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      status.dataset.state = 'success';
      status.textContent = 'Thank you. Your request has been submitted.';
    } catch (error) {
      console.error(error);
      status.dataset.state = 'error';
      status.textContent = 'We could not send your request. Please email jack@glanzlaw.com or call (718) 569-7757.';
    } finally {
      submit.disabled = false;
      submit.textContent = original;
    }
  });
})();
