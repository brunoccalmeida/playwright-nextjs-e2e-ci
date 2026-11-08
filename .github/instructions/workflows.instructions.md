---
applyTo: '.github/workflows/**'
---

<!-- LTeX: language=pt-BR -->

# Workflows do GitHub Actions

- Toda action por SHA completo do **commit** (descasque a tag anotada), com comentário `# vX.Y.Z`, inclusive `actions/*` (OpenSSF Scorecard): tag é ponteiro móvel.
- O ruleset exige só `ci-passed`, nunca job de matriz (o nome muda com a matriz). Job novo que roda em PR entra no `needs` do gate. Check obrigatório pulado conta como aprovado: por isso o gate usa `always()` e lista de permissão.
