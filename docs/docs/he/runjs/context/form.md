:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/form).
:::

# ctx.form

מופע ה-Ant Design Form בתוך הבלוק הנוכחי, המשמש לקריאה וכתיבה של שדות טופס, הפעלת אימות (validation) ושליחה. הוא שקול ל-`ctx.blockModel?.form` וניתן לשימוש ישיר בבלוקים הקשורים לטפסים (Form, EditForm, תת-טופס וכו').

## מקרי בוחן

| תרחיש | הסבר |
|------|------|
| **JSField** | קריאה/כתיבה של שדות טופס אחרים למימוש קישוריות (linkage), או ביצוע חישובים ואימותים על סמך ערכי שדות אחרים. |
| **JSItem** | קריאה/כתיבה של שדות באותה שורה או שדות אחרים בתוך פריטי תת-טבלה להשגת קישוריות בתוך הטבלה. |
| **JSColumn** | קריאת ערכי השורה הנוכחית או שדות מקושרים בעמודת טבלה לצורך רינדור. |
| **פעולות טופס / תהליך עבודה** | אימות לפני שליחה, עדכון שדות בקבוצה (batch), איפוס טפסים וכו'. |

> שימו לב: `ctx.form` זמין רק בהקשרי RunJS הקשורים לבלוקים של טופס (Form, EditForm, תת-טופס וכו'). ייתכן שהוא לא יהיה קיים בתרחישים שאינם טופס (כגון JSBlocks עצמאיים או בלוקים של טבלה). מומלץ לבצע בדיקת ערך ריק לפני השימוש: `ctx.form?.getFieldsValue()`.

## הגדרת טיפוס (Type Definition)

```ts
form: FormInstance<any>;
```

`FormInstance` הוא סוג המופע של Ant Design Form. המתודות הנפוצות הן כדלקמן.

## מתודות נפוצות

### קריאת ערכי טופס

```ts
// קריאת ערכים של שדות רשומים כעת (ברירת המחדל היא שדות מרונדרים בלבד)
const values = ctx.form.getFieldsValue();

// קריאת ערכים של כל השדות (כולל שדות רשומים אך לא מרונדרים, למשל מוסתרים או בתוך אזורים מקופלים)
const allValues = ctx.form.getFieldsValue(true);

// קריאת שדה בודד
const email = ctx.form.getFieldValue('email');

// קריאת שדות מקוננים (למשל בתת-טבלה)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### כתיבת ערכי טופס

```ts
// עדכון קבוצתי (נפוץ לשימוש בקישוריות)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// עדכון שדה בודד
ctx.form.setFieldValue('remark', 'הערה עודכנה');
```

### אימות ושליחה

```ts
// הפעלת אימות טופס
await ctx.form.validateFields();

// הפעלת שליחת טופס
ctx.form.submit();
```

### איפוס

```ts
// איפוס כל השדות
ctx.form.resetFields();

// איפוס שדות ספציפיים בלבד
ctx.form.resetFields(['status', 'remark']);
```

## קשר עם הקשרים (Contexts) רלוונטיים

### ctx.getValue / ctx.setValue

| תרחיש | שימוש מומלץ |
|------|----------|
| **קריאה/כתיבה של השדה הנוכחי** | `ctx.getValue()` / `ctx.setValue(v)` |
| **קריאה/כתיבה של שדות אחרים** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

בתוך שדה JS הנוכחי, תנו עדיפות לשימוש ב-`getValue`/`setValue` כדי לקרוא/לכתוב את השדה עצמו; השתמשו ב-`ctx.form` כאשר עליכם לגשת לשדות אחרים.

### ctx.blockModel

| דרישה | שימוש מומלץ |
|------|----------|
| **קריאה/כתיבה של שדות טופס** | `ctx.form` (שקול ל-`ctx.blockModel?.form`, נוח יותר) |
| **גישה לבלוק האב** | `ctx.blockModel` (מכיל את ה-`collection`, `resource` וכו') |

### ctx.getVar('ctx.formValues')

יש לקבל ערכי טופס באמצעות `await ctx.getVar('ctx.formValues')` והם אינם נחשפים ישירות כ-`ctx.formValues`. בהקשר של טופס, עדיף להשתמש ב-`ctx.form.getFieldsValue()` כדי לקרוא את הערכים העדכניים ביותר בזמן אמת.

## הערות

- `getFieldsValue()` מחזיר רק שדות מרונדרים כברירת מחדל. כדי לכלול שדות שאינם מרונדרים (למשל, באזורים מקופלים או מוסתרים על ידי כללים מותנים), העבירו `true`: `getFieldsValue(true)`.
- נתיבים לשדות מקוננים כמו תת-טבלאות הם מערכים, למשל `['orders', 0, 'amount']`. ניתן להשתמש ב-`ctx.namePath` כדי לקבל את הנתיב של השדה הנוכחי ולבנות נתיבים לעמודות אחרות באותה שורה.
- `validateFields()` זורק אובייקט שגיאה המכיל את `errorFields` ומידע נוסף. אם האימות נכשל לפני השליחה, ניתן להשתמש ב-`ctx.exit()` כדי להפסיק את השלבים הבאים.
- בתרחישים אסינכרוניים כמו תהליכי עבודה או כללי קישוריות, ייתכן ש-`ctx.form` עדיין לא יהיה מוכן. מומלץ להשתמש ב-optional chaining או בבדיקות ערך ריק.

## דוגמאות

### קישוריות שדות: הצגת תוכן שונה לפי סוג

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### חישוב השדה הנוכחי על סמך שדות אחרים

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### קריאה/כתיבה של עמודות אחרות באותה שורה בתוך תת-טבלה

```ts
// ctx.namePath הוא הנתיב של השדה הנוכחי בטופס, למשל ['orders', 0, 'amount']
// קריאת 'status' באותה שורה: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### אימות לפני שליחה

```ts
try {
  await ctx.form.validateFields();
  // האימות עבר, המשך בלוגיקת השליחה
} catch (e) {
  ctx.message.error('אנא בדוק את שדות הטופס');
  ctx.exit();
}
```

### שליחה לאחר אישור

```ts
const confirmed = await ctx.modal.confirm({
  title: 'אישור שליחה',
  content: 'לא תוכל לשנות זאת לאחר השליחה. להמשיך?',
  okText: 'אישור',
  cancelText: 'ביטול',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // הפסק אם המשתמש ביטל
}
```

## נושאים קשורים

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): קריאה וכתיבה של ערך השדה הנוכחי.
- [ctx.blockModel](./block-model.md): מודל בלוק אב; `ctx.form` שקול ל-`ctx.blockModel?.form`.
- [ctx.modal](./modal.md): דיאלוגי אישור, משמשים לעיתים קרובות עם `ctx.form.validateFields()` ו-`ctx.form.submit()`.
- [ctx.exit()](./exit.md): הפסקת התהליך במקרה של כישלון אימות או ביטול משתמש.
- `ctx.namePath`: הנתיב (מערך) של השדה הנוכחי בטופס, משמש לבניית שמות עבור `getFieldValue` / `setFieldValue` בשדות מקוננים.