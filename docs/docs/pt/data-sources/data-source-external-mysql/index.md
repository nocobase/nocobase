---
pkg: "@nocobase/plugin-data-source-external-mysql"
title: "Fonte de dados externa - MySQL"
description: "Saiba como conectar o MySQL ao NocoBase como banco de dados externo, incluindo versões compatíveis, instalação do plugin, configuração da conexão, escopo das tabelas, permissões e mapeamento de campos."
keywords: "fonte de dados externa,MySQL,banco de dados externo,mapeamento de campos,NocoBase"
---

# MySQL

## Introdução

O MySQL pode ser conectado ao NocoBase como banco de dados externo. Após a conexão, o NocoBase lê as tabelas, os campos e as views do MySQL e os utiliza como tabelas de dados na fonte de dados externa.

Diferentemente do [banco de dados principal](../data-source-main/index.md), a estrutura real das tabelas do MySQL externo continua sendo mantida pelo sistema de negócios original, pelo cliente de banco de dados ou por scripts de migração. O NocoBase é responsável por ler a estrutura, salvar os metadados dos campos e configurar blocos de página, permissões, workflows e APIs.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | MySQL >= 5.7. |
| Versões comerciais | Compatível com as edições Standard, Professional e Enterprise. |
| Plugin correspondente | `@nocobase/plugin-data-source-external-mysql`. |
| Protocolo compatível | Conexão usando o protocolo MySQL. |

Cenários adequados para usar o MySQL externo:

- Conectar os bancos de dados MySQL de sistemas de negócios existentes, como ERP, MES, WMS e CRM
- Criar uma interface de gerenciamento com o NocoBase sem migrar os dados históricos
- Aplicar controle de permissões, processar workflows, corrigir dados ou exibir relatórios de tabelas existentes
- Continuar mantendo a estrutura do banco de dados pelo DBA, por scripts de migração ou pelo sistema original

:::warning Atenção

O MySQL externo não é o banco de dados do sistema do NocoBase. O NocoBase não assume o controle do backup, da restauração, da migração nem das alterações na estrutura das tabelas.

:::

## Instalação do plugin

