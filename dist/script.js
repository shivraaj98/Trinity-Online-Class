const menuToggle = document.querySelector('.menu-toggle');
const header = document.querySelector('.site-header');
menuToggle?.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.nav-links a').forEach((link) => link.addEventListener('click', () => {
  header.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));

document.querySelector('#enroll-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = document.querySelector('.form-message');
  message.textContent = 'Thanks — we’ll be in touch with a good place to start.';
  event.currentTarget.reset();
});
