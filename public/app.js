(function(){
"use strict";

/* ================================ CONSTANTS ================================ */

var EVENT_TYPES = ['Wedding','Birthday','Corporate Event','College Fest','Festival/Community','Sangeet','House Party','Other'];
var CHANNELS = ['Walk-In / Repeat / Referral','Instagram','Google Search','Wedding Listing Portal','Friends & Family','YouTube','Others'];
var INQUIRY_TYPES = ['New Client','Repeat Client','Referral'];
var LOCATIONS = ['Chennai - Central','Chennai - North','Chennai - South','Chennai - OMR/East','Chennai - West','Out of Station','Other'];
var PAY_METHODS = ['Cash','UPI','Bank Transfer','Card','Other'];
var RESOURCE_TYPES = [
  {key:'equipment', label:'Equipment'},
  {key:'transport', label:'Transport'},
  {key:'crew', label:'Crew'},
  {key:'other', label:'Other'}
];
var DEFAULT_ALLOC = {
  'Corporate Event': {equip:7500, transport:1500},
  'Wedding': {equip:6134, transport:1196},
  'Festival/Community': {equip:5568, transport:1129},
  'College Fest': {equip:4429, transport:886},
  'Birthday': {equip:4111, transport:956},
  'Sangeet': {equip:5000, transport:1000},
  'House Party': {equip:3500, transport:800},
  'Other': {equip:4000, transport:900}
};

/* ================================ UTIL ================================ */
function uid(prefix){ var base = Date.now().toString(36) + Math.random().toString(36).slice(2,8); return prefix ? (prefix+'-'+base) : base; }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function nowIso(){ return new Date().toISOString(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function fmtDate(d){ if(!d) return '—'; var dt=new Date(d+'T00:00:00'); if(isNaN(dt)) return d; return dt.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }
function fmtDateShort(d){ if(!d) return '—'; var dt=new Date(d+'T00:00:00'); if(isNaN(dt)) return d; return dt.toLocaleDateString('en-IN',{day:'numeric',month:'short'}); }
function fmtDateTime(iso){ if(!iso) return '—'; var dt=new Date(iso); return dt.toLocaleDateString('en-IN',{day:'numeric',month:'short'}) + ', ' + dt.toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}); }
function fmtMoney(n){ n = Number(n)||0; return '₹' + n.toLocaleString('en-IN',{maximumFractionDigits:0}); }
function initials(name){ if(!name) return '?'; var parts=name.trim().split(/\s+/); return (parts[0][0]+(parts[1]?parts[1][0]:'')).toUpperCase(); }
function clamp(n,a,b){ return Math.max(a,Math.min(b,n)); }
function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000); }

function toast(msg){
  var wrap = document.getElementById('toastWrap');
  var t = document.createElement('div'); t.className='toast'; t.textContent=msg;
  wrap.appendChild(t);
  setTimeout(function(){ t.style.transition='opacity .3s'; t.style.opacity='0'; setTimeout(function(){ t.remove(); },300); }, 2400);
}

function confirmModal(opts){
  // opts: {title, message, warn, okText, cancelText, danger, onOk}
  var back = document.getElementById('modalBack');
  var box = document.getElementById('modalBox');
  box.innerHTML =
    '<h3>'+esc(opts.title)+'</h3>' +
    (opts.warn ? '<div class="warnbox">'+esc(opts.warn)+'</div>' : '') +
    '<p>'+esc(opts.message||'')+'</p>' +
    '<div class="btnrow">' +
      '<button class="btn ghost" id="mCancel">'+esc(opts.cancelText||'Cancel')+'</button>' +
      '<button class="btn '+(opts.danger?'danger':'primary')+'" id="mOk">'+esc(opts.okText||'Confirm')+'</button>' +
    '</div>';
  back.hidden = false;
  document.getElementById('mCancel').onclick = function(){ back.hidden = true; if(opts.onCancel) opts.onCancel(); };
  document.getElementById('mOk').onclick = function(){ back.hidden = true; opts.onOk && opts.onOk(); };
}
function closeModal(){ document.getElementById('modalBack').hidden = true; }

/* ================================ SERVER API ================================ */
// All data lives on the server (Netlify Database), one private workspace per account.
// The app still edits an in-memory `DB` object exactly as before; saveData() syncs it up.
var DB = null; // in-memory mirror of the workspace being viewed
var ME = null; // signed-in account {id, username, email, role, status}
var IS_ADMIN = false;
var VIEW_USER = null; // admin only: {id, username} when viewing someone else's workspace
var LAST_USER_ID = null;
var DATA_VERSION = 0;
var SAVE_TIMER = null, SAVE_RETRY = null, SAVE_INFLIGHT = null, SAVE_DIRTY = false;
var FU_TIMER = null;

function api(method, path, body, opts){
  opts = opts || {};
  var init = {method:method, credentials:'same-origin', headers:{'Accept':'application/json'}};
  if(body !== undefined){ init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
  if(opts.keepalive) init.keepalive = true;
  function parse(res){
    return res.json().catch(function(){ return {}; }).then(function(j){ return {ok:res.ok, status:res.status, body:j||{}}; });
  }
  return fetch(path, init).then(function(res){
    // The session cookie is short-lived; refresh it once and retry before giving up.
    if(res.status===401 && !opts.retried && window.ReyAuth && path.indexOf("/api/auth/")!==0){
      return window.ReyAuth.refresh().then(function(ok){
        if(ok) return api(method, path, body, Object.assign({}, opts, {retried:true}));
        return parse(res);
      });
    }
    return parse(res);
  });
}

function workspaceUrl(){ return '/api/data' + (VIEW_USER ? ('?user='+encodeURIComponent(VIEW_USER.id)) : ''); }

function loadWorkspace(){
  return api('GET', workspaceUrl()).then(function(r){
    if(!r.ok) throw r;
    DATA_VERSION = r.body.version || 0;
    return r.body.data ? migrateData(r.body.data) : null;
  });
}

function setSyncError(msg){
  var el = document.getElementById('syncErr');
  if(!el) return;
  el.textContent = msg || '';
  el.hidden = !msg;
}

/* ================================ STORAGE ================================ */
function defaultData(){
  return {
    createdAt: nowIso(),
    inquiries: [], followups: [], bookings: [], resources: [],
    settings: {
      businessName: 'ReY Events Chennai', ownerName: '',
      equipmentTotalInvestment: 800000, equipmentCycleYears: 4, equipmentAlreadyRecovered: 0, equipmentAcquiredYear: 2015,
      transportTotalInvestment: 1100000, transportCycleYears: 7, transportAlreadyRecovered: 0, transportAcquiredYear: 2024,
      eventTypeAlloc: JSON.parse(JSON.stringify(DEFAULT_ALLOC)),
      notifPermAsked: false
    }
  };
}

function migrateData(d){
  d.inquiries = d.inquiries || []; d.followups = d.followups || []; d.bookings = d.bookings || []; d.resources = d.resources || [];
  d.settings = d.settings || {};
  var def = defaultData().settings;
  for(var k in def){ if(!(k in d.settings)) d.settings[k] = def[k]; }
  return d;
}

// Debounced: rapid edits are bundled into one save shortly after the last change.
function saveData(){
  if(!DB) return;
  SAVE_DIRTY = true;
  clearTimeout(SAVE_TIMER);
  SAVE_TIMER = setTimeout(flushSave, 500);
}
function scheduleRetry(){
  clearTimeout(SAVE_RETRY);
  SAVE_RETRY = setTimeout(function(){ if(SAVE_DIRTY) flushSave(); }, 5000);
}
function flushSave(){
  clearTimeout(SAVE_TIMER); SAVE_TIMER = null;
  if(SAVE_INFLIGHT) return SAVE_INFLIGHT.then(flushSave);
  if(!SAVE_DIRTY || !DB) return Promise.resolve(true);
  SAVE_DIRTY = false;
  var p = api('PUT', workspaceUrl(), {data: DB, version: DATA_VERSION}).then(function(r){
    SAVE_INFLIGHT = null;
    if(r.ok){ DATA_VERSION = r.body.version; setSyncError(''); return true; }
    if(r.status===409){
      // Saved elsewhere first (another device, or the admin) — switch to the newest copy.
      DB = migrateData(r.body.data || defaultData()); DATA_VERSION = r.body.version || 0;
      setSyncError(''); refreshAfterDataSwap();
      toast('This data was just updated elsewhere — showing the latest. Please redo your last change.');
      return true;
    }
    SAVE_DIRTY = true;
    if(r.status===401){ sessionExpired(); return false; }
    setSyncError('Not saved'+(r.body.error ? ': '+r.body.error : '')+' — retrying…'); scheduleRetry();
    return false;
  }, function(){
    SAVE_INFLIGHT = null; SAVE_DIRTY = true;
    setSyncError('Offline — changes not saved yet. Retrying…'); scheduleRetry();
    return false;
  });
  SAVE_INFLIGHT = p;
  return p;
}

// Accounts with an organisation name get "DJ Events - <org>"; older accounts keep the business name from Settings.
function renderHeaderTitle(){
  var who = VIEW_USER || ME;
  var org = who && who.orgName ? String(who.orgName).trim() : '';
  document.getElementById('topBusinessName').textContent = org ? ('DJ Events - '+org) : ((DB && DB.settings.businessName) || 'ReY Events');
}

function refreshAfterDataSwap(){
  if(!DB) return;
  renderHeaderTitle();
  if(!document.getElementById('sheetRoot').hidden) closeSheet();
  if(renderers[currentTab]) renderers[currentTab]();
  checkFollowupsDue(true);
}

function seedSampleData(){
  var d = defaultData();
  d.resources = [
    {id:uid('RES'), type:'equipment', name:'Setup 1', notes:'Full DJ + lighting rig', active:true, createdAt:nowIso(), sample:true},
    {id:uid('RES'), type:'equipment', name:'Setup 2', notes:'Full DJ + lighting rig', active:true, createdAt:nowIso(), sample:true},
    {id:uid('RES'), type:'equipment', name:'Setup 3', notes:'Full DJ + lighting rig', active:true, createdAt:nowIso(), sample:true},
    {id:uid('RES'), type:'transport', name:'Transport Vehicle 1', notes:'Tempo traveller', active:true, createdAt:nowIso(), sample:true},
    {id:uid('RES'), type:'crew', name:'Lead sound tech', notes:'', active:true, createdAt:nowIso(), sample:true},
    {id:uid('RES'), type:'crew', name:'Lighting assistant', notes:'', active:true, createdAt:nowIso(), sample:true}
  ];
  var today = new Date();
  function offset(days){ var t=new Date(today); t.setDate(t.getDate()+days); return t.toISOString().slice(0,10); }
  var sampleInq = [
    {name:'Priya Raman', eventType:'Wedding', channel:'Instagram', days:18, status:'open'},
    {name:'Karthik Studios (corp)', eventType:'Corporate Event', channel:'Google Search', days:4, status:'followup'},
    {name:'Divya & family', eventType:'Birthday', channel:'Friends & Family', days:-6, status:'converted'},
    {name:'Arun (college fest)', eventType:'College Fest', channel:'Walk-In / Repeat / Referral', days:30, status:'lost'}
  ];
  sampleInq.forEach(function(s){
    var id = uid('INQ');
    d.inquiries.push({
      id:id, createdAt:nowIso(), inquiryDate: offset(-3), name:s.name, phone:'98765 4'+Math.floor(1000+Math.random()*8999),
      altPhone:'', location:'Chennai - Central', eventType:s.eventType, channel:s.channel, inquiryType:'New Client',
      eventDate: offset(s.days), notes:'Sample inquiry — edit or delete freely.', status:s.status, sample:true
    });
    if(s.status==='followup'){
      d.followups.push({id:uid('FU'), inquiryId:id, dueAt: new Date(Date.now()+3*3600000).toISOString(), note:'Call back with quote', done:false, createdAt:nowIso(), sample:true});
    }
  });
  var convertedInq = d.inquiries.find(function(i){return i.status==='converted';});
  if(convertedInq){
    var alloc = DEFAULT_ALLOC[convertedInq.eventType] || DEFAULT_ALLOC.Other;
    d.bookings.push({
      id: uid('BK'), inquiryId: convertedInq.id, createdAt: nowIso(), bookingDate: offset(-5),
      eventDate: convertedInq.eventDate, eventType: convertedInq.eventType, name: convertedInq.name,
      phone: convertedInq.phone, altPhone:'', location: convertedInq.location, channel: convertedInq.channel,
      totalAmount: 9000, advanceAmount: 3000, advanceDate: offset(-5),
      payments:[{id:uid('PAY'), amount:3000, date:offset(-5), method:'UPI', note:'Advance'}],
      equipmentResourceId: d.resources[0].id, transportResourceId: null, extraResourceIds: [],
      status:'confirmed', calendarAdded:false, notes:'', sample:true
    });
  }
  return d;
}

/* ================================ AUTH ================================ */
function showAuth(){ document.getElementById('authScreen').hidden = false; document.body.classList.add('locked'); }
function hideAuth(){ document.getElementById('authScreen').hidden = true; document.body.classList.remove('locked'); }

function authMsg(opts){
  if(!opts || !opts.msg) return '';
  return '<div class="auth-msg '+(opts.tone||'info')+'">'+esc(opts.msg)+'</div>';
}
// Shows (or replaces) a message at the top of the auth card without wiping what was typed.
function authNotice(msg, tone){
  var card = document.getElementById('authCard'); if(!card) return;
  var el = card.querySelector('.auth-msg');
  if(!el){ el = document.createElement('div'); card.insertBefore(el, card.firstChild); }
  el.className = 'auth-msg '+(tone||'bad'); el.textContent = msg;
}
function authBusy(btn, busy, label){
  if(!btn) return;
  if(busy){ btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.textContent = label || 'Please wait…'; }
  else { btn.disabled = false; if(btn.dataset.label) btn.innerHTML = btn.dataset.label; }
}
function onEnter(ids, btnId){
  ids.forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); document.getElementById(btnId).click(); } });
  });
}
function val(id){ var el = document.getElementById(id); return el ? el.value : ''; }

// Copies a request to the Netlify Form "admin-requests" so the admin gets an email notification.
function notifyAdminForm(fields){
  var body = new URLSearchParams(Object.assign({'form-name':'admin-requests'}, fields)).toString();
  return fetch('/__forms.html', {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:body}).catch(function(){});
}

