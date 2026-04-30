---
title: "JSItem JS Item"
description: "JSItem JS Item: Eigene Aktionspunkte in der Aktionsleiste mit JavaScript/JSX rendern – mit React, ctx und Kontextverknüpfung zu Collection/Record/Form."
keywords: "JSItem,JS Item,Custom Action Item,JavaScript,Interface Builder,NocoBase"
---

# JS Item

## Einführung

JS Item dient dazu, in der Aktionsleiste einen „benutzerdefinierten Aktionspunkt" zu rendern. Sie können direkt JavaScript / JSX schreiben und beliebige UI ausgeben, z. B. Schaltflächen, Schaltflächengruppen, Dropdown-Menüs, Hinweistexte, Status-Tags oder kleine interaktive Komponenten. Innerhalb der Komponente können Sie APIs aufrufen, Popups öffnen, den aktuellen Datensatz lesen oder die Daten eines Blocks aktualisieren.

Es kann u. a. in Formular-Werkzeugleisten, Tabellen-Werkzeugleisten (Collection-Ebene) oder Tabellenzeilen-Aktionen (Record-Ebene) verwendet werden und eignet sich für folgende Szenarien:

- Wenn eine eigene Schaltflächenstruktur benötigt wird, anstatt nur ein Klick-Event an eine Schaltfläche zu binden;
- Wenn mehrere Aktionen zu einer Schaltflächengruppe oder einem Dropdown-Menü kombiniert werden sollen;
- Wenn in der Aktionsleiste Echtzeit-Status, Statistiken oder Erläuterungen angezeigt werden sollen;
- Wenn unterschiedliche Inhalte je nach aktuellem Datensatz, Auswahl oder Formularwerten dynamisch gerendert werden sollen.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM%20(1).png)

## Unterschied zu JS Action

- `JS Action`: Eher geeignet für „nach Klick auf eine Schaltfläche ein Skript ausführen" – Schwerpunkt liegt auf der Verhaltenslogik.
- `JS Item`: Eher geeignet für „einen eigenen Aktionspunkt selbst rendern" – sowohl Oberfläche als auch Interaktionslogik werden gesteuert.

Wenn Sie nur eine Klick-Logik zu einer bestehenden Schaltfläche ergänzen möchten, verwenden Sie bevorzugt `JS Action`. Wenn Sie die UI-Struktur eines Aktionspunkts selbst gestalten oder mehrere Steuerelemente rendern möchten, verwenden Sie bevorzugt `JS Item`.

## Laufzeit-Kontext-API (häufig genutzt)

Zur Laufzeit von JS Item werden gängige Funktionen injiziert, die Sie direkt im Skript verwenden können:

- `ctx.render(vnode)`: Rendert ein React-Element, einen HTML-String oder einen DOM-Knoten in den Container des aktuellen Aktionspunkts;
- `ctx.element`: DOM-Container des aktuellen Aktionspunkts (ElementProxy);
- `ctx.api.request(options)`: HTTP-Anfrage senden;
- `ctx.openView(viewUid, options)`: Eine konfigurierte Ansicht öffnen (Drawer / Dialog / Seite);
- `ctx.message` / `ctx.notification`: Globale Hinweise und Benachrichtigungen;
- `ctx.t()` / `ctx.i18n.t()`: Internationalisierung;
- `ctx.resource`: Die Datenresource des Collection-Kontexts, z. B. Auslesen ausgewählter Datensätze, Aktualisieren der Liste;
- `ctx.record`: Der aktuelle Zeilendatensatz im Record-Kontext;
- `ctx.form`: Die AntD-Form-Instanz im Formular-Kontext;
- `ctx.blockModel` / `ctx.collection`: Metainformationen zum aktuellen Block und zur Collection;
- `ctx.requireAsync(url)`: Eine AMD-/UMD-Bibliothek per URL asynchron laden;
- `ctx.importAsync(url)`: Ein ESM-Modul per URL dynamisch importieren;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Eingebaute, häufig benötigte Bibliotheken, direkt verwendbar für JSX-Rendering, Zeitverarbeitung, Datenverarbeitung und Mathematik.

