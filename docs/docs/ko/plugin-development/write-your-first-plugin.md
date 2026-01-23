:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 첫 번째 플러그인 작성하기

이 가이드에서는 페이지에서 사용할 수 있는 블록 플러그인을 처음부터 만드는 과정을 안내하며, NocoBase 플러그인의 기본 구조와 개발 워크플로우를 이해하는 데 도움을 드립니다.

## 사전 준비

시작하기 전에 NocoBase가 성공적으로 설치되었는지 확인해 주세요. 아직 설치하지 않았다면 다음 설치 가이드를 참고하실 수 있습니다:

- [create-nocobase-app을 사용하여 설치](/get-started/installation/create-nocobase-app)
- [Git 소스 코드에서 설치](/get-started/installation/git)

설치가 완료되면 이제 플러그인 개발 여정을 공식적으로 시작할 수 있습니다.

## 1단계: CLI를 통해 플러그인 스켈레톤 생성하기

저장소(repository) 루트 디렉터리에서 다음 명령어를 실행하여 빈 플러그인을 빠르게 생성합니다:

```bash
yarn pm create @my-project/plugin-hello
```

명령어가 성공적으로 실행되면 `packages/plugins/@my-project/plugin-hello` 디렉터리에 기본 파일이 생성됩니다. 기본 구조는 다음과 같습니다:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # 기본으로 내보내는 서버 측 플러그인
     ├─ client                   # 클라이언트 측 코드 위치
     │  ├─ index.tsx             # 기본으로 내보내는 클라이언트 측 플러그인 클래스
     │  ├─ plugin.tsx            # 플러그인 진입점 (@nocobase/client Plugin 상속)
     │  ├─ models                # 선택 사항: 프런트엔드 모델 (예: 워크플로우 노드)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # 서버 측 코드 위치
     │  ├─ index.ts              # 기본으로 내보내는 서버 측 플러그인 클래스
     │  ├─ plugin.ts             # 플러그인 진입점 (@nocobase/server Plugin 상속)
     │  ├─ collections           # 선택 사항: 서버 측 컬렉션
     │  ├─ migrations            # 선택 사항: 데이터 마이그레이션
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # 선택 사항: 다국어
        ├─ en-US.json
        └─ zh-CN.json
```

생성 완료 후, 브라우저에서 플러그인 관리자 페이지(기본 주소: http://localhost:13000/admin/settings/plugin-manager)에 접속하여 플러그인이 목록에 나타나는지 확인할 수 있습니다.

## 2단계: 간단한 클라이언트 블록 구현하기

다음으로, 플러그인에 사용자 정의 블록 모델을 추가하여 환영 메시지를 표시해 보겠습니다.

1. **새 블록 모델 파일 생성하기** `client/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **블록 모델 등록하기**. `client/models/index.ts` 파일을 편집하여 새 모델을 내보내고, 프런트엔드 런타임에서 로드할 수 있도록 합니다:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

코드를 저장한 후, 개발 스크립트를 실행 중이라면 터미널 출력에서 핫 리로드(hot-reload) 로그를 확인할 수 있을 것입니다.

## 3단계: 플러그인 활성화 및 테스트하기

명령줄(CLI) 또는 관리 인터페이스를 통해 플러그인을 활성화할 수 있습니다:

- **명령줄**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **관리 인터페이스**: 플러그인 관리자에 접속하여 `@my-project/plugin-hello`를 찾은 다음, "활성화"를 클릭합니다.

활성화 후, 새로운 "Modern page (v2)" 페이지를 생성합니다. 블록을 추가할 때 "Hello block"이 보일 것이며, 이를 페이지에 삽입하면 방금 작성한 환영 메시지를 확인할 수 있습니다.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## 4단계: 빌드 및 패키징

플러그인을 다른 환경에 배포할 준비가 되면, 먼저 빌드한 다음 패키징해야 합니다:

```bash
yarn build @my-project/plugin-hello --tar
# 또는 두 단계로 실행할 수 있습니다
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> 참고: 플러그인이 소스 저장소에서 생성된 경우, 첫 빌드 시 전체 저장소의 타입 검사가 트리거되어 시간이 다소 오래 걸릴 수 있습니다. 의존성이 설치되어 있고 저장소가 빌드 가능한 상태인지 확인하는 것이 좋습니다.

빌드가 완료되면, 패키지 파일은 기본적으로 `storage/tar/@my-project/plugin-hello.tar.gz`에 위치합니다.

## 5단계: 다른 NocoBase 애플리케이션에 업로드하기

대상 애플리케이션의 `./storage/plugins` 디렉터리에 업로드하고 압축을 해제합니다. 자세한 내용은 [플러그인 설치 및 업그레이드](../get-started/install-upgrade-plugins.mdx)를 참조하세요.