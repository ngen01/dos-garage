const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const STATUS_OPTIONS = ['beklemede', 'onaylandı', 'devam ediyor', 'tamamlandı', 'iptal'];

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('adminLogin');
  const deniedSection = document.getElementById('adminDenied');
  const panelSection = document.getElementById('adminPanel');
  const loginForm = document.getElementById('adminLoginForm');
  const loginStatus = document.getElementById('adminLoginStatus');
  const deniedLogoutBtn = document.getElementById('adminDeniedLogout');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const adminName = document.getElementById('adminName');
  const activeList = document.getElementById('activeJobsList');
  const historyList = document.getElementById('customerHistoryList');
  const searchInput = document.getElementById('customerSearch');

  let allAppointments = [];

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginStatus.textContent = 'Giriş yapılıyor...';
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: document.getElementById('adminEmail').value,
      password: document.getElementById('adminPassword').value,
    });
    if (error) { loginStatus.textContent = 'Hata: ' + error.message; return; }
    loginStatus.textContent = '';
    loginForm.reset();
  });

  [deniedLogoutBtn, logoutBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', () => supabaseClient.auth.signOut());
  });

  searchInput.addEventListener('input', () => renderHistory(searchInput.value));

  async function checkAdminAndLoad(session) {
    if (!session) {
      loginSection.hidden = false;
      deniedSection.hidden = true;
      panelSection.hidden = true;
      return;
    }

    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('role, full_name')
      .eq('id', session.user.id)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      loginSection.hidden = true;
      deniedSection.hidden = false;
      panelSection.hidden = true;
      return;
    }

    loginSection.hidden = true;
    deniedSection.hidden = true;
    panelSection.hidden = false;
    adminName.textContent = profile.full_name || session.user.email;
    await loadAppointments();
  }

  async function loadAppointments() {
    const { data, error } = await supabaseClient
      .from('appointments')
      .select('*, profiles(full_name, phone)')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      activeList.innerHTML = `<li class="appt-empty">Yüklenemedi: ${error.message}</li>`;
      historyList.innerHTML = '';
      return;
    }
    allAppointments = data || [];
    renderActive();
    renderHistory(searchInput.value);
  }

  function statusSelect(appt) {
    const select = document.createElement('select');
    STATUS_OPTIONS.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      if (s === appt.status) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', async () => {
      const { error } = await supabaseClient
        .from('appointments')
        .update({ status: select.value })
        .eq('id', appt.id);
      if (!error) {
        appt.status = select.value;
        renderActive();
        renderHistory(searchInput.value);
      }
    });
    return select;
  }

  function renderActive() {
    const active = allAppointments.filter(a => a.status !== 'tamamlandı' && a.status !== 'iptal');
    activeList.innerHTML = '';
    if (active.length === 0) {
      activeList.innerHTML = '<li class="appt-empty">Aktif iş bulunmuyor.</li>';
      return;
    }
    active.forEach(appt => {
      const li = document.createElement('li');
      li.className = 'appt-item admin-row';
      const customer = appt.profiles
        ? `${appt.profiles.full_name || 'İsimsiz'} · ${appt.profiles.phone || '-'}`
        : 'Bilinmiyor';
      const info = document.createElement('div');
      info.className = 'admin-row-info';
      info.innerHTML = `<strong>${customer}</strong><span>${appt.service} — ${appt.appointment_date} · ${appt.appointment_time}</span>`;
      li.appendChild(info);
      li.appendChild(statusSelect(appt));
      activeList.appendChild(li);
    });
  }

  function renderHistory(filter = '') {
    const byCustomer = {};
    allAppointments.forEach(appt => {
      const key = appt.user_id;
      if (!byCustomer[key]) {
        byCustomer[key] = {
          name: appt.profiles?.full_name || 'İsimsiz',
          phone: appt.profiles?.phone || '-',
          items: [],
        };
      }
      byCustomer[key].items.push(appt);
    });

    const term = filter.trim().toLowerCase();
    const customers = Object.values(byCustomer).filter(c =>
      !term || c.name.toLowerCase().includes(term) || c.phone.toLowerCase().includes(term)
    );

    historyList.innerHTML = '';
    if (customers.length === 0) {
      historyList.innerHTML = '<p class="appt-empty">Kayıt bulunamadı.</p>';
      return;
    }

    customers.forEach(c => {
      const block = document.createElement('div');
      block.className = 'customer-block';
      const heading = document.createElement('h4');
      heading.innerHTML = `${c.name} <span>${c.phone}</span>`;
      block.appendChild(heading);

      const ul = document.createElement('ul');
      c.items
        .slice()
        .sort((x, y) => (x.appointment_date < y.appointment_date ? 1 : -1))
        .forEach(appt => {
          const li = document.createElement('li');
          li.innerHTML = `<span>${appt.service}</span><span>${appt.appointment_date} · ${appt.appointment_time}</span><em>${appt.status}</em>`;
          ul.appendChild(li);
        });
      block.appendChild(ul);
      historyList.appendChild(block);
    });
  }

  supabaseClient.auth.getSession().then(({ data: { session } }) => checkAdminAndLoad(session));
  supabaseClient.auth.onAuthStateChange((_event, session) => checkAdminAndLoad(session));
});
