:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Eklenti

NocoBase'de, Sunucu Eklentisi (Server Plugin), sunucu tarafı işlevselliğini genişletmek ve özelleştirmek için modüler bir yol sunar. Geliştiriciler, `@nocobase/server` paketindeki `Plugin` sınıfını miras alarak, farklı yaşam döngüsü aşamalarında olayları, API'leri, izin yapılandırmalarını ve diğer özel mantıkları kaydedebilirler.

## Eklenti Sınıfı

Temel bir eklenti sınıfı yapısı aşağıdaki gibidir:

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  async handleSyncMessage(message: Record<string, any>) {}

  static async staticImport() {}
}

export default PluginHelloServer;
```

## Yaşam Döngüsü

Eklenti yaşam döngüsü metotları aşağıdaki sıraya göre yürütülür. Her metodun kendine özgü bir yürütme zamanı ve amacı vardır:

| Yaşam Döngüsü Metodu          | Yürütme Zamanı                                  | Açıklama