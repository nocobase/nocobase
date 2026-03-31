:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Base de Datos Externa

## Introducción

Puede usar una base de datos externa existente como `fuente de datos`. Actualmente, las bases de datos externas compatibles incluyen MySQL, MariaDB, PostgreSQL, MSSQL y Oracle.

## Instrucciones de Uso

### Añadir una Base de Datos Externa

Después de activar el `plugin`, podrá seleccionarlo y añadirlo desde el menú desplegable "Añadir nuevo" en la gestión de `fuentes de datos`.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Complete la información de la base de datos a la que desea conectarse.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Sincronización de Colecciones

Una vez establecida la conexión con una base de datos externa, NocoBase leerá directamente todas las `colecciones` de la `fuente de datos`. Las bases de datos externas no permiten añadir `colecciones` ni modificar la estructura de las tablas directamente. Si necesita realizar modificaciones, hágalo a través de un cliente de base de datos y luego haga clic en el botón "Actualizar" en la interfaz para sincronizar los cambios.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Configuración de Campos

La base de datos externa leerá y mostrará automáticamente los campos de las `colecciones` existentes. Podrá ver y configurar rápidamente el título del campo, el `tipo de dato` (Field type) y el `tipo de interfaz de usuario` (Field interface). También puede hacer clic en el botón "Editar" para modificar más configuraciones.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Dado que las bases de datos externas no permiten modificar la estructura de las tablas, el único tipo disponible al añadir un nuevo campo es el campo de relación. Los campos de relación no son campos reales, sino que se utilizan para establecer conexiones entre `colecciones`.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Para más detalles, consulte el capítulo [Campos de `colección`/Descripción general](/data-sources/data-modeling/collection-fields).

### Mapeo de Tipos de Campo

NocoBase mapea automáticamente los tipos de campo de la base de datos externa a su `tipo de dato` (Field type) y `tipo de interfaz de usuario` (Field Interface) correspondientes.

- `Tipo de dato` (Field type): Define el tipo, formato y estructura de los datos que un campo puede almacenar.
- `Tipo de interfaz de usuario` (Field interface): Se refiere al tipo de control utilizado en la interfaz de usuario para mostrar e introducir los valores de los campos.

| PostgreSQL | MySQL/MariaDB | Tipo de Dato de NocoBase | Tipo de Interfaz de NocoBase |
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
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Tipos de Campo No Compatibles

Los tipos de campo no compatibles se muestran por separado. Estos campos requieren una adaptación de desarrollo antes de poder utilizarlos.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Clave de Destino de Filtro

Las `colecciones` que se muestran como bloques deben tener configurada una `clave de destino de filtro` (Filter target key). La `clave de destino de filtro` se utiliza para filtrar datos basándose en un campo específico, y el valor de ese campo debe ser único. Por defecto, la `clave de destino de filtro` es el campo de clave primaria de la `colección`. Para vistas, `colecciones` sin clave primaria o `colecciones` con una clave primaria compuesta, deberá definir una `clave de destino de filtro` personalizada.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Solo las `colecciones` que tienen una `clave de destino de filtro` configurada pueden añadirse a la página.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)