function renderAuthScreen(mode, opts){
  mode = mode || 'login';
  opts = opts || {};
  showAuth();
  var card = document.getElementById('authCard');
  var sub = document.getElementById('authSub');
  var hint = document.getElementById('authHint');
  hint.hidden = !(mode==='login' || mode==='signup');

  if(mode==='loading'){
    sub.textContent = opts.sub || 'Loading your workspace…';
    card.innerHTML = '<div class="empty" style="padding:18px 8px;"><p>'+esc(opts.msg || 'Just a moment…')+'</p></div>';
    return;
  }

  if(mode==='signup'){
    sub.textContent = 'Create your private account. Your email is used for password resets.';
    card.innerHTML = authMsg(opts) +
      '<div class="field"><label>Choose a username</label><input type="text" id="suUser" autocomplete="username" autocapitalize="none" placeholder="e.g. dj-rey"></div>' +
      '<div class="field"><label>Organisation name</label><input type="text" id="suOrg" autocomplete="organization" maxlength="60" placeholder="e.g. Chennai Beats"></div>' +
      '<div class="field"><label>Email</label><input type="email" id="suEmail" autocomplete="email" placeholder="you@example.com"></div>' +
      '<div class="field"><label>Choose a password</label><input type="password" id="suPass1" autocomplete="new-password" placeholder="At least 6 characters"></div>' +
      '<div class="field"><label>Confirm password</label><input type="password" id="suPass2" autocomplete="new-password" placeholder="Re-enter password"></div>' +
      '<button class="btn primary" id="suBtn">Create account</button>' +
      '<div class="auth-toggle" style="margin-top:12px;"><span>Already have an account?</span><button id="toLoginBtn" type="button">Sign in</button></div>';
    document.getElementById('toLoginBtn').onclick = function(){ renderAuthScreen('login'); };
    onEnter(['suPass2'], 'suBtn');
    document.getElementById('suBtn').onclick = function(){
      var btn = this;
      var u = val('suUser').trim(), o = val('suOrg').trim(), e = val('suEmail').trim(), p1 = val('suPass1'), p2 = val('suPass2');
      if(!u){ toast('Enter a username'); return; }
      if(!/^[a-z0-9][a-z0-9._-]{2,29}$/i.test(u)){ authNotice('Username must be 3–30 characters: letters, numbers, dot, dash or underscore (no spaces).'); return; }
      if(!o){ authNotice('Enter your organisation name.'); return; }
      if(!e || e.indexOf('@')<0){ toast('Enter your email address'); return; }
      if(p1.length<6){ toast('Password must be at least 6 characters'); return; }
      if(p1!==p2){ toast("Passwords don't match"); return; }
      authBusy(btn, true, 'Creating account…');
      api('POST', '/api/auth/signup', {username:u, orgName:o, email:e, password:p1}).then(function(r){
        authBusy(btn, false);
        if(!r.ok){ authNotice(r.body.error || ('Could not create the account (error '+r.status+')')); return; }
        if(r.body.needsApproval) notifyAdminForm({topic:'new-account', username:u.toLowerCase(), email:e, message:'New account for '+o+' is waiting for approval.'});
        if(r.body.needsConfirmation){
          renderAuthScreen('login', {tone:'ok', msg:'Almost there! We sent a confirmation link to '+e+'. Click it to verify your email'+(r.body.needsApproval ? ' — then the admin will approve your account.' : ', then sign in here.')});
          return;
        }
        checkSession();
      }).catch(function(){ authBusy(btn, false); toast('Could not reach the server'); });
    };
    return;
  }

  if(mode==='forgot'){
    sub.textContent = 'Forgot your password? Pick how you want to reset it — your inquiries, bookings and payments are not touched.';
    card.innerHTML = authMsg(opts) +
      '<div class="field"><label>Username or email</label><input type="text" id="fgId" autocomplete="username" autocapitalize="none" value="'+esc(opts.identifier||'')+'"></div>' +
      '<button class="btn primary" id="fgBtn">Email me a reset link</button>' +
      '<div class="hint" style="margin:8px 0 16px;">The link goes to the email address on your account and lets you choose a new password.</div>' +
      '<button class="auth-option" id="fgAdminBtn" type="button"><b>No access to that email?</b><span>Ask the admin to reset your password for you.</span></button>' +
      '<div class="auth-toggle"><button id="backToLoginBtn" type="button">Back to sign in</button></div>';
    document.getElementById('backToLoginBtn').onclick = function(){ renderAuthScreen('login'); };
    document.getElementById('fgAdminBtn').onclick = function(){ renderAuthScreen('contact', {identifier: val('fgId').trim()}); };
    onEnter(['fgId'], 'fgBtn');
    document.getElementById('fgBtn').onclick = function(){
      var btn = this, id = val('fgId').trim();
      if(!id){ toast('Enter your username or email'); return; }
      authBusy(btn, true, 'Sending…');
      api('POST', '/api/auth/recover', {identifier:id}).then(function(r){
        authBusy(btn, false);
        if(!r.ok){ toast(r.body.error || 'Could not send the email'); return; }
        renderAuthScreen('login', {tone:'ok', identifier:id, msg:'If an account matches, a password reset link is on its way to its email. Open it on this device to set a new password.'});
      }).catch(function(){ authBusy(btn, false); toast('Could not reach the server'); });
    };
    return;
  }

  if(mode==='contact'){
    var idv = opts.identifier || (ME ? ME.username : '');
    var isEmail = idv.indexOf('@')>-1;
    sub.textContent = 'Send a message to the admin. They can reset your password or approve your account.';
    card.innerHTML = authMsg(opts) +
      '<div class="field"><label>Your username</label><input type="text" id="caUser" autocapitalize="none" value="'+esc(isEmail?'':idv)+'"></div>' +
      '<div class="field"><label>Your email</label><input type="email" id="caEmail" value="'+esc(isEmail?idv:(ME?ME.email:''))+'"></div>' +
      '<div class="field"><label>Message</label><textarea id="caMsg">'+esc(opts.message || 'Please reset my password.')+'</textarea></div>' +
      '<button class="btn primary" id="caBtn">Send to admin</button>' +
      '<div class="auth-toggle"><button id="backToLoginBtn" type="button">'+(ME ? 'Back' : 'Back to sign in')+'</button></div>';
    document.getElementById('backToLoginBtn').onclick = function(){ if(ME) checkSession(); else renderAuthScreen('login'); };
    document.getElementById('caBtn').onclick = function(){
      var btn = this;
      var f = {topic: opts.topic || 'password', username: val('caUser').trim(), email: val('caEmail').trim(), message: val('caMsg').trim()};
      if(!f.username && !f.email){ toast('Enter your username or email'); return; }
      authBusy(btn, true, 'Sending…');
      api('POST', '/api/auth/help', f).then(function(r){
        authBusy(btn, false);
        if(!r.ok){ toast(r.body.error || 'Could not send'); return; }
        notifyAdminForm(f);
        if(ME) renderAuthScreen(ME.status==='disabled'?'disabled':'pending', {tone:'ok', msg:'Message sent to the admin.'});
        else renderAuthScreen('login', {tone:'ok', identifier:f.username||f.email, msg:'Sent! The admin will reset your password and let you know the new one.'});
      }).catch(function(){ authBusy(btn, false); toast('Could not reach the server'); });
    };
    return;
  }

  if(mode==='newpass'){
    sub.textContent = 'Choose a new password — your inquiries, bookings and payments are not touched, only the password changes.';
    card.innerHTML = authMsg(opts) +
      '<div class="field"><label>New password</label><input type="password" id="npPass1" autocomplete="new-password" placeholder="At least 6 characters"></div>' +
      '<div class="field"><label>Confirm new password</label><input type="password" id="npPass2" autocomplete="new-password" placeholder="Re-enter new password"></div>' +
      '<button class="btn primary" id="npBtn">Set new password</button>';
    onEnter(['npPass2'], 'npBtn');
    document.getElementById('npBtn').onclick = function(){
      var btn = this, p1 = val('npPass1'), p2 = val('npPass2');
      if(p1.length<6){ toast('Password must be at least 6 characters'); return; }
      if(p1!==p2){ toast("Passwords don't match"); return; }
      authBusy(btn, true, 'Saving…');
      window.ReyAuth.setPassword(p1).then(function(){
        window.ReyAuth.clearCallback();
        toast('Password reset — your data is safe.');
        checkSession();
      }).catch(function(e){
        authBusy(btn, false);
        renderAuthScreen('forgot', {tone:'bad', msg:'That reset link has expired. Request a new one below.'});
      });
    };
    return;
  }

  if(mode==='pending' || mode==='disabled'){
    var disabled = mode==='disabled';
    sub.textContent = disabled ? 'This account has been disabled.' : 'Thanks for signing up!';
    card.innerHTML = authMsg(opts) +
      '<div class="auth-msg '+(disabled?'bad':'warn')+'">'+
        (disabled
          ? 'The account <b>'+esc(ME.username)+'</b> has been disabled by the admin. Contact them if you think this is a mistake.'
          : 'Your account <b>'+esc(ME.username)+'</b> is waiting for the admin to approve it. You\'ll be able to start once it\'s approved.') +
      '</div>' +
      '<div class="btnrow" style="margin-bottom:10px;"><button class="btn ghost" id="pdCheck">Check again</button><button class="btn ghost" id="pdContact">Message admin</button></div>' +
      '<button class="btn danger" id="pdOut">Sign out</button>';
    document.getElementById('pdCheck').onclick = function(){ checkSession(); };
    document.getElementById('pdContact').onclick = function(){ renderAuthScreen('contact', {topic: disabled?'account':'approval', message: disabled ? 'Please re-enable my account.' : 'Please approve my account.'}); };
    document.getElementById('pdOut').onclick = function(){ signOut(); };
    return;
  }

  // login
  sub.textContent = opts.sub || 'Welcome back — sign in to continue.';
  card.innerHTML = authMsg(opts) +
    '<div class="field"><label>Username or email</label><input type="text" id="loginUser" autocomplete="username" autocapitalize="none" value="'+esc(opts.identifier||'')+'"></div>' +
    '<div class="field"><label>Password</label><input type="password" id="loginPass" autocomplete="current-password"></div>' +
    '<div id="loginErr" style="display:none;color:var(--bad);font-size:12.5px;font-weight:700;margin:-8px 0 14px;"></div>' +
    '<button class="btn primary" id="loginBtn">Sign in</button>' +
    '<div class="auth-toggle" style="margin-top:12px;"><button id="forgotBtn" type="button">Forgot password?</button><span>·</span><button id="signupBtn" type="button">Create account</button></div>';
  document.getElementById('loginPass').addEventListener('input', function(){
    document.getElementById('loginErr').style.display = 'none';
  });
  onEnter(['loginUser','loginPass'], 'loginBtn');
  document.getElementById('loginBtn').onclick = function(){
    var btn = this;
    var u = val('loginUser').trim(), p = val('loginPass');
    if(!u || !p){ toast('Enter your username and password'); return; }
    authBusy(btn, true, 'Signing in…');
    api('POST', '/api/auth/login', {identifier:u, password:p}).then(function(r){
      authBusy(btn, false);
      if(r.ok){ checkSession(); return; }
      var err = document.getElementById('loginErr');
      var msg = r.body.error || 'Incorrect username or password. Try again.';
      toast(msg);
      err.textContent = msg;
      err.style.display = 'block';
    }).catch(function(){ authBusy(btn, false); toast('Could not reach the server'); });
  };
  document.getElementById('forgotBtn').onclick = function(){ renderAuthScreen('forgot', {identifier: val('loginUser').trim()}); };
  document.getElementById('signupBtn').onclick = function(){ renderAuthScreen('signup'); };
}

// Asks the server who is signed in and routes to the app, the approval screen, or sign-in.
function checkSession(loginOpts){
  return api('GET', '/api/me').then(function(r){
    if(!r.ok || !r.body.profile){ ME = null; IS_ADMIN = false; renderAuthScreen('login', loginOpts); return; }
    ME = r.body.profile; IS_ADMIN = !!r.body.isAdmin;
    if(!IS_ADMIN && ME.status!=='active'){ renderAuthScreen(ME.status==='disabled' ? 'disabled' : 'pending'); return; }
    bootApp();
  }).catch(function(){
    renderAuthScreen('login', {tone:'bad', msg:'Could not reach the server. Check your connection and try again.'});
  });
}

function sessionExpired(){
  if(!document.getElementById('authScreen').hidden) return;
  renderAuthScreen('login', {tone:'warn', identifier: ME ? ME.username : '', msg:'Your session has ended. Sign in again to keep working — unsaved changes will be saved once you\'re back.'});
}

function signOut(){
  var done = function(){
    var p = window.ReyAuth ? window.ReyAuth.signOut() : Promise.resolve();
    p.then(function(){ return api('POST', '/api/auth/logout', {}); }).catch(function(){}).then(function(){ location.href = '/'; });
  };
  if(SAVE_DIRTY || SAVE_INFLIGHT) flushSave().then(done, done); else done();
}

function bootApp(){
  // Coming back after a session timeout with unsaved edits: keep them and push them up.
  var resume = DB && SAVE_DIRTY && LAST_USER_ID === ME.id;
  if(!resume) VIEW_USER = null;
  renderAuthScreen('loading');
  var p = resume ? flushSave().then(function(){ return DB; }) : loadWorkspace();
  p.then(function(data){
    var isNew = false;
    if(data) DB = data;
    else { DB = seedSampleData(); DB.settings.ownerName = ME.username; isNew = true; saveData(); }
    LAST_USER_ID = ME.id;
    hideAuth();
    renderHeaderTitle();
    updateClock();
    renderViewAs();
    nav('dashboard');
    checkFollowupsDue(true);
    if(!FU_TIMER) FU_TIMER = setInterval(function(){ if(DB) checkFollowupsDue(false); }, 60000);
    if(isNew) toast('Welcome! Sample data is loaded so you can explore — clear it anytime from More.');
  }).catch(function(err){
    if(err && err.status===401){ renderAuthScreen('login'); return; }
    if(err && err.status===403){ checkSession(); return; }
    renderAuthScreen('login', {tone:'bad', msg:'Could not load your data. Please try again.'});
  });
}

function updateClock(){
  var el = document.getElementById('topDate');
  el.textContent = new Date().toLocaleDateString('en-IN',{weekday:'long', day:'numeric', month:'long'});
}

/* ================================ ADMIN ================================ */
var ADMIN_USERS = [];

function renderViewAs(){
  var bar = document.getElementById('viewAsBar');
  if(VIEW_USER){
    bar.innerHTML = '<span>Viewing <b>'+esc(VIEW_USER.username)+'</b>\'s workspace — changes save to their account</span><button onclick="exitUserWorkspace()">Back to mine</button>';
    bar.hidden = false;
  } else { bar.hidden = true; bar.innerHTML = ''; }
}

function switchWorkspace(target){
  return flushSave().then(function(ok){
    if(!ok){ toast('Finish saving first — check your connection.'); return; }
    var prev = VIEW_USER;
    VIEW_USER = target;
    return loadWorkspace().then(function(data){
      DB = data || (target ? defaultData() : seedSampleData());
      SAVE_DIRTY = false;
      renderViewAs();
      closeSheet();
      renderHeaderTitle();
      nav('dashboard');
      checkFollowupsDue(true);
      toast(target ? ('Now viewing '+target.username+'\'s workspace') : 'Back to your workspace');
    }).catch(function(){ VIEW_USER = prev; toast('Could not open that workspace'); });
  });
}
function openUserWorkspace(id){
  var u = ADMIN_USERS.find(function(x){ return x.id===id; });
  if(!u) return;
  if(u.id===ME.id){ exitUserWorkspace(); return; }
  switchWorkspace({id:u.id, username:u.username, orgName:u.orgName||''});
}
function exitUserWorkspace(){ if(VIEW_USER) switchWorkspace(null); }

function loadAdminCounts(){
  if(!IS_ADMIN) return;
  api('GET', '/api/admin/users').then(function(r){
    if(!r.ok) return;
    ADMIN_USERS = r.body.users || [];
    var pending = ADMIN_USERS.filter(function(u){ return u.status==='pending'; }).length;
    var a = document.getElementById('admPendingCount'), b = document.getElementById('admReqCount');
    if(a) a.innerHTML = pending ? '<span class="badge pending">'+pending+' pending</span>' : '<span class="hint" style="margin:0">'+ADMIN_USERS.length+' users</span>';
    if(b) b.innerHTML = r.body.openRequests ? '<span class="badge open-req">'+r.body.openRequests+' open</span>' : '';
  });
}

function statusBadge(u){
  return (u.role==='admin' ? '<span class="badge admin">Admin</span> ' : '') +
    '<span class="badge '+esc(u.status)+'">'+esc(u.status==='active'?'Active':u.status==='pending'?'Pending':'Disabled')+'</span>';
}

function openAdminUsers(){
  openSheet('Users', '<div class="empty"><p>Loading users…</p></div>');
  api('GET', '/api/admin/users').then(function(r){
    if(!r.ok){ document.getElementById('sheetBody').innerHTML = '<div class="empty"><p>'+esc(r.body.error||'Could not load users')+'</p></div>'; return; }
    ADMIN_USERS = r.body.users || [];
    var groups = [
      {key:'pending', title:'Waiting for approval'},
      {key:'active', title:'Active'},
      {key:'disabled', title:'Disabled'}
    ];
    var html = '';
    groups.forEach(function(g){
      var list = ADMIN_USERS.filter(function(u){ return u.status===g.key; });
      if(!list.length) return;
      html += '<div class="section-title">'+esc(g.title)+' · '+list.length+'</div><div class="card" style="padding:4px 12px;">' +
        list.map(function(u){
          return '<div class="list-row" style="cursor:pointer" onclick="openAdminUser(\''+esc(u.id)+'\')">' +
            '<div class="avatar">'+esc(initials(u.username))+'</div>' +
            '<div class="row-main"><div class="row-title">'+esc(u.username)+(u.id===ME.id?' (you)':'')+'</div><div class="row-sub">'+esc(u.orgName ? u.orgName+' · '+u.email : u.email)+'</div></div>' +
            '<div class="row-end">'+statusBadge(u)+'<div class="row-sub num">'+u.inquiries+' inq · '+u.bookings+' bk</div></div>' +
          '</div>';
        }).join('') + '</div>';
    });
    document.getElementById('sheetBody').innerHTML = html || '<div class="empty"><p>No users yet.</p></div>';
  }).catch(function(){ document.getElementById('sheetBody').innerHTML = '<div class="empty"><p>Could not reach the server.</p></div>'; });
}

