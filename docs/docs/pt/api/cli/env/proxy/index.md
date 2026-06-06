---
title: 'nb env proxy'
description: 'Referência do tópico nb env proxy: veja os subcomandos de proxy para Nginx e Caddy.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,configuração de proxy'
---

# nb env proxy

No NocoBase CLI, `nb env proxy` agora é um tópico. Ele não gera configuração por conta própria. O principal uso é descobrir os subcomandos de provider para Nginx e Caddy.

Se o app já foi salvo como um env gerenciado pela CLI e esse env é `local` ou `docker`, normalmente basta escolher um dos subcomandos de provider.

## Uso

```bash
nb env proxy
```

## Qual subcomando abrir primeiro

| Quero... | Vá para |
| --- | --- |
| Continuar usando Nginx para sites, certificados, cache ou controle de acesso | [`nb env proxy nginx`](./nginx.md) |
| Colocar o HTTPS no ar rapidamente e manter menos detalhes de TLS | [`nb env proxy caddy`](./caddy.md) |
| Ajustar configurações do env que podem afetar o resultado do proxy, como `app-port` ou `app-public-path` | [`nb env update`](../update.md) |

## Observações

- `nb env proxy` não tem flags próprias
- Quem realmente gera a configuração são `nb env proxy nginx` e `nb env proxy caddy`
- Ambos os subcomandos só funcionam para envs gerenciados cujo runtime está acessível a partir da máquina atual, ou seja, `local` ou `docker`
- Se você mudar configurações como `app-port` ou `app-public-path` com `nb env update`, normalmente precisará executar novamente o subcomando de proxy correspondente
- Este grupo de comandos ainda não funciona para envs que têm apenas conexão remota de API nem para envs SSH
