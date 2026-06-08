// Cliente HTTP centralizado para la API PHP de SGMOT
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/sgmot/api';

function getToken() {
  return localStorage.getItem('sgmot_token');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    // Si el token expiró, limpiar sesión
    if (res.status === 401) {
      localStorage.removeItem('sgmot_token');
      localStorage.removeItem('sgmot_user');
    }
    throw data?.error ? data : { error: data?.error || `Error ${res.status}` };
  }
  return data;
}

function queryString(params = {}) {
  const clean = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') clean[key] = value;
  });
  return new URLSearchParams(clean).toString();
}

export const api = {
  auth: {
    login: (email, password) => request('POST', '/auth/login', { email, password }),
    register: (data) => request('POST', '/auth/register', data),
    google: (id_token) => request('POST', '/auth/google', { id_token }),
    me: () => request('GET', '/me'),
    myClient: () => request('GET', '/me/client'),
    updateProfile: (data) => request('PUT', '/me/profile', data),
    completeProfile: (data) => request('POST', '/me/complete-profile', data),
    changePassword: (current_password, new_password) =>
      request('PUT', '/me/password', { current_password, new_password }),
    logout: () => {
      localStorage.removeItem('sgmot_token');
      localStorage.removeItem('sgmot_user');
      window.location.href = '/login';
    },
  },
  users: {
    list:   ()       => request('GET',    '/users'),
    get:    (id)     => request('GET',    `/users/${id}`),
    create: (data)   => request('POST',   '/users', data),
    update: (id, d)  => request('PUT',    `/users/${id}`, d),
    delete: (id, admin_password) => request('DELETE', `/users/${id}`, { admin_password }),
  },
  clients: {
    list:   ()       => request('GET',    '/clients'),
    get:    (id)     => request('GET',    `/clients/${id}`),
    create: (data)   => request('POST',   '/clients', data),
    update: (id, d)  => request('PUT',    `/clients/${id}`, d),
    delete: (id)     => request('DELETE', `/clients/${id}`),
  },
  technicians: {
    list:   ()       => request('GET',    '/technicians'),
    get:    (id)     => request('GET',    `/technicians/${id}`),
    create: (data)   => request('POST',   '/technicians', data),
    update: (id, d)  => request('PUT',    `/technicians/${id}`, d),
    delete: (id)     => request('DELETE', `/technicians/${id}`),
  },
  workOrders: {
    list:   ()       => request('GET',    '/work_orders'),
    get:    (id)     => request('GET',    `/work_orders/${id}`),
    create: (data)   => request('POST',   '/work_orders', data),
    update: (id, d)  => request('PUT',    `/work_orders/${id}`, d),
    delete: (id)     => request('DELETE', `/work_orders/${id}`),
  },
  incidents: {
    list:   ()       => request('GET',    '/incidents'),
    get:    (id)     => request('GET',    `/incidents/${id}`),
    create: (data)   => request('POST',   '/incidents', data),
    update: (id, d)  => request('PUT',    `/incidents/${id}`, d),
    delete: (id)     => request('DELETE', `/incidents/${id}`),
  },
  auditLogs: {
    list: (params = {}) => {
      const q = queryString(params);
      return request('GET', `/audit_logs${q ? '?' + q : ''}`);
    },
    purge: (before) => request('DELETE', `/audit_logs?purge_before=${before}`),
  },
  notifications: {
    list:    (unreadOnly = false) => request('GET', `/notifications${unreadOnly ? '?unread=1' : ''}`),
    markRead:    (id) => request('PUT', `/notifications/${id}/read`),
    markAllRead: ()   => request('PUT', '/notifications/read-all'),
    delete:      (id) => request('DELETE', `/notifications/${id}`),
    clearRead:   ()   => request('DELETE', '/notifications/clear-read'),
  },
  reports: {
    summary:           (params = {}) => request('GET', `/reports/summary?${queryString(params)}`),
    ordersTimeline:    (params = {}) => request('GET', `/reports/orders-timeline?${queryString(params)}`),
    incidentsTimeline: (params = {}) => request('GET', `/reports/incidents-timeline?${queryString(params)}`),
    ordersByType:      (params = {}) => request('GET', `/reports/orders-by-type?${queryString(params)}`),
    incidentsByCategory: (params = {}) => request('GET', `/reports/incidents-by-category?${queryString(params)}`),
    technicianPerformance: (params = {}) => request('GET', `/reports/technician-performance?${queryString(params)}`),
    clientsByPlan:     () => request('GET', '/reports/clients-by-plan'),
  },
};
