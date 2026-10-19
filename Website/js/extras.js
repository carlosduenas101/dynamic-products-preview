/* Dynamic Products, Inc. extras: back-to-top arrow and the home product carousel. No dependencies. */
(function () {
  "use strict";
  var doc = document;

  /* light / dark theme toggle (choice saved in this browser) */
  var root = doc.documentElement;
  var bar = doc.querySelector(".site-header .bar");
  if (bar) {
    var tb = doc.createElement("button");
    tb.type = "button";
    tb.className = "theme-btn";
    tb.id = "themeBtn";
    tb.innerHTML =
      '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7"/></svg>' +
      '<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>';
    var cta = bar.querySelector(".btn");
    var menu = bar.querySelector(".menu-btn");
    bar.insertBefore(tb, menu || (cta ? cta.nextSibling : null));
    var paint = function () {
      var dark = root.getAttribute("data-theme") === "dark";
      tb.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      tb.setAttribute("aria-pressed", dark ? "true" : "false");
      tb.title = dark ? "Light mode" : "Dark mode";
    };
    paint();
    tb.addEventListener("click", function () {
      var dark = root.getAttribute("data-theme") !== "dark";
      if (dark) root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme");
      try { localStorage.setItem("dp-theme", dark ? "dark" : "light"); } catch (e) {}
      paint();
      window.dispatchEvent(new Event("dp-themechange"));
    });
  }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* back to top arrow, bottom right */
  var top = doc.createElement("a");
  top.className = "to-top";
  top.href = "#top";
  top.setAttribute("aria-label", "Back to top");
  top.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" aria-hidden="true"><path d="M12 20V5M5 11.5l7-7 7 7"/></svg>';
  top.addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
  });
  doc.body.appendChild(top);
  var showTop = function () {
    top.classList.toggle("show", window.scrollY > 500);
  };
  showTop();
  window.addEventListener("scroll", showTop, { passive: true });

  /* product carousel */
  var car = doc.querySelector("[data-carousel]");
  if (car) {
    var track = car.querySelector(".car-track");
    var prev = car.querySelector(".car-prev");
    var next = car.querySelector(".car-next");
    var bar = car.querySelector(".car-bar i");
    var count = car.querySelector(".car-count");
    var slides = [].slice.call(track.children);
    var step = function () {
      var a = slides[0], b = slides[1];
      return b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
    };
    var update = function () {
      var max = track.scrollWidth - track.clientWidth;
      var pos = track.scrollLeft;
      prev.disabled = pos <= 2;
      next.disabled = pos >= max - 2;
      if (bar) bar.style.width = Math.max(8, (track.clientWidth / track.scrollWidth) * 100) + "%";
      if (bar) bar.style.transform = "translateX(" + (max > 0 ? (pos / max) * ((track.scrollWidth / track.clientWidth) - 1) * 100 : 0) + "%)";
      var first = Math.round(pos / step()) + 1;
      var perView = Math.max(1, Math.round(track.clientWidth / step()));
      if (count) count.textContent = String(first).padStart(2, "0") + (perView > 1 ? "–" + String(Math.min(slides.length, first + perView - 1)).padStart(2, "0") : "") + " / " + String(slides.length).padStart(2, "0");
    };
    var go = function (dir) {
      track.scrollBy({ left: dir * step(), behavior: reduce ? "auto" : "smooth" });
    };
    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    track.addEventListener("scroll", function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
    update();
  }
})();
