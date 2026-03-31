:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# StepDefinition

`StepDefinition` define un paso individual en un flujo de trabajo. Cada paso puede ser una acción, un manejo de eventos u otra operación. Un paso es la unidad de ejecución fundamental de un flujo.

## Definición de tipo

```ts
interface StepDefinition<TModel extends FlowModel = FlowModel>
  extends Partial<Omit<ActionDefinition<TModel, FlowRuntimeContext<TModel>>, 'name'>> {
  key?: string;
  isAwait?: boolean;
  use?: string;
  sort?: number;
  preset?: boolean;
  paramsRequired?: boolean;
  hideInSettings?: boolean;
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
}
```

## Uso

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // Lógica de procesamiento personalizada
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## Descripción de las propiedades

### key

**Tipo**: `string`  
**Obligatorio**: No  
**Descripción**: El identificador único para el paso dentro del flujo.

Si no se proporciona, se utilizará el nombre de la clave del paso en el objeto `steps`.

**Ejemplo**:
```ts
steps: {
  loadData: {  // la clave es 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Tipo**: `string`  
**Obligatorio**: No  
**Descripción**: El nombre de una `ActionDefinition` registrada para usar.

La propiedad `use` le permite referenciar una acción ya registrada, evitando definiciones duplicadas.

**Ejemplo**:
```ts
// Primero registre la acción
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Lógica de carga de datos
  }
});

// Úselo en un paso
steps: {
  step1: {
    use: 'loadDataAction',  // Referencia a la acción registrada
    title: 'Load Data'
  }
}
```

### title

**Tipo**: `string`  
**Obligatorio**: No  
**Descripción**: El título que se mostrará para el paso.

Se utiliza para la visualización en la interfaz de usuario y la depuración.

**Ejemplo**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Tipo**: `number`  
**Obligatorio**: No  
**Descripción**: El orden de ejecución del paso. Cuanto menor sea el valor, antes se ejecutará.

Se utiliza para controlar el orden de ejecución de múltiples pasos en el mismo flujo de trabajo.

**Ejemplo**:
```ts
steps: {
  step1: { sort: 0 },  // Se ejecuta primero
  step2: { sort: 1 },  // Se ejecuta a continuación
  step3: { sort: 2 }   // Se ejecuta al final
}
```

### handler

**Tipo**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Obligatorio**: No  
**Descripción**: La función manejadora (handler) para el paso.

Cuando no se utiliza la propiedad `use`, puede definir la función manejadora directamente.

**Ejemplo**:
```ts
handler: async (ctx, params) => {
  // Obtener información del contexto
  const { model, flowEngine } = ctx;
  
  // Lógica de procesamiento
  const result = await processData(params);
  
  // Devolver el resultado
  return { success: true, data: result };
}
```

### defaultParams

**Tipo**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Obligatorio**: No  
**Descripción**: Los parámetros predeterminados para el paso.

Rellena los parámetros con valores predeterminados antes de que se ejecute el paso.

**Ejemplo**:
```ts
// Parámetros predeterminados estáticos
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Parámetros predeterminados dinámicos
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// Parámetros predeterminados asíncronos
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**Tipo**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Obligatorio**: No  
**Descripción**: El esquema de configuración de la interfaz de usuario (UI) para el paso.

Define cómo se muestra el paso en la interfaz y su configuración de formulario.

**Ejemplo**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Age',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatorio**: No  
**Descripción**: Una función *hook* que se ejecuta antes de que se guarden los parámetros.

Se ejecuta antes de que se guarden los parámetros del paso y se puede utilizar para la validación o transformación de parámetros.

**Ejemplo**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validación de parámetros
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Transformación de parámetros
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatorio**: No  
**Descripción**: Una función *hook* que se ejecuta después de que se guarden los parámetros.

Se ejecuta después de que se guarden los parámetros del paso y se puede utilizar para activar otras operaciones.

**Ejemplo**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Registrar logs
  console.log('Step params saved:', params);
  
  // Activar otras operaciones
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Tipo**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obligatorio**: No  
**Descripción**: El modo de visualización de la interfaz de usuario (UI) para el paso.

Controla cómo se muestra el paso en la interfaz.

**Modos soportados**:
- `'dialog'` - Modo de diálogo
- `'drawer'` - Modo de cajón
- `'embed'` - Modo incrustado
- O un objeto de configuración personalizado.

**Ejemplo**:
```ts
// Modo simple
uiMode: 'dialog'

// Configuración personalizada
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// Modo dinámico
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Tipo**: `boolean`  
**Obligatorio**: No  
**Descripción**: Indica si es un paso preestablecido.

Los parámetros para los pasos con `preset: true` deben completarse en el momento de la creación. Aquellos sin esta bandera pueden completarse después de que se cree el modelo.

**Ejemplo**:
```ts
steps: {
  step1: {
    preset: true,  // Los parámetros deben completarse en el momento de la creación
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Los parámetros pueden completarse más tarde
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Tipo**: `boolean`  
**Obligatorio**: No  
**Descripción**: Indica si los parámetros del paso son obligatorios.

Si es `true`, se abrirá un diálogo de configuración antes de añadir el modelo.

**Ejemplo**:
```ts
paramsRequired: true  // Los parámetros deben configurarse antes de añadir el modelo
paramsRequired: false // Los parámetros pueden configurarse más tarde
```

### hideInSettings

**Tipo**: `boolean`  
**Obligatorio**: No  
**Descripción**: Indica si se debe ocultar el paso en el menú de configuración.

**Ejemplo**:
```ts
hideInSettings: true  // Ocultar en la configuración
hideInSettings: false // Mostrar en la configuración (predeterminado)
```

### isAwait

**Tipo**: `boolean`  
**Obligatorio**: No  
**Valor predeterminado**: `true`  
**Descripción**: Indica si se debe esperar a que la función manejadora se complete.

**Ejemplo**:
```ts
isAwait: true  // Esperar a que la función manejadora se complete (predeterminado)
isAwait: false // No esperar, ejecutar de forma asíncrona
```

## Ejemplo completo

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Procesamiento de Datos',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Cargar Datos',
      sort: 0,
      preset: true,
      paramsRequired: true,
      defaultParams: {
        source: 'api',
        timeout: 5000
      },
      uiMode: 'dialog'
    },
    processData: {
      handler: async (ctx, params) => {
        const data = await ctx.model.getData();
        return processData(data, params);
      },
      title: 'Procesar Datos',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Se requiere un procesador');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Guardar Datos',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Configuración de Guardado'
        }
      }
    }
  }
});
```