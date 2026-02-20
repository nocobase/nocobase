:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# FlowModel 생성하기

## 루트 노드로 사용하기

### FlowModel 인스턴스 빌드하기

로컬에서 인스턴스를 빌드합니다.

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### FlowModel 저장하기

빌드된 인스턴스를 영구적으로 저장해야 할 경우, `save` 메서드를 사용하여 저장할 수 있습니다.

```ts
await model.save();
```

### 원격 저장소에서 FlowModel 로드하기

이미 저장된 모델은 `loadModel`을 사용하여 로드할 수 있습니다. 이 메서드는 전체 모델 트리(자식 노드 포함)를 로드합니다.

```ts
await engine.loadModel(uid);
```

### FlowModel 로드 또는 생성하기

모델이 존재하면 로드하고, 존재하지 않으면 새로 생성하여 저장합니다.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### FlowModel 렌더링하기

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## 자식 노드로 사용하기

모델 내부에서 여러 하위 컴포넌트나 모듈의 속성 및 동작을 관리해야 할 때 SubModel을 사용합니다. 예를 들어, 중첩된 레이아웃이나 조건부 렌더링과 같은 시나리오에서 유용합니다.

### SubModel 생성하기

`<AddSubModelButton />` 사용을 권장합니다.

이 버튼은 자식 모델의 추가, 바인딩, 저장 등의 문제를 자동으로 처리합니다. 자세한 내용은 [AddSubModelButton 사용 설명](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model)을 참조하세요.

### SubModel 렌더링하기

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## ForkModel로 사용하기

Fork는 일반적으로 동일한 모델 템플릿을 여러 위치에서 렌더링해야 하지만, 각 인스턴스의 상태는 독립적이어야 하는 시나리오(예: 테이블의 각 행)에서 사용됩니다.

### ForkModel 생성하기

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### ForkModel 렌더링하기

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```