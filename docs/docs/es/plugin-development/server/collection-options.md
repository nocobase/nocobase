:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

## Parámetros de configuración de la colección

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

### `name` - Nombre de la colección
- **Tipo**: `string`
- **Obligatorio**: ✅
- **Descripción**: Es el identificador único para la colección, y debe ser único en toda la aplicación.
- **Ejemplo**:
```typescript
{
  name: 'users'  // Colección de usuarios
}
```

### `title` - Título de la colección
- **Tipo**: `string`
- **Obligatorio**: ❌
- **Descripción**: El título que se muestra para la colección, utilizado en la interfaz de usuario.
- **Ejemplo**:
```typescript
{
  name: 'users',
  title: 'Gestión de Usuarios'  // Se mostrará como "Gestión de Usuarios" en la interfaz
}
```

### `migrationRules` - Reglas de migración
- **Tipo**: `MigrationRule[]`
- **Obligatorio**: ❌
- **Descripción**: Define las reglas de procesamiento para la migración de datos.
- **Ejemplo**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Sobrescribe los datos existentes
  fields: [...]
}
```

### `inherits` - Heredar colecciones
- **Tipo**: `string[] | string`
- **Obligatorio**: ❌
- **Descripción**: Permite heredar definiciones de campos de otras colecciones. Admite la herencia de una o varias colecciones.
- **Ejemplo**:

```typescript
// Herencia única
{
  name: 'admin_users',
  inherits: 'users',  // Hereda todos los campos de la colección 'users'
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Herencia múltiple
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Hereda de múltiples colecciones
  fields: [...]
}
```

### `filterTargetKey` - Clave de destino para filtrar
- **Tipo**: `string | string[]`
- **Obligatorio**: ❌
- **Descripción**: La clave de destino que se utiliza para filtrar consultas. Admite una o varias claves.
- **Ejemplo**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Filtra por ID de usuario
  fields: [...]
}

// Múltiples claves de filtro
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Filtra por ID de usuario y ID de categoría
  fields: [...]
}
```

### `fields` - Definiciones de campos
- **Tipo**: `FieldOptions[]`
- **Obligatorio**: ❌
- **Valor predeterminado**: `[]`
- **Descripción**: Un array de definiciones de campos para la colección. Cada campo incluye información como el tipo, el nombre y la configuración.
- **Ejemplo**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Nombre de usuario'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'Correo electrónico'
    },
    {
      type: 'password',
      name: 'password',
      title: 'Contraseña'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Fecha de creación'
    }
  ]
}
```

### `model` - Modelo personalizado
- **Tipo**: `string | ModelStatic<Model>`
- **Obligatorio**: ❌
- **Descripción**: Permite especificar una clase de modelo Sequelize personalizada, que puede ser el nombre de la clase o la clase del modelo en sí.
- **Ejemplo**:
```typescript
// Especificar el nombre de la clase del modelo como una cadena
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Usar la clase del modelo
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Repositorio personalizado
- **Tipo**: `string | RepositoryType`
- **Obligatorio**: ❌
- **Descripción**: Permite especificar una clase de repositorio personalizada para manejar la lógica de acceso a los datos.
- **Ejemplo**:
```typescript
// Especificar el nombre de la clase del repositorio como una cadena
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Usar la clase del repositorio
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Generar ID automáticamente
- **Tipo**: `boolean`
- **Obligatorio**: ❌
- **Valor predeterminado**: `true`
- **Descripción**: Indica si se debe generar automáticamente un ID de clave primaria.
- **Ejemplo**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Genera automáticamente el ID de clave primaria
  fields: [...]
}

// Deshabilitar la generación automática de ID (requiere especificar la clave primaria manualmente)
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

### `timestamps` - Habilitar marcas de tiempo
- **Tipo**: `boolean`
- **Obligatorio**: ❌
- **Valor predeterminado**: `true`
- **Descripción**: Indica si se deben habilitar los campos `createdAt` (fecha de creación) y `updatedAt` (fecha de actualización).
- **Ejemplo**:
```typescript
{
  name: 'users',
  timestamps: true,  // Habilita las marcas de tiempo
  fields: [...]
}
```

### `createdAt` - Campo de fecha de creación
- **Tipo**: `boolean | string`
- **Obligatorio**: ❌
- **Valor predeterminado**: `true`
- **Descripción**: Configuración para el campo `createdAt`.
- **Ejemplo**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Nombre personalizado para el campo createdAt
  fields: [...]
}
```

