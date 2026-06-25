async function loadPublicNetwork() {
  const container = document.querySelector('.portal-options');
  if (!container) return;

  try {
    const res = await fetch('/api/network/list');
    const data = await res.json();

    if (!Array.isArray(data) || !data.length) {
      container.innerHTML = '<div class="portal-card">No profiles yet. Coming soon.</div>';
      return;
    }

    container.innerHTML = data.map(p => `
      <a class="portal-card" href="#">
        <h2>${p.name || 'Unnamed'}</h2>
        <p>${p.title || ''}</p>
      </a>
    `).join('');
  } catch (e) {
    container.innerHTML = '<div class="portal-card">Error loading The Network.</div>';
  }
}

document.addEventListener('DOMContentLoaded', loadPublicNetwork);
