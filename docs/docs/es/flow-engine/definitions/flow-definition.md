:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# FlowDefinition

FlowDefinition define la estructura básica y la configuración de un flujo, siendo uno de los conceptos fundamentales del motor de flujos. Describe los metadatos del flujo, las condiciones de activación, los pasos de ejecución, entre otros.

## Definición de tipo

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

## Método de registro

```ts
class MyModel extends FlowModel {}

// Registra un flujo a través de la clase del modelo
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## Descripción de propiedades

### key

**Tipo**: `string`  
**Obligatorio**: Sí  
**Descripción**: El identificador único para el flujo.

Se recomienda utilizar un estilo de nomenclatura consistente `xxxSettings`, por ejemplo:
- `pageSettings`
- `tableSettings` 
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

Esta convención de nomenclatura facilita la identificación y el mantenimiento, y se recomienda utilizarla de forma consistente en todo el proyecto.

**Ejemplo**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Tipo**: `string`  
**Obligatorio**: No  
**Descripción**: El título legible para humanos del flujo.

Se recomienda mantener un estilo consistente con la clave, utilizando la nomenclatura `Xxx settings`, por ejemplo:
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

Esta convención de nomenclatura es más clara y fácil de entender, lo que facilita la visualización en la interfaz de usuario y la colaboración en equipo.

**Ejemplo**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Tipo**: `boolean`  
**Obligatorio**: No  
**Valor predeterminado**: `false`  
**Descripción**: Indica si el flujo solo se puede ejecutar manualmente.

- `true`: El flujo solo se puede activar manualmente y no se ejecutará automáticamente.
- `false`: El flujo se puede ejecutar automáticamente (se ejecuta automáticamente por defecto cuando la propiedad `on` no está presente).

**Ejemplo**:
```ts
manual: true  // Solo ejecución manual
manual: false // Puede ejecutarse automáticamente
```

### sort

**Tipo**: `number`  
**Obligatorio**: No  
**Valor predeterminado**: `0`  
**Descripción**: El orden de ejecución del flujo. Cuanto menor sea el valor, antes se ejecutará.

Se pueden usar números negativos para controlar el orden de ejecución de múltiples flujos.

**Ejemplo**:
```ts
sort: -1  // Ejecutar con prioridad
sort: 0   // Orden predeterminado
sort: 1   // Ejecutar más tarde
```

### on

**Tipo**: `FlowEvent<TModel>`  
**Obligatorio**: No  
**Descripción**: La configuración de evento que permite que este flujo sea activado por `dispatchEvent`.

Se utiliza únicamente para declarar el nombre del evento disparador (cadena o `{ eventName }`), no incluye una función de controlador.

**Tipos de eventos soportados**:
- `'click'` - Evento de clic
- `'submit'` - Evento de envío
- `'reset'` - Evento de reinicio
- `'remove'` - Evento de eliminación
- `'openView'` - Evento de abrir vista
- `'dropdownOpen'` - Evento de apertura de desplegable
- `'popupScroll'` - Evento de desplazamiento de ventana emergente
- `'search'` - Evento de búsqueda
- `'customRequest'` - Evento de solicitud personalizada
- `'collapseToggle'` - Evento de alternancia de colapso
- O cualquier cadena personalizada

**Ejemplo**:
```ts
on: 'click'  // Se activa al hacer clic
on: 'submit' // Se activa al enviar
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Tipo**: `Record<string, StepDefinition<TModel>>`  
**Obligatorio**: Sí  
**Descripción**: La definición de los pasos del flujo.

Define todos los pasos contenidos en el flujo, donde cada paso tiene una clave única.

**Ejemplo**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**Tipo**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**Obligatorio**: No  
**Descripción**: Parámetros predeterminados a nivel de flujo.

Cuando se instancia el modelo (`createModel`), se rellenan los valores iniciales para los parámetros de los pasos del "flujo actual". Solo se completan los valores faltantes y no se sobrescriben los existentes. La forma de retorno fija es: `{ [stepKey]: params }`

**Ejemplo**:
```ts
// Parámetros predeterminados estáticos
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Parámetros predeterminados dinámicos
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Parámetros predeterminados asíncronos
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Ejemplo completo

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', 
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: { 
      source: 'api',
      cache: true 
    },
    processData: { 
      format: 'json' 
    }
  }
});
```