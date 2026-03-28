:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/model).
:::

# ctx.model

Die `FlowModel`-Instanz, in der sich der aktuelle RunJS-Ausführungskontext befindet. Sie dient als Standard-Einstiegspunkt für Szenarien wie JSBlock, JSField und JSAction. Der spezifische Typ variiert je nach Kontext: Es kann sich um eine Unterklasse wie `BlockModel`, `ActionModel` oder `JSEditableFieldModel` handeln.

## Anwendungsbereiche

| Szenario | Beschreibung |
|------|------|
| **JSBlock** | `ctx.model` ist das aktuelle Block-Modell. Sie können auf `resource`, `collection`, `setProps` usw. zugreifen. |
| **JSField / JSItem / JSColumn** | `ctx.model` ist das Feld-Modell. Sie können auf `setProps`, `dispatchEvent` usw. zugreifen. |
| **Aktionsereignisse / ActionModel** | `ctx.model` ist das Aktions-Modell. Sie können Schrittparameter lesen/schreiben, Ereignisse auslösen usw. |

> Hinweis: Wenn Sie auf den **übergeordneten Block, der das aktuelle JS enthält** (z. B. ein Formular- oder Tabellen-Block), zugreifen müssen, verwenden Sie `ctx.blockModel`. Um auf **andere Modelle** zuzugreifen, verwenden Sie `ctx.getModel(uid)`.

## Typdefinition

```ts
model: FlowModel;
```

`FlowModel` ist die Basisklasse. Zur Laufzeit handelt es sich um eine Instanz verschiedener Unterklassen (wie `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel` usw.). Die verfügbaren Eigenschaften und Methoden hängen vom jeweiligen Typ ab.

## Häufig genutzte Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|------|------|------|
| `uid` | `string` | Eindeutige Kennung des Modells. Kann für `ctx.getModel(uid)` oder die UID-Bindung von Popups verwendet werden. |
| `collection` | `Collection` | Die an das aktuelle Modell gebundene Sammlung (existiert, wenn der Block oder das Feld an Daten gebunden ist). |
| `resource` | `Resource` | Zugehörige Ressourcen-Instanz, wird zum Aktualisieren, Abrufen ausgewählter Zeilen usw. verwendet. |
| `props` | `object` | UI- und Verhaltenskonfiguration des Modells. Kann mit `setProps` aktualisiert werden. |
| `subModels` | `Record<string, FlowModel>` | Sammlung von Untermodellen (z. B. Felder innerhalb eines Formulars, Spalten innerhalb einer Tabelle). |
| `parent` | `FlowModel` | Übergeordnetes Modell (falls vorhanden). |

## Häufig genutzte Methoden

| Methode | Beschreibung |
|------|------|
| `setProps(partialProps: any): void` | Aktualisiert die Modellkonfiguration und löst ein erneutes Rendern aus (z. B. `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Sendet ein Ereignis an das Modell und löst Workflows aus, die auf diesem Modell konfiguriert sind und auf diesen Ereignisnamen hören. Ein optionaler `payload` wird an den Workflow-Handler übergeben; `options.debounce` aktiviert die Entprellung (Debouncing). |
| `getStepParams?.(flowKey, stepKey)` | Liest Schrittparameter des Konfigurations-Workflows (verwendet in Einstellungsfeldern, benutzerdefinierten Aktionen usw.). |
| `setStepParams?.(flowKey, stepKey, params)` | Schreibt Schrittparameter des Konfigurations-Workflows. |

## Beziehung zu ctx.blockModel und ctx.getModel

| Anforderung | Empfohlene Verwendung |
|------|----------|
| **Modell des aktuellen Ausführungskontexts** | `ctx.model` |
| **Übergeordneter Block des aktuellen JS** | `ctx.blockModel`. Wird häufig verwendet, um auf `resource`, `form` oder `collection` zuzugreifen. |
| **Beliebiges Modell über UID abrufen** | `ctx.getModel(uid)` oder `ctx.getModel(uid, true)` (Suche über Ansichtsstapel hinweg). |

In einem JSField ist `ctx.model` das Feld-Modell, während `ctx.blockModel` der Formular- oder Tabellen-Block ist, der dieses Feld enthält.

## Beispiele

### Aktualisierung des Block- oder Aktionsstatus

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Auslösen von Modell-Ereignissen

```ts
// Löst ein Ereignis aus, um einen auf diesem Modell konfigurierten Workflow zu starten, der auf diesen Ereignisnamen hört
await ctx.model.dispatchEvent('remove');

// Wenn ein Payload angegeben wird, wird dieser an ctx.inputArgs des Workflow-Handlers übergeben
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Verwendung der UID für die Popup-Bindung oder den modellübergreifenden Zugriff

```ts
const myUid = ctx.model.uid;
// In der Popup-Konfiguration können Sie openerUid: myUid zur Verknüpfung übergeben
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Verwandte Themen

- [ctx.blockModel](./block-model.md): Das übergeordnete Block-Modell, in dem sich das aktuelle JS befindet.
- [ctx.getModel()](./get-model.md): Andere Modelle über die UID abrufen.