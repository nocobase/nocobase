---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Fonte de dados externa - OceanBase"
description: "Saiba como conectar o OceanBase ao NocoBase como banco de dados externo, incluindo versões compatíveis, modo de compatibilidade com MySQL, configuração da conexão, escopo das tabelas, permissões e mapeamento de campos."
keywords: "fonte de dados externa,OceanBase,banco de dados externo,modo de compatibilidade com MySQL,mapeamento de campos,NocoBase"
---

# OceanBase

## Introdução

O OceanBase pode ser conectado ao NocoBase como um banco de dados externo. Após a conexão, o NocoBase lê as tabelas, os campos e as views do OceanBase e os utiliza como tabelas de dados na fonte de dados externa.

Diferentemente do [banco de dados principal](../main/index.md), a estrutura real das tabelas do OceanBase externo continua sendo mantida pelo sistema de negócios original, pelo cliente de banco de dados ou pelos scripts de migração. O NocoBase é responsável por ler a estrutura, salvar os metadados dos campos e configurar blocos de página, permissões, workflows e APIs.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | OceanBase >= 4.3. |
| Versão comercial | Compatível com a edição Enterprise. |
| Plugin correspondente | `@nocobase/plugin-data-source-oceanbase`. |
| Modo do banco de dados | Compatível apenas com o modo de compatibilidade com MySQL. |

Cenários adequados para usar o OceanBase externo:

- Conectar um banco de negócios existente em um tenant MySQL do OceanBase
- Criar uma interface de gerenciamento com o NocoBase sem migrar dados históricos
- Controlar permissões, processar workflows, corrigir dados ou exibir relatórios de tabelas existentes
- Continuar mantendo a estrutura do banco de dados pelo DBA, pelos scripts de migração ou pelo sistema original

:::warning Atenção

Quando usado como banco de dados externo, o OceanBase é compatível apenas com o modo de compatibilidade com MySQL. Se o modo de compatibilidade com Oracle for usado, o NocoBase não poderá ler a estrutura das tabelas e os tipos de campos com o plugin atual.

:::

## Instalação do plugin

Este plugin é comercial. Para obter detalhes sobre a ativação, consulte: [Guia de ativação de plugins comerciais](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Adicionar fonte de dados

Em 「Gerenciamento de fontes de dados」, clique em 「Add new」, selecione OceanBase e preencha as informações de conexão.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

Configurações de conexão comuns:

| Configuração | Descrição |
| --- | --- |
| Data source name | Nome de identificação da fonte de dados, usado para referência em blocos de página, permissões, workflows e APIs. Não pode ser alterado após a criação. |
| Data source display name | Nome exibido da fonte de dados na interface. Recomenda-se usar um nome que os usuários de negócio possam entender, como 「Banco de negócios OceanBase」 ou 「Banco de relatórios」. |
| Host / Port | Endereço e porta de conexão do OceanBase no modo de compatibilidade com MySQL. A porta deve seguir a configuração real do tenant ou proxy. |
| Database | Nome do banco de dados do OceanBase ao qual se conectar. |
| Username / Password | Conta e senha usadas para conectar ao OceanBase. O NocoBase só pode ler os objetos aos quais essa conta tem acesso; ele não concede permissões nem lê objetos privados de outras contas. |
| Table prefix | Prefixo dos nomes das tabelas. Após a configuração, o NocoBase lerá apenas as tabelas e views que correspondem a esse prefixo e gerará, no NocoBase, nomes de tabelas sem o prefixo. |
| Collections / Add all collections | Controla o escopo da conexão. Quando 「Add all collections」 está ativado, o NocoBase conecta todas as tabelas e views dentro do escopo atual; quando desativado, conecta apenas os objetos selecionados em 「Collections」. |
| Enabled the data source | Define se a fonte de dados está ativada. Quando desativada, a configuração da fonte de dados será mantida, mas os blocos de página, as permissões, os workflows e as APIs não poderão continuar lendo seus dados. |

:::tip Dica

Se houver muitos objetos no OceanBase, priorize restringir o escopo por meio de `Database`, `Table prefix` e 「Collections」. Conecte apenas as tabelas e views usadas pelo aplicativo atual; assim, a configuração posterior de permissões, a criação de páginas e a manutenção da sincronização serão mais simples.

:::

## Selecionar tabelas de dados

Depois de preencher as informações de conexão, você pode clicar em 「Load Collections」 para ler as tabelas de dados e as views disponíveis no OceanBase. Os resultados da leitura serão afetados pela conta de conexão, por `Database`, `Table prefix` e pela configuração de 「Collections」.

Por padrão, 「Add all collections」 estará ativado, indicando que todas as tabelas e views dentro do escopo atual serão conectadas. Se quiser conectar apenas alguns objetos, desative 「Add all collections」 e marque na lista as tabelas de dados ou views necessárias.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Atenção

Uma única fonte de dados externa pode conectar no máximo 500 tabelas de dados ou views por vez. Se houver muitos objetos no OceanBase, recomenda-se restringir primeiro o escopo por meio de `Database`, `Table prefix` ou 「Collections」.

:::

## Sincronizar e configurar campos

A estrutura das tabelas do OceanBase externo é mantida no lado do banco de dados. O NocoBase não criará campos, modificará tipos de campos nem excluirá campos reais no OceanBase externo.

Quando a estrutura das tabelas no OceanBase for alterada, você poderá executar 「Sync from database」 na fonte de dados para reler os metadados das tabelas e dos campos. A sincronização atualizará as informações de tabelas, campos, chaves primárias, chaves únicas e mapeamentos de tipos de campos salvas no NocoBase, mas não excluirá as tabelas reais nem os dados no OceanBase.

Após a sincronização dos campos, você poderá configurar no NocoBase o título do campo, o tipo de campo (Field type) e o componente do campo (Field interface). Se precisar criar campos de relacionamento do NocoBase, os metadados de relacionamento também serão salvos no NocoBase; nenhum campo de chave estrangeira real será adicionado automaticamente à tabela do OceanBase.

## Mapeamento de tipos de campos

O NocoBase identifica os tipos de campos do OceanBase de acordo com a lógica de compatibilidade com MySQL e os mapeia automaticamente para o Field type e o Field interface adequados. Você pode ajustar a forma de exibição na interface de configuração do campo.

Os mapeamentos comuns são os seguintes:

| Tipo de campo do OceanBase | NocoBase Field type | Field interface disponíveis |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Atenção

Os tipos de campos do OceanBase que não são compatíveis serão exibidos separadamente na configuração dos campos. Esses campos só poderão ser usados como campos comuns no NocoBase após o desenvolvimento de um adaptador.

:::

## Chave primária e identificador exclusivo do registro

Para tabelas de dados usadas na exibição e edição de blocos de página, recomenda-se ter uma chave primária ou um campo exclusivo. O NocoBase priorizará a chave primária como identificador exclusivo do registro.

Se a conexão for com uma view, uma tabela sem chave primária ou uma tabela com chave primária composta, será necessário definir manualmente 「Record unique key」 na configuração da tabela de dados. Sem um identificador exclusivo disponível, os blocos de página poderão não conseguir visualizar, editar ou excluir registros corretamente.

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

## Links relacionados

- [Banco de dados externo](./index.md) — Consulte a configuração geral e as instruções de gerenciamento de bancos de dados externos
- [Gerenciamento de fontes de dados](../data-source-manager/index.md) — Consulte a entrada das fontes de dados e as formas de gerenciá-las
- [Campos de tabelas de dados](../data-modeling/collection-fields/index.md) — Consulte as instruções sobre tipos de campos e mapeamento de campos