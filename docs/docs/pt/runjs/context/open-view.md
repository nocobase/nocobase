:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/open-view).
:::

# ctx.openView()

Abre programaticamente uma visualização especificada (gaveta, diálogo, página incorporada, etc.). Fornecido pelo `FlowModelContext`, é usado para abrir visualizações `ChildPage` ou `PopupAction` configuradas em cenários como `JSBlock`, células de tabela e fluxos de trabalho.

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **JSBlock** | Abre um diálogo de detalhe/edição após o clique em um botão, passando o `filterByTk` da linha atual. |
| **Célula de tabela** | Renderiza um botão dentro de uma célula que abre um diálogo de detalhes da linha ao ser clicado. |
| **Fluxo de trabalho / JSAction** | Abre a próxima visualização ou um diálogo após uma operação bem-sucedida. |
| **Campo de associação** | Abre um diálogo de seleção/edição via `ctx.runAction('openView', params)`. |

> Nota: `ctx.openView` está disponível em um ambiente RunJS onde existe um contexto `FlowModel`. Se o modelo correspondente ao `uid` não existir, um `PopupActionModel` será criado automaticamente e persistido.

## Assinatura

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Descrição dos parâmetros

### uid

O identificador único do modelo de visualização. Se não existir, será criado e salvo automaticamente. Recomenda-se usar um UID estável, como `${ctx.model.uid}-detail`, para que a configuração possa ser reutilizada ao abrir o mesmo diálogo várias vezes.

### Campos comuns de options

| Campo | Tipo | Descrição |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Modo de abertura: gaveta (drawer), diálogo (dialog) ou incorporado (embed). O padrão é `drawer`. |
| `size` | `small` / `medium` / `large` | Tamanho do diálogo ou gaveta. O padrão é `medium`. |
| `title` | `string` | Título da visualização. |
| `params` | `Record<string, any>` | Parâmetros arbitrários passados para a visualização. |
| `filterByTk` | `any` | Valor da chave primária, usado para cenários de detalhe/edição de um único registro. |
| `sourceId` | `string` | ID do registro de origem, usado em cenários de associação. |
| `dataSourceKey` | `string` | Fonte de dados. |
| `collectionName` | `string` | Nome da coleção. |
| `associationName` | `string` | Nome do campo de associação. |
| `navigation` | `boolean` | Se deve usar navegação por rota. Se `defineProperties` ou `defineMethods` forem fornecidos, isso é forçado para `false`. |
| `preventClose` | `boolean` | Se deve impedir o fechamento. |
| `defineProperties` | `Record<string, PropertyOptions>` | Injeta propriedades dinamicamente no modelo dentro da visualização. |
| `defineMethods` | `Record<string, Function>` | Injeta métodos dinamicamente no modelo dentro da visualização. |

## Exemplos

### Uso básico: Abrir uma gaveta (drawer)

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Detalhes'),
});
```

### Passando o contexto da linha atual

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Detalhes da Linha'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Abrir via runAction

Quando um modelo está configurado com uma ação `openView` (como campos de associação ou campos clicáveis), você pode chamar:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Injetando contexto personalizado

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## Relação com ctx.viewer e ctx.view

| Finalidade | Uso recomendado |
|------|----------|
| **Abrir uma visualização de fluxo configurada** | `ctx.openView(uid, options)` |
| **Abrir conteúdo personalizado (sem fluxo)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Operar na visualização aberta no momento** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` abre uma `FlowPage` (`ChildPageModel`), que renderiza uma página de fluxo completa internamente; `ctx.viewer` abre qualquer conteúdo React.

## Observações

- Recomenda-se associar o `uid` ao `ctx.model.uid` (ex: `${ctx.model.uid}-xxx`) para evitar conflitos entre múltiplos blocos.
- Quando `defineProperties` ou `defineMethods` são passados, `navigation` é forçado para `false` para evitar a perda de contexto após uma atualização.
- Dentro do diálogo, `ctx.view` refere-se à instância da visualização atual, e `ctx.view.inputArgs` pode ser usado para ler os parâmetros passados durante a abertura.

## Relacionado

- [ctx.view](./view.md): A instância da visualização aberta no momento.
- [ctx.model](./model.md): O modelo atual, usado para construir um `popupUid` estável.