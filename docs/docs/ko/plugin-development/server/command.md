:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 명령어 (Command)

NocoBase에서 명령어(Command)는 애플리케이션 또는 플러그인과 관련된 작업을 명령줄에서 실행하는 데 사용됩니다. 예를 들어, 시스템 작업 실행, 마이그레이션 또는 동기화 작업 수행, 설정 초기화, 또는 실행 중인 애플리케이션 인스턴스와 상호작용하는 등의 작업에 활용됩니다. 개발자는 플러그인을 위한 사용자 정의 명령어를 정의하고 `app` 객체를 통해 등록할 수 있으며, CLI에서 `nocobase <command>` 형식으로 실행할 수 있습니다.

## 명령어 유형

NocoBase에서 명령어 등록 방식은 두 가지 유형으로 나뉩니다.

| 유형 | 등록 방식 | 플러그인 활성화 필요 여부 | 일반적인 시나리오 |
|---|---|---|---|
| 동적 명령어 | `app.command()` | ✅ 필요 | 플러그인 비즈니스 관련 명령어 |
| 정적 명령어 | `Application.registerStaticCommand()` | ❌ 불필요 | 설치, 초기화, 유지보수 명령어 |

## 동적 명령어

`app.command()`를 사용하여 플러그인 명령어를 정의합니다. 이 명령어는 플러그인이 활성화된 후에만 실행할 수 있습니다. 명령어 파일은 플러그인 디렉터리 내 `src/server/commands/*.ts` 경로에 위치해야 합니다.

예시

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

설명

- `app.command('echo')`: `echo`라는 이름의 명령어를 정의합니다.
- `.option('-v, --version')`: 명령어에 옵션을 추가합니다.
- `.action()`: 명령어 실행 로직을 정의합니다.
- `app.version.get()`: 현재 애플리케이션 버전을 가져옵니다.

명령어 실행

```bash
nocobase echo
nocobase echo -v
```

## 정적 명령어

`Application.registerStaticCommand()`를 사용하여 등록하는 정적 명령어는 플러그인 활성화 없이도 실행할 수 있습니다. 따라서 설치, 초기화, 마이그레이션 또는 디버깅과 같은 작업에 적합합니다. 이 명령어는 플러그인 클래스의 `staticImport()` 메서드에서 등록합니다.

예시

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

명령어 실행

```bash
nocobase echo
nocobase echo --version
```

설명

- `Application.registerStaticCommand()`는 애플리케이션이 인스턴스화되기 전에 명령어를 등록합니다.
- 정적 명령어는 일반적으로 애플리케이션 또는 플러그인 상태와 무관한 전역 작업을 실행하는 데 사용됩니다.

## Command API

명령어 객체는 명령어 실행 컨텍스트를 제어하기 위한 세 가지 선택적 도우미 메서드를 제공합니다.

| 메서드 | 역할 | 예시 |
|---|---|---|
| `ipc()` | 실행 중인 애플리케이션 인스턴스와 통신 (IPC를 통해) | `app.command('reload').ipc().action()` |
| `auth()` | 데이터베이스 설정이 올바른지 확인 | `app.command('seed').auth().action()` |
| `preload()` | 애플리케이션 설정 사전 로드 (`app.load()` 실행) | `app.command('sync').preload().action()` |

설정 설명

- **`ipc()`**  
  기본적으로 명령어는 새로운 애플리케이션 인스턴스에서 실행됩니다.  
  `ipc()`를 활성화하면 명령어는 프로세스 간 통신(IPC)을 통해 현재 실행 중인 애플리케이션 인스턴스와 상호작용합니다. 이는 캐시 새로 고침, 알림 전송과 같은 실시간 작업 명령어에 적합합니다.

- **`auth()`**  
  명령어 실행 전에 데이터베이스 설정이 사용 가능한지 확인합니다.  
  데이터베이스 설정이 잘못되었거나 연결에 실패하면 명령어는 계속 실행되지 않습니다. 데이터베이스 쓰기 또는 읽기와 관련된 작업에 주로 사용됩니다.

- **`preload()`**  
  명령어를 실행하기 전에 애플리케이션 설정을 사전 로드하며, 이는 `app.load()`를 실행하는 것과 같습니다.  
  설정 또는 플러그인 컨텍스트에 의존하는 명령어에 적합합니다.

더 많은 API 메서드는 [AppCommand](/api/server/app-command)를 참조하세요.

## 일반적인 예시

기본 데이터 초기화

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Initialized default admin user.');
  });
```

실행 중인 인스턴스 캐시 새로 고침 (IPC 모드)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

설치 명령어 정적 등록

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```