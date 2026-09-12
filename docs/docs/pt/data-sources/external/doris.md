---
pkg: "@nocobase/plugin-data-source-external-doris"
title: "Fonte de dados externa - Doris"
description: "Saiba como conectar o Doris ao NocoBase como banco de dados externo, incluindo a porta compatível com MySQL, FE query_port, escopo de tabelas, cenários de análise somente leitura e mapeamento de campos."
keywords: "fonte de dados externa,Doris,banco de dados externo,porta compatível com MySQL,FE query_port,relatórios,mapeamento de campos,NocoBase"
---

# Doris

## Introdução

O Doris pode ser conectado ao NocoBase como banco de dados externo. Após a conexão, o NocoBase lerá as tabelas, os campos e as views do Doris e os utilizará como tabelas de dados na fonte de dados externa.

O Doris é mais adequado para consultas analíticas, detalhes de tabelas amplas, estatísticas de métricas e exibição de relatórios. Diferentemente dos bancos de dados transacionais, ele não é adequado como fonte de dados para adicionar, editar ou excluir frequentemente registros de negócio no NocoBase.

| Item de configuração | Descrição |
| --- | --- |
| Versão compatível | Doris >= 2.1.0. |
| Versão comercial | Compatível com a edição Enterprise. |
| Plugin correspondente | `@nocobase/plugin-data-source-external-doris`. |
| Método de conexão | Usa a porta compatível com MySQL do Doris, ou seja, FE query_port. |
| Recomendação de uso | Usado principalmente para visualização, filtragem, estatísticas e exibição de relatórios. |

Cenários adequados para usar o Doris externo:

- Conectar tabelas de detalhes, tabelas agregadas, tabelas amplas ou tabelas de métricas do data warehouse
- Criar painéis operacionais, relatórios estatísticos ou páginas de consulta no NocoBase
- Oferecer aos usuários de negócio uma entrada de consulta somente leitura, reduzindo o acesso direto aos clientes de banco de dados
- Controlar permissões e oferecer visualização dos dados existentes no Doris

:::warning Atenção

No NocoBase, recomenda-se usar o Doris como fonte de dados para análises somente leitura. Não o use como fonte de dados para gravação de tabelas de negócio comuns, nem é recomendável configurar operações de adição, edição ou exclusão nas páginas.

:::

## Instalação do plugin

