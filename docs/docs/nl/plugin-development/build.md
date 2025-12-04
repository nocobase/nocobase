:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Bouwen

## Aangepaste buildconfiguratie

Als u de buildconfiguratie wilt aanpassen, kunt u een `build.config.ts` bestand aanmaken in de hoofdmap van de plugin met de volgende inhoud:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // Vite wordt gebruikt om de code van `src/client` te bundelen.

    // Pas de Vite-configuratie aan. Zie voor meer details: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // Tsup wordt gebruikt om de code van `src/server` te bundelen.

    // Pas de Tsup-configuratie aan. Zie voor meer details: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Deze callback-functie wordt uitgevoerd voordat het buildproces start, zodat u voorafgaand aan de build bewerkingen kunt uitvoeren.
  },
  afterBuild: (log: PkgLog) => {
    // Deze callback-functie wordt uitgevoerd nadat het buildproces is voltooid, zodat u na de build bewerkingen kunt uitvoeren.
  };
});
```