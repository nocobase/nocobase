:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# FlowModel erstellen

## Als Root-Knoten

### Eine FlowModel-Instanz erstellen

Erstellen Sie eine Instanz lokal.

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### FlowModel speichern

Wenn eine erstellte Instanz persistent gespeichert werden soll, können Sie dies mit der `save`-Methode tun.

```ts
await model.save();
```

### FlowModel aus einem Remote-Repository laden

Ein bereits gespeichertes Modell können Sie mit `loadModel` laden. Diese Methode lädt den gesamten Modellbaum (einschließlich der Kindknoten).

```ts
await engine.loadModel(uid);
```

### FlowModel laden oder erstellen

Wenn das Modell existiert, wird es geladen; andernfalls wird es erstellt und gespeichert.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### FlowModel rendern

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Als Kindknoten

Wenn Sie die Eigenschaften und das Verhalten mehrerer Unterkomponenten oder Module innerhalb eines Modells verwalten müssen, verwenden Sie ein SubModel. Dies ist beispielsweise bei verschachtelten Layouts oder bedingtem Rendering der Fall.

### SubModel erstellen

Wir empfehlen die Verwendung von `<AddSubModelButton />`.

Es kann Probleme wie das Hinzufügen, Binden und Speichern von Kind-Modellen automatisch handhaben. Weitere Details finden Sie in den [Anweisungen zur Verwendung von AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### SubModel rendern

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Als ForkModel

Ein Fork wird typischerweise in Szenarien verwendet, in denen dieselbe Modellvorlage an mehreren Stellen gerendert werden muss (jedoch mit unabhängigen Zuständen), zum Beispiel für jede Zeile in einer Tabelle.

### ForkModel erstellen

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### ForkModel rendern

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```