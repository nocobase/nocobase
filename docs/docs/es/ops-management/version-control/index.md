---
pkg: '@nocobase/plugin-version-control'
title: "Control de versiones"
description: "Guía del plugin de control de versiones: guardar versiones automáticamente durante la construcción con IA, crear y restaurar versiones manualmente, configurar la retención, el atajo y las colecciones de usuario incluidas."
keywords: "Control de versiones,Version control,gestión operativa,AI Builder,nocobase-revision,nb revision create,crear versión,restaurar versión,NocoBase"
---

# Control de versiones

En NocoBase, **Control de versiones** te permite guardar una versión recuperable de la aplicación actual. Puedes crear versiones manualmente, restaurar una versión guardada cuando lo necesites y hacer que AI Builder guarde versiones automáticamente después de hitos significativos.

El control de versiones depende de [Gestión de copias de seguridad](../backup-manager/index.mdx) para guardar y restaurar estados de la aplicación. Antes de usar el control de versiones, habilita primero la gestión de copias de seguridad.

:::warning Nota

Las ediciones Community y Standard no incluyen el plugin de control de versiones. Si necesitas guardar un estado recuperable de la aplicación, usa [Gestión de copias de seguridad](../backup-manager/index.mdx): crea una copia de seguridad manual antes de los cambios importantes y restaura la copia correspondiente cuando necesites volver atrás.

:::

## Versiones automáticas con IA

Después de habilitar el plugin de control de versiones, AI Builder cuenta con una capa adicional de recuperación. Cuando un AI Agent empieza a trabajar en una solicitud, revisa las NocoBase Skills disponibles para la aplicación actual. Si encuentra la skill `nocobase-revision`, puede guardar hitos importantes de construcción como versiones recuperables.

![La IA detecta la skill nocobase-revision al comenzar la construcción](https://static-docs.nocobase.com/20260611115845.png)

Cuando la IA completa una parte que puede revisarse por separado, como crear una página, crear un conjunto de colecciones o configurar un flujo de trabajo, ejecuta `nb revision create` mediante NocoBase CLI. No necesitas hacer clic manualmente en 「Create version」 cada vez, y los ajustes pequeños no generarán demasiados registros de versión.

![La IA crea una versión después de construir](https://static-docs.nocobase.com/20260611115804.png)

Estas versiones aparecen en la lista de versiones. Si los cambios posteriores no son los esperados, puedes restaurar el hito anterior y continuar ajustando desde ahí.

## Abrir el plugin

Después de habilitar el plugin, aparece el menú 「Version control」 en la barra superior. Desde ahí puedes crear una versión directamente o ir a la lista de versiones.

También puedes abrir la página del plugin desde 「System settings / Version control」. El atajo predeterminado para crear una versión es `Ctrl + K`, y puedes cambiarlo en la pestaña de configuración.

![Menú Version control](https://static-docs.nocobase.com/20260611112317.png)

## Crear una versión

Haz clic en 「Create version」, escribe una descripción y guarda. La descripción puede tener hasta 2000 caracteres. Suele usarse para registrar el contexto del cambio, por ejemplo “Ajuste de campos y permisos del flujo de aprobación”.

![Crear una versión](https://static-docs.nocobase.com/20260611112739.png)

Después de hacer clic en guardar, la lista muestra primero una entrada temporal en estado “Saving”. Cuando termina, la versión aparece en la lista.

Puntos clave:

- El nombre de la versión se genera automáticamente
- Crear una versión desde la barra superior, el atajo o la página de lista tiene el mismo efecto
- La lista muestra nombre, descripción, tamaño del archivo, fecha de creación, creador y acciones disponibles

## Administrar y restaurar versiones

La lista de versiones ofrece principalmente estas acciones:

- 「Refresh」 vuelve a cargar la lista actual
- 「Delete」 elimina una versión o varias versiones seleccionadas
- 「Restore」 restaura la aplicación al estado guardado en esa versión

:::warning Atención

Restaurar una versión sobrescribe la configuración actual de la aplicación y los datos incluidos en esa versión. Se recomienda crear primero una versión del estado actual para poder volver atrás si hace falta.

:::

Después de hacer clic en 「Restore」, la aplicación entra brevemente en modo de mantenimiento mientras se ejecuta la restauración. No envíes otra restauración durante ese tiempo. Si falla, la interfaz muestra una notificación de error.

## Configurar las reglas de versión

Abre la pestaña 「Settings」 para controlar la retención y el contenido de cada versión.

![](https://static-docs.nocobase.com/20260526220720.png)

La configuración incluye:

- `Versions to keep`: número máximo de versiones guardadas. Las versiones antiguas se eliminan automáticamente cuando se supera el límite
- `Shortcut: create version`: atajo para crear una versión. Presiona `Ctrl + una letra` para configurarlo y `Backspace` para borrarlo
- `User collections`: selecciona qué datos de colecciones creadas por usuarios deben incluirse en las versiones guardadas

:::tip

De forma predeterminada, las versiones guardadas no incluyen datos de colecciones creadas por usuarios. Solo necesitas seleccionar colecciones aquí cuando quieras restaurar también parte de los datos de negocio.

:::

Si incluyes una colección de usuario, NocoBase también incluye automáticamente las colecciones relacionadas, por lo que la restauración suele ser más completa.

## Enlaces relacionados

- [Gestión de copias de seguridad](../backup-manager/index.mdx) — capacidad base de la que depende el control de versiones
- [Gestión de migraciones](../migration-manager/index.md) — mover la configuración de la aplicación entre entornos
- [Gestión de publicaciones](../release-management/index.md) — planificar flujos de publicación con copias de seguridad, migraciones y variables
- [Inicio rápido del Constructor de IA](../../ai-builder/index.md) — completar modelado de datos, configuración de páginas y orquestación de flujos de trabajo con lenguaje natural
