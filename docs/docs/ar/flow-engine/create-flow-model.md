:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# إنشاء FlowModel

## كعقدة جذرية

### بناء نسخة من FlowModel

قم ببناء نسخة محليًا

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### حفظ FlowModel

عندما تحتاج النسخة التي تم بناؤها إلى الحفظ الدائم، يمكنك حفظها باستخدام دالة `save`.

```ts
await model.save();
```

### تحميل FlowModel من مستودع بعيد

يمكن تحميل نموذج تم حفظه مسبقًا باستخدام دالة `loadModel`. ستقوم هذه الدالة بتحميل شجرة النموذج بأكملها (بما في ذلك العقد الفرعية):

```ts
await engine.loadModel(uid);
```

### تحميل أو إنشاء FlowModel

إذا كان النموذج موجودًا، فسيتم تحميله؛ وإلا، فسيتم إنشاؤه وحفظه.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### عرض FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## كعقدة فرعية

عندما تحتاج إلى إدارة خصائص وسلوكيات مكونات فرعية أو وحدات متعددة داخل نموذج، ستحتاج إلى استخدام SubModel، وذلك في سيناريوهات مثل التخطيطات المتداخلة (nested layouts) أو العرض الشرطي (conditional rendering) وغيرها.

### إنشاء SubModel

يوصى باستخدام `<AddSubModelButton />`

يمكنها التعامل تلقائيًا مع مسائل مثل إضافة النماذج الفرعية (Child Models) وربطها وتخزينها. لمزيد من التفاصيل، راجع [تعليمات استخدام AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### عرض SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## كـ ForkModel

تُستخدم Fork عادةً في السيناريوهات التي تتطلب عرض نفس قالب النموذج في عدة مواقع (ولكن بحالات مستقلة)، مثل كل صف في جدول.

### إنشاء ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### عرض ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```