function openAdminUser(id){
  var u = ADMIN_USERS.find(function(x){ return x.id===id; });
  if(!u){ openAdminUsers(); return; }
  var self = u.id===ME.id;
  var actions = '';
  if(u.status==='pending') actions += '<button class="btn primary" style="margin-bottom:10px" onclick="adminUserAction(\''+esc(u.id)+'\',\'approve\')">Approve account</button>';
  if(u.status==='disabled') actions += '<button class="btn primary" style="margin-bottom:10px" onclick="adminUserAction(\''+esc(u.id)+'\',\'enable\')">Re-enable account</button>';
  actions += '<button class="btn ghost" style="margin-bottom:10px" onclick="openUserWorkspace(\''+esc(u.id)+'\')">'+(self?'Open my workspace':'Open workspace (view &amp; edit data)')+'</button>';
  var body =
    '<button class="btn ghost sm" style="margin-bottom:12px" onclick="openAdminUsers()">&lsaquo; All users</button>' +
    '<div class="card" style="margin-bottom:14px;">' +
      '<div style="display:flex;align-items:center;gap:11px;margin-bottom:8px;"><div class="avatar">'+esc(initials(u.username))+'</div><div class="row-main"><div class="row-title">'+esc(u.username)+'</div><div class="row-sub">'+esc(u.orgName ? u.orgName+' · '+u.email : u.email)+'</div></div></div>' +
      '<div class="kv"><span class="k">Status</span><span class="v">'+statusBadge(u)+'</span></div>' +
      '<div class="kv"><span class="k">Joined</span><span class="v">'+esc(fmtDateTime(u.createdAt))+'</span></div>' +
      '<div class="kv"><span class="k">Last active</span><span class="v">'+esc(u.lastSeenAt ? fmtDateTime(u.lastSeenAt) : '—')+'</span></div>' +
      '<div class="kv"><span class="k">Inquiries / bookings</span><span class="v num">'+u.inquiries+' / '+u.bookings+'</span></div>' +
      '<div class="kv"><span class="k">Data last saved</span><span class="v">'+esc(u.dataUpdatedAt ? fmtDateTime(u.dataUpdatedAt) : 'Never')+'</span></div>' +
    '</div>' +
    actions +
    '<div class="section-title">Reset password</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      '<div class="field" style="margin-bottom:10px;"><label>New password for '+esc(u.username)+'</label><input type="text" id="admNewPass" autocomplete="off" placeholder="At least 6 characters"></div>' +
      '<button class="btn ghost sm" style="width:100%" onclick="adminResetPassword(\''+esc(u.id)+'\')">Set new password</button>' +
      '<div class="hint">Share the new password with them privately. They can change it later from More &rarr; Account.</div>' +
    '</div>' +
    (self || u.role==='admin' ? '' :
      '<div class="section-title">Danger zone</div>' +
      '<div class="card">' +
        (u.status!=='disabled' ? '<div class="linkrow" onclick="adminUserAction(\''+esc(u.id)+'\',\'disable\')"><span>Disable account</span><svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' : '') +
        '<div class="linkrow" style="color:var(--bad)" onclick="adminDeleteUser(\''+esc(u.id)+'\')"><span>Delete account &amp; all data</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '</div>');
  openSheet(u.username, body);
}

function adminUserAction(id, action){
  api('POST', '/api/admin/users/'+encodeURIComponent(id), {action:action}).then(function(r){
    if(!r.ok){ toast(r.body.error || 'Could not update'); return; }
    var u = ADMIN_USERS.find(function(x){ return x.id===id; });
    if(u && r.body.user) Object.assign(u, r.body.user);
    toast(action==='approve' ? 'Account approved' : action==='disable' ? 'Account disabled' : 'Account re-enabled');
    openAdminUser(id);
    loadAdminCounts();
  });
}
function adminResetPassword(id){
  var p = val('admNewPass');
  if(p.length<6){ toast('Password must be at least 6 characters'); return; }
  api('POST', '/api/admin/users/'+encodeURIComponent(id), {action:'password', password:p}).then(function(r){
    if(!r.ok){ toast(r.body.error || 'Could not reset password'); return; }
    document.getElementById('admNewPass').value = '';
    toast('Password updated');
  });
}
function adminDeleteUser(id){
  var u = ADMIN_USERS.find(function(x){ return x.id===id; });
  if(!u) return;
  confirmModal({
    title:'Delete '+u.username+'?', warn:'This permanently deletes the account and ALL of its inquiries, bookings, payments and resources.',
    message:'This cannot be undone.', okText:'Delete account', danger:true,
    onOk:function(){
      api('DELETE', '/api/admin/users/'+encodeURIComponent(id)).then(function(r){
        if(!r.ok){ toast(r.body.error || 'Could not delete'); return; }
        toast('Account deleted');
        if(VIEW_USER && VIEW_USER.id===id){ VIEW_USER = null; DB = null; SAVE_DIRTY = false; bootApp(); return; }
        openAdminUsers(); loadAdminCounts();
      });
    }
  });
}

function openAdminRequests(){
  openSheet('Help & reset requests', '<div class="empty"><p>Loading…</p></div>');
  Promise.all([api('GET', '/api/admin/requests'), ADMIN_USERS.length ? null : api('GET', '/api/admin/users')]).then(function(res){
    var r = res[0];
    if(res[1] && res[1].ok) ADMIN_USERS = res[1].body.users || [];
    if(!r.ok){ document.getElementById('sheetBody').innerHTML = '<div class="empty"><p>'+esc(r.body.error||'Could not load requests')+'</p></div>'; return; }
    var list = r.body.requests || [];
    var topics = {password:'Password reset', approval:'Approval', account:'Account', 'new-account':'New account'};
    document.getElementById('sheetBody').innerHTML = list.length ? list.map(function(q){
      var who = q.matchedUsername || q.username || q.email;
      return '<div class="req-card">' +
        '<div style="display:flex;align-items:center;gap:8px;"><span class="badge '+(q.status==='open'?'open-req':'resolved')+'">'+(q.status==='open'?'Open':'Resolved')+'</span><b style="font-size:13.5px">'+esc(topics[q.topic]||q.topic)+'</b><span class="hint" style="margin:0 0 0 auto">'+esc(fmtDateTime(q.createdAt))+'</span></div>' +
        '<div class="row-sub" style="margin-top:6px">'+esc(who||'Unknown')+(q.email && q.email!==who ? ' · '+esc(q.email) : '')+(q.userId ? '' : ' · <i>no matching account</i>')+'</div>' +
        (q.message ? '<div class="req-msg">'+esc(q.message)+'</div>' : '<div style="height:8px"></div>') +
        '<div class="btnrow">' +
          (q.userId ? '<button class="btn ghost sm" onclick="openAdminUser(\''+esc(q.userId)+'\')">Open account</button>' : '') +
          '<button class="btn ghost sm" onclick="adminResolveRequest('+Number(q.id)+',\''+(q.status==='open'?'resolved':'open')+'\')">'+(q.status==='open'?'Mark resolved':'Reopen')+'</button>' +
        '</div></div>';
    }).join('') : '<div class="empty"><p>No requests yet. When someone asks for a password reset or approval, it shows up here.</p></div>';
  }).catch(function(){ document.getElementById('sheetBody').innerHTML = '<div class="empty"><p>Could not reach the server.</p></div>'; });
}
function adminResolveRequest(id, status){
  api('POST', '/api/admin/requests/'+id, {status:status}).then(function(r){
    if(!r.ok){ toast(r.body.error || 'Could not update'); return; }
    openAdminRequests(); loadAdminCounts();
  });
}

function openChangePassword(){
  openSheet('Change password',
    '<div class="field"><label>Current password</label><input type="password" id="cpCur" autocomplete="current-password"></div>' +
    '<div class="field"><label>New password</label><input type="password" id="cpNew1" autocomplete="new-password" placeholder="At least 6 characters"></div>' +
    '<div class="field"><label>Confirm new password</label><input type="password" id="cpNew2" autocomplete="new-password"></div>',
    '<button class="btn primary" id="cpBtn">Update password</button>');
  document.getElementById('cpBtn').onclick = function(){
    var btn = this, cur = val('cpCur'), n1 = val('cpNew1'), n2 = val('cpNew2');
    if(!cur){ toast('Enter your current password'); return; }
    if(n1.length<6){ toast('Password must be at least 6 characters'); return; }
    if(n1!==n2){ toast("Passwords don't match"); return; }
    authBusy(btn, true, 'Saving…');
    api('POST', '/api/account/password', {currentPassword:cur, newPassword:n1}).then(function(r){
      authBusy(btn, false);
      if(!r.ok){ toast(r.body.error || 'Could not change password'); return; }
      closeSheet(); toast('Password updated');
    }).catch(function(){ authBusy(btn, false); toast('Could not reach the server'); });
  };
}

/* ================================ NAV ================================ */
var currentTab = 'dashboard';
var renderers = {}; // tab -> render fn

function nav(tab){
  currentTab = tab;
  document.querySelectorAll('.view').forEach(function(v){ v.hidden = true; });
  document.getElementById('view-'+tab).hidden = false;
  document.querySelectorAll('.tab').forEach(function(t){ t.classList.toggle('active', t.dataset.tab===tab); });
  document.getElementById('fabBtn').style.display = (tab==='resources') ? 'none' : 'flex';
  if(renderers[tab]) renderers[tab]();
}

function openSheet(title, bodyHtml, footHtml){
  document.getElementById('sheetTitle').textContent = title;
  document.getElementById('sheetBody').innerHTML = bodyHtml;
  var foot = document.getElementById('sheetFoot');
  if(footHtml){ foot.innerHTML = footHtml; foot.hidden = false; } else { foot.hidden = true; foot.innerHTML=''; }
  document.getElementById('sheetHeadExtra').innerHTML = '';
  document.getElementById('sheetRoot').hidden = false;
}
function closeSheet(){ document.getElementById('sheetRoot').hidden = true; }
function setSheetHeadExtra(html){ document.getElementById('sheetHeadExtra').innerHTML = html; }

/* ================================ CHIP HELPER ================================ */
function chips(id, options, selected, multi){
  var html = '<div class="chipwrap" id="'+id+'">';
  options.forEach(function(o){
    var sel = multi ? (selected||[]).indexOf(o)>-1 : selected===o;
    html += '<button type="button" class="chip'+(sel?' sel':'')+'" data-val="'+esc(o)+'">'+esc(o)+'</button>';
  });
  html += '</div>';
  return html;
}
function wireChips(id, multi, onChange){
  var wrap = document.getElementById(id);
  wrap.querySelectorAll('.chip').forEach(function(btn){
    btn.onclick = function(){
      if(multi){
        btn.classList.toggle('sel');
      } else {
        var wasSel = btn.classList.contains('sel');
        wrap.querySelectorAll('.chip').forEach(function(b){b.classList.remove('sel');});
        if(!wasSel) btn.classList.add('sel');
      }
      onChange(getChipValue(id, multi));
    };
  });
}
function getChipValue(id, multi){
  var wrap = document.getElementById(id);
  var sel = Array.prototype.slice.call(wrap.querySelectorAll('.chip.sel')).map(function(b){return b.dataset.val;});
  return multi ? sel : (sel[0]||'');
}

/* ---- "type your own" fallback for a single-select chip group: when the chip picked is one of
   triggerValues (e.g. "Other", "Others", "Out of Station"), reveal a free-text box under the
   chips, and the effective value becomes "<label>: <typed text>" so it's still filterable/
   recognizable as that category. ---- */
function otherBox(inputId, placeholder, visible){
  return '<div class="field" id="'+inputId+'_wrap" style="margin:10px 0 0;'+(visible?'':'display:none;')+'">' +
    '<input type="text" id="'+inputId+'" placeholder="'+esc(placeholder)+'" value="">' +
  '</div>';
}
function wireOtherBox(chipId, inputId, triggerValues){
  var wrap = document.getElementById(chipId);
  var box = document.getElementById(inputId+'_wrap');
  function sync(){
    var val = getChipValue(chipId, false);
    box.style.display = (triggerValues.indexOf(val) > -1) ? '' : 'none';
  }
  wrap.querySelectorAll('.chip').forEach(function(btn){ btn.addEventListener('click', sync); });
  sync();
}
function chipValueWithOther(chipId, inputId, triggerValues){
  var val = getChipValue(chipId, false);
  if(triggerValues.indexOf(val) > -1){
    var el = document.getElementById(inputId);
    var custom = el ? el.value.trim() : '';
    return custom ? (val+': '+custom) : val;
  }
  return val;
}

/* ================================ CONFLICT CHECK ================================ */
function findConflictingBooking(eventDate, excludeId){
  return DB.bookings.find(function(b){
    return b.eventDate === eventDate && b.status !== 'cancelled' && b.id !== excludeId;
  });
}

/* ================================ DASHBOARD ================================ */
function computeHealth(){
  var s = DB.settings;
  var now = new Date();
  var y1start = new Date(now); y1start.setFullYear(y1start.getFullYear()-1);
  var y2start = new Date(now); y2start.setFullYear(y2start.getFullYear()-2);
  function revInRange(from,to){
    return DB.bookings.filter(function(b){ return b.status!=='cancelled' && b.eventDate>=from.toISOString().slice(0,10) && b.eventDate<to.toISOString().slice(0,10); })
      .reduce(function(sum,b){return sum+(Number(b.totalAmount)||0);},0);
  }
  var thisYearRev = revInRange(y1start, now);
  var lastYearRev = revInRange(y2start, y1start);
  var revScore;
  if(lastYearRev<=0){ revScore = thisYearRev>0 ? 22 : 15; }
  else { var growth = (thisYearRev-lastYearRev)/lastYearRev; revScore = clamp(15+growth*30,0,30); }

  var totalLeads = DB.inquiries.length;
  var converted = DB.inquiries.filter(function(i){return i.status==='converted';}).length;
  var convRate = totalLeads>0 ? converted/totalLeads : 0;
  var convScore = clamp((convRate/0.30)*20,0,20);

  var activeBookings = DB.bookings.filter(function(b){return b.status!=='cancelled';});
  var totalDue = activeBookings.reduce(function(s2,b){return s2+(Number(b.totalAmount)||0);},0);
  var totalCollected = activeBookings.reduce(function(s2,b){return s2+paidSoFar(b);},0);
  var payRate = totalDue>0 ? totalCollected/totalDue : 1;
  var payScore = clamp(payRate,0,1)*20;

  var equipPace = paybackPace('equipment');
  var transPace = paybackPace('transport');
  var equipScore = clamp(equipPace,0,1)*15;
  var transScore = clamp(transPace,0,1)*15;

  var total = Math.round(revScore+convScore+payScore+equipScore+transScore);
  return {
    total: clamp(total,0,100),
    parts: [
      {label:'Revenue trend (yr/yr)', score:Math.round(revScore), max:30},
      {label:'Inquiry → booking rate', score:Math.round(convScore), max:20},
      {label:'Payment collection', score:Math.round(payScore), max:20},
      {label:'Equipment payback pace', score:Math.round(equipScore), max:15},
      {label:'Transport payback pace', score:Math.round(transScore), max:15}
    ],
    convRate: convRate, payRate: payRate
  };
}

function recoveredSoFar(kind){
  var s = DB.settings;
  var already = Number(kind==='equipment'? s.equipmentAlreadyRecovered : s.transportAlreadyRecovered)||0;
  var fromBookings = DB.bookings.filter(function(b){return b.status!=='cancelled';}).reduce(function(sum,b){
    var alloc = s.eventTypeAlloc[b.eventType] || DEFAULT_ALLOC.Other;
    return sum + (kind==='equipment'? (Number(alloc.equip)||0) : (Number(alloc.transport)||0));
  },0);
  return already + fromBookings;
}
function paybackPace(kind){
  var s = DB.settings;
  var total = Number(kind==='equipment'? s.equipmentTotalInvestment : s.transportTotalInvestment)||1;
  var cycle = Number(kind==='equipment'? s.equipmentCycleYears : s.transportCycleYears)||1;
  // Pace is measured against the real clock the asset ages on — years since it was actually
  // bought — not years since this app was set up. Using the app's own setup date here was the
  // bug that made the payback bar show ~150% after a single booking: "required so far" collapsed
  // to almost nothing because almost no time had passed since the account was created.
  var acquiredYear = Number(kind==='equipment'? s.equipmentAcquiredYear : s.transportAcquiredYear) || new Date().getFullYear();
  var acquired = new Date(acquiredYear, 0, 1);
  var yearsElapsed = Math.max((Date.now()-acquired.getTime())/(365.25*86400000), 1/365);
  var requiredAnnual = total/cycle;
  var requiredToDate = requiredAnnual*yearsElapsed;
  var recovered = recoveredSoFar(kind);
  return requiredToDate>0 ? recovered/requiredToDate : 0;
}
function paidSoFar(b){
  // The advance is always also recorded as its own entry in b.payments (see openConvertForm /
  // seedSampleData), so adding b.advanceAmount on top of the payments total here used to
  // double-count it. paidSoFarAll already sums the payments list correctly — use that.
  return paidSoFarAll(b);
}
function balanceDue(b){ return Math.max((Number(b.totalAmount)||0) - paidSoFarAll(b), 0); }
function paidSoFarAll(b){
  return (b.payments||[]).reduce(function(s,p){return s+(Number(p.amount)||0);},0);
}

function healthColor(v){ return v>=80? getCss('--good') : v>=60? getCss('--primary') : v>=40? getCss('--warn') : getCss('--bad'); }
function getCss(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function healthLabel(v){ return v>=80?'Excellent': v>=60?'Good': v>=40?'Fair':'Needs attention'; }

function drawRing(svgEl, pct, size, stroke, color){
  var r = (size-stroke)/2, c = 2*Math.PI*r, off = c*(1-pct/100);
  svgEl.setAttribute('viewBox','0 0 '+size+' '+size);
  svgEl.innerHTML =
    '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+getCss('--surface3')+'" stroke-width="'+stroke+'"/>' +
    '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="'+stroke+'" stroke-linecap="round" ' +
      'stroke-dasharray="'+c+'" stroke-dashoffset="'+off+'" transform="rotate(-90 '+size/2+' '+size/2+')"/>';
}

function renderDashboard(){
  var el = document.getElementById('view-dashboard');
  var health = computeHealth();
  var openInq = DB.inquiries.filter(function(i){return i.status==='open'||i.status==='followup';}).length;
  var totalBookings = DB.bookings.filter(function(b){return b.status!=='cancelled';}).length;
  var totalRevenue = DB.bookings.filter(function(b){return b.status!=='cancelled';}).reduce(function(s,b){return s+(Number(b.totalAmount)||0);},0);
  var totalEvents = DB.bookings.filter(function(b){return b.status==='completed';}).length;
  var convRate = health.convRate*100;
  var avgBooking = totalBookings>0 ? totalRevenue/totalBookings : 0;
  var pendingBookings = DB.bookings.filter(function(b){return b.status!=='cancelled' && balanceDue(b)>0;});
  var pendingTotal = pendingBookings.reduce(function(s,b){return s+balanceDue(b);},0);
  var equipPace = clamp(paybackPace('equipment'),0,1.5)*100;
  var transPace = clamp(paybackPace('transport'),0,1.5)*100;

  var dueList = getDueFollowups();

  el.innerHTML =
    (dueList.length ? (
      '<div class="card" style="margin-bottom:14px; border-color:var(--warn);">' +
        '<div class="section-title" style="margin-top:0;color:var(--warn)">Follow-ups due</div>' +
        dueList.slice(0,4).map(function(f){
          var inq = DB.inquiries.find(function(i){return i.id===f.inquiryId;});
          return '<div class="linkrow" onclick="openInquiryDetail(\''+f.inquiryId+'\')">' +
            '<span>'+esc(inq?inq.name:'Unknown')+' — '+esc(f.note||'Follow up')+'</span>' +
            '<span style="color:var(--warn);font-weight:700;font-size:12px;">'+fmtDateTime(f.dueAt)+'</span></div>';
        }).join('') +
      '</div>'
    ) : '') +
    '<div class="card" style="margin-bottom:14px;">' +
      '<div class="gauge-wrap">' +
        '<svg class="gauge" id="dashGauge" width="76" height="76"></svg>' +
        '<div class="gauge-label"><b id="dashHealthLbl"></b><br>Business health score — combines revenue trend, conversion, payment collection and equipment/transport payback pace.</div>' +
      '</div>' +
    '</div>' +
    '<div class="section-title">Overview</div>' +
    '<div class="tiles">' +
      tile('Total events', totalEvents, 'completed bookings', 'events') +
      tile('Open inquiries', openInq, 'awaiting follow-up', 'openInquiries') +
      tile('Active bookings', totalBookings, 'confirmed + completed', 'activeBookings') +
      tile('Revenue so far', fmtMoney(totalRevenue), 'all active bookings', 'revenue') +
      tile('Inquiry → booking', convRate.toFixed(0)+'%', 'conversion rate', 'conversion') +
      tile('Avg. booking value', fmtMoney(avgBooking), 'revenue per booking', 'avgBooking') +
    '</div>' +
    '<div class="section-title">Capital payback</div>' +
    '<div class="card" style="margin-bottom:10px;">' +
      paybackRow('Equipment', equipPace, DB.settings.equipmentTotalInvestment, 'equipmentPayback') +
      '<div style="height:12px"></div>' +
      paybackRow('Transport', transPace, DB.settings.transportTotalInvestment, 'transportPayback') +
    '</div>' +
    (pendingBookings.length ? (
      '<div class="section-title">Pending payments</div>' +
      '<div class="card">' +
        '<div class="kv"><span class="k">'+pendingBookings.length+' booking(s) with balance due</span><span class="v" style="color:var(--warn)">'+fmtMoney(pendingTotal)+'</span></div>' +
        '<button class="btn ghost sm" style="margin-top:10px;width:100%" onclick="nav(\'bookings\');setBookingFilter(\'pending\')">View pending bookings</button>' +
      '</div>'
    ) : '');

  drawRing(document.getElementById('dashGauge'), health.total, 76, 8, healthColor(health.total));
  document.getElementById('dashHealthLbl').textContent = health.total + '/100 · ' + healthLabel(health.total);
  drawRing(document.getElementById('healthRingMini'), health.total, 22, 3, healthColor(health.total));
  document.getElementById('healthValMini').textContent = health.total;
  document.getElementById('healthValMini').style.color = healthColor(health.total);
}
function tile(label, val, sub, kind){
  var click = kind ? ' onclick="openTileDetail(\''+kind+'\')" style="cursor:pointer;"' : '';
  return '<div class="tile"'+click+'><div class="tlabel">'+esc(label)+'</div><div class="tval num">'+val+'</div><div class="tsub">'+esc(sub)+'</div></div>';
}
function paybackRow(label, pct, total, kind){
  var barPct = clamp(pct,0,100);
  var color = pct>=100 ? getCss('--good') : pct>=60 ? getCss('--primary') : getCss('--warn');
  var click = kind ? ' onclick="openTileDetail(\''+kind+'\')" style="cursor:pointer;"' : '';
  return '<div'+click+'><div style="display:flex;justify-content:space-between;font-size:13px;"><span style="font-weight:700">'+label+'</span>' +
    '<span class="num" style="font-weight:700;color:'+color+'">'+pct.toFixed(0)+'% of '+fmtMoney(total)+'</span></div>' +
    '<div class="segbar"><i style="width:'+barPct+'%;background:'+color+'"></i></div></div>';
}
renderers.dashboard = renderDashboard;

/* ---- Dashboard tile drill-down: tabular detail behind each stat ---- */
function byEventDateDesc(a,b){ return new Date(b.eventDate)-new Date(a.eventDate); }
function bookingsTableHtml(list){
  if(!list.length) return emptyState('Nothing here yet','');
  var rows = list.map(function(b){
    return '<tr onclick="openBookingDetail(\''+b.id+'\')">' +
      '<td>'+fmtDateShort(b.eventDate)+'</td>' +
      '<td>'+esc(b.name)+'</td>' +
      '<td>'+esc(b.eventType)+'</td>' +
      '<td class="num">'+fmtMoney(b.totalAmount)+'</td>' +
      '<td class="num">'+fmtMoney(balanceDue(b))+'</td>' +
      '<td><span class="badge '+b.status+'">'+b.status+'</span></td>' +
    '</tr>';
  }).join('');
  var total = list.reduce(function(s,b){return s+(Number(b.totalAmount)||0);},0);
  var avg = list.length ? total/list.length : 0;
  return '<div style="overflow-x:auto;"><table class="dtable"><thead><tr>' +
    '<th>Date</th><th>Client</th><th>Event Type</th><th class="num">Amount</th><th class="num">Balance Due</th><th>Status</th>' +
    '</tr></thead><tbody>'+rows+'</tbody>' +
    '<tfoot><tr><td colspan="6">'+list.length+' booking(s) &middot; Total '+fmtMoney(total)+' &middot; Avg '+fmtMoney(avg)+'</td></tr></tfoot>' +
    '</table></div>';
}
function inquiriesTableHtml(list){
  if(!list.length) return emptyState('Nothing here yet','');
  var rows = list.map(function(i){
    return '<tr onclick="openInquiryDetail(\''+i.id+'\')">' +
      '<td>'+fmtDateShort(i.eventDate)+'</td>' +
      '<td>'+esc(i.name)+'</td>' +
      '<td>'+esc(i.eventType)+'</td>' +
      '<td>'+esc(i.channel||'—')+'</td>' +
      '<td><span class="badge '+i.status+'">'+i.status+'</span></td>' +
    '</tr>';
  }).join('');
  return '<div style="overflow-x:auto;"><table class="dtable"><thead><tr>' +
    '<th>Event Date</th><th>Client</th><th>Event Type</th><th>Channel</th><th>Status</th>' +
    '</tr></thead><tbody>'+rows+'</tbody>' +
    '<tfoot><tr><td colspan="5">'+list.length+' inquiry(ies)</td></tr></tfoot>' +
    '</table></div>';
}
function conversionTableHtml(){
  var total = DB.inquiries.length;
  var statuses = ['open','followup','converted','lost'];
  var rows = statuses.map(function(st){
    var count = DB.inquiries.filter(function(i){return i.status===st;}).length;
    var pct = total ? (count/total*100) : 0;
    return '<tr><td><span class="badge '+st+'">'+st+'</span></td><td class="num">'+count+'</td><td class="num">'+pct.toFixed(1)+'%</td></tr>';
  }).join('');
  var converted = DB.inquiries.filter(function(i){return i.status==='converted';}).length;
  return '<div style="overflow-x:auto;"><table class="dtable"><thead><tr><th>Status</th><th class="num">Count</th><th class="num">% of total</th></tr></thead>' +
    '<tbody>'+rows+'</tbody>' +
    '<tfoot><tr><td colspan="3">'+total+' total inquiries &middot; '+converted+' converted to bookings</td></tr></tfoot></table></div>';
}
function paybackTableHtml(kind){
  var s = DB.settings;
  var list = DB.bookings.filter(function(b){return b.status!=='cancelled';}).slice().sort(byEventDateDesc);
  var label = kind==='equipment' ? 'Equipment' : 'Transport';
  if(!list.length) return emptyState('No bookings yet', 'Recovery builds up as you add bookings.');
  var rows = list.map(function(b){
    var alloc = s.eventTypeAlloc[b.eventType] || DEFAULT_ALLOC.Other;
    var amt = kind==='equipment' ? (Number(alloc.equip)||0) : (Number(alloc.transport)||0);
    return '<tr onclick="openBookingDetail(\''+b.id+'\')">' +
      '<td>'+fmtDateShort(b.eventDate)+'</td>' +
      '<td>'+esc(b.name)+'</td>' +
      '<td>'+esc(b.eventType)+'</td>' +
      '<td class="num">'+fmtMoney(amt)+'</td>' +
    '</tr>';
  }).join('');
  var fromBookings = list.reduce(function(sum,b){
    var alloc = s.eventTypeAlloc[b.eventType] || DEFAULT_ALLOC.Other;
    return sum + (kind==='equipment' ? (Number(alloc.equip)||0) : (Number(alloc.transport)||0));
  },0);
  var already = Number(kind==='equipment' ? s.equipmentAlreadyRecovered : s.transportAlreadyRecovered)||0;
  return '<div class="hint" style="margin-bottom:10px;">Each booking contributes the '+label.toLowerCase()+' cost allocated to its event type (set in More &rarr; Settings). The amount already recovered before this app ('+fmtMoney(already)+') is added on top and is not tied to a specific booking.</div>' +
    '<div style="overflow-x:auto;"><table class="dtable"><thead><tr><th>Event Date</th><th>Client</th><th>Event Type</th><th class="num">'+label+' Allocation</th></tr></thead>' +
    '<tbody>'+rows+'</tbody>' +
    '<tfoot><tr><td colspan="4">From bookings: '+fmtMoney(fromBookings)+' + already recovered: '+fmtMoney(already)+' = '+fmtMoney(fromBookings+already)+' total</td></tr></tfoot></table></div>';
}
function openTileDetail(kind){
  var activeBookings = DB.bookings.filter(function(b){return b.status!=='cancelled';}).slice().sort(byEventDateDesc);
  var title, html;
  if(kind==='events'){
    var completed = DB.bookings.filter(function(b){return b.status==='completed';}).slice().sort(byEventDateDesc);
    title = 'Completed Events'; html = bookingsTableHtml(completed);
  } else if(kind==='openInquiries'){
    var openInqs = DB.inquiries.filter(function(i){return i.status==='open'||i.status==='followup';})
      .slice().sort(function(a,b){return new Date(a.eventDate)-new Date(b.eventDate);});
    title = 'Open Inquiries'; html = inquiriesTableHtml(openInqs);
  } else if(kind==='activeBookings'){
    title = 'Active Bookings'; html = bookingsTableHtml(activeBookings);
  } else if(kind==='revenue'){
    title = 'Revenue — Active Bookings'; html = bookingsTableHtml(activeBookings);
  } else if(kind==='avgBooking'){
    title = 'Booking Values'; html = bookingsTableHtml(activeBookings);
  } else if(kind==='conversion'){
    title = 'Inquiry → Booking Breakdown'; html = conversionTableHtml();
  } else if(kind==='equipmentPayback'){
    title = 'Equipment Payback Detail'; html = paybackTableHtml('equipment');
  } else if(kind==='transportPayback'){
    title = 'Transport Payback Detail'; html = paybackTableHtml('transport');
  } else { return; }
  openSheet(title, html);
}

/* ================================ FOLLOW-UP DUE CHECK ================================ */
function getDueFollowups(){
  var now = Date.now();
  return DB.followups.filter(function(f){ return !f.done && new Date(f.dueAt).getTime() <= now; })
    .sort(function(a,b){return new Date(a.dueAt)-new Date(b.dueAt);});
}
var notifiedIds = {};
function checkFollowupsDue(silent){
  if(!DB) return;
  var due = getDueFollowups();
  var dot = document.getElementById('inqDot');
  dot.hidden = due.length===0;
  if(currentTab==='dashboard') renderDashboard();
  if(!silent && due.length){
    if('Notification' in window && Notification.permission==='granted'){
      due.forEach(function(f){
        if(notifiedIds[f.id]) return;
        notifiedIds[f.id]=true;
        try{
          var inq = DB.inquiries.find(function(i){return i.id===f.inquiryId;});
          new Notification('Follow-up due: '+(inq?inq.name:'Inquiry'), {body: f.note||'Tap to open ReY Events Manager'});
        }catch(e){}
      });
    }
  }
}

/* ================================ INQUIRIES ================================ */
var inquiryFilter = 'active';
var INQ_FILTER_LABELS = {active:'Active', duefollowups:'Follow-ups', open:'Open', followup:'Followup', converted:'Converted', lost:'Lost', all:'All'};
function renderInquiries(){
  var el = document.getElementById('view-inquiries');
  var chipsHtml = '<div class="chipwrap" id="inqFilterChips" style="margin-bottom:14px;">' +
      ['active','duefollowups','open','followup','converted','lost','all'].map(function(f){
        return '<button class="chip'+(inquiryFilter===f?' sel':'')+'" data-f="'+f+'">'+esc(INQ_FILTER_LABELS[f]||f)+'</button>';
      }).join('') +
    '</div>';

  if(inquiryFilter==='duefollowups'){
    el.innerHTML =
      '<h2 class="disp" style="margin:2px 0 12px;">Inquiries</h2>' + chipsHtml +
      '<div class="hint" style="margin-bottom:10px;">Everything you still need to follow up on, soonest first.</div>' +
      '<div class="card" style="padding:6px 10px;">' + renderFollowupTaskRows() + '</div>';
  } else {
    var list = DB.inquiries.slice().sort(function(a,b){ return new Date(b.createdAt)-new Date(a.createdAt); });
    if(inquiryFilter==='active') list = list.filter(function(i){return i.status==='open'||i.status==='followup';});
    else if(inquiryFilter!=='all') list = list.filter(function(i){return i.status===inquiryFilter;});

    el.innerHTML =
      '<h2 class="disp" style="margin:2px 0 12px;">Inquiries</h2>' + chipsHtml +
      '<div class="card" style="padding:6px 10px;">' +
        (list.length ? list.map(inquiryRow).join('') : emptyState('No inquiries here', 'Tap the + button to log a new inquiry.')) +
      '</div>';
  }

  el.querySelectorAll('#inqFilterChips .chip').forEach(function(btn){
    btn.onclick = function(){ inquiryFilter = btn.dataset.f; renderInquiries(); };
  });
}
function renderFollowupTaskRows(){
  var due = DB.followups.filter(function(f){return !f.done;}).sort(function(a,b){return new Date(a.dueAt)-new Date(b.dueAt);});
  if(!due.length) return emptyState('No follow-ups pending', 'Set a reminder from an inquiry, or when creating a new one.');
  return due.map(function(f){
    var inq = DB.inquiries.find(function(x){return x.id===f.inquiryId;});
    var overdue = new Date(f.dueAt).getTime() <= Date.now();
    return '<div class="list-row">' +
      '<div class="avatar" style="cursor:pointer;" onclick="openInquiryDetail(\''+f.inquiryId+'\')">'+initials(inq?inq.name:'?')+'</div>' +
      '<div class="row-main" style="cursor:pointer;" onclick="openInquiryDetail(\''+f.inquiryId+'\')">' +
        '<div class="row-title">'+esc(inq?inq.name:'Unknown')+'</div>' +
        '<div class="row-sub">'+esc(f.note||'Follow up')+' · <span style="color:'+(overdue?'var(--bad)':'var(--ink-dim)')+';font-weight:'+(overdue?'700':'600')+'">'+fmtDateTime(f.dueAt)+'</span></div>' +
      '</div>' +
      '<div class="row-end" style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">' +
        '<a class="btn ghost sm" style="text-decoration:none;" href="'+followupCalendarLink(f, inq?inq.name:'')+'" target="_blank" rel="noopener">Calendar</a>' +
        '<button class="btn ghost sm" onclick="markFollowupDone(\''+f.id+'\',\''+f.inquiryId+'\',true)">Done</button>' +
      '</div>' +
    '</div>';
  }).join('');
}
function emptyState(title, sub){
  return '<div class="empty"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke-width="1.6"/><path d="M9 12h6M12 9v6" stroke-width="1.6" stroke-linecap="round"/></svg><p><b>'+esc(title)+'</b><br>'+esc(sub)+'</p></div>';
}
function inquiryRow(i){
  return '<div class="list-row" onclick="openInquiryDetail(\''+i.id+'\')" style="cursor:pointer;">' +
    '<div class="avatar">'+initials(i.name)+'</div>' +
    '<div class="row-main">' +
      '<div class="row-title">'+esc(i.name)+'</div>' +
      '<div class="row-sub">'+esc(i.eventType)+' · '+fmtDateShort(i.eventDate)+' · '+esc(i.channel)+'</div>' +
    '</div>' +
    '<div class="row-end"><span class="badge '+i.status+'">'+i.status+'</span></div>' +
  '</div>';
}
renderers.inquiries = renderInquiries;

function setBookingFilter(f){ bookingFilter=f; nav('bookings'); }

/* ---- New inquiry form ---- */
function openInquiryForm(prefill){
  prefill = prefill || {};
  var f = {
    inquiryDate: prefill.inquiryDate || todayStr(),
    name: prefill.name||'', phone: prefill.phone||'', altPhone: prefill.altPhone||'', email: prefill.email||'',
    location: prefill.location||'', eventType: prefill.eventType||'', channel: prefill.channel||'',
    inquiryType: prefill.inquiryType||'New Client', eventDate: prefill.eventDate||'', notes: prefill.notes||''
  };
  var body =
    '<div class="field"><label>Inquiry date</label><input type="date" id="fInqDate" value="'+f.inquiryDate+'"></div>' +
    '<div class="field"><label>Client name</label><input type="text" id="fName" placeholder="Full name" value="'+esc(f.name)+'"></div>' +
    '<div class="field"><label>Phone</label><input type="tel" id="fPhone" placeholder="10-digit mobile" value="'+esc(f.phone)+'"></div>' +
    '<div class="field"><label>Alternate contact <span style="opacity:.6">(optional)</span></label><input type="tel" id="fAltPhone" value="'+esc(f.altPhone)+'"></div>' +
    '<div class="field"><label>Email <span style="opacity:.6">(optional)</span></label><input type="text" id="fEmail" placeholder="name@example.com" value="'+esc(f.email)+'"></div>' +
    '<div class="field"><label>Event location</label>' + chips('fLocation', LOCATIONS, f.location) +
      otherBox('fLocationOther', 'Type the location', ['Other','Out of Station'].indexOf(f.location)>-1) + '</div>' +
    '<div class="field"><label>Event type</label>' + chips('fEventType', EVENT_TYPES, f.eventType) +
      otherBox('fEventTypeOther', 'Type the event type', f.eventType==='Other') + '</div>' +
    '<div class="field"><label>Enquiry channel</label>' + chips('fChannel', CHANNELS, f.channel) +
      otherBox('fChannelOther', 'Type the channel', f.channel==='Others') + '</div>' +
    '<div class="field"><label>Inquiry type</label>' + chips('fInquiryType', INQUIRY_TYPES, f.inquiryType) + '</div>' +
    '<div class="field"><label>Event date <span style="opacity:.6">(optional)</span></label><input type="date" id="fEventDate" value="'+f.eventDate+'"></div>' +
    '<div id="conflictBox"></div>' +
    '<div class="section-title" style="margin-top:6px;">Follow-up reminder <span style="opacity:.6;text-transform:none;font-weight:600;">(optional)</span></div>' +
    '<div class="field"><label>Remind me on</label><input type="datetime-local" id="fFollowupAt" value=""></div>' +
    '<div class="field"><label>Reminder note <span style="opacity:.6">(optional)</span></label><input type="text" id="fFollowupNote" placeholder="e.g. Call back with quote"></div>' +
    '<div id="fCalLinkWrap" style="display:none;margin:-6px 0 14px;"><a class="btn ghost sm" id="fCalLink" style="text-decoration:none;display:inline-block;" href="#" target="_blank" rel="noopener">Add reminder to Google Calendar</a></div>' +
    '<div class="field"><label>Notes <span style="opacity:.6">(optional)</span></label><textarea id="fNotes" placeholder="Anything else to remember">'+esc(f.notes)+'</textarea></div>';
  var foot = '<button class="btn primary" id="saveInqBtn">Save inquiry</button>';
  openSheet('New Inquiry', body, foot);
  wireChips('fLocation', false, function(){checkFormConflict();});
  wireOtherBox('fLocation', 'fLocationOther', ['Other','Out of Station']);
  wireChips('fEventType', false, function(){});
  wireOtherBox('fEventType', 'fEventTypeOther', ['Other']);
  wireChips('fChannel', false, function(){});
  wireOtherBox('fChannel', 'fChannelOther', ['Others']);
  wireChips('fInquiryType', false, function(){});
  document.getElementById('fEventDate').addEventListener('change', checkFormConflict);

  function syncCalLink(){
    var at = document.getElementById('fFollowupAt').value;
    var wrap = document.getElementById('fCalLinkWrap');
    if(!at){ wrap.style.display = 'none'; return; }
    var note = document.getElementById('fFollowupNote').value.trim();
    var nm = document.getElementById('fName').value.trim() || 'Inquiry';
    var link = followupCalendarLink({dueAt: new Date(at).toISOString(), note: note}, nm);
    document.getElementById('fCalLink').href = link;
    wrap.style.display = '';
  }
  document.getElementById('fFollowupAt').addEventListener('input', syncCalLink);
  document.getElementById('fFollowupAt').addEventListener('change', syncCalLink);
  document.getElementById('fFollowupNote').addEventListener('input', syncCalLink);
  document.getElementById('fName').addEventListener('input', syncCalLink);

  function checkFormConflict(){
    var d = document.getElementById('fEventDate').value;
    var box = document.getElementById('conflictBox');
    if(!d){ box.innerHTML=''; return; }
    var conflict = findConflictingBooking(d);
    if(conflict){
      box.innerHTML = '<div class="modal warnbox" style="margin:0 0 16px;padding:11px 13px;">Already booked on '+fmtDate(d)+': <b>'+esc(conflict.name)+'</b> ('+esc(conflict.eventType)+'). You can still take this inquiry.</div>';
    } else box.innerHTML = '';
  }

  document.getElementById('saveInqBtn').onclick = function(){
    var inquiryDate = document.getElementById('fInqDate').value;
    var name = document.getElementById('fName').value.trim();
    var phone = document.getElementById('fPhone').value.trim();
    var eventDate = document.getElementById('fEventDate').value;
    var location = chipValueWithOther('fLocation','fLocationOther',['Other','Out of Station']);
    var eventType = getChipValue('fEventType', false);
    var channel = chipValueWithOther('fChannel','fChannelOther',['Others']);
    var inquiryType = getChipValue('fInquiryType', false);
    if(!inquiryDate){ toast('Pick the inquiry date'); return; }
    if(!name){ toast('Enter the client name'); return; }
    if(!phone){ toast('Enter the phone number'); return; }
    if(!location){ toast('Pick an event location'); return; }
    if(!eventType){ toast('Pick an event type'); return; }
    if(!channel){ toast('Pick an enquiry channel'); return; }
    if(!inquiryType){ toast('Pick an inquiry type'); return; }
    var save = function(){
      var followupAt = document.getElementById('fFollowupAt').value;
      var rec = {
        id: uid('INQ'), createdAt: nowIso(),
        inquiryDate: inquiryDate || todayStr(),
        name:name, phone:phone, altPhone: document.getElementById('fAltPhone').value.trim(),
        email: document.getElementById('fEmail').value.trim(),
        location: location,
        eventType: eventType,
        channel: channel,
        inquiryType: inquiryType,
        eventDate: eventDate, notes: document.getElementById('fNotes').value.trim(),
        status: followupAt ? 'followup' : 'open'
      };
      DB.inquiries.push(rec);
      if(followupAt){
        DB.followups.push({id:uid('FU'), inquiryId:rec.id, dueAt:new Date(followupAt).toISOString(),
          note: document.getElementById('fFollowupNote').value.trim(), done:false, createdAt:nowIso()});
        maybeAskNotifPermission();
      }
      saveData(); closeSheet(); nav('inquiries'); checkFollowupsDue(true);
      toast(followupAt ? 'Inquiry saved with a follow-up reminder' : 'Inquiry saved');
    };
    var conflict = eventDate ? findConflictingBooking(eventDate) : null;
    if(conflict){
      confirmModal({
        title:'Already booked that day',
        warn: fmtDate(eventDate)+' is already booked for '+conflict.name+' ('+conflict.eventType+').',
        message:'Do you still want to take this inquiry?', okText:'Take inquiry anyway',
        onOk: save
      });
    } else save();
  };
}

/* ---- Inquiry detail ---- */
function openInquiryDetail(id){
  var i = DB.inquiries.find(function(x){return x.id===id;});
  if(!i) return;
  var fups = DB.followups.filter(function(f){return f.inquiryId===id;}).sort(function(a,b){return new Date(a.dueAt)-new Date(b.dueAt);});
  var body =
    '<div class="card" style="margin-bottom:14px;">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">' +
        '<div class="avatar" style="width:46px;height:46px;font-size:16px;">'+initials(i.name)+'</div>' +
        '<div><div style="font-weight:700;font-size:16px;">'+esc(i.name)+'</div><span class="badge '+i.status+'">'+i.status+'</span></div>' +
      '</div>' +
      '<div class="kv"><span class="k">Phone</span><span class="v">'+esc(i.phone||'—')+(i.altPhone?(' / '+esc(i.altPhone)):'')+'</span></div>' +
      (i.email ? '<div class="kv"><span class="k">Email</span><span class="v">'+esc(i.email)+'</span></div>' : '') +
      '<div class="kv"><span class="k">Location</span><span class="v">'+esc(i.location||'—')+'</span></div>' +
      '<div class="kv"><span class="k">Event type</span><span class="v">'+esc(i.eventType)+'</span></div>' +
      '<div class="kv"><span class="k">Event date</span><span class="v">'+fmtDate(i.eventDate)+'</span></div>' +
      '<div class="kv"><span class="k">Channel</span><span class="v">'+esc(i.channel||'—')+'</span></div>' +
      '<div class="kv"><span class="k">Inquiry type</span><span class="v">'+esc(i.inquiryType||'—')+'</span></div>' +
      '<div class="kv"><span class="k">Inquiry date</span><span class="v">'+fmtDate(i.inquiryDate)+'</span></div>' +
      (i.notes ? '<div class="kv"><span class="k">Notes</span><span class="v" style="text-align:right;max-width:60%;">'+esc(i.notes)+'</span></div>' : '') +
    '</div>' +
    '<div class="section-title">Follow-ups</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      (fups.length ? fups.map(function(f){
        return '<div class="linkrow"><span style="text-decoration:'+(f.done?'line-through':'none')+';opacity:'+(f.done?'.5':'1')+'">'+esc(f.note||'Follow up')+' — '+fmtDateTime(f.dueAt)+'</span>' +
          (!f.done ? (
            '<span style="display:flex;gap:6px;">' +
            '<a class="btn ghost sm" style="text-decoration:none;" href="'+followupCalendarLink(f, i.name)+'" target="_blank" rel="noopener">Calendar</a>' +
            '<button class="btn ghost sm" onclick="markFollowupDone(\''+f.id+'\',\''+id+'\')">Done</button>' +
            '</span>'
          ) : '') +
        '</div>';
      }).join('') : emptyState('No follow-ups yet','Set a reminder below.')) +
      '<button class="btn ghost sm" style="margin-top:10px;width:100%" onclick="openFollowupForm(\''+id+'\')">+ Set follow-up reminder</button>' +
    '</div>' +
    (i.status!=='converted' ? '<div class="btnrow" style="margin-bottom:10px;">' +
      '<button class="btn danger" onclick="markInquiryLost(\''+id+'\')">Mark lost</button>' +
      '<button class="btn primary" onclick="openConvertForm(\''+id+'\')">Convert to booking</button>' +
    '</div>' : '<div class="hint">This inquiry has already been converted to a booking.</div>');

  openSheet('Inquiry', body);
}
function markFollowupDone(fid, inqId, refreshListOnly){
  var f = DB.followups.find(function(x){return x.id===fid;});
  if(!f) return;
  f.done = true; saveData(); checkFollowupsDue(true);
  if(refreshListOnly){ renderInquiries(); toast('Marked done'); }
  else { openInquiryDetail(inqId); }
}
function markInquiryLost(id){
  confirmModal({
    title:'Mark as lost?', message:'This inquiry will be moved to Lost. You can still find it under the Lost filter.',
    okText:'Mark lost', danger:true,
    onOk:function(){
      var i = DB.inquiries.find(function(x){return x.id===id;});
      i.status='lost'; saveData(); closeSheet(); renderInquiries(); toast('Inquiry marked lost');
    }
  });
}

