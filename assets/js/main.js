/* Megan — site interactions. Minimal, dependency-free, accessible. */
(function () {
  "use strict";

  /* Mobile nav toggle */
  var toggle = document.querySelector(".nav__toggle");
  var nav = document.querySelector(".nav");
  var links = document.getElementById("navLinks");
  if (toggle && nav && links) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      }
    });
  }

  /* Header shadow on scroll — rAF-throttled */
  var header = document.querySelector(".site-header");
  if (header) {
    var ticking = false;
    var apply = function () { header.classList.toggle("scrolled", window.scrollY > 12); ticking = false; };
    apply();
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(apply); }
    }, { passive: true });
  }

  /* FAQ accordion — accessible (aria-expanded + aria-controls + hidden) */
  document.querySelectorAll(".faq__item").forEach(function (item, i) {
    var q = item.querySelector(".faq__q");
    var a = item.querySelector(".faq__a");
    if (!q || !a) return;
    if (!q.getAttribute("type")) q.setAttribute("type", "button");
    var pid = a.id || ("faq-panel-" + i);
    a.id = pid;
    a.setAttribute("role", "region");
    q.setAttribute("aria-controls", pid);
    q.setAttribute("aria-expanded", "false");
    a.hidden = true;
    q.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        a.hidden = false;
        a.style.maxHeight = a.scrollHeight + "px";
      } else {
        a.style.maxHeight = null;
        // allow the collapse transition, then remove from tab/AT order
        var done = function () { if (!item.classList.contains("open")) a.hidden = true; a.removeEventListener("transitionend", done); };
        a.addEventListener("transitionend", done);
        // fallback if no transition fires
        window.setTimeout(function () { if (!item.classList.contains("open")) a.hidden = true; }, 450);
      }
    });
  });

  /* Reveal on scroll — with safety nets so content can never stay hidden */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  var showAll = function () { revealEls.forEach(function (el) { el.classList.add("in"); }); };
  if (!reduce && "IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety net 1: reveal anything already in the viewport right now (covers above-the-fold + missed callbacks)
    var revealInView = function () {
      revealEls.forEach(function (el) {
        if (el.classList.contains("in")) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.96 && r.bottom > 0) { el.classList.add("in"); io.unobserve(el); }
      });
    };
    window.requestAnimationFrame(revealInView);
    window.addEventListener("load", revealInView);
    // Safety net 2: never leave anything hidden for long
    window.setTimeout(showAll, 1500);
  } else {
    showAll();
  }

  /* Forms — client-side success state.
     NOTE: replace the action/endpoint with a real form provider
     (Formspree, Netlify Forms, GHL, ConvertKit, etc.) before launch. */
  document.querySelectorAll("form[data-demo], form[data-netlify]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var show = function () {
        var ok = form.querySelector(".form-success");
        if (ok) { ok.classList.add("show"); ok.setAttribute("role", "status"); }
        form.querySelectorAll("input, textarea, select, button").forEach(function (el) {
          if (el.type !== "hidden") el.setAttribute("disabled", "true");
        });
      };
      if (form.getAttribute("data-netlify") === "true") {
        /* Real submission to Netlify Forms (captured in the Netlify dashboard once deployed on Netlify), then success state. */
        var body = new URLSearchParams(new FormData(form)).toString();
        fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body }).then(show).catch(show);
      } else {
        show();
      }
    });
  });

  /* Footer year */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
})();
