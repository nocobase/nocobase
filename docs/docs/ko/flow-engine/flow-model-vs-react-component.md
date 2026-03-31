:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# FlowModel 대 React.Component

## 기본 역할 비교

| 특징/기능         | `React.Component`       | `FlowModel`                            |
| ------------- | ----------------------- | -------------------------------------- |
| 렌더링 기능          | 예, `render()` 메서드가 UI를 생성합니다.    | 예, `render()` 메서드가 UI를 생성합니다.                   |
| 상태 관리          | 내장된 `state` 및 `setState` | `props`를 사용하지만, 상태 관리는 모델 트리 구조에 더 의존합니다.               |
| 생명 주기          | 예, `componentDidMount`와 같은 훅이 있습니다. | 예, `onInit`, `onMount`, `onUnmount`와 같은 훅이 있습니다.     |
| 용도            | UI 컴포넌트 구축                | 데이터 기반의 흐름 지향적이고 구조화된 "모델 트리" 구축                   |
| 데이터 구조          | 컴포넌트 트리                     | 모델 트리 (부모-자식 모델, 다중 인스턴스 Fork 지원)                   |
| 자식 컴포넌트           | JSX를 사용하여 컴포넌트 중첩             | `setSubModel`/`addSubModel`을 사용하여 자식 모델 명시적으로 설정 |
| 동적 동작          | 이벤트 바인딩, 상태 업데이트를 통한 UI 구동          | Flow 등록/디스패치, 자동 흐름 처리                      |
| 영속성           | 내장된 메커니즘 없음                   | 영속성 지원 (예: `model.save()`)                |
| Fork 지원 (다중 렌더링) | 아니요 (수동 재사용 필요)                | 예 (`createFork`를 통한 다중 인스턴스화)                   |
| 엔진 제어          | 없음                       | 예, `FlowEngine`에 의해 관리, 등록 및 로드됩니다.              |

## 생명 주기 비교

| 생명 주기 훅 | `React.Component`                 | `FlowModel`                                  |
| ------ | --------------------------------- | -------------------------------------------- |
| 초기화    | `constructor`, `componentDidMount` | `onInit`, `onMount`                           |
| 언마운트     | `componentWillUnmount`            | `onUnmount`                                  |
| 입력 응답   | `componentDidUpdate`              | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| 오류 처리   | `componentDidCatch`               | `onAutoFlowsError`                      |

## 구조 비교

**React:**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel:**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## 컴포넌트 트리 대 모델 트리

*   **React 컴포넌트 트리**: 런타임에 JSX 중첩으로 형성되는 UI 렌더링 트리입니다.
*   **FlowModel 모델 트리**: FlowEngine이 관리하는 논리적 구조 트리로, 영속화가 가능하며 자식 모델을 동적으로 등록하고 제어할 수 있습니다. 페이지 블록, 작업 흐름, 데이터 모델 등을 구축하는 데 적합합니다.

## FlowModel 전용 기능

| 기능                               | 설명                     |
| -------------------------------- | ---------------------- |
| `registerFlow`                 | 흐름 등록             |
| `applyFlow` / `dispatchEvent` | 흐름 실행/트리거             |
| `setSubModel` / `addSubModel`         | 자식 모델의 생성 및 바인딩을 명시적으로 제어          |
| `createFork`                          | 하나의 모델 로직을 여러 번 재사용하여 렌더링하는 것을 지원합니다 (예: 테이블의 각 행). |
| `openFlowSettings`                    | 흐름 단계 설정 |
| `save` / `saveStepParams()`           | 모델을 영속화하고 백엔드와 연동할 수 있습니다.           |

## 요약

| 항목   | React.Component | FlowModel              |
| ---- | --------------- | ---------------------- |
| 적합한 시나리오 | UI 계층 컴포넌트 구성        | 데이터 기반의 흐름 및 블록 관리           |
| 핵심 아이디어 | 선언적 UI          | 모델 기반의 구조화된 흐름             |
| 관리 방식 | React가 생명 주기를 제어    | FlowModel이 모델의 생명 주기 및 구조를 제어 |
| 장점   | 풍부한 생태계와 도구 체인        | 강력한 구조화, 영속 가능한 흐름, 제어 가능한 자식 모델      |

> FlowModel은 React와 상호 보완적으로 사용할 수 있습니다. FlowModel 내에서 React를 사용하여 렌더링하고, FlowEngine이 해당 생명 주기와 구조를 관리하는 방식입니다.