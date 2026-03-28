:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/notification)을 참조하세요.
:::

# ctx.notification

Ant Design Notification을 기반으로 한 전역 알림 API로, 페이지 **우측 상단**에 알림 패널을 표시하는 데 사용됩니다. `ctx.message`와 비교하여 알림에 제목과 설명을 포함할 수 있어, 비교적 장시간 표시가 필요하거나 사용자의 주의가 필요한 내용에 적합합니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSBlock / 작업 이벤트** | 작업 완료 알림, 일괄 작업 결과, 내보내기 완료 등 |
| **이벤트 스트림** | 비동기 프로세스 종료 후의 시스템 수준 알림 |
| **장시간 표시가 필요한 내용** | 제목, 설명, 작업 버튼이 포함된 전체 알림 |

## 타입 정의

```ts
notification: NotificationInstance;
```

`NotificationInstance`는 Ant Design notification 인터페이스이며, 다음 메서드들을 제공합니다.

## 주요 메서드

| 메서드 | 설명 |
|------|------|
| `open(config)` | 사용자 정의 설정을 사용하여 알림 열기 |
| `success(config)` | 성공 유형의 알림 표시 |
| `info(config)` | 정보 유형의 알림 표시 |
| `warning(config)` | 경고 유형의 알림 표시 |
| `error(config)` | 오류 유형의 알림 표시 |
| `destroy(key?)` | 지정된 key의 알림을 닫으며, key를 전달하지 않으면 모든 알림을 닫음 |

**설정 파라미터** ([Ant Design notification](https://ant.design/components/notification)과 동일):

| 파라미터 | 타입 | 설명 |
|------|------|------|
| `message` | `ReactNode` | 알림 제목 |
| `description` | `ReactNode` | 알림 설명 |
| `duration` | `number` | 자동 닫힘 지연 시간(초), 기본값은 4.5초이며 0으로 설정 시 자동으로 닫히지 않음 |
| `key` | `string` | 알림의 고유 식별자, `destroy(key)`로 특정 알림을 닫을 때 사용 |
| `onClose` | `() => void` | 알림이 닫힐 때의 콜백 함수 |
| `placement` | `string` | 위치: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## 예시

### 기본 사용법

```ts
ctx.notification.open({
  message: '작업 성공',
  description: '데이터가 서버에 저장되었습니다.',
});
```

### 유형별 빠른 호출

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### 사용자 정의 지속 시간 및 key

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // 자동으로 닫히지 않음
});

// 작업 완료 후 수동으로 닫기
ctx.notification.destroy('task-123');
```

### 모든 알림 닫기

```ts
ctx.notification.destroy();
```

## ctx.message와의 차이점

| 특성 | ctx.message | ctx.notification |
|------|--------------|------------------|
| **위치** | 페이지 상단 중앙 | 우측 상단 (설정 가능) |
| **구조** | 단일 행의 가벼운 힌트 | 제목 + 설명 포함 가능 |
| **용도** | 일시적인 피드백, 자동 소멸 | 완전한 형태의 알림, 장시간 표시 가능 |
| **전형적 시나리오** | 작업 성공, 유효성 검사 실패, 복사 성공 | 작업 완료, 시스템 메시지, 사용자 주의가 필요한 긴 내용 |

## 관련 문서

- [ctx.message](./message.md) - 빠른 피드백에 적합한 상단 가벼운 힌트
- [ctx.modal](./modal.md) - 모달 확인창, 차단식 상호작용
- [ctx.t()](./t.md) - 국제화, 알림과 함께 자주 사용됨