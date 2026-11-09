---
name: pnpm-docs
description: Consulta a documentação oficial do pnpm na major fixada neste repositório, porque pnpm.io pode já estar numa major mais nova. Use em qualquer dúvida sobre pnpm, pnpm-workspace.yaml, settings, CLI, audit, overrides, allowBuilds, catalogs, runtime, lockfile ou comportamento de install.
---

<!-- LTeX: language=pt-BR -->

Aponta para a doc; não responda de memória nem copie o conteúdo para cá.

1. **Versão:** campo `packageManager` do `package.json`. A major é `<M>`.
2. **Descubra onde está essa major:** `https://raw.githubusercontent.com/pnpm/pnpm.io/main/versions.json`, com a mais recente em primeiro.
   - Se `<M>.x` for a primeira, a pasta é `docs/`.
   - Se não, é `versioned_docs/version-<M>.x/`.
3. **Leia o fonte** em `https://raw.githubusercontent.com/pnpm/pnpm.io/main/<pasta>/<página>.md` (`settings/build.md`, `cli/audit.md`). As configurações ficam em subpáginas de `settings/`; `settings.md` é só o índice.
4. **Cite** `https://github.com/pnpm/pnpm.io/blob/main/<pasta>/<página>.md`.
5. **Para a versão exata**, além da major: `blog/releases/<versão>.md` no mesmo repositório e `pnpm help <comando>`, que respondem pela versão instalada.

Listar as páginas: `gh api 'repos/pnpm/pnpm.io/git/trees/main?recursive=1' --jq '.tree[].path'`, filtrando pela pasta.

## Por que não o site

Baixar `pnpm.io/<M>.x/<página>` não prova a versão: a mesma página veio com bytes idênticos para 9.x, 11.x, 12.x e sem versão. `pnpm.io/<página>` é a major mais recente, que pode não ser a nossa. O site também não tem `llms.txt`.

## Armadilhas já pagas

- Regras de uso em `.claude/rules/dependencies.md`.
- Mudar o `package.json` e rodar um script pode reinstalar sozinho, por causa de `verifyDepsBeforeRun`: sonda em manifesto vai para uma cópia da pasta.
- `pnpm runtime -g` exige `$PNPM_HOME/bin` no `PATH`.
