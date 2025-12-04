:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# סקירה כללית

תהליך עבודה מורכב בדרך כלל ממספר שלבי פעולה מחוברים. כל צומת מייצג שלב פעולה ומשמש כיחידה לוגית בסיסית בתהליך. בדומה לשפת תכנות, סוגי צמתים שונים מייצגים הוראות שונות, הקובעות את התנהגות הצומת. כאשר תהליך העבודה רץ, המערכת נכנסת לכל צומת ברצף ומבצעת את הוראותיו.

:::info{title=הערה}
הטריגר של תהליך עבודה אינו צומת. הוא מוצג רק כנקודת כניסה בתרשים הזרימה, אך הוא מהווה קונספט שונה מצומת. לפרטים נוספים, עיינו בתוכן של [טריגרים](../triggers/index.md).
:::

מנקודת מבט פונקציונלית, הצמתים המיושמים כיום ניתנים לחלוקה למספר קטגוריות עיקריות (סה"כ 29 סוגי צמתים):

- בינה מלאכותית
  - [מודל שפה גדול](../../ai-employees/workflow/nodes/llm/chat.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-llm)
- בקרת זרימה
  - [תנאי](./condition.md)
  - [תנאים מרובים](./multi-conditions.md)
  - [לולאה](./loop.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-loop)
  - [משתנה](./variable.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-variable)
  - [ענף מקבילי](./parallel.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-parallel)
  - [הפעלת תהליך עבודה](./subflow.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-subflow)
  - [פלט תהליך עבודה](./output.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-subflow)
  - [מיפוי משתני JSON](./json-variable-mapping.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-json-variable-mapping)
  - [השהיה](./delay.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-delay)
  - [סיום תהליך עבודה](./end.md)
- חישוב
  - [חישוב](./calculation.md)
  - [חישוב תאריך](./date-calculation.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-date-calculation)
  - [חישוב JSON](./json-query.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-json-query)
- פעולות אוסף
  - [יצירת נתונים](./create.md)
  - [עדכון נתונים](./update.md)
  - [מחיקת נתונים](./destroy.md)
  - [שאילתת נתונים](./query.md)
  - [שאילתת אגרגציה](./aggregate.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-aggregate)
  - [פעולת SQL](./sql.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-sql)
- טיפול ידני
  - [טיפול ידני](./manual.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-manual)
  - [אישור](./approval.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-approval)
  - [עותק](./cc.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-cc)
- הרחבות אחרות
  - [בקשת HTTP](./request.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-javascript)
  - [שליחת דוא"ל](./mailer.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-mailer)
  - [התראה](../../notification-manager/index.md#工作流通知节点) (מסופק על ידי תוסף @nocobase/plugin-workflow-notification)
  - [תגובה](./response.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-webhook)
  - [הודעת תגובה](./response-message.md) (מסופק על ידי תוסף @nocobase/plugin-workflow-response-message)