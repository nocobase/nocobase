:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# EventDefinition

`EventDefinition` define la lógica de manejo de eventos dentro de un flujo, utilizada para responder a disparadores de eventos específicos. Los eventos son un mecanismo importante en el motor de flujos (`FlowEngine`) para iniciar la ejecución de un flujo.

## Definición de tipo

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

`EventDefinition` es en realidad un alias de `ActionDefinition`, por lo que posee las mismas propiedades y métodos.

## Formas de registro

```ts
// Registro global (a través de FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Lógica de manejo de eventos
  }
});

// Registro a nivel de modelo (a través de FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Lógica de manejo de eventos
  }
});

// Uso en un flujo
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Referencia a un evento registrado
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Descripción de propiedades

### name

**Tipo**: `string`  
**Obligatorio**: Sí  
**Descripción**: El identificador único para el evento.

Se utiliza para referenciar el evento en un flujo a través de la propiedad `on`.

**Ejemplo**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Tipo**: `string`  
**Obligatorio**: No  
**Descripción**: El título que se muestra para el evento.

Se utiliza para la visualización en la interfaz de usuario y para la depuración.

**Ejemplo**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Tipo**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Obligatorio**: Sí  
**Descripción**: La función controladora para el evento.

Es la lógica central del evento, que recibe el contexto y los parámetros, y devuelve el resultado del procesamiento.

**Ejemplo**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Ejecutar la lógica de manejo de eventos
    const result = await handleEvent(params);
    
    // Devolver el resultado
    return {
      success: true,
      data: result,
      message: 'Evento manejado exitosamente'
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
**Descripción**: Los parámetros predeterminados para el evento.

Rellena los parámetros con valores predeterminados cuando se dispara el evento.

**Ejemplo**:
```ts
// Parámetros predeterminados estáticos
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Parámetros predeterminados dinámicos
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Parámetros predeterminados asíncronos
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**Tipo**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Obligatorio**: No  
**Descripción**: El esquema de configuración de la interfaz de usuario para el evento.

Define cómo se muestra el evento en la interfaz de usuario y su configuración de formulario.

**Ejemplo**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Prevenir Comportamiento Predeterminado',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Detener Propagación',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Datos Personalizados',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Clave',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Valor',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatorio**: No  
**Descripción**: Función *hook* ejecutada antes de guardar los parámetros.

Se ejecuta antes de que se guarden los parámetros del evento y puede utilizarse para la validación o transformación de parámetros.

**Ejemplo**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validación de parámetros
  if (!params.eventType) {
    throw new Error('El tipo de evento es obligatorio');
  }
  
  // Transformación de parámetros
  params.eventType = params.eventType.toLowerCase();
  
  // Registrar cambios
  console.log('Parámetros del evento cambiados:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatorio**: No  
**Descripción**: Función *hook* ejecutada después de guardar los parámetros.

Se ejecuta después de que se guarden los parámetros del evento y puede utilizarse para disparar otras acciones.

**Ejemplo**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Registrar
  console.log('Parámetros del evento guardados:', params);
  
  // Disparar evento
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Actualizar caché
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Tipo**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obligatorio**: No  
**Descripción**: El modo de visualización de la interfaz de usuario para el evento.

Controla cómo se muestra el evento en la interfaz de usuario.

**Modos soportados**:
- `'dialog'` - Modo de diálogo
- `'drawer'` - Modo de cajón
- `'embed'` - Modo incrustado
- O un objeto de configuración personalizado

**Ejemplo**:
```ts
// Modo simple
uiMode: 'dialog'

// Configuración personalizada
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Configuración del evento'
  }
}

// Modo dinámico
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Tipos de eventos incorporados

El motor de flujos (`FlowEngine`) tiene los siguientes tipos de eventos comunes incorporados:

- `'click'` - Evento de clic
- `'submit'` - Evento de envío
- `'reset'` - Evento de reinicio
- `'remove'` - Evento de eliminación
- `'openView'` - Evento de abrir vista
- `'dropdownOpen'` - Evento de abrir desplegable
- `'popupScroll'` - Evento de desplazamiento de ventana emergente
- `'search'` - Evento de búsqueda
- `'customRequest'` - Evento de solicitud personalizada
- `'collapseToggle'` - Evento de alternar colapso

## Ejemplo completo

```ts
class FormModel extends FlowModel {}

// Registrar evento de envío de formulario
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Evento de envío de formulario',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Validar datos del formulario
      if (validation && !validateFormData(formData)) {
        throw new Error('La validación del formulario falló');
      }
      
      // Procesar envío del formulario
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Formulario enviado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    validation: true,
    preventDefault: true,
    stopPropagation: false
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      validation: {
        type: 'boolean',
        title: 'Habilitar Validación',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Prevenir Comportamiento Predeterminado',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Detener Propagación',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Manejadores Personalizados',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Nombre del Manejador',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Habilitado',
              'x-component': 'Switch'
            }
          }
        }
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (params.validation && !params.formData) {
      throw new Error('Los datos del formulario son obligatorios cuando la validación está habilitada');
    }
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('formEventConfigChanged', params);
  },
  uiMode: 'dialog'
});

// Registrar evento de cambio de datos
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Evento de cambio de datos',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Registrar cambio de datos
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Disparar acciones relacionadas
      ctx.model.emitter.emit('dataChanged', {
        field,
        oldValue,
        newValue
      });
      
      return {
        success: true,
        message: 'Cambio de datos registrado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    logLevel: 'info',
    notify: true,
    timestamp: Date.now()
  }),
  uiMode: 'embed'
});

// Uso de eventos en un flujo
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Procesamiento de formulario',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Validar Formulario',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Procesar Formulario',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Guardar Formulario',
      sort: 2
    }
  }
});
```