### `updatedAt` - Campo de fecha de actualización
- **Tipo**: `boolean | string`
- **Obligatorio**: ❌
- **Valor predeterminado**: `true`
- **Descripción**: Configuración para el campo `updatedAt`.
- **Ejemplo**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Nombre personalizado para el campo updatedAt
  fields: [...]
}
```

### `deletedAt` - Campo de eliminación lógica
- **Tipo**: `boolean | string`
- **Obligatorio**: ❌
- **Valor predeterminado**: `false`
- **Descripción**: Configuración para el campo de eliminación lógica.
- **Ejemplo**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Habilita la eliminación lógica
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Modo de eliminación lógica
- **Tipo**: `boolean`
- **Obligatorio**: ❌
- **Valor predeterminado**: `false`
- **Descripción**: Indica si se debe habilitar el modo de eliminación lógica.
- **Ejemplo**:
```typescript
{
  name: 'users',
  paranoid: true,  // Habilita la eliminación lógica
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Nomenclatura con guion bajo
- **Tipo**: `boolean`
- **Obligatorio**: ❌
- **Valor predeterminado**: `false`
- **Descripción**: Indica si se debe usar el estilo de nomenclatura con guion bajo para los nombres de las columnas de la base de datos.
- **Ejemplo**:
```typescript
{
  name: 'users',
  underscored: true,  // Usa el estilo de nomenclatura con guion bajo
  fields: [...]
}
```

### `indexes` - Configuración de índices
- **Tipo**: `ModelIndexesOptions[]`
- **Obligatorio**: ❌
- **Descripción**: Configuración de índices para la base de datos.
- **Ejemplo**:
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

## Configuración de parámetros de campo

NocoBase es compatible con múltiples tipos de campo, todos definidos a partir del tipo de unión `FieldOptions`. La configuración de campo incluye propiedades básicas, propiedades específicas del tipo de datos, propiedades de relación y propiedades de renderizado para el frontend.

### Opciones básicas de campo

Todos los tipos de campo heredan de `BaseFieldOptions`, lo que proporciona capacidades de configuración de campo comunes:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Parámetros comunes
  name?: string;                    // Nombre del campo
  hidden?: boolean;                 // Si está oculto
  validation?: ValidationOptions<T>; // Reglas de validación

  // Propiedades comunes de las columnas de campo
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Relacionado con el frontend
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Ejemplo**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // No permite valores nulos
  unique: true,           // Restricción de unicidad
  defaultValue: '',       // Valor predeterminado: cadena vacía
  index: true,            // Crea un índice
  comment: 'Nombre de usuario para iniciar sesión'    // Comentario de la base de datos
}
```

### `name` - Nombre del campo

- **Tipo**: `string`
- **Obligatorio**: ❌
- **Descripción**: El nombre de la columna del campo en la base de datos, que debe ser único dentro de la colección.
- **Ejemplo**:
```typescript
{
  type: 'string',
  name: 'username',  // Nombre del campo
  title: 'Nombre de usuario'
}
```

### `hidden` - Ocultar campo

- **Tipo**: `boolean`
- **Valor predeterminado**: `false`
- **Descripción**: Indica si este campo debe ocultarse por defecto en listas y formularios.
- **Ejemplo**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Oculta el campo de ID interno
  title: 'ID interno'
}
```

### `validation` - Reglas de validación

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Tipo de validación
  rules: FieldValidationRule<T>[];  // Array de reglas de validación
  [key: string]: any;              // Otras opciones de validación
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Clave de la regla
  name: FieldValidationRuleName<T>; // Nombre de la regla
  args?: {                         // Argumentos de la regla
    [key: string]: any;
  };
  paramsType?: 'object';           // Tipo de parámetro
}
```

- **Tipo**: `ValidationOptions<T>`
- **Descripción**: Utiliza Joi para definir reglas de validación del lado del servidor.
- **Ejemplo**:
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

### `allowNull` - Permitir valores nulos

- **Tipo**: `boolean`
- **Valor predeterminado**: `true`
- **Descripción**: Controla si la base de datos permite escribir valores `NULL`.
- **Ejemplo**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // No permite valores nulos
  title: 'Nombre de usuario'
}
```

