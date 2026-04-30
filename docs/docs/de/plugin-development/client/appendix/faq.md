---
title: "Häufige Fragen & Troubleshooting-Leitfaden"
description: "Häufige Fragen bei der NocoBase Client-Plugin-Entwicklung: Plugin wird nicht angezeigt, Block erscheint nicht, Übersetzung wirkungslos, Route nicht gefunden, Hot-Reload greift nicht, Build-Fehler, Startfehler nach Deployment usw."
keywords: "FAQ,häufige Fragen,Troubleshooting-Leitfaden,Troubleshooting,NocoBase,Build,Deployment,tar,axios"
---

# Häufige Fragen & Troubleshooting-Leitfaden

Hier sind häufige Stolpersteine bei der Client-Plugin-Entwicklung gesammelt. Wenn Sie auf eine Situation stoßen, in der „alles richtig geschrieben ist, aber nicht funktioniert", schauen Sie zuerst hier nach.

## Plugin-bezogen

### Nach dem Erstellen ist das Plugin im Manager nicht sichtbar

Stellen Sie sicher, dass `yarn pm create` ausgeführt wurde und nicht das Verzeichnis manuell erstellt. `yarn pm create` erzeugt nicht nur Dateien, sondern registriert das Plugin auch in der Datenbanktabelle `applicationPlugins`. Falls das Verzeichnis manuell erstellt wurde, können Sie mit `yarn nocobase upgrade` einen erneuten Scan ausführen.

### Nach dem Aktivieren des Plugins ändert sich auf der Seite nichts

Prüfen Sie in dieser Reihenfolge:

1. Bestätigen Sie, dass `yarn pm enable <pluginName>` ausgeführt wurde
2. Aktualisieren Sie den Browser (manchmal ist ein erzwungenes Aktualisieren nötig: `Ctrl+Shift+R`)
3. Prüfen Sie die Browser-Konsole auf Fehler

### Nach Codeänderungen wird die Seite nicht aktualisiert

Verschiedene Dateitypen verhalten sich beim Hot-Reload unterschiedlich:

| Dateityp | Nach der Änderung erforderlich |
| --- | --- |
| tsx/ts unter `src/client-v2/` | Automatischer Hot-Reload, keine Aktion nötig |
| Übersetzungsdateien unter `src/locale/` | **Anwendung neu starten** |
| Neu hinzugefügte oder geänderte Collection unter `src/server/collections/` | `yarn nocobase upgrade` ausführen |

Wenn Client-Code geändert wurde, aber kein Hot-Reload erfolgt, versuchen Sie zunächst, den Browser zu aktualisieren.

## Routen-bezogen

### Die registrierte Seitenroute ist nicht erreichbar

Die Routen von NocoBase v2 erhalten standardmäßig das Präfix `/v2`. Wenn Sie z. B. `path: '/hello'` registriert haben, ist die tatsächliche Adresse `/v2/hello`:

```ts
this.router.add('hello', {
  path: '/hello', // Tatsächlicher Aufruf -> /v2/hello
  componentLoader: () => import('./pages/HelloPage'),
});
```

Details siehe [Router](../router).

### Die Plugin-Einstellungsseite ist beim Anklicken leer

Wenn das Menü zur Einstellungsseite erscheint, aber der Inhalt leer ist, gibt es üblicherweise zwei Ursachen:

**Ursache 1: v1-Client verwendet `componentLoader`**

`componentLoader` ist die Schreibweise von client-v2; im v1-Client muss `Component` mit dem direkten Component-Verweis verwendet werden:

```ts
// ❌ v1-Client unterstützt componentLoader nicht
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  componentLoader: () => import('./pages/MyPage'),
});

// ✅ v1-Client verwendet Component
import MyPage from './pages/MyPage';
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  Component: MyPage,
});
```

**Ursache 2: Das Seiten-Component wurde nicht mit `export default` exportiert**

`componentLoader` benötigt einen Default-Export aus dem Modul; fehlt `default`, kann es nicht geladen werden.

## Block-bezogen

### Der benutzerdefinierte Block ist im Menü „Block hinzufügen" nicht sichtbar

Stellen Sie sicher, dass das Modell in `load()` registriert wurde:

