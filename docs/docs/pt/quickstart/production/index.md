---
title: "Implantação em produção"
description: "Conclua rapidamente a implantação em produção do NocoBase: primeiro configure o auto-start da aplicação e depois o reverse proxy."
keywords: "NocoBase,implantação em produção,nb app autostart,nb proxy nginx,nb proxy caddy,Nginx,Caddy"
---

# Implantação em produção

Se a sua aplicação NocoBase já consegue rodar normalmente no servidor, uma publicação em produção normalmente só precisa de mais duas coisas:

1. garantir que a aplicação consiga se recuperar automaticamente depois que a máquina for reiniciada
2. adicionar um entrypoint de reverse proxy para que a aplicação possa ser acessada de fora de forma estável

No NocoBase CLI, os principais grupos de comandos para isso são:

- `nb app autostart`
- `nb proxy`

Esta página explica primeiro o caminho geral. Para detalhes de Nginx ou Caddy, continue nas páginas específicas de cada provider.

## Etapa 1: configurar o auto-start da aplicação

Em produção, a primeira prioridade não é o nome de domínio, mas sim garantir que o serviço consiga se recuperar de forma confiável. Caso contrário, depois de reiniciar a máquina, recriar containers ou realizar operações de manutenção, a aplicação pode não voltar automaticamente.

Os subcomandos mais comuns de `nb app autostart` são:

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Ative o auto-start para o env atual:

```bash
nb app autostart enable
```

Se o destino não for o env atual, especifique-o explicitamente:

```bash
nb app autostart enable --env app1 --yes
```

Verifique quais envs estão marcados para auto-start:

```bash
nb app autostart list
```

Depois que o sistema iniciar, execute todos os envs ativados:

```bash
nb app autostart run
```

Se você quiser ver a saída detalhada de inicialização durante a depuração:

```bash
nb app autostart run --verbose
```

:::tip O que esta etapa realmente faz

`nb app autostart enable` marca um env gerenciado pela CLI como permitido para iniciar automaticamente. `nb app autostart run` realmente inicia todos os envs que têm o auto-start habilitado.

Em produção, normalmente você ainda precisará conectar `nb app autostart run` ao seu próprio fluxo de inicialização do sistema, como `systemd`, um script de startup da plataforma de containers ou outro mecanismo de auto-start no nível do host que você já use.

:::

### Aplicabilidade

`nb app autostart` só funciona para envs com runtime gerenciada pela CLI:

- `local`
- `docker`

Se um env for apenas uma conexão de API remota, ou se a aplicação não for gerenciada localmente pela CLI na máquina atual, este grupo de comandos não é o caminho certo para auto-start.

## Etapa 2: configurar o reverse proxy

Depois que a aplicação consegue se recuperar automaticamente, o próximo passo é cuidar do entrypoint externo. Em produção, o reverse proxy normalmente é responsável por:

- associar o nome de domínio ou a porta de entrada
- encaminhar requisições HTTP e WebSocket para o NocoBase
- lidar com HTTPS, certificados, cache ou controle de acesso

Os entrypoints de CLI recomendados são:

- `nb proxy nginx`
- `nb proxy caddy`

### Fluxo padrão

Se a aplicação já foi salva como um env da CLI e esse env é `local` ou `docker`, o caminho mais comum é deixar que a CLI gere a configuração diretamente:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com

nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
```

Depois disso, inicie o provider escolhido:

```bash
nb proxy nginx start
nb proxy caddy start
```

A CLI também ajuda com detalhes que são fáceis de esquecer em configurações feitas manualmente, como:

- encaminhamento de WebSocket
- URLs de entrada e assets sob subpaths
- páginas de fallback de SPA
- arquivos de configuração compartilhados no nível do provider

### Quando escolher Nginx ou Caddy

| Cenário | Recomendação |
| --- | --- |
| Você já usa Nginx para gerenciar sites, cache, certificados ou controle de acesso | [Nginx](./reverse-proxy/nginx.md) |
| Você já tem um domínio e quer colocar o HTTPS no ar rapidamente com menos detalhes de TLS para manter | [Caddy](./reverse-proxy/caddy.md) |
| Você quer primeiro ver a introdução geral | [Reverse Proxy em produção](./reverse-proxy/index.md) |

Se depois você alterar configurações do env como `app-port` ou `app-public-path` que afetem o comportamento do proxy, execute novamente o subcomando de proxy correspondente.

## Caminho padrão de rollout

Para o rollout em produção mais simples, esta sequência normalmente é suficiente:

1. confirmar que a aplicação já consegue iniciar normalmente no próprio servidor
2. executar `nb app autostart enable`
3. conectar `nb app autostart run` ao fluxo de inicialização do sistema
4. escolher Nginx ou Caddy e executar o subcomando `nb proxy` correspondente
5. verificar o acesso externo por meio do nome de domínio ou do endereço de entrada

## Índice rápido

| Quero... | Vá para |
| --- | --- |
| Ler primeiro a introdução geral de reverse proxy | [Reverse Proxy em produção](./reverse-proxy/index.md) |
| Continuar usando Nginx na camada de entrada | [Nginx](./reverse-proxy/nginx.md) |
| Usar Caddy para colocar o HTTPS no ar mais rápido | [Caddy](./reverse-proxy/caddy.md) |
| Ver operações de start, stop, logs e upgrade da aplicação | [Gerenciar a aplicação](../operations/manage-app.md) |
| Ler a referência de CLI de `nb proxy nginx` | [`nb proxy nginx`](../../api/cli/proxy/nginx/index.md) |
| Ler a referência de CLI de `nb proxy caddy` | [`nb proxy caddy`](../../api/cli/proxy/caddy/index.md) |

## Comandos relacionados

```bash
# Ativar auto-start para um env
nb app autostart enable --env app1 --yes

# Verificar o estado do auto-start
nb app autostart list

# Iniciar todos os envs habilitados
nb app autostart run

# Escolher a runtime do Nginx e gerar a configuração
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com
nb proxy nginx start

# Escolher a runtime do Caddy e gerar a configuração
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
nb proxy caddy start
```
