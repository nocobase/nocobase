:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 이벤트

NocoBase의 서버는 애플리케이션 생명 주기, 플러그인 생명 주기, 데이터베이스 작업 등 다양한 단계에서 해당하는 이벤트를 발생시킵니다. 플러그인 개발자는 이 이벤트를 수신하여 확장 로직, 자동화된 작업 또는 사용자 정의 동작을 구현할 수 있습니다.

NocoBase의 이벤트 시스템은 크게 두 가지 레벨로 나뉩니다.

- **`app.on()` - 애플리케이션 레벨 이벤트**: 애플리케이션의 시작, 설치, 플러그인 활성화 등과 같은 생명 주기 이벤트를 수신합니다.
- **`db.on()` - 데이터베이스 레벨 이벤트**: 레코드 생성, 업데이트, 삭제 등 데이터 모델 레벨의 작업 이벤트를 수신합니다.

두 가지 모두 Node.js의 `EventEmitter`를 상속하며, 표준 `.on()`, `.off()`, `.emit()` 인터페이스를 지원합니다. NocoBase는 또한 `emitAsync`를 확장 지원하여, 비동기적으로 이벤트를 트리거하고 모든 리스너가 실행을 완료할 때까지 기다릴 수 있도록 합니다.

## 이벤트 리스너 등록 위치

일반적으로 이벤트 리스너는 플러그인의 `beforeLoad()` 메서드에서 등록해야 합니다. 이렇게 하면 플러그인 로딩 단계에서 이벤트가 준비되어, 이후 로직이 올바르게 응답할 수 있습니다.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // 애플리케이션 이벤트 수신
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase가 시작되었습니다');
    });

    // 데이터베이스 이벤트 수신
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`새 게시물: ${model.get('title')}`);
      }
    });
  }
}
```

## 애플리케이션 이벤트 수신 `app.on()`

애플리케이션 이벤트는 NocoBase 애플리케이션 및 플러그인의 생명 주기 변화를 포착하는 데 사용되며, 초기화 로직, 리소스 등록 또는 플러그인 종속성 검사 등에 적합합니다.

### 주요 이벤트 유형

| 이벤트 이름 | 트리거 시점 | 주요 용도 |
|-----------|------------|-----------|
| `beforeLoad` / `afterLoad` | 애플리케이션 로드 전/후 | 리소스 등록, 설정 초기화 |
| `beforeStart` / `afterStart` | 서비스 시작 전/후 | 작업 시작, 시작 로그 출력 |
| `beforeInstall` / `afterInstall` | 애플리케이션 설치 전/후 | 데이터 초기화, 템플릿 가져오기 |
| `beforeStop` / `afterStop` | 서비스 중지 전/후 | 리소스 정리, 상태 저장 |
| `beforeDestroy` / `afterDestroy` | 애플리케이션 소멸 전/후 | 캐시 삭제, 연결 해제 |
| `beforeLoadPlugin` / `afterLoadPlugin` | 플러그인 로드 전/후 | 플러그인 설정 수정 또는 기능 확장 |
| `beforeEnablePlugin` / `afterEnablePlugin` | 플러그인 활성화 전/후 | 종속성 확인, 플러그인 로직 초기화 |
| `beforeDisablePlugin` / `afterDisablePlugin` | 플러그인 비활성화 전/후 | 플러그인 리소스 정리 |
| `afterUpgrade` | 애플리케이션 업그레이드 완료 후 | 데이터 마이그레이션 또는 호환성 수정 실행 |

예시: 애플리케이션 시작 이벤트 수신

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 NocoBase 서비스가 시작되었습니다!');
});
```

예시: 플러그인 로드 이벤트 수신

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`플러그인 ${plugin.name}이 로드되었습니다`);
});
```

## 데이터베이스 이벤트 수신 `db.on()`

데이터베이스 이벤트는 모델 레벨의 다양한 데이터 변경을 포착할 수 있으며, 감사, 동기화, 자동 채우기 등의 작업에 적합합니다.

### 주요 이벤트 유형

| 이벤트 이름 | 트리거 시점 |
|-----------|------------|
| `beforeSync` / `afterSync` | 데이터베이스 구조 동기화 전/후 |
| `beforeValidate` / `afterValidate` | 데이터 유효성 검사 전/후 |
| `beforeCreate` / `afterCreate` | 레코드 생성 전/후 |
| `beforeUpdate` / `afterUpdate` | 레코드 업데이트 전/후 |
| `beforeSave` / `afterSave` | 저장 전/후 (생성 및 업데이트 포함) |
| `beforeDestroy` / `afterDestroy` | 레코드 삭제 전/후 |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | 연관 데이터 포함 작업 후 |
| `beforeDefineCollection` / `afterDefineCollection` | 컬렉션 정의 전/후 |
| `beforeRemoveCollection` / `afterRemoveCollection` | 컬렉션 삭제 전/후 |

예시: 데이터 생성 후 이벤트 수신

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('데이터가 생성되었습니다!');
});
```

예시: 데이터 업데이트 전 이벤트 수신

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('데이터가 업데이트될 예정입니다!');
});
```