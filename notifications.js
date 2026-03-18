/**
 * EduNest Notification Centre
 * Include with: <script src="notifications.js"></script>
 * Adds a bell icon to any nav that has id="navBell" placeholder,
 * or auto-injects one. Reads live data and generates alerts.
 */
(function(){
  const STORAGE_KEY = 'edunest_dismissed_notifs';
  let dismissed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  let allNotifs = [];
  let panelOpen = false;

  // ── CSS ──────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .notif-bell{position:relative;cursor:pointer;width:38px;height:38px;border-radius:50%;
      background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);
      display:flex;align-items:center;justify-content:center;font-size:17px;
      transition:.2s;flex-shrink:0;user-select:none}
    .notif-bell:hover{background:rgba(255,255,255,.22)}
    .notif-badge{position:absolute;top:-3px;right:-3px;width:18px;height:18px;
      background:#ef4444;border-radius:50%;font-size:10px;font-weight:800;color:white;
      display:flex;align-items:center;justify-content:center;border:2px solid #0f0e17;
      pointer-events:none;animation:badgePop .3s ease}
    @keyframes badgePop{0%{transform:scale(0)}70%{transform:scale(1.2)}100%{transform:scale(1)}}
    .notif-panel{position:fixed;top:68px;right:16px;width:360px;max-height:520px;
      background:var(--card,#fff);border:1.5px solid var(--border,#e8e4db);
      border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.2);z-index:9999;
      display:none;flex-direction:column;overflow:hidden;animation:panelSlide .25s ease}
    @keyframes panelSlide{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
    .notif-panel.open{display:flex}
    .np-header{padding:16px 20px;border-bottom:1px solid var(--border,#e8e4db);
      display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
    .np-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--ink,#0f0e17)}
    .np-actions{display:flex;gap:8px;align-items:center}
    .np-clear{font-size:11px;font-weight:700;color:#888;background:none;border:none;cursor:pointer;
      padding:5px 10px;border-radius:7px;transition:.2s;font-family:'DM Sans',sans-serif}
    .np-clear:hover{background:var(--bg,#f5f3ef);color:var(--ink,#0f0e17)}
    .np-close{width:28px;height:28px;border-radius:50%;background:none;border:1px solid var(--border,#e8e4db);
      cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;
      transition:.2s;color:var(--ink,#0f0e17)}
    .np-close:hover{background:var(--bg,#f5f3ef)}
    .np-list{overflow-y:auto;flex:1}
    .np-item{display:flex;gap:12px;padding:14px 18px;border-bottom:1px solid var(--border,#e8e4db);
      cursor:pointer;transition:.15s;text-decoration:none;align-items:flex-start}
    .np-item:last-child{border-bottom:none}
    .np-item:hover{background:var(--bg,#f5f3ef)}
    .np-item.dismissed{opacity:.45}
    .np-icon{font-size:20px;flex-shrink:0;width:36px;height:36px;border-radius:10px;
      display:flex;align-items:center;justify-content:center;margin-top:1px}
    .np-icon.urgent{background:#fde8e9}
    .np-icon.warn{background:#fef9c3}
    .np-icon.info{background:#dbeafe}
    .np-icon.success{background:#dcfce7}
    .np-content{flex:1}
    .np-notif-title{font-weight:700;font-size:13px;color:var(--ink,#0f0e17);margin-bottom:3px;line-height:1.4}
    .np-notif-body{font-size:12px;color:#888;line-height:1.4}
    .np-time{font-size:10px;color:#aaa;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
    .np-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px}
    .np-dot.urgent{background:#ef4444}
    .np-dot.warn{background:#f59e0b}
    .np-dot.info{background:#3b82f6}
    .np-dot.success{background:#10b981}
    .np-empty{text-align:center;padding:40px 20px;color:#aaa}
    .np-empty .ne-icon{font-size:40px;margin-bottom:10px;opacity:.5}
    .np-empty p{font-size:13px}
    .np-footer{padding:12px 18px;border-top:1px solid var(--border,#e8e4db);text-align:center;flex-shrink:0}
    .np-footer a{font-size:12px;font-weight:700;color:var(--sage,#3d6b5e);text-decoration:none}
    .np-footer a:hover{text-decoration:underline}
    @media(max-width:400px){.notif-panel{width:calc(100vw - 24px);right:12px}}
  `;
  document.head.appendChild(style);

  // ── Inject bell into nav ──────────────────────────────────
  function injectBell(){
    const nav = document.querySelector('nav');
    if(!nav || document.querySelector('.notif-bell')) return;
    const bell = document.createElement('div');
    bell.className = 'notif-bell';
    bell.title = 'Notifications';
    bell.innerHTML = '🔔';
    bell.addEventListener('click', e => { e.stopPropagation(); togglePanel(); });
    // Insert before the last element in nav (usually sign-out / theme toggle)
    const navRight = nav.querySelector('.nav-right') || nav.querySelector('.btn-logout') || nav.lastElementChild;
    if(navRight && navRight.parentNode===nav) nav.insertBefore(bell, navRight);
    else nav.appendChild(bell);
    // Panel
    const panel = document.createElement('div');
    panel.id = 'notifPanel';
    panel.className = 'notif-panel';
    panel.innerHTML = `
      <div class="np-header">
        <div class="np-title">🔔 Notifications</div>
        <div class="np-actions">
          <button class="np-clear" onclick="EduNotifs.clearAll()">Mark all read</button>
          <button class="np-close" onclick="EduNotifs.close()">×</button>
        </div>
      </div>
      <div class="np-list" id="notifList"></div>
      <div class="np-footer"><a href="analytics.html">📊 View Analytics →</a></div>`;
    document.body.appendChild(panel);
  }

  // ── Generate notifications ────────────────────────────────
  async function loadNotifications(){
    const notifs = [];
    try {
      // Tasks
      const tr = await fetch('tasks_api.php?action=get_tasks');
      const td = await tr.json();
      if(td.success){
        const today = new Date().toISOString().slice(0,10);
        const tomorrow = new Date(Date.now()+86400000).toISOString().slice(0,10);
        td.tasks.forEach(t=>{
          if(t.status==='completed') return;
          if(t.due_date && t.due_date < today){
            notifs.push({id:'task-overdue-'+t.id,type:'urgent',icon:'⚠️',title:'Overdue task',body:'"'+t.title+'" was due '+fmtDate(t.due_date),link:'tasks.html',time:'Tasks'});
          } else if(t.due_date===today){
            notifs.push({id:'task-today-'+t.id,type:'warn',icon:'📋',title:'Due today',body:'"'+t.title+'" is due today',link:'tasks.html',time:'Tasks'});
          } else if(t.due_date===tomorrow){
            notifs.push({id:'task-tomorrow-'+t.id,type:'info',icon:'📋',title:'Due tomorrow',body:'"'+t.title+'" is due tomorrow',link:'tasks.html',time:'Tasks'});
          }
        });
      }
    }catch(e){}

    try {
      // Calendar events
      const month = new Date().toISOString().slice(0,7);
      const er = await fetch('calendar_api.php?action=get_events&month='+month);
      const ed = await er.json();
      if(ed.success){
        const today = new Date().toISOString().slice(0,10);
        const tomorrow = new Date(Date.now()+86400000).toISOString().slice(0,10);
        ed.events.forEach(e=>{
          if(e.event_date===today){
            notifs.push({id:'event-today-'+e.id,type:'info',icon:'📅',title:'Event today',body:'"'+e.title+'"'+(e.event_time?' at '+fmtTime(e.event_time):''),link:'calendar.html',time:'Calendar'});
          } else if(e.event_date===tomorrow){
            notifs.push({id:'event-tomorrow-'+e.id,type:'info',icon:'📅',title:'Event tomorrow',body:'"'+e.title+'"'+(e.event_time?' at '+fmtTime(e.event_time):''),link:'calendar.html',time:'Calendar'});
          }
        });
        // Goals
        const gr = await fetch('calendar_api.php?action=get_goals');
        const gd = await gr.json();
        if(gd.success){
          gd.goals.filter(g=>g.status==='active').forEach(g=>{
            if(g.target_date && g.target_date<=tomorrow && g.target_date>=today){
              notifs.push({id:'goal-due-'+g.id,type:'warn',icon:'🎯',title:'Goal deadline near',body:'"'+g.title+'" deadline: '+fmtDate(g.target_date),link:'calendar.html',time:'Goals'});
            }
          });
        }
      }
    }catch(e){}

    try {
      // Finance — over budget
      const month = new Date().toISOString().slice(0,7);
      const [sr,br] = await Promise.all([
        fetch('finance_api.php?action=get_summary&month='+month).then(r=>r.json()),
        fetch('finance_api.php?action=get_budgets&month='+month).then(r=>r.json()),
      ]);
      if(sr.success && br.success){
        const bycat = sr.by_category||{};
        br.budgets.forEach(b=>{
          const spent = parseFloat(bycat[b.category_name]||0);
          const budget = parseFloat(b.budget_amount);
          if(budget>0){
            const pct = spent/budget*100;
            if(pct>=100){
              notifs.push({id:'budget-over-'+b.category_name,type:'urgent',icon:'💸',title:'Budget exceeded',body:b.category_name+': spent KSh '+spent.toLocaleString()+' of KSh '+budget.toLocaleString(),link:'finance.html',time:'Finance'});
            } else if(pct>=80){
              notifs.push({id:'budget-warn-'+b.category_name,type:'warn',icon:'💰',title:'Budget 80%+ used',body:b.category_name+': '+pct.toFixed(0)+'% of monthly budget spent',link:'finance.html',time:'Finance'});
            }
          }
        });
      }
    }catch(e){}

    // Check timetable — next class in <=15 min
    try{
      const clss = JSON.parse(localStorage.getItem('tt_classes')||'[]');
      const now=new Date(); const dow=now.getDay();
      if(dow>=1&&dow<=5){
        const curMins=now.getHours()*60+now.getMinutes();
        const todayCls=clss.filter(c=>c.day===dow-1);
        todayCls.forEach(c=>{
          const sm=toMins(c.start);
          const diff=sm-curMins;
          if(diff>0&&diff<=15){
            notifs.push({id:'class-soon-'+c.id,type:'info',icon:'🗓',title:'Class starting soon',body:c.name+' in '+diff+' minutes'+(c.room?' · '+c.room:''),link:'timetable.html',time:'Timetable'});
          }
        });
      }
    }catch(e){}

    allNotifs = notifs;
    updateBell();
    renderList();
  }

  function toMins(t){ const[h,m]=t.split(':').map(Number); return h*60+m; }
  function fmtDate(d){ return new Date(d+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'}); }
  function fmtTime(t){ const[h,m]=t.split(':'); const hr=parseInt(h); return `${hr%12||12}:${m} ${hr>=12?'PM':'AM'}`; }

  function updateBell(){
    const bell = document.querySelector('.notif-bell');
    if(!bell) return;
    const unread = allNotifs.filter(n=>!dismissed.includes(n.id)).length;
    const existing = bell.querySelector('.notif-badge');
    if(existing) existing.remove();
    if(unread>0){
      const badge = document.createElement('div');
      badge.className = 'notif-badge';
      badge.textContent = unread>9?'9+':unread;
      bell.appendChild(badge);
    }
  }

  function renderList(){
    const list = document.getElementById('notifList');
    if(!list) return;
    if(!allNotifs.length){
      list.innerHTML='<div class="np-empty"><div class="ne-icon">🎉</div><p>All caught up!<br>No notifications right now.</p></div>';
      return;
    }
    const sorted = [...allNotifs].sort((a,b)=>{
      const order={urgent:0,warn:1,info:2,success:3};
      return (order[a.type]||2)-(order[b.type]||2);
    });
    list.innerHTML = sorted.map(n=>{
      const isRead = dismissed.includes(n.id);
      return `
      <a href="${n.link}" class="np-item ${isRead?'dismissed':''}" onclick="EduNotifs.handleClick(event,'${n.id}','${n.link}')">
        <div class="np-icon ${n.type}">${n.icon}</div>
        <div class="np-content">
          <div class="np-notif-title">${n.title}</div>
          <div class="np-notif-body">${n.body}</div>
          <div class="np-time">${n.time}</div>
        </div>
        ${!isRead ? `<div class="np-dot ${n.type}"></div>` : '<div style="width:8px;flex-shrink:0"></div>'}
      </a>`;
    }).join('');
  }

  function togglePanel(){
    panelOpen = !panelOpen;
    const panel = document.getElementById('notifPanel');
    if(panel) panel.classList.toggle('open', panelOpen);
    if(panelOpen){
      loadNotifications();
      // Auto-mark all as read after 2 seconds of the panel being open
      setTimeout(()=>{
        if(panelOpen) clearAll();
      }, 2000);
    }
  }

  function closePanel(){
    panelOpen = false;
    const panel = document.getElementById('notifPanel');
    if(panel) panel.classList.remove('open');
  }

  function dismissNotif(id){
    if(!dismissed.includes(id)) dismissed.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
    // Immediately update the badge count and re-render
    updateBell();
    renderList();
  }

  // Called when a notification item is clicked
  function handleClick(e, id, link){
    e.preventDefault();
    // Mark as read immediately
    dismissNotif(id);
    // Navigate to the link after a tiny delay so the read state is visible
    setTimeout(()=>{ window.location.href = link; }, 120);
  }

  function clearAll(){
    dismissed = allNotifs.map(n=>n.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
    updateBell(); renderList();
  }

  // Close panel on outside click
  document.addEventListener('click', e=>{
    if(panelOpen && !e.target.closest('#notifPanel') && !e.target.closest('.notif-bell')) closePanel();
  });

  // Auto-refresh every 2 minutes
  setInterval(loadNotifications, 120000);

  // Expose API
  window.EduNotifs = {
    open: ()=>{ panelOpen=false; togglePanel(); },
    close: closePanel,
    dismiss: dismissNotif,
    handleClick,
    clearAll,
    refresh: loadNotifications,
  };

  // Init after DOM ready
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', ()=>{ injectBell(); setTimeout(loadNotifications, 1000); });
  } else {
    injectBell(); setTimeout(loadNotifications, 500);
  }
})();
