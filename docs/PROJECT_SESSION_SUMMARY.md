<!-- LTeX: language=pt-BR -->

# Resumo das sessões

Estado do projeto entre chats. Lido no início de cada missão (ver `.github/copilot-instructions.md`).

## Estado atual

| Item             | Estado                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Missão atual     | Missão 8 — Documentação e vitrine (#9), concluída com o merge do PR da missão |
| Próxima missão   | Missão 7 — Experimento com agentes (#8), a P2 de menor número; a #21 destrava o PR #24 do Dependabot |
| PRs abertos      | Dependabot #13 a #16, #23 e #24, à espera de avaliação um por vez; o #24 sobe o Playwright para 1.64.1 e reprova no `e2e` até a imagem ser atualizada (#21)              |
| Ambiente local   | `compose.yaml` com `postgres:18`, env validado com zod, migration inicial e seed via Local API; passos no README                                                         |
| Portões          | Jobs `check`, `audit`, `secret-scan`, `workflow-audit` e `e2e`, todos no `needs` do `ci-passed`, único check do ruleset; `publish-report` só em push na `main`           |
| Travas do agente | `.claude/settings.json` nega merge `--admin`, force push, push na `main` e leitura/escrita do `.env` (Bash e PowerShell); fronteira real é o ruleset da `main`            |
| Baseline         | 1º commit da `main` (`f0154df`): app gerado por `create-payload-app@3.93.0 -t website -d postgres`, intacto                                                               |
| Testes           | 61 no build de produção: 4 do template e 57 próprios (19 de API e 2 da jornada do CMS novos), em `api`, `admin`, `chromium`, `mobile` e `reduced-motion`, mais o `setup` de login; 7 são `test.fail` (KI-1 a KI-7) |

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
- **Tipos gerados divergem do banco:** o `src/payload-types.ts` do baseline declara IDs como `string`, mas com Postgres eles são `number`. Fora de `production` a Payload regenera esse arquivo ao conectar, então ele aparece modificado depois de `pnpm dev` ou `pnpm test*`: não commitar (app congelado). Os testes de API da Missão 5 (#6) devem validar o ID como número.
- **Entrada da Missão 3 (#4):** o `playwright.config.ts` do template usa `webServer: pnpm dev` com `reuseExistingServer`. A suíte precisa de config própria com `pnpm start`, porque `dev` marca o banco migrado como `dev` (ver a revisão abaixo).

### Revisão independente

- **Aplicado (reproduzido antes de corrigir):** uma conexão fora de `production` grava `dev|-1` em `payload_migrations`, e o `db:migrate` seguinte para no prompt de perda de dados. Sem terminal ele ficou parado até o `timeout` (exit 124), diferente do exit 0 que o revisor deduziu; responder "não" sai sem migrar, segundo o código (não executado). O aviso do README agora cobre `pnpm dev` e `pnpm test*` e diz como recuperar.
- **Aplicado:** o seed apaga os registros de mídia, não os arquivos, e a Payload renomeia o upload com nome ocupado. Após dois seeds, o banco tinha `image-post1-1.webp` em vez de `image-post1.webp`: uma asserção de `src` passaria num ambiente e falharia em outro. O `scripts/seed.ts` agora limpa `public/media`, que está no `.gitignore`.
- **Descartado:** nenhum. O revisor não teve `git` nem `gh`, então não viu os corpos dos commits, onde o RED também está registrado.

### Fontes consultadas

Em 08/11/2026: [Payload: migrations](https://payloadcms.com/docs/database/migrations), [Postgres](https://payloadcms.com/docs/database/postgres) e [Local API fora do Next.js](https://payloadcms.com/docs/local-api/outside-nextjs); [imagem `postgres`](https://hub.docker.com/_/postgres); [Compose application model](https://docs.docker.com/compose/intro/compose-application-model/); [pnpm install](https://pnpm.io/cli/install); [comandos do Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-pull-request-comment-commands). Comportamento do `push` conferido em `@payloadcms/db-postgres/dist/connect.js`.

## Missão 2 (#3)

### Decisões

- **`audit` bloqueante, em `--prod --audit-level=high`.** Dos 10 alertas que reprovavam: `next` foi a 16.4.3 e `sharp` a 0.35.5 (o peer da Payload aceita), `dompurify` a 3.4.17 por `overrides` (o `monaco-editor` fixa a versão exata). O corte em produção e `high` é julgamento nosso: a OWASP não trata de reprovar build. Os alertas de desenvolvimento, como os do `vitest`, seguem no Dependabot.
- **Exceção por GHSA só para o `happy-dom`** (`audit.ignore`, #20). A correção exige a versão 21, e o `@lexical/headless` pede `^20.9.0`. O código não é alcançável: só o export `./dom` carrega o `happy-dom`, e nem `src/` nem os pacotes da Payload o importam. Risco aceito pelo usuário.
- **Job `e2e` em container com serviço Postgres.** Usa `--user 1001` (exemplo oficial do Playwright), `--init` e `--ipc=host`. As imagens ficam fixadas por digest, e o hostname do banco é o rótulo do serviço.
- **Segredos gerados por execução.** O relatório grava requisições e fica público na `main`, então um token que apareça lá precisa morrer com o job. O `secret-scan` não olha o relatório.
- **`NODE_ENV=production` no passo de teste.** O spec de admin conecta à Payload pelo processo do teste, e fora de produção o adaptador faria `push` no banco migrado.
- **Servidor iniciado antes do Playwright.** A config do template sobe `pnpm dev` se não achar servidor, por isso o passo de espera reprova antes: um `start` morto não pode ser trocado em silêncio pelo `dev`. A config própria continua sendo a entrada da Missão 3.
- **GitHub Pages:** ativado com origem GitHub Actions, com autorização do usuário. `pages: write` e `id-token: write` ficam só em `publish-report`, que está fora do `ci-passed` porque não roda em PR.
- **zizmor com `advanced-security: false`:** em SARIF ele nunca reprova por exit code. A versão 1.32.0 está fixada para que uma auditoria nova não reprove PRs sem relação.
- **Exceção à regra de não tocar nos specs do template:** a asserção de `can navigate to list view` passou de string para predicado sobre `url.pathname`. Está registrada aqui e no commit. A string compara também a query, e a Payload acrescenta `?depth=1&limit=10` com `router.replace`. O app está correto, então `test.fail` com KI seria falso, e excluir o teste por `grep` seria um skip disfarçado. `URLPattern` ficou de fora porque o tipo não existe no TypeScript 5.7.3.
- **PRs do Dependabot #12 a #16 ficaram abertos:** o verde deles só provava tipos e lint. É uma exceção justificada à regra de um PR aberto por vez, que continua valendo: eles chegaram sozinhos e só podem ser avaliados com o `e2e` no gate. A partir de agora, tratar um por vez.
- **Regra nova:** em dúvida, consultar as melhores práticas mais modernas antes de sugerir. Pedido do usuário, também no `CLAUDE.md` global e nos outros projetos.

### Como o RED foi visto

| Alvo               | Sonda                                             | Erro observado                                                 |
| ------------------ | ------------------------------------------------- | -------------------------------------------------------------- |
| `audit`            | Estado da `main`                                  | Exit 1 com 10 alertas `high` ou `critical`                     |
| `workflow-audit`   | `pull_request_target`, action sem pin e injeção   | Exit 14: `dangerous-triggers`, `template-injection`, `unpinned-uses` |
| `secret-scan`      | Token do GitHub plantado fora do repositório      | Exit 1, `leaks found: 1`                                       |
| Spec do template   | Spec intacto no build de produção                 | `Received: .../users?depth=1&limit=10`                         |
| Spec corrigido     | Caminho mutado para `/usersX`                     | `Expected: predicate to succeed`                               |

No CI, com commits-sonda revertidos no próprio PR:

| Sonda                         | Resultado                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `throw` na migration          | `e2e` reprova em `Run migrations` com `PROBE: broken migration`; `ci-passed` em `failure`                     |
| `throw` no `scripts/seed.ts`  | `e2e` reprova em `Seed the database` com `PROBE: broken seed`; `ci-passed` em `failure`                       |
| Empacotar relatório em PR     | `Package report` passa no container (`hashFiles` e artifact de 218 KB); `publish-report` rejeitado com `Branch "refs/pull/N/merge" is not allowed to deploy to github-pages` |

Antes do RED do seed houve uma rodada inválida: `git revert -q` não existe, e um `tail` escondeu o erro, então o job ainda reprovava pela sonda da migration. Conferir o **passo** que reprovou é o que separa o motivo certo de um vermelho qualquer.

Comparação da falha do spec: reprovou com `next` 16.3.3 e 16.4.3 em `pnpm start`, e passou em `pnpm dev`. A causa não é a atualização. Depois da correção, `--repeat-each=5 --retries=0` deu 20 de 20 no build de produção.

### Achados

- **A imagem do Playwright não acompanha o pacote sozinha:** o Dependabot sobe `@playwright/test`, mas não o digest no workflow. O #12 leva a 1.64.1 e vai reprovar no `e2e` até a imagem ser atualizada (#21).
- **`pnpm dev` esconde a falha do spec de lista**, provavelmente porque a asserção é satisfeita antes do `router.replace` (inferência, tempo não medido). Testar só em `dev` teria deixado passar.
- **O seed depende de `raw.githubusercontent.com`:** se o download falhar, o job reprova nesse passo, de forma visível. Sem retry por ora (YAGNI); reavaliar se houver intermitência real.
- **Docker Desktop no Windows:** o bind mount de um arquivo recém-criado apareceu como diretório no container. Montar a pasta resolve.
- A imagem do Playwright não traz `xz`.

### Fontes consultadas

Em 08/11/2026: [Playwright: CI](https://playwright.dev/docs/ci), [Docker](https://playwright.dev/docs/docker), [PageAssertions](https://playwright.dev/docs/api/class-pageassertions), [boas práticas](https://playwright.dev/docs/best-practices), [anotações](https://playwright.dev/docs/test-annotations) e [trace viewer](https://playwright.dev/docs/trace-viewer); [pnpm audit](https://pnpm.io/cli/audit); [OWASP: dependências vulneráveis](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerable_Dependency_Management_Cheat_Sheet.html); [GitHub Pages com workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [segurança no Actions](https://docs.github.com/en/actions/reference/security/secure-use); [gitleaks-action](https://github.com/gitleaks/gitleaks-action); [zizmor](https://docs.zizmor.sh/usage/); [URLPattern na MDN](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern).

### Revisão independente

- **Aplicado:** o README prometia gitleaks no histórico completo, mas a action varre só o intervalo de commits do PR ou do push (confirmado em `src/gitleaks.js` da v3.0.0). Texto e comentário do workflow corrigidos. O histórico completo foi varrido localmente uma vez (15 commits, sem vazamentos); varredura periódica exigiria um gatilho `schedule`.
- **Aplicado:** o relatório publicado é o da última execução da `main` que chegou aos testes, não o da última execução.
- **Aplicado:** o empacotamento para o Pages não rodaria em nenhum PR. Provado com uma sonda, e o deploy real fica para conferir no primeiro run da `main`.
- **Descartado por decisão do usuário:** mudar o texto "Um PR aberto por vez". A regra continua, e as exceções entram pela regra geral de desvio com justificativa registrada.

## Missão 3 (#4)

### Decisões

- **Escopo adaptado ao template, como a issue pede:** não há menu mobile, dialog, estado de scroll nem elemento `fixed`/`sticky` no frontend (`grep` em `src/`; o `HeaderNav` é uma `<nav>` simples). Esses itens saíram, e nenhum componente foi inventado. No lugar de "elementos fixos visíveis", o projeto `mobile` confere que a navegação do header cabe na tela.
- **Config própria em `config/playwright.config.ts`, com `webServer: pnpm start`.** O `playwright.config.ts` do template fica como gerado, sem uso. `reuseExistingServer: !process.env.CI` é o padrão da doc. Os passos `Start the app` e `Wait for the app` saíram do CI: quem sobe o servidor agora é o Playwright, e sem fallback para `dev` aquele risco deixou de existir. O log do servidor vai para a saída do passo de teste (`stdout: 'pipe'`).
- **`NODE_ENV=production` foi para o script `test:e2e`:** antes só o CI definia. Agora `pnpm test:e2e` local também não faz `push` no banco migrado.
- **Projetos por arquivo (`testMatch`):** `*.mobile.spec.ts` e `*.reduced-motion.spec.ts` têm projeto próprio; o `chromium` ignora esses arquivos. Repetir tudo em cada projeto gastaria tempo sem cobrir regra nova.
- **Ordem com `toContainText([...])`:** com array, a asserção exige os itens em ordem, num subconjunto dos elementos. Assim a estrutura fica presa e os cards de post (que a Missão 5 pode mudar) não quebram o teste.
- **Links por `getByRole('link')`** com `evaluateAll` para ler os `href`, deduplicados e checados em paralelo via `request`. Uma lista mínima obrigatória (`arrayContaining`) impede que uma coleta vazia passe sem checar nada.
- **URLs de 404 com `randomUUID`:** o primeiro render é o que pode dar errado, e uma URL repetida poderia vir do cache de uma execução anterior.
- **Sem `toBeInViewport` no `mobile`:** ver o achado abaixo.

### Como o RED foi visto

Primeiro passo: `config/playwright.config.ts does not exist`. Depois, a primeira execução real reprovou 4 testes: 2 por bug do teste (slug errado de `dollar-and-sense`) e 2 por bug do app, confirmados sem marcação antes de virar `test.fail`.

| Alvo                        | Mutação                                  | Erro observado                                     |
| --------------------------- | ---------------------------------------- | -------------------------------------------------- |
| Ordem das seções            | `Core features` trocado por `Recent posts` | Diff do `toContainText`                            |
| Cards                       | Caminho de um post                       | `Expected: "/posts/probe"`                         |
| Links, status               | Caminho quebrado incluído                | `"path": "/broken-probe", "status": 404`           |
| Links, cobertura            | Link obrigatório inexistente             | `ArrayContaining` reprova                          |
| Status do 404               | `toBe(404)` para `toBe(200)`             | `Expected: 200, Received: 404`                     |
| Layout do 404               | `contentinfo` trocado por `dialog`       | `element(s) not found`                             |
| Voltar para a home          | Texto esperado                           | `Expected: "Probe"`                                |
| `test.fail` percebe correção | Expectativa do KI-1 igual ao bug         | `Expected to fail, but passed`                     |
| Viewport                    | Largura 500 na config                    | `"width": 500`                                     |
| Scroll horizontal           | Elemento de 2000 px injetado             | `Expected: 0, Received: 1625`                      |
| Navegação na tela           | `nav` deslocada 400 px                   | `Expected: <= 0, Received: 287.65625`              |
| Projeto `reduced-motion`    | `reducedMotion: 'no-preference'`         | `Expected: true, Received: false`                  |
| Sem animação                | Animação CSS de 300 ms injetada          | `p on H1` na lista recebida                        |
| Sem transição               | Transição de opacidade de 300 ms         | `opacity on H1` na lista recebida                  |

Validação: suíte inteira com `--repeat-each=3 --workers=1 --retries=0` deu 51 de 51.

### Achados

- **KI-1 e KI-2** em `docs/KNOWN_ISSUES.md`. O KI-2 vem de o app ter dois root layouts e nenhum `not-found` na raiz: URL sem rota não passa pelo `(frontend)/not-found.tsx`.
- **`toBeInViewport` não pega transbordo com `isMobile`.** A primeira versão do teste passou com a `nav` fora da tela: o `innerWidth` foi de 375 a 759 e o `IntersectionObserver` seguiu com ratio 1. Só a mutação revelou. O `clientWidth` fica na largura do aparelho e é a referência certa.
- **`admin.e2e.spec.ts` não aguenta cópias paralelas:** usa e-mail fixo com `delete` e `create`, e reprova com `ValidationError: email` em `--repeat-each` sem `--workers=1`. Não afeta o CI (`workers: 1`) nem uma execução normal. Spec congelado: repetir a suíte sempre com `--workers=1`.
- **`--reporter` na linha de comando substitui os reporters da config:** o `playwright-report/` só é gerado sem essa flag.
- **O cache de navegadores é compartilhado entre projetos**, e cada versão do Playwright pede o seu binário. O erro `Executable doesn't exist` se resolve com `pnpm exec playwright install chromium`, agora no README.
- **`.env` local desatualizado:** segredos curtos reprovam na validação, inclusive em `pnpm test:e2e`, que agora valida o ambiente ao carregar a config. Na sessão, os valores vieram de variáveis de processo com segredos descartáveis, como no CI; o `.env` é travado para o agente e não foi lido nem alterado.
- **Nova missão pedida pelo usuário:** skills para as fontes de melhores práticas mais consultadas (#25).

### Revisão independente

- **Aplicado:** o teste de `reduced-motion` usava `expect.poll` sobre `document.getAnimations()`, que espera a animação acabar, e a mutação era de 60 s: um fade-in curto passaria. Agora um `addInitScript` registra `animationstart` e `transitionrun` desde o início da página, e o RED foi refeito com 300 ms. Sem filtro, o teste reprovou no app intacto com `transitionrun` de `color` e duração 0 em `Posts`, `Contact` e no seletor de tema, no carregamento. Não é bug: a [WCAG 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) exclui mudança de cor de animação de movimento e o [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) aponta escala e deslocamento como gatilhos. Por isso só cor fica fora; manter opacidade reprovando é julgamento nosso, porque a issue pede conteúdo visível sem animação. Limite conhecido: animação feita só por `element.animate()` não dispara esses eventos; o frontend não usa.
- **Conferir no primeiro run do CI:** o `pnpm start` subir da raiz com `cwd: '..'`. Localmente já subiu assim.
- **Descartado:** nenhum.

### Fontes consultadas

Em 08/11/2026: [Playwright: webServer](https://playwright.dev/docs/test-webserver), [emulação](https://playwright.dev/docs/emulation), [projetos](https://playwright.dev/docs/test-projects), [LocatorAssertions](https://playwright.dev/docs/api/class-locatorassertions) e [APIRequestContext](https://playwright.dev/docs/api/class-apirequestcontext); [Next.js: not-found](https://nextjs.org/docs/app/api-reference/file-conventions/not-found). A página de `test.fail` respondeu 503; a assinatura `test.fail(título, detalhes, corpo)` foi confirmada pelo `tsc` e pela execução.

## Missão 4 (#5)

### Decisões

- **Escopo adaptado ao template, como na Missão 3:** o frontend não tem tabs nem dialog. O único widget composto é o seletor de tema (Radix Select), testado contra o padrão _select-only combobox_ da WAI-ARIA. O `/admin` é produto da Payload, não do template, e ficou fora das varreduras; a jornada do admin é da Missão 5.
- **Fixture `scan` (`tests/helpers/axe.ts`), no formato da doc do Playwright:** devolve regra + alvo, curto e estável, e anexa o resultado completo ao relatório.
- **Tags até `wcag22aa`:** a doc para na 2.1, e a 2.2 é a versão vigente (julgamento nosso). Em axe 4.14.0 essa tag só acrescenta `target-size`.
- **Como isolar uma violação conhecida sem cegar a varredura:** `exclude` só nos `<span>` de número de linha (KI-3), porque `disableRules('color-contrast')` deixaria a página inteira sem contraste. Um `toBeVisible` no mesmo seletor impede que a exclusão aponte para algo que não existe mais. No KI-4 foi `disableRules(['aria-hidden-focus'])`, só no estado com o popup aberto: o alvo são `header`, `main` e `footer`, e `exclude` neles tiraria tudo da varredura.
- **Scan nos dois temas** (`colorScheme`), porque contraste muda com o tema. Antes de cada varredura, o teste confere `data-theme`: a preferência emulada, sozinha, não prova qual tema foi varrido.
- **Sem `mobile` na varredura (YAGNI):** o layout muda pouco e o projeto `mobile` já cobre transbordo. Reavaliar se surgir componente próprio de mobile.
- **`expect-expect` com `assertFunctionPatterns`** para contar o helper `expectFocusWalk`, opção da própria regra. A sonda confirma que teste sem asserção continua reprovando.

### Como o RED foi visto

Primeiro passo: `Cannot find module '.../helpers/axe'`. A primeira varredura real reprovou em `post` (linhas de código) e, uma vez em quatro, em `contact`.

KIs confirmados sem marcação antes de virar `test.fail`:

| KI   | Erro observado                                                         |
| ---- | ---------------------------------------------------------------------- |
| KI-3 | `color-contrast` 2,02 em `.token-line ... .select-none`                |
| KI-4 | `aria-hidden-focus` em `header`, `.pt-24` e `footer`                   |
| KI-5 | `toHaveCSS`: `Expected "1", Received "0"`                              |

Mutações, todas desfeitas:

| Alvo                       | Mutação                                    | Erro observado                           |
| -------------------------- | ------------------------------------------ | ---------------------------------------- |
| Varredura de página        | `<img>` sem `alt` injetado                 | `image-alt: body > img`                  |
| Exclusão do KI-3           | Mesma injeção no `post`                    | `image-alt: body > img`                  |
| Guarda da exclusão         | Seletor inexistente                        | `element(s) not found`                   |
| Varredura com popup aberto | Mesma injeção                              | `image-alt: body > img`                  |
| Tema escuro aplicado       | `colorScheme` fixo em `light`              | `Expected: "dark", Received: "light"`    |
| `test.fail` percebe correção | KI-3 varrendo `h1`                       | `Expected to fail, but passed`           |
| Ordem do Tab               | `Full Name` trocado por `Email`            | `toBeFocused`, `Received: inactive`      |
| Volta com Shift+Tab        | Lista sem `reverse()`                      | `toBeFocused`, `Received: inactive`      |
| Enter no link              | URL `/contact`                             | `Received: .../posts`                    |
| `aria-expanded`            | Valores invertidos, fechado e aberto       | `Expected: "true"`, `Expected: "false"`  |
| `aria-controls`            | `id` `probe`                               | `Received: "radix-_R_6iivb_"`            |
| Opções e `aria-selected`   | Ordem das opções; `false`                  | Diff do `toHaveText`; `Received: "true"` |
| Tema escolhido             | `data-theme` `light`                       | `Received: "dark"`                       |
| Foco volta ao fechar       | `not.toBeFocused`                          | `Received: focused`                      |
| Tab preso no popup         | `not.toBeFocused`                          | `Received: focused`                      |
| Escape mantém o valor      | `Enter` no lugar de `Escape`               | `Expected: "Auto", Received: "Light"`    |
| Lint                       | Spec sem asserção                          | `playwright/expect-expect`               |

Validação: suíte inteira com `--repeat-each=3 --workers=1 --retries=0` deu 120 de 120.

### Achados

- **Contraste do seletor de tema era falso positivo.** O scan de `contact` reprovou com 4,42 por ler a `transition-[color]` do trigger no começo: a sonda mostrou a cor subindo quadro a quadro até o branco (21:1). Primeiro tratei como KI de placeholder; o teste sem marcação **passou**, e por isso o KI foi retirado. Confirmar a falha antes de marcar é o que pegou o erro.
- **A espera medida:** sem esperar a hidratação, 1 falha em 100 varreduras; com `toHaveText('Auto')`, 100 de 100; com a espera das animações, 100 de 100. Nessa amostra a última não mostrou efeito: ela fica porque a sonda capturou as cores intermediárias, e a leitura é única.
- **KI-5, página em branco sem JavaScript:** o axe ignora o que está invisível (com o JS bloqueado, `violations`, `incomplete` e `passes` vieram vazios). Só uma sonda que mediu o estado revelou. Varredura verde não significa página visível.
- **No Next 16 o CSS também fica em `_next/static/chunks`:** bloquear essa pasta inteira tira os estilos.
- **Radix põe `aria-hidden` no próprio combobox enquanto aberto:** `getByRole` para de achá-lo, daí o `includeHidden: true`.
- **Radix move o foco num `setTimeout`:** dois `ArrowDown` seguidos saem da mesma opção. É preciso esperar o foco a cada tecla.
- **O axe trata texto de um caractere como inconclusivo** (`shortTextContent`, `axe.js`): as linhas 1 a 9 do KI-3 têm a mesma cor e não aparecem no relatório.
- **Não coberto:** visibilidade do indicador de foco (WCAG 2.4.7), fora do escopo da issue. O axe e os testes de foco não medem isso.
- **O Radix Select diverge do exemplo do APG em dois pontos:** move o foco DOM para a opção em vez de usar `aria-activedescendant`, e o Tab mantém o popup aberto em vez de aceitar a opção e seguir. Os testes registram o comportamento real. Não virou KI: o APG é orientação, não critério de conformidade, e a WCAG não exige um dos dois modelos (julgamento nosso).
- **Armadilhas de ferramenta:** o log do `webServer` se mistura ao `--reporter=json` (usar `PLAYWRIGHT_JSON_OUTPUT_NAME`); `$'` em `String.replace` tem significado especial.

### Revisão independente

- **Aplicado:** os testes do tema escuro não provavam o tema varrido: a mutação tinha sido uma sonda pontual, sem guarda no código. Agora `openSettled` confere `data-theme`, e a mutação foi refeita.
- **Aplicado:** o KI-5 dizia que só o `InitTheme` define `data-theme`, mas o `ThemeProvider` também define. A dependência real é de JavaScript.
- **Aplicado:** o comentário dizia que a diferença do Radix era permitida pelo padrão. Conferido no exemplo oficial do APG: são duas divergências, agora descritas.
- **Descartado:** nenhum.

### Fontes consultadas

Em 08/11/2026: [Playwright: testes de acessibilidade](https://playwright.dev/docs/accessibility-testing); [WAI-ARIA APG: combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) e [exemplo select-only](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/); [WCAG 2.2: Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html). Regras e tags do axe conferidas em `axe-core` 4.14.0 (`axe.getRules`, `axe.js`). Critérios citados no `KNOWN_ISSUES.md`: [WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) e [`aria-hidden-focus` → 4.1.2](https://dequeuniversity.com/rules/axe/4.11/aria-hidden-focus).

## Missão 5 (#6)

### Decisões

- **O contrato vem da medição:** a doc da REST API da Payload não define os corpos de resposta (só a do login). Os schemas zod em `tests/helpers/cms-contract.ts` saíram de respostas reais. Objetos abertos, para campo novo não quebrar contrato (julgamento nosso); `populatedAuthors` é estrito, porque um campo a mais ali, como e-mail, seria vazamento.
- **`request` anônimo, admin explícito:** o projeto `api` não tem `storageState`, e quem precisa de sessão pede a fixture `adminRequest`. Assim, esquecer a sessão reprova o teste, e um teste de "anônimo não pode" nunca roda autenticado sem querer. O projeto `admin` segue o padrão da doc, com `storageState` no projeto.
- **Dados por teste:** `createPage` e `createPost` criam com sufixo único e apagam no teardown. O teardown aceita 200 e 404 (o próprio teste pode ter apagado) e reprova no resto.
- **A jornada edita o `hero.richText`, não o `title`:** o `title` não é renderizado no frontend. O visitante abre a página antes da edição para ela ficar em cache (`MISS → HIT`, e `MISS` depois de publicar), então o teste prova a invalidação. Arranjo pela API e ação pela UI, como recomenda a doc de API testing.
- **`visitorPage` sem sessão, com `storageState` vazio explícito:** o que o público vê, sem a barra de admin.
- **Posts de contrato ficam em rascunho:** publicar entraria nas listagens lidas pelos testes da homepage. CRUD completo fica em `pages`, que tem as mesmas operações. A exceção é o teste do KI-6, que apaga o post no teardown.
- **Credenciais em `parseTestEnv`, separado de `parseEnv`:** só a execução dos testes precisa delas, e os scripts de banco não devem reprovar por isso. A validação roda na config, antes de o servidor subir.
- **Lint adaptado do starter kit:** `no-restricted-syntax` barra segredo em `fill`/`type` e mensagem dinâmica em `expect`, porque ambos viram título de passo no relatório publicado; `expectJson` conta como asserção. `expectStatus` e `expectFound` do starter kit não vieram (YAGNI).

### Como o RED foi visto

Primeiro passo: `Cannot find module '.../tests/helpers/auth-state'`. KI-6 confirmado sem marcação antes de virar `test.fail`: `getByRole('link', { name: 'Post post-...' })`, `element(s) not found`; no controle, o mesmo localizador achou um post do seed e o `/posts` respondeu `x-nextjs-cache: HIT`.

Mutações, todas desfeitas:

| Alvo                                     | Mutação                                  | Erro observado                                     |
| ---------------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| Cada um dos 18 testes de API             | Expectativa de status, campo ou total    | Falha na própria expectativa, teste a teste        |
| Estado após escrita recusada e rascunhos | `totalDocs`, título e 404 no lugar de 200 | `Expected: 1, Received: 0`; `Expected HTTP 404, received 200` |
| Passos seguintes de `refuses anonymous writes` | 403 para 401 em `PATCH` e `DELETE` | `Expected HTTP 401, received 403`                  |
| ID no contrato                           | `string`, como em `payload-types.ts`     | `Invalid input: expected string, received number`  |
| Autor público                            | Schema só com `id`                       | `Unrecognized key: "name"`                         |
| Erro de validação                        | `literal('Probe')`                       | `Invalid input: expected "Probe"`                  |
| Visitante vê a edição                    | `after` deveria sumir                    | `toBeHidden`, `Received: visible`                  |
| Texto antigo some                        | `before` deveria continuar               | `element(s) not found`                             |
| `test.fail` percebe correção             | Listagem procurando post do seed         | `Expected to fail, but passed`                     |
| Senha errada                             | `E2E_ADMIN_PASSWORD=wrong`               | `setup` reprova, dependente em `did not run`       |
| Senha ausente                            | Variável removida                        | `E2E_ADMIN_PASSWORD: is required`, antes do servidor |
| Lint                                     | `fill(password)`, `expect(x, template)`, teste sem asserção | `use fillSecret`, `step title`, `Test has no assertions` |
| `.gitignore`                             | `git check-ignore`                       | `/playwright/.auth/` casa com `admin.json`         |

Validação: suíte inteira com `--repeat-each=3 --workers=1 --retries=0` deu 181 de 181 (60 × 3, mais 1 do `setup`: dependência não é repetida).

### Achados

- **KI-6:** post publicado não aparece em `/posts` por pelo menos 10 minutos.
- **`keyboard.insertText` não funciona no Lexical:** a seleção some e o texto volta, mesmo 1,5 s depois. Não era espera. Com teclas reais (`keyboard.type`) funciona. Uma sonda que registrou o estado a cada passo mostrou isso.
- **Anônimo recebe 403, não 401**, e rascunho anônimo responde 404: não revela que o documento existe.
- **`.env` local desatualizado:** quem já tem `.env` precisa acrescentar `E2E_ADMIN_EMAIL` e `E2E_ADMIN_PASSWORD`; o README avisa. O agente seguiu sem ler o arquivo: variáveis de processo a partir do `.env.example`.
- **Cada login acrescenta uma entrada em `sessions` no usuário demo.** É o único efeito sobre dados do seed, e nenhum teste lê esse campo.

### Fontes consultadas

Em 08/11/2026: [Playwright: autenticação](https://playwright.dev/docs/auth), [API testing](https://playwright.dev/docs/api-testing) e [fixtures](https://playwright.dev/docs/test-fixtures); [Payload: REST API](https://payloadcms.com/docs/rest-api/overview) e [operações de autenticação](https://payloadcms.com/docs/authentication/operations). `expectJson` e `fillSecret` adaptados de `playwright-qa-starter-kit`.

### Revisão independente

- **Aplicado:** a jornada publicava sem esperar o estado do formulário. O Lexical repassa o valor ao formulário de forma adiada, e o editor mostra o texto antes disso (leitura do código da Payload; a falha não foi reproduzida). Agora o teste espera o rascunho salvo pelo autosave conter o texto novo. Mutação: `Expected substring: "After the edit ... probe"`.
- **Aplicado:** o teste de autor público não olhava `authors`, onde um vazamento apareceria se `Users` deixasse de ser restrito. O contrato agora aceita só ids. Mutação: `expected object, received number`.
- **Aplicado:** o comentário do `fillSecret` omitia que o trace guarda o valor. A proteção vale só para títulos de passo, e a senha usada é a do seed público. Sonda com um reporter próprio: `Evaluate` com `fillSecret` e `Fill "password"` com `fill`. Uma primeira sonda com `--reporter=json` saiu vazia, porque esse reporter só traz `test.step`, e vazio não contou como prova.
- **Registrado, sem mudança:** o KI-6 pode dar `Expected to fail, but passed` se, com o cache de `/posts` vencido (mais de 600 s) e mais de um worker, outro teste regenerar a listagem enquanto o post existe. Não ocorre no CI (`workers: 1`, build recente, suíte curta).

Depois das correções: `pnpm check` verde, jornada com `--repeat-each=10` deu 11 de 11 (com o `setup`) e a suíte inteira com workers padrão deu 61 de 61.

### Falha no primeiro CI (KI-7)

- **Erro observado:** `rejects a page without its required fields` reprovou nas 3 tentativas: o `400` veio só com `{errors:[{message}]}`, sem `name` e `data`.
- **Causa raiz:** a forma do erro depende da primeira rota que inicializa a Payload no processo. Com `/admin/login` primeiro, a resposta perde os detalhes; com `/api/pages`, `/` ou `/posts` primeiro, vem completa (`/` e `/posts` são estáticas e não inicializam a Payload). O `formatErrors` só mantém os campos com `instanceof ValidationError`; cópias separadas da classe por empacotamento são inferência.
- **Por que passou localmente:** todas as execuções reusaram um servidor que subi à mão, cujo primeiro acesso foi `/api/pages`. No CI o `webServer` sobe o processo e o `setup` entra primeiro no admin. Build limpo no Windows e imagem do CI em Linux, ambos com a API primeiro, deram resposta completa: não era o sistema operacional.
- **Correção:** o contrato afirma o que vale nos dois estados (400 e a mensagem com os campos), e a perda de detalhes é o `test.fail` do KI-7. Com a API primeiro: `Expected to fail, but passed`. Mutação da mensagem: `Expected: "...Probe, Content > Layout, Slug"`.
- **Prevenção:** validar com `CI=1` e sem servidor no ar, que é como o CI roda. Um servidor reusado carrega o estado de quem o usou antes.

Validação em modo CI: 62 de 62, e com `--repeat-each=3 --retries=0`, 184 de 184 (61 × 3, mais 1 do `setup`).

## Missão 6 (#7)

### Decisões

- **GitLab no mínimo necessário, só como prova de portfólio (decisão do usuário):** conta Free, sem gasto. Investir mais só se um trabalho pago pedir; missão futura não amplia isto sem o usuário pedir.
- **Só o job `e2e`:** é o que a issue pede. `check`, `audit`, `secret-scan` e `workflow-audit` seguem no GitHub, que é a fonte da verdade. Sem cache, painel JUnit ou Pages (YAGNI).
- **Espelho por `git push` manual, remote `gitlab`:** o pull mirroring exige Premium, e uma sincronização automática guardaria um token do GitLab no GitHub. Por isso o README aponta para uma pipeline num commit, não para um badge.
- **Node e pnpm instalados no job, a partir de `.node-version` e `packageManager`:** a imagem traz Node 24.20, abaixo do `engines` (`^22.23.4 || >=24.22.1`). `pnpm runtime set node` é o caminho da doc do pnpm. Uma guarda compara a versão, porque o Node da imagem rodaria a suíte sem reclamar.
- **Root no container:** padrão da imagem, aceito pela doc do Playwright para sites confiáveis, e o app testado é o nosso. Evita tratar a posse do diretório clonado.
- **`alias: postgres` explícito:** o nome do serviço tem digest, e a doc só descreve o nome derivado de imagem com tag.
- **`.gitlab-ci.yml` no `format` e no `format:check`:** a lista do Prettier é por caminho, então o arquivo ficaria sem portão.

### Como o RED foi visto

| Alvo                    | Sonda                                | Erro observado                                                          |
| ----------------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| `PATH` do pnpm          | `export PATH` removido               | `pnpm runtime` sai com 1: `global bin directory ... is not in PATH`     |
| Guarda de versão        | Instalação do Node removida          | `test` sai com 1 no Node da imagem                                      |
| Formatação              | Linha mal formatada no YAML          | `format:check` sai com 1 e aponta `.gitlab-ci.yml`                      |
| Job e artifact (GitLab) | Spec que falha, commit só no espelho | `Expected: "green"`, `script_failure`, artifact de 32 arquivos baixado sem login |

Pipelines no GitLab.com: [verde em `6636fd0`](https://gitlab.com/brunoccalmeida1/playwright-nextjs-e2e-ci/-/pipelines/3043123721), 62 de 62, job de 238 s; [vermelha da sonda](https://gitlab.com/brunoccalmeida1/playwright-nextjs-e2e-ci/-/pipelines/3043130956), 276 s. Antes, a simulação local do arquivo real (Docker, serviço por alias, 64 MB de `/dev/shm`, sem `--init` nem `--ipc=host`) deu 62 de 62 em 114 s.

### Achados

- **Bloqueio de verificação não gera job:** a pipeline fica `failed` com lista de jobs vazia, e a API pública não explica. O motivo está em `failure_reason` no JSON da página (`/-/pipelines/<id>.json`): `The pipeline failed due to the user not being verified`.
- **Projeto não pode ser mais visível que o grupo:** a opção `Public` fica bloqueada até o grupo ser público.
- **`pnpm runtime -g` exige `$PNPM_HOME/bin` no `PATH`** e reprova sem ele.
- **Mesmo SHA em branch nova dispara outra pipeline**, sem commit vazio.
- **O primeiro push define a branch padrão do GitLab:** ficou `ci/gitlab-parity`. Enviar a `main` depois do merge e trocar a padrão na interface.
- **Sem `--ipc=host` e `--init` no GitLab:** as páginas lidas da doc só mostram `image:docker:user` como opção do container. Não medi o `/dev/shm` do runner hospedado; a suíte passou nele sem o `--ipc=host`. O `--init` recolhe processos zumbis, e aqui a VM do job é descartada ao final (julgamento nosso: o efeito não compensa um contorno).
- **Pendência autorizada pelo usuário, a fazer logo após o merge:** descrição do repositório com "GitLab CI" e tópico `gitlab-ci`, último item do "Done when" da #7. Se a #7 estiver fechada e o repositório sem o tópico, fazer isso antes da próxima missão.
- **Sonda inválida:** `git commit --no-verify=false` reprovou, e o push seguiu com o commit anterior. A pipeline deu verde e gastou 4 minutos. Encadear com `&&` e comparar o SHA antes do push.
- **`tail` esconde exit code outra vez:** induziu um comentário falso no YAML. A sonda desmentiu e o comentário foi corrigido.
- **Manutenção:** o digest da imagem passa a existir em dois arquivos (anotado na #21).

### Fontes consultadas

Em 08/11/2026: GitLab: [serviço PostgreSQL](https://docs.gitlab.com/ci/services/postgres/), [services](https://docs.gitlab.com/ci/services/), [referência do YAML](https://docs.gitlab.com/ci/yaml/), [runners Linux](https://docs.gitlab.com/ci/runners/hosted_runners/linux/), [espelhamento](https://docs.gitlab.com/user/project/repository/mirror/), [compute minutes](https://docs.gitlab.com/ci/pipelines/compute_minutes/), [debugging](https://docs.gitlab.com/ci/debugging/), [visibilidade](https://docs.gitlab.com/user/public_access/) e [preços](https://about.gitlab.com/pricing/); Playwright: [CI](https://playwright.dev/docs/ci) e [Docker](https://playwright.dev/docs/docker); pnpm: [CI](https://pnpm.io/continuous-integration), [runtime](https://pnpm.io/cli/runtime) e [instalação](https://pnpm.io/installation).

## Missão 8 (#9)

### Decisões

- **Números medidos, não copiados deste resumo:** `playwright test --list` (62 testes em 11 arquivos) e o log do job `e2e` em `6dc73c9` (`62 passed (1.1m)`).
- **O README diz que os 62 incluem os 7 `test.fail`:** o relatório os conta como aprovados, e "62 verdes" sozinho sugeriria um app sem defeitos.
- **Seção "What this does not cover":** só Chromium, `mobile` é emulação, sem carga nem regressão visual. Faz parte do critério de honestidade da issue.
- **Documentação do template movida, sem alterações, para `docs/PAYLOAD_TEMPLATE_README.md`:** eram 300 das 359 linhas e o título do README era o do template. O corpo foi comparado com `diff`: idêntico.
- **Screenshots em `docs/images/`, com links relativos**, como pede a doc do GitHub.
- **Verificador de links fora do `pnpm check` (YAGNI):** rodou uma vez, no scratchpad. Virar sentinela faria o CI depender de GitHub, GitLab e Pages no ar, ou seja, de rede externa, para um PR sem relação (julgamento nosso).
- **Upwork: o agente prepara, o usuário publica** (decisão do usuário). É um perfil público, em nome dele.

### Item de portfólio no Upwork

- **Título (63/70):** Playwright E2E suite and CI for a Next.js / Payload CMS website
- **Papel (51/100):** QA Automation Engineer (personal portfolio project)
- **Por que "62" e "issues":** o relatório público mostra `All 62`, porque conta o `setup` de login; os "61" da tabela de estado são sem ele. "Issues", e não "bugs", porque KI-3 e KI-4 são achados do axe, e o KI-4 quase não tem efeito prático (o Tab não sai do popup); o KI-5 vem de uma regra deliberada.
- **Descrição (534/600):** Personal project, not client work. Playwright + TypeScript suite for the official Payload CMS website template: 62 tests covering the REST API contract, accessibility (axe, WCAG 2.2 AA), keyboard use, a mobile viewport and an admin-to-frontend journey, on the production build with a new Postgres per CI run. It found 7 real issues, each documented and pinned by a test. Runs on GitHub Actions behind 5 quality gates; its E2E job also passed on GitLab CI. Public report and evidence: github.com/brunoccalmeida/playwright-nextjs-e2e-ci
- **Pendência do usuário:** publicar o item no perfil. O texto e as imagens estão prontos; nada foi enviado ao Upwork.
- **Skills:** Playwright, TypeScript, GitHub Actions, GitLab CI, Accessibility Testing. Os nomes exatos dependem da lista do formulário.
- **Mídia:** `docs/images/report.png` (capa), `pipeline-github.png`, `pipeline-gitlab.png` e o link do repositório.

### Como o RED foi visto

| Alvo                       | Sonda, numa cópia em pasta temporária                   | Erro observado                               |
| -------------------------- | ------------------------------------------------------- | -------------------------------------------- |
| Link para arquivo          | `tests/helpers/cms-contract.ts` trocado por `nope.ts`   | `missing file tests/helpers/nope.ts`         |
| Âncora de known issue      | `#ki-3-wrong-anchor`                                    | `missing anchor`                             |
| Link externo               | Pipeline `9999999999`                                   | `HTTP 404`                                   |
| Paridade EN e pt-BR        | Link alterado em um só idioma                           | `only in README.md`, `only in README.pt-BR.md` |

Com os arquivos reais, depois da revisão: 49 links distintos (16 externos), todos resolvem, e as duas línguas citam a mesma evidência.

### Revisão independente

- **Aplicado:** "62 of 62" no GitLab apontava para uma pipeline com a aba `Tests 0`. Agora há link para o log do job, conferido: `62 passed (1.4m)`.
- **Aplicado:** "latest run" era um link fixo, que ficaria falso no merge seguinte.
- **Aplicado:** "required" e "blocks bad merges" não tinham prova. Agora apontam para o ruleset, que exige `ci-passed`, e para o PR #10, com o commit-sonda barrado.
- **Aplicado:** "seen failing first" exagerava: parte dos testes nasceu verde e foi vista falhando por mutação.
- **Aplicado:** o relatório só fica anexado quando os testes chegam a rodar, não em "any failing run"; "every CI job" valia só para o `e2e`.
- **Aplicado:** o KI-7 está na dependência Payload, não no template gerado.
- **Aplicado:** o texto do Upwork sugeria execução contínua no GitLab, com os mesmos portões.
- **Aplicado:** a afirmação sobre `src/` ganhou link de comparação, e a das dependências, o commit `51c76a2`.
- **Descartado:** trocar `Closes #9` por `Refs #9`. O "Done when" da issue é o README com evidências, e publicar no Upwork é ato do usuário, por decisão dele. A pendência está registrada acima e no pedido de merge.

### Achados

- **`--reporter=json` com `--list` saiu vazio**, e o `2>/dev/null` escondeu isso. O contador deu `total 0`, tratado como falha e refeito com `--reporter=line`. Resposta vazia não é resposta.
- **Validade da evidência:** o relatório publicado é sempre o da última `main`, e o badge é ao vivo. O link do run fixa `6dc73c9`, mas o GitHub expira os logs (padrão de 90 dias); o resumo do run segue visível. Ao mudar o número de testes, atualizar a tabela do README nos dois idiomas.
- **Screenshot com tempo relativo:** o do GitHub mostra "16 hours ago", e envelhece. Não afeta o conteúdo.

### Fontes consultadas

Em 09/11/2026: GitHub: [About the repository README file](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) e [sintaxe de escrita](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax); Upwork: [How to enhance your freelancer profile](https://support.upwork.com/hc/en-us/articles/360016144974-How-to-enhance-your-freelancer-profile), [Portfolio Guide](https://www.upwork.com/resources/portfolio-guide) e [How To Make a Freelance Portfolio](https://www.upwork.com/resources/how-to-create-portfolio).
