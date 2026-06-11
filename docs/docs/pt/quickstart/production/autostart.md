---
title: "O aplicativo é iniciado automaticamente"
description: "Use nb app autostart para configurar uma entrada de inicialização automática de aplicativo unificado para ambiente NocoBase hospedado pela CLI."
keywords: "NocoBase, inicialização automática de aplicativo, inicialização automática de aplicativo nb, systemd, Docker, PM2"
---


# O aplicativo inicia automaticamente

No NocoBase CLI, `nb app autostart` é usado para gerenciar "quais ambientes têm permissão para iniciar automaticamente" e "como extrair esses ambientes uniformemente após a inicialização do sistema".

Se você pretende executar oficialmente um aplicativo hospedado pela CLI no servidor, essa geralmente é a etapa padrão em um ambiente de produção.

## Por que `nb app autostart` ainda é necessário?

Este problema é muito comum.

Quando muitas pessoas virem isso pela primeira vez, pensarão que como a camada inferior já possui Docker, PM2, ou o próprio sistema já possui `systemd`, por que precisamos de outra camada de `nb app autostart`.

A razão é que essas camadas não resolvem realmente o mesmo problema:

- Recursos como Docker, PM2 e Supervisor resolvem o problema de "como os aplicativos geralmente são executados e como gerenciar os processos dos aplicativos".
- Recursos como `systemd`, `launchd` e scripts de inicialização do host resolvem o problema de "qual comando executar quando o sistema for iniciado?"
- `nb app autostart` resolve o problema de "no nível NocoBase CLI, como gerenciar uniformemente quais ambientes têm permissão para iniciar automaticamente e como ativá-los após a inicialização do sistema"

Em outras palavras, CLI não elimina a necessidade de Docker, PM2 ou Supervisor. Em vez disso, adapta diferentes métodos de gestão de processos de forma unificada e, em seguida, converge-os num conjunto estável de portais de gestão auto-iniciados para reduzir a doença mental do utilizador.

Quando o sistema inicia esta camada, ela continua a ser entregue a `systemd`, `launchd` ou ao script de inicialização do host. Eles são responsáveis ​​por executar quando a máquina inicia:

```bash
nb app autostart run
```

Este comando irá então abrir todos os aplicativos que possuem inicialização automática habilitada.

Sem esta camada, uma vez que o método de operação subjacente é diferente, você precisa se lembrar dos respectivos processos de configuração e recuperação de inicialização automática do Docker, PM2 ou outros métodos. Depois de adicionar `nb app autostart`, você só precisa continuar a lembrar o mesmo conjunto de hábitos de uso do NocoBase CLI.

Se você quiser ver por que esse design é dividido dessa maneira primeiro, continue lendo [nb app design intent](../cli-design/nb-app-design-intent.md#Por que is-nb-app-autostart ainda é necessário).

## Quais são as responsabilidades deste grupo de comandos?

Os mais comumente usados ​​são estes:

- `nb app autostart enable`
- `nb app autostart disable`
- `nb app autostart list`
- `nb app autostart run`

Se você observar apenas os dois níveis de responsabilidade mais comuns, poderá entendê-lo assim:

- `enable` / `disable` são responsáveis por gerenciar se um determinado ambiente permite inicialização automática
- `run` é responsável por puxar todos os ambientes que possuem inicialização automática habilitada durante a fase de inicialização do sistema.

Primeiro habilite o sinalizador de inicialização automática para o ambiente atual:

```bash
nb app autostart enable
```

Se quiser operar em algo diferente do ambiente atual, você pode especificá-lo explicitamente:

```bash
nb app autostart enable --env app1 --yes
```

Depois de habilitá-lo, você pode verificar quais ambientes foram marcados como de inicialização automática:

```bash
nb app autostart list
```

Após a inicialização do sistema, você precisa executar o seguinte comando para obter todos os ambientes com inicialização automática habilitada:

```bash
nb app autostart run
```

Se quiser ver a saída de inicialização subjacente ao solucionar problemas, você pode adicionar:

```bash
nb app autostart run --verbose
```

Se você não quiser mais que um ambiente seja iniciado com o sistema, você também pode cancelar esta marca:

```bash
nb app autostart disable --env app1 --yes
```

## Qual é a sua relação com Docker, PM2 e systemd?

Há um limite aqui que pode ser facilmente confundido.

`nb app` Esta camada resolve o problema de "como o aplicativo é executado". A camada inferior pode se adaptar a diferentes métodos de execução, como Docker e PM2, e pode continuar a ser expandida no futuro.

`nb app autostart` Esta camada resolve o problema de "como obter o ambiente que permite a inicialização automática após a inicialização da máquina". É mais como fornecer um ponto de entrada estável para o mecanismo de inicialização do host, em vez de substituir uma ferramenta específica de gerenciamento de processos.

em outras palavras:

- Recursos como Docker, PM2 e Supervisor estão mais próximos de como os aplicativos são executados
- `systemd`, `launchd`, script de inicialização do host, mais próximo da camada de inicialização do sistema

É por isso que em um ambiente formal, você geralmente precisa conectar `nb app autostart run` ao processo de inicialização do seu próprio sistema, como `systemd`, `launchd`, scripts de inicialização da plataforma de contêiner ou outros mecanismos de inicialização automática do host que você já está usando.

## Escopo de aplicação

`nb app autostart` se aplica apenas a ambientes com um tempo de execução gerenciado por CLI, ou seja:

- `local`
- `docker`

Se este ambiente for apenas uma conexão API remota ou não for um aplicativo em execução sob gerenciamento CLI na máquina atual, esse conjunto de comandos não será adequado para inicialização automática.

##Prática padrão

Na maioria dos cenários, a seguinte sequência é suficiente:

1. Primeiro confirme se o aplicativo pode ser iniciado normalmente na máquina atual
2. Execute `nb app autostart enable --env <name> --yes`
3. Conecte `nb app autostart run` ao sistema para iniciar o processo
4. Reinicie a máquina ou execute manualmente `run` para verificar se ela se recupera normalmente.

Se você ainda precisar configurar a camada de entrada de produção em seguida, continue examinando [proxy reverso](./reverse-proxy/index.md).

## Comandos relacionados

```bash
nb app autostart enable --env app1 --yes
nb app autostart disable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Links relacionados

- [Visão geral da implantação do ambiente de produção](./index.md)
- [Proxy reverso](./reverse-proxy/index.md)
- [nb intenção de design do aplicativo](../cli-design/nb-app-design-intent.md)
- [Gerenciar aplicativo](../operações/manage-app.md)
