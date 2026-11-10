---
paths:
  - 'CLAUDE.md'
  - '.github/copilot-instructions.md'
  - '.claude/rules/**'
  - '.github/instructions/**'
  - '.claude/settings.json'
---

<!-- LTeX: language=pt-BR -->

# Regras dos agentes

- Regras sempre carregadas < 200 linhas; regra de uma parte do código vai para arquivo com escopo de caminho (`.claude/rules/` e `.github/instructions/`). `scripts/check-agent-rules.ts` garante o limite e que as duas cópias sejam iguais.
- Regra sempre carregada vale para toda sessão e todo agente e não perde a validade: estado do projeto e versões ficam fora.
- Não repita o que lint/tipos/testes já impõem; regra sem exceção vira lint, teste ou hook.
- Travas do Claude Code em `.claude/settings.json` (`permissions.deny`): merge `--admin`, force push, push na `main` e leitura/escrita do `.env`. Regra nova vale para `Bash(...)` **e** `PowerShell(...)` e só entra provada por sonda. Elas casam o texto do comando, não são fronteira de segurança: a fronteira é o ruleset da `main` no GitHub.