```ts
this.flowEngine.registerModelLoaders({
  MyBlockModel: {
    loader: () => import('./models/MyBlockModel'),
  },
});
```

Wenn `registerModels` (nicht-Lazy-Loading-Schreibweise) verwendet wird, stellen Sie sicher, dass das Modell in `models/index.ts` korrekt exportiert wurde.

### Nach dem Hinzufügen des Blocks erscheint die Tabelle nicht in der Datentabellen-Auswahlliste

Tabellen, die mit `defineCollection` definiert werden, sind serverseitige interne Tabellen und erscheinen standardmäßig nicht in der UI-Datentabellenliste.

**Empfohlene Vorgehensweise**: Fügen Sie die entsprechende Datentabelle in der „[Datenquellen-Verwaltung](../../../data-sources/data-source-main/index.md)" der NocoBase-Oberfläche hinzu, konfigurieren Sie Felder und Interface-Typen, dann erscheint die Tabelle automatisch in der Datentabellen-Auswahlliste eines Blocks.

Wenn die Registrierung tatsächlich im Plugin-Code nötig ist (z. B. in einem Demo-Plugin-Szenario), können Sie sie über `addCollection` manuell registrieren — Details siehe [Ein Frontend-Backend-Datenmanagement-Plugin erstellen](../examples/fullstack-plugin). Hinweis: Die Registrierung muss über das `eventBus`-Muster erfolgen und kann nicht direkt in `load()` aufgerufen werden — `ensureLoaded()` läuft nach `load()` und leert und setzt alle Collections neu.

### Der benutzerdefinierte Block soll nur an eine bestimmte Datentabelle gebunden werden

Überschreiben Sie `static filterCollection` im Modell; nur Collections, für die `true` zurückgegeben wird, erscheinen in der Auswahlliste:

```ts
export class MyBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'myTable';
  }
}
```

## Feld-bezogen

### Das benutzerdefinierte Feld-Component ist im Dropdown „Feld-Component" nicht sichtbar

Prüfen Sie in dieser Reihenfolge:

1. Stellen Sie sicher, dass `DisplayItemModel.bindModelToInterface('ModelName', ['input'])` aufgerufen wurde und der Interface-Typ passt — z. B. entspricht `input` einzeiligen Textfeldern, `checkbox` Kontrollkästchen
2. Stellen Sie sicher, dass das Modell in `load()` registriert wurde (`registerModels` oder `registerModelLoaders`)
3. Stellen Sie sicher, dass das Feld-Modell `define({ label })` aufgerufen hat

### Im Dropdown „Feld-Component" wird der Klassenname angezeigt

Sie haben vergessen, `define({ label })` im Feld-Modell aufzurufen — fügen Sie es hinzu:

```ts
MyFieldModel.define({
  label: tExpr('My field'),
});
```

Stellen Sie außerdem sicher, dass die entsprechenden Schlüssel in den Übersetzungsdateien unter `src/locale/` vorhanden sind, sonst wird in der chinesischen Umgebung weiterhin der englische Originaltext angezeigt.

## Aktions-bezogen

### Der benutzerdefinierte Aktionsbutton ist unter „Aktion konfigurieren" nicht sichtbar

Stellen Sie sicher, dass im Modell der richtige `static scene` gesetzt wurde:

