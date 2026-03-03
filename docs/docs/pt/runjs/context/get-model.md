:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/get-model).
:::

# ctx.getModel()

Obtém uma instância de modelo (como `BlockModel`, `PageModel`, `ActionModel`, etc.) do motor atual ou da pilha de visualização com base no `uid` do modelo. Isso é usado no RunJS para acessar outros modelos entre blocos, páginas ou popups.

Se você precisar apenas do modelo ou bloco onde o contexto de execução atual está localizado, priorize o uso de `ctx.model` ou `ctx.blockModel` em vez de `ctx.getModel`.

## Cenários de Uso

| Cenário | Descrição |
|------|------|
| **JSBlock / JSAction** | Obter modelos de outros blocos com base em um `uid` conhecido para ler ou gravar em seu `resource`, `form`, `setProps`, etc. |
| **RunJS em Popups** | Quando for necessário acessar um modelo na página que abriu o popup, passe `searchInPreviousEngines: true`. |
| **Ações Personalizadas** | Localizar formulários ou submodelos no painel de configuração por `uid` através das pilhas de visualização para ler sua configuração ou estado. |

## Definição de Tipo

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `uid` | `string` | O identificador único da instância do modelo de destino, especificado durante a configuração ou criação (ex: `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | Opcional, o padrão é `false`. Quando `true`, pesquisa do motor atual até a raiz na "pilha de visualização", permitindo o acesso a modelos em motores de nível superior (ex: a página que abriu um popup). |

## Valor de Retorno

- Retorna a instância da subclasse `FlowModel` correspondente (ex: `BlockModel`, `FormBlockModel`, `ActionModel`) se encontrada.
- Retorna `undefined` se não for encontrada.

## Escopo de Pesquisa

- **Padrão (`searchInPreviousEngines: false`)**: Pesquisa apenas dentro do **motor atual** por `uid`. Em popups ou visualizações de vários níveis, cada visualização tem um motor independente; por padrão, ele pesquisa apenas modelos dentro da visualização atual.
- **`searchInPreviousEngines: true`**: Pesquisa para cima ao longo da cadeia `previousEngine` começando pelo motor atual, retornando a primeira correspondência. Isso é útil para acessar um modelo na página que abriu o popup atual.

## Exemplos

### Obter outro bloco e atualizar

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Acessar um modelo na página a partir de um popup

```ts
// Acessar um bloco na página que abriu o popup atual
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Leitura/escrita entre modelos e acionamento de rerender

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Verificação de segurança

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('O modelo de destino não existe');
  return;
}
```

## Relacionados

- [ctx.model](./model.md): O modelo onde o contexto de execução atual está localizado.
- [ctx.blockModel](./block-model.md): O modelo do bloco pai onde o JS atual está localizado; geralmente acessível sem a necessidade de `getModel`.