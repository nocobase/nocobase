:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# FlowModel 영속성

FlowEngine은 완전한 영속성 시스템을 제공합니다.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository`는 FlowEngine의 모델 영속성 인터페이스로, 모델의 원격 로드, 저장, 삭제 등의 작업을 정의합니다. 이 인터페이스를 구현하여 모델 데이터를 백엔드 데이터베이스, API 또는 다른 저장 매체에 영속화하고, 프론트엔드와 백엔드 간의 데이터 동기화를 가능하게 합니다.

### 주요 메서드

- **findOne(query: Query): Promise<FlowModel \| null>**  
  고유 식별자 `uid`를 기반으로 원격에서 모델 데이터를 로드합니다.

- **save(model: FlowModel): Promise<any\>**  
  모델 데이터를 원격 저장소에 저장합니다.

- **destroy(uid: string): Promise<boolean\>**  
  `uid`를 기반으로 원격 저장소에서 모델을 삭제합니다.

### FlowModelRepository 예시

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // 구현: uid로 모델 가져오기
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // 구현: 모델 저장
    return model;
  }

  async destroy(uid: string) {
    // 구현: uid로 모델 삭제
    return true;
  }
}
```

### FlowModelRepository 설정하기

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## FlowEngine이 제공하는 모델 관리 메서드

### 로컬 메서드

```ts
flowEngine.createModel(options); // 로컬 모델 인스턴스 생성
flowEngine.getModel(uid);        // 로컬 모델 인스턴스 가져오기
flowEngine.removeModel(uid);     // 로컬 모델 인스턴스 제거
```

### 원격 메서드 (ModelRepository에 의해 구현됨)

```ts
await flowEngine.loadModel(uid);     // 원격에서 모델 로드
await flowEngine.saveModel(model);   // 모델을 원격에 저장
await flowEngine.destroyModel(uid);  // 원격에서 모델 삭제
```

## model 인스턴스 메서드

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // 원격에 저장
await model.destroy();  // 원격에서 삭제
```