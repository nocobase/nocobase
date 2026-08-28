# Ihren ersten Plugin entwickeln

Dieser Leitfaden führt Sie Schritt für Schritt durch die Erstellung eines Block-Plugins, das auf Seiten verwendet werden kann. Er hilft Ihnen, die grundlegende Struktur und den Entwicklungs-Workflow von NocoBase Plugins zu verstehen.

## Voraussetzungen

Bevor Sie beginnen, stellen Sie bitte sicher, dass NocoBase erfolgreich installiert ist. Falls nicht, finden Sie hier die entsprechenden Installationsanleitungen:

- [Installation mit create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Installation aus dem Git-Quellcode](/get-started/installation/git)

Nach Abschluss der Installation können Sie offiziell mit der Entwicklung Ihres Plugins beginnen.

## Schritt 1: Plugin-Grundgerüst über die CLI erstellen

Führen Sie im Stammverzeichnis des Repositorys den folgenden Befehl aus, um schnell ein leeres Plugin zu generieren:

```bash
yarn pm create @my-project/plugin-hello
```

Nach erfolgreicher Ausführung des Befehls werden im Verzeichnis `packages/plugins/@my-project/plugin-hello` grundlegende Dateien generiert. Die Standardstruktur sieht wie folgt aus:

```bash
packages/plugins/@my-project/plugin-hello/
├─ package.json
├─ README.md
├─ .npmignore
├─ client-v2.d.ts            # Typdeklaration des v2-Client-Einstiegspunkts
├─ client-v2.js              # v2-Client-Einstiegspunkt
├─ client.d.ts               # Typdeklaration des v1-Client-Einstiegspunkts
├─ client.js                 # v1-Client-Einstiegspunkt
├─ server.d.ts               # Typdeklaration des Server-Einstiegspunkts
├─ server.js                 # Server-Einstiegspunkt
└─ src
   ├─ index.ts               # Standard-Export für Server-Side Plugin
   ├─ client-v2              # Speicherort für v2-Client-Side Code
   │  ├─ index.tsx           # Standard-Export der Client-Side Plugin-Klasse
   │  ├─ plugin.tsx          # Plugin-Einstiegspunkt (erweitert @nocobase/client-v2 Plugin)
   │  └─ client.d.ts
   ├─ client                 # Speicherort für v1-Client-Side Code
   │  ├─ index.tsx
   │  ├─ plugin.tsx
   │  ├─ locale.ts
   │  ├─ models
   │  │  └─ index.ts
   │  └─ client.d.ts
   ├─ server                 # Speicherort für Server-Side Code
   │  ├─ index.ts            # Standard-Export der Server-Side Plugin-Klasse
   │  ├─ plugin.ts           # Plugin-Einstiegspunkt (erweitert @nocobase/server Plugin)
   │  └─ collections         # Server-Side Sammlungen (anfangs ein leeres Verzeichnis)
   └─ locale                 # Sprachressourcen
      ├─ en-US.json
      └─ zh-CN.json
```

Das Gerüst erzeugt ein minimales Grundgerüst – unter `src/client-v2/` liegen nur die Einstiegsdateien. Das Verzeichnis `models/` und die Datei `locale.ts`, die in den folgenden Schritten verwendet werden, legen Sie selbst an.

Starten Sie anschließend den Entwicklungsmodus, damit Codeänderungen per Hot-Reload übernommen werden:

- Wenn das Projekt mit der NocoBase CLI (`nb init`) erstellt wurde, führen Sie im Projektstammverzeichnis (`<app-path>`) aus:

  ```bash
  nb source dev
  ```

- Wenn Sie das NocoBase-Quellcode-Repository selbst geklont haben, führen Sie im Stammverzeichnis des Quellcodes aus:

  ```bash
  yarn dev
  ```

