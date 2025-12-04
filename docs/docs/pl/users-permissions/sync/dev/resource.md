:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rozszerzanie zasobów docelowych synchronizacji

## Przegląd

NocoBase domyślnie wspiera synchronizację danych użytkowników z tabelami **Użytkownicy** i **Działy**. Umożliwia również rozszerzanie zasobów docelowych synchronizacji danych, aby zapisywać dane do innych tabel lub wykonywać niestandardowe przetwarzanie, zgodnie z Państwa potrzebami.

:::warning{title=Eksperymentalne}
Pełna dokumentacja jest w przygotowaniu.
:::

## Interfejs obsługi zasobów docelowych

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

## Rejestrowanie zasobów docelowych

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