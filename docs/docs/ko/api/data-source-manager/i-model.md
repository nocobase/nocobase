:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# IModel

`IModel` 인터페이스는 모델 객체의 기본 속성과 메서드를 정의합니다.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

모델 객체를 JSON 형식으로 변환합니다.