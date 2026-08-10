---
title: "Banco de dados externo"
description: "Banco de dados externo do NocoBase: conecte bancos de dados MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase/MSSQL/Oracle/ClickHouse/Doris existentes, leia estruturas de tabelas, configure mapeamentos de campos e campos de relacionamento."
keywords: "Banco de dados externo,MySQL,PostgreSQL,MariaDB,KingbaseES,OceanBase,MSSQL,Oracle,ClickHouse,Doris,sincronização de tabelas,mapeamento de campos,NocoBase"
---

# Banco de dados externo

## Introdução

O banco de dados externo é usado para conectar bancos de dados empresariais existentes ao NocoBase, ler tabelas, campos e visualizações do banco de dados externo e permitir que essas tabelas sejam usadas em blocos de página, permissões, fluxos de trabalho e APIs.

Diferentemente do [banco de dados principal](../main/index.md), a estrutura das tabelas do banco de dados externo é mantida pelo sistema original ou pelo cliente do banco de dados. O NocoBase é responsável por ler a estrutura das tabelas e as visualizações, sem modificar a estrutura real das tabelas do banco de dados externo.

As versões de banco de dados e as edições comerciais compatíveis com bancos de dados externos são:

| Banco de dados | Versões compatíveis | Edição Community | Edição Standard | Edição Professional | Edição Enterprise |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 5.7 | ❌ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 9.5 | ❌ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.3 | ❌ | ✅ | ✅ | ✅ |
| MSSQL | 2014-2019 | ❌ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |
| Oracle | >= 11g | ❌ | ❌ | ❌ | ✅ |
| ClickHouse | Consulte a documentação do plugin correspondente | ❌ | ❌ | ❌ | ✅ |
| Doris | Consulte a documentação do plugin correspondente | ❌ | ❌ | ❌ | ✅ |

:::tip Dica

O KingbaseES oferece suporte apenas ao modo de compatibilidade com PostgreSQL; OceanBase, ClickHouse e Doris oferecem suporte apenas ao modo de compatibilidade com MySQL.

:::

Cenários aplicáveis para bancos de dados externos:

- Conectar o banco de dados de sistemas empresariais existentes, como ERP, MES ou WMS antigos, e aproveitar os recursos do NocoBase para criar rapidamente interfaces de gerenciamento, controle de permissões, fluxos de trabalho e relatórios, sem alterar a estrutura das tabelas do banco de dados original.
- Adicionar recursos de aplicativos leves a sistemas existentes, como aprovação, correção de dados, tratamento de exceções e painéis operacionais, sem substituir o sistema original.
- Realizar consultas somente leitura, análises estatísticas ou exibições de BI em bancos de dados existentes, reduzindo a dependência das páginas do sistema empresarial original.
- Migrar sistemas antigos por etapas: primeiro conectar o banco de dados antigo ao NocoBase e continuar usando-o; depois, manter gradualmente os novos dados empresariais no banco de dados principal.
- A estrutura do banco de dados continua sendo mantida pelo DBA, por scripts de migração ou pelo sistema empresarial original. O NocoBase é responsável apenas por ler a estrutura, configurar a interface e usar os dados.

:::warning Atenção

O banco de dados externo não é o banco de dados do sistema NocoBase. O NocoBase não assume o backup, a restauração, a migração nem a estrutura das tabelas do banco de dados externo. Essas operações ainda precisam ser realizadas no banco de dados externo.

:::

## Instalação do plugin

Os bancos de dados externos são fornecidos pelos plugins de fonte de dados correspondentes. Depois de instalar e ativar o plugin, será possível selecionar o tipo de banco de dados correspondente no menu «Add new» de «Gerenciamento de fontes de dados».

