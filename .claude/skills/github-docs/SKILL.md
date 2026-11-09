---
name: github-docs
description: Consulta a documentação oficial do GitHub pela rota legível por máquina e a fonte certa para actions fixadas. Use em qualquer dúvida sobre GitHub Actions, workflows, segurança de workflows, fixação de actions, Dependabot, rulesets, branch protection, GitHub Pages, licença do repositório, API do GitHub, gh CLI ou Copilot.
---

<!-- LTeX: language=pt-BR -->

Aponta para a doc; não responda de memória nem copie o conteúdo para cá.

O GitHub.com não tem versão a fixar: a doc vale para `free-pro-team@latest`. O que tem versão é cada action, e ela fica fixada nos workflows.

1. **Achar a página:** índice em `https://docs.github.com/llms.txt`, ou a Search API, `https://docs.github.com/api/search/v1?query=<termos>&language=en&version=free-pro-team@latest`. Os caminhos mudam com o tempo: em 404, procure de novo.
2. **Ler a página em Markdown:** acrescente `.md` à URL (`https://docs.github.com/en/actions/reference/security/secure-use.md`), bem menor que o HTML.
3. **Cite** a URL normal, sem `.md`.
4. **Comportamento de uma action:** a doc dela é o README e o código **na tag ou no SHA fixado** em `.github/workflows/ci.yml`, não na branch padrão. `gh api 'repos/<dono>/<action>/contents/<arquivo>?ref=<sha>'`.

## Armadilhas já pagas

- No PowerShell 5.1, aspas duplas dentro de `--jq` chegam quebradas ao `gh`: use o Bash.
- A doc pode não cobrir o caso. O Dependabot não atualiza imagem em `container:` (inferência da doc somada a um PR real); o `gitleaks-action` varre só o intervalo de commits do evento (lido no código da action).
- Commit de terceiros em PR do Dependabot faz ele parar de rebasear; a mensagem com `[dependabot skip]` permite sobrescrever.
- Detecção de licença é medível por branch: `GET /repos/<dono>/<repo>/license?ref=<branch>`; compare o `sha` da resposta com `git rev-parse <branch>:LICENSE`.