/* ---- Follow-up form ---- */
function openFollowupForm(inquiryId){
  var defDt = new Date(Date.now()+24*3600000);
  var defStr = defDt.toISOString().slice(0,16);
  var i0 = DB.inquiries.find(function(x){return x.id===inquiryId;});
  var body =
    '<div class="field"><label>Remind me on</label><input type="datetime-local" id="fuDate" value="'+defStr+'"></div>' +
    '<div class="field"><label>Note <span style="opacity:.6">(optional)</span></label><textarea id="fuNote" placeholder="e.g. Call back with revised quote"></textarea></div>' +
    '<div id="fuCalLinkWrap" style="display:none;margin:-6px 0 14px;"><a class="btn ghost sm" id="fuCalLink" style="text-decoration:none;display:inline-block;" href="#" target="_blank" rel="noopener">Add reminder to Google Calendar</a></div>';
  var foot = '<button class="btn primary" id="fuSaveBtn">Save reminder</button>';
  openSheet('Set Follow-up', body, foot);
  function syncFuCalLink(){
    var at = document.getElementById('fuDate').value;
    var wrap = document.getElementById('fuCalLinkWrap');
    if(!at){ wrap.style.display = 'none'; return; }
    var note = document.getElementById('fuNote').value.trim();
    document.getElementById('fuCalLink').href = followupCalendarLink({dueAt:new Date(at).toISOString(), note:note}, i0 ? i0.name : 'Inquiry');
    wrap.style.display = '';
  }
  document.getElementById('fuDate').addEventListener('input', syncFuCalLink);
  document.getElementById('fuDate').addEventListener('change', syncFuCalLink);
  document.getElementById('fuNote').addEventListener('input', syncFuCalLink);
  syncFuCalLink();
  document.getElementById('fuSaveBtn').onclick = function(){
    var dt = document.getElementById('fuDate').value;
    if(!dt){ toast('Pick a date & time'); return; }
    var i = DB.inquiries.find(function(x){return x.id===inquiryId;});
    if(i.status==='open') i.status='followup';
    DB.followups.push({id:uid('FU'), inquiryId:inquiryId, dueAt:new Date(dt).toISOString(), note:document.getElementById('fuNote').value.trim(), done:false, createdAt:nowIso()});
    saveData();
    maybeAskNotifPermission();
    openInquiryDetail(inquiryId); checkFollowupsDue(true); toast('Reminder set');
  };
}
function maybeAskNotifPermission(){
  if(DB.settings.notifPermAsked) return;
  DB.settings.notifPermAsked = true; saveData();
  if('Notification' in window && Notification.permission==='default'){
    Notification.requestPermission().catch(function(){});
  }
}

