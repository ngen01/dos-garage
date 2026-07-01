const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const authModal = document.getElementById('authModal');
  const authOpenBtn = document.getElementById('authOpenBtn');
  const randevuAuthBtn = document.getElementById('randevuAuthBtn');
  const authModalClose = document.getElementById('authModalClose');
  const tabs = document.querySelectorAll('.modal-tab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const guestPrompt = document.getElementById('guestPrompt');
  const memberArea = document.getElementById('memberArea');
  const memberName = document.getElementById('memberName');
  const logoutBtn = document.getElementById('logoutBtn');
  const appointmentForm = document.getElementById('appointmentForm');
  const appointmentList = document.getElementById('appointmentList');
  const appointmentStatus = document.getElementById('appointmentStatus');

  function openModal() { authModal.classList.add('open'); }
  function closeModal() { authModal.classList.remove('open'); }

  [authOpenBtn, randevuAuthBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
      if (btn === authOpenBtn && authOpenBtn.dataset.loggedIn === '1') {
        document.getElementById('randevu').scrollIntoView({ behavior: 'smooth' });
        return;
      }
      openModal();
    });
  });
  authModalClose.addEventListener('click', closeModal);
  authModal.addEventListener('click', (e) => { if (e.target === authModal) closeModal(); });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.modal-form').forEach(f => f.classList.remove('active'));
      document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
    });
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('loginStatus');
    status.textContent = 'Giriş yapılıyor...';
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: document.getElementById('loginEmail').value,
      password: document.getElementById('loginPassword').value,
    });
    if (error) { status.textContent = 'Hata: ' + error.message; return; }
    status.textContent = '';
    loginForm.reset();
    closeModal();
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('registerStatus');
    if (!document.getElementById('registerKvkk').checked) {
      status.textContent = 'Devam etmek için KVKK Aydınlatma Metni\'ni onaylamalısınız.';
      return;
    }
    status.textContent = 'Üyelik oluşturuluyor...';
    const fullName = document.getElementById('registerName').value;
    const phone = document.getElementById('registerPhone').value;
    const { data, error } = await supabaseClient.auth.signUp({
      email: document.getElementById('registerEmail').value,
      password: document.getElementById('registerPassword').value,
      options: { data: { full_name: fullName, phone } },
    });
    if (error) { status.textContent = 'Hata: ' + error.message; return; }
    if (data.user) {
      await supabaseClient.from('profiles').upsert({ id: data.user.id, full_name: fullName, phone });
    }
    status.textContent = 'Üyelik oluşturuldu! E-posta onayından sonra giriş yapabilirsiniz.';
    registerForm.reset();
  });

  logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
  });

  async function loadAppointments(userId) {
    const { data, error } = await supabaseClient
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('appointment_date', { ascending: true });

    appointmentList.innerHTML = '';
    if (error || !data || data.length === 0) {
      appointmentList.innerHTML = '<li class="appt-empty">Henüz randevunuz bulunmuyor.</li>';
      return;
    }
    data.forEach(appt => {
      const li = document.createElement('li');
      li.className = 'appt-item';
      li.innerHTML = `<strong>${appt.service}</strong><span>${appt.appointment_date} · ${appt.appointment_time}</span><em>${appt.status || 'beklemede'}</em>`;
      appointmentList.appendChild(li);
    });
  }

  appointmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { appointmentStatus.textContent = 'Lütfen önce giriş yapın.'; return; }

    appointmentStatus.textContent = 'Randevu oluşturuluyor...';
    const { error } = await supabaseClient.from('appointments').insert({
      user_id: session.user.id,
      service: document.getElementById('apptService').value,
      appointment_date: document.getElementById('apptDate').value,
      appointment_time: document.getElementById('apptTime').value,
      note: document.getElementById('apptNote').value,
    });
    if (error) { appointmentStatus.textContent = 'Hata: ' + error.message; return; }
    appointmentStatus.textContent = 'Randevunuz oluşturuldu!';
    appointmentForm.reset();
    loadAppointments(session.user.id);
  });

  function renderAuthState(session) {
    if (session) {
      guestPrompt.hidden = true;
      memberArea.hidden = false;
      const name = session.user.user_metadata?.full_name || session.user.email;
      memberName.textContent = name;
      authOpenBtn.textContent = name;
      authOpenBtn.dataset.loggedIn = '1';
      loadAppointments(session.user.id);
    } else {
      guestPrompt.hidden = false;
      memberArea.hidden = true;
      authOpenBtn.textContent = 'Giriş Yap / Üye Ol';
      authOpenBtn.dataset.loggedIn = '0';
    }
  }

  supabaseClient.auth.getSession().then(({ data: { session } }) => renderAuthState(session));
  supabaseClient.auth.onAuthStateChange((_event, session) => renderAuthState(session));
});
