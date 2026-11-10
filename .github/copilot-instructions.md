<!-- LTeX: language=pt-BR -->

# Playwright Next.js E2E CI - Regras do projeto

Regras que valem em todo chat, compartilhadas entre Claude Code (`CLAUDE.md` importa este arquivo) e GitHub Copilot.

## O que é este projeto

Suíte Playwright + TypeScript para um app Next.js / Payload CMS (template oficial `website`), com CI e Postgres descartável. O app roda **local e isolado**, com banco novo por job.

**O código do app é congelado:** o 1º commit é o app gerado, intacto, e o código da aplicação mostra diff vazio contra ele; só `package.json`, o lockfile e o `.gitignore` podem divergir. Bug encontrado vai para `docs/KNOWN_ISSUES.md`. Exceção: infraestrutura de execução (migrations, script de seed), registrada com o porquê. Os specs, helpers e testes de integração gerados pelo template não são reescritos e ficam fora do lint da suíte.

## Regra de ouro: todo teste foi visto falhando

Teste que nunca falhou não prova nada. Como o código do app não muda, o RED vem de um destes caminhos:

1. **Teste antes do código de suporte:** escreva o teste usando o cliente de API, o Page Object ou a fixture que ainda não existe; rode e veja FALHAR pelo motivo esperado; implemente o mínimo para passar (GREEN); refatore com tudo verde.
2. **Mutação:** se o teste já nasce verde, altere a expectativa (status, texto, campo) ou o dado e veja-o falhar com uma mensagem que aponta o problema; desfaça.

Registre no commit como o RED foi visto (comando e erro). Portões de qualidade (lint, tipos, CI) seguem a mesma regra: prove com uma sonda que eles reprovam o que devem.

## Melhores práticas sempre

- Havendo mais de um caminho, recomende o indicado pelas melhores práticas e cite o princípio que o sustenta (ex.: YAGNI, fail fast, test isolation).
- Em qualquer situação de dúvida, antes de sugerir o que fazer ou perguntar uma decisão ao usuário, **consulte as melhores práticas mais modernas**, a começar pela documentação oficial na versão usada no projeto, sem citar de memória; a sugestão traz as fontes, a recomendação e o que é julgamento próprio.
- Sem atalhos por conveniência (ex.: `test.skip` para silenciar falha, `// eslint-disable` sem motivo, `any`). Desvios só com justificativa explícita no commit ou na documentação.
- Regra deste arquivo que não siga as melhores práticas deve ser substituída, não contornada.

## Ciclo de missão (uma missão por chat)

Contexto longo degrada a qualidade; cada chat cuida de **uma missão** (uma GitHub Issue) e **o estado mora no repositório, não na conversa**.

**Início de cada chat** (automático, e também quando o usuário disser "próxima missão"):

1. Ler `docs/PROJECT_SESSION_SUMMARY.md`.
2. Listar issues e PRs abertos (`gh issue list`, `gh pr list`).
3. Propor a missão de maior prioridade e confirmar com o usuário. Prioridade: bloqueio → segurança → visibilidade → dívida técnica (labels `priority: P0/P1/P2`). No empate, a issue de menor número, porque cada missão se apoia nas anteriores.

**Fechamento** (automático): skill `/close-mission`, a Definition of Done; o registro de sessão vai no PR da própria missão.

## Gasto de tokens (contexto)

- Filtre saídas na origem (`grep`, `head`, `--jq`, `gh run view --log-failed`, `--reporter=line`); nunca despeje log inteiro.
- Subagente só com motivo: trabalho paralelo independente, saída volumosa ou revisor independente.

## Espere o estado ficar pronto antes de agir

Toda leitura ou decisão após uma ação espera o **resultado** da ação, nunca um estado intermediário. Pergunte: _"isto vê o resultado, ou um estado que ainda está mudando?"_

- **"Ainda não sei" não é "sim".** Pendente, `UNKNOWN` ou resposta vazia significam _esperar_.
- **Espere por condição, nunca por tempo.**
- **Checks de CI:** logo após um push, os checks verdes ainda são do commit anterior; consulte pelo SHA da head atual, e check ausente é pendente.

## Diagnóstico de erros

Nunca "chute" soluções. Antes de propor uma correção:

1. **Observe:** mensagem completa, stack trace, trace ou screenshot.
2. **Contextualize:** código ao redor, padrões do projeto.
3. **Investigue:** o mesmo padrão em outros lugares; compare com o que funciona.
4. **Causa raiz**, não sintoma: bug do teste, do app (vai para `KNOWN_ISSUES.md`) ou do ambiente?
5. **Corrija** de forma consistente com a arquitetura, em todos os locais afetados.
6. **Valide:** sem regressão; repita a execução se a falha era intermitente.

Ao reportar um erro: **erro observado**, **causa raiz**, **análise**, **solução proposta** com justificativa e **prevenção**.

## Comunicação

- Conversa e documentação interna (regras, resumo de sessão) em **português (Brasil)**.
- Em **inglês**: código, commits, issues, PRs, README principal e `docs/KNOWN_ISSUES.md`. O critério é quem lê: o que é público segue o idioma do código.
- Explicar o **porquê**, não só o quê; opiniões fundamentadas, não só concordância.

## Segurança

- Nunca commitar credenciais; `.env` fica fora do Git.
- **Configuração** (URL, credenciais) vem de variáveis de ambiente validadas na inicialização; nunca no código.
- Não contorne as travas do agente nem a proteção da `main`.

## Git e Pull Requests

- **Conventional Commits** (`feat`, `fix`, `refactor`, `test`, `docs`, `style`, `perf`, `build`, `ci`, `chore`; escopo opcional), commits atômicos.
- Antes de commitar: `pnpm check` verde.
- **Nada vai direto para a `main`:** o agente commita e faz push em branch própria e abre o PR para a `main`.
- **Um PR aberto por vez**; trabalho pronto espera em commit local até a fila esvaziar.
- **Merge só pelo usuário** (skill `/ship-pr`). Nunca `--admin` para furar proteção de branch.
- Ruleset, repositório e demais configurações públicas: confirmar com o usuário antes.

## Princípios

Explícito é melhor que implícito; simples é melhor que complexo; legibilidade conta; erros nunca passam em silêncio; diante da ambiguidade, recuse a tentação de adivinhar.
