<!-- LTeX: language=pt-BR -->

# Resumo das sessões

Estado do projeto entre chats. Lido no início de cada missão (ver `.github/copilot-instructions.md`).

## Estado atual

| Item             | Estado                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Missão atual     | Missão 1 — Ambiente local reproduzível (#2), concluída com o merge do PR da missão                                                                                       |
| Próxima missão   | Missão 2 — CI no GitHub Actions (#3)                                                                                                                                     |
| PRs abertos      | nenhum após o merge (Dependabot pode abrir outros: tratar no início do chat)                                                                                             |
| Ambiente local   | `compose.yaml` com `postgres:18`, env validado com zod, migration inicial e seed via Local API; passos no README                                                         |
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
| Exclusões por nome      | Arquivos novos em `tests/e2e`, `helpers`, `int` | ESLint, `tsc` da suíte e Prettier reprovam: só os gerados ficam fora |
| Prettier                | `export const x = 1;`                        | Arquivo apontado pelo `--check`                                    |
| Sentinela known issues  | Cabeçalho `KI-1` só no documento             | `disagree`, `Only in docs/KNOWN_ISSUES.md`                         |
| Sentinela de regras     | Corpo, caminhos, regra de um lado, 237 linhas | `body differs`, `paths differ`, `Rule sets differ`, `Always-loaded` |
| `ci-passed` e ruleset   | Commit-sonda com erro de tipo no PR da fundação | `TS2322` no CI, `check` e `ci-passed` em `failure`, PR `BLOCKED`   |

### Achados

- A CLI cria um `.git` próprio com um commit: não pode ser copiado junto.
- A extensão Python do VS Code acrescenta `python.terminal.useEnvFile` ao `.vscode/settings.json` ao ver um `.env`. Foi o que a comparação de hash pegou; se o arquivo aparecer modificado, não commitar.
- O `.env.example` do template aponta para MongoDB (Missão 1).
- `legacy-peer-deps` do `.npmrc` não é lido pelo pnpm 11; `enable-pre-post-scripts` também não, e o padrão atual já roda o `postbuild` (confirmar na Missão 2).
- Next.js gerado é 16.3.3 e Playwright 1.63.0.
- `chat.includeApplyingInstructions` não foi ligado, porque `.vscode/settings.json` é do baseline.

- **Vulnerabilidades do template:** com os alertas ligados, o Dependabot apontou 14 na `main` (4 críticas, 3 altas, 6 moderadas, 1 baixa), em `next` 16.3.3, `sharp` 0.35.4 e `vitest` 4.0.18, todas dependências diretas geradas pelo template. As versões corrigidas chegam até `next` 16.4.1, `sharp` 0.35.5 e `vitest` 4.1.11. Não foram atualizadas aqui: mudam o app sob teste e estão fora do escopo da fundação. O job `audit` da Missão 2 precisa decidir isso, porque reprovaria com elas.
- Pendência: o `LICENSE` não traz o aviso MIT da Payload, cujo template gerou o app. Virou issue P2 na Missão 1.

### Revisão independente

- **Aplicado:** exclusões de `tests/` trocadas de curinga por nome de arquivo, em `format`, `format:check`, ESLint e `tsconfig.suite.json`. Com curinga, specs e helpers novos ficariam sem portão, em silêncio.
- **Descartado por ora:** `anchor()` em `tests/known-issues.ts` remove `_`, e o GitHub pode mantê-lo nas âncoras. Não foi possível confirmar (a API de Markdown não retorna âncoras) e o mapa está vazio. Reavaliar ao criar um KI com `_` no título.

### Fontes consultadas

- [pnpm: settings](https://pnpm.io/settings) e [build settings](https://pnpm.io/settings/build) (08/11/2026).
- Clones locais de `playwright-qa-starter-kit` e `uat-automation-framework`, de onde as regras foram adaptadas.

## Missão 1 (#2)

### Decisões

- **Seed via Local API, antes do build (`payload run scripts/seed.ts`).** As duas opções da issue foram medidas. A rota `/next/seed` funciona (`first-register`, depois `POST` com `Authorization: JWT`), mas exige o app no ar, portanto build com banco vazio: `/posts` é `force-static` com `revalidate = 600`, o hook do post só invalida a página do próprio post, e a listagem ficou sem posts depois do seed. Pela Local API a ordem é `migrate → seed → build → start`, a mesma do plano da Missão 2.
- **`disableRevalidate` ligado pelo script.** O seed do template não passa essa chave em todas as escritas, e `revalidatePath` lança erro fora de uma requisição do Next. O script acrescenta um hook `beforeChange` numa cópia em memória da config, sem alterar o app.
- **`NODE_ENV=production` no `db:seed`.** O adaptador Postgres faz `push` ao conectar sempre que `NODE_ENV !== 'production'` (exceto em `payload migrate`), e a doc pede para não misturar `push` com migrations. Pelo mesmo motivo o README desaconselha `pnpm dev` nesse banco; `push: false` exigiria mudar o `payload.config.ts`, que é congelado.
- **`src/migrations/` é a exceção prevista ao app congelado** (infraestrutura de execução). O diff do restante de `src/` contra o baseline é vazio.
- **Env em `scripts/env.ts`, não `src/config/env.ts` como dizia o plano:** `src/` é código do app. A checagem roda em `payload run`, que carrega os `.env` como o Next faz, e a mensagem cita variáveis, nunca valores.
- **`.env.example` com valores locais que funcionam após o `cp`:** é o que torna o ambiente reproduzível. Segredos exigem 32 caracteres, o que também reprova os placeholders antigos do template.
- **`compose.yaml` convive com o `docker-compose.yml` do template** (MongoDB, congelado). O Compose prefere o canônico; os scripts passam `-f compose.yaml` para evitar o aviso de arquivos múltiplos.
- **Volume em `/var/lib/postgresql`:** a partir do Postgres 18 o `PGDATA` é versionado. O healthcheck usa `pg_isready -h 127.0.0.1` porque o servidor temporário da inicialização escuta só no socket Unix, e `up --wait` espera por essa condição.
- **`scripts/seed.ts` tem tsconfig próprio (`config/tsconfig.seed.json`):** ele importa `src/`, e o TypeScript seguiria o import aplicando as flags estritas ao template. Continua coberto pelo `tsc` do template e pelo ESLint com tipos.
- **PR #11 do Dependabot (`next` 16.4.1) fechado sem `ignore`:** nasceu antes do CI (nenhum check rodou) e não atualizou o lockfile, então reprovaria no `--frozen-lockfile`. Atualizar o `next` fica para o job `audit` da Missão 2.

### Como o RED foi visto

| Alvo                | Sonda                                 | Erro observado                                                       |
| ------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| Env                 | URL `mongodb://` no `db:migrate`      | `DATABASE_URL: must be a postgres:// or postgresql:// URL`, exit 1   |
| Env                 | Segredo curto no `db:seed`            | `PAYLOAD_SECRET: must have at least 32 characters`, exit 1           |
| Env                 | URL com barra final e URL inválida    | `must not end with a slash`, `must be an absolute URL`               |
| Banco fora do ar    | `compose stop` e `db:migrate`         | `cannot connect to Postgres ... ECONNREFUSED`, exit 1                |
| Seed sem o hook     | `payload run scripts/seed.ts`         | `Invariant: static generation store missing in revalidatePath`       |
| Ordem do seed       | Build vazio, seed pela rota, `/posts` | HTTP 200 sem nenhum post                                             |
| ESLint no seed      | `await` removido                      | `no-floating-promises`                                               |
| `tsc` no seed       | Atribuição inválida                   | `TS2322`                                                             |
| Clone limpo         | `beforeOperation` em globais          | `TypeError: entity.hooks.beforeOperation is not iterable`            |

### Validação final

Clone novo e banco vazio, seguindo o README: 70 s de `install` a `build`. Com `pnpm start`, `/`, `/posts`, `/posts/digital-horizons`, `/contact` e `/admin/login` respondem 200, `/posts` lista os posts, o login do autor demo responde 200 e o log do servidor não tem erros. Repetir `db:migrate` e `db:seed` mantém uma migration e 3 posts.

### Achados

- **Tipo que não reflete o runtime:** `SanitizedGlobalConfig` usa `DeepRequired`, mas o `sanitize` não inicializa `hooks.beforeOperation` em globais. O lint aceitou e o `pnpm check` ficou verde; só o clone limpo pegou. Validar executando, não só compilando.
- **`/posts` fica defasado ao publicar:** nenhum hook invalida a listagem, então um post novo pode levar até 10 minutos para aparecer. Candidato a KI com `test.fail` na Missão 5 (#6), a jornada admin → frontend.
- **O seed baixa as imagens do GitHub** (`raw.githubusercontent.com`, branch `3.x`). É dependência de rede e de um arquivo externo que pode mudar: a Missão 2 (#3) precisa considerar esse risco no job `e2e`.
- **Login demo:** como o seed cria um usuário, o `/admin` não oferece criar o primeiro. Entra-se com `demo-author@example.com` / `password` (só local).
- **Alertas do Dependabot:** 41 abertos em 08/11/2026 (22 no `next`), contra os 14 anotados na Missão 0. Entrada do job `audit` da Missão 2.
- **O `.env` local existente** pode estar desatualizado frente ao novo `.env.example`; `pnpm env:check` aponta o que ajustar.
- No PowerShell 5.1, aspas duplas internas de um `--jq` chegam quebradas ao `gh`: usar o Bash para esses comandos.

### Fontes consultadas

Em 08/11/2026: [Payload: migrations](https://payloadcms.com/docs/database/migrations), [Postgres](https://payloadcms.com/docs/database/postgres) e [Local API fora do Next.js](https://payloadcms.com/docs/local-api/outside-nextjs); [imagem `postgres`](https://hub.docker.com/_/postgres); [Compose application model](https://docs.docker.com/compose/intro/compose-application-model/); [pnpm install](https://pnpm.io/cli/install); [comandos do Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-pull-request-comment-commands). Comportamento do `push` conferido em `@payloadcms/db-postgres/dist/connect.js`.
