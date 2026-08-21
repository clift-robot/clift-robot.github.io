/* CLIFT talk slides — keyboard/HUD navigation, stage scaling, per-slide video
   playback, count-up on the results slide. */
(function () {
  'use strict';

  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var bar = document.getElementById('deck-bar');
  var count = document.getElementById('count');
  var current = -1;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- stage scaling (1280x720 design space) ---------- */
  function rescale() {
    var s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    slides.forEach(function (slide) {
      var stage = slide.querySelector('.stage');
      if (stage) stage.style.transform = 'scale(' + s + ')';
    });
  }
  window.addEventListener('resize', rescale);

  /* ---------- count-up (results slide) ---------- */
  function countUp(el) {
    var target = parseInt(el.dataset.count, 10);
    var from = parseInt(el.dataset.from || '0', 10);
    if (reduceMotion || !window.requestAnimationFrame) {
      el.textContent = target + '%';
      return;
    }
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / 1300);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (target - from) * eased) + '%';
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- slide activation ---------- */
  function show(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === current) return;
    current = i;
    slides.forEach(function (slide, j) {
      var active = j === i;
      slide.classList.toggle('active', active);
      Array.prototype.forEach.call(slide.querySelectorAll('video'), function (v) {
        if (active) {
          v.currentTime = 0;
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      });
    });
    var activeSlide = slides[i];
    Array.prototype.forEach.call(activeSlide.querySelectorAll('.fin[data-count]'), function (el) {
      el.textContent = (el.dataset.from || '0') + '%';
      countUp(el);
    });
    if (bar) bar.style.width = ((i + 1) / slides.length * 100) + '%';
    if (count) count.textContent = (i + 1) + ' / ' + slides.length;
    if (history.replaceState) history.replaceState(null, '', '#' + (i + 1));
  }

  /* ---------- navigation ---------- */
  function next() { show(current + 1); }
  function prev() { show(current - 1); }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); show(0); }
    else if (e.key === 'End') { e.preventDefault(); show(slides.length - 1); }
    else if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    }
  });
  document.getElementById('next').addEventListener('click', next);
  document.getElementById('prev').addEventListener('click', prev);

  /* ---------- init ---------- */
  rescale();
  var fromHash = parseInt((location.hash || '').replace('#', ''), 10);
  show(isNaN(fromHash) ? 0 : fromHash - 1);
})();
