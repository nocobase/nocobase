:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# FlowModel 시작하기

## FlowModel 사용자 정의하기

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloModel.</p>
      </div>
    );
  }
}
```

## 사용 가능한 FlowModel 기본 클래스

| 기본 클래스 이름         | 설명                               |
| ----------------------- | ---------------------------------- |
| `BlockModel`            | 모든 블록의 기본 클래스                  |
| `CollectionBlockModel`  | 컬렉션 블록, BlockModel을 상속합니다. |
| `ActionModel`           | 모든 액션의 기본 클래스                |

## FlowModel 등록하기

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## FlowModel 렌더링하기

```tsx pure
<FlowModelRenderer model={model} />
```