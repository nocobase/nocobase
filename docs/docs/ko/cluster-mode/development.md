:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 플러그인 개발

## 배경

단일 노드 환경에서는 플러그인이 프로세스 내 상태, 이벤트 또는 태스크를 통해 요구사항을 충족할 수 있습니다. 하지만 클러스터 모드에서는 동일한 플러그인이 여러 인스턴스에서 동시에 실행될 수 있으며, 다음과 같은 일반적인 문제에 직면하게 됩니다.

- **상태 일관성**: 설정 또는 런타임 데이터가 메모리에만 저장되는 경우, 인스턴스 간 동기화가 어려워 잘못된 읽기(dirty read) 또는 중복 실행이 발생하기 쉽습니다.
- **태스크 스케줄링**: 장시간 소요되는 태스크가 명확한 큐잉 및 확인 메커니즘 없이 실행되면, 여러 인스턴스가 동일한 태스크를 동시에 실행하게 됩니다.
- **경쟁 조건**: 스키마 변경 또는 리소스 할당과 관련된 작업은 동시 쓰기로 인한 충돌을 방지하기 위해 직렬화되어야 합니다.

NocoBase 코어는 애플리케이션 계층에 다양한 미들웨어 인터페이스를 미리 제공하여, 플러그인이 클러스터 환경에서 통합된 기능을 재사용할 수 있도록 돕습니다. 다음 섹션에서는 소스 코드와 함께 캐싱, 동기 메시징, 메시지 큐 및 분산 잠금의 사용법과 모범 사례를 소개합니다.

## 솔루션

### 캐시 컴포넌트 (Cache)

메모리에 저장해야 하는 데이터의 경우, 시스템에 내장된 캐시 컴포넌트를 사용하여 관리하는 것을 권장합니다.

- `app.cache`를 통해 기본 캐시 인스턴스를 가져올 수 있습니다.
- `Cache`는 `set/get/del/reset`과 같은 기본 작업을 제공하며, 캐싱 로직을 캡슐화하는 `wrap` 및 `wrapWithCondition`과 `mset/mget/mdel`과 같은 배치(batch) 메서드도 지원합니다.
- 클러스터에 배포할 때는 공유 데이터를 영구 저장소(예: Redis)에 저장하고, 인스턴스 재시작으로 인한 캐시 손실을 방지하기 위해 적절한 `ttl`을 설정하는 것이 좋습니다.

