---
pkg: "@nocobase/plugin-data-source-external-mariadb"
title: "Fonte de dados externa - MariaDB"
description: "Saiba como integrar o MariaDB ao NocoBase como banco de dados externo, incluindo versões compatíveis, instalação do plugin, configuração da conexão, escopo de tabelas, permissões e mapeamento de campos."
keywords: "fonte de dados externa,MariaDB,banco de dados externo,mapeamento de campos,NocoBase"
---

# MariaDB

## Introdução

O MariaDB pode ser integrado ao NocoBase como banco de dados externo. Após a integração, o NocoBase lê as tabelas, os campos e as views do MariaDB e os utiliza como tabelas de dados na fonte de dados externa.

Diferentemente do [banco de dados principal](../main/index.md), a estrutura real das tabelas do MariaDB externo continua sendo mantida pelo sistema de negócios original, pelo cliente de banco de dados ou por scripts de migração. O NocoBase é responsável por ler a estrutura, armazenar os metadados dos campos e configurar blocos de página, permissões, workflows e APIs.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | MariaDB >= 10.3. |
| Versões comerciais | Compatível com as edições Standard, Professional e Enterprise. |
| Plugin correspondente | `@nocobase/plugin-data-source-external-mariadb`. |
| Protocolo compatível | Utiliza o protocolo MySQL para a conexão; o mapeamento de campos segue, em geral, a lógica de compatibilidade do MySQL. |

Cenários adequados para usar o MariaDB externo:

- Integrar bancos de dados MariaDB de sistemas de negócios existentes, como ERP, MES, WMS e CRM
- Criar uma interface de gerenciamento com o NocoBase sem migrar dados históricos
- Controlar permissões, processar fluxos, corrigir dados ou exibir relatórios de tabelas existentes
- Continuar mantendo a estrutura do banco de dados pelo DBA, por scripts de migração ou pelo sistema original

:::warning Atenção

O MariaDB externo não é o banco de dados do sistema NocoBase. O NocoBase não assume o controle do backup, da restauração, da migração ou das alterações na estrutura das tabelas.

:::

## Instalação do plugin

