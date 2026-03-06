:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/interface-builder/fields/specific/js-field).
:::

# JS Field

## Einführung

Das JS Field wird verwendet, um Inhalte an einer Feldposition mit JavaScript individuell zu rendern. Es kommt häufig in Detailblöcken, schreibgeschützten Elementen in Formularen oder als „Andere benutzerdefinierte Elemente“ in Tabellenspalten zum Einsatz. Es eignet sich für personalisierte Anzeigen, die Kombination abgeleiteter Informationen, Status-Badges, Rich Text oder Diagramme.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Typen

- Schreibgeschützt: Dient der nicht-editierbaren Anzeige und liest `ctx.value` für die Ausgabe.
- Editierbar: Dient benutzerdefinierten Eingabeinteraktionen; stellt `ctx.getValue()`/`ctx.setValue(v)` und das Container-Ereignis `js-field:value-change` bereit, um die bidirektionale Synchronisierung mit Formularwerten zu erleichtern.

## Anwendungsfälle

- Schreibgeschützt
  - Detailblock: Anzeige von schreibgeschützten Inhalten wie Berechnungsergebnissen, Status-Badges, Rich-Text-Fragmenten, Diagrammen usw.;
  - Tabellenblock: Als „Andere benutzerdefinierte Spalte > JS Field“ für die schreibgeschützte Anzeige (wenn Sie eine Spalte benötigen, die nicht an ein Feld gebunden ist, verwenden Sie bitte die JS Column);

- Editierbar
  - Formularblock (CreateForm/EditForm): Für benutzerdefinierte Eingabesteuerelemente oder zusammengesetzte Eingaben, die mit dem Formular validiert und übermittelt werden;
  - Geeignete Szenarien: Eingabekomponenten aus externen Bibliotheken, Rich-Text-/Code-Editoren, komplexe dynamische Komponenten usw.;

## Laufzeit-Kontext-API

Der Laufzeitcode des JS Field kann direkt die folgenden Kontextfunktionen nutzen:

- `ctx.element`: Der DOM-Container des Feldes (ElementProxy), unterstützt `innerHTML`, `querySelector`, `addEventListener` usw.;
- `ctx.value`: Der aktuelle Feldwert (schreibgeschützt);
- `ctx.record`: Das aktuelle Datensatzobjekt (schreibgeschützt);
- `ctx.collection`: Metainformationen der **Sammlung**, zu der das Feld gehört (schreibgeschützt);
- `ctx.requireAsync(url)`: Lädt eine AMD/UMD-Bibliothek asynchron über die URL;
- `ctx.importAsync(url)`: Importiert ein ESM-Modul dynamisch über die URL;
- `ctx.openView(options)`: Öffnet eine konfigurierte Ansicht (Popup/Drawer/Seite);
- `ctx.i18n.t()` / `ctx.t()`: Internationalisierung;
- `ctx.onRefReady(ctx.ref, cb)`: Rendert erst, wenn der Container bereit ist;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Integrierte Bibliotheken wie React, ReactDOM, Ant Design, Ant Design Icons, dayjs, lodash, math.js und formula.js für JSX-Rendering, Zeitverarbeitung, Datenmanipulation und mathematische Operationen. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` bleiben aus Kompatibilitätsgründen erhalten.)
- `ctx.render(vnode)`: Rendert ein React-Element, einen HTML-String oder einen DOM-Knoten in den Standardcontainer `ctx.element`; Wiederholtes Rendern verwendet die Root wieder und überschreibt den vorhandenen Inhalt des Containers.

Spezifisch für den editierbaren Typ (JSEditableField):

- `ctx.getValue()`: Ruft den aktuellen Formularwert ab (priorisiert den Formularstatus, fällt dann auf Feld-Props zurück).
- `ctx.setValue(v)`: Setzt den Formularwert und die Feld-Props, um die bidirektionale Synchronisierung aufrechtzuerhalten.
- Container-Ereignis `js-field:value-change`: Wird ausgelöst, wenn sich ein externer Wert ändert, um die Aktualisierung der Eingabeanzeige durch das Skript zu erleichtern.

## Editor und Snippets

Der Skript-Editor des JS Field unterstützt Syntax-Highlighting, Fehlerhinweise und integrierte Code-Snippets (Snippets).

- `Snippets`: Öffnet eine Liste integrierter Code-Snippets, die durchsucht und mit einem Klick an der aktuellen Cursorposition eingefügt werden können.
- `Run`: Führt den aktuellen Code direkt aus. Das Ausführungsprotokoll wird im unteren `Logs`-Panel ausgegeben und unterstützt `console.log/info/warn/error` sowie Fehlerhervorhebung zur Lokalisierung.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Kann in Kombination mit KI-Mitarbeitern zur Code-Generierung verwendet werden:

- [KI-Mitarbeiter · Nathan: Frontend-Ingenieur](/ai-employees/features/built-in-employee)

## Häufige Anwendungsfälle

### 1) Grundlegendes Rendering (Feldwert lesen)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Verwenden von JSX zum Rendern einer React-Komponente

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Laden von Drittanbieter-Bibliotheken (AMD/UMD oder ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Klicken zum Öffnen eines Popups/Drawers (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Details anzeigen</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) Editierbare Eingabe (JSEditableFieldModel)

```js
// Rendert eine einfache Eingabe mit JSX und synchronisiert den Formularwert
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// Synchronisiert die Eingabe, wenn sich der externe Wert ändert (optional)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Hinweise

- Für das Laden externer Bibliotheken wird die Verwendung vertrauenswürdiger CDNs empfohlen; stellen Sie Fallbacks für Fehlerszenarien bereit (z. B. `if (!lib) return;`).
- Bei Selektoren wird empfohlen, `class` oder `[name=...]` zu bevorzugen; vermeiden Sie feste IDs, um doppelte IDs in mehreren Blöcken oder Popups zu verhindern.
- Ereignisbereinigung: Ein Feld kann aufgrund von Datenänderungen oder Ansichtswechseln mehrmals neu gerendert werden. Vor der Bindung von Ereignissen sollten Sie diese bereinigen oder Duplikate entfernen, um wiederholte Auslösungen zu vermeiden. Möglich ist „zuerst remove, dann add“.