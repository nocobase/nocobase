---
title: "ctx.ai"
description: "Use ctx.ai no RunJS para acionar tarefas de funcionário de IA na conversa global ou em um AI Chat Box específico, com conteúdo direto ou com tarefas configuradas em uma ação de funcionário de IA."
keywords: "ctx.ai,AI employee,uploadFile,attachments,triggerTask,triggerModelTask,chatBoxUid,AI Chat Box,RunJS,NocoBase"
---

# ctx.ai

No RunJS, `ctx.ai` aciona **tarefas de funcionário de IA**. Ele é útil em JSBlock, JSAction e outras interações nas quais um botão, formulário ou fluxo de negócio precisa entregar trabalho a um funcionário de IA específico.

`ctx.ai` faz upload de anexos para tarefas de IA e aciona tarefas. É possível aguardar o upload dos arquivos, mas o acionamento da tarefa não retorna seu resultado de execução. Depois da chamada, a tarefa entra no fluxo de conversa do funcionário de IA.

:::warning Observação

`ctx.ai` é fornecido pelo plugin de IA. Se o plugin de IA não estiver habilitado, ou se o ambiente RunJS atual não tiver carregado a capacidade de cliente correspondente, `ctx.ai` pode não existir. Você pode verificar `ctx.ai?.uploadFile`, `ctx.ai?.triggerTask` ou `ctx.ai?.triggerModelTask` antes de chamar.

:::

## Métodos

### ctx.ai.uploadFile()

Faz upload de um arquivo e retorna um objeto de anexo que pode ser passado diretamente para uma tarefa de funcionário de IA.

```ts
const attachment = await ctx.ai.uploadFile(file, options);
```

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `file` | `File` | Objeto de arquivo do navegador que será enviado. |
| `options.onProgress` | `(percent: number) => void` | Callback de progresso do upload. `percent` varia de `0` a `100`. |
| `options.signal` | `AbortSignal` | Sinal usado para cancelar o upload. |

O upload usa o armazenamento de arquivos configurado pelo plugin de IA e cria um registro em `aiFiles`. O objeto retornado inclui campos como `id`, `filename`, `url` e `source`:

```ts
const attachment = await ctx.ai.uploadFile(file, {
  onProgress(percent) {
    console.log('upload progress', percent);
  },
});

// attachment pode ser colocado diretamente em message.attachments
```

O Promise é rejeitado quando o upload falha. Remover um anexo da lista local não exclui o registro já criado em `aiFiles`, assim como na janela de chat de IA padrão.

### ctx.ai.triggerTask()

Aciona diretamente uma tarefa de funcionário de IA.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | Funcionário de IA. Ao passar uma string, NocoBase compara exatamente com `AIEmployee.username`, e o funcionário de IA deve estar acessível ao usuário atual. |
| `tasks` | `Task[]` | Lista de tarefas a acionar. |
| `chatBoxUid` | `string` | uid FlowModel do bloco AI Chat Box que deve receber a tarefa. |
| `open` | `boolean` | Se o painel de conversa do funcionário de IA deve ser aberto. |
| `auto` | `boolean` | Se deve usar a semântica de acionamento automático de uma ação de funcionário de IA. |

Campos comuns de `Task`:

| Campo | Tipo | Descrição |
|------|------|------|
| `title` | `string` | Título da tarefa. |
| `message.system` | `string` | Mensagem do sistema para limitar o papel e os requisitos de saída do funcionário de IA. |
| `message.user` | `string` | Mensagem do usuário, ou seja, a instrução principal da tarefa. |
| `message.attachments` | `Attachment[]` | Anexos usados pela tarefa, geralmente retornados por `ctx.ai.uploadFile()`. |
| `message.workContext` | `ContextItem[]` | Contexto de blocos da página usado pela tarefa. |
| `autoSend` | `boolean` | Se a mensagem da tarefa deve ser enviada automaticamente. |
| `webSearch` | `boolean` | Se esta tarefa pode usar Web search. |
| `model` | `{ llmService: string; model: string } \| null` | Modelo usado por esta tarefa. |
| `skillSettings` | `SkillSettings` | Configuração de skills / tools usada por esta tarefa. |

### Direcionar para um AI Chat Box

Defina `chatBoxUid` nas opções de nível superior de `triggerTask()` para acionar a tarefa em um bloco AI Chat Box montado, em vez de abrir o diálogo global do funcionário de IA.

```ts
ctx.ai.triggerTask({
  aiEmployee: 'nathan',
  chatBoxUid: 'AI_CHAT_BOX_BLOCK_UID',
  open: true,
  tasks: [
    {
      title: ctx.t('Review current page'),
      message: {
        user: 'Review the current page and summarize the main risks.',
      },
    },
  ],
});
```

