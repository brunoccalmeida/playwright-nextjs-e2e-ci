---
name: payload-docs
description: Consulta a documentação oficial da Payload CMS na versão fixada neste repositório, porque payloadcms.com acompanha a major estável. Use em qualquer dúvida sobre Payload, adaptador Postgres, push e migrations, REST API, Local API, autenticação, access control, hooks, collections, globals, Lexical ou rich text.
---

<!-- LTeX: language=pt-BR -->

Aponta para a doc; não responda de memória nem copie o conteúdo para cá.

1. **Versão:** `payload` em `dependencies` no `package.json`, exata. Chamada de `<v>` abaixo.
2. **Leia o fonte da doc na tag:** `https://raw.githubusercontent.com/payloadcms/payload/v<v>/docs/<seção>/<página>.mdx` (`database/migrations.mdx`, `rest-api/overview.mdx`). Seções: `gh api 'repos/payloadcms/payload/contents/docs?ref=v<v>' --jq '.[].name'`.
3. **Cite** `https://github.com/payloadcms/payload/blob/v<v>/docs/<seção>/<página>.mdx`.
4. **Sem saber a página:** índice da major em `https://payloadcms.com/docs/v<major>/llms.txt` (a raiz `llms.txt` lista as majors; uma beta não vale para nós). Ele acompanha a última versão da major: use para achar a página e leia na tag.
5. **Se a doc não responder:** o código instalado em `node_modules/@payloadcms/`, e diga que veio dali. Foi assim que se confirmou o `push` em `db-postgres/dist/connect.js`.

## Armadilhas já pagas

- O app é congelado: a resposta precisa servir sem mexer em `src/` (salvo migrations, exceção registrada).
- A doc da REST API não define os corpos de resposta: o contrato em `tests/helpers/cms-contract.ts` veio de medição.
- `src/payload-types.ts` declara IDs como `string`, mas com Postgres são `number`. Fora de `production` esse arquivo é regenerado ao conectar: não commite.
- Conexão fora de `production` faz `push` e marca o banco migrado como `dev`; o `db:migrate` seguinte para num prompt.
- Tipo não prova runtime: `SanitizedGlobalConfig` promete `hooks.beforeOperation`, que não existe em globais. Valide executando.
- No Lexical, `keyboard.insertText` não fica no editor; `keyboard.type` funciona.
