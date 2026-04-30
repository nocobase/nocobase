---
title: "Capacidades soportadas"
description: "Todas las capacidades soportadas por el desarrollo con AI: scaffolding, tablas de datos, bloques, campos, acciones, páginas de configuración, API, permisos, internacionalización y scripts de actualización."
keywords: "desarrollo con AI, capacidades, desarrollo de plugins, scaffolding, tablas de datos, bloques, campos, acciones, permisos, internacionalización"
---

# Capacidades soportadas

:::tip Requisitos previos

Antes de leer esta página, asegúrese de haber completado la preparación del entorno siguiendo el [Inicio rápido del desarrollo de plugins con AI](./index.md).

:::

La capacidad de desarrollo de plugins con AI se basa en el Skill [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development). Si ya ha inicializado su entorno mediante el [CLI de NocoBase](../ai/quick-start.md) (`nb init`), este Skill se instalará automáticamente.

A continuación se enumeran todas las cosas que la AI puede hacer por usted actualmente. Cada capacidad incluye ejemplos de prompts que puede copiar y modificar para adaptarlos a sus necesidades.

:::warning Atención

- NocoBase está migrando de `client` (v1) a `client-v2`. Actualmente `client-v2` aún está en desarrollo. El código de cliente generado por el desarrollo con AI se basa en `client-v2` y solo puede usarse en la ruta `/v2/`. Está disponible para que lo pruebe, pero no se recomienda su uso directo en producción.
- El código generado por la AI no siempre es 100% correcto. Le recomendamos revisarlo antes de habilitarlo. Si encuentra problemas en tiempo de ejecución, puede enviar el mensaje de error a la AI para que continúe diagnosticando y corrigiendo. Normalmente, unas pocas rondas de conversación son suficientes para resolverlos.
- Se recomienda utilizar modelos de la serie GPT o Claude para el desarrollo, ya que ofrecen los mejores resultados. Otros modelos también pueden funcionar, aunque la calidad de la generación puede variar.

:::

## Buenas prácticas

- **Indíquele explícitamente a la AI que va a crear o modificar un plugin de NocoBase y proporcione el nombre del plugin**: por ejemplo, «Ayúdame a desarrollar un plugin de NocoBase utilizando el skill nocobase-plugin-development, llamado @my-scope/plugin-rating». Si no proporciona el nombre del plugin, la AI puede no saber dónde generar el código.
- **Especifique en el prompt el uso del skill nocobase-plugin-development**: por ejemplo, «Ayúdame a desarrollar un plugin de NocoBase utilizando el skill nocobase-plugin-development...». De este modo, el Agent de AI puede leer directamente las capacidades del Skill, evitando entrar en modo plan e ignorar los Skills.
- **Ejecute el Agent de AI en el directorio raíz del repositorio del código fuente de NocoBase**: así la AI podrá localizar automáticamente la estructura del proyecto, las dependencias y los plugins existentes. Si no se encuentra en el directorio raíz del código fuente, deberá indicarle adicionalmente al Agent de AI la ruta del repositorio.

## Índice rápido

| Quiero…                                            | La AI puede ayudarle a…                                                       |
| -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Crear un nuevo plugin                              | Generar el scaffolding completo, incluida la estructura de directorios de frontend y backend |
| Definir tablas de datos                            | Generar definiciones de Collection con todos los tipos de campos y relaciones |
| Crear un bloque personalizado                      | Generar BlockModel + panel de configuración + registro en el menú «Añadir bloque» |
| Crear un campo personalizado                       | Generar FieldModel + vinculación a la interfaz del campo                      |
| Añadir un botón de acción personalizado            | Generar ActionModel + ventana emergente / cajón / cuadro de confirmación     |
| Crear una página de configuración del plugin       | Generar el formulario de frontend + API de backend + almacenamiento           |
| Escribir una API personalizada                     | Generar Resource Action + registro de rutas + configuración de ACL            |
| Configurar permisos                                | Generar reglas de ACL y controlar el acceso por rol                           |
| Soporte multilingüe                                | Generar automáticamente paquetes de idiomas en chino e inglés                |
| Escribir scripts de actualización                  | Generar Migration con soporte de DDL y migración de datos                     |

## Scaffolding del plugin

La AI puede generar una estructura completa de directorios de un plugin de NocoBase a partir de la descripción de sus necesidades, incluyendo los archivos de entrada de frontend y backend, las definiciones de tipos y la configuración básica.

Ejemplo de prompt:

```
Ayúdame a crear un plugin de NocoBase llamado @my-scope/plugin-todo.
```

