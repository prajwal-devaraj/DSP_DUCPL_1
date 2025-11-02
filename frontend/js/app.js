(function () {
  const API = () => (window.API_BASE || "http://localhost:5000");
  const getUser = () => JSON.parse(localStorage.getItem("user") || "null");
  const setUser = (u) => localStorage.setItem("user", JSON.stringify(u));
  const getToken = () => localStorage.getItem("token") || "";
  const setToken = (t) => localStorage.setItem("token", t);
  const clearAuth = () => { localStorage.removeItem("user"); localStorage.removeItem("token"); };

  document.querySelectorAll("#logout").forEach(btn => btn.addEventListener("click", () => { clearAuth(); location.href="login.html"; }));

  const loginForm = document.querySelector("#login-form");
  if (loginForm) loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(loginForm).entries());
    const res = await fetch(API()+"/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(fd)});
    const data = await res.json();
    if (data.ok) { setUser(data.user); setToken(data.token); location.href="dashboard.html"; } else alert("Invalid credentials");
  });

  const regForm = document.querySelector("#register-form");
  if (regForm) regForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(regForm).entries());
    const res = await fetch(API()+"/auth/register", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(fd)});
    const data = await res.json();
    if (data.ok) { alert("Registered! Please log in."); location.href="login.html"; } else alert(data.error || "Registration failed");
  });

  const user = getUser();
  const roleChip = document.querySelector("#role-chip > span");
  if (roleChip) {
    if (!user) { location.href="login.html"; return; }
    roleChip.textContent = user.role === "H" ? "Group H" : "Group R";
    document.querySelectorAll(".only-H").forEach(el => { if (user.role !== "H") el.style.display="none"; });
  }

  const insertForm = document.querySelector("#insert-form");
  if (insertForm) insertForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(insertForm).entries());
    const res = await fetch(API()+"/insert", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify(fd)});
    const data = await res.json();
    alert(data.ok ? "Inserted!" : "Insert failed");
    if (data.ok) insertForm.reset();
  });

  const qForm = document.querySelector("#query-form");
  const tbody = document.querySelector("#results-table tbody");
  const meta = document.querySelector("#query-meta");
  const mstatus = document.querySelector("#merkle-status");
  const nores = document.querySelector("#no-results");

  function render(rows, role) {
    tbody.innerHTML = "";
    if (!rows.length) { nores.classList.remove("hidden"); return; }
    nores.classList.add("hidden");
    rows.forEach(r => {
      const tr = document.createElement("tr");
      const first = role === "R" ? "—" : r.first;
      const last = role === "R" ? "—" : r.last;
      tr.innerHTML = `<td>${first}</td><td>${last}</td>
      <td>${r.gender_enc ? "•••" : (r.gender ?? "")}</td>
      <td>${r.age_enc ? "•••" : (r.age ?? "")}</td>
      <td>${r.weight}</td><td>${r.height}</td><td>${r.history}</td>
      <td><span class="badge ${r.hmac_ok ? "table-badge-ok" : "table-badge-bad"}">${r.hmac_ok ? "HMAC OK" : "HMAC FAIL"}</span></td>`;
      tbody.appendChild(tr);
    });
  }

  if (qForm) qForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(qForm).entries());
    const res = await fetch(API()+"/query", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify(fd)});
    const data = await res.json();
    render(data.rows || [], (getUser()||{}).role || "R");
    meta.classList.remove("hidden");
    mstatus.textContent = data.merkle_ok ? "OK" : "FAILED";
    mstatus.className = data.merkle_ok ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold";
  });

  const vh = document.querySelector("#verify-hmac");
  if (vh) vh.addEventListener("click", async () => {
    const payload = JSON.parse(document.querySelector("#hmac-input").value || "{}");
    const res = await fetch(API()+"/proof/hmac", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)});
    const out = document.querySelector("#hmac-result"); const ok = (await res.json()).ok;
    out.textContent = ok ? "HMAC verified ✔" : "HMAC invalid ✖";
    out.className = ok ? "text-emerald-600" : "text-rose-600";
  });

  const vm = document.querySelector("#verify-merkle");
  if (vm) vm.addEventListener("click", async () => {
    const payload = JSON.parse(document.querySelector("#merkle-input").value || "{}");
    const res = await fetch(API()+"/proof/merkle", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)});
    const out = document.querySelector("#merkle-result"); const ok = (await res.json()).ok;
    out.textContent = ok ? "Merkle proof valid ✔" : "Merkle proof invalid ✖";
    out.className = ok ? "text-emerald-600" : "text-rose-600";
  });
})();