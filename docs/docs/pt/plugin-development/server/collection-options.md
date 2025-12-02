:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

## Parâmetros de Configuração da Coleção

```ts
export type MigrationRule =
  | 'overwrite'
  | 'skip'
  | 'upsert'
  | 'schema-only'
  | 'insert-ignore';

export interface CollectionOptions {
  name: string;
  title?: string;
  migrationRules?: MigrationRule[];
  inherits?: string[] | string;
  filterTargetKey?: string | string[];
  fields?: FieldOptions[];
  model?: string | ModelStatic<Model>;
  repository?: string | RepositoryType;
  autoGenId?: boolean;
  timestamps?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  deletedAt?: boolean;
  paranoid?: boolean;
  underscored?: boolean;
  indexes?: ModelIndexesOptions[];
}
```

### `name` - Nome da Coleção
- **Tipo**: `string`
- **Obrigatório**: ✅
- **Descrição**: O identificador único para a coleção, que deve ser exclusivo em todo o aplicativo.
- **Exemplo**:
```typescript
{
  name: 'users'  // Coleção de usuários
}
```

### `title` - Título da Coleção
- **Tipo**: `string`
- **Obrigatório**: ❌
- **Descrição**: O título de exibição da coleção, usado para a interface do frontend.
- **Exemplo**:
```typescript
{
  name: 'users',
  title: 'Gerenciamento de Usuários'  // Exibido como "Gerenciamento de Usuários" na interface
}
```

### `migrationRules` - Regras de Migração
- **Tipo**: `MigrationRule[]`
- **Obrigatório**: ❌
- **Descrição**: Regras de processamento para a migração de dados.
- **Exemplo**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Sobrescreve os dados existentes
  fields: [...]
}
```

### `inherits` - Herdar Coleções
- **Tipo**: `string[] | string`
- **Obrigatório**: ❌
- **Descrição**: Permite herdar definições de campos de outras coleções. Suporta herança de uma ou várias coleções.
- **Exemplo**:

```typescript
// Herança única
{
  name: 'admin_users',
  inherits: 'users',  // Herda todos os campos da coleção de usuários
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Herança múltipla
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Herda de múltiplas coleções
  fields: [...]
}
```

### `filterTargetKey` - Chave Alvo para Filtro
- **Tipo**: `string | string[]`
- **Obrigatório**: ❌
- **Descrição**: A chave alvo usada para filtrar consultas. Suporta uma ou várias chaves.
- **Exemplo**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Filtra por ID de usuário
  fields: [...]
}

// Múltiplas chaves de filtro
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Filtra por ID de usuário e ID de categoria
  fields: [...]
}
```

### `fields` - Definições de Campos
- **Tipo**: `FieldOptions[]`
- **Obrigatório**: ❌
- **Valor Padrão**: `[]`
- **Descrição**: Um array de definições de campos para a coleção. Cada campo inclui informações como tipo, nome e configuração.
- **Exemplo**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Nome de Usuário'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'E-mail'
    },
    {
      type: 'password',
      name: 'password',
      title: 'Senha'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Criado Em'
    }
  ]
}
```

### `model` - Modelo Personalizado
- **Tipo**: `string | ModelStatic<Model>`
- **Obrigatório**: ❌
- **Descrição**: Especifique uma classe de modelo Sequelize personalizada, que pode ser o nome da classe ou a própria classe do modelo.
- **Exemplo**:
```typescript
// Especifique o nome da classe do modelo como uma string
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Use a classe do modelo
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Repositório Personalizado
- **Tipo**: `string | RepositoryType`
- **Obrigatório**: ❌
- **Descrição**: Especifique uma classe de repositório personalizada para lidar com a lógica de acesso a dados.
- **Exemplo**:
```typescript
// Especifique o nome da classe do repositório como uma string
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Use a classe do repositório
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Gerar ID Automaticamente
- **Tipo**: `boolean`
- **Obrigatório**: ❌
- **Valor Padrão**: `true`
- **Descrição**: Define se um ID de chave primária deve ser gerado automaticamente.
- **Exemplo**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Gera automaticamente o ID da chave primária
  fields: [...]
}

// Desabilita a geração automática de ID (requer especificação manual da chave primária)
{
  name: 'external_data',
  autoGenId: false,
fields: [
  {
    type: 'string',
      name: 'id',
      primaryKey: true
    }
  ]
}
```

