:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# BaseInterface

## 개요

BaseInterface는 모든 Interface 타입의 기본 클래스입니다. 사용자는 이 클래스를 상속받아 사용자 정의 Interface 로직을 구현할 수 있습니다.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // 사용자 정의 toValue 로직
  }

  toString(value: any, ctx?: any) {
    // 사용자 정의 toString 로직
  }
}
// Interface 등록
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

외부 문자열을 Interface의 실제 값으로 변환합니다. 변환된 값은 Repository에 직접 전달하여 쓰기 작업에 사용할 수 있습니다.

### toString(value: any, ctx?: any)

Interface의 실제 값을 문자열 타입으로 변환합니다. 문자열 타입은 내보내기 또는 표시 용도로 활용할 수 있습니다.