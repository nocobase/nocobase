:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Renderizar FlowModel

`FlowModelRenderer` es el componente principal de React que se encarga de renderizar un `FlowModel`. Su función es transformar una instancia de `FlowModel` en un componente visual de React.

## Uso Básico

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Uso básico
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Para los modelos de campo (Field Models) controlados, utilice `FieldModelRenderer` para renderizarlos:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Renderizado de campo controlado
<FieldModelRenderer model={fieldModel} />
```

## Propiedades (Props)

### Propiedades de FlowModelRenderer (FlowModelRendererProps)

| Parámetro | Tipo | Valor predeterminado | Descripción |
|------|------|--------|------|
| `model` | `FlowModel` | - | La instancia de `FlowModel` a renderizar. |
| `uid` | `string` | - | El identificador único para el modelo de flujo. |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Contenido de respaldo a mostrar si falla el renderizado. |
| `showFlowSettings` | `boolean \| object` | `false` | Indica si se muestra la entrada a la configuración del flujo. |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | El estilo de interacción para la configuración del flujo. |
| `hideRemoveInSettings` | `boolean` | `false` | Indica si se oculta el botón de eliminar en la configuración. |
| `showTitle` | `boolean` | `false` | Indica si se muestra el título del modelo en la esquina superior izquierda del borde. |
| `skipApplyAutoFlows` | `boolean` | `false` | Indica si se deben omitir la aplicación de flujos automáticos. |
| `inputArgs` | `Record<string, any>` | - | Contexto adicional pasado a `useApplyAutoFlows`. |
| `showErrorFallback` | `boolean` | `true` | Indica si se envuelve la capa más externa con el componente `FlowErrorFallback`. |
| `settingsMenuLevel` | `number` | - | Nivel del menú de configuración: 1=solo el modelo actual, 2=incluir modelos hijos. |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Elementos adicionales para la barra de herramientas. |

### Configuración detallada de `showFlowSettings`

Cuando `showFlowSettings` es un objeto, se admiten las siguientes configuraciones:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Mostrar fondo
  showBorder: true,        // Mostrar borde
  showDragHandle: true,    // Mostrar manejador de arrastre
  style: {},              // Estilo personalizado de la barra de herramientas
  toolbarPosition: 'inside' // Posición de la barra de herramientas: 'inside' | 'above' | 'below'
}}
```

## Ciclo de Vida del Renderizado

El ciclo de vida completo del renderizado invoca los siguientes métodos en orden:

1.  **model.dispatchEvent('beforeRender')** - Evento `beforeRender` (antes del renderizado)
2.  **model.render()** - Ejecuta el método de renderizado del modelo
3.  **model.onMount()** - Hook de montaje del componente
4.  **model.onUnmount()** - Hook de desmontaje del componente

## Ejemplos de Uso

### Renderizado Básico

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Cargando...</div>}
    />
  );
}
```

### Renderizado con Configuración de Flujo

```tsx pure
// Muestra la configuración pero oculta el botón de eliminar
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Muestra la configuración y el título
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Utiliza el modo de menú contextual (clic derecho)
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Barra de Herramientas Personalizada

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Acción personalizada',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Acción personalizada');
      }
    }
  ]}
/>
```

### Omitir Flujos Automáticos

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Renderizado de Modelo de Campo

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## Gestión de Errores

`FlowModelRenderer` incorpora un mecanismo completo de gestión de errores:

-   **Límite de errores automático**: `showErrorFallback={true}` está habilitado por defecto.
-   **Errores de flujos automáticos**: Captura y gestiona los errores durante la ejecución de los flujos automáticos.
-   **Errores de renderizado**: Muestra contenido de respaldo cuando el renderizado del modelo falla.

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>El renderizado falló, por favor, inténtelo de nuevo</div>}
/>
```

## Optimización del Rendimiento

### Omitir Flujos Automáticos

Para escenarios donde los flujos automáticos no son necesarios, puede omitirlos para mejorar el rendimiento:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Actualizaciones Reactivas

`FlowModelRenderer` utiliza el `observer` de `@formily/reactive-react` para las actualizaciones reactivas, asegurando que el componente se vuelva a renderizar automáticamente cuando el estado del modelo cambia.

## Consideraciones

1.  **Validación del modelo**: Asegúrese de que el `model` proporcionado tenga un método `render` válido.
2.  **Gestión del ciclo de vida**: Los hooks del ciclo de vida del modelo se invocarán en el momento adecuado.
3.  **Límite de errores**: Se recomienda habilitar el límite de errores en un entorno de producción para ofrecer una mejor experiencia de usuario.
4.  **Consideración de rendimiento**: Para escenarios que implican el renderizado de un gran número de modelos, considere utilizar la opción `skipApplyAutoFlows`.