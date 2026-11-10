---
applyTo: 'tests/**,config/playwright.config.ts,docs/KNOWN_ISSUES.md'
---

<!-- LTeX: language=pt-BR -->

# Testes com Playwright

**Hierarquia:** API (contrato e regras de negócio, rápidos) · E2E (jornadas de usuário no navegador). Cobertura de regra vai para a API; E2E cobre só o que precisa do navegador.

- **Isolamento:** banco novo por job; testes não dependem de ordem. Cada teste cria os próprios dados, únicos (nomes com sufixo), e não depende de dados de outro teste; o seed é a única base compartilhada, e nenhum teste a altera.
- **Localizadores voltados ao usuário:** `getByRole`, `getByLabel`, `getByText`; `getByTestId` só quando não há alternativa acessível (registre o porquê). Nada de CSS/XPath frágil. `getByRole` casa por substring sem diferenciar maiúsculas: use `exact: true` quando houver ambiguidade.
- **Bug conhecido do app:** `test.fail(título, knownIssue('KI-n'), corpo)`, nunca `skip`; KI novo entra em `docs/KNOWN_ISSUES.md` e no mapa de `tests/known-issues.ts` (título idêntico ao cabeçalho, que gera o link). Quando o bug for corrigido, o teste passa a "falhar" e avisa. Antes de marcar, troque temporariamente por `test` e confirme que falha **pelo motivo do bug**: `test.fail()` aceita qualquer falha, inclusive um erro no próprio teste.
- **Diagnóstico:** abra o trace com `pnpm exec playwright show-trace`; falha intermitente se confirma com `--repeat-each`.

## Espere o resultado da ação

| Contexto             | Armadilha                                                         | Como esperar corretamente                                                           |
| -------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Asserção na UI       | `expect(await loc.textContent()).toBe(x)` lê uma vez, cedo demais | Asserção web-first: `await expect(loc).toHaveText(x)` (tenta até o timeout)         |
| Navegação em SPA     | A URL muda antes de o conteúdo renderizar                         | Esperar um elemento do destino, não só `toHaveURL`                                  |
| Ação que dispara API | A UI otimista aparece antes de a resposta chegar                  | `page.waitForResponse` registrado **antes** da ação, ou asserção no resultado final |
