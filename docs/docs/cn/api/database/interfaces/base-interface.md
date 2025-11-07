# BaseInterface

## 概览

BaseInterface 是所有 Interface 类型的基础类，用户可以自行继承此类实现自定义的 Interface 逻辑。

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // 自定义的 toValue 逻辑
  }

  toString(value: any, ctx?: any) {
    // 自定义的 toString 逻辑
  }
}
// 注册 Interface
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## 接口

### toValue(value: string, ctx?: any): Promise<any>

将外部的字符串转换为 interface 的实际值，值可直接传递给 Repository 进行写入操作

### toString(value: any, ctx?: any)

将 interface 的实际值转换为 string 类型，string 类型可用作导出、展示时使用