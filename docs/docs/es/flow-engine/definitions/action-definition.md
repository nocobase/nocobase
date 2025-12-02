:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# ActionDefinition

ActionDefinition define acciones reutilizables que pueden ser referenciadas en múltiples flujos de trabajo y pasos. Una acción es la unidad de ejecución central en el FlowEngine, encapsulando una lógica de negocio específica.

## Definición de Tipo

```ts
interface ActionDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> {
  name: string;
  title?: string;
  handler: (ctx: TCtx, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?: Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>);
  beforeParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  afterParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  useRawParams?: boolean | ((ctx: TCtx) => boolean | Promise<boolean>);
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
  scene?: ActionScene | ActionScene[];
  sort?: number;
}
```

## Método de Registro

```ts
// Registro global (a través de FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // Lógica de procesamiento
  }
});

// Registro a nivel de modelo (a través de FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // Lógica de procesamiento
  }
});

// Uso en un flujo de trabajo
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Referencia a una acción global
    },
    step2: {
      use: 'processDataAction', // Referencia a una acción a nivel de modelo
    }
  }
});
```

## Descripción de Propiedades

### name

**Tipo**: `string`  
**Obligatorio**: Sí  
**Descripción**: El identificador único para la acción

Se utiliza para referenciar la acción en un paso a través de la propiedad `use`.

**Ejemplo**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Tipo**: `string`  
**Obligatorio**: No  
**Descripción**: El título de visualización para la acción

Se utiliza para la interfaz de usuario y la depuración.

**Ejemplo**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**Tipo**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Obligatorio**: Sí  
**Descripción**: La función manejadora (handler) para la acción

Es la lógica central de la acción, que recibe el contexto y los parámetros, y devuelve el resultado del procesamiento.

**Ejemplo**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Ejecutar lógica específica
    const result = await performAction(params);
    
    // Devolver resultado
    return {
      success: true,
      data: result,
      message: 'Action completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### defaultParams

**Tipo**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Obligatorio**: No  
**Descripción**: Los parámetros predeterminados para la acción

Rellena los parámetros con valores predeterminados antes de que se ejecute la acción.

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
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Parámetros predeterminados asíncronos
defaultParams: async (ctx) => {
  const config = await loadConfiguration();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    timeout: config.timeout
  }
}
```

### uiSchema

**Tipo**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Obligatorio**: No  
**Descripción**: El esquema de configuración de la interfaz de usuario (UI) para la acción

Define cómo se muestra la acción en la interfaz de usuario y su configuración de formulario.

**Ejemplo**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  },
  properties: {
    url: {
      type: 'string',
      title: 'URL de la API',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'Método HTTP',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Tiempo de espera (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatorio**: No  
**Descripción**: Función de gancho (hook) ejecutada antes de guardar los parámetros

Se ejecuta antes de que se guarden los parámetros de la acción, y puede utilizarse para la validación o transformación de parámetros.

**Ejemplo**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validación de parámetros
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // Transformación de parámetros
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Registrar cambios
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatorio**: No  
**Descripción**: Función de gancho (hook) ejecutada después de guardar los parámetros

Se ejecuta después de que se guarden los parámetros de la acción, y puede utilizarse para activar otras operaciones.

**Ejemplo**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Registrar en el log
  console.log('Action params saved:', params);
  
  // Activar evento
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Actualizar caché
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Tipo**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Obligatorio**: No  
**Descripción**: Indica si se deben usar los parámetros sin procesar

Si es `true`, los parámetros sin procesar se pasan directamente a la función manejadora sin ningún procesamiento.

**Ejemplo**:
```ts
// Configuración estática
useRawParams: true

// Configuración dinámica
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Tipo**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obligatorio**: No  
**Descripción**: El modo de visualización de la interfaz de usuario (UI) para la acción

Controla cómo se muestra la acción en la interfaz de usuario.

**Modos soportados**:
- `'dialog'` - Modo de diálogo
- `'drawer'` - Modo de cajón lateral
- `'embed'` - Modo incrustado
- o un objeto de configuración personalizado

**Ejemplo**:
```ts
// Modo simple
uiMode: 'dialog'

// Configuración personalizada
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Action Configuration',
    maskClosable: false
  }
}

// Modo dinámico
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Tipo**: `ActionScene | ActionScene[]`  
**Obligatorio**: No  
**Descripción**: Los escenarios de uso para la acción

Restringe el uso de la acción a escenarios específicos.

**Escenarios soportados**:
- `'settings'` - Escenario de configuración
- `'runtime'` - Escenario de tiempo de ejecución
- `'design'` - Escenario de tiempo de diseño

**Ejemplo**:
```ts
scene: 'settings'  // Usar solo en el escenario de configuración
scene: ['settings', 'runtime']  // Usar en los escenarios de configuración y tiempo de ejecución
```

### sort

**Tipo**: `number`  
**Obligatorio**: No  
**Descripción**: El peso de ordenación para la acción

Controla el orden de visualización de la acción en una lista. Un valor más pequeño significa una posición más alta.

**Ejemplo**:
```ts
sort: 0  // La posición más alta
sort: 10 // Posición intermedia
sort: 100 // Posición más baja
```

## Ejemplo Completo

```ts
class DataProcessingModel extends FlowModel {}

// Registrar acción de carga de datos
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    const { url, method = 'GET', timeout = 5000 } = params;
    
    try {
      const response = await fetch(url, {
        method,
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Data loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    method: 'GET',
    timeout: 5000
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      url: {
        type: 'string',
        title: 'URL de la API',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'Método HTTP',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Tiempo de espera (ms)',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem'
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (!params.url) {
      throw new Error('URL is required');
    }
    params.url = params.url.trim();
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('dataSourceChanged', params);
  },
  uiMode: 'dialog',
  scene: ['settings', 'runtime'],
  sort: 0
});

// Registrar acción de procesamiento de datos
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Data processed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    processor: 'default',
    options: {
      format: 'json',
      encoding: 'utf8'
    }
  }),
  uiSchema: {
    'x-component': 'Form',
    properties: {
      processor: {
        type: 'string',
        title: 'Procesador',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Opciones',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Formato',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Codificación',
            'x-component': 'Select',
            enum: ['utf8', 'ascii', 'latin1']
          }
        }
      }
    }
  },
  scene: 'runtime',
  sort: 1
});
```