:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Compilazione

## Configurazione di Compilazione Personalizzata

Se desidera personalizzare la configurazione di compilazione, può creare un file `build.config.ts` nella directory principale del plugin con il seguente contenuto:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // vite viene utilizzato per impacchettare il codice lato client in `src/client`

    // Modifichi la configurazione di Vite; per i dettagli consulti: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup viene utilizzato per impacchettare il codice lato server in `src/server`

    // Modifichi la configurazione di tsup; per i dettagli consulti: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Funzione di callback che viene eseguita prima dell'inizio della compilazione, permettendole di eseguire alcune operazioni preliminari.
  },
  afterBuild: (log: PkgLog) => {
    // Funzione di callback che viene eseguita dopo il completamento della compilazione, permettendole di eseguire alcune operazioni successive.
  };
});
```