Este é um plugin comercial. Para obter informações detalhadas sobre a ativação, consulte: [Guia de ativação de plugins comerciais](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Adicionar fonte de dados

Em 「Gerenciamento de fontes de dados」, clique em 「Add new」, selecione MySQL e preencha as informações de conexão.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

As configurações de conexão comuns são as seguintes:

| Configuração | Descrição |
| --- | --- |
| Data source name | Nome identificador da fonte de dados, usado para referenciá-la em blocos de página, permissões, workflows e APIs. Não pode ser alterado após a criação. |
| Data source display name | Nome exibido para a fonte de dados na interface. Recomenda-se usar um nome que os usuários de negócio possam entender, como 「ERP MySQL」 ou 「Banco de pedidos」. |
| Host / Port | Endereço do host e porta do MySQL. A porta padrão normalmente é `3306`. |
| Database | Nome do banco de dados MySQL ao qual se conectar. |
| Username / Password | Nome de usuário e senha usados para conectar ao MySQL. O NocoBase só pode ler os objetos aos quais essa conta tem permissão de acesso; ele não concede permissões nem lê objetos privados de outras contas. |
| Table prefix | Prefixo dos nomes das tabelas. Depois de configurado, o NocoBase lê apenas as tabelas e views que correspondem a esse prefixo e gera, no NocoBase, nomes de tabelas sem o prefixo. |
| Collections / Add all collections | Controla o escopo da conexão. Quando 「Add all collections」 está habilitado, o NocoBase conecta todas as tabelas e views dentro do escopo atual; quando desabilitado, conecta apenas os objetos selecionados em 「Collections」. |
| Enabled the data source | Define se a fonte de dados está habilitada. Quando desabilitada, a configuração da fonte de dados é mantida, mas os blocos de página, as permissões, os workflows e as APIs não podem continuar lendo seus dados. |

:::tip Dica

Se houver muitos objetos no MySQL, reduza primeiro o escopo usando `Database`, `Table prefix` e 「Collections」. Conecte apenas as tabelas e views usadas pelo aplicativo atual; assim, a configuração posterior de permissões, a criação de páginas e a manutenção da sincronização ficam mais simples.

:::

## Selecionar tabelas de dados

Depois de preencher as informações de conexão, clique em 「Load Collections」 para ler as tabelas e views disponíveis no MySQL. Os resultados da leitura serão afetados pela conta de conexão, por `Database`, `Table prefix` e pela configuração de 「Collections」.

Por padrão, 「Add all collections」 fica habilitado, indicando que todas as tabelas e views dentro do escopo atual serão conectadas. Se quiser conectar apenas alguns objetos, desabilite 「Add all collections」 e marque na lista as tabelas ou views necessárias.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Atenção

Uma única fonte de dados externa pode conectar no máximo 500 tabelas ou views por vez. Se houver muitos objetos no MySQL, recomenda-se reduzir primeiro o escopo usando `Database`, `Table prefix` ou 「Collections」.

:::

## Sincronizar e configurar campos

A estrutura das tabelas do MySQL externo é mantida no lado do banco de dados. O NocoBase não cria campos no MySQL externo, não altera tipos de campos nem exclui campos reais.

Quando a estrutura das tabelas no MySQL for alterada, execute 「Sync from database」 na fonte de dados para ler novamente os metadados das tabelas e dos campos. A sincronização atualiza as informações salvas no NocoBase sobre tabelas de dados, campos, chaves primárias, chaves únicas e mapeamentos de tipos de campos, mas não exclui tabelas nem dados reais do MySQL.

Após a sincronização dos campos, é possível configurar no NocoBase o título do campo, o tipo de campo (Field type) e o componente do campo (Field interface). Se for necessário criar campos de relacionamento do NocoBase, os metadados do relacionamento também serão salvos no NocoBase; nenhum campo de chave estrangeira real será adicionado automaticamente à tabela do MySQL.

## Mapeamento de tipos de campos

O NocoBase mapeia automaticamente os tipos de campos do MySQL para o Field type e o Field interface apropriados. Você pode ajustar a forma de exibição na configuração do campo.

Os mapeamentos comuns são os seguintes:

| Tipo de campo do MySQL | NocoBase Field type | Field interface disponível |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TINYTEXT`、`TEXT`、`MEDIUMTEXT`、`LONGTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `YEAR` | `string`、`integer` | Input、Integer、Date。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Atenção

Os tipos de campos do MySQL não compatíveis serão exibidos separadamente na configuração dos campos. Para usar esses campos como campos comuns no NocoBase, é necessário desenvolver um adaptador.

:::

## Chave primária e identificador exclusivo do registro

Recomenda-se que as tabelas de dados usadas para exibir e editar blocos de página tenham uma chave primária ou um campo exclusivo. O NocoBase prioriza a chave primária como identificador exclusivo do registro.

Se a conexão for com uma view, uma tabela sem chave primária ou uma tabela com chave primária composta, será necessário definir manualmente 「Record unique key」 na configuração da tabela de dados. Sem um identificador exclusivo disponível, os blocos de página poderão não conseguir visualizar, editar ou excluir os registros corretamente.

![20260709205547](https://static-docs.nocobase.com/20260709205547.png)
![20260709205609](https://static-docs.nocobase.com/20260709205609.png)

- [Banco de dados externo](./index.md) — Consulte a configuração geral e as instruções de gerenciamento de bancos de dados externos
- [Gerenciamento de fontes de dados](../data-source-manager/index.md) — Consulte a entrada e os métodos de gerenciamento das fontes de dados
- [Campos da tabela de dados](../data-modeling/collection-fields/index.md) — Consulte as instruções sobre tipos de campos e mapeamento de campos