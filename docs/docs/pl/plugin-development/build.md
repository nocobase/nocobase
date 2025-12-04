:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Budowanie

## Niestandardowa konfiguracja budowania

Jeśli chcą Państwo dostosować konfigurację budowania, mogą Państwo utworzyć plik `build.config.ts` w katalogu głównym wtyczki, o następującej zawartości:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // Vite służy do pakowania kodu po stronie klienta (`src/client`)

    // Modyfikacja konfiguracji Vite, szczegóły znajdą Państwo pod adresem: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup służy do pakowania kodu po stronie serwera (`src/server`)

    // Modyfikacja konfiguracji tsup, szczegóły znajdą Państwo pod adresem: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Funkcja zwrotna wywoływana przed rozpoczęciem budowania, umożliwiająca wykonanie operacji przed budowaniem.
  },
  afterBuild: (log: PkgLog) => {
    // Funkcja zwrotna wywoływana po zakończeniu budowania, umożliwiająca wykonanie operacji po budowaniu.
  };
});
```