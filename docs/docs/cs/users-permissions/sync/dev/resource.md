:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Rozšíření cílových zdrojů synchronizace

## Přehled

NocoBase ve výchozím nastavení podporuje synchronizaci uživatelských dat do tabulek **Uživatelé** a **Oddělení**. Dále umožňuje rozšířit cílové zdroje pro synchronizaci dat, aby bylo možné zapisovat data do jiných tabulek nebo provádět vlastní zpracování podle potřeby.

:::warning{title=Experimentální}
Kompletní dokumentace bude doplněna.
:::

## Rozhraní pro zpracování cílových zdrojů

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

## Registrace cílových zdrojů

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