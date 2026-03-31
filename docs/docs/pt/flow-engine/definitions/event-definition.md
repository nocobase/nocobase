:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# EventDefinition

`EventDefinition` define a lógica de tratamento de eventos em um **fluxo de trabalho**, usada para responder a gatilhos de eventos específicos. Eventos são um mecanismo importante no `FlowEngine` para iniciar a execução de **fluxos de trabalho**.

## Definição de Tipo

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

`EventDefinition` é, na verdade, um alias para `ActionDefinition`, então possui as mesmas propriedades e métodos.

## Método de Registro

```ts
// Registro global (via FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Lógica de tratamento do evento
  }
});

// Registro em nível de modelo (via FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Lógica de tratamento do evento
  }
});

// Uso em um fluxo de trabalho
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Referencia um evento registrado
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Descrição das Propriedades

### name

**Tipo**: `string`  
**Obrigatório**: Sim  
**Descrição**: O identificador único para o evento.

Usado para referenciar o evento em um **fluxo de trabalho** através da propriedade `on`.

**Exemplo**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Tipo**: `string`  
**Obrigatório**: Não  
**Descrição**: O título de exibição para o evento.

Usado para exibição na interface do usuário (UI) e depuração.

**Exemplo**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Tipo**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Obrigatório**: Sim  
**Descrição**: A função de tratamento (handler) para o evento.

A lógica central do evento, que recebe o contexto e os parâmetros, e retorna o resultado do processamento.

**Exemplo**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Executa a lógica de tratamento do evento
    const result = await handleEvent(params);
    
    // Retorna o resultado
    return {
      success: true,
      data: result,
      message: 'Event handled successfully'
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
**Obrigatório**: Não  
**Descrição**: Os parâmetros padrão para o evento.

Preenche os parâmetros com valores padrão quando o evento é acionado.

**Exemplo**:
```ts
// Parâmetros padrão estáticos
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Parâmetros padrão dinâmicos
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Parâmetros padrão assíncronos
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
**Obrigatório**: Não  
**Descrição**: O esquema de configuração da interface do usuário (UI) para o evento.

Define o método de exibição e a configuração do formulário para o evento na UI.

**Exemplo**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Prevenir Padrão',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Parar Propagação',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Dados Personalizados',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Chave',
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
**Obrigatório**: Não  
**Descrição**: Função de *hook* executada antes de salvar os parâmetros.

Executada antes que os parâmetros do evento sejam salvos, pode ser usada para validação ou transformação de parâmetros.

**Exemplo**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validação de parâmetros
  if (!params.eventType) {
    throw new Error('O tipo de evento é obrigatório');
  }
  
  // Transformação de parâmetros
  params.eventType = params.eventType.toLowerCase();
  
  // Registra as alterações
  console.log('Parâmetros do evento alterados:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obrigatório**: Não  
**Descrição**: Função de *hook* executada após salvar os parâmetros.

Executada após os parâmetros do evento serem salvos, pode ser usada para acionar outras ações.

**Exemplo**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Registra o log
  console.log('Parâmetros do evento salvos:', params);
  
  // Aciona o evento
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Atualiza o cache
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Tipo**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obrigatório**: Não  
**Descrição**: O modo de exibição da interface do usuário (UI) para o evento.

Controla como o evento é exibido na UI.

**Modos suportados**:
- `'dialog'` - Modo de diálogo
- `'drawer'` - Modo de gaveta
- `'embed'` - Modo incorporado
- Ou um objeto de configuração personalizado

**Exemplo**:
```ts
// Modo simples
uiMode: 'dialog'

// Configuração personalizada
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Configuração do Evento'
  }
}

// Modo dinâmico
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Tipos de Eventos Integrados

O `FlowEngine` possui os seguintes tipos de eventos comuns integrados:

- `'click'` - Evento de clique
- `'submit'` - Evento de envio
- `'reset'` - Evento de redefinição
- `'remove'` - Evento de remoção
- `'openView'` - Evento de abertura de visualização
- `'dropdownOpen'` - Evento de abertura de *dropdown*
- `'popupScroll'` - Evento de rolagem de *popup*
- `'search'` - Evento de busca
- `'customRequest'` - Evento de requisição personalizada
- `'collapseToggle'` - Evento de alternância de recolhimento

## Exemplo Completo

```ts
class FormModel extends FlowModel {}

// Registra o evento de envio de formulário
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Evento de Envio de Formulário',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Valida os dados do formulário
      if (validation && !validateFormData(formData)) {
        throw new Error('A validação do formulário falhou');
      }
      
      // Processa o envio do formulário
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Formulário enviado com sucesso'
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
        title: 'Habilitar Validação',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Prevenir Padrão',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Parar Propagação',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Manipuladores Personalizados',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Nome do Manipulador',
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
      throw new Error('Os dados do formulário são obrigatórios quando a validação está habilitada');
    }
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('formEventConfigChanged', params);
  },
  uiMode: 'dialog'
});

// Registra o evento de mudança de dados
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Evento de Mudança de Dados',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Registra a mudança de dados
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Aciona ações relacionadas
      ctx.model.emitter.emit('dataChanged', {
        field,
        oldValue,
        newValue
      });
      
      return {
        success: true,
        message: 'Mudança de dados registrada com sucesso'
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

// Usando eventos em um fluxo de trabalho
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Processamento de Formulário',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Validar Formulário',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Processar Formulário',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Salvar Formulário',
      sort: 2
    }
  }
});
```