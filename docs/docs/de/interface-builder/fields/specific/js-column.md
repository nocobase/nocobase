:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/interface-builder/fields/specific/js-column).
:::

# JS-Spalte

## Einführung

Die JS-Spalte wird für „Benutzerdefinierte Spalten“ in Tabellen verwendet und rendert den Inhalt der Zellen jeder Zeile über JavaScript. Sie ist nicht an ein bestimmtes Feld gebunden und eignet sich für Szenarien wie abgeleitete Spalten, Feldübergreifende Kombinationsanzeigen, Status-Badges, Schaltflächenoperationen, Remote-Datenzusammenfassungen usw.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## Laufzeit-Kontext-API

Beim Rendern jeder Zelle der JS-Spalte können die folgenden Kontext-Fähigkeiten verwendet werden:

- `ctx.element`: Der DOM-Container der aktuellen Zelle (ElementProxy), unterstützt `innerHTML`, `querySelector`, `addEventListener` usw.;
- `ctx.record`: Das Datensatzobjekt der aktuellen Zeile (schreibgeschützt);
- `ctx.recordIndex`: Der Zeilenindex innerhalb der aktuellen Seite (beginnt bei 0, kann durch Paginierung beeinflusst werden);
- `ctx.collection`: Die Metainformationen der an die Tabelle gebundenen Sammlung (schreibgeschützt);
- `ctx.requireAsync(url)`: Lädt eine AMD/UMD-Bibliothek asynchron über eine URL;
- `ctx.importAsync(url)`: Importiert ein ESM-Modul dynamisch über eine URL;
- `ctx.openView(options)`: Öffnet eine konfigurierte Ansicht (Modal/Drawer/Seite);
- `ctx.i18n.t()` / `ctx.t()`: Internationalisierung;
- `ctx.onRefReady(ctx.ref, cb)`: Rendert erst, nachdem der Container bereit ist;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Integrierte Bibliotheken wie React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js für JSX-Rendering, Zeitverarbeitung, Datenoperationen und mathematische Berechnungen. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` bleiben aus Kompatibilitätsgründen erhalten.)
- `ctx.render(vnode)`: Rendert ein React-Element/HTML/DOM in den Standardcontainer `ctx.element` (die aktuelle Zelle). Mehrere Render-Vorgänge verwenden das Root-Element wieder und überschreiben den vorhandenen Inhalt des Containers.

## Editor und Snippets

Der Skript-Editor der JS-Spalte unterstützt Syntax-Hervorhebung, Fehlerhinweise und integrierte Code-Snippets (Snippets).

- `Snippets`: Öffnet die Liste der integrierten Code-Snippets, die Sie durchsuchen und mit einem Klick an der aktuellen Cursorposition einfügen können.
- `Run`: Führt den aktuellen Code direkt aus. Das Ausführungsprotokoll wird im `Logs`-Panel unten ausgegeben und unterstützt `console.log/info/warn/error` sowie die Fehlerhervorhebung.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Kann mit KI-Mitarbeitern kombiniert werden, um Code zu generieren:

- [KI-Mitarbeiter · Nathan: Frontend-Ingenieur](/ai-employees/features/built-in-employee)

## Häufige Anwendungsfälle

### 1) Grundlegendes Rendering (Lesen des aktuellen Zeilendatensatzes)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Verwenden von JSX zum Rendern von React-Komponenten

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) Öffnen eines Modals/Drawers aus einer Zelle (Anzeigen/Bearbeiten)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>Ansehen</a>
);
```

### 4) Laden von Drittanbieter-Bibliotheken (AMD/UMD oder ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Hinweise

- Es wird empfohlen, für das Laden externer Bibliotheken ein vertrauenswürdiges CDN zu verwenden und für Fehlerszenarien eine Absicherung bereitzustellen (z. B. `if (!lib) return;`).
- Es wird empfohlen, bevorzugt `class`- oder `[name=...]`-Selektoren anstelle fester `id`s zu verwenden, um doppelte `id`s in mehreren Blöcken oder Modals zu vermeiden.
- Ereignisbereinigung: Tabellenzeilen können sich dynamisch mit Paginierung oder Aktualisierung ändern, wodurch Zellen mehrmals gerendert werden. Sie sollten Ereignis-Listener vor dem Binden bereinigen oder deduplizieren, um wiederholte Auslöser zu vermeiden.
- Leistungsempfehlung: Vermeiden Sie es, große Bibliotheken in jeder Zelle wiederholt zu laden. Die Bibliothek sollte auf einer höheren Ebene (z. B. über eine globale oder tabellenweite Variable) zwischengespeichert und dann wiederverwendet werden.