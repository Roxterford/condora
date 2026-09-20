// =========================================================
// Condora Landing — interactividad (vanilla JS)
// =========================================================

(function () {
  "use strict";

  /* ---------- Navbar: sombra al hacer scroll ---------- */
  var navbar = document.getElementById("navbar");

  function onScroll() {
    if (!navbar) return;
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil ---------- */
  var burger = document.getElementById("burger");
  var navLinks = document.getElementById("navLinks");

  function closeMenu() {
    if (burger) burger.classList.remove("open");
    if (navLinks) navLinks.classList.remove("open");
  }

  if (burger && navLinks) {
    burger.addEventListener("click", function () {
      burger.classList.toggle("open");
      navLinks.classList.toggle("open");
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeMenu();
    });
  }
  document.addEventListener("click", function (e) {
    if (navLinks && navLinks.classList.contains("open") && !navLinks.contains(e.target) && !burger.contains(e.target)) {
      closeMenu();
    }
  });
  window.addEventListener("resize", closeMenu);

  /* ---------- Contadores animados ---------- */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    var duration = 1400;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.round(target * eased);
      el.textContent = value.toLocaleString("es-ES");
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString("es-ES");
    }
    requestAnimationFrame(step);
  }

  /* ---------- Animación de aparición al entrar en viewport ---------- */
  var revealEls = document.querySelectorAll(".reveal");

  function handleReveal(entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
        entry.target.querySelectorAll(".count").forEach(animateCount);
      }
    });
  }

  var revealObserver = new IntersectionObserver(handleReveal, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  revealEls.forEach(function (el) {
    revealObserver.observe(el);
  });
})();