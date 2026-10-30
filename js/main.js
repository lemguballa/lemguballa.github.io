/* ==========================================================================
   main.js: small behaviors for the portfolio.
   1. Left/right buttons for each video rail
   2. Footer year
   No libraries needed. The site still works without this file; visitors
   can scroll the rails with a trackpad, touch, or the keyboard.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Video rails
     Each .rail-block contains a .rail (the scrolling row) and two buttons
     marked data-rail-prev / data-rail-next.
     ------------------------------------------------------------------------ */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".rail-block").forEach(function (block) {
    var rail = block.querySelector(".rail");
    var prev = block.querySelector("[data-rail-prev]");
    var next = block.querySelector("[data-rail-next]");
    if (!rail || !prev || !next) return;

    // Scroll the rail by most of its visible width, left (-1) or right (1)
    function scrollRail(direction) {
      rail.scrollBy({
        left: direction * rail.clientWidth * 0.8,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    }

    // Disable a button when the rail can't scroll any further that way
    function updateButtons() {
      var maxScroll = rail.scrollWidth - rail.clientWidth;
      prev.disabled = rail.scrollLeft <= 1;
      next.disabled = rail.scrollLeft >= maxScroll - 1;
    }

    prev.addEventListener("click", function () { scrollRail(-1); });
    next.addEventListener("click", function () { scrollRail(1); });
    rail.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    updateButtons();
  });

  /* ------------------------------------------------------------------------
     2. Footer year (keeps the copyright line current)
     ------------------------------------------------------------------------ */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
