---
pkg: "@nocobase/plugin-data-source-external-mssql"
title: "Fonte de dados externa - MSSQL"
description: "Saiba como integrar MSSQL/SQL Server ao NocoBase como banco de dados externo, incluindo versões compatíveis, instalação do plugin, configuração da conexão, conexão criptografada, permissões e mapeamento de campos."
keywords: "fonte de dados externa,MSSQL,SQL Server,banco de dados externo,mapeamento de campos,NocoBase"
---

# MSSQL

## Introdução

MSSQL (SQL Server) pode ser integrado ao NocoBase como banco de dados externo. Após a integração, o NocoBase lerá as tabelas, os campos e as views do SQL Server e os utilizará como tabelas de dados na fonte de dados externa.

Diferentemente do [banco de dados principal](../data-source-main/index.md), a estrutura real das tabelas do MSSQL externo continua sendo mantida pelo sistema de negócios original, pelo cliente de banco de dados ou pelos scripts de migração. O NocoBase é responsável por ler a estrutura, salvar os metadados dos campos e configurar blocos de página, permissões, workflows e APIs.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | SQL Server 2014-2019. |
| Versões comerciais | Compatível com as edições Standard, Professional e Enterprise. |
| Plugin correspondente | `@nocobase/plugin-data-source-external-mssql`. |
| Recursos de conexão | Suporta a configuração de «Encrypt connection» e «Trust server certificate». |

Cenários adequados para usar o MSSQL externo:

- Integrar bancos de dados SQL Server de sistemas de negócios existentes, como ERP, MES, WMS e CRM
- Criar interfaces de gerenciamento com o NocoBase sem migrar dados históricos
- Controlar permissões, processar workflows, corrigir dados ou exibir relatórios de tabelas existentes
- Continuar mantendo a estrutura do banco de dados por DBAs, scripts de migração ou pelo sistema original

:::warning Atenção

O MSSQL externo não é o banco de dados do sistema NocoBase. O NocoBase não assume o controle do backup, da restauração, da migração nem das alterações na estrutura das tabelas.

:::

## Instalação do plugin

