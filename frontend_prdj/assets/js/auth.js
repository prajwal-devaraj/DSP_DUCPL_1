// Handles login & registration forms
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  try{
    await login(username, password);
    location.href = 'dashboard.html';
  }catch(err){ toast('Sign-in failed.'); console.error(err); }
});

document.getElementById('mockLogin')?.addEventListener('click', async () => {
  await login('admin_demo', 'password');
  location.href='dashboard.html?mock=1';
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm').value;
  const group    = document.getElementById('group').value;
  if(password !== confirm){ toast('Passwords do not match'); return; }
  try{
    await register(username, password, group);
    toast('Account created. Redirecting...');
    setTimeout(()=> location.href='index.html', 800);
  }catch(err){ toast('Register failed.'); console.error(err); }
});
