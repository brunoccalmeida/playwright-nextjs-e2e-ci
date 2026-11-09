---
paths:
  - 'README*.md'
---

<!-- LTeX: language=pt-BR -->

# Números e evidências dos READMEs

Os dois idiomas mudam juntos. `pnpm check:readme` confere o que o repositório sabe responder: total de testes, soma por área, quantidade de known issues, testes com `test.fail` e linhas da tabela de bugs.

O restante é manual, porque descreve um momento passado ou depende de serviço externo. Fica honesto enquanto o texto disser de quando é:

| Manual                                                    | Atualizar quando                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `docs/images/report.png` e a legenda                      | A legenda deixar de ser verdade; não a cada teste novo, porque ela diz de qual execução é |
| `docs/images/pipeline-github.png` e `pipeline-gitlab.png` | Mudarem os jobs ou o gate                                                                 |
| Run do GitHub fixado (jobs, tempo)                        | Mudarem os jobs ou o gate, e antes de o log expirar (padrão de 90 dias)                   |
| Pipeline e job do GitLab fixados (`62 de 62`)             | Rodar o espelho de novo; o número fica, porque é daquele commit                           |
| Versões da linha "Stack"                                  | Atualizar Playwright, Next.js, Payload ou Postgres numa versão que o texto mostra         |
| Título na tabela de bugs (pt-BR)                          | Mudar o título em `docs/KNOWN_ISSUES.md`; a tradução não é derivável                      |
| Frase "no existing file under `src/`" e a comparação      | Um PR tocar em `src/`; refazer o link até o commit novo e rever a frase                   |
