# IModel

อินเทอร์เฟซ `IModel` กำหนดคุณสมบัติและเมธอดพื้นฐานของอ็อบเจกต์โมเดลครับ

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

แปลงอ็อบเจกต์โมเดลให้อยู่ในรูปแบบ JSON ครับ