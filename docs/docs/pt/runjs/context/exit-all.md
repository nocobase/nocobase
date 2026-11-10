# ctx.exitAll()

Encerra o fluxo de eventos atual e todos os fluxos de eventos subsequentes disparados no mesmo despacho de evento. É comumente usado quando todos os fluxos de eventos sob o evento atual precisam ser abortados imediatamente devido a um erro global ou falha na validação de permissão.

## Cenários de uso

O `ctx.exitAll()` é geralmente usado em contextos onde o JS é executável e quando é necessário **interromper simultaneamente o fluxo de eventos atual e os fluxos de eventos subsequentes disparados por esse evento**:

| Cenário | Descrição |
|------|------|
| **Fluxo de eventos** | A validação do fluxo de eventos principal falha (ex: permissões insuficientes), exigindo a interrupção do fluxo principal e de quaisquer fluxos subsequentes sob o mesmo evento que ainda não foram executados. |
| **Regras de vinculação** | Quando a validação de vinculação falha, a vinculação atual e as vinculações subsequentes disparadas pelo mesmo evento devem ser encerradas. |
| **Eventos de ação** | A validação pré-ação falha (ex: verificação de permissão antes da exclusão), exigindo o impedimento da ação principal e das etapas subsequentes. |

> `ctx.exit()` / `ctx.exitAll()` — As duas chamadas encerram a etapa atual e pulam os fluxos sequenciais restantes do mesmo evento. Os fluxos que já estão em execução paralela continuam.

## Definição de Tipo

```ts
exitAll(): never;
```

Chamar `ctx.exitAll()` lança uma exceção interna `FlowExitAllException`, que é capturada pelo motor de fluxo para parar a instância do fluxo de eventos atual e os fluxos de eventos subsequentes sob o mesmo evento. Uma vez chamado, as instruções restantes no código JS atual não serão executadas.

## Explicação do Modo de Execução

- **Execução sequencial (sequential)**: Os fluxos de eventos sob o mesmo evento são executados em ordem. Após qualquer fluxo de eventos chamar `ctx.exitAll()`, os fluxos de eventos subsequentes não serão executados.
- **Execução paralela (parallel)**: Os fluxos de eventos sob o mesmo evento são executados em paralelo. Chamar `ctx.exitAll()` em um fluxo de eventos não interromperá outros fluxos de eventos concorrentes (pois são independentes).

## Exemplos

### Encerrar todos os fluxos de eventos quando a validação de permissão falhar

```ts
// Interrompe o fluxo de eventos principal e os fluxos subsequentes quando as permissões são insuficientes
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'Sem permissão de operação' });
  ctx.exitAll();
}
```

### Encerrar quando a pré-validação global falhar

```ts
// Exemplo: Se dados associados forem encontrados e não puderem ser excluídos, impede o fluxo principal e ações subsequentes
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Não é possível excluir: existem dados associados');
  ctx.exitAll();
}
```

### Exibir mensagem antes de encerrar

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Por favor, corrija os erros no formulário primeiro');
  ctx.exitAll();
}
```

## Notas

- Após chamar `ctx.exitAll()`, o código subsequente no JS atual não será executado. Recomenda-se explicar o motivo ao usuário via `ctx.message`, `ctx.notification` ou um modal antes de chamá-lo.
- O código de negócio geralmente não precisa capturar `FlowExitAllException`; deixe o motor de fluxo lidar com isso.
- No modo paralelo, o `ctx.exitAll()` encerra apenas o fluxo de eventos atual e não interrompe outros fluxos de eventos concorrentes.

## Relacionado

- [ctx.exit()](./exit.md)
- [ctx.message](./message.md): Mensagens de alerta
- [ctx.modal](./modal.md): Modal de confirmação
