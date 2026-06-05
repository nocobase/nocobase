:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# FlowDefinition

`FlowDefinition` define a estrutura básica e a configuração de um fluxo de trabalho, sendo um dos conceitos centrais do `FlowEngine`. Ele descreve os metadados do fluxo de trabalho, condições de disparo, etapas de execução, entre outros.

## Definição de Tipo

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

## Método de Registro

```ts
class MyModel extends FlowModel {}

// Registra um fluxo de trabalho através da classe do modelo
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

## Descrição das Propriedades

### key

**Tipo**: `string`  
**Obrigatório**: Sim  
**Descrição**: O identificador único para o fluxo de trabalho.

Recomenda-se usar um estilo de nomenclatura consistente `xxxSettings`, por exemplo:
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

Essa convenção de nomenclatura facilita a identificação e a manutenção, e é recomendável que seja usada de forma consistente em todo o projeto.

**Exemplo**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Tipo**: `string`  
**Obrigatório**: Não  
**Descrição**: O título legível por humanos do fluxo de trabalho.

Recomenda-se manter um estilo consistente com a chave, usando a nomenclatura `Xxx settings`, por exemplo:
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

Essa convenção de nomenclatura é mais clara e fácil de entender, facilitando a exibição na interface do usuário e a colaboração em equipe.

**Exemplo**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Tipo**: `boolean`  
**Obrigatório**: Não  
**Padrão**: `false`  
**Descrição**: Indica se o fluxo de trabalho só pode ser executado manualmente.

- `true`: O fluxo de trabalho só pode ser disparado manualmente e não será executado automaticamente.
- `false`: O fluxo de trabalho pode ser executado automaticamente (o padrão é execução automática quando a propriedade `on` não está presente).

**Exemplo**:
```ts
manual: true  // Executa apenas manualmente
manual: false // Pode ser executado automaticamente
```

### sort

**Tipo**: `number`  
**Obrigatório**: Não  
**Padrão**: `0`  
**Descrição**: A ordem de execução do fluxo de trabalho. Quanto menor o valor, mais cedo ele é executado.

Números negativos podem ser usados para controlar a ordem de execução de múltiplos fluxos de trabalho.

**Exemplo**:
```ts
sort: -1  // Executa com prioridade
sort: 0   // Ordem padrão
sort: 1   // Executa depois
```

### on

**Tipo**: `FlowEvent<TModel>`  
**Obrigatório**: Não  
**Descrição**: A configuração de evento que permite que este fluxo de trabalho seja disparado por `dispatchEvent`.

Usado apenas para declarar o nome do evento de disparo (string ou `{ eventName }`), não inclui uma função de manipulador.

**Tipos de eventos suportados**:
- `'click'` - Evento de clique
- `'submit'` - Evento de envio
- `'reset'` - Evento de redefinição
- `'remove'` - Evento de remoção
- `'openView'` - Evento de abertura de visualização
- `'dropdownOpen'` - Evento de abertura de dropdown
- `'popupScroll'` - Evento de rolagem de pop-up
- `'search'` - Evento de busca
- `'customRequest'` - Evento de requisição personalizada
- `'collapseToggle'` - Evento de alternância de recolhimento
- Ou qualquer string personalizada

**Exemplo**:
```ts
on: 'click'  // Disparado ao clicar
on: 'submit' // Disparado ao enviar
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Tipo**: `Record<string, StepDefinition<TModel>>`  
**Obrigatório**: Sim  
**Descrição**: A definição das etapas do fluxo de trabalho.

Define todas as etapas contidas no fluxo de trabalho, com cada etapa tendo uma chave única.

**Exemplo**:
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
**Obrigatório**: Não  
**Descrição**: Parâmetros padrão em nível de fluxo de trabalho.

Quando o modelo é instanciado (`createModel`), ele preenche os valores iniciais para os parâmetros das etapas do "fluxo de trabalho atual". Ele apenas preenche os valores ausentes e não sobrescreve os existentes. O formato de retorno fixo é: `{ [stepKey]: params }`

**Exemplo**:
```ts
// Parâmetros padrão estáticos
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Parâmetros padrão dinâmicos
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Parâmetros padrão assíncronos
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Exemplo Completo

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