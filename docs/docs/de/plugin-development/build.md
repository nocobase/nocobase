---
title: "Build und Paketierung"
description: "NocoBase Plugin Build und Paketierung: nb source build, build.config.ts benutzerdefinierte Konfiguration, Rsbuild Client-Bundling, tsup Server-Bundling."
keywords: "Plugin-Build,Plugin-Paketierung,nb source build,tar,build.config.ts,Rsbuild,tsup,@nocobase/build,NocoBase"
---

# Build und Paketierung

Nach Abschluss der Plugin-Entwicklung sind zwei Schritte erforderlich — Build (Quellcode kompilieren) und Paketierung (`.tgz` erzeugen) —, bevor das Plugin in anderen NocoBase-Anwendungen verteilt werden kann.

## Plugin bauen

Führen Sie den Build-Befehl im Quellcodeverzeichnis (`<app-path>/source/`) aus. Der Build kompiliert den TypeScript-Quellcode unter `src/` zu JavaScript — der clientseitige Code wird von Rsbuild gebündelt, der serverseitige Code von tsup:

```bash
cd <app-path>/source
nb source build @my-project/plugin-hello
```

Die Build-Artefakte werden im `dist/`-Verzeichnis des Plugin-Stammverzeichnisses ausgegeben.

:::tip
Der erste Build kann aufgrund einer vollständigen Typprüfung des gesamten Repositorys länger dauern. Stellen Sie sicher, dass alle Abhängigkeiten installiert sind und das Repository in einem baubaren Zustand ist.
:::

## Plugin paketieren

Ebenfalls im Quellcodeverzeichnis (`<app-path>/source/`) auszuführen. Mit dem `--tar`-Parameter können Build und Paketierung in einem Schritt zusammengefasst werden, um ein `.tgz`-Archiv zu erzeugen:

```bash
cd <app-path>/source
nb source build @my-project/plugin-hello --tar
```

Die Paketdatei wird standardmäßig im Verzeichnis `source/storage/tar/` ausgegeben. Nach Abschluss des Builds gibt der Befehl den vollständigen Pfad zum Tarball aus.

## In eine andere NocoBase-Anwendung hochladen

Laden Sie die `.tar.gz`-Datei hoch und entpacken Sie sie in das Verzeichnis `./storage/plugins` der Zielanwendung. Detaillierte Schritte finden Sie unter [Plugins installieren und aktualisieren](../get-started/install-upgrade-plugins.mdx).

### Plugin standardmäßig aktivieren

Nach dem Hochladen wird ein Plugin nicht automatisch aktiviert – es erscheint im „Plugin-Manager" und muss manuell eingeschaltet werden. Wenn Sie Ihre eigene NocoBase-Anwendung pflegen und möchten, dass das Plugin zusammen mit der Anwendung standardmäßig aktiviert wird, können Sie die Umgebungsvariable `APPEND_PRESET_BUILT_IN_PLUGINS` (Standard-Built-in-Plugins hinzufügen) verwenden. Die Verwendung wird unter [Plugin standardmäßig vorinstallieren oder aktivieren](./write-your-first-plugin.md#plugin-standardmäßig-vorinstallieren-oder-aktivieren-optional) beschrieben.

## Benutzerdefinierte Build-Konfiguration

In der Regel reicht die Standard-Build-Konfiguration aus. Wenn Sie Anpassungen vornehmen müssen — z. B. den Build-Einstiegspunkt ändern, Aliase hinzufügen oder Komprimierungsoptionen anpassen —, können Sie eine `build.config.ts`-Datei im Plugin-Stammverzeichnis erstellen:

```ts
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // Rsbuild-Konfiguration für den clientseitigen Code (src/client-v2) anpassen
    // Referenz: https://rsbuild.rs/guide/configuration/rsbuild
    return config;
  },
  modifyTsupConfig: (config) => {
    // tsup-Konfiguration für den serverseitigen Code (src/server) anpassen
    // Referenz: https://tsup.egoist.dev/#using-custom-configuration
    return config;
  },
  beforeBuild: (log) => {
    // Callback vor dem Build-Start, z. B. temporäre Dateien bereinigen, Code generieren usw.
  },
  afterBuild: (log) => {
    // Callback nach dem Build-Abschluss, z. B. zusätzliche Ressourcen kopieren, Statistiken ausgeben usw.
  },
});
```

Wichtige Punkte:

- `modifyRsbuildConfig` — Zum Anpassen des clientseitigen Bundlings, z. B. Rsbuild-Plugins hinzufügen, Resolve-Aliase ändern, Code-Splitting-Strategie anpassen. Konfigurationsoptionen siehe [Rsbuild-Dokumentation](https://rsbuild.rs/guide/configuration/rsbuild)
- `modifyTsupConfig` — Zum Anpassen des serverseitigen Bundlings, z. B. Target, Externals, Entry ändern. Konfigurationsoptionen siehe [tsup-Dokumentation](https://tsup.egoist.dev/#using-custom-configuration)
- `beforeBuild` / `afterBuild` — Hooks vor und nach dem Build, die eine `log`-Funktion zur Ausgabe empfangen. Zum Beispiel in `beforeBuild` Codedateien generieren, in `afterBuild` statische Ressourcen in das Ausgabeverzeichnis kopieren

## Verwandte Links

- [Ersten Plugin entwickeln](./write-your-first-plugin.md) — Plugin von Grund auf erstellen, einschließlich vollständigem Build- und Paketierungsprozess
- [Projektverzeichnisstruktur](./project-structure.md) — Zweck der Verzeichnisse `plugins/`, `storage/tar` und weiterer
- [Abhängigkeitsverwaltung](./dependency-management.md) — Abhängigkeitsdeklaration und globale Abhängigkeiten von Plugins
- [Plugin-Entwicklung Übersicht](./index.md) — Gesamtübersicht der Plugin-Entwicklung
- [Plugins installieren und aktualisieren](../get-started/install-upgrade-plugins.mdx) — Gepackte Dateien in die Zielumgebung hochladen
- [Umgebungsvariablen](../get-started/installation/env.md) — Konfiguration von Umgebungsvariablen für Preset- und Built-in-Plugins
