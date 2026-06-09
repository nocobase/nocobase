# Proxy reverso em produção

No NocoBase CLI, há duas entradas recomendadas para colocar um proxy reverso na frente do app em produção:

- `nb env proxy nginx`
- `nb env proxy caddy`

Se o app já foi salvo como um env da CLI e o tipo do env é `local` ou `docker`, normalmente basta deixar a CLI gerar a configuração.

## Qual página abrir primeiro

- Se você já usa Nginx para sites, certificados, cache ou controle de acesso, comece por [Nginx](./nginx.md)
- Se você quer HTTPS rapidamente e prefere manter menos detalhes de TLS, comece por [Caddy](./caddy.md)
- Se quiser ver primeiro a referência de comandos, veja [`nb env proxy`](../../../api/cli/env/proxy/index.md)
