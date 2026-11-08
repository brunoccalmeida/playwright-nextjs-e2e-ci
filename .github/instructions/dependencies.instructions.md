---
applyTo: 'package.json,pnpm-lock.yaml,pnpm-workspace.yaml'
---

<!-- LTeX: language=pt-BR -->

# Dependências (pnpm)

- `pnpm-lock.yaml` é gerado: nunca edite à mão; em conflito, regenere. CI instala com `--frozen-lockfile`.
- Versão do pnpm fixada em `packageManager` (`package.json`). No pnpm 11, configuração fica em `pnpm-workspace.yaml`: o campo `pnpm` do `package.json` e as opções não ligadas a autenticação do `.npmrc` não são lidos.
- Dependência nova da suíte entra com versão exata (`pnpm add -D -E`); as do app ficam como o template gerou até um PR de atualização.
- Script de build de dependência só entra por `allowBuilds`, autorizado por nome depois de revisado.
- Vulnerabilidade em dependência transitiva: `overrides` em `pnpm-workspace.yaml` para a versão corrigida, sem forçar versão maior.
- Versão maior é decisão humana: ler as notas de versão e medir o impacto antes de atualizar. Conferir _peer dependencies_ (ex.: `typescript-eslint` limita a versão do TypeScript).
