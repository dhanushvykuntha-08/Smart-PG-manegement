// Tenant records are kept in the browser using localStorage.
const STORAGE_KEY = 'smartPgTenants';
let tenants = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

const form = document.getElementById('tenantForm');
const rows = document.getElementById('tenantRows');
const filter = document.getElementById('statusFilter');

document.getElementById('currentMonth').textContent = new Date().toLocaleDateString('en-IN', {
  month: 'long', year: 'numeric'
});

function money(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function saveTenants() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
}

function renderTenants() {
  const visibleTenants = tenants.filter((tenant) => filter.value === 'all' || tenant.status === filter.value);
  rows.innerHTML = '';
  document.getElementById('emptyState').hidden = tenants.length > 0;

  visibleTenants.forEach((tenant) => {
    const total = Number(tenant.rent) + Number(tenant.electricity) + Number(tenant.water);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span class="tenant-name">${escapeText(tenant.name)}</span><span class="tenant-phone">${escapeText(tenant.phone)}</span></td>
      <td>${escapeText(tenant.room)}</td>
      <td>${money(tenant.rent)}</td>
      <td>${money(tenant.electricity)}</td>
      <td>${money(tenant.water)}</td>
      <td class="total-cell">${money(total)}</td>
      <td><span class="badge ${tenant.status}">${tenant.status === 'paid' ? 'Paid' : 'Pending'}</span></td>
      <td><div class="actions">
        <button class="small-button" data-action="toggle" data-id="${tenant.id}">${tenant.status === 'paid' ? 'Mark pending' : 'Mark paid'}</button>
        <button class="small-button" data-action="remind" data-id="${tenant.id}">Remind</button>
        <button class="small-button delete" data-action="delete" data-id="${tenant.id}">Delete</button>
      </div></td>`;
    rows.appendChild(row);
  });

  document.getElementById('tenantCount').textContent = tenants.length;
  const paid = tenants.filter((tenant) => tenant.status === 'paid')
    .reduce((sum, tenant) => sum + Number(tenant.rent) + Number(tenant.electricity) + Number(tenant.water), 0);
  const due = tenants.filter((tenant) => tenant.status === 'pending')
    .reduce((sum, tenant) => sum + Number(tenant.rent) + Number(tenant.electricity) + Number(tenant.water), 0);
  document.getElementById('paidTotal').textContent = money(paid);
  document.getElementById('dueTotal').textContent = money(due);
}

// Escape user-entered text before adding it to the page.
function escapeText(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  tenants.push({
    id: Date.now().toString(),
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    room: document.getElementById('room').value.trim(),
    rent: Number(document.getElementById('rent').value),
    electricity: Number(document.getElementById('electricity').value),
    water: Number(document.getElementById('water').value),
    status: 'pending'
  });
  saveTenants();
  renderTenants();
  form.reset();
  document.getElementById('electricity').value = 0;
  document.getElementById('water').value = 0;
});

rows.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const tenant = tenants.find((item) => item.id === button.dataset.id);
  if (!tenant) return;

  if (button.dataset.action === 'toggle') {
    tenant.status = tenant.status === 'paid' ? 'pending' : 'paid';
  } else if (button.dataset.action === 'delete') {
    tenants = tenants.filter((item) => item.id !== tenant.id);
  } else if (button.dataset.action === 'remind') {
    const total = Number(tenant.rent) + Number(tenant.electricity) + Number(tenant.water);
    const message = `Hello ${tenant.name}, this is a reminder that your PG payment of ${money(total)} is pending. Please make the payment. Thank you.`;
    window.location.href = `sms:${tenant.phone}?body=${encodeURIComponent(message)}`;
    return;
  }

  saveTenants();
  renderTenants();
});

filter.addEventListener('change', renderTenants);
renderTenants();