### `timestamps` - Habilitar Timestamps
- **Tipo**: `boolean`
- **Obrigatório**: ❌
- **Valor Padrão**: `true`
- **Descrição**: Define se os campos `createdAt` (data de criação) e `updatedAt` (data de atualização) devem ser habilitados.
- **Exemplo**:
```typescript
{
  name: 'users',
  timestamps: true,  // Habilita os timestamps
  fields: [...]
}
```

### `createdAt` - Campo de Data de Criação
- **Tipo**: `boolean | string`
- **Obrigatório**: ❌
- **Valor Padrão**: `true`
- **Descrição**: Configuração para o campo `createdAt`.
- **Exemplo**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Nome personalizado para o campo createdAt
  fields: [...]
}
```

### `updatedAt` - Campo de Data de Atualização
- **Tipo**: `boolean | string`
- **Obrigatório**: ❌
- **Valor Padrão**: `true`
- **Descrição**: Configuração para o campo `updatedAt`.
- **Exemplo**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Nome personalizado para o campo updatedAt
  fields: [...]
}
```

### `deletedAt` - Campo de Exclusão Lógica (Soft Delete)
- **Tipo**: `boolean | string`
- **Obrigatório**: ❌
- **Valor Padrão**: `false`
- **Descrição**: Configuração para o campo de exclusão lógica.
- **Exemplo**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Habilita a exclusão lógica
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Modo de Exclusão Lógica (Soft Delete)
- **Tipo**: `boolean`
- **Obrigatório**: ❌
- **Valor Padrão**: `false`
- **Descrição**: Define se o modo de exclusão lógica deve ser habilitado.
- **Exemplo**:
```typescript
{
  name: 'users',
  paranoid: true,  // Habilita a exclusão lógica
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Nomenclatura com Underscore
- **Tipo**: `boolean`
- **Obrigatório**: ❌
- **Valor Padrão**: `false`
- **Descrição**: Define se deve ser usado o estilo de nomenclatura com sublinhado (snake_case) para os nomes das colunas no banco de dados.
- **Exemplo**:
```typescript
{
  name: 'users',
  underscored: true,  // Usa o estilo de nomenclatura com sublinhado
  fields: [...]
}
```

### `indexes` - Configuração de Índices
- **Tipo**: `ModelIndexesOptions[]`
- **Obrigatório**: ❌
- **Descrição**: Configuração de índices do banco de dados.
- **Exemplo**:
```typescript
{
  name: 'users',
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['username', 'status']
    }
  ],
  fields: [...]
}
```

## Configuração de Parâmetros de Campo

NocoBase suporta vários tipos de campos, todos definidos com base no tipo de união `FieldOptions`. A configuração do campo inclui propriedades básicas, propriedades específicas do tipo de dados, propriedades de relacionamento e propriedades de renderização de frontend.

### Opções Básicas de Campo

Todos os tipos de campos herdam de `BaseFieldOptions`, fornecendo capacidades comuns de configuração de campo:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Parâmetros comuns
  name?: string;                    // Nome do campo
  hidden?: boolean;                 // Define se deve ocultar
  validation?: ValidationOptions<T>; // Regras de validação

  // Propriedades comuns de campo de coluna
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Relacionado ao frontend
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Exemplo**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // Não permite valores nulos
  unique: true,           // Restrição de unicidade
  defaultValue: '',       // Valor padrão: string vazia
  index: true,            // Cria um índice
  comment: 'Nome de login do usuário'    // Comentário do banco de dados
}
```

