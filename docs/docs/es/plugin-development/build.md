:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Compilación

## Personalizar la Configuración de Compilación

Si desea personalizar la configuración de compilación, puede crear un archivo `build.config.ts` en el directorio raíz de su `plugin` con el siguiente contenido:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // Vite se utiliza para empaquetar el código del lado del cliente (`src/client`).

    // Modifique la configuración de Vite. Para más detalles, consulte: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup se utiliza para empaquetar el código del lado del servidor (`src/server`).

    // Modifique la configuración de tsup. Para más detalles, consulte: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Función de callback que se ejecuta antes de que comience la compilación, permitiendo realizar operaciones previas a la misma.
  },
  afterBuild: (log: PkgLog) => {
    // Función de callback que se ejecuta una vez finalizada la compilación, permitiendo realizar operaciones posteriores a la misma.
  };
});
```