:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Fluxo de Eventos

No FlowEngine, todos os componentes da interface são **orientados a eventos (event-driven)**.
O comportamento, a interação e as mudanças de dados dos componentes são acionados por eventos e executados por meio de um fluxo.

## Fluxo Estático vs. Fluxo Dinâmico

No FlowEngine, os fluxos podem ser divididos em dois tipos:

### **1. Fluxo Estático**

- Definido por desenvolvedores no código;
- Atua sobre **todas as instâncias de uma classe Model**;
- Geralmente usado para lidar com a lógica geral de uma classe Model;

### **2. Fluxo Dinâmico**

- Configurado pelos usuários na interface;
- Aplica-se apenas a uma instância específica;
- Geralmente usado para comportamentos personalizados em cenários específicos;

Em resumo: **Um fluxo estático é um modelo de lógica definido em uma classe, enquanto um fluxo dinâmico é uma lógica personalizada definida em uma instância.**

## Regras de Vinculação vs. Fluxo Dinâmico

No sistema de configuração do FlowEngine, existem duas maneiras de implementar a lógica de eventos:

### **1. Regras de Vinculação**

- São **encapsulamentos de etapas (steps) de fluxo de eventos integradas**;
- Mais simples de configurar e mais semânticas;
- Essencialmente, ainda são uma forma simplificada de um **fluxo de eventos (Flow)**.

### **2. Fluxo Dinâmico**

- Capacidades completas de configuração de Fluxo;
- Personalizável:
  - **Gatilho (on)**: Define quando acionar;
  - **Etapas de execução (steps)**: Definem a lógica a ser executada;
- Adequado para lógicas de negócio mais complexas e flexíveis.

Portanto, **Regras de Vinculação ≈ Fluxo de Eventos Simplificado**, e seus mecanismos centrais são consistentes.

## Consistência do FlowAction

Tanto as **Regras de Vinculação** quanto os **Fluxos de Eventos** devem usar o mesmo conjunto de **FlowActions**.
Ou seja:

- Um **FlowAction** define as ações que podem ser chamadas por um Fluxo;
- Ambos compartilham um único sistema de ações, em vez de implementar dois sistemas separados;
- Isso garante a reutilização da lógica e uma extensão consistente.

## Hierarquia Conceitual

Conceitualmente, a relação abstrata central do FlowModel é a seguinte:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Eventos Globais (Global Events)
      │     └── Eventos Locais (Local Events)
      └── FlowActionDefinition
            ├── Ações Globais (Global Actions)
            └── Ações Locais (Local Actions)
```

### Descrição da Hierarquia

- **FlowModel**  
  Representa uma entidade de modelo com lógica de fluxo configurável e executável.

- **FlowDefinition**  
  Define um conjunto completo de lógica de fluxo (incluindo condições de gatilho e etapas de execução).

- **FlowEventDefinition**  
  Define a fonte de gatilho do fluxo, incluindo:
  - **Eventos globais**: como inicialização do aplicativo, conclusão do carregamento de dados;
  - **Eventos locais**: como mudanças de campo, cliques em botões.

- **FlowActionDefinition**  
  Define as ações executáveis do fluxo, incluindo:
  - **Ações globais**: como atualizar a página, notificações globais;
  - **Ações locais**: como modificar valores de campo, alternar o estado de componentes.

## Resumo

| Conceito | Propósito | Escopo |
|------|------|-----------|
| **Fluxo Estático (Static Flow)** | Lógica de fluxo definida no código | Todas as instâncias de XXModel |
| **Fluxo Dinâmico (Dynamic Flow)** | Lógica de fluxo definida na interface | Uma única instância de FlowModel |
| **FlowEvent** | Define o gatilho (quando acionar) | Global ou local |
| **FlowAction** | Define a lógica de execução | Global ou local |
| **Regra de Vinculação (Linkage Rule)** | Encapsulamento simplificado de etapas de fluxo de eventos | Nível de bloco, nível de ação |