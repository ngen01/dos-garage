document.addEventListener('DOMContentLoaded', () => {
  // Yıl bilgisi
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobil menü
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      mainNav.classList.toggle('open');
    });
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mainNav.classList.remove('open'));
    });
  }

  // Header küçültme efekti
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (header) header.style.boxShadow = window.scrollY > 20 ? '0 4px 20px rgba(0,0,0,.3)' : 'none';
  });

  // Scroll ile görünürlük animasyonu
  const revealEls = document.querySelectorAll('[data-aos]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => observer.observe(el));

  // İletişim formu (arka uç bağlanana kadar örnek davranış)
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      status.textContent = 'Talebiniz alındı! En kısa sürede sizinle iletişime geçeceğiz.';
      form.reset();
    });
  }
});
