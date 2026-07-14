---
title: "ctx.ai"
description: "Use ctx.ai no RunJS para acionar tarefas de funcionário de IA, com conteúdo de tarefa direto ou com tarefas configuradas em uma ação de funcionário de IA."
keywords: "ctx.ai,AI employee,triggerTask,triggerModelTask,RunJS,NocoBase"
---

# ctx.ai

No RunJS, `ctx.ai` aciona **tarefas de funcionário de IA**. Ele é útil em JSBlock, JSAction e outras interações nas quais um botão, formulário ou fluxo de negócio precisa entregar trabalho a um funcionário de IA específico.

`ctx.ai` apenas aciona tarefas. Ele não retorna o resultado de execução da tarefa. Depois da chamada, a tarefa entra no fluxo de conversa do funcionário de IA.

:::warning Observação

`ctx.ai` é fornecido pelo plugin de IA. Se o plugin de IA não estiver habilitado, ou se o ambiente RunJS atual não tiver carregado a capacidade de cliente correspondente, `ctx.ai` pode não existir. Você pode verificar `ctx.ai?.triggerTask` ou `ctx.ai?.triggerModelTask` antes de chamar.

:::

## Métodos

### ctx.ai.triggerTask()

Aciona diretamente uma tarefa de funcionário de IA.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | Funcionário de IA. Ao passar uma string, NocoBase compara exatamente com `AIEmployee.username`, e o funcionário de IA deve estar acessível ao usuário atual. |
| `tasks` | `Task[]` | Lista de tarefas a acionar. |
| `open` | `boolean` | Se o painel de conversa do funcionário de IA deve ser aberto. |
| `auto` | `boolean` | Se deve usar a semântica de acionamento automático de uma ação de funcionário de IA. |

Campos comuns de `Task`:

| Campo | Tipo | Descrição |
|------|------|------|
| `title` | `string` | Título da tarefa. |
| `message.system` | `string` | Mensagem do sistema para limitar o papel e os requisitos de saída do funcionário de IA. |
| `message.user` | `string` | Mensagem do usuário, ou seja, a instrução principal da tarefa. |
| `message.workContext` | `ContextItem[]` | Contexto de blocos da página usado pela tarefa. |
| `autoSend` | `boolean` | Se a mensagem da tarefa deve ser enviada automaticamente. |
| `webSearch` | `boolean` | Se esta tarefa pode usar Web search. |
| `model` | `{ llmService: string; model: string } \| null` | Modelo usado por esta tarefa. |
| `skillSettings` | `SkillSettings` | Configuração de skills / tools usada por esta tarefa. |

### Adicionar contexto de blocos da página

`message.workContext` atualmente passa blocos da página. Coloque nele o uid FlowModel do bloco de destino:

```ts
message: {
  user: 'Review the current users table and summarize operational risks.',
  workContext: [
    {
      type: 'flow-model',
      uid: 'USERS_TABLE_BLOCK_UID',
    },
  ],
}
```

| Campo | Descrição |
|------|------|
| `type` | Valor fixo `flow-model`, indicando contexto de bloco da página. |
| `uid` | uid FlowModel do bloco da página, como tabela, detalhe ou gráfico. |

Se quiser usar o JSBlock atual como contexto, use o uid do modelo atual:

```ts
workContext: [
  {
    type: 'flow-model',
    uid: ctx.model.uid,
  },
],
```

### Especificar modelo

`model` especifica o modelo de uma tarefa. Se omitido, a configuração de modelo padrão do funcionário de IA é usada. Passar `null` significa não especificar modelo no nível da tarefa.

```ts
model: {
  llmService: 'openai-main',
  model: 'gpt-4.1',
}
```

### Configurar skills / tools

`skillSettings` especifica as skills e tools disponíveis para uma tarefa. Se omitido, a configuração de capacidades do funcionário de IA é usada.

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: ['business-analysis-report'],
  tools: ['businessReportGenerator'],
}
```

Para desabilitar explicitamente todas as skills ou tools desta tarefa, passe arrays vazios e mantenha os campos de versão:

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: [],
  tools: [],
}
```

Exemplo:

```ts
if (!ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

ctx.ai.triggerTask({
  aiEmployee: 'viz',
  open: true,
  tasks: [
    {
      title: ctx.t('Daily operations handoff brief'),
      message: {
        system:
          'You prepare reusable daily operations handoff briefs. Focus on risks, blockers, decisions, owners, and next actions.',
        user: [
          "Prepare today's operations handoff brief.",
          'Cover customer escalations, SLA risks, approvals, and follow-up owners.',
          'Return a concise brief that can be posted to the team channel.',
        ].join('\n'),
      },
      autoSend: true,
      webSearch: false,
    },
  ],
});

ctx.message.success(ctx.t('AI employee task triggered.'));
```

Se `aiEmployee` for uma string, NocoBase procura correspondência exata por `username` entre os funcionários de IA acessíveis ao usuário atual.

### ctx.ai.triggerModelTask()

Lê uma tarefa de um modelo de ação de funcionário de IA na página e a aciona.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `uid` | `string` | uid FlowModel da ação de funcionário de IA. |
| `taskIndex` | `number` | Índice da tarefa, começando em `0`. |
| `options.open` | `boolean` | Se o painel de conversa do funcionário de IA deve ser aberto. |
| `options.auto` | `boolean` | Se deve usar a semântica de acionamento automático de uma ação de funcionário de IA. |

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

Se o modelo de destino não existir, não tiver funcionário de IA configurado, ou o índice informado não tiver tarefa, nenhuma tarefa será acionada e um aviso será impresso no console.

## Observações

- `triggerTask()` e `triggerModelTask()` são fire-and-forget. Eles não retornam o resultado de execução da tarefa.
- Strings em `aiEmployee` correspondem apenas exatamente a `AIEmployee.username`.
- `triggerModelTask()` usa `taskIndex` começando em `0`.
- `message.workContext` atualmente descreve apenas contexto de blocos da página.

## Relacionado

- [ctx.message](./message.md): Mostra avisos leves antes e depois de acionar tarefas.
- [ctx.render](./render.md): Renderiza botões ou formulários no JSBlock.
- [ctx.model](./model.md): Obtém informações do FlowModel atual.
