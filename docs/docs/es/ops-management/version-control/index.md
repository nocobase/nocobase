---
title: "Control de versiones"
description: "Guía del plugin de control de versiones: crear versiones, restaurarlas, configurar la retención, el atajo y las colecciones de usuario incluidas."
keywords: "Control de versiones,Version control,gestión operativa,crear versión,restaurar versión,NocoBase"
---

# Control de versiones

En NocoBase, **Control de versiones** te permite guardar una versión recuperable de la aplicación actual. Puedes crear versiones manualmente, restaurar una versión guardada cuando lo necesites y usar la configuración del plugin para controlar cuántas versiones conservar, qué atajo usar y qué colecciones de usuario deben guardarse junto con la versión.

Depende de [Gestión de copias de seguridad](../backup-manager/index.mdx). Si el plugin de control de versiones ya está habilitado pero el sistema sigue mostrando errores relacionados, primero confirma que la gestión de copias de seguridad también esté habilitada.

## Abrir el plugin

Puedes abrirlo desde 「System settings」 → 「Version control」. También aparece un botón de control de versiones en la barra superior. Desde ahí puedes crear una versión directamente o ir a la lista de versiones. El atajo predeterminado para crear una versión es `Ctrl + K`, y puedes cambiarlo en la pestaña de configuración.

![](https://static-docs.nocobase.com/20260526220402.png)

## Crear una versión

Haz clic en 「Create version」, escribe una descripción y guarda. La descripción puede tener hasta 2000 caracteres. Suele usarse para registrar el contexto del cambio, por ejemplo “Ajuste de campos y permisos del flujo de aprobación”.

![](https://static-docs.nocobase.com/20260526220510.png)

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