### `defaultValue` - Valor predeterminado

- **Tipo**: `any`
- **Descripción**: El valor predeterminado para el campo, que se utiliza cuando se crea un registro sin proporcionar un valor para este campo.
- **Ejemplo**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Por defecto, estado de borrador
  title: 'Estado'
}
```

### `unique` - Restricción de unicidad

- **Tipo**: `boolean | string`
- **Valor predeterminado**: `false`
- **Descripción**: Indica si el valor debe ser único. Una cadena puede utilizarse para especificar el nombre de la restricción.
- **Ejemplo**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // El correo electrónico debe ser único
  title: 'Correo electrónico'
}
```

### `primaryKey` - Clave primaria

- **Tipo**: `boolean`
- **Valor predeterminado**: `false`
- **Descripción**: Declara este campo como la clave primaria.
- **Ejemplo**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Establece como clave primaria
  autoIncrement: true
}
```

### `autoIncrement` - Auto-incremento

- **Tipo**: `boolean`
- **Valor predeterminado**: `false`
- **Descripción**: Habilita el auto-incremento (solo aplicable a campos numéricos).
- **Ejemplo**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Auto-incremento
  primaryKey: true
}
```

### `field` - Nombre de columna en la base de datos

- **Tipo**: `string`
- **Descripción**: Especifica el nombre real de la columna en la base de datos (consistente con el `field` de Sequelize).
- **Ejemplo**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Nombre de la columna en la base de datos
  title: 'ID de usuario'
}
```

### `comment` - Comentario de la base de datos

- **Tipo**: `string`
- **Descripción**: Un comentario para el campo de la base de datos, utilizado con fines de documentación.
- **Ejemplo**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Nombre de usuario para iniciar sesión en el sistema',  // Comentario de la base de datos
  title: 'Nombre de usuario'
}
```

### `title` - Título de visualización

- **Tipo**: `string`
- **Descripción**: El título de visualización para el campo, comúnmente utilizado en la interfaz de usuario.
- **Ejemplo**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Nombre de usuario',  // Título que se muestra en el frontend
  allowNull: false
}
```

### `description` - Descripción del campo

- **Tipo**: `string`
- **Descripción**: Información descriptiva sobre el campo para ayudar a los usuarios a comprender su propósito.
- **Ejemplo**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'Correo electrónico',
  description: 'Por favor, introduzca una dirección de correo electrónico válida',  // Descripción del campo
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Componente de interfaz

- **Tipo**: `string`
- **Descripción**: El componente de interfaz de usuario recomendado para el campo.
- **Ejemplo**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Contenido',
  interface: 'textarea',  // Se recomienda usar el componente de área de texto
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Interfaces de tipos de campo

### `type: 'string'` - Campo de cadena de texto

- **Descripción**: Se utiliza para almacenar datos de texto cortos. Admite límites de longitud y recorte automático.
- **Tipo de base de datos**: `VARCHAR`
- **Propiedades específicas**:
  - `length`: Límite de longitud de la cadena.
  - `trim`: Indica si se deben eliminar automáticamente los espacios iniciales y finales.

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Límite de longitud de la cadena
  trim?: boolean;     // Si se deben eliminar automáticamente los espacios iniciales y finales
}
```

**Ejemplo**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Nombre de usuario',
  length: 50,           // Máximo 50 caracteres
  trim: true,           // Elimina automáticamente los espacios
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

### `type: 'text'` - Campo de texto largo

- **Descripción**: Se utiliza para almacenar datos de texto largos. Admite diferentes tipos de texto en MySQL.
- **Tipo de base de datos**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Propiedades específicas**:
  - `length`: Tipo de longitud de texto de MySQL (`tiny`/`medium`/`long`).

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // Tipo de longitud de texto de MySQL
}
```

**Ejemplo**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Contenido',
  length: 'medium',     // Usa MEDIUMTEXT
  allowNull: true
}
}
```

### Tipos numéricos

### `type: 'integer'` - Campo de número entero

