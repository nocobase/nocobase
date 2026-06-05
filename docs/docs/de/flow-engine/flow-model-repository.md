:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# FlowModel-Persistenz

Die FlowEngine bietet ein vollständiges Persistenzsystem.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` ist die Schnittstelle für die Modell-Persistenz der FlowEngine. Sie definiert Operationen wie das Laden, Speichern und Löschen von Modellen aus der Ferne. Indem Sie dieses Interface implementieren, können Sie Modelldaten in einer Backend-Datenbank, einer API oder anderen Speichermedien persistent speichern und so die Datensynchronisation zwischen Frontend und Backend ermöglichen.

### Hauptmethoden

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Lädt Modelldaten basierend auf dem eindeutigen Bezeichner `uid` von einer externen Quelle.

- **save(model: FlowModel): Promise<any\>**  
  Speichert die Modelldaten im externen Speicher.

- **destroy(uid: string): Promise<boolean\>**  
  Löscht das Modell basierend auf der `uid` aus dem externen Speicher.

### Beispiel für FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Implementierung: Modell anhand der uid abrufen
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Implementierung: Modell speichern
    return model;
  }

  async destroy(uid: string) {
    // Implementierung: Modell anhand der uid löschen
    return true;
  }
}
```

### FlowModelRepository einrichten

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Von der FlowEngine bereitgestellte Methoden zur Modellverwaltung

### Lokale Methoden

```ts
flowEngine.createModel(options); // Lokale Modellinstanz erstellen
flowEngine.getModel(uid);        // Lokale Modellinstanz abrufen
flowEngine.removeModel(uid);     // Lokale Modellinstanz entfernen
```

### Externe Methoden (implementiert durch das ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Modell aus der Ferne laden
await flowEngine.saveModel(model);   // Modell aus der Ferne speichern
await flowEngine.destroyModel(uid);  // Modell aus der Ferne löschen
```

## Methoden der Modellinstanz

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Aus der Ferne speichern
await model.destroy();  // Aus der Ferne löschen
```