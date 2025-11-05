/* Minimal API client with mock mode.
   Replace BASE_URL with your backend Flask URL when ready.
*/
const BASE_URL = localStorage.getItem('SEC_API_BASE') || 'http://localhost:5000';
const MOCK = new URLSearchParams(location.search).get('mock') === '1' || !navigator.onLine;

function toast(msg){ const t = document.getElementById('toast'); if(!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2200); }

function setSession(token, user){
  localStorage.setItem('SEC_TOKEN', token);
  localStorage.setItem('SEC_USER', JSON.stringify(user));
}
function getSession(){
  const token = localStorage.getItem('SEC_TOKEN');
  const user = JSON.parse(localStorage.getItem('SEC_USER') || '{}');
  return { token, user };
}
function clearSession(){
  localStorage.removeItem('SEC_TOKEN'); localStorage.removeItem('SEC_USER');
}

function enforceAuth(requiredGroup=null){
  const { token, user } = getSession();
  if(!token){ location.href = 'index.html'; return; }
  if(requiredGroup && user.group !== requiredGroup){ location.href = 'access-denied.html'; }
}

function logout(){ clearSession(); location.href='index.html'; }

async function api(path, options={}){
  if(MOCK) return mockApi(path, options);

  const { token } = getSession();
  const headers = Object.assign({ 'Content-Type':'application/json' }, options.headers || {});
  if(token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE_URL + path, Object.assign({}, options, { headers }));
  if(!res.ok) throw new Error('Request failed: ' + res.status);
  return res.json();
}

// Auth
async function login(username, password){
  if(MOCK){
    const group = username.toLowerCase().includes('admin') ? 'H' : 'R';
    const user = { username, group };
    setSession('mock-token', user); 
    return true;
  }
  const data = await api('/auth/login', {method:'POST', body: JSON.stringify({username, password})});
  setSession(data.token, data.user);
  return true;
}

async function register(username, password, group){
  if(MOCK){ toast('Mock: account created.'); return true; }
  await api('/auth/register', {method:'POST', body: JSON.stringify({username, password, group})});
  return true;
}

// Data
async function getDemoData(group){
  const data = await (MOCK ? mockData() : api('/records/demo'));
  return stripRestricted(data, group);
}

async function searchRecords(params, group){
  const qs = new URLSearchParams(params).toString();
  const data = await (MOCK ? mockData(params) : api('/records/search?' + qs));
  return stripRestricted(data, group);
}

async function addRecord(payload){
  if(MOCK){ toast('Mock: record accepted'); return true; }
  await api('/records', { method:'POST', body: JSON.stringify(payload) });
  return true;
}

function stripRestricted(rows, group){
  if(group === 'H') return rows;
  return rows.map(r => ({ ...r, first_name: '—', last_name: '—' }));
}

/* ---- MOCKS ---- */
async function mockApi(path, options){ 
  // For extensibility if you want more mocked endpoints later
  if(path.startsWith('/records')) return mockData();
  return { ok:true };
}

async function mockData(filters={}){
  const res = await fetch('sample-data.json');
  const all = await res.json();
  // basic client-side filtering for demo
  return all.filter(r => {
    const check = (cond) => cond === undefined || cond;
    return check(!filters.gender || Number(r.gender) === Number(filters.gender))
      && check(!filters.ageMin || r.age >= Number(filters.ageMin))
      && check(!filters.ageMax || r.age <= Number(filters.ageMax))
      && check(!filters.weightMin || r.weight >= Number(filters.weightMin))
      && check(!filters.weightMax || r.weight <= Number(filters.weightMax))
      && check(!filters.heightMin || r.height >= Number(filters.heightMin));
  }).slice(0, 100);
}
