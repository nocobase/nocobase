---
title: "JSItem JS Item"
description: "JSItem JS Item: usar JavaScript/JSX en la barra de Actions para renderizar items de Action personalizados, con soporte para React, ctx y la interacción con el contexto de Collection/registro/formulario."
keywords: "JSItem,JS Item,Action item personalizado,JavaScript,Interface Builder,NocoBase"
---

# JS Item

## Introducción

JS Item se utiliza para renderizar un "item de Action personalizado" en la barra de Actions. Puede escribir directamente JavaScript / JSX y producir cualquier UI, como botones, grupos de botones, menús desplegables, texto de ayuda, etiquetas de estado o pequeños componentes interactivos, e invocar APIs, abrir ventanas emergentes, leer el registro actual o refrescar los datos del Block dentro del componente.

Puede utilizarse en ubicaciones como la barra de herramientas del formulario, la barra de herramientas de la tabla (nivel Collection), las Actions de fila de la tabla (nivel registro), etc., y es adecuado para los siguientes escenarios:

- Necesidad de personalizar la estructura del botón, no solo vincular un evento de clic al botón;
- Necesidad de combinar varias Actions en un grupo de botones o menú desplegable;
- Necesidad de mostrar estado en tiempo real, información estadística o contenido informativo en la barra de Actions;
- Necesidad de renderizar contenido diferente dinámicamente según el registro actual, los datos seleccionados o los valores del formulario.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM%20(1).png)

## Diferencias con JS Action

- `JS Action`: más adecuado para "ejecutar un script al hacer clic en un botón", se centra en la lógica de comportamiento.
- `JS Item`: más adecuado para "renderizar un item de Action personalizado", controlando tanto la interfaz como la lógica de interacción.

Si solo desea añadir lógica de clic a un botón existente, utilice preferentemente `JS Action`; si desea personalizar la estructura de la interfaz del item de Action o renderizar varios controles, utilice preferentemente `JS Item`.

## API del contexto de ejecución (uso común)

En tiempo de ejecución, JS Item inyecta capacidades comunes que pueden usarse directamente en el script:

- `ctx.render(vnode)`: renderiza un elemento React, una cadena HTML o un nodo DOM en el contenedor del item de Action actual;
- `ctx.element`: contenedor DOM (ElementProxy) del item de Action actual;
- `ctx.api.request(options)`: lanza una solicitud HTTP;
- `ctx.openView(viewUid, options)`: abre una vista preconfigurada (cajón / diálogo / página);
- `ctx.message` / `ctx.notification`: avisos y notificaciones globales;
- `ctx.t()` / `ctx.i18n.t()`: internacionalización;
- `ctx.resource`: Resource de datos del contexto a nivel de Collection, por ejemplo, leer registros seleccionados, refrescar la lista;
- `ctx.record`: registro de la fila actual del contexto a nivel de registro;
- `ctx.form`: instancia de Form de AntD del contexto a nivel de formulario;
- `ctx.blockModel` / `ctx.collection`: metainformación del Block y la Collection en los que se encuentra;
- `ctx.requireAsync(url)`: cargar bibliotecas AMD / UMD de forma asíncrona por URL;
- `ctx.importAsync(url)`: importar dinámicamente módulos ESM por URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: bibliotecas comunes integradas, utilizables directamente para renderizado JSX, manejo de fechas, procesamiento de datos y operaciones matemáticas.

> Las variables realmente disponibles varían según la ubicación del item de Action. Por ejemplo, las Actions de fila de tabla normalmente pueden acceder a `ctx.record`, la barra de herramientas del formulario normalmente puede acceder a `ctx.form`, y la barra de herramientas de la tabla normalmente puede acceder a `ctx.resource`.

## Editor y snippets

- `Snippets`: abre la lista de snippets de código integrados; permite buscar e insertarlos con un clic en la posición actual del cursor.
- `Run`: ejecuta directamente el código actual y muestra los logs de ejecución en el panel `Logs` de la parte inferior; admite `console.log/info/warn/error` y resaltado para localizar errores.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM.png)

- Puede combinarse con AI Employees para generar / modificar scripts: [AI Employee · Nathan: ingeniero frontend](/ai-employees/features/built-in-employee)

## Usos comunes (ejemplos resumidos)

### 1) Renderizar un botón normal

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      type="primary"
      onClick={() => ctx.message.success(ctx.t('Click from JS item'))}
    >
      {ctx.t('JS item')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 2) Action de Collection: combinar botón y menú desplegable

```js
const { Space, Button, Dropdown } = ctx.libs.antd;
const { EllipsisOutlined } = ctx.libs.antdIcons;

function JsItem() {
  const items = [
    { key: 'export', label: ctx.t('Export selected') },
    { key: 'refresh', label: ctx.t('Refresh data') },
  ];

  const onMenuClick = async ({ key }) => {
    if (key === 'export') {
      const rows = ctx.resource?.getSelectedRows?.() || [];
      if (!rows.length) {
        ctx.message.warning(ctx.t('Please select records'));
        return;
      }
      ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
      return;
    }

    if (key === 'refresh') {
      await ctx.resource?.refresh?.();
      ctx.message.success(ctx.t('Refreshed'));
    }
  };

  return (
    <Space.Compact>
      <Button>{ctx.t('Actions')}</Button>
      <Dropdown menu={{ items, onClick: onMenuClick }} placement="bottomRight">
        <Button icon={<EllipsisOutlined />} />
      </Dropdown>
    </Space.Compact>
  );
}

ctx.render(<JsItem />);
```

### 3) Action de registro: abrir vista basada en la fila actual

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      onClick={async () => {
        // Open a view as drawer and pass arguments at top-level
        const popupUid = `${ctx.model.uid}-details`;
        await ctx.openView(popupUid, {
          mode: 'drawer',
          title: ctx.t('Details'),
          size: 'large',
        });
      }}
    >
      {ctx.t('Open')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 4) Renderizar contenido de estado personalizado

```js
const { Tag } = ctx.libs.antd;

function JsItem() {
  const count = ctx.resource?.getSelectedRows?.()?.length || 0;

  return (
    <Tag color={count ? 'processing' : 'default'}>
      Selected: {count}
    </Tag>
  );
}

ctx.render(<JsItem />);
```

## Notas

- Si solo necesita "ejecutar lógica al hacer clic", utilice preferentemente `JS Action`; la implementación es más directa.
- Añada `try/catch` y avisos al usuario en las invocaciones a APIs para evitar fallos silenciosos.
- Cuando estén implicadas tablas, listas y ventanas emergentes, tras un envío exitoso puede refrescar los datos activamente mediante `ctx.resource?.refresh?.()` o el Resource del Block correspondiente.
- Al usar bibliotecas externas, se recomienda cargarlas desde un CDN de confianza y prever un mecanismo de respaldo en caso de fallo de carga.

## Documentación relacionada

- [Variables y contexto](/interface-builder/variables)
- [Reglas de interacción](/interface-builder/linkage-rule)
- [Vistas y ventanas emergentes](/interface-builder/actions/types/view)
- [JS Action](/interface-builder/actions/types/js-action)
