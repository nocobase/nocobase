---
pkg: "@nocobase/plugin-data-source-external-clickhouse"
title: "Fonte de dados externa - ClickHouse"
description: "Saiba como integrar o ClickHouse ao NocoBase como banco de dados externo, incluindo porta compatível com MySQL, SSL, escopo de tabelas, cenários de análise somente leitura e mapeamento de campos."
keywords: "fonte de dados externa,ClickHouse,banco de dados externo,porta compatível com MySQL,relatórios,mapeamento de campos,NocoBase"
---

# ClickHouse

## Introdução

O ClickHouse pode ser integrado ao NocoBase como banco de dados externo. Após a integração, o NocoBase lerá as tabelas, os campos e as visualizações do ClickHouse e os utilizará como tabelas de dados na fonte de dados externa.

O ClickHouse é mais adequado para consultas analíticas, análise de logs, estatísticas de métricas e exibição de relatórios. Diferentemente dos bancos de dados transacionais, ele não é adequado como fonte de dados para adicionar, editar e excluir frequentemente registros de negócios no NocoBase.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | ClickHouse >= 20.2. |
| Versão comercial | Compatível com a edição Enterprise. |
| Plugin correspondente | `@nocobase/plugin-data-source-external-clickhouse`. |
| Método de conexão | Usa a porta compatível com MySQL do ClickHouse para conexão. |
| Recomendação de uso | Usado principalmente para visualização, filtragem, estatísticas e exibição de relatórios. |

Cenários adequados para usar o ClickHouse externo:

- Integrar dados analíticos de logs, eventos, métricas, controle de riscos e outros
- Criar painéis operacionais, relatórios estatísticos ou páginas de consulta no NocoBase
- Oferecer aos usuários de negócio uma entrada de consulta somente leitura, reduzindo o acesso direto aos clientes de banco de dados
- Controlar permissões e exibir visualmente dados existentes do ClickHouse

:::warning Atenção

Recomenda-se usar o ClickHouse no NocoBase como fonte de dados para análises somente leitura. Não o utilize como fonte de dados para gravação de tabelas de negócio comuns e também não é recomendável configurar operações de adição, edição ou exclusão nas páginas.

:::

## Instalação do plugin

