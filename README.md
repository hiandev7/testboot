# CleanBot — Protótipo imersivo

Site estático de demonstração para o CleanBot, um sistema inteligente de limpeza robótica. A experiência usa o deslocamento da página para controlar o tempo do vídeo de fundo, simulando uma navegação espacial em profundidade.

## Recursos

- Vídeo em tela cheia controlado pela rolagem, sem reprodução automática.
- Mapeamento normalizado entre a rolagem total da página e o tempo do vídeo.
- Suavização com `requestAnimationFrame` e interpolação linear.
- Tratamento de metadados, falha do vídeo e preferência por movimento reduzido.
- Interface responsiva, efeitos de vidro, gradientes e camadas de profundidade.
- Conteúdo em português brasileiro e sem dependências de frameworks.

## Estrutura

```text
project-root/
├── assets/
│   └── video.mp4
├── css/
│   └── style.css
├── js/
│   └── script.js
├── .gitignore
├── index.html
└── README.md
```

## Execução local

Abra `index.html` em um navegador moderno. Para uma prévia mais próxima da publicação, sirva a pasta com um servidor HTTP local e acesse a página no navegador.

## Publicação no GitHub Pages

1. Crie um repositório vazio no GitHub.
2. Envie o conteúdo desta pasta para a ramificação `main`.
3. Em **Settings → Pages**, selecione a ramificação `main` e a pasta raiz.
4. Salve a configuração e aguarde o endereço publicado pelo GitHub.

O arquivo de vídeo está em `assets/video.mp4` e é referenciado por caminho relativo, compatível com GitHub Pages.

## Observação de desempenho

O navegador procura o vídeo previamente e só começa o controle de tempo depois que os metadados estiverem disponíveis. Durante a rolagem, os seeks são suavizados e ignorados quando a diferença é imperceptível, reduzindo trabalho desnecessário.
