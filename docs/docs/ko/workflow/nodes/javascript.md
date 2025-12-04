---
pkg: '@nocobase/plugin-workflow-javascript'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# JavaScript 스크립트

## 소개

JavaScript 스크립트 노드는 사용자가 워크플로우 내에서 사용자 정의 서버 측 JavaScript 스크립트를 실행할 수 있도록 합니다. 스크립트에서는 워크플로우 상위 노드의 변수를 매개변수로 사용할 수 있으며, 스크립트의 반환 값은 하위 노드에서 사용할 수 있습니다.

스크립트는 NocoBase 애플리케이션의 서버에서 워커 스레드를 열어 실행되며, Node.js의 대부분 기능을 지원합니다. 하지만 네이티브 실행 환경과는 일부 차이가 있으니, 자세한 내용은 [기능 목록](#기능-목록)을 참조하십시오.

## 노드 생성

워크플로우 설정 화면에서 워크플로우 내의 더하기("+"") 버튼을 클릭하여 "JavaScript" 노드를 추가합니다.

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## 노드 설정

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### 매개변수

스크립트의 코드 로직에서 사용할 수 있도록 워크플로우 컨텍스트의 변수 또는 정적 값을 스크립트에 전달합니다. 여기서 `name`은 매개변수 이름이며, 스크립트에 전달되면 변수 이름으로 사용됩니다. `value`는 매개변수 값으로, 변수를 선택하거나 상수를 입력할 수 있습니다.

### 스크립트 내용

스크립트 내용은 함수로 간주할 수 있습니다. Node.js 환경에서 지원되는 모든 JavaScript 코드를 작성할 수 있으며, `return` 문을 사용하여 노드의 실행 결과로 값을 반환할 수 있습니다. 이 값은 이후 노드에서 변수로 사용됩니다.

코드를 작성한 후, 편집기 하단의 테스트 버튼을 통해 테스트 실행 대화 상자를 열 수 있습니다. 이 대화 상자에서 정적 값을 매개변수에 입력하여 시뮬레이션 실행을 할 수 있으며, 실행 후에는 반환 값과 출력(로그) 내용을 확인할 수 있습니다.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### 타임아웃 설정

단위는 밀리초(ms)이며, `0`으로 설정하면 타임아웃이 설정되지 않습니다.

### 오류 발생 시 워크플로우 계속 진행

이 옵션을 선택하면 스크립트 오류 또는 타임아웃 오류가 발생하더라도 이후 노드가 계속 실행됩니다.

:::info{title="참고"}
스크립트에 오류가 발생하면 반환 값이 없으며, 노드의 결과는 오류 메시지로 채워집니다. 만약 이후 노드에서 스크립트 노드의 결과 변수를 사용한다면, 신중하게 처리해야 합니다.
:::

## 기능 목록

### Node.js 버전

메인 애플리케이션에서 실행되는 Node.js 버전과 동일합니다.

### 모듈 지원

스크립트에서는 제한적으로 모듈을 사용할 수 있습니다. CommonJS와 동일하게, 코드에서 `require()` 지시어를 사용하여 모듈을 가져옵니다.

Node.js 네이티브 모듈과 `node_modules`에 설치된 모듈(NocoBase에서 이미 사용 중인 의존성 패키지 포함)을 지원합니다. 코드에서 사용할 모듈은 애플리케이션 환경 변수 `WORKFLOW_SCRIPT_MODULES`에 선언해야 하며, 여러 패키지 이름은 반각 쉼표로 구분합니다. 예를 들어:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="참고"}
환경 변수 `WORKFLOW_SCRIPT_MODULES`에 선언되지 않은 모듈은 Node.js 네이티브 모듈이거나 `node_modules`에 이미 설치되어 있더라도 스크립트에서 **사용할 수 없습니다**. 이 정책은 운영 단계에서 사용자가 사용할 수 있는 모듈 목록을 관리하고, 특정 시나리오에서 스크립트 권한이 과도하게 높아지는 것을 방지하는 데 사용될 수 있습니다.
:::

소스 코드 배포 환경이 아닌 경우, 특정 모듈이 `node_modules`에 설치되어 있지 않다면, 필요한 패키지를 `storage` 디렉터리에 수동으로 설치할 수 있습니다. 예를 들어 `exceljs` 패키지를 사용해야 할 때 다음과 같이 실행할 수 있습니다.

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

그런 다음 해당 패키지의 애플리케이션 CWD(현재 작업 디렉터리)를 기준으로 한 상대 경로(또는 절대 경로)를 환경 변수 `WORKFLOW_SCRIPT_MODULES`에 추가합니다.

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

그러면 스크립트에서 `exceljs` 패키지를 사용할 수 있습니다.

```js
const ExcelJS = require('exceljs');
// ...
```

### 전역 변수

`global`, `process`, `__dirname`, `__filename` 등의 전역 변수는 지원하지 않습니다.

```js
console.log(global); // will throw error: "global is not defined"
```

### 입력 매개변수

노드에 설정된 매개변수는 스크립트 내에서 전역 변수로 사용되며, 직접 사용할 수 있습니다. 스크립트에 전달되는 매개변수는 `boolean`, `number`, `string`, `object`, 배열과 같은 기본 타입만 지원합니다. `Date` 객체는 전달되면 ISO 형식의 문자열로 변환됩니다. 사용자 정의 클래스의 인스턴스 등 다른 복잡한 타입은 직접 전달할 수 없습니다.

### 반환 값

`return` 문을 통해 기본 타입의 데이터(매개변수 규칙과 동일)를 노드의 결과로 반환할 수 있습니다. 코드에서 `return` 문을 호출하지 않으면, 노드 실행 시 반환 값이 없습니다.

```js
return 123;
```

### 출력 (로그)

`console`을 사용하여 로그를 출력하는 것을 지원합니다.

```js
console.log('hello world!');
```

워크플로우 실행 시, 스크립트 노드의 출력도 해당 워크플로우의 로그 파일에 기록됩니다.

### 비동기

`async`를 사용하여 비동기 함수를 정의하고 `await`를 사용하여 비동기 함수를 호출하는 것을 지원합니다. `Promise` 전역 객체 사용도 지원합니다.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### 타이머

`setTimeout`, `setInterval`, `setImmediate` 등의 메서드를 사용하려면, Node.js의 `timers` 패키지를 통해 가져와야 합니다.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```