| Banco de dados | Plugin correspondente | Método de instalação |
| --- | --- | --- |
| MySQL | `@nocobase/plugin-data-source-external-mysql` | Requer uma licença comercial. Use após instalar e ativar o plugin. |
| PostgreSQL | `@nocobase/plugin-data-source-external-postgres` | Requer uma licença comercial. Use após instalar e ativar o plugin. |
| MariaDB | `@nocobase/plugin-data-source-external-mariadb` | Requer uma licença comercial. Use após instalar e ativar o plugin. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Requer uma licença comercial. Use após instalar e ativar o plugin. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Requer uma licença comercial. Use após instalar e ativar o plugin. |
| MSSQL | `@nocobase/plugin-data-source-external-mssql` | Requer uma licença comercial. Use após instalar e ativar o plugin. |
| Oracle | `@nocobase/plugin-data-source-external-oracle` | Requer uma licença comercial. Use após instalar e ativar o plugin. |
| ClickHouse | `@nocobase/plugin-data-source-external-clickhouse` | Requer uma licença comercial. Use após instalar e ativar o plugin. |
| Doris | `@nocobase/plugin-data-source-external-doris` | Requer uma licença comercial. Use após instalar e ativar o plugin. |

![add_new_database](https://static-docs.nocobase.com/add_new_database.png)

Se o tipo de banco de dados desejado não estiver no menu «Add new», normalmente é necessário verificar primeiro:

- Se o plugin correspondente já foi instalado
- Se o plugin foi ativado
- Se a licença comercial atual inclui esse plugin
- Se o usuário atual tem permissão para gerenciar fontes de dados


## Instruções de uso

### Adicionar um banco de dados externo

Depois de ativar o plugin, será possível selecionar e adicionar o banco de dados no menu suspenso «Add new» do gerenciamento de fontes de dados.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Preencha as informações do banco de dados ao qual deseja se conectar.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Sincronização de tabelas

Depois que a conexão com o banco de dados externo for estabelecida, todas as tabelas de dados da fonte de dados serão lidas diretamente. O banco de dados externo não oferece suporte à adição direta de tabelas nem à modificação da estrutura das tabelas. Se for necessário fazer alterações, use um cliente de banco de dados e clique no botão «Atualizar» na interface para sincronizar.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Configurar campos

O banco de dados externo lê automaticamente os campos das tabelas existentes e os exibe. É possível visualizar e configurar rapidamente o título, o tipo de dados (Field type) e o tipo de interface (Field interface) dos campos. Também é possível clicar no botão «Editar» para modificar mais configurações.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Como o banco de dados externo não oferece suporte à modificação da estrutura das tabelas, ao adicionar campos, o único tipo disponível é o campo de relacionamento. Os campos de relacionamento não são campos reais; eles são usados para estabelecer conexões entre tabelas.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Para obter mais informações, consulte o capítulo [Campos da tabela de dados / Visão geral](../data-modeling/collection-fields/index.md).

### Mapeamento de tipos de campos

O NocoBase mapeia automaticamente os tipos de campos do banco de dados externo para os tipos de dados correspondentes (Field type) e tipos de interface (Field Interface).

- Tipo de dados (Field type): usado para definir os tipos, formatos e estruturas dos dados que o campo pode armazenar;
- Tipo de interface (Field interface): refere-se ao tipo de controle usado na interface do usuário para exibir e inserir valores de campos.

| PostgreSQL | MySQL/MariaDB | NocoBase Data Type | NocoBase Interface Type |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCEL |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Tipos de campos não compatíveis

Os tipos de campos não compatíveis serão exibidos separadamente. Esses campos só poderão ser usados depois que forem adaptados no desenvolvimento.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Identificador exclusivo do registro

As tabelas de dados usadas para exibição em blocos precisam ter uma «chave exclusiva do registro» (Record unique key). O identificador exclusivo do registro é usado para localizar um registro em um bloco de página. Normalmente, escolhe-se a chave primária ou um campo exclusivo.

Para visualizações, tabelas sem chave primária ou tabelas com chave primária composta, é necessário definir manualmente a «Record unique key» na configuração da tabela de dados. Quando não há um identificador exclusivo disponível, os blocos de página podem não conseguir criar blocos, visualizar ou editar registros corretamente. Para obter mais informações, consulte [Tabela comum / Editar configuração](../data-source-main/general-collection.md#编辑配置).

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)