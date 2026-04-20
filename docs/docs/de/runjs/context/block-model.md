:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/block-model).
:::

# ctx.blockModel

Das übergeordnete Block-Modell (BlockModel-Instanz), in dem sich das aktuelle JS-Feld / der JS-Block befindet. In Szenarien wie JSField, JSItem und JSColumn zeigt `ctx.blockModel` auf den Formular-Block oder Tabellen-Block, der die aktuelle JS-Logik trägt. In einem eigenständigen JSBlock kann es `null` sein oder mit `ctx.model` übereinstimmen.

## Anwendungsbereiche

| Szenario | Beschreibung |
|------|------|
| **JSField** | Zugriff auf `form`, `Sammlung` und `resource` des übergeordneten Formular-Blocks innerhalb eines Formularfeldes, um Verknüpfungen oder Validierungen zu implementieren. |
| **JSItem** | Zugriff auf die Ressourcen- und Sammlungsinformationen des übergeordneten Tabellen-/Formular-Blocks innerhalb eines Untertabellen-Elements. |
| **JSColumn** | Zugriff auf die `resource` (z. B. `getSelectedRows`) und `Sammlung` des übergeordneten Tabellen-Blocks innerhalb einer Tabellenspalte. |
| **Formular-Aktionen / Ereignisfluss** | Zugriff auf `form` für die Validierung vor dem Absenden, `resource` für die Aktualisierung usw. |

> Hinweis: `ctx.blockModel` ist nur in RunJS-Kontexten verfügbar, in denen ein übergeordneter Block existiert. Bei eigenständigen JSBlocks (ohne übergeordnetes Formular/Tabelle) kann es `null` sein. Es wird empfohlen, vor der Verwendung eine Prüfung auf Nullwerte durchzuführen.

## Typdefinition

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

Der spezifische Typ hängt vom Typ des übergeordneten Blocks ab: Formular-Blöcke sind meist `FormBlockModel` oder `EditFormModel`, während Tabellen-Blöcke meist `TableBlockModel` sind.

## Häufig verwendete Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|------|------|------|
| `uid` | `string` | Eindeutige Kennung des Block-Modells. |
| `collection` | `Collection` | Die an den aktuellen Block gebundene Sammlung. |
| `resource` | `Resource` | Die vom Block verwendete Ressourcen-Instanz (`SingleRecordResource` / `MultiRecordResource` usw.). |
| `form` | `FormInstance` | Formular-Block: Ant Design Form-Instanz, unterstützt `getFieldsValue`, `validateFields`, `setFieldsValue` usw. |
| `emitter` | `EventEmitter` | Ereignis-Emitter, wird verwendet, um auf `formValuesChange`, `onFieldReset` usw. zu hören. |

## Beziehung zu ctx.model und ctx.form

| Anforderung | Empfohlene Verwendung |
|------|----------|
| **Übergeordneter Block des aktuellen JS** | `ctx.blockModel` |
| **Formularfelder lesen/schreiben** | `ctx.form` (entspricht `ctx.blockModel?.form`, bequemer in Formular-Blöcken) |
| **Modell des aktuellen Ausführungskontexts** | `ctx.model` (Feld-Modell in JSField, Block-Modell in JSBlock) |

In einem JSField ist `ctx.model` das Feld-Modell und `ctx.blockModel` der Formular- oder Tabellen-Block, der dieses Feld trägt; `ctx.form` ist normalerweise `ctx.blockModel.form`.

## Beispiele

### Tabelle: Ausgewählte Zeilen abrufen und verarbeiten

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Bitte wählen Sie zuerst Daten aus');
  return;
}
```

### Formular-Szenario: Validieren und Aktualisieren

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Auf Formularänderungen hören

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Verknüpfung oder Neu-Rendering basierend auf den neuesten Formularwerten implementieren
});
```

### Block-Neu-Rendering auslösen

```ts
ctx.blockModel?.rerender?.();
```

## Hinweise

- In einem **eigenständigen JSBlock** (ohne übergeordneten Formular- oder Tabellen-Block) kann `ctx.blockModel` den Wert `null` haben. Es wird empfohlen, beim Zugriff auf seine Eigenschaften die optionale Verkettung (Optional Chaining) zu verwenden: `ctx.blockModel?.resource?.refresh?.()`.
- In **JSField / JSItem / JSColumn** bezieht sich `ctx.blockModel` auf den Formular- oder Tabellen-Block, der das aktuelle Feld trägt. In einem **JSBlock** kann es sich um sich selbst oder einen übergeordneten Block handeln, abhängig von der tatsächlichen Hierarchie.
- `resource` existiert nur in Daten-Blöcken; `form` existiert nur in Formular-Blöcken. Tabellen-Blöcke haben normalerweise kein `form`.

## Verwandte Themen

- [ctx.model](./model.md): Das Modell des aktuellen Ausführungskontexts.
- [ctx.form](./form.md): Formular-Instanz, häufig in Formular-Blöcken verwendet.
- [ctx.resource](./resource.md): Ressourcen-Instanz (entspricht `ctx.blockModel?.resource`, direkt verwenden, falls verfügbar).
- [ctx.getModel()](./get-model.md): Andere Block-Modelle anhand der UID abrufen.