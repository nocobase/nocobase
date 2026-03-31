---
pkg: '@nocobase/plugin-workflow-javascript'
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/workflow/nodes/javascript).
:::

# JavaScript-Skript

## Einführung

Der JavaScript-Skript-Knoten ermöglicht es Ihnen, ein benutzerdefiniertes serverseitiges JavaScript-Skript innerhalb eines **Workflows** auszuführen. Das Skript kann Variablen aus vorgelagerten Schritten des **Workflows** als Parameter verwenden, und sein Rückgabewert kann nachgelagerten Knoten zur Verfügung gestellt werden.

Das Skript wird in einem Worker-Thread auf dem Server der NocoBase-Anwendung ausgeführt. Standardmäßig verwendet es eine sichere Sandbox (isolated-vm), die weder `require` noch Node.js-Built-in-APIs unterstützt. Details dazu finden Sie unter [Ausführungs-Engine](#ausführungs-engine) und [Funktionsliste](#funktionsliste).

## Knoten erstellen

In der **Workflow**-Konfigurationsoberfläche klicken Sie auf das Plus-Symbol („+“) im Ablauf, um einen „JavaScript“-Knoten hinzuzufügen:

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Knotenkonfiguration

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parameter

Hierüber übergeben Sie Variablen oder statische Werte aus dem **Workflow**-Kontext an das Skript, damit diese in der Skriptlogik verwendet werden können. `name` ist der Parametername, der nach der Übergabe an das Skript als Variablenname dient. `value` ist der Parameterwert; Sie können hier eine Variable auswählen oder einen konstanten Wert eingeben.

### Skriptinhalt

Der Skriptinhalt kann als Funktion betrachtet werden. Sie können beliebigen JavaScript-Code schreiben, der in der Node.js-Umgebung unterstützt wird, und mit der `return`-Anweisung einen Wert als Ergebnis der Knotenausführung zurückgeben. Dieser Wert kann dann von nachfolgenden Knoten als Variable verwendet werden.

Nachdem Sie den Code geschrieben haben, können Sie über die Schaltfläche „Testen“ unterhalb des Editors einen Dialog zur Testausführung öffnen. Dort können Sie Parameter mit statischen Werten belegen, um eine simulierte Ausführung durchzuführen. Nach der Ausführung sehen Sie im Dialog den Rückgabewert und den Inhalt der Ausgabe (Logs).

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Timeout-Einstellung

Die Einheit sind Millisekunden. Ein Wert von `0` bedeutet, dass kein Timeout festgelegt wird.

### **Workflow** bei Fehler fortsetzen

Wenn diese Option aktiviert ist, werden nachfolgende Knoten auch dann ausgeführt, wenn das Skript einen Fehler aufweist oder ein Timeout auftritt.

:::info{title="Hinweis"}
Wenn das Skript fehlerhaft ist, gibt es keinen Rückgabewert. Das Ergebnis des Knotens wird stattdessen mit der Fehlermeldung gefüllt. Falls nachfolgende Knoten die Ergebnisvariable des Skriptknotens verwenden, ist hier Vorsicht geboten.
:::

## Ausführungs-Engine

Der JavaScript-Skript-Knoten unterstützt zwei Ausführungs-Engines, die automatisch anhand der Konfiguration der Umgebungsvariable `WORKFLOW_SCRIPT_MODULES` ausgewählt werden:

### Sicherer Modus (Standard)

Wenn `WORKFLOW_SCRIPT_MODULES` **nicht konfiguriert** ist, werden Skripte mit der [isolated-vm](https://github.com/laverdet/isolated-vm)-Engine ausgeführt. Diese Engine führt Code in einer isolierten V8-Umgebung mit folgenden Eigenschaften aus:

- `require` wird **nicht unterstützt** — es können keine Module importiert werden
- Node.js-Built-in-APIs (wie `process`, `Buffer`, `global` usw.) werden **nicht unterstützt**
- Es stehen nur ECMAScript-Standardobjekte zur Verfügung (wie `JSON`, `Math`, `Promise`, `Date` usw.)
- Die Übergabe von Daten über Parameter, `console` für Logging sowie `async`/`await` werden unterstützt

Dies ist der empfohlene Standardmodus, geeignet für reine Berechnungs- und Datenverarbeitungslogik, und bietet das höchste Maß an Sicherheitsisolierung.

### Unsicherer Modus (Modulunterstützung)

Wenn `WORKFLOW_SCRIPT_MODULES` **konfiguriert ist**, wechseln Skripte zur integrierten Node.js-`vm`-Engine, um die `require`-Funktionalität zu ermöglichen.

:::warning{title="Sicherheitswarnung"}
Im unsicheren Modus werden Skripte zwar in einer `vm`-Sandbox mit eingeschränkter Modul-Whitelist ausgeführt, jedoch ist das Node.js-`vm`-Modul kein sicherer Sandbox-Mechanismus. Die Aktivierung dieses Modus bedeutet, dass allen Benutzern vertraut wird, die die Berechtigung zum Bearbeiten von Workflow-Skripten haben. Administratoren sollten die Sicherheitsrisiken eigenständig bewerten und die Modul-Whitelist sowie die Berechtigungen zur Workflow-Bearbeitung streng kontrollieren.
:::

Module können im Skript konsistent mit CommonJS verwendet werden. Module werden im Code mit der `require()`-Anweisung importiert.

Es werden native Node.js-Module und in `node_modules` installierte Module (einschließlich der von NocoBase bereits verwendeten Abhängigkeitspakete) unterstützt. Module, die dem Code zur Verfügung stehen sollen, müssen in der Umgebungsvariable `WORKFLOW_SCRIPT_MODULES` der Anwendung deklariert werden. Mehrere Paketnamen werden durch Kommas getrennt, zum Beispiel:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Hinweis"}
Module, die nicht in der Umgebungsvariable `WORKFLOW_SCRIPT_MODULES` deklariert sind, können im Skript **nicht** verwendet werden, selbst wenn sie nativ in Node.js vorhanden oder bereits in `node_modules` installiert sind. Diese Richtlinie kann auf Betriebsebene genutzt werden, um die Liste der für Benutzer verfügbaren Module zu steuern und in bestimmten Szenarien zu verhindern, dass Skripte übermäßige Berechtigungen erhalten.
:::

In einer Umgebung, die nicht aus dem Quellcode bereitgestellt wird, können Sie ein benötigtes Modul, das nicht in `node_modules` installiert ist, manuell in das `storage`-Verzeichnis installieren. Wenn Sie beispielsweise das `exceljs`-Paket verwenden möchten, können Sie die folgenden Schritte ausführen:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Fügen Sie dann den relativen (oder absoluten) Pfad des Pakets, basierend auf dem CWD (aktuellen Arbeitsverzeichnis) der Anwendung, zur Umgebungsvariable `WORKFLOW_SCRIPT_MODULES` hinzu:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Anschließend können Sie das `exceljs`-Paket in Ihrem Skript verwenden (der in `require` verwendete Name muss exakt mit dem in der Umgebungsvariable definierten übereinstimmen):

```js
const ExcelJS = require('./storage/node_modules/exceljs');
// ...
```

## Funktionsliste

### Node.js-Version

Entspricht der Node.js-Version, mit der die Hauptanwendung ausgeführt wird.

### Globale Variablen

Globale Variablen wie `global`, `process`, `__dirname` und `__filename` werden **nicht unterstützt**.

```js
console.log(global); // will throw error: "global is not defined"
```

### Übergebene Parameter

Die im Knoten konfigurierten Parameter werden als globale Variablen im Skript verfügbar und können direkt verwendet werden. An das Skript übergebene Parameter unterstützen nur primitive Typen wie `boolean`, `number`, `string`, `object` und Arrays. Ein `Date`-Objekt wird bei der Übergabe in einen ISO-formatierten String umgewandelt. Andere komplexe Typen, wie Instanzen benutzerdefinierter Klassen, können nicht direkt übergeben werden.

### Rückgabewert

Mit der `return`-Anweisung können Sie Daten primitiver Typen (gemäß den Parameterregeln) als Ergebnis an den Knoten zurückgeben. Wenn im Code keine `return`-Anweisung aufgerufen wird, hat die Knotenausführung keinen Rückgabewert.

```js
return 123;
```

### Ausgabe (Logs)

Die Verwendung von `console` zur Ausgabe von Logs wird **unterstützt**.

```js
console.log('hello world!');
```

Bei der Ausführung des **Workflows** wird die Ausgabe des Skriptknotens auch in der Logdatei des entsprechenden **Workflows** protokolliert.

### Asynchronität

Die Definition asynchroner Funktionen mit `async` und deren Aufruf mit `await` wird **unterstützt**. Ebenso wird die Verwendung des globalen `Promise`-Objekts **unterstützt**.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Timer

Um Methoden wie `setTimeout`, `setInterval` oder `setImmediate` zu verwenden, müssen Sie diese aus dem Node.js `timers`-Paket importieren (nur im unsicheren Modus verfügbar).

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```