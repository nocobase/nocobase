:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Colecciones

En el desarrollo de **plugins** de NocoBase, la **colección (tabla de datos)** es uno de los conceptos centrales. Usted puede añadir o modificar estructuras de tablas de datos en sus **plugins** definiendo o extendiendo **colecciones**. A diferencia de las tablas de datos creadas a través de la interfaz de gestión de **fuentes de datos**, las **colecciones** definidas en el código suelen ser tablas de metadatos a nivel de sistema y no aparecerán en la lista de gestión de **fuentes de datos**.

## Definición de Colecciones

Siguiendo la estructura de directorios convencional, los archivos de **colección** deben ubicarse en el directorio `./src/server/collections`. Para crear nuevas tablas, utilice `defineCollection()`, y para extender tablas existentes, utilice `extendCollection()`.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Artículos de ejemplo',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Título', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Contenido' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Autor' },
    },
  ],
});
```

En el ejemplo anterior:

- `name`: Nombre de la tabla (se generará automáticamente una tabla con el mismo nombre en la base de datos).
- `title`: Nombre de visualización de la tabla en la interfaz.
- `fields`: Colección de campos; cada campo incluye atributos como `type`, `name`, entre otros.

Cuando necesite añadir campos o modificar configuraciones para las **colecciones** de otros **plugins**, puede utilizar `extendCollection()`:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

Después de activar el **plugin**, el sistema añadirá automáticamente el campo `isPublished` a la tabla `articles` existente.

:::tip
El directorio convencional se cargará completamente antes de que se ejecuten los métodos `load()` de todos los **plugins**, evitando así problemas de dependencia causados por la falta de carga de algunas tablas de datos.
:::

## Sincronización de la Estructura de la Base de Datos

Cuando un **plugin** se activa por primera vez, el sistema sincronizará automáticamente las configuraciones de la **colección** con la estructura de la base de datos. Si el **plugin** ya está instalado y en ejecución, después de añadir o modificar **colecciones**, deberá ejecutar manualmente el comando de actualización:

```bash
yarn nocobase upgrade
```

Si se producen excepciones o datos inconsistentes durante la sincronización, puede reconstruir la estructura de la tabla reinstalando la aplicación:

```bash
yarn nocobase install -f
```

## Generación Automática de Recursos

Después de definir una **colección**, el sistema generará automáticamente un recurso correspondiente, sobre el cual podrá realizar directamente operaciones CRUD (crear, leer, actualizar, eliminar) a través de la API. Consulte [Gestor de Recursos](./resource-manager.md) para más información.