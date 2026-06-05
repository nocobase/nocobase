:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 로거

## 로거 생성

### `createLogger()`

사용자 정의 로거를 생성합니다.

#### 시그니처

- `createLogger(options: LoggerOptions)`

#### 타입

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### 상세 정보

| 속성         | 설명             |
| :----------- | :--------------- |
| `dirname`    | 로그 출력 디렉터리 |
| `filename`   | 로그 파일 이름     |
| `format`     | 로그 형식        |
| `transports` | 로그 출력 방식     |

### `createSystemLogger()`

지정된 방식으로 시스템 런타임 로그를 생성합니다. [로거 - 시스템 로그](/log-and-monitor/logger/index.md#system-log)를 참고하세요.

#### 시그니처

- `createSystemLogger(options: SystemLoggerOptions)`

#### 타입

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### 상세 정보

| 속성            | 설명                                |
| :-------------- | :---------------------------------- |
| `seperateError` | `error` 레벨 로그를 별도로 출력할지 여부 |

### `requestLogger()`

API 요청 및 응답 로깅을 위한 미들웨어입니다.

```ts
app.use(requestLogger(app.name));
```

#### 시그니처

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### 타입

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### 상세 정보

| 속성                | 타입                              | 설명                                       | 기본값                                                                                                                                                  |
| :------------------ | :-------------------------------- | :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | 요청 컨텍스트에 따라 특정 요청 로그를 건너뜁니다. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | 로그에 출력할 요청 정보의 화이트리스트입니다.    | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | 로그에 출력할 응답 정보의 화이트리스트입니다.    | `['status']`                                                                                                                                            |

### app.createLogger()

#### 정의

```ts
class Application {
  createLogger(options: LoggerOptions) {
    const { dirname } = options;
    return createLogger({
      ...options,
      dirname: getLoggerFilePath(this.name || 'main', dirname || ''),
    });
  }
}
```

`dirname`이 상대 경로일 경우, 로그 파일은 현재 애플리케이션 이름의 디렉터리에 출력됩니다.

### plugin.createLogger()

사용법은 `app.createLogger()`와 동일합니다.

#### 정의

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## 로그 설정

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

현재 시스템에 설정된 로그 레벨을 가져옵니다.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

현재 시스템에 설정된 로그 디렉터리를 기반으로 디렉터리 경로를 연결합니다.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

현재 시스템에 설정된 로그 출력 방식을 가져옵니다.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

현재 시스템에 설정된 로그 형식을 가져옵니다.

## 로그 출력

### Transports

미리 정의된 출력 방식입니다.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## 관련 문서

- [개발 가이드 - 로거](/plugin-development/server/logger)
- [로거](/log-and-monitor/logger/index.md)