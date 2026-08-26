---
title: "Cheatsheet del desarrollo de plugins"
description: "Cheatsheet del desarrollo de plugins NocoBase: qué hacer → en qué archivo → con qué API. Localice rápidamente dónde colocar cada pieza de código."
keywords: "cheatsheet,chuleta,formas de registro,ubicación de archivos,NocoBase"
---

# Cheatsheet del desarrollo de plugins

Cuando desarrollamos un plugin a menudo nos preguntamos "¿en qué archivo va esto y qué API debo usar?". Esta chuleta sirve para localizarlo rápido.

## Estructura del directorio del plugin

Al crear un plugin con `yarn pm create @my-project/plugin-name` se genera la siguiente estructura. No cree los directorios a mano, ya que podría omitir los pasos de registro y el plugin no funcionaría. Para más detalles, consulte [Crear el primer plugin](../../write-your-first-plugin).

```bash
plugin-name/
├── src/
│   ├── client-v2/              # Código del cliente (v2)
│   │   ├── plugin.tsx          # Entrada del plugin del cliente
│   │   ├── locale.ts           # Hooks de traducción useT / tExpr
│   │   ├── models/             # FlowModel (bloques, campos, acciones)
│   │   └── pages/              # Componentes de página
│   ├── client/                 # Código del cliente (v1, compatibilidad)
│   │   ├── plugin.tsx
│   │   ├── locale.ts
│   │   ├── models/
│   │   └── pages/
│   ├── server/                 # Código del servidor
│   │   ├── plugin.ts           # Entrada del plugin del servidor
│   │   └── collections/        # Definiciones de Collection
│   └── locale/                 # Archivos de traducción multilingües
│       ├── zh-CN.json
│       └── en-US.json
├── client-v2.js                # Entrada en la raíz (apunta al artefacto del build)
├── client-v2.d.ts
├── client.js
├── client.d.ts
├── server.js
├── server.d.ts
└── package.json
```

## Cliente: qué quiero hacer → cómo se escribe

| Qué quiero hacer | En qué archivo | Qué API uso | Documentación |
| --- | --- | --- | --- |
| Registrar una ruta de página | `load()` de `plugin.tsx` | `this.router.add()` | [Router](../router) |
| Registrar una página de configuración | `load()` de `plugin.tsx` | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router) |
| Registrar un bloque personalizado | `load()` de `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Extensión de bloques](../flow-engine/block) |
| Registrar un campo personalizado | `load()` de `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Extensión de campos](../flow-engine/field) |
| Registrar una acción personalizada | `load()` de `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Extensión de acciones](../flow-engine/action) |
| Hacer que una tabla interna aparezca en la lista del bloque | `load()` de `plugin.tsx` | `mainDS.addCollection()` | [Collections](../../server/collections) |
| Traducir los textos del plugin | `locale/zh-CN.json` + `locale/en-US.json` | — | [Internacionalización (i18n)](../component/i18n) |

## Servidor: qué quiero hacer → cómo se escribe

| Qué quiero hacer | En qué archivo | Qué API uso | Documentación |
| --- | --- | --- | --- |
| Definir una tabla | `server/collections/xxx.ts` | `defineCollection()` | [Collections](../../server/collections) |
| Extender una tabla existente | `server/collections/xxx.ts` | `extendCollection()` | [Collections](../../server/collections) |
| Registrar un endpoint personalizado | `load()` de `server/plugin.ts` | `this.app.resourceManager.define()` | [ResourceManager](../../server/resource-manager) |
| Configurar permisos | `load()` de `server/plugin.ts` | `this.app.acl.allow()` | [ACL](../../server/acl) |
| Cargar datos iniciales en la instalación | `install()` de `server/plugin.ts` | `this.db.getRepository().create()` | [Plugin](../../server/plugin) |

## Cheatsheet de FlowModel

| Qué quiero hacer | De qué clase base hereda | API claves |
| --- | --- | --- |
| Bloque puramente de presentación | `BlockModel` | `renderComponent()` + `define()` |
| Bloque ligado a una Collection (renderizado personalizado) | `CollectionBlockModel` | `createResource()` + `renderComponent()` |
| Bloque de tabla completo (personalización sobre el de fábrica) | `TableBlockModel` | `filterCollection()` + `customModelClasses` |
| Componente de presentación de campo | `ClickableFieldModel` | `renderComponent(value)` + `bindModelToInterface()` |
| Botón de acción | `ActionModel` | `static scene` + `registerFlow({ on: 'click' })` |

## Cheatsheet de métodos de traducción

| Escenario | Qué usar | De dónde se importa |
| --- | --- | --- |
| Dentro de `load()` del Plugin | `this.t('key')` | Incluido en la clase base Plugin |
| Dentro de un componente React | `const t = useT(); t('key')` | `locale.ts` |
| Definición estática de FlowModel (`define()`, `registerFlow()`) | `tExpr('key')` | `locale.ts` |

## Cheatsheet de llamadas a APIs habituales

| Qué quiero hacer | En el Plugin | En un componente |
| --- | --- | --- |
| Hacer una petición API | `this.context.api.request()` | `ctx.api.request()` |
| Obtener una traducción | `this.t()` | `useT()` |
| Acceder al logger | `this.context.logger` | `ctx.logger` |
| Registrar una ruta | `this.router.add()` | — |
| Navegar entre páginas | — | `ctx.router.navigate()` |
| Abrir un diálogo | — | `ctx.viewer.dialog()` |

## Enlaces relacionados

- [Visión general del desarrollo en cliente](../index.md): ruta de aprendizaje e índice rápido.
- [Plugin](../plugin): entrada del plugin y ciclo de vida.
- [FAQ y guía de resolución de problemas](./faq): problemas habituales.
- [Router](../router): registro de rutas de páginas.
- [FlowEngine → Extensión de bloques](../flow-engine/block): familia BlockModel.
- [FlowEngine → Extensión de campos](../flow-engine/field): desarrollo con FieldModel.
- [FlowEngine → Extensión de acciones](../flow-engine/action): desarrollo con ActionModel.
- [Collections](../../server/collections): `defineCollection` y tipos de campo.
- [Internacionalización (i18n)](../component/i18n): archivos de traducción.
- [ResourceManager](../../server/resource-manager): endpoints REST personalizados.
- [ACL](../../server/acl): configuración de permisos.
- [Plugin (servidor)](../../server/plugin): ciclo de vida del plugin de servidor.
- [Crear el primer plugin](../../write-your-first-plugin): creación del esqueleto.
