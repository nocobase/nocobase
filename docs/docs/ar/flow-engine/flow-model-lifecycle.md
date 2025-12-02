:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# دورة حياة FlowModel

## دوال (Methods) الـ model

استدعاءات داخلية

```ts
class MyModel extends FlowModel {
  onInit() {}
  onMount() {}
  useHooksBeforeRender() {}
  render() {}
  onUnMount() {}
  onDispatchEventStart() {}
  onDispatchEventEnd() {}
  onDispatchEventError() {}
}
```

## model.emitter

للتشغيل الخارجي

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## الخطوات

1.  بناء الـ model
    - onInit
2.  عرض الـ model
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3.  إلغاء تحميل المكون (component)
    - onUnMount
4.  تشغيل التدفق
    - onDispatchEventStart
    - onDispatchEventEnd
5.  إعادة العرض
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount