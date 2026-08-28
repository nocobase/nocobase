---
pkg: "@nocobase/plugin-data-source-external-postgres"
title: "Fonte de dados externa - PostgreSQL"
description: "Saiba como conectar o PostgreSQL ao NocoBase como banco de dados externo, incluindo versões compatíveis, instalação do plugin, configuração da conexão, Schema, SSL, permissões e mapeamento de campos."
keywords: "fonte de dados externa,PostgreSQL,banco de dados externo,Schema,SSL,mapeamento de campos,NocoBase"
---

# PostgreSQL

## Introdução

O PostgreSQL pode ser conectado ao NocoBase como banco de dados externo. Após a conexão, o NocoBase lerá as tabelas, os campos e as visualizações do PostgreSQL e os utilizará como tabelas de dados na fonte de dados externa.

Diferentemente do [banco de dados principal](../data-source-main/index.md), a estrutura real das tabelas do PostgreSQL externo continua sendo mantida pelo sistema de negócio original, pelo cliente do banco de dados ou por scripts de migração. O NocoBase é responsável por ler a estrutura, salvar os metadados dos campos e configurar blocos de página, permissões, workflows e APIs.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | PostgreSQL >= 9.5. |
| Versões comerciais | Compatível com as edições Standard, Professional e Enterprise. |
| Plugin correspondente | `@nocobase/plugin-data-source-external-postgres`. |

Cenários adequados para usar o PostgreSQL externo:

- Conectar bancos de dados PostgreSQL de sistemas de negócio existentes, como ERP, MES, WMS e CRM
- Criar interfaces de gerenciamento com o NocoBase sem migrar dados históricos
- Aplicar controle de permissões, processamento de workflows, correção de dados ou exibição de relatórios em tabelas existentes
- Continuar mantendo a estrutura do banco de dados por DBAs, scripts de migração ou pelo sistema original

:::warning Atenção

O PostgreSQL externo não é o banco de dados do sistema NocoBase. O NocoBase não assumirá o controle do backup, da restauração, da migração nem das alterações na estrutura das tabelas.

:::

## Instalação do plugin

