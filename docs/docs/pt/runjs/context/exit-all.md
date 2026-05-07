:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/exit-all).
:::

# ctx.exitAll()

Encerra o fluxo de eventos atual e todos os fluxos de eventos subsequentes disparados no mesmo despacho de evento. É comumente usado quando todos os fluxos de eventos sob o evento atual precisam ser abortados imediatamente devido a um erro global ou falha na validação de permissão.

## Cenários de uso

O `ctx.exitAll()` é geralmente usado em contextos onde o JS é executável e quando é necessário **interromper simultaneamente o fluxo de eventos atual e os fluxos de eventos subsequentes disparados por esse evento**:

| Cenário | Descrição |
|------|------|
| **Fluxo de eventos** | A validação do fluxo de eventos principal falha (ex: permissões insuficientes), exigindo a interrupção do fluxo principal e de quaisquer fluxos subsequentes sob o mesmo evento que ainda não foram executados. |
| **Regras de vinculação** | Quando a validação de vinculação falha, a vinculação atual e as vinculações subsequentes disparadas pelo mesmo evento devem ser encerradas. |
| **Eventos de ação** | A validação pré-ação falha (ex: verificação de permissão antes da exclusão), exigindo o impedimento da ação principal e das etapas subsequentes. |

> Diferença do `ctx.exit()`: O `ctx.exit()` encerra apenas o fluxo de eventos atual; o `ctx.exitAll()` encerra o fluxo de eventos atual e quaisquer fluxos de eventos subsequentes **não executados** no mesmo despacho de evento.

## Definição de Tipo

```ts
exitAll(): never;
```

Chamar `ctx.exitAll()` lança uma exceção interna `FlowExitAllException`, que é capturada pelo motor de fluxo para parar a instância do fluxo de eventos atual e os fluxos de eventos subsequentes sob o mesmo evento. Uma vez chamado, as instruções restantes no código JS atual não serão executadas.

## Comparação com ctx.exit()

| Método | Escopo de atuação |
|------|----------|
| `ctx.exit()` | Encerra apenas o fluxo de eventos atual; os fluxos de eventos subsequentes não são afetados. |
| `ctx.exitAll()` | Encerra o fluxo de eventos atual e interrompe os fluxos de eventos subsequentes executados **sequencialmente** sob o mesmo evento. |

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

### Escolhendo entre ctx.exit() e ctx.exitAll()

```ts
// Apenas o fluxo de eventos atual precisa sair -> Use ctx.exit()
if (!params.valid) {
  ctx.message.error('Parâmetros inválidos');
  ctx.exit();  // Fluxos de eventos subsequentes não são afetados
}

// Necessário encerrar todos os fluxos de eventos subsequentes sob o evento atual -> Use ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Permissões insuficientes' });
  ctx.exitAll();  // Tanto o fluxo de eventos principal quanto os subsequentes sob o mesmo evento são encerrados
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
- Se você precisar apenas parar o fluxo de eventos atual sem afetar os subsequentes, use `ctx.exit()`.
- No modo paralelo, o `ctx.exitAll()` encerra apenas o fluxo de eventos atual e não interrompe outros fluxos de eventos concorrentes.

## Relacionado

- [ctx.exit()](./exit.md): Encerra apenas o fluxo de eventos atual
- [ctx.message](./message.md): Mensagens de alerta
- [ctx.modal](./modal.md): Modal de confirmação