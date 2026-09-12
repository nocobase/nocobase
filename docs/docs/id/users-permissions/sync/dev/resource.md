---
pkg: '@nocobase/plugin-user-data-sync'
title: "Memperluas Resource Target Sinkronisasi"
description: "Ekstensi plugin sinkronisasi data pengguna NocoBase: resource target sinkronisasi kustom, antarmuka SyncResource, pemetaan tabel pengguna dan departemen."
keywords: "memperluas resource sinkronisasi,SyncResource,target sinkronisasi,pemetaan tabel pengguna,plugin-user-data-sync,NocoBase"
---

# Memperluas Resource Target Sinkronisasi

## Ikhtisar

NocoBase secara default mendukung sinkronisasi data pengguna ke tabel **users** dan **departments**, dan juga mendukung perluasan resource target sinkronisasi data sesuai kebutuhan, untuk mengimplementasikan penulisan data ke tabel lain atau pemrosesan kustom lainnya.

:::warning{title=Eksperimental}
Dokumentasi lengkap akan dilengkapi nanti
:::

## Antarmuka Pemrosesan Resource Target

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

## Mendaftarkan Resource Target

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
