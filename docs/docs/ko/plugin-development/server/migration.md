:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# Migration (마이그레이션)

NocoBase 플러그인을 개발하고 업데이트하는 과정에서 플러그인의 데이터베이스 구조나 설정에 호환되지 않는 변경 사항이 발생할 수 있습니다. 이러한 변경 사항을 원활하게 처리하고 업그레이드를 성공적으로 진행하기 위해 NocoBase는 **Migration** (마이그레이션) 메커니즘을 제공합니다. 마이그레이션 파일을 작성하여 이러한 변경 사항을 관리할 수 있습니다. 이 문서에서는 Migration의 사용법과 개발 워크플로우를 체계적으로 안내해 드립니다.

## Migration (마이그레이션) 개념

Migration은 플러그인 업그레이드 시 자동으로 실행되는 스크립트이며, 다음과 같은 문제를 해결하는 데 사용됩니다.

- 데이터 테이블 구조 조정 (필드 추가, 필드 유형 변경 등)
- 데이터 마이그레이션 (예: 필드 값 일괄 업데이트)
- 플러그인 설정 또는 내부 로직 업데이트

Migration 실행 시기는 세 가지 유형으로 나뉩니다.

| 유형 | 실행 시점 | 실행 시나리오 |
|------|----------|----------|
| `beforeLoad` | 모든 플러그인 설정이 로드되기 전 | |
| `afterSync`  | 컬렉션 설정이 데이터베이스와 동기화된 후 (컬렉션 구조가 이미 변경된 상태) | |
| `afterLoad`  | 모든 플러그인 설정이 로드된 후 | |

## Migration (마이그레이션) 파일 생성

Migration 파일은 플러그인 디렉터리 내 `src/server/migrations/*.ts` 경로에 위치해야 합니다. NocoBase는 `create-migration` 명령어를 제공하여 마이그레이션 파일을 빠르게 생성할 수 있도록 돕습니다.

```bash
yarn nocobase create-migration [options] <name>
```

선택적 매개변수

| 매개변수 | 설명 |
|------|----------|
| `--pkg <pkg>` | 플러그인 패키지 이름 지정 |
| `--on [on]`  | 실행 시점 지정, 옵션: `beforeLoad`, `afterSync`, `afterLoad` |

예시

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

생성된 migration 파일 경로는 다음과 같습니다.

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

파일 초기 내용:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // 여기에 업그레이드 로직을 작성합니다.
  }
}
```

> ⚠️ `appVersion`은 업그레이드 대상 버전을 식별하는 데 사용됩니다. 지정된 버전보다 낮은 환경에서 해당 migration이 실행됩니다.

## Migration (마이그레이션) 작성

Migration 파일에서는 `this`를 통해 다음의 일반적인 속성 및 API에 접근하여 데이터베이스, 플러그인 및 애플리케이션 인스턴스를 편리하게 조작할 수 있습니다.

일반적인 속성

- **`this.app`**  
  현재 NocoBase 애플리케이션 인스턴스입니다. 전역 서비스, 플러그인 또는 설정에 접근하는 데 사용할 수 있습니다.  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  데이터베이스 서비스 인스턴스로, 모델(컬렉션) 조작을 위한 인터페이스를 제공합니다.  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  현재 플러그인 인스턴스로, 플러그인의 사용자 정의 메서드에 접근하는 데 사용할 수 있습니다.  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  Sequelize 인스턴스로, 원시 SQL 또는 트랜잭션 작업을 직접 실행할 수 있습니다.  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  Sequelize의 QueryInterface로, 필드 추가, 테이블 삭제 등 테이블 구조를 수정하는 데 주로 사용됩니다.  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Migration 작성 예시

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // queryInterface를 사용하여 필드 추가
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // db를 사용하여 데이터 모델 접근
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // 플러그인의 사용자 정의 메서드 실행
    await this.plugin.customMethod();
  }
}
```

위에 나열된 일반적인 속성 외에도 Migration은 풍부한 API를 제공합니다. 자세한 문서는 [Migration API](/api/server/migration)를 참조해 주세요.

## Migration (마이그레이션) 트리거

Migration 실행은 `nocobase upgrade` 명령어를 통해 트리거됩니다.

```bash
$ yarn nocobase upgrade
```

업그레이드 시, 시스템은 Migration의 유형과 `appVersion`에 따라 실행 순서를 결정합니다.

## Migration (마이그레이션) 테스트

플러그인 개발 시, 실제 데이터 손상을 방지하고 migration이 올바르게 실행되는지 테스트하기 위해 **Mock Server**를 사용하는 것을 권장합니다.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // 플러그인 이름
      version: '0.18.0-alpha.5', // 업그레이드 전 버전
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // 필드 존재 여부, 데이터 마이그레이션 성공 여부 등 검증 로직 작성
  });
});
```

> Tip: Mock Server를 사용하면 업그레이드 시나리오를 빠르게 시뮬레이션하고 Migration 실행 순서 및 데이터 변경 사항을 검증할 수 있습니다.

## 개발 실천 권장 사항

1.  **Migration 분할**  
    업그레이드마다 하나의 migration 파일을 생성하여 원자성을 유지하고 문제 해결을 용이하게 하는 것이 좋습니다.
2.  **실행 시점 지정**  
    작업 대상에 따라 `beforeLoad`, `afterSync` 또는 `afterLoad`를 선택하여 로드되지 않은 모듈에 의존하는 것을 피해야 합니다.
3.  **버전 관리 주의**  
    `appVersion`을 사용하여 migration이 적용될 버전을 명확히 지정하고, 중복 실행을 방지하세요.
4.  **테스트 커버리지**  
    Mock Server에서 migration을 검증한 후 실제 환경에서 업그레이드를 실행하세요.