:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Synchronisatiedoelbronnen uitbreiden

## Overzicht

NocoBase ondersteunt standaard het synchroniseren van gebruikersgegevens naar de tabellen **Gebruiker** en **Afdeling**. U kunt ook de doelbronnen voor gegevenssynchronisatie uitbreiden om gegevens naar andere tabellen te schrijven of om, indien nodig, aangepaste verwerking uit te voeren.

:::warning{title=Experimenteel}
Volledige documentatie volgt nog.
:::

## Interface voor de verwerking van doelbronnen

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

## Doelbronnen registreren

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