:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Migration (Yükseltme Betikleri)

NocoBase eklenti geliştirme ve güncelleme süreçlerinde, eklentilerin veri tabanı yapıları veya konfigürasyonları uyumsuz değişikliklere uğrayabilir. Yükseltmelerin sorunsuz bir şekilde gerçekleşmesini sağlamak için NocoBase, bu değişiklikleri migration dosyaları yazarak yöneten bir **Migration** mekanizması sunar. Bu rehber, Migration kullanımını ve geliştirme iş akışını sistematik bir şekilde anlamanıza yardımcı olacaktır.

## Migration Kavramı

Migration, eklenti yükseltmeleri sırasında otomatik olarak çalışan bir betiktir ve aşağıdaki sorunları çözmek için kullanılır:

- Veri tabanı tablo yapısı ayarlamaları (yeni alan ekleme, alan tiplerini değiştirme vb.)
- Veri taşıma (alan değerlerinin toplu güncellenmesi gibi)
- Eklenti konfigürasyonu veya dahili mantık güncellemeleri

Migration'ın çalışma zamanlaması üç kategoriye ayrılır:

| Tip        | Tetiklenme Zamanı                                      | Çalışma Senaryosu |
| ----------- | --------------------------------------------------- | ------------------ |
| `beforeLoad` | Tüm eklenti konfigürasyonları yüklenmeden önce         |                    |
| `afterSync`  | Koleksiyon konfigürasyonları veri tabanıyla senkronize edildikten sonra (koleksiyon yapısı zaten değiştirilmiş) | |
| `afterLoad`  | Tüm eklenti konfigürasyonları yüklendikten sonra          |                    |

## Migration Dosyaları Oluşturma

Migration dosyaları, eklenti dizininin altındaki `src/server/migrations/*.ts` konumuna yerleştirilmelidir. NocoBase, migration dosyalarını hızlıca oluşturmak için `create-migration` komutunu sunar.

```bash
yarn nocobase create-migration [options] <name>
```

İsteğe Bağlı Parametreler

| Parametre      | Açıklama |
| -------------- | ----------- |
| `--pkg <pkg>`  | Eklenti paket adını belirtir |
| `--on [on]`    | Çalışma zamanlamasını belirtir, seçenekler: `beforeLoad`, `afterSync`, `afterLoad` |

Örnek

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

Oluşturulan migration dosyasının yolu aşağıdaki gibidir:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Dosyanın başlangıç içeriği:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Yükseltme mantığını buraya yazın
  }
}
```

> ⚠️ `appVersion`, yükseltmenin hedeflendiği sürümü belirtmek için kullanılır. Belirtilen sürümden daha düşük sürümlere sahip ortamlar bu migration'ı çalıştıracaktır.

## Migration Yazma

Migration dosyalarında, veri tabanı, eklentiler ve uygulama örnekleri üzerinde kolayca işlem yapmak için `this` aracılığıyla aşağıdaki yaygın özelliklere ve API'lere erişebilirsiniz:

Yaygın Özellikler

- **`this.app`**  
  Mevcut NocoBase uygulama örneği. Global servislere, eklentilere veya konfigürasyona erişmek için kullanılabilir.  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  Veri tabanı servis örneği, modeller (koleksiyonlar) üzerinde işlem yapmak için arayüzler sağlar.  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  Mevcut eklenti örneği, eklentinin özel metotlarına erişmek için kullanılabilir.  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  Sequelize örneği, doğrudan ham SQL veya işlem (transaction) operasyonlarını yürütmek için kullanılabilir.  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  Sequelize'ın QueryInterface'i, genellikle tablo yapılarını değiştirmek için kullanılır; örneğin, alan ekleme, tablo silme gibi.  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Migration Yazma Örneği

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // queryInterface kullanarak alan ekleme
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // db kullanarak veri modellerine erişim
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Eklentinin özel metodunu çalıştırma
    await this.plugin.customMethod();
  }
}
```

Yukarıda listelenen yaygın özelliklere ek olarak, Migration zengin API'ler de sunar. Detaylı dokümantasyon için lütfen [Migration API](/api/server/migration) adresine bakın.

## Migration'ı Tetikleme

Migration'ın çalıştırılması `nocobase upgrade` komutuyla tetiklenir:

```bash
$ yarn nocobase upgrade
```

Yükseltme sırasında sistem, Migration'ın tipine ve `appVersion`'a göre çalışma sırasını belirleyecektir.

## Migration'ı Test Etme

Eklenti geliştirme sürecinde, gerçek verilere zarar vermemek için migration'ın doğru çalışıp çalışmadığını test etmek amacıyla **Mock Server** kullanmanız önerilir.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Eklenti adı
      version: '0.18.0-alpha.5', // Yükseltme öncesi sürüm
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Doğrulama mantığını buraya yazın, örneğin alanın varlığını veya veri taşımanın başarılı olup olmadığını kontrol edin
  });
});
```

> İpucu: Mock Server kullanarak yükseltme senaryolarını hızlıca simüle edebilir ve Migration'ın çalışma sırasını ve veri değişikliklerini doğrulayabilirsiniz.

## Geliştirme Pratiği Önerileri

1.  **Migration'ları Ayırın**  
    Her yükseltme için mümkün olduğunca tek bir migration dosyası oluşturmaya çalışın. Bu, atomikliği korur ve sorun gidermeyi kolaylaştırır.
2.  **Çalışma Zamanlamasını Belirtin**  
    İşlem nesnelerine göre `beforeLoad`, `afterSync` veya `afterLoad` seçeneklerinden birini seçin; yüklenmemiş modüllere bağımlılıktan kaçının.
3.  **Sürüm Kontrolüne Dikkat Edin**  
    `appVersion` kullanarak migration'ın uygulanacağı sürümü açıkça belirtin ve tekrar tekrar çalışmasını önleyin.
4.  **Test Kapsamı**  
    Migration'ı bir Mock Server üzerinde doğruladıktan sonra, yükseltmeyi gerçek ortamda çalıştırın.