/**
 * EduNest Offline Indicator
 * Injects a banner when XAMPP/network is unavailable.
 * Include: <script src="offline.js"></script>
 */
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .offline-bar{position:fixed;bottom:0;left:0;right:0;background:#ef4444;color:white;
      padding:10px 20px;text-align:center;font-family:'DM Sans',sans-serif;font-size:13px;
      font-weight:600;z-index:99999;transform:translateY(100%);transition:transform .4s ease;
      display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 -4px 20px rgba(239,68,68,.3)}
    .offline-bar.show{transform:translateY(0)}
    .offline-bar.online{background:#10b981}
    .ob-dismiss{background:rgba(255,255,255,.2);border:none;color:white;padding:4px 12px;
      border-radius:6px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600}
    .ob-dismiss:hover{background:rgba(255,255,255,.35)}
  `;
  document.head.appendChild(style);

  let bar;
  let wasOffline=false;
  let dismissedOnline=false;

  function createBar(){
    bar=document.createElement('div');
    bar.className='offline-bar';
    bar.innerHTML='<span id="ob-msg">📡 XAMPP/network unavailable. Some features may not work.</span><button class="ob-dismiss" onclick="this.parentElement.classList.remove(\'show\')">✕</button>';
    document.body.appendChild(bar);
  }

  function check(){
    // Try pinging the local PHP server
    fetch('check.php',{method:'GET',cache:'no-cache'})
      .then(r=>r.ok?r.json():Promise.reject('HTTP '+r.status))
      .then(()=>{
        if(wasOffline){
          wasOffline=false; dismissedOnline=false;
          bar.className='offline-bar online';
          bar.querySelector('#ob-msg').textContent='✅ Connection restored!';
          bar.classList.add('show');
          setTimeout(()=>bar.classList.remove('show'),3000);
        }
      })
      .catch(()=>{
        wasOffline=true;
        bar.className='offline-bar';
        bar.querySelector('#ob-msg').textContent='📡 Cannot reach XAMPP. Start Apache & MySQL in XAMPP Control Panel.';
        bar.classList.add('show');
      });
  }

  window.addEventListener('online',()=>check());
  window.addEventListener('offline',()=>{wasOffline=true;bar.classList.add('show');});

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{createBar();setTimeout(check,1500);});
  } else {
    createBar(); setTimeout(check,1000);
  }

  // Re-check every 60s
  setInterval(check,60000);
})();
