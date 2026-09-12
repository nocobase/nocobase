---
title: "Component vs FlowModel"
description: "Guia de escolha no desenvolvimento NocoBase: quando usar componentes React comuns e quando usar FlowModel, diferenças de capacidades, comparação de ciclo de vida e seleção de cenários."
keywords: "Component,FlowModel,guia de escolha,componentes React,configuração visual,árvore de modelos,NocoBase"
---

# Component vs FlowModel

No desenvolvimento de plugins do NocoBase, há duas formas de escrever a UI front-end: **componentes React comuns** e **[FlowModel](../../flow-engine/index.md)**. Eles não são alternativas que se substituem — o FlowModel é uma camada de encapsulamento construída sobre os componentes React, adicionando aos componentes a capacidade de configuração visual.

Em geral, você não precisa pensar muito. Pergunte-se:

> **Esse componente precisa aparecer no menu "Adicionar bloco / campo / ação" do NocoBase, permitindo que o usuário faça configuração visual na interface?**

- **Não** → use um componente React comum, é desenvolvimento React padrão
- **Sim** → use o FlowModel para envolvê-lo

## Solução padrão: componentes React

Na maioria dos cenários de plugins, componentes React comuns são suficientes. Por exemplo:

- Registrar uma página independente (página de configurações do plugin, página de rota personalizada)
- Escrever uma modal, formulário, lista ou outro componente interno
- Encapsular um componente de UI utilitário

Nesses cenários, você escreve componentes com React + Antd e usa `useFlowContext()` para obter as capacidades do contexto do NocoBase (envio de requisições, internacionalização etc.). Não há diferença em relação ao desenvolvimento front-end comum.

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MySettingsPage() {
  const ctx = useFlowContext();

  return (
    <div>
      <h2>{ctx.t('Plugin settings')}</h2>
      {/* 普通 React 组件，不需要 FlowModel */}
    </div>
  );
}
```

Para uso detalhado, veja [Desenvolvimento de Component](./component/index.md).

## Quando usar FlowModel

Use FlowModel quando seu componente precisar atender às seguintes condições:

1. **Aparecer no menu**: precisa permitir que o usuário adicione via menus "Adicionar bloco", "Adicionar campo" ou "Adicionar ação"
2. **Suportar configuração visual**: o usuário pode clicar em itens de configuração na interface para modificar propriedades do componente (por exemplo, alterar o título, alternar o modo de exibição)
3. **Configuração precisa ser persistida**: a configuração do usuário precisa ser salva e estar lá da próxima vez que abrir a página

Em resumo, o FlowModel resolve o problema de "tornar o componente configurável e persistível". Se o seu componente não precisa dessas capacidades, você não precisa dele.

## Relação entre os dois

O FlowModel não foi feito para "substituir" os componentes React. É uma camada de abstração sobre os componentes React:

```
Componente React: responsável por renderizar a UI
    ↓ encapsula
FlowModel: gerencia origem das props, painel de configuração, persistência da configuração
```

Dentro do método `render()` de um FlowModel, o que se escreve é código React comum. A diferença é: as props de um componente comum são fixas ou passadas pelo componente pai; as props de um FlowModel são geradas dinamicamente por meio do Flow (fluxo de configuração).

Na verdade, os dois são muito semelhantes em estrutura básica:

```tsx pure
// Componente React
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}

// FlowModel
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

No entanto, a forma como são gerenciados é completamente diferente. Os componentes React formam uma **árvore de componentes** por meio do aninhamento de JSX — essa é a árvore de renderização da UI em tempo de execução. O FlowModel, por sua vez, é gerenciado pelo [FlowEngine](../../flow-engine/index.md) e forma uma **árvore de modelos** — uma estrutura lógica persistível e dinamicamente registrável, na qual a relação pai-filho é controlada explicitamente por `setSubModel` / `addSubModel`. É adequado para construir blocos de página, fluxos de ação, modelos de dados e outras estruturas que exigem gestão configurável.

## Comparação de capacidades

Vendo as diferenças sob um ângulo mais técnico:

| Capacidade | Componente React | FlowModel |
| --- | --- | --- |
| Renderizar UI | `render()` | `render()` |
| Gerenciamento de estado | `state` / `setState` integrados | Gerenciado por `props` e estrutura da árvore de modelos |
| Ciclo de vida | `constructor`, `componentDidMount`, `componentWillUnmount` | `onInit`, `onMount`, `onUnmount` |
| Reagir a mudanças de entrada | `componentDidUpdate` | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Tratamento de erros | `componentDidCatch` | `onAutoFlowsError` |
| Componentes filhos | Aninhamento JSX | `setSubModel` / `addSubModel` para definir submodelos explicitamente |
| Comportamento dinâmico | Vinculação de eventos, atualização de estado | Registro e despacho de Flows |
| Persistência | Sem mecanismo embutido | `model.save()` etc., integrado com o backend |
| Reuso de múltiplas instâncias | Tratamento manual | `createFork` — por exemplo, cada linha de uma tabela |
| Gerenciamento por engine | Nenhum | Registrado, carregado e gerenciado de forma unificada pelo FlowEngine |

Se você está familiarizado com o ciclo de vida do React, o ciclo de vida do FlowModel se mapeia facilmente — `onInit` corresponde a `constructor`, `onMount` corresponde a `componentDidMount`, `onUnmount` corresponde a `componentWillUnmount`.

Além disso, o FlowModel oferece capacidades que componentes React não têm:

- **`registerFlow`** — registra um Flow, definindo o fluxo de configuração
- **`applyFlow` / `dispatchEvent`** — executa ou dispara um Flow
- **`openFlowSettings`** — abre o painel de configurações de uma etapa do Flow
- **`save` / `saveStepParams()`** — persiste a configuração do modelo
- **`createFork`** — uma mesma lógica de modelo é reutilizada e renderizada várias vezes (por exemplo, cada linha de uma tabela)

Essas capacidades são a base para a experiência de "configuração visual". Se o seu cenário não envolve configuração visual, você não precisa se preocupar com elas. Para uso detalhado, veja a [documentação completa do FlowEngine](../../flow-engine/index.md).

## Cenários de comparação

| Cenário | Solução | Motivo |
| --- | --- | --- |
| Página de configurações do plugin | Componente React | Página independente, não precisa aparecer no menu de configuração |
| Modal utilitária | Componente React | Componente interno, não precisa de configuração visual |
| Bloco de tabela de dados personalizado | FlowModel | Precisa aparecer no menu "Adicionar bloco" e o usuário pode configurar a fonte de dados |
| Componente personalizado de exibição de campo | FlowModel | Precisa aparecer na configuração de campo e o usuário pode escolher o modo de exibição |
| Botão de ação personalizado | FlowModel | Precisa aparecer no menu "Adicionar ação" |
| Encapsular um componente de gráfico para uso em um bloco | Componente React | O gráfico em si é um componente interno, chamado pelo bloco baseado em FlowModel |

## Adoção progressiva

Quando estiver em dúvida, comece implementando a funcionalidade com um componente React. Depois, ao confirmar que precisa de capacidades de configuração visual, envolva-o com FlowModel — essa é a abordagem progressiva recomendada. Use FlowModel para gerenciar grandes blocos e componentes React para os detalhes internos; os dois funcionam bem juntos.

## Links relacionados

- [Desenvolvimento de Component](./component/index.md) — escrita de componentes React e uso de useFlowContext
- [Visão geral do FlowEngine](./flow-engine/index.md) — uso básico de FlowModel e registerFlow
- [Documentação completa do FlowEngine](../../flow-engine/index.md) — referência completa de FlowModel, Flow e Context