### `name` - Nome do Campo

- **Tipo**: `string`
- **Obrigatório**: ❌
- **Descrição**: O nome da coluna do campo no banco de dados, que deve ser exclusivo dentro da coleção.
- **Exemplo**:
```typescript
{
  type: 'string',
  name: 'username',  // Nome do campo
  title: 'Nome de Usuário'
}
```

### `hidden` - Ocultar Campo

- **Tipo**: `boolean`
- **Valor Padrão**: `false`
- **Descrição**: Define se este campo deve ser ocultado por padrão em listas e formulários.
- **Exemplo**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Oculta o campo de ID interno
  title: 'ID Interno'
}
```

### `validation` - Regras de Validação

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Tipo de validação
  rules: FieldValidationRule<T>[];  // Array de regras de validação
  [key: string]: any;              // Outras opções de validação
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Chave da regra
  name: FieldValidationRuleName<T>; // Nome da regra
  args?: {                         // Argumentos da regra
    [key: string]: any;
  };
  paramsType?: 'object';           // Tipo de parâmetro
}
```

- **Tipo**: `ValidationOptions<T>`
- **Descrição**: Use Joi para definir regras de validação no lado do servidor.
- **Exemplo**:
```typescript
{
  type: 'string',
  name: 'email',
  validation: {
    type: 'string',
    rules: [
      { key: 'email', name: 'email' },
      { key: 'required', name: 'required' }
    ]
  }
}
```

### `allowNull` - Permitir Valores Nulos

- **Tipo**: `boolean`
- **Valor Padrão**: `true`
- **Descrição**: Controla se o banco de dados permite a escrita de valores `NULL`.
- **Exemplo**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Não permite valores nulos
  title: 'Nome de Usuário'
}
```

### `defaultValue` - Valor Padrão

- **Tipo**: `any`
- **Descrição**: O valor padrão para o campo, usado quando um registro é criado sem fornecer um valor para este campo.
- **Exemplo**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Padrão para status de rascunho
  title: 'Status'
}
```

### `unique` - Restrição de Unicidade

- **Tipo**: `boolean | string`
- **Valor Padrão**: `false`
- **Descrição**: Define se o valor deve ser único. Uma string pode ser usada para especificar o nome da restrição.
- **Exemplo**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // O e-mail deve ser único
  title: 'E-mail'
}
```

### `primaryKey` - Chave Primária

- **Tipo**: `boolean`
- **Valor Padrão**: `false`
- **Descrição**: Declara este campo como a chave primária.
- **Exemplo**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Define como chave primária
  autoIncrement: true
}
```

### `autoIncrement` - Auto-incremento

- **Tipo**: `boolean`
- **Valor Padrão**: `false`
- **Descrição**: Habilita o auto-incremento (aplicável apenas a campos numéricos).
- **Exemplo**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Auto-incrementa
  primaryKey: true
}
```

### `field` - Nome da Coluna no Banco de Dados

- **Tipo**: `string`
- **Descrição**: Especifica o nome real da coluna no banco de dados (consistente com o `field` do Sequelize).
- **Exemplo**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Nome da coluna no banco de dados
  title: 'ID do Usuário'
}
```

### `comment` - Comentário do Banco de Dados

- **Tipo**: `string`
- **Descrição**: Um comentário para o campo do banco de dados, usado para fins de documentação.
- **Exemplo**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Nome de login do usuário, usado para acesso ao sistema',  // Comentário do banco de dados
  title: 'Nome de Usuário'
}
```

### `title` - Título de Exibição

- **Tipo**: `string`
- **Descrição**: O título de exibição para o campo, comumente usado na interface do frontend.
- **Exemplo**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Nome de Usuário',  // Título exibido no frontend
  allowNull: false
}
```

### `description` - Descrição do Campo

