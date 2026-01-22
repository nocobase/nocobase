:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# Tencent Cloud COS

מנוע אחסון המבוסס על Tencent Cloud COS. לפני השימוש, יש להכין את החשבון וההרשאות הנדרשים.

## פרמטרי תצורה

![דוגמת תצורת מנוע אחסון Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=הערה}
סעיף זה מציג רק את הפרמטרים הספציפיים למנוע האחסון של Tencent Cloud COS. לפרמטרים כלליים, אנא עיין/י ב[פרמטרים כלליים של המנוע](./index.md#general-engine-parameters).
:::

### אזור

הזן/הזיני את האזור לאחסון ה-COS, לדוגמה: `ap-chengdu`.

:::info{title=הערה}
ניתן לצפות בפרטי האזור של דלי האחסון ב[קונסולת Tencent Cloud COS](https://console.cloud.tencent.com/cos). יש להשתמש רק בקידומת האזור (אין צורך בשם הדומיין המלא).
:::

### SecretId

הזן/הזיני את ה-ID של מפתח הגישה המורשה של Tencent Cloud.

### SecretKey

הזן/הזיני את ה-Secret של מפתח הגישה המורשה של Tencent Cloud.

### דלי אחסון

הזן/הזיני את שם דלי האחסון של COS, לדוגמה: `qing-cdn-1234189398`.