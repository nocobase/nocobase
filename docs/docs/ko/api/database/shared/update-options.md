:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

## 타입

```typescript
interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

## 세부 정보

- `values`: 업데이트할 레코드의 데이터 객체입니다.
- `filter`: 업데이트할 레코드의 필터 조건을 지정합니다. `Filter`의 자세한 사용법은 [`find()`](#find) 메서드를 참고해 주세요.
- `filterByTk`: `TargetKey`를 기준으로 업데이트할 레코드의 필터 조건을 지정합니다.
- `whitelist`: `values` 필드의 화이트리스트입니다. 이 목록에 있는 필드만 작성됩니다.
- `blacklist`: `values` 필드의 블랙리스트입니다. 이 목록에 있는 필드는 작성되지 않습니다.
- `transaction`: 트랜잭션 객체입니다. 트랜잭션 파라미터를 전달하지 않으면, 이 메서드가 자동으로 내부 트랜잭션을 생성합니다.

`filterByTk`와 `filter` 중 최소 하나는 반드시 전달해야 합니다.