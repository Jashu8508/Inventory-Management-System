// ============================================================
//   FreshTrack – Main Application Script
// ============================================================

/* ─── State ─── */
let currentPage = 'dashboard';
let currentModal = null;
let editingId = null;
let isDark = true;
let DB = { 
  departments: [], managers: [], suppliers: [], 
  products: [], stock: [], warehouses: [], orders: [], invoices: [] 
};
let currentUser = null;

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', async () => {
  initLogin();
  initNav();
  initTheme();
  initSearch();
  initMobileMenu();
});

function initLogin() {
  const savedUser = localStorage.getItem('freshTrackUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    onLoginSuccess(currentUser);
  }
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabRegister').classList.toggle('active', !isLogin);
  document.getElementById('loginForm').style.display = isLogin ? 'block' : 'none';
  document.getElementById('registerForm').style.display = isLogin ? 'none' : 'block';
  document.getElementById('authTitle').textContent = isLogin ? 'FreshTrack' : 'Join FreshTrack';
  document.getElementById('authSubtitle').textContent = isLogin ? 'Sign in to manage your inventory' : 'Create your administrator account';
}

function togglePass(inputId) {
  const el = document.getElementById(inputId);
  if (el.type === 'password') {
    el.type = 'text';
  } else {
    el.type = 'password';
  }
}

function showForgotPassword() {
  hideAllAuthForms();
  document.getElementById('forgotForm').style.display = 'block';
  document.getElementById('authTitle').textContent = 'Recover Account';
}

function backToLogin() {
  hideAllAuthForms();
  document.getElementById('loginForm').style.display = 'block';
  switchAuthTab('login');
}

function hideAllAuthForms() {
  ['loginForm', 'registerForm', 'otpForm', 'forgotForm', 'resetForm'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
}

async function handleLogin(e) {
  e.preventDefault();
  const email = v('loginEmail');
  const pass = v('loginPass');
  
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      currentUser = data.user;
      localStorage.setItem('freshTrackUser', JSON.stringify(currentUser));
      onLoginSuccess(currentUser);
      showToast(`Welcome back, ${currentUser.full_name}!`, 'success');
    } else if (data.status === 'unverified') {
      showOTPForm(data.email);
      showToast(data.message, 'warning');
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Login failed. Check server connection.', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = v('regName');
  const email = v('regEmail');
  const pass = v('regPass');
  
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name, email, password: pass })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showOTPForm(email);
      if (data.dev_otp) {
        showToast(`TEST OTP: ${data.dev_otp}`, 'info');
        console.log(`DEV MODE OTP: ${data.dev_otp}`);
      } else {
        showToast('Registration successful! Please check your email.', 'success');
      }
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Registration failed.', 'error');
  }
}

function showOTPForm(email) {
  hideAllAuthForms();
  document.getElementById('otpForm').style.display = 'block';
  document.getElementById('otpTargetEmail').textContent = email;
  document.getElementById('authTitle').textContent = 'Verify Email';
}

async function handleVerifyOTP(e) {
  e.preventDefault();
  const email = document.getElementById('otpTargetEmail').textContent;
  const otp = v('otpCode');
  
  try {
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast('Account verified! You can now login.', 'success');
      backToLogin();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('OTP verification failed.', 'error');
  }
}

async function resendOTP() {
  const email = document.getElementById('otpTargetEmail').textContent;
  try {
    const res = await fetch('/api/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.status === 'success') {
      if (data.dev_otp) {
        showToast(`New TEST OTP: ${data.dev_otp}`, 'info');
      } else {
        showToast('New OTP sent!', 'success');
      }
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to resend OTP.', 'error');
  }
}

async function handleForgotRequest(e) {
  e.preventDefault();
  const email = v('forgotEmail');
  try {
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.status === 'success') {
      hideAllAuthForms();
      document.getElementById('resetForm').style.display = 'block';
      document.getElementById('otpTargetEmail').textContent = email; // Reuse for reset
      if (data.dev_otp) {
        showToast(`RESET OTP: ${data.dev_otp}`, 'info');
      } else {
        showToast('Reset OTP sent to your email.', 'success');
      }
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Request failed.', 'error');
  }
}

async function handleResetPassword(e) {
  e.preventDefault();
  const email = document.getElementById('otpTargetEmail').textContent;
  const otp = v('resetOtp');
  const new_password = v('resetPass');
  
  try {
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, new_password })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast('Password reset successful! Please login.', 'success');
      backToLogin();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Reset failed.', 'error');
  }
}

async function onLoginSuccess(user) {
  document.getElementById('authOverlay').classList.add('hidden');
  document.querySelector('.user-name').textContent = user.full_name;
  document.querySelector('.user-avatar').textContent = user.full_name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  
  await refreshData();
  setDate();
}

function handleLogout() {
  localStorage.removeItem('freshTrackUser');
  location.reload();
}

async function fetchData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    DB = data;
    console.log('Data loaded from MySQL:', DB);
    
    // Notify about auto-reorders if any occurred
    if (data.auto_reorder_summary && data.auto_reorder_summary.includes('Processed auto-reorders for')) {
      const count = data.auto_reorder_summary.match(/\d+/)[0];
      if (parseInt(count) > 0) {
        setTimeout(() => {
          showToast(`🚨 STOCK ALERT: Auto-reordered ${count} low stock items!`, 'info');
          
          // Automatically download the invoice for the newest orders
          if (data.new_auto_invoices && data.new_auto_invoices.length > 0) {
            data.new_auto_invoices.forEach(invId => {
              downloadPDF(invId);
            });
          }
        }, 1500); // Delay to avoid overlapping with other toasts
      }
    }
  } catch (err) {
    console.error('Failed to fetch data:', err);
    showToast('Failed to connect to database. Using offline data.', 'error');
  }
}

/* ─── Date ─── */
function setDate() {
  const el = document.getElementById('currentDate');
  if (el) {
    el.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
}

/* ─── Navigation ─── */
function initNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
      // Close mobile sidebar if open
      document.getElementById('sidebar').classList.remove('open');
    });
  });
}

function navigateTo(page) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');

  // Update pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  // Breadcrumb
  const labels = { dashboard: 'Dashboard', stock: 'Stock', products: 'Products', departments: 'Departments', managers: 'Managers', suppliers: 'Suppliers', warehouses: 'Warehouses', orders: 'Orders', invoices: 'Invoices' };
  document.getElementById('breadcrumbCurrent').textContent = labels[page] || page;
  currentPage = page;
}

