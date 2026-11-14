(function(){
"use strict";

/* ================================ CONSTANTS ================================ */

var EVENT_TYPES = ['Wedding','Birthday','Corporate Event','College Fest','Festival/Community','Sangeet','House Party','Other'];
var CHANNELS = ['Walk-In / Repeat / Referral','Instagram','Google Search','Wedding Listing Portal','Friends & Family','YouTube','Others'];
var INQUIRY_TYPES = ['New Client','Repeat Client','Referral'];
var PAY_METHODS = ['Cash','UPI','Bank Transfer','Card','Other'];
// Chennai locality -> area, from the owner's Location_List.xlsx. Typing in the location box
// suggests these; picking one fills the area. "Other" lets you type both by hand.
var LOCATION_LIST = [["Anna Nagar","North Chennai"],["Basin Bridge","North Chennai"],["Broadway","North Chennai"],["Ennore","North Chennai"],["Erukanchery","North Chennai"],["George Town","North Chennai"],["ICF Colony","North Chennai"],["Jamalia","North Chennai"],["Kathirvedu","North Chennai"],["Kathivakkam","North Chennai"],["Kodungaiyur","North Chennai"],["Korukkupet","North Chennai"],["Kosapet","North Chennai"],["Lakshmipuram","North Chennai"],["Madhavaram","North Chennai"],["Madhavaram Milk Colony","North Chennai"],["M.K.B. Nagar","North Chennai"],["Manali","North Chennai"],["Manali New Town","North Chennai"],["Manjambakkam","North Chennai"],["Mannadi","North Chennai"],["Mathur (Mathur MMDA, Periya Mathur, China Mathur) North Madras","North Chennai"],["Minjur","North Chennai"],["Moolakadai","North Chennai"],["Naravarikuppam","North Chennai"],["New Washermenpet","North Chennai"],["Old Washermenpet","North Chennai"],["Otteri","North Chennai"],["Park Town","North Chennai"],["Parry's Corner","North Chennai"],["Pattalam","North Chennai"],["Perambur","North Chennai"],["Periamet","North Chennai"],["Ponniammanmedu","North Chennai"],["Pulianthope","North Chennai"],["Puzhal","North Chennai"],["Red Hills","North Chennai"],["Royapuram","North Chennai"],["Selavoyal","North Chennai"],["Sembiam","North Chennai"],["Surapet","North Chennai"],["T.V.K. Nagar","North Chennai"],["Tiruvottiyur","North Chennai"],["Tondiarpet","North Chennai"],["Vallalar Nagar","North Chennai"],["Villivakkam","North Chennai"],["Vyasarpadi","North Chennai"],["Adambakkam","South Chennai"],["Adyar","South Chennai"],["Alandur","South Chennai"],["Besant Nagar","South Chennai"],["Chetpet","South Chennai"],["Chromepet","South Chennai"],["Egmore","South Chennai"],["Gopalapuram","South Chennai"],["Guindy","South Chennai"],["Hastinapuram","South Chennai"],["Injambakkam","South Chennai"],["Irumbuliyur","South Chennai"],["Kadaperi","South Chennai"],["Keelkattalai","South Chennai"],["Kolappakkam","South Chennai"],["Kottivakkam","South Chennai"],["Kovilambakkam","South Chennai"],["Madipakkam","South Chennai"],["Mambakkam","South Chennai"],["Medavakkam","South Chennai"],["Mudichur","South Chennai"],["Mylapore","South Chennai"],["Nagalkeni","South Chennai"],["Nanganallur","South Chennai"],["Neelankarai","South Chennai"],["Palavakkam","South Chennai"],["Pallavaram","South Chennai"],["Pallikaranai","South Chennai"],["Pammal","South Chennai"],["Pazhavanthangal","South Chennai"],["Peerkankaranai","South Chennai"],["Perungalathur","South Chennai"],["Perungudi","South Chennai"],["Pozhichur","South Chennai"],["Pudupet","South Chennai"],["Saidapet","South Chennai"],["Selaiyur","South Chennai"],["Sholinganallur","South Chennai"],["Tambaram","South Chennai"],["Taramani","South Chennai"],["Teynampet","South Chennai"],["Thiruvanmiyur","South Chennai"],["Thoraipakkam","South Chennai"],["Thousand Lights","South Chennai"],["Triplicane","South Chennai"],["T. Nagar","South Chennai"],["Vandalur","South Chennai"],["Varadharajapuram","South Chennai"],["Velachery","South Chennai"],["West Mambalam","South Chennai"],["Alapakkam","West Chennai"],["Alwarthirunagar","West Chennai"],["Ambattur","West Chennai"],["Aminjikarai","West Chennai"],["Arumbakkam","West Chennai"],["Ashok Nagar","West Chennai"],["Avadi","West Chennai"],["Ayanavaram","West Chennai"],["Ayappakkam","West Chennai"],["CMDA Colony","West Chennai"],["Defence Colony","West Chennai"],["Gerugambakkam","West Chennai"],["Iyyapanthangal","West Chennai"],["Karambakkam","West Chennai"],["K.K. Nagar","West Chennai"],["Korattur","West Chennai"],["Kovur","West Chennai"],["Koyambedu","West Chennai"],["Kundrathur","West Chennai"],["Maduravoyal","West Chennai"],["Mangadu","West Chennai"],["Mannurpet","West Chennai"],["M.G.R. Garden","West Chennai"],["M.G.R. Nagar","West Chennai"],["Mogappair","West Chennai"],["Mowlivakkam","West Chennai"],["Mugalivakkam","West Chennai"],["Nandambakkam","West Chennai"],["Nerkundrum","West Chennai"],["Nesapakkam","West Chennai"],["Nolambur","West Chennai"],["Padi","West Chennai"],["Pattabiram","West Chennai"],["Poonamallee","West Chennai"],["Porur","West Chennai"],["Pudur","West Chennai"],["Ramapuram","West Chennai"],["Saligramam","West Chennai"],["Sikkarayapuram","West Chennai"],["Thirumangalam","West Chennai"],["Thirumazhisai","West Chennai"],["Thirumullaivayal","West Chennai"],["Thirunindravur","West Chennai"],["Thiruverkadu","West Chennai"],["Vadapalani","West Chennai"],["Valasaravakkam","West Chennai"],["Virugambakkam","West Chennai"]];
var LOC_OTHER = '__other';
var MONEY_FLOWS = [
  {key:'', label:'No money effect'},
  {key:'in', label:'Money in (+)'},
  {key:'out', label:'Money out (−)'}
];
var DEFAULT_EXPENSE_TYPES = ['Salary','Crew wages','Fuel','Food & refreshments','Equipment rental','Miscellaneous','Additional expenses'];
var NEW_TYPE_CHIP = '+ New type';
function browserTz(){ try{ return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'; }catch(e){ return 'Asia/Kolkata'; } }
var CAL_METHODS = [
  {key:'google', label:'Google Calendar'},
  {key:'google-classic', label:'Google Calendar (classic link)'},
  {key:'ics', label:'Phone calendar app (.ics file)'}
];
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
function todayStr(){ return localDateTimeStr(new Date()).slice(0,10); }
function nowIso(){ return new Date().toISOString(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function fmtDate(d){ if(!d) return '—'; var dt=new Date(d+'T00:00:00'); if(isNaN(dt)) return d; return dt.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }
function fmtDateShort(d){ if(!d) return '—'; var dt=new Date(d+'T00:00:00'); if(isNaN(dt)) return d; return dt.toLocaleDateString('en-IN',{day:'numeric',month:'short'}); }
function fmtDateTime(iso){ if(!iso) return '—'; var dt=new Date(iso); return dt.toLocaleDateString('en-IN',{day:'numeric',month:'short'}) + ', ' + dt.toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}); }
function fmtMoney(n){ n = Number(n)||0; return (n<0?'-':'') + '₹' + Math.abs(n).toLocaleString('en-IN',{maximumFractionDigits:0}); }
function initials(name){ if(!name) return '?'; var parts=name.trim().split(/\s+/); return (parts[0][0]+(parts[1]?parts[1][0]:'')).toUpperCase(); }
function localDateTimeStr(d){ function z(n){return (n<10?'0':'')+n;} return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'T'+z(d.getHours())+':'+z(d.getMinutes()); }
function fmtTime(t){ if(!t) return ''; var p=String(t).split(':'); var d=new Date(2000,0,1,Number(p[0])||0,Number(p[1])||0); return d.toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}); }
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
    inquiries: [], followups: [], bookings: [], resources: [], expenses: [],
    settings: {
      expenseTypes: DEFAULT_EXPENSE_TYPES.slice(),
      calendar: {method:'google', account:'', timezone: browserTz(), defaultDurationHrs: 5},
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
  d.expenses = d.expenses || [];
  if(!Array.isArray(d.settings.expenseTypes)) d.settings.expenseTypes = DEFAULT_EXPENSE_TYPES.slice();
  if(!d.settings.calendar || typeof d.settings.calendar!=='object') d.settings.calendar = {};
  for(var c in def.calendar){ if(!(c in d.settings.calendar)) d.settings.calendar[c] = def.calendar[c]; }
  d.bookings.forEach(function(b){
    b.payments = Array.isArray(b.payments) ? b.payments : [];
    b.discounts = Array.isArray(b.discounts) ? b.discounts : [];
    // Allocation used to be one equipment + one transport; it's now a list of each.
    if(!Array.isArray(b.equipmentResourceIds)) b.equipmentResourceIds = b.equipmentResourceId ? [b.equipmentResourceId] : [];
    if(!Array.isArray(b.transportResourceIds)) b.transportResourceIds = b.transportResourceId ? [b.transportResourceId] : [];
    delete b.equipmentResourceId; delete b.transportResourceId;
    if(!Array.isArray(b.extraResourceIds)) b.extraResourceIds = [];
    if(!b.allocCustom || typeof b.allocCustom!=='object') b.allocCustom = {};
    ['equipment','transport','other'].forEach(function(k){ if(typeof b.allocCustom[k]!=='string') b.allocCustom[k] = ''; });
  });
  d.resources.forEach(function(r){
    if(r.flow!=='in' && r.flow!=='out') r.flow = '';
    r.amount = Number(r.amount)||0;
  });
  d.inquiries.forEach(function(i){ syncInquiryStatus(i, d); });
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
      altPhone:'', location:'Anna Nagar', area:'North Chennai', partyHall:'', eventType:s.eventType, channel:s.channel, inquiryType:'New Client',
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
      phone: convertedInq.phone, altPhone:'', location: convertedInq.location, area: convertedInq.area, partyHall: convertedInq.partyHall, channel: convertedInq.channel,
      totalAmount: 9000, advanceAmount: 3000, advanceDate: offset(-5),
      payments:[{id:uid('PAY'), amount:3000, date:offset(-5), method:'UPI', note:'Advance payment', isAdvance:true}], discounts:[],
      equipmentResourceIds: [d.resources[0].id], transportResourceIds: [], extraResourceIds: [], allocCustom:{equipment:'',transport:'',other:''},
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
      '<div class="field"><label>Choose a password</label><input type="password" id="suPass1" autocomplete="new-password" placeholder="At least 8 characters"></div>' +
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
      if(p1.length<8){ toast('Password must be at least 8 characters'); return; }
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
      '<div class="field"><label>New password</label><input type="password" id="npPass1" autocomplete="new-password" placeholder="At least 8 characters"></div>' +
      '<div class="field"><label>Confirm new password</label><input type="password" id="npPass2" autocomplete="new-password" placeholder="Re-enter new password"></div>' +
      '<button class="btn primary" id="npBtn">Set new password</button>';
    onEnter(['npPass2'], 'npBtn');
    document.getElementById('npBtn').onclick = function(){
      var btn = this, p1 = val('npPass1'), p2 = val('npPass2');
      if(p1.length<8){ toast('Password must be at least 8 characters'); return; }
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
      '<div class="field" style="margin-bottom:10px;"><label>New password for '+esc(u.username)+'</label><input type="text" id="admNewPass" autocomplete="off" placeholder="At least 8 characters"></div>' +
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
  if(p.length<8){ toast('Password must be at least 8 characters'); return; }
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
    '<div class="field"><label>New password</label><input type="password" id="cpNew1" autocomplete="new-password" placeholder="At least 8 characters"></div>' +
    '<div class="field"><label>Confirm new password</label><input type="password" id="cpNew2" autocomplete="new-password"></div>',
    '<button class="btn primary" id="cpBtn">Update password</button>');
  document.getElementById('cpBtn').onclick = function(){
    var btn = this, cur = val('cpCur'), n1 = val('cpNew1'), n2 = val('cpNew2');
    if(!cur){ toast('Enter your current password'); return; }
    if(n1.length<8){ toast('Password must be at least 8 characters'); return; }
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
  document.getElementById('fabBtn').setAttribute('aria-label', tab==='expenses' ? 'New expense' : 'New inquiry');
  if(renderers[tab]) renderers[tab]();
}

function fabAction(){ if(currentTab==='expenses') openExpenseForm(); else openInquiryForm(); }
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

/* ---- Location picker: type a few letters, pick a Chennai locality and its area fills in.
   "Other" switches to free text for both the location and the area. ---- */
function findLoc(name){
  var n = String(name||'').trim().toLowerCase();
  if(!n) return null;
  return LOCATION_LIST.find(function(x){ return x[0].toLowerCase()===n; }) || null;
}
function locationPickerHtml(pfx, loc, area){
  loc = String(loc||'').replace(/^(Other|Out of Station):\s*/,''); // older entries were saved as "Other: <typed text>"
  var known = findLoc(loc);
  var other = !!(loc && !known);
  return '<div class="field"><label>Event location</label>' +
      '<div class="loc-wrap">' +
        '<input type="text" id="'+pfx+'Loc" autocomplete="off" data-mode="'+(other?'other':'list')+'" placeholder="Start typing, e.g. Anna Nagar" value="'+esc(known?known[0]:(loc||''))+'">' +
        '<div class="loc-sugg" id="'+pfx+'LocSugg" hidden></div>' +
      '</div>' +
      '<div class="hint" id="'+pfx+'LocOtherHint" style="'+(other?'':'display:none;')+'">Typing your own location and area. <a href="#" id="'+pfx+'LocBack">Pick from the list instead</a></div>' +
    '</div>' +
    '<div class="field"><label>Area</label><input type="text" id="'+pfx+'Area" placeholder="'+(other?'Type the area':'Fills in when you pick a location')+'" value="'+esc(known?known[1]:(area||''))+'"'+(other?'':' readonly')+'></div>';
}
function wireLocationPicker(pfx){
  var inp = document.getElementById(pfx+'Loc'), sugg = document.getElementById(pfx+'LocSugg');
  var area = document.getElementById(pfx+'Area'), hint = document.getElementById(pfx+'LocOtherHint');
  function setMode(m){
    inp.dataset.mode = m; area.readOnly = m!=='other';
    area.placeholder = m==='other' ? 'Type the area' : 'Fills in when you pick a location';
    hint.style.display = m==='other' ? '' : 'none';
  }
  function render(){
    if(inp.dataset.mode==='other'){ sugg.hidden = true; return; }
    var q = inp.value.trim().toLowerCase(), starts = [], contains = [];
    LOCATION_LIST.forEach(function(x, k){
      var n = x[0].toLowerCase();
      if(!q || n.indexOf(q)===0) starts.push(k); else if(n.indexOf(q)>-1) contains.push(k);
    });
    var ks = starts.concat(contains).slice(0, 8);
    sugg.innerHTML = ks.map(function(k){
      return '<button type="button" class="loc-opt" data-k="'+k+'"><b>'+esc(LOCATION_LIST[k][0])+'</b><span>'+esc(LOCATION_LIST[k][1])+'</span></button>';
    }).join('') + '<button type="button" class="loc-opt loc-other" data-k="other"><b>Other</b><span>Not in the list — type the location &amp; area</span></button>';
    sugg.hidden = false;
  }
  inp.addEventListener('input', function(){
    if(inp.dataset.mode==='other' && !inp.value.trim()){ setMode('list'); area.value = ''; }
    if(inp.dataset.mode!=='other'){ var m = findLoc(inp.value); area.value = m ? m[1] : ''; }
    render();
  });
  inp.addEventListener('focus', render);
  inp.addEventListener('blur', function(){ setTimeout(function(){ sugg.hidden = true; }, 200); });
  sugg.addEventListener('mousedown', function(e){ e.preventDefault(); });
  sugg.addEventListener('click', function(e){
    var btn = e.target.closest('.loc-opt'); if(!btn) return;
    if(btn.dataset.k==='other'){ setMode('other'); area.value = ''; sugg.hidden = true; inp.focus(); return; }
    var x = LOCATION_LIST[Number(btn.dataset.k)];
    inp.value = x[0]; area.value = x[1]; sugg.hidden = true; inp.blur();
  });
  document.getElementById(pfx+'LocBack').addEventListener('click', function(e){
    e.preventDefault(); setMode('list');
    var m = findLoc(inp.value); area.value = m ? m[1] : '';
    inp.focus();
  });
}
// Returns {location, area} or {error}. Pass optional=true to allow an empty location.
function readLocationPicker(pfx, optional){
  var inp = document.getElementById(pfx+'Loc');
  var loc = inp.value.trim(), area = document.getElementById(pfx+'Area').value.trim();
  if(!loc) return optional ? {location:'', area:''} : {error:'Pick an event location'};
  if(inp.dataset.mode==='other') return {location:loc, area:area};
  var m = findLoc(loc);
  if(!m) return {error:'Pick "'+loc+'" from the list, or choose Other to type it yourself'};
  return {location:m[0], area:m[1]};
}

/* ================================ CONFLICT CHECK ================================ */
function findConflictingBooking(eventDate, excludeId){
  return DB.bookings.find(function(b){
    return b.eventDate === eventDate && isLiveBooking(b) && b.id !== excludeId;
  });
}

/* ================================ DASHBOARD ================================ */
function computeHealth(){
  var s = DB.settings;
  var now = new Date();
  var y1start = new Date(now); y1start.setFullYear(y1start.getFullYear()-1);
  var y2start = new Date(now); y2start.setFullYear(y2start.getFullYear()-2);
  function revInRange(from,to){
    return liveBookings().filter(function(b){ return b.eventDate>=from.toISOString().slice(0,10) && b.eventDate<to.toISOString().slice(0,10); })
      .reduce(function(sum,b){return sum+bookingNet(b);},0);
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

  var activeBookings = liveBookings();
  var totalDue = activeBookings.reduce(function(s2,b){return s2+bookingNet(b);},0);
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
  var fromBookings = liveBookings().reduce(function(sum,b){
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
function balanceDue(b){ return Math.max(bookingNet(b) - paidSoFarAll(b), 0); }
function paidSoFarAll(b){
  return (b.payments||[]).reduce(function(s,p){return s+(Number(p.amount)||0);},0);
}

/* ---- Booking state: an inquiry only counts as a booking once money has been paid against it.
   Delete every payment (e.g. the advance is cancelled) and it drops back to the inquiry list.
   The booking record is kept as a draft so its quote, allocation and expenses aren't lost. ---- */
function hasPayment(b){ return paidSoFarAll(b) > 0; }
function isLiveBooking(b){ return b.status!=='cancelled' && hasPayment(b); }
function liveBookings(){ return DB.bookings.filter(isLiveBooking); }
function bookingForInquiry(inqId, d){
  d = d || DB;
  var list = d.bookings.filter(function(b){ return inqId && b.inquiryId===inqId; });
  return list.find(isLiveBooking) || list.find(hasPayment) || list.find(function(b){return b.status!=='cancelled';}) || list[0] || null;
}
function syncInquiryStatus(inq, d){
  d = d || DB;
  if(!inq) return;
  var booked = d.bookings.some(function(b){ return b.inquiryId===inq.id && hasPayment(b); });
  if(booked){ inq.status = 'converted'; return; }
  if(inq.status==='converted'){
    var hasFu = d.followups.some(function(f){ return f.inquiryId===inq.id && !f.done; });
    inq.status = hasFu ? 'followup' : 'open';
  }
}
// Call after any payment change. Keeps the inquiry's status and the advance fields in step.
function afterPaymentChange(b){
  var adv = (b.payments||[]).find(function(p){ return p.isAdvance || p.note==='Advance payment' || p.method==='Advance'; });
  b.advanceAmount = adv ? (Number(adv.amount)||0) : 0;
  b.advanceDate = adv ? adv.date : '';
  var inq = DB.inquiries.find(function(x){return x.id===b.inquiryId;});
  var before = inq ? inq.status : null;
  syncInquiryStatus(inq);
  if(inq && before==='converted' && inq.status!=='converted') toast('No payment left — moved back to Inquiries');
  if(inq && before!=='converted' && inq.status==='converted') toast('Payment received — now a booking');
}

/* ---- Money: discounts lower what the client pays; resources marked "money in" add to it,
   resources marked "money out" (e.g. complimentary items) are a cost against profit. ---- */
function discountTotal(b){ return (b.discounts||[]).reduce(function(s,x){return s+(Number(x.amount)||0);},0); }
function allocatedResources(b){
  var ids = [].concat(b.equipmentResourceIds||[], b.transportResourceIds||[], b.extraResourceIds||[]);
  return DB.resources.filter(function(r){ return ids.indexOf(r.id)>-1; });
}
function resourceMoney(b, flow){
  return allocatedResources(b).filter(function(r){return r.flow===flow;}).reduce(function(s,r){return s+(Number(r.amount)||0);},0);
}
function bookingNet(b){ return Math.max((Number(b.totalAmount)||0) - discountTotal(b), 0) + resourceMoney(b,'in'); }
function bookingCosts(b){ return expenseTotal(expensesFor(b.id)) + resourceMoney(b,'out'); }

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
  var openInq = DB.inquiries.filter(isOpenInquiry).length;
  var totalBookings = liveBookings().length;
  var totalRevenue = liveBookings().reduce(function(s,b){return s+bookingNet(b);},0);
  var totalEvents = DB.bookings.filter(function(b){return b.status==='completed' && hasPayment(b);}).length;
  var convRate = health.convRate*100;
  var avgBooking = totalBookings>0 ? totalRevenue/totalBookings : 0;
  var pendingBookings = liveBookings().filter(function(b){return balanceDue(b)>0;});
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
    spendDashHtml() +
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
function spendDashHtml(){
  var t = spendTotals();
  var spentPct = t.revenue>0 ? clamp(t.total/t.revenue*100,0,100) : (t.total>0?100:0);
  return '<div class="section-title">Spend &amp; profit</div>' +
    '<div class="card" style="margin-bottom:10px;cursor:pointer;" onclick="openSpendSummary()">' +
      '<div class="tiles" style="grid-template-columns:1fr 1fr 1fr;gap:8px;">' +
        '<div><div class="tlabel" style="font-size:11px;color:var(--ink-dim);font-weight:600;">Revenue</div><div class="num" style="font-weight:700;font-family:Sora,sans-serif;">'+fmtMoney(t.revenue)+'</div></div>' +
        '<div><div class="tlabel" style="font-size:11px;color:var(--ink-dim);font-weight:600;">Expenses</div><div class="num" style="font-weight:700;font-family:Sora,sans-serif;color:var(--warn)">'+fmtMoney(t.total)+'</div></div>' +
        '<div><div class="tlabel" style="font-size:11px;color:var(--ink-dim);font-weight:600;">Profit</div><div class="num" style="font-weight:700;font-family:Sora,sans-serif;color:'+profitColor(t.profit)+'">'+fmtMoney(t.profit)+'</div></div>' +
      '</div>' +
      '<div class="segbar"><i style="width:'+spentPct+'%;background:var(--warn)"></i></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--ink-dim);margin-top:6px;">' +
        '<span>'+(t.revenue>0 ? spentPct.toFixed(0)+'% of revenue spent · '+t.margin.toFixed(0)+'% margin' : 'No revenue yet')+'</span><span style="color:var(--primary);font-weight:700;">Per event ›</span></div>' +
    '</div>';
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
      '<td class="num">'+fmtMoney(bookingNet(b))+'</td>' +
      '<td class="num">'+fmtMoney(balanceDue(b))+'</td>' +
      '<td><span class="badge '+b.status+'">'+b.status+'</span></td>' +
    '</tr>';
  }).join('');
  var total = list.reduce(function(s,b){return s+bookingNet(b);},0);
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
      '<td><span class="badge '+i.status+'">'+statusLabel(i.status)+'</span></td>' +
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
    return '<tr><td><span class="badge '+st+'">'+statusLabel(st)+'</span></td><td class="num">'+count+'</td><td class="num">'+pct.toFixed(1)+'%</td></tr>';
  }).join('');
  var converted = DB.inquiries.filter(function(i){return i.status==='converted';}).length;
  return '<div style="overflow-x:auto;"><table class="dtable"><thead><tr><th>Status</th><th class="num">Count</th><th class="num">% of total</th></tr></thead>' +
    '<tbody>'+rows+'</tbody>' +
    '<tfoot><tr><td colspan="3">'+total+' total inquiries &middot; '+converted+' converted to bookings</td></tr></tfoot></table></div>';
}
function paybackTableHtml(kind){
  var s = DB.settings;
  var list = liveBookings().slice().sort(byEventDateDesc);
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
  var activeBookings = liveBookings().slice().sort(byEventDateDesc);
  var title, html;
  if(kind==='events'){
    var completed = DB.bookings.filter(function(b){return b.status==='completed' && hasPayment(b);}).slice().sort(byEventDateDesc);
    title = 'Completed Events'; html = bookingsTableHtml(completed);
  } else if(kind==='openInquiries'){
    var openInqs = DB.inquiries.filter(isOpenInquiry)
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
// One "Follow-ups" chip (the reminder list). The old separate "Followup" status chip was a duplicate.
var INQ_FILTERS = ['active','duefollowups','open','converted','lost','all'];
var INQ_FILTER_LABELS = {active:'Active', duefollowups:'Follow-ups', open:'Open', converted:'Booked', lost:'Lost', all:'All'};
var STATUS_LABELS = {open:'open', followup:'follow-up', converted:'booked', lost:'lost'};
function statusLabel(st){ return STATUS_LABELS[st] || st; }
function isOpenInquiry(i){ return i.status==='open' || i.status==='followup'; }
// Soonest event first; inquiries without an event date go to the end (by inquiry date).
function byEventDateAsc(a,b){
  var ad = a.eventDate || '', bd = b.eventDate || '';
  if(ad && bd && ad!==bd) return ad < bd ? -1 : 1;
  if(!ad !== !bd) return ad ? -1 : 1;
  return (a.inquiryDate||'').localeCompare(b.inquiryDate||'');
}
function locationText(rec){
  if(!rec) return '';
  return [rec.partyHall, rec.location, rec.area].filter(function(x){return x && String(x).trim();}).join(', ');
}
function renderInquiries(){
  var el = document.getElementById('view-inquiries');
  var chipsHtml = '<div class="chipwrap" id="inqFilterChips" style="margin-bottom:14px;">' +
      INQ_FILTERS.map(function(f){
        return '<button class="chip'+(inquiryFilter===f?' sel':'')+'" data-f="'+f+'">'+esc(INQ_FILTER_LABELS[f]||f)+'</button>';
      }).join('') +
    '</div>';

  if(inquiryFilter==='duefollowups'){
    el.innerHTML =
      '<h2 class="disp" style="margin:2px 0 12px;">Inquiries</h2>' + chipsHtml +
      '<div class="hint" style="margin-bottom:10px;">Everything you still need to follow up on, soonest first.</div>' +
      '<div class="card" style="padding:6px 10px;">' + renderFollowupTaskRows() + '</div>';
  } else {
    if(INQ_FILTERS.indexOf(inquiryFilter)===-1) inquiryFilter = 'active';
    var list = DB.inquiries.slice().sort(function(a,b){ return new Date(b.createdAt)-new Date(a.createdAt); });
    if(inquiryFilter==='all') list.sort(byEventDateAsc);
    else if(inquiryFilter==='active') list = list.filter(isOpenInquiry);
    else if(inquiryFilter==='open') list = list.filter(isOpenInquiry).filter(function(i){return i.status==='open';});
    else list = list.filter(function(i){return i.status===inquiryFilter;});

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
        calButton(followupCalEvent(f, inq?inq.name:''), 'Calendar') +
        '<button class="btn ghost sm" onclick="markFollowupDone(\''+f.id+'\',\''+f.inquiryId+'\',true)">Done</button>' +
      '</div>' +
    '</div>';
  }).join('');
}
function emptyState(title, sub){
  return '<div class="empty"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke-width="1.6"/><path d="M9 12h6M12 9v6" stroke-width="1.6" stroke-linecap="round"/></svg><p><b>'+esc(title)+'</b><br>'+esc(sub)+'</p></div>';
}
function inquiryRow(i){
  var b = bookingForInquiry(i.id);
  var money = b ? ('<div class="row-sub num" style="margin-top:3px;">'+(hasPayment(b) ? fmtMoney(paidSoFarAll(b))+' paid' : 'Quote '+fmtMoney(bookingNet(b)))+'</div>') : '';
  return '<div class="list-row" onclick="openInquiryDetail(\''+i.id+'\')" style="cursor:pointer;">' +
    '<div class="avatar">'+initials(i.name)+'</div>' +
    '<div class="row-main">' +
      '<div class="row-title">'+esc(i.name)+'</div>' +
      '<div class="row-sub">'+esc(i.eventType)+' · '+fmtDateShort(i.eventDate)+' · '+esc(i.partyHall || i.location || i.channel)+'</div>' +
    '</div>' +
    '<div class="row-end"><span class="badge '+i.status+'">'+statusLabel(i.status)+'</span>'+money+'</div>' +
  '</div>';
}
renderers.inquiries = renderInquiries;

function setBookingFilter(f){ bookingFilter=f; nav('bookings'); }

/* ---- New / edit inquiry form ---- */
function openInquiryForm(prefill, editId){
  var editing = editId ? DB.inquiries.find(function(x){return x.id===editId;}) : null;
  if(editId && !editing) return;
  prefill = editing || prefill || {};
  var ownBooking = editing ? bookingForInquiry(editing.id) : null;
  var f = {
    inquiryDate: prefill.inquiryDate || todayStr(),
    name: prefill.name||'', phone: prefill.phone||'', altPhone: prefill.altPhone||'', email: prefill.email||'',
    location: prefill.location||'', area: prefill.area||'', partyHall: prefill.partyHall||'', eventType: prefill.eventType||'', channel: prefill.channel||'',
    inquiryType: prefill.inquiryType||'New Client', eventDate: prefill.eventDate||'', eventTime: prefill.eventTime||'', notes: prefill.notes||''
  };
  function presetOr(list, v){ return !v || list.indexOf(v)>-1 ? v : null; }
  // Values typed into an "Other" box come back as free text: select the Other chip and refill the box.
  var etSel = presetOr(EVENT_TYPES, f.eventType), etOther = etSel===null ? f.eventType.replace(/^Other:\s*/,'') : '';
  var chSel = presetOr(CHANNELS, f.channel), chOther = chSel===null ? f.channel.replace(/^Others:\s*/,'') : '';
  if(etSel===null) etSel = 'Other'; if(chSel===null) chSel = 'Others';
  var body =
    '<div class="field"><label>Inquiry date</label><input type="date" id="fInqDate" value="'+f.inquiryDate+'"></div>' +
    '<div class="field"><label>Client name</label><input type="text" id="fName" placeholder="Full name" value="'+esc(f.name)+'"></div>' +
    '<div class="field"><label>Phone</label><input type="tel" id="fPhone" placeholder="10-digit mobile" value="'+esc(f.phone)+'"></div>' +
    '<div class="field"><label>Alternate contact <span style="opacity:.6">(optional)</span></label><input type="tel" id="fAltPhone" value="'+esc(f.altPhone)+'"></div>' +
    '<div class="field"><label>Email <span style="opacity:.6">(optional)</span></label><input type="text" id="fEmail" placeholder="name@example.com" value="'+esc(f.email)+'"></div>' +
    '<div class="field"><label>Party hall / venue name <span style="opacity:.6">(optional)</span></label><input type="text" id="fPartyHall" placeholder="e.g. Sri Lakshmi Mahal" value="'+esc(f.partyHall)+'"></div>' +
    locationPickerHtml('f', f.location, f.area) +
    '<div class="field"><label>Event type</label>' + chips('fEventType', EVENT_TYPES, etSel) +
      otherBox('fEventTypeOther', 'Type the event type', etSel==='Other') + '</div>' +
    '<div class="field"><label>Enquiry channel</label>' + chips('fChannel', CHANNELS, chSel) +
      otherBox('fChannelOther', 'Type the channel', chSel==='Others') + '</div>' +
    '<div class="field"><label>Inquiry type</label>' + chips('fInquiryType', INQUIRY_TYPES, f.inquiryType) + '</div>' +
    '<div class="field"><label>Event date <span style="opacity:.6">(optional)</span></label><input type="date" id="fEventDate" value="'+esc(f.eventDate)+'"></div>' +
    '<div class="field"><label>Event start time <span style="opacity:.6">(optional)</span></label><input type="time" id="fEventTime" value="'+esc(f.eventTime)+'"></div>' +
    '<div id="conflictBox"></div>' +
    (editing ? '' : '<div class="section-title" style="margin-top:6px;">Follow-up reminder <span style="opacity:.6;text-transform:none;font-weight:600;">(optional)</span></div>' +
    '<div class="field"><label>Remind me on</label><input type="datetime-local" id="fFollowupAt" value=""></div>' +
    '<div class="field"><label>Reminder note <span style="opacity:.6">(optional)</span></label><input type="text" id="fFollowupNote" placeholder="e.g. Call back with quote"></div>' +
    '<div id="fCalLinkWrap" style="display:none;margin:-6px 0 14px;"><button type="button" class="btn ghost sm" id="fCalLink">Add reminder to calendar</button></div>') +
    (ownBooking ? '<div class="hint" style="margin-bottom:14px;">This inquiry has a booking. Name, phone, venue, location, event type and channel changes are copied to the booking too.</div>' : '') +
    '<div class="field"><label>Notes <span style="opacity:.6">(optional)</span></label><textarea id="fNotes" placeholder="Anything else to remember">'+esc(f.notes)+'</textarea></div>';
  var foot = '<button class="btn primary" id="saveInqBtn">'+(editing?'Save changes':'Save inquiry')+'</button>';
  openSheet(editing?'Edit Inquiry':'New Inquiry', body, foot);
  if(etOther) document.getElementById('fEventTypeOther').value = etOther;
  if(chOther) document.getElementById('fChannelOther').value = chOther;
  wireLocationPicker('f');
  wireChips('fEventType', false, function(){});
  wireOtherBox('fEventType', 'fEventTypeOther', ['Other']);
  wireChips('fChannel', false, function(){});
  wireOtherBox('fChannel', 'fChannelOther', ['Others']);
  wireChips('fInquiryType', false, function(){});
  document.getElementById('fEventDate').addEventListener('change', checkFormConflict);
  checkFormConflict();

  function syncCalLink(){
    if(!document.getElementById('fFollowupAt')) return;
    var at = document.getElementById('fFollowupAt').value;
    var wrap = document.getElementById('fCalLinkWrap');
    if(!at){ wrap.style.display = 'none'; return; }
    var note = document.getElementById('fFollowupNote').value.trim();
    var nm = document.getElementById('fName').value.trim() || 'Inquiry';
    var ev = followupCalEvent({dueAt: new Date(at).toISOString(), note: note}, nm);
    document.getElementById('fCalLink').onclick = function(){ openCalendarEvent(ev); };
    wrap.style.display = '';
  }
  if(!editing){
    document.getElementById('fFollowupAt').addEventListener('input', syncCalLink);
    document.getElementById('fFollowupAt').addEventListener('change', syncCalLink);
    document.getElementById('fFollowupNote').addEventListener('input', syncCalLink);
    document.getElementById('fName').addEventListener('input', syncCalLink);
  }

  function checkFormConflict(){
    var d = document.getElementById('fEventDate').value;
    var box = document.getElementById('conflictBox');
    if(!d){ box.innerHTML=''; return; }
    var conflict = findConflictingBooking(d, ownBooking ? ownBooking.id : null);
    if(conflict){
      box.innerHTML = '<div class="modal warnbox" style="margin:0 0 16px;padding:11px 13px;">Already booked on '+fmtDate(d)+': <b>'+esc(conflict.name)+'</b> ('+esc(conflict.eventType)+'). You can still take this inquiry.</div>';
    } else box.innerHTML = '';
  }

  document.getElementById('saveInqBtn').onclick = function(){
    var inquiryDate = document.getElementById('fInqDate').value;
    var name = document.getElementById('fName').value.trim();
    var phone = document.getElementById('fPhone').value.trim();
    var eventDate = document.getElementById('fEventDate').value;
    var locPick = readLocationPicker('f');
    var location = locPick.location, area = locPick.area;
    var partyHall = document.getElementById('fPartyHall').value.trim();
    var eventType = chipValueWithOther('fEventType','fEventTypeOther',['Other']);
    var channel = chipValueWithOther('fChannel','fChannelOther',['Others']);
    var inquiryType = getChipValue('fInquiryType', false);
    if(!inquiryDate){ toast('Pick the inquiry date'); return; }
    if(!name){ toast('Enter the client name'); return; }
    if(!phone){ toast('Enter the phone number'); return; }
    if(locPick.error){ toast(locPick.error); return; }
    if(!eventType){ toast('Pick an event type'); return; }
    if(!channel){ toast('Pick an enquiry channel'); return; }
    if(!inquiryType){ toast('Pick an inquiry type'); return; }
    var save = function(){
      if(editing){
        editing.inquiryDate = inquiryDate; editing.name = name; editing.phone = phone;
        editing.altPhone = document.getElementById('fAltPhone').value.trim();
        editing.email = document.getElementById('fEmail').value.trim();
        editing.location = location; editing.area = area; editing.partyHall = partyHall;
        editing.eventType = eventType; editing.channel = channel; editing.inquiryType = inquiryType;
        editing.eventDate = eventDate; editing.eventTime = document.getElementById('fEventTime').value;
        editing.notes = document.getElementById('fNotes').value.trim(); editing.updatedAt = nowIso();
        if(ownBooking){
          ownBooking.name = name; ownBooking.phone = phone; ownBooking.altPhone = editing.altPhone;
          ownBooking.location = location; ownBooking.area = area; ownBooking.partyHall = partyHall;
          ownBooking.channel = channel; ownBooking.eventType = eventType;
        }
        saveData(); openInquiryDetail(editing.id); if(renderers[currentTab]) renderers[currentTab]();
        toast('Inquiry updated');
        return;
      }
      var followupAt = document.getElementById('fFollowupAt').value;
      var rec = {
        id: uid('INQ'), createdAt: nowIso(),
        inquiryDate: inquiryDate || todayStr(),
        name:name, phone:phone, altPhone: document.getElementById('fAltPhone').value.trim(),
        email: document.getElementById('fEmail').value.trim(),
        location: location, area: area, partyHall: partyHall,
        eventType: eventType,
        channel: channel,
        inquiryType: inquiryType,
        eventDate: eventDate, eventTime: document.getElementById('fEventTime').value, notes: document.getElementById('fNotes').value.trim(),
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
    var conflict = eventDate ? findConflictingBooking(eventDate, ownBooking ? ownBooking.id : null) : null;
    if(editing && editing.eventDate===eventDate) conflict = null; // date unchanged — don't nag again
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
  var bk = bookingForInquiry(id);
  var body =
    '<div class="card" style="margin-bottom:14px;">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">' +
        '<div class="avatar" style="width:46px;height:46px;font-size:16px;">'+initials(i.name)+'</div>' +
        '<div><div style="font-weight:700;font-size:16px;">'+esc(i.name)+'</div><span class="badge '+i.status+'">'+statusLabel(i.status)+'</span></div>' +
      '</div>' +
      '<div class="kv"><span class="k">Phone</span><span class="v">'+esc(i.phone||'—')+(i.altPhone?(' / '+esc(i.altPhone)):'')+'</span></div>' +
      (i.email ? '<div class="kv"><span class="k">Email</span><span class="v">'+esc(i.email)+'</span></div>' : '') +
      '<div class="kv"><span class="k">Party hall</span><span class="v">'+esc(i.partyHall||'—')+'</span></div>' +
      '<div class="kv"><span class="k">Location</span><span class="v">'+esc(i.location||'—')+'</span></div>' +
      '<div class="kv"><span class="k">Area</span><span class="v">'+esc(i.area||'—')+'</span></div>' +
      '<div class="kv"><span class="k">Event type</span><span class="v">'+esc(i.eventType)+'</span></div>' +
      '<div class="kv"><span class="k">Event date</span><span class="v">'+fmtDate(i.eventDate)+(i.eventTime?' · '+fmtTime(i.eventTime):'')+'</span></div>' +
      '<div class="kv"><span class="k">Channel</span><span class="v">'+esc(i.channel||'—')+'</span></div>' +
      '<div class="kv"><span class="k">Inquiry type</span><span class="v">'+esc(i.inquiryType||'—')+'</span></div>' +
      '<div class="kv"><span class="k">Inquiry date</span><span class="v">'+fmtDate(i.inquiryDate)+'</span></div>' +
      (i.notes ? '<div class="kv"><span class="k">Notes</span><span class="v" style="text-align:right;max-width:60%;">'+esc(i.notes)+'</span></div>' : '') +
    '</div>' +
    (bk ? inquiryBookingCardHtml(bk) : '') +
    '<div class="section-title">Follow-ups <span style="opacity:.6;text-transform:none;font-weight:600;">— tap one to edit</span></div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      (fups.length ? fups.map(function(f){
        return '<div class="linkrow">' +
          '<span style="cursor:pointer;flex:1;text-decoration:'+(f.done?'line-through':'none')+';opacity:'+(f.done?'.5':'1')+'" onclick="openFollowupForm(\''+id+'\',\''+f.id+'\')">'+esc(f.note||'Follow up')+' — '+fmtDateTime(f.dueAt)+' <span class="edit-ic" style="color:var(--primary);font-size:11.5px;">Edit</span></span>' +
          (!f.done ? (
            '<span style="display:flex;gap:6px;">' +
            calButton(followupCalEvent(f, i.name), 'Calendar') +
            '<button class="btn ghost sm" onclick="markFollowupDone(\''+f.id+'\',\''+id+'\')">Done</button>' +
            '</span>'
          ) : '') +
        '</div>';
      }).join('') : emptyState('No follow-ups yet','Set a reminder below.')) +
      '<button class="btn ghost sm" style="margin-top:10px;width:100%" onclick="openFollowupForm(\''+id+'\')">+ Set follow-up reminder</button>' +
    '</div>' +
    inquiryActionsHtml(i, bk);

  openSheet('Inquiry', body);
  setSheetHeadExtra('<button class="btn ghost sm" onclick="editInquiry(\''+id+'\')">Edit</button>');
}
// Money side of an inquiry: the quote while there's no payment, or the booking once there is.
function inquiryBookingCardHtml(b){
  var paid = paidSoFarAll(b), disc = discountTotal(b), due = balanceDue(b);
  var title = hasPayment(b) ? ('Booking · '+b.status) : 'Quote — no payment yet';
  return '<div class="section-title">'+esc(title)+'</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      '<div class="kv"><span class="k">Event date</span><span class="v">'+fmtDate(b.eventDate)+(b.startTime?' · '+fmtTime(b.startTime)+(b.endTime?' – '+fmtTime(b.endTime):''):'')+'</span></div>' +
      '<div class="kv"><span class="k">Booking amount</span><span class="v">'+fmtMoney(b.totalAmount)+'</span></div>' +
      (disc ? '<div class="kv"><span class="k">Discount</span><span class="v" style="color:var(--bad)">−'+fmtMoney(disc)+'</span></div>' : '') +
      (resourceMoney(b,'in') ? '<div class="kv"><span class="k">Add-on resources</span><span class="v">+'+fmtMoney(resourceMoney(b,'in'))+'</span></div>' : '') +
      '<div class="kv"><span class="k">Client pays</span><span class="v">'+fmtMoney(bookingNet(b))+'</span></div>' +
      '<div class="kv"><span class="k">Paid so far</span><span class="v" style="color:var(--good)">'+fmtMoney(paid)+'</span></div>' +
      '<div class="kv"><span class="k">Balance due</span><span class="v" style="color:'+(due>0?'var(--warn)':'var(--good)')+'">'+fmtMoney(due)+'</span></div>' +
      ((b.payments||[]).length ? '<div style="height:6px"></div>' + paymentRowsHtml(b, 'inquiry') : '') +
      '<div class="btnrow" style="margin-top:10px;">' +
        (due>0 || !hasPayment(b) ? '<button class="btn ghost sm" onclick="openPaymentForm(\''+b.id+'\',null,\'inquiry\')">'+(hasPayment(b)?'+ Add payment':'+ Record advance')+'</button>' : '') +
        '<button class="btn ghost sm" onclick="openBookingDetail(\''+b.id+'\')">'+(hasPayment(b)?'Open booking':'Open quote details')+'</button>' +
      '</div>' +
    '</div>';
}
function inquiryActionsHtml(i, bk){
  if(i.status==='converted') return '<div class="hint">This inquiry is a booking — it has a payment recorded. Delete all its payments and it moves back to the inquiry list.</div>';
  if(i.status==='lost') return '<button class="btn ghost" onclick="reopenInquiry(\''+i.id+'\')">Reopen inquiry</button>';
  return '<div class="btnrow" style="margin-bottom:10px;">' +
      '<button class="btn danger" onclick="markInquiryLost(\''+i.id+'\')">Mark lost</button>' +
      (bk ? '<button class="btn primary" onclick="openPaymentForm(\''+bk.id+'\',null,\'inquiry\')">Record advance</button>'
          : '<button class="btn primary" onclick="openConvertForm(\''+i.id+'\')">Convert to booking</button>') +
    '</div>' +
    '<div class="hint">It becomes a booking (and leaves this list) as soon as a payment such as an advance is recorded.</div>';
}
function reopenInquiry(id){
  var i = DB.inquiries.find(function(x){return x.id===id;});
  if(!i) return;
  i.status = DB.followups.some(function(f){return f.inquiryId===id && !f.done;}) ? 'followup' : 'open';
  syncInquiryStatus(i);
  saveData(); openInquiryDetail(id); if(renderers[currentTab]) renderers[currentTab](); toast('Inquiry reopened');
}
function editInquiry(id){ openInquiryForm(null, id); }
function markFollowupDone(fid, inqId, refreshListOnly){
  var f = DB.followups.find(function(x){return x.id===fid;});
  if(!f) return;
  f.done = true; saveData(); checkFollowupsDue(true);
  if(refreshListOnly){ renderInquiries(); toast('Marked done'); }
  else { openInquiryDetail(inqId); }
}
function markInquiryLost(id){
  confirmModal({
    title:'Mark as lost?', message:'This inquiry will be moved to Lost. You can still find it under the Lost filter and reopen it later.',
    okText:'Mark lost', danger:true,
    onOk:function(){
      var i = DB.inquiries.find(function(x){return x.id===id;});
      i.status='lost'; saveData(); closeSheet(); renderInquiries(); toast('Inquiry marked lost');
    }
  });
}

/* ---- Follow-up form (new, or edit an existing one when fid is given) ---- */
function openFollowupForm(inquiryId, fid, backTo){
  var editing = fid ? DB.followups.find(function(x){return x.id===fid;}) : null;
  var defStr = editing ? localDateTimeStr(new Date(editing.dueAt)) : localDateTimeStr(new Date(Date.now()+24*3600000));
  var i0 = DB.inquiries.find(function(x){return x.id===inquiryId;});
  function back(){
    if(backTo){ openBookingDetail(backTo); return; }
    openInquiryDetail(inquiryId);
  }
  var body =
    '<div class="field"><label>Remind me on</label><input type="datetime-local" id="fuDate" value="'+defStr+'"></div>' +
    '<div class="field"><label>Note <span style="opacity:.6">(optional)</span></label><textarea id="fuNote" placeholder="e.g. Call back with revised quote">'+esc(editing?editing.note:'')+'</textarea></div>' +
    (editing ? '<div class="field"><label>Status</label>' + chips('fuDone', ['Pending','Done'], editing.done?'Done':'Pending') + '</div>' : '') +
    '<div id="fuCalLinkWrap" style="display:none;margin:-6px 0 14px;"><button type="button" class="btn ghost sm" id="fuCalLink">Add reminder to calendar</button></div>';
  var foot = editing ? '<div class="btnrow"><button class="btn danger" id="fuDelBtn">Delete</button><button class="btn primary" id="fuSaveBtn">Save changes</button></div>'
                     : '<button class="btn primary" id="fuSaveBtn">Save reminder</button>';
  openSheet(editing ? 'Edit Follow-up' : 'Set Follow-up', body, foot);
  if(editing) wireChips('fuDone', false, function(){});
  function syncFuCalLink(){
    var at = document.getElementById('fuDate').value;
    var wrap = document.getElementById('fuCalLinkWrap');
    if(!at){ wrap.style.display = 'none'; return; }
    var note = document.getElementById('fuNote').value.trim();
    var ev = followupCalEvent({dueAt:new Date(at).toISOString(), note:note}, i0 ? i0.name : 'Inquiry');
    document.getElementById('fuCalLink').onclick = function(){ openCalendarEvent(ev); };
    wrap.style.display = '';
  }
  document.getElementById('fuDate').addEventListener('input', syncFuCalLink);
  document.getElementById('fuDate').addEventListener('change', syncFuCalLink);
  document.getElementById('fuNote').addEventListener('input', syncFuCalLink);
  syncFuCalLink();
  document.getElementById('fuSaveBtn').onclick = function(){
    var dt = document.getElementById('fuDate').value;
    if(!dt){ toast('Pick a date & time'); return; }
    var note = document.getElementById('fuNote').value.trim();
    if(editing){
      editing.dueAt = new Date(dt).toISOString(); editing.note = note;
      editing.done = getChipValue('fuDone', false)==='Done';
      editing.updatedAt = nowIso();
      if(!editing.done) delete notifiedIds[editing.id];
    } else {
      var i = DB.inquiries.find(function(x){return x.id===inquiryId;});
      if(i && i.status==='open') i.status='followup';
      DB.followups.push({id:uid('FU'), inquiryId:inquiryId, dueAt:new Date(dt).toISOString(), note:note, done:false, createdAt:nowIso()});
      maybeAskNotifPermission();
    }
    saveData();
    back(); checkFollowupsDue(true); if(renderers[currentTab]) renderers[currentTab]();
    toast(editing ? 'Follow-up updated' : 'Reminder set');
  };
  if(editing) document.getElementById('fuDelBtn').onclick = function(){
    confirmModal({title:'Delete this follow-up?', message:(editing.note||'Follow up')+' — '+fmtDateTime(editing.dueAt), okText:'Delete', danger:true,
      onOk:function(){
        DB.followups = DB.followups.filter(function(x){return x.id!==editing.id;});
        saveData(); back(); checkFollowupsDue(true); if(renderers[currentTab]) renderers[currentTab](); toast('Follow-up deleted');
      }});
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
    '<div style="display:flex;gap:8px;">' +
      '<div class="field" style="flex:1"><label>Start time</label><input type="time" id="cStartTime" value="'+esc(i.eventTime||'')+'"></div>' +
      '<div class="field" style="flex:1"><label>End time <span style="opacity:.6">(optional)</span></label><input type="time" id="cEndTime" value=""></div>' +
    '</div>' +
    '<div id="cConflictBox"></div>' +
    '<div class="field"><label>Total amount (₹)</label><input type="number" id="cTotal" placeholder="e.g. 12000"></div>' +
    '<div class="field"><label>Advance received (₹)</label><input type="number" id="cAdvance" value="0"></div>' +
    '<div class="field"><label>Advance date</label><input type="date" id="cAdvDate" value="'+todayStr()+'"></div>' +
    '<div class="field"><label>Advance paid by</label>' + chips('cAdvMethod', PAY_METHODS, 'UPI') + '</div>' +
    '<div class="hint" style="margin-bottom:14px;">It becomes a booking once an advance is entered. Leave the advance at 0 to save this as a quote — it stays in Inquiries until a payment comes in.</div>';
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
  wireChips('cAdvMethod', false, function(){});
  function syncBtn(){ document.getElementById('cSaveBtn').textContent = (Number(document.getElementById('cAdvance').value)||0) > 0 ? 'Confirm booking' : 'Save as quote'; }
  document.getElementById('cAdvance').addEventListener('input', syncBtn); syncBtn();

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
        eventDate: eventDate, startTime: document.getElementById('cStartTime').value, endTime: document.getElementById('cEndTime').value,
        eventType: i.eventType, name: i.name, phone: i.phone, altPhone: i.altPhone,
        location: i.location, area: i.area||'', partyHall: i.partyHall||'', channel: i.channel, totalAmount: total, advanceAmount: advance, advanceDate: advDate,
        payments: advance>0 ? [{id:uid('PAY'), amount:advance, date:advDate||todayStr(), method:getChipValue('cAdvMethod', false)||'Cash', note:'Advance payment', isAdvance:true}] : [],
        discounts:[], equipmentResourceIds:[], transportResourceIds:[], extraResourceIds:[], allocCustom:{equipment:'',transport:'',other:''},
        status:'confirmed', calendarAdded:false, notes:''
      };
      DB.bookings.push(b); syncInquiryStatus(i); saveData();
      if(advance>0){ closeSheet(); nav('bookings'); toast('Booking created'); openBookingDetail(b.id); }
      else { openInquiryDetail(i.id); if(renderers[currentTab]) renderers[currentTab](); toast('Quote saved — it becomes a booking once an advance is recorded'); }
    };
    var conflict = advance>0 ? findConflictingBooking(eventDate) : null;
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
  // Only bookings with money paid show here; quotes with no payment stay under Inquiries ("All" shows them too).
  var list = DB.bookings.slice().sort(function(a,b){ return new Date(b.eventDate)-new Date(a.eventDate); });
  if(bookingFilter==='active') list = list.filter(isLiveBooking);
  else if(bookingFilter==='pending') list = list.filter(function(b){return isLiveBooking(b) && balanceDue(b)>0;});
  else if(bookingFilter==='cancelled') list = list.filter(function(b){return b.status==='cancelled';});
  else if(bookingFilter!=='all') list = list.filter(function(b){return b.status===bookingFilter && hasPayment(b);});

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
      '<div class="row-sub">'+esc(b.eventType)+' · '+fmtDateShort(b.eventDate)+(b.partyHall?' · '+esc(b.partyHall):'')+'</div>' +
    '</div>' +
    '<div class="row-end">' +
      '<div class="row-amt num">'+fmtMoney(bookingNet(b))+'</div>' +
      (!hasPayment(b) ? '<span class="badge open">No payment</span>' : b.status==='cancelled' ? '<span class="badge cancelled">cancelled</span>' :
        '<span class="badge '+(due>0?'pending':'paid')+'">'+(due>0?'Due '+fmtMoney(due):'Paid')+'</span>') +
    '</div>' +
  '</div>';
}
renderers.bookings = renderBookings;

/* ================================ CALENDAR ================================ */
// Wall-clock date+time in a given time zone -> the real moment (Date). Used so an 8 PM Chennai
// event lands at 8 PM Chennai time even when the phone/laptop is set to another zone.
function zonedTimeToDate(dateStr, timeStr, tz){
  var d = dateStr.split('-').map(Number), t = (timeStr||'00:00').split(':').map(Number);
  var guess = Date.UTC(d[0], d[1]-1, d[2], t[0]||0, t[1]||0);
  function offsetAt(ms){
    try{
      var parts = new Intl.DateTimeFormat('en-US',{timeZone:tz, hourCycle:'h23', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit'}).formatToParts(new Date(ms));
      var m = {}; parts.forEach(function(p){ m[p.type] = p.value; });
      return Date.UTC(+m.year, +m.month-1, +m.day, +m.hour % 24, +m.minute, +m.second) - ms;
    }catch(e){ return -new Date(ms).getTimezoneOffset()*60000; }
  }
  var ms = guess - offsetAt(guess);
  ms = guess - offsetAt(ms); // second pass handles DST edges
  return new Date(ms);
}
function calUtc(d){ return d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z'; }
function calDay(dateStr){ return dateStr.replace(/-/g,''); }
function nextDay(dateStr){ var dt = new Date(dateStr+'T00:00:00Z'); dt.setUTCDate(dt.getUTCDate()+1); return dt.toISOString().slice(0,10); }

// ev: {title, details, location, date, startTime, endTime} (timed or all-day) or {title, details, start:Date, end:Date}
function calEventTimes(ev){
  var cal = DB.settings.calendar || {};
  if(ev.start) return {allDay:false, start:ev.start, end:ev.end || new Date(ev.start.getTime()+30*60000)};
  if(!ev.startTime) return {allDay:true, startDay:ev.date, endDay:nextDay(ev.date)};
  var tz = cal.timezone || browserTz();
  var start = zonedTimeToDate(ev.date, ev.startTime, tz);
  var end;
  if(ev.endTime){
    end = zonedTimeToDate(ev.date, ev.endTime, tz);
    if(end <= start) end = new Date(end.getTime()+86400000); // finishes after midnight
  } else end = new Date(start.getTime() + (Number(cal.defaultDurationHrs)||5)*3600000);
  return {allDay:false, start:start, end:end};
}
function googleCalUrl(ev, classic){
  var cal = DB.settings.calendar || {};
  var t = calEventTimes(ev);
  var dates = t.allDay ? calDay(t.startDay)+'/'+calDay(t.endDay) : calUtc(t.start)+'/'+calUtc(t.end);
  var q = 'text='+encodeURIComponent(ev.title||'')+'&dates='+dates+
    '&details='+encodeURIComponent(ev.details||'')+'&location='+encodeURIComponent(ev.location||'');
  if(!t.allDay && cal.timezone) q += '&ctz='+encodeURIComponent(cal.timezone);
  if(cal.account) q += '&authuser='+encodeURIComponent(cal.account);
  return classic ? 'https://calendar.google.com/calendar/render?action=TEMPLATE&'+q
                 : 'https://calendar.google.com/calendar/r/eventedit?'+q;
}
function icsText(ev){
  var t = calEventTimes(ev);
  function icsEsc(x){ return String(x||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/([,;])/g,'\\$1'); }
  return [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ReY Events Manager//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:'+uid('EV')+'@rey-events',
    'DTSTAMP:'+calUtc(new Date()),
    t.allDay ? 'DTSTART;VALUE=DATE:'+calDay(t.startDay) : 'DTSTART:'+calUtc(t.start),
    t.allDay ? 'DTEND;VALUE=DATE:'+calDay(t.endDay) : 'DTEND:'+calUtc(t.end),
    'SUMMARY:'+icsEsc(ev.title),
    'DESCRIPTION:'+icsEsc(ev.details),
    'LOCATION:'+icsEsc(ev.location),
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
}
// Every "Add to calendar" button goes through here so the method chosen in More → Calendar applies everywhere.
var CAL_PENDING = {};
function calButton(ev, label, cls){
  var key = uid('CAL'); CAL_PENDING[key] = ev;
  return '<button type="button" class="'+(cls||'btn ghost sm')+'" onclick="openCalendar(\''+key+'\')">'+esc(label)+'</button>';
}
function openCalendar(key){ if(CAL_PENDING[key]) openCalendarEvent(CAL_PENDING[key]); }
function openCalendarEvent(ev){
  var method = (DB.settings.calendar||{}).method || 'google';
  if(method==='ics'){
    var fname = (ev.title||'event').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-').slice(0,40) + '.ics';
    withDownloads(function(downloads){
      downloads.save({filename: fname, data: new Blob([icsText(ev)], {type:'text/calendar'})})
        .then(function(){ toast('Calendar file saved — open it to add the event'); })
        .catch(function(){ toast('Could not create the calendar file'); });
    });
  } else {
    window.open(googleCalUrl(ev, method==='google-classic'), '_blank', 'noopener');
  }
  if(ev.bookingId){
    var b = DB.bookings.find(function(x){return x.id===ev.bookingId;});
    if(b && !b.calendarAdded){ b.calendarAdded = true; saveData(); }
  }
}
function bookingCalEvent(b){
  var inq = DB.inquiries.find(function(x){return x.id===b.inquiryId;});
  var details = [
    'Client: '+b.name+' ('+(b.phone||'no phone')+')',
    'Event type: '+b.eventType,
    'Venue: '+(locationText(b)||'—'),
    (b.startTime ? 'Time: '+fmtTime(b.startTime)+(b.endTime?' – '+fmtTime(b.endTime):'') : ''),
    'Total amount: '+fmtMoney(bookingNet(b))+(discountTotal(b)?' (after '+fmtMoney(discountTotal(b))+' discount)':'')+' | Advance: '+fmtMoney(b.advanceAmount)+(b.advanceDate?' on '+fmtDate(b.advanceDate):''),
    allocSummary(b) ? 'Allocated: '+allocSummary(b) : '',
    'Booking date: '+fmtDate(b.bookingDate),
    inq ? ('Inquiry date: '+fmtDate(inq.inquiryDate)+' via '+inq.channel) : '',
    'Balance due: '+fmtMoney(balanceDue(b))
  ].filter(Boolean).join('\n');
  return {title: b.eventType+' — '+b.name, details: details, location: locationText(b),
    date: b.eventDate, startTime: b.startTime||'', endTime: b.endTime||'', bookingId: b.id};
}
function calLabel(){ var m = (DB.settings.calendar||{}).method; return m==='ics' ? 'Add to phone calendar' : 'Add to Google Calendar'; }
function followupCalEvent(f, inquiryName){
  var start = new Date(f.dueAt);
  return {title:'Follow up: '+(inquiryName||'Inquiry'), details: f.note || 'Follow-up reminder from ReY Events Manager',
    start: start, end: new Date(start.getTime()+30*60000)};
}

var ALLOC_OTHER = '__other';
var ALLOC_GROUPS = [
  {key:'equipment', field:'equipmentResourceIds', label:'Equipment setup', chip:'bkEquip', types:['equipment'], empty:'No equipment added yet'},
  {key:'transport', field:'transportResourceIds', label:'Transport', chip:'bkTransport', types:['transport'], empty:'No transport added yet'},
  {key:'other', field:'extraResourceIds', label:'Other resources / crew', chip:'bkOther', types:['crew','other'], empty:'No crew or other resources added yet'}
];
function moneyTag(r){
  var amt = Number(r.amount)||0;
  if(r.flow==='in') return ' (+'+fmtMoney(amt)+')';
  if(r.flow==='out') return ' (−'+fmtMoney(amt)+')';
  return '';
}
function allocGroupHtml(g, b){
  var list = DB.resources.filter(function(r){ return g.types.indexOf(r.type)>-1; });
  var sel = b[g.field] || [], custom = (b.allocCustom||{})[g.key] || '';
  var html = '<div class="field"><label>'+esc(g.label)+' <span style="opacity:.6;text-transform:none;">— pick any number</span></label><div class="chipwrap" id="'+g.chip+'">';
  list.forEach(function(r){
    html += '<button type="button" class="chip'+(sel.indexOf(r.id)>-1?' sel':'')+'" data-val="'+esc(r.id)+'">'+esc(r.name)+esc(moneyTag(r))+(r.active?'':' · inactive')+'</button>';
  });
  html += '<button type="button" class="chip'+(custom?' sel':'')+'" data-val="'+ALLOC_OTHER+'">Other</button></div>' +
    (list.length ? '' : '<div class="hint">'+esc(g.empty)+' — add them under Resources, or tap Other to type one in.</div>') +
    otherBox(g.chip+'Custom', 'Type something new, e.g. Smoke machine', !!custom) + '</div>';
  return html;
}
function wireAllocGroup(g, b){
  wireChips(g.chip, true, function(vals){
    document.getElementById(g.chip+'Custom_wrap').style.display = vals.indexOf(ALLOC_OTHER)>-1 ? '' : 'none';
  });
  document.getElementById(g.chip+'Custom').value = (b.allocCustom||{})[g.key] || '';
}
function allocSummary(b){
  var names = allocatedResources(b).map(function(r){return r.name;});
  ['equipment','transport','other'].forEach(function(k){ var c = (b.allocCustom||{})[k]; if(c) names.push(c); });
  return names.join(', ');
}
function paymentRowsHtml(b, ctx){
  return (b.payments||[]).slice().sort(function(x,y){return (x.date||'').localeCompare(y.date||'');}).map(function(p){
    return '<div class="kv tap" onclick="openPaymentForm(\''+b.id+'\',\''+p.id+'\',\''+(ctx||'')+'\')"><span class="k">'+fmtDate(p.date)+' · '+esc(p.method||'—')+(p.isAdvance?' · Advance':'')+(p.note && p.note!=='Advance payment'?' — '+esc(p.note):'')+'<span class="edit-ic">Edit</span></span><span class="v">'+fmtMoney(p.amount)+'</span></div>';
  }).join('');
}

function openBookingDetail(id){
  var b = DB.bookings.find(function(x){return x.id===id;});
  if(!b) return;
  var inq = DB.inquiries.find(function(x){return x.id===b.inquiryId;});
  var fups = inq ? DB.followups.filter(function(f){return f.inquiryId===inq.id;}) : [];
  var due = balanceDue(b), paid = hasPayment(b), disc = discountTotal(b), resIn = resourceMoney(b,'in');

  // Every timeline entry opens the form that edits it.
  var timeline = '<div class="timeline">';
  if(inq) timeline += '<div class="tl-item tap" onclick="editInquiry(\''+inq.id+'\')"><div class="tl-date">'+fmtDate(inq.inquiryDate)+'</div><div class="tl-body">Inquiry received via '+esc(inq.channel)+'</div></div>';
  fups.forEach(function(f){
    timeline += '<div class="tl-item tap" onclick="openFollowupForm(\''+inq.id+'\',\''+f.id+'\',\''+b.id+'\')"><div class="tl-date">'+fmtDateTime(f.dueAt)+'</div><div class="tl-body">Follow-up: '+esc(f.note||'—')+(f.done?' (done)':'')+'</div></div>';
  });
  timeline += '<div class="tl-item tap" onclick="openBookingEditForm(\''+b.id+'\')"><div class="tl-date">'+fmtDate(b.bookingDate)+'</div><div class="tl-body">'+(paid?'Booking confirmed':'Quote saved')+' — '+fmtMoney(b.totalAmount)+' total</div></div>';
  (b.payments||[]).slice().sort(function(x,y){return (x.date||'').localeCompare(y.date||'');}).forEach(function(p){
    timeline += '<div class="tl-item tap" onclick="openPaymentForm(\''+b.id+'\',\''+p.id+'\')"><div class="tl-date">'+fmtDate(p.date)+'</div><div class="tl-body">'+(p.isAdvance||p.note==='Advance payment'?'Advance':'Payment')+' received: '+fmtMoney(p.amount)+' ('+esc(p.method||'—')+')</div></div>';
  });
  (b.discounts||[]).forEach(function(d){
    timeline += '<div class="tl-item tap" onclick="openDiscountForm(\''+b.id+'\',\''+d.id+'\')"><div class="tl-date">'+fmtDate(d.date)+'</div><div class="tl-body">Discount given: '+fmtMoney(d.amount)+(d.note?' — '+esc(d.note):'')+'</div></div>';
  });
  timeline += '</div>';

  var body =
    (!paid ? '<div class="card" style="margin-bottom:14px;border-color:var(--warn);">' +
        '<div style="font-weight:700;color:var(--warn);margin-bottom:4px;">Quote — no payment yet</div>' +
        '<div class="hint" style="margin:0 0 10px;">This is still an inquiry. It becomes a booking as soon as you record an advance or any payment.</div>' +
        '<button class="btn primary sm" style="width:100%" onclick="openPaymentForm(\''+b.id+'\')">+ Record advance</button>' +
      '</div>' : '') +
    '<div class="card" style="margin-bottom:14px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        '<div style="font-weight:700;font-size:16px;">'+esc(b.name)+'</div><span class="badge '+(paid?b.status:'open')+'">'+(paid?b.status:'quote')+'</span>' +
      '</div>' +
      '<div class="kv"><span class="k">Event</span><span class="v">'+esc(b.eventType)+' · '+fmtDate(b.eventDate)+'</span></div>' +
      (b.startTime ? '<div class="kv"><span class="k">Time</span><span class="v">'+fmtTime(b.startTime)+(b.endTime?' – '+fmtTime(b.endTime):'')+'</span></div>' : '') +
      '<div class="kv"><span class="k">Party hall</span><span class="v">'+esc(b.partyHall||'—')+'</span></div>' +
      '<div class="kv"><span class="k">Location</span><span class="v">'+esc(b.location||'—')+(b.area?' · '+esc(b.area):'')+'</span></div>' +
      '<div class="kv"><span class="k">Phone</span><span class="v">'+esc(b.phone||'—')+(b.altPhone?' / '+esc(b.altPhone):'')+'</span></div>' +
      '<div class="kv"><span class="k">Booking amount</span><span class="v">'+fmtMoney(b.totalAmount)+'</span></div>' +
      (disc ? '<div class="kv"><span class="k">Discounts</span><span class="v" style="color:var(--bad)">−'+fmtMoney(disc)+'</span></div>' : '') +
      (resIn ? '<div class="kv"><span class="k">Add-on resources (money in)</span><span class="v">+'+fmtMoney(resIn)+'</span></div>' : '') +
      ((disc||resIn) ? '<div class="kv"><span class="k"><b>Client pays</b></span><span class="v">'+fmtMoney(bookingNet(b))+'</span></div>' : '') +
      '<div class="kv"><span class="k">Paid so far</span><span class="v" style="color:var(--good)">'+fmtMoney(paidSoFarAll(b))+'</span></div>' +
      '<div class="kv"><span class="k">Balance due</span><span class="v" style="color:'+(due>0?'var(--warn)':'var(--good)')+'">'+fmtMoney(due)+'</span></div>' +
      (b.notes ? '<div class="kv"><span class="k">Notes</span><span class="v" style="text-align:right;max-width:60%;">'+esc(b.notes)+'</span></div>' : '') +
    '</div>' +
    '<div style="margin-bottom:14px;">'+calButton(bookingCalEvent(b), calLabel()+(b.calendarAdded?' again':''), 'btn ghost')+
      (b.startTime ? '' : '<div class="hint" style="margin-top:6px;">No start time set, so this goes in as an all-day event. Tap Edit (top right) to add a time.</div>')+'</div>' +
    '<div class="section-title">Timeline <span style="opacity:.6;text-transform:none;font-weight:600;">— tap an entry to edit</span></div>' +
    '<div class="card" style="margin-bottom:14px;">'+timeline+'</div>' +
    '<div class="section-title">Allocation</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      ALLOC_GROUPS.map(function(g){ return allocGroupHtml(g, b); }).join('') +
      '<button class="btn ghost sm" style="width:100%;margin-top:4px;" onclick="saveAllocation(\''+b.id+'\')">Save allocation</button>' +
    '</div>' +
    '<div class="section-title">Payments <span style="opacity:.6;text-transform:none;font-weight:600;">— tap one to edit</span></div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      ((b.payments||[]).length ? paymentRowsHtml(b) : emptyState('No payments recorded','')) +
      (due>0 || !paid ? '<button class="btn ghost sm" style="width:100%;margin-top:10px;" onclick="openPaymentForm(\''+b.id+'\')">'+(paid?'+ Add payment':'+ Record advance')+'</button>' : '') +
    '</div>' +
    '<div class="section-title">Discounts</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      ((b.discounts||[]).length ? b.discounts.map(function(d){
        return '<div class="kv tap" onclick="openDiscountForm(\''+b.id+'\',\''+d.id+'\')"><span class="k">'+fmtDate(d.date)+(d.note?' — '+esc(d.note):'')+'<span class="edit-ic">Edit</span></span><span class="v" style="color:var(--bad)">−'+fmtMoney(d.amount)+'</span></div>';
      }).join('') + '<div class="kv"><span class="k"><b>Total discount</b></span><span class="v">'+fmtMoney(disc)+'</span></div>'
        : '<div class="hint" style="margin:0;">No discount given. A discount lowers what the client pays and the revenue counted for this event.</div>') +
      '<button class="btn ghost sm" style="width:100%;margin-top:10px;" onclick="openDiscountForm(\''+b.id+'\')">+ Add discount</button>' +
    '</div>' +
    bookingSpendCardHtml(b) +
    '<div class="section-title">Status</div>' +
    '<div class="btnrow">' +
      (b.status!=='completed' ? '<button class="btn ghost" onclick="setBookingStatus(\''+b.id+'\',\'completed\')">Mark completed</button>' : '<button class="btn ghost" onclick="setBookingStatus(\''+b.id+'\',\'confirmed\')">Mark not completed</button>') +
      (b.status!=='cancelled' ? '<button class="btn danger" onclick="cancelBooking(\''+b.id+'\')">Cancel</button>' : '<button class="btn ghost" onclick="setBookingStatus(\''+b.id+'\',\'confirmed\')">Reinstate</button>') +
    '</div>';

  openSheet(paid ? 'Booking' : 'Quote', body);
  setSheetHeadExtra('<button class="btn ghost sm" onclick="openBookingEditForm(\''+b.id+'\')">Edit</button>');
  ALLOC_GROUPS.forEach(function(g){ wireAllocGroup(g, b); });
}
function openBookingEditForm(id){
  var b = DB.bookings.find(function(x){return x.id===id;});
  if(!b) return;
  var etSel = EVENT_TYPES.indexOf(b.eventType)>-1 ? b.eventType : 'Other';
  var etOther = etSel==='Other' && b.eventType!=='Other' ? String(b.eventType||'').replace(/^Other:\s*/,'') : '';
  var body =
    '<div class="field"><label>Client name</label><input type="text" id="beName" value="'+esc(b.name||'')+'"></div>' +
    '<div class="field"><label>Phone</label><input type="tel" id="bePhone" value="'+esc(b.phone||'')+'"></div>' +
    '<div class="field"><label>Alternate contact <span style="opacity:.6">(optional)</span></label><input type="tel" id="beAltPhone" value="'+esc(b.altPhone||'')+'"></div>' +
    '<div class="field"><label>Event type</label>' + chips('beEventType', EVENT_TYPES, etSel) + otherBox('beEventTypeOther', 'Type the event type', etSel==='Other') + '</div>' +
    '<div class="field"><label>Party hall / venue name <span style="opacity:.6">(optional)</span></label><input type="text" id="beHall" value="'+esc(b.partyHall||'')+'"></div>' +
    locationPickerHtml('be', b.location, b.area) +
    '<div class="field"><label>Booking date</label><input type="date" id="beBkDate" value="'+esc(b.bookingDate||'')+'"></div>' +
    '<div class="field"><label>Event date</label><input type="date" id="beDate" value="'+esc(b.eventDate)+'"></div>' +
    '<div style="display:flex;gap:8px;">' +
      '<div class="field" style="flex:1"><label>Start time</label><input type="time" id="beStart" value="'+esc(b.startTime||'')+'"></div>' +
      '<div class="field" style="flex:1"><label>End time <span style="opacity:.6">(optional)</span></label><input type="time" id="beEnd" value="'+esc(b.endTime||'')+'"></div>' +
    '</div>' +
    '<div id="beConflict"></div>' +
    '<div class="field"><label>Booking amount (₹)</label><input type="number" id="beTotal" value="'+(Number(b.totalAmount)||0)+'"></div>' +
    '<div class="hint" style="margin:-8px 0 14px;">Before discounts. Payments and discounts are edited from their own sections on the booking.</div>' +
    '<div class="field"><label>Status</label>' + chips('beStatus', ['Confirmed','Completed','Cancelled'], b.status.charAt(0).toUpperCase()+b.status.slice(1)) + '</div>' +
    '<div class="field"><label>Notes <span style="opacity:.6">(optional)</span></label><textarea id="beNotes">'+esc(b.notes||'')+'</textarea></div>' +
    (b.calendarAdded ? '<div class="hint" style="margin-bottom:10px;">Already added to your calendar? After changing the date or time, update or delete the old calendar entry and add it again.</div>' : '');
  openSheet(hasPayment(b) ? 'Edit Booking' : 'Edit Quote', body, '<button class="btn primary" id="beSave">Save changes</button>');
  if(etOther) document.getElementById('beEventTypeOther').value = etOther;
  wireChips('beEventType', false, function(){});
  wireOtherBox('beEventType', 'beEventTypeOther', ['Other']);
  wireChips('beStatus', false, function(){});
  wireLocationPicker('be');
  function chk(){
    var d = document.getElementById('beDate').value, c = d ? findConflictingBooking(d, b.id) : null;
    document.getElementById('beConflict').innerHTML = c ? '<div class="modal warnbox" style="margin:0 0 16px;padding:11px 13px;">Already booked on '+fmtDate(d)+': <b>'+esc(c.name)+'</b>.</div>' : '';
  }
  document.getElementById('beDate').addEventListener('change', chk); chk();
  document.getElementById('beSave').onclick = function(){
    var d = document.getElementById('beDate').value, total = Number(document.getElementById('beTotal').value)||0;
    var name = document.getElementById('beName').value.trim();
    var loc = readLocationPicker('be', true);
    var eventType = chipValueWithOther('beEventType','beEventTypeOther',['Other']);
    var status = (getChipValue('beStatus', false)||'Confirmed').toLowerCase();
    if(!name){ toast('Enter the client name'); return; }
    if(!d){ toast('Pick the event date'); return; }
    if(total<=0){ toast('Enter the booking amount'); return; }
    if(!eventType){ toast('Pick an event type'); return; }
    if(loc.error){ toast(loc.error); return; }
    b.name = name; b.phone = document.getElementById('bePhone').value.trim(); b.altPhone = document.getElementById('beAltPhone').value.trim();
    b.eventType = eventType; b.partyHall = document.getElementById('beHall').value.trim();
    b.location = loc.location; b.area = loc.area;
    b.bookingDate = document.getElementById('beBkDate').value || b.bookingDate;
    b.eventDate = d; b.startTime = document.getElementById('beStart').value; b.endTime = document.getElementById('beEnd').value;
    b.totalAmount = total; b.status = status;
    b.notes = document.getElementById('beNotes').value.trim(); b.updatedAt = nowIso();
    var inq = DB.inquiries.find(function(x){return x.id===b.inquiryId;});
    if(inq){ // keep the client details the same in both places
      inq.name = b.name; inq.phone = b.phone; inq.altPhone = b.altPhone; inq.eventType = b.eventType;
      inq.partyHall = b.partyHall; inq.location = b.location; inq.area = b.area; inq.updatedAt = nowIso();
    }
    saveData(); openBookingDetail(b.id); if(renderers[currentTab]) renderers[currentTab](); toast('Saved');
  };
}
function saveAllocation(bookingId){
  var b = DB.bookings.find(function(x){return x.id===bookingId;});
  if(!b) return;
  b.allocCustom = b.allocCustom || {};
  ALLOC_GROUPS.forEach(function(g){
    var vals = getChipValue(g.chip, true);
    b[g.field] = vals.filter(function(v){ return v!==ALLOC_OTHER && DB.resources.some(function(r){return r.id===v;}); });
    b.allocCustom[g.key] = vals.indexOf(ALLOC_OTHER)>-1 ? document.getElementById(g.chip+'Custom').value.trim() : '';
  });
  saveData(); openBookingDetail(bookingId); if(renderers[currentTab]) renderers[currentTab](); toast('Allocation saved');
}
// ctx 'inquiry' = opened from the inquiry screen (go back there while it's still an inquiry)
function openPaymentForm(bookingId, payId, ctx){
  var b = DB.bookings.find(function(x){return x.id===bookingId;});
  if(!b) return;
  var p = payId ? (b.payments||[]).find(function(x){return x.id===payId;}) : null;
  if(payId && !p) return;
  var due = balanceDue(b);
  var first = !hasPayment(b);
  var isAdv = p ? !!(p.isAdvance || p.note==='Advance payment' || p.method==='Advance') : first;
  var methods = PAY_METHODS.slice();
  if(p && p.method && p.method!=='Advance' && methods.indexOf(p.method)===-1) methods.push(p.method);
  var method = p ? (p.method==='Advance' ? 'Cash' : p.method) : (first ? 'UPI' : 'Cash');
  var amtVal = p ? (Number(p.amount)||0) : (first ? '' : due);
  var body =
    '<div class="hint" style="margin-bottom:14px;">Client pays <b>'+fmtMoney(bookingNet(b))+'</b> · balance due <b>'+fmtMoney(due)+'</b>'+(p?' (before this edit)':'')+'</div>' +
    '<div class="field"><label>Payment type</label>' + chips('pKind', ['Advance','Payment'], isAdv?'Advance':'Payment') + '</div>' +
    '<div class="field"><label>Amount (₹)</label><input type="number" id="pAmt" value="'+amtVal+'" placeholder="e.g. 5000"></div>' +
    '<div class="field"><label>Date</label><input type="date" id="pDate" value="'+esc(p ? p.date : todayStr())+'"></div>' +
    '<div class="field"><label>Method</label>' + chips('pMethod', methods, method) + '</div>' +
    '<div class="field"><label>Notes <span style="opacity:.6">(optional)</span></label><textarea id="pNote" placeholder="Anything else to remember">'+esc(p && p.note!=='Advance payment' ? (p.note||'') : '')+'</textarea></div>' +
    (p ? '<div class="hint">Deleting the only payment moves this back to Inquiries (e.g. the advance was cancelled or refunded).</div>' : '');
  var foot = p ? '<div class="btnrow"><button class="btn danger" id="pDelBtn">Delete</button><button class="btn primary" id="pSaveBtn">Save changes</button></div>'
               : '<button class="btn primary" id="pSaveBtn">Record payment</button>';
  openSheet(p ? 'Edit Payment' : (first ? 'Record Advance' : 'Add Payment'), body, foot);
  wireChips('pKind', false, function(){});
  wireChips('pMethod', false, function(){});
  function back(){
    if(ctx==='inquiry' && !hasPayment(b) && b.inquiryId) openInquiryDetail(b.inquiryId);
    else openBookingDetail(bookingId);
    if(renderers[currentTab]) renderers[currentTab]();
  }
  document.getElementById('pSaveBtn').onclick = function(){
    var amt = Number(document.getElementById('pAmt').value)||0;
    var m = getChipValue('pMethod', false);
    if(amt<=0){ toast('Enter an amount'); return; }
    if(!m){ toast('Pick a payment method'); return; }
    var adv = getChipValue('pKind', false)==='Advance';
    var note = document.getElementById('pNote').value.trim();
    b.payments = b.payments || [];
    var rec = p || {id:uid('PAY')};
    rec.amount = amt; rec.date = document.getElementById('pDate').value || todayStr(); rec.method = m;
    rec.isAdvance = adv; rec.note = note || (adv ? 'Advance payment' : '');
    if(p) rec.updatedAt = nowIso(); else b.payments.push(rec);
    if(adv) b.payments.forEach(function(x){ if(x!==rec && x.isAdvance){ x.isAdvance = false; if(x.note==='Advance payment') x.note = ''; } });
    afterPaymentChange(b); saveData(); back();
    toast(p ? 'Payment updated' : 'Payment recorded');
  };
  if(p) document.getElementById('pDelBtn').onclick = function(){
    var last = (b.payments||[]).length===1;
    confirmModal({title:'Delete this payment?', message:fmtMoney(p.amount)+' on '+fmtDate(p.date)+'.',
      warn: last ? 'This is the only payment — the booking will move back to Inquiries as a quote.' : '',
      okText:'Delete', danger:true,
      onOk:function(){
        b.payments = b.payments.filter(function(x){return x.id!==p.id;});
        afterPaymentChange(b); saveData(); back(); if(!last) toast('Payment deleted');
      }});
  };
}
function openDiscountForm(bookingId, discId){
  var b = DB.bookings.find(function(x){return x.id===bookingId;});
  if(!b) return;
  b.discounts = b.discounts || [];
  var d = discId ? b.discounts.find(function(x){return x.id===discId;}) : null;
  if(discId && !d) return;
  var body =
    '<div class="hint" style="margin-bottom:14px;">Booking amount <b>'+fmtMoney(b.totalAmount)+'</b> · discounts so far <b>'+fmtMoney(discountTotal(b))+'</b></div>' +
    '<div class="field"><label>Discount amount (₹)</label><input type="number" id="dAmt" value="'+(d?Number(d.amount)||'':'')+'" placeholder="e.g. 1000"></div>' +
    '<div class="field"><label>Date</label><input type="date" id="dDate" value="'+esc(d ? d.date : todayStr())+'"></div>' +
    '<div class="field"><label>Reason <span style="opacity:.6">(optional)</span></label><input type="text" id="dNote" value="'+esc(d?d.note:'')+'" placeholder="e.g. Repeat client, festive offer"></div>';
  var foot = d ? '<div class="btnrow"><button class="btn danger" id="dDelBtn">Delete</button><button class="btn primary" id="dSaveBtn">Save changes</button></div>'
               : '<button class="btn primary" id="dSaveBtn">Add discount</button>';
  openSheet(d ? 'Edit Discount' : 'Add Discount', body, foot);
  document.getElementById('dSaveBtn').onclick = function(){
    var amt = Number(document.getElementById('dAmt').value)||0;
    if(amt<=0){ toast('Enter the discount amount'); return; }
    var others = discountTotal(b) - (d ? (Number(d.amount)||0) : 0);
    if(others + amt > (Number(b.totalAmount)||0)){ toast('Discounts can\'t be more than the booking amount'); return; }
    var rec = d || {id:uid('DSC'), createdAt:nowIso()};
    rec.amount = amt; rec.date = document.getElementById('dDate').value || todayStr(); rec.note = document.getElementById('dNote').value.trim();
    if(d) rec.updatedAt = nowIso(); else b.discounts.push(rec);
    saveData(); openBookingDetail(b.id); if(renderers[currentTab]) renderers[currentTab](); toast(d ? 'Discount updated' : 'Discount added');
  };
  if(d) document.getElementById('dDelBtn').onclick = function(){
    confirmModal({title:'Delete this discount?', message:fmtMoney(d.amount)+(d.note?' — '+d.note:''), okText:'Delete', danger:true,
      onOk:function(){ b.discounts = b.discounts.filter(function(x){return x.id!==d.id;}); saveData(); openBookingDetail(b.id); if(renderers[currentTab]) renderers[currentTab](); toast('Discount deleted'); }});
  };
}
function setBookingStatus(id, status){
  var b = DB.bookings.find(function(x){return x.id===id;});
  b.status = status; saveData(); openBookingDetail(id); if(renderers[currentTab]) renderers[currentTab]();
}
function cancelBooking(id){
  confirmModal({
    title:'Cancel this booking?', message:'It will be excluded from active revenue and payback figures.',
    okText:'Cancel booking', danger:true,
    onOk:function(){ setBookingStatus(id,'cancelled'); toast('Booking cancelled'); }
  });
}


/* ================================ EXPENSES & PROFIT ================================ */
function expenseTotal(list){ return list.reduce(function(s,e){return s+(Number(e.amount)||0);},0); }
function bookingRevenue(b){ return isLiveBooking(b) ? bookingNet(b) : 0; }
function expensesFor(bookingId){ return DB.expenses.filter(function(e){return e.bookingId===bookingId;}); }
function byTypeRows(list){
  var map = {};
  list.forEach(function(e){ var k = e.type||'Other'; map[k] = (map[k]||0) + (Number(e.amount)||0); });
  return Object.keys(map).map(function(k){return {type:k, amount:map[k]};}).sort(function(a,b){return b.amount-a.amount;});
}
function profitColor(v){ return v>=0 ? 'var(--good)' : 'var(--bad)'; }
function spendTotals(){
  var active = liveBookings();
  var revenue = active.reduce(function(s,b){return s+bookingNet(b);},0);
  var collected = active.reduce(function(s,b){return s+paidSoFarAll(b);},0);
  var expenses = expenseTotal(DB.expenses);
  var eventSpend = expenseTotal(DB.expenses.filter(function(e){return e.bookingId;}));
  var resIn = active.reduce(function(s,b){return s+resourceMoney(b,'in');},0);
  var resOut = active.reduce(function(s,b){return s+resourceMoney(b,'out');},0);
  var discounts = active.reduce(function(s,b){return s+discountTotal(b);},0);
  var total = expenses + resOut; // everything that comes off profit
  return {revenue:revenue, collected:collected, total:total, expenses:expenses, eventSpend:eventSpend, general:expenses-eventSpend,
    resIn:resIn, resOut:resOut, discounts:discounts,
    profit:revenue-total, cashProfit:collected-total, margin: revenue>0 ? (revenue-total)/revenue*100 : 0};
}
function typeBreakdownHtml(list){
  var rows = byTypeRows(list);
  if(!rows.length) return emptyState('No expenses yet','');
  var max = rows[0].amount || 1;
  return rows.map(function(r){
    return '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:13px;"><span style="font-weight:600">'+esc(r.type)+'</span>' +
      '<span class="num" style="font-weight:700">'+fmtMoney(r.amount)+'</span></div>' +
      '<div class="segbar"><i style="width:'+clamp(r.amount/max*100,2,100)+'%;background:var(--warn)"></i></div></div>';
  }).join('');
}
function expenseRow(e, ctx){
  var b = e.bookingId ? DB.bookings.find(function(x){return x.id===e.bookingId;}) : null;
  var sub = fmtDateShort(e.date) + ' · ' + (b ? esc(b.name)+' ('+esc(b.eventType)+')' : 'General') + (e.note ? ' · '+esc(e.note) : '');
  return '<div class="list-row" style="cursor:pointer;" onclick="openExpenseForm(\''+e.id+'\',null,\''+(ctx||'')+'\')">' +
    '<div class="avatar">'+esc(initials(e.type||'?'))+'</div>' +
    '<div class="row-main"><div class="row-title">'+esc(e.type||'Expense')+'</div><div class="row-sub">'+sub+'</div></div>' +
    '<div class="row-end"><div class="row-amt num">'+fmtMoney(e.amount)+'</div></div>' +
  '</div>';
}

var expenseFilter = 'All';
function renderExpenses(){
  var el = document.getElementById('view-expenses');
  var all = DB.expenses.slice().sort(function(a,b){ return (b.date||'').localeCompare(a.date||'') || (b.createdAt||'').localeCompare(a.createdAt||''); });
  var usedTypes = [];
  all.forEach(function(e){ if(usedTypes.indexOf(e.type)===-1) usedTypes.push(e.type); });
  if(expenseFilter!=='All' && usedTypes.indexOf(expenseFilter)===-1) expenseFilter = 'All';
  var list = expenseFilter==='All' ? all : all.filter(function(e){return e.type===expenseFilter;});
  var month = todayStr().slice(0,7);
  var monthTotal = expenseTotal(DB.expenses.filter(function(e){return (e.date||'').slice(0,7)===month;}));
  var t = spendTotals();
  el.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
      '<h2 class="disp" style="margin:0;">Expenses</h2>' +
      '<button class="btn primary sm" onclick="openExpenseForm()">+ Add</button></div>' +
    '<div class="tiles" style="margin-bottom:14px;">' +
      '<div class="tile" onclick="openSpendSummary()" style="cursor:pointer;"><div class="tlabel">Total spend</div><div class="tval num">'+fmtMoney(t.total)+'</div><div class="tsub">tap for summary</div></div>' +
      '<div class="tile"><div class="tlabel">This month</div><div class="tval num">'+fmtMoney(monthTotal)+'</div><div class="tsub">'+new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'})+'</div></div>' +
    '</div>' +
    (usedTypes.length>1 ? '<div class="chipwrap" id="exFilterChips" style="margin-bottom:14px;">' +
      ['All'].concat(usedTypes).map(function(f){
        return '<button class="chip'+(expenseFilter===f?' sel':'')+'" data-f="'+esc(f)+'">'+esc(f)+'</button>';
      }).join('') + '</div>' : '') +
    '<div class="card" style="padding:6px 10px;margin-bottom:10px;">' +
      (list.length ? list.map(function(e){return expenseRow(e,'');}).join('') +
        '<div class="kv" style="margin-top:6px;"><span class="k">'+list.length+' expense(s)</span><span class="v">'+fmtMoney(expenseTotal(list))+'</span></div>'
        : emptyState('No expenses yet','Tap + Add to record salary, fuel, rentals or anything else.')) +
    '</div>' +
    '<div class="linkrow" onclick="openExpenseTypes()"><span>Manage expense types</span><svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
  el.querySelectorAll('#exFilterChips .chip').forEach(function(btn){
    btn.onclick = function(){ expenseFilter = btn.dataset.f; renderExpenses(); };
  });
}
renderers.expenses = renderExpenses;

// A new expense for an event defaults to that event's date; otherwise today.
function defaultExpenseDate(bookingId){
  var b = bookingId ? DB.bookings.find(function(x){return x.id===bookingId;}) : null;
  return (b && b.eventDate) || todayStr();
}
// ctx: '' = back to current tab, 'event' = back to that event's spend summary, 'booking' = back to booking detail
function openExpenseForm(id, presetBookingId, ctx){
  var e = id ? DB.expenses.find(function(x){return x.id===id;}) : null;
  if(id && !e) return;
  var types = DB.settings.expenseTypes.slice();
  if(e && e.type && types.indexOf(e.type)===-1) types.push(e.type);
  var bookingId = e ? (e.bookingId||'') : (presetBookingId||'');
  if(!ctx && presetBookingId) ctx = 'event';
  var bookings = DB.bookings.filter(function(b){return b.status!=='cancelled' || b.id===bookingId;}).slice().sort(byEventDateDesc);
  var opts = '<option value="">General — not for a specific event</option>' + bookings.map(function(b){
    return '<option value="'+b.id+'"'+(b.id===bookingId?' selected':'')+'>'+esc(fmtDateShort(b.eventDate)+' · '+b.name+' · '+b.eventType)+'</option>';
  }).join('');
  var body =
    '<div class="field"><label>Expense type</label>' + chips('xType', types.concat([NEW_TYPE_CHIP]), e ? e.type : '') +
      otherBox('xTypeNew', 'Name the new type, e.g. Decor', false) + '</div>' +
    '<div class="field"><label>Amount (₹)</label><input type="number" id="xAmt" inputmode="decimal" value="'+(e?Number(e.amount)||'':'')+'" placeholder="e.g. 2500"></div>' +
    '<div class="field"><label>Date</label><input type="date" id="xDate" value="'+esc(e ? e.date : defaultExpenseDate(bookingId))+'"></div>' +
    '<div class="field"><label>For event</label><select id="xBooking">'+opts+'</select></div>' +
    '<div class="field"><label>Paid to / notes <span style="opacity:.6">(optional)</span></label><input type="text" id="xNote" value="'+esc(e?e.note:'')+'" placeholder="e.g. Ravi — sound tech"></div>';
  var foot = (e ? '<div class="btnrow"><button class="btn danger" id="xDelBtn">Delete</button><button class="btn primary" id="xSaveBtn">Save changes</button></div>'
                : '<button class="btn primary" id="xSaveBtn">Add expense</button>');
  openSheet(e ? 'Edit Expense' : 'Add Expense', body, foot);
  wireChips('xType', false, function(){});
  wireOtherBox('xType', 'xTypeNew', [NEW_TYPE_CHIP]);
  if(!e){ // picking another event moves the date to that event's date, unless you've typed your own
    var dateTouched = false;
    document.getElementById('xDate').addEventListener('change', function(){ dateTouched = true; });
    document.getElementById('xBooking').addEventListener('change', function(){
      if(!dateTouched) document.getElementById('xDate').value = defaultExpenseDate(this.value);
    });
  }
  function back(bid){
    if(ctx==='event' && bid) openEventSpend(bid);
    else if(ctx==='booking' && bid) openBookingDetail(bid);
    else if(ctx==='summary') openSpendSummary();
    else closeSheet();
    if(renderers[currentTab]) renderers[currentTab]();
  }
  document.getElementById('xSaveBtn').onclick = function(){
    var type = getChipValue('xType', false);
    if(type===NEW_TYPE_CHIP){
      type = document.getElementById('xTypeNew').value.trim();
      if(!type){ toast('Name the new expense type'); return; }
      var existing = DB.settings.expenseTypes.find(function(t){return t.toLowerCase()===type.toLowerCase();});
      if(existing) type = existing; else DB.settings.expenseTypes.push(type);
    }
    if(!type){ toast('Pick an expense type'); return; }
    var amt = Number(document.getElementById('xAmt').value)||0;
    if(amt<=0){ toast('Enter the amount'); return; }
    var rec = e || {id:uid('EXP'), createdAt:nowIso()};
    rec.type = type; rec.amount = amt; rec.date = document.getElementById('xDate').value || todayStr();
    rec.bookingId = document.getElementById('xBooking').value || null;
    rec.note = document.getElementById('xNote').value.trim();
    if(e) rec.updatedAt = nowIso(); else DB.expenses.push(rec);
    saveData(); back(rec.bookingId || bookingId); toast(e ? 'Expense updated' : 'Expense added');
  };
  if(e) document.getElementById('xDelBtn').onclick = function(){
    confirmModal({title:'Delete this expense?', message:fmtMoney(e.amount)+' — '+e.type+' on '+fmtDate(e.date)+'.', okText:'Delete', danger:true,
      onOk:function(){ DB.expenses = DB.expenses.filter(function(x){return x.id!==e.id;}); saveData(); back(e.bookingId); toast('Expense deleted'); }});
  };
}

function openExpenseTypes(){
  var types = DB.settings.expenseTypes;
  var body =
    '<div class="hint" style="margin-bottom:12px;">These show as choices when you add an expense. You can also create a type on the spot from the expense form. Removing a type here keeps any expenses already recorded under it.</div>' +
    '<div class="card" style="padding:6px 10px;margin-bottom:14px;">' +
      (types.length ? types.map(function(t, idx){
        var used = DB.expenses.filter(function(e){return e.type===t;}).length;
        return '<div class="list-row"><div class="row-main"><div class="row-title">'+esc(t)+'</div><div class="row-sub">'+(used?used+' expense(s)':'not used yet')+'</div></div>' +
          '<button class="iconbtn" aria-label="Remove" onclick="removeExpenseType('+idx+')"><svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>';
      }).join('') : emptyState('No types yet','Add one below.')) +
    '</div>' +
    '<div class="field"><label>New expense type</label><input type="text" id="xtNew" placeholder="e.g. Decor, Venue fee, Tolls"></div>';
  openSheet('Expense Types', body, '<button class="btn primary" id="xtAdd">Add type</button>');
  document.getElementById('xtAdd').onclick = function(){
    var v = document.getElementById('xtNew').value.trim();
    if(!v){ toast('Type a name first'); return; }
    if(DB.settings.expenseTypes.some(function(t){return t.toLowerCase()===v.toLowerCase();})){ toast('That type already exists'); return; }
    DB.settings.expenseTypes.push(v); saveData(); openExpenseTypes(); toast('Type added');
  };
}
function removeExpenseType(idx){
  var t = DB.settings.expenseTypes[idx]; if(t==null) return;
  DB.settings.expenseTypes.splice(idx,1); saveData(); openExpenseTypes();
  if(renderers[currentTab]) renderers[currentTab](); toast('"'+t+'" removed');
}

/* ---- Overall spend summary → per-event list → per-event summary ---- */
function openSpendSummary(){
  var t = spendTotals();
  var events = DB.bookings.filter(function(b){ return isLiveBooking(b) || expensesFor(b.id).length; }).slice().sort(byEventDateDesc);
  var evSpend = 0;
  var rows = events.map(function(b){
    var spend = expenseTotal(expensesFor(b.id)) + (isLiveBooking(b) ? resourceMoney(b,'out') : 0), rev = bookingRevenue(b), pr = rev - spend;
    evSpend += spend;
    return '<tr onclick="openEventSpend(\''+b.id+'\')">' +
      '<td>'+fmtDateShort(b.eventDate)+'</td><td>'+esc(b.name)+(b.status==='cancelled'?' <span class="badge cancelled">cancelled</span>':(!hasPayment(b)?' <span class="badge pending">no payment</span>':''))+'</td><td>'+esc(b.eventType)+'</td>' +
      '<td class="num">'+fmtMoney(rev)+'</td><td class="num">'+fmtMoney(spend)+'</td>' +
      '<td class="num" style="color:'+profitColor(pr)+';font-weight:700">'+fmtMoney(pr)+'</td></tr>';
  }).join('');
  var evRev = events.reduce(function(s,b){return s+bookingRevenue(b);},0);
  var body =
    '<div class="card" style="margin-bottom:14px;">' +
      '<div class="kv"><span class="k">Revenue (active bookings)</span><span class="v">'+fmtMoney(t.revenue)+'</span></div>' +
      '<div class="kv"><span class="k">Collected so far</span><span class="v" style="color:var(--good)">'+fmtMoney(t.collected)+'</span></div>' +
      (t.discounts ? '<div class="kv"><span class="k">Discounts given (already taken off revenue)</span><span class="v">'+fmtMoney(t.discounts)+'</span></div>' : '') +
      (t.resIn ? '<div class="kv"><span class="k">Resources — money in (included in revenue)</span><span class="v" style="color:var(--good)">+'+fmtMoney(t.resIn)+'</span></div>' : '') +
      '<div class="kv"><span class="k">Event expenses</span><span class="v">'+fmtMoney(t.eventSpend)+'</span></div>' +
      '<div class="kv"><span class="k">General expenses (salary, overheads…)</span><span class="v">'+fmtMoney(t.general)+'</span></div>' +
      '<div class="kv"><span class="k">Resources — money out (complimentary etc.)</span><span class="v">'+fmtMoney(t.resOut)+'</span></div>' +
      '<div class="kv"><span class="k"><b>Total expenses</b></span><span class="v" style="color:var(--warn)">'+fmtMoney(t.total)+'</span></div>' +
      '<div class="kv"><span class="k"><b>Profit after expenses</b></span><span class="v" style="color:'+profitColor(t.profit)+'">'+fmtMoney(t.profit)+(t.revenue>0?' ('+t.margin.toFixed(0)+'%)':'')+'</span></div>' +
      '<div class="kv"><span class="k">Cash profit (collected − expenses)</span><span class="v" style="color:'+profitColor(t.cashProfit)+'">'+fmtMoney(t.cashProfit)+'</span></div>' +
    '</div>' +
    '<div class="section-title">Spend by type</div>' +
    '<div class="card" style="margin-bottom:14px;">'+typeBreakdownHtml(DB.expenses)+'</div>' +
    '<div class="section-title">Per-event summary <span style="opacity:.6;text-transform:none;font-weight:600;">— tap an event</span></div>' +
    (events.length ? '<div style="overflow-x:auto;margin-bottom:14px;"><table class="dtable"><thead><tr>' +
      '<th>Date</th><th>Client</th><th>Event</th><th class="num">Revenue</th><th class="num">Spend</th><th class="num">Profit</th>' +
      '</tr></thead><tbody>'+rows+'</tbody>' +
      '<tfoot><tr><td colspan="6">'+events.length+' event(s) &middot; Revenue '+fmtMoney(evRev)+' &middot; Event spend '+fmtMoney(evSpend)+' &middot; Profit before general expenses '+fmtMoney(evRev-evSpend)+'</td></tr></tfoot>' +
      '</table></div>' : emptyState('No bookings yet','')) +
    '<div class="hint">Revenue = booking amount − discounts + resources marked money in. Profit = revenue minus every expense (event and general) and resources marked money out. Per-event profit only subtracts that event\'s own expenses and money-out resources.</div>';
  openSheet('Spend Summary', body, '<button class="btn primary" onclick="openExpenseForm(null,null,\'summary\')">+ Add expense</button>');
}
function openEventSpend(bookingId){
  var b = DB.bookings.find(function(x){return x.id===bookingId;});
  if(!b) return;
  var list = expensesFor(b.id).sort(function(x,y){return (y.date||'').localeCompare(x.date||'');});
  var resOut = resourceMoney(b,'out'), resIn = resourceMoney(b,'in'), disc = discountTotal(b);
  var spend = expenseTotal(list) + resOut, rev = bookingRevenue(b), pr = rev - spend;
  var body =
    '<div class="card" style="margin-bottom:14px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        '<div style="font-weight:700;font-size:16px;">'+esc(b.name)+'</div><span class="badge '+b.status+'">'+b.status+'</span></div>' +
      '<div class="kv"><span class="k">Event</span><span class="v">'+esc(b.eventType)+' · '+fmtDate(b.eventDate)+'</span></div>' +
      '<div class="kv"><span class="k">Revenue'+(disc||resIn?' <span style="opacity:.7">(after discounts'+(resIn?', incl. money-in resources':'')+')</span>':'')+'</span><span class="v">'+fmtMoney(rev)+'</span></div>' +
      '<div class="kv"><span class="k">Collected</span><span class="v" style="color:var(--good)">'+fmtMoney(paidSoFarAll(b))+'</span></div>' +
      '<div class="kv"><span class="k">Balance due</span><span class="v">'+fmtMoney(balanceDue(b))+'</span></div>' +
      (resOut ? '<div class="kv"><span class="k">Resources — money out</span><span class="v">'+fmtMoney(resOut)+'</span></div>' : '') +
      '<div class="kv"><span class="k"><b>Expenses</b></span><span class="v" style="color:var(--warn)">'+fmtMoney(spend)+'</span></div>' +
      '<div class="kv"><span class="k"><b>Profit</b></span><span class="v" style="color:'+profitColor(pr)+'">'+fmtMoney(pr)+(rev>0?' ('+(pr/rev*100).toFixed(0)+'%)':'')+'</span></div>' +
    '</div>' +
    '<div class="section-title">Spend by type</div>' +
    '<div class="card" style="margin-bottom:14px;">'+typeBreakdownHtml(list)+'</div>' +
    '<div class="section-title">Expenses for this event</div>' +
    '<div class="card" style="padding:6px 10px;margin-bottom:14px;">' +
      (list.length ? list.map(function(e){return expenseRow(e,'event');}).join('') : emptyState('Nothing recorded yet','Add crew wages, fuel, food or any other cost for this event.')) +
    '</div>' +
    '<button class="btn ghost" style="margin-bottom:10px;" onclick="openBookingDetail(\''+b.id+'\')">Open booking</button>';
  openSheet('Event Spend', body, '<button class="btn primary" onclick="openExpenseForm(null,\''+b.id+'\',\'event\')">+ Add expense for this event</button>');
  setSheetHeadExtra('<button class="btn ghost sm" onclick="openSpendSummary()">All events</button>');
}
function bookingSpendCardHtml(b){
  var exp = expenseTotal(expensesFor(b.id)), resOut = resourceMoney(b,'out');
  var spend = exp + resOut, pr = bookingRevenue(b) - spend;
  return '<div class="section-title">Spend &amp; profit</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      '<div class="kv"><span class="k">Expenses for this event</span><span class="v" style="color:var(--warn)">'+fmtMoney(exp)+'</span></div>' +
      (resOut ? '<div class="kv"><span class="k">Resources — money out</span><span class="v" style="color:var(--warn)">'+fmtMoney(resOut)+'</span></div>' : '') +
      (!isLiveBooking(b) ? '<div class="hint" style="margin:6px 0 0;">'+(b.status==='cancelled'?'Cancelled':'No payment yet')+' — this event isn\'t counted in revenue or profit.</div>' : '') +
      '<div class="kv"><span class="k">Profit</span><span class="v" style="color:'+profitColor(pr)+'">'+fmtMoney(pr)+'</span></div>' +
      '<div class="btnrow" style="margin-top:10px;">' +
        '<button class="btn ghost sm" onclick="openEventSpend(\''+b.id+'\')">Spend summary</button>' +
        '<button class="btn ghost sm" onclick="openExpenseForm(null,\''+b.id+'\',\'booking\')">+ Add expense</button>' +
      '</div>' +
    '</div>';
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
  var usedCount = liveBookings().filter(function(b){ return allocatedResources(b).some(function(x){return x.id===r.id;}); }).length;
  var money = r.flow==='in' ? '<span class="badge paid" style="margin-left:4px;">money in +'+fmtMoney(r.amount)+'</span>'
            : r.flow==='out' ? '<span class="badge cancelled" style="margin-left:4px;">money out −'+fmtMoney(r.amount)+'</span>' : '';
  var sub = [r.notes||'', usedCount ? 'used in '+usedCount+' booking(s)' : ''].filter(Boolean).join(' · ');
  return '<div class="list-row">' +
    '<div class="row-main"><div class="row-title">'+esc(r.name)+(r.active?'':' <span class="badge cancelled" style="margin-left:4px;">inactive</span>')+money+'</div>' +
    '<div class="row-sub">'+esc(sub)+'</div></div>' +
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
    '<div class="field"><label>Name</label><input type="text" id="rName" placeholder="e.g. Setup 4 / New Tempo Traveller / Complimentary cake" value="'+esc(r?r.name:'')+'"></div>' +
    '<div class="field"><label>Money</label>' + chips('rFlow', MONEY_FLOWS.map(function(m){return m.label;}), (MONEY_FLOWS.find(function(m){return m.key===(r?r.flow||'':'');})||MONEY_FLOWS[0]).label) +
      '<div id="rAmtWrap" style="margin-top:10px;'+(r&&r.flow?'':'display:none;')+'"><input type="number" id="rAmt" placeholder="Amount per booking (₹)" value="'+(r&&r.amount?Number(r.amount):'')+'"></div>' +
      '<div class="hint">Money in: an add-on the client pays for — added to the booking amount. Money out: a cost such as a complimentary item — taken off profit. Each booking it\'s allocated to counts this amount.</div></div>' +
    '<div class="field"><label>Notes <span style="opacity:.6">(optional)</span></label><textarea id="rNotes" placeholder="Optional">'+esc(r?r.notes:'')+'</textarea></div>' +
    '<div class="field"><label>Status</label>' + chips('rActive', ['Active','Inactive'], r&&!r.active?'Inactive':'Active') + '</div>';
  var foot = '<button class="btn primary" id="rSaveBtn">'+(r?'Save changes':'Add resource')+'</button>';
  openSheet(r?'Edit Resource':'Add Resource', body, foot);
  wireChips('rType', false, function(){}); wireChips('rActive', false, function(){});
  wireChips('rFlow', false, function(v){ document.getElementById('rAmtWrap').style.display = (v && v!==MONEY_FLOWS[0].label) ? '' : 'none'; });
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
    var flowObj = MONEY_FLOWS.find(function(m){return m.label===getChipValue('rFlow', false);}) || MONEY_FLOWS[0];
    var amount = flowObj.key ? (Number(document.getElementById('rAmt').value)||0) : 0;
    if(flowObj.key && amount<=0){ toast('Enter the amount for '+flowObj.label.toLowerCase()); return; }
    if(r){ r.type=typeKey; r.name=name; r.notes=notes; r.active=active; r.flow=flowObj.key; r.amount=amount; r.updatedAt=nowIso(); }
    else DB.resources.push({id:uid('RES'), type:typeKey, name:name, notes:notes, active:active, flow:flowObj.key, amount:amount, createdAt:nowIso()});
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
        b.equipmentResourceIds = (b.equipmentResourceIds||[]).filter(function(x){return x!==id;});
        b.transportResourceIds = (b.transportResourceIds||[]).filter(function(x){return x!==id;});
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
  var inqFields = ['name','phone','altPhone','email','partyHall','location','area','eventType','channel','inquiryType','notes','inquiryDate','eventDate','status'];
  var bkFields = ['name','phone','altPhone','partyHall','location','area','eventType','channel','notes','eventDate','bookingDate','status'];
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
        return searchResultRow(initials(i.name), i.name, (i.eventType||'')+' · '+(locationText(i)||'—'), i.status, statusLabel(i.status), "openInquiryDetail('"+i.id+"')");
      }).join('') + '</div>';
  }
  if(bkMatches.length){
    html += '<div class="section-title">Bookings &amp; quotes ('+bkMatches.length+')</div><div class="card" style="padding:6px 10px;margin-bottom:14px;">' +
      bkMatches.map(function(b){
        return searchResultRow(initials(b.name), b.name, (b.eventType||'')+' · '+fmtDateShort(b.eventDate), hasPayment(b)?b.status:'open', hasPayment(b)?b.status:'quote', "openBookingDetail('"+b.id+"')");
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

  setTimeout(function(){ if(document.getElementById('calMethod')) wireChips('calMethod', false, function(){}); }, 0);
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
    calendarSettingsHtml() +
    '<div class="section-title">Expenses</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      '<div class="linkrow" onclick="openExpenseTypes()"><span>Expense types ('+DB.settings.expenseTypes.length+')</span><svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<div class="linkrow" onclick="openSpendSummary()"><span>Spend &amp; profit summary</span><svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
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
function calendarSettingsHtml(){
  var c = DB.settings.calendar;
  var tzs = [];
  try{ if(Intl.supportedValuesOf) tzs = Intl.supportedValuesOf('timeZone'); }catch(e){}
  ['Asia/Kolkata','Europe/London', browserTz()].forEach(function(z){ if(tzs.indexOf(z)===-1) tzs.unshift(z); });
  if(c.timezone && tzs.indexOf(c.timezone)===-1) tzs.unshift(c.timezone);
  return '<div class="section-title">Calendar</div>' +
    '<div class="card" style="margin-bottom:14px;">' +
      '<div class="field" style="margin-bottom:12px;"><label>Add events using</label>' + chips('calMethod', CAL_METHODS.map(function(m){return m.label;}), (CAL_METHODS.find(function(m){return m.key===c.method;})||CAL_METHODS[0]).label) + '</div>' +
      '<div class="field" style="margin-bottom:12px;"><label>Google account email <span style="opacity:.6">(optional)</span></label><input type="text" id="calAccount" placeholder="you@gmail.com" value="'+esc(c.account||'')+'"></div>' +
      '<div class="field" style="margin-bottom:12px;"><label>Event times are in</label><select id="calTz">'+tzs.map(function(z){return '<option'+(z===c.timezone?' selected':'')+'>'+esc(z)+'</option>';}).join('')+'</select></div>' +
      '<div class="field" style="margin-bottom:8px;"><label>Default event length when no end time (hours)</label><input type="number" id="calDur" min="1" max="24" value="'+(Number(c.defaultDurationHrs)||5)+'"></div>' +
      '<div class="hint" style="margin-bottom:10px;">Bookings open in your calendar on their own date and start time, ready for you to confirm. If you use more than one Google account, enter the one to add events to. If Google opens on today\'s date on your phone, switch to the classic link, or to the phone calendar file (best on iPhone). Use the test button to check.</div>' +
      '<div class="btnrow"><button class="btn ghost sm" onclick="testCalendar()">Test with tomorrow 7 PM</button><button class="btn ghost sm" onclick="saveCalendarSettings()">Save</button></div>' +
    '</div>';
}
function readCalendarSettings(){
  var c = DB.settings.calendar;
  if(document.getElementById('calMethod')){
    var lbl = getChipValue('calMethod', false), m = CAL_METHODS.find(function(x){return x.label===lbl;});
    if(m) c.method = m.key;
    c.account = document.getElementById('calAccount').value.trim();
    c.timezone = document.getElementById('calTz').value || browserTz();
    c.defaultDurationHrs = clamp(Number(document.getElementById('calDur').value)||5, 1, 24);
  }
}
function saveCalendarSettings(){ readCalendarSettings(); saveData(); toast('Calendar settings saved'); }
function testCalendar(){
  readCalendarSettings(); saveData();
  var d = new Date(); d.setDate(d.getDate()+1);
  openCalendarEvent({title:'Test — ReY Events calendar link', details:'If this shows tomorrow at 7:00 PM, your calendar setup works. You can discard it.',
    date: localDateTimeStr(d).slice(0,10), startTime:'19:00', endTime:'20:00'});
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
    DB.resources.filter(function(x){return x.sample;}).length +
    DB.expenses.filter(function(x){return x.sample;}).length;
  if(count===0){ toast('No sample data left to clear'); return; }
  confirmModal({
    title:'Clear sample data?', message:'Removes the '+count+' example inquiries, followups, bookings and resources created when you first set up the app. Anything you have added or edited yourself stays.',
    okText:'Clear sample data',
    onOk:function(){
      DB.inquiries = DB.inquiries.filter(function(x){return !x.sample;});
      DB.followups = DB.followups.filter(function(x){return !x.sample;});
      DB.bookings = DB.bookings.filter(function(x){return !x.sample;});
      DB.resources = DB.resources.filter(function(x){return !x.sample;});
      DB.expenses = DB.expenses.filter(function(x){return !x.sample;});
      saveData();
      if(renderers[currentTab]) renderers[currentTab]();
      toast('Sample data cleared');
    }
  });
}
function resetAppFromMore(){
  confirmModal({
    title:'Erase everything?', warn:'This permanently deletes ALL inquiries, follow-ups, bookings, payments, expenses and resources in '+(VIEW_USER ? VIEW_USER.username+'\'s' : 'this')+' account. The login itself stays.',
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
      'Email': i.email||'', 'Location': i.location, 'Event Type': i.eventType, 'Event Date': i.eventDate, 'Event Time': i.eventTime||'',
      'Channel': i.channel, 'Inquiry Type': i.inquiryType, 'Status': i.status, 'Notes': i.notes||'',
      'Party Hall': i.partyHall||'', 'Area': i.area||''
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
      'Equipment ID': (b.equipmentResourceIds||[]).join(','), 'Equipment': (b.equipmentResourceIds||[]).map(resourceName).filter(Boolean).join(', '),
      'Transport ID': (b.transportResourceIds||[]).join(','), 'Transport': (b.transportResourceIds||[]).map(resourceName).filter(Boolean).join(', '),
      'Extra Resource IDs': (b.extraResourceIds||[]).join(','),
      'Extra Resources': (b.extraResourceIds||[]).map(resourceName).filter(Boolean).join(', '),
      'Status': b.status, 'Added to Calendar': b.calendarAdded ? 'Yes' : 'No', 'Notes': b.notes||'',
      'Start Time': b.startTime||'', 'End Time': b.endTime||'', 'Expenses': bookingCosts(b), 'Profit': bookingRevenue(b) - bookingCosts(b),
      'Party Hall': b.partyHall||'', 'Area': b.area||'', 'Discount': discountTotal(b), 'Client Pays': bookingNet(b),
      'Booked': hasPayment(b) ? 'Yes' : 'No (quote)', 'Custom Allocation': JSON.stringify(b.allocCustom||{})
    };
  });

  var paymentsRows = [];
  DB.bookings.forEach(function(b){
    (b.payments||[]).forEach(function(p){
      paymentsRows.push({
        'ID': p.id, 'Booking ID': b.id,
        'Client Name': b.name, 'Event Date': b.eventDate, 'Payment Date': p.date, 'Amount': Number(p.amount)||0,
        'Method': p.method||'', 'Note': p.note||'', 'Advance': p.isAdvance ? 'Yes' : 'No'
      });
    });
  });

  var expenseRows = DB.expenses.slice().sort(function(a,b){return (a.date||'').localeCompare(b.date||'');}).map(function(e){
    var b = e.bookingId ? DB.bookings.find(function(x){return x.id===e.bookingId;}) : null;
    return {'ID': e.id, 'Booking ID': e.bookingId||'', 'Created At': e.createdAt||'', 'Date': e.date, 'Type': e.type, 'Amount': Number(e.amount)||0,
      'Event': b ? (b.name+' — '+b.eventType+' ('+b.eventDate+')') : 'General', 'Notes': e.note||''};
  });
  var resourceRows = DB.resources.map(function(r){
    return { 'ID': r.id, 'Created At': r.createdAt, 'Type': r.type, 'Name': r.name, 'Notes': r.notes||'', 'Active': r.active ? 'Yes' : 'No',
      'Money': r.flow==='in' ? 'Money in' : r.flow==='out' ? 'Money out' : '', 'Amount': Number(r.amount)||0 };
  });

  var health = computeHealth();
  var activeBookings = liveBookings();
  var totalRevenue = activeBookings.reduce(function(sum,b){return sum+bookingNet(b);},0);
  var allCosts = spendTotals().total;
  var summaryRows = [
    ['ReY Events Manager — data export', ''],
    ['Exported at', new Date().toLocaleString('en-IN')],
    ['Business name', s.businessName||''],
    ['Owner name', s.ownerName||''],
    ['', ''],
    ['Total inquiries', DB.inquiries.length],
    ['Total active bookings', activeBookings.length],
    ['Total revenue (active bookings)', totalRevenue],
    ['Total expenses (incl. money-out resources)', allCosts],
    ['Profit after expenses', totalRevenue - allCosts],
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
    ['transportAlreadyRecovered', Number(s.transportAlreadyRecovered)||0],
    ['expenseTypes', JSON.stringify(s.expenseTypes||[])],
    ['calendar', JSON.stringify(s.calendar||{})]
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
  wsInq['!cols'] = [XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,{wch:12},{wch:20},{wch:13},{wch:13},{wch:20},{wch:16},{wch:16},{wch:12},{wch:10},{wch:18},{wch:13},{wch:10},{wch:30},{wch:22},{wch:14}];
  XLSX.utils.book_append_sheet(wb, wsInq, 'Inquiries');

  var wsFu = XLSX.utils.json_to_sheet(followupRows);
  wsFu['!cols'] = [XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,{wch:20},XLSX_HIDDEN_COL,{wch:18},{wch:26},{wch:8}];
  XLSX.utils.book_append_sheet(wb, wsFu, 'Follow-ups');

  var wsBk = XLSX.utils.json_to_sheet(bookingsRows);
  wsBk['!cols'] = [XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,{wch:12},{wch:12},{wch:16},{wch:20},{wch:13},{wch:13},{wch:20},{wch:16},{wch:13},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},XLSX_HIDDEN_COL,{wch:14},XLSX_HIDDEN_COL,{wch:14},XLSX_HIDDEN_COL,{wch:18},{wch:10},{wch:12},{wch:30},{wch:10},{wch:10},{wch:12},{wch:12},{wch:22},{wch:14},{wch:10},{wch:12},{wch:12},XLSX_HIDDEN_COL];
  XLSX.utils.book_append_sheet(wb, wsBk, 'Bookings');

  var wsPay = XLSX.utils.json_to_sheet(paymentsRows);
  wsPay['!cols'] = [XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,{wch:20},{wch:12},{wch:12},{wch:10},{wch:12},{wch:26},{wch:8}];
  XLSX.utils.book_append_sheet(wb, wsPay, 'Payments');
  var discountRows = [];
  DB.bookings.forEach(function(b){
    (b.discounts||[]).forEach(function(d){
      discountRows.push({'ID': d.id, 'Booking ID': b.id, 'Client Name': b.name, 'Event Date': b.eventDate, 'Date': d.date, 'Amount': Number(d.amount)||0, 'Reason': d.note||''});
    });
  });
  var wsDisc = discountRows.length ? XLSX.utils.json_to_sheet(discountRows)
    : XLSX.utils.aoa_to_sheet([['ID','Booking ID','Client Name','Event Date','Date','Amount','Reason']]);
  wsDisc['!cols'] = [XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,{wch:20},{wch:12},{wch:12},{wch:10},{wch:26}];
  XLSX.utils.book_append_sheet(wb, wsDisc, 'Discounts');

  var wsExp = expenseRows.length ? XLSX.utils.json_to_sheet(expenseRows)
    : XLSX.utils.aoa_to_sheet([['ID','Booking ID','Created At','Date','Type','Amount','Event','Notes']]);
  wsExp['!cols'] = [XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,{wch:12},{wch:18},{wch:10},{wch:34},{wch:26}];
  XLSX.utils.book_append_sheet(wb, wsExp, 'Expenses');

  var wsRes = XLSX.utils.json_to_sheet(resourceRows);
  wsRes['!cols'] = [XLSX_HIDDEN_COL,XLSX_HIDDEN_COL,{wch:12},{wch:20},{wch:26},{wch:8},{wch:11},{wch:10}];
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
          notes:r['Notes']||'', active: r['Active']!=='No',
          flow: r['Money']==='Money in' ? 'in' : r['Money']==='Money out' ? 'out' : '', amount: Number(r['Amount'])||0};
      });

      var inquiries = inqRows.map(function(r){
        return {
          id:String(r['ID']), createdAt:r['Created At']||nowIso(), inquiryDate:r['Inquiry Date']||todayStr(),
          name:r['Client Name']||'', phone:String(r['Phone']||''), altPhone:String(r['Alternate Phone']||''),
          email:r['Email']||'', location:r['Location']||'', eventType:r['Event Type']||'', eventDate:r['Event Date']||'', eventTime:String(r['Event Time']||''),
          channel:r['Channel']||'', inquiryType:r['Inquiry Type']||'New Client', status:r['Status']||'open', notes:r['Notes']||'',
          partyHall:r['Party Hall']||'', area:r['Area']||''
        };
      });

      var followups = fuRows.filter(function(r){return r['ID'];}).map(function(r){
        return {
          id:String(r['ID']), inquiryId:String(r['Inquiry ID']||''), createdAt:r['Created At']||nowIso(),
          dueAt:r['Due At (raw)']||new Date().toISOString(), note:r['Note']||'', done: r['Done']==='Yes'
        };
      });

      function idList(v){ return v ? String(v).split(',').map(function(x){return x.trim();}).filter(Boolean) : []; }
      var bookings = bkRows.map(function(r){
        return {
          id:String(r['ID']), inquiryId:String(r['Inquiry ID']||''), createdAt:r['Created At']||nowIso(),
          bookingDate:r['Booking Date']||todayStr(), eventDate:r['Event Date']||'', eventType:r['Event Type']||'',
          name:r['Client Name']||'', phone:String(r['Phone']||''), altPhone:String(r['Alternate Phone']||''),
          location:r['Location']||'', channel:r['Channel']||'',
          totalAmount:Number(r['Total Amount'])||0, advanceAmount:Number(r['Advance Amount'])||0, advanceDate:r['Advance Date']||'',
          equipmentResourceIds: idList(r['Equipment ID']),
          transportResourceIds: idList(r['Transport ID']),
          partyHall: r['Party Hall']||'', area: r['Area']||'', discounts: [],
          allocCustom: (function(){ try{ return r['Custom Allocation'] ? JSON.parse(r['Custom Allocation']) : {}; }catch(e){ return {}; } })(),
          extraResourceIds: r['Extra Resource IDs'] ? String(r['Extra Resource IDs']).split(',').map(function(x){return x.trim();}).filter(Boolean) : [],
          status:r['Status']||'confirmed', calendarAdded: r['Added to Calendar']==='Yes', notes:r['Notes']||'', payments:[],
          startTime:String(r['Start Time']||''), endTime:String(r['End Time']||'')
        };
      });
      payRows.forEach(function(r){
        var b = bookings.find(function(x){return x.id===String(r['Booking ID']);});
        if(b) b.payments.push({id:String(r['ID']||uid('PAY')), amount:Number(r['Amount'])||0, date:r['Payment Date']||'', method:r['Method']||'', note:r['Note']||'', isAdvance: r['Advance']==='Yes' || r['Note']==='Advance payment'});
      });
      if(wb.SheetNames.indexOf('Discounts')>-1) rows('Discounts').forEach(function(r){
        var b = bookings.find(function(x){return x.id===String(r['Booking ID']);});
        if(b && r['ID']) b.discounts.push({id:String(r['ID']), amount:Number(r['Amount'])||0, date:r['Date']||'', note:r['Reason']||''});
      });

      var expenses = wb.SheetNames.indexOf('Expenses')>-1 ? rows('Expenses').filter(function(r){return r['ID'];}).map(function(r){
        return {id:String(r['ID']), bookingId: r['Booking ID'] ? String(r['Booking ID']) : null, createdAt:r['Created At']||nowIso(),
          date:r['Date']||todayStr(), type:r['Type']||'Miscellaneous', amount:Number(r['Amount'])||0, note:r['Notes']||''};
      }) : [];
      function jsonSetting(k, fallback){ try{ return settingsMap[k] ? JSON.parse(settingsMap[k]) : fallback; }catch(e){ return fallback; } }
      var incoming = {
        createdAt: settingsMap.dbCreatedAt || nowIso(),
        inquiries: inquiries, followups: followups, bookings: bookings, resources: resources, expenses: expenses,
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
          notifPermAsked: false,
          expenseTypes: jsonSetting('expenseTypes', DEFAULT_EXPENSE_TYPES.slice()),
          calendar: jsonSetting('calendar', DB.settings.calendar)
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
window.fabAction = fabAction; window.editInquiry = editInquiry; window.openBookingEditForm = openBookingEditForm;
window.openCalendar = openCalendar; window.testCalendar = testCalendar; window.saveCalendarSettings = saveCalendarSettings;
window.openExpenseForm = openExpenseForm; window.openExpenseTypes = openExpenseTypes; window.removeExpenseType = removeExpenseType;
window.openSpendSummary = openSpendSummary; window.openEventSpend = openEventSpend;
window.openDiscountForm = openDiscountForm; window.reopenInquiry = reopenInquiry;

document.addEventListener('DOMContentLoaded', init);
if(document.readyState==='complete' || document.readyState==='interactive') setTimeout(init, 0);
})();
