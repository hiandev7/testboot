(() => {
  "use strict";

  const video = document.querySelector("#experience-video");
  const stage = document.querySelector(".video-stage");
  const fallback = document.querySelector("#video-fallback");
  const progressFill = document.querySelector("#progress-fill");
  const progressValue = document.querySelector("#progress-value");
  const header = document.querySelector(".site-header");
  const depthItems = [...document.querySelectorAll("[data-depth]")];
  const revealItems = [...document.querySelectorAll(".reveal")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let duration = 0;
  let targetTime = 0;
  let renderedTime = 0;
  let scrollProgress = 0;
  let animationFrame = 0;
  let isMetadataReady = false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, amount) => start + (end - start) * amount;

  function calculateProgress() {
    const scrollableDistance = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1,
    );
    return clamp(window.scrollY / scrollableDistance, 0, 1);
  }

  function updateInterface() {
    scrollProgress = calculateProgress();
    const percentage = Math.round(scrollProgress * 100);

    progressFill.style.height = `${percentage}%`;
    progressValue.textContent = `${String(percentage).padStart(2, "0")}%`;
    header.classList.toggle("is-scrolled", window.scrollY > 24);

    depthItems.forEach((item) => {
      const depth = Number(item.dataset.depth || 0);
      const offset = (scrollProgress - 0.5) * depth * window.innerHeight * 2;
      item.style.setProperty("--scroll-depth", `${offset.toFixed(2)}px`);
    });

    document.documentElement.style.setProperty("--scroll-progress", scrollProgress.toFixed(4));
    targetTime = isMetadataReady ? duration * scrollProgress : 0;
  }

  function renderVideo() {
    animationFrame = 0;

    if (!isMetadataReady || !Number.isFinite(duration) || duration <= 0) {
      return;
    }

    const easing = reducedMotion ? 1 : 0.09;
    renderedTime = lerp(renderedTime, targetTime, easing);
    const safeTime = clamp(renderedTime, 0, Math.max(duration - 0.025, 0));

    if (Math.abs(video.currentTime - safeTime) > 0.012) {
      try {
        video.currentTime = safeTime;
      } catch (error) {
        // Some browsers reject a seek while the media pipeline is changing state.
      }
    }

    if (Math.abs(targetTime - renderedTime) > 0.008 && !reducedMotion) {
      animationFrame = window.requestAnimationFrame(renderVideo);
    }
  }

  function scheduleRender() {
    if (!animationFrame) {
      animationFrame = window.requestAnimationFrame(renderVideo);
    }
  }

  function handleScroll() {
    updateInterface();
    scheduleRender();
  }

  function handleMetadata() {
    duration = video.duration;
    isMetadataReady = Number.isFinite(duration) && duration > 0;
    renderedTime = duration * calculateProgress();
    targetTime = renderedTime;
    stage.classList.toggle("is-ready", isMetadataReady);
    fallback.classList.remove("is-visible");
    scheduleRender();
  }

  function showFallback() {
    stage.classList.remove("is-ready");
    fallback.classList.add("is-visible");
  }

  function preventAutoplay() {
    if (!video.paused) {
      video.pause();
    }
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -7%" },
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  video.addEventListener("loadedmetadata", handleMetadata, { once: true });
  video.addEventListener("canplay", () => stage.classList.add("is-ready"), { once: true });
  video.addEventListener("error", showFallback, { once: true });
  video.addEventListener("play", preventAutoplay);
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleScroll, { passive: true });
  window.addEventListener("pageshow", preventAutoplay);

  depthItems.forEach((item) => {
    item.style.transform = "translate3d(0, var(--scroll-depth, 0px), 0)";
  });

  preventAutoplay();
  handleScroll();
})();
