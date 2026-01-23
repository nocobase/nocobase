:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# JS Field

## Einführung

Das JS Field wird verwendet, um Inhalte an einer Feldposition mit JavaScript individuell zu rendern. Es kommt häufig in Detailblöcken, bei schreibgeschützten Elementen in Formularen oder als „Andere benutzerdefinierte Elemente“ in Tabellenspalten zum Einsatz. Es eignet sich hervorragend für personalisierte Anzeigen, die Kombination abgeleiteter Informationen, das Rendern von Status-Badges, Rich Text oder Diagrammen.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Typen

- Schreibgeschützt: Dient der nicht-editierbaren Anzeige und liest `ctx.value` für die Ausgabe.
- Editierbar: Ermöglicht benutzerdefinierte Eingabeinteraktionen. Es stellt `ctx.getValue()`/`ctx.setValue(v)` und ein Container-Event `js-field:value-change` bereit, um die bidirektionale Synchronisierung mit Formularwerten zu erleichtern.

## Anwendungsfälle

- Schreibgeschützt
  - Detailblock: Zur Anzeige von schreibgeschützten Inhalten wie Berechnungsergebnissen, Status-Badges, Rich-Text-Fragmenten, Diagrammen usw.
  - Tabellenblock: Als „Andere benutzerdefinierte Spalte > JS Field“ für die schreibgeschützte Anzeige (wenn Sie eine Spalte benötigen, die nicht an ein Feld gebunden ist, verwenden Sie bitte die JS Column).

- Editierbar
  - Formularblock (CreateForm/EditForm): Für benutzerdefinierte Eingabesteuerelemente oder zusammengesetzte Eingaben, die mit dem Formular validiert und übermittelt werden.
  - Geeignet für Szenarien wie: Eingabekomponenten aus externen Bibliotheken, Rich-Text-/Code-Editoren, komplexe dynamische Komponenten usw.

## Laufzeit-Kontext-API

Der Laufzeitcode des JS Field kann direkt die folgenden Kontextfunktionen nutzen:

- `ctx.element`: Der DOM-Container des Feldes (ElementProxy), der `innerHTML`, `querySelector`, `addEventListener` usw. unterstützt.
- `ctx.value`: Der aktuelle Feldwert (schreibgeschützt).
- `ctx.record`: Das aktuelle Datensatzobjekt (schreibgeschützt).
- `ctx.collection`: Metadaten der **Sammlung**, zu der das Feld gehört (schreibgeschützt).
- `ctx.requireAsync(url)`: Lädt eine AMD/UMD-Bibliothek asynchron über URL.
- `ctx.importAsync(url)`: Importiert ein ESM-Modul dynamisch über URL.
- `ctx.openView(options)`: Öffnet eine konfigurierte Ansicht (Popup/Drawer/Seite).
- `ctx.i18n.t()` / `ctx.t()`: Internationalisierung.
- `ctx.onRefReady(ctx.ref, cb)`: Rendert, nachdem der Container bereit ist.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Integrierte Bibliotheken wie React, ReactDOM, Ant Design, Ant Design Icons und dayjs für JSX-Rendering und Zeitverarbeitung. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` bleiben aus Kompatibilitätsgründen erhalten.)
- `ctx.render(vnode)`: Rendert ein React-Element, einen HTML-String oder einen DOM-Knoten in den Standardcontainer `ctx.element`. Wiederholtes Rendern verwendet die Root wieder und überschreibt den vorhandenen Inhalt des Containers.

Spezifisch für den editierbaren Typ (JSEditableField):

- `ctx.getValue()`: Ruft den aktuellen Formularwert ab (priorisiert den Formularstatus, fällt dann auf Feld-Props zurück).
- `ctx.setValue(v)`: Setzt den Formularwert und die Feld-Props, um eine bidirektionale Synchronisierung aufrechtzuerhalten.
- Container-Event `js-field:value-change`: Wird ausgelöst, wenn sich ein externer Wert ändert, um die Aktualisierung der Eingabeanzeige durch das Skript zu erleichtern.

## Editor und Snippets

Der Skript-Editor des JS Field unterstützt Syntax-Highlighting, Fehlerhinweise und integrierte Code-Snippets.

- `Snippets`: Öffnet eine Liste der integrierten Code-Snippets, die durchsucht und mit einem Klick an der aktuellen Cursorposition eingefügt werden können.
- `Run`: Führt den aktuellen Code direkt aus. Das Ausführungsprotokoll wird im unteren `Logs`-Panel ausgegeben und unterstützt `console.log/info/warn/error` sowie die Fehlerhervorhebung zur einfachen Lokalisierung.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Sie können auch Code mit dem KI-Mitarbeiter generieren lassen:

- [KI-Mitarbeiter · Nathan: Frontend-Entwickler](/ai-employees/built-in/ai-coding)

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
// Rendern Sie eine einfache Eingabe mit JSX und synchronisieren Sie den Formularwert
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

// Synchronisieren Sie die Eingabe, wenn sich der externe Wert ändert (optional)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Hinweise

- Es wird empfohlen, für das Laden externer Bibliotheken ein vertrauenswürdiges CDN zu verwenden und für Fehlerfälle eine Fallback-Lösung bereitzustellen (z. B. `if (!lib) return;`).
- Für Selektoren wird empfohlen, `class` oder `[name=...]` zu bevorzugen und feste `id`s zu vermeiden, um doppelte `id`s in mehreren Blöcken oder Popups zu verhindern.
- Ereignisbereinigung: Ein Feld kann aufgrund von Datenänderungen oder Ansichtswechseln mehrmals neu gerendert werden. Bevor Sie ein Ereignis binden, sollten Sie es bereinigen oder Duplikate entfernen, um wiederholte Auslösungen zu vermeiden. Es empfiehlt sich, „zuerst zu entfernen und dann hinzuzufügen“.