:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

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