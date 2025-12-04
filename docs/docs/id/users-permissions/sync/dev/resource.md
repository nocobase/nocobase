:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Memperluas Sumber Daya Target Sinkronisasi

## Gambaran Umum

NocoBase secara bawaan mendukung sinkronisasi data pengguna ke tabel **Pengguna** dan **Departemen**. NocoBase juga mendukung perluasan sumber daya target untuk sinkronisasi data sesuai kebutuhan, memungkinkan penulisan data ke tabel lain atau melakukan pemrosesan kustom.

:::warning{title=Eksperimental}
Dokumentasi lengkap masih dalam proses.
:::

## Antarmuka Penangan Sumber Daya Target

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

## Mendaftarkan Sumber Daya Target

`registerResource(resource: UserDataResource, options?: ToposortOptions)`

```ts
import { Plugin } from '@nocobase/server';
import PluginUserDataSyncServer from '@nocobase/plugin-user-data-sync';

class CustomUserResourcePluginServer extends Plugin {
  async load() {
    const userDataSyncPlugin = this.app.pm.get(PluginUserDataSyncServer);
    if (userDataSyncPlugin && userDataSyncPlugin.enabled) {
      userDataSyncPlugin.resourceManager.registerResource(new CustomDataSyncResource(this.db, this.app.logger)
    }
  }
}
```