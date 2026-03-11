:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/exit).
:::

# ctx.exit()

Encerra a execução do fluxo de eventos atual; as etapas subsequentes não serão executadas. É comumente usado quando as condições de negócio não são atendidas, o usuário cancela ou ocorre um erro irrecuperável.

## Cenários de uso

O `ctx.exit()` é geralmente usado nos seguintes contextos onde o JS pode ser executado:

| Cenário | Descrição |
|------|------|
| **Fluxo de eventos** | Em fluxos de eventos acionados por envios de formulários, cliques em botões, etc., interrompe as etapas subsequentes quando as condições não são atendidas. |
| **Regras de vinculação** | Em vinculações de campos, vinculações de filtros, etc., encerra o fluxo de eventos atual quando a validação falha ou quando a execução precisa ser pulada. |
| **Eventos de ação** | Em ações personalizadas (ex: confirmação de exclusão, validação pré-salvamento), sai quando o usuário cancela ou a validação não passa. |

> Diferença em relação ao `ctx.exitAll()`: o `ctx.exit()` encerra apenas o fluxo de eventos atual; outros fluxos de eventos sob o mesmo evento não são afetados. O `ctx.exitAll()` encerra o fluxo de eventos atual, bem como quaisquer fluxos de eventos subsequentes sob o mesmo evento que ainda não foram executados.

## Definição de tipo

```ts
exit(): never;
```

Chamar `ctx.exit()` lança uma exceção interna `FlowExitException`, que é capturada pelo mecanismo de fluxo (FlowEngine) para interromper a execução do fluxo de eventos atual. Uma vez chamado, as instruções restantes no código JS atual não serão executadas.

## Comparação com ctx.exitAll()

| Método | Escopo de efeito |
|------|----------|
| `ctx.exit()` | Encerra apenas o fluxo de eventos atual; os fluxos de eventos subsequentes não são afetados. |
| `ctx.exitAll()` | Encerra o fluxo de eventos atual e interrompe os fluxos de eventos subsequentes sob o mesmo evento que estão configurados para **execução sequencial**. |

## Exemplos

### Sair ao cancelar o usuário

```ts
// Em um modal de confirmação, encerra o fluxo de eventos se o usuário clicar em cancelar
if (!confirmed) {
  ctx.message.info('Operação cancelada');
  ctx.exit();
}
```

### Sair em caso de falha na validação de parâmetros

```ts
// Exibe um alerta e encerra quando a validação falha
if (!params.value || params.value.length < 3) {
  ctx.message.error('Parâmetros inválidos, o comprimento deve ser de pelo menos 3');
  ctx.exit();
}
```

### Sair quando as condições de negócio não são atendidas

```ts
// Encerra se as condições não forem atendidas; as etapas subsequentes não serão executadas
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Apenas rascunhos podem ser enviados' });
  ctx.exit();
}
```

### Escolhendo entre ctx.exit() e ctx.exitAll()

```ts
// Apenas o fluxo de eventos atual precisa sair → Use ctx.exit()
if (!params.valid) {
  ctx.message.error('Parâmetros inválidos');
  ctx.exit();  // Outros fluxos de eventos não são afetados
}

// Necessário encerrar todos os fluxos de eventos subsequentes sob o evento atual → Use ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Permissões insuficientes' });
  ctx.exitAll();  // Tanto o fluxo de eventos atual quanto os subsequentes sob o mesmo evento são encerrados
}
```

### Sair com base na escolha do usuário após confirmação em modal

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Confirmar exclusão',
  content: 'Esta ação não pode ser desfeita. Deseja continuar?',
});
if (!ok) {
  ctx.message.info('Cancelado');
  ctx.exit();
}
```

## Observações

- Após chamar `ctx.exit()`, o código subsequente no JS atual não será executado; recomenda-se explicar o motivo ao usuário via `ctx.message`, `ctx.notification` ou um modal antes de chamá-lo.
- Geralmente não há necessidade de capturar `FlowExitException` no código de negócio; deixe que o mecanismo de fluxo o manipule.
- Se você precisar encerrar todos os fluxos de eventos subsequentes sob o evento atual, use `ctx.exitAll()`.

## Relacionado

- [ctx.exitAll()](./exit-all.md): Encerra o fluxo de eventos atual e os fluxos de eventos subsequentes sob o mesmo evento.
- [ctx.message](./message.md): Mensagens de alerta.
- [ctx.modal](./modal.md): Modais de confirmação.