Este plugin é comercial. Para obter informações detalhadas sobre a ativação, consulte: [Guia de ativação de plugins comerciais](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Adicionar fonte de dados

Em 「Gerenciamento de fontes de dados」, clique em 「Add new」, selecione MariaDB e preencha as informações de conexão.

![20260709204413](https://static-docs.nocobase.com/20260709204413.png)

As configurações de conexão mais comuns são:

| Configuração | Descrição |
| --- | --- |
| Data source name | Nome de identificação da fonte de dados, usado para referenciá-la em blocos de página, permissões, workflows e APIs. Não pode ser alterado após a criação. |
| Data source display name | Nome exibido para a fonte de dados na interface. Recomenda-se usar um nome compreensível para os usuários de negócio, como 「ERP MariaDB」 ou 「Banco de pedidos」. |
| Host / Port | Endereço do host e porta do MariaDB. A porta padrão normalmente é `3306`. |
| Database | Nome do banco de dados MariaDB ao qual se conectar. |
| Username / Password | Nome de usuário e senha usados para conectar ao MariaDB. O NocoBase só pode ler os objetos aos quais essa conta tem acesso; não concede permissões nem lê objetos privados de outras contas. |
| Table prefix | Prefixo dos nomes das tabelas. Após configurado, o NocoBase lê apenas as tabelas e views que correspondem a esse prefixo e gera, no NocoBase, nomes de tabelas sem o prefixo. |
| Collections / Add all collections | Controla o escopo da integração. Quando 「Add all collections」 está habilitado, o NocoBase integra todas as tabelas e views dentro do escopo atual; quando desabilitado, integra apenas os objetos selecionados em 「Collections」. |
| Enabled the data source | Define se esta fonte de dados está habilitada. Quando desabilitada, a configuração da fonte de dados é mantida, mas os blocos de página, as permissões, os workflows e as APIs não podem continuar lendo seus dados. |

:::tip Dica

Se houver muitos objetos no MariaDB, restrinja primeiro o escopo usando `Database`, `Table prefix` e 「Collections」. Integre apenas as tabelas e views usadas pelo aplicativo atual; assim, a configuração posterior de permissões, a criação de páginas e a manutenção da sincronização serão mais simples.

:::

## Selecionar tabelas de dados

Depois de preencher as informações de conexão, você pode clicar em 「Load Collections」 para ler as tabelas e views disponíveis no MariaDB. Os resultados da leitura serão afetados pela conta de conexão, por `Database`, `Table prefix` e pela configuração de 「Collections」.

Por padrão, 「Add all collections」 fica habilitado, indicando que todas as tabelas e views dentro do escopo atual serão integradas. Se quiser integrar apenas alguns objetos, desabilite 「Add all collections」 e selecione na lista as tabelas ou views necessárias.

![20260709204452](https://static-docs.nocobase.com/20260709204452.png)

:::warning Atenção

Uma única fonte de dados externa pode integrar no máximo 500 tabelas ou views por vez. Se houver muitos objetos no MariaDB, recomenda-se restringir primeiro o escopo usando `Database`, `Table prefix` ou 「Collections」.

:::

## Sincronizar e configurar campos

A estrutura das tabelas do MariaDB externo é mantida no lado do banco de dados. O NocoBase não cria campos, altera tipos de campos nem exclui campos reais no MariaDB externo.

Quando a estrutura das tabelas no MariaDB for alterada, você pode executar 「Sync from database」 na fonte de dados para ler novamente os metadados das tabelas e dos campos. A sincronização atualiza no NocoBase as informações armazenadas sobre tabelas de dados, campos, chaves primárias, chaves únicas e mapeamento de tipos de campos, mas não exclui as tabelas ou os dados reais no MariaDB.

Após a sincronização dos campos, você pode configurar no NocoBase o título do campo, o tipo de campo (Field type) e o componente do campo (Field interface). Se precisar criar campos de relacionamento do NocoBase, os metadados do relacionamento também serão armazenados no NocoBase; nenhum campo de chave estrangeira real será adicionado automaticamente à tabela do MariaDB.

## Mapeamento de tipos de campos

O NocoBase mapeia automaticamente os tipos de campos do MariaDB para o Field type e o Field interface apropriados. O mapeamento dos campos comuns do MariaDB é basicamente igual ao do MySQL, e você pode ajustar a forma de exibição da interface na configuração do campo.

Os mapeamentos comuns são:

| Tipo de campo do MariaDB | NocoBase Field type | Field interface disponível |
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

Os tipos de campos do MariaDB que não são compatíveis serão exibidos separadamente na configuração dos campos. Para usar esse tipo de campo como um campo comum no NocoBase, é necessário desenvolver uma adaptação.

:::

## Chave primária e identificador único do registro

Recomenda-se que as tabelas de dados usadas para exibição e edição em blocos de página tenham uma chave primária ou um campo exclusivo. O NocoBase prioriza a chave primária como identificador único do registro.

Se a integração for de uma view, de uma tabela sem chave primária ou de uma tabela com chave primária composta, será necessário definir manualmente 「Record unique key」 na configuração da tabela de dados. Sem um identificador único disponível, os blocos de página poderão não conseguir visualizar, editar ou excluir os registros corretamente.

![20260709205835](https://static-docs.nocobase.com/20260709205835.png)
![20260709205854](https://static-docs.nocobase.com/20260709205854.png)

## Links relacionados

- [Banco de dados externo](./index.md) — Consulte as instruções gerais de configuração e gerenciamento de bancos de dados externos
- [Gerenciamento de fontes de dados](../data-source-manager/index.md) — Consulte a entrada e as formas de gerenciamento das fontes de dados
- [Campos de tabelas de dados](../data-modeling/collection-fields/index.md) — Consulte as instruções sobre tipos de campos e mapeamento de campos