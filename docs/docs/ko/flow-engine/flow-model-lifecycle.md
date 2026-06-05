:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# FlowModel 생명 주기

## model 메서드

내부 호출

```ts
class MyModel extends FlowModel {
  onInit() {}
  onMount() {}
  useHooksBeforeRender() {}
  render() {}
  onUnMount() {}
  onDispatchEventStart() {}
  onDispatchEventEnd() {}
  onDispatchEventError() {}
}
```

## model.emitter

외부에서 이벤트를 발생시키는 데 사용됩니다.

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## 프로세스

1. model 생성
    - onInit
2. model 렌더링
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. 컴포넌트 언마운트
    - onUnMount
4. 플로우 트리거
    - onDispatchEventStart
    - onDispatchEventEnd
5. 재렌더링
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount