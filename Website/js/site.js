/* Dynamic Products, Inc. shared behavior for the inner pages.
   Menu, solid header on scroll, reveal on scroll, parallax, product filters,
   gallery lightbox, and the preview forms. No dependencies. */
(function () {
  "use strict";
  var doc = document;
  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* menu */
  var header = doc.getElementById("siteHeader");
  var btn = doc.getElementById("menuBtn");
  var nav = doc.getElementById("siteNav");
  if (header && btn && nav) {
    btn.addEventListener("click", function () {
      var open = header.getAttribute("data-open") !== "true";
      header.setAttribute("data-open", open ? "true" : "false");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        header.setAttribute("data-open", "false");
        btn.setAttribute("aria-expanded", "false");
      }
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        header.setAttribute("data-open", "false");
        btn.setAttribute("aria-expanded", "false");
      }
    });
    var onScroll = function () {
      header.classList.toggle("solid", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* reveal on scroll */
  var rev = [].slice.call(doc.querySelectorAll(".reveal"));
  if (rev.length) {
    if ("IntersectionObserver" in window && !reduce) {
      var io = new IntersectionObserver(
        function (items) {
          items.forEach(function (it) {
            if (it.isIntersecting) {
              it.target.classList.add("in");
              io.unobserve(it.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
      );
      rev.forEach(function (el) {
        io.observe(el);
      });
    } else {
      rev.forEach(function (el) {
        el.classList.add("in");
      });
    }
  }

  /* parallax blueprint layers */
  var layers = [].slice.call(doc.querySelectorAll("[data-parallax]"));
  if (layers.length && !reduce) {
    var ticking = false;
    var updatePx = function () {
      ticking = false;
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var sec = el.parentNode,
          r = sec.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.2;
        var maxShift = sec.offsetHeight * 0.278;
        var shift = (r.top + r.height / 2 - vh / 2) * -speed;
        shift = Math.max(-maxShift, Math.min(maxShift, shift));
        el.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0)";
      });
    };
    var onPx = function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updatePx);
      }
    };
    window.addEventListener("scroll", onPx, { passive: true });
    window.addEventListener("resize", onPx);
    updatePx();
  }

  /* filter chips (products and gallery): data-filter on buttons, data-cat on items */
  [].slice.call(doc.querySelectorAll("[data-filters]")).forEach(function (bar) {
    var target = doc.querySelector(bar.getAttribute("data-filters"));
    if (!target) return;
    var items = [].slice.call(target.children);
    var count = doc.querySelector(bar.getAttribute("data-count") || "");
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-filter]");
      if (!b) return;
      var f = b.getAttribute("data-filter");
      [].slice.call(bar.querySelectorAll("button")).forEach(function (x) {
        x.classList.toggle("is-active", x === b);
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      var n = 0;
      items.forEach(function (it) {
        var cats = (it.getAttribute("data-cat") || "").split(" ");
        var show = f === "all" || cats.indexOf(f) > -1;
        it.hidden = !show;
        if (show) n++;
      });
      if (count) count.textContent = n;
    });
  });

  /* gallery lightbox */
  var lb = doc.getElementById("lightbox");
  if (lb && lb.showModal) {
    var lbImg = lb.querySelector("img"),
      lbCap = lb.querySelector(".lb-cap"),
      figs = [],
      idx = 0;
    var show = function (i) {
      figs = [].slice
        .call(doc.querySelectorAll(".gal-page figure"))
        .filter(function (f) {
          return !f.hidden;
        });
      if (!figs.length) return;
      idx = (i + figs.length) % figs.length;
      var im = figs[idx].querySelector("img");
      lbImg.src = im.getAttribute("src");
      lbImg.alt = im.getAttribute("alt") || "";
      lbCap.textContent = (figs[idx].querySelector("figcaption") || {})
        .firstChild
        ? figs[idx].querySelector("figcaption").firstChild.textContent
        : "";
    };
    doc.querySelectorAll(".gal-page figure").forEach(function (f) {
      f.tabIndex = 0;
      f.setAttribute("role", "button");
      var open = function () {
        figs = [].slice
          .call(doc.querySelectorAll(".gal-page figure"))
          .filter(function (x) {
            return !x.hidden;
          });
        show(figs.indexOf(f));
        lb.showModal();
      };
      f.addEventListener("click", open);
      f.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
    lb.querySelector(".lb-prev").addEventListener("click", function () {
      show(idx - 1);
    });
    lb.querySelector(".lb-next").addEventListener("click", function () {
      show(idx + 1);
    });
    lb.querySelector(".lb-x").addEventListener("click", function () {
      lb.close();
    });
    lb.addEventListener("click", function (e) {
      if (e.target === lb) lb.close();
    });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* preview forms: validate, then show the same "design preview" note as the home page */
  [].slice.call(doc.querySelectorAll("form[data-preview]")).forEach(function (form) {
    var note = form.querySelector(".note");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]');
      var email = form.querySelector('[name="email"]');
      var ok =
        name &&
        name.value.trim() &&
        email &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim());
      if (!ok) {
        note.textContent =
          "Enter your name and a valid email so a DPI representative can reply.";
        return;
      }
      note.textContent =
        form.getAttribute("data-preview") ||
        "Design preview: on the live site this goes to the Dynamic Products team.";
    });
  });

  /* contact dialogs: [data-open-dialog="id"] opens <dialog id>; X, backdrop click and Esc close it */
  [].slice.call(doc.querySelectorAll("[data-open-dialog]")).forEach(function (btn) {
    var dlg = doc.getElementById(btn.getAttribute("data-open-dialog"));
    if (!dlg || typeof dlg.showModal !== "function") return;
    btn.addEventListener("click", function () {
      dlg.showModal();
      doc.documentElement.classList.add("dlg-open");
      var first = dlg.querySelector("input");
      if (first) first.focus();
    });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.hasAttribute("data-close-dialog")) dlg.close();
    });
    dlg.addEventListener("close", function () {
      doc.documentElement.classList.remove("dlg-open");
      btn.focus();
    });
  });

  /* contact page: ?product=Tees preselects the product, ?topic= the topic */
  var qs = new URLSearchParams(window.location.search);
  var prod = qs.get("product");
  var sel = doc.getElementById("f-type");
  if (prod && sel) {
    [].slice.call(sel.options).forEach(function (o) {
      if (o.value.toLowerCase() === prod.toLowerCase()) sel.value = o.value;
    });
  }
})();
