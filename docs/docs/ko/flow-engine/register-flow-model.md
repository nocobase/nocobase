:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# FlowModel 등록하기

## 사용자 정의 FlowModel로 시작하기

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

| 기본 클래스 이름         | 설명                                  |
| ----------------------- | ------------------------------------- |
| `BlockModel`            | 모든 블록의 기본 클래스입니다.            |
| `CollectionBlockModel`  | 컬렉션 블록이며, BlockModel을 상속받습니다. |
| `ActionModel`           | 모든 액션의 기본 클래스입니다.            |

## FlowModel 등록하기

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```