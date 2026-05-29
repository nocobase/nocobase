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
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Standard-Export für Server-Side Plugin
     ├─ client                   # Speicherort für Client-Side Code
     │  ├─ index.tsx             # Standard-Export der Client-Side Plugin-Klasse
     │  ├─ plugin.tsx            # Plugin-Einstiegspunkt (erweitert @nocobase/client Plugin)
     │  ├─ models                # Optional: Frontend-Modelle (z. B. Workflow-Knoten)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Speicherort für Server-Side Code
     │  ├─ index.ts              # Standard-Export der Server-Side Plugin-Klasse
     │  ├─ plugin.ts             # Plugin-Einstiegspunkt (erweitert @nocobase/server Plugin)
     │  ├─ collections           # Optional: Server-Side Sammlungen
     │  ├─ migrations            # Optional: Datenmigrationen
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Optional: Mehrsprachigkeit
        ├─ en-US.json
        └─ zh-CN.json
```

Nach der Erstellung können Sie die Plugin-Manager-Seite in Ihrem Browser aufrufen (Standard-URL: http://localhost:13000/admin/settings/plugin-manager), um zu überprüfen, ob das Plugin in der Liste erscheint.

## Schritt 2: Einen einfachen Client-Block implementieren

Als Nächstes fügen wir dem Plugin ein benutzerdefiniertes Block-Modell hinzu, das einen Begrüßungstext anzeigt.

1. **Neue Block-Modelldatei erstellen**: `client/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

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

2. **Block-Modell registrieren**. Bearbeiten Sie `client/models/index.ts`, um das neue Modell für das Laden zur Frontend-Laufzeit zu exportieren:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Nach dem Speichern des Codes sollten Sie, falls Sie ein Entwicklungsskript ausführen, Hot-Reload-Protokolle in der Terminalausgabe sehen können.

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

Nach Abschluss des Builds befindet sich die Paketdatei standardmäßig unter `storage/tar/@my-project/plugin-hello.tar.gz`.

## Schritt 5: In eine andere NocoBase-Anwendung hochladen

Laden Sie das Plugin hoch und entpacken Sie es in das Verzeichnis `./storage/plugins` der Zielanwendung. Details finden Sie unter [Plugins installieren und aktualisieren](../get-started/install-upgrade-plugins.mdx).

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