:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# JS-Element

## Einführung

JS-Elemente werden in Formularen für „benutzerdefinierte Elemente“ verwendet (die nicht an ein Feld gebunden sind). Sie können JavaScript/JSX verwenden, um beliebige Inhalte (wie Hinweise, Statistiken, Vorschauen, Schaltflächen usw.) zu rendern und mit dem Formular- und Datensatzkontext zu interagieren. Dies eignet sich ideal für Szenarien wie Echtzeit-Vorschauen, Hinweistexte und kleine interaktive Komponenten.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## Laufzeit-Kontext-API (häufig verwendet)

- `ctx.element`: Der DOM-Container (ElementProxy) des aktuellen Elements, der `innerHTML`, `querySelector`, `addEventListener` usw. unterstützt.
- `ctx.form`: Die AntD Form-Instanz, die Operationen wie `getFieldValue / getFieldsValue / setFieldsValue / validateFields` usw. ermöglicht.
- `ctx.blockModel`: Das Modell des Formularblocks, zu dem es gehört, das auf `formValuesChange` hören kann, um Verknüpfungen zu implementieren.
- `ctx.record` / `ctx.collection`: Der aktuelle Datensatz und die Metadaten der **Sammlung** (in einigen Szenarien verfügbar).
- `ctx.requireAsync(url)`: Lädt eine AMD/UMD-Bibliothek asynchron über eine URL.
- `ctx.importAsync(url)`: Importiert ein ESM-Modul dynamisch über eine URL.
- `ctx.openView(viewUid, options)`: Öffnet eine konfigurierte Ansicht (Schublade/Dialog/Seite).
- `ctx.message` / `ctx.notification`: Globale Nachrichten und Benachrichtigungen.
- `ctx.t()` / `ctx.i18n.t()`: Internationalisierung.
- `ctx.onRefReady(ctx.ref, cb)`: Rendert, nachdem der Container bereit ist.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Integrierte Bibliotheken wie React, ReactDOM, Ant Design, Ant Design Icons und dayjs für JSX-Rendering und Datums-/Zeit-Dienstprogramme. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` bleiben aus Kompatibilitätsgründen erhalten.)
- `ctx.render(vnode)`: Rendert ein React-Element/HTML/DOM in den Standard-Container `ctx.element`. Mehrere Render-Vorgänge verwenden die Root wieder und überschreiben den vorhandenen Inhalt des Containers.

## Editor und Snippets

- `Snippets`: Öffnet eine Liste der integrierten Code-Snippets, die Sie suchen und mit einem Klick an der aktuellen Cursorposition einfügen können.
- `Run`: Führt den aktuellen Code direkt aus und gibt die Ausführungsprotokolle im unteren `Logs`-Panel aus. Es unterstützt `console.log/info/warn/error` und die Hervorhebung von Fehlern.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Kann zusammen mit dem KI-Mitarbeiter verwendet werden, um Skripte zu generieren/zu ändern: [KI-Mitarbeiter · Nathan: Frontend-Entwickler](/ai-employees/built-in/ai-coding)

## Häufige Anwendungsfälle (vereinfachte Beispiele)

### 1) Echtzeit-Vorschau (Lesen von Formularwerten)

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

### 2) Eine Ansicht öffnen (Schublade)

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

- Es wird empfohlen, für das Laden externer Bibliotheken vertrauenswürdige CDNs zu verwenden und für Fehlerfälle eine Fallback-Strategie zu implementieren (z. B. `if (!lib) return;`).
- Es wird empfohlen, für Selektoren `class` oder `[name=...]` zu bevorzugen und feste `id`s zu vermeiden, um doppelte `id`s in mehreren Blöcken/Popups zu verhindern.
- Ereignisbereinigung: Häufige Änderungen von Formularwerten lösen mehrere Render-Vorgänge aus. Vor dem Binden eines Ereignisses sollte dieses bereinigt oder dedupliziert werden (z. B. zuerst `remove` und dann `add`, oder `{ once: true }`, oder ein `dataset`-Attribut zur Vermeidung von Duplikaten verwenden).

## Verwandte Dokumentation

- [Variablen und Kontext](/interface-builder/variables)
- [Verknüpfungsregeln](/interface-builder/linkage-rule)
- [Ansichten und Popups](/interface-builder/actions/types/view)