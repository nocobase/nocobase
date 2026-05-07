:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/view).
:::

# ctx.view

Der aktuell aktive View-Controller (Dialog, Drawer, Popover, eingebetteter Bereich usw.), der für den Zugriff auf Informationen und Operationen auf Ansichtsebene verwendet wird. Er wird von `FlowViewContext` bereitgestellt und ist nur innerhalb von Inhalten verfügbar, die über `ctx.viewer` oder `ctx.openView` geöffnet wurden.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **Dialog-/Drawer-Inhalt** | Verwenden Sie `ctx.view.close()` innerhalb des `content`, um die aktuelle Ansicht zu schließen, oder nutzen Sie `Header` und `Footer`, um Titel und Fußzeilen zu rendern. |
| **Nach dem Absenden des Formulars** | Rufen Sie nach einer erfolgreichen Übermittlung `ctx.view.close(result)` auf, um die Ansicht zu schließen und das Ergebnis zurückzugeben. |
| **JS-Block / Aktion** | Bestimmen Sie den aktuellen Ansichtstyp über `ctx.view.type` oder lesen Sie Öffnungsparameter aus `ctx.view.inputArgs` aus. |
| **Verknüpfungsauswahl, Untertabellen** | Lesen Sie `collectionName`, `filterByTk`, `parentId` usw. aus den `inputArgs` für das Laden von Daten aus. |

> Hinweis: `ctx.view` ist nur in RunJS-Umgebungen mit einem View-Kontext verfügbar (z. B. innerhalb des `content` von `ctx.viewer.dialog()`, in Dialogformularen oder innerhalb von Verknüpfungsauswahlen). In Standardseiten oder Backend-Kontexten ist es `undefined`. Es wird empfohlen, Optional Chaining zu verwenden (`ctx.view?.close?.()`).

## Typdefinition

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // In Workflow-Konfigurationsansichten verfügbar
};
```

## Gängige Eigenschaften und Methoden

| Eigenschaft/Methode | Typ | Beschreibung |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Aktueller Ansichtstyp |
| `inputArgs` | `Record<string, any>` | Parameter, die beim Öffnen der Ansicht übergeben wurden (siehe unten) |
| `Header` | `React.FC \| null` | Kopfzeilen-Komponente zum Rendern von Titeln und Aktionsbereichen |
| `Footer` | `React.FC \| null` | Fußzeilen-Komponente zum Rendern von Schaltflächen usw. |
| `close(result?, force?)` | `void` | Schließt die aktuelle Ansicht; `result` kann an den Aufrufer zurückgegeben werden |
| `update(newConfig)` | `void` | Aktualisiert die Ansichtskonfiguration (z. B. Breite, Titel) |
| `navigation` | `ViewNavigation \| undefined` | Ansichtsnavigation innerhalb der Seite, einschließlich Tab-Wechsel usw. |

> Derzeit unterstützen nur `dialog` und `drawer` die Komponenten `Header` und `Footer`.

## Gängige Felder in inputArgs

Die Felder in `inputArgs` variieren je nach Öffnungsszenario. Zu den häufigsten Feldern gehören:

| Feld | Beschreibung |
|------|------|
| `viewUid` | Ansichts-UID |
| `collectionName` | Name der Sammlung |
| `filterByTk` | Primärschlüsselfilter (für Einzeldatensatz-Details) |
| `parentId` | Eltern-ID (für Verknüpfungsszenarien) |
| `sourceId` | Quelldatensatz-ID |
| `parentItem` | Daten des Elternelements |
| `scene` | Szenario (z. B. `create`, `edit`, `select`) |
| `onChange` | Callback nach Auswahl oder Änderung |
| `tabUid` | Aktuelle Tab-UID (innerhalb einer Seite) |

Greifen Sie auf diese über `ctx.getVar('ctx.view.inputArgs.xxx')` oder `ctx.view.inputArgs.xxx` zu.

## Beispiele

### Schließen der aktuellen Ansicht

```ts
// Dialog nach erfolgreichem Absenden schließen
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Schließen und Ergebnisse zurückgeben
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Verwendung von Header / Footer im Inhalt

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Bearbeiten" extra={<Button size="small">Hilfe</Button>} />
      <div>Formularinhalt...</div>
      <Footer>
        <Button onClick={() => close()}>Abbrechen</Button>
        <Button type="primary" onClick={handleSubmit}>Absenden</Button>
      </Footer>
    </div>
  );
}
```

### Verzweigung basierend auf Ansichtstyp oder inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Kopfzeile in eingebetteten Ansichten ausblenden
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Szenario für Benutzerauswahl
}
```

## Beziehung zu ctx.viewer und ctx.openView

| Zweck | Empfohlene Verwendung |
|------|----------|
| **Neue Ansicht öffnen** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` oder `ctx.openView()` |
| **Aktuelle Ansicht bedienen** | `ctx.view.close()`, `ctx.view.update()` |
| **Öffnungsparameter abrufen** | `ctx.view.inputArgs` |

`ctx.viewer` ist für das „Öffnen“ einer Ansicht zuständig, während `ctx.view` die „aktuelle“ Ansichtsinstanz darstellt. `ctx.openView` wird verwendet, um vorkonfigurierte Workflow-Ansichten zu öffnen.

## Hinweise

- `ctx.view` ist nur innerhalb einer Ansicht verfügbar; auf Standardseiten ist es `undefined`.
- Verwenden Sie Optional Chaining: `ctx.view?.close?.()`, um Fehler zu vermeiden, wenn kein View-Kontext existiert.
- Das `result` von `close(result)` wird an das von `ctx.viewer.open()` zurückgegebene Promise übergeben.

## Verwandte Themen

- [ctx.openView()](./open-view.md): Öffnet eine vorkonfigurierte Workflow-Ansicht
- [ctx.modal](./modal.md): Leichtgewichtige Popups (Informationen, Bestätigungen usw.)

> `ctx.viewer` bietet Methoden wie `dialog()`, `drawer()`, `popover()` und `embed()` zum Öffnen von Ansichten an. Der über diese Methoden geöffnete `content` kann auf `ctx.view` zugreifen.