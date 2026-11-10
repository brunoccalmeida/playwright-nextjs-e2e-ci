<!-- LTeX: language=pt-BR -->

# Resumo das sessões

Estado do projeto entre chats. Lido no início de cada missão (ver `.github/copilot-instructions.md`).

## Estado atual

| Item             | Estado                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Missão atual     | Regras sempre carregadas só com o que é durável e geral (#41), concluída com o merge do PR da missão |
| Próxima missão   | #40 (P2), a investigação do botão de seed do admin. A #20 segue bloqueada até uma Payload com Lexical >= 0.53.0 (em 09/11/2026, a mais recente ainda fixa o Lexical em 0.50.0). Avaliar também a fila do Dependabot, começando pelo #36 |
| PRs abertos      | Dependabot #13 a #16, #23 e #36, à espera de avaliação um por vez; o #36 substituiu o #24 e sobe o Playwright para 1.64.1; o `check` dele reprova pela sentinela (#21), que indica a imagem a usar, e o `e2e` por `Executable doesn't exist` |
| Ambiente local   | `compose.yaml` com `postgres:18`, env validado com zod, migration inicial e seed via Local API; passos no README                                                         |
| Portões          | Jobs `check`, `audit`, `secret-scan`, `workflow-audit` e `e2e`, todos no `needs` do `ci-passed`, único check do ruleset; `publish-report` só em push na `main`           |
| Travas do agente | `.claude/settings.json` nega merge `--admin`, force push, push na `main` e leitura/escrita do `.env` (Bash e PowerShell); fronteira real é o ruleset da `main`            |
| Baseline         | 1º commit da `main` (`f0154df`): app gerado por `create-payload-app@3.93.0 -t website -d postgres`, intacto                                                               |
| Testes           | 62 no build de produção: 4 do template e 58 próprios, em `api`, `admin`, `chromium`, `mobile` e `reduced-motion`, mais o `setup` de login (63 no relatório); 8 são `test.fail` (KI-1 a KI-8) |

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
- **Publicado pelo usuário em 09/11/2026.** O agente não enviou nada ao Upwork.
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

## Missão 7 (#8)

Relatório completo, público e em inglês: [`docs/PLAYWRIGHT_AGENTS_EXPERIMENT.md`](PLAYWRIGHT_AGENTS_EXPERIMENT.md). Aqui fica o que serve às próximas sessões.

### Decisões

- **`--loop=claude`:** a dúvida da issue. O `--help` da 1.63.0 lista esse valor, e o exemplo com `vscode` na seção do Claude Code da doc parece erro da página.
- **Execução em `claude -p`, decisão do usuário:** o `.mcp.json` nasce depois do início do chat, então as ferramentas não existem na sessão. O `-p` também grava o transcript, que é a evidência.
- **Três condições no healer, mesmo bug:** regras + comentário-dica do generator (`test.fail`), regras sem comentário (propôs `test.fail`, edições negadas) e sem regras (`CLAUDE_CODE_DISABLE_CLAUDE_MDS=1`, `test.fixme()`). A condição do meio partiu da `main`, para o repositório não citar o KI-8.
- **Definições, `.mcp.json`, plano e testes gerados fora do PR (YAGNI):** a doc pede para regenerar a cada atualização do Playwright, e a ferramenta não entrou em uso.
- **KI-8 escrito à mão, não aproveitado do gerado:** um e-mail só, porque num `test.fail` as voltas seguintes de um laço nunca rodam, e o regex aceita "e-mail", para não seguir "falhando" depois de uma correção com outra grafia.
- **Sem asserção `toBeHidden` na mensagem genérica:** passaria no instante antes de a validação renderizar.
- **O relatório é em inglês:** é evidência pública do portfólio, com link nos dois READMEs.

### Como o RED foi visto

| Alvo                             | Como                                                | Erro observado                                                    |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| KI-8, sem marcação               | `test` puro, com o bug no app                       | `getByText(/valid.*e-?mail.../i)`, `element(s) not found`         |
| `test.fail` percebe a correção   | Asserção procurando o texto que existe              | `Expected to fail, but passed`                                    |

Causa do KI-8 lida no código: `pattern` sem `message` no campo de e-mail, e `Error` cai no texto padrão.

Validação: `pnpm check` verde e, com `CI=1`, banco novo e `.next` limpo, 63 de 63.

### Achados

- **Heartbeat não é progresso.** Disse ao usuário que o planner não tinha travado porque o arquivo era gravado segundos antes. Eram só eventos `tool_progress` de uma chamada parada. O número que importa é o de chamadas concluídas.
- **Agente pode travar sem limite:** `waitFor()` sem `actionTimeout` não tem prazo, e o limite de orçamento não ajuda, porque ferramenta parada não gasta. Rode sempre com limite externo.
- **O `exit 0` de script em segundo plano é do último comando:** conferir o `result` no transcript. O do planner morto também veio 0.
- **`tail` escondeu a causa outra vez:** o primeiro erro do seed se perdeu com `tail -3`. Log em arquivo resolveu na ocorrência seguinte.
- **Deadlock ao repetir o seed (#32):** `Promise.all` no seed congelado do template. Não afeta o CI, cujo banco nasce vazio.
- **`.next/cache` guarda dados de um build ruim:** build após seed quebrado grava o header vazio, e o build seguinte reaproveita. Três testes reprovaram por falta do link `Posts`, com o banco correto. Remover `.next` resolveu. Validar sempre com `.next` limpo, como o CI.
- **Upwork:** o texto preparado na Missão 8 citava 62 testes e 7 problemas, e depois deste merge passaram a 63 e 8. O item foi publicado pelo usuário em 09/11/2026 (ver a Missão 8).

### Fontes consultadas

Em 09/11/2026: Playwright: [Test Agents](https://playwright.dev/docs/test-agents) e [classe Test](https://playwright.dev/docs/api/class-test) (`test.fixme`, `test.fail`); Claude Code: [MCP](https://code.claude.com/docs/en/mcp), [execução programática](https://code.claude.com/docs/en/headless) e [variáveis de ambiente](https://code.claude.com/docs/en/env-vars). Opções do `init-agents` e do `run-test-mcp-server` conferidas no `--help` da 1.63.0.

### Revisão independente

- **Aplicado, com medição nova:** comparar "com regras" e "sem regras" misturava duas variáveis, porque só a primeira tinha o comentário do generator citando `test.fail`. A condição que faltava rodou (regras, sem comentário): nada de `fixme`, e `test.fail` proposto. O relatório diz agora o que cada condição mostrou.
- **Aplicado:** o veredito afirmava que o healer não distingue teste velho de regressão, sem nenhuma execução com o app regredido. Agora é inferência declarada, e o limite está listado.
- **Aplicado:** "não tem outra fonte" era falso: o plano existia. O observado é que ele não consultou.
- **Aplicado:** edição de `KNOWN_ISSUES.md` saiu de "quebra as regras", porque é o que a regra manda; virou observação sobre escopo de permissão.
- **Aplicado:** `n` perdido no README em português, linha do `contact-form.spec.ts` na tabela por área (a soma dava 62), nota de que o screenshot é da execução de 62, e tempo de "1,1 min" retirado, pois não foi medido com 63 testes.
- **Aplicado:** "Reproducing it" ganhou a invocação do `claude -p`, as ferramentas e as mutações.
- **Descartado:** publicar os transcripts. Trazem caminhos locais e não acrescentam ao que o relatório resume; estão fora do repositório.
- **Descartado:** recapturar o screenshot agora. Ele só pode mostrar 63 depois do merge publicar o relatório; a #31 trata da sincronia dos números.

## Missão #17

### Decisões

- **Uma linha de copyright a mais, um único texto de permissão.** Os dois avisos são o mesmo texto MIT (diferem só em aspas e quebra de linha, comparado com `diff` normalizado), e as duas partes ficam sob a mesma concessão. Empilhar os titulares acima de um texto só é convenção de comunidade, não norma: não achei fonte oficial sobre a forma (julgamento nosso).
- **Aviso da versão de onde o template saiu:** `2018-2025 Payload CMS, Inc.`, da tag `v3.93.0`, idêntico ao de `node_modules/payload/LICENSE.md`. A `main` da Payload já diz `2018-2026 Payload CMS, LLC`, mas o que a licença manda preservar é o aviso do que foi copiado.
- **README sem mudança:** nenhum dos dois cita licença, e a MIT não exige dizer qual parte é de quem (YAGNI). Se o repositório precisar explicar a origem do código, é ali, não no `LICENSE`, como orienta o GitHub.
- **Sem sentinela no `pnpm check` (YAGNI):** o aviso é uma linha que só muda se alguém a apagar, e o `LICENSE` não acompanha atualizações da Payload.

### Como o RED foi visto

| Alvo                 | Como                                                   | Resultado observado                                       |
| -------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| Aviso ausente        | `grep -qF` da linha da Payload no `LICENSE` original   | Exit 1; depois da mudança, exit 0                         |
| Detecção do GitHub   | Commit-sonda com o aviso inteiro em um segundo bloco   | `GET /license?ref=` responde `NOASSERTION` (`other`)      |
| Forma final          | Mesma consulta na branch                               | `MIT`, com `sha` igual ao de `git rev-parse HEAD:LICENSE` |

### Achados

- **Detecção de licença é medível por branch:** `GET /repos/{owner}/{repo}/license?ref=<branch>`. Conferir o `sha` da resposta contra o blob local garante que a leitura é do commit certo, a mesma ideia de consultar checks pelo SHA da head.
- **O exemplo que a doc não dá:** a doc do GitHub só diz para simplificar o `LICENSE` e não explica o que acontece com texto extra. A sonda mostrou o efeito real.

### Fontes consultadas

Em 09/11/2026: GitHub: [Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository); [Licensee: what we look at](https://github.com/licensee/licensee/blob/main/docs/what-we-look-at.md); [choosealicense: MIT](https://choosealicense.com/licenses/mit/); [`LICENSE.md` da Payload](https://github.com/payloadcms/payload/blob/v3.93.0/LICENSE.md) na versão usada. Convenção de combinar avisos: [resposta no Software Engineering Stack Exchange](https://backiee.wasmer.app/https_softwareengineering_stackexchange_com/questions/306029/how-to-license-application-generated-from-boilerplate-code), um espelho, sem autoridade normativa.

## Missão #21

### Decisões

- **Trocada a ordem da fila:** a #20 seria a próxima pelo desempate, mas está bloqueada. A `@lexical/headless` 0.53.0 já pede `happy-dom ^21.0.4`, só que a `@payloadcms/richtext-lexical` 3.93.0, a mais recente, fixa o Lexical em `0.50.0`. Volta a ser viável com uma Payload que adote Lexical >= 0.53.0.
- **Sentinela (`scripts/check-ci-image.ts`) em vez de automação:** é um dos dois caminhos do "Done when". Commitar no PR do Dependabot faz ele parar de rebasear e pede credencial capaz de escrever em workflows; o Renovate cuida de `container:`, mas troca a ferramenta do repositório. Para uma correção de duas linhas numa mudança rara, nenhum dos dois compensa (YAGNI, menor privilégio; julgamento nosso).
- **Rede só na divergência:** o caminho verde não acessa o registro, então uma queda dele não reprova PR sem relação, a mesma razão do verificador de links da Missão 8. Na divergência o job já ia reprovar, e o registro só melhora a mensagem. Se a consulta falhar, a mensagem dá a tag e o comando para obter o digest.
- **Limite aceito: a sentinela não liga o digest à tag.** Trocar só a tag nos dois arquivos e manter o digest velho passa (exit 0, sonda abaixo), porque conferir o par exigiria rede no caminho verde. O erro não entra na `main`: o `e2e` reprova com `Executable doesn't exist`, só que sem a mensagem útil. A mensagem do fallback avisa para mudar tag e digest juntos.
- **Exige versão exata em `package.json`:** uma faixa não diz qual tag usar. O projeto já fixa a versão exata.
- **Exatamente uma referência por arquivo e sempre com digest:** a checagem reprova referência sem digest ou duplicada, em vez de olhar só a primeira.

### Como o RED foi visto

Primeiro passo: `pnpm check:ci-image` antes do arquivo existir, `ERR_MODULE_NOT_FOUND`. Sondas numa cópia no scratchpad, cada uma com exit 1, salvo as duas de controle:

| Alvo                                   | Sonda                                 | Resultado observado                                       |
| -------------------------------------- | ------------------------------------- | --------------------------------------------------------- |
| Controle                               | Cópia intacta                         | Exit 0                                                    |
| Caso do PR #24                         | `package.json` em 1.64.1              | `Use this image in both files`, digest `sha256:2f05f8...` |
| Ida e volta                            | Linha sugerida colada nos dois        | Exit 0                                                    |
| Arquivos divergentes                   | Digest diferente em um só             | `does not match`, com a imagem certa                      |
| Sem digest                             | `@sha256:...` removido                | `must be pinned as`                                       |
| Referência duplicada                   | Segunda imagem no arquivo             | `expected exactly one ... found 2`                        |
| Imagem ausente                         | Linha apagada                         | `found 0`                                                 |
| Faixa de versão                        | `^1.63.0`                             | `must be an exact version`                                |
| Tag não publicada                      | 9.9.9                                 | `could not be read (HTTP 404)`                            |
| Registro fora do ar                    | Host `mcr.invalid`                    | `could not be read (fetch failed)`                        |
| Ligação no `pnpm check`                | Digest mutado no `.gitlab-ci.yml`     | `pnpm check` exit 1 com a mensagem da sentinela           |
| Limite: tag nova, digest velho         | Só a tag trocada, nos dois e no manifesto | Exit 0, como descrito em "Limite aceito"              |

### Revisão independente

- **Aplicado:** o revisor apontou que tag nova com digest velho passa. Reproduzido e registrado como limite; rede no caminho verde desfaria a decisão acima. A mensagem do fallback agora pede tag e digest juntos.
- **Aplicado:** a tabela de estado afirmava que o #24 "agora reprova no `check`". A sentinela só o alcança num run sobre uma base que já a contenha, e isso não foi observado no PR.
- **Descartado:** nenhum. O revisor não tinha rede nem `git`: o 404 sem `Accept`, os digests e o padrão do `verifyDepsBeforeRun` foram medidos ou lidos nesta sessão, como descrito nos Achados e nas Fontes.

### Achados

- **O `pnpm` instala sozinho antes de rodar script:** `verifyDepsBeforeRun` tem padrão `install` no pnpm 11. Mudar o `package.json` e rodar `pnpm check` subiu `node_modules` e o lockfile para a 1.64.1. Sonda no manifesto vai para uma cópia, ou se usa outro arquivo; desfeito com `git checkout` do lockfile e `pnpm install --frozen-lockfile`.
- **Sem `Accept`, o MCR responde 404** no manifesto da tag. Eu tinha comentado no código que viria "outra representação", de memória; a medição corrigiu.
- **A doc do Dependabot não fala de `container:`:** o ecossistema `github-actions` cobre ações pela sintaxe de repositório e exclui `docker://`. Que ele não atualiza a imagem é inferência da doc somada ao PR #24.
- **Para o PR #24:** ele precisa da imagem indicada pela sentinela nos dois arquivos, num commit na branch do Dependabot. Commit de terceiros faz o Dependabot parar de rebasear; a doc diz que incluir `[dependabot skip]` na mensagem deixa ele sobrescrever esses commits.
- **`--jq` no PowerShell quebrou de novo** no início do chat: o aviso já estava neste resumo. Usar o Bash.

### Fontes consultadas

Em 09/11/2026: GitHub: [ecossistemas do Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories) e [PRs de atualização](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/managing-pull-requests-for-dependency-updates); [Playwright: Docker](https://playwright.dev/docs/docker); [Renovate: github-actions](https://docs.renovatebot.com/modules/manager/github-actions/); [pnpm: build settings](https://pnpm.io/settings/build); [Docker: get image manifest](https://docs.docker.com/reference/api/registry/latest/operations/GetImageManifest.md). Comportamento do MCR medido com `curl` e dependências conferidas com `npm view`.

## Missão #25

### Decisões

- **Medido antes de escolher:** missões que citam cada domínio nas fontes deste resumo: `playwright.dev` 7, `pnpm.io` 5, `docs.github.com` 5, `payloadcms.com` 2, `nextjs.org` 1. Ficaram quatro skills: `playwright-docs`, `pnpm-docs`, `github-docs` e `payload-docs`.
- **`nextjs.org` saiu, apesar de citado na issue:** só 1 missão (YAGNI). `w3.org`, MDN e Docker também têm 2 missões, mas não há versão fixada a alcançar nem armadilha paga (julgamento nosso). `github.com` é mistura de repositórios, não uma fonte.
- **Rota pela versão fixada, não pelo site:** `playwright.dev` só tem a mais recente; a Payload acompanha a major estável, com a 4.x em beta; o pnpm já está na 12.x e usamos a 11. Os fontes da doc na tag (Playwright e Payload) ou na pasta da major (pnpm) respondem pela nossa versão, e deles sai a citação.
- **`llms.txt` só onde existe e ajuda:** GitHub e Payload. Playwright e pnpm respondem 404. O da Payload acompanha a última da major, então serve para achar a página, e a leitura é na tag.
- **Sem cópia para o Copilot:** as docs do GitHub e do VS Code listam `.claude/skills` como local de skills de projeto, e o formato é o padrão aberto Agent Skills. A exceção é o harness Local do VS Code ser o único daquele produto a ler essa pasta; outro harness lá exigiria `.github/skills`.
- **Sem `paths` no frontmatter:** limita a ativação ao tocar em arquivos, e o "Done when" pede que uma pergunta num chat novo acione a skill.
- **Sentinela ampliada, em `scripts/check-agent-rules.ts`:** nome válido e igual à pasta, descrição de 1 a 1024 caracteres, menos de 500 linhas e nenhuma versão fixada escrita na skill. Nome inválido falha em silêncio, segundo a doc do VS Code, e versão copiada é o "congelar" que a issue proíbe.
- **Limite aceito da sentinela:** só pega a versão exata de Playwright, Payload, Next.js e pnpm. Escrever `11.x` ou uma versão parcial passa.

### Como o RED foi visto

Comparação com e sem a skill, o método da doc do Claude Code: quatro perguntas em `claude -p` novos, só leitura, modelo padrão, limite de US$ 1 e 6 minutos, antes de as skills existirem e depois.

| Fonte      | Sem skill: o que citou                            | Com skill: acionou e citou                                                    |
| ---------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| Playwright | `playwright.dev/docs/test-webserver`              | `playwright-docs`; `blob/v1.63.0/docs/src/test-webserver-js.md`               |
| pnpm       | `pnpm.io/settings/build`, `pnpm.io/11.x/...`      | `pnpm-docs`; `versioned_docs/version-11.x/settings/build.md`                  |
| Payload    | `payloadcms.com/docs/database/*`                  | `payload-docs`; `blob/v3.93.0/docs/database/*.mdx`                            |
| GitHub     | Páginas certas, sem a skill                       | `github-docs`; páginas certas. Não há versão a fixar: o ganho é a rota `.md`  |

Custo total: US$ 1,28 sem e US$ 1,04 com as skills. É uma execução por condição, portanto mostra que funciona, não uma taxa de acionamento.

Sentinela, numa cópia no scratchpad, cada sonda com exit 1 e a mensagem esperada; o controle deu exit 0:

| Alvo                         | Sonda                                 | Erro observado                                   |
| ---------------------------- | ------------------------------------- | ------------------------------------------------ |
| Lacuna anterior              | Script da `main`, nome diferente da pasta | Exit 0: passava                              |
| Nome                         | Diferente da pasta; pasta e `name` iguais em `Bad_Name`, `a--b` e 65 caracteres | `name must equal the directory` |
| Descrição                    | Vazia e com 1025 caracteres           | `description must have 1 to 1024 characters`     |
| Tamanho                      | Mais de 500 linhas                    | `keep the skill under 500 lines`                 |
| Versão congelada             | Playwright, Payload, pnpm e Next.js no corpo; Playwright na descrição | `mentions the pinned version ...` |
| Frontmatter                  | Removido                              | `no YAML frontmatter`                            |

### Achados

- **`pnpm.io/<M>.x/<página>` não prova a versão:** o HTML veio com bytes idênticos para 9.x, 11.x, 12.x e sem versão, e o `canonical` aponta para a URL sem versão. Na base, o agente notou que `/11.x/` trazia notas da v12, confirmou o valor pelas notas de lançamento da 11.0 e acertou. O RED do pnpm é só a citação, que não prova a versão; a resposta em si estava certa, ao custo de um desvio.
- **O `exit 0` enganou de novo:** a primeira rodada da base saiu com 0 porque o `claude` não está no `PATH` do Git Bash e o script terminava em `wait`. Agora o script usa `CLAUDE_CODE_EXECPATH` e devolve o status de cada execução. O arquivo vazio foi o sinal.
- **Não verificado:** o acionamento no Copilot. Formato e pasta seguem a doc, mas nenhuma pergunta foi feita a ele.
- **`--bare` esconde as skills:** a doc recomenda esse modo para scripts, mas ele não lista skills e serviria de falso RED. A medição usou o modo normal, que carrega o `~/.claude` como um chat comum.

### Fontes consultadas

Em 09/11/2026: Claude Code: [skills](https://code.claude.com/docs/en/skills) e [execução programática](https://code.claude.com/docs/en/headless); GitHub: [About agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) e [Add skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills); [VS Code: agent skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills); [especificação Agent Skills](https://agentskills.io/specification). Rotas de cada fonte medidas com `curl` e `gh api`: [`llms.txt` do GitHub](https://docs.github.com/llms.txt), [da Payload](https://payloadcms.com/llms.txt) e [`versions.json` do pnpm](https://raw.githubusercontent.com/pnpm/pnpm.io/main/versions.json). Bloqueio da #20 medido com `npm view @payloadcms/richtext-lexical`.

### Revisão independente

- **Aplicado:** o resumo afirmava que o agente da base citou `/11.x/` acreditando ter a 11. A resposta dele mostra o contrário: notou a divergência e compensou. Texto corrigido.
- **Aplicado:** a checagem de versão só olhava o corpo, e a descrição é a parte sempre carregada. Agora cobre as duas; a sonda está na tabela.
- **Aplicado:** faltava sonda do limite de 64 caracteres, e a tabela não dizia que pasta e `name` mudaram juntos, o que é necessário para exercitar o regex. Sondas refeitas assim.
- **Aplicado:** "e já há uma beta" saiu da descrição da `payload-docs`: era fato datado, justamente o que a issue proíbe congelar.
- **Descartado:** nenhum. O revisor não teve rede; os 404 de `llms.txt`, os bytes do `pnpm.io` e as docs do Copilot foram medidos ou lidos nesta sessão.

## Missão #31

### Decisões

- **Checar, não gerar:** a doc do GitHub sobre READMEs não menciona include, o Markdown é renderizado como foi escrito. Um gerador ainda precisaria de uma checagem para pegar quem esqueceu de rodá-lo, e o "Done when" pede que o `pnpm check` reprove. Além disso, a prosa e a tabela em dois idiomas ficam legíveis no próprio arquivo (julgamento nosso).
- **Sentinela (`scripts/check-readme-numbers.ts`) sobre `playwright test --list`, via o script `test:e2e`:** os flags não têm como divergir de como a suíte roda. Sem rede, sem navegador e sem servidor; custa cerca de 8 s no `pnpm check`.
- **Reporter JSON em arquivo, não saída de texto:** o `Total: 63 tests` é texto para humanos, e o JSON traz o arquivo de cada teste e as anotações, com tipos públicos (`JSONReport`).
- **Ambiente vindo do `.env.example`:** a config valida o ambiente, e nem o job `check` nem um clone limpo têm `.env`. Os valores são passados ao processo, então também vencem um `.env` local desatualizado, que o agente não lê.
- **Cada arquivo em exatamente uma área:** spec novo fora da tabela reprova, e os links da própria tabela dizem quais arquivos somar. A soma das áreas igual ao total sai de graça. Os dois idiomas usam a mesma lógica, porque o link não se traduz.
- **"8 testes de bug" vem da anotação `fail`, e "8 bugs" do mapa de KIs:** são fatos diferentes, e um KI com dois testes os separaria.
- **`anchor` continua privado; `knownIssueAnchor(id)` foi exportado** para o README e o `knownIssue` usarem a mesma âncora.
- **O que fica manual está em `.claude/rules/readme.md`** (e na cópia do Copilot), com o gatilho de cada item: carrega justamente quando alguém edita o README, e a mensagem da sentinela aponta para lá. Screenshots e execuções fixadas descrevem um momento e continuam honestos enquanto o texto disser de quando são, então não são refeitos a cada teste novo.
- **Versões da linha "Stack" ficaram manuais:** a issue trata de contagens (YAGNI). Limite: o #36 sobe o Playwright sem nenhum portão avisar o README.

### Como o RED foi visto

Primeiro passo: `pnpm run check:readme` antes do arquivo existir, `ERR_MODULE_NOT_FOUND`. Sondas no próprio repositório, cada uma desfeita; controle com exit 0, todas as outras com exit 1:

| Alvo                          | Sonda                                | Erro observado                                                     |
| ----------------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| Teste novo                    | `test` a mais em `homepage.spec.ts`  | `says 63 tests, the repository has 64`, área `says 13`, nos dois   |
| Spec fora da tabela           | `probe.spec.ts` novo                 | `must be in exactly one area, found: []`                           |
| Total em um idioma            | 64 só no `README.md`                 | `says 64 tests`, só nesse arquivo                                  |
| "Verdes" em um idioma         | 64 só no pt-BR                       | `says 64 tests`, só nesse arquivo                                  |
| Linha de área                 | `Contact form` com 2                 | `says 2 tests, its files have 1`                                   |
| Arquivo em duas áreas         | `keyboard` também em `Contact form`  | `must be in exactly one area`, com as duas                         |
| KI novo                       | `KI-9` no mapa                       | `says 8 knownIssues, the repository has 9`, `bugs table lacks`     |
| Linha de bug removida         | `KI-8` fora do pt-BR                 | `bugs table lacks [KI-8]...`                                       |
| Título em inglês              | Texto alterado em `KI-1`             | `title differs from the heading`                                   |
| Âncora                        | `#ki-1-wrong`                        | `lacks` e `unknown`                                                |
| `test.fail` removido          | Virou `test` em `contact-form`       | `says 8 bugTests, the repository has 7`                            |
| Afirmação reescrita           | `Tests in main`                      | `no longer finds the tests claim`                                  |
| Spec quebrado                 | Erro de sintaxe                      | `SyntaxError`, listagem reprova                                    |
| Ligação no `pnpm check`       | 64 no `README.md`                    | `pnpm check` exit 1 com a mensagem da sentinela                    |
| Impacto mudou no documento    | `KI-2` para `low`                    | `impact should be Low` e `Baixo`, nos dois                         |
| Impacto errado em um idioma   | `KI-1` como `Moderado` no pt-BR      | `impact should be Baixo`, só nesse arquivo                         |
| Nível novo no documento       | `high`                               | `no label for the impact "high"`, nos dois                         |
| Impacto ausente no documento  | Linha removida do `KI-1`             | `no label for the impact ""`, sem pegar o da entrada seguinte      |

### Revisão independente

- **Aplicado:** a regra dizia que a classificação de impacto não era derivável, o que era falso: cada entrada de `docs/KNOWN_ISSUES.md` tem o campo, e a issue pede as linhas da tabela contra esse documento. A sentinela agora confere o impacto nos dois idiomas. Só a tradução do título continua manual.
- **Aplicado:** a frase sobre `src/` e o link de comparação fixado entraram na lista do que é manual. Não virou checagem porque o job `check` usa checkout raso, sem o histórico até o primeiro commit.
- **Descartado:** nenhum. O revisor não executou o job `check`; o primeiro run no PR é a prova de que `--list` funciona sem `.env` e sem build.

### Achados

- **`--list` com JSON saiu vazio na Missão 8 e completo aqui:** com `PLAYWRIGHT_JSON_OUTPUT_FILE` o relatório vem inteiro, e o stdout traz a listagem em texto mesmo com `--reporter=json`. Por isso o stdout é descartado e o stderr fica visível.
- **Em `--list` nada rodou:** `expectedStatus` vem `passed` e `stats.skipped` conta 63. A marca do `test.fail` é só a anotação `fail`.

### Fontes consultadas

Em 09/11/2026: Playwright na tag `v1.63.0`: [CLI](https://github.com/microsoft/playwright/blob/v1.63.0/docs/src/test-cli-js.md) e [reporters](https://github.com/microsoft/playwright/blob/v1.63.0/docs/src/test-reporters-js.md); tipos `JSONReport` em `playwright/types/testReporter.d.ts`, de onde veio a forma do JSON. GitHub: [About the repository README file](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) e [sintaxe de escrita](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax).

## Missão #32

### Decisões

- **Corrigir em vez de só documentar:** a issue aceitava os dois caminhos. A doc do Postgres põe a prevenção à frente do retry, e documentar o reset deixaria o erro no caminho de quem segue o README.
- **Limpeza sequencial em `scripts/seed.ts`, antes do seed do template:** um delete de cada vez não deixa transações concorrentes, e os deletes paralelos do template encontram tabelas vazias. O arquivo é nosso, então `src/` segue sem diff.
- **Lista de 7 coleções repetida no script:** a do template não é exportada, e o código dele é congelado. Aceitar a repetição é julgamento nosso.
- **Sem `migrate:fresh` antes do seed:** apagaria também usuários criados à mão, e o README promete substituir conteúdo e mídia, não o banco (julgamento nosso). Ele pede confirmação, e o `--force-accept-warning` só está documentado para `migrate:create`.
- **Sem retry em `40P01`:** o Postgres pede refazer a transação completa, aqui o seed inteiro, e o `Promise.all` rejeitado deixa os outros deletes rodando.
- **Linha nova nos READMEs sobre seed que falha e `.next`:** um seed ainda pode falhar por outro motivo, como o download das imagens.

### Como o RED foi visto

Sempre num Postgres 18 descartável na porta 55432, para não apagar o banco local, com `public/media` copiada e restaurada no fim. O seed real (`pnpm db:seed`) rodou em todas as medições; o exit code foi lido direto, sem pipe.

| Condição                                     | Resultado                                                  |
| -------------------------------------------- | ---------------------------------------------------------- |
| Código original, banco só com o seed         | 8 de 8 passaram: **não reproduziu**                        |
| Código original, 3000 posts a mais por seed  | 5 falhas em 20, todas `40P01` em `delete from "posts"`     |
| Com a limpeza sequencial, 3000 posts a mais  | 40 de 40, zero `ERROR` no log do Postgres                  |
| Limpeza com `forms` antes de `form-submissions`, um envio existente | 23502 em `delete from "forms"`, em toda repetição |
| Ordem final, um envio e 3000 posts a mais por seed | 25 de 25, zero `ERROR` no log do Postgres            |

Cada post inflado aponta para uma mídia e para as 6 categorias. Nos 5 deadlocks, o log do Postgres mostra `delete from "posts"` contra `delete from "media"`. O conteúdo final é o mesmo em todos os casos: 3 posts, 2 páginas, 4 mídias, 6 categorias, 1 usuário.

### Achados

- **Com poucos dados o deadlock quase não aparece:** com 3 posts, os deletes duram milissegundos. A primeira tentativa de RED passou 8 de 8, e implementar ali teria "corrigido" algo nunca visto. Que o banco da issue tivesse mais dados é hipótese; a medição prova o mecanismo com posts artificiais, não a condição daquele dia.
- **Causa medida:** `delete from "media"` faz `SET NULL` em `posts.hero_image_id` enquanto `delete from "posts"` apaga as mesmas linhas, cada um em sua ordem. A issue só dizia "duas transações".
- **Seed que falha destrói dados:** um deles deixou `posts=3003`, `media=0`, `categories=0`, porque cada delete é confirmado sozinho.
- **Sem correção a copiar:** a `main` da Payload mantém o mesmo `Promise.all`, e a doc de transações não fala de deadlock. Atualizar a Payload não resolveria.
- **Limite aceito, `deleteVersions`:** o seed do template ainda limpa as versões em paralelo. O que sustenta isso é a leitura das foreign keys da migration: não há ligação entre `_pages_v` e `_posts_v`. As medições não inflaram versões, então não provam esse ponto.
- **Botão de seed do admin continua com o defeito:** `src/app/(frontend)/next/seed/route.ts` chama o seed paralelo direto, e só o `pnpm db:seed` foi corrigido, que é o escopo da #32. O código é congelado. Medido e registrado em `docs/KNOWN_ISSUES.md`, na seção de defeitos sem teste (ver abaixo).
- **Catálogo do Postgres responde o que `grep` adivinha:** `pg_constraint` com `confdeltype='n'` e `attnotnull` lista toda coluna `NOT NULL` com `ON DELETE SET NULL`. Só há uma, `form_submissions.form_id`.

### Revisão independente

- **Aplicado, reproduzido antes de corrigir:** a primeira ordem apagava `forms` antes de `form-submissions`, e um único envio fazia todo seed seguinte falhar com `23502`, sem recuperação além do `pnpm db:down`. As medições não pegaram porque nenhuma tinha envio. Sequencializar trocou uma corrida por uma dependência de ordem.
- **Aplicado:** o botão de seed do admin entrou nos limites; as frases sobre `deleteVersions` e sobre o banco da issue deixaram de afirmar o que não foi medido; o comentário cita a coluna `hero_image_id`.
- **Conferido:** o RED está na mensagem do commit da correção; o revisor não tinha acesso a ela.
- **Descartado:** nenhum.

### O botão de seed é bug do template

O usuário pediu certeza antes de qualquer relato, então o botão foi medido pela rota real, autenticado, sem mudar `src/`.

| Ambiente                                     | Estado antes do `POST /next/seed`  | Resultado                  |
| -------------------------------------------- | ---------------------------------- | -------------------------- |
| Este repositório, build de produção          | Só o seed                          | 8 de 8 passaram            |
| Este repositório, build de produção          | Um envio pela API do formulário    | 6 de 8 falharam, `23502`   |
| Este repositório, build de produção          | 300 posts a mais                   | 6 de 15 falharam, `40P01`  |
| Este repositório, build de produção          | 3000 posts a mais                  | 6 de 15 falharam, `40P01`  |
| App novo de `create-payload-app@3.93.0`, `pnpm dev` | Só o seed                   | 8 de 8 passaram            |
| App novo de `create-payload-app@3.93.0`, `pnpm dev` | Um envio pela API do formulário | 5 de 8 falharam, `23502` |

- **Por que é bug, e não uso indevido:** o comentário do seed diz que o endpoint precisa limpar os dados porque não apaga o banco, o controle passa e o gatilho é um envio comum.
- **Sem `test.fail` (julgamento nosso):** o resultado varia, e a doc do Playwright diz que ele reclama se o teste não falhar. `fixme` não roda, e `skip` a regra proíbe. Forçar a falha sempre exigiria sincronizar locks do Postgres e apagar o seed compartilhado.
- **Seção separada em `KNOWN_ISSUES.md`:** um KI-9 sem teste tornaria falsos o "each issue has a test" do documento e o "8, each with a test" do README. As sentinelas só leem cabeçalhos `## KI-`.
- **Relato à Payload, decisão do usuário:** o app novo usa Next 16.4.1 e Postgres 18 e reproduz sem nenhum código nosso. O formulário deles exige um link público de reprodução. Nada foi publicado.
- **Corrigido neste registro:** eu tinha escrito que reproduzir exigia milhares de linhas. Bastam 300 posts, ou um envio.
- **A primeira classificação do script saiu `unclassified`:** o log do servidor traz a mensagem, não o código numérico. Reclassificado pela mensagem, arquivo a arquivo.

### Fontes consultadas

Em 09/11/2026: Playwright na tag `v1.63.0`: [anotações](https://github.com/microsoft/playwright/blob/v1.63.0/docs/src/test-annotations-js.md), [classe Test](https://github.com/microsoft/playwright/blob/v1.63.0/docs/src/test-api/class-test.md) e [retries](https://github.com/microsoft/playwright/blob/v1.63.0/docs/src/test-retries-js.md); [formulário de bug da Payload](https://github.com/payloadcms/payload/blob/main/.github/ISSUE_TEMPLATE/1.bug_report_v3.yml). Postgres 18: [Deadlocks](https://www.postgresql.org/docs/18/explicit-locking.html) e [retry de falhas](https://www.postgresql.org/docs/18/mvcc-serialization-failure-handling.html); Payload na tag `v3.93.0`: [transações](https://github.com/payloadcms/payload/blob/v3.93.0/docs/database/transactions.mdx) e [migrations](https://github.com/payloadcms/payload/blob/v3.93.0/docs/database/migrations.mdx); [template na `main` da Payload](https://github.com/payloadcms/payload/blob/main/templates/website/src/endpoints/seed/index.ts); Next.js instalado, `node_modules/next/dist/docs/01-app/02-guides/ci-build-caching.md`. Código instalado: `@payloadcms/drizzle/dist/deleteMany.js` e `migrateFresh.js`, `payload/dist/bin/migrate.js` e `@payloadcms/db-postgres/dist/connect.js`.

## Missão #41

### Decisões

- **Critério, pedido pelo usuário:** regra sempre carregada vale para toda sessão e todo agente e não perde a validade. Está registrado em `.claude/rules/agent-rules.md`, que carrega ao editar as regras.
- **Mover em vez de apagar:** as regras de teste foram para `.claude/rules/tests.md` e as de edição das regras para `agent-rules.md`, cada uma com a cópia em `.github/instructions/`. Apagar perderia conhecimento que ainda vale naquela parte do código.
- **Removido por duplicar:** o passo do `reviewer` e os detalhes do squash estão em `/close-mission` e `/ship-pr`; o ponteiro para `dependencies.md` era inútil, porque a regra carrega sozinha; "Node fixado em `.node-version`" está no README e no `ci.yml`; "`waitForTimeout` é barrado pelo lint" é o que `playwright/no-wait-for-timeout` já impõe.
- **Lista de sites de documentação removida:** Playwright, Payload, pnpm e GitHub têm skill. Next.js não tem, e o ponteiro expirou de propósito: a regra geral de consultar a doc oficial na versão usada continua, e a doc instalada fica em `node_modules/next/dist/docs` (julgamento nosso: o app é congelado, então a dúvida é rara demais para uma linha sempre carregada).
- **Configuração por variável de ambiente subiu para "Segurança":** vale também para `scripts/`, não só para os testes.
- **Ficaram o ciclo de missão e a regra de ouro** (julgamento nosso): são processo estável e valem em toda sessão.
- **PR aberto com a fila do Dependabot pendente:** decisão do usuário, como nas missões anteriores.

### Como o RED foi visto

| Alvo                | Sonda                                                     | Erro observado                                                |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| Sentinela de regras | Linha a mais em `.github/instructions/tests.instructions.md` | `Rule "tests": the body differs between Claude and Copilot.`, exit 1 |

### Achados

- **Limite do `applyTo`:** segundo a doc do GitHub, JetBrains e Xcode só leem o arquivo geral, então neles as regras movidas não valem. O projeto usa VS Code.
- **Carregamento das regras novas, verificado em parte:** o revisor relatou que `agent-rules.md` entrou no contexto dele ao ler arquivos casados. `tests.md` não foi exercitada, e o Copilot não foi testado; nesses casos vale o que diz a documentação.

### Revisão independente

- **Aplicado:** `.claude/agents/reviewer.md` só apontava para o arquivo geral, e as regras de teste saíram dele. O revisor lê o diff no scratchpad, que não casa com `tests/**`, então poderia não recebê-las. Agora cita `.claude/rules/tests.md`.
- **Aplicado:** esta seção não dava o destino de tudo o que saiu (`.node-version`, `waitForTimeout` e a lista de sites, inclusive `nextjs.org`, que não tem skill). Registrado nas decisões.
- **Descartado:** nenhum.

### Fontes consultadas

Em 10/11/2026: Claude Code: [memória](https://code.claude.com/docs/en/memory) e [boas práticas](https://code.claude.com/docs/en/best-practices); GitHub: [instruções de repositório no IDE](https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/customize-copilot/configure-custom-instructions/add-repository-instructions-in-your-ide).
