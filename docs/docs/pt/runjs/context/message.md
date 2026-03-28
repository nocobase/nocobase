:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/message).
:::

# ctx.message

API global de mensagens do Ant Design, usada para exibir alertas leves e temporários no centro superior da página. As mensagens fecham automaticamente após um certo tempo ou podem ser fechadas manualmente pelo usuário.

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Feedback de operação, avisos de validação, sucesso ao copiar e outros alertas leves |
| **Operações de formulário / Fluxo de trabalho** | Feedback para sucesso no envio, falha ao salvar, erro de validação, etc. |
| **Eventos de ação (JSAction)** | Feedback imediato para cliques, conclusão de operações em lote, etc. |

## Definição de tipo

```ts
message: MessageInstance;
```

`MessageInstance` é a interface de mensagem do Ant Design, fornecendo os seguintes métodos.

## Métodos comuns

| Método | Descrição |
|------|------|
| `success(content, duration?)` | Exibe um alerta de sucesso |
| `error(content, duration?)` | Exibe um alerta de erro |
| `warning(content, duration?)` | Exibe um alerta de aviso |
| `info(content, duration?)` | Exibe um alerta informativo |
| `loading(content, duration?)` | Exibe um alerta de carregamento (deve ser fechado manualmente) |
| `open(config)` | Abre uma mensagem usando configuração personalizada |
| `destroy()` | Fecha todas as mensagens exibidas no momento |

**Parâmetros:**

- `content` (`string` \| `ConfigOptions`): Conteúdo da mensagem ou objeto de configuração
- `duration` (`number`, opcional): Atraso para fechamento automático (segundos), o padrão é 3 segundos; defina como 0 para não fechar automaticamente

**ConfigOptions** (quando `content` é um objeto):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Conteúdo da mensagem
  duration?: number;        // Atraso para fechamento automático (segundos)
  onClose?: () => void;    // Callback ao fechar
  icon?: React.ReactNode;  // Ícone personalizado
}
```

## Exemplos

### Uso básico

```ts
ctx.message.success('Operação bem-sucedida');
ctx.message.error('Falha na operação');
ctx.message.warning('Selecione os dados primeiro');
ctx.message.info('Processando...');
```

### Internacionalização com ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Loading e fechamento manual

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Executa operação assíncrona
await saveData();
hide();  // Fecha o loading manualmente
ctx.message.success(ctx.t('Saved'));
```

### Uso do open com configuração personalizada

```ts
ctx.message.open({
  type: 'success',
  content: 'Alerta de sucesso personalizado',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### Fechar todas as mensagens

```ts
ctx.message.destroy();
```

## Diferença entre ctx.message e ctx.notification

| Característica | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Posição** | Centro superior da página | Canto superior direito |
| **Finalidade** | Alerta leve temporário, desaparece automaticamente | Painel de notificação, pode conter título e descrição, adequado para exibição prolongada |
| **Cenários típicos** | Feedback de operação, avisos de validação, sucesso ao copiar | Notificações de conclusão de tarefa, mensagens do sistema, conteúdos longos que exigem atenção do usuário |

## Relacionado

- [ctx.notification](./notification.md) - Notificações no canto superior direito, adequadas para durações maiores
- [ctx.modal](./modal.md) - Confirmação em modal, interação bloqueante
- [ctx.t()](./t.md) - Internacionalização, comumente usada com message