> Welche Variablen tatsächlich verfügbar sind, hängt von der Position des Aktionspunkts ab. Beispielsweise stehen bei Tabellenzeilen-Aktionen üblicherweise `ctx.record`, in Formular-Werkzeugleisten `ctx.form` und in Tabellen-Werkzeugleisten `ctx.resource` zur Verfügung.

## Editor und Snippets

- `Snippets`: Öffnet die Liste der eingebauten Code-Snippets, die durchsucht und mit einem Klick an der Cursorposition eingefügt werden können.
- `Run`: Führt den aktuellen Code direkt aus und gibt die Logs im unteren `Logs`-Panel aus; unterstützt `console.log/info/warn/error` sowie eine Hervorhebung der Fehlerstelle.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM.png)

- Kann mit KI-Mitarbeitern zur Generierung / Bearbeitung von Skripten kombiniert werden: [KI-Mitarbeiter · Nathan: Frontend-Engineer](/ai-employees/features/built-in-employee)

## Häufige Verwendungen (kompakte Beispiele)

### 1) Eine einfache Schaltfläche rendern

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      type="primary"
      onClick={() => ctx.message.success(ctx.t('Click from JS item'))}
    >
      {ctx.t('JS item')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 2) Collection-Aktion: Schaltfläche und Dropdown-Menü kombinieren

```js
const { Space, Button, Dropdown } = ctx.libs.antd;
const { EllipsisOutlined } = ctx.libs.antdIcons;

function JsItem() {
  const items = [
    { key: 'export', label: ctx.t('Export selected') },
    { key: 'refresh', label: ctx.t('Refresh data') },
  ];

  const onMenuClick = async ({ key }) => {
    if (key === 'export') {
      const rows = ctx.resource?.getSelectedRows?.() || [];
      if (!rows.length) {
        ctx.message.warning(ctx.t('Please select records'));
        return;
      }
      ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
      return;
    }

    if (key === 'refresh') {
      await ctx.resource?.refresh?.();
      ctx.message.success(ctx.t('Refreshed'));
    }
  };

  return (
    <Space.Compact>
      <Button>{ctx.t('Actions')}</Button>
      <Dropdown menu={{ items, onClick: onMenuClick }} placement="bottomRight">
        <Button icon={<EllipsisOutlined />} />
      </Dropdown>
    </Space.Compact>
  );
}

ctx.render(<JsItem />);
```

### 3) Record-Aktion: Eine Ansicht basierend auf der aktuellen Zeile öffnen

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      onClick={async () => {
        // Open a view as drawer and pass arguments at top-level
        const popupUid = `${ctx.model.uid}-details`;
        await ctx.openView(popupUid, {
          mode: 'drawer',
          title: ctx.t('Details'),
          size: 'large',
        });
      }}
    >
      {ctx.t('Open')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 4) Eigene Statusinhalte rendern

```js
const { Tag } = ctx.libs.antd;

function JsItem() {
  const count = ctx.resource?.getSelectedRows?.()?.length || 0;

  return (
    <Tag color={count ? 'processing' : 'default'}>
      Selected: {count}
    </Tag>
  );
}

ctx.render(<JsItem />);
```

## Hinweis

- Wenn nur „nach Klick eine Logik ausführen" benötigt wird, verwenden Sie bevorzugt `JS Action`, da die Implementierung direkter ist.
- Versehen Sie API-Aufrufe mit `try/catch` und Benutzerhinweisen, um stille Fehler zu vermeiden.
- Bei Verknüpfungen mit Tabellen, Listen oder Popups können Sie nach erfolgreichem Speichern über `ctx.resource?.refresh?.()` oder die Resource des aktuellen Blocks die Daten gezielt aktualisieren.
- Beim Einsatz externer Bibliotheken empfiehlt sich das Laden über vertrauenswürdige CDNs sowie eine Fallback-Behandlung bei Ladefehlern.

## Verwandte Dokumente

- [Variablen und Kontext](/interface-builder/variables)
- [Verknüpfungsregeln](/interface-builder/linkage-rule)
- [Ansicht und Popup](/interface-builder/actions/types/view)
- [JS Action](/interface-builder/actions/types/js-action)
