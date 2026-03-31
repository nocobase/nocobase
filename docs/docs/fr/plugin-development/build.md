:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Construction

## Configuration de compilation personnalisée

Si vous souhaitez personnaliser la configuration de compilation, vous pouvez créer un fichier `build.config.ts` à la racine de votre `plugin` avec le contenu suivant :

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // Vite est utilisé pour compiler le code côté client (`src/client`).

    // Modifiez la configuration de Vite. Pour plus de détails, consultez : https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // Tsup est utilisé pour compiler le code côté serveur (`src/server`).

    // Modifiez la configuration de Tsup. Pour plus de détails, consultez : https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Fonction de rappel exécutée avant le début de la compilation, permettant d'effectuer des opérations préalables.
  },
  afterBuild: (log: PkgLog) => {
    // Fonction de rappel exécutée après la fin de la compilation, permettant d'effectuer des opérations post-compilation.
  };
});
```