La AI ejecutará `yarn pm create @my-scope/plugin-todo` y generará la estructura de directorios estándar:

```
packages/plugins/@my-scope/plugin-todo/
├── src/
│   ├── server/
│   │   └── plugin.ts
│   ├── client-v2/
│   │   └── plugin.tsx
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── package.json
└── ...
```

## Definición de tablas de datos

La AI soporta la generación de definiciones de Collection para todos los tipos de campos de NocoBase, incluidas las relaciones (uno a muchos, muchos a muchos, etc.).

Ejemplo de prompt:

```
Ayúdame a desarrollar un plugin de NocoBase utilizando el skill nocobase-plugin-development, llamado @my-scope/plugin-order.
Luego, define dentro una tabla "pedidos" con los siguientes campos: número de pedido (autoincremental), nombre del cliente (cadena),
importe (decimal), estado (selección única: pendiente / en proceso / completado), fecha de creación.
La relación entre pedido y cliente es de muchos a uno.
```

La AI generará la definición `defineCollection` con los tipos de campos, valores predeterminados, configuraciones de relaciones, etc.

## Bloque personalizado

Los bloques son el método de extensión más fundamental del frontend de NocoBase. La AI puede ayudarle a generar el modelo del bloque, el panel de configuración y el registro en el menú.

Ejemplo de prompt:

```
Ayúdame a desarrollar un plugin de NocoBase utilizando el skill nocobase-plugin-development, llamado @my-scope/plugin-simple-block.
Crea un bloque de visualización personalizado (BlockModel) en el que el usuario pueda introducir contenido HTML desde el panel de configuración
y el bloque renderice ese HTML. Registra este bloque en el menú «Añadir bloque».
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

La AI generará el `BlockModel`, creará el panel de configuración mediante `registerFlow` + `uiSchema` y lo registrará en el menú «Añadir bloque».

Para un ejemplo completo, consulte [Crear un bloque de visualización personalizado](../plugin-development/client/examples/custom-block).

## Componente de campo personalizado

Si los componentes de renderizado de campos integrados en NocoBase no satisfacen sus necesidades, la AI puede ayudarle a crear un componente de visualización personalizado que reemplace el método de renderizado predeterminado del campo.

Ejemplo de prompt:

```
Ayúdame a desarrollar un plugin de NocoBase utilizando el skill nocobase-plugin-development, llamado @my-scope/plugin-rating.
Crea un componente de visualización de campo personalizado (FieldModel) que renderice los campos de tipo integer como iconos de estrellas,
con soporte de 1 a 5 puntos. Al hacer clic en una estrella se debe poder modificar directamente el valor de la valoración y guardarlo en la base de datos.
```

![Efecto del componente Rating](https://static-docs.nocobase.com/20260422170712.png)

La AI generará un `FieldModel` personalizado que reemplazará el componente de renderizado predeterminado del campo integer.

## Acción personalizada

Los botones de acción pueden aparecer en la parte superior del bloque (nivel collection), en la columna de acciones de cada fila de la tabla (nivel record) o en ambas posiciones simultáneamente. Al hacer clic en ellos pueden mostrar avisos, abrir formularios en ventanas emergentes, llamar a API, etc.

Ejemplo de prompt:

```
Ayúdame a desarrollar un plugin de NocoBase utilizando el skill nocobase-plugin-development, llamado @my-scope/plugin-simple-action.
Crea tres botones de acción personalizados (ActionModel):
1. Un botón de nivel collection que aparezca en la parte superior del bloque y muestre un aviso de éxito al hacer clic.
2. Un botón de nivel record que aparezca en la columna de acciones de cada fila de la tabla y, al hacer clic, muestre el ID del registro actual.
3. Un botón de nivel both que aparezca en ambas posiciones y muestre un aviso informativo al hacer clic.
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

La AI generará el `ActionModel`, controlará la posición de aparición del botón mediante `ActionSceneEnum` y manejará el evento de clic con `registerFlow({ on: 'click' })`.

Para un ejemplo completo, consulte [Crear un botón de acción personalizado](../plugin-development/client/examples/custom-action).

## Página de configuración del plugin

Muchos plugins necesitan una página de configuración para que los usuarios configuren parámetros, como la API Key de un servicio de terceros, la dirección de un Webhook, etc.

Ejemplo de prompt:

