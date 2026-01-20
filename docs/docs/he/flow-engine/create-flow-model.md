:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# יצירת FlowModel

## כצומת שורש

### בניית מופע (Instance) של FlowModel

בנו מופע באופן מקומי

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### שמירת FlowModel

כאשר מופע שנבנה דורש שמירה מתמשכת (persistence), ניתן לשמור אותו באמצעות מתודת ה-`save`.

```ts
await model.save();
```

### טעינת FlowModel ממאגר מרוחק

מודל שנשמר ניתן לטעון באמצעות loadModel. מתודה זו תטען את עץ המודל המלא (כולל צומתי הבן):

```ts
await engine.loadModel(uid);
```

### טעינה או יצירה של FlowModel

אם המודל קיים, הוא ייטען; אחרת, הוא ייווצר ויישמר.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### רינדור FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## כצומת בן

כאשר אתם צריכים לנהל את המאפיינים וההתנהגויות של מספר רכיבי משנה או מודולים בתוך מודל, עליכם להשתמש ב-SubModel. לדוגמה, בתרחישים כמו פריסות מקוננות, רינדור מותנה וכדומה.

### יצירת SubModel

מומלץ להשתמש ב-`<AddSubModelButton />`

כפתור זה מטפל באופן אוטומטי בנושאים כמו הוספה, קישור ושמירה של מודלי בן. לפרטים נוספים, ראו [הוראות שימוש ב-AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### רינדור SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## כ-ForkModel

Fork משמש בדרך כלל בתרחישים שבהם יש צורך לרנדר את אותה תבנית מודל במספר מיקומים (אך עם מצבים עצמאיים), לדוגמה, כל שורה בטבלה.

### יצירת ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### רינדור ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```