- **Descripción**: Se utiliza para almacenar datos de números enteros. Admite auto-incremento y clave primaria.
- **Tipo de base de datos**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Hereda todas las opciones del tipo INTEGER de Sequelize
}
```

**Ejemplo**:
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

### `type: 'bigInt'` - Campo de número entero grande

- **Descripción**: Se utiliza para almacenar datos de números enteros grandes, con un rango mayor que `integer`.
- **Tipo de base de datos**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Ejemplo**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'ID de usuario',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Campo de número flotante

- **Descripción**: Se utiliza para almacenar números de punto flotante de precisión simple.
- **Tipo de base de datos**: `FLOAT`
- **Propiedades específicas**:
  - `precision`: La cantidad total de dígitos.
  - `scale`: La cantidad de decimales.

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Precisión
  scale?: number;      // Escala (decimales)
}
```

**Ejemplo**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Puntuación',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Campo de número flotante de doble precisión

- **Descripción**: Se utiliza para almacenar números de punto flotante de doble precisión, que tienen mayor precisión que `float`.
- **Tipo de base de datos**: `DOUBLE`
- **Propiedades específicas**:
  - `precision`: La cantidad total de dígitos.
  - `scale`: La cantidad de decimales.

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Ejemplo**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Precio',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Campo de número real

- **Descripción**: Se utiliza para almacenar números reales; depende de la base de datos.
- **Tipo de base de datos**: `REAL`
- **Propiedades específicas**:
  - `precision`: La cantidad total de dígitos.
  - `scale`: La cantidad de decimales.

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Ejemplo**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Tasa',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Campo decimal

- **Descripción**: Se utiliza para almacenar números decimales exactos, adecuados para cálculos financieros.
- **Tipo de base de datos**: `DECIMAL`
- **Propiedades específicas**:
  - `precision`: La cantidad total de dígitos.
  - `scale`: La cantidad de decimales.

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Precisión (cantidad total de dígitos)
  scale?: number;      // Escala (decimales)
}
}
```

**Ejemplo**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Cantidad',
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

### Tipos booleanos

### `type: 'boolean'` - Campo booleano

- **Descripción**: Se utiliza para almacenar valores verdadero/falso, normalmente para estados de encendido/apagado.
- **Tipo de base de datos**: `BOOLEAN` o `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Ejemplo**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Está activo',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Campo de selección única (radio)

- **Descripción**: Se utiliza para almacenar un único valor seleccionado, normalmente para opciones binarias.
- **Tipo de base de datos**: `BOOLEAN` o `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Ejemplo**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'Es predeterminado',
  defaultValue: false,
  allowNull: false
}
```

### Tipos de fecha y hora

### `type: 'date'` - Campo de fecha

- **Descripción**: Se utiliza para almacenar datos de fecha sin información de hora.
- **Tipo de base de datos**: `DATE`
- **Propiedades específicas**:
  - `timezone`: Indica si se debe incluir información de zona horaria.

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Si se debe incluir información de zona horaria
}
```

**Ejemplo**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Fecha de nacimiento',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Campo de hora

- **Descripción**: Se utiliza para almacenar datos de hora sin información de fecha.
- **Tipo de base de datos**: `TIME`
- **Propiedades específicas**:
  - `timezone`: Indica si se debe incluir información de zona horaria.

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Ejemplo**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Hora de inicio',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Campo de fecha y hora con zona horaria

- **Descripción**: Se utiliza para almacenar datos de fecha y hora con información de zona horaria.
- **Tipo de base de datos**: `TIMESTAMP WITH TIME ZONE`
- **Propiedades específicas**:
  - `timezone`: Indica si se debe incluir información de zona horaria.

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Ejemplo**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Fecha de creación',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Campo de fecha y hora sin zona horaria

- **Descripción**: Se utiliza para almacenar datos de fecha y hora sin información de zona horaria.
- **Tipo de base de datos**: `TIMESTAMP` o `DATETIME`
- **Propiedades específicas**:
  - `timezone`: Indica si se debe incluir información de zona horaria.

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Ejemplo**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Fecha de actualización',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Campo de solo fecha

- **Descripción**: Se utiliza para almacenar datos que contienen solo la fecha, sin la hora.
- **Tipo de base de datos**: `DATE`
- **Ejemplo**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Fecha de publicación',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Campo de marca de tiempo Unix

- **Descripción**: Se utiliza para almacenar datos de marca de tiempo Unix.
- **Tipo de base de datos**: `BIGINT`
- **Propiedades específicas**:
  - `epoch`: La hora de la época (epoch time).

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Hora de la época
}
```

