:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

## 타입

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

## 파라미터

`find()`와 대부분의 파라미터가 동일합니다. 하지만 `findOne()`은 단일 데이터만 반환하므로 `limit` 파라미터는 필요하지 않으며, 쿼리 시 항상 `1`로 설정됩니다.