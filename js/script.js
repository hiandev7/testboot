(() => {
  "use strict";

  /*
   * =========================================================
   * CLEANBOT — SCRIPT
   * =========================================================
   *
   * Responsável por:
   * - progresso da página
   * - header
   * - parallax
   * - reveal
   * - vídeo controlado pelo scroll
   *
   * O arquivo deve conter APENAS JavaScript.
   * =========================================================
   */


  /* =========================================================
     ATIVA JAVASCRIPT NO DOCUMENTO
  ========================================================== */

  document.documentElement.classList.add(
    "js-ready"
  );


  /* =========================================================
     ELEMENTOS
  ========================================================== */

  const video =
    document.querySelector(
      "#experience-video"
    );

  const stage =
    document.querySelector(
      ".video-stage"
    );

  const fallback =
    document.querySelector(
      "#video-fallback"
    );

  const progressFill =
    document.querySelector(
      "#progress-fill"
    );

  const progressValue =
    document.querySelector(
      "#progress-value"
    );

  const header =
    document.querySelector(
      ".site-header"
    );

  const depthItems =
    Array.from(
      document.querySelectorAll(
        "[data-depth]"
      )
    );

  const revealItems =
    Array.from(
      document.querySelectorAll(
        ".reveal"
      )
    );


  /* =========================================================
     REDUÇÃO DE MOVIMENTO
  ========================================================== */

  const motionQuery =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

  let reducedMotion =
    motionQuery.matches;

  if (
    typeof motionQuery.addEventListener ===
    "function"
  ) {
    motionQuery.addEventListener(
      "change",
      (event) => {
        reducedMotion =
          event.matches;

        if (reducedMotion) {
          revealItems.forEach(
            (item) => {
              item.classList.add(
                "is-visible"
              );
            }
          );
        }
      }
    );
  }


  /* =========================================================
     ESTADO DO VÍDEO
  ========================================================== */

  let duration = 0;

  let targetTime = 0;

  let renderedTime = 0;

  let metadataReady = false;

  let videoError = false;

  let animationFrame = null;


  /* =========================================================
     UTILITÁRIOS
  ========================================================== */

  const clamp =
    (value, min, max) => {
      return Math.min(
        Math.max(
          value,
          min
        ),
        max
      );
    };


  const lerp =
    (start, end, amount) => {
      return (
        start +
        (end - start) *
        amount
      );
    };


  /* =========================================================
     PROGRESSO
  ========================================================== */

  function calculateProgress() {
    const scrollHeight =
      document.documentElement
        .scrollHeight;

    const viewportHeight =
      window.innerHeight;

    const distance =
      Math.max(
        scrollHeight -
          viewportHeight,
        1
      );

    return clamp(
      window.scrollY /
        distance,
      0,
      1
    );
  }


  /* =========================================================
     ATUALIZA INTERFACE
  ========================================================== */

  function updateInterface() {
    const progress =
      calculateProgress();

    const percentage =
      Math.round(
        progress * 100
      );


    /* PROGRESSO */

    if (progressFill) {
      progressFill.style.height =
        `${percentage}%`;
    }


    if (progressValue) {
      progressValue.textContent =
        `${String(
          percentage
        ).padStart(
          2,
          "0"
        )}%`;
    }


    /* HEADER */

    if (header) {
      header.classList.toggle(
        "is-scrolled",
        window.scrollY > 24
      );
    }


    /* PARALLAX */

    const isMobile =
      window.innerWidth <= 650;


    depthItems.forEach(
      (item) => {

        const depth =
          Number(
            item.dataset.depth ||
              0
          );


        /*
         * Reduzimos o parallax
         * no celular para impedir
         * deslocamentos excessivos.
         */

        const multiplier =
          isMobile
            ? 0.35
            : 1;


        const offset =
          (
            progress -
            0.5
          ) *
          depth *
          window.innerHeight *
          2 *
          multiplier;


        item.style.setProperty(
          "--scroll-depth",
          `${offset.toFixed(
            2
          )}px`
        );
      }
    );


    /* VARIÁVEL GLOBAL */

    document.documentElement.style.setProperty(
      "--scroll-progress",
      progress.toFixed(4)
    );


    /* VÍDEO */

    if (
      metadataReady &&
      duration > 0
    ) {
      targetTime =
        duration *
        progress;

      scheduleVideoRender();
    }
  }


  /* =========================================================
     RENDERIZA VÍDEO
  ========================================================== */

  function renderVideo() {

    animationFrame = null;


    if (
      !video ||
      !metadataReady ||
      videoError ||
      !Number.isFinite(
        duration
      ) ||
      duration <= 0
    ) {
      return;
    }


    const easing =
      reducedMotion
        ? 1
        : 0.1;


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
          duration - 0.03,
          0
        )
      );


    /*
     * Só executamos seek quando
     * a diferença for significativa.
     */

    if (
      Math.abs(
        video.currentTime -
          safeTime
      ) > 0.015
    ) {

      try {

        video.currentTime =
          safeTime;

      } catch (error) {

        /*
         * O navegador pode bloquear
         * o seek momentaneamente.
         */
      }
    }


    /*
     * Continua a animação suavizada.
     */

    if (
      !reducedMotion &&
      Math.abs(
        targetTime -
          renderedTime
      ) > 0.01
    ) {

      animationFrame =
        window.requestAnimationFrame(
          renderVideo
        );
    }
  }


  /* =========================================================
     AGENDA RENDERIZAÇÃO
  ========================================================== */

  function scheduleVideoRender() {

    if (
      animationFrame === null &&
      metadataReady &&
      !videoError
    ) {

      animationFrame =
        window.requestAnimationFrame(
          renderVideo
        );
    }
  }


  /* =========================================================
     METADATA
  ========================================================== */

  function handleMetadata() {

    if (!video) {
      return;
    }


    const videoDuration =
      video.duration;


    if (
      !Number.isFinite(
        videoDuration
      ) ||
      videoDuration <= 0
    ) {

      handleVideoError();

      return;
    }


    duration =
      videoDuration;

    metadataReady = true;

    videoError = false;


    /*
     * Posiciona o vídeo
     * exatamente onde o usuário está.
     */

    const progress =
      calculateProgress();


    renderedTime =
      duration *
      progress;


    targetTime =
      renderedTime;


    try {

      video.currentTime =
        clamp(
          renderedTime,
          0,
          Math.max(
            duration - 0.03,
            0
          )
        );

    } catch (error) {}


    /*
     * Nunca inicia reprodução.
     */

    preventAutoplay();


    /*
     * Vídeo carregado.
     */

    if (stage) {

      stage.classList.add(
        "is-ready"
      );

      stage.classList.remove(
        "has-video-error"
      );
    }


    if (fallback) {

      fallback.classList.remove(
        "is-visible"
      );
    }


    scheduleVideoRender();
  }


  /* =========================================================
     CANPLAY
  ========================================================== */

  function handleCanPlay() {

    if (!video) {
      return;
    }


    if (
      Number.isFinite(
        video.duration
      ) &&
      video.duration > 0
    ) {

      handleMetadata();
    }
  }


  /* =========================================================
     ERRO DO VÍDEO
  ========================================================== */

  function handleVideoError() {

    metadataReady = false;

    videoError = true;


    /*
     * IMPORTANTE:
     *
     * Não quebramos o site.
     * Apenas mostramos o fundo CSS.
     */

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
  }


  /* =========================================================
     IMPEDIR AUTOPLAY
  ========================================================== */

  function preventAutoplay() {

    if (!video) {
      return;
    }


    if (!video.paused) {

      try {

        video.pause();

      } catch (error) {}
    }
  }


  /* =========================================================
     REVEAL
  ========================================================== */

  function setupReveal() {

    if (
      revealItems.length === 0
    ) {
      return;
    }


    /*
     * Para usuários que preferem
     * menos movimento.
     */

    if (reducedMotion) {

      revealItems.forEach(
        (item) => {

          item.classList.add(
            "is-visible"
          );
        }
      );

      return;
    }


    /*
     * Fallback.
     */

    if (
      !(
        "IntersectionObserver"
        in window
      )
    ) {

      revealItems.forEach(
        (item) => {

          item.classList.add(
            "is-visible"
          );
        }
      );

      return;
    }


    const observer =
      new IntersectionObserver(
        (
          entries,
          observerInstance
        ) => {

          entries.forEach(
            (entry) => {

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
            }
          );
        },
        {
          threshold: 0.04,

          rootMargin:
            "0px 0px -4% 0px"
        }
      );


    revealItems.forEach(
      (item) => {

        observer.observe(
          item
        );
      }
    );
  }


  /* =========================================================
     INICIALIZAÇÃO DO VÍDEO
  ========================================================== */

  function initializeVideo() {

    if (!video) {
      return;
    }


    /*
     * Configuração segura
     * para navegadores móveis.
     */

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

    video.setAttribute(
      "preload",
      "metadata"
    );


    /* EVENTOS */

    video.addEventListener(
      "loadedmetadata",
      handleMetadata
    );

    video.addEventListener(
      "durationchange",
      () => {

        if (
          !metadataReady &&
          Number.isFinite(
            video.duration
          ) &&
          video.duration > 0
        ) {

          handleMetadata();
        }
      }
    );

    video.addEventListener(
      "loadeddata",
      handleCanPlay
    );

    video.addEventListener(
      "canplay",
      handleCanPlay
    );

    video.addEventListener(
      "error",
      handleVideoError
    );

    video.addEventListener(
      "play",
      preventAutoplay
    );

    video.addEventListener(
      "ended",
      preventAutoplay
    );


    /*
     * Carregamento.
     */

    try {

      video.load();

    } catch (error) {

      handleVideoError();
    }


    /*
     * Caso os metadados já estejam
     * disponíveis.
     */

    if (
      video.readyState >= 1 &&
      Number.isFinite(
        video.duration
      ) &&
      video.duration > 0
    ) {

      handleMetadata();
    }
  }


  /* =========================================================
     RESIZE
  ========================================================== */

  let resizeTimer = null;


  function handleResize() {

    if (resizeTimer) {

      window.clearTimeout(
        resizeTimer
      );
    }


    resizeTimer =
      window.setTimeout(
        () => {

          updateInterface();

        },
        80
      );
  }


  /* =========================================================
     EVENTOS
  ========================================================== */

  window.addEventListener(
    "scroll",
    updateInterface,
    {
      passive: true
    }
  );


  window.addEventListener(
    "resize",
    handleResize,
    {
      passive: true
    }
  );


  window.addEventListener(
    "pageshow",
    () => {

      preventAutoplay();

      updateInterface();

    }
  );


  /* =========================================================
     START
  ========================================================== */

  depthItems.forEach(
    (item) => {

      item.style.setProperty(
        "--scroll-depth",
        "0px"
      );
    }
  );


  setupReveal();

  initializeVideo();

  preventAutoplay();

  updateInterface();

})();
