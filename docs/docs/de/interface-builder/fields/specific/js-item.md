:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/interface-builder/fields/specific/js-item).
:::

# JS Item

## Einführung

JS Item wird für „Benutzerdefinierte Elemente“ in Formularen verwendet (keine Feldbindung). Sie können JavaScript/JSX verwenden, um beliebige Inhalte zu rendern (Hinweise, Statistiken, Vorschauen, Schaltflächen usw.) und mit dem Formular- und Datensatz-Kontext zu interagieren. Es eignet sich für Szenarien wie Echtzeit-Vorschauen, Erläuterungshinweise, kleine interaktive Komponenten und Ähnliches.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## Laufzeit-Kontext-API (häufig verwendet)

- `ctx.element`: DOM-Container des aktuellen Elements (ElementProxy), unterstützt `innerHTML`, `querySelector`, `addEventListener` usw.;
- `ctx.form`: AntD Form-Instanz, ermöglicht `getFieldValue / getFieldsValue / setFieldsValue / validateFields` usw.;
- `ctx.blockModel`: Modell des Formularblocks, in dem es sich befindet; kann `formValuesChange` überwachen, um Verknüpfungen zu implementieren;
- `ctx.record` / `ctx.collection`: Aktueller Datensatz und Metainformationen der **Sammlung** (in einigen Szenarien verfügbar);
- `ctx.requireAsync(url)`: Lädt AMD/UMD-Bibliotheken asynchron per URL;
- `ctx.importAsync(url)`: Importiert ESM-Module dynamisch per URL;
- `ctx.openView(viewUid, options)`: Öffnet eine konfigurierte Ansicht (Schublade/Dialog/Seite);
- `ctx.message` / `ctx.notification`: Globale Hinweise und Benachrichtigungen;
- `ctx.t()` / `ctx.i18n.t()`: Internationalisierung;
- `ctx.onRefReady(ctx.ref, cb)`: Rendert erst, wenn der Container bereit ist;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Integrierte Bibliotheken wie React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js für JSX-Rendering, Zeitverarbeitung, Datenoperationen und mathematische Berechnungen. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` bleiben zur Kompatibilität erhalten.)
- `ctx.render(vnode)`: Rendert React-Elemente/HTML/DOM in den Standard-Container `ctx.element`; bei mehrfachem Rendern wird die Root wiederverwendet und der vorhandene Inhalt des Containers überschrieben.

## Editor und Snippets

- `Snippets`: Öffnet eine Liste integrierter Code-Fragmente, die gesucht und mit einem Klick an der aktuellen Cursorposition eingefügt werden können.
- `Run`: Führt den aktuellen Code direkt aus und gibt die Protokolle im unteren Bereich `Logs` aus; unterstützt `console.log/info/warn/error` und Fehlerhervorhebung.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Kann mit KI-Mitarbeitern kombiniert werden, um Skripte zu erstellen/zu ändern: [KI-Mitarbeiter · Nathan: Frontend-Ingenieur](/ai-employees/features/built-in-employee)

## Häufige Verwendung (vereinfachte Beispiele)

### 1) Echtzeit-Vorschau (Formularwerte lesen)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Ansicht öffnen (Schublade)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) Externe Bibliotheken laden und rendern

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Hinweise

- Das Laden externer Bibliotheken sollte über vertrauenswürdige CDNs erfolgen; für Fehlerfälle sollten Rückfalloptionen vorgesehen werden (z. B. `if (!lib) return;`).
- Bei Selektoren sollten bevorzugt `class` oder `[name=...]` verwendet werden; vermeiden Sie feste `id`s, um doppelte `id`s in mehreren Blöcken/Popups zu verhindern.
- Ereignisbereinigung: Häufige Änderungen der Formularwerte lösen mehrfaches Rendern aus; vor dem Binden von Ereignissen sollten diese bereinigt oder dedupliziert werden (z. B. erst `remove`, dann `add`, oder `{ once: true }`, oder Markierung per `dataset` zur Vermeidung von Duplikaten).

## Verwandte Dokumentation

- [Variablen und Kontext](/interface-builder/variables)
- [Verknüpfungsregeln](/interface-builder/linkage-rule)
- [Ansichten und Popups](/interface-builder/actions/types/view)