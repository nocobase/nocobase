:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/notification).
:::

# ctx.notification

Baseada na API de notificação do Ant Design, esta API global de notificação é usada para exibir painéis de notificação no **canto superior direito** da página. Comparada ao `ctx.message`, as notificações podem incluir um título e uma descrição, tornando-as adequadas para conteúdos que precisam ser exibidos por um período mais longo ou que exigem a atenção do usuário.

## Cenários de Uso

| Cenário | Descrição |
|------|------|
| **JSBlock / Eventos de Ação** | Notificações de conclusão de tarefa, resultados de operações em lote, conclusão de exportação, etc. |
| **Fluxo de Trabalho (FlowEngine)** | Alertas de nível de sistema após o término de processos assíncronos. |
| **Conteúdo que requer exibição prolongada** | Notificações completas com títulos, descrições e botões de ação. |

## Definição de Tipo

```ts
notification: NotificationInstance;
```

`NotificationInstance` é a interface de notificação do Ant Design, que fornece os seguintes métodos.

## Métodos Comuns

| Método | Descrição |
|------|------|
| `open(config)` | Abre uma notificação com configuração personalizada |
| `success(config)` | Exibe uma notificação do tipo sucesso |
| `info(config)` | Exibe uma notificação do tipo informação |
| `warning(config)` | Exibe uma notificação do tipo aviso |
| `error(config)` | Exibe uma notificação do tipo erro |
| `destroy(key?)` | Fecha a notificação com a chave (`key`) especificada; se nenhuma chave for fornecida, fecha todas as notificações |

**Parâmetros de Configuração** (Consistentes com o [Ant Design notification](https://ant.design/components/notification)):

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `message` | `ReactNode` | Título da notificação |
| `description` | `ReactNode` | Descrição da notificação |
| `duration` | `number` | Atraso para fechamento automático (segundos). O padrão é 4,5 segundos; defina como 0 para desativar o fechamento automático |
| `key` | `string` | Identificador único da notificação, usado em `destroy(key)` para fechar uma notificação específica |
| `onClose` | `() => void` | Função de retorno (callback) acionada quando a notificação é fechada |
| `placement` | `string` | Posição: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Exemplos

### Uso Básico

```ts
ctx.notification.open({
  message: 'Operação bem-sucedida',
  description: 'Os dados foram salvos no servidor.',
});
```

### Chamadas Rápidas por Tipo

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### Duração e Chave Personalizadas

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // Não fecha automaticamente
});

// Fechar manualmente após a conclusão da tarefa
ctx.notification.destroy('task-123');
```

### Fechar Todas as Notificações

```ts
ctx.notification.destroy();
```

## Diferença em relação ao ctx.message

| Característica | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Posição** | Centro superior da página | Canto superior direito (configurável) |
| **Estrutura** | Dica leve de linha única | Inclui título + descrição |
| **Objetivo** | Feedback temporário, desaparece automaticamente | Notificação completa, pode ser exibida por um longo tempo |
| **Cenários Típicos** | Sucesso da operação, falha de validação, sucesso de cópia | Conclusão de tarefa, mensagens do sistema, conteúdo longo que requer atenção |

## Relacionados

- [ctx.message](./message.md) - Dica leve no topo, adequada para feedback rápido
- [ctx.modal](./modal.md) - Confirmação em modal, interação bloqueante
- [ctx.t()](./t.md) - Internacionalização, frequentemente usada em conjunto com notificações