- **Tipo**: `string`
- **Descrição**: Informações descritivas sobre o campo para ajudar os usuários a entenderem sua finalidade.
- **Exemplo**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'E-mail',
  description: 'Por favor, insira um endereço de e-mail válido',  // Descrição do campo
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Componente de Interface

- **Tipo**: `string`
- **Descrição**: O componente de interface de frontend recomendado para o campo.
- **Exemplo**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Conteúdo',
  interface: 'textarea',  // Recomenda o uso do componente de área de texto
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Interfaces de Tipos de Campo

### `type: 'string'` - Campo de String

- **Descrição**: Usado para armazenar dados de texto curtos. Suporta limites de comprimento e remoção automática de espaços.
- **Tipo de Banco de Dados**: `VARCHAR`
- **Propriedades Específicas**:
  - `length`: Limite de comprimento da string.
  - `trim`: Define se deve remover automaticamente espaços iniciais e finais.

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Limite de comprimento da string
  trim?: boolean;     // Define se deve remover automaticamente espaços iniciais e finais
}
```

**Exemplo**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Nome de Usuário',
  length: 50,           // Máximo de 50 caracteres
  trim: true,           // Remove espaços automaticamente
    allowNull: false,
    unique: true,
    validation: {
      type: 'string',
      rules: [
        { key: 'min', name: 'min', args: { limit: 3 } },
      { key: 'max', name: 'max', args: { limit: 20 } }
    ]
  }
}
```

### `type: 'text'` - Campo de Texto

- **Descrição**: Usado para armazenar dados de texto longos. Suporta diferentes tipos de texto no MySQL.
- **Tipo de Banco de Dados**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Propriedades Específicas**:
  - `length`: Tipo de comprimento de texto do MySQL (`tiny`/`medium`/`long`).

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // Tipo de comprimento de texto do MySQL
}
```

**Exemplo**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Conteúdo',
  length: 'medium',     // Usa MEDIUMTEXT
  allowNull: true
}
```

### Tipos Numéricos

### `type: 'integer'` - Campo de Inteiro

- **Descrição**: Usado para armazenar dados inteiros. Suporta auto-incremento e chave primária.
- **Tipo de Banco de Dados**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Herda todas as opções do tipo INTEGER do Sequelize
}
```

**Exemplo**:
```typescript
  {
    type: 'integer',
  name: 'id',
  title: 'ID',
  primaryKey: true,
  autoIncrement: true,
  allowNull: false
}
```

### `type: 'bigInt'` - Campo de Inteiro Grande

- **Descrição**: Usado para armazenar dados inteiros grandes, com um intervalo maior que `integer`.
- **Tipo de Banco de Dados**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Exemplo**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'ID do Usuário',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Campo de Ponto Flutuante (Float)

- **Descrição**: Usado para armazenar números de ponto flutuante de precisão simples.
- **Tipo de Banco de Dados**: `FLOAT`
- **Propriedades Específicas**:
  - `precision`: A precisão (número total de dígitos).
  - `scale`: O número de casas decimais.

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Precisão
  scale?: number;      // Casas decimais
}
```

**Exemplo**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Pontuação',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Campo de Ponto Flutuante de Dupla Precisão (Double)

- **Descrição**: Usado para armazenar números de ponto flutuante de dupla precisão, que possuem maior precisão que `float`.
- **Tipo de Banco de Dados**: `DOUBLE`
- **Propriedades Específicas**:
  - `precision`: A precisão (número total de dígitos).
  - `scale`: O número de casas decimais.

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Exemplo**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Preço',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Campo de Número Real

- **Descrição**: Usado para armazenar números reais; dependente do banco de dados.
- **Tipo de Banco de Dados**: `REAL`
- **Propriedades Específicas**:
  - `precision`: A precisão (número total de dígitos).
  - `scale`: O número de casas decimais.

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Exemplo**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Taxa',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Campo Decimal