**Ejemplo**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Última hora de inicio de sesión',
  allowNull: true,
  epoch: 0
}
```

### Tipos JSON

### `type: 'json'` - Campo JSON

- **Descripción**: Se utiliza para almacenar datos en formato JSON, compatible con estructuras de datos complejas.
- **Tipo de base de datos**: `JSON` o `TEXT`
- **Ejemplo**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Metadatos',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - Campo JSONB

- **Descripción**: Se utiliza para almacenar datos en formato JSONB (específico de PostgreSQL), que admite indexación y consulta.
- **Tipo de base de datos**: `JSONB` (PostgreSQL)
- **Ejemplo**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Configuración',
  allowNull: true,
  defaultValue: {}
}
```

### Tipos de array

### `type: 'array'` - Campo de array

- **Descripción**: Se utiliza para almacenar datos de array, compatible con varios tipos de elementos.
- **Tipo de base de datos**: `JSON` o `ARRAY`
- **Propiedades específicas**:
  - `dataType`: Tipo de almacenamiento (`json`/`array`).
  - `elementType`: Tipo de elemento (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`).

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Tipo de almacenamiento
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Tipo de elemento
}
```

**Ejemplo**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Etiquetas',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Campo de conjunto

- **Descripción**: Se utiliza para almacenar datos de conjunto, similar a un array pero con una restricción de unicidad.
- **Tipo de base de datos**: `JSON` o `ARRAY`
- **Propiedades específicas**:
  - `dataType`: Tipo de almacenamiento (`json`/`array`).
  - `elementType`: Tipo de elemento (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`).

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Ejemplo**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Categorías',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Tipos de identificador

### `type: 'uuid'` - Campo UUID

- **Descripción**: Se utiliza para almacenar identificadores únicos en formato UUID.
- **Tipo de base de datos**: `UUID` o `VARCHAR(36)`
- **Propiedades específicas**:
  - `autoFill`: Rellena automáticamente el valor.

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Relleno automático
}
```

**Ejemplo**:
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

- **Descripción**: Se utiliza para almacenar identificadores únicos cortos en formato Nanoid.
- **Tipo de base de datos**: `VARCHAR`
- **Propiedades específicas**:
  - `size`: Longitud del ID.
  - `customAlphabet`: Conjunto de caracteres personalizado.
  - `autoFill`: Rellena automáticamente el valor.

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // Longitud del ID
  customAlphabet?: string;  // Conjunto de caracteres personalizado
  autoFill?: boolean;
}
```

**Ejemplo**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'ID corto',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Campo UID personalizado

- **Descripción**: Se utiliza para almacenar identificadores únicos en un formato personalizado.
- **Tipo de base de datos**: `VARCHAR`
- **Propiedades específicas**:
  - `prefix`: Un prefijo para el identificador.
  - `pattern`: Un patrón de validación.

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Prefijo
  pattern?: string; // Patrón de validación
}
```

**Ejemplo**:
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

- **Descripción**: Se utiliza para almacenar identificadores únicos generados por el algoritmo Snowflake.
- **Tipo de base de datos**: `BIGINT`
- **Ejemplo**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'ID Snowflake',
  allowNull: false,
  unique: true
}
```

### Campos funcionales

### `type: 'password'` - Campo de contraseña

- **Descripción**: Se utiliza para almacenar datos de contraseña cifrados.
- **Tipo de base de datos**: `VARCHAR`
- **Propiedades específicas**:
  - `length`: Longitud del hash.
  - `randomBytesSize`: Tamaño de los bytes aleatorios.

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Longitud del hash
  randomBytesSize?: number;  // Tamaño de los bytes aleatorios
}
```

**Ejemplo**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Contraseña',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Campo de cifrado

- **Descripción**: Se utiliza para almacenar datos sensibles cifrados.
- **Tipo de base de datos**: `VARCHAR`
- **Ejemplo**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Secreto',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Campo virtual

