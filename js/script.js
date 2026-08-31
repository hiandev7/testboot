(() => {
"use strict";

/* =========================================================
ELEMENTOS PRINCIPAIS
========================================================== */

const video = document.querySelector("#experience-video");
const stage = document.querySelector(".video-stage");
const fallback = document.querySelector("#video-fallback");

const progressFill = document.querySelector("#progress-fill");
const progressValue = document.querySelector("#progress-value");

const header = document.querySelector(".site-header");

const depthItems = [
...document.querySelectorAll("[data-depth]")
];

const revealItems = [
...document.querySelectorAll(".reveal")
];

const reducedMotion = window.matchMedia(
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

let isMetadataReady = false;

/* =========================================================
UTILITÁRIOS
========================================================== */

const clamp = (value, min, max) => {
return Math.min(Math.max(value, min), max);
};

const lerp = (start, end, amount) => {
return start + (end - start) * amount;
};

/* =========================================================
PROGRESSO DA PÁGINA
========================================================== */

function calculateProgress() {
const documentHeight =
document.documentElement.scrollHeight;

```
const viewportHeight =
  window.innerHeight;

const scrollableDistance = Math.max(
  documentHeight - viewportHeight,
  1
);

return clamp(
  window.scrollY / scrollableDistance,
  0,
  1
);
```

}

/* =========================================================
ATUALIZAÇÃO DA INTERFACE
========================================================== */

function updateInterface() {

```
scrollProgress = calculateProgress();

const percentage = Math.round(
  scrollProgress * 100
);


/* -----------------------------------------
   BARRA DE PROGRESSO
----------------------------------------- */

if (progressFill) {
  progressFill.style.height =
    `${percentage}%`;
}


if (progressValue) {
  progressValue.textContent =
    `${String(percentage).padStart(2, "0")}%`;
}


/* -----------------------------------------
   HEADER
----------------------------------------- */

if (header) {
  header.classList.toggle(
    "is-scrolled",
    window.scrollY > 24
  );
}


/* -----------------------------------------
   PARALLAX
----------------------------------------- */

/*
  IMPORTANTE:

  O parallax agora utiliza uma variável CSS
  em vez de sobrescrever diretamente o
  transform do elemento.

  Isso evita conflitos com:
  - reveal
  - grid
  - posicionamento mobile
  - animações
*/

depthItems.forEach((item) => {

  const depth =
    Number(item.dataset.depth || 0);

  const offset =
    (scrollProgress - 0.5) *
    depth *
    window.innerHeight *
    2;

  item.style.setProperty(
    "--scroll-depth",
    `${offset.toFixed(2)}px`
  );

});


/* -----------------------------------------
   VARIÁVEL GLOBAL DO SCROLL
----------------------------------------- */

document.documentElement.style.setProperty(
  "--scroll-progress",
  scrollProgress.toFixed(4)
);


/* -----------------------------------------
   TEMPO DO VÍDEO
----------------------------------------- */

if (isMetadataReady) {
  targetTime =
    duration * scrollProgress;
}
```

}

/* =========================================================
RENDERIZAÇÃO DO VÍDEO
========================================================== */

function renderVideo() {

```
animationFrame = null;


if (
  !isMetadataReady ||
  !Number.isFinite(duration) ||
  duration <= 0
) {
  return;
}


const easing =
  reducedMotion
    ? 1
    : 0.09;


renderedTime = lerp(
  renderedTime,
  targetTime,
  easing
);


const safeTime = clamp(
  renderedTime,
  0,
  Math.max(duration - 0.025, 0)
);


/*
  Evita realizar seeks desnecessários.
*/

if (
  Math.abs(video.currentTime - safeTime) >
  0.012
) {

  try {

    video.currentTime = safeTime;

  } catch (error) {

    /*
      Alguns navegadores podem rejeitar
      um seek durante alterações no pipeline.
    */

  }

}


/*
  Continua suavizando enquanto o usuário
  ainda estiver se deslocando pelo vídeo.
*/

if (
  Math.abs(targetTime - renderedTime) >
    0.008 &&
  !reducedMotion
) {

  animationFrame =
    window.requestAnimationFrame(
      renderVideo
    );

}
```

}

/* =========================================================
SOLICITAR RENDERIZAÇÃO
========================================================== */

function scheduleRender() {

```
if (animationFrame === null) {

  animationFrame =
    window.requestAnimationFrame(
      renderVideo
    );

}
```

}

/* =========================================================
SCROLL
========================================================== */

function handleScroll() {

```
updateInterface();

scheduleRender();
```

}

/* =========================================================
RESIZE
========================================================== */

function handleResize() {

```
/*
  Recalcula tudo depois de uma alteração
  de tamanho da janela.

  Isso é especialmente importante no mobile.
*/

updateInterface();

scheduleRender();
```

}

/* =========================================================
METADATA DO VÍDEO
========================================================== */

function handleMetadata() {

```
duration = video.duration;

isMetadataReady =
  Number.isFinite(duration) &&
  duration > 0;


if (!isMetadataReady) {
  showFallback();
  return;
}


/*
  Posiciona o vídeo imediatamente no ponto
  correspondente ao scroll atual.
*/

renderedTime =
  duration * calculateProgress();

targetTime =
  renderedTime;


if (stage) {
  stage.classList.add("is-ready");
}


if (fallback) {
  fallback.classList.remove(
    "is-visible"
  );
}


scheduleRender();
```

}

/* =========================================================
VÍDEO PRONTO
========================================================== */

function handleCanPlay() {

```
if (stage) {
  stage.classList.add("is-ready");
}
```

}

/* =========================================================
FALLBACK DO VÍDEO
========================================================== */

function showFallback() {

```
isMetadataReady = false;

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
```

}

/* =========================================================
IMPEDIR AUTOPLAY
========================================================== */

function preventAutoplay() {

```
if (!video) {
  return;
}

if (!video.paused) {
  video.pause();
}
```

}

/* =========================================================
REVEAL / ANIMAÇÕES DE ENTRADA
========================================================== */

if ("IntersectionObserver" in window) {

```
const revealObserver =
  new IntersectionObserver(
    (entries, observer) => {

      entries.forEach((entry) => {

        if (!entry.isIntersecting) {
          return;
        }


        entry.target.classList.add(
          "is-visible"
        );


        observer.unobserve(
          entry.target
        );

      });

    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -7%"
    }
  );


revealItems.forEach((item) => {

  revealObserver.observe(item);

});
```

} else {

```
/*
  Fallback para navegadores antigos:
  simplesmente exibe os elementos.
*/

revealItems.forEach((item) => {

  item.classList.add(
    "is-visible"
  );

});
```

}

/* =========================================================
EVENTOS DO VÍDEO
========================================================== */

if (video) {

```
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


/*
  Se alguma outra lógica tentar dar play,
  o vídeo continua sendo controlado pelo scroll.
*/

video.addEventListener(
  "play",
  preventAutoplay
);
```

}

/* =========================================================
EVENTOS DA PÁGINA
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
INICIALIZAÇÃO
========================================================== */

/*
Não aplicamos transform diretamente aqui.

```
O CSS deve controlar o transform dos elementos
usando:

  translate3d(
    0,
    var(--scroll-depth, 0px),
    0
  )

Dessa forma o JavaScript não destrói o
posicionamento responsivo.
```

*/

depthItems.forEach((item) => {

```
item.style.setProperty(
  "--scroll-depth",
  "0px"
);
```

});

/*
Garante que o vídeo não comece reproduzindo.
*/

preventAutoplay();

/*
Primeira atualização da interface.
*/

updateInterface();

/*
Primeira renderização.
*/

scheduleRender();

})();

