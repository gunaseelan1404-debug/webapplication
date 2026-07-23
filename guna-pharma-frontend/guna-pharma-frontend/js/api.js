// Shared helpers used across register.html, login.html, products.html, cart.html

const GUNA = {
  getToken() {
    return localStorage.getItem('guna_token');
  },
  setSession(token, customer) {
    localStorage.setItem('guna_token', token);
    localStorage.setItem('guna_customer', JSON.stringify(customer));
  },
  getCustomer() {
    try { return JSON.parse(localStorage.getItem('guna_customer') || 'null'); }
    catch (e) { return null; }
  },
  clearSession() {
    localStorage.removeItem('guna_token');
    localStorage.removeItem('guna_customer');
  },
  requireLogin() {
    if (!this.getToken()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },
  async api(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const token = this.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const base = (window.GUNA_CONFIG && window.GUNA_CONFIG.API_BASE_URL) || '';
    const res = await fetch(base + path, Object.assign({}, options, { headers }));
    let data = {};
    try { data = await res.json(); } catch (e) { /* no body */ }

    if (res.status === 401) {
      this.clearSession();
      window.location.href = 'login.html';
      throw new Error('Session expired');
    }
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.data = data;
      throw err;
    }
    return data;
  },
  money(n) {
    return '₹' + Number(n).toFixed(2);
  }
};

// Fill in navbar + cart badge count on any page that has #navCartCount
async function gunaRefreshNav() {
  const nameEl = document.getElementById('navCustomerName');
  const customer = GUNA.getCustomer();
  if (nameEl && customer) nameEl.textContent = customer.firstName;

  const countEl = document.getElementById('navCartCount');
  if (countEl && GUNA.getToken()) {
    try {
      const { items } = await GUNA.api('/api/cart');
      const total = items.reduce((s, i) => s + i.quantity, 0);
      countEl.textContent = total;
      countEl.style.display = total > 0 ? 'inline-flex' : 'none';
    } catch (e) { /* ignore */ }
  }
}

document.addEventListener('DOMContentLoaded', gunaRefreshNav);