- **Descrição**: Usado para armazenar números decimais exatos, adequado para cálculos financeiros.
- **Tipo de Banco de Dados**: `DECIMAL`
- **Propriedades Específicas**:
  - `precision`: A precisão (número total de dígitos).
  - `scale`: O número de casas decimais.

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Precisão (número total de dígitos)
  scale?: number;      // Casas decimais
}
```

**Exemplo**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Valor',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00,
  validation: {
    type: 'number',
    rules: [
      { key: 'min', name: 'min', args: { limit: 0 } }
    ]
  }
}
```

### Tipos Booleanos

### `type: 'boolean'` - Campo Booleano

- **Descrição**: Usado para armazenar valores verdadeiro/falso, tipicamente para estados de ligado/desligado.
- **Tipo de Banco de Dados**: `BOOLEAN` ou `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Exemplo**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Está Ativo',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Campo de Rádio

- **Descrição**: Usado para armazenar um único valor selecionado, tipicamente para escolhas binárias.
- **Tipo de Banco de Dados**: `BOOLEAN` ou `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Exemplo**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'É Padrão',
  defaultValue: false,
  allowNull: false
}
```

### Tipos de Data e Hora

### `type: 'date'` - Campo de Data

- **Descrição**: Usado para armazenar dados de data sem informações de tempo.
- **Tipo de Banco de Dados**: `DATE`
- **Propriedades Específicas**:
  - `timezone`: Define se deve incluir informações de fuso horário.

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Define se deve incluir informações de fuso horário
}
```

**Exemplo**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Aniversário',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Campo de Hora

- **Descrição**: Usado para armazenar dados de hora sem informações de data.
- **Tipo de Banco de Dados**: `TIME`
- **Propriedades Específicas**:
  - `timezone`: Define se deve incluir informações de fuso horário.

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Exemplo**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Hora de Início',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Campo de Data e Hora com Fuso Horário

- **Descrição**: Usado para armazenar dados de data e hora com informações de fuso horário.
- **Tipo de Banco de Dados**: `TIMESTAMP WITH TIME ZONE`
- **Propriedades Específicas**:
  - `timezone`: Define se deve incluir informações de fuso horário.

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Exemplo**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Criado Em',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Campo de Data e Hora sem Fuso Horário

- **Descrição**: Usado para armazenar dados de data e hora sem informações de fuso horário.
- **Tipo de Banco de Dados**: `TIMESTAMP` ou `DATETIME`
- **Propriedades Específicas**:
  - `timezone`: Define se deve incluir informações de fuso horário.

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Exemplo**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Atualizado Em',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Campo Somente de Data

- **Descrição**: Usado para armazenar dados contendo apenas a data, sem a hora.
- **Tipo de Banco de Dados**: `DATE`
- **Exemplo**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Data de Publicação',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Campo de Timestamp Unix

- **Descrição**: Usado para armazenar dados de timestamp Unix.
- **Tipo de Banco de Dados**: `BIGINT`
- **Propriedades Específicas**:
  - `epoch`: O tempo de época (epoch time).

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Tempo de época
}
```

**Exemplo**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Último Login Em',
  allowNull: true,
  epoch: 0
}
```

### Tipos JSON

### `type: 'json'` - Campo JSON

- **Descrição**: Usado para armazenar dados no formato JSON, suportando estruturas de dados complexas.
- **Tipo de Banco de Dados**: `JSON` ou `TEXT`
- **Exemplo**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Metadados',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - Campo JSONB

