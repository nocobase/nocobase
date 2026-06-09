---
title: "Implantação em produção"
description: "Implante o NocoBase em produção com duas etapas finais: habilitar o início automático do aplicativo e configurar um proxy reverso."
keywords: "NocoBase,implantação em produção,nb app autostart,nb env proxy,Nginx,Caddy"
---

# Implantação em produção

Se o seu aplicativo NocoBase já está funcionando corretamente no servidor, normalmente faltam apenas duas etapas para colocá-lo em produção:

1. Garantir que o aplicativo inicie automaticamente após a reinicialização da máquina
2. Colocar um proxy reverso na frente do aplicativo para fornecer acesso externo estável

No NocoBase CLI, os principais comandos são:

- `nb app autostart`
- `nb env proxy`

Esta página explica primeiro o fluxo geral. Para detalhes de Nginx ou Caddy, continue para as respectivas subpáginas.

## Etapa 1: habilitar a inicialização automática do aplicativo

Em produção, a primeira prioridade não é o domínio, e sim garantir que o serviço consiga se recuperar com confiabilidade após reinicializações, recriação de contêineres ou tarefas de manutenção.

No CLI, `nb app autostart` é um grupo de comandos. Os mais usados são:

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Habilite a inicialização automática para o env atual:

```bash
nb app autostart enable
```

Se quiser apontar explicitamente para outro env:

```bash
nb app autostart enable --env app1 --yes
```

Depois, confira quais envs estão marcados para inicialização automática:

```bash
nb app autostart list
```

Após a inicialização do sistema, execute o comando a seguir para iniciar todos os envs com autostart habilitado:

```bash
nb app autostart run
```

Se quiser ver a saída interna de inicialização para troubleshooting:

```bash
nb app autostart run --verbose
```

:::tip O que isso realmente faz

`nb app autostart enable` marca um env gerenciado pelo CLI como autorizado a iniciar automaticamente.  
`nb app autostart run` é o comando que realmente inicia todos os envs marcados para autostart.

Em outras palavras, em um ambiente de produção real, normalmente você ainda precisa integrar `nb app autostart run` ao seu próprio fluxo de inicialização do sistema, por exemplo com `systemd`, um script de inicialização da sua plataforma de contêineres ou outro mecanismo de boot do host que você já utilize.

:::

### Escopo

`nb app autostart` só se aplica a envs com runtime gerenciado pelo CLI na máquina atual:

- `local`
- `docker`

Se o env for apenas uma conexão remota de API, ou se o aplicativo não for gerenciado localmente pelo CLI nesta máquina, esses comandos não são a ferramenta certa para autostart.

## Etapa 2: configurar um proxy reverso

Depois que o aplicativo puder se recuperar automaticamente, o próximo passo é lidar com o ponto de entrada externo. Em produção, o proxy reverso normalmente é responsável por:

- vincular o domínio ou a porta pública
- encaminhar tráfego HTTP e WebSocket para o NocoBase
- lidar com HTTPS, certificados, cache ou controle de acesso

No NocoBase CLI, os pontos de entrada recomendados são:

- `nb env proxy nginx`
- `nb env proxy caddy`

### Abordagem padrão

Se o seu aplicativo já está salvo como um env do CLI e é um env `local` ou `docker`, normalmente basta deixar a CLI gerar a configuração do proxy:

```bash
nb env proxy nginx --env app1 --host app.example.com
nb env proxy caddy --env app1 --host app.example.com
```

Se o env atual já for o env de destino, você pode omitir `--env`:

```bash
nb env proxy nginx --host app.example.com
```

A CLI ajuda a cobrir detalhes que são fáceis de esquecer em configurações escritas manualmente, por exemplo:

- encaminhamento de WebSocket
- caminhos de entrada e de assets estáticos em implantações por subcaminho
- páginas de fallback de SPA
- arquivos de configuração compartilhados do provider

### Quando escolher Nginx ou Caddy

Normalmente você pode decidir assim:

| Cenário | Recomendado |
| --- | --- |
| Você já usa Nginx para sites, cache, certificados ou controle de acesso | [Nginx](./reverse-proxy/nginx.md) |
| Você já tem um domínio e quer colocar HTTPS no ar rapidamente com menos manutenção de TLS | [Caddy](./reverse-proxy/caddy.md) |
| Você quer ver primeiro a explicação geral deste grupo de comandos | [Production Reverse Proxy](./reverse-proxy/index.md) |

Se você alterar configurações do env que afetam o resultado do proxy, como `app-port` ou `app-public-path`, lembre-se de executar novamente o subcomando de proxy correspondente.

## Caminho recomendado para colocar em produção

Se você quer o caminho mais simples para produção, esta ordem costuma funcionar bem:

1. Garanta que o aplicativo já consiga iniciar corretamente no próprio servidor
2. Execute `nb app autostart enable`
3. Adicione `nb app autostart run` ao processo de inicialização do sistema
4. Escolha Nginx ou Caddy e execute o subcomando `nb env proxy` correspondente
5. Verifique o acesso externo pelo domínio final ou pelo endereço público

## Links rápidos

| Eu quero... | Leia isto |
| --- | --- |
| Começar pela explicação geral do proxy reverso | [Production Reverse Proxy](./reverse-proxy/index.md) |
| Continuar usando Nginx na camada de entrada | [Nginx](./reverse-proxy/nginx.md) |
| Usar Caddy para um setup de HTTPS mais rápido | [Caddy](./reverse-proxy/caddy.md) |
| Gerenciar start, stop, logs e upgrades | [Manage Apps](../operations/manage-app.md) |
| Ler a referência CLI de `nb env proxy` | [`nb env proxy`](../../api/cli/env/proxy/index.md) |

## Comandos relacionados

```bash
# Habilitar autostart para um env
nb app autostart enable --env app1 --yes

# Listar o status de autostart
nb app autostart list

# Iniciar todos os envs com autostart habilitado
nb app autostart run

# Gerar configuração de proxy reverso para Nginx
nb env proxy nginx --env app1 --host app.example.com

# Gerar configuração de proxy reverso para Caddy
nb env proxy caddy --env app1 --host app.example.com
```
