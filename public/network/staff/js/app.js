const statusBar = document.createElement('div');
statusBar.className = 'status-bar';
statusBar.textContent = 'Loading your dashboard...';
document.body.insertBefore(statusBar, document.body.children[1]);

async function loadStaffDashboard() {
  try {
    const res = await fetch('/api/staff/me');
    const me = await res.json();

    statusBar.textContent = me && me.name
      ? `Logged in as ${me.name}`
      : 'Not logged in.';

    const cards = document.querySelectorAll('.portal-card');
    if (!cards.length) return;

    cards[0].innerHTML = '<h2>Edit Profile</h2><p>Update your Network presence.</p>';
    cards[1].innerHTML = '<h2My Products</h2><p>Manage items you sell through The Network.</p>';
    cards[2].innerHTML = '<h2>Orders</h2><p>See recent purchases.</p>';
    cards[3].innerHTML = '<h2>Payouts</h2><p>Track your earnings.</p>';

    // later: add click handlers to route to sub‑views
  } catch (e) {
    statusBar.textContent = 'Error loading staff dashboard.';
  }
}

document.addEventListener('DOMContentLoaded', loadStaffDashboard);
