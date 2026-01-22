:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# BaseInterface

## Genel Bakış

BaseInterface, tüm Interface türlerinin temel sınıfıdır. Kullanıcılar, özel Interface mantığı uygulamak için bu sınıftan miras alabilirler.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Özel toValue mantığı
  }

  toString(value: any, ctx?: any) {
    // Özel toString mantığı
  }
}
// Interface'i kaydedin
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Harici bir dizeyi (string) interface'in gerçek değerine dönüştürür. Bu değer, yazma işlemleri için doğrudan Repository'ye iletilebilir.

### toString(value: any, ctx?: any)

Interface'in gerçek değerini bir dize (string) türüne dönüştürür. Bu dize türü, dışa aktarma veya görüntüleme amaçları için kullanılabilir.