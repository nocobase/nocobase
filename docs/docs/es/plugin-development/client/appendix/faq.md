---
title: "FAQ y guía de resolución de problemas"
description: "Problemas frecuentes en el desarrollo de plugins de cliente NocoBase: el plugin no aparece, los bloques no se ven, las traducciones no se aplican, no se encuentran rutas, el hot reload no funciona, errores en el build, fallos de despliegue, etc."
keywords: "FAQ,problemas frecuentes,resolución de problemas,Troubleshooting,NocoBase,build,despliegue,tar,axios"
---

# FAQ y guía de resolución de problemas

Aquí hemos recopilado los problemas más habituales al desarrollar plugins de cliente. Si se topa con un caso de "lo escribí bien pero no funciona", busque primero por aquí.

## Sobre el plugin

### Tras crear el plugin no aparece en el gestor

Compruebe que ejecutó `yarn pm create` en lugar de crear el directorio a mano. `yarn pm create`, además de generar archivos, registra el plugin en la tabla `applicationPlugins` de la base de datos. Si creó el directorio manualmente, ejecute `yarn nocobase upgrade` para que se vuelva a escanear.

### Tras activar el plugin la página no cambia

Verifique en este orden:

1. Que ejecutó `yarn pm enable <pluginName>`.
2. Refresque el navegador (a veces hace falta forzar el refresco con `Ctrl+Shift+R`).
3. Compruebe la consola del navegador en busca de errores.

### Tras modificar el código la página no se actualiza

El comportamiento del hot reload depende del tipo de archivo:

| Tipo de archivo | Tras modificarlo |
| --- | --- |
| `.tsx` / `.ts` en `src/client-v2/` | Hot reload automático, no hay que hacer nada |
| Archivos de traducción en `src/locale/` | **Reiniciar la aplicación** |
| Añadir o modificar Collections en `src/server/collections/` | Ejecutar `yarn nocobase upgrade` |

Si modificó código del cliente y no se aplicó, primero pruebe a refrescar el navegador.

## Sobre las rutas

### No se accede a la ruta de página registrada

Las rutas de NocoBase v2 incluyen por defecto el prefijo `/v2`. Por ejemplo, si registra `path: '/hello'`, la URL real es `/v2/hello`:

```ts
this.router.add('hello', {
  path: '/hello', // URL real -> /v2/hello
  componentLoader: () => import('./pages/HelloPage'),
});
```

Para más detalles, consulte [Router](../router).

### La página de configuración aparece en blanco al entrar

Si el menú de la configuración aparece pero el contenido está vacío, suele ser por uno de estos motivos:

**Motivo 1: en client v1 se usó `componentLoader`**

`componentLoader` es la forma de client-v2; en client v1 hay que usar `Component` y pasar el componente directamente:

```ts
// ❌ client v1 no admite componentLoader
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  componentLoader: () => import('./pages/MyPage'),
});

// ✅ En client v1 use Component
import MyPage from './pages/MyPage';
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  Component: MyPage,
});
```

**Motivo 2: el componente de la página no tiene `export default`**

`componentLoader` requiere que el módulo tenga export por defecto; sin `default` no se carga.

## Sobre los bloques

### Mi bloque personalizado no aparece en "Añadir bloque"

Compruebe que registró el modelo en `load()`:

```ts
this.flowEngine.registerModelLoaders({
  MyBlockModel: {
    loader: () => import('./models/MyBlockModel'),
  },
});
```

Si utiliza `registerModels` (sin carga bajo demanda), asegúrese de que `models/index.ts` exporta correctamente el modelo.

### Tras añadir el bloque, mi tabla no está en la lista de Collections

Las tablas definidas con `defineCollection` son tablas internas del servidor y, por defecto, no aparecen en la lista de Collections de la UI.

**Recomendación**: añada la tabla correspondiente desde la "[Gestión de fuentes de datos](../../../data-sources/data-source-main/index.md)" en la interfaz de NocoBase. Tras configurar los campos y los tipos de interface, la tabla aparecerá automáticamente en la lista de Collections del bloque.

Si realmente necesita registrarla desde el código del plugin (por ejemplo, en un escenario de demostración), puede usar `addCollection`. Consulte [Crear un plugin de gestión de datos full-stack](../examples/fullstack-plugin). Atención: hay que registrarla a través del patrón `eventBus`, no llamando directamente desde `load()`, ya que `ensureLoaded()` se ejecuta después de `load()` y limpia y vuelve a fijar todas las Collections.

