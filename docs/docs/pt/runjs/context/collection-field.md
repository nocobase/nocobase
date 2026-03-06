:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/collection-field).
:::

# ctx.collectionField

A instância do campo da coleção (`CollectionField`) associada ao contexto de execução atual do RunJS, usada para acessar metadados do campo, tipos, regras de validação e informações de associação. Existe apenas quando o campo está vinculado a uma definição de coleção; campos personalizados/virtuais podem ser `null`.

## Cenários de Uso

| Cenário | Descrição |
|------|------|
| **JSField** | Realizar vinculação ou validação em campos de formulário com base em `interface`, `enum`, `targetCollection`, etc. |
| **JSItem** | Acessar metadados do campo correspondente à coluna atual em itens de sub-tabelas. |
| **JSColumn** | Selecionar métodos de renderização com base em `collectionField.interface` ou acessar `targetCollection` em colunas de tabela. |

> Nota: `ctx.collectionField` está disponível apenas quando o campo está vinculado a uma definição de Coleção; geralmente é `undefined` em cenários como blocos independentes JSBlock ou eventos de ação sem vínculo de campo. Recomenda-se verificar valores nulos antes do uso.

## Definição de Tipo

```ts
collectionField: CollectionField | null | undefined;
```

## Propriedades Comuns

| Propriedade | Tipo | Descrição |
|------|------|------|
| `name` | `string` | Nome do campo (ex: `status`, `userId`) |
| `title` | `string` | Título do campo (incluindo internacionalização) |
| `type` | `string` | Tipo de dado do campo (`string`, `integer`, `belongsTo`, etc.) |
| `interface` | `string` | Tipo de interface do campo (`input`, `select`, `m2o`, `o2m`, `m2m`, etc.) |
| `collection` | `Collection` | A coleção à qual o campo pertence |
| `targetCollection` | `Collection` | A coleção de destino do campo de associação (apenas para tipos de associação) |
| `target` | `string` | Nome da coleção de destino (para campos de associação) |
| `enum` | `array` | Opções de enumeração (select, radio, etc.) |
| `defaultValue` | `any` | Valor padrão |
| `collectionName` | `string` | Nome da coleção à qual pertence |
| `foreignKey` | `string` | Nome do campo da chave estrangeira (belongsTo, etc.) |
| `sourceKey` | `string` | Chave de origem da associação (hasMany, etc.) |
| `targetKey` | `string` | Chave de destino da associação |
| `fullpath` | `string` | Caminho completo (ex: `main.users.status`), usado para API ou referências de variáveis |
| `resourceName` | `string` | Nome do recurso (ex: `users.status`) |
| `readonly` | `boolean` | Se é apenas leitura |
| `titleable` | `boolean` | Se pode ser exibido como um título |
| `validation` | `object` | Configuração de regras de validação |
| `uiSchema` | `object` | Configuração de UI |
| `targetCollectionTitleField` | `CollectionField` | O campo de título da coleção de destino (para campos de associação) |

## Métodos Comuns

| Método | Descrição |
|------|------|
| `isAssociationField(): boolean` | Se é um campo de associação (belongsTo, hasMany, hasOne, belongsToMany, etc.) |
| `isRelationshipField(): boolean` | Se é um campo de relacionamento (incluindo o2o, m2o, o2m, m2m, etc.) |
| `getComponentProps(): object` | Obtém as props padrão do componente do campo |
| `getFields(): CollectionField[]` | Obtém a lista de campos da coleção de destino (apenas campos de associação) |
| `getFilterOperators(): object[]` | Obtém os operadores de filtro suportados por este campo (ex: `$eq`, `$ne`, etc.) |

## Exemplos

### Renderização condicional baseada no tipo de campo

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Campo de associação: exibe registros associados
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Determinar se é um campo de associação e acessar a coleção de destino

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Processar de acordo com a estrutura da coleção de destino
}
```

### Obter opções de enumeração

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Renderização condicional baseada no modo apenas leitura/visualização

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Obter o campo de título da coleção de destino

```ts
// Ao exibir um campo de associação, use targetCollectionTitleField para obter o nome do campo de título
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Relação com ctx.collection

| Necessidade | Uso Recomendado |
|------|----------|
| **Coleção do campo atual** | `ctx.collectionField?.collection` ou `ctx.collection` |
| **Metadados do campo (nome, tipo, interface, enum, etc.)** | `ctx.collectionField` |
| **Coleção de destino** | `ctx.collectionField?.targetCollection` |

`ctx.collection` geralmente representa a coleção vinculada ao bloco atual; `ctx.collectionField` representa a definição do campo atual na coleção. Em cenários como sub-tabelas ou campos de associação, os dois podem ser diferentes.

## Observações

- Em cenários como **JSBlock** ou **JSAction (sem vínculo de campo)**, `ctx.collectionField` geralmente é `undefined`. Recomenda-se usar encadeamento opcional (optional chaining) antes do acesso.
- Se um campo JS personalizado não estiver vinculado a um campo de coleção, `ctx.collectionField` pode ser `null`.
- `targetCollection` existe apenas para campos do tipo associação (ex: m2o, o2m, m2m); `enum` existe apenas para campos com opções como select ou radioGroup.

## Relacionado

- [ctx.collection](./collection.md): Coleção associada ao contexto atual
- [ctx.model](./model.md): Modelo onde o contexto de execução atual está localizado
- [ctx.blockModel](./block-model.md): Bloco pai que contém o JS atual
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Ler e escrever o valor do campo atual