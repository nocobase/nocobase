---
title: "Visão geral da implantação do ambiente de produção"
description: "Instruções gerais para implementação do ambiente de produção: Depois de confirmar que o aplicativo está sendo executado normalmente, adicione as entradas de inicialização automática e proxy reverso do aplicativo."
keywords: "NocoBase, implantação de ambiente de produção, visão geral, inicialização automática de aplicativos, proxy reverso, Nginx, Caddy"
---


# Visão geral da implantação do ambiente de produção

Se o seu NocoBase já pode ser executado normalmente no servidor, normalmente você precisará adicionar mais dois recursos antes de ser lançado oficialmente:

1. Permita que o aplicativo retome a execução automaticamente após a máquina ser reiniciada.
2. Conecte a entrada do proxy reverso ao aplicativo para fornecer acesso estável ao mundo externo.

Correspondendo ao NocoBase CLI, consiste principalmente nos dois conjuntos de comandos a seguir:

- `nb app autostart`
- `nb proxy`

Este conjunto de documentos está dividido principalmente em duas partes:

1. Inicialização automática do aplicativo: permite que o aplicativo retome a execução após a reinicialização da máquina
2. Proxy reverso: fornece uma entrada de acesso externo estável para aplicativos

Você pode primeiro ver qual peça você precisa mais atualmente e depois entrar na página correspondente.

## Quais problemas essas duas peças resolvem no ambiente de produção?

Quer dizer:

- `nb app autostart` resolve o problema de "como retomar a operação de aplicativos após a inicialização do sistema"
- `nb proxy` resolve o problema de "como fornecer acesso estável ao mundo exterior"

:::tip Por que você não usa diretamente o Docker, PM2 ou a configuração de inicialização automática do próprio Supervisor aqui?

`nb app autostart` não ignora esses métodos de gerenciamento de processos, mas adapta uniformemente diferentes métodos de gerenciamento de processos e, em seguida, os converge em um conjunto estável de entradas de gerenciamento de inicialização automática. Dessa forma, você não precisa se lembrar de um conjunto diferente de configurações de inicialização automática porque a camada subjacente é Docker, PM2 ou Supervisor, que pode ser suportada no futuro.

Quando o sistema iniciar esta camada, ela continuará a ser processada por `systemd`, `launchd` ou pelo script de inicialização do host. Eles são responsáveis ​​por executar uma vez quando a máquina inicia:

```bash
nb app autostart run
```

Este comando irá então abrir todos os aplicativos que possuem inicialização automática habilitada.

Aqui estão duas camadas de coisas que não devem ser misturadas:

- Recursos como Docker, PM2 e Supervisor estão mais próximos de "como os aplicativos geralmente são executados e como gerenciar os processos dos aplicativos".
- Recursos como `systemd`, `launchd` e scripts de inicialização do host estão mais próximos de "qual comando executar quando o sistema for iniciado"

Se acontecer de você ficar preso aqui "Por que você precisa de `nb app autostart`", continue lendo [Início automático do aplicativo](./autostart.md) e [nb intenção de design do aplicativo](../cli-design/nb-app-design-intent.md).

:::

## Qual página devo olhar agora?

| Eu quero... | Onde procurar |
| --- | --- |
| Deixe o servidor reiniciar primeiro e então o aplicativo poderá retomar a execução automaticamente | [Início automático do aplicativo](./autostart.md) |
| Primeiro entenda a relação de entrada do Nginx/Caddy nesta CLI | [Proxy reverso](./reverse-proxy/index.md) |
| Continue usando o Nginx para gerenciar a entrada do site | [Nginx](./reverse-proxy/nginx.md) |
| Conecte HTTPS o mais rápido possível e mantenha menos detalhes de TLS | [Caddy](./reverse-proxy/caddy.md) |
| Visualize a inicialização, parada, logs e atualizações do próprio aplicativo | [Gerenciar aplicativo](../operations/manage-app.md) |

## Antes de entrar no ambiente de produção, confirme estes pré-requisitos

- O aplicativo foi salvo como ambiente CLI
- A aplicação pode ser iniciada normalmente no próprio servidor
- Se você for se conectar ao proxy reverso, `appPort` foi salvo no env
- Se você está pronto para abri-lo oficialmente para o mundo exterior, você já planejou o nome de domínio, a porta de entrada e a solução HTTPS.

Se você não concluiu a instalação da CLI ou a inicialização do ambiente, volte para [Instalação usando CLI (recomendado)](../installation/cli.md).

Se o comando solicitar que env está faltando `appPort`, primeiro execute [`nb env update`](../../api/cli/env/update.md) para preenchê-lo.

## Links relacionados

- [Início automático do aplicativo](./autostart.md)
- [Proxy reverso](./reverse-proxy/index.md)
- [Nginx](./reverse-proxy/nginx.md)
- [Caddy](./reverse-proxy/caddy.md)
- [Gerenciar aplicativo](../operations/manage-app.md)
