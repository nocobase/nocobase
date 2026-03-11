:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/modal).
:::

# ctx.modal

Uma API de atalho baseada no Ant Design Modal, usada para abrir ativamente caixas modais (avisos de informação, pop-ups de confirmação, etc.) no RunJS. É implementada pelo `ctx.viewer` / sistema de visualização.

## Casos de Uso

| Cenário | Descrição |
|------|------|
| **JSBlock / JSField** | Exibir resultados de operações, avisos de erro ou confirmações secundárias após a interação do usuário. |
| **Fluxo de trabalho / Eventos de ação** | Confirmação em pop-up antes do envio; encerra as etapas subsequentes via `ctx.exit()` se o usuário cancelar. |
| **Regras de ligação** | Avisos em pop-up para o usuário quando a validação falha. |

> Nota: `ctx.modal` está disponível em ambientes RunJS com um contexto de visualização (como JSBlocks dentro de uma página, fluxos de trabalho, etc.); pode não existir no backend ou em contextos sem interface de usuário (UI). Recomenda-se usar o encadeamento opcional (`ctx.modal?.confirm?.()`) ao chamá-lo.

## Definição de Tipo

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Retorna true se o usuário clicar em OK, false se cancelar
};
```

`ModalConfig` é consistente com a configuração dos métodos estáticos do `Modal` do Ant Design.

## Métodos Comuns

| Método | Valor de Retorno | Descrição |
|------|--------|------|
| `info(config)` | `Promise<void>` | Modal de aviso de informação |
| `success(config)` | `Promise<void>` | Modal de aviso de sucesso |
| `error(config)` | `Promise<void>` | Modal de aviso de erro |
| `warning(config)` | `Promise<void>` | Modal de aviso de atenção |
| `confirm(config)` | `Promise<boolean>` | Modal de confirmação; retorna `true` se o usuário clicar em OK, e `false` se cancelar |

## Parâmetros de Configuração

Consistente com o `Modal` do Ant Design, os campos comuns incluem:

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `title` | `ReactNode` | Título |
| `content` | `ReactNode` | Conteúdo |
| `okText` | `string` | Texto do botão OK |
| `cancelText` | `string` | Texto do botão Cancelar (apenas para `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Executado ao clicar em OK |
| `onCancel` | `() => void` | Executado ao clicar em Cancelar |

## Relação com ctx.message e ctx.openView

| Finalidade | Uso Recomendado |
|------|----------|
| **Aviso temporário leve** | `ctx.message`, desaparece automaticamente |
| **Modal de Info/Sucesso/Erro/Aviso** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Confirmação secundária (requer escolha do usuário)** | `ctx.modal.confirm`, usado com `ctx.exit()` para controlar o fluxo |
| **Interações complexas como formulários ou listas** | `ctx.openView` para abrir uma visualização personalizada (página/gaveta/modal) |

## Exemplos

### Modal de Informação Simples

```ts
ctx.modal.info({
  title: 'Aviso',
  content: 'Operação concluída',
});
```

### Modal de Confirmação e Controle de Fluxo

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Confirmar Exclusão',
  content: 'Tem certeza de que deseja excluir este registro?',
  okText: 'Confirmar',
  cancelText: 'Cancelar',
});
if (!confirmed) {
  ctx.exit();  // Encerra as etapas subsequentes se o usuário cancelar
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Modal de Confirmação com onOk

```ts
await ctx.modal.confirm({
  title: 'Confirmar Envio',
  content: 'As alterações não poderão ser modificadas após o envio. Deseja continuar?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Aviso de Erro

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Sucesso', content: 'Operação concluída' });
} catch (e) {
  ctx.modal.error({ title: 'Erro', content: e.message });
}
```

## Relacionado

- [ctx.message](./message.md): Aviso temporário leve, desaparece automaticamente
- [ctx.exit()](./exit.md): Comumente usado como `if (!confirmed) ctx.exit()` para encerrar o fluxo quando um usuário cancela a confirmação
- [ctx.openView()](./open-view.md): Abre uma visualização personalizada, adequado para interações complexas