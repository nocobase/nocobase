:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Bygg

## Anpassad byggkonfiguration

Om ni vill anpassa byggkonfigurationen kan ni skapa en `build.config.ts`-fil i pluginens rotkatalog med följande innehåll:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // vite används för att paketera kod från src/client

    // Ändra Vite-konfigurationen, se: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup används för att paketera kod från src/server

    // Ändra tsup-konfigurationen, se: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Återanropsfunktion som körs innan byggprocessen startar, där ni kan utföra åtgärder innan byggprocessen påbörjas.
  },
  afterBuild: (log: PkgLog) => {
    // Återanropsfunktion som körs efter att byggprocessen har slutförts, där ni kan utföra åtgärder efter att byggprocessen är klar.
  };
});
```