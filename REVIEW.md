<!-- LTeX: language=pt-BR -->

# Instruções de revisão

Verificações específicas deste projeto para o revisor (`mission:reviewer` e o [Code Review](https://code.claude.com/docs/en/code-review-customize.md) da Anthropic, que lê este arquivo na raiz), somadas à lista genérica dele. As regras gerais estão em [.github/copilot-instructions.md](.github/copilot-instructions.md); para mudanças em testes, leia também [.claude/rules/tests.md](.claude/rules/tests.md).

## Sempre verificar

- **App congelado:** o código da aplicação mostra diff vazio contra o 1º commit (`f0154df`); divergência só em `package.json`, lockfile, `.gitignore` ou infraestrutura de execução (migrations, script de seed) registrada com o porquê. Bug do app vai para `docs/KNOWN_ISSUES.md` com `test.fail(..., knownIssue('KI-n'))`, nunca para um patch. Os specs, helpers e o teste de integração gerados pelo template não são reescritos.
- **Banco novo por job:** cada job `e2e` sobe o próprio Postgres, aplica as migrations e o seed; nada depende de um banco de outro job ou de estado deixado pela execução anterior. Cada teste que escreve cria dados únicos e não depende de ordem nem do que outro teste deixou.
- **Espera do estado final:** asserção web-first (`await expect(loc).toHaveText(x)`) e `page.waitForResponse` registrado **antes** da ação que dispara a requisição. Nunca por tempo.

## Não reportar

- O que `tsc`, ESLint, Prettier e as sentinelas de `pnpm check` já impõem (estilo, formatação, imports, tipos, cópias das regras).
