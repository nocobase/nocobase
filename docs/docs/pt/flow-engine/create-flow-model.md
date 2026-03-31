:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Criação de FlowModel

## Como um Nó Raiz

### Construir uma Instância de FlowModel

Construa uma instância localmente

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Salvar FlowModel

Se uma instância construída precisar ser persistida, você pode salvá-la usando o método `save`.

```ts
await model.save();
```

### Carregar FlowModel de um Repositório Remoto

Um modelo salvo pode ser carregado usando `loadModel`. Este método carregará toda a árvore do modelo (incluindo nós filhos):

```ts
await engine.loadModel(uid);
```

### Carregar ou Criar FlowModel

Se o modelo existir, ele será carregado; caso contrário, será criado e salvo.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Renderizar FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Como um Nó Filho

Quando você precisa gerenciar as propriedades e comportamentos de múltiplos subcomponentes ou módulos dentro de um modelo, você deve usar um SubModel, como em cenários de layouts aninhados, renderização condicional, etc.

### Criar SubModel

É recomendado usar `<AddSubModelButton />`

Ele pode lidar automaticamente com questões como adicionar, vincular e armazenar Modelos filhos. Para mais detalhes, consulte [Instruções de Uso do AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Renderizar SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Como um ForkModel

Fork é tipicamente usado em cenários onde o mesmo template de modelo precisa ser renderizado em múltiplos locais (mas com estados independentes), como em cada linha de uma tabela.

### Criar ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Renderizar ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```