- **Descripción**: Se utiliza para almacenar datos virtuales calculados que no se guardan en la base de datos.
- **Tipo de base de datos**: Ninguno (campo virtual)
- **Ejemplo**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Nombre completo'
}
```

### `type: 'context'` - Campo de contexto

- **Descripción**: Se utiliza para leer datos del contexto de ejecución (por ejemplo, información del usuario actual).
- **Tipo de base de datos**: Determinado por `dataType`.
- **Propiedades específicas**:
  - `dataIndex`: Ruta del índice de datos.
  - `dataType`: Tipo de datos.
  - `createOnly`: Se establece solo en la creación.

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Ruta del índice de datos
  dataType?: string;   // Tipo de datos
  createOnly?: boolean; // Se establece solo en la creación
}
```

**Ejemplo**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'ID de usuario actual',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Campos de relación

### `type: 'belongsTo'` - Relación "pertenece a"

- **Descripción**: Representa una relación de muchos a uno, donde el registro actual pertenece a otro registro.
- **Tipo de base de datos**: Campo de clave externa
- **Propiedades específicas**:
  - `target`: Nombre de la colección de destino.
  - `foreignKey`: Nombre del campo de clave externa.
  - `targetKey`: Nombre del campo de clave de destino en la colección de destino.
  - `onDelete`: Acción en cascada al eliminar.
  - `onUpdate`: Acción en cascada al actualizar.
  - `constraints`: Indica si se deben habilitar las restricciones de clave externa.

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Nombre de la colección de destino
  foreignKey?: string;  // Nombre del campo de clave externa
  targetKey?: string;   // Nombre del campo de clave de destino en la colección de destino
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Si se deben habilitar las restricciones de clave externa
}
```

**Ejemplo**:
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

### `type: 'hasOne'` - Relación "tiene uno"

- **Descripción**: Representa una relación de uno a uno, donde el registro actual tiene un registro relacionado.
- **Tipo de base de datos**: Campo de clave externa
- **Propiedades específicas**:
  - `target`: Nombre de la colección de destino.
  - `foreignKey`: Nombre del campo de clave externa.
  - `sourceKey`: Nombre del campo de clave de origen en la colección de origen.
  - `onDelete`: Acción en cascada al eliminar.
  - `onUpdate`: Acción en cascada al actualizar.
  - `constraints`: Indica si se deben habilitar las restricciones de clave externa.

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Nombre del campo de clave de origen
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Ejemplo**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'Perfil de usuario',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Relación "tiene muchos"

- **Descripción**: Representa una relación de uno a muchos, donde el registro actual tiene varios registros relacionados.
- **Tipo de base de datos**: Campo de clave externa
- **Propiedades específicas**:
  - `target`: Nombre de la colección de destino.
  - `foreignKey`: Nombre del campo de clave externa.
  - `sourceKey`: Nombre del campo de clave de origen en la colección de origen.
  - `sortBy`: Campo de ordenación.
  - `sortable`: Indica si el campo es ordenable.
  - `onDelete`: Acción en cascada al eliminar.
  - `onUpdate`: Acción en cascada al actualizar.
  - `constraints`: Indica si se deben habilitar las restricciones de clave externa.

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Campo de ordenación
  sortable?: boolean; // Si es ordenable
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Ejemplo**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Lista de artículos',
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

### `type: 'belongsToMany'` - Relación "pertenece a muchos"

- **Descripción**: Representa una relación de muchos a muchos, conectando dos colecciones a través de una tabla intermedia.
- **Tipo de base de datos**: Tabla intermedia
- **Propiedades específicas**:
  - `target`: Nombre de la colección de destino.
  - `through`: Nombre de la tabla intermedia.
  - `foreignKey`: Nombre del campo de clave externa.
  - `otherKey`: La otra clave externa en la tabla intermedia.
  - `sourceKey`: Nombre del campo de clave de origen en la colección de origen.
  - `targetKey`: Nombre del campo de clave de destino en la colección de destino.
  - `onDelete`: Acción en cascada al eliminar.
  - `onUpdate`: Acción en cascada al actualizar.
  - `constraints`: Indica si se deben habilitar las restricciones de clave externa.

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Nombre de la tabla intermedia
  foreignKey?: string;
  otherKey?: string;  // La otra clave externa en la tabla intermedia
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Ejemplo**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'Etiquetas',
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