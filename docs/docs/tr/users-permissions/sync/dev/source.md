:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Senkronize Veri Kaynaklarını Genişletme

## Genel Bakış

NocoBase, kullanıcı veri senkronizasyonu için veri kaynağı türlerini ihtiyaç duyulduğunda genişletmenize olanak tanır.

## Sunucu Tarafı

### Veri Kaynağı Arayüzü

Yerleşik kullanıcı veri senkronizasyonu eklentisi, veri kaynağı türlerinin kaydını ve yönetimini sağlar. Bir veri kaynağı türünü genişletmek için, eklentinin sağladığı `SyncSource` soyut sınıfını miras almanız ve ilgili standart arayüzleri uygulamanız gerekir.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

`SyncSource` sınıfı, veri kaynağının özel yapılandırmalarını almak için bir `options` özelliğine sahiptir.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    //...
    const { appid, secret } = this.options;
    //...
    return [];
  }
}
```

### `UserData` Alanlarının Açıklaması

| Alan         | Açıklama                                    |
| ------------ | ------------------------------------------- |
| `dataType`   | Veri türü, seçenekler `user` ve `department`'tır. |
| `uniqueKey`  | Benzersiz tanımlayıcı alan                  |
| `records`    | Veri kayıtları                              |
| `sourceName` | Veri kaynağı adı                            |

`dataType` `user` ise, `records` alanı aşağıdaki alanları içerir:

| Alan          | Açıklama             |
| ------------- | -------------------- |
| `id`          | Kullanıcı ID'si      |
| `nickname`    | Kullanıcı takma adı  |
| `avatar`      | Kullanıcı avatarı    |
| `email`       | E-posta              |
| `phone`       | Telefon numarası     |
| `departments` | Departman ID'lerinin dizisi |

`dataType` `department` ise, `records` alanı aşağıdaki alanları içerir:

| Alan       | Açıklama           |
| ---------- | ------------------ |
| `id`       | Departman ID'si    |
| `name`     | Departman adı      |
| `parentId` | Üst departman ID'si |

### Veri Kaynağı Arayüzü Uygulama Örneği

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    // ...
    const ThirdClientApi = new ThirdClientApi(
      this.options.appid,
      this.options.secret,
    );
    const departments = await this.clientapi.getDepartments();
    const users = await this.clientapi.getUsers();
    // ...
    return [
      {
        dataType: 'department',
        uniqueKey: 'id',
        records: departments,
        sourceName: this.instance.name,
      },
      {
        dataType: 'user',
        uniqueKey: 'id',
        records: users,
        sourceName: this.instance.name,
      },
    ];
  }
}
```

### Veri Kaynağı Türü Kaydı

Genişletilen veri kaynağının veri yönetimi modülüne kaydedilmesi gerekir.

```ts
import UserDataSyncPlugin from '@nocobase/plugin-user-data-sync';

class CustomSourcePlugin extends Plugin {
  async load() {
    const syncPlugin = this.app.pm.get(
      UserDataSyncPlugin,
    ) as UserDataSyncPlugin;
    if (syncPlugin) {
      syncPlugin.sourceManager.registerType('custom-source-type', {
        syncSource: CustomSyncSource,
        title: 'Custom Source',
      });
    }
  }
}
```

## İstemci Tarafı

İstemci kullanıcı arayüzü, kullanıcı veri senkronizasyonu eklentisinin istemci arayüzü tarafından sağlanan `registerType` metodunu kullanarak veri kaynağı türlerini kaydeder:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Arka uç yönetim formu
      },
    });
  }
}
```

### Arka Uç Yönetim Formu

![](https://static-docs.nocobase.com/202412041429835.png)

Üst kısım genel veri kaynağı yapılandırmasını sağlarken, alt kısım özel yapılandırma formlarının kaydedilmesine olanak tanır.