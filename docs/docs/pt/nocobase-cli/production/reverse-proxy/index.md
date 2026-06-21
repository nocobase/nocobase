---
title: "Proxy reverso do ambiente de produção"
description: "Gere e gerencie a configuração de proxy reverso para ambiente NocoBase hospedado por CLI com base em nb proxy nginx e nb proxy caddy."
keywords: "NocoBase,nb proxy nginx,nb proxy caddy, proxy reverso, Nginx, Caddy, ambiente de produção"
---


#Proxy reverso

Este artigo se aplica apenas a aplicativos instalados usando `nb init`.

No NocoBase, o proxy reverso do ambiente de produção faz mais do que simplesmente encaminhar solicitações para o processo de aplicação. Freqüentemente, os detalhes de WebSockets, subcaminhos, recursos estáticos de front-end, diretórios de upload e páginas substitutas de SPA também são tratados ao mesmo tempo.

A função de `nb proxy` é coletar esses detalhes facilmente perdidos em um conjunto estável de entradas de comando.

## Processo central

Se você observar apenas o processo principal, basta lembrar estes três comandos:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Se você estiver usando o Caddy, basta substituir `nginx` no comando por `caddy`.

`use local` e `use docker` podem ser julgados diretamente assim:

- Se o Nginx ou Caddy tiver sido instalado localmente, use `use local`
- Não há instalação local. Se você quiser permitir que a CLI use o Docker para gerenciar o agente, use `use docker`

Na maioria dos cenários, é suficiente executar `use` primeiro, depois `generate` e finalmente `reload`. Para obter detalhes sobre Nginx ou Caddy, continue nas respectivas páginas.

## Quando escolher Nginx e quando escolher Caddy

Geralmente pode ser julgado assim:

| Cenário | Recomendação |
| --- | --- |
| Você já está usando o Nginx para gerenciar seu site, certificados, cache ou controle de acesso | [Nginx](./nginx.md) |
| Você já possui um nome de domínio e deseja executar HTTPS o mais rápido possível e salvar alguns detalhes de TLS para manter | [Caddy](./caddy.md) |

## Continue lendo abaixo

| Eu quero... | Onde procurar |
| --- | --- |
| Siga a entrada do site de gerenciamento Nginx | [Nginx](./nginx.md) |
| Conecte HTTPS o mais rápido possível | [Caddy](./caddy.md) |
| Primeiro ajuste a configuração do ambiente que afetará os resultados do proxy, como `app-port`, `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Primeiro confirme a instalação e configuração do ambiente do aplicativo | [Instalar usando CLI (recomendado)](../../installation/cli.md) |
