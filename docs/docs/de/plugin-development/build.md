---
title: "Build und Paketierung"
description: "Build und Paketierung von NocoBase-Plugins: yarn build, yarn nocobase tar, benutzerdefinierte Konfiguration über build.config.ts, Client-Bündelung mit Rsbuild, Server-Bündelung mit tsup."
keywords: "Plugin-Build,Plugin-Paketierung,yarn build,tar,build.config.ts,Rsbuild,tsup,@nocobase/build,NocoBase"
---

# Build und Paketierung

Nach Abschluss der Plugin-Entwicklung sind zwei Schritte erforderlich – der Build (Kompilieren des Quellcodes) und die Paketierung (Erzeugen einer `.tgz`-Datei) –, bevor Sie das Plugin an andere NocoBase-Anwendungen verteilen können.

## Plugin bauen

Beim Build wird der TypeScript-Quellcode unter `src/` zu JavaScript kompiliert – der Client-Code wird von Rsbuild gebündelt, der Server-Code von tsup:

```bash
yarn build @my-project/plugin-hello
```

Die Build-Artefakte werden in das Verzeichnis `dist/` im Stammverzeichnis des Plugins ausgegeben.

:::tip Hinweis

Wenn das Plugin im Quellcode-Repository erstellt wurde, löst der erste Build eine vollständige Typüberprüfung des gesamten Repositorys aus, was einige Zeit in Anspruch nehmen kann. Es wird empfohlen, sicherzustellen, dass die Abhängigkeiten installiert sind und das Repository in einem baubaren Zustand bleibt.

:::

## Plugin packen

Beim Packen werden die Build-Artefakte zu einer `.tgz`-Datei komprimiert, die sich bequem in andere Umgebungen hochladen lässt:

```bash
yarn nocobase tar @my-project/plugin-hello
```

Die Paketdatei wird standardmäßig im Verzeichnis `storage/tar/` abgelegt, benannt nach dem Schema `<Paketname>-<Versionsnummer>.tgz`, zum Beispiel `storage/tar/@my-project/plugin-hello-0.1.0.tgz`.

Mit dem Parameter `--tar` können Sie Build und Paketierung auch in einem Schritt ausführen:

```bash
yarn build @my-project/plugin-hello --tar
```

## In andere NocoBase-Anwendungen hochladen

Laden Sie die `.tgz`-Datei hoch und entpacken Sie sie in das Verzeichnis `./storage/plugins` der Zielanwendung. Details finden Sie unter [Plugins installieren und aktualisieren](../get-started/install-upgrade-plugins.mdx).

Wenn die Zielanwendung mit der NocoBase CLI (`nb init`) erstellt wurde, können Sie sie auch direkt mit `nb plugin import` importieren, ohne manuell zu entpacken:

```bash
nb plugin import /your/path/plugin-hello-0.1.0.tgz
```

### Plugin standardmäßig aktivieren

Nach dem Hochladen wird ein Plugin nicht automatisch aktiviert – es erscheint im „Plugin-Manager" und muss manuell eingeschaltet werden. Wenn Sie Ihre eigene NocoBase-Anwendung pflegen und möchten, dass das Plugin zusammen mit der Anwendung standardmäßig aktiviert wird, können Sie die Umgebungsvariable `APPEND_PRESET_BUILT_IN_PLUGINS` (Standard-Built-in-Plugins hinzufügen) verwenden. Die Verwendung wird unter [Plugin standardmäßig vorinstallieren oder aktivieren](./write-your-first-plugin.md#plugin-standardmäßig-vorinstallieren-oder-aktivieren-optional) beschrieben.

## Benutzerdefinierte Build-Konfiguration

In der Regel reicht die Standard-Build-Konfiguration aus. Wenn Sie sie anpassen möchten – etwa um den Bündelungs-Einstiegspunkt zu ändern, Aliase hinzuzufügen oder Komprimierungsoptionen anzupassen –, können Sie im Stammverzeichnis des Plugins eine Datei `build.config.ts` anlegen:

```ts
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // Rsbuild-Bündelungskonfiguration für den Client (src/client-v2) anpassen
    // Referenz: https://rsbuild.rs/guide/configuration/rsbuild
    return config;
  },
  modifyTsupConfig: (config) => {
    // tsup-Bündelungskonfiguration für den Server (src/server) anpassen
    // Referenz: https://tsup.egoist.dev/#using-custom-configuration
    return config;
  },
  beforeBuild: (log) => {
    // Callback vor dem Start des Builds, zum Beispiel zum Bereinigen temporärer Dateien oder Generieren von Code
  },
  afterBuild: (log) => {
    // Callback nach Abschluss des Builds, zum Beispiel zum Kopieren zusätzlicher Ressourcen oder Ausgeben von Statistiken
  },
});
```

Einige zentrale Punkte:

- `modifyRsbuildConfig` – dient dazu, die Client-Bündelung anzupassen, etwa Rsbuild-Plugins hinzuzufügen, resolve-Aliase zu ändern oder die Code-Splitting-Strategie anzupassen. Konfigurationsoptionen finden Sie in der [Rsbuild-Dokumentation](https://rsbuild.rs/guide/configuration/rsbuild)
- `modifyTsupConfig` – dient dazu, die Server-Bündelung anzupassen, etwa target, externals oder entry zu ändern. Konfigurationsoptionen finden Sie in der [tsup-Dokumentation](https://tsup.egoist.dev/#using-custom-configuration)
- `beforeBuild` / `afterBuild` – Hooks vor und nach dem Build, die eine `log`-Funktion für die Protokollausgabe erhalten. So lassen sich beispielsweise in `beforeBuild` Codedateien generieren und in `afterBuild` statische Ressourcen in das Ausgabeverzeichnis kopieren

## Verwandte Links

- [Ersten Plugin entwickeln](./write-your-first-plugin.md) — Plugin von Grund auf erstellen, einschließlich vollständigem Build- und Paketierungsprozess
- [Projektverzeichnisstruktur](./project-structure.md) — Zweck der Verzeichnisse `packages/plugins`, `storage/tar` und weiterer
- [Abhängigkeitsverwaltung](./dependency-management.md) — Abhängigkeitsdeklaration und globale Abhängigkeiten von Plugins
- [Plugin-Entwicklung Übersicht](./index.md) — Gesamtübersicht der Plugin-Entwicklung
- [Plugins installieren und aktualisieren](../get-started/install-upgrade-plugins.mdx) — Gepackte Dateien in die Zielumgebung hochladen
- [Umgebungsvariablen](../get-started/installation/env.md) — Konfiguration von Umgebungsvariablen für Preset- und Built-in-Plugins
