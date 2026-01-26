---
pkg: '@nocobase/plugin-user-data-sync'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Sincronização de Dados de Usuário

## Introdução

Este recurso permite que você registre e gerencie fontes de sincronização de dados de usuário. Por padrão, uma API HTTP é fornecida, mas outras **fontes de dados** podem ser suportadas através de **plugins**. Ele suporta a sincronização de dados para as **coleções** de **Usuários** e **Departamentos** por padrão, com a possibilidade de estender a sincronização para outros recursos de destino usando **plugins**.

## Gerenciamento e Sincronização de Fontes de Dados

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Se nenhum **plugin** que forneça **fontes de dados** para sincronização de dados de usuário estiver instalado, você pode sincronizar dados de usuário usando a API HTTP. Consulte [Fonte de Dados - HTTP API](./sources/api.md).
:::

## Adicionando uma Fonte de Dados

Após instalar um **plugin** que fornece uma **fonte de dados** para sincronização de dados de usuário, você poderá adicionar a **fonte de dados** correspondente. Apenas as **fontes de dados** habilitadas exibirão os botões "Sincronizar" e "Tarefas".

> Exemplo: WeCom

![](https://static-docs.nocobase.com/202412041053785.png)

## Sincronizando Dados

Clique no botão "Sincronizar" para iniciar a sincronização de dados.

![](https://static-docs.nocobase.com/202412041055022.png)

Clique no botão "Tarefas" para visualizar o status da sincronização. Após a sincronização bem-sucedida, você pode visualizar os dados nas listas de Usuários e Departamentos.

![](https://static-docs.nocobase.com/202412041202337.png)

Para tarefas de sincronização que falharam, você pode clicar em "Tentar Novamente".

![](https://static-docs.nocobase.com/202412041058337.png)

Em caso de falhas na sincronização, você pode investigar o problema através dos logs do sistema. Além disso, os registros de sincronização originais são armazenados no diretório `user-data-sync` dentro da pasta de logs da aplicação.

![](https://static-docs.nocobase.com/202412041205655.png)