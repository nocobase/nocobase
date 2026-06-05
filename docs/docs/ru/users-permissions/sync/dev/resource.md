:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Расширение целевых ресурсов синхронизации

## Обзор

NocoBase по умолчанию поддерживает синхронизацию пользовательских данных в таблицы **Пользователи** и **Отделы**. Вы также можете расширять целевые ресурсы для синхронизации данных, чтобы записывать их в другие таблицы или выполнять пользовательскую обработку по мере необходимости.

:::warning{title=Экспериментально}
Полная документация находится в разработке.
:::

## Интерфейс обработчика целевых ресурсов

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

## Регистрация целевых ресурсов

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