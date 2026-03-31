:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# BaseInterface

## 概要

BaseInterfaceは、すべてのInterfaceタイプの基底クラスです。ユーザーはこのクラスを継承して、独自のInterfaceロジックを実装できます。

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // 独自の toValue ロジック
  }

  toString(value: any, ctx?: any) {
    // 独自の toString ロジック
  }
}
// Interfaceを登録
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

外部の文字列をInterfaceの実際の値に変換します。この値は、書き込み操作のためにRepositoryに直接渡すことができます。

### toString(value: any, ctx?: any)

Interfaceの実際の値を文字列型に変換します。この文字列型は、エクスポートや表示の際に使用できます。