/* ---- Convert to booking ---- */
function openConvertForm(inquiryId){
  var i = DB.inquiries.find(function(x){return x.id===inquiryId;});
  var body =
    '<div class="hint" style="margin-bottom:14px;">Converting <b>'+esc(i.name)+'</b> — details are prefilled from the inquiry; adjust anything that changed.</div>' +
    '<div class="field"><label>Event date</label><input type="date" id="cEventDate" value="'+esc(i.eventDate)+'"></div>' +
    '<div id="cConflictBox"></div>' +
    '<div class="field"><label>Total amount (₹)</label><input type="number" id="cTotal" placeholder="e.g. 12000"></div>' +
    '<div class="field"><label>Advance received (₹)</label><input type="number" id="cAdvance" value="0"></div>' +
    '<div class="field"><label>Advance date</label><input type="date" id="cAdvDate" value="'+todayStr()+'"></div>';
  var foot = '<button class="btn primary" id="cSaveBtn">Confirm booking</button>';
  openSheet('Convert to Booking', body, foot);

  function checkConv(){
    var d = document.getElementById('cEventDate').value;
    var box = document.getElementById('cConflictBox');
    var conflict = findConflictingBooking(d);
    box.innerHTML = conflict ? '<div class="modal warnbox" style="margin:0 0 16px;padding:11px 13px;">Already booked on '+fmtDate(d)+': <b>'+esc(conflict.name)+'</b>.</div>' : '';
  }
  document.getElementById('cEventDate').addEventListener('change', checkConv);
  checkConv();

  document.getElementById('cSaveBtn').onclick = function(){
    var eventDate = document.getElementById('cEventDate').value;
    var total = Number(document.getElementById('cTotal').value)||0;
    var advance = Number(document.getElementById('cAdvance').value)||0;
    var advDate = document.getElementById('cAdvDate').value;
    if(!eventDate){ toast('Pick the event date'); return; }
    if(total<=0){ toast('Enter the total amount'); return; }
    var save = function(){
      var b = {
        id: uid('BK'), inquiryId: inquiryId, createdAt: nowIso(), bookingDate: todayStr(),
        eventDate: eventDate, eventType: i.eventType, name: i.name, phone: i.phone, altPhone: i.altPhone,
        location: i.location, channel: i.channel, totalAmount: total, advanceAmount: advance, advanceDate: advDate,
        payments: advance>0 ? [{id:uid('PAY'), amount:advance, date:advDate, method:'Advance', note:'Advance payment'}] : [],
        equipmentResourceId:null, transportResourceId:null, extraResourceIds:[], status:'confirmed', calendarAdded:false, notes:''
      };
      DB.bookings.push(b); i.status='converted'; saveData(); closeSheet(); nav('bookings'); toast('Booking created'); openBookingDetail(b.id);
    };
    var conflict = findConflictingBooking(eventDate);
    if(conflict){
      confirmModal({
        title:'Already booked that day', warn: fmtDate(eventDate)+' already has a booking for '+conflict.name+'.',
        message:'Do you still want to confirm this booking for the same day?', okText:'Book anyway', onOk: save
      });
    } else save();
  };
}

