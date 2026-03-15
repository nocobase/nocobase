:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/view)을 참조하세요.
:::

# ctx.view

현재 활성화된 뷰 컨트롤러(팝업, 드로어, 팝오버, 임베디드 영역 등)로, 뷰 수준의 정보와 작업에 액세스하는 데 사용됩니다. `FlowViewContext`에서 제공하며, `ctx.viewer` 또는 `ctx.openView`를 통해 열린 뷰 콘텐츠 내에서만 사용할 수 있습니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **팝업/드로어 콘텐츠** | `content` 내에서 `ctx.view.close()`를 호출하여 현재 뷰를 닫거나, `Header`, `Footer`를 사용하여 제목과 하단을 렌더링합니다. |
| **폼 제출 후** | 제출 성공 후 `ctx.view.close(result)`를 호출하여 뷰를 닫고 결과를 반환합니다. |
| **JSBlock / 액션** | `ctx.view.type`에 따라 현재 뷰 유형을 판단하거나, `ctx.view.inputArgs`에서 열기 파라미터를 읽습니다. |
| **관계 선택, 하위 테이블** | `inputArgs`에서 `collectionName`, `filterByTk`, `parentId` 등을 읽어 데이터를 로드합니다. |

> 주의: `ctx.view`는 뷰 컨텍스트가 있는 RunJS 환경(예: `ctx.viewer.dialog()`의 content 내부, 팝업 폼, 관계 선택기 내부)에서만 사용할 수 있습니다. 일반 페이지나 백엔드 컨텍스트에서는 `undefined`이므로, 사용 시 옵셔널 체이닝(`ctx.view?.close?.()`)을 사용하는 것이 좋습니다.

## 타입 정의

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // 워크플로우 설정 뷰에서 사용 가능
};
```

## 주요 속성 및 메서드

| 속성/메서드 | 타입 | 설명 |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | 현재 뷰 유형 |
| `inputArgs` | `Record<string, any>` | 뷰를 열 때 전달된 파라미터 (아래 참조) |
| `Header` | `React.FC \| null` | 헤더 컴포넌트, 제목 및 작업 영역 렌더링에 사용 |
| `Footer` | `React.FC \| null` | 푸터 컴포넌트, 버튼 등을 렌더링하는 데 사용 |
| `close(result?, force?)` | `void` | 현재 뷰를 닫음, 호출자에게 `result`를 전달할 수 있음 |
| `update(newConfig)` | `void` | 뷰 설정 업데이트 (예: 너비, 제목) |
| `navigation` | `ViewNavigation \| undefined` | 페이지 내 뷰 탐색, 탭 전환 등 포함 |

> 현재 `dialog`와 `drawer`만 `Header`와 `Footer`를 지원합니다.

## inputArgs 주요 필드

뷰를 여는 시나리오에 따라 `inputArgs` 필드가 다르며, 주요 필드는 다음과 같습니다.

| 필드 | 설명 |
|------|------|
| `viewUid` | 뷰 UID |
| `collectionName` | 컬렉션 이름 |
| `filterByTk` | 기본 키 필터 (단일 레코드 상세) |
| `parentId` | 부모 ID (관계 시나리오) |
| `sourceId` | 소스 레코드 ID |
| `parentItem` | 부모 항목 데이터 |
| `scene` | 시나리오 (예: `create`, `edit`, `select`) |
| `onChange` | 선택/변경 후의 콜백 |
| `tabUid` | 현재 탭 UID (페이지 내) |

`ctx.getVar('ctx.view.inputArgs.xxx')` 또는 `ctx.view.inputArgs.xxx`를 통해 액세스합니다.

## 예시

### 현재 뷰 닫기

```ts
// 제출 성공 후 팝업 닫기
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// 닫고 결과 반환
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### 콘텐츠 내에서 Header / Footer 사용하기

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="편집" extra={<Button size="small">도움말</Button>} />
      <div>폼 내용...</div>
      <Footer>
        <Button onClick={() => close()}>취소</Button>
        <Button type="primary" onClick={handleSubmit}>확인</Button>
      </Footer>
    </div>
  );
}
```

### 뷰 유형 또는 inputArgs에 따른 분기 처리

```ts
if (ctx.view?.type === 'embed') {
  // 임베디드 뷰에서 헤더 숨기기
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // 사용자 선택기 시나리오
}
```

## ctx.viewer, ctx.openView와의 관계

| 용도 | 권장 사용법 |
|------|----------|
| **새 뷰 열기** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` 또는 `ctx.openView()` |
| **현재 뷰 조작** | `ctx.view.close()`, `ctx.view.update()` |
| **열기 파라미터 가져오기** | `ctx.view.inputArgs` |

`ctx.viewer`는 뷰를 "여는" 역할을 담당하고, `ctx.view`는 "현재" 위치한 뷰 인스턴스를 나타냅니다. `ctx.openView`는 이미 설정된 워크플로우 뷰를 여는 데 사용됩니다.

## 주의사항

- `ctx.view`는 뷰 내부에서만 사용할 수 있으며, 일반 페이지에서는 `undefined`입니다.
- 옵셔널 체이닝을 사용하세요: `ctx.view?.close?.()`를 통해 뷰 컨텍스트가 없을 때의 오류를 방지합니다.
- `close(result)`의 `result`는 `ctx.viewer.open()`이 반환하는 Promise로 전달됩니다.

## 관련 문서

- [ctx.openView()](./open-view.md): 설정된 워크플로우 뷰 열기
- [ctx.modal](./modal.md): 가벼운 팝업 (정보, 확인 등)

> `ctx.viewer`는 `dialog()`, `drawer()`, `popover()`, `embed()` 등의 메서드를 제공하여 뷰를 열며, 해당 메서드로 열린 `content` 내에서 `ctx.view`에 액세스할 수 있습니다.