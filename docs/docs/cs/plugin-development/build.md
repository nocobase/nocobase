:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Sestavení

## Vlastní konfigurace sestavení

Pokud si přejete přizpůsobit konfiguraci sestavení, můžete v kořenovém adresáři pluginu vytvořit soubor `build.config.ts` s následujícím obsahem:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // Vite se používá pro balení kódu z adresáře `src/client`.

    // Upravte konfiguraci Vite, podrobnosti naleznete zde: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // Tsup se používá pro balení kódu z adresáře `src/server`.

    // Upravte konfiguraci Tsup, podrobnosti naleznete zde: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Funkce zpětného volání, která se spustí před zahájením sestavení a umožňuje provádět operace před sestavením.
  },
  afterBuild: (log: PkgLog) => {
    // Funkce zpětného volání, která se spustí po dokončení sestavení a umožňuje provádět operace po sestavení.
  };
});
```