- **Descrição**: Usado para armazenar dados no formato JSONB (específico do PostgreSQL), que suporta indexação e consulta.
- **Tipo de Banco de Dados**: `JSONB` (PostgreSQL)
- **Exemplo**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Configuração',
  allowNull: true,
  defaultValue: {}
}
```

### Tipos de Array

### `type: 'array'` - Campo de Array

- **Descrição**: Usado para armazenar dados de array, suportando vários tipos de elementos.
- **Tipo de Banco de Dados**: `JSON` ou `ARRAY`
- **Propriedades Específicas**:
  - `dataType`: Tipo de armazenamento (`json`/`array`).
  - `elementType`: Tipo de elemento (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`).

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Tipo de armazenamento
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Tipo de elemento
}
```

**Exemplo**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Tags',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Campo de Conjunto (Set)

- **Descrição**: Usado para armazenar dados de conjunto, que é semelhante a um array, mas com uma restrição de unicidade.
- **Tipo de Banco de Dados**: `JSON` ou `ARRAY`
- **Propriedades Específicas**:
  - `dataType`: Tipo de armazenamento (`json`/`array`).
  - `elementType`: Tipo de elemento (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`).

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Exemplo**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Categorias',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Tipos de Identificadores

### `type: 'uuid'` - Campo UUID

- **Descrição**: Usado para armazenar identificadores únicos no formato UUID.
- **Tipo de Banco de Dados**: `UUID` ou `VARCHAR(36)`
- **Propriedades Específicas**:
  - `autoFill`: Preenche o valor automaticamente.

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Preenchimento automático
}
```

**Exemplo**:
```typescript
{
  type: 'uuid',
  name: 'id',
  title: 'ID',
  autoFill: true,
  allowNull: false,
  primaryKey: true
}
```

### `type: 'nanoid'` - Campo Nanoid

- **Descrição**: Usado para armazenar identificadores únicos curtos no formato Nanoid.
- **Tipo de Banco de Dados**: `VARCHAR`
- **Propriedades Específicas**:
  - `size`: Comprimento do ID.
  - `customAlphabet`: Conjunto de caracteres personalizado.
  - `autoFill`: Preenche o valor automaticamente.

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // Comprimento do ID
  customAlphabet?: string;  // Conjunto de caracteres personalizado
  autoFill?: boolean;
}
```

**Exemplo**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'ID Curto',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Campo UID Personalizado

- **Descrição**: Usado para armazenar identificadores únicos em um formato personalizado.
- **Tipo de Banco de Dados**: `VARCHAR`
- **Propriedades Específicas**:
  - `prefix`: Um prefixo para o identificador.
  - `pattern`: Um padrão de validação.

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Prefixo
  pattern?: string; // Padrão de validação
}
```

**Exemplo**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'Código',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - Campo ID Snowflake

- **Descrição**: Usado para armazenar identificadores únicos gerados pelo algoritmo Snowflake.
- **Tipo de Banco de Dados**: `BIGINT`
- **Exemplo**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'ID Snowflake',
  allowNull: false,
  unique: true
}
```

### Campos Funcionais

### `type: 'password'` - Campo de Senha

- **Descrição**: Usado para armazenar dados de senha criptografados.
- **Tipo de Banco de Dados**: `VARCHAR`
- **Propriedades Específicas**:
  - `length`: Comprimento do hash.
  - `randomBytesSize`: Tamanho dos bytes aleatórios.

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Comprimento do hash
  randomBytesSize?: number;  // Tamanho dos bytes aleatórios
}
```

**Exemplo**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Senha',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Campo de Criptografia

- **Descrição**: Usado para armazenar dados sensíveis criptografados.
- **Tipo de Banco de Dados**: `VARCHAR`
- **Exemplo**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Segredo',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Campo Virtual

- **Descrição**: Usado para armazenar dados virtuais calculados que não são armazenados no banco de dados.
- **Tipo de Banco de Dados**: Nenhum (campo virtual)
- **Exemplo**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Nome Completo'
}
```

### `type: 'context'` - Campo de Contexto

