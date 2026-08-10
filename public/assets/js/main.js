(function () {
  "use strict";

  var LANG_KEY = "elite-lang";
  var root = document.documentElement;
  var langBtn = document.getElementById("lang-switch");
  var langLabel = document.getElementById("lang-switch-label");
  var hamburger = document.getElementById("hamburger");
  var mainNav = document.getElementById("main-nav");

  function applyLanguage(lang) {
    root.setAttribute("lang", lang);
    root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

    var nodes = document.querySelectorAll("[data-ar]");
    nodes.forEach(function (el) {
      var text = lang === "ar" ? el.getAttribute("data-ar") : el.getAttribute("data-en");
      if (text !== null) el.innerHTML = text;
    });

    // WhatsApp links with a pre-filled message: rebuild the href per language
    var waLinks = document.querySelectorAll("[data-msg-ar]");
    waLinks.forEach(function (el) {
      var base = el.getAttribute("data-wa-base");
      var msg = lang === "ar" ? el.getAttribute("data-msg-ar") : el.getAttribute("data-msg-en");
      if (base && msg !== null) el.href = base + "?text=" + encodeURIComponent(msg);
    });

    if (langLabel) langLabel.textContent = lang === "ar" ? "EN" : "AR";
    localStorage.setItem(LANG_KEY, lang);
  }

  function getInitialLanguage() {
    var stored = localStorage.getItem(LANG_KEY);
    if (stored === "ar" || stored === "en") return stored;
    return "ar";
  }

  applyLanguage(getInitialLanguage());

  if (langBtn) {
    langBtn.addEventListener("click", function () {
      var current = root.getAttribute("lang") === "ar" ? "ar" : "en";
      applyLanguage(current === "ar" ? "en" : "ar");
    });
  }

  // Mobile menu toggle
  if (hamburger && mainNav) {
    hamburger.addEventListener("click", function () {
      var isOpen = mainNav.classList.toggle("open");
      hamburger.classList.toggle("open", isOpen);
      hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    mainNav.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("open");
        hamburger.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Sticky header shadow on scroll
  var header = document.getElementById("site-header");
  if (header) {
    window.addEventListener("scroll", function () {
      header.style.boxShadow = window.scrollY > 10 ? "0 6px 20px rgba(32,43,54,0.08)" : "none";
    });
  }

  // Scroll reveal animations
  var revealEls = document.querySelectorAll(".reveal");
  revealEls.forEach(function (el, i) {
    el.style.transitionDelay = (i % 4) * 0.08 + "s";
  });

  if ("IntersectionObserver" in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });

    // Fallback safety net: guarantees elements never stay stuck at opacity 0,
    // even if a fast/jumped scroll causes the observer to skip a callback.
    var revealFallback = function () {
      var vh = window.innerHeight;
      revealEls.forEach(function (el) {
        if (el.classList.contains("visible")) return;
        var rect = el.getBoundingClientRect();
        if (rect.top < vh && rect.bottom > 0) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      });
    };
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        revealFallback();
        ticking = false;
      });
    });
    window.addEventListener("resize", revealFallback);
    revealFallback();
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("visible");
    });
  }

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Reveal animations for hash-targeted hidden sections (#team, #cpd, #blog).
  // IntersectionObserver runs before these sections are visible, so we trigger
  // manually: reset reveals to hidden, then add .visible after a short delay
  // so the CSS transition plays smoothly.
  var HASH_SECTIONS = ["team", "cpd", "blog", "topics"];

  function triggerRevealInSection(id) {
    var section = document.getElementById(id);
    if (!section) return;
    var reveals = section.querySelectorAll(".reveal");
    if (!reveals.length) return;
    reveals.forEach(function (el) {
      el.classList.remove("visible");
      el.style.transitionDelay = "";
    });
    setTimeout(function () {
      reveals.forEach(function (el, i) {
        el.style.transitionDelay = (i % 4) * 0.08 + "s";
        el.classList.add("visible");
      });
    }, 50);
  }

  function handleHash() {
    var hash = window.location.hash.replace("#", "");
    if (HASH_SECTIONS.indexOf(hash) !== -1) {
      triggerRevealInSection(hash);
    }
  }

  handleHash();
  window.addEventListener("hashchange", handleHash);

})();
