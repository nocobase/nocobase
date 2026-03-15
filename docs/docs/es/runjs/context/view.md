:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/view).
:::

# ctx.view

El controlador de la vista activa actualmente (diálogo, cajón, capa emergente, área incrustada, etc.), utilizado para acceder a información y operaciones a nivel de vista. Proporcionado por `FlowViewContext`, solo está disponible dentro del contenido de la vista abierta a través de `ctx.viewer` o `ctx.openView`.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **Contenido de diálogo/cajón** | Use `ctx.view.close()` dentro del `content` para cerrar la vista actual, o utilice `Header` y `Footer` para renderizar el título y el pie de página. |
| **Tras el envío del formulario** | Llame a `ctx.view.close(result)` después de un envío exitoso para cerrar la vista y devolver el resultado. |
| **JSBlock / Acción** | Determine el tipo de vista actual mediante `ctx.view.type`, o lea los parámetros de apertura en `ctx.view.inputArgs`. |
| **Selección de asociación, sub-tablas** | Lea `collectionName`, `filterByTk`, `parentId`, etc., desde `inputArgs` para la carga de datos. |

> Nota: `ctx.view` solo está disponible en entornos RunJS con un contexto de vista (por ejemplo, dentro del `content` de `ctx.viewer.dialog()`, en formularios de diálogo o dentro de selectores de asociación). En páginas estándar o contextos de backend, es `undefined`. Se recomienda utilizar el encadenamiento opcional (`ctx.view?.close?.()`).

## Definición de tipos

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // Disponible en vistas de configuración de flujo de trabajo
};
```

## Propiedades y métodos comunes

| Propiedad/Método | Tipo | Descripción |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Tipo de vista actual |
| `inputArgs` | `Record<string, any>` | Parámetros pasados al abrir la vista (ver abajo) |
| `Header` | `React.FC \| null` | Componente de cabecera, utilizado para renderizar títulos y áreas de acción |
| `Footer` | `React.FC \| null` | Componente de pie de página, utilizado para renderizar botones, etc. |
| `close(result?, force?)` | `void` | Cierra la vista actual; se puede pasar `result` de vuelta al llamador |
| `update(newConfig)` | `void` | Actualiza la configuración de la vista (por ejemplo, ancho, título) |
| `navigation` | `ViewNavigation \| undefined` | Navegación de vista dentro de la página, incluyendo cambio de pestañas, etc. |

> Actualmente, solo `dialog` y `drawer` admiten `Header` y `Footer`.

## Campos comunes en inputArgs

Los campos en `inputArgs` varían según el escenario de apertura. Los campos comunes incluyen:

| Campo | Descripción |
|------|------|
| `viewUid` | UID de la vista |
| `collectionName` | Nombre de la colección |
| `filterByTk` | Filtro por clave primaria (para detalles de un solo registro) |
| `parentId` | ID del padre (para escenarios de asociación) |
| `sourceId` | ID del registro de origen |
| `parentItem` | Datos del elemento padre |
| `scene` | Escenario (por ejemplo, `create`, `edit`, `select`) |
| `onChange` | Callback tras la selección o cambio |
| `tabUid` | UID de la pestaña actual (dentro de una página) |

Acceda a estos mediante `ctx.getVar('ctx.view.inputArgs.xxx')` o `ctx.view.inputArgs.xxx`.

## Ejemplos

### Cerrar la vista actual

```ts
// Cerrar el diálogo tras un envío exitoso
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Cerrar y devolver resultados
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Uso de Header / Footer en el contenido

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Editar" extra={<Button size="small">Ayuda</Button>} />
      <div>Contenido del formulario...</div>
      <Footer>
        <Button onClick={() => close()}>Cancelar</Button>
        <Button type="primary" onClick={handleSubmit}>Enviar</Button>
      </Footer>
    </div>
  );
}
```

### Ramificación basada en el tipo de vista o inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Ocultar cabecera en vistas incrustadas
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Escenario de selector de usuarios
}
```

## Relación con ctx.viewer y ctx.openView

| Propósito | Uso recomendado |
|------|----------|
| **Abrir una nueva vista** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` o `ctx.openView()` |
| **Operar en la vista actual** | `ctx.view.close()`, `ctx.view.update()` |
| **Obtener parámetros de apertura** | `ctx.view.inputArgs` |

`ctx.viewer` es responsable de "abrir" una vista, mientras que `ctx.view` representa la instancia de la vista "actual"; `ctx.openView` se utiliza para abrir vistas de flujo de trabajo preconfiguradas.

## Notas

- `ctx.view` solo está disponible dentro de una vista; es `undefined` en páginas estándar.
- Use encadenamiento opcional: `ctx.view?.close?.()` para evitar errores cuando no existe un contexto de vista.
- El `result` de `close(result)` se pasa a la Promesa devuelta por `ctx.viewer.open()`.

## Relacionado

- [ctx.openView()](./open-view.md): Abrir una vista de flujo de trabajo preconfigurada
- [ctx.modal](./modal.md): Ventanas emergentes ligeras (información, confirmación, etc.)

> `ctx.viewer` proporciona métodos como `dialog()`, `drawer()`, `popover()` y `embed()` para abrir vistas. El contenido (`content`) abierto por estos métodos puede acceder a `ctx.view`.