:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 동기화 데이터 소스 확장

## 개요

NocoBase는 필요에 따라 사용자 데이터 동기화에 사용되는 **데이터 소스** 유형을 확장할 수 있도록 지원합니다.

## 서버 측

### **데이터 소스** 인터페이스

내장된 사용자 데이터 동기화 **플러그인**은 **데이터 소스** 유형의 등록 및 관리를 제공합니다. **데이터 소스** 유형을 확장하려면 **플러그인**이 제공하는 `SyncSource` 추상 클래스를 상속받아 관련 표준 인터페이스를 구현해야 합니다.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

`SyncSource`는 **데이터 소스**의 사용자 정의 설정을 가져오는 데 사용되는 `options` 속성을 제공합니다.

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

### `UserData` 필드 설명

| 필드         | 설명                                      |
| ------------ | ----------------------------------------- |
| `dataType`   | 데이터 유형. `user` 및 `department` 중 선택할 수 있습니다. |
| `uniqueKey`  | 고유 식별자 필드                              |
| `records`    | 데이터 레코드                                  |
| `sourceName` | **데이터 소스** 이름                                |

`dataType`이 `user`인 경우, `records` 필드에는 다음 필드가 포함됩니다.

| 필드          | 설명           |
| ------------- | -------------- |
| `id`          | 사용자 ID        |
| `nickname`    | 사용자 닉네임       |
| `avatar`      | 사용자 아바타             |
| `email`       | 이메일           |
| `phone`       | 전화번호         |
| `departments` | 소속 부서 ID 배열 |

`dataType`이 `department`인 경우, `records` 필드에는 다음 필드가 포함됩니다.

| 필드       | 설명           |
| -------- | -------------- |
| `id`       | 부서 ID        |
| `name`     | 부서 이름      |
| `parentId` | 상위 부서 ID |

### **데이터 소스** 인터페이스 구현 예시

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

### **데이터 소스** 유형 등록

확장된 **데이터 소스**는 데이터 관리 모듈에 등록해야 합니다.

```ts
import UserDataSyncPlugin from '@nocobase/plugin-user-data-sync';

class CustomSourcePlugin extends Plugin {
  async load() {
    const syncPlugin = this.app.pm.get(
      UserDataSyncPlugin,
    ) as UserDataSyncPlugin;
    if (syncPlugin) {
      syncPlugin.sourceManager.reigsterType('custom-source-type', {
        syncSource: CustomSyncSource,
        title: 'Custom Source',
      });
    }
  }
}
```

## 클라이언트 측

클라이언트 사용자 인터페이스는 사용자 데이터 동기화 **플러그인** 클라이언트가 제공하는 `registerType` 인터페이스를 통해 등록됩니다.

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // 백엔드 관리 폼
      },
    });
  }
}
```

### 백엔드 관리 폼

![](https://static-docs.nocobase.com/202412041429835.png)

상단은 일반적인 **데이터 소스** 설정이며, 하단은 등록 가능한 사용자 정의 설정 폼 부분입니다.