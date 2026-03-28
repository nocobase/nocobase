:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/message)을 참조하세요.
:::

# ctx.message

Ant Design의 전역 message API로, 페이지 상단 중앙에 임시 메시지를 표시하는 데 사용됩니다. 메시지는 일정 시간 후 자동으로 닫히거나 사용자가 수동으로 닫을 수 있습니다.

## 적용 사례

| 시나리오 | 설명 |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | 작업 피드백, 유효성 검사 메시지, 복사 성공 등 가벼운 알림 |
| **표단 조작 / 워크플로우** | 제출 성공, 저장 실패, 유효성 검사 미통과 등의 피드백 |
| **작업 이벤트 (JSAction)** | 클릭, 일괄 작업 완료 등의 즉각적인 피드백 |

## 타입 정의

```ts
message: MessageInstance;
```

`MessageInstance`는 Ant Design의 message 인터페이스이며, 다음 메서드들을 제공합니다.

## 주요 메서드

| 메서드 | 설명 |
|------|------|
| `success(content, duration?)` | 성공 메시지 표시 |
| `error(content, duration?)` | 오류 메시지 표시 |
| `warning(content, duration?)` | 경고 메시지 표시 |
| `info(content, duration?)` | 정보 메시지 표시 |
| `loading(content, duration?)` | 로딩 메시지 표시 (수동으로 닫아야 함) |
| `open(config)` | 사용자 정의 설정을 사용하여 메시지 표시 |
| `destroy()` | 표시된 모든 메시지 닫기 |

**매개변수:**

- `content` (`string` | `ConfigOptions`): 메시지 내용 또는 설정 객체
- `duration` (`number`, 선택 사항): 자동 닫힘 지연 시간(초), 기본값은 3초이며 0으로 설정하면 자동으로 닫히지 않습니다.

**ConfigOptions** (`content`가 객체인 경우):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // 메시지 내용
  duration?: number;        // 자동 닫힘 지연 시간(초)
  onClose?: () => void;    // 닫힐 때의 콜백 함수
  icon?: React.ReactNode;  // 사용자 정의 아이콘
}
```

## 예시

### 기본 사용법

```ts
ctx.message.success('작업 성공');
ctx.message.error('작업 실패');
ctx.message.warning('데이터를 먼저 선택해 주세요');
ctx.message.info('처리 중...');
```

### ctx.t와 연동한 국제화

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### 로딩 및 수동 닫기

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// 비동기 작업 수행
await saveData();
hide();  // 로딩 메시지 수동 닫기
ctx.message.success(ctx.t('Saved'));
```

### open을 사용한 사용자 정의 설정

```ts
ctx.message.open({
  type: 'success',
  content: '사용자 정의 성공 메시지',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### 모든 메시지 닫기

```ts
ctx.message.destroy();
```

## ctx.message와 ctx.notification의 차이점

| 특성 | ctx.message | ctx.notification |
|------|--------------|------------------|
| **위치** | 페이지 상단 중앙 | 우측 상단 |
| **용도** | 임시 알림, 자동으로 사라짐 | 알림 패널, 제목과 설명을 포함할 수 있으며 장시간 표시에 적합 |
| **전형적인 시나리오** | 작업 피드백, 유효성 검사, 복사 성공 | 작업 완료 알림, 시스템 메시지, 사용자 주의가 필요한 긴 내용 |

## 관련 문서

- [ctx.notification](./notification.md) - 우측 상단 알림, 장시간 표시에 적합
- [ctx.modal](./modal.md) - 모달 확인창, 차단식 상호작용
- [ctx.t()](./t.md) - 국제화, 주로 message와 함께 사용됨