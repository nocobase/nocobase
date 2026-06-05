:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Construção

## Configuração de Construção Personalizada

Se você quiser personalizar a configuração de construção, você pode criar um arquivo `build.config.ts` na pasta raiz do **plugin** com o seguinte conteúdo:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // O Vite é usado para empacotar o código do lado do cliente (`src/client`).

    // Para modificar a configuração do Vite, consulte: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // O tsup é usado para empacotar o código do lado do servidor (`src/server`).

    // Para modificar a configuração do tsup, consulte: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Função de callback executada antes do início da construção, permitindo operações pré-construção.
  },
  afterBuild: (log: PkgLog) => {
    // Função de callback executada após a conclusão da construção, permitindo operações pós-construção.
  };
});
```