/* ================================ BOOKINGS ================================ */
var bookingFilter = 'active';
function renderBookings(){
  var el = document.getElementById('view-bookings');
  var list = DB.bookings.slice().sort(function(a,b){ return new Date(b.eventDate)-new Date(a.eventDate); });
  if(bookingFilter==='active') list = list.filter(function(b){return b.status!=='cancelled';});
  else if(bookingFilter==='pending') list = list.filter(function(b){return b.status!=='cancelled' && balanceDue(b)>0;});
  else if(bookingFilter!=='all') list = list.filter(function(b){return b.status===bookingFilter;});

  el.innerHTML =
    '<h2 class="disp" style="margin:2px 0 12px;">Bookings</h2>' +
    '<div class="chipwrap" id="bkFilterChips" style="margin-bottom:14px;">' +
      ['active','pending','confirmed','completed','cancelled','all'].map(function(f){
        return '<button class="chip'+(bookingFilter===f?' sel':'')+'" data-f="'+f+'">'+f.charAt(0).toUpperCase()+f.slice(1)+'</button>';
      }).join('') +
    '</div>' +
    '<div class="card" style="padding:6px 10px;">' +
      (list.length ? list.map(bookingRow).join('') : emptyState('No bookings here','Convert an inquiry to create your first booking.')) +
    '</div>';

  el.querySelectorAll('#bkFilterChips .chip').forEach(function(btn){
    btn.onclick = function(){ bookingFilter = btn.dataset.f; renderBookings(); };
  });
}
function bookingRow(b){
  var due = balanceDue(b);
  return '<div class="list-row" onclick="openBookingDetail(\''+b.id+'\')" style="cursor:pointer;">' +
    '<div class="avatar">'+initials(b.name)+'</div>' +
    '<div class="row-main">' +
      '<div class="row-title">'+esc(b.name)+'</div>' +
      '<div class="row-sub">'+esc(b.eventType)+' · '+fmtDateShort(b.eventDate)+'</div>' +
    '</div>' +
    '<div class="row-end">' +
      '<div class="row-amt num">'+fmtMoney(b.totalAmount)+'</div>' +
      '<span class="badge '+(due>0?'pending':'paid')+'">'+(due>0?'Due '+fmtMoney(due):'Paid')+'</span>' +
    '</div>' +
  '</div>';
}
renderers.bookings = renderBookings;

function calendarLink(b){
  var start = b.eventDate.replace(/-/g,'');
  var endDt = new Date(b.eventDate+'T00:00:00'); endDt.setDate(endDt.getDate()+1);
  var end = endDt.toISOString().slice(0,10).replace(/-/g,'');
  var inq = DB.inquiries.find(function(x){return x.id===b.inquiryId;});
  var details = [
    'Client: '+b.name+' ('+(b.phone||'no phone')+')',
    'Event type: '+b.eventType,
    'Location: '+(b.location||'—'),
    'Total amount: '+fmtMoney(b.totalAmount)+' | Advance: '+fmtMoney(b.advanceAmount)+' on '+fmtDate(b.advanceDate),
    'Booking date: '+fmtDate(b.bookingDate),
    inq ? ('Inquiry date: '+fmtDate(inq.inquiryDate)+' via '+inq.channel) : '',
    'Balance due: '+fmtMoney(balanceDue(b))
  ].filter(Boolean).join('\\n');
  var text = encodeURIComponent(b.eventType+' — '+b.name);
  var loc = encodeURIComponent(b.location||'');
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+text+'&dates='+start+'/'+end+'&details='+encodeURIComponent(details)+'&location='+loc;
}

function followupCalendarLink(f, inquiryName){
  var start = new Date(f.dueAt);
  var end = new Date(start.getTime() + 30*60000);
  function fmt(d){ return d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z'; }
  var text = encodeURIComponent('Follow up: '+(inquiryName||'Inquiry'));
  var details = encodeURIComponent(f.note || 'Follow-up reminder from ReY Events Manager');
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+text+'&dates='+fmt(start)+'/'+fmt(end)+'&details='+details;
}

function openBookingDetail(id){
  var b = DB.bookings.find(function(x){return x.id===id;});
  if(!b) return;
  var inq = DB.inquiries.find(function(x){return x.id===b.inquiryId;});
  var fups = inq ? DB.followups.filter(function(f){return f.inquiryId===inq.id;}) : [];
  var due = balanceDue(b);

  var timeline = '<div class="timeline">';
  if(inq) timeline += '<div class="tl-item"><div class="tl-date">'+fmtDate(inq.inquiryDate)+'</div><div class="tl-body">Inquiry received via '+esc(inq.channel)+'</div></div>';
  fups.forEach(function(f){
    timeline += '<div class="tl-item"><div class="tl-date">'+fmtDateTime(f.dueAt)+'</div><div class="tl-body">Follow-up: '+esc(f.note||'—')+(f.done?' (done)':'')+'</div></div>';
  });
  timeline += '<div class="tl-item"><div class="tl-date">'+fmtDate(b.bookingDate)+'</div><div class="tl-body">Booking confirmed — '+fmtMoney(b.totalAmount)+' total, '+fmtMoney(b.advanceAmount)+' advance</div></div>';
  (b.payments||[]).forEach(function(p){
    if(p.note==='Advance payment') return;
    timeline += '<div class="tl-item"><div class="tl-date">'+fmtDate(p.date)+'</div><div class="tl-body">Payment received: '+fmtMoney(p.amount)+' ('+esc(p.method)+')</div></div>';
  });
  timeline += '</div>';

  var equipRes = DB.resources.filter(function(r){return r.type==='equipment';});
  var transRes = DB.resources.filter(function(r){return r.type==='transport';});
  var otherRes = DB.resources.filter(function(r){return r.type==='crew'||r.type==='other';});

  var body =
    '<div class="card" style="margin-bottom:14px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        '<div style="font-weight:700;font-size:16px;">'+esc(b.name)+'</div><span class="badge '+b.status+'">'+b.status+'</span>' +
      '</div>' +
      '<div class="kv"><span class="k">Event</span><span class="v">'+esc(b.eventType)+' · '+fmtDate(b.eventDate)+'</span></div>' +
      '<div class="kv"><span class="k">Location</span><span class="v">'+esc(b.location||'—')+'</span></div>' +
      '<div class="kv"><span class="k">Phone</span><span class="v">'+esc(b.phone||'—')+'</span></div>' +
      '<div class="kv"><span class="k">Total</span><span class="v">'+fmtMoney(b.totalAmount)+'</span></div>' +
      '<div class="kv"><span class="k">Paid so far</span><span class="v" style="color:var(--good)">'+fmtMoney(paidSoFarAll(b))+'</span></div>' +
      '<div class="kv"><span class="k">Balance due</span><span class="v" style="color:'+(due>0?'var(--warn)':'var(--good)')+'">'+fmtMoney(due)+'</span></div>' +
    '</div>' +
    '<button class="btn ghost" style="margin-bottom:14px;" onclick="window.open(\''+calendarLink(b)+'\',\'_blank\')">Add to Google Calendar</button>' +
    '<div class="section-title">Timeline</div>' +
    '<div class="card" style="margin-bottom:14px;">'+timeline+'</div>' +
    '<div class="section-title">Allocation</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      '<div class="field"><label>Equipment setup</label>' + chips('bkEquip', equipRes.map(function(r){return r.name;}).concat(equipRes.length?['None']:['No equipment added yet']), resNameOrDefault(b.equipmentResourceId, equipRes)) + '</div>' +
      '<div class="field"><label>Transport</label>' + chips('bkTransport', transRes.map(function(r){return r.name;}).concat(transRes.length?['None']:['No transport added yet']), resNameOrDefault(b.transportResourceId, transRes)) + '</div>' +
      (otherRes.length ? '<div class="field"><label>Other resources / crew</label>' + chips('bkOther', otherRes.map(function(r){return r.name;}), otherRes.filter(function(r){return (b.extraResourceIds||[]).indexOf(r.id)>-1;}).map(function(r){return r.name;}), true) + '</div>' : '') +
      '<button class="btn ghost sm" style="width:100%;margin-top:4px;" onclick="saveAllocation(\''+b.id+'\')">Save allocation</button>' +
    '</div>' +
    '<div class="section-title">Payments</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      (b.payments&&b.payments.length ? b.payments.map(function(p){
        return '<div class="kv"><span class="k">'+fmtDate(p.date)+' · '+esc(p.method)+(p.note?' — '+esc(p.note):'')+'</span><span class="v">'+fmtMoney(p.amount)+'</span></div>';
      }).join('') : emptyState('No payments recorded','')) +
      (due>0 ? '<button class="btn ghost sm" style="width:100%;margin-top:10px;" onclick="openPaymentForm(\''+b.id+'\')">+ Add payment</button>' : '') +
    '</div>' +
    '<div class="section-title">Status</div>' +
    '<div class="btnrow">' +
      (b.status!=='completed' ? '<button class="btn ghost" onclick="setBookingStatus(\''+b.id+'\',\'completed\')">Mark completed</button>' : '') +
      (b.status!=='cancelled' ? '<button class="btn danger" onclick="cancelBooking(\''+b.id+'\')">Cancel</button>' : '<button class="btn ghost" onclick="setBookingStatus(\''+b.id+'\',\'confirmed\')">Reinstate</button>') +
    '</div>';

  openSheet('Booking', body);
  wireChips('bkEquip', false, function(){});
  wireChips('bkTransport', false, function(){});
  if(otherRes.length) wireChips('bkOther', true, function(){});
}
function resNameOrDefault(resId, list){
  var r = list.find(function(x){return x.id===resId;});
  return r ? r.name : (list.length ? 'None' : (list.length?'None':'No equipment added yet'));
}
function saveAllocation(bookingId){
  var b = DB.bookings.find(function(x){return x.id===bookingId;});
  var equipName = getChipValue('bkEquip', false);
  var transName = getChipValue('bkTransport', false);
  var equipRes = DB.resources.find(function(r){return r.type==='equipment' && r.name===equipName;});
  var transRes = DB.resources.find(function(r){return r.type==='transport' && r.name===transName;});
  b.equipmentResourceId = equipRes ? equipRes.id : null;
  b.transportResourceId = transRes ? transRes.id : null;
  var otherWrap = document.getElementById('bkOther');
  if(otherWrap){
    var names = getChipValue('bkOther', true);
    b.extraResourceIds = DB.resources.filter(function(r){return names.indexOf(r.name)>-1;}).map(function(r){return r.id;});
  }
  saveData(); toast('Allocation saved');
}
function openPaymentForm(bookingId){
  var b = DB.bookings.find(function(x){return x.id===bookingId;});
  var due = balanceDue(b);
  var body =
    '<div class="hint" style="margin-bottom:14px;">Balance due: <b>'+fmtMoney(due)+'</b></div>' +
    '<div class="field"><label>Amount (₹)</label><input type="number" id="pAmt" value="'+due+'"></div>' +
    '<div class="field"><label>Date</label><input type="date" id="pDate" value="'+todayStr()+'"></div>' +
    '<div class="field"><label>Method</label>' + chips('pMethod', PAY_METHODS, 'Cash') + '</div>' +
    '<div class="field"><label>Notes <span style="opacity:.6">(optional)</span></label><textarea id="pNote" placeholder="Anything else to remember"></textarea></div>';
  var foot = '<button class="btn primary" id="pSaveBtn">Record payment</button>';
  openSheet('Add Payment', body, foot);
  wireChips('pMethod', false, function(){});
  document.getElementById('pSaveBtn').onclick = function(){
    var amt = Number(document.getElementById('pAmt').value)||0;
    var method = getChipValue('pMethod', false);
    if(amt<=0){ toast('Enter an amount'); return; }
    if(!method){ toast('Pick a payment method'); return; }
    b.payments = b.payments || [];
    b.payments.push({id:uid('PAY'), amount:amt, date:document.getElementById('pDate').value||todayStr(), method:method, note:document.getElementById('pNote').value.trim()});
    saveData(); openBookingDetail(bookingId); toast('Payment recorded');
  };
}
function setBookingStatus(id, status){
  var b = DB.bookings.find(function(x){return x.id===id;});
  b.status = status; saveData(); openBookingDetail(id); renderBookings();
}
function cancelBooking(id){
  confirmModal({
    title:'Cancel this booking?', message:'It will be excluded from active revenue and payback figures.',
    okText:'Cancel booking', danger:true,
    onOk:function(){ setBookingStatus(id,'cancelled'); toast('Booking cancelled'); }
  });
}

/* ================================ RESOURCES ================================ */
function renderResources(){
  var el = document.getElementById('view-resources');
  var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
    '<h2 class="disp" style="margin:0;">Resources</h2>' +
    '<button class="btn primary sm" onclick="openResourceForm()">+ Add</button></div>';
  RESOURCE_TYPES.forEach(function(t){
    var items = DB.resources.filter(function(r){return r.type===t.key;});
    html += '<div class="section-title">'+t.label+'</div><div class="card" style="padding:6px 10px;margin-bottom:6px;">';
    html += items.length ? items.map(resourceRow).join('') : emptyState('No '+t.label.toLowerCase()+' yet','Tap + Add to create one.');
    html += '</div>';
  });
  el.innerHTML = html;
}
function resourceRow(r){
  var usedCount = DB.bookings.filter(function(b){ return b.status!=='cancelled' && (b.equipmentResourceId===r.id || b.transportResourceId===r.id || (b.extraResourceIds||[]).indexOf(r.id)>-1); }).length;
  return '<div class="list-row">' +
    '<div class="row-main"><div class="row-title">'+esc(r.name)+(r.active?'':' <span class="badge cancelled" style="margin-left:4px;">inactive</span>')+'</div>' +
    '<div class="row-sub">'+esc(r.notes||'')+(usedCount?' · used in '+usedCount+' booking(s)':'')+'</div></div>' +
    '<div class="btnrow" style="width:auto;gap:6px;">' +
      '<button class="iconbtn" onclick="openResourceForm(\''+r.id+'\')"><svg viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<button class="iconbtn" onclick="deleteResource(\''+r.id+'\')"><svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '</div></div>';
}
renderers.resources = renderResources;
function openResourceForm(id){
  var r = id ? DB.resources.find(function(x){return x.id===id;}) : null;
  var body =
    '<div class="field"><label>Type</label>' + chips('rType', RESOURCE_TYPES.map(function(t){return t.label;}), r ? RESOURCE_TYPES.find(function(t){return t.key===r.type;}).label : 'Equipment') + '</div>' +
    '<div class="field"><label>Name</label><input type="text" id="rName" placeholder="e.g. Setup 4 / New Tempo Traveller" value="'+esc(r?r.name:'')+'"></div>' +
    '<div class="field"><label>Notes <span style="opacity:.6">(optional)</span></label><textarea id="rNotes" placeholder="Optional">'+esc(r?r.notes:'')+'</textarea></div>' +
    '<div class="field"><label>Status</label>' + chips('rActive', ['Active','Inactive'], r&&!r.active?'Inactive':'Active') + '</div>';
  var foot = '<button class="btn primary" id="rSaveBtn">'+(r?'Save changes':'Add resource')+'</button>';
  openSheet(r?'Edit Resource':'Add Resource', body, foot);
  wireChips('rType', false, function(){}); wireChips('rActive', false, function(){});
  document.getElementById('rSaveBtn').onclick = function(){
    var name = document.getElementById('rName').value.trim();
    if(!name){ toast('Enter a name'); return; }
    var typeLabel = getChipValue('rType', false);
    if(!typeLabel){ toast('Pick a resource type'); return; }
    var statusLabel = getChipValue('rActive', false);
    if(!statusLabel){ toast('Pick a status'); return; }
    var typeKey = RESOURCE_TYPES.find(function(t){return t.label===typeLabel;}).key;
    var active = statusLabel !== 'Inactive';
    var notes = document.getElementById('rNotes').value.trim();
    if(r){ r.type=typeKey; r.name=name; r.notes=notes; r.active=active; }
    else DB.resources.push({id:uid('RES'), type:typeKey, name:name, notes:notes, active:active, createdAt:nowIso()});
    saveData(); closeSheet(); renderResources(); toast('Resource saved');
  };
}
function deleteResource(id){
  confirmModal({
    title:'Delete this resource?', message:'Bookings that reference it will just show it as unassigned.',
    okText:'Delete', danger:true,
    onOk:function(){
      DB.resources = DB.resources.filter(function(r){return r.id!==id;});
      DB.bookings.forEach(function(b){
        if(b.equipmentResourceId===id) b.equipmentResourceId=null;
        if(b.transportResourceId===id) b.transportResourceId=null;
        b.extraResourceIds = (b.extraResourceIds||[]).filter(function(x){return x!==id;});
      });
      saveData(); renderResources(); toast('Resource deleted');
    }
  });
}

