(() => {
  "use strict";

  /* =========================================================
     ELEMENTOS
  ========================================================== */

  const body = document.body;

  const video = document.querySelector("#experience-video");
  const stage = document.querySelector(".video-stage");
  const fallback = document.querySelector("#video-fallback");

  const progressFill =
    document.querySelector("#progress-fill");

  const progressValue =
    document.querySelector("#progress-value");

  const header =
    document.querySelector(".site-header");

  const depthItems = [
    ...document.querySelectorAll("[data-depth]")
  ];

  const revealItems = [
    ...document.querySelectorAll(".reveal")
  ];

  const reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  /* =========================================================
     ESTADO
  ========================================================== */

  let duration = 0;
  let targetTime = 0;
  let renderedTime = 0;

  let scrollProgress = 0;

  let animationFrame = null;

  let metadataReady = false;


  /* =========================================================
     UTILITÁRIOS
  ========================================================== */

  const clamp = (value, min, max) =>
    Math.min(Math.max(value, min), max);


  const lerp = (start, end, amount) =>
    start + (end - start) * amount;


  /* =========================================================
     PROGRESSO
  ========================================================== */

  function calculateProgress() {

    const scrollHeight =
      document.documentElement.scrollHeight;

    const viewportHeight =
      window.innerHeight;

    const distance =
      Math.max(
        scrollHeight - viewportHeight,
        1
      );

    return clamp(
      window.scrollY / distance,
      0,
      1
    );
  }


  /* =========================================================
     INTERFACE
  ========================================================== */

  function updateInterface() {

    scrollProgress =
      calculateProgress();

    const percentage =
      Math.round(
        scrollProgress * 100
      );


    /* PROGRESSO */

    if (progressFill) {
      progressFill.style.height =
        `${percentage}%`;
    }


    if (progressValue) {
      progressValue.textContent =
        `${String(percentage).padStart(2, "0")}%`;
    }


    /* HEADER */

    if (header) {
      header.classList.toggle(
        "is-scrolled",
        window.scrollY > 24
      );
    }


    /* PARALLAX */

    depthItems.forEach((item) => {

      const depth =
        Number(
          item.dataset.depth || 0
        );

      const offset =
        (
          scrollProgress - 0.5
        ) *
        depth *
        window.innerHeight *
        2;

      item.style.setProperty(
        "--scroll-depth",
        `${offset.toFixed(2)}px`
      );

    });


    /* CSS GLOBAL */

    document.documentElement.style.setProperty(
      "--scroll-progress",
      scrollProgress.toFixed(4)
    );


    /* VÍDEO */

    if (metadataReady) {

      targetTime =
        duration * scrollProgress;

    }
  }


  /* =========================================================
     VÍDEO
  ========================================================== */

  function renderVideo() {

    animationFrame = null;

    if (
      !video ||
      !metadataReady ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return;
    }


    const easing =
      reducedMotion
        ? 1
        : 0.09;


    renderedTime =
      lerp(
        renderedTime,
        targetTime,
        easing
      );


    const safeTime =
      clamp(
        renderedTime,
        0,
        Math.max(
          duration - 0.025,
          0
        )
      );


    if (
      Math.abs(
        video.currentTime -
        safeTime
      ) > 0.012
    ) {

      try {

        video.currentTime =
          safeTime;

      } catch (error) {

        /*
          Alguns navegadores podem
          recusar o seek durante o
          carregamento do vídeo.
        */

      }
    }


    if (
      !reducedMotion &&
      Math.abs(
        targetTime -
        renderedTime
      ) > 0.008
    ) {

      animationFrame =
        window.requestAnimationFrame(
          renderVideo
        );
    }
  }


  function scheduleRender() {

    if (
      animationFrame === null
    ) {

      animationFrame =
        window.requestAnimationFrame(
          renderVideo
        );
    }
  }


  /* =========================================================
     SCROLL
  ========================================================== */

  function handleScroll() {

    updateInterface();

    scheduleRender();
  }


  /* =========================================================
     RESIZE
  ========================================================== */

  function handleResize() {

    updateInterface();

    scheduleRender();
  }


  /* =========================================================
     METADATA DO VÍDEO
  ========================================================== */

  function handleMetadata() {

    if (!video) {
      return;
    }

    duration =
      video.duration;


    metadataReady =
      Number.isFinite(duration) &&
      duration > 0;


    if (!metadataReady) {

      showFallback();

      return;
    }


    const currentProgress =
      calculateProgress();


    renderedTime =
      duration *
      currentProgress;


    targetTime =
      renderedTime;


    if (stage) {
      stage.classList.add(
        "is-ready"
      );
    }


    if (fallback) {
      fallback.classList.remove(
        "is-visible"
      );
    }


    scheduleRender();
  }


  /* =========================================================
     VÍDEO PRONTO
  ========================================================== */

  function handleCanPlay() {

    if (stage) {

      stage.classList.add(
        "is-ready"
      );
    }
  }


  /* =========================================================
     ERRO NO VÍDEO
  ========================================================== */

  function showFallback() {

    metadataReady = false;

    if (stage) {

      stage.classList.remove(
        "is-ready"
      );
    }

    if (fallback) {

      fallback.classList.add(
        "is-visible"
      );
    }
  }


  /* =========================================================
     IMPEDIR AUTOPLAY
  ========================================================== */

  function preventAutoplay() {

    if (!video) {
      return;
    }

    if (!video.paused) {

      video.pause();
    }
  }


  /* =========================================================
     REVEAL
  ========================================================== */

  function setupReveal() {

    /*
      Se o navegador não suporta
      IntersectionObserver, simplesmente
      deixamos tudo visível.
    */

    if (
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
        (entries, observerInstance) => {

          entries.forEach((entry) => {

            if (
              !entry.isIntersecting
            ) {
              return;
            }


            entry.target.classList.add(
              "is-visible"
            );


            observerInstance.unobserve(
              entry.target
            );

          });

        },
        {
          threshold: 0.08,

          rootMargin:
            "0px 0px -5% 0px"
        }
      );


    revealItems.forEach((item) => {

      observer.observe(item);

    });
  }


  /* =========================================================
     INICIALIZAÇÃO SEGURA
  ========================================================== */

  /*
    Só depois que todas as funções foram
    preparadas nós ativamos o modo JS.

    Portanto:

    JS funcionando:
      .reveal -> anima

    JS quebrado:
      .reveal -> continua visível
  */

  if (body) {

    body.classList.add(
      "js-ready"
    );
  }


  setupReveal();


  /* =========================================================
     EVENTOS DO VÍDEO
  ========================================================== */

  if (video) {

    video.addEventListener(
      "loadedmetadata",
      handleMetadata,
      { once: true }
    );


    video.addEventListener(
      "canplay",
      handleCanPlay,
      { once: true }
    );


    video.addEventListener(
      "error",
      showFallback,
      { once: true }
    );


    video.addEventListener(
      "play",
      preventAutoplay
    );
  }


  /* =========================================================
     EVENTOS DA JANELA
  ========================================================== */

  window.addEventListener(
    "scroll",
    handleScroll,
    { passive: true }
  );


  window.addEventListener(
    "resize",
    handleResize,
    { passive: true }
  );


  window.addEventListener(
    "pageshow",
    preventAutoplay
  );


  /* =========================================================
     ESTADO INICIAL DO PARALLAX
  ========================================================== */

  depthItems.forEach((item) => {

    item.style.setProperty(
      "--scroll-depth",
      "0px"
    );

  });


  /* =========================================================
     START
  ========================================================== */

  preventAutoplay();

  updateInterface();

  scheduleRender();

})();
