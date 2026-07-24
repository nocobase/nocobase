---
title: "Ihren ersten NocoBase Plugin entwickeln"
description: "Ein Block-Plugin von Grund auf erstellen: nb scaffold plugin, Plugin-Grundgerüst, client/server Verzeichnis, Block registrieren, Entwicklungs- und Debugging-Workflow."
keywords: "Plugin entwickeln,erstes Plugin,nb scaffold plugin,Plugin-Grundgerüst,Block-Plugin,NocoBase Plugin-Entwicklung"
---

# Ihren ersten Plugin entwickeln

Dieser Leitfaden führt Sie Schritt für Schritt durch die Erstellung eines Block-Plugins, das auf Seiten verwendet werden kann. Er hilft Ihnen, die grundlegende Struktur und den Entwicklungs-Workflow von NocoBase Plugins zu verstehen.

## Voraussetzungen

Bevor Sie beginnen, stellen Sie bitte sicher, dass Sie über NocoBase CLI (`nb init`) eine NocoBase-Anwendung installiert haben. Die Plugin-Entwicklung unterstützt npm und Git als Quellen; die Git-Quelle wird empfohlen (bei der KI-Entwicklung kann direkt auf den Quellcode verwiesen werden). Siehe [Installation mit CLI](../nocobase-cli/installation/cli.md).

```bash
nb init --ui
```

Wählen Sie anschließend die Option `Git source install`, um die NocoBase-Anwendung zu installieren:

