:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 로거

NocoBase의 로깅은 <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>을 기반으로 합니다. 기본적으로 NocoBase는 로그를 API 요청 로그, 시스템 런타임 로그, 그리고 SQL 실행 로그로 나눕니다. 이 중 API 요청 로그와 SQL 실행 로그는 애플리케이션 내부에서 출력되며, 플러그인 개발자는 일반적으로 플러그인과 관련된 시스템 런타임 로그만 출력하면 됩니다.

이 문서에서는 플러그인을 개발할 때 로그를 생성하고 출력하는 방법을 주로 설명합니다.

## 기본 출력 메서드

NocoBase는 시스템 런타임 로그 출력 메서드를 제공합니다. 로그는 지정된 필드에 따라 출력되며, 동시에 지정된 파일로 저장됩니다.

```ts
// 기본 출력 메서드
app.log.info("message");

// 미들웨어에서 사용
async function (ctx, next) {
  ctx.log.info("message");
}

// 플러그인에서 사용
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

위의 모든 메서드는 다음 사용법을 따릅니다:

첫 번째 매개변수는 로그 메시지이며, 두 번째 매개변수는 선택적 메타데이터 객체로, 어떤 키-값 쌍이든 될 수 있습니다. 여기서 `module`, `submodule`, `method`는 개별 필드로 추출되고, 나머지 필드는 `meta` 필드에 포함됩니다.

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## 다른 파일로 출력

시스템의 기본 출력 메서드를 사용하고 싶지만, 기본 파일이 아닌 다른 파일로 출력하고 싶다면 `createSystemLogger`를 사용하여 사용자 지정 시스템 로거 인스턴스를 생성할 수 있습니다.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // error 레벨 로그를 'xxx_error.log' 파일로 별도 출력할지 여부
});
```

## 사용자 지정 로거

시스템에서 제공하는 출력 메서드 대신 Winston의 기본 메서드를 사용하고 싶다면, 다음 방법을 통해 로그를 생성할 수 있습니다.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options`는 기존 `winston.LoggerOptions`를 확장합니다.

- `transports` - `'console' | 'file' | 'dailyRotateFile'`을 사용하여 미리 설정된 출력 방식을 적용할 수 있습니다.
- `format` - `'logfmt' | 'json' | 'delimiter'`을 사용하여 미리 설정된 출력 형식을 적용할 수 있습니다.

### `app.createLogger`

다중 애플리케이션 시나리오에서는 사용자 지정 출력 디렉터리 및 파일을 현재 애플리케이션 이름의 디렉터리에 출력하고 싶을 때가 있습니다.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // /storage/logs/main/custom.log로 출력됩니다.
});
```

### `plugin.createLogger`

사용 시나리오와 방법은 `app.createLogger`와 동일합니다.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // /storage/logs/main/custom-plugin/YYYY-MM-DD.log로 출력됩니다.
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```