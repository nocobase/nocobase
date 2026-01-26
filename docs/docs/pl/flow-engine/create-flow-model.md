:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Tworzenie FlowModel

## Jako węzeł główny

### Tworzenie instancji FlowModel

Utwórz instancję lokalnie.

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Zapisywanie FlowModel

Jeśli utworzona instancja wymaga utrwalenia, można ją zapisać za pomocą metody `save`.

```ts
await model.save();
```

### Ładowanie FlowModel z repozytorium zdalnego

Zapisany model można załadować za pomocą metody `loadModel`. Ta metoda załaduje całe drzewo modelu (wraz z węzłami potomnymi):

```ts
await engine.loadModel(uid);
```

### Ładowanie lub tworzenie FlowModel

Jeśli model istnieje, zostanie załadowany; w przeciwnym razie zostanie utworzony i zapisany.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Renderowanie FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Jako węzeł potomny

Gdy potrzebuje Pan/Pani zarządzać właściwościami i zachowaniami wielu podkomponentów lub modułów wewnątrz modelu, należy użyć SubModel. Przykłady takich scenariuszy to zagnieżdżone układy, renderowanie warunkowe itp.

### Tworzenie SubModel

Zalecamy użycie `<AddSubModelButton />`.

Przycisk ten automatycznie obsługuje dodawanie, wiązanie i przechowywanie modeli potomnych. Szczegółowe informacje znajdzie Pan/Pani w [Instrukcji użytkowania AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Renderowanie SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Jako ForkModel

Fork jest zazwyczaj używany w scenariuszach, gdzie ten sam szablon modelu musi być renderowany w wielu miejscach (ale z niezależnymi stanami), na przykład dla każdego wiersza w tabeli.

### Tworzenie ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Renderowanie ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```