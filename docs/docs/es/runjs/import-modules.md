:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/import-modules).
:::

# Importación de módulos

En RunJS, puede utilizar dos tipos de módulos: **módulos integrados** (se acceden directamente a través de `ctx.libs` sin necesidad de importar) y **módulos externos** (se cargan bajo demanda mediante `ctx.importAsync()` o `ctx.requireAsync()`).

---

## Módulos integrados - ctx.libs (No requiere importación)

RunJS incluye varias librerías integradas a las que se puede acceder directamente a través de `ctx.libs`. **No es necesario** utilizar `import` ni realizar una carga asíncrona para estas.

| Propiedad | Descripción |
|------|------|
| **ctx.libs.React** | Núcleo de React, utilizado para JSX y Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (puede utilizarse para `createRoot`, etc.) |
| **ctx.libs.antd** | Librería de componentes Ant Design |
| **ctx.libs.antdIcons** | Iconos de Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): Expresiones matemáticas, operaciones de matrices, etc. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): Fórmulas similares a Excel (SUM, AVERAGE, etc.) |

### Ejemplo: React y antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Hacer clic</Button>);
```

### Ejemplo: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### Ejemplo: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## Módulos externos

Cuando necesite librerías de terceros, elija el método de carga según el formato del módulo:

- **Módulos ESM** → Use `ctx.importAsync()`
- **Módulos UMD/AMD** → Use `ctx.requireAsync()`

---

### Importación de módulos ESM

Utilice **`ctx.importAsync()`** para cargar dinámicamente módulos ESM mediante una URL. Esto es adecuado para escenarios como bloques de JS, campos de JS y acciones de JS.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: Dirección del módulo ESM. Admite formatos abreviados como `<paquete>@<versión>` o subrutas como `<paquete>@<versión>/<ruta-del-archivo>` (por ejemplo, `vue@3.4.0`, `lodash@4/lodash.js`). Se les añadirá el prefijo del CDN configurado. También se admiten URLs completas.
- **Devuelve**: El objeto de espacio de nombres del módulo resuelto.

#### Por defecto: https://esm.sh

Si no se configura lo contrario, las formas abreviadas utilizarán **https://esm.sh** como prefijo del CDN. Por ejemplo:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Equivalente a cargar desde https://esm.sh/vue@3.4.0
```

#### Servicio esm.sh autohospedado

Si necesita utilizar una red interna o un CDN propio, puede desplegar un servicio compatible con el protocolo esm.sh y especificarlo mediante variables de entorno:

- **ESM_CDN_BASE_URL**: URL base del CDN de ESM (por defecto `https://esm.sh`)
- **ESM_CDN_SUFFIX**: Sufijo opcional (por ejemplo, `/+esm` para jsDelivr)

Para el autohospedaje, consulte: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Importación de módulos UMD/AMD

Utilice **`ctx.requireAsync()`** para cargar de forma asíncrona módulos UMD/AMD o scripts que se adjuntan al objeto global.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: Admite dos formas:
  - **Ruta abreviada**: `<paquete>@<versión>/<ruta-del-archivo>`, similar a `ctx.importAsync()`, resuelta según la configuración actual del CDN de ESM. Al resolverla, se añade `?raw` para solicitar directamente el archivo original (generalmente una compilación UMD). Por ejemplo, `echarts@5/dist/echarts.min.js` solicita en realidad `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (cuando se utiliza esm.sh por defecto).
  - **URL completa**: Cualquier dirección completa de un CDN (por ejemplo, `https://cdn.jsdelivr.net/npm/xxx`).
- **Devuelve**: El objeto de la librería cargada (la forma específica depende de cómo la librería exporte su contenido).

Después de la carga, muchas librerías UMD se adjuntan al objeto global (por ejemplo, `window.xxx`). Puede utilizarlas según se describe en la documentación de dicha librería.

**Ejemplo**

```ts
// Ruta abreviada (resuelta a través de esm.sh como ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL completa
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Nota**: Si una librería proporciona una versión ESM, prefiera utilizar `ctx.importAsync()` para obtener una mejor semántica de módulos y Tree-shaking.