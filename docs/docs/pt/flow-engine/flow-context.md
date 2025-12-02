# Visão Geral do Sistema de Contexto

O sistema de contexto do FlowEngine do NocoBase é dividido em três camadas, cada uma correspondendo a um escopo diferente. Usá-las de forma adequada permite o compartilhamento e o isolamento flexível de serviços, configurações e dados, melhorando a manutenibilidade e a escalabilidade do seu negócio.

- **FlowEngineContext (Contexto Global)**: É globalmente único e acessível por todos os modelos e **fluxos de trabalho**. É ideal para registrar serviços e configurações globais, entre outros.
- **FlowModelContext (Contexto do Modelo)**: Usado para compartilhar contexto dentro de uma árvore de modelos. Submodelos delegam automaticamente ao contexto do modelo pai, permitindo sobrescrever nomes iguais. É adequado para isolamento de lógica e dados em nível de modelo.
- **FlowRuntimeContext (Contexto de Execução do Fluxo)**: Criado a cada execução de um **fluxo de trabalho** e persiste durante todo o ciclo de execução. É útil para a passagem de dados, armazenamento de variáveis e registro do status de execução dentro do **fluxo de trabalho**. Suporta dois modos: `mode: 'runtime' | 'settings'`, que correspondem, respectivamente, ao modo de execução e ao modo de configurações.

Todos os `FlowEngineContext` (Contexto Global), `FlowModelContext` (Contexto do Modelo), `FlowRuntimeContext` (Contexto de Execução do Fluxo) e outros, são subclasses ou instâncias de `FlowContext`.

---

## 🗂️ Diagrama de Hierarquia

```text
FlowEngineContext (Contexto Global)
│
├── FlowModelContext (Contexto do Modelo)
│     ├── Sub FlowModelContext (Submodelo)
│     │     ├── FlowRuntimeContext (Contexto de Execução do Fluxo)
│     │     └── FlowRuntimeContext (Contexto de Execução do Fluxo)
│     └── FlowRuntimeContext (Contexto de Execução do Fluxo)
│
├── FlowModelContext (Contexto do Modelo)
│     └── FlowRuntimeContext (Contexto de Execução do Fluxo)
│
└── FlowModelContext (Contexto do Modelo)
      ├── Sub FlowModelContext (Submodelo)
      │     └── FlowRuntimeContext (Contexto de Execução do Fluxo)
      └── FlowRuntimeContext (Contexto de Execução do Fluxo)
```

- O `FlowModelContext` pode acessar as propriedades e métodos do `FlowEngineContext` por meio de um mecanismo de delegação, permitindo o compartilhamento de recursos globais.
- O `FlowModelContext` de um submodelo pode acessar o contexto do modelo pai (relação síncrona) por meio de um mecanismo de delegação, permitindo sobrescrever nomes iguais.
- Modelos pai-filho assíncronos não estabelecem uma relação de delegação para evitar a poluição de estado.
- O `FlowRuntimeContext` sempre acessa seu `FlowModelContext` correspondente por meio de um mecanismo de delegação, mas não propaga as alterações para cima.

---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



## 🧭 Modo de Execução e Modo de Configurações (mode)

O `FlowRuntimeContext` suporta dois modos, que são diferenciados pelo parâmetro `mode`:

- `mode: 'runtime'` (Modo de execução): Usado durante a fase de execução real do **fluxo de trabalho**. As propriedades e métodos retornam dados reais. Por exemplo:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Modo de configurações): Usado durante a fase de design e configuração do **fluxo de trabalho**. O acesso às propriedades retorna uma string de template de variável, facilitando a seleção de expressões e variáveis. Por exemplo:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Esse design de modo duplo garante a disponibilidade dos dados em tempo de execução e facilita a referência de variáveis e a geração de expressões durante a configuração, aumentando a flexibilidade e a usabilidade do FlowEngine.