Este plugin é comercial. Para saber mais sobre o método de ativação, consulte: [Guia de ativação de plugins comerciais](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Adicionar fonte de dados

Em «Gerenciamento de fontes de dados», clique em «Add new», selecione Doris e preencha as informações de conexão.
![20260709211333](https://static-docs.nocobase.com/20260709211333.png)

Configurações de conexão comuns:

| Configuração | Descrição |
| --- | --- |
| Data source name | Nome identificador da fonte de dados, usado para referência em blocos de página, permissões, fluxos de trabalho e APIs. Não pode ser alterado após a criação. |
| Data source display name | Nome exibido para a fonte de dados na interface. Recomenda-se usar um nome que os usuários de negócio compreendam, como «Data warehouse Doris» ou «Banco de métricas». |
| Host / Port | Endereço do FE do Doris e porta compatível com MySQL, ou seja, `query_port`. Não preencha a porta HTTP. |
| Database | Nome do database do Doris ao qual se conectar. |
| Username / Password | Conta e senha usadas para conectar ao Doris. O NocoBase só pode ler os objetos aos quais essa conta tem acesso; ele não concederá autorização nem lerá objetos privados de outras contas. |
| Table prefix | Prefixo dos nomes das tabelas. Depois de configurado, o NocoBase lerá apenas as tabelas que correspondem a esse prefixo e gerará no NocoBase nomes de tabelas sem o prefixo. |
| Enabled the data source | Se a fonte de dados está habilitada. Quando desabilitada, a configuração da fonte de dados será mantida, mas os blocos de página, as permissões, os fluxos de trabalho e as APIs não poderão continuar lendo seus dados. |

:::tip Dica

O plugin Doris se conecta por meio do protocolo compatível com MySQL. Antes da configuração, confirme que o `query_port` do FE do Doris pode ser acessado pelo NocoBase e que a conta tem permissão para ler os metadados do database, das tables e das columns de destino.

:::

## Escopo da conexão

As páginas do Doris não oferecem uma tabela para selecionar «Collections». O escopo da conexão é controlado principalmente por `Database`, pelas permissões da conta de conexão e por `Table prefix`.

Se houver muitas tabelas no Doris, recomenda-se preparar um database, uma conta ou um prefixo de nomes de tabelas específico para o NocoBase, expondo apenas as tabelas que o aplicativo atual precisa visualizar e analisar.

:::warning Atenção

Uma única fonte de dados externa pode conectar no máximo 500 tabelas ou views por vez. Se houver muitos objetos no Doris, recomenda-se restringir o escopo primeiro por meio do database, das permissões da conta ou de `Table prefix`.

:::

## Sincronização e configuração de campos

A estrutura das tabelas do Doris é mantida no lado do banco de dados. O NocoBase não criará campos, modificará tipos de campos nem excluirá campos reais no Doris externo.

Quando a estrutura das tabelas no Doris for alterada, execute «Sync from database» na fonte de dados para reler os metadados das tabelas e dos campos. A sincronização atualizará no NocoBase as informações salvas sobre tabelas de dados, campos, chaves primárias, chaves únicas e mapeamentos de tipos de campos, mas não excluirá tabelas ou dados reais no Doris.

Após a sincronização dos campos, é possível configurar no NocoBase o título do campo, o tipo de campo (Field type) e o componente do campo (Field interface). Se for necessário criar campos de relação do NocoBase, os metadados da relação também serão salvos no NocoBase, sem adicionar automaticamente campos de chave estrangeira reais às tabelas do Doris.

## Mapeamento de tipos de campos

O NocoBase mapeia os tipos de campos do Doris para o Field type e o Field interface apropriados, de acordo com a lógica compatível com MySQL e os tipos específicos do Doris. É possível ajustar a forma de exibição da interface na configuração dos campos.

Mapeamentos comuns:

| Tipo de campo do Doris | NocoBase Field type | Field interface disponível |
| --- | --- | --- |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `LARGEINT` | `bigInt` | Integer。 |
| `FLOAT` | `float`、`sort` | Number、Percent、Sort。 |
| `DOUBLE` | `double`、`sort` | Number、Percent、Sort。 |
| `DECIMAL`、`DECIMALV3` | `decimal` | Number、Percent、Currency。 |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `CHAR` | `string` | Input、Email、Phone。 |
| `VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT`、`STRING` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE`、`DATEV2` | `date` | Date。 |
| `DATETIME`、`DATETIMEV2` | `datetime` | Date、Time、Created at、Updated at。 |
| `JSON`、`JSONB` | `json` | JSON。 |
| `HLL`、`BITMAP`、`QUANTILE_STATE`、`AGG_STATE` | `json` | JSON。 |
| `VARIANT`、`ARRAY`、`MAP`、`STRUCT` | `json` | JSON。 |
| `IPV4`、`IPV6` | `string` | Input。 |

`VARIANT` é um tipo dinâmico disponibilizado a partir do Apache Doris 2.1.0. Ao usar uma versão do Doris anterior à 2.1.0, não é possível conectar campos desse tipo.

:::warning Atenção

Os tipos de estado de agregação, semiestruturados e complexos do Doris são mais adequados para exibição ou depuração e podem não ser apropriados como campos de entrada de formulários. Ao encontrar tipos complexos, recomenda-se preparar no Doris views ou tabelas de detalhes mais adequadas à visualização pelo negócio e conectá-las ao NocoBase.

:::

## Chave primária e identificador exclusivo do registro

O modelo de dados e o modelo de chaves do Doris não correspondem necessariamente ao identificador exclusivo do negócio. Para tabelas de dados usadas na exibição de blocos de página, ainda é recomendável preparar um campo capaz de localizar exclusivamente cada registro.

Se a tabela ou view conectada não tiver um campo exclusivo, será necessário definir manualmente «Record unique key» na configuração da tabela de dados. Sem um identificador exclusivo disponível, os blocos de página podem não conseguir exibir corretamente os detalhes dos registros e não são adequados para configurar operações de edição ou exclusão.

![20260709211439](https://static-docs.nocobase.com/20260709211439.png)
![20260709211454](https://static-docs.nocobase.com/20260709211454.png)

## Links relacionados

- [Banco de dados externo](./index.md) — Consulte as configurações gerais e as instruções de gerenciamento de bancos de dados externos
- [Gerenciamento de fontes de dados](../data-source-manager/index.md) — Consulte a entrada das fontes de dados e os métodos de gerenciamento de fontes de dados
- [Campos de tabelas de dados](../data-modeling/collection-fields/index.md) — Consulte as instruções sobre tipos de campos e mapeamento de campos