| Wert | Erscheinungsort |
| --- | --- |
| `ActionSceneEnum.collection` | Aktionsleiste oben im Block (z. B. neben dem „Neu"-Button) |
| `ActionSceneEnum.record` | Aktionsspalte jeder Tabellenzeile (z. B. neben „Bearbeiten" und „Löschen") |
| `ActionSceneEnum.both` | Erscheint in beiden Szenarien |

### Der Aktionsbutton reagiert nicht auf Klicks

Stellen Sie sicher, dass `on` in `registerFlow` auf `'click'` gesetzt ist:

```ts
MyActionModel.registerFlow({
  key: 'myFlow',
  on: 'click', // Auf den Button-Klick hören
  steps: {
    doSomething: {
      async handler(ctx) {
        // Ihre Logik
      },
    },
  },
});
```

:::warning Hinweis

Das `uiSchema` in `registerFlow` ist die UI des Konfigurationspanels (Konfigurationsmodus), nicht ein Modal zur Laufzeit. Wenn Sie nach dem Klick auf den Button ein Formular-Modal anzeigen möchten, sollten Sie im `handler` mit `ctx.viewer.dialog()` ein Modal öffnen.

:::

## Internationalisierungs-bezogen

### Übersetzung greift nicht

Häufigste Ursachen:

- **Beim erstmaligen Hinzufügen** des Verzeichnisses oder der Dateien `src/locale/` muss die Anwendung neu gestartet werden
- **Übersetzungsschlüssel sind nicht identisch** — der Schlüssel und die Zeichenkette im Code müssen exakt übereinstimmen, einschließlich Leerzeichen und Groß-/Kleinschreibung
- **Im Component wurde direkt `ctx.t()` verwendet** — `ctx.t()` fügt den Plugin-Namespace nicht automatisch ein; im Component sollte stattdessen der `useT()`-Hook (Import aus `locale.ts`) verwendet werden

### `tExpr()`, `useT()` und `this.t()` im falschen Szenario verwendet

Diese drei Übersetzungsmethoden haben unterschiedliche Anwendungsbereiche; bei falscher Verwendung gibt es Fehler oder die Übersetzung greift nicht:

| Methode | Wo verwenden | Hinweis |
| --- | --- | --- |
| `tExpr()` | `define()`, `registerFlow()` und andere statische Definitionen | Beim Laden des Moduls ist i18n noch nicht initialisiert, daher verzögerte Übersetzung verwenden |
| `useT()` | Innerhalb von React-Components | Gibt eine Übersetzungsfunktion zurück, die an den Plugin-Namespace gebunden ist |
| `this.t()` | In Plugin `load()` | Fügt automatisch den Plugin-Paketnamen als Namespace ein |

Details siehe [i18n Internationalisierung](../component/i18n).

## API-Anfragen-bezogen

### Anfrage gibt 403 Forbidden zurück

In der Regel ist die ACL auf der Server-Seite nicht konfiguriert. Wenn Ihre Collection beispielsweise `todoItems` heißt, müssen Sie in `load()` des serverseitigen Plugins die entsprechenden Operationen erlauben:

```ts
// Nur Abfragen erlauben
this.app.acl.allow('todoItems', ['list', 'get'], 'loggedIn');

// Vollständige CRUD-Operationen erlauben
this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
```

`'loggedIn'` bedeutet, dass eingeloggte Benutzer Zugriff haben. Ohne `acl.allow` kann standardmäßig nur ein Administrator Operationen ausführen.

### Anfrage gibt 404 Not Found zurück

Prüfen Sie in dieser Reihenfolge:

- Bei Verwendung von `defineCollection`: Stellen Sie sicher, dass der Collection-Name korrekt geschrieben ist
- Bei Verwendung von `resourceManager.define`: Stellen Sie sicher, dass Resource-Name und Action-Name korrekt sind
- Prüfen Sie das Format der Anfrage-URL — das API-Format von NocoBase ist `resourceName:actionName`, z. B. `todoItems:list`, `externalApi:get`

## Build- und Deployment-bezogen

### `yarn build --tar` meldet „no paths specified to add to archive"

Beim Ausführen von `yarn build <pluginName> --tar` tritt der Fehler auf:

```bash
TypeError: no paths specified to add to archive
```

Während `yarn build <pluginName>` (ohne `--tar`) normal funktioniert.

Diese Fehler treten in der Regel auf, weil das `.npmignore` des Plugins **Negationssyntax** verwendet (das `!`-Präfix von npm). Beim Packen mit `--tar` liest NocoBase jede Zeile von `.npmignore` und stellt ihr ein `!` voran, um sie in ein `fast-glob`-Ausschlussmuster zu konvertieren. Wenn Ihr `.npmignore` bereits Negationssyntax verwendet, beispielsweise:

```
*
!dist
!package.json
```

Wird daraus nach der Verarbeitung `['!*', '!!dist', '!!package.json', '**/*']`. Dabei schließt `!*` alle Dateien auf der obersten Ebene aus (einschließlich `package.json`), und `!!dist` wird von `fast-glob` nicht als „dist erneut einschließen" erkannt — die Negation wird unwirksam. Falls das Verzeichnis `dist/` zufällig leer ist oder der Build keine Dateien produziert hat, ist die endgültig gesammelte Dateiliste leer und `tar` wirft diesen Fehler.

**Lösung:** Verwenden Sie keine Negationssyntax in `.npmignore`, sondern listen Sie nur die auszuschließenden Verzeichnisse auf:

```
/node_modules
/src
```

Die Pack-Logik wandelt diese in Ausschlussmuster um (`!./node_modules`, `!./src`) und ergänzt `**/*`, um alle anderen Dateien zu erfassen. Diese Schreibweise ist einfach und vermeidet das Problem mit der Negation.

### Plugin lässt sich nach Upload in die Produktionsumgebung nicht aktivieren (lokal funktioniert es)

Das Plugin funktioniert lokal in der Entwicklung problemlos, lässt sich aber nach dem Hochladen über den „Plugin-Manager" in die Produktionsumgebung nicht aktivieren. In den Logs erscheinen ähnliche Fehler:

```bash
TypeError: Cannot assign to read only property 'constructor' of object '[object Object]'
```

Dieses Problem entsteht in der Regel dadurch, dass das **Plugin eingebaute Abhängigkeiten von NocoBase in seinem eigenen `node_modules/` mitgepackt hat**. Das Build-System von NocoBase pflegt eine [external-Liste](../../dependency-management) — die darin enthaltenen Pakete (z. B. `react`, `antd`, `axios`, `lodash` usw.) werden vom NocoBase-Host bereitgestellt und sollten nicht ins Plugin gepackt werden. Wenn das Plugin eine private Kopie mitbringt, kann es zur Laufzeit zu Konflikten mit der bereits geladenen Version des Hosts kommen, die zu allerhand seltsamen Fehlern führen.

**Warum es lokal kein Problem gibt:** Bei lokaler Entwicklung liegt das Plugin im Verzeichnis `packages/plugins/` und hat kein privates `node_modules/`; Abhängigkeiten werden auf die im Projekt-Stamm bereits geladenen Versionen aufgelöst, sodass kein Konflikt entsteht.

**Lösung:** Verschieben Sie alle `dependencies` in der `package.json` des Plugins in `devDependencies` — das Build-System von NocoBase verarbeitet die Abhängigkeiten des Plugins automatisch:

```diff
{
- "dependencies": {
-   "axios": "1.7.7"
- },
+ "devDependencies": {
+   "axios": "1.7.7"
+ },
}
```

Dann erneut bauen und packen. Das `dist/node_modules/` des Plugins enthält diese Pakete dann nicht mehr, zur Laufzeit wird die vom NocoBase-Host bereitgestellte Version verwendet.

:::tip Allgemeine Regel

Das Build-System von NocoBase pflegt eine [external-Liste](../../dependency-management) — die darin enthaltenen Pakete (z. B. `react`, `antd`, `axios`, `lodash` usw.) werden vom NocoBase-Host bereitgestellt, das Plugin sollte sie nicht selbst packen. Alle Abhängigkeiten des Plugins gehören in `devDependencies`; das Build-System entscheidet automatisch, welche in `dist/node_modules/` gepackt werden müssen und welche vom Host bereitgestellt werden.

:::

## Verwandte Links

- [Plugin](../plugin) — Plugin-Einstiegspunkt und Lebenszyklus
- [Router](../router) — Routen-Registrierung und `/v2`-Präfix
- [FlowEngine-Übersicht](../flow-engine/index.md) — Grundlegende Verwendung von FlowModel
- [FlowEngine → Block-Erweiterung](../flow-engine/block) — BlockModel, TableBlockModel, filterCollection
- [FlowEngine → Feld-Erweiterung](../flow-engine/field) — FieldModel, bindModelToInterface
- [FlowEngine → Aktions-Erweiterung](../flow-engine/action) — ActionModel, ActionSceneEnum
- [i18n Internationalisierung](../component/i18n) — Übersetzungsdateien, useT, tExpr-Verwendung
- [Context → Häufige Fähigkeiten](../ctx/common-capabilities) — ctx.api, ctx.viewer usw.
- [Server → Collections](../../server/collections) — defineCollection und addCollection
- [Server → ACL](../../server/acl) — Schnittstellen-Berechtigungskonfiguration
- [Plugin-Build](../../build) — Build-Konfiguration, external-Liste, Pack-Prozess