Este é um plugin comercial. Para obter detalhes sobre a ativação, consulte: [Guia de ativação de plugins comerciais](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Adicionar fonte de dados

Em «Gerenciamento de fontes de dados», clique em «Add new», selecione ClickHouse e preencha as informações de conexão.
![20260709211117](https://static-docs.nocobase.com/20260709211117.png)

As configurações de conexão comuns são as seguintes:

| Configuração | Descrição |
| --- | --- |
| Data source name | Nome de identificação da fonte de dados, usado para referência em blocos de página, permissões, fluxos de trabalho e APIs. Não pode ser alterado após a criação. |
| Data source display name | Nome exibido da fonte de dados na interface. Recomenda-se usar um nome que os usuários de negócio possam entender, como «Banco de logs do ClickHouse» ou «Banco de métricas». |
| Host / Port | Endereço do host do ClickHouse e porta compatível com MySQL. Não preencha com a porta HTTP nem com a porta TCP nativa. |
| Database | Nome do database do ClickHouse ao qual se conectar. |
| Username / Password | Conta e senha usadas para conectar ao ClickHouse. O NocoBase só pode ler os objetos aos quais essa conta tem permissão de acesso; ele não concederá acesso nem lerá objetos privados de outras contas. |
| Table prefix | Prefixo do nome da tabela. Depois de configurado, o NocoBase lerá apenas as tabelas que correspondem a esse prefixo e gerará no NocoBase nomes de tabelas sem o prefixo. |
| Use SSL | Indica se o SSL está habilitado. Normalmente é necessário habilitá-lo ao conectar-se ao ClickHouse Cloud ou a um ambiente com conexão segura. |
| Enabled the data source | Indica se esta fonte de dados está habilitada. Quando desabilitada, a configuração da fonte de dados será mantida, mas os blocos de página, as permissões, os fluxos de trabalho e as APIs não poderão continuar lendo seus dados. |

:::tip Dica

O plugin do ClickHouse conecta-se por meio do protocolo compatível com MySQL. Antes de configurá-lo, confirme se o serviço do ClickHouse já habilitou a porta compatível com MySQL e se a rede, o firewall e as permissões da conta permitem que o NocoBase acesse o serviço.

:::

## Escopo da integração

A página do ClickHouse não oferece uma tabela de seleção «Collections». O escopo da integração é controlado principalmente por `Database`, pelas permissões da conta de conexão e por `Table prefix`.

Se houver muitas tabelas no ClickHouse, recomenda-se preparar um database, uma conta ou um prefixo de tabela específico para o NocoBase, expondo apenas as tabelas que o aplicativo atual precisa consultar e analisar.

:::warning Atenção

Uma única fonte de dados externa pode integrar no máximo 500 tabelas ou visualizações de dados por vez. Se houver muitos objetos no ClickHouse, recomenda-se restringir primeiro o escopo por meio do database, das permissões da conta ou de `Table prefix`.

:::

## Sincronização e configuração de campos

A estrutura das tabelas do ClickHouse externo é mantida pelo banco de dados. O NocoBase não criará campos, alterará tipos de campo nem excluirá campos reais no ClickHouse externo.

Quando a estrutura das tabelas no ClickHouse for alterada, você poderá executar «Sync from database» na fonte de dados para ler novamente os metadados das tabelas e dos campos. A sincronização atualizará no NocoBase as informações salvas sobre tabelas de dados, campos, chaves primárias, chaves únicas e mapeamentos de tipos de campo, mas não excluirá as tabelas ou os dados reais do ClickHouse.

Após a sincronização dos campos, você poderá configurar no NocoBase o título do campo, o tipo de campo (Field type) e o componente do campo (Field interface). Se precisar criar campos de relação do NocoBase, os metadados da relação também serão salvos no NocoBase; nenhum campo de chave estrangeira real será adicionado automaticamente à tabela do ClickHouse.

## Mapeamento de tipos de campo

O NocoBase converte os tipos de campo do ClickHouse para um estilo compatível com MySQL e, em seguida, faz o mapeamento para o Field type e o Field interface adequados. Você pode ajustar a forma de exibição na configuração do campo.

Os mapeamentos comuns são os seguintes:

| Tipo de campo do ClickHouse | NocoBase Field type | Field interface disponível |
| --- | --- | --- |
| `Int8`、`Int16`、`Int32`、`UInt8`、`UInt16`、`UInt32` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `Int64`、`UInt64` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `Float32`、`Float64` | `float` | Number、Percent。 |
| `Decimal` | `decimal`、`double` | Number、Percent、Currency。 |
| `String`、`FixedString` | `text`、`string` | Input、Textarea、Markdown、URL。 |
| `Date`、`Date32` | `dateOnly` | Date。 |
| `DateTime`、`DateTime64` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `UUID` | `string`、`uuid` | Input、UUID。 |
| `Bool`、`Boolean` | `integer`、`boolean`、`sort` | Checkbox、Switch、Integer。 |
| `Array` | `json`、`array` | JSON。 |
| `Nullable(...)` | Mapeado de acordo com o tipo de campo interno | Depende do tipo de campo interno. |
| `LowCardinality(...)` | Mapeado de acordo com o tipo de campo interno | Depende do tipo de campo interno. |

:::warning Atenção

Alguns tipos analíticos ou aninhados do ClickHouse podem não ser mapeados diretamente para campos comuns de negócio. Quando encontrar um tipo de campo incompatível, você poderá criar primeiro, no ClickHouse, uma visualização ou tabela de consulta adequada para exibição e, em seguida, integrá-la ao NocoBase.

:::

## Chave primária e identificador exclusivo do registro

A chave de ordenação e a chave de partição do ClickHouse não são necessariamente equivalentes ao identificador exclusivo do negócio. Para tabelas de dados usadas na exibição de blocos de página, ainda é recomendável preparar um campo que permita localizar exclusivamente um registro.

Se a tabela ou visualização integrada não tiver um campo exclusivo, será necessário definir manualmente «Record unique key» na configuração da tabela de dados. Sem um identificador exclusivo disponível, os blocos de página poderão não conseguir exibir corretamente os detalhes do registro e não será adequado configurar operações de edição ou exclusão.

![20260709211300](https://static-docs.nocobase.com/20260709211300.png)
![20260709211239](https://static-docs.nocobase.com/20260709211239.png)

## Links relacionados

- [Banco de dados externo](./index.md) — Consulte as configurações gerais e as instruções de gerenciamento de bancos de dados externos
- [Gerenciamento de fontes de dados](../data-source-manager/index.md) — Consulte a entrada das fontes de dados e os métodos de gerenciamento
- [Campos da tabela de dados](../data-modeling/collection-fields/index.md) — Consulte as instruções sobre tipos de campo e mapeamento de campos