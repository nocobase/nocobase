# Build

### Plugin standardmäßig aktivieren

Nach dem Hochladen wird ein Plugin nicht automatisch aktiviert – es erscheint im „Plugin-Manager" und muss manuell eingeschaltet werden. Wenn Sie Ihre eigene NocoBase-Anwendung pflegen und möchten, dass das Plugin zusammen mit der Anwendung standardmäßig aktiviert wird, können Sie die Umgebungsvariable `APPEND_PRESET_BUILT_IN_PLUGINS` (Standard-Built-in-Plugins hinzufügen) verwenden. Die Verwendung wird unter [Plugin standardmäßig vorinstallieren oder aktivieren](./write-your-first-plugin.md#plugin-standardmäßig-vorinstallieren-oder-aktivieren-optional) beschrieben.

## Verwandte Links

- [Ersten Plugin entwickeln](./write-your-first-plugin.md) — Plugin von Grund auf erstellen, einschließlich vollständigem Build- und Paketierungsprozess
- [Projektverzeichnisstruktur](./project-structure.md) — Zweck der Verzeichnisse `packages/plugins`, `storage/tar` und weiterer
- [Abhängigkeitsverwaltung](./dependency-management.md) — Abhängigkeitsdeklaration und globale Abhängigkeiten von Plugins
- [Plugin-Entwicklung Übersicht](./index.md) — Gesamtübersicht der Plugin-Entwicklung
- [Plugins installieren und aktualisieren](../get-started/install-upgrade-plugins.mdx) — Gepackte Dateien in die Zielumgebung hochladen
- [Umgebungsvariablen](../get-started/installation/env.md) — Konfiguration von Umgebungsvariablen für Preset- und Built-in-Plugins

## Benutzerdefinierte Build-Konfiguration

Wenn Sie die Build-Konfiguration anpassen möchten, können Sie im Stammverzeichnis Ihres Plugins eine `build.config.ts`-Datei mit folgendem Inhalt erstellen:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // Rsbuild wird verwendet, um den Code für den `src/client`-Bereich zu bündeln.

    // Passen Sie die Rsbuild-Konfiguration an. Weitere Informationen finden Sie unter: https://rsbuild.rs/guide/configuration/rsbuild
    return config
  },
  modifyTsupConfig: (config) => {
    // Tsup wird verwendet, um den Code für den `src/server`-Bereich zu bündeln.

    // Passen Sie die tsup-Konfiguration an. Weitere Informationen finden Sie unter: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Diese Callback-Funktion wird vor dem Start des Builds ausgeführt und ermöglicht Operationen vor dem Build-Prozess.
  },
  afterBuild: (log: PkgLog) => {
    // Diese Callback-Funktion wird nach Abschluss des Builds ausgeführt und ermöglicht Operationen nach dem Build-Prozess.
  };
});
```
