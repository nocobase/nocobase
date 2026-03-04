:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/get-model).
:::

# ctx.getModel()

Ruft eine Modellinstanz (wie `BlockModel`, `PageModel`, `ActionModel` usw.) basierend auf der Modell-`uid` aus der aktuellen Engine oder dem View-Stack ab. Dies wird in RunJS verwendet, um block-, seiten- oder popup-übergreifend auf andere Modelle zuzugreifen.

Wenn Sie nur das Modell oder den Block benötigen, in dem sich der aktuelle Ausführungskontext befindet, verwenden Sie vorrangig `ctx.model` oder `ctx.blockModel` anstelle von `ctx.getModel`.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **JSBlock / JSAction** | Modelle anderer Blöcke basierend auf einer bekannten `uid` abrufen, um deren `resource`, `form`, `setProps` usw. zu lesen oder zu schreiben. |
| **RunJS in Popups** | Wenn Sie auf ein Modell auf der Seite zugreifen müssen, die das Popup geöffnet hat, übergeben Sie `searchInPreviousEngines: true`. |
| **Benutzerdefinierte Aktionen** | Formulare oder Untermodelle im Konfigurations-Panel über View-Stacks hinweg per `uid` lokalisieren, um deren Konfiguration oder Status zu lesen. |

## Typendefinition

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parameter

| Parameter | Typ | Beschreibung |
|------|------|------|
| `uid` | `string` | Die eindeutige Kennung der Zielmodellinstanz, die bei der Konfiguration oder Erstellung festgelegt wurde (z. B. `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | Optional, Standardwert ist `false`. Wenn `true`, wird im „View-Stack“ von der aktuellen Engine aufwärts bis zur Wurzel gesucht, was den Zugriff auf Modelle in übergeordneten Engines ermöglicht (z. B. die Seite, die ein Popup geöffnet hat). |

## Rückgabewert

- Gibt die entsprechende `FlowModel`-Unterklasseninstanz zurück (z. B. `BlockModel`, `FormBlockModel`, `ActionModel`), falls gefunden.
- Gibt `undefined` zurück, falls nicht gefunden.

## Suchbereich

- **Standard (`searchInPreviousEngines: false`)**: Sucht nur innerhalb der **aktuellen Engine** nach der `uid`. In Popups oder mehrstufigen Ansichten hat jede Ansicht eine unabhängige Engine; standardmäßig wird nur nach Modellen innerhalb der aktuellen Ansicht gesucht.
- **`searchInPreviousEngines: true`**: Sucht ausgehend von der aktuellen Engine entlang der `previousEngine`-Kette nach oben und gibt den ersten Treffer zurück. Dies ist nützlich, um auf ein Modell auf der Seite zuzugreifen, die das aktuelle Popup geöffnet hat.

## Beispiele

### Anderen Block abrufen und aktualisieren

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Vom Popup aus auf ein Modell auf der Seite zugreifen

```ts
// Zugriff auf einen Block auf der Seite, die das aktuelle Popup geöffnet hat
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Modellübergreifendes Lesen/Schreiben und Rerender auslösen

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Sicherheitsprüfung

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('Zielmodell existiert nicht');
  return;
}
```

## Verwandte Themen

- [ctx.model](./model.md): Das Modell, in dem sich der aktuelle Ausführungskontext befindet.
- [ctx.blockModel](./block-model.md): Das übergeordnete Block-Modell, in dem sich das aktuelle JS befindet; normalerweise ohne `getModel` zugänglich.