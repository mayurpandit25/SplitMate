export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('splitmate_token')
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) { if (response.status === 401) { localStorage.removeItem('splitmate_token'); localStorage.removeItem('splitmate_user') } throw new Error(data.message || `Request failed (${response.status})`) }
  return data
}
export async function auth(mode, values) { const data = await apiRequest(`/auth/${mode}`, { method:'POST', body:JSON.stringify(values) }); localStorage.setItem('splitmate_token', data.token); localStorage.setItem('splitmate_user', JSON.stringify(data.user)); return data }
export const me = () => apiRequest('/auth/me')
export const logout = async () => { try { await apiRequest('/auth/logout',{method:'POST'}) } catch {} localStorage.removeItem('splitmate_token'); localStorage.removeItem('splitmate_user') }
export const getGroups = () => apiRequest('/groups')
export const createGroup = values => apiRequest('/groups',{method:'POST',body:JSON.stringify(values)})
export const getMembers = id => apiRequest(`/groups/${id}/members`)
export const addMember = (id,email) => apiRequest(`/groups/${id}/members`,{method:'POST',body:JSON.stringify({email})})
export const getExpenses = (id='') => apiRequest(`/expenses${id?`?groupId=${encodeURIComponent(id)}`:''}`)
export const createExpense = values => apiRequest('/expenses',{method:'POST',body:JSON.stringify(values)})
export const deleteExpense = id => apiRequest(`/expenses/${id}`,{method:'DELETE'})
export const getBalances = () => apiRequest('/balances')
export const getSettlements = () => apiRequest('/settlements')
export const createSettlement = values => apiRequest('/settlements',{method:'POST',body:JSON.stringify(values)})