/* ================================ GLOBAL SEARCH ================================ */
function openSearchSheet(){
  var body =
    '<div class="field"><input type="text" id="gSearchInput" placeholder="Search name, phone, email, location, notes..." autocomplete="off"></div>' +
    '<div id="gSearchResults"></div>';
  openSheet('Search', body);
  var input = document.getElementById('gSearchInput');
  input.addEventListener('input', function(){ renderSearchResults(input.value); });
  renderSearchResults('');
  setTimeout(function(){ input.focus(); }, 60);
}
function searchableText(rec, fields){
  return fields.map(function(k){ return rec[k]==null ? '' : String(rec[k]); }).join(' • ').toLowerCase();
}
function searchResultRow(avatarText, title, sub, badgeClass, badgeText, onclick){
  return '<div class="list-row" style="cursor:pointer;" onclick="'+onclick+'">' +
    '<div class="avatar">'+esc(avatarText)+'</div>' +
    '<div class="row-main"><div class="row-title">'+esc(title)+'</div><div class="row-sub">'+esc(sub)+'</div></div>' +
    (badgeText ? '<span class="badge '+badgeClass+'">'+esc(badgeText)+'</span>' : '') +
  '</div>';
}
function renderSearchResults(q){
  var box = document.getElementById('gSearchResults');
  if(!box) return;
  q = (q||'').trim().toLowerCase();
  if(!q){
    box.innerHTML = emptyState('Search everything','Type a name, phone number, email, location, event type, channel or note to find it across inquiries, bookings, resources and follow-ups.');
    return;
  }
  var inqFields = ['name','phone','altPhone','email','location','eventType','channel','inquiryType','notes','inquiryDate','eventDate','status'];
  var bkFields = ['name','phone','altPhone','location','eventType','channel','notes','eventDate','bookingDate','status'];
  var resFields = ['name','notes','type'];

  var inqMatches = DB.inquiries.filter(function(r){ return searchableText(r, inqFields).indexOf(q)>-1; });
  var bkMatches = DB.bookings.filter(function(r){ return searchableText(r, bkFields).indexOf(q)>-1; });
  var resMatches = DB.resources.filter(function(r){ return searchableText(r, resFields).indexOf(q)>-1; });
  var fuMatches = DB.followups.filter(function(f){ return searchableText(f, ['note']).indexOf(q)>-1; });

  var total = inqMatches.length + bkMatches.length + resMatches.length + fuMatches.length;
  if(total===0){ box.innerHTML = emptyState('No matches','Try a different name, phone number or keyword.'); return; }

  var html = '';
  if(inqMatches.length){
    html += '<div class="section-title">Inquiries ('+inqMatches.length+')</div><div class="card" style="padding:6px 10px;margin-bottom:14px;">' +
      inqMatches.map(function(i){
        return searchResultRow(initials(i.name), i.name, (i.eventType||'')+' · '+(i.location||'—'), i.status, i.status, "openInquiryDetail('"+i.id+"')");
      }).join('') + '</div>';
  }
  if(bkMatches.length){
    html += '<div class="section-title">Bookings ('+bkMatches.length+')</div><div class="card" style="padding:6px 10px;margin-bottom:14px;">' +
      bkMatches.map(function(b){
        return searchResultRow(initials(b.name), b.name, (b.eventType||'')+' · '+fmtDateShort(b.eventDate), b.status, b.status, "openBookingDetail('"+b.id+"')");
      }).join('') + '</div>';
  }
  if(resMatches.length){
    html += '<div class="section-title">Resources ('+resMatches.length+')</div><div class="card" style="padding:6px 10px;margin-bottom:14px;">' +
      resMatches.map(function(r){
        var typeLabel = (RESOURCE_TYPES.find(function(t){return t.key===r.type;})||{label:r.type}).label;
        return searchResultRow(r.name.slice(0,2).toUpperCase(), r.name, typeLabel+(r.notes?' · '+r.notes:''), 'cancelled', r.active?'':'inactive', "openResourceForm('"+r.id+"')");
      }).join('') + '</div>';
  }
  if(fuMatches.length){
    html += '<div class="section-title">Follow-ups ('+fuMatches.length+')</div><div class="card" style="padding:6px 10px;margin-bottom:14px;">' +
      fuMatches.map(function(f){
        var inq = DB.inquiries.find(function(i){return i.id===f.inquiryId;});
        return searchResultRow(inq?initials(inq.name):'FU', (inq?inq.name:'Unknown inquiry')+' — '+(f.note||'Follow up'), fmtDateTime(f.dueAt), f.done?'cancelled':'followup', f.done?'done':'due', "openInquiryDetail('"+f.inquiryId+"')");
      }).join('') + '</div>';
  }
  box.innerHTML = html;
}

/* ================================ MORE / SETTINGS ================================ */
function renderMore(){
  var el = document.getElementById('view-more');
  var s = DB.settings;
  var allocKeys = Object.keys(s.eventTypeAlloc);
  var allocRows = allocKeys.map(function(et, idx){
    var a = s.eventTypeAlloc[et];
    return '<div class="field" style="margin-bottom:10px;"><label>'+esc(et)+'</label>' +
      '<div style="display:flex; gap:8px;">' +
        '<input type="number" id="alloc_'+idx+'_equip" value="'+(a.equip==null?'':a.equip)+'" placeholder="Equipment ₹" style="flex:1">' +
        '<input type="number" id="alloc_'+idx+'_transport" value="'+(a.transport==null?'':a.transport)+'" placeholder="Transport ₹" style="flex:1">' +
      '</div></div>';
  }).join('');

  el.innerHTML =
    '<h2 class="disp" style="margin:2px 0 12px;">More</h2>' +
    '<div class="section-title">Business</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      '<div class="field" style="margin-bottom:12px;"><label>Business name</label><input type="text" id="sBizName" value="'+esc(s.businessName)+'"></div>' +
      '<div class="field" style="margin-bottom:0;"><label>Owner name</label><input type="text" id="sOwnerName" value="'+esc(s.ownerName)+'"></div>' +
      '<button class="btn ghost sm" style="margin-top:12px;width:100%" onclick="saveBizSettings()">Save</button>' +
    '</div>' +
    '<div class="section-title">Capital investment (for payback tracking)</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      capitalField('equipmentTotalInvestment','Equipment total investment (₹)', s.equipmentTotalInvestment) +
      capitalField('equipmentCycleYears','Equipment replacement cycle (years)', s.equipmentCycleYears) +
      capitalField('equipmentAcquiredYear','Equipment first acquired (year)', s.equipmentAcquiredYear) +
      capitalField('equipmentAlreadyRecovered','Equipment already recovered before this app (₹)', s.equipmentAlreadyRecovered) +
      '<div style="height:6px"></div>' +
      capitalField('transportTotalInvestment','Transport total investment (₹)', s.transportTotalInvestment) +
      capitalField('transportCycleYears','Transport replacement cycle (years)', s.transportCycleYears) +
      capitalField('transportAcquiredYear','Transport first acquired (year)', s.transportAcquiredYear) +
      capitalField('transportAlreadyRecovered','Transport already recovered before this app (₹)', s.transportAlreadyRecovered) +
      '<div class="hint" style="margin-bottom:8px;">Payback pace is measured from the year each asset was actually bought, not from when you started using this app. "Already recovered" is whatever you\'d already earned back before you started logging bookings here — leave it at 0 if you\'re not sure, and it will build up from bookings you add from now on.</div>' +
      '<button class="btn ghost sm" style="margin-top:6px;width:100%" onclick="saveCapitalSettings()">Save</button>' +
    '</div>' +
    '<div class="section-title">Per-event-type allocation (auto-applied to new bookings)</div>' +
    '<div class="card" style="margin-bottom:14px;">' + allocRows +
      '<div class="hint" style="margin-bottom:10px;">These equipment/transport cost estimates are suggested automatically when you convert an inquiry to a booking for that event type. Change the numbers above and save — it only affects new bookings, not ones already saved.</div>' +
      '<button class="btn ghost sm" style="width:100%" onclick="saveAllocSettings()">Save allocation</button>' +
    '</div>' +
    '<div class="section-title">Backup &amp; restore</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      '<div class="linkrow" onclick="exportDataBackup()"><span>Export data backup (.json)</span><svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<div class="linkrow" onclick="exportExcelBackup()"><span>Export all data as Excel (.xlsx)</span><svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<div class="linkrow" onclick="document.getElementById(\'restoreFile\').click()"><span>Restore from a data backup (.json)</span><svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<input type="file" id="restoreFile" accept="application/json" hidden onchange="restoreFromFile(this.files[0])">' +
      '<div class="linkrow" onclick="document.getElementById(\'restoreExcelFile\').click()"><span>Restore from an Excel export (.xlsx)</span><svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<input type="file" id="restoreExcelFile" accept=".xlsx" hidden onchange="restoreFromExcelFile(this.files[0])">' +
      '<div class="hint" style="margin-top:8px;">Your data is saved online automatically and is available on any phone or computer you sign in from. These files are an extra copy for safekeeping — restoring one replaces the data in '+(VIEW_USER ? esc(VIEW_USER.username)+'\'s' : 'this')+' account. Don\'t rename sheets or touch the hidden columns/sheets in the Excel file, or it won\'t read back in.</div>' +
    '</div>' +
    '<div class="section-title">Notifications</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      '<div class="hint" style="margin-bottom:10px;">Reminders show as a banner and badge whenever you open the app. Browser notifications are best-effort and only fire while this tab is open.</div>' +
      '<button class="btn ghost sm" style="width:100%" onclick="requestNotifNow()">Enable browser notifications</button>' +
    '</div>' +
    (IS_ADMIN ?
      '<div class="section-title">Admin</div>' +
      '<div class="card" style="margin-bottom:14px;">' +
        (VIEW_USER ? '<div class="linkrow" onclick="exitUserWorkspace()" style="color:var(--accent)"><span>Back to my own workspace</span><svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' : '') +
        '<div class="linkrow" onclick="openAdminUsers()"><span>Manage users &amp; approvals</span><span style="display:flex;align-items:center;gap:6px;"><span id="admPendingCount"></span><svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>' +
        '<div class="linkrow" onclick="openAdminRequests()"><span>Help &amp; password reset requests</span><span style="display:flex;align-items:center;gap:6px;"><span id="admReqCount"></span><svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>' +
        '<div class="hint" style="margin-top:8px;">As admin you can approve new accounts, reset anyone\'s password, and open any user\'s workspace to view or edit their data.</div>' +
      '</div>' : '') +
    '<div class="section-title">Account</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      '<div class="kv"><span class="k">Signed in as</span><span class="v">'+esc(ME ? ME.username : '')+(IS_ADMIN ? ' <span class="badge admin">Admin</span>' : '')+'</span></div>' +
      '<div class="kv" style="margin-bottom:4px;"><span class="k">Email</span><span class="v">'+esc(ME ? ME.email : '')+'</span></div>' +
      '<div class="linkrow" onclick="openChangePassword()"><span>Change password</span><svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<div class="linkrow" onclick="lockApp()"><span>Sign out</span><svg viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div>' +
      '<div class="linkrow" onclick="clearSampleData()"><span>Clear sample data</span><svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<div class="linkrow" onclick="resetAppFromMore()" style="color:var(--bad)"><span>Erase all data &amp; reset</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
    '</div>' +
    '<div class="hint" style="text-align:center;">ReY Events Manager · data saved securely online</div>';
  loadAdminCounts();
}
function capitalField(key, label, val){
  return '<div class="field" style="margin-bottom:10px;"><label>'+esc(label)+'</label><input type="number" id="s_'+key+'" value="'+(val==null?'':val)+'"></div>';
}
renderers.more = renderMore;
function saveBizSettings(){
  DB.settings.businessName = document.getElementById('sBizName').value.trim() || 'ReY Events';
  DB.settings.ownerName = document.getElementById('sOwnerName').value.trim();
  saveData(); renderHeaderTitle(); toast('Saved');
}
function saveCapitalSettings(){
  ['equipmentTotalInvestment','equipmentCycleYears','equipmentAcquiredYear','equipmentAlreadyRecovered','transportTotalInvestment','transportCycleYears','transportAcquiredYear','transportAlreadyRecovered'].forEach(function(k){
    var el = document.getElementById('s_'+k);
    if(el) DB.settings[k] = Number(el.value)||0;
  });
  saveData(); toast('Capital settings saved');
}
function saveAllocSettings(){
  var keys = Object.keys(DB.settings.eventTypeAlloc);
  keys.forEach(function(et, idx){
    var eEl = document.getElementById('alloc_'+idx+'_equip');
    var tEl = document.getElementById('alloc_'+idx+'_transport');
    if(eEl) DB.settings.eventTypeAlloc[et].equip = Number(eEl.value)||0;
    if(tEl) DB.settings.eventTypeAlloc[et].transport = Number(tEl.value)||0;
  });
  saveData(); toast('Allocation saved');
}
function requestNotifNow(){
  if(!('Notification' in window)){ toast('Notifications are not available in this browser'); return; }
  Notification.requestPermission().then(function(p){
    toast(p==='granted' ? 'Notifications enabled' : 'Notifications not enabled');
  });
}
function lockApp(){ signOut(); }
function clearSampleData(){
  var count = DB.inquiries.filter(function(x){return x.sample;}).length +
    DB.followups.filter(function(x){return x.sample;}).length +
    DB.bookings.filter(function(x){return x.sample;}).length +
    DB.resources.filter(function(x){return x.sample;}).length;
  if(count===0){ toast('No sample data left to clear'); return; }
  confirmModal({
    title:'Clear sample data?', message:'Removes the '+count+' example inquiries, followups, bookings and resources created when you first set up the app. Anything you have added or edited yourself stays.',
    okText:'Clear sample data',
    onOk:function(){
      DB.inquiries = DB.inquiries.filter(function(x){return !x.sample;});
      DB.followups = DB.followups.filter(function(x){return !x.sample;});
      DB.bookings = DB.bookings.filter(function(x){return !x.sample;});
      DB.resources = DB.resources.filter(function(x){return !x.sample;});
      saveData();
      if(renderers[currentTab]) renderers[currentTab]();
      toast('Sample data cleared');
    }
  });
}
function resetAppFromMore(){
  confirmModal({
    title:'Erase everything?', warn:'This permanently deletes ALL inquiries, follow-ups, bookings, payments and resources in '+(VIEW_USER ? VIEW_USER.username+'\'s' : 'this')+' account. The login itself stays.',
    message:'Make sure you have exported a backup first if you want to keep anything.', okText:'Erase everything', danger:true,
    onOk:function(){
      var owner = DB.settings.ownerName;
      DB = defaultData(); DB.settings.ownerName = owner;
      saveData(); refreshAfterDataSwap(); nav('dashboard');
      toast('All data erased');
    }
  });
}

