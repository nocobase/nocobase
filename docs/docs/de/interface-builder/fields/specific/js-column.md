:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# JS-Spalte

## Einführung

Die JS-Spalte wird in Tabellen für „benutzerdefinierte Spalten“ verwendet und rendert den Inhalt jeder Tabellenzelle mithilfe von JavaScript. Sie ist nicht an ein bestimmtes Feld gebunden und eignet sich daher ideal für abgeleitete Spalten, feldübergreifende kombinierte Anzeigen, Status-Badges, Schaltflächenaktionen und die Aggregation entfernter Daten.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## Laufzeit-Kontext-API

Beim Rendern jeder Zelle stellt die JS-Spalte die folgenden Kontext-APIs bereit:

- `ctx.element`: Der DOM-Container der aktuellen Zelle (ElementProxy), der `innerHTML`, `querySelector`, `addEventListener` usw. unterstützt.
- `ctx.record`: Das Datensatzobjekt der aktuellen Zeile (schreibgeschützt).
- `ctx.recordIndex`: Der Zeilenindex innerhalb der aktuellen Seite (beginnt bei 0, kann durch Paginierung beeinflusst werden).
- `ctx.collection`: Die Metadaten der an die Tabelle gebundenen Sammlung (schreibgeschützt).
- `ctx.requireAsync(url)`: Lädt eine AMD/UMD-Bibliothek asynchron über eine URL.
- `ctx.importAsync(url)`: Importiert ein ESM-Modul dynamisch über eine URL.
- `ctx.openView(options)`: Öffnet eine konfigurierte Ansicht (Modal/Drawer/Seite).
- `ctx.i18n.t()` / `ctx.t()`: Für die Internationalisierung.
- `ctx.onRefReady(ctx.ref, cb)`: Rendert, nachdem der Container bereit ist.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Integrierte Bibliotheken wie React, ReactDOM, Ant Design, Ant Design Icons und dayjs für JSX-Rendering und Datums-/Uhrzeit-Dienstprogramme. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` bleiben aus Kompatibilitätsgründen erhalten.)
- `ctx.render(vnode)`: Rendert ein React-Element/HTML/DOM in den Standardcontainer `ctx.element` (die aktuelle Zelle). Mehrere Render-Vorgänge verwenden das Root-Element wieder und überschreiben den vorhandenen Inhalt des Containers.

## Editor und Snippets

Der Skript-Editor für die JS-Spalte unterstützt Syntax-Hervorhebung, Fehlerhinweise und integrierte Code-Snippets.

- `Snippets`: Öffnet die Liste der integrierten Code-Snippets, die Sie durchsuchen und mit einem Klick an der aktuellen Cursorposition einfügen können.
- `Run`: Führt den aktuellen Code direkt aus. Das Ausführungsprotokoll wird im `Logs`-Panel unten ausgegeben und unterstützt `console.log/info/warn/error` sowie die Fehlerhervorhebung.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Sie können auch einen KI-Mitarbeiter verwenden, um Code zu generieren:

- [KI-Mitarbeiter · Nathan: Frontend-Ingenieur](/ai-employees/built-in/ai-coding)

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
  }}>Anzeigen</a>
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

- Es wird empfohlen, für das Laden externer Bibliotheken ein vertrauenswürdiges CDN zu verwenden und für Fehlerszenarien eine Fallback-Lösung bereitzustellen (z. B. `if (!lib) return;`).
- Es wird empfohlen, `class`- oder `[name=...]`-Selektoren anstelle fester `id`s zu verwenden, um doppelte `id`s in mehreren Blöcken oder Modals zu vermeiden.
- Ereignisbereinigung: Tabellenzeilen können sich dynamisch mit Paginierung oder Aktualisierung ändern, wodurch Zellen mehrmals gerendert werden. Sie sollten Ereignis-Listener vor dem Binden bereinigen oder deduplizieren, um wiederholte Auslöser zu vermeiden.
- Leistungstipp: Vermeiden Sie es, große Bibliotheken in jeder Zelle wiederholt zu laden. Cachen Sie die Bibliothek stattdessen auf einer höheren Ebene (z. B. über eine globale oder tabellenweite Variable) und verwenden Sie sie wieder.