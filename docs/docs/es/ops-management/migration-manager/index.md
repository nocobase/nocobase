---
pkg: '@nocobase/plugin-migration-manager'
title: "Gestión de migraciones"
description: "Migración operativa: migra configuración de aplicación de un entorno a otro, con reglas de solo estructura, sobrescribir y omitir. Depende de la gestión de copias de seguridad."
keywords: "Gestión de migraciones,Migration,migración de configuración,reglas de migración,solo estructura,sobrescribir,omitir,NocoBase"
---

# Gestor de Migraciones

## Introducción

Le ayuda a transferir las configuraciones de su aplicación de un entorno a otro. Su enfoque principal es la migración de las «configuraciones de la aplicación». Si necesita una migración completa de datos, le recomendamos utilizar el «[Gestor de Copias de Seguridad](../backup-manager/index.mdx)» para respaldar y restaurar su aplicación.

## Instalación

El Gestor de Migraciones depende del [plugin Gestor de Copias de Seguridad](../backup-manager/index.mdx). Asegúrese de que este plugin ya esté instalado y activado.

## Proceso y Principios

El Gestor de Migraciones transfiere las tablas y los datos de la base de datos principal, basándose en reglas de migración específicas, de una instancia de aplicación a otra. Es importante tener en cuenta que no migra datos de bases de datos externas ni de subaplicaciones.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Reglas de Migración

### Reglas integradas

La gestión de migraciones admite las siguientes tres reglas:

- **Solo estructura:** Sincroniza solo la estructura de la tabla. No inserta ni actualiza datos.
- **Sobrescribir:** Borra los registros existentes de la tabla y luego inserta datos nuevos.
- **Omitir:** No realiza ninguna operación sobre la tabla.

**Notas:**
- Sobrescribir también sincroniza cambios de estructura.
- Las tablas de datos de negocio definidas por el usuario suelen usar solo estructura para evitar sobrescribir datos de producción.

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