:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Banco de Dados Externo

## Introdução

Você pode usar um banco de dados externo existente como uma **fonte de dados**. Atualmente, os bancos de dados externos suportados incluem MySQL, MariaDB, PostgreSQL, MSSQL e Oracle.

## Instruções de Uso

### Adicionando um Banco de Dados Externo

Após ativar o **plugin**, você poderá selecioná-lo e adicioná-lo no menu suspenso "Adicionar novo" na gestão de **fontes de dados**.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Preencha as informações do banco de dados ao qual você deseja se conectar.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Sincronização de Coleções

Após estabelecer uma conexão com um banco de dados externo, todas as **coleções** dentro da **fonte de dados** serão lidas diretamente. Bancos de dados externos não permitem adicionar **coleções** ou modificar a estrutura da tabela diretamente. Se precisar fazer modificações, você pode realizá-las através de um cliente de banco de dados e, em seguida, clicar no botão "Atualizar" na interface para sincronizar.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Configurando Campos

O banco de dados externo lerá e exibirá automaticamente os campos das **coleções** existentes. Você pode visualizar e configurar rapidamente o título do campo, o **tipo de dados** (`Field type`) e o **tipo de interface** (`Field interface`). Você também pode clicar no botão "Editar" para modificar mais configurações.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Como bancos de dados externos não permitem modificar a estrutura da tabela, o único tipo disponível ao adicionar um novo campo é o campo de associação. Campos de associação não são campos reais, mas são usados para estabelecer conexões entre **coleções**.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Para mais detalhes, consulte o capítulo [Campos da Coleção/Visão Geral](/data-sources/data-modeling/collection-fields).

### Mapeamento de Tipos de Campo

O NocoBase mapeia automaticamente os tipos de campo do banco de dados externo para o **tipo de dados** (`Field type`) e o **tipo de interface** (`Field Interface`) correspondentes.

- **Tipo de dados** (`Field type`): Define o tipo, formato e estrutura dos dados que um campo pode armazenar.
- **Tipo de interface** (`Field interface`): Refere-se ao tipo de controle usado na interface do usuário para exibir e inserir valores de campo.

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
| CIRCLE |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Tipos de Campo Não Suportados

Os tipos de campo não suportados são exibidos separadamente. Esses campos exigem adaptação de desenvolvimento antes de poderem ser utilizados.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Chave de Destino do Filtro

As **coleções** exibidas como blocos devem ter uma **Chave de Destino do Filtro** (`Filter target key`) configurada. A **chave de destino do filtro** é usada para filtrar dados com base em um campo específico, e o valor do campo deve ser único. Por padrão, a **chave de destino do filtro** é o campo de chave primária da **coleção**. Para visualizações, **coleções** sem chave primária ou **coleções** com chave primária composta, você precisará definir uma **chave de destino do filtro** personalizada.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Apenas as **coleções** que possuem uma **chave de destino do filtro** configurada podem ser adicionadas à página.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)