예시: [`plugin-auth`의 캐시 초기화 및 사용](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="플러그인에서 캐시 생성 및 사용"
// packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts
async load() {
  this.cache = await this.app.cacheManager.createCache({
    name: 'auth',
    prefix: 'auth',
    store: 'redis',
  });

  await this.cache.wrap('token:config', async () => {
    const repo = this.app.db.getRepository('tokenPolicies');
    return repo.findOne({ filterByTk: 'default' });
  }, 60 * 1000);
}
```

### 동기 메시지 관리자 (SyncMessageManager)

메모리 내 상태를 분산 캐시로 관리할 수 없는 경우(예: 직렬화할 수 없는 경우), 사용자 작업에 따라 상태가 변경될 때 변경 사항을 동기 신호를 통해 다른 인스턴스에 알려 상태 일관성을 유지해야 합니다.

- 플러그인 기본 클래스는 `sendSyncMessage`를 구현했으며, 내부적으로 `app.syncMessageManager.publish`를 호출하고 채널에 애플리케이션 수준 접두사를 자동으로 추가하여 채널 충돌을 방지합니다.
- `publish`는 `transaction`을 지정할 수 있으며, 메시지는 데이터베이스 트랜잭션이 커밋된 후에 전송되어 상태와 메시지 동기화를 보장합니다.
- `handleSyncMessage`를 통해 다른 인스턴스에서 보낸 메시지를 처리할 수 있으며, `beforeLoad` 단계에서 구독할 수 있어 설정 변경, 스키마 동기화 등과 같은 시나리오에 매우 적합합니다.

예시: [`plugin-data-source-main`은 동기 메시지를 사용하여 다중 노드 스키마 일관성을 유지합니다.](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="플러그인 내에서 스키마 업데이트 동기화"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // app.syncMessageManager.publish를 자동으로 호출합니다.
  }
}
```

### 메시지 브로드캐스트 관리자 (PubSubManager)

메시지 브로드캐스팅은 동기 신호의 하위 컴포넌트이며 직접 사용하는 것도 지원합니다. 인스턴스 간에 메시지를 브로드캐스팅해야 할 때 이 컴포넌트를 통해 구현할 수 있습니다.

- `app.pubSubManager.subscribe(channel, handler, { debounce })`를 사용하여 인스턴스 간에 채널을 구독할 수 있습니다. `debounce` 옵션은 중복 브로드캐스트로 인한 빈번한 콜백을 방지하는 데 사용됩니다.
- `publish`는 `skipSelf`(기본값은 true)와 `onlySelf`를 지원하며, 메시지가 현재 인스턴스로 다시 전송될지 여부를 제어하는 데 사용됩니다.
- 애플리케이션 시작 전에 어댑터(예: Redis, RabbitMQ 등)를 구성해야 합니다. 그렇지 않으면 기본적으로 외부 메시징 시스템에 연결되지 않습니다.

예시: [`plugin-async-task-manager`는 PubSub을 사용하여 태스크 취소 이벤트를 브로드캐스팅합니다.](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="태스크 취소 신호 브로드캐스팅"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### 이벤트 큐 컴포넌트 (EventQueue)

메시지 큐는 비동기 태스크를 스케줄링하는 데 사용되며, 장시간 소요되거나 재시도 가능한 작업을 처리하는 데 적합합니다.

- `app.eventQueue.subscribe(channel, { idle, process, concurrency })`를 통해 컨슈머를 선언합니다. `process`는 `Promise`를 반환하며, `AbortSignal.timeout`을 사용하여 타임아웃을 제어할 수 있습니다.
- `publish`는 애플리케이션 이름 접두사를 자동으로 추가하며, `timeout`, `maxRetries` 등의 옵션을 지원합니다. 기본적으로 인메모리 큐 어댑터를 사용하지만, 필요에 따라 RabbitMQ와 같은 확장 어댑터로 전환할 수 있습니다.
- 클러스터에서는 노드 간 태스크 분할을 방지하기 위해 모든 노드가 동일한 어댑터를 사용하도록 해야 합니다.

예시: [`plugin-async-task-manager`는 EventQueue를 사용하여 태스크를 스케줄링합니다.](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="큐에서 비동기 태스크 분배"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### 분산 잠금 관리자 (LockManager)

경쟁 작업을 피해야 할 때, 분산 잠금을 사용하여 리소스에 대한 접근을 직렬화할 수 있습니다.

- 기본적으로 프로세스 기반의 `local` 어댑터를 제공하며, Redis와 같은 분산 구현을 등록할 수 있습니다. `app.lockManager.runExclusive(key, fn, ttl)` 또는 `acquire`/`tryAcquire`를 통해 동시성을 제어합니다.
- `ttl`은 잠금 해제를 위한 안전장치로 사용되어, 예외적인 상황에서 잠금이 영원히 유지되는 것을 방지합니다.
- 일반적인 시나리오는 스키마 변경, 중복 태스크 방지, 속도 제한 등입니다.

예시: [`plugin-data-source-main`은 분산 잠금을 사용하여 필드 삭제 프로세스를 보호합니다.](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="필드 삭제 작업 직렬화"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## 개발 권장 사항

- **메모리 상태 일관성**: 개발 시 메모리 상태 사용을 최대한 피하십시오. 대신 캐싱 또는 동기 메시지를 사용하여 상태 일관성을 유지하십시오.
- **내장 인터페이스 재사용 우선**: `app.cache`, `app.syncMessageManager`와 같은 통합된 기능을 사용하십시오. 플러그인에서 노드 간 통신 로직을 중복 구현하는 것을 피하십시오.
- **트랜잭션 경계에 주의**: 트랜잭션이 있는 작업은 `transaction.afterCommit`을 사용해야 합니다(`syncMessageManager.publish`에 내장되어 있습니다). 이는 데이터와 메시지 일관성을 보장하기 위함입니다.
- **백오프(Backoff) 전략 수립**: 큐 및 브로드캐스트 태스크의 경우, 예외적인 상황에서 새로운 트래픽 급증이 발생하는 것을 방지하기 위해 `timeout`, `maxRetries`, `debounce` 값을 적절하게 설정하십시오.
- **모니터링 및 로깅 활용**: 애플리케이션 로그를 활용하여 채널 이름, 메시지 페이로드, 잠금 키 등의 정보를 기록하십시오. 이는 클러스터에서 발생하는 간헐적인 문제 해결을 용이하게 합니다.

이러한 기능을 통해 플러그인은 서로 다른 인스턴스 간에 안전하게 상태를 공유하고, 설정을 동기화하며, 태스크를 스케줄링할 수 있어 클러스터 배포 시나리오의 안정성 및 일관성 요구사항을 충족합니다.