/* ==========================================================================
   main.js: behaviors for the portfolio.
   1. Sticky header (frosted after scrolling) and active section link
   2. Left/right buttons for each video rail
   3. Video slots: hover preview, sound button, click to enlarge
   4. Editing timeline: plays once when scrolled into view
   5. Footer year
   No libraries needed. If this file fails to load, the page still reads
   fine; only the extras above stop working.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // True on devices with a real mouse or trackpad (not phones and tablets)
  var canHover = window.matchMedia("(hover: hover)").matches;


  /* ------------------------------------------------------------------------
     1. Sticky header and active section link
     ------------------------------------------------------------------------ */
  var header = document.querySelector(".site-header");
  if (header) {
    // Add a frosted background once the page has scrolled a little
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Mark the nav link of the section that crosses the middle of the screen
  var navLinks = document.querySelectorAll(".site-nav a[href^='#']");
  var sections = [];
  navLinks.forEach(function (link) {
    var target = document.querySelector(link.getAttribute("href"));
    if (target) sections.push(target);
  });

  if ("IntersectionObserver" in window && sections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          var isCurrent = link.getAttribute("href") === "#" + entry.target.id;
          if (isCurrent) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" }); // a thin line across the middle of the screen

    sections.forEach(function (section) { sectionObserver.observe(section); });

    // Above the first linked section (the hero), no link is highlighted
    var hero = document.getElementById("top");
    if (hero) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          navLinks.forEach(function (link) { link.removeAttribute("aria-current"); });
        }
      }, { rootMargin: "-45% 0px -50% 0px" }).observe(hero);
    }
  }


  /* ------------------------------------------------------------------------
     2. Video rails
     Each .rail-block contains a .rail (the scrolling row) and two buttons
     marked data-rail-prev / data-rail-next.
     ------------------------------------------------------------------------ */
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
     3. Video slots
     For every slot that has a <video> or <iframe> in it, add:
       - an invisible "open" button covering the slot (click to enlarge)
       - for <video>: a hover preview and a sound button
     Empty slots are left alone, so nothing changes until you add a video.
     ------------------------------------------------------------------------ */
  var lightbox = document.getElementById("lightbox");
  var lightboxMedia = document.getElementById("lightbox-media");
  var lightboxTitle = document.getElementById("lightbox-title");
  var lightboxClose = lightbox && lightbox.querySelector(".lightbox__close");

  // Icons for the sound button (the CSS shows the right one for each state)
  var ICON_SOUND_OFF = '<svg class="icon-off" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M23 9l-6 6M17 9l6 6"/></svg>';
  var ICON_SOUND_ON  = '<svg class="icon-on" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';

  // Shape of the larger player for each slot shape (width : height)
  var SHAPES = {
    "slot--vertical": [9, 16],
    "slot--square": [1, 1],
    "slot--wide": [16, 9],
    "slot--cinema": [16, 9]   // the showreel is cropped in the page, but plays uncropped here
  };

  function shapeOf(slot) {
    for (var cls in SHAPES) {
      if (slot.classList.contains(cls)) return SHAPES[cls];
    }
    return [16, 9];
  }

  // Add "autoplay=1" to a YouTube/Vimeo embed address so it starts when opened
  function withAutoplay(src) {
    try {
      var url = new URL(src, window.location.href);
      url.searchParams.set("autoplay", "1");
      return url.toString();
    } catch (e) {
      return src;
    }
  }

  // Open the larger player for a slot
  function openLightbox(slot, media) {
    if (!lightbox || typeof lightbox.showModal !== "function") return;

    var shape = shapeOf(slot);
    lightboxMedia.style.setProperty("--rw", shape[0]);
    lightboxMedia.style.setProperty("--rh", shape[1]);
    lightboxMedia.textContent = "";

    var title = slot.querySelector(".slot__title");
    var titleText = title ? title.textContent : "Video";
    lightboxTitle.textContent = titleText;

    var player;
    if (media.tagName === "VIDEO") {
      media.pause();                       // stop the hover preview
      player = document.createElement("video");
      player.src = media.currentSrc || media.getAttribute("src");
      if (media.poster) player.poster = media.poster;
      player.controls = true;              // full controls in the larger player
      player.autoplay = true;
      player.playsInline = true;
    } else {
      player = document.createElement("iframe");
      player.src = withAutoplay(media.getAttribute("src"));
      player.title = titleText;
      player.allow = "autoplay; fullscreen; picture-in-picture";
      player.allowFullscreen = true;
    }
    lightboxMedia.appendChild(player);

    document.documentElement.classList.add("lightbox-open");
    lightbox.showModal();
  }

  // Set up each filled slot
  document.querySelectorAll(".slot__media").forEach(function (box) {
    var media = box.querySelector("video, iframe");
    if (!media) return;                    // empty slot: nothing to do

    var slot = box.closest(".slot");
    var title = slot && slot.querySelector(".slot__title");
    var label = title ? title.textContent : "video";

    // Invisible button that opens the larger player
    var openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "slot__open";
    openBtn.setAttribute("aria-label", "Open " + label + " in a larger player");
    openBtn.addEventListener("click", function () { openLightbox(slot, media); });
    box.appendChild(openBtn);

    if (media.tagName !== "VIDEO") return; // embeds: no preview or sound button

    // Videos in a slot behave like previews: silent, looping, no native controls
    media.controls = false;
    media.muted = true;
    media.loop = true;
    media.playsInline = true;
    if (!media.preload) media.preload = "metadata";

    var preview = function () { media.play().catch(function () {}); };
    var stop = function () { media.pause(); media.currentTime = 0; };

    if (canHover) {
      box.addEventListener("pointerenter", preview);
      box.addEventListener("pointerleave", stop);
    }
    // Keyboard users get the preview when the open button is focused
    openBtn.addEventListener("focus", preview);
    openBtn.addEventListener("blur", stop);

    // Sound button: turns sound on or off for the preview
    var soundBtn = document.createElement("button");
    soundBtn.type = "button";
    soundBtn.className = "slot__sound";
    soundBtn.innerHTML = ICON_SOUND_OFF + ICON_SOUND_ON;
    soundBtn.setAttribute("aria-pressed", "false");
    soundBtn.setAttribute("aria-label", "Turn sound on for " + label);
    soundBtn.addEventListener("click", function () {
      media.muted = !media.muted;
      var soundOn = !media.muted;
      soundBtn.setAttribute("aria-pressed", String(soundOn));
      soundBtn.setAttribute("aria-label", (soundOn ? "Turn sound off for " : "Turn sound on for ") + label);
      if (soundOn && media.paused) preview();
    });
    box.appendChild(soundBtn);
  });

  // Close the larger player: button, backdrop click, or Escape (built in)
  if (lightbox) {
    if (lightboxClose) lightboxClose.addEventListener("click", function () { lightbox.close(); });
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) lightbox.close();   // clicked outside the player
    });
    // Runs for every way of closing: removes the player so playback stops
    lightbox.addEventListener("close", function () {
      lightboxMedia.textContent = "";
      document.documentElement.classList.remove("lightbox-open");
    });
  }


  /* ------------------------------------------------------------------------
     4. Editing timeline: start the playhead when it scrolls into view
     ------------------------------------------------------------------------ */
  var timeline = document.querySelector(".timeline");
  if (timeline) {
    if ("IntersectionObserver" in window) {
      var timelineObserver = new IntersectionObserver(function (entries, observer) {
        if (entries[0].isIntersecting) {
          timeline.classList.add("is-playing");
          observer.disconnect();           // play only once
        }
      }, { threshold: 0.6 });
      timelineObserver.observe(timeline);
    } else {
      timeline.classList.add("is-playing");
    }
  }


  /* ------------------------------------------------------------------------
     5. Footer year (keeps the copyright line current)
     ------------------------------------------------------------------------ */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
