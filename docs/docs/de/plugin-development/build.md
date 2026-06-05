:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Build

## Benutzerdefinierte Build-Konfiguration

Wenn Sie die Build-Konfiguration anpassen möchten, können Sie im Stammverzeichnis Ihres Plugins eine `build.config.ts`-Datei mit folgendem Inhalt erstellen:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // Vite wird verwendet, um den Code für den `src/client`-Bereich zu bündeln.

    // Passen Sie die Vite-Konfiguration an. Weitere Informationen finden Sie unter: https://vitejs.dev/guide/
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