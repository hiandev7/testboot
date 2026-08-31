(() => {
  "use strict";

  const html = document.documentElement;

  const video = document.querySelector("#experience-video");
  const stage = document.querySelector(".video-stage");
  const fallback = document.querySelector("#video-fallback");

  const progressFill = document.querySelector("#progress-fill");
  const progressValue = document.querySelector("#progress-value");
  const header = document.querySelector(".site-header");

  const depthItems = Array.from(
    document.querySelectorAll("[data-depth]")
  );

  const revealItems = Array.from(
    document.querySelectorAll(".reveal")
  );

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let duration = 0;
  let targetTime = 0;
  let renderedTime = 0;
  let videoReady = false;
  let videoHasError = false;
  let animationFrame = null;

  const clamp = (value, min, max) =>
    Math.min(Math.max(value, min), max);

  const lerp = (start, end, amount) =>
    start + (end - start) * amount;

  const getProgress = () => {
    const total =
      document.documentElement.scrollHeight -
      window.innerHeight;

    if (total <= 0) {
      return 0;
    }

    return clamp(
      window.scrollY / total,
      0,
      1
    );
  };

  const updateParallax = (progress) => {
    const isMobile = window.innerWidth <= 650;

    depthItems.forEach((item) => {
      const depth = Number(
        item.dataset.depth || 0
      );

      const multiplier = isMobile ? 0.3 : 1;

      const offset =
        (progress - 0.5) *
        depth *
        window.innerHeight *
        2 *
        multiplier;

      item.style.setProperty(
        "--scroll-depth",
        `${offset.toFixed(2)}px`
      );
    });
  };

  const updateInterface = () => {
    const progress = getProgress();
    const percentage = Math.round(progress * 100);

    if (progressFill) {
      progressFill.style.height = `${percentage}%`;
    }

    if (progressValue) {
      progressValue.textContent =
        `${String(percentage).padStart(2, "0")}%`;
    }

    if (header) {
      header.classList.toggle(
        "is-scrolled",
        window.scrollY > 24
      );
    }

    updateParallax(progress);

    html.style.setProperty(
      "--scroll-progress",
      progress.toFixed(4)
    );

    if (
      videoReady &&
      !videoHasError &&
      duration > 0
    ) {
      targetTime =
        duration * progress;

      scheduleVideo();
    }
  };

  const renderVideo = () => {
    animationFrame = null;

    if (
      !video ||
      !videoReady ||
      videoHasError ||
      duration <= 0
    ) {
      return;
    }

    const easing = reducedMotion ? 1 : 0.1;

    renderedTime = lerp(
      renderedTime,
      targetTime,
      easing
    );

    const nextTime = clamp(
      renderedTime,
      0,
      Math.max(duration - 0.03, 0)
    );

    if (
      Math.abs(
        video.currentTime - nextTime
      ) > 0.015
    ) {
      try {
        video.currentTime = nextTime;
      } catch (error) {
      }
    }

    if (
      !reducedMotion &&
      Math.abs(
        targetTime - renderedTime
      ) > 0.01
    ) {
      scheduleVideo();
    }
  };

  const scheduleVideo = () => {
    if (
      animationFrame === null &&
      videoReady &&
      !videoHasError
    ) {
      animationFrame =
        window.requestAnimationFrame(
          renderVideo
        );
    }
  };

  const hideFallback = () => {
    if (fallback) {
      fallback.classList.remove(
        "is-visible"
      );
    }
  };

  const showFallback = () => {
    videoHasError = true;
    videoReady = false;

    if (stage) {
      stage.classList.add(
        "has-video-error"
      );
    }

    if (fallback) {
      fallback.classList.add(
        "is-visible"
      );
    }
  };

  const pauseVideo = () => {
    if (!video) {
      return;
    }

    if (!video.paused) {
      try {
        video.pause();
      } catch (error) {
      }
    }
  };

  const initializeVideo = () => {
    if (!video) {
      return;
    }

    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = false;
    video.playsInline = true;

    video.setAttribute(
      "muted",
      ""
    );

    video.setAttribute(
      "playsinline",
      ""
    );

    video.addEventListener(
      "loadedmetadata",
      () => {
        if (
          !Number.isFinite(video.duration) ||
          video.duration <= 0
        ) {
          showFallback();
          return;
        }

        duration = video.duration;
        videoReady = true;
        videoHasError = false;

        if (stage) {
          stage.classList.remove(
            "has-video-error"
          );

          stage.classList.add(
            "is-ready"
          );
        }

        hideFallback();
        pauseVideo();
        updateInterface();
        scheduleVideo();
      }
    );

    video.addEventListener(
      "loadeddata",
      () => {
        pauseVideo();

        if (
          Number.isFinite(video.duration) &&
          video.duration > 0 &&
          !videoReady
        ) {
          duration = video.duration;
          videoReady = true;

          if (stage) {
            stage.classList.add(
              "is-ready"
            );
          }

          hideFallback();
          updateInterface();
          scheduleVideo();
        }
      }
    );

    video.addEventListener(
      "canplay",
      pauseVideo
    );

    video.addEventListener(
      "play",
      pauseVideo
    );

    video.addEventListener(
      "error",
      showFallback
    );

    video.addEventListener(
      "ended",
      pauseVideo
    );

    try {
      video.load();
    } catch (error) {
      showFallback();
    }

    if (
      video.readyState >= 1 &&
      Number.isFinite(video.duration) &&
      video.duration > 0
    ) {
      duration = video.duration;
      videoReady = true;

      if (stage) {
        stage.classList.add(
          "is-ready"
        );
      }

      updateInterface();
      scheduleVideo();
    }
  };

  const initializeReveal = () => {
    if (!revealItems.length) {
      return;
    }

    if (
      reducedMotion ||
      !("IntersectionObserver" in window)
    ) {
      revealItems.forEach((item) => {
        item.classList.add(
          "is-visible"
        );
      });

      return;
    }

    const observer =
      new IntersectionObserver(
        (entries, instance) => {
          entries.forEach((entry) => {
            if (
              !entry.isIntersecting
            ) {
              return;
            }

            entry.target.classList.add(
              "is-visible"
            );

            instance.unobserve(
              entry.target
            );
          });
        },
        {
          threshold: 0.05,
          rootMargin:
            "0px 0px -4% 0px"
        }
      );

    revealItems.forEach((item) => {
      observer.observe(item);
    });
  };

  html.classList.add(
    "js-ready"
  );

  depthItems.forEach((item) => {
    item.style.setProperty(
      "--scroll-depth",
      "0px"
    );
  });

  initializeReveal();
  initializeVideo();

  window.addEventListener(
    "scroll",
    updateInterface,
    {
      passive: true
    }
  );

  window.addEventListener(
    "resize",
    updateInterface,
    {
      passive: true
    }
  );

  window.addEventListener(
    "pageshow",
    () => {
      pauseVideo();
      updateInterface();
    }
  );

  pauseVideo();
  updateInterface();
})();
