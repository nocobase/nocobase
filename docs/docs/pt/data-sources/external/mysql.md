---
pkg: "@nocobase/plugin-data-source-external-mysql"
title: "Fonte de dados externa - MySQL"
description: "Saiba como integrar o MySQL ao NocoBase como banco de dados externo, incluindo versões compatíveis, instalação do plugin, configuração da conexão, escopo das tabelas, permissões e mapeamento de campos."
keywords: "fonte de dados externa,MySQL,banco de dados externo,mapeamento de campos,NocoBase"
---

# MySQL

## Introdução

O MySQL pode ser integrado ao NocoBase como banco de dados externo. Após a integração, o NocoBase lerá as tabelas, os campos e as visualizações do MySQL e os utilizará como tabelas de dados na fonte de dados externa.

Diferentemente do [banco de dados principal](../main/index.md), a estrutura real das tabelas do MySQL externo continua sendo mantida pelo sistema de negócios original, pelo cliente de banco de dados ou pelos scripts de migração. O NocoBase é responsável por ler a estrutura, salvar os metadados dos campos e configurar blocos de página, permissões, fluxos de trabalho e APIs.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | MySQL >= 5.7. |
| Versões comerciais | Compatível com as edições Standard, Professional e Enterprise. |
| Plugin correspondente | `@nocobase/plugin-data-source-external-mysql`. |
| Protocolo compatível | Usa o protocolo MySQL para a conexão. |

Cenários adequados para usar o MySQL externo:

- Integrar o banco de dados MySQL de sistemas de negócios existentes, como ERP, MES, WMS e CRM
- Criar uma interface de gerenciamento com o NocoBase sem migrar os dados históricos
- Aplicar controle de permissões, processamento de fluxos, correção de dados ou exibição de relatórios às tabelas existentes
- Continuar mantendo a estrutura do banco de dados por meio do DBA, de scripts de migração ou do sistema original

:::warning Atenção

O MySQL externo não é o banco de dados do sistema NocoBase. O NocoBase não assumirá o controle do backup, da restauração, da migração nem das alterações na estrutura das tabelas.

:::

## Instalação do plugin

Este é um plugin comercial. Para obter detalhes sobre a ativação, consulte o [Guia de ativação de plugins comerciais](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Adicionar fonte de dados

Em «Gerenciamento de fontes de dados», clique em «Add new», selecione MySQL e preencha as informações de conexão.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

As configurações de conexão comuns são as seguintes:

| Configuração | Descrição |
| --- | --- |
| Data source name | Nome de identificação da fonte de dados, usado para referenciá-la em blocos de página, permissões, fluxos de trabalho e APIs. Não pode ser alterado após a criação. |
| Data source display name | Nome exibido da fonte de dados na interface. Recomenda-se usar um nome compreensível para os usuários de negócio, como «ERP MySQL» ou «Banco de pedidos». |
| Host / Port | Endereço do host e porta do MySQL. A porta padrão geralmente é `3306`. |
| Database | Nome do banco de dados MySQL ao qual se conectar. |
| Username / Password | Conta e senha usadas para conectar ao MySQL. O NocoBase só pode ler os objetos aos quais essa conta tem acesso; não concederá permissões nem lerá objetos privados de outras contas. |
| Table prefix | Prefixo dos nomes das tabelas. Após configurado, o NocoBase lerá apenas as tabelas e visualizações que correspondam a esse prefixo e gerará no NocoBase nomes de tabelas sem o prefixo. |
| Collections / Add all collections | Controla o escopo da integração. Quando «Add all collections» está ativado, o NocoBase integra todas as tabelas e visualizações do escopo atual; quando desativado, integra apenas os objetos selecionados em «Collections». |
| Enabled the data source | Define se a fonte de dados está ativada. Quando desativada, a configuração da fonte de dados será mantida, mas os blocos de página, as permissões, os fluxos de trabalho e as APIs não poderão mais ler seus dados. |

:::tip Dica

Se houver muitos objetos no MySQL, restrinja primeiro o escopo por meio de `Database`, `Table prefix` e «Collections». Integre apenas as tabelas e visualizações usadas pelo aplicativo atual; assim, a configuração posterior de permissões, a criação de páginas e a manutenção da sincronização serão mais simples.

:::

## Selecionar tabelas de dados

Depois de preencher as informações de conexão, você pode clicar em «Load Collections» para ler as tabelas e visualizações disponíveis no MySQL. Os resultados da leitura serão afetados pela conta de conexão, por `Database`, `Table prefix` e pela configuração de «Collections».

Por padrão, «Add all collections» estará ativado, indicando que todas as tabelas e visualizações do escopo atual serão integradas. Se quiser integrar apenas alguns objetos, desative «Add all collections» e selecione na lista as tabelas ou visualizações necessárias.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Atenção

Uma única fonte de dados externa pode integrar no máximo 500 tabelas ou visualizações por vez. Se houver muitos objetos no MySQL, recomenda-se restringir primeiro o escopo por meio de `Database`, `Table prefix` ou «Collections».

:::

## Sincronizar e configurar campos

A estrutura das tabelas do MySQL externo é mantida no lado do banco de dados. O NocoBase não criará campos, modificará tipos de campos nem excluirá campos reais no MySQL externo.

Quando a estrutura das tabelas no MySQL for alterada, você poderá executar «Sync from database» na fonte de dados para ler novamente os metadados das tabelas e dos campos. A sincronização atualizará no NocoBase as informações salvas sobre tabelas de dados, campos, chaves primárias, chaves únicas e mapeamentos de tipos de campos, mas não excluirá as tabelas nem os dados reais do MySQL.

Após a sincronização dos campos, você poderá configurar no NocoBase o título do campo, o tipo de campo (Field type) e o componente do campo (Field interface). Se precisar criar campos de relacionamento do NocoBase, os metadados do relacionamento também serão salvos no NocoBase, sem adicionar automaticamente campos de chave estrangeira reais às tabelas do MySQL.

## Mapeamento de tipos de campos

O NocoBase mapeará automaticamente os tipos de campos do MySQL para um Field type e um Field interface adequados. Você pode ajustar a forma de exibição da interface na configuração do campo.

Os mapeamentos comuns são os seguintes:

| Tipo de campo MySQL | NocoBase Field type | Field interface opcional |
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

Os tipos de campos MySQL não compatíveis serão exibidos separadamente na configuração dos campos. Esses campos só poderão ser usados como campos comuns no NocoBase após o desenvolvimento de uma adaptação.

:::

## Chave primária e identificador único do registro

Para tabelas de dados usadas na exibição e edição em blocos de página, recomenda-se ter uma chave primária ou um campo exclusivo. O NocoBase usará preferencialmente a chave primária como identificador único do registro.

Se a integração for de uma visualização, de uma tabela sem chave primária ou de uma tabela com chave primária composta, será necessário definir manualmente «Record unique key» na configuração da tabela de dados. Sem um identificador único disponível, os blocos de página poderão não conseguir visualizar, editar ou excluir registros corretamente.

![20260709205547](https://static-docs.nocobase.com/20260709205547.png)
![20260709205609](https://static-docs.nocobase.com/20260709205609.png)

- [Banco de dados externo](./index.md) — Consulte as configurações gerais e as instruções de gerenciamento de bancos de dados externos
- [Gerenciamento de fontes de dados](../data-source-manager/index.md) — Consulte a entrada das fontes de dados e como gerenciá-las
- [Campos da tabela de dados](../data-modeling/collection-fields/index.md) — Consulte as instruções sobre tipos de campos e mapeamento de campos