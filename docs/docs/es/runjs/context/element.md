:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/element).
:::

# ctx.element

Una instancia de `ElementProxy` que apunta al contenedor DOM del sandbox, sirviendo como el objetivo de renderizado predeterminado para `ctx.render()`. Está disponible en escenarios donde existe un contenedor de renderizado, como `JSBlock`, `JSField`, `JSItem` y `JSColumn`.

## Escenarios de aplicación

| Escenario | Descripción |
|------|------|
| **JSBlock** | El contenedor DOM para el bloque, utilizado para renderizar contenido personalizado del bloque. |
| **JSField / JSItem / FormJSFieldItem** | El contenedor de renderizado para un campo o elemento de formulario (generalmente un `<span>`). |
| **JSColumn** | El contenedor DOM para una celda de tabla, utilizado para renderizar contenido personalizado de la columna. |

> Nota: `ctx.element` solo está disponible en contextos de RunJS que tienen un contenedor de renderizado. En contextos sin interfaz de usuario (como lógica puramente de backend), puede ser `undefined`. Se recomienda realizar una comprobación de valores nulos antes de su uso.

## Definición de tipo

```typescript
element: ElementProxy | undefined;

// ElementProxy es un proxy para el HTMLElement original, que expone una API segura
class ElementProxy {
  __el: HTMLElement;  // El elemento DOM original interno (accesible solo en escenarios específicos)
  innerHTML: string;  // Saneado a través de DOMPurify durante la lectura/escritura
  outerHTML: string; // Igual que el anterior
  appendChild(child: HTMLElement | string): void;
  // Otros métodos de HTMLElement se transmiten (no se recomienda su uso directo)
}
```

## Requisitos de seguridad

**Recomendado: Todo el renderizado debe realizarse a través de `ctx.render()`.** Evite usar las API de DOM de `ctx.element` directamente (por ejemplo, `innerHTML`, `appendChild`, `querySelector`, etc.).

### Por qué se recomienda ctx.render()

| Ventaja | Descripción |
|------|------|
| **Seguridad** | Control de seguridad centralizado para evitar XSS y operaciones DOM inadecuadas. |
| **Soporte para React** | Soporte completo para JSX, componentes de React y ciclos de vida. |
| **Herencia de contexto** | Hereda automáticamente el `ConfigProvider` de la aplicación, temas, etc. |
| **Gestión de conflictos** | Gestiona automáticamente la creación/desmontaje de la raíz de React para evitar conflictos de múltiples instancias. |

### ❌ No recomendado: Manipulación directa de ctx.element

```ts
// ❌ No recomendado: Uso directo de las API de ctx.element
ctx.element.innerHTML = '<div>Contenido</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` está obsoleto. Por favor, utilice `ctx.render()` en su lugar.

### ✅ Recomendado: Uso de ctx.render()

```ts
// ✅ Renderizar un componente de React
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Bienvenido')}>
    <Button type="primary">Hacer clic</Button>
  </Card>
);

// ✅ Renderizar una cadena HTML
ctx.render('<div style="padding:16px;">' + ctx.t('Contenido') + '</div>');

// ✅ Renderizar un nodo DOM
const div = document.createElement('div');
div.textContent = ctx.t('Hola');
ctx.render(div);
```

## Caso especial: Como anclaje de Popover

Cuando necesite abrir un Popover utilizando el elemento actual como anclaje, puede acceder a `ctx.element?.__el` para obtener el DOM original como `target`:

```ts
// ctx.viewer.popover requiere un DOM original como target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Contenido emergente</div>,
});
```

> Use `__el` solo en escenarios como "usar el contenedor actual como anclaje"; no manipule el DOM directamente en otros casos.

## Relación con ctx.render

- Si se llama a `ctx.render(vnode)` sin un argumento `container`, se renderiza en el contenedor `ctx.element` por defecto.
- Si falta `ctx.element` y no se proporciona un `container`, se lanzará un error.
- Puede especificar explícitamente un contenedor: `ctx.render(vnode, customContainer)`.

## Notas

- `ctx.element` está destinado al uso interno de `ctx.render()`. No se recomienda acceder o modificar directamente sus propiedades o métodos.
- En contextos sin un contenedor de renderizado, `ctx.element` será `undefined`. Asegúrese de que el contenedor esté disponible o pase un `container` manualmente antes de llamar a `ctx.render()`.
- Aunque `innerHTML`/`outerHTML` en `ElementProxy` se sanean mediante `DOMPurify`, se sigue recomendando usar `ctx.render()` para una gestión de renderizado unificada.

## Relacionado

- [ctx.render](./render.md): Renderizar contenido en un contenedor
- [ctx.view](./view.md): Controlador de vista actual
- [ctx.modal](./modal.md): API de acceso rápido para cuadros modales