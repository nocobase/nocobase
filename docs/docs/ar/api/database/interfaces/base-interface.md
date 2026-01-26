:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# BaseInterface

## نظرة عامة

`BaseInterface` هو الفئة الأساسية لجميع أنواع الواجهات (Interface). يمكن للمستخدمين وراثة هذه الفئة لتطبيق منطق الواجهة المخصص بهم.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // منطق toValue المخصص
  }

  toString(value: any, ctx?: any) {
    // منطق toString المخصص
  }
}
// تسجيل الواجهة
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## الواجهة البرمجية (API)

### `toValue(value: string, ctx?: any): Promise<any>`

تحوّل سلسلة نصية خارجية إلى القيمة الفعلية للواجهة. يمكن تمرير هذه القيمة مباشرةً إلى الـ Repository لإجراء عمليات الكتابة.

### `toString(value: any, ctx?: any)`

تحوّل القيمة الفعلية للواجهة إلى نوع سلسلة نصية (string). يمكن استخدام النوع النصي لأغراض التصدير أو العرض.