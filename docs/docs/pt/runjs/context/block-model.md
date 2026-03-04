:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/block-model).
:::

# ctx.blockModel

O modelo do bloco pai (instância de `BlockModel`) onde o campo JS / bloco JS atual está localizado. Em cenários como `JSField`, `JSItem` e `JSColumn`, `ctx.blockModel` aponta para o bloco de formulário ou bloco de tabela que contém a lógica JS atual. Em um `JSBlock` independente, ele pode ser `null` ou o mesmo que `ctx.model`.

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **JSField** | Acessa o `form`, a `coleção` e o `recurso` do bloco de formulário pai dentro de um campo de formulário para implementar vinculação ou validação. |
| **JSItem** | Acessa as informações de recurso e coleção do bloco de tabela/formulário pai dentro de um item de subtabela. |
| **JSColumn** | Acessa o `resource` (ex: `getSelectedRows`) e a `coleção` do bloco de tabela pai dentro de uma coluna de tabela. |
| **Ações de Formulário / Fluxo de Eventos** | Acessa o `form` para validação pré-envio, o `resource` para atualização, etc. |

> Nota: `ctx.blockModel` está disponível apenas em contextos RunJS onde existe um bloco pai. Em JSBlocks independentes (sem um formulário/tabela pai), ele pode ser `null`. Recomenda-se realizar uma verificação de valor nulo antes do uso.

## Definição de Tipo

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

O tipo específico depende do tipo do bloco pai: blocos de formulário são geralmente `FormBlockModel` ou `EditFormModel`, enquanto blocos de tabela são geralmente `TableBlockModel`.

## Propriedades Comuns

| Propriedade | Tipo | Descrição |
|------|------|------|
| `uid` | `string` | Identificador único do modelo de bloco. |
| `collection` | `Collection` | A coleção vinculada ao bloco atual. |
| `resource` | `Resource` | A instância de recurso usada pelo bloco (`SingleRecordResource` / `MultiRecordResource`, etc.). |
| `form` | `FormInstance` | Bloco de Formulário: Instância de formulário do Ant Design, suportando `getFieldsValue`, `validateFields`, `setFieldsValue`, etc. |
| `emitter` | `EventEmitter` | Emissor de eventos, usado para ouvir `formValuesChange`, `onFieldReset`, etc. |

## Relação com ctx.model e ctx.form

| Necessidade | Uso Recomendado |
|------|----------|
| **Bloco pai do JS atual** | `ctx.blockModel` |
| **Ler/escrever campos de formulário** | `ctx.form` (equivalente a `ctx.blockModel?.form`, mais conveniente em blocos de formulário) |
| **Modelo do contexto de execução atual** | `ctx.model` (Modelo de campo em JSField, modelo de bloco em JSBlock) |

Em um `JSField`, `ctx.model` é o modelo do campo, e `ctx.blockModel` é o bloco de formulário ou tabela que contém esse campo; `ctx.form` é tipicamente `ctx.blockModel.form`.

## Exemplos

### Tabela: Obter linhas selecionadas e processar

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Por favor, selecione os dados primeiro');
  return;
}
```

### Cenário de Formulário: Validar e Atualizar

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Ouvir mudanças no formulário

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Implementar vinculação ou re-renderização com base nos valores mais recentes do formulário
});
```

### Acionar a re-renderização do bloco

```ts
ctx.blockModel?.rerender?.();
```

## Observações

- Em um **JSBlock independente** (sem um bloco de formulário ou tabela pai), `ctx.blockModel` pode ser `null`. Recomenda-se usar o encadeamento opcional (optional chaining) ao acessar suas propriedades: `ctx.blockModel?.resource?.refresh?.()`.
- Em **JSField / JSItem / JSColumn**, `ctx.blockModel` refere-se ao bloco de formulário ou tabela que contém o campo atual. Em um **JSBlock**, ele pode ser o próprio bloco ou um bloco de nível superior, dependendo da hierarquia real.
- `resource` existe apenas em blocos de dados; `form` existe apenas em blocos de formulário. Blocos de tabela geralmente não possuem um `form`.

## Relacionado

- [ctx.model](./model.md): O modelo do contexto de execução atual.
- [ctx.form](./form.md): Instância de formulário, comumente usada em blocos de formulário.
- [ctx.resource](./resource.md): Instância de recurso (equivalente a `ctx.blockModel?.resource`, use diretamente se disponível).
- [ctx.getModel()](./get-model.md): Obter outros modelos de bloco por UID.