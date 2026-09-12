---
title: "nb proxy"
description: "Referência do grupo de comandos nb proxy: escolha o provider Nginx ou Caddy e gerencie entrypoints de reverse proxy para envs gerenciados pela CLI."
keywords: "nb proxy,NocoBase CLI,nginx,caddy,reverse proxy,configuração de proxy"
---

# nb proxy

No NocoBase CLI, `nb proxy` é o ponto de entrada unificado para o gerenciamento de reverse proxy.

Ele separa o gerenciamento de env da camada de entrada:

- `nb env` salva e mantém os envs da aplicação
- `nb proxy` gera e gerencia entrypoints Nginx ou Caddy para esses envs gerenciados pela CLI

Desde que sua aplicação já tenha sido salva como um env gerenciado pela CLI e esse env seja `local` ou `docker`, normalmente basta escolher um subcomando de provider.

## Uso

```bash
nb proxy <provider> <command>
```

## Árvore de comandos

```bash
nb proxy nginx use <local|docker>
nb proxy nginx current
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
nb proxy nginx start
nb proxy nginx restart
nb proxy nginx reload
nb proxy nginx stop
nb proxy nginx status
nb proxy nginx info

nb proxy caddy use <local|docker>
nb proxy caddy current
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
nb proxy caddy start
nb proxy caddy restart
nb proxy caddy reload
nb proxy caddy stop
nb proxy caddy status
nb proxy caddy info
```

## Providers

| Quero... | Vá para |
| --- | --- |
| Continuar usando Nginx para sites, certificados, cache ou controle de acesso | [`nb proxy nginx`](./nginx/index.md) |
| Colocar HTTPS no ar rapidamente e manter menos detalhes de TLS por conta própria | [`nb proxy caddy`](./caddy/index.md) |
| Ajustar configurações do env que podem afetar o resultado do proxy, como `app-port` ou `app-public-path` | [`nb env update`](../env/update.md) |

## Notas

- `nb proxy` em si não possui flags independentes
- Use `nb proxy nginx` ou `nb proxy caddy` para gerar e gerenciar entrypoints
- Ambos os providers só funcionam para envs gerenciados cuja runtime seja acessível a partir da máquina atual, ou seja, `local` ou `docker`
- Ambos os providers suportam dois drivers: `local` e `docker`
- `use` salva o driver padrão, e `current` imprime diretamente o driver atual
- `generate` grava ou atualiza arquivos de configuração de entrada e não inicia automaticamente o processo do proxy
- `start`, `restart`, `reload`, `stop`, `status` e `info` operam todos sobre a runtime do driver atual
- Se você alterar configurações como `app-port` ou `app-public-path` com `nb env update`, normalmente precisará executar novamente o comando `generate` correspondente depois
- Este grupo de comandos ainda não funciona para envs que tenham apenas uma conexão remota de API nem para envs SSH

## Fluxo típico

```bash
# 1. Escolher provider e driver de runtime
nb proxy nginx use docker

# 2. Gerar a configuração de entrada para um env gerenciado pela CLI
nb proxy nginx generate --env app1 --host app1.example.com

# 3. Iniciar o proxy
nb proxy nginx start

# 4. Inspecionar status e informações de caminho
nb proxy nginx status
nb proxy nginx info

# 5. Recarregar após mudanças de configuração
nb proxy nginx reload
```

Se você escolher Caddy, substitua `nginx` por `caddy` nos comandos acima.

## Diferenças comuns entre os comandos

| Comando | Finalidade |
| --- | --- |
| `use` | Trocar o driver padrão do provider atual |
| `current` | Mostrar o driver atual do provider, como `local` ou `docker` |
| `generate` | Gerar ou atualizar os arquivos de entrada do proxy para um env |
| `start` | Iniciar o proxy com o driver atual |
| `reload` | Recarregar a configuração sem parar o serviço |
| `restart` | Parar e iniciar novamente |
| `stop` | Parar o proxy |
| `status` | Mostrar o status de runtime |
| `info` | Mostrar driver, caminho do arquivo de configuração, runtime root, upstream host e outros detalhes de runtime |

## Exemplos

```bash
# Gerar e iniciar Nginx para um env
nb proxy nginx use docker
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx start

# Gerar e iniciar Caddy para um env
nb proxy caddy use local
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy start
```

## Comandos relacionados

- [`nb proxy nginx`](./nginx/index.md)
- [`nb proxy caddy`](./caddy/index.md)
- [`nb env update`](../env/update.md)
- [`nb env info`](../env/info.md)
- [`nb config`](../config/index.md)
