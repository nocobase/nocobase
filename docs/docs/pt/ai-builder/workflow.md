---
title: "Gerenciamento de Workflow"
description: "O Skill de Gerenciamento de Workflow serve para criar, editar, ativar e diagnosticar workflows do NocoBase."
keywords: "Construtor de IA,workflow,trigger,nó,aprovação,automação"
---

# Gerenciamento de Workflow

:::tip Pré-requisitos

Antes de ler esta página, certifique-se de que você seguiu o [Início Rápido do Construtor de IA](./index.md), instalou o NocoBase CLI e concluiu a inicialização.

:::

## Introdução

O Skill de Gerenciamento de Workflow serve para criar, editar, ativar e diagnosticar workflows do NocoBase — da escolha do trigger à montagem da cadeia de nós, passando pela investigação de resultados de execução, cobrindo todo o ciclo de vida de uso de um workflow.


## Capacidades

Pode fazer:

- Criar workflows: escolher o tipo de trigger e adicionar nós de processamento um a um.
- Editar workflows: alterar a configuração do trigger, adicionar/remover/alterar nós, mover e copiar nós.
- Gestão de versões: versões já executadas geram automaticamente uma nova revisão, sem afetar o histórico.
- Ativar e executar workflows manualmente.
- Diagnosticar execuções com falha: localizar o nó problemático e a mensagem de erro.

Não pode fazer:

- Não desenha o modelo de dados (use o [Skill de Modelagem de Dados](./data-modeling)).
- Não instala MCP nem trata problemas de ambiente (use o [Skill de Gerenciamento de Ambiente](./env-bootstrap)).
- Não exclui workflows inteiros (operação de alto risco que requer confirmação separada).
- Não inventa tipos de nós ou de triggers.

## Exemplos de prompt

### Cenário A: Criar um novo workflow

```
Crie um workflow que reduz automaticamente o estoque do produto após a criação de um pedido.
```

O Skill primeiro confirma o tipo de trigger e o desenho da cadeia de nós e, após a confirmação, cria passo a passo.

![20260419234303](https://static-docs.nocobase.com/20260419234303.png)

### Cenário B: Editar um workflow existente

```
No workflow de criação de pedido, adicione um nó de notificação quando o estoque estiver insuficiente, enviando uma mensagem interna ao administrador.
```

Se a versão atual já foi executada, o Skill cria uma nova revisão antes de editar, sem afetar o histórico de execuções.

![20260419234419](https://static-docs.nocobase.com/20260419234419.png)

### Cenário C: Diagnosticar uma falha de execução

```
A última execução do workflow de redução de estoque após criação de pedido falhou. Veja o que deu errado.
```

Encontra a última execução com falha, localiza o nó com erro, a mensagem de erro e dá sugestões de correção.

![20260419234532](https://static-docs.nocobase.com/20260419234532.png)

### Cenário D: Analisar ou resumir a lógica de um workflow

```
Analise a lógica de processamento do workflow "redução de estoque após criação de pedido".
```

Saída:

```markdown
# Análise do workflow: redução de estoque após criação de pedido

## Visão geral
**Nome do workflow:** redução de estoque após criação de pedido

### Trigger
- **Tipo:** evento pós-ação (Action)
- **Condição:** disparado quando a coleção `orders` (pedidos) executa a operação "criar" (trigger global).
- **Dados associados:** ao disparar, carrega os dados associados de `details` (itens do pedido).
- **Modo de execução:** assíncrono

---

### Cadeia de execução de nós

**[Trigger] Criação do pedido**
        │
        ▼
**[1] Loop sobre os itens do pedido (Loop)**
    * **Alvo:** `{{$context.data.details}}`
    * *Operação: para cada item, executar os passos a seguir:*
        │
        ▼
    **branchIndex=0 (corpo do loop)**
        │
        ▼
    **[2] Consultar estoque do produto (Query)**
    * **Coleção:** `products`
    * **Filtro:** `id = {{$scopes.5u6lsjzf8vh.item.productId}}`
        │
        ▼
    **[3] Verificar se o estoque é suficiente (Condition)**
    * **Engine:** `formula.js`
    * **Expressão:** `{{$jobsMapByNodeKey.n6rf8lf2lum.inventory}} < {{$scopes.5u6lsjzf8vh.item.quantity}}`
        │
        ├── **YES (branchIndex=1, estoque insuficiente, condição TRUE):**
        │   ▼
        │   **[4] Notificar super administrador (Notification)**
        │   *Envia notificação aos usuários com papel root, contendo:*
        │   *nome do produto, ID do produto, estoque atual e quantidade requerida no pedido.*
        │
        └── **NO (branchIndex=0, estoque suficiente, ramo vazio)**
        │
        ▼
    **[5] Reduzir estoque (SQL)**
    * **SQL:** `UPDATE products SET inventory = inventory - :quantity`

---

### Explicação da lógica principal

| Etapa | Descrição |
| :--- | :--- |
| **Trigger** | Ao criar um pedido, o sistema entra no workflow trazendo a lista completa de itens. |
| **Loop** | Itera item a item; cada item corresponde a um produto e à sua quantidade. |
| **Consulta** | Consulta o estoque atual do produto pelo `productId`. |
| **Decisão** | Avalia se `inventory < quantity` é verdadeiro (estoque insuficiente). |
| **Notificação** | Se o estoque estiver insuficiente, envia uma mensagem interna aos usuários com papel `root`. |
| **Redução** | Atualiza o estoque diretamente via SQL; como os ramos convergem, a redução é executada independentemente do estoque. |

---

### ⚠️ Possível problema de design

O `downstreamId` do nó de condição aponta para o nó de redução de estoque, ou seja, qualquer ramo (estoque suficiente ou insuficiente) acaba executando a redução. O comportamento real é:

- **Estoque suficiente** $\rightarrow$ reduz o estoque diretamente (fluxo normal). ✓
- **Estoque insuficiente** $\rightarrow$ notifica o administrador e **mesmo assim executa a redução** (pode levar a estoque negativo).

**Análise:** esse desenho corresponde ao padrão de "permitir overselling com alerta", mas também pode ser uma falha lógica (a intenção seria bloquear a redução quando o estoque for insuficiente). É preciso confirmar a intenção com a área de negócio.

---

### Status atual

- **Habilitado:** `false` (desabilitado)
- **Histórico de execução:** executado 1 vez.
- **Controle de versão:** a versão atual está congelada; para alterações, é preciso primeiro criar uma nova versão.
```

## Perguntas frequentes

**Por que o workflow não dispara depois de criado?**

Workflows recém-criados ficam por padrão desabilitados (`enabled: false`). Confirme a configuração do trigger e habilite manualmente.

**Após editar um workflow, o histórico de execuções é afetado?**

Não. Se a versão atual já tem execuções, o Skill cria automaticamente uma nova revisão; o histórico permanece vinculado à versão antiga, sem ser afetado.

## Links relacionados

- [Visão Geral do Construtor de IA](./index.md) — Visão geral de todos os Skills do Construtor de IA e como instalar
- [Modelagem de Dados](./data-modeling) — Crie e gerencie tabelas com IA
- [Gerenciamento de Ambiente](./env-bootstrap) — Verificação de ambiente, instalação e diagnóstico de falhas