- **Descrição**: Usado para ler dados do contexto de execução (por exemplo, informações do usuário atual).
- **Tipo de Banco de Dados**: Determinado por `dataType`.
- **Propriedades Específicas**:
  - `dataIndex`: Caminho do índice de dados.
  - `dataType`: Tipo de dados.
  - `createOnly`: Define apenas na criação.

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Caminho do índice de dados
  dataType?: string;   // Tipo de dados
  createOnly?: boolean; // Define apenas na criação
}
```

**Exemplo**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'ID do Usuário Atual',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Campos de Relacionamento

### `type: 'belongsTo'` - Relacionamento Pertence A

- **Descrição**: Representa um relacionamento de muitos para um, onde o registro atual pertence a outro registro.
- **Tipo de Banco de Dados**: Campo de chave estrangeira
- **Propriedades Específicas**:
  - `target`: Nome da coleção alvo.
  - `foreignKey`: Nome do campo de chave estrangeira.
  - `targetKey`: Nome do campo de chave alvo na coleção alvo.
  - `onDelete`: Ação em cascata ao excluir.
  - `onUpdate`: Ação em cascata ao atualizar.
  - `constraints`: Define se deve habilitar restrições de chave estrangeira.

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Nome da coleção alvo
  foreignKey?: string;  // Nome do campo de chave estrangeira
  targetKey?: string;   // Nome do campo de chave alvo na coleção alvo
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Define se deve habilitar restrições de chave estrangeira
}
```

**Exemplo**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'Autor',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - Relacionamento Tem Um

- **Descrição**: Representa um relacionamento de um para um, onde o registro atual possui um registro relacionado.
- **Tipo de Banco de Dados**: Campo de chave estrangeira
- **Propriedades Específicas**:
  - `target`: Nome da coleção alvo.
  - `foreignKey`: Nome do campo de chave estrangeira.
  - `sourceKey`: Nome do campo de chave de origem na coleção de origem.
  - `onDelete`: Ação em cascata ao excluir.
  - `onUpdate`: Ação em cascata ao atualizar.
  - `constraints`: Define se deve habilitar restrições de chave estrangeira.

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Nome do campo de chave de origem
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Exemplo**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'Perfil do Usuário',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Relacionamento Tem Muitos

- **Descrição**: Representa um relacionamento de um para muitos, onde o registro atual possui vários registros relacionados.
- **Tipo de Banco de Dados**: Campo de chave estrangeira
- **Propriedades Específicas**:
  - `target`: Nome da coleção alvo.
  - `foreignKey`: Nome do campo de chave estrangeira.
  - `sourceKey`: Nome do campo de chave de origem na coleção de origem.
  - `sortBy`: Campo para ordenação.
  - `sortable`: Define se o campo é ordenável.
  - `onDelete`: Ação em cascata ao excluir.
  - `onUpdate`: Ação em cascata ao atualizar.
  - `constraints`: Define se deve habilitar restrições de chave estrangeira.

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Campo para ordenação
  sortable?: boolean; // Define se é ordenável
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Exemplo**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Publicações',
  target: 'articles',
  foreignKey: 'authorId',
  sourceKey: 'id',
    sortBy: ['createdAt'],
  sortable: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'belongsToMany'` - Relacionamento Pertence A Muitos

- **Descrição**: Representa um relacionamento de muitos para muitos, conectando duas coleções através de uma tabela de junção.
- **Tipo de Banco de Dados**: Tabela de junção
- **Propriedades Específicas**:
  - `target`: Nome da coleção alvo.
  - `through`: Nome da tabela de junção.
  - `foreignKey`: Nome do campo de chave estrangeira.
  - `otherKey`: A outra chave estrangeira na tabela de junção.
  - `sourceKey`: Nome do campo de chave de origem na coleção de origem.
  - `targetKey`: Nome do campo de chave alvo na coleção alvo.
  - `onDelete`: Ação em cascata ao excluir.
  - `onUpdate`: Ação em cascata ao atualizar.
  - `constraints`: Define se deve habilitar restrições de chave estrangeira.

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Nome da tabela de junção
  foreignKey?: string;
  otherKey?: string;  // A outra chave estrangeira na tabela de junção
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Exemplo**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'Tags',
  target: 'article_tags',
  through: 'article_tag_relations',
  foreignKey: 'articleId',
  otherKey: 'tagId',
  sourceKey: 'id',
  targetKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```