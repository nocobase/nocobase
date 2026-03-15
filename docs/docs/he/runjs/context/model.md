:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/model).
:::

# ctx.model

מופע ה-`FlowModel` שבו נמצא הקשר הביצוע (execution context) הנוכחי של RunJS. הוא משמש כנקודת הכניסה המוגדרת כברירת מחדל עבור תרחישים כמו JSBlock, JSField ו-JSAction. הסוג הספציפי משתנה בהתאם להקשר: הוא עשוי להיות תת-מחלקה כגון `BlockModel`, `ActionModel` או `JSEditableFieldModel`.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **JSBlock** | `ctx.model` הוא מודל הבלוק הנוכחי. ניתן לגשת ל-`resource`, `collection` (אוסף), `setProps` וכו'. |
| **JSField / JSItem / JSColumn** | `ctx.model` הוא מודל השדה. ניתן לגשת ל-`setProps`, `dispatchEvent` וכו'. |
| **אירועי פעולה / ActionModel** | `ctx.model` הוא מודל הפעולה. ניתן לקרוא/לכתוב פרמטרים של שלבים, לשגר אירועים וכו'. |

> טיפ: אם עליכם לגשת ל**בלוק האב המכיל את ה-JS הנוכחי** (למשל, בלוק טופס או טבלה), השתמשו ב-`ctx.blockModel`; כדי לגשת ל**מודלים אחרים**, השתמשו ב-`ctx.getModel(uid)`.

## הגדרת סוג (Type Definition)

```ts
model: FlowModel;
```

`FlowModel` היא מחלקת הבסיס. בזמן ריצה, זהו מופע של תת-מחלקות שונות (כגון `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel` וכו'). המאפיינים והמתודות הזמינים משתנים בהתאם לסוג הספציפי.

## מאפיינים נפוצים

| מאפיין | סוג | הסבר |
|------|------|------|
| `uid` | `string` | מזהה ייחודי של המודל. יכול לשמש עבור `ctx.getModel(uid)` או קישור UID של חלון קופץ (popup). |
| `collection` | `Collection` | האוסף הקשור למודל הנוכחי (קיים כאשר הבלוק/שדה קשורים לנתונים). |
| `resource` | `Resource` | מופע המשאב המשויך, משמש לרענון, קבלת שורות שנבחרו וכו'. |
| `props` | `object` | תצורת ממשק המשתמש (UI) או ההתנהגות של המודל. ניתן לעדכון באמצעות `setProps`. |
| `subModels` | `Record<string, FlowModel>` | אוסף של מודלי בן (למשל, שדות בתוך טופס, עמודות בתוך טבלה). |
| `parent` | `FlowModel` | מודל אב (אם קיים). |

## מתודות נפוצות

| מתודה | הסבר |
|------|------|
| `setProps(partialProps: any): void` | מעדכן את תצורת המודל ומפעיל רינדור מחדש (למשל, `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | משגר אירוע למודל, ומפעיל תהליכי עבודה (workflows) המוגדרים על אותו מודל ומאזינים לשם האירוע. `payload` אופציונלי מועבר ל-handler של תהליך העבודה; `options.debounce` מאפשר השהיית ביצוע (debouncing). |
| `getStepParams?.(flowKey, stepKey)` | קורא פרמטרים של שלבי תהליך תצורה (בשימוש בפאנלי הגדרות, פעולות מותאמות אישית וכו'). |
| `setStepParams?.(flowKey, stepKey, params)` | כותב פרמטרים של שלבי תהליך תצורה. |

## הקשר עם ctx.blockModel ו-ctx.getModel

| צורך | שימוש מומלץ |
|------|----------|
| **המודל של הקשר הביצוע הנוכחי** | `ctx.model` |
| **בלוק האב של ה-JS הנוכחי** | `ctx.blockModel`. משמש לעיתים קרובות לגישה ל-`resource`, `form` או `collection` (אוסף). |
| **קבלת מודל כלשהו לפי UID** | `ctx.getModel(uid)` או `ctx.getModel(uid, true)` (חיפוש לאורך מחסנית התצוגות). |

ב-JSField,‏ `ctx.model` הוא מודל השדה, בעוד ש-`ctx.blockModel` הוא בלוק הטופס או הטבלה המכיל את אותו שדה.

## דוגמאות

### עדכון סטטוס בלוק/פעולה

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### שיגור אירועי מודל

```ts
// שיגור אירוע להפעלת תהליך עבודה המוגדר על מודל זה ומאזין לשם אירוע זה
await ctx.model.dispatchEvent('remove');

// כאשר מסופק payload, הוא מועבר ל-ctx.inputArgs של ה-handler של תהליך העבודה
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### שימוש ב-UID לקישור חלון קופץ או גישה בין מודלים

```ts
const myUid = ctx.model.uid;
// בתצורת חלון קופץ, ניתן להעביר openerUid: myUid לצורך קישור
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## נושאים קשורים

- [ctx.blockModel](./block-model.md): מודל בלוק האב שבו נמצא ה-JS הנוכחי.
- [ctx.getModel()](./get-model.md): קבלת מודלים אחרים לפי UID.