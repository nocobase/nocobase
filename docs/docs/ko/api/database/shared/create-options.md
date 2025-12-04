:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

## 타입

```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

## 상세 정보

- `values`: 생성할 레코드의 데이터 객체입니다.
- `whitelist`: 생성할 레코드의 데이터 객체에서 어떤 필드를 **작성할 수 있는지** 지정합니다. 이 매개변수를 전달하지 않으면 기본적으로 모든 필드 작성이 허용됩니다.
- `blacklist`: 생성할 레코드의 데이터 객체에서 어떤 필드를 **작성할 수 없는지** 지정합니다. 이 매개변수를 전달하지 않으면 기본적으로 모든 필드 작성이 허용됩니다.
- `transaction`: 트랜잭션 객체입니다. 트랜잭션 매개변수가 전달되지 않으면 이 메서드는 자동으로 내부 트랜잭션을 생성합니다.