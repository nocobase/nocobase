:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# JS Action

## Einführung

JS Action wird verwendet, um JavaScript auszuführen, wenn ein Button geklickt wird, und ermöglicht es Ihnen, beliebige Geschäftslogik anzupassen. Sie können es in Formular-Toolbars, Tabellen-Toolbars (auf Sammlungsebene), Tabellenzeilen (auf Datensatzebene) und an ähnlichen Orten einsetzen. Damit können Sie Operationen wie Validierungen, Benachrichtigungen, API-Aufrufe, das Öffnen von Pop-ups/Drawern und das Aktualisieren von Daten durchführen.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## Laufzeit-Kontext-API (Häufig verwendet)

- `ctx.api.request(options)`: Sendet eine HTTP-Anfrage.
- `ctx.openView(viewUid, options)`: Öffnet eine konfigurierte Ansicht (Drawer/Dialog/Seite).
- `ctx.message` / `ctx.notification`: Globale Meldungen und Benachrichtigungen.
- `ctx.t()` / `ctx.i18n.t()`: Internationalisierung.
- `ctx.resource`: Die Datenressource für den Kontext auf Sammlungsebene (z. B. Tabellen-Toolbar), einschließlich Methoden wie `getSelectedRows()` und `refresh()`.
- `ctx.record`: Der aktuelle Datensatz der Zeile für den Kontext auf Datensatzebene (z. B. Tabellenzeilen-Button).
- `ctx.form`: Die AntD Form-Instanz für den Kontext auf Formularebene (z. B. Formular-Toolbar-Button).
- `ctx.collection`: Metainformationen der aktuellen Sammlung.
- Der Code-Editor unterstützt `Snippets` und die `Run`-Funktion zur Vorab-Ausführung (siehe unten).

- `ctx.requireAsync(url)`: Lädt eine AMD/UMD-Bibliothek asynchron über eine URL.
- `ctx.importAsync(url)`: Importiert ein ESM-Modul dynamisch über eine URL.

> Die tatsächlich verfügbaren Variablen können je nach Position des Buttons variieren. Die obige Liste bietet einen Überblick über die gängigsten Funktionen.

## Editor und Snippets

- `Snippets`: Öffnet eine Liste integrierter Code-Snippets, die Sie durchsuchen und mit einem Klick an der aktuellen Cursorposition einfügen können.
- `Run`: Führt den aktuellen Code direkt aus und gibt die Ausführungsprotokolle im unteren `Logs`-Panel aus. Es unterstützt `console.log/info/warn/error` und hebt Fehler zur einfachen Lokalisierung hervor.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Sie können KI-Mitarbeiter nutzen, um Skripte zu generieren/zu ändern: [KI-Mitarbeiter · Nathan: Frontend-Ingenieur](/ai-employees/built-in/ai-coding)

## Häufige Anwendungsfälle (Vereinfachte Beispiele)

### 1) API-Anfrage und Benachrichtigung

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Sammlung-Button: Auswahl validieren und verarbeiten

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Geschäftslogik implementieren…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Datensatz-Button: Aktuellen Zeilendatensatz lesen

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Ansicht öffnen (Drawer/Dialog)

```js
const popupUid = ctx.model.uid + '-open'; // Für Stabilität an den aktuellen Button binden
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Daten nach dem Absenden aktualisieren

```js
// Allgemeine Aktualisierung: Priorisiert Tabellen-/Listenressourcen, dann die Ressource des Blocks, der das Formular enthält
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## Hinweise

- **Idempotente Aktionen**: Um mehrfache Übermittlungen durch wiederholtes Klicken zu vermeiden, können Sie in Ihrer Logik einen Status-Schalter hinzufügen oder den Button deaktivieren.
- **Fehlerbehandlung**: Fügen Sie `try/catch`-Blöcke für API-Aufrufe hinzu und geben Sie benutzerfreundliche Rückmeldungen.
- **Ansichtsinteraktion**: Beim Öffnen eines Pop-ups/Drawers mit `ctx.openView` wird empfohlen, Parameter explizit zu übergeben und bei Bedarf die übergeordnete Ressource nach erfolgreicher Übermittlung aktiv zu aktualisieren.

## Verwandte Dokumente

- [Variablen und Kontext](/interface-builder/variables)
- [Verknüpfungsregeln](/interface-builder/linkage-rule)
- [Ansichten und Pop-ups](/interface-builder/actions/types/view)