function gotoProduct(id) {
  // 1. Switch to the Products tab
  navigateTo('products');
  
  // 2. Open the detail panel
  // We use a slightly longer delay to ensure the DOM has updated
  setTimeout(() => {
    openProductDetail(id);
    
    // Optional: Highlight the product card in the list if it exists
    const card = document.querySelector(`[onclick*="openProductDetail('${id}')"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.ring = '2px solid var(--primary)';
      setTimeout(() => card.style.ring = '', 2000);
    }
  }, 100);
}

/* ─── Theme ─── */
function initTheme() {
  document.getElementById('themeToggle').addEventListener('click', () => {
    isDark = !isDark;
    document.body.classList.toggle('light', !isDark);
    document.getElementById('themeToggle').textContent = isDark ? '🌙' : '☀️';
  });
}

/* ─── Mobile Menu ─── */
function initMobileMenu() {
  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

/* ─── Global Search ─── */
function initSearch() {
  document.getElementById('globalSearch').addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();
    if (!q) return;
    // Search through pages, navigate to best match
    const pages = ['stock', 'departments', 'managers', 'suppliers', 'warehouses', 'orders'];
    const found = pages.find(p => p.includes(q));
    if (found) navigateTo(found);
  });
}

/* ─── Refresh Data ─── */
async function refreshData() {
  await fetchData();
  renderAllPages();
  updateDashboard();
  showToast('Data refreshed from MySQL!', 'success');
}

/* ─── Render All ─── */
function renderAllPages() {
  renderProducts();
  renderStock();
  renderDepartments();
  renderManagers();
  renderSuppliers();
  renderWarehouses();
  renderOrders();
  renderInvoices();
  populateWarehouseFilter();
}

/* ══════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════ */
function updateDashboard() {
  const stock = DB.stock;
  const expiring = stock.filter(s => {
    const diff = (new Date(s.exp_date) - new Date()) / (1000 * 60 * 60 * 24);
    return s.stock_status === 'Expiring Soon' || (diff >= 0 && diff < 14);
  });
  const inStock = stock.filter(s => s.stock_status === 'In Stock');
  const orders = DB.orders;

  setText('totalStock', stock.length);
  setText('totalSuppliers', DB.suppliers.length);
  setText('totalWarehouses', DB.warehouses.length);
  setText('expiringCount', expiring.length);
  setText('totalDepartments', DB.departments.length);
  setText('totalManagers', DB.managers.length);
  setText('inStockCount', inStock.length);
  setText('totalOrders', orders.length);
  setText('donutTotal', stock.length);

  drawDonut();
  renderRecentActivity();
  renderExpiryAlerts(expiring);
  renderSupplierBar();
  updateBadge();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function updateBadge() {
  const expiring = DB.stock.filter(s => {
    const diff = (new Date(s.exp_date) - new Date()) / (1000 * 60 * 60 * 24);
    return s.stock_status === 'Expiring Soon' || (diff >= 0 && diff < 14);
  }).length;
  const badge = document.getElementById('badge-expiring');
  if (badge) {
    badge.textContent = expiring;
    badge.classList.toggle('visible', expiring > 0);
  }
}

/* Donut Chart (canvas) */
function drawDonut() {
  const canvas = document.getElementById('stockStatusChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const statusCounts = {};
  DB.stock.forEach(s => { statusCounts[s.stock_status] = (statusCounts[s.stock_status] || 0) + 1; });
  const colors = { 'In Stock': '#4ade80', 'Low Stock': '#fb923c', 'Out of Stock': '#f87171', 'Expiring Soon': '#fbbf24' };
  const total = DB.stock.length;
  let start = -Math.PI / 2;
  const cx = W / 2, cy = H / 2, r = 85, inner = 55;

  const segments = Object.entries(statusCounts);
  segments.forEach(([label, count]) => {
    const angle = (count / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = colors[label] || '#60a5fa';
    ctx.fill();
    start += angle;
  });
  // Inner hole
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#111620' : '#fff';
  ctx.fill();

  // Legend
  const legendEl = document.getElementById('stockLegend');
  if (legendEl) {
    legendEl.innerHTML = segments.map(([label, count]) =>
      `<div class="legend-item">
        <div class="legend-dot" style="background:${colors[label] || '#60a5fa'}"></div>
        <span class="legend-label">${label}</span>
        <span class="legend-val">${count}</span>
      </div>`
    ).join('');
  }
}

function renderRecentActivity() {
  const el = document.getElementById('recentActivity');
  if (!el) return;
  const icons = { 'In Stock': '✅', 'Low Stock': '⚠️', 'Out of Stock': '❌', 'Expiring Soon': '⏰' };
  el.innerHTML = DB.stock.slice(0, 6).map(s => {
    const sup = DB.suppliers.find(x => x.s_id === s.supplier_id);
    return `<div class="activity-item">
      <span class="activity-icon">${icons[s.stock_status] || '📦'}</span>
      <div class="activity-info">
        <div class="activity-name"><a href="#" onclick="gotoProduct('${s.product_id}'); return false;" class="prd-link">${s.product_id}</a></div>
        <div class="activity-meta">${sup ? sup.s_name : '—'} · Exp: ${formatDate(s.exp_date)}</div>
      </div>
      <span class="status-badge ${statusClass(s.stock_status)}">${s.stock_status}</span>
    </div>`;
  }).join('');
}

function renderExpiryAlerts(expiring) {
  const el = document.getElementById('expiryAlertList');
  const cnt = document.getElementById('alertCount');
  if (!el) return;
  if (cnt) cnt.textContent = `${expiring.length} items`;
  if (expiring.length === 0) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px;">No expiry alerts 🎉</p>`;
    return;
  }
  el.innerHTML = expiring.map(s =>
    `<div class="alert-item">
      <div>
        <div class="alert-name"><a href="#" onclick="gotoProduct('${s.product_id}'); return false;" class="prd-link">${s.product_id}</a> · ${s.stock_id}</div>
        <div style="font-size:11px;color:var(--text-muted)">Warehouse: ${getWHName(s.warehouse_id)}</div>
      </div>
      <span class="alert-date">${formatDate(s.exp_date)}</span>
    </div>`
  ).join('');
}

function renderSupplierBar() {
  const el = document.getElementById('supplierBarChart');
  if (!el) return;
  const counts = {};
  DB.stock.forEach(s => {
    const sup = DB.suppliers.find(x => x.s_id === s.supplier_id);
    if (sup) counts[sup.s_name] = (counts[sup.s_name] || 0) + 1;
  });
  const max = Math.max(...Object.values(counts), 1);
  el.innerHTML = Object.entries(counts).map(([name, count]) =>
    `<div class="bar-row">
      <span class="bar-label" title="${name}">${name.split(' ')[0]}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(count / max * 100).toFixed(1)}%"></div></div>
      <span class="bar-val">${count}</span>
    </div>`
  ).join('');
}

/* ══════════════════════════════════════════════
   STOCK
══════════════════════════════════════════════ */
function renderStock(data = DB.stock) {
  const tbody = document.getElementById('stockTableBody');
  const empty = document.getElementById('stockEmpty');
  if (!tbody) return;
  if (data.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  tbody.innerHTML = data.map(s => {
    const wh = DB.warehouses.find(w => w.w_id === s.warehouse_id);
    const sup = DB.suppliers.find(x => x.s_id === s.supplier_id);
    const mgr = DB.managers.find(m => m.m_id === s.manager_id);
    const exp = expiryClass(s.exp_date);
    return `<tr>
      <td><span class="id-cell">${s.stock_id}</span></td>
      <td><a href="#" onclick="gotoProduct('${s.product_id}'); return false;" class="prd-link">${s.product_id}</a></td>
      <td><span class="${exp.cls}">${formatDate(s.exp_date)} ${exp.icon}</span></td>
      <td><span class="status-badge ${statusClass(s.stock_status)}">${s.stock_status}</span></td>
      <td>${wh ? wh.w_name : '—'}</td>
      <td>${sup ? sup.s_name : '—'}</td>
      <td>${mgr ? mgr.m_name : '—'}</td>
      <td><div class="action-btns">
        <button class="tbl-btn tbl-btn-edit" onclick="openModal('stock', '${s.stock_id}')" title="Edit">✏️</button>
        <button class="tbl-btn tbl-btn-delete" onclick="deleteRecord('stock','${s.stock_id}')" title="Delete">🗑️</button>
      </div></td>
    </tr>`;
  }).join('');
}

function populateWarehouseFilter() {
  const sel = document.getElementById('stockWarehouseFilter');
  if (!sel) return;
  sel.innerHTML = '<option value="">All Warehouses</option>' +
    DB.warehouses.map(w => `<option value="${w.w_id}">${w.w_name}</option>`).join('');
}

function filterTable(type) {
  if (type === 'stock') {
    const q = (document.getElementById('stockSearch')?.value || '').toLowerCase();
    const status = document.getElementById('stockStatusFilter')?.value || '';
    const wh = document.getElementById('stockWarehouseFilter')?.value || '';
    const filtered = DB.stock.filter(s =>
      (s.stock_id.toLowerCase().includes(q) || s.product_id.toLowerCase().includes(q)) &&
      (status === '' || s.stock_status === status) &&
      (wh === '' || s.warehouse_id === wh)
    );
    renderStock(filtered);
  } else if (type === 'department') {
    const q = (document.getElementById('deptSearch')?.value || '').toLowerCase();
    const type2 = document.getElementById('deptTypeFilter')?.value || '';
    const filtered = DB.departments.filter(d =>
      (d.dept_name.toLowerCase().includes(q) || d.dept_id.toLowerCase().includes(q)) &&
      (type2 === '' || d.dept_type === type2)
    );
    renderDepartments(filtered);
  } else if (type === 'manager') {
    const q = (document.getElementById('managerSearch')?.value || '').toLowerCase();
    const filtered = DB.managers.filter(m =>
      m.m_name.toLowerCase().includes(q) || m.m_email.toLowerCase().includes(q)
    );
    renderManagers(filtered);
  } else if (type === 'supplier') {
    const q = (document.getElementById('supplierSearch')?.value || '').toLowerCase();
    const type2 = document.getElementById('supplierTypeFilter')?.value || '';
    const filtered = DB.suppliers.filter(s =>
      (s.s_name.toLowerCase().includes(q) || s.s_id.toLowerCase().includes(q)) &&
      (type2 === '' || s.s_type === type2)
    );
    renderSuppliers(filtered);
  } else if (type === 'warehouse') {
    const q = (document.getElementById('warehouseSearch')?.value || '').toLowerCase();
    const filtered = DB.warehouses.filter(w =>
      w.w_name.toLowerCase().includes(q) || w.location.toLowerCase().includes(q)
    );
    renderWarehouses(filtered);
  } else if (type === 'invoice') {
    const q = (document.getElementById('invoiceSearch')?.value || '').toLowerCase();
    const status = document.getElementById('invoiceStatusFilter')?.value || '';
    const filtered = DB.invoices.filter(i =>
      (i.invoice_id.toLowerCase().includes(q) || i.order_id.toLowerCase().includes(q)) &&
      (status === '' || i.payment_status === status)
    );
    renderInvoices(filtered);
  }
}

/* ══════════════════════════════════════════════
   DEPARTMENTS
══════════════════════════════════════════════ */
const DEPT_ICONS = { 'Storage': '🏪', 'Production': '⚙️', 'Quality Control': '🔬', 'Logistics': '🚚' };
function renderDepartments(data = DB.departments) {
  const el = document.getElementById('departmentCards');
  if (!el) return;
  if (data.length === 0) { el.innerHTML = `<div style="color:var(--text-muted);padding:24px">No departments found.</div>`; return; }
  el.innerHTML = data.map(d => {
    const mgr = DB.managers.find(m => m.m_id === d.manager_id);
    return `<div class="dept-card">
      <div class="dept-card-header">
        <span class="dept-icon">${DEPT_ICONS[d.dept_type] || '🏢'}</span>
        <span class="dept-type-badge">${d.dept_type}</span>
      </div>
      <div class="dept-name">${d.dept_name}</div>
      <div class="dept-id">${d.dept_id}</div>
      <div class="dept-manager">👤 Manager: <strong>${mgr ? mgr.m_name : 'Unassigned'}</strong></div>
      <div class="dept-card-actions">
        <button class="btn btn-secondary" style="font-size:12px;padding:6px 12px" onclick="openModal('department','${d.dept_id}')">✏️ Edit</button>
        <button class="btn btn-danger" style="font-size:12px;padding:6px 12px" onclick="deleteRecord('department','${d.dept_id}')">🗑️ Delete</button>
      </div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   MANAGERS
══════════════════════════════════════════════ */
function renderManagers(data = DB.managers) {
  const el = document.getElementById('managerCards');
  if (!el) return;
  el.innerHTML = data.map(m => {
    const initials = m.m_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const stockManaged = DB.stock.filter(s => s.manager_id === m.m_id).length;
    const suppliersHandled = DB.suppliers.filter(s => s.manager_id === m.m_id).length;
    const dept = DB.departments.find(d => d.dept_id === m.dept_id);
    const bgColors = ['#4ade80','#60a5fa','#c084fc','#fb923c','#2dd4bf'];
    const bg = bgColors[DB.managers.indexOf(m) % bgColors.length];
    return `<div class="manager-card">
      <div class="mgr-avatar" style="background:${bg}">${initials}</div>
      <div class="mgr-name">${m.m_name}</div>
      <div class="mgr-email">✉️ ${m.m_email}</div>
      <div class="mgr-phone">📞 ${m.m_ph_no}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px">🏢 ${dept ? dept.dept_name : 'No Dept'}</div>
      <div class="mgr-stats">
        <div class="mgr-stat-item">
          <span class="mgr-stat-val">${stockManaged}</span>
          <span class="mgr-stat-lbl">Stock</span>
        </div>
        <div class="mgr-stat-item">
          <span class="mgr-stat-val">${suppliersHandled}</span>
          <span class="mgr-stat-lbl">Suppliers</span>
        </div>
      </div>
      <div class="mgr-card-actions">
        <button class="btn btn-secondary" style="font-size:12px;padding:6px 12px" onclick="openModal('manager','${m.m_id}')">✏️ Edit</button>
        <button class="btn btn-danger" style="font-size:12px;padding:6px 12px" onclick="deleteRecord('manager','${m.m_id}')">🗑️ Delete</button>
      </div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   SUPPLIERS
══════════════════════════════════════════════ */
function renderSuppliers(data = DB.suppliers) {
  const tbody = document.getElementById('supplierTableBody');
  const empty = document.getElementById('supplierEmpty');
  if (!tbody) return;
  if (data.length === 0) { tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';
  tbody.innerHTML = data.map(s => {
    const mgr = DB.managers.find(m => m.m_id === s.manager_id);
    const stockCount = DB.stock.filter(st => st.supplier_id === s.s_id).length;
    const typeColors = { 'Dairy':'#60a5fa','Grains':'#fbbf24','Produce':'#4ade80','Meat':'#f87171','Beverages':'#c084fc','Frozen':'#2dd4bf' };
    const col = typeColors[s.s_type] || '#8b96b0';
    return `<tr>
      <td><span class="id-cell">${s.s_id}</span></td>
      <td><strong>${s.s_name}</strong></td>
      <td>📞 ${s.s_ph_no}</td>
      <td><span class="status-badge" style="background:${col}22;color:${col};border:1px solid ${col}44">${s.s_type}</span></td>
      <td>${mgr ? mgr.m_name : '—'}</td>
      <td><span style="font-weight:700;color:var(--accent-blue)">${stockCount}</span></td>
      <td><div class="action-btns">
        <button class="tbl-btn tbl-btn-edit" onclick="openModal('supplier','${s.s_id}')" title="Edit">✏️</button>
        <button class="tbl-btn tbl-btn-delete" onclick="deleteRecord('supplier','${s.s_id}')" title="Delete">🗑️</button>
      </div></td>
    </tr>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   WAREHOUSES
══════════════════════════════════════════════ */
function renderWarehouses(data = DB.warehouses) {
  const el = document.getElementById('warehouseCards');
  if (!el) return;
  el.innerHTML = data.map(w => {
    const stockCount = DB.stock.filter(s => s.warehouse_id === w.w_id).length;
    return `<div class="warehouse-card">
      <div class="wh-header">
        <div class="wh-icon-wrap">🏭</div>
        <div>
          <div class="wh-name">${w.w_name}</div>
          <div class="wh-id">${w.w_id}</div>
        </div>
      </div>
      <div class="wh-location">📍 ${w.location}</div>
      <div class="wh-capacity">
        <span>Stock Items Stored</span>
        <span class="wh-stock-count">${stockCount}</span>
      </div>
      <div class="wh-card-actions">
        <button class="btn btn-secondary" style="font-size:12px;padding:6px 12px;flex:1" onclick="openModal('warehouse','${w.w_id}')">✏️ Edit</button>
        <button class="btn btn-danger" style="font-size:12px;padding:6px 12px" onclick="deleteRecord('warehouse','${w.w_id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   ORDERS
══════════════════════════════════════════════ */
function renderOrders(data = DB.orders) {
  const tbody = document.getElementById('ordersTableBody');
  const empty = document.getElementById('ordersEmpty');
  if (!tbody) return;
  if (data.length === 0) { tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';
  const statusColors = { 'Delivered': 'status-in-stock', 'In Transit': 'status-low-stock', 'Pending': 'status-expiring' };
  tbody.innerHTML = data.map(o => {
    const mgr = DB.managers.find(m => m.m_id === o.manager_id);
    const sup = DB.suppliers.find(s => s.s_id === o.supplier_id);
    const hasInvoice = DB.invoices.some(i => i.order_id === o.order_id);
    return `<tr>
      <td><span class="id-cell">${o.order_id}</span></td>
      <td>${mgr ? mgr.m_name : '—'}</td>
      <td>${sup ? sup.s_name : '—'}</td>
      <td><a href="#" onclick="gotoProduct('${o.product}'); return false;" class="prd-link">${o.product}</a></td>
      <td>${formatDate(o.order_date)}</td>
      <td><span class="status-badge ${statusColors[o.status] || ''}">${o.status}</span></td>
      <td><div class="action-btns">
        ${hasInvoice ? 
          `<button class="tbl-btn" style="background:var(--accent-green);color:#fff" onclick="navigateTo('invoices')" title="View Invoice">📄</button>` : 
          (o.status === 'Delivered' ? `<button class="tbl-btn" style="background:var(--accent-purple);color:#fff" onclick="generateInvoice('${o.order_id}')" title="Generate Invoice">🧾</button>` : '')
        }
        <button class="tbl-btn tbl-btn-edit" onclick="openModal('order','${o.order_id}')" title="Edit">✏️</button>
        <button class="tbl-btn tbl-btn-delete" onclick="deleteRecord('order','${o.order_id}')" title="Delete">🗑️</button>
      </div></td>
    </tr>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   INVOICES
══════════════════════════════════════════════ */
function renderInvoices(data = DB.invoices) {
  const tbody = document.getElementById('invoicesTableBody');
  const empty = document.getElementById('invoicesEmpty');
  if (!tbody) return;
  if (data.length === 0) { tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';
  const statusColors = { 'Paid': 'status-in-stock', 'Pending': 'status-expiring', 'Overdue': 'status-out-of-stock' };
  tbody.innerHTML = data.map(i => {
    return `<tr>
      <td><span class="id-cell">${i.invoice_id}</span></td>
      <td><span class="id-cell" style="background:var(--accent-blue)22">${i.order_id}</span></td>
      <td><strong>₹${parseFloat(i.amount).toLocaleString('en-IN')}</strong></td>
      <td>${formatDate(i.billing_date)}</td>
      <td><span class="status-badge ${statusColors[i.payment_status] || ''}">${i.payment_status}</span></td>
      <td><div class="action-btns">
        <button class="tbl-btn" style="background:var(--accent-teal);color:#fff" onclick="downloadPDF('${i.invoice_id}')" title="Download PDF">📥</button>
        <button class="tbl-btn tbl-btn-edit" onclick="openModal('invoice','${i.invoice_id}')" title="Edit">✏️</button>
        <button class="tbl-btn tbl-btn-delete" onclick="deleteRecord('invoice','${i.invoice_id}')" title="Delete">🗑️</button>
      </div></td>
    </tr>`;
  }).join('');
}

async function generateInvoice(orderId) {
  const order = DB.orders.find(o => o.order_id === orderId);
  if (!order) return;
  
  // Try to find product to get price
  const prod = DB.products.find(p => p.product_id === order.product);
  const amount = prod ? prod.purchase_price * 100 : 5000; // Default or calculated
  
  const newInvoice = {
    invoice_id: autoId('INV', DB.invoices, 'invoice_id'),
    order_id: orderId,
    amount: amount,
    billing_date: new Date().toISOString().slice(0,10),
    payment_status: 'Pending'
  };
  
  await apiSave('invoices', newInvoice);
  await refreshData();
  showToast(`Invoice ${newInvoice.invoice_id} generated for order ${orderId}`, 'success');
  navigateTo('invoices');
}

function downloadPDF(invoiceId) {
  const inv = DB.invoices.find(i => i.invoice_id === invoiceId);
  if (!inv) return;

  const order = DB.orders.find(o => o.order_id === inv.order_id);
  const mgr = order ? DB.managers.find(m => m.m_id === order.manager_id) : null;
  const sup = order ? DB.suppliers.find(s => s.s_id === order.supplier_id) : null;
  const dept = mgr ? DB.departments.find(d => d.dept_id === mgr.dept_id) : null;

  // Populate Template
  document.getElementById('pdf-invoice-id').textContent = '#' + inv.invoice_id;
  document.getElementById('pdf-manager-name').textContent = mgr ? mgr.m_name : 'Unknown Manager';
  document.getElementById('pdf-dept-name').textContent = dept ? dept.dept_name : 'No Department';
  document.getElementById('pdf-manager-email').textContent = mgr ? mgr.m_email : '';
  
  document.getElementById('pdf-supplier-name').textContent = sup ? sup.s_name : 'Unknown Supplier';
  document.getElementById('pdf-supplier-type').textContent = sup ? sup.s_type + ' Supplier' : '';
  document.getElementById('pdf-supplier-phone').textContent = sup ? 'Phone: ' + sup.s_ph_no : '';

  const prod = order ? DB.products.find(p => p.product_id === order.product) : null;
  document.getElementById('pdf-product-name').textContent = prod ? `${prod.name} (${prod.product_id})` : (order ? order.product : 'Product');
  document.getElementById('pdf-order-id').textContent = inv.order_id;
  document.getElementById('pdf-billing-date').textContent = formatDate(inv.billing_date);
  
  const amt = parseFloat(inv.amount);
  const amtFmt = '₹' + amt.toLocaleString('en-IN');
  document.getElementById('pdf-amount').textContent = amtFmt;
  document.getElementById('pdf-subtotal').textContent = amtFmt;
  document.getElementById('pdf-total').textContent = amtFmt;

  const statusBadge = document.getElementById('pdf-status-badge');
  statusBadge.textContent = inv.payment_status.toUpperCase();
  if (inv.payment_status === 'Paid') {
    statusBadge.style.background = '#f0fdf4';
    statusBadge.style.color = '#166534';
    statusBadge.style.borderColor = '#bbf7d0';
  } else if (inv.payment_status === 'Pending') {
    statusBadge.style.background = '#fefce8';
    statusBadge.style.color = '#854d0e';
    statusBadge.style.borderColor = '#fef08a';
  } else {
    statusBadge.style.background = '#fef2f2';
    statusBadge.style.color = '#991b1b';
    statusBadge.style.borderColor = '#fecaca';
  }

  // Generate PDF
  const element = document.getElementById('invoiceContent');
  const opt = {
    margin:       10,
    filename:     `Invoice_${inv.invoice_id}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
  showToast('Downloading invoice PDF...', 'success');
}

/* ══════════════════════════════════════════════
   PRODUCTS
══════════════════════════════════════════════ */

function calcPL(p) {
  const perUnit = p.selling_price - p.purchase_price;
  const total   = perUnit * p.quantity;
  const margin  = p.purchase_price > 0 ? (perUnit / p.purchase_price) * 100 : 0;
  const isProfit = perUnit >= 0;
  return { perUnit, total, margin, isProfit };
}

function renderProducts(data = DB.products) {
  renderProductSummary(data);
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  if (data.length === 0) {
    grid.innerHTML = `<div style="color:var(--text-muted);padding:24px;grid-column:1/-1">No products found.</div>`;
    return;
  }
  grid.innerHTML = data.map(p => {
    const pl = calcPL(p);
    const plClass = pl.isProfit ? 'profit' : 'loss';
    const plLabel = pl.isProfit ? `+${pl.margin.toFixed(1)}% Profit` : `Loss: ₹${Math.abs(pl.total).toLocaleString('en-IN')}`;
    const sellCls = pl.isProfit ? '' : ' loss';
    return `<div class="product-card is-${plClass}" onclick="openProductDetail('${p.product_id}')">
      <div class="pc-header">
        <div class="pc-icon">${p.icon || '📦'}</div>
        <span class="pc-pl-badge ${plClass}">${plLabel}</span>
      </div>
      <div>
        <div class="pc-name">${p.name}</div>
        <div class="pc-cat">${p.category}</div>
        <span class="pc-id">${p.product_id}</span>
      </div>
      <div class="pc-prices">
        <div class="pc-price-item">
          <span class="pc-price-label">Buy Rate</span>
          <span class="pc-price-val buy">₹${p.purchase_price}/${p.unit}</span>
        </div>
        <div class="pc-price-item">
          <span class="pc-price-label">Sell Rate</span>
          <span class="pc-price-val sell${sellCls}">₹${p.selling_price}/${p.unit}</span>
        </div>
      </div>
      <div class="pc-footer">
        <span class="pc-qty">📦 Qty: ${p.quantity} ${p.unit}</span>
        <span class="pc-view-btn">Details →</span>
      </div>
    </div>`;
  }).join('');
}

function renderProductSummary(data = DB.products) {
  const el = document.getElementById('productSummaryStrip');
  if (!el) return;
  const total = data.length;
  const profitCount = data.filter(p => p.selling_price >= p.purchase_price).length;
  const lossCount   = total - profitCount;
  const totalRevenue = data.reduce((sum, p) => sum + p.selling_price * p.quantity, 0);
  const totalCost    = data.reduce((sum, p) => sum + p.purchase_price * p.quantity, 0);
  const netPL        = totalRevenue - totalCost;
  const netClass     = netPL >= 0 ? 'profit' : 'loss';
  const netSign      = netPL >= 0 ? '+' : '';
  el.innerHTML = `
    <div class="ps-card">
      <span class="ps-label">Total Products</span>
      <span class="ps-value">${total}</span>
    </div>
    <div class="ps-card">
      <span class="ps-label">In Profit</span>
      <span class="ps-value profit">${profitCount}</span>
    </div>
    <div class="ps-card">
      <span class="ps-label">In Loss</span>
      <span class="ps-value loss">${lossCount}</span>
    </div>
    <div class="ps-card">
      <span class="ps-label">Net P&L (Total Stock)</span>
      <span class="ps-value ${netClass}">${netSign}₹${Math.abs(netPL).toLocaleString('en-IN')}</span>
    </div>`;
}

function filterProducts() {
  const q    = (document.getElementById('productSearch')?.value || '').toLowerCase();
  const cat  = document.getElementById('productCategoryFilter')?.value || '';
  const plF  = document.getElementById('productPLFilter')?.value || '';
  const data = DB.products.filter(p => {
    const matchQ   = p.name.toLowerCase().includes(q) || p.product_id.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchCat = cat === '' || p.category === cat;
    const pl       = calcPL(p);
    const matchPL  = plF === '' || (plF === 'profit' && pl.isProfit) || (plF === 'loss' && !pl.isProfit);
    return matchQ && matchCat && matchPL;
  });
  renderProducts(data);
}

async function updateProductLimit(productId) {
  const input = document.getElementById(`detail_limit_${productId}`);
  if (!input) return;
  const newLimit = parseInt(input.value);
  if (isNaN(newLimit) || newLimit < 0) {
    showToast('Invalid limit value', 'error');
    return;
  }

  const p = DB.products.find(x => x.product_id === productId);
  if (!p) return;

  const updatedProduct = { ...p, min_limit: newLimit };
  
  try {
    await apiSave('products', updatedProduct);
    await refreshData();
    showToast(`Reorder limit for ${p.name} updated to ${newLimit} ${p.unit}`, 'success');
  } catch (err) {
    showToast('Failed to update limit', 'error');
  }
}

/* ── Product Detail Panel ── */
function openProductDetail(productId) {
  const p   = DB.products.find(x => x.product_id === productId);
  if (!p) return;
  const pl  = calcPL(p);
  const sup = DB.suppliers.find(s => s.s_id === p.supplier_id);
  const stk = DB.stock.find(s => s.product_id === productId);
  const plClass    = pl.isProfit ? 'profit' : 'loss';
  const plIcon     = pl.isProfit ? '📈' : '📉';
  const plTitle    = pl.isProfit ? `${plIcon} Profitable Product` : `${plIcon} Running at a Loss`;
  const perUnitFmt = (pl.perUnit >= 0 ? '+' : '') + '₹' + Math.abs(pl.perUnit).toFixed(2);
  const totalFmt   = (pl.total  >= 0 ? '+' : '-') + '₹' + Math.abs(pl.total).toLocaleString('en-IN');
  const marginFmt  = (pl.margin >= 0 ? '+' : '') + pl.margin.toFixed(2) + '%';
  const absMargin  = Math.min(Math.abs(pl.margin), 100);

  const inner = document.getElementById('detailPanelInner');
  inner.innerHTML = `
    <!-- Header -->
    <div class="dp-header">
      <div>
        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Product Detail</div>
        <div style="font-family:'Outfit',sans-serif;font-size:17px;font-weight:800;color:var(--text-primary)">${p.name}</div>
      </div>
      <button class="dp-close" onclick="closeDetailPanel(null,true)">✕</button>
    </div>

    <!-- Hero -->
    <div class="dp-hero">
      <div class="dp-icon">${p.icon || '📦'}</div>
      <div>
        <div class="dp-product-name">${p.name}</div>
        <div class="dp-product-cat">${p.category} · ${p.unit}</div>
        <span class="dp-product-id">${p.product_id}</span>
      </div>
    </div>

    <!-- Description -->
    <div class="dp-section-title">📝 Description</div>
    <div class="dp-description">${p.description}</div>

    <!-- Profit / Loss Block -->
    <div class="dp-pl-block ${plClass}">
      <div class="dp-pl-title">${plTitle}</div>

      <div class="dp-pl-big">
        <span class="dp-pl-big-num ${plClass}">${totalFmt}</span>
        <span class="dp-pl-big-label">Total Portfolio P&amp;L (${p.quantity} ${p.unit})</span>
      </div>

      <div class="dp-pl-row">
        <span class="dp-pl-key">🏷️ Supplier Purchase Rate</span>
        <span class="dp-pl-val blue">₹${p.purchase_price} / ${p.unit}</span>
      </div>
      <div class="dp-pl-row">
        <span class="dp-pl-key">💰 Selling Price</span>
        <span class="dp-pl-val ${pl.isProfit ? 'green' : 'red'}">₹${p.selling_price} / ${p.unit}</span>
      </div>
      <div class="dp-pl-row">
        <span class="dp-pl-key">📊 Profit / Loss per Unit</span>
        <span class="dp-pl-val ${pl.isProfit ? 'green' : 'red'}">${perUnitFmt}</span>
      </div>
      <div class="dp-pl-row">
        <span class="dp-pl-key">📦 Quantity in Stock</span>
        <span class="dp-pl-val">${p.quantity} ${p.unit}</span>
      </div>
      <div class="dp-pl-row" style="background: rgba(251, 146, 60, 0.08); border-radius: 8px; margin: 8px -12px; padding: 12px;">
        <span class="dp-pl-key" style="color: var(--accent-orange); font-weight: 700;">🚨 Auto-Reorder Limit</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="number" id="detail_limit_${p.product_id}" value="${p.min_limit || 25}" 
                 style="width: 60px; background: var(--bg-elevated); border: 1px solid var(--border-glass); color: var(--text-primary); border-radius: 4px; padding: 2px 6px; font-size: 13px; font-weight: 700; text-align: center;" />
          <span style="font-size: 12px; color: var(--text-secondary)">${p.unit}</span>
          <button onclick="updateProductLimit('${p.product_id}')" 
                  style="background: var(--accent-orange); color: #fff; border: none; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 700; cursor: pointer;">Set</button>
        </div>
      </div>
      <div class="dp-pl-row">
        <span class="dp-pl-key">💵 Total Revenue Potential</span>
        <span class="dp-pl-val">₹${(p.selling_price * p.quantity).toLocaleString('en-IN')}</span>
      </div>
      <div class="dp-pl-row">
        <span class="dp-pl-key">🧾 Total Cost (Supplier)</span>
        <span class="dp-pl-val">₹${(p.purchase_price * p.quantity).toLocaleString('en-IN')}</span>
      </div>

      <!-- Margin bar -->
      <div class="dp-margin-bar-wrap">
        <div class="dp-margin-label">
          <span>Margin</span>
          <span>${marginFmt}</span>
        </div>
        <div class="dp-margin-track">
          <div class="dp-margin-fill ${plClass}" style="width:${absMargin}%"></div>
        </div>
      </div>
    </div>

    <!-- Supplier Info -->
    <div class="dp-section-title">🚚 Supplier</div>
    ${sup ? `<div class="dp-supplier-card">
      <span class="dp-sup-icon">🏭</span>
      <div>
        <div class="dp-sup-name">${sup.s_name}</div>
        <div class="dp-sup-type">${sup.s_type} Supplier · ${sup.s_id}</div>
        <div class="dp-sup-phone">📞 ${sup.s_ph_no}</div>
      </div>
    </div>` : '<p style="color:var(--text-muted);font-size:13px">No supplier linked.</p>'}

    <!-- Stock Info -->
    <div class="dp-section-title">📦 Stock Info</div>
    <div class="dp-stock-row">
      <div class="dp-stock-item">
        <span class="dp-stock-val">${stk ? stk.stock_id : '—'}</span>
        <span class="dp-stock-lbl">Stock ID</span>
      </div>
      <div class="dp-stock-item">
        <span class="dp-stock-val">${stk ? '<span class="status-badge ' + statusClass(stk.stock_status) + '">' + stk.stock_status + '</span>' : '—'}</span>
        <span class="dp-stock-lbl">Status</span>
      </div>
      <div class="dp-stock-item">
        <span class="dp-stock-val">${stk ? formatDate(stk.exp_date) : '—'}</span>
        <span class="dp-stock-lbl">Expiry Date</span>
      </div>
      <div class="dp-stock-item">
        <span class="dp-stock-val">${stk ? getWHName(stk.warehouse_id) : '—'}</span>
        <span class="dp-stock-lbl">Warehouse</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="dp-action-row">
      <button class="btn btn-secondary" onclick="openModal('product','${p.product_id}')">✏️ Edit Product</button>
      <button class="btn btn-danger" onclick="deleteRecord('product','${p.product_id}')">🗑️ Delete</button>
    </div>
    
    <!-- AI Suggestion Trigger -->
    <div style="margin-top:24px; padding-top:20px; border-top:1px solid var(--border-glass)">
        <button class="btn btn-ai" onclick="getAISuggestion('${p.product_id}')" id="aiBtn_${p.product_id}" style="width:100%; justify-content:center; gap:12px; font-size:14px; padding:12px">
            ✨ Get AI Pricing Strategy
        </button>
        <div id="aiSuggestionContainer_${p.product_id}" class="ai-suggestion-container"></div>
    </div>`;

  document.getElementById('detailOverlay').classList.add('active');
  document.getElementById('detailPanel').classList.add('open');
  // Animate margin bar
  setTimeout(() => {
    const fill = document.querySelector('.dp-margin-fill');
    if (fill) fill.style.width = absMargin + '%';
  }, 100);
}

function closeDetailPanel(e, force = false) {
  if (force || (e && e.target === document.getElementById('detailOverlay'))) {
    document.getElementById('detailOverlay').classList.remove('active');
    document.getElementById('detailPanel').classList.remove('open');
  }
}

async function getAISuggestion(productId) {
  const container = document.getElementById(`aiSuggestionContainer_${productId}`);
  const btn = document.getElementById(`aiBtn_${productId}`);
  
  if (!container || !btn) return;
  
  btn.disabled = true;
  btn.innerHTML = `<span>⏳ Analyzing Market Trends...</span>`;
  container.innerHTML = `<div class="ai-loader"></div>`;
  
  try {
    const res = await fetch(`/api/ai/pricing-suggestion/${productId}`);
    const data = await res.json();
    
    if (data.error) throw new Error(data.error);
    
    btn.style.display = 'none';
    
    const rec = data.ai_recommendation;
    const market = data.market_analysis;
    const cur = data.current_prices;
    
    const trendIcon = market.trend === 'upward' ? '📈' : '📉';
    const actionClass = rec.recommended_action === 'BUY NOW' ? 'action-buy' : 'action-hold';
    
    container.innerHTML = `
      <div class="ai-card">
        <div class="ai-card-header">
          <div class="ai-chip">AI STRATEGY</div>
          <div class="ai-trend ${market.trend}">${trendIcon} ${market.trend.toUpperCase()} TREND</div>
        </div>
        
        <div class="ai-insight">"${rec.insight}"</div>
        
        <div class="ai-action-badge ${actionClass}">
          Recommendation: ${rec.recommended_action}
        </div>
        
        <div class="ai-comparison-grid">
          <div class="ai-comp-item">
            <span class="ai-comp-label">Suggested Purchase</span>
            <span class="ai-comp-val">₹${rec.suggested_purchase_price}</span>
            <span class="ai-comp-diff ${rec.suggested_purchase_price < cur.purchase ? 'save' : 'warn'}">
              ${(rec.suggested_purchase_price - cur.purchase).toFixed(2)} vs current
            </span>
          </div>
          <div class="ai-comp-item">
            <span class="ai-comp-label">Suggested Selling</span>
            <span class="ai-comp-val green">₹${rec.suggested_selling_price}</span>
            <span class="ai-comp-diff save">+${(rec.suggested_selling_price - cur.selling).toFixed(2)} vs current</span>
          </div>
        </div>
        
        <div class="ai-profit-footer">
          <div class="ai-profit-item">
            <span class="ai-p-label">Potential Profit</span>
            <span class="ai-p-val">₹${rec.potential_profit_per_unit} / unit</span>
          </div>
          <div class="ai-profit-item">
            <span class="ai-p-label">Target Margin</span>
            <span class="ai-p-val highlight">${rec.margin_percentage}%</span>
          </div>
        </div>
        
        <button class="btn btn-secondary" style="width:100%; margin-top:16px; font-size:11px" onclick="openProductDetail('${productId}')">
          🔄 Refresh AI Analysis
        </button>
      </div>
    `;
  } catch (err) {
    console.error('AI Suggestion error:', err);
    btn.disabled = false;
    btn.innerHTML = `✨ Get AI Pricing Strategy`;
    container.innerHTML = `<div style="color:var(--accent-red); font-size:12px; margin-top:10px">Failed to get AI suggestion. Please try again.</div>`;
  }
}

/* ══════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════ */
const modalConfigs = {
  product: {
    title: (id) => id ? 'Edit Product' : 'Add Product',
    getRecord: (id) => DB.products.find(p => p.product_id === id),
    fields: (rec) => `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Product ID</label>
          <input class="form-input" id="f_product_id" value="${rec ? rec.product_id : 'PRD-' + String(DB.products.length + 1).padStart(3,'0')}" ${rec ? 'readonly' : ''} />
        </div>
        <div class="form-group">
          <label class="form-label">Product Name</label>
          <input class="form-input" id="f_name" placeholder="e.g. Fresh Tomatoes" value="${rec ? rec.name : ''}" required />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-select" id="f_category">
            ${['Vegetables','Dairy','Grains','Meat','Beverages','Frozen'].map(c => `<option ${rec && rec.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Unit</label>
          <select class="form-select" id="f_unit">
            ${['kg','L','pcs','dozen'].map(u => `<option ${rec && rec.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Purchase Price (₹)</label>
          <input class="form-input" id="f_purchase_price" type="number" min="0" step="0.01" placeholder="Supplier rate" value="${rec ? rec.purchase_price : ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Selling Price (₹)</label>
          <input class="form-input" id="f_selling_price" type="number" min="0" step="0.01" placeholder="Market rate" value="${rec ? rec.selling_price : ''}" required />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Current Quantity</label>
          <input class="form-input" id="f_quantity" type="number" min="0" placeholder="Stock qty" value="${rec ? rec.quantity : ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label" style="color:var(--accent-orange)">Auto-Reorder Limit</label>
          <input class="form-input" id="f_min_limit" type="number" min="0" placeholder="Order when below..." value="${rec ? (rec.min_limit || 25) : 25}" required />
          <small style="font-size:10px; color:var(--text-muted)">Order triggers when stock hits this limit.</small>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Icon (Emoji)</label>
        <input class="form-input" id="f_icon" placeholder="e.g. 🍅, 🥛, 🍚" value="${rec ? rec.icon : '📦'}" />
      </div>
      <div class="form-group">
        <label class="form-label">Supplier</label>
        <select class="form-select" id="f_supplier_id">
          ${DB.suppliers.map(s => `<option value="${s.s_id}" ${rec && rec.supplier_id === s.s_id ? 'selected' : ''}>${s.s_name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-input" id="f_description" rows="3" placeholder="Product description..." style="resize:vertical">${rec ? rec.description : ''}</textarea>
      </div>`,
    save: async (id) => {
      const obj = {
        product_id: v('f_product_id'), name: v('f_name'), category: v('f_category'),
        unit: v('f_unit'), purchase_price: parseFloat(v('f_purchase_price')),
        selling_price: parseFloat(v('f_selling_price')), quantity: parseInt(v('f_quantity')),
        min_limit: parseInt(v('f_min_limit')),
        icon: v('f_icon') || '📦', description: v('f_description'), supplier_id: v('f_supplier_id')
      };
      if (!obj.name || isNaN(obj.purchase_price) || isNaN(obj.selling_price)) {
        showToast('Please fill all required fields', 'error'); return false;
      }
      await apiSave('products', obj);
      return true;
    }
  },
  stock: {
    title: (id) => id ? 'Edit Stock Item' : 'Add Stock Item',
    getRecord: (id) => DB.stock.find(s => s.stock_id === id),
    fields: (rec) => `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Stock ID</label>
          <input class="form-input" id="f_stock_id" value="${rec ? rec.stock_id : autoId('STK', DB.stock, 'stock_id')}" ${rec ? 'readonly' : ''} required />
        </div>
        <div class="form-group">
          <label class="form-label">Product ID</label>
          <input class="form-input" id="f_product_id" placeholder="PRD-XXX" value="${rec ? rec.product_id : ''}" required />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Expiry Date</label>
          <input class="form-input" id="f_exp_date" type="date" value="${rec ? rec.exp_date : ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Stock Status</label>
          <select class="form-select" id="f_stock_status">
            ${['In Stock','Low Stock','Out of Stock','Expiring Soon'].map(s => `<option ${rec && rec.stock_status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Warehouse</label>
          <select class="form-select" id="f_warehouse_id">
            ${DB.warehouses.map(w => `<option value="${w.w_id}" ${rec && rec.warehouse_id === w.w_id ? 'selected' : ''}>${w.w_name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Supplier</label>
          <select class="form-select" id="f_supplier_id">
            ${DB.suppliers.map(s => `<option value="${s.s_id}" ${rec && rec.supplier_id === s.s_id ? 'selected' : ''}>${s.s_name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Manager</label>
        <select class="form-select" id="f_manager_id">
          ${DB.managers.map(m => `<option value="${m.m_id}" ${rec && rec.manager_id === m.m_id ? 'selected' : ''}>${m.m_name}</option>`).join('')}
        </select>
      </div>`,
    save: async (id) => {
      const expDate = v('f_exp_date');
      let status = v('f_stock_status');
      
      // Auto-update status if near expiry
      const diff = (new Date(expDate) - new Date()) / (1000 * 60 * 60 * 24);
      if (diff >= 0 && diff < 14) {
        status = 'Expiring Soon';
      }

      const obj = {
        stock_id: v('f_stock_id'), product_id: v('f_product_id'),
        exp_date: expDate, stock_status: status,
        warehouse_id: v('f_warehouse_id'), supplier_id: v('f_supplier_id'),
        manager_id: v('f_manager_id')
      };
      if (!obj.product_id || !obj.exp_date) { showToast('Please fill required fields', 'error'); return false; }
      await apiSave('stock', obj);
      return true;
    }
  },
  department: {
    title: (id) => id ? 'Edit Department' : 'Add Department',
    getRecord: (id) => DB.departments.find(d => d.dept_id === id),
    fields: (rec) => `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Dept ID</label>
          <input class="form-input" id="f_dept_id" value="${rec ? rec.dept_id : autoId('D', DB.departments, 'dept_id')}" ${rec ? 'readonly' : ''} required />
        </div>
        <div class="form-group">
          <label class="form-label">Department Name</label>
          <input class="form-input" id="f_dept_name" placeholder="Name" value="${rec ? rec.dept_name : ''}" required />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-select" id="f_dept_type">
            ${['Production','Storage','Logistics','Quality Control'].map(t => `<option ${rec && rec.dept_type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Manager</label>
          <select class="form-select" id="f_manager_id">
            ${DB.managers.map(m => `<option value="${m.m_id}" ${rec && rec.manager_id === m.m_id ? 'selected' : ''}>${m.m_name}</option>`).join('')}
          </select>
        </div>
      </div>`,
    save: async (id) => {
      const obj = { dept_id: v('f_dept_id'), dept_name: v('f_dept_name'), dept_type: v('f_dept_type'), manager_id: v('f_manager_id') };
      if (!obj.dept_name) { showToast('Please fill required fields', 'error'); return false; }
      await apiSave('departments', obj);
      return true;
    }
  },
  manager: {
    title: (id) => id ? 'Edit Manager' : 'Add Manager',
    getRecord: (id) => DB.managers.find(m => m.m_id === id),
    fields: (rec) => `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Manager ID</label>
          <input class="form-input" id="f_m_id" value="${rec ? rec.m_id : autoId('M', DB.managers, 'm_id')}" ${rec ? 'readonly' : ''} />
        </div>
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input class="form-input" id="f_m_name" placeholder="John Doe" value="${rec ? rec.m_name : ''}" required />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="f_m_email" type="email" placeholder="email@example.com" value="${rec ? rec.m_email : ''}" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input class="form-input" id="f_m_ph_no" placeholder="9XXXXXXXXX" value="${rec ? rec.m_ph_no : ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Department</label>
          <select class="form-select" id="f_dept_id">
            ${DB.departments.map(d => `<option value="${d.dept_id}" ${rec && rec.dept_id === d.dept_id ? 'selected' : ''}>${d.dept_name}</option>`).join('')}
          </select>
        </div>
      </div>`,
    save: async (id) => {
      const obj = { m_id: v('f_m_id'), m_name: v('f_m_name'), m_email: v('f_m_email'), m_ph_no: v('f_m_ph_no'), dept_id: v('f_dept_id') };
      if (!obj.m_name || !obj.m_email) { showToast('Please fill required fields', 'error'); return false; }
      await apiSave('managers', obj);
      return true;
    }
  },
  supplier: {
    title: (id) => id ? 'Edit Supplier' : 'Add Supplier',
    getRecord: (id) => DB.suppliers.find(s => s.s_id === id),
    fields: (rec) => `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Supplier ID</label>
          <input class="form-input" id="f_s_id" value="${rec ? rec.s_id : autoId('S', DB.suppliers, 's_id')}" ${rec ? 'readonly' : ''} />
        </div>
        <div class="form-group">
          <label class="form-label">Supplier Name</label>
          <input class="form-input" id="f_s_name" placeholder="Company Name" value="${rec ? rec.s_name : ''}" required />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input class="form-input" id="f_s_ph_no" placeholder="8XXXXXXXXX" value="${rec ? rec.s_ph_no : ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-select" id="f_s_type">
            ${['Dairy','Grains','Produce','Meat','Beverages','Frozen'].map(t => `<option ${rec && rec.s_type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Assigned Manager</label>
        <select class="form-select" id="f_manager_id">
          ${DB.managers.map(m => `<option value="${m.m_id}" ${rec && rec.manager_id === m.m_id ? 'selected' : ''}>${m.m_name}</option>`).join('')}
        </select>
      </div>`,
    save: async (id) => {
      const obj = { s_id: v('f_s_id'), s_name: v('f_s_name'), s_ph_no: v('f_s_ph_no'), s_type: v('f_s_type'), manager_id: v('f_manager_id') };
      if (!obj.s_name) { showToast('Please fill required fields', 'error'); return false; }
      await apiSave('suppliers', obj);
      return true;
    }
  },
  warehouse: {
    title: (id) => id ? 'Edit Warehouse' : 'Add Warehouse',
    getRecord: (id) => DB.warehouses.find(w => w.w_id === id),
    fields: (rec) => `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Warehouse ID</label>
          <input class="form-input" id="f_w_id" value="${rec ? rec.w_id : autoId('W', DB.warehouses, 'w_id')}" ${rec ? 'readonly' : ''} />
        </div>
        <div class="form-group">
          <label class="form-label">Warehouse Name</label>
          <input class="form-input" id="f_w_name" placeholder="Name" value="${rec ? rec.w_name : ''}" required />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Location</label>
        <input class="form-input" id="f_location" placeholder="City, State" value="${rec ? rec.location : ''}" required />
      </div>`,
    save: async (id) => {
      const obj = { w_id: v('f_w_id'), w_name: v('f_w_name'), location: v('f_location') };
      if (!obj.w_name || !obj.location) { showToast('Please fill required fields', 'error'); return false; }
      await apiSave('warehouses', obj);
      return true;
    }
  },
  order: {
    title: (id) => id ? 'Edit Order' : 'Create Order',
    getRecord: (id) => DB.orders.find(o => o.order_id === id),
    fields: (rec) => `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Order ID</label>
          <input class="form-input" id="f_order_id" value="${rec ? rec.order_id : autoId('ORD', DB.orders, 'order_id')}" ${rec ? 'readonly' : ''} />
        </div>
        <div class="form-group">
          <label class="form-label">Product</label>
          <input class="form-input" id="f_product" placeholder="PRD-XXX" value="${rec ? rec.product : ''}" required />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Manager</label>
          <select class="form-select" id="f_manager_id">
            ${DB.managers.map(m => `<option value="${m.m_id}" ${rec && rec.manager_id === m.m_id ? 'selected' : ''}>${m.m_name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Supplier</label>
          <select class="form-select" id="f_supplier_id">
            ${DB.suppliers.map(s => `<option value="${s.s_id}" ${rec && rec.supplier_id === s.s_id ? 'selected' : ''}>${s.s_name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Date</label>
          <input class="form-input" id="f_order_date" type="date" value="${rec ? rec.order_date : new Date().toISOString().slice(0,10)}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="f_status">
            ${['Pending','In Transit','Delivered'].map(s => `<option ${rec && rec.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>`,
    save: async (id) => {
      const obj = { order_id: v('f_order_id'), product: v('f_product'), manager_id: v('f_manager_id'), supplier_id: v('f_supplier_id'), order_date: v('f_order_date'), status: v('f_status') };
      if (!obj.product || !obj.order_date) { showToast('Please fill required fields', 'error'); return false; }
      await apiSave('orders', obj);
      return true;
    }
  },
  invoice: {
    title: (id) => id ? 'Edit Invoice' : 'Create Invoice',
    getRecord: (id) => DB.invoices.find(i => i.invoice_id === id),
    fields: (rec) => `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Invoice ID</label>
          <input class="form-input" id="f_invoice_id" value="${rec ? rec.invoice_id : autoId('INV', DB.invoices, 'invoice_id')}" ${rec ? 'readonly' : ''} />
        </div>
        <div class="form-group">
          <label class="form-label">Order ID</label>
          <select class="form-select" id="f_order_id">
            ${DB.orders.map(o => `<option value="${o.order_id}" ${rec && rec.order_id === o.order_id ? 'selected' : ''}>${o.order_id} (${o.product})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Amount (₹)</label>
          <input class="form-input" id="f_amount" type="number" min="0" step="0.01" value="${rec ? rec.amount : ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Billing Date</label>
          <input class="form-input" id="f_billing_date" type="date" value="${rec ? rec.billing_date : new Date().toISOString().slice(0,10)}" required />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="f_payment_status">
          ${['Paid','Pending','Overdue'].map(s => `<option ${rec && rec.payment_status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>`,
    save: async (id) => {
      const obj = { 
        invoice_id: v('f_invoice_id'), 
        order_id: v('f_order_id'), 
        amount: parseFloat(v('f_amount')), 
        billing_date: v('f_billing_date'), 
        payment_status: v('f_payment_status') 
      };
      if (isNaN(obj.amount) || !obj.billing_date) { showToast('Please fill required fields', 'error'); return false; }
      await apiSave('invoices', obj);
      return true;
    }
  }
};

function openModal(type, id = null) {
  currentModal = type;
  editingId = id;
  const cfg = modalConfigs[type];
  if (!cfg) return;
  const rec = id ? cfg.getRecord(id) : null;
  document.getElementById('modalTitle').textContent = cfg.title(id);
  document.getElementById('modalBody').innerHTML = cfg.fields(rec);
  document.getElementById('modalOverlay').classList.add('active');
}

async function saveModal() {
  const cfg = modalConfigs[currentModal];
  if (!cfg) return;
  const success = await cfg.save(editingId);
  if (success) {
    closeModal(null, true);
    await refreshData();
    showToast(editingId ? 'Record updated in database!' : 'Record added to database!', 'success');
  }
}

async function apiSave(table, data) {
  try {
    const res = await fetch(`/api/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error('API Save error:', err);
    showToast('Failed to save to database.', 'error');
  }
}

function closeModal(e, force = false) {
  if (force || (e && e.target === document.getElementById('modalOverlay'))) {
    document.getElementById('modalOverlay').classList.remove('active');
    currentModal = null;
    editingId = null;
  }
}

/* ══════════════════════════════════════════════
   DELETE
══════════════════════════════════════════════ */
async function deleteRecord(type, id) {
  const confirmed = confirm(`Delete this ${type} record (${id})? This cannot be undone.`);
  if (!confirmed) return;
  
  const maps = {
    product: 'products', stock: 'stock', department: 'departments', manager: 'managers',
    supplier: 'suppliers', warehouse: 'warehouses', order: 'orders', invoice: 'invoices'
  };
  
  try {
    const table = maps[type];
    const res = await fetch(`/api/${table}?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    
    if (data.status === 'success') {
      closeDetailPanel(null, true);
      await refreshData();
      showToast('Record deleted from database.', 'info');
    } else {
      showToast('Failed to delete record.', 'error');
    }
  } catch (err) {
    console.error('Delete error:', err);
    showToast('Network error during deletion.', 'error');
  }
}



/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function v(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function autoId(prefix, arr, field) {
  const nums = arr.map(r => parseInt(r[field].replace(/\D/g, '')) || 0);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return prefix + String(next).padStart(3, '0');
}

function getWHName(id) {
  const w = DB.warehouses.find(x => x.w_id === id);
  return w ? w.w_name : id;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function expiryClass(dateStr) {
  const today = new Date();
  const d = new Date(dateStr);
  const diff = (d - today) / (1000 * 60 * 60 * 24);
  if (diff < 0) return { cls: 'expiry-expired', icon: '❌' };
  if (diff < 14) return { cls: 'expiry-near', icon: '⚠️' };
  return { cls: 'expiry-ok', icon: '' };
}

function statusClass(status) {
  const map = {
    'In Stock': 'status-in-stock',
    'Low Stock': 'status-low-stock',
    'Out of Stock': 'status-out-of-stock',
    'Expiring Soon': 'status-expiring'
  };
  return map[status] || '';
}

/* ── Toast ── */
let toastQueue = [];
let isToasting = false;

function showToast(msg, type = 'success') {
  toastQueue.push({ msg, type });
  if (!isToasting) processToast();
}

function processToast() {
  if (toastQueue.length === 0) {
    isToasting = false;
    return;
  }
  isToasting = true;
  const { msg, type } = toastQueue.shift();
  
  const toast = document.getElementById('toast');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.textContent = icons[type] + ' ' + msg;
  toast.className = `toast ${type}`;
  
  requestAnimationFrame(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(processToast, 400); // Wait for fade out before showing next
    }, 3500);
  });
}

/* ══════════════════════════════════════════════
   AI CHATBOT LOGIC
   ══════════════════════════════════════════════ */
function toggleChat() {
  const win = document.getElementById("chatWindow");
  if (!win) return;
  win.classList.toggle("open");
  if (win.classList.contains("open")) {
    document.getElementById("chatInput").focus();
  }
}

function handleChatKey(e) {
  if (e.key === "Enter") sendChatMessage();
}

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  appendMessage("user", text);
  input.value = "";

  // Show "typing" indicator
  const container = document.getElementById("chatMessages");
  const typing = document.createElement("div");
  typing.className = "message bot typing";
  typing.id = "chatTyping";
  typing.textContent = "FreshAI is thinking...";
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    
    // Remove typing indicator
    const typingEl = document.getElementById("chatTyping");
    if (typingEl) typingEl.remove();
    
    appendMessage("bot", data.response);
  } catch (err) {
    const typingEl = document.getElementById("chatTyping");
    if (typingEl) typingEl.remove();
    appendMessage("bot", "I'm having trouble connecting to my AI brain. Falling back to basic mode: " + getAIResponse(text));
  }
}

function appendMessage(sender, text) {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  
  if (sender === "bot") {
    msg.innerHTML = formatMarkdown(text);
  } else {
    msg.textContent = text;
  }
  
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function formatMarkdown(text) {
  let html = text
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')       // Headers: ### text
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')        // Headers: ## text
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')         // Headers: # text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold: **text**
    .replace(/\*(.*?)\*/g, '<em>$1</em>')             // Italic: *text*
    .replace(/^\s*[\*\-]\s+(.*$)/gm, '<li>$1</li>')  // List items: * item or - item
    .replace(/\n/g, '<br>');                          // Newlines

  // Wrap list items in <ul>
  // We look for sequences of <li>...</li> and wrap them
  html = html.replace(/(<li>(?:.|\n)*?<\/li>)/g, (match) => {
    return '<ul>' + match + '</ul>';
  });
  
  // Clean up: nested <ul> caused by multiple matches
  html = html.replace(/<\/ul><ul>/g, '');
  
  // Clean up: <br> after headers or lists often look bad
  html = html.replace(/<\/h[1-3]><br>/g, (m) => m.substring(0, 5));
  html = html.replace(/<\/ul><br>/g, '</ul>');

  return html;
}

function getAIResponse(q) {
  q = q.toLowerCase();
  
  if (q.includes("hello") || q.includes("hi") || q.includes("hey")) {
    return "Hello! I'm your FreshTrack AI assistant. You can ask me about stock, products, suppliers, or general system stats.";
  }
  
  if (q.includes("stock") || q.includes("how many items")) {
    const total = DB.stock ? DB.stock.length : 0;
    const expiring = DB.stock ? DB.stock.filter(s => {
      const diff = (new Date(s.exp_date) - new Date()) / (1000 * 60 * 60 * 24);
      return s.stock_status === 'Expiring Soon' || (diff >= 0 && diff < 14);
    }).length : 0;
    return `Currently, there are ${total} items in stock. ${expiring} items are expiring soon.`;
  }
  
  if (q.includes("product")) {
    const count = DB.products ? DB.products.length : 0;
    return `We have ${count} different food products registered in the system. Check the Products tab for details on pricing and profit margins.`;
  }
  
  if (q.includes("supplier")) {
    const count = DB.suppliers ? DB.suppliers.length : 0;
    return `You are currently working with ${count} active suppliers. You can manage them in the Suppliers section.`;
  }
  
  if (q.includes("manager")) {
    const count = DB.managers ? DB.managers.length : 0;
    return `There are ${count} team managers leading different departments.`;
  }
  
  if (q.includes("warehouse")) {
    const count = DB.warehouses ? DB.warehouses.length : 0;
    return `The system tracks inventory across ${count} warehouse locations.`;
  }

  if (q.includes("status") && (q.includes("prd") || q.includes("stk"))) {
    const idMatch = q.match(/(prd|stk)-[a-z0-9]+/i);
    if (idMatch && DB.stock) {
        const targetId = idMatch[0].toUpperCase();
        const item = DB.stock.find(s => s.stock_id === targetId || s.product_id === targetId);
        if (item) {
            return `Found record! ${targetId} is "${item.stock_status}" and it expires on ${formatDate(item.exp_date)}. It's stored in ${getWHName(item.warehouse_id)}.`;
        }
    }
    return "I couldn't find that specific ID in our current stock records. Make sure you use IDs like PRD-101 or STK-001.";
  }

  if (q.includes("thank")) {
    return "You're welcome! Happy managing! 🥦";
  }

  return "I'm not quite sure about that. Try asking about \"stock count\", \"expiring items\", or \"list of suppliers\". I can also check the status of specific IDs!";
}
