---
pkg: '@nocobase/plugin-migration-manager'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Gestor de Migraciones

## Introducción

Le ayuda a transferir las configuraciones de su aplicación de un entorno a otro. Su enfoque principal es la migración de las «configuraciones de la aplicación». Si necesita una migración completa de datos, le recomendamos utilizar el «[Gestor de Copias de Seguridad](../backup-manager/index.mdx)» para respaldar y restaurar su aplicación.

## Instalación

El Gestor de Migraciones depende del [plugin Gestor de Copias de Seguridad](../backup-manager/index.mdx). Asegúrese de que este plugin ya esté instalado y activado.

## Proceso y Principios

El Gestor de Migraciones transfiere las tablas y los datos de la base de datos principal, basándose en reglas de migración específicas, de una instancia de aplicación a otra. Es importante tener en cuenta que no migra datos de bases de datos externas ni de subaplicaciones.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Reglas de Migración

### Reglas Integradas

El Gestor de Migraciones puede migrar todas las tablas de la base de datos principal y actualmente admite las siguientes cinco reglas integradas:

- **Solo esquema**: Solo migra la estructura (esquema) de las tablas; no se insertan ni actualizan datos.
- **Sobrescribir (vaciar y reinsertar)**: Elimina todos los registros existentes de la tabla de la base de datos de destino y luego inserta los nuevos datos.
- **Upsert (Insertar o actualizar)**: Comprueba si cada registro existe (por clave primaria). Si existe, lo actualiza; si no, lo inserta.
- **Ignorar inserción**: Inserta nuevos registros, pero si un registro ya existe (por clave primaria), la inserción se ignora (no se realizan actualizaciones).
- **Omitir**: Omite completamente el procesamiento de la tabla (no hay cambios de estructura ni migración de datos).

**Notas adicionales:**

- Las reglas "Sobrescribir", "Upsert" e "Ignorar inserción" también sincronizan los cambios en la estructura de la tabla.
- Si una tabla utiliza un ID de auto-incremento como clave primaria, o si no tiene clave primaria, no se pueden aplicar las reglas "Upsert" ni "Ignorar inserción".
- Las reglas "Upsert" e "Ignorar inserción" se basan en la clave primaria para determinar si el registro ya existe.

### Diseño Detallado

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Interfaz de Configuración

Configure las reglas de migración

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Habilitar reglas independientes

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Seleccione las reglas independientes y las tablas que se procesarán según estas reglas.

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## Archivos de Migración

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Crear una Nueva Migración

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Ejecutar una Migración

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

Verificación de variables de entorno de la aplicación (obtenga más información sobre las [Variables de Entorno](#))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Si falta alguna, aparecerá una ventana emergente que le pedirá que introduzca las nuevas variables de entorno necesarias aquí, y luego podrá continuar.

![20250102210009](https://static-docs.nocobase.com/20250102210009.png)

## Registros de Migración

![20250102205738](https://static-docs.nocobase.com/20250102205738.png)

## Reversión

Antes de ejecutar cualquier migración, la aplicación actual se respalda automáticamente. Si la migración falla o los resultados no son los esperados, puede realizar una reversión utilizando el [Gestor de Copias de Seguridad](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)