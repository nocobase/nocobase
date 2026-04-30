---
title: "Inicio rápido del desarrollo de plugins con AI"
description: "Desarrolle plugins de NocoBase asistido por AI. Describa su necesidad en una sola frase y genere automáticamente código de frontend y backend, tablas de datos, configuración de permisos e internacionalización."
keywords: "AI Development, desarrollo con AI, NocoBase AI, desarrollo de plugins, programación con AI, Skills, inicio rápido"
---

# Inicio rápido del desarrollo de plugins con AI

El desarrollo de plugins con AI es la capacidad de desarrollo asistido por AI que ofrece NocoBase. Usted puede describir sus necesidades en lenguaje natural y la AI generará automáticamente código completo de frontend y backend, incluyendo tablas de datos, API, bloques de frontend, permisos e internacionalización. Le proporciona una experiencia de desarrollo de plugins más moderna y eficiente.

La capacidad de desarrollo de plugins con AI se basa en el Skill [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development). Si ya ha inicializado su entorno mediante el CLI de NocoBase (`nb init`), este Skill se instalará automáticamente.

## Inicio rápido

Si ya ha instalado el [CLI de NocoBase](../ai/quick-start.md), puede omitir este paso.

### Instalación con AI en un solo paso

Copie el siguiente prompt a su asistente de AI (Claude Code, Codex, Cursor, Trae, etc.) para completar automáticamente la instalación y la configuración:

```
Ayúdame a instalar el CLI de NocoBase y a completar la inicialización: https://docs.nocobase.com/es/ai/ai-quick-start.md (acceda directamente al contenido del enlace)
```

### Instalación manual

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

El navegador abrirá automáticamente la página de configuración visual y le guiará a instalar los Skills de NocoBase, configurar la base de datos e iniciar la aplicación. Para los pasos detallados, consulte el [Inicio rápido](../ai/quick-start.md).

:::warning Atención

- NocoBase está migrando de `client` (v1) a `client-v2`. Actualmente `client-v2` aún está en desarrollo. El código de cliente generado por el desarrollo con AI se basa en `client-v2` y solo puede usarse en la ruta `/v2/`. Está disponible para que lo pruebe, pero no se recomienda su uso directo en producción.
- El código generado por la AI no siempre es 100% correcto. Le recomendamos revisarlo antes de habilitarlo. Si encuentra problemas en tiempo de ejecución, puede enviar el mensaje de error a la AI para que continúe diagnosticando y corrigiendo. Normalmente, unas pocas rondas de conversación son suficientes para resolverlos.
- Se recomienda utilizar modelos de la serie GPT o Claude para el desarrollo, ya que ofrecen los mejores resultados. Otros modelos también pueden funcionar, aunque la calidad de la generación puede variar.

:::

## De una frase a un plugin completo

Una vez completada la instalación, puede indicarle directamente a la AI en lenguaje natural qué plugin desea desarrollar. A continuación se presentan varios escenarios reales para que perciba la capacidad del desarrollo de plugins con AI.

### Desarrollar un plugin de marca de agua con una sola frase

Con un solo prompt, la AI puede generar un plugin de marca de agua completo, incluyendo la lógica de renderizado del frontend, la detección antimanipulación, la API de almacenamiento de configuración del backend y la página de configuración del plugin.

```
Ayúdame a desarrollar un plugin de marca de agua para NocoBase utilizando el skill nocobase-plugin-development.
Requisitos: superponer una marca de agua semitransparente sobre la página que muestre el nombre del usuario actualmente conectado, para evitar fugas por capturas de pantalla.
Detectar periódicamente si el DOM de la marca de agua ha sido eliminado y, en ese caso, regenerarla.
Permitir configurar el texto, la opacidad y el tamaño de fuente de la marca de agua desde la página de configuración del plugin.
El plugin se llamará @my-project/plugin-watermark.
```

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/nocobase-plugin-dev-compressed.mp4" type="video/mp4">
</video>

Durante todo el proceso, usted solo necesita describir las necesidades y tomar decisiones. La AI se encarga del resto automáticamente. ¿Quiere ver el proceso completo? → [Práctica: Desarrollo del plugin de marca de agua](./watermark-plugin)

### Crear un componente de campo personalizado con una sola frase

¿Quiere que un campo integer se muestre como una valoración con estrellas? Indíquele a la AI el efecto de visualización deseado y le ayudará a generar un FlowModel personalizado para reemplazar el componente de renderizado predeterminado del campo.

```
Ayúdame a desarrollar un plugin de NocoBase utilizando el skill nocobase-plugin-development, llamado @my-scope/plugin-rating.
Crea un componente de visualización de campo personalizado (FieldModel) que renderice los campos de tipo integer como iconos de estrellas,
con soporte de 1 a 5 puntos. Al hacer clic en una estrella se debe poder modificar directamente el valor de la valoración y guardarlo en la base de datos.
```

![Efecto del componente Rating](https://static-docs.nocobase.com/20260422170712.png)

Para conocer más usos de las capacidades, consulte [Capacidades soportadas](./capabilities).

## ¿Qué puede hacer la AI por usted?

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

Para una explicación detallada de cada capacidad y ejemplos de prompts, consulte → [Capacidades soportadas](./capabilities)

## Enlaces relacionados

- [Práctica: Desarrollo del plugin de marca de agua](./watermark-plugin) — Caso práctico completo de desarrollo de plugins con AI, de una frase a un plugin funcional
- [Capacidades soportadas](./capabilities) — Todo lo que la AI puede hacer por usted, con ejemplos de prompts
- [CLI de NocoBase](../ai/quick-start.md) — Herramienta de línea de comandos para instalar y gestionar NocoBase
- [Referencia del CLI de NocoBase](../api/cli/index.md) — Descripción completa de los parámetros de todos los comandos
- [Desarrollo de plugins](../plugin-development/index.md) — Guía completa de desarrollo de plugins de NocoBase
- [Inicio rápido de la creación con AI](../ai-builder/index.md) — Crear aplicaciones de NocoBase con AI (sin escribir código)
