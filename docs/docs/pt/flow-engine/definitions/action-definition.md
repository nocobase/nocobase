:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# ActionDefinition

ActionDefinition define ações reutilizáveis que podem ser referenciadas em múltiplos fluxos e etapas. Uma ação é a unidade de execução central no FlowEngine, encapsulando a lógica de negócio específica.

## Definição de Tipo

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
// Registro global (via FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // Lógica de processamento
  }
});

// Registro em nível de modelo (via FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // Lógica de processamento
  }
});

// Uso em um fluxo
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Referencia a ação global
    },
    step2: {
      use: 'processDataAction', // Referencia a ação em nível de modelo
    }
  }
});
```

## Descrição das Propriedades

### name

**Tipo**: `string`  
**Obrigatório**: Sim  
**Descrição**: O identificador único para a ação

Usado para referenciar a ação em uma etapa através da propriedade `use`.

**Exemplo**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Tipo**: `string`  
**Obrigatório**: Não  
**Descrição**: O título de exibição para a ação

Usado para exibição na interface do usuário (UI) e depuração.

**Exemplo**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**Tipo**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Obrigatório**: Sim  
**Descrição**: A função de tratamento (handler) para a ação

A lógica central da ação, que recebe o contexto e os parâmetros, e retorna o resultado do processamento.

**Exemplo**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Executa a lógica específica
    const result = await performAction(params);
    
    // Retorna o resultado
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
**Obrigatório**: Não  
**Descrição**: Os parâmetros padrão para a ação

Preenche os parâmetros com valores padrão antes que a ação seja executada.

**Exemplo**:
```ts
// Parâmetros padrão estáticos
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Parâmetros padrão dinâmicos
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Parâmetros padrão assíncronos
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
**Obrigatório**: Não  
**Descrição**: O esquema de configuração da UI para a ação

Define como a ação é exibida na interface do usuário (UI) e sua configuração de formulário.

**Exemplo**:
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
      title: 'URL da API',
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
      title: 'Tempo Limite (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obrigatório**: Não  
**Descrição**: Função de *hook* executada antes de salvar os parâmetros

Executada antes que os parâmetros da ação sejam salvos, pode ser usada para validação ou transformação de parâmetros.

**Exemplo**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validação de parâmetros
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // Transformação de parâmetros
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Registra as alterações
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obrigatório**: Não  
**Descrição**: Função de *hook* executada após salvar os parâmetros

Executada após os parâmetros da ação serem salvos, pode ser usada para disparar outras operações.

**Exemplo**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Registra logs
  console.log('Action params saved:', params);
  
  // Dispara evento
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Atualiza o cache
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Tipo**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Obrigatório**: Não  
**Descrição**: Indica se deve usar parâmetros brutos

Se `true`, os parâmetros brutos são passados diretamente para a função de tratamento (handler) sem qualquer processamento.

**Exemplo**:
```ts
// Configuração estática
useRawParams: true

// Configuração dinâmica
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Tipo**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obrigatório**: Não  
**Descrição**: O modo de exibição da UI para a ação

Controla como a ação é exibida na interface do usuário (UI).

**Modos suportados**:
- `'dialog'` - Modo de diálogo
- `'drawer'` - Modo de gaveta
- `'embed'` - Modo incorporado
- ou um objeto de configuração personalizado

**Exemplo**:
```ts
// Modo simples
uiMode: 'dialog'

// Configuração personalizada
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Configuração da Ação',
    maskClosable: false
  }
}

// Modo dinâmico
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Tipo**: `ActionScene | ActionScene[]`  
**Obrigatório**: Não  
**Descrição**: Os cenários de uso para a ação

Restringe a ação para ser usada apenas em cenários específicos.

**Cenários suportados**:
- `'settings'` - Cenário de configurações
- `'runtime'` - Cenário de tempo de execução
- `'design'` - Cenário de tempo de design

**Exemplo**:
```ts
scene: 'settings'  // Usar apenas no cenário de configurações
scene: ['settings', 'runtime']  // Usar nos cenários de configurações e tempo de execução
```

### sort

**Tipo**: `number`  
**Obrigatório**: Não  
**Descrição**: O peso de ordenação para a ação

Controla a ordem de exibição da ação em uma lista. Um valor menor significa uma posição mais alta.

**Exemplo**:
```ts
sort: 0  // Posição mais alta
sort: 10 // Posição intermediária
sort: 100 // Posição mais baixa
```

## Exemplo Completo

```ts
class DataProcessingModel extends FlowModel {}

// Registra a ação de carregamento de dados
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
        title: 'URL da API',
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
        title: 'Tempo Limite (ms)',
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

// Registra a ação de processamento de dados
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
        title: 'Processador',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Opções',
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
            title: 'Codificação',
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