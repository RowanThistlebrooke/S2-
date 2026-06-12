/* iPhone-style passcode lock for the dashboard.
   Loaded synchronously in <head> on every page so nothing renders until unlocked.
   Note: this is client-side only — it keeps casual visitors out, but anyone
   who views the page source can read the code. Fine for a personal dashboard. */
(function () {
  var PASSCODE = "461379";
  var KEY = "dash_unlocked";
  var DEVICE_KEY = "dash_device_trusted";

  // Already unlocked this session, or this device is trusted? Do nothing.
  try {
    if (localStorage.getItem(DEVICE_KEY) === "yes") return;
    if (sessionStorage.getItem(KEY) === "yes") return;
  } catch (e) {}

  // Hide the page until the lock screen is up, to avoid a flash of content.
  var hide = document.createElement("style");
  hide.id = "lock-hide";
  hide.textContent = "html{visibility:hidden!important}";
  (document.head || document.documentElement).appendChild(hide);

  function buildLock() {
    var existing = document.getElementById("lock-hide");
    if (existing) existing.remove();

    var wrap = document.createElement("div");
    wrap.id = "lockscreen";
    wrap.innerHTML =
      '<style>' +
      '#lockscreen{position:fixed;inset:0;z-index:2147483647;display:flex;' +
      'flex-direction:column;align-items:center;justify-content:flex-start;' +
      'padding:max(64px,env(safe-area-inset-top)) 24px 40px;' +
      'background:rgba(8,8,10,0.92);backdrop-filter:blur(24px) saturate(140%);' +
      '-webkit-backdrop-filter:blur(24px) saturate(140%);' +
      'font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,sans-serif;' +
      'color:#FAFAFA;user-select:none;-webkit-user-select:none}' +
      '#lock-lock{width:34px;height:34px;margin-bottom:18px;opacity:.9}' +
      '#lock-title{font-size:19px;font-weight:600;letter-spacing:.2px;margin-bottom:34px}' +
      '#lock-dots{display:flex;gap:22px;margin-bottom:8px}' +
      '.lock-dot{width:13px;height:13px;border-radius:50%;border:1.5px solid rgba(250,250,250,.7);' +
      'transition:background .15s,transform .15s}' +
      '.lock-dot.on{background:#FAFAFA}' +
      '#lock-err{height:20px;margin:14px 0 6px;font-size:14px;color:#FF6B6B;opacity:0;transition:opacity .2s}' +
      '#lock-pad{display:grid;grid-template-columns:repeat(3,76px);gap:22px;margin-top:auto}' +
      '.lock-key{width:76px;height:76px;border-radius:50%;border:none;cursor:pointer;' +
      'background:rgba(255,255,255,.12);color:#FAFAFA;font-size:30px;font-weight:400;' +
      'display:flex;align-items:center;justify-content:center;transition:background .12s;' +
      '-webkit-tap-highlight-color:transparent}' +
      '.lock-key:active{background:rgba(255,255,255,.28)}' +
      '.lock-key.fn{background:transparent;font-size:16px;font-weight:500}' +
      '.lock-key.fn:active{background:rgba(255,255,255,.08)}' +
      '@keyframes lockshake{10%,90%{transform:translateX(-4px)}30%,70%{transform:translateX(8px)}' +
      '50%{transform:translateX(-8px)}}' +
      '.shake{animation:lockshake .4s}' +
      '</style>' +
      '<svg id="lock-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/>' +
      '<path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
      '<div id="lock-title">Enter Passcode</div>' +
      '<div id="lock-dots"></div>' +
      '<div id="lock-err">Incorrect Passcode</div>' +
      '<div id="lock-pad"></div>';
    document.body.appendChild(wrap);

    var dotsEl = wrap.querySelector("#lock-dots");
    var padEl = wrap.querySelector("#lock-pad");
    var errEl = wrap.querySelector("#lock-err");
    var dots = [];
    for (var i = 0; i < 6; i++) {
      var d = document.createElement("div");
      d.className = "lock-dot";
      dotsEl.appendChild(d);
      dots.push(d);
    }

    var subLabel = ["", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"];
    var entry = "";

    function render() {
      for (var i = 0; i < 6; i++) dots[i].classList.toggle("on", i < entry.length);
    }

    function unlock() {
      try { sessionStorage.setItem(KEY, "yes"); localStorage.setItem(DEVICE_KEY, "yes"); } catch (e) {}
      wrap.style.transition = "opacity .25s";
      wrap.style.opacity = "0";
      setTimeout(function () { wrap.remove(); }, 260);
    }

    function wrong() {
      errEl.style.opacity = "1";
      dotsEl.classList.add("shake");
      setTimeout(function () {
        dotsEl.classList.remove("shake");
        entry = "";
        render();
      }, 450);
    }

    function press(n) {
      if (entry.length >= 6) return;
      errEl.style.opacity = "0";
      entry += n;
      render();
      if (entry.length === 6) {
        setTimeout(function () {
          if (entry === PASSCODE) unlock();
          else wrong();
        }, 120);
      }
    }

    function del() {
      entry = entry.slice(0, -1);
      render();
    }

    function key(label, sub, onClick, fn) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "lock-key" + (fn ? " fn" : "");
      b.innerHTML = fn ? label
        : '<div style="line-height:1"><div>' + label + '</div>' +
          (sub ? '<div style="font-size:10px;letter-spacing:2px;font-weight:600;margin-top:2px">' + sub + '</div>' : '') +
          '</div>';
      b.addEventListener("click", onClick);
      padEl.appendChild(b);
      return b;
    }

    for (var n = 1; n <= 9; n++) {
      (function (num) { key(String(num), subLabel[num], function () { press(String(num)); }); })(n);
    }
    var spacer = document.createElement("div");
    padEl.appendChild(spacer);
    key("0", "", function () { press("0"); });
    key("Delete", "", del, true);

    // Allow hardware keyboard too (desktop).
    document.addEventListener("keydown", function (e) {
      if (e.key >= "0" && e.key <= "9") press(e.key);
      else if (e.key === "Backspace") del();
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildLock);
  } else {
    buildLock();
  }
})();
