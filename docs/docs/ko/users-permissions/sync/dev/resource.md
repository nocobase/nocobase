:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 동기화 대상 리소스 확장

## 개요

NocoBase는 기본적으로 사용자 데이터를 **사용자** 및 **부서** 테이블에 동기화하는 기능을 제공합니다. 필요에 따라 데이터 동기화의 대상 리소스를 확장하여 다른 테이블에 데이터를 기록하거나 사용자 정의 처리를 수행할 수도 있습니다.

:::warning{title=실험적 기능}
전체 문서는 추후 보충될 예정입니다.
:::

## 대상 리소스 처리 인터페이스

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

## 대상 리소스 등록하기

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