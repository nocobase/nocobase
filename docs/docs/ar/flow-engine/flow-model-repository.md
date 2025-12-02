:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# استمرارية FlowModel

يوفر محرك FlowEngine نظامًا كاملاً لإدارة الاستمرارية.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## واجهة IFlowModelRepository

`IFlowModelRepository` هي واجهة استمرارية النموذج لمحرك FlowEngine، وتحدد العمليات مثل تحميل النماذج وحفظها وحذفها عن بُعد. من خلال تطبيق هذه الواجهة، يمكن حفظ بيانات النموذج بشكل دائم في قاعدة بيانات خلفية، أو واجهة برمجة تطبيقات (API)، أو وسائط تخزين أخرى، مما يتيح مزامنة البيانات بين الواجهة الأمامية والخلفية.

### الطرق الرئيسية

- **findOne(query: Query): Promise<FlowModel \| null>**  
  يقوم بتحميل بيانات النموذج من مصدر بعيد بناءً على المعرف الفريد `uid`.

- **save(model: FlowModel): Promise<any\>**  
  يحفظ بيانات النموذج في التخزين البعيد.

- **destroy(uid: string): Promise<boolean\>**  
  يحذف النموذج من التخزين البعيد بناءً على `uid`.

### مثال على FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Implementation: Get model by uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Implementation: Save model
    return model;
  }

  async destroy(uid: string) {
    // Implementation: Delete model by uid
    return true;
  }
}
```

### إعداد FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## طرق إدارة النموذج التي يوفرها FlowEngine

### الطرق المحلية

```ts
flowEngine.createModel(options); // إنشاء نسخة نموذج محلية
flowEngine.getModel(uid);        // الحصول على نسخة نموذج محلية
flowEngine.removeModel(uid);     // إزالة نسخة نموذج محلية
```

### الطرق البعيدة (يتم تنفيذها بواسطة ModelRepository)

```ts
await flowEngine.loadModel(uid);     // تحميل النموذج من المصدر البعيد
await flowEngine.saveModel(model);   // حفظ النموذج إلى المصدر البعيد
await flowEngine.destroyModel(uid);  // حذف النموذج من المصدر البعيد
```

## طرق نسخة النموذج

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // حفظ إلى المصدر البعيد
await model.destroy();  // حذف من المصدر البعيد
```