:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/collection).
:::

# ctx.collection

A instância da coleção (Collection) associada ao contexto de execução atual do RunJS, usada para acessar metadados da coleção, definições de campos, chaves primárias e outras configurações. Geralmente originada de `ctx.blockModel.collection` ou `ctx.collectionField?.collection`.

## Casos de Uso

| Cenário | Descrição |
|------|------|
| **JSBlock** | A coleção vinculada ao bloco; pode acessar `name`, `getFields`, `filterTargetKey`, etc. |
| **JSField / JSItem / JSColumn** | A coleção à qual o campo atual pertence (ou a coleção do bloco pai), usada para recuperar listas de campos, chaves primárias, etc. |
| **Coluna de Tabela / Bloco de Detalhes** | Usada para renderização baseada na estrutura da coleção ou para passar o `filterByTk` ao abrir popups. |

> Nota: `ctx.collection` está disponível em cenários onde um bloco de dados, bloco de formulário ou bloco de tabela está vinculado a uma coleção. Em um JSBlock independente que não esteja vinculado a uma coleção, ele pode ser `null`. Recomenda-se realizar uma verificação de valor nulo antes do uso.

## Definição de Tipo

```ts
collection: Collection | null | undefined;
```

## Propriedades Comuns

| Propriedade | Tipo | Descrição |
|------|------|------|
| `name` | `string` | Nome da coleção (ex: `users`, `orders`) |
| `title` | `string` | Título da coleção (inclui internacionalização) |
| `filterTargetKey` | `string \| string[]` | Nome do campo da chave primária, usado para `filterByTk` e `getFilterByTK` |
| `dataSourceKey` | `string` | Chave da fonte de dados (ex: `main`) |
| `dataSource` | `DataSource` | A instância da fonte de dados à qual pertence |
| `template` | `string` | Template da coleção (ex: `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Lista de campos que podem ser exibidos como títulos |
| `titleCollectionField` | `CollectionField` | A instância do campo de título |

## Métodos Comuns

| Método | Descrição |
|------|------|
| `getFields(): CollectionField[]` | Obtém todos os campos (incluindo os herdados) |
| `getField(name: string): CollectionField \| undefined` | Obtém um único campo pelo nome do campo |
| `getFieldByPath(path: string): CollectionField \| undefined` | Obtém um campo pelo caminho (suporta associações, ex: `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Obtém campos de associação; `types` pode ser `['one']`, `['many']`, etc. |
| `getFilterByTK(record): any` | Extrai o valor da chave primária de um registro, usado para o `filterByTk` da API |

## Relação com ctx.collectionField e ctx.blockModel

| Necessidade | Uso Recomendado |
|------|----------|
| **Coleção associada ao contexto atual** | `ctx.collection` (equivalente a `ctx.blockModel?.collection` ou `ctx.collectionField?.collection`) |
| **Definição de coleção do campo atual** | `ctx.collectionField?.collection` (a coleção à qual o campo pertence) |
| **Coleção de destino da associação** | `ctx.collectionField?.targetCollection` (a coleção de destino de um campo de associação) |

Em cenários como sub-tabelas, `ctx.collection` pode ser a coleção de destino da associação; em formulários/tabelas padrão, geralmente é a coleção vinculada ao bloco.

## Exemplos

### Obter Chave Primária e Abrir Popup

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Iterar pelos Campos para Validação ou Vinculação (Linkage)

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} é obrigatório`);
    return;
  }
}
```

### Obter Campos de Associação

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Usado para construir sub-tabelas, recursos associados, etc.
```

## Observações

- `filterTargetKey` é o nome do campo da chave primária da coleção. Algumas coleções podem usar um `string[]` para chaves primárias compostas. Se não estiver configurado, `'id'` é comumente usado como fallback.
- Em cenários como **sub-tabelas ou campos de associação**, `ctx.collection` pode apontar para a coleção de destino da associação, o que difere de `ctx.blockModel.collection`.
- `getFields()` mescla campos de coleções herdadas; campos locais sobrescrevem campos herdados com o mesmo nome.

## Relacionados

- [ctx.collectionField](./collection-field.md): A definição do campo de coleção do campo atual
- [ctx.blockModel](./block-model.md): O bloco pai que hospeda o JS atual, contendo `collection`
- [ctx.model](./model.md): O modelo atual, que pode conter `collection`