Sobald es läuft, rufen Sie die Plugin-Manager-Seite in Ihrem Browser auf (Standard-URL: http://localhost:13000/admin/settings/plugin-manager), um zu überprüfen, ob das Plugin in der Liste erscheint.

## Schritt 2: Einen einfachen Client-Block implementieren

Als Nächstes fügen wir dem Plugin ein benutzerdefiniertes Block-Modell hinzu, das einen Begrüßungstext anzeigt.

1. **Übersetzungs-Hilfsdatei erstellen**: `src/client-v2/locale.ts`. `tExpr` deklariert einen Übersetzungsausdruck mit Namensraum, `useT` stellt die Übersetzungsfunktion innerhalb von Components bereit:

```ts
import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';
// @ts-ignore
import pkg from '../../package.json';

export function useT() {
  const engine = useFlowEngine();
  return (str: string) => engine.context.t(str, { ns: [pkg.name, 'client'] });
}

export function tExpr(key: string) {
  return _tExpr(key, { ns: [pkg.name, 'client'] });
}
```

2. **Neue Block-Modelldatei erstellen**: `src/client-v2/models/HelloBlockModel.tsx`:

```tsx pure
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

3. **Block-Modell registrieren**. Die Modelldatei allein reicht nicht aus – die Frontend-Laufzeit durchsucht das Verzeichnis `models/` nicht automatisch, Sie müssen das Modell also explizit im Plugin-Einstiegspunkt registrieren. Bearbeiten Sie `src/client-v2/plugin.tsx` und deklarieren Sie in `load()` über `registerModelLoaders`, wie das Modell geladen wird:

```tsx pure
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClientV2 extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}

export default PluginHelloClientV2;
```

`registerModelLoaders` nimmt Lazy-Loading-Funktionen entgegen, ein Modell wird also erst geladen, wenn es tatsächlich verwendet wird. Der Schlüssel (`HelloBlockModel`) muss mit dem Namen der Modellklasse übereinstimmen – die Laufzeit greift anhand dieses Namens auf die Modellklasse in den benannten Exports des Moduls zu.

Nach dem Speichern des Codes sollten Sie, falls Sie den Entwicklungsmodus ausführen, Hot-Reload-Protokolle in der Terminalausgabe sehen können.

## Schritt 3: Plugin aktivieren und testen

Sie können das Plugin über die Befehlszeile oder die Benutzeroberfläche aktivieren:

- **Befehlszeile**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Verwaltungsoberfläche**: Rufen Sie den Plugin-Manager auf, suchen Sie `@my-project/plugin-hello` und klicken Sie auf „Aktivieren“.

Nach der Aktivierung erstellen Sie eine neue Seite „Modern page (v2)“. Beim Hinzufügen von Blöcken sehen Sie den „Hello block“. Fügen Sie ihn in die Seite ein, um den Begrüßungsinhalt zu sehen, den Sie gerade erstellt haben.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

### Plugin standardmäßig vorinstallieren oder aktivieren (optional)

Das obige Verfahren beschreibt das manuelle Aktivieren eines einzelnen Plugins. Wenn Sie Ihre eigene NocoBase-Anwendung pflegen und möchten, dass bestimmte Plugins nach `nocobase install` (Erstinstallation) oder `nocobase upgrade` (Upgrade) automatisch bereitstehen, können Sie zwei Umgebungsvariablen verwenden, um den Standardzustand von Plugins zu steuern:

- **`APPEND_PRESET_LOCAL_PLUGINS` (Standard-Preset-Plugins hinzufügen)** — Fügt das Plugin zur Liste der voreingestellten lokalen Plugins hinzu; nach der Installation erscheint es im „Plugin-Manager", ist aber standardmäßig nicht aktiviert und muss manuell eingeschaltet werden
- **`APPEND_PRESET_BUILT_IN_PLUGINS` (Standard-Built-in-Plugins hinzufügen)** — Fügt das Plugin zur Liste der integrierten Plugins hinzu; es wird bei der Installation automatisch aktiviert und kann als integriertes Plugin **im „Plugin-Manager" nicht deaktiviert oder gelöscht werden**

Beide Variablen nehmen als Wert den Plugin-Paketnamen (`name` in `package.json`), mehrere Plugins werden durch Kommas getrennt. In der `.env`-Datei konfigurieren Sie sie wie folgt:

```bash
# Standard-Preset: erscheint in der Plugin-Manager-Liste, wird aber nicht automatisch aktiviert
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world

