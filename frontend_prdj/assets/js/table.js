// Lightweight table renderer
function renderTable(target, rows, group){
  if(!rows || rows.length === 0){
    target.innerHTML = '<div class="muted">No results.</div>';
    return;
  }
  const cols = Object.keys(rows[0]);
  const html = [`<table><thead><tr>${cols.map(c=>`<th>${escapeHtml(header(c))}</th>`).join('')}</tr></thead><tbody>`,
    rows.map(r => `<tr>${cols.map(c => `<td>${format(c, r[c])}</td>`).join('')}</tr>`).join(''),
    '</tbody></table>'].join('');
  target.innerHTML = html;
}

function header(key){
  return key.replace(/_/g,' ').replace(/\b\w/g, m=> m.toUpperCase());
}
function format(key, val){
  if(key === 'gender'){ return `<span class="badge">${val ? 'Male' : 'Female'}</span>`; }
  if(typeof val === 'number'){ return String(val); }
  return escapeHtml(String(val ?? ''));
}

function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