Este plugin é comercial. Para obter detalhes sobre a ativação, consulte: [Guia de ativação de plugins comerciais](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Adicionar fonte de dados

Em «Gerenciamento de fontes de dados», clique em «Add new», selecione MSSQL e preencha as informações de conexão.

![20260709210022](https://static-docs.nocobase.com/20260709210022.png)

Configurações de conexão comuns:

| Configuração | Descrição |
| --- | --- |
| Data source name | Nome identificador da fonte de dados, usado como referência em blocos de página, permissões, workflows e APIs. Não pode ser alterado após a criação. |
| Data source display name | Nome exibido da fonte de dados na interface. Recomenda-se usar um nome que os usuários de negócio possam entender, como «ERP SQL Server» ou «Banco financeiro». |
| Host / Port | Endereço e porta do host do SQL Server. A porta padrão geralmente é `1433`. |
| Database | Nome do banco de dados SQL Server ao qual se conectar. |
| Username / Password | Conta e senha usadas para conectar ao SQL Server. O NocoBase só pode ler os objetos aos quais essa conta tem permissão de acesso; ele não concederá autorização nem lerá objetos privados de outras contas. |
| Table prefix | Prefixo dos nomes das tabelas. Após configurado, o NocoBase lerá apenas as tabelas e views que correspondam a esse prefixo e gerará no NocoBase nomes de tabelas sem o prefixo. |
| Encrypt connection | Define se a conexão criptografada será habilitada. Habilite quando o banco de dados exigir criptografia ou quando o canal de rede precisar ser criptografado. |
| Trust server certificate | Define se o certificado do servidor será confiável. Pode ser necessário habilitar essa opção em ambientes de teste ou com certificados autoassinados; em produção, recomenda-se usar um certificado confiável. |
| Collections / Add all collections | Controla o escopo da integração. Quando «Add all collections» está habilitado, o NocoBase integra todas as tabelas e views dentro do escopo atual; quando desabilitado, integra apenas os objetos selecionados em «Collections». |
| Enabled the data source | Define se esta fonte de dados está habilitada. Quando desabilitada, a configuração da fonte de dados é mantida, mas os blocos de página, as permissões, os workflows e as APIs não poderão mais ler seus dados. |

:::tip Dica

Se houver muitos objetos no SQL Server, restrinja primeiro o escopo por meio de `Database`, `Table prefix` e «Collections». Integre apenas as tabelas e views usadas pelo aplicativo atual; assim, a configuração posterior de permissões, a criação de páginas e a manutenção da sincronização serão mais simples.

:::

## Selecionar tabelas de dados

Depois de preencher as informações de conexão, clique em «Load Collections» para ler as tabelas e views disponíveis no SQL Server. Os resultados da leitura serão afetados pela conta de conexão, por `Database`, `Table prefix` e pela configuração de «Collections».

Por padrão, «Add all collections» estará habilitado, indicando a integração de todas as tabelas e views dentro do escopo atual. Se quiser integrar apenas alguns objetos, desabilite «Add all collections» e selecione na lista as tabelas ou views de que precisa.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Atenção

Uma única fonte de dados externa pode integrar no máximo 500 tabelas ou views por vez. Se houver muitos objetos no SQL Server, recomenda-se restringir primeiro o escopo por meio de `Database`, `Table prefix` ou «Collections».

:::

## Sincronizar e configurar campos

A estrutura das tabelas do MSSQL externo é mantida no banco de dados. O NocoBase não criará campos, alterará tipos de campos nem excluirá campos reais no SQL Server externo.

Quando a estrutura das tabelas no SQL Server for alterada, execute «Sync from database» na fonte de dados para ler novamente os metadados das tabelas e dos campos. A sincronização atualizará no NocoBase as informações salvas sobre tabelas de dados, campos, chaves primárias, chaves únicas e mapeamentos de tipos de campos, mas não excluirá as tabelas ou os dados reais no SQL Server.

Após a sincronização dos campos, você poderá configurar no NocoBase o título do campo, o tipo de campo (Field type) e o componente do campo (Field interface). Se precisar criar campos de relacionamento do NocoBase, os metadados do relacionamento também serão salvos no NocoBase, sem adicionar automaticamente campos de chave estrangeira reais às tabelas do SQL Server.

## Mapeamento de tipos de campos

O NocoBase mapeia automaticamente os tipos de campos do SQL Server para o Field type e o Field interface apropriados. Você pode ajustar a forma de exibição na interface na configuração do campo.

Mapeamentos comuns:

| Tipo de campo do SQL Server | NocoBase Field type | Field interface disponíveis |
| --- | --- | --- |
| `BIT` | `bit` | Checkbox、Switch。 |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `DECIMAL`、`MONEY`、`SMALLMONEY` | `decimal` | Number、Percent、Currency。 |
| `NUMERIC`、`FLOAT`、`REAL` | `float` | Number、Percent。 |
| `CHAR`、`VARCHAR`、`NCHAR`、`NVARCHAR` | `string`、`uuid`、`nanoid` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT`、`NTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME`、`DATETIME2` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `DATETIMEOFFSET` | `datetimeTz` | Date、Time、Created at、Updated at。 |
| `UNIQUEIDENTIFIER` | `uuid`、`string` | UUID、Input。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Atenção

Os tipos de campos do SQL Server que não são compatíveis serão exibidos separadamente na configuração dos campos. Esses campos só poderão ser usados no NocoBase como campos comuns após a implementação de um adaptador.

:::

## Chave primária e identificador exclusivo do registro

Para tabelas de dados usadas na exibição e edição em blocos de página, recomenda-se ter uma chave primária ou um campo exclusivo. O NocoBase dará prioridade à chave primária como identificador exclusivo do registro.

Se a integração for de uma view, de uma tabela sem chave primária ou de uma tabela com chave primária composta, será necessário definir manualmente «Record unique key» na configuração da tabela de dados. Sem um identificador exclusivo disponível, os blocos de página poderão não conseguir visualizar, editar ou excluir os registros corretamente.

![20260709210154](https://static-docs.nocobase.com/20260709210154.png)
![20260709210214](https://static-docs.nocobase.com/20260709210214.png)

## Links relacionados

- [Banco de dados externo](./index.md) — Consulte as configurações gerais e as instruções de gerenciamento de bancos de dados externos
- [Gerenciamento de fontes de dados](../data-source-manager/index.md) — Consulte a entrada e os métodos de gerenciamento das fontes de dados
- [Campos de tabelas de dados](../data-modeling/collection-fields/index.md) — Consulte as instruções sobre tipos de campos e mapeamento de campos