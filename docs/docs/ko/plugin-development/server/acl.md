:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# ACL 권한 제어

ACL(Access Control List)은 리소스 작업 권한을 제어하는 데 사용됩니다. 권한을 역할에 부여할 수도 있고, 역할 제한을 건너뛰고 직접 권한을 제어할 수도 있습니다. ACL 시스템은 권한 스니펫, 미들웨어, 조건 판단 등 다양한 방식을 지원하는 유연한 권한 관리 메커니즘을 제공합니다.

:::tip 참고

ACL 객체는 데이터 소스(`dataSource.acl`)에 속합니다. 주 데이터 소스의 ACL은 `app.acl`을 통해 빠르게 접근할 수 있습니다. 다른 데이터 소스의 ACL 사용법은 [데이터 소스 관리](./data-source-manager.md) 챕터에서 자세히 확인할 수 있습니다.

:::

## 권한 스니펫(Snippet) 등록

권한 스니펫(Snippet)은 자주 사용되는 권한 조합을 재사용 가능한 권한 단위로 등록할 수 있게 해줍니다. 역할이 스니펫에 바인딩되면 해당 권한 그룹을 얻게 되므로, 중복 설정을 줄이고 권한 관리 효율성을 높일 수 있습니다.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // ui.* 접두사는 UI에서 설정 가능한 권한을 나타냅니다.
  actions: ['customRequests:*'], // 해당 리소스 작업에 해당하며, 와일드카드를 지원합니다.
});
```

## 역할 제약을 건너뛰는 권한 (allow)

`acl.allow()`는 특정 작업이 역할 제약을 우회하도록 허용하는 데 사용됩니다. 이는 공개 API, 동적 권한 판단이 필요한 시나리오 또는 요청 컨텍스트를 기반으로 권한을 판단해야 하는 경우에 적합합니다.

```ts
// 공개 접근, 로그인 불필요
acl.allow('app', 'getLang', 'public');

// 로그인한 사용자만 접근 가능
acl.allow('app', 'getInfo', 'loggedIn');

// 사용자 정의 조건에 기반한 판단
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**condition 매개변수 설명:**

- `'public'` : 모든 사용자(로그인하지 않은 사용자 포함)가 접근할 수 있으며, 어떠한 인증도 필요하지 않습니다.
- `'loggedIn'` : 로그인한 사용자만 접근할 수 있으며, 유효한 사용자 신원이 필요합니다.
- `(ctx) => Promise<boolean>` 또는 `(ctx) => boolean` : 요청 컨텍스트를 기반으로 접근 허용 여부를 동적으로 판단하는 사용자 정의 함수입니다. 복잡한 권한 로직을 구현할 수 있습니다.

## 권한 미들웨어(use) 등록

`acl.use()`는 사용자 정의 권한 미들웨어를 등록하는 데 사용되며, 권한 확인 흐름에 사용자 정의 로직을 삽입할 수 있습니다. 일반적으로 `ctx.permission`과 함께 사용하여 사용자 정의 권한 규칙을 구현합니다. 공개 폼에서 사용자 정의 비밀번호 인증이 필요하거나, 요청 매개변수를 기반으로 동적 권한 판단을 해야 하는 등 비정형적인 권한 제어가 필요한 시나리오에 적합합니다.

**일반적인 적용 시나리오:**

- 공개 폼 시나리오: 사용자나 역할이 없지만, 사용자 정의 비밀번호를 통해 권한을 제어해야 하는 경우
- 요청 매개변수, IP 주소 등 조건에 기반한 권한 제어
- 기본 권한 확인 흐름을 건너뛰거나 수정하는 사용자 정의 권한 규칙

