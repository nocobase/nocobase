---
pkg: '@nocobase/plugin-workflow-sql'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Acción SQL

## Introducción

En algunos escenarios especiales, los nodos de acción de colección simples que hemos visto pueden no ser suficientes para operaciones complejas. En su lugar, puede usar directamente el nodo SQL para que la base de datos ejecute sentencias SQL complejas y manipule los datos.

La principal diferencia con realizar operaciones SQL conectándose directamente a la base de datos desde fuera de la aplicación es que, dentro de un flujo de trabajo, usted puede utilizar variables del contexto del proceso como parámetros en la sentencia SQL.

## Instalación

Es un plugin integrado, por lo que no requiere instalación.

## Crear Nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de más ('+') dentro del flujo para añadir un nodo de 'Acción SQL':

![Añadir Acción SQL](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Configuración del Nodo

![Configuración del Nodo SQL](https://static-docs.nocobase.com/20260414235136.png)

### Fuente de Datos

Seleccione la fuente de datos donde se ejecutará la sentencia SQL.

La fuente de datos debe ser de tipo base de datos, como la fuente de datos principal, PostgreSQL u otras fuentes de datos compatibles con Sequelize.

### Contenido SQL

Edite la sentencia SQL. Actualmente, solo se admite una sentencia SQL.

:::info
Desde `v2.0.30`, por razones de seguridad, la sustitución directa de variables por texto en las sentencias SQL ya no está soportada. En su lugar, deben usarse consultas parametrizadas.
:::

Las variables del contexto del proceso se pueden usar en las sentencias SQL, pero deben especificarse con el formato `:variableName`, por ejemplo:

```sql
SELECT * FROM users WHERE id = :userId;
```

### Lista de Parámetros

En la sentencia SQL anterior, `:userId` es un marcador de posición. La sustitución de los marcadores debe configurarse en la "Lista de Parámetros". El nombre de la variable usa el nombre del marcador, por ejemplo `userId`, y el valor se puede seleccionar del contexto del proceso mediante el selector de variables.

## Resultado de la Ejecución del Nodo

A partir de la versión `v1.3.15-beta`, el resultado de la ejecución de un nodo SQL es un array de datos puros. Antes de esta versión, era la estructura de retorno nativa de Sequelize que contenía metadatos de la consulta (consulte: [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Por ejemplo, la siguiente consulta:

```sql
select count(id) from posts;
```

Resultado antes de `v1.3.15-beta`:

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

Resultado después de `v1.3.15-beta`:

```json
[
    { "count": 1 }
]
```

## Preguntas Frecuentes

### ¿Cómo se utiliza el resultado de un nodo SQL?

Si se utiliza una sentencia `SELECT`, el resultado de la consulta se guardará en el nodo en formato JSON de Sequelize. Puede ser analizado y utilizado con el [plugin JSON-query](./json-query.md).

### ¿La acción SQL activa eventos de colección?

**No**. La acción SQL envía la sentencia SQL directamente a la base de datos para su procesamiento. Las operaciones relacionadas (`CREATE`, `UPDATE`, `DELETE`) ocurren directamente en la base de datos, mientras que los eventos de colección se gestionan en la capa de aplicación de Node.js (a través del ORM). Por esta razón, no se activarán los eventos de colección.