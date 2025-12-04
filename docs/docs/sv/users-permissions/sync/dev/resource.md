:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Utöka målresurser för synkronisering

## Översikt

NocoBase stöder som standard synkronisering av användardata till tabellerna **Användare** och **Avdelning**. Det är också möjligt att utöka målresurserna för datasynkronisering för att skriva data till andra tabeller eller utföra anpassad bearbetning vid behov.

:::warning{title=Experimentell}
Fullständig dokumentation kommer snart.
:::

## Gränssnitt för hantering av målresurser

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

## Registrera målresurser

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