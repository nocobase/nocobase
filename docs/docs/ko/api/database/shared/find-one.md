:::tip AI 번역 안내
이 문서는 AI로 자동 번역되었습니다.
:::


## 타입

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

## 파라미터

`find()`와 대부분의 파라미터가 동일합니다. 하지만 `findOne()`은 단일 데이터만 반환하므로 `limit` 파라미터는 필요하지 않으며, 쿼리 시 항상 `1`로 설정됩니다.