/* ================================ BACKUP / EXPORT / IMPORT ================================ */
function nativeDownloads(){
  // plain-browser fallback used when this page is opened directly (emailed attachment,
  // double-clicked file, etc.) rather than hosted inside a Claude Artifact frame.
  return {
    save: function(req){
      return new Promise(function(resolve, reject){
        try{
          var blob = (req.data instanceof Blob) ? req.data : new Blob([req.data], {type:'application/octet-stream'});
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url; a.download = req.filename;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
          resolve({status:'saved'});
        }catch(e){ reject({code:'unavailable', message:String(e)}); }
      });
    }
  };
}
function withDownloads(cb){
  if(window.claude && window.claude.use){
    window.claude.use('downloads').then(function(d){
      cb(d || nativeDownloads());
    }).catch(function(){ cb(nativeDownloads()); });
  } else {
    cb(nativeDownloads());
  }
}
function exportDataBackup(){
  withDownloads(function(downloads){
    var payload = JSON.stringify({ kind:'reyevents-data-backup', version:1, exportedAt: nowIso(), data: DB }, null, 2);
    var fname = 'ReYEvents-backup-'+todayStr()+'.json';
    downloads.save({filename: fname, data: payload}).then(function(){ toast('Backup saved'); }).catch(function(e){ toast('Could not save backup: '+(e&&e.code||'')); });
  });
}
function resourceName(id){
  if(!id) return '';
  var r = DB.resources.find(function(x){return x.id===id;});
  return r ? r.name : '';
}
// Column layout shared by export and import, so the two stay in sync. Columns marked
// hidden:true carry internal IDs/links/raw dates — invisible in Excel but what makes a
// re-import possible. Deleting or retyping those columns is what breaks a re-import.
var XLSX_HIDDEN_COL = {hidden:true, wch:10};
function exportExcelBackup(){
  if(typeof XLSX === 'undefined'){ toast('Excel export is not available in this file.'); return; }
  var s = DB.settings;

  var inquiriesRows = DB.inquiries.map(function(i){
    return {
      'ID': i.id, 'Created At': i.createdAt,
      'Inquiry Date': i.inquiryDate, 'Client Name': i.name, 'Phone': String(i.phone||''), 'Alternate Phone': String(i.altPhone||''),
      'Email': i.email||'', 'Location': i.location, 'Event Type': i.eventType, 'Event Date': i.eventDate,
      'Channel': i.channel, 'Inquiry Type': i.inquiryType, 'Status': i.status, 'Notes': i.notes||''
    };
  });

  var followupRows = DB.followups.slice().sort(function(a,b){return new Date(a.dueAt)-new Date(b.dueAt);}).map(function(f){
    var inq = DB.inquiries.find(function(x){return x.id===f.inquiryId;});
    return {
      'ID': f.id, 'Inquiry ID': f.inquiryId, 'Created At': f.createdAt,
      'Client Name': inq ? inq.name : '(inquiry deleted)', 'Due At (raw)': f.dueAt, 'Due': fmtDateTime(f.dueAt),
      'Note': f.note||'', 'Done': f.done ? 'Yes' : 'No'
    };
  });

  var bookingsRows = DB.bookings.map(function(b){
    var inq = DB.inquiries.find(function(x){return x.id===b.inquiryId;});
    return {
      'ID': b.id, 'Inquiry ID': b.inquiryId||'', 'Created At': b.createdAt,
      'Booking Date': b.bookingDate, 'Event Date': b.eventDate, 'Event Type': b.eventType, 'Client Name': b.name,
      'Phone': String(b.phone||''), 'Alternate Phone': String(b.altPhone||''), 'Email': inq ? (inq.email||'') : '', 'Location': b.location||'',
      'Channel': b.channel||'', 'Total Amount': Number(b.totalAmount)||0, 'Advance Amount': Number(b.advanceAmount)||0,
      'Advance Date': b.advanceDate||'', 'Paid So Far': paidSoFarAll(b), 'Balance Due': balanceDue(b),
      'Equipment ID': b.equipmentResourceId||'', 'Equipment': resourceName(b.equipmentResourceId),
      'Transport ID': b.transportResourceId||'', 'Transport': resourceName(b.transportResourceId),
      'Extra Resource IDs': (b.extraResourceIds||[]).join(','),
      'Extra Resources': (b.extraResourceIds||[]).map(resourceName).filter(Boolean).join(', '),
      'Status': b.status, 'Added to Calendar': b.calendarAdded ? 'Yes' : 'No', 'Notes': b.notes||''
    };
  });

  var paymentsRows = [];
  DB.bookings.forEach(function(b){
    (b.payments||[]).forEach(function(p){
      paymentsRows.push({
        'ID': p.id, 'Booking ID': b.id,
        'Client Name': b.name, 'Event Date': b.eventDate, 'Payment Date': p.date, 'Amount': Number(p.amount)||0,
        'Method': p.method||'', 'Note': p.note||''
      });
    });
  });

  var resourceRows = DB.resources.map(function(r){
    return { 'ID': r.id, 'Created At': r.createdAt, 'Type': r.type, 'Name': r.name, 'Notes': r.notes||'', 'Active': r.active ? 'Yes' : 'No' };
  });

  var health = computeHealth();
  var activeBookings = DB.bookings.filter(function(b){return b.status!=='cancelled';});
  var totalRevenue = activeBookings.reduce(function(sum,b){return sum+(Number(b.totalAmount)||0);},0);
  var summaryRows = [
    ['ReY Events Manager — data export', ''],
    ['Exported at', new Date().toLocaleString('en-IN')],
    ['Business name', s.businessName||''],
    ['Owner name', s.ownerName||''],
    ['', ''],
    ['Total inquiries', DB.inquiries.length],
    ['Total active bookings', activeBookings.length],
    ['Total revenue (active bookings)', totalRevenue],
    ['Inquiry → booking conversion', (health.convRate*100).toFixed(1)+'%'],
    ['Business health score (0-100)', health.total],
    ['', ''],
    ['Equipment total investment (₹)', Number(s.equipmentTotalInvestment)||0],
    ['Equipment replacement cycle (years)', Number(s.equipmentCycleYears)||0],
    ['Equipment first acquired (year)', s.equipmentAcquiredYear||''],
    ['Equipment recovered so far (₹)', recoveredSoFar('equipment')],
    ['Equipment payback pace vs. schedule', (paybackPace('equipment')*100).toFixed(0)+'%'],
    ['', ''],
    ['Transport total investment (₹)', Number(s.transportTotalInvestment)||0],
    ['Transport replacement cycle (years)', Number(s.transportCycleYears)||0],
    ['Transport first acquired (year)', s.transportAcquiredYear||''],
    ['Transport recovered so far (₹)', recoveredSoFar('transport')],
    ['Transport payback pace vs. schedule', (paybackPace('transport')*100).toFixed(0)+'%'],
    ['', ''],
    ['This file can be re-imported from More → Backup & restore.', ''],
    ['Do not delete or unhide the hidden ID columns/sheets — that is what makes re-import possible.', '']
  ];

  var settingsRows = [
    ['key','value'],
    ['dbCreatedAt', DB.createdAt],
    ['businessName', s.businessName||''],
    ['ownerName', s.ownerName||''],
    ['equipmentTotalInvestment', Number(s.equipmentTotalInvestment)||0],
    ['equipmentCycleYears', Number(s.equipmentCycleYears)||0],
    ['equipmentAcquiredYear', Number(s.equipmentAcquiredYear)||''],
    ['equipmentAlreadyRecovered', Number(s.equipmentAlreadyRecovered)||0],
    ['transportTotalInvestment', Number(s.transportTotalInvestment)||0],
    ['transportCycleYears', Number(s.transportCycleYears)||0],
    ['transportAcquiredYear', Number(s.transportAcquiredYear)||''],
    ['transportAlreadyRecovered', Number(s.transportAlreadyRecovered)||0]
  ];
  var allocRows = [['eventType','equip','transport']].concat(
    Object.keys(s.eventTypeAlloc).map(function(et){
      var a = s.eventTypeAlloc[et];
      return [et, Number(a.equip)||0, Number(a.transport)||0];
    })
  );

  var wb = XLSX.utils.book_new();
  var wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{wch:56},{wch:22}];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  var wsInq = XLSX.utils.json_to_sheet(inquiriesRows);
  wsInq['!cols'] = [XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,{wch:12},{wch:20},{wch:13},{wch:13},{wch:20},{wch:16},{wch:16},{wch:12},{wch:18},{wch:13},{wch:10},{wch:30}];
  XLSX.utils.book_append_sheet(wb, wsInq, 'Inquiries');

  var wsFu = XLSX.utils.json_to_sheet(followupRows);
  wsFu['!cols'] = [XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,{wch:20},XLSX_HIDDEN_COL,{wch:18},{wch:26},{wch:8}];
  XLSX.utils.book_append_sheet(wb, wsFu, 'Follow-ups');

  var wsBk = XLSX.utils.json_to_sheet(bookingsRows);
  wsBk['!cols'] = [XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,{wch:12},{wch:12},{wch:16},{wch:20},{wch:13},{wch:13},{wch:20},{wch:16},{wch:13},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},XLSX_HIDDEN_COL,{wch:14},XLSX_HIDDEN_COL,{wch:14},XLSX_HIDDEN_COL,{wch:18},{wch:10},{wch:12},{wch:30}];
  XLSX.utils.book_append_sheet(wb, wsBk, 'Bookings');

  var wsPay = XLSX.utils.json_to_sheet(paymentsRows);
  wsPay['!cols'] = [XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,{wch:20},{wch:12},{wch:12},{wch:10},{wch:12},{wch:26}];
  XLSX.utils.book_append_sheet(wb, wsPay, 'Payments');

  var wsRes = XLSX.utils.json_to_sheet(resourceRows);
  wsRes['!cols'] = [XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,{wch:12},{wch:20},{wch:26},{wch:8}];
  XLSX.utils.book_append_sheet(wb, wsRes, 'Resources');

  // Very-hidden technical sheets: not shown in Excel's normal Unhide dialog, so a casual
  // "tidy up before I send this" pass won't stumble onto them. They carry the settings and
  // per-event-type allocation needed to fully reconstruct the account on import.
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(settingsRows), '_Settings');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(allocRows), '_Alloc');
  wb.Workbook = wb.Workbook || {};
  wb.Workbook.Sheets = wb.SheetNames.map(function(name){
    return {Hidden: (name==='_Settings'||name==='_Alloc') ? 2 : 0};
  });

  withDownloads(function(downloads){
    var arr = XLSX.write(wb, {type:'array', bookType:'xlsx'});
    var blob = new Blob([arr], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    var fname = 'ReYEvents-export-'+todayStr()+'.xlsx';
    downloads.save({filename: fname, data: blob}).then(function(){ toast('Excel file saved'); })
      .catch(function(e){ toast('Could not save Excel file: '+(e&&e.code||'')); });
  });
}
function restoreFromFile(file){
  if(!file) return;
  var reader = new FileReader();
  reader.onload = function(){
    try{
      var parsed = JSON.parse(reader.result);
      var incoming = parsed.data || parsed; // tolerate raw data-only files too
      confirmModal({
        title:'Restore this backup?', warn:'This replaces ALL current data in this account with the contents of the backup file.',
        message:'Make sure this is the right file — there is no undo.', okText:'Restore', danger:true,
        onOk:function(){
          DB = migrateData(incoming);
          saveData(); toast('Backup restored'); nav('dashboard');
        }
      });
    }catch(e){ toast('That file could not be read as a backup.'); }
  };
  reader.readAsText(file);
}
function restoreFromExcelFile(file){
  if(!file) return;
  if(typeof XLSX === 'undefined'){ toast('Excel import is not available in this file.'); return; }
  var reader = new FileReader();
  reader.onload = function(){
    try{
      var data = new Uint8Array(reader.result);
      var wb = XLSX.read(data, {type:'array'});
      var need = ['Inquiries','Follow-ups','Bookings','Payments','Resources','_Settings','_Alloc'];
      var missing = need.filter(function(n){return wb.SheetNames.indexOf(n)===-1;});
      if(missing.length){
        toast('Not a ReY Events Excel export — missing sheet(s): '+missing.join(', '));
        return;
      }
      function rows(name){ return XLSX.utils.sheet_to_json(wb.Sheets[name], {defval:''}); }
      function aoa(name){ return XLSX.utils.sheet_to_json(wb.Sheets[name], {header:1, defval:''}); }

      var inqRows = rows('Inquiries');
      var fuRows = rows('Follow-ups');
      var bkRows = rows('Bookings');
      var payRows = rows('Payments');
      var resRows = rows('Resources');
      var settingsAoa = aoa('_Settings');
      var allocAoa = aoa('_Alloc');

      // The hidden ID column is the tell for an unedited export — if it's gone (unhidden and
      // deleted, or this is some other spreadsheet with the same sheet names), stop rather
      // than build inquiries/bookings with missing/blank ids.
      if(inqRows.length && !('ID' in inqRows[0])){ toast("This file is missing its hidden ID column — it can't be re-imported. Re-export a fresh copy and don't edit its hidden columns/sheets."); return; }
      if(bkRows.length && !('ID' in bkRows[0])){ toast("This file is missing its hidden ID column — it can't be re-imported. Re-export a fresh copy and don't edit its hidden columns/sheets."); return; }

      var settingsMap = {};
      settingsAoa.slice(1).forEach(function(r){ if(r[0]) settingsMap[r[0]] = r[1]; });
      var eventTypeAlloc = {};
      allocAoa.slice(1).forEach(function(r){ if(r[0]) eventTypeAlloc[r[0]] = {equip:Number(r[1])||0, transport:Number(r[2])||0}; });

      var resources = resRows.map(function(r){
        return {id:String(r['ID']), createdAt:r['Created At']||nowIso(), type:r['Type']||'other', name:r['Name']||'',
          notes:r['Notes']||'', active: r['Active']!=='No'};
      });

      var inquiries = inqRows.map(function(r){
        return {
          id:String(r['ID']), createdAt:r['Created At']||nowIso(), inquiryDate:r['Inquiry Date']||todayStr(),
          name:r['Client Name']||'', phone:String(r['Phone']||''), altPhone:String(r['Alternate Phone']||''),
          email:r['Email']||'', location:r['Location']||'', eventType:r['Event Type']||'', eventDate:r['Event Date']||'',
          channel:r['Channel']||'', inquiryType:r['Inquiry Type']||'New Client', status:r['Status']||'open', notes:r['Notes']||''
        };
      });

      var followups = fuRows.filter(function(r){return r['ID'];}).map(function(r){
        return {
          id:String(r['ID']), inquiryId:String(r['Inquiry ID']||''), createdAt:r['Created At']||nowIso(),
          dueAt:r['Due At (raw)']||new Date().toISOString(), note:r['Note']||'', done: r['Done']==='Yes'
        };
      });

      var bookings = bkRows.map(function(r){
        return {
          id:String(r['ID']), inquiryId:String(r['Inquiry ID']||''), createdAt:r['Created At']||nowIso(),
          bookingDate:r['Booking Date']||todayStr(), eventDate:r['Event Date']||'', eventType:r['Event Type']||'',
          name:r['Client Name']||'', phone:String(r['Phone']||''), altPhone:String(r['Alternate Phone']||''),
          location:r['Location']||'', channel:r['Channel']||'',
          totalAmount:Number(r['Total Amount'])||0, advanceAmount:Number(r['Advance Amount'])||0, advanceDate:r['Advance Date']||'',
          equipmentResourceId: r['Equipment ID'] ? String(r['Equipment ID']) : null,
          transportResourceId: r['Transport ID'] ? String(r['Transport ID']) : null,
          extraResourceIds: r['Extra Resource IDs'] ? String(r['Extra Resource IDs']).split(',').map(function(x){return x.trim();}).filter(Boolean) : [],
          status:r['Status']||'confirmed', calendarAdded: r['Added to Calendar']==='Yes', notes:r['Notes']||'', payments:[]
        };
      });
      payRows.forEach(function(r){
        var b = bookings.find(function(x){return x.id===String(r['Booking ID']);});
        if(b) b.payments.push({id:String(r['ID']||uid('PAY')), amount:Number(r['Amount'])||0, date:r['Payment Date']||'', method:r['Method']||'', note:r['Note']||''});
      });

      var incoming = {
        createdAt: settingsMap.dbCreatedAt || nowIso(),
        inquiries: inquiries, followups: followups, bookings: bookings, resources: resources,
        settings: {
          businessName: settingsMap.businessName || 'ReY Events', ownerName: settingsMap.ownerName || '',
          equipmentTotalInvestment: Number(settingsMap.equipmentTotalInvestment)||800000,
          equipmentCycleYears: Number(settingsMap.equipmentCycleYears)||4,
          equipmentAcquiredYear: Number(settingsMap.equipmentAcquiredYear)||2015,
          equipmentAlreadyRecovered: Number(settingsMap.equipmentAlreadyRecovered)||0,
          transportTotalInvestment: Number(settingsMap.transportTotalInvestment)||1100000,
          transportCycleYears: Number(settingsMap.transportCycleYears)||7,
          transportAcquiredYear: Number(settingsMap.transportAcquiredYear)||2024,
          transportAlreadyRecovered: Number(settingsMap.transportAlreadyRecovered)||0,
          eventTypeAlloc: Object.keys(eventTypeAlloc).length ? eventTypeAlloc : JSON.parse(JSON.stringify(DEFAULT_ALLOC)),
          notifPermAsked: false
        }
      };

      confirmModal({
        title:'Restore this Excel export?',
        warn:'This replaces ALL current data in this account (inquiries, bookings, payments, resources) with the contents of this file. Your username and password are not changed.',
        message:'Make sure this is the right file — there is no undo.', okText:'Restore', danger:true,
        onOk:function(){
          DB = migrateData(incoming);
          saveData(); toast('Data restored from Excel'); nav('dashboard');
        }
      });
    }catch(e){ toast('That file could not be read as a ReY Events Excel export.'); console.error(e); }
  };
  reader.readAsArrayBuffer(file);
}
/* ================================ INIT ================================ */
var STARTED = false;
function whenAuthReady(cb){
  if(window.ReyAuth){ cb(); return; }
  var fired = false;
  function go(){ if(!fired){ fired = true; cb(); } }
  window.addEventListener('reyauth-ready', go, {once:true});
  setTimeout(go, 5000); // never hang on the loading card if the auth helper fails to load
}
function init(){
  if(STARTED) return;
  STARTED = true;
  renderAuthScreen('loading', {sub:'Signing you in…'});
  window.addEventListener('focus', function(){ if(DB) checkFollowupsDue(false); });
  window.addEventListener('beforeunload', function(e){
    if(!SAVE_DIRTY && !SAVE_INFLIGHT) return;
    var body = JSON.stringify({data: DB, version: DATA_VERSION});
    if(SAVE_DIRTY && !SAVE_INFLIGHT && body.length < 60000){
      try{ fetch(workspaceUrl(), {method:'PUT', credentials:'same-origin', keepalive:true, headers:{'Content-Type':'application/json'}, body: body}); SAVE_DIRTY = false; }catch(err){}
    }
    if(SAVE_DIRTY || SAVE_INFLIGHT){ e.preventDefault(); e.returnValue = ''; }
  });
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState==='hidden' && SAVE_DIRTY) flushSave(); });
  whenAuthReady(function(){
    var ready = window.ReyAuth ? window.ReyAuth.ready() : Promise.resolve();
    ready.then(function(){
      var cb = window.ReyAuth ? window.ReyAuth.callback() : null;
      if(cb && cb.type==='recovery'){ renderAuthScreen('newpass'); return; }
      var opts;
      if(cb && cb.type==='confirmation') opts = {tone:'ok', msg:'Email confirmed! Sign in to continue.'};
      if(cb && cb.type==='error') opts = {tone:'warn', msg:'That email link has expired or was already used. Sign in, or use "Forgot password?" to get a new link.'};
      if(window.ReyAuth) window.ReyAuth.clearCallback();
      checkSession(opts);
    });
  });
}

// expose functions used by inline HTML handlers
window.nav = nav; window.openInquiryForm = openInquiryForm; window.openInquiryDetail = openInquiryDetail;
window.markFollowupDone = markFollowupDone; window.markInquiryLost = markInquiryLost;
window.openFollowupForm = openFollowupForm; window.openConvertForm = openConvertForm;
window.openBookingDetail = openBookingDetail; window.saveAllocation = saveAllocation;
window.openPaymentForm = openPaymentForm; window.setBookingStatus = setBookingStatus; window.cancelBooking = cancelBooking;
window.openResourceForm = openResourceForm; window.deleteResource = deleteResource;
window.saveBizSettings = saveBizSettings; window.saveCapitalSettings = saveCapitalSettings; window.saveAllocSettings = saveAllocSettings;
window.requestNotifNow = requestNotifNow; window.lockApp = lockApp; window.clearSampleData = clearSampleData;
window.resetAppFromMore = resetAppFromMore; window.exportDataBackup = exportDataBackup;
window.openAdminUsers = openAdminUsers; window.openAdminUser = openAdminUser; window.adminUserAction = adminUserAction;
window.adminResetPassword = adminResetPassword; window.adminDeleteUser = adminDeleteUser; window.openAdminRequests = openAdminRequests;
window.adminResolveRequest = adminResolveRequest; window.openUserWorkspace = openUserWorkspace; window.exitUserWorkspace = exitUserWorkspace;
window.openChangePassword = openChangePassword;
window.exportExcelBackup = exportExcelBackup;
window.restoreFromFile = restoreFromFile; window.restoreFromExcelFile = restoreFromExcelFile; window.closeSheet = closeSheet; window.setBookingFilter = setBookingFilter;
window.openTileDetail = openTileDetail;
window.openSearchSheet = openSearchSheet;

document.addEventListener('DOMContentLoaded', init);
if(document.readyState==='complete' || document.readyState==='interactive') setTimeout(init, 0);
})();
