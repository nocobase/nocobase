:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/flow-engine/flow-context).
:::

# Visão geral do sistema de contexto

O sistema de contexto do mecanismo de fluxo (FlowEngine) do NocoBase é dividido em três camadas, correspondendo a diferentes escopos. O uso adequado permite o compartilhamento e isolamento flexível de serviços, configurações e dados, melhorando a manutenibilidade e a escalabilidade do negócio.

- **FlowEngineContext (Contexto Global)**: Globalmente único, acessível por todos os modelos e fluxos, adequado para registrar serviços globais, configurações, etc.
- **FlowModelContext (Contexto do Modelo)**: Usado para compartilhar contexto dentro da árvore de modelos; submodelos delegam automaticamente ao contexto do modelo pai, suportando sobrescrita de mesmo nome; adequado para isolamento de lógica e dados em nível de modelo.
- **FlowRuntimeContext (Contexto de Execução do Fluxo)**: Criado a cada execução do fluxo, percorre todo o ciclo de execução do fluxo, adequado para transferência de dados, armazenamento de variáveis e registro de estado de execução no fluxo. Suporta dois modos: `mode: 'runtime' | 'settings'`, correspondendo respectivamente ao estado de execução e ao estado de configuração.

Todos os `FlowEngineContext` (Contexto Global), `FlowModelContext` (Contexto do Modelo), `FlowRuntimeContext` (Contexto de Execução do Fluxo), etc., são subclasses ou instâncias de `FlowContext`.

---

## 🗂️ Diagrama de estrutura hierárquica

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

- `FlowModelContext` acessa as propriedades e métodos do `FlowEngineContext` através de um mecanismo de delegação (delegate), realizando o compartilhamento de capacidades globais.
- O `FlowModelContext` de submodelos acessa o contexto do modelo pai através de um mecanismo de delegação (relação síncrona), suportando sobrescrita de mesmo nome.
- Modelos pai-filho assíncronos não estabelecem relação de delegação para evitar poluição de estado.
- `FlowRuntimeContext` sempre acessa seu `FlowModelContext` correspondente através de um mecanismo de delegação, mas não propaga de volta para cima.

---

## 🧭 Estado de execução e estado de configuração (mode)

O `FlowRuntimeContext` suporta dois modos, diferenciados pelo parâmetro `mode`:

- `mode: 'runtime'` (Estado de execução): Usado na fase de execução real do fluxo, onde propriedades e métodos retornam dados reais. Exemplo:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Estado de configuração): Usado na fase de design e configuração do fluxo, onde o acesso a propriedades retorna strings de template de variáveis, facilitando expressões e seleção de variáveis. Exemplo:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Este design de modo duplo garante a disponibilidade de dados em tempo de execução e facilita a referência de variáveis e a geração de expressões na configuração, aumentando a flexibilidade e facilidade de uso do mecanismo de fluxo.

---

## 🤖 Informações de contexto para ferramentas/LLMs

Em certos cenários (como edição de código RunJS no JS*Model, AI coding), é necessário permitir que o "chamador" entenda, sem executar o código:

- Quais **capacidades estáticas** existem no `ctx` atual (documentação de API, parâmetros, exemplos, links de documentação, etc.)
- Quais **variáveis opcionais** existem na interface/estado de execução atual (como "registro atual", "registro do pop-up atual", etc., estruturas dinâmicas)
- **Snapshot de pequeno volume** do ambiente de execução atual (usado para prompt)

### 1) `await ctx.getApiInfos(options?)` (Informações estáticas de API)

### 2) `await ctx.getVarInfos(options?)` (Informações de estrutura de variáveis)

- Construído com base em `defineProperty(...).meta` (incluindo meta factory)
- Suporta recorte de `path` e controle de profundidade `maxDepth`
- Expande para baixo apenas quando necessário

Parâmetros comuns:

- `maxDepth`: Nível máximo de expansão (padrão 3)
- `path: string | string[]`: Recorte, gera apenas a subárvore do caminho especificado

### 3) `await ctx.getEnvInfos()` (Snapshot do ambiente de execução)

Estrutura do nó (simplificada):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Pode ser usado diretamente para await ctx.getVar(getVar), começando com "ctx."
  value?: any; // Valor estático resolvido/serializável
  properties?: Record<string, EnvNode>;
};
```