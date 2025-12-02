:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# FlowModel vs React.Component

## Comparativo de Responsabilidades Básicas

| Característica/Capacidade         | `React.Component`       | `FlowModel`                            |
| ----------------------------- | ----------------------- | -------------------------------------- |
| Capacidade de Renderização    | Sim, o método `render()` gera a UI    | Sim, o método `render()` gera a UI                   |
| Gerenciamento de Estado       | `state` e `setState` integrados | Usa `props`, mas o gerenciamento de estado depende mais da estrutura da árvore de modelos               |
| Ciclo de Vida                 | Sim, por exemplo, `componentDidMount` | Sim, por exemplo, `onInit`, `onMount`, `onUnmount`     |
| Propósito                     | Construir componentes de UI                | Construir "árvores de modelos" estruturadas, baseadas em fluxo e orientadas a dados                   |
| Estrutura de Dados            | Árvore de componentes                     | Árvore de modelos (suporta modelos pai-filho, Fork de múltiplas instâncias)                   |
| Componentes Filhos            | Usando JSX para aninhar componentes             | Usando `setSubModel`/`addSubModel` para definir explicitamente sub-modelos |
| Comportamento Dinâmico        | Associação de eventos, atualizações de estado impulsionam a UI          | Registrar/despachar Fluxos, lidar com fluxos automáticos                      |
| Persistência                  | Sem mecanismo integrado                   | Suporta persistência (por exemplo, `model.save()`)                |
| Suporta Fork (múltiplas renderizações) | Não (requer reuso manual)                | Sim (`createFork` para múltiplas instanciações)                   |
| Controle do Motor             | Nenhum                       | Sim, gerenciado, registrado e carregado pelo `FlowEngine`              |

## Comparativo de Ciclo de Vida

| Gancho de Ciclo de Vida | `React.Component`                 | `FlowModel`                                  |
| ------------------- | --------------------------------- | -------------------------------------------- |
| Inicialização         | `constructor`, `componentDidMount` | `onInit`, `onMount`                           |
| Desmontagem           | `componentWillUnmount`            | `onUnmount`                                  |
| Resposta à Entrada    | `componentDidUpdate`              | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Tratamento de Erros   | `componentDidCatch`               | `onAutoFlowsError`                      |

## Comparativo de Estrutura de Construção

**React:**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel:**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## Árvore de Componentes vs Árvore de Modelos

*   **Árvore de Componentes React**: Uma árvore de renderização de UI formada por JSX aninhado em tempo de execução.
*   **Árvore de Modelos FlowModel**: Uma árvore de estrutura lógica gerenciada pelo FlowEngine, que pode ser persistida e permite o registro dinâmico e o controle de sub-modelos. É adequada para construir blocos de página, fluxos de ação, modelos de dados, etc.

## Funcionalidades Especiais (Específicas do FlowModel)

| Função                               | Descrição                     |
| ------------------------------------ | ----------------------------- |
| `registerFlow`                       | Registrar fluxo             |
| `applyFlow` / `dispatchEvent`        | Executar/disparar fluxo             |
| `setSubModel` / `addSubModel`        | Controlar explicitamente a criação e a vinculação de sub-modelos          |
| `createFork`                         | Suporta o reuso da lógica de um modelo para múltiplas renderizações (por exemplo, cada linha em uma tabela) |
| `openFlowSettings`                   | Configurações de etapa do fluxo |
| `save` / `saveStepParams()`          | O modelo pode ser persistido e integrado com o backend           |

## Resumo

| Item              | React.Component                  | FlowModel                                |
| ----------------- | -------------------------------- | ---------------------------------------- |
| Cenários Adequados | Organização de componentes da camada de UI        | Gerenciamento de blocos e fluxos orientados a dados           |
| Ideia Central     | UI Declarativa                   | Fluxo estruturado orientado a modelos             |
| Método de Gerenciamento | React controla o ciclo de vida    | FlowModel controla o ciclo de vida e a estrutura do modelo |
| Vantagens         | Ecossistema e conjunto de ferramentas ricos        | Fortemente estruturado, fluxos podem ser persistidos, sub-modelos são controláveis      |

> O FlowModel pode ser usado de forma complementar ao React: use React para renderizar dentro de um FlowModel, enquanto seu ciclo de vida e estrutura são gerenciados pelo FlowEngine.