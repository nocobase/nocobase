:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Senkronizasyon Hedef Kaynaklarını Genişletme

## Genel Bakış

NocoBase, kullanıcı verilerini varsayılan olarak **Kullanıcı** ve **Departman** tablolarına senkronize etmeyi destekler. Ayrıca, verileri başka tablolara yazmak veya özel işlemler gerçekleştirmek için veri senkronizasyonunun hedef kaynaklarını ihtiyaca göre genişletmenize olanak tanır.

:::warning{title=Deneysel}
Tam dokümantasyon bekleniyor.
:::

## Hedef Kaynak İşleyici Arayüzü

```ts
export abstract class UserDataResource {
  name: string;
  accepts: SyncAccept[];
  db: Database;
  logger: SystemLogger;

  constructor(db: Database, logger: SystemLogger) {
    this.db = db;
    this.logger = logger;
  }

  abstract update(
    record: OriginRecord,
    resourcePks: PrimaryKey[],
    matchKey?: string,
  ): Promise<RecordResourceChanged[]>;
  abstract create(
    record: OriginRecord,
    matchKey: string,
  ): Promise<RecordResourceChanged[]>;

  get syncRecordRepo() {
    return this.db.getRepository('userDataSyncRecords');
  }

  get syncRecordResourceRepo() {
    return this.db.getRepository('userDataSyncRecordsResources');
  }
}
```

## Hedef Kaynakları Kaydetme

`registerResource(resource: UserDataResource, options?: ToposortOptions)`

```ts
import { Plugin } from '@nocobase/server';
import PluginUserDataSyncServer from '@nocobase/plugin-user-data-sync';

class CustomUserResourcePluginServer extends Plugin {
  async load() {
    const userDataSyncPlugin = this.app.pm.get(PluginUserDataSyncServer);
    if (userDataSyncPlugin && userDataSyncPlugin.enabled) {
      userDataSyncPlugin.resourceManager.registerResource(
        new CustomDataSyncResource(this.db, this.app.logger),
      );
    }
  }
}
```