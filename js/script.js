(() => {
  "use strict";

  /* =========================================================
     ATIVAÇÃO SEGURA DO JAVASCRIPT
  ========================================================== */

  /*
    A classe fica no <html>.

    Isso permite ao CSS usar:

    .js-ready .reveal

    Se o JavaScript não carregar, essa classe não existe
    e o conteúdo permanece visível.
  */

  document.documentElement.classList.add("js-ready");


  /* =========================================================
     ELEMENTOS
  ========================================================== */

  const video =
    document.querySelector("#experience-video");

  const stage =
    document.querySelector(".video-stage");

  const fallback =
    document.querySelector("#video-fallback");

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

  const clamp = (
    value,
    min,
    max
  ) =>
    Math.min(
      Math.max(value, min),
      max
    );


  const lerp = (
    start,
    end,
    amount
  ) =>
    start +
    (end - start) *
    amount;


  /* =========================================================
     PROGRESSO DA PÁGINA
  ========================================================== */

  function calculateProgress() {

    const scrollHeight =
      document.documentElement.scrollHeight;

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
     INTERFACE
  ========================================================== */

  function updateInterface() {

    scrollProgress =
      calculateProgress();

    const percentage =
      Math.round(
        scrollProgress * 100
      );


    /* -------------------------------------------------------
       BARRA DE PROGRESSO
    -------------------------------------------------------- */

    if (progressFill) {

      progressFill.style.height =
        `${percentage}%`;
    }


    /* -------------------------------------------------------
       PORCENTAGEM
    -------------------------------------------------------- */

    if (progressValue) {

      progressValue.textContent =
        `${String(
          percentage
        ).padStart(2, "0")}%`;
    }


    /* -------------------------------------------------------
       HEADER
    -------------------------------------------------------- */

    if (header) {

      header.classList.toggle(
        "is-scrolled",
        window.scrollY > 24
      );
    }


    /* -------------------------------------------------------
       PARALLAX
    -------------------------------------------------------- */

    depthItems.forEach((item) => {

      const depth =
        Number(
          item.dataset.depth || 0
        );


      const offset =
        (
          scrollProgress -
          0.5
        ) *
        depth *
        window.innerHeight *
        2;


      /*
        IMPORTANTE:

        Não aplicamos transform
        diretamente no elemento.

        Apenas atualizamos a variável
        CSS --scroll-depth.

        O CSS fica responsável pelo
        transform final.
      */

      item.style.setProperty(
        "--scroll-depth",
        `${offset.toFixed(2)}px`
      );
    });


    /* -------------------------------------------------------
       VARIÁVEL GLOBAL
    -------------------------------------------------------- */

    document.documentElement.style.setProperty(
      "--scroll-progress",
      scrollProgress.toFixed(4)
    );


    /* -------------------------------------------------------
       VÍDEO
    -------------------------------------------------------- */

    if (
      metadataReady &&
      Number.isFinite(duration) &&
      duration > 0
    ) {

      targetTime =
        duration *
        scrollProgress;
    }
  }


  /* =========================================================
     RENDERIZAÇÃO DO VÍDEO
  ========================================================== */

  function renderVideo() {

    animationFrame = null;


    /*
      Se o vídeo não estiver disponível,
      simplesmente não fazemos nada.
    */

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
          duration -
            0.025,
          0
        )
      );


    /*
      Evita buscas desnecessárias
      no vídeo.
    */

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
          rejeitar um seek durante
          o carregamento.
        */
      }
    }


    /*
      Continua suavizando a posição
      enquanto houver diferença.
    */

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


  /* =========================================================
     AGENDAR RENDERIZAÇÃO
  ========================================================== */

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


    /*
      Caso o vídeo não tenha duração válida,
      usamos o fallback.
    */

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


    /*
      Não iniciamos o vídeo.

      Ele será controlado pela
      posição da página.
    */

    preventAutoplay();
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

      try {

        video.pause();

      } catch (error) {

        /*
          Ignora erros específicos
          do navegador.
        */
      }
    }
  }


  /* =========================================================
     REVEAL
  ========================================================== */

  function setupReveal() {

    /*
      Se não houver elementos,
      não precisamos configurar
      o observer.
    */

    if (
      revealItems.length === 0
    ) {

      return;
    }


    /*
      Fallback para navegadores
      sem IntersectionObserver.
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
          threshold: 0.08,

          rootMargin:
            "0px 0px -5% 0px"
        }
      );


    revealItems.forEach(
      (item) => {

        observer.observe(item);
      }
    );
  }


  /* =========================================================
     EVENTOS DO VÍDEO
  ========================================================== */

  if (video) {

    video.addEventListener(
      "loadedmetadata",
      handleMetadata,
      {
        once: true
      }
    );


    video.addEventListener(
      "canplay",
      handleCanPlay,
      {
        once: true
      }
    );


    video.addEventListener(
      "error",
      showFallback,
      {
        once: true
      }
    );


    video.addEventListener(
      "play",
      preventAutoplay
    );


    video.addEventListener(
      "loadeddata",
      preventAutoplay
    );


    video.addEventListener(
      "ended",
      preventAutoplay
    );
  }


  /* =========================================================
     EVENTOS DA JANELA
  ========================================================== */

  window.addEventListener(
    "scroll",
    handleScroll,
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
    preventAutoplay
  );


  /* =========================================================
     INICIALIZAÇÃO
  ========================================================== */

  setupReveal();


  /*
    Inicializa o parallax.

    Não aplicamos transform diretamente.
    Apenas zeramos a variável CSS.
  */

  depthItems.forEach(
    (item) => {

      item.style.setProperty(
        "--scroll-depth",
        "0px"
      );
    }
  );


  /*
    Garante que o vídeo não
    comece sozinho.
  */

  preventAutoplay();


  /*
    Calcula o estado inicial
    da página.
  */

  updateInterface();


  /*
    Agenda o primeiro render
    do vídeo, caso ele já esteja
    disponível.
  */

  scheduleRender();

})();