**`ctx.permission`을 통한 권한 제어:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // 예시: 공개 폼에서 비밀번호 인증 후 권한 확인 건너뛰기
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // 인증 통과, 권한 확인 건너뛰기
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // 권한 확인 실행 (ACL 흐름 계속 진행)
  await next();
});
```

**`ctx.permission` 속성 설명:**

- `skip: true` : 이후 ACL 권한 확인을 건너뛰고 직접 접근을 허용합니다.
- 미들웨어에서 사용자 정의 로직에 따라 동적으로 설정하여 유연한 권한 제어를 구현할 수 있습니다.

## 특정 작업에 고정 데이터 제약 추가 (addFixedParams)

`addFixedParams`는 특정 리소스 작업에 고정된 데이터 범위(필터) 제약을 추가할 수 있습니다. 이러한 제약은 역할 제한을 우회하여 직접 적용되며, 주로 시스템의 중요한 데이터를 보호하는 데 사용됩니다.

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// 사용자가 역할을 삭제할 권한이 있더라도, root, admin, member와 같은 시스템 역할은 삭제할 수 없습니다.
```

> **팁:** `addFixedParams`는 시스템 내장 역할, 관리자 계정 등 민감한 데이터가 실수로 삭제되거나 수정되는 것을 방지하는 데 사용할 수 있습니다. 이러한 제약은 역할 권한과 함께 적용되어, 권한이 있더라도 보호된 데이터를 조작할 수 없도록 보장합니다.

## 권한 확인 (can)

`acl.can()`은 특정 역할이 지정된 작업을 실행할 권한이 있는지 확인하는 데 사용되며, 권한 결과 객체 또는 `null`을 반환합니다. 주로 비즈니스 로직에서 동적으로 권한을 판단할 때 사용되며, 예를 들어 미들웨어 또는 작업 핸들러에서 역할에 따라 특정 작업의 실행 허용 여부를 결정할 수 있습니다.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // 단일 역할 또는 역할 배열을 전달할 수 있습니다.
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`역할 ${result.role}은(는) ${result.action} 작업을 실행할 수 있습니다.`);
  // result.params는 addFixedParams를 통해 설정된 고정 매개변수를 포함합니다.
  console.log('고정 매개변수:', result.params);
} else {
  console.log('해당 작업을 실행할 권한이 없습니다.');
}
```

> **팁:** 여러 역할을 전달하면 각 역할이 순서대로 확인되며, 권한이 있는 첫 번째 역할의 결과가 반환됩니다.

**타입 정의:**

```ts
interface CanArgs {
  role?: string;      // 단일 역할
  roles?: string[];   // 여러 역할 (순서대로 확인하며, 권한이 있는 첫 번째 역할이 반환됩니다.)
  resource: string;   // 리소스 이름
  action: string;    // 작업 이름
}

interface CanResult {
  role: string;       // 권한이 있는 역할
  resource: string;   // 리소스 이름
  action: string;    // 작업 이름
  params?: any;       // 고정 매개변수 정보 (addFixedParams를 통해 설정된 경우)
}
```

## 설정 가능한 작업 등록 (setAvailableAction)

사용자 정의 작업을 UI에서 권한 설정 가능하도록 하려면(예: 역할 관리 페이지에 표시), `setAvailableAction`을 사용하여 등록해야 합니다. 등록된 작업은 권한 설정 UI에 나타나며, 관리자는 UI에서 다양한 역할에 대한 작업 권한을 설정할 수 있습니다.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // UI 표시 이름, 국제화 지원
  type: 'new-data',               // 작업 유형
  onNewRecord: true,              // 새 레코드 생성 시 적용 여부
});
```

**매개변수 설명:**

- **displayName**: 권한 설정 UI에 표시되는 이름으로, 국제화( `{{t("key")}}` 형식 사용)를 지원합니다.
- **type**: 작업 유형으로, 권한 설정에서 해당 작업의 분류를 결정합니다.
  - `'new-data'` : 새 데이터를 생성하는 작업 (예: 가져오기, 추가 등)
  - `'existing-data'` : 기존 데이터를 수정하는 작업 (예: 업데이트, 삭제 등)
- **onNewRecord**: 새 레코드 생성 시 적용될지 여부이며, `'new-data'` 유형에만 유효합니다.

등록 후, 이 작업은 권한 설정 UI에 나타나며, 관리자는 역할 관리 페이지에서 해당 작업의 권한을 설정할 수 있습니다.