O uid deve pertencer ao bloco AI Chat Box externo atualmente montado na página. Não coloque esse valor de roteamento dentro de `tasks`. Se o bloco de destino não for encontrado, NocoBase exibirá um erro e não retornará ao diálogo global. Quando `chatBoxUid` é omitido, a tarefa usa o diálogo global do funcionário de IA.

### Fazer upload e enviar anexos no JSBlock

O exemplo a seguir renderiza upload de arquivos, instruções da tarefa e um botão de envio no JSBlock. Os arquivos enviados são passados ao funcionário de IA por `message.attachments`:

```tsx
if (!ctx.ai?.uploadFile || !ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const { React } = ctx.libs;
const { useState } = React;
const { Button, Card, Input, Space, Upload } = ctx.libs.antd;
const { InboxOutlined, SendOutlined } = ctx.libs.antdIcons;

const AttachmentTask = () => {
  const [prompt, setPrompt] = useState('');
  const [fileList, setFileList] = useState([]);

  const uploadAttachment = async ({ file, onError, onProgress, onSuccess }) => {
    try {
      const attachment = await ctx.ai.uploadFile(file, {
        onProgress(percent) {
          onProgress?.({ percent });
        },
      });
      onSuccess?.(attachment);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(ctx.t('File upload failed')));
    }
  };

  const sendTask = () => {
    const attachments = fileList
      .filter((file) => file.status === 'done' && file.response)
      .map((file) => file.response);

    if (!prompt.trim()) {
      ctx.message.warning(ctx.t('Enter task instructions'));
      return;
    }

    ctx.ai.triggerTask({
      aiEmployee: 'viz',
      open: true,
      tasks: [
        {
          title: ctx.t('Analyze uploaded files'),
          message: {
            user: prompt.trim(),
            attachments,
          },
          autoSend: true,
        },
      ],
    });
    setPrompt('');
    setFileList([]);
  };

  const uploading = fileList.some((file) => file.status === 'uploading');

  return (
    <Card title={ctx.t('AI file analysis')}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Upload.Dragger
          multiple
          fileList={fileList}
          customRequest={uploadAttachment}
          onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p>{ctx.t('Click or drag files here to upload')}</p>
        </Upload.Dragger>
        <Input.TextArea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={ctx.t('Describe the task for the AI employee')}
          autoSize={{ minRows: 3, maxRows: 8 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          disabled={uploading || !prompt.trim()}
          onClick={sendTask}
        >
          {ctx.t('Send to AI')}
        </Button>
      </Space>
    </Card>
  );
};

ctx.render(<AttachmentTask />);
```

Com `autoSend: false`, os anexos e as instruções da tarefa são colocados no rascunho do chat de IA e não são enviados imediatamente.

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

As opções públicas de `triggerModelTask()` não aceitam `chatBoxUid`. Para direcionar a um AI Chat Box, configure `chatBoxUid` na tarefa predefinida da ação de funcionário de IA. `triggerModelTask()` continuará reutilizando esse valor predefinido.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `uid` | `string` | uid FlowModel da ação de funcionário de IA. |
| `taskIndex` | `number` | Índice da tarefa, começando em `0`. |
| `options.open` | `boolean` | Se o painel de conversa do funcionário de IA deve ser aberto. |
| `options.auto` | `boolean` | Se deve usar a semântica de acionamento automático de uma ação de funcionário de IA. |
| `options.attachments` | `Attachment[]` | Anexos adicionados dinamicamente à tarefa configurada. |

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
  attachments,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

Se o modelo de destino não existir, não tiver funcionário de IA configurado, ou o índice informado não tiver tarefa, nenhuma tarefa será acionada e um aviso será impresso no console.

## Observações

- `triggerTask()` e `triggerModelTask()` são fire-and-forget. Eles não retornam o resultado de execução da tarefa.
- `uploadFile()` retorna um Promise. Aguarde o fim do upload antes de acionar uma tarefa que use o anexo.
- Strings em `aiEmployee` correspondem apenas exatamente a `AIEmployee.username`.
- `triggerModelTask()` usa `taskIndex` começando em `0`.
- `message.workContext` atualmente descreve apenas contexto de blocos da página.
- O valor de nível superior `triggerTask().chatBoxUid` deve referenciar um bloco AI Chat Box atualmente montado na página.
- `triggerModelTask()` continua usando o `chatBoxUid` configurado na tarefa predefinida.
- Os anexos dinâmicos de `triggerModelTask()` são adicionados aos `message.attachments` existentes da tarefa predefinida sem alterar a configuração salva.

## Relacionado

- [ctx.message](./message.md): Mostra avisos leves antes e depois de acionar tarefas.
- [ctx.render](./render.md): Renderiza botões ou formulários no JSBlock.
- [ctx.model](./model.md): Obtém informações do FlowModel atual.