# Standard-aktiviert: wird automatisch installiert und aktiviert und kann über die Oberfläche nicht deaktiviert werden
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world
```

Für die lokale Entwicklung und Fehlersuche genügt in der Regel das bereits beschriebene `yarn pm enable`. Diese beiden Variablen eignen sich besonders für „out-of-the-box"-Distributionsszenarien – zum Beispiel wenn Sie eine NocoBase-Anwendung mit fest integrierten Plugins bündeln und die Plugins nach der Initialisierung direkt verfügbar haben möchten.

:::tip Hinweis

- Das Plugin muss lokal heruntergeladen sein und in `node_modules` aufgelöst werden können, siehe [Projektverzeichnisstruktur](./project-structure.md)
- Nach der Konfiguration muss `nocobase install` oder `nocobase upgrade` erneut ausgeführt werden, damit die Änderungen wirksam werden
- Eine vollständige Beschreibung der Umgebungsvariablen finden Sie unter [Umgebungsvariablen](../get-started/installation/env.md#append_preset_local_plugins)

:::

## Schritt 4: Erstellen und Packen

Wenn Sie das Plugin in anderen Umgebungen verteilen möchten, müssen Sie es zuerst erstellen und dann packen:

```bash
yarn build @my-project/plugin-hello --tar
# Oder in zwei Schritten ausführen
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> Hinweis: Wenn das Plugin im Quellcode-Repository erstellt wurde, löst der erste Build eine vollständige Typüberprüfung des gesamten Repositorys aus, was einige Zeit in Anspruch nehmen kann. Es wird empfohlen, sicherzustellen, dass die Abhängigkeiten installiert sind und das Repository in einem baubaren Zustand bleibt.

Nach Abschluss des Builds befindet sich die Paketdatei standardmäßig im Verzeichnis `storage/tar/`, benannt nach dem Schema `<Paketname>-<Versionsnummer>.tgz`, zum Beispiel `storage/tar/@my-project/plugin-hello-0.1.0.tgz`.

## Schritt 5: In eine andere NocoBase-Anwendung hochladen

Laden Sie das Plugin hoch und entpacken Sie es in das Verzeichnis `./storage/plugins` der Zielanwendung. Details finden Sie unter [Plugins installieren und aktualisieren](../get-started/install-upgrade-plugins.mdx).

Wenn die Zielanwendung mit der NocoBase CLI (`nb init`) erstellt wurde, können Sie sie auch direkt mit `nb plugin import` importieren, ohne manuell zu entpacken:

```bash
nb plugin import /your/path/plugin-hello-0.1.0.tgz
```

## Verwandte Links

- [Plugin-Entwicklung Übersicht](./index.md) — NocoBase-Mikrokernel-Architektur und Plugin-Lebenszyklus kennenlernen
- [Projektverzeichnisstruktur](./project-structure.md) — Konventionen für das Projektverzeichnis, Plugin-Ladepfade und Prioritäten
- [Server-Entwicklung Übersicht](./server/index.md) — Gesamtübersicht und Kernkonzepte der serverseitigen Plugin-Entwicklung
- [Client-Entwicklung Übersicht](./client/index.md) — Gesamtübersicht und Kernkonzepte der clientseitigen Plugin-Entwicklung
- [Erstellen und Packen](./build.md) — Build-, Paketierungs- und Distributionsprozess für Plugins
- [Test](./server/test.md) — Testfälle für serverseitige Plugins schreiben
- [Installation mit create-nocobase-app](../get-started/installation/create-nocobase-app) — Eine der NocoBase-Installationsmethoden
- [Installation aus dem Git-Quellcode](../get-started/installation/git) — NocoBase aus dem Quellcode installieren
- [Plugins installieren und aktualisieren](../get-started/install-upgrade-plugins.mdx) — Gepackte Plugins in andere Umgebungen hochladen
- [Umgebungsvariablen](../get-started/installation/env.md) — Konfiguration von Umgebungsvariablen für Preset- und Built-in-Plugins