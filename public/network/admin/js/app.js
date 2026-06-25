function showTab(name) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => t.style.display = 'none');

  const target = document.getElementById('tab-' + name);
  if (target) target.style.display = 'block';

  const buttons = document.querySelectorAll('.admin-tabs button');
  buttons.forEach(b => b.classList.remove('active'));
  const activeBtn = Array.from(buttons).find(b => b.textContent.toLowerCase().includes(name));
  if (activeBtn) activeBtn.classList.add('active');

  if (name === 'analytics') loadAnalytics();
  if (name === 'profiles') loadProfiles();
  if (name === 'products') loadProducts();
  if (name === 'orders') loadOrders();
  if (name === 'payouts') loadPayouts();
}

async function loadAnalytics() {
  const box = document.getElementById('tab-analytics');
  if (!box) return;

  box.innerHTML = 'Loading analytics...';

  try {
    const res = await fetch('/api/admin/network/analytics');
    const data = await res.json();

    box.innerHTML = `
      <div class="card">
        <h2>Network Overview</h2>
        <p>Total orders: ${data.total?.orders || 0}</p>
        <p>Gross volume: $${data.total?.gross || 0}</p>
        <p>Your cut (12%): $${data.total?.platform || 0}</p>
      </div>
    `;
  } catch (e) {
    box.innerHTML = '<div class="card"><p>Error loading analytics.</p></div>';
  }
}

async function loadProfiles() {
  const box = document.getElementById('tab-profiles');
  if (!box) return;
  box.innerHTML = 'Loading profiles...';

  try {
    const res = await fetch('/api/admin/network/profiles');
    const data = await res.json();

    box.innerHTML = data.map(p => `
      <div class="card">
        <h3>${p.name}</h3>
        <p>${p.title || ''}</p>
        <p>Commission: ${(p.commissionPercent * 100 || 12).toFixed(1)}%</p>
        <button class="btn">Block / Unblock</button>
      </div>
    `).join('');
  } catch (e) {
    box.innerHTML = '<div class="card"><p>Error loading profiles.</p></div>';
  }
}

async function loadProducts() {
  const box = document.getElementById('tab-products');
  if (!box) return;
  box.innerHTML = 'Products view coming online...';
}

async function loadOrders() {
  const box = document.getElementById('tab-orders');
  if (!box) return;
  box.innerHTML = 'Orders view coming online...';
}

async function loadPayouts() {
  const box = document.getElementById('tab-payouts');
  if (!box) return;
  box.innerHTML = 'Payouts view coming online...';
}

document.addEventListener('DOMContentLoaded', () => {
  showTab('analytics');
});
