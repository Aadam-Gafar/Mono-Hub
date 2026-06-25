// Lightweight, dependency-free carousel.
// Progressive enhancement: without JS the track stays swipeable via scroll-snap.

(function () {
  "use strict";

  var INTERVAL = 5000; // keep in sync with --carousel-interval in style.css
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initCarousel(root) {
    var track = root.querySelector("[data-carousel-track]");
    var slides = Array.prototype.slice.call(track.children);
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-dot]"));
    var count = slides.length;
    if (count <= 1) return;

    var index = 0;
    var timer = null;
    var playing = false;

    function setActive(i) {
      index = i;
      for (var n = 0; n < dots.length; n++) {
        var active = n === i;
        dots[n].toggleAttribute("data-active", active);
        dots[n].setAttribute("aria-selected", active ? "true" : "false");
      }
      for (var s = 0; s < slides.length; s++) {
        slides[s].setAttribute("aria-hidden", s === i ? "false" : "true");
      }
    }

    function goTo(i, smooth) {
      i = (i + count) % count;
      track.scrollTo({
        left: i * track.clientWidth,
        behavior: smooth === false ? "auto" : "smooth"
      });
      setActive(i);
      if (playing) restartTimer();
    }

    function restartTimer() {
      clearInterval(timer);
      timer = setInterval(function () { goTo(index + 1); }, INTERVAL);
    }

    function play() {
      playing = true;
      root.classList.add("is-playing");
      restartTimer();
    }

    function pause() {
      playing = false;
      root.classList.remove("is-playing");
      clearInterval(timer);
    }

    dots.forEach(function (dot, n) {
      dot.addEventListener("click", function () { goTo(n); });
    });

    // Keep the active dot in sync when the user swipes or scrolls the track.
    var scrollTimer;
    track.addEventListener("scroll", function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== index) {
          setActive(i);
          if (playing) restartTimer();
        }
      }, 90);
    }, { passive: true });

    // Arrow-key navigation when the carousel (or a control) has focus.
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    });

    // Realign on resize so the active slide stays centered.
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { goTo(index, false); }, 120);
    });

    setActive(0);
    if (reduceMotion) {
      pause();
    } else {
      // Only start once the carousel is on screen, so the first segment fill
      // animation lines up with what the visitor actually sees.
      if ("IntersectionObserver" in window) {
        var started = false;
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !started) {
              started = true;
              play();
              io.disconnect();
            }
          });
        }, { threshold: 0.4 });
        io.observe(root);
      } else {
        play();
      }
    }
  }

  document.querySelectorAll("[data-carousel]").forEach(initCarousel);
})();
