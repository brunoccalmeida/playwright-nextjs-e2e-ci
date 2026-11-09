---
name: playwright-docs
description: Consulta a documentação oficial do Playwright na versão fixada neste repositório, porque playwright.dev só mostra a mais recente. Use em qualquer dúvida sobre Playwright Test, API, config ou comportamento (webServer, fixtures, projects, locators, assertions, test.fail, tracing, reporters, Docker, CI, Test Agents).
---

<!-- LTeX: language=pt-BR -->

Aponta para a doc; não responda de memória nem copie o conteúdo para cá.

1. **Versão:** `@playwright/test` no `package.json`, sempre exata. Chamada de `<v>` abaixo.
2. **Leia o fonte da doc na tag**, em `https://raw.githubusercontent.com/microsoft/playwright/v<v>/docs/src/`:
   - Guia: `<id>-js.md` (`test-webserver-js.md`, `best-practices-js.md`). Quem não tem variante por linguagem fica sem sufixo (`ci.md`, `docker.md`).
   - API da biblioteca: `api/class-<classe>.md`, com a classe em minúsculas (`api/class-locatorassertions.md`).
   - API do runner: `test-api/class-<classe>.md` (`test-api/class-testconfig.md`).
   - Para descobrir o arquivo: `gh api 'repos/microsoft/playwright/contents/docs/src?ref=v<v>' --jq '.[].name'`.
3. **Cite** `https://github.com/microsoft/playwright/blob/v<v>/docs/src/<arquivo>`, que abre para quem lê. Link de `playwright.dev` só como complemento, dizendo que ele mostra a versão mais recente.
4. **Se a doc não responder:** tipos em `node_modules/.pnpm/playwright@<v>/node_modules/playwright/types/test.d.ts`, `pnpm exec playwright <comando> --help` e o código instalado. Diga que veio dali.

O site não tem `llms.txt` nem URL por versão (`/docs/<versão>/...` responde 404). Se precisar saber o que muda numa atualização, leia `release-notes-js.md` na tag nova.

## Armadilhas já pagas

- A imagem do CI acompanha a versão do pacote: `pnpm check:ci-image` aponta a imagem certa.
- `--reporter` na linha de comando substitui os da config, e aí o `playwright-report/` não é gerado.
- Com `--reporter=json`, o log do `webServer` se mistura à saída: use `PLAYWRIGHT_JSON_OUTPUT_NAME`. Esse reporter só traz passos de `test.step`.
- `toBeInViewport` não pega transbordo com `isMobile`; `clientWidth` é a referência certa.
- `test.fail()` aceita qualquer falha: confirme antes, com `test` puro, que falha pelo motivo do bug.
- Agentes (`init-agents`): o valor é `--loop=claude`, conferido no `--help`; o exemplo da seção do Claude Code na doc usa `vscode`.
- `waitFor()` sem `actionTimeout` não tem prazo: execução de agente sempre com limite externo.