### Quiero que mi bloque personalizado solo se enlace a una tabla concreta

Sobrescriba `static filterCollection` en el modelo; solo aparecerán en la lista las Collections que devuelvan `true`:

```ts
export class MyBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'myTable';
  }
}
```

## Sobre los campos

### Mi componente de campo personalizado no aparece en el desplegable "Componente de campo"

Verifique en este orden:

1. Que llamó a `DisplayItemModel.bindModelToInterface('ModelName', ['input'])` y que el tipo de interface coincide: `input` para texto de una sola línea, `checkbox` para casillas de verificación, etc.
2. Que el modelo está registrado en `load()` (con `registerModels` o `registerModelLoaders`).
3. Que el modelo de campo llamó a `define({ label })`.

### El desplegable "Componente de campo" muestra el nombre de la clase

Olvidó llamar a `define({ label })` en el modelo de campo. Añádalo:

```ts
MyFieldModel.define({
  label: tExpr('My field'),
});
```

Asegúrese también de que existen las claves correspondientes en los archivos de `src/locale/`; si no, en entornos en chino seguirá viéndose el original en inglés.

## Sobre las acciones

### Mi botón de acción personalizado no aparece en "Configurar acciones"

Compruebe que el modelo tiene el `static scene` correcto:

| Valor | Dónde aparece |
| --- | --- |
| `ActionSceneEnum.collection` | Barra de acciones superior del bloque (junto a "Nuevo", por ejemplo) |
| `ActionSceneEnum.record` | Columna de acciones de cada fila de la tabla (junto a "Editar", "Eliminar", etc.) |
| `ActionSceneEnum.both` | En ambos escenarios |

### El botón de acción no responde al clic

Compruebe que `registerFlow` tiene `on` configurado como `'click'`:

```ts
MyActionModel.registerFlow({
  key: 'myFlow',
  on: 'click', // Escuchar el clic del botón
  steps: {
    doSomething: {
      async handler(ctx) {
        // Su lógica
      },
    },
  },
});
```

:::warning Atención

El `uiSchema` dentro de `registerFlow` corresponde a la UI del panel de configuración (modo configuración), no a un diálogo en tiempo de ejecución. Si quiere abrir un formulario al pulsar el botón, debe abrirlo desde el `handler` con `ctx.viewer.dialog()`.

:::

## Sobre la internacionalización

### Las traducciones no se aplican

Causas más comunes:

- **La primera vez que añade** el directorio o un archivo en `src/locale/`: hay que reiniciar la aplicación.
- **La clave de traducción no coincide**: compruebe que la clave es idéntica a la cadena del código, atendiendo a espacios y mayúsculas.
- **En el componente se usó `ctx.t()` directamente**: `ctx.t()` no inyecta automáticamente el namespace del plugin; en los componentes use el hook `useT()` (importado de `locale.ts`).

### Confundir los escenarios de `tExpr()`, `useT()` y `this.t()`

Los tres métodos se usan en escenarios distintos; usar uno por otro provoca errores o que la traducción no se aplique:

| Método | Dónde se usa | Notas |
| --- | --- | --- |
| `tExpr()` | Definiciones estáticas como `define()`, `registerFlow()` | Al cargar el módulo i18n aún no está inicializado; se usa traducción diferida |
| `useT()` | Dentro de un componente React | Devuelve la función de traducción enlazada al namespace del plugin |
| `this.t()` | Dentro de `load()` del Plugin | Inyecta automáticamente el nombre del paquete del plugin como namespace |

Para más detalles, consulte [Internacionalización (i18n)](../component/i18n).

## Sobre las peticiones API

### La petición devuelve 403 Forbidden

Suele faltar la configuración ACL en el servidor. Por ejemplo, si su Collection se llama `todoItems`, en el `load()` del plugin de servidor debe permitir las acciones correspondientes:

```ts
// Solo permitir consulta
this.app.acl.allow('todoItems', ['list', 'get'], 'loggedIn');

// Permitir CRUD completo
this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
```

`'loggedIn'` indica que basta con estar autenticado. Si no se configura `acl.allow`, por defecto solo los administradores pueden operar.

### La petición devuelve 404 Not Found

Verifique en este orden:

- Si usa `defineCollection`, compruebe que el nombre de la Collection está bien escrito.
- Si usa `resourceManager.define`, compruebe los nombres del resource y de la action.
- Compruebe el formato de la URL: el formato de la API de NocoBase es `resourceName:actionName`, por ejemplo `todoItems:list`, `externalApi:get`.

