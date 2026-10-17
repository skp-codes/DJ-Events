/* Show / hide buttons for every password field.
   The app draws its screens with JavaScript, so this watches the page and adds a button to any
   password field as soon as it appears. */
(function () {
  "use strict";
  function enhance(inp) {
    if (inp.dataset.pwToggle) return;
    inp.dataset.pwToggle = "1";
    var wrap = document.createElement("span");
    wrap.className = "pw-wrap";
    inp.parentNode.insertBefore(wrap, inp);
    wrap.appendChild(inp);
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pw-toggle";
    b.textContent = "Show";
    b.setAttribute("aria-label", "Show password");
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function (e) {
      e.preventDefault();
      var show = inp.type === "password";
      inp.type = show ? "text" : "password";
      b.textContent = show ? "Hide" : "Show";
      b.setAttribute("aria-label", show ? "Hide password" : "Show password");
      b.setAttribute("aria-pressed", String(show));
      inp.focus();
    });
    wrap.appendChild(b);
  }
  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.matches && root.matches('input[type="password"]')) enhance(root);
    var list = root.querySelectorAll('input[type="password"]');
    for (var i = 0; i < list.length; i++) enhance(list[i]);
  }
  function start() {
    scan(document.body);
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++)
        for (var j = 0; j < muts[i].addedNodes.length; j++) scan(muts[i].addedNodes[j]);
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
