/* ==========================================================================
   Portfolio behavior: Lemuel Derwin Guballa

   Contents
   1. Setup and the Motion on/off switch
   2. Intro countdown
   3. Scroll effects (header, progress line, active link, reveals, counters)
   4. Timeline
   5. Video rails (buttons, progress, mouse drag)
   6. Video slots (hover preview, sound, tilt) and the larger player
   7. Mouse effects (cursor ring, hero parallax)
   8. Live timecode and footer year
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------------------
     1. Setup and the Motion on/off switch
     ------------------------------------------------------------------------ */
  const doc = document.documentElement;
  const $  = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* storage blocked: fine */ } }
  };

  // "paused" stops the effects that JS drives (CSS animations are paused by the .is-paused class)
  let paused = reduceMotion || store.get('motion') === 'off';
  const motionButton = $('#motion-toggle');

  function applyMotion() {
    doc.classList.toggle('is-paused', paused);
    if (motionButton) {
      motionButton.setAttribute('aria-pressed', String(paused));
      motionButton.textContent = paused ? 'Off' : 'On';
    }
  }
  if (motionButton) {
    if (reduceMotion) {
      // The device already asks for less motion, so the switch has nothing to do
      const holder = motionButton.closest('.motion');
      if (holder) holder.hidden = true;
    }
    motionButton.addEventListener('click', () => {
      paused = !paused;
      store.set('motion', paused ? 'off' : 'on');
      applyMotion();
    });
  }
  applyMotion();


  /* ------------------------------------------------------------------------
     2. Intro countdown (once per visit)
     ------------------------------------------------------------------------ */
  function runIntro() {
    const preloader = $('#preloader');
    const finish = () => {
      doc.classList.add('is-loaded');
      if (preloader) setTimeout(() => preloader.remove(), 1200);
    };

    let seen = false;
    try { seen = sessionStorage.getItem('intro-seen') === '1'; } catch (e) { /* ignore */ }

    if (!preloader || reduceMotion || seen) {
      if (preloader) preloader.remove();
      doc.classList.add('is-loaded');
      return;
    }
    try { sessionStorage.setItem('intro-seen', '1'); } catch (e) { /* ignore */ }

    const number = $('[data-pre-num]', preloader);
    const ring = $('[data-pre-ring]', preloader);
    const CIRCLE = 339.3;            // length of the ring (2 * pi * 54)
    const DURATION = 1400;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      number.textContent = String(Math.round(eased * 100)).padStart(3, '0');
      ring.style.strokeDashoffset = String(CIRCLE * (1 - eased));
      if (t < 1) requestAnimationFrame(tick);
      else setTimeout(finish, 250);
    };
    requestAnimationFrame(tick);
  }
  runIntro();


  /* ------------------------------------------------------------------------
     3. Scroll effects
     ------------------------------------------------------------------------ */
  const header = $('.site-header');
  const progress = $('.progress');
  const hero = $('.hero');
  let scrollQueued = false;

  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (progress) {
        const max = doc.scrollHeight - window.innerHeight;
        progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : '0');
      }
      if (hero && !paused && y < 1200) hero.style.setProperty('--sy', String(Math.round(y)));
      scrollQueued = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Highlight the nav link for the section being read
  const navLinks = $$('.site-nav a');
  const sectionIds = navLinks.map(a => a.getAttribute('href')).filter(h => h && h.startsWith('#'));
  const sections = sectionIds.map(id => $(id)).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(section => navObserver.observe(section));

    // Back at the very top: nothing is highlighted
    const heroEl = $('#top');
    if (heroEl) {
      new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) navLinks.forEach(link => link.removeAttribute('aria-current'));
      }, { rootMargin: '-45% 0px -50% 0px' }).observe(heroEl);
    }
  }

  // Reveal on scroll. [data-stagger] reveals its children one after another.
  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    : null;

  $$('[data-stagger]').forEach(parent => {
    Array.from(parent.children).forEach((child, i) => {
      child.setAttribute('data-reveal', '');
      child.style.setProperty('--d', (i * 90) + 'ms');
    });
  });
  $$('[data-reveal]').forEach(el => {
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add('is-in');
  });

  // Numbers that count up when they scroll into view
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        countObserver.unobserve(entry.target);
        const el = entry.target;
        const end = Number(el.dataset.count);
        if (paused) { el.textContent = String(end); return; }
        const begin = performance.now();
        const duration = 1400;
        const step = (now) => {
          const t = Math.min(1, (now - begin) / duration);
          el.textContent = String(Math.round(end * (1 - Math.pow(1 - t, 3))));
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => { el.textContent = '0'; countObserver.observe(el); });
  }


  /* ------------------------------------------------------------------------
     4. Timeline: plays once when it scrolls into view
     ------------------------------------------------------------------------ */
  const timeline = $('.timeline');
  if (timeline) {
    if ('IntersectionObserver' in window) {
      const timelineObserver = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        timeline.classList.add('is-playing');
        timelineObserver.disconnect();
      }, { threshold: 0.4 });
      timelineObserver.observe(timeline);
    } else {
      timeline.classList.add('is-playing');
    }
  }


  /* ------------------------------------------------------------------------
     5. Video rails: arrow buttons, progress line, mouse drag
     ------------------------------------------------------------------------ */
  $$('.rail-block').forEach(block => {
    const rail = $('.rail', block);
    if (!rail) return;
    const prev = $('[data-rail-prev]', block);
    const next = $('[data-rail-next]', block);
    const track = $('.rail-progress', block);
    const thumb = track ? $('i', track) : null;

    const stepSize = () => Math.max(rail.clientWidth * 0.8, 240);

    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      if (prev) prev.disabled = rail.scrollLeft <= 2;
      if (next) next.disabled = rail.scrollLeft >= max - 2;
      if (track && thumb) {
        track.hidden = max <= 2;
        const visible = rail.clientWidth / rail.scrollWidth;
        thumb.style.width = (visible * 100) + '%';
        const shift = max > 0 ? (rail.scrollLeft / max) * (1 / visible - 1) * 100 : 0;
        thumb.style.transform = 'translateX(' + shift + '%)';
      }
    };

    const scrollByStep = (direction) => {
      rail.scrollBy({ left: direction * stepSize(), behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    if (prev) prev.addEventListener('click', () => scrollByStep(-1));
    if (next) next.addEventListener('click', () => scrollByStep(1));

    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    // Drag the row with a mouse (touch screens already scroll by swiping)
    let startX = 0, startLeft = 0, down = false, moved = false;
    rail.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false;
      startX = e.clientX;
      startLeft = rail.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) {
        moved = true;
        rail.classList.add('is-dragging');
      }
      if (moved) rail.scrollLeft = startLeft - dx;
    });
    const endDrag = () => {
      if (!down) return;
      down = false;
      rail.classList.remove('is-dragging');
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    // A drag must not count as a click on a video
    rail.addEventListener('click', (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
  });


  /* ------------------------------------------------------------------------
     6. Video slots and the larger player
     ------------------------------------------------------------------------ */
  const lightbox = $('#lightbox');
  const lightboxMedia = $('#lightbox-media');
  const lightboxTitle = $('#lightbox-title');

  const SOUND_ICONS =
    '<svg class="icon-off" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>' +
    '<svg class="icon-on" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';

  function openPlayer(slot, media, title) {
    if (!lightbox || !lightboxMedia) return;

    // Match the player's shape to the slot that was clicked
    let shape = [16, 9];
    if (slot.classList.contains('slot--vertical')) shape = [9, 16];
    else if (slot.classList.contains('slot--square')) shape = [1, 1];
    lightboxMedia.style.setProperty('--rw', shape[0]);
    lightboxMedia.style.setProperty('--rh', shape[1]);
    lightboxMedia.replaceChildren();

    const video = $('video', media);
    const iframe = $('iframe', media);
    if (video) {
      const player = document.createElement('video');
      player.src = video.currentSrc || video.src;
      player.controls = true;
      player.autoplay = true;
      player.loop = true;
      player.playsInline = true;
      lightboxMedia.append(player);
    } else if (iframe) {
      const frame = document.createElement('iframe');
      frame.src = iframe.src;
      frame.title = iframe.title || title;
      frame.allow = 'autoplay; fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';  // YouTube needs this (error 153 without it)
      lightboxMedia.append(frame);
    } else {
      const image = $('img', media);
      if (!image) return;
      const copy = document.createElement('img');
      copy.src = image.currentSrc || image.src;
      copy.alt = image.alt || title;
      lightboxMedia.append(copy);
    }

    if (lightboxTitle) lightboxTitle.textContent = title;
    doc.classList.add('lightbox-open');
    lightbox.showModal();
  }

  if (lightbox) {
    const closeButton = $('.lightbox__close', lightbox);
    if (closeButton) closeButton.addEventListener('click', () => lightbox.close());
    // Clicking the dark area around the player closes it
    lightbox.addEventListener('click', (e) => {
      if (!e.target.closest('.lightbox__media, .lightbox__close, .lightbox__title')) lightbox.close();
    });
    // Runs for the close button, outside click and the Escape key
    lightbox.addEventListener('close', () => {
      lightboxMedia.replaceChildren();   // also stops the video
      doc.classList.remove('lightbox-open');
    });
  }

  $$('.slot__media').forEach(media => {
    const video = $('video', media);
    const hasContent = video || $('iframe', media) || $('img', media);
    if (!hasContent) return;                       // empty placeholder: nothing to wire up

    const slot = media.closest('.slot');
    const titleEl = slot ? $('.slot__title', slot) : null;
    const title = titleEl ? titleEl.textContent.trim() : 'Video';

    // Invisible button over the slot: opens the larger player
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'slot__open';
    open.setAttribute('aria-label', 'Play "' + title + '" in a larger player');
    open.addEventListener('click', () => openPlayer(slot, media, title));
    media.append(open);

    if (video) {
      // Progress line shown during the hover preview
      const scrub = document.createElement('span');
      scrub.className = 'slot__scrub';
      scrub.innerHTML = '<i></i>';
      const scrubBar = scrub.firstElementChild;
      media.append(scrub);

      video.addEventListener('timeupdate', () => {
        if (video.duration) scrubBar.style.transform = 'scaleX(' + (video.currentTime / video.duration) + ')';
      });
      // Show a real frame instead of a black box before anything plays
      // (skipped when the video has a poster, so the thumbnail stays visible)
      const hasPoster = video.hasAttribute('poster');
      video.addEventListener('loadedmetadata', () => { if (video.paused && !hasPoster) video.currentTime = 0.1; });

      const startPreview = () => {
        const attempt = video.play();
        if (attempt && attempt.catch) attempt.catch(() => {});
        media.classList.add('is-playing');
      };
      const stopPreview = () => {
        video.pause();
        if (hasPoster) video.load();   // resets the video so the poster shows again
        else video.currentTime = 0.1;
        media.classList.remove('is-playing');
        scrubBar.style.transform = 'scaleX(0)';
      };
      if (canHover) {
        media.addEventListener('pointerenter', startPreview);
        media.addEventListener('pointerleave', stopPreview);
      }
      open.addEventListener('focus', () => { if (open.matches(':focus-visible')) startPreview(); });
      open.addEventListener('blur', stopPreview);

      // Sound button (mouse devices only; touch users get the full player instead)
      const sound = document.createElement('button');
      sound.type = 'button';
      sound.className = 'slot__sound';
      sound.setAttribute('aria-pressed', 'false');
      sound.setAttribute('aria-label', 'Sound for "' + title + '"');
      sound.innerHTML = SOUND_ICONS;
      sound.addEventListener('click', (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        sound.setAttribute('aria-pressed', String(!video.muted));
      });
      media.append(sound);
    }

    // Slots tilt a little toward the mouse
    if (canHover && !reduceMotion) {
      const strength = slot && slot.classList.contains('slot--cinema') ? 2.5 : 7;
      media.addEventListener('pointermove', (e) => {
        if (paused) return;
        const box = media.getBoundingClientRect();
        const px = (e.clientX - box.left) / box.width - 0.5;
        const py = (e.clientY - box.top) / box.height - 0.5;
        media.style.setProperty('--ry', (px * strength).toFixed(2) + 'deg');
        media.style.setProperty('--rx', (-py * strength).toFixed(2) + 'deg');
      });
      media.addEventListener('pointerleave', () => {
        media.style.setProperty('--rx', '0deg');
        media.style.setProperty('--ry', '0deg');
      });
    }
  });


  /* ------------------------------------------------------------------------
     7. Mouse effects: cursor ring and hero parallax
     ------------------------------------------------------------------------ */
  if (canHover && !reduceMotion) {
    const ring = document.createElement('div');
    ring.className = 'cursor';
    ring.setAttribute('aria-hidden', 'true');
    ring.innerHTML = '<span></span>';
    document.body.append(ring);

    let targetX = -100, targetY = -100, x = targetX, y = targetY;

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      targetX = e.clientX;
      targetY = e.clientY;
      ring.classList.add('is-on');
    });
    document.addEventListener('mouseleave', () => ring.classList.remove('is-on'));

    document.addEventListener('pointerover', (e) => {
      const el = e.target instanceof Element ? e.target : null;
      const playing = !!(el && el.closest('.slot__open'));
      const link = !playing && !!(el && el.closest('a, button'));
      ring.classList.toggle('is-play', playing);
      ring.classList.toggle('is-link', link);
    });

    const follow = () => {
      x += (targetX - x) * 0.2;
      y += (targetY - y) * 0.2;
      ring.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);

    // The floating phones drift with the mouse
    if (hero) {
      hero.addEventListener('pointermove', (e) => {
        if (paused || e.pointerType !== 'mouse') return;
        const box = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', (((e.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
        hero.style.setProperty('--my', (((e.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
      });
      hero.addEventListener('pointerleave', () => {
        hero.style.setProperty('--mx', '0');
        hero.style.setProperty('--my', '0');
      });
    }
  }


  /* ------------------------------------------------------------------------
     8. Live timecode and footer year
     ------------------------------------------------------------------------ */
  const timecodes = $$('[data-timecode]');
  if (timecodes.length) {
    const t0 = performance.now();
    const pad = (n) => String(n).padStart(2, '0');
    let offset = 0;            // lets the clock stop and resume without jumping
    let lastTick = t0;

    setInterval(() => {
      const now = performance.now();
      if (!paused) offset += now - lastTick;
      lastTick = now;
      const frames = Math.floor(offset / 40) % 25;      // 25 fps
      const seconds = Math.floor(offset / 1000) % 60;
      const minutes = Math.floor(offset / 60000) % 60;
      const hours = Math.floor(offset / 3600000);
      const text = pad(hours) + ':' + pad(minutes) + ':' + pad(seconds) + ':' + pad(frames);
      timecodes.forEach(el => { el.textContent = text; });
    }, 80);
  }

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
