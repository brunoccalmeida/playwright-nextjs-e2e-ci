<!-- LTeX: language=pt-BR -->

# Resumo das sessões

Estado do projeto entre chats. Lido no início de cada missão (ver `.github/copilot-instructions.md`).

## Estado atual

| Item             | Estado                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Missão atual     | Missão 0 — Fundação (#1), concluída com o merge do PR da fundação                                                                                                        |
| Próxima missão   | Missão 1 — ambiente local reproduzível (#2)                                                                                                                              |
| PRs abertos      | nenhum após o merge (Dependabot pode abrir outros: tratar no início do chat)                                                                                             |
| Portões          | `pnpm check` (job `check`): `tsc` com o config do template e o da suíte, ESLint da suíte, Prettier da suíte e as sentinelas de known issues e de regras; `ci-passed` no ruleset |
| Travas do agente | `.claude/settings.json` nega merge `--admin`, force push, push na `main` e leitura/escrita do `.env` (Bash e PowerShell); fronteira real é o ruleset da `main`            |
| Baseline         | 1º commit da `main` (`f0154df`): app gerado por `create-payload-app@3.93.0 -t website -d postgres`, intacto                                                               |
| Testes           | Só os gerados pelo template; a suíte começa na Missão 3                                                                                                                  |

## Plano de missões

| #   | Issue | Missão                       | Prioridade | Escopo                                                                                  |
| --- | ----- | ---------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| 0   | #1    | Fundação                     | P0         | App gerado, regras, `pnpm check`, CI mínimo, configuração do GitHub                     |
| 1   | #2    | Ambiente local reproduzível  | P0         | `compose.yaml` com `postgres:18`, env validado, migrations, seed, README de execução    |
| 2   | #3    | CI no GitHub Actions         | P0         | Job `e2e` com Postgres como serviço, `audit`, `secret-scan`, `workflow-audit`, relatório |
| 3   | #4    | E2E da homepage              | P0         | Estrutura, links, 404, menu mobile, `mobile` e `reduced-motion`                         |
| 4   | #5    | Acessibilidade e teclado     | P1         | axe, ordem de foco, padrões ARIA                                                        |
| 5   | #6    | CMS de ponta a ponta e API   | P1         | Jornada admin → frontend, contrato da REST API, `expectJson`, `fillSecret`              |
| 6   | #7    | Paridade no GitLab CI        | P1         | `.gitlab-ci.yml` rodando de verdade num espelho                                         |
| 7   | #8    | Experimento com agentes      | P2         | Playwright Test Agents, com o resultado documentado                                     |
| 8   | #9    | Documentação e vitrine       | P1         | README EN + pt-BR, números e pipeline                                                   |

## Missão 0 (#1)

### Decisões

- **Baseline intacto:** o app foi gerado em pasta temporária e o commit só foi criado com o hash da árvore igual ao da árvore gerada pela CLI (`198d8ea`).
- **Formatador: Prettier.** O template gerado traz Prettier (`.prettierrc.json`), não oxfmt como se supunha. A suíte segue o estilo dele (sem ponto e vírgula) e o `format:check` cobre só os nossos arquivos.
- **pnpm 11.28.9** em `packageManager`. O pnpm 11 não lê mais o campo `pnpm` do `package.json` e falha em build não revisado (`strictDepBuilds`), então a lista do template foi para `allowBuilds` em `pnpm-workspace.yaml`. O campo antigo saiu do `package.json`.
- **Configs próprias em `config/`:** `eslint.suite.config.mjs` e `tsconfig.suite.json`. Os do template não podem mudar, e estes são apontados pela linha de comando, então não precisam ficar na raiz. O `tsconfig.suite.json` soma as flags estritas dos outros projetos e cobre só `scripts/` e os nossos testes.
- **Sentinelas com `tsx`, não `node`:** o Node exige extensão `.ts` no import, que o `tsconfig.json` do template recusa (`allowImportingTsExtensions` desligado). O `tsx` já vem no template.
- **Adiado de propósito (YAGNI):** regras do ESLint para `fillSecret`/`expectJson` (Missão 5), checagem do `needs` do gate, `audit`, `secret-scan` e `workflow-audit` (Missão 2). A sentinela de ignores do Dependabot do starter kit não veio, porque o ignore de major do TypeScript também não.
- **Push e PR:** o agente commita, faz push em branch própria e abre o PR. Merge só pelo usuário. O push inicial da `main` foi manual, porque um PR precisa de uma branch de destino e o repositório estava vazio.

### Como o RED foi visto

Cada sonda reprovou pelo motivo esperado e foi desfeita:

| Portão                  | Sonda                                        | Erro observado                                                     |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| `tsc` (template)        | `const n: number = 'x'`                      | `TS2322`                                                           |
| `tsc` (suíte)           | `a[0]` em `string`, aceito pelo do template  | `TS2322: 'string \| undefined'`                                    |
| ESLint                  | `waitForTimeout` e promise sem `await`       | `playwright/no-wait-for-timeout`, `no-floating-promises`           |
| ESLint (exclusão)       | Violação dentro de `tests/int/`              | Passa: gerados ficam fora                                          |
| Prettier                | `export const x = 1;`                        | Arquivo apontado pelo `--check`                                    |
| Sentinela known issues  | Cabeçalho `KI-1` só no documento             | `disagree`, `Only in docs/KNOWN_ISSUES.md`                         |
| Sentinela de regras     | Corpo, caminhos, regra de um lado, 237 linhas | `body differs`, `paths differ`, `Rule sets differ`, `Always-loaded` |
| `ci-passed` e ruleset   | A registrar no PR da fundação                | Pendente                                                           |

### Achados

- A CLI cria um `.git` próprio com um commit: não pode ser copiado junto.
- A extensão Python do VS Code acrescenta `python.terminal.useEnvFile` ao `.vscode/settings.json` ao ver um `.env`. Foi o que a comparação de hash pegou; se o arquivo aparecer modificado, não commitar.
- O `.env.example` do template aponta para MongoDB (Missão 1).
- `legacy-peer-deps` do `.npmrc` não é lido pelo pnpm 11; `enable-pre-post-scripts` também não, e o padrão atual já roda o `postbuild` (confirmar na Missão 2).
- Next.js gerado é 16.3.3 e Playwright 1.63.0.
- `chat.includeApplyingInstructions` não foi ligado, porque `.vscode/settings.json` é do baseline.

### Fontes consultadas

- [pnpm: settings](https://pnpm.io/settings) e [build settings](https://pnpm.io/settings/build) (08/11/2026).
- Clones locais de `playwright-qa-starter-kit` e `uat-automation-framework`, de onde as regras foram adaptadas.
