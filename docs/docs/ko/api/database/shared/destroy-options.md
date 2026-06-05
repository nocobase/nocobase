:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

## 타입

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

## 상세 정보

- `filter`: 삭제할 레코드의 필터 조건을 지정합니다. Filter의 자세한 사용법은 [`find()`](#find) 메서드를 참고해 주세요.
- `filterByTk`: TargetKey를 기준으로 삭제할 레코드의 필터 조건을 지정합니다.
- `truncate`: 컬렉션 데이터를 비울지 여부를 결정합니다. 이 매개변수는 `filter` 또는 `filterByTk` 매개변수가 제공되지 않았을 때만 유효합니다.
- `transaction`: 트랜잭션 객체입니다. 트랜잭션 매개변수가 전달되지 않으면, 이 메서드가 자동으로 내부 트랜잭션을 생성합니다.