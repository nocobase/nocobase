:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# JS Block

## Einführung

Der JS Block ist ein hochflexibler „benutzerdefinierter Rendering-Block“, der es Ihnen ermöglicht, JavaScript-Skripte direkt zu schreiben. Damit können Sie Oberflächen generieren, Ereignisse binden, Daten-APIs aufrufen oder Drittanbieter-Bibliotheken integrieren. Er eignet sich ideal für personalisierte Visualisierungen, temporäre Experimente und leichte Erweiterungen, die mit den integrierten Blöcken nur schwer umzusetzen wären.

## Laufzeit-Kontext API

Der Laufzeit-Kontext des JS Blocks verfügt über gängige, direkt nutzbare Funktionen:

- `ctx.element`: Der DOM-Container des Blocks (sicher gekapselt als ElementProxy), der `innerHTML`, `querySelector`, `addEventListener` usw. unterstützt.
- `ctx.requireAsync(url)`: Lädt eine AMD/UMD-Bibliothek asynchron über eine URL.
- `ctx.importAsync(url)`: Importiert ein ESM-Modul dynamisch über eine URL.
- `ctx.openView`: Öffnet eine konfigurierte Ansicht (Popup/Drawer/Seite).
- `ctx.useResource(...)` + `ctx.resource`: Greift auf Daten als Ressource zu.
- `ctx.i18n.t()` / `ctx.t()`: Integrierte Internationalisierungsfunktion.
- `ctx.onRefReady(ctx.ref, cb)`: Rendert, nachdem der Container bereit ist, um Timing-Probleme zu vermeiden.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Integrierte Bibliotheken wie React, ReactDOM, Ant Design, Ant Design Icons und dayjs für JSX-Rendering und Zeitverarbeitung. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` bleiben aus Kompatibilitätsgründen erhalten.)
- `ctx.render(vnode)`: Rendert ein React-Element, einen HTML-String oder einen DOM-Knoten in den Standard-Container `ctx.element`. Mehrere Aufrufe verwenden denselben React Root wieder und überschreiben den vorhandenen Inhalt des Containers.

## Block hinzufügen

Sie können einen JS Block zu einer Seite oder einem Popup hinzufügen.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Editor und Snippets

Der Skript-Editor des JS Blocks unterstützt Syntax-Hervorhebung, Fehlerhinweise und integrierte Code-Snippets. Damit können Sie schnell gängige Beispiele einfügen, wie das Rendern von Diagrammen, das Binden von Button-Ereignissen, das Laden externer Bibliotheken, das Rendern von React/Vue-Komponenten, Zeitachsen oder Informationskarten.

- `Snippets`: Öffnet die Liste der integrierten Code-Snippets. Sie können suchen und das ausgewählte Snippet mit einem Klick an der aktuellen Cursorposition in den Code-Editor einfügen.
- `Run`: Führt den Code im aktuellen Editor direkt aus und gibt die Ausführungsprotokolle in das `Logs`-Panel am unteren Rand aus. Es unterstützt die Anzeige von `console.log/info/warn/error`, wobei Fehler hervorgehoben und zu bestimmten Zeilen und Spalten navigiert werden können.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Zusätzlich können Sie in der oberen rechten Ecke des Editors direkt den KI-Mitarbeiter „Frontend-Ingenieur · Nathan“ aufrufen. Nathan kann Ihnen basierend auf dem aktuellen Kontext beim Schreiben oder Ändern von Skripten helfen. Mit einem Klick auf „Apply to editor“ können Sie die Änderungen im Editor anwenden und dann ausführen, um das Ergebnis zu sehen. Details finden Sie hier:

- [KI-Mitarbeiter · Nathan: Frontend-Ingenieur](/ai-employees/built-in/ai-coding)

## Laufzeitumgebung und Sicherheit

- **Container**: Das System stellt dem Skript einen sicheren DOM-Container `ctx.element` (ElementProxy) zur Verfügung, der nur den aktuellen Block beeinflusst und andere Bereiche der Seite nicht stört.
- **Sandbox**: Das Skript läuft in einer kontrollierten Umgebung. `window`/`document`/`navigator` verwenden sichere Proxy-Objekte, wodurch gängige APIs verfügbar sind, während riskante Verhaltensweisen eingeschränkt werden.
- **Neu-Rendering**: Der Block wird automatisch neu gerendert, wenn er ausgeblendet und dann wieder angezeigt wird (um eine erneute Ausführung des initialen Mount-Skripts zu vermeiden).

## Häufige Anwendungsfälle (vereinfachte Beispiele)

### 1) React (JSX) rendern

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Geklickt!'))}>
      {ctx.t('Klicken')}
    </Button>
  </div>
);
```

### 2) API-Anfrage-Vorlage

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Anfrage abgeschlossen'));
console.log(ctx.t('Antwortdaten:'), resp?.data);
```

### 3) ECharts laden und rendern

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) Eine Ansicht öffnen (Drawer)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Beispiel-Drawer'), size: 'large' });
```

### 5) Eine Ressource lesen und JSON rendern

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Hinweise

- Für das Laden externer Bibliotheken wird die Verwendung vertrauenswürdiger CDNs empfohlen.
- **Empfehlung zur Selektor-Nutzung**: Bevorzugen Sie `class`- oder `[name=...]`-Attributselektoren. Vermeiden Sie feste `id`s, um Konflikte durch doppelte `id`s in mehreren Blöcken/Popups zu verhindern, die zu Stil- oder Ereigniskonflikten führen könnten.
- **Ereignisbereinigung**: Da der Block mehrmals neu gerendert werden kann, sollten Ereignis-Listener vor dem Binden bereinigt oder dedupliziert werden, um mehrfache Auslösungen zu vermeiden. Sie können einen „Entfernen, dann Hinzufügen“-Ansatz, einen einmaligen Listener oder ein Flag zur Verhinderung von Duplikaten verwenden.

## Verwandte Dokumente

- [Variablen und Kontext](/interface-builder/variables)
- [Verknüpfungsregeln](/interface-builder/linkage-rule)
- [Ansichten und Popups](/interface-builder/actions/types/view)