```
Ayúdame a desarrollar un plugin de NocoBase utilizando el skill nocobase-plugin-development, llamado @my-scope/plugin-settings-page.
Crea una página de configuración del plugin que registre una entrada «Configuración de servicio externo» en el menú «Configuración de plugins», con dos pestañas:
1. Pestaña «Configuración de API»: el formulario incluye API Key (cadena, obligatorio), API Secret (contraseña, obligatorio) y Endpoint (cadena, opcional), guardado en la base de datos a través de la API del backend.
2. Pestaña «Acerca de»: muestra el nombre del plugin y la información de la versión.
El frontend usa los componentes de formulario de Ant Design y el backend define dos interfaces: externalApi:get y externalApi:set.
```

![Efecto de la página de configuración del plugin](https://static-docs.nocobase.com/20260415160006.png)

La AI generará el componente de la página de configuración del frontend, las Resource Actions del backend, las definiciones de las tablas de datos y la configuración de ACL.

Para un ejemplo completo, consulte [Crear una página de configuración del plugin](../plugin-development/client/examples/settings-page).

## API personalizada

Si las interfaces CRUD integradas no son suficientes, la AI puede ayudarle a escribir una API REST personalizada. A continuación se muestra un ejemplo completo de integración entre frontend y backend: el backend define la tabla de datos y la API, y el frontend crea un bloque personalizado para mostrar los datos.

Ejemplo de prompt:

```
Ayúdame a desarrollar un plugin de NocoBase utilizando el skill nocobase-plugin-development, llamado @my-scope/plugin-todo.
Crea un plugin de gestión de datos Todo con integración entre frontend y backend:
1. El backend define una tabla todoItems con los campos: title (cadena), completed (booleano), priority (cadena, valor predeterminado medium).
2. El frontend crea un TableBlock personalizado que solo muestra los datos de todoItems.
3. El campo priority se muestra con etiquetas de colores (high en rojo, medium en naranja, low en verde).
4. Añade un botón "Crear Todo" que abra un formulario para crear un registro al hacer clic.
5. Los usuarios autenticados pueden realizar todas las operaciones CRUD.
```

![Efecto del plugin de gestión de datos Todo](https://static-docs.nocobase.com/20260408164204.png)

La AI generará la definición de Collection del lado del servidor, la Resource Action, la configuración de ACL, así como el `TableBlockModel`, el `FieldModel` personalizado y el `ActionModel` del lado del cliente.

Para un ejemplo completo, consulte [Crear un plugin de gestión de datos con integración entre frontend y backend](../plugin-development/client/examples/fullstack-plugin).

## Configuración de permisos

La AI configurará automáticamente reglas de ACL razonables para las API y los recursos generados. También puede especificar explícitamente los requisitos de permisos en el prompt:

Ejemplo de prompt:

```
Ayúdame a desarrollar un plugin de NocoBase utilizando el skill nocobase-plugin-development, llamado @my-scope/plugin-todo.
Define una tabla todoItems (campos title, completed, priority).
Requisitos de permisos: los usuarios autenticados pueden ver, crear y editar; solo el rol admin puede eliminar.
```

La AI configurará las reglas de acceso correspondientes en el lado del servidor mediante `this.app.acl.allow()`.

## Internacionalización

La AI generará por defecto los paquetes de idiomas en chino e inglés (`zh-CN.json` y `en-US.json`) sin que usted tenga que solicitarlo.

Si necesita otros idiomas:

```
Ayúdame a desarrollar un plugin de NocoBase utilizando el skill nocobase-plugin-development, llamado @my-scope/plugin-order.
Necesito soportar tres paquetes de idiomas: chino, inglés y japonés.
```

## Scripts de actualización

Cuando un plugin necesita actualizar la estructura de la base de datos o migrar datos, la AI puede ayudarle a generar scripts de Migration.

Ejemplo de prompt:

```
Ayúdame a escribir un script de actualización para el plugin de NocoBase @my-scope/plugin-order utilizando el skill nocobase-plugin-development.
Añade un nuevo campo "observaciones" (texto largo, opcional) a la tabla "pedidos" y rellena el campo de observaciones de los pedidos existentes con el valor predeterminado "ninguna".
```

La AI generará un archivo de Migration con número de versión que incluirá las operaciones DDL y la lógica de migración de datos.

## Enlaces relacionados

- [Inicio rápido del desarrollo de plugins con AI](./index.md) — Inicio rápido y resumen de capacidades
- [Práctica: Desarrollo del plugin de marca de agua](./watermark-plugin) — Caso práctico completo de desarrollo de plugins con AI
- [Desarrollo de plugins](../plugin-development/index.md) — Guía completa de desarrollo de plugins de NocoBase
- [CLI de NocoBase](../ai/quick-start.md) — Herramienta de línea de comandos para instalar y gestionar NocoBase
