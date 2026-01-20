:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Derleme

## Özel Derleme Yapılandırması

Derleme yapılandırmasını özelleştirmek isterseniz, eklenti kök dizininde `build.config.ts` adında bir dosya oluşturabilirsiniz. İçeriği aşağıdaki gibidir:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // vite, `src/client` tarafındaki kodları paketlemek için kullanılır.

    // Vite yapılandırmasını değiştirebilirsiniz, ayrıntılar için şuraya bakınız: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup, `src/server` tarafındaki kodları paketlemek için kullanılır.

    // tsup yapılandırmasını değiştirebilirsiniz, ayrıntılar için şuraya bakınız: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Derleme başlamadan önce çalışan geri çağırma fonksiyonudur; derleme öncesinde bazı işlemler yapmanıza olanak tanır.
  },
  afterBuild: (log: PkgLog) => {
    // Derleme tamamlandıktan sonra çalışan geri çağırma fonksiyonudur; derleme sonrasında bazı işlemler yapmanıza olanak tanır.
  };
});
```