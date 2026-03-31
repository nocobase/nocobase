:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# StepDefinition

StepDefinition define um único passo em um fluxo. Cada passo pode ser uma ação, um tratamento de evento ou outra operação. Um passo é a unidade de execução básica de um fluxo.

## Definição de Tipo

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
        // Lógica de processamento personalizada
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## Descrição das Propriedades

### key

**Tipo**: `string`  
**Obrigatório**: Não  
**Descrição**: O identificador único para o passo dentro do fluxo.

Se não for fornecido, o nome da chave do passo no objeto `steps` será usado.

**Exemplo**:
```ts
steps: {
  loadData: {  // key é 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Tipo**: `string`  
**Obrigatório**: Não  
**Descrição**: O nome de uma ActionDefinition registrada a ser usada.

A propriedade `use` permite que você referencie uma ação registrada, evitando definições duplicadas.

**Exemplo**:
```ts
// Primeiro, registre a ação
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Lógica de carregamento de dados
  }
});

// Use-a em um passo
steps: {
  step1: {
    use: 'loadDataAction',  // Referencia a ação registrada
    title: 'Load Data'
  }
}
```

### title

**Tipo**: `string`  
**Obrigatório**: Não  
**Descrição**: O título de exibição do passo.

Usado para exibição na interface do usuário e depuração.

**Exemplo**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Tipo**: `number`  
**Obrigatório**: Não  
**Descrição**: A ordem de execução do passo. Quanto menor o valor, mais cedo ele será executado.

Usado para controlar a ordem de execução de múltiplos passos no mesmo fluxo.

**Exemplo**:
```ts
steps: {
  step1: { sort: 0 },  // Executa primeiro
  step2: { sort: 1 },  // Executa em seguida
  step3: { sort: 2 }   // Executa por último
}
```

### handler

**Tipo**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Obrigatório**: Não  
**Descrição**: A função de tratamento para o passo.

Quando a propriedade `use` não é usada, você pode definir a função de tratamento diretamente.

**Exemplo**:
```ts
handler: async (ctx, params) => {
  // Obtenha informações de contexto
  const { model, flowEngine } = ctx;
  
  // Lógica de processamento
  const result = await processData(params);
  
  // Retorne o resultado
  return { success: true, data: result };
}
```

### defaultParams

**Tipo**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Obrigatório**: Não  
**Descrição**: Os parâmetros padrão para o passo.

Preenche os parâmetros com valores padrão antes que o passo seja executado.

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
    timestamp: Date.now()
  }
}

// Parâmetros padrão assíncronos
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
**Obrigatório**: Não  
**Descrição**: O esquema de configuração da UI para o passo.

Define como o passo é exibido na interface e sua configuração de formulário.

**Exemplo**:
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
**Obrigatório**: Não  
**Descrição**: Uma função de *hook* que é executada antes que os parâmetros sejam salvos.

Executa antes que os parâmetros do passo sejam salvos, e pode ser usada para validação ou transformação de parâmetros.

**Exemplo**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validação de parâmetros
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Transformação de parâmetros
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obrigatório**: Não  
**Descrição**: Uma função de *hook* que é executada depois que os parâmetros são salvos.

Executa depois que os parâmetros do passo são salvos, e pode ser usada para disparar outras operações.

**Exemplo**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Registra logs
  console.log('Step params saved:', params);
  
  // Dispara outras operações
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Tipo**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obrigatório**: Não  
**Descrição**: O modo de exibição da UI para o passo.

Controla como o passo é exibido na interface.

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
    width: 800,
    title: 'Step Configuration'
  }
}

// Modo dinâmico
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Tipo**: `boolean`  
**Obrigatório**: Não  
**Descrição**: Indica se é um passo predefinido.

Os parâmetros para passos com `preset: true` precisam ser preenchidos no momento da criação. Aqueles sem essa flag podem ser preenchidos após a criação do modelo.

**Exemplo**:
```ts
steps: {
  step1: {
    preset: true,  // Os parâmetros devem ser preenchidos no momento da criação
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Os parâmetros podem ser preenchidos posteriormente
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Tipo**: `boolean`  
**Obrigatório**: Não  
**Descrição**: Indica se os parâmetros do passo são obrigatórios.

Se `true`, uma caixa de diálogo de configuração será aberta antes de adicionar o modelo.

**Exemplo**:
```ts
paramsRequired: true  // Os parâmetros devem ser configurados antes de adicionar o modelo
paramsRequired: false // Os parâmetros podem ser configurados posteriormente
```

### hideInSettings

**Tipo**: `boolean`  
**Obrigatório**: Não  
**Descrição**: Indica se o passo deve ser ocultado no menu de configurações.

**Exemplo**:
```ts
hideInSettings: true  // Ocultar nas configurações
hideInSettings: false // Mostrar nas configurações (padrão)
```

### isAwait

**Tipo**: `boolean`  
**Obrigatório**: Não  
**Padrão**: `true`  
**Descrição**: Indica se deve aguardar a conclusão da função de tratamento.

**Exemplo**:
```ts
isAwait: true  // Aguarda a conclusão da função de tratamento (padrão)
isAwait: false // Não aguarda, executa assincronamente
```

## Exemplo Completo

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
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
      title: 'Process Data',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Processor is required');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Save Configuration'
        }
      }
    }
  }
});
```