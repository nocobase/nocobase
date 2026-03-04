:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/open-view).
:::

# ctx.openView()

Öffnet programmatisch eine angegebene Ansicht (Drawer, Dialog, eingebettete Seite usw.). Bereitgestellt durch `FlowModelContext`, wird es verwendet, um konfigurierte `ChildPage`- oder `PopupAction`-Ansichten in Szenarien wie `JSBlock`, Tabellenzellen und Workflows zu öffnen.

## Szenarien

| Szenario | Beschreibung |
|------|------|
| **JSBlock** | Öffnen eines Detail-/Bearbeitungs-Dialogs nach einem Klick auf eine Schaltfläche, wobei `filterByTk` der aktuellen Zeile übergeben wird. |
| **Tabellenzelle** | Rendern einer Schaltfläche innerhalb einer Zelle, die bei Klick einen Zeilendetail-Dialog öffnet. |
| **Workflow / JSAction** | Öffnen der nächsten Ansicht oder eines Dialogs nach einer erfolgreichen Operation. |
| **Verknüpfungsfeld** | Öffnen eines Auswahl-/Bearbeitungs-Dialogs über `ctx.runAction('openView', params)`. |

> Hinweis: `ctx.openView` ist in einer RunJS-Umgebung verfügbar, in der ein `FlowModel`-Kontext existiert. Wenn das Modell, das der `uid` entspricht, nicht existiert, wird automatisch ein `PopupActionModel` erstellt und dauerhaft gespeichert.

## Signatur

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Parameterbeschreibung

### uid

Die eindeutige Kennung des Ansichtsmodells. Falls es nicht existiert, wird es automatisch erstellt und gespeichert. Es wird empfohlen, eine stabile UID zu verwenden, wie z. B. `${ctx.model.uid}-detail`, damit die Konfiguration beim mehrfachen Öffnen desselben Dialogs wiederverwendet werden kann.

### Gängige options-Felder

| Feld | Typ | Beschreibung |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Öffnungsmethode: Drawer, Dialog oder eingebettet. Standardmäßig `drawer`. |
| `size` | `small` / `medium` / `large` | Größe des Dialogs oder Drawers. Standardmäßig `medium`. |
| `title` | `string` | Titel der Ansicht. |
| `params` | `Record<string, any>` | Beliebige Parameter, die an die Ansicht übergeben werden. |
| `filterByTk` | `any` | Primärschlüsselwert, verwendet für Detail-/Bearbeitungsszenarien einzelner Datensätze. |
| `sourceId` | `string` | ID des Quelldatensatzes, verwendet in Verknüpfungsszenarien. |
| `dataSourceKey` | `string` | Datenquelle. |
| `collectionName` | `string` | Name der Sammlung. |
| `associationName` | `string` | Name des Verknüpfungsfeldes. |
| `navigation` | `boolean` | Ob Routen-Navigation verwendet werden soll. Wenn `defineProperties` oder `defineMethods` angegeben sind, wird dies erzwungen auf `false` gesetzt. |
| `preventClose` | `boolean` | Ob das Schließen verhindert werden soll. |
| `defineProperties` | `Record<string, PropertyOptions>` | Dynamisches Einfügen von Eigenschaften in das Modell innerhalb der Ansicht. |
| `defineMethods` | `Record<string, Function>` | Dynamisches Einfügen von Methoden in das Modell innerhalb der Ansicht. |

## Beispiele

### Grundlegende Verwendung: Einen Drawer öffnen

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Details'),
});
```

### Kontext der aktuellen Zeile übergeben

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Zeilendetails'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Über runAction öffnen

Wenn ein Modell mit einer `openView`-Aktion konfiguriert ist (z. B. Verknüpfungsfelder oder anklickbare Felder), können Sie diese aufrufen:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Benutzerdefinierten Kontext injizieren

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

## Beziehung zu ctx.viewer und ctx.view

| Verwendungszweck | Empfohlene Verwendung |
|------|----------|
| **Konfigurierte Workflow-Ansicht öffnen** | `ctx.openView(uid, options)` |
| **Benutzerdefinierten Inhalt öffnen (kein Workflow)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Aktuelle geöffnete Ansicht bedienen** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` öffnet eine `FlowPage` (`ChildPageModel`), die intern eine vollständige Workflow-Seite rendert; `ctx.viewer` öffnet beliebige React-Inhalte.

## Hinweise

- Es wird empfohlen, die `uid` mit `ctx.model.uid` zu verknüpfen (z. B. `${ctx.model.uid}-xxx`), um Konflikte zwischen mehreren Blöcken zu vermeiden.
- Wenn `defineProperties` oder `defineMethods` übergeben werden, wird `navigation` erzwungen auf `false` gesetzt, um einen Kontextverlust nach einer Aktualisierung zu verhindern.
- Innerhalb des Dialogs bezieht sich `ctx.view` auf die aktuelle Ansichtsinstanz, und `ctx.view.inputArgs` kann verwendet werden, um die beim Öffnen übergebenen Parameter zu lesen.

## Verwandte Themen

- [ctx.view](./view.md): Die aktuell geöffnete Ansichtsinstanz.
- [ctx.model](./model.md): Das aktuelle Modell, das zur Konstruktion einer stabilen `popupUid` verwendet wird.