## Sobre el build y el despliegue

### `yarn build --tar` falla con "no paths specified to add to archive"

Al ejecutar `yarn build <pluginName> --tar` aparece:

```bash
TypeError: no paths specified to add to archive
```

Pero `yarn build <pluginName>` (sin `--tar`) funciona. Esto suele deberse a que el `.npmignore` del plugin **utiliza la sintaxis de negación** (prefijo `!` de npm). Al hacer el `--tar`, NocoBase lee cada línea de `.npmignore` y le añade un `!` delante para convertirla en un patrón de exclusión de `fast-glob`. Si su `.npmignore` ya usa negaciones, por ejemplo:

```
*
!dist
!package.json
```

tras procesarlo se convierte en `['!*', '!!dist', '!!package.json', '**/*']`. `!*` excluye todos los archivos del nivel raíz (incluido `package.json`), y `!!dist` no se interpreta como "volver a incluir dist", la negación pierde efecto. Si `dist/` está vacío o el build no produce archivos, la lista final queda vacía y `tar` lanza este error.

**Solución:** no use sintaxis de negación en `.npmignore`. Liste solo los directorios que quiere excluir:

```
/node_modules
/src
```

La lógica del empaquetado los convierte en patrones de exclusión (`!./node_modules`, `!./src`) y añade `**/*` para incluir todo lo demás. Es una forma sencilla y libre de los problemas de negación.

### El plugin se sube a producción y falla al activarlo (en local funciona)

El plugin funciona perfectamente en local pero, tras subirlo a producción mediante el "Gestor de plugins", al activarlo aparece un error similar a:

```bash
TypeError: Cannot assign to read only property 'constructor' of object '[object Object]'
```

Esto suele deberse a que **el plugin empaqueta dependencias internas de NocoBase dentro de su propio `node_modules/`**. El sistema de build de NocoBase mantiene una [lista de externals](../../dependency-management) que enumera los paquetes (por ejemplo `react`, `antd`, `axios`, `lodash`, etc.) que proporciona el host de NocoBase y que no deben empaquetarse en el plugin. Si el plugin trae una copia privada, en tiempo de ejecución puede chocar con la versión ya cargada por el host y provocar errores extraños.

**Por qué en local funciona:** en desarrollo el plugin está en `packages/plugins/` y no tiene `node_modules/` privado; las dependencias se resuelven contra las versiones ya cargadas en la raíz del proyecto y no hay conflicto.

**Solución:** mueva las `dependencies` del `package.json` del plugin a `devDependencies`. El sistema de build de NocoBase decidirá automáticamente qué dependencias del plugin debe empaquetar:

```diff
{
- "dependencies": {
-   "axios": "1.7.7"
- },
+ "devDependencies": {
+   "axios": "1.7.7"
+ },
}
```

Después vuelva a compilar y empaquetar. Así el `dist/node_modules/` del plugin no contendrá esos paquetes y, en tiempo de ejecución, se utilizarán los del host.

:::tip Principio general

El sistema de build de NocoBase mantiene una [lista de externals](../../dependency-management) con los paquetes (por ejemplo `react`, `antd`, `axios`, `lodash`, etc.) provistos por el host. Los plugins no deben empaquetarlos por su cuenta. Todas las dependencias del plugin deben ir en `devDependencies`; el sistema de build decide automáticamente cuáles empaquetar en `dist/node_modules/` y cuáles deja al host.

:::

## Enlaces relacionados

- [Plugin](../plugin): entrada del plugin y ciclo de vida.
- [Router](../router): registro de rutas y prefijo `/v2`.
- [Visión general de FlowEngine](../flow-engine/index.md): uso básico de FlowModel.
- [FlowEngine → Extensión de bloques](../flow-engine/block): BlockModel, TableBlockModel, `filterCollection`.
- [FlowEngine → Extensión de campos](../flow-engine/field): FieldModel, `bindModelToInterface`.
- [FlowEngine → Extensión de acciones](../flow-engine/action): ActionModel, ActionSceneEnum.
- [Internacionalización (i18n)](../component/i18n): archivos de traducción, `useT`, `tExpr`.
- [Context → Capacidades comunes](../ctx/common-capabilities): `ctx.api`, `ctx.viewer`, etc.
- [Servidor → Collections](../../server/collections): `defineCollection` y `addCollection`.
- [Servidor → ACL](../../server/acl): configuración de permisos.
- [Build de plugins](../../build): configuración del build, lista de externals y empaquetado.
