:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# FlowModel ライフサイクル

## model メソッド

内部呼び出し

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

外部トリガー用

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## プロセス

1. model を構築する
    - onInit
2. model をレンダリングする
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. コンポーネントをアンマウントする
    - onUnMount
4. フローをトリガーする
    - onDispatchEventStart
    - onDispatchEventEnd
5. 再レンダリング
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount