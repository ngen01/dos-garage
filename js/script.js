// ============================================================
// TEK NOKTADAN AYAR: WhatsApp numarası (ülke koduyla, +, boşluk
// ve parantez olmadan). Örn: 905321234567
// Sayfadaki tüm wa.me linkleri ve form yönlendirmeleri buradan beslenir.
// ============================================================
const WHATSAPP_NUMBER = '900000000000';

function waLink(text) {
  const base = 'https://wa.me/' + WHATSAPP_NUMBER;
  return text ? base + '?text=' + encodeURIComponent(text) : base;
}

document.addEventListener('DOMContentLoaded', () => {
  // Tüm statik wa.me linklerini tek numaradan besle
  document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
    a.href = waLink();
  });

  // Giriş logosu animasyonu (oturum başına bir kez gösterilir)
  const introSplash = document.getElementById('introSplash');
  if (introSplash) {
    if (sessionStorage.getItem('dosgarage_intro_shown')) {
      introSplash.remove();
    } else {
      document.body.classList.add('intro-active');
      window.addEventListener('load', () => {
        setTimeout(() => {
          introSplash.classList.add('hide');
          document.body.classList.remove('intro-active');
          sessionStorage.setItem('dosgarage_intro_shown', '1');
          setTimeout(() => introSplash.remove(), 700);
        }, 1000);
      });
    }
  }

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

  // Randevu formu → WhatsApp mesajı
  const apptForm = document.getElementById('waAppointmentForm');
  if (apptForm) {
    apptForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('apptName').value.trim();
      const service = document.getElementById('apptService').value;
      const date = document.getElementById('apptDate').value;
      const time = document.getElementById('apptTime').value;
      const bike = document.getElementById('apptBike').value.trim();
      const note = document.getElementById('apptNote').value.trim();

      let msg = 'Merhaba, randevu almak istiyorum.\n';
      msg += 'Ad Soyad: ' + name + '\n';
      msg += 'Hizmet: ' + service + '\n';
      msg += 'Tarih: ' + date + (time ? ' ' + time : '') + '\n';
      if (bike) msg += 'Motosiklet: ' + bike + '\n';
      if (note) msg += 'Not: ' + note;

      window.open(waLink(msg), '_blank', 'noopener');
    });
  }

  // İletişim formu → WhatsApp mesajı
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const email = document.getElementById('email').value.trim();
      const service = document.getElementById('service').value;
      const message = document.getElementById('message').value.trim();

      let msg = 'Merhaba, bilgi almak istiyorum.\n';
      msg += 'Ad Soyad: ' + name + '\n';
      msg += 'Telefon: ' + phone + '\n';
      if (email) msg += 'E-posta: ' + email + '\n';
      msg += 'Hizmet: ' + service + '\n';
      if (message) msg += 'Mesaj: ' + message;

      window.open(waLink(msg), '_blank', 'noopener');
    });
  }
});