![git source](https://static-docs.nocobase.com/20260720173518.png)

Nach Abschluss der Installation können Sie offiziell mit der Entwicklung Ihres Plugins beginnen.

## Schritt 1: Plugin-Grundgerüst über die CLI erstellen

Führen Sie im Projektstammverzeichnis (`<app-path>`) oder `source/`-Verzeichnis den folgenden Befehl aus, um schnell ein leeres Plugin zu generieren:

```bash
nb scaffold plugin @my-project/plugin-hello
```

Nach erfolgreicher Ausführung des Befehls werden im Verzeichnis `<app-path>/plugins/@my-project/plugin-hello` grundlegende Dateien generiert (`nb` synchronisiert das Plugin automatisch nach `source/packages/plugins/` für den Entwicklungs- und Build-Prozess). Die Standardstruktur sieht wie folgt aus:

```bash
├─ /plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client-v2.d.ts
  ├─ client-v2.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Standard-Export für Server-Side Plugin
     ├─ client-v2                # Speicherort für Client-Side Code
     │  ├─ index.tsx             # Standard-Export der Client-Side Plugin-Klasse
     │  ├─ plugin.tsx            # Plugin-Einstiegspunkt (erweitert @nocobase/client-v2 Plugin)
     │  ├─ locale.ts             # useT / tExpr Übersetzungswerkzeuge
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

Nach der Erstellung können Sie ausführen:

```bash
nb source dev
```

Rufen Sie dann die Plugin-Manager-Seite in Ihrem Browser auf ([Standard-URL](http://localhost:13000/admin/settings/plugin-manager)), um zu überprüfen, ob das Plugin in der Liste erscheint.

## Schritt 2: Einen einfachen Client-Block implementieren

Als Nächstes fügen wir dem Plugin ein benutzerdefiniertes Block-Modell hinzu, das einen Begrüßungstext anzeigt.

1. **Neue Block-Modelldatei erstellen**: `client-v2/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client-v2';
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

2. **Block-Modell registrieren**. Bearbeiten Sie `client-v2/plugin.ts`, um das neue Modell zu registrieren, damit die Frontend-Laufzeit es laden kann:

```ts
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClientV2 extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      }
    })
  }
}

export default PluginHelloClientV2;
```

Nach dem Speichern des Codes sollten Sie, falls Sie ein Entwicklungsskript ausführen, Hot-Reload-Protokolle in der Terminalausgabe sehen können.

## Schritt 3: Plugin aktivieren und testen

Sie können das Plugin über die Befehlszeile oder die Benutzeroberfläche aktivieren:

- **Befehlszeile**

  ```bash
  nb plugin enable @my-project/plugin-hello
  ```

- **Verwaltungsoberfläche**: Rufen Sie den Plugin-Manager auf, suchen Sie `@my-project/plugin-hello` und klicken Sie auf „Aktivieren“.

Nach der Aktivierung erstellen Sie eine neue Seite „Modern page (v2)“. Beim Hinzufügen von Blöcken sehen Sie den „Hello block“. Fügen Sie ihn in die Seite ein, um den Begrüßungsinhalt zu sehen, den Sie gerade erstellt haben.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

### Plugin standardmäßig vorinstallieren oder aktivieren (optional)

Das obige Verfahren beschreibt das manuelle Aktivieren eines einzelnen Plugins. Wenn Sie Ihre eigene NocoBase-Anwendung pflegen und möchten, dass bestimmte Plugins nach `nb init` (Erstinstallation) oder `nb app upgrade` (Upgrade) automatisch bereitstehen, können Sie zwei Umgebungsvariablen verwenden, um den Standardzustand von Plugins zu steuern:

- **`APPEND_PRESET_LOCAL_PLUGINS` (Standard-Preset-Plugins hinzufügen)** — Fügt das Plugin zur Liste der voreingestellten lokalen Plugins hinzu; nach der Installation erscheint es im „Plugin-Manager", ist aber standardmäßig nicht aktiviert und muss manuell eingeschaltet werden
- **`APPEND_PRESET_BUILT_IN_PLUGINS` (Standard-Built-in-Plugins hinzufügen)** — Fügt das Plugin zur Liste der integrierten Plugins hinzu; es wird bei der Installation automatisch aktiviert und kann als integriertes Plugin **im „Plugin-Manager" nicht deaktiviert oder gelöscht werden**

Weitere Informationen finden Sie in der Dokumentation zu [Umgebungsvariablen](../get-started/installation/env.md#append_preset_local_plugins).

## Schritt 4: Erstellen und Packen

Wenn Sie das Plugin in anderen Umgebungen verteilen möchten, müssen Sie es zuerst erstellen und dann packen:

```bash
nb source build @my-project/plugin-hello --tar
# Oder in zwei Schritten ausführen
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
```

:::tip Hinweis

Wenn das Plugin im Quellcode-Repository erstellt wurde, löst der erste Build eine vollständige Typüberprüfung des gesamten Repositorys aus, was einige Zeit in Anspruch nehmen kann. Es wird empfohlen, sicherzustellen, dass die Abhängigkeiten installiert sind und das Repository in einem baubaren Zustand bleibt.

:::

Nach Abschluss des Builds befindet sich die Paketdatei standardmäßig unter `source/storage/tar/`. Der Befehl gibt den vollständigen Pfad der Paketdatei aus.

:::tip Hinweis

Vor der Veröffentlichung eines Plugins wird empfohlen, Testfälle zu schreiben, um die Kernlogik zu validieren. NocoBase bietet eine vollständige serverseitige Test-Toolchain. Siehe [Test](./server/test.md).

:::

## Schritt 5: In eine andere NocoBase-Anwendung hochladen

Laden Sie das Plugin hoch und entpacken Sie es in das Verzeichnis `./storage/plugins` der Zielanwendung. Details finden Sie unter [Plugins installieren und aktualisieren](../get-started/install-upgrade-plugins.mdx).

## Verwandte Links

- [Plugin-Entwicklung Übersicht](./index.md) — NocoBase-Mikrokernel-Architektur und Plugin-Lebenszyklus kennenlernen
- [Projektverzeichnisstruktur](./project-structure.md) — Konventionen für das Projektverzeichnis, Plugin-Ladepfade und Prioritäten
- [Server-Entwicklung Übersicht](./server/index.md) — Gesamtübersicht und Kernkonzepte der serverseitigen Plugin-Entwicklung
- [Client-Entwicklung Übersicht](./client/index.md) — Gesamtübersicht und Kernkonzepte der clientseitigen Plugin-Entwicklung
- [Erstellen und Packen](./build.md) — Build-, Paketierungs- und Distributionsprozess für Plugins
- [Test](./server/test.md) — Testfälle für serverseitige Plugins schreiben
- [KI-Agent-Integrationsanleitung](../ai/quick-start.mdx) — NocoBase CLI installieren und Anwendung initialisieren
- [Installation mit CLI](../nocobase-cli/installation/cli.md) — Vollständiger Installationsprozess
- [Plugins installieren und aktualisieren](../get-started/install-upgrade-plugins.mdx) — Gepackte Plugins in andere Umgebungen hochladen
- [Umgebungsvariablen](../get-started/installation/env.md) — Konfiguration von Umgebungsvariablen für Preset- und Built-in-Plugins