Este é um plugin comercial. Para obter detalhes sobre a ativação, consulte o [Guia de ativação de plugins comerciais](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Adicionar fonte de dados

Em «Gerenciamento de fontes de dados», clique em «Add new», selecione PostgreSQL e preencha as informações de conexão.
![20260709204045](https://static-docs.nocobase.com/20260709204045.png)

Configurações comuns de conexão:

| Configuração | Descrição |
| --- | --- |
| Data source name | Nome identificador da fonte de dados, usado para referências em blocos de página, permissões, workflows e APIs. Não pode ser alterado após a criação. |
| Data source display name | Nome exibido da fonte de dados na interface. Recomenda-se usar um nome compreensível para os usuários de negócio, como «ERP PostgreSQL» ou «Banco de relatórios». |
| Host / Port | Endereço do host e porta do PostgreSQL. A porta padrão normalmente é `5432`. |
| Database | Nome do banco de dados PostgreSQL ao qual se conectar. |
| Username / Password | Nome de usuário e senha usados para conectar-se ao PostgreSQL. O NocoBase só pode ler os objetos aos quais essa conta tem acesso; ele não concederá permissões nem lerá objetos privados de outras contas. |
| Schema | Schema do PostgreSQL a ser lido, por exemplo `public`. Se houver vários schemas no banco de dados, recomenda-se preencher apenas o schema necessário para o negócio atual. |
| Table prefix | Prefixo dos nomes das tabelas. Após a configuração, o NocoBase lerá apenas as tabelas e visualizações que correspondam a esse prefixo e gerará no NocoBase nomes de tabelas sem o prefixo. |
| Collections / Add all collections | Controla o escopo da conexão. Quando «Add all collections» está ativado, o NocoBase conecta todas as tabelas e visualizações do escopo atual; quando desativado, conecta apenas os objetos selecionados em «Collections». |
| Enabled the data source | Define se esta fonte de dados está habilitada. Quando desabilitada, a configuração da fonte de dados é mantida, mas os blocos de página, as permissões, os workflows e as APIs não poderão continuar lendo seus dados. |
| SSL options | Configuração da conexão SSL do PostgreSQL. É possível definir o modo SSL, se certificados não autorizados devem ser rejeitados e os caminhos do certificado da CA, do certificado do cliente e da chave do cliente. |

:::tip Dica

Se houver muitos objetos no PostgreSQL, restrinja primeiro o escopo usando `Schema`, `Table prefix` e «Collections». Conecte apenas as tabelas e visualizações usadas pelo aplicativo atual para simplificar as configurações de permissões, a criação de páginas e a manutenção posterior da sincronização.

:::

## Selecionar tabelas de dados

Depois de preencher as informações de conexão, clique em «Load Collections» para carregar as tabelas de dados e visualizações disponíveis no PostgreSQL. Os resultados da leitura serão afetados pela conta de conexão, por `Schema`, `Table prefix` e pela configuração de «Collections».

Por padrão, «Add all collections» estará habilitado, indicando que todas as tabelas e visualizações do escopo atual serão conectadas. Se quiser conectar apenas parte dos objetos, desabilite «Add all collections» e selecione na lista as tabelas de dados ou visualizações necessárias.

![20260709204309](https://static-docs.nocobase.com/20260709204309.png)

:::warning Atenção

Uma única fonte de dados externa pode conectar no máximo 500 tabelas de dados ou visualizações por vez. Se houver muitos objetos no PostgreSQL, recomenda-se restringir primeiro o escopo usando `Schema`, `Table prefix` ou «Collections».

:::

## Sincronizar e configurar campos

A estrutura das tabelas do PostgreSQL externo é mantida no lado do banco de dados. O NocoBase não criará campos, alterará tipos de campos nem excluirá campos reais no PostgreSQL externo.

Quando a estrutura das tabelas no PostgreSQL for alterada, execute «Sync from database» na fonte de dados para ler novamente os metadados das tabelas e dos campos. A sincronização atualizará no NocoBase as informações salvas sobre tabelas de dados, campos, chaves primárias, chaves exclusivas e mapeamentos de tipos de campos, mas não excluirá as tabelas reais nem os dados do PostgreSQL.

Após a sincronização dos campos, é possível configurar no NocoBase o título do campo, o tipo de campo (Field type) e o componente do campo (Field interface). Se for necessário criar um campo de relação do NocoBase, os metadados da relação também serão salvos no NocoBase, sem adicionar automaticamente um campo de chave estrangeira real à tabela do PostgreSQL.

## Mapeamento de tipos de campos

O NocoBase mapeia automaticamente os tipos de campos do PostgreSQL para o Field type e o Field interface apropriados. É possível ajustar a forma de exibição na configuração do campo.

Mapeamentos comuns:

| Tipo de campo do PostgreSQL | NocoBase Field type | Field interface disponíveis |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`、`INTEGER`、`SERIAL`、`SMALLSERIAL` | `integer`、`boolean`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `BIGINT`、`BIGSERIAL` | `bigInt`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group, Unix timestamp, Created at, Updated at. |
| `REAL` | `float` | Number, Percent. |
| `DOUBLE PRECISION` | `double` | Number, Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`、`CHAR` | `string`、`password`、`uuid`、`nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text`、`json` | Textarea, Markdown, Vditor, Rich text, URL, JSON. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json` | JSON. |
| `TIMESTAMP` | `date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `POINT`、`LINESTRING`、`POLYGON`、`CIRCLE` | `point`、`lineString`、`polygon`、`circle` | Point, Line string, Polygon, Circle, JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group. |

:::warning Atenção

Os tipos de campos do PostgreSQL que não são compatíveis serão exibidos separadamente na configuração dos campos. Para usar esses campos como campos comuns no NocoBase, é necessário desenvolver um adaptador.

:::

## Chave primária e identificador exclusivo do registro

Recomenda-se que as tabelas de dados usadas para exibição e edição em blocos de página tenham uma chave primária ou um campo exclusivo. O NocoBase priorizará a chave primária como identificador exclusivo do registro.

Se a conexão for com uma visualização, uma tabela sem chave primária ou uma tabela com chave primária composta, será necessário definir manualmente «Record unique key» na configuração da tabela de dados. Sem um identificador exclusivo disponível, os blocos de página poderão não conseguir visualizar, editar ou excluir os registros corretamente.

![20260709204742](https://static-docs.nocobase.com/20260709204742.png)
![20260709204827](https://static-docs.nocobase.com/20260709204827.png)

## Links relacionados

- [Banco de dados externo](./index.md) — Consulte as configurações gerais e as instruções de gerenciamento de bancos de dados externos
- [Gerenciamento de fontes de dados](../data-source-manager/index.md) — Consulte a entrada das fontes de dados e os métodos de gerenciamento
- [Campos de tabelas de dados](../data-modeling/collection-fields/index.md) — Consulte as instruções sobre tipos de campos e mapeamento de campos