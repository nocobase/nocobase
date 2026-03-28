:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/t)을 참조하세요.
:::

# ctx.t()

RunJS에서 문구 번역을 위해 사용하는 i18n 단축 함수로, 현재 컨텍스트의 언어 설정을 기반으로 합니다. 버튼, 제목, 힌트 등 인라인 문구의 국제화에 적합합니다.

## 적용 시나리오

모든 RunJS 실행 환경에서 `ctx.t()`를 사용할 수 있습니다.

## 타입 정의

```ts
t(key: string, options?: Record<string, any>): string
```

## 매개변수

| 매개변수 | 타입 | 설명 |
|------|------|------|
| `key` | `string` | 번역 키 또는 자리 표시자가 포함된 템플릿 (예: `Hello {{name}}`, `{{count}} rows`) |
| `options` | `object` | 선택 사항. 보간 변수 (예: `{ name: '홍길동', count: 5 }`) 또는 i18n 옵션 (예: `defaultValue`, `ns`) |

## 반환값

- 번역된 문자열을 반환합니다. 키에 해당하는 번역이 없고 `defaultValue`가 제공되지 않은 경우, 키 자체 또는 보간된 문자열이 반환될 수 있습니다.

## 네임스페이스 (ns)

RunJS 환경의 **기본 네임스페이스는 `runjs`**입니다. `ns`를 지정하지 않으면 `ctx.t(key)`는 `runjs` 네임스페이스에서 키를 찾습니다.

```ts
// 기본적으로 runjs 네임스페이스에서 키를 찾음
ctx.t('Submit'); // ctx.t('Submit', { ns: 'runjs' })와 동일

// 지정된 네임스페이스에서 키를 찾음
ctx.t('Submit', { ns: 'myModule' });

// 여러 네임스페이스에서 순차적으로 검색 (먼저 runjs, 그 다음 common)
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## 예시

### 단순 키

```ts
ctx.t('Submit');
ctx.t('No data');
```

### 보간 변수 포함

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### 상대 시간 등 동적 문구

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### 네임스페이스 지정

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## 주의사항

- **로컬라이제이션 플러그인**: 문구를 번역하려면 먼저 로컬라이제이션 플러그인을 활성화해야 합니다. 번역이 누락된 항목은 로컬라이제이션 관리 목록으로 자동 추출되어 통합 유지 관리 및 번역이 용이해집니다.
- i18next 스타일의 보간을 지원합니다: 키에 `{{변수명}}`을 사용하고 `options`에 동일한 이름의 변수를 전달하여 교체할 수 있습니다.
- 언어는 현재 컨텍스트(예: `ctx.i18n.language`, 사용자 로케일)에 의해 결정됩니다.

## 관련 정보

- [ctx.